import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface ImputationData {
  noteId: string;
  montant: number;
  // Rattachement programmatique
  os_id: string | null;
  mission_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  sous_activite_id: string | null;
  direction_id: string | null;
  // Nomenclatures
  nbe_id: string | null;
  sysco_id: string | null;
  // Financement
  source_financement: string;
  // Justification si dépassement
  justification_depassement?: string;
  forcer_imputation?: boolean;
}

export interface BudgetAvailability {
  dotation_initiale: number;
  engagements_anterieurs: number;
  engagement_actuel: number;
  cumul: number;
  disponible: number;
  is_sufficient: boolean;
}

export function useImputation() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch notes validées à imputer
  const { data: notesAImputer = [], isLoading: loadingNotes } = useQuery({
    queryKey: ["notes-a-imputer", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_dg")
        .select(`
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name)
        `)
        .eq("statut", "valide")
        .is("imputed_at", null)
        .eq("exercice", exercice || new Date().getFullYear())
        .order("validated_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Fetch notes imputées
  const { data: notesImputees = [], isLoading: loadingImputees } = useQuery({
    queryKey: ["notes-imputees", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_dg")
        .select(`
          *,
          direction:directions(id, label, sigle),
          budget_line:budget_lines(id, code, label, dotation_initiale),
          imputed_by_profile:profiles!notes_dg_imputed_by_fkey(id, first_name, last_name)
        `)
        .eq("statut", "impute")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("imputed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Référentiels
  const { data: objectifsStrategiques = [] } = useQuery({
    queryKey: ["objectifs-strategiques-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: directions = [] } = useQuery({
    queryKey: ["directions-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label, sigle")
        .eq("est_active", true)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  // Fetch actions filtrées par mission et OS
  const fetchActions = async (missionId?: string, osId?: string) => {
    let query = supabase
      .from("actions")
      .select("id, code, libelle, mission_id, os_id")
      .eq("est_active", true)
      .order("code");

    if (missionId) query = query.eq("mission_id", missionId);
    if (osId) query = query.eq("os_id", osId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch activités filtrées par action
  const fetchActivites = async (actionId?: string) => {
    let query = supabase
      .from("activites")
      .select("id, code, libelle, action_id")
      .eq("est_active", true)
      .order("code");

    if (actionId) query = query.eq("action_id", actionId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch sous-activités filtrées par activité
  const fetchSousActivites = async (activiteId?: string) => {
    let query = supabase
      .from("sous_activites")
      .select("id, code, libelle, activite_id")
      .eq("est_active", true)
      .order("code");

    if (activiteId) query = query.eq("activite_id", activiteId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch NBE
  const { data: nomenclaturesNBE = [] } = useQuery({
    queryKey: ["nomenclature-nbe-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nomenclature_nbe")
        .select("id, code, libelle, niveau")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  // Fetch SYSCO
  const { data: planComptableSYSCO = [] } = useQuery({
    queryKey: ["plan-comptable-sysco-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_comptable_sysco")
        .select("id, code, libelle, type")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data as { id: string; code: string; libelle: string; type: string | null }[];
    },
  });

  // Calculer le disponible budgétaire
  const calculateAvailability = async (params: {
    direction_id?: string | null;
    os_id?: string | null;
    mission_id?: string | null;
    action_id?: string | null;
    activite_id?: string | null;
    sous_activite_id?: string | null;
    nbe_id?: string | null;
    sysco_id?: string | null;
    montant_actuel: number;
  }): Promise<BudgetAvailability> => {
    // Trouver la ligne budgétaire correspondante
    let query = supabase
      .from("budget_lines")
      .select("id, dotation_initiale")
      .eq("exercice", exercice || new Date().getFullYear())
      .eq("is_active", true);

    // Appliquer les filtres de rattachement
    if (params.direction_id) query = query.eq("direction_id", params.direction_id);
    if (params.os_id) query = query.eq("os_id", params.os_id);
    if (params.mission_id) query = query.eq("mission_id", params.mission_id);
    if (params.action_id) query = query.eq("action_id", params.action_id);
    if (params.activite_id) query = query.eq("activite_id", params.activite_id);
    if (params.sous_activite_id) query = query.eq("sous_activite_id", params.sous_activite_id);
    if (params.nbe_id) query = query.eq("nbe_id", params.nbe_id);
    if (params.sysco_id) query = query.eq("sysco_id", params.sysco_id);

    const { data: lines, error } = await query;
    if (error) throw error;

    if (!lines || lines.length === 0) {
      return {
        dotation_initiale: 0,
        engagements_anterieurs: 0,
        engagement_actuel: params.montant_actuel,
        cumul: params.montant_actuel,
        disponible: -params.montant_actuel,
        is_sufficient: false,
      };
    }

    // Sommer les dotations de toutes les lignes correspondantes
    const dotation_initiale = lines.reduce((sum, l) => sum + (l.dotation_initiale || 0), 0);

    // Récupérer les engagements antérieurs
    const lineIds = lines.map(l => l.id);
    const { data: engagements, error: engError } = await supabase
      .from("budget_engagements")
      .select("montant")
      .in("budget_line_id", lineIds)
      .eq("exercice", exercice || new Date().getFullYear())
      .neq("statut", "annule");

    if (engError) throw engError;

    const engagements_anterieurs = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    const engagement_actuel = params.montant_actuel;
    const cumul = engagements_anterieurs + engagement_actuel;
    const disponible = dotation_initiale - cumul;

    return {
      dotation_initiale,
      engagements_anterieurs,
      engagement_actuel,
      cumul,
      disponible,
      is_sufficient: disponible >= 0,
    };
  };

  // Créer ou trouver la ligne budgétaire appropriée
  const findOrCreateBudgetLine = async (data: ImputationData): Promise<string> => {
    // Chercher une ligne existante
    let query = supabase
      .from("budget_lines")
      .select("id")
      .eq("exercice", exercice || new Date().getFullYear())
      .eq("is_active", true);

    if (data.direction_id) query = query.eq("direction_id", data.direction_id);
    if (data.os_id) query = query.eq("os_id", data.os_id);
    if (data.mission_id) query = query.eq("mission_id", data.mission_id);
    if (data.action_id) query = query.eq("action_id", data.action_id);
    if (data.activite_id) query = query.eq("activite_id", data.activite_id);
    if (data.sous_activite_id) query = query.eq("sous_activite_id", data.sous_activite_id);
    if (data.nbe_id) query = query.eq("nbe_id", data.nbe_id);
    if (data.sysco_id) query = query.eq("sysco_id", data.sysco_id);

    const { data: existingLines } = await query.limit(1);

    if (existingLines && existingLines.length > 0) {
      return existingLines[0].id;
    }

    // Créer une nouvelle ligne si nécessaire
    const { data: newLine, error } = await supabase
      .from("budget_lines")
      .insert({
        code: `AUTO-${Date.now()}`,
        label: "Ligne créée automatiquement",
        level: "ligne",
        exercice: exercice || new Date().getFullYear(),
        dotation_initiale: 0,
        direction_id: data.direction_id,
        os_id: data.os_id,
        mission_id: data.mission_id,
        action_id: data.action_id,
        activite_id: data.activite_id,
        sous_activite_id: data.sous_activite_id,
        nbe_id: data.nbe_id,
        sysco_id: data.sysco_id,
        source_financement: data.source_financement,
        statut: "valide",
      })
      .select()
      .single();

    if (error) throw error;
    return newLine.id;
  };

  // Mutation pour imputer une note
  const imputeMutation = useMutation({
    mutationFn: async (data: ImputationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier la disponibilité budgétaire
      const availability = await calculateAvailability({
        direction_id: data.direction_id,
        os_id: data.os_id,
        mission_id: data.mission_id,
        action_id: data.action_id,
        activite_id: data.activite_id,
        sous_activite_id: data.sous_activite_id,
        nbe_id: data.nbe_id,
        sysco_id: data.sysco_id,
        montant_actuel: data.montant,
      });

      if (!availability.is_sufficient && !data.forcer_imputation) {
        throw new Error(
          `Disponible insuffisant (${availability.disponible.toLocaleString("fr-FR")} FCFA). ` +
          `Justification requise pour forcer l'imputation.`
        );
      }

      // Trouver ou créer la ligne budgétaire
      const budgetLineId = await findOrCreateBudgetLine(data);

      // Récupérer la note pour créer le dossier
      const { data: note, error: noteError } = await supabase
        .from("notes_dg")
        .select("*, direction:directions(id, label, sigle)")
        .eq("id", data.noteId)
        .single();

      if (noteError) throw noteError;

      // Créer le dossier
      const dossierInsert = {
        objet: note.objet,
        direction_id: data.direction_id || note.direction_id,
        montant_estime: data.montant,
        exercice: exercice || new Date().getFullYear(),
        created_by: user.id,
        etape_courante: "imputation",
        statut_global: "en_cours",
      };
      
      const { data: dossier, error: dossierError } = await supabase
        .from("dossiers")
        .insert(dossierInsert as any)
        .select()
        .single();

      if (dossierError) throw dossierError;

      // Créer l'étape d'imputation dans le dossier
      await supabase.from("dossier_etapes").insert({
        dossier_id: dossier.id,
        type_etape: "imputation",
        entity_id: data.noteId,
        statut: "valide",
        montant: data.montant,
        commentaire: data.justification_depassement || null,
        created_by: user.id,
      } as any);

      // Mettre à jour la note avec l'imputation
      const { data: updatedNote, error: updateError } = await supabase
        .from("notes_dg")
        .update({
          statut: "impute",
          budget_line_id: budgetLineId,
          imputed_by: user.id,
          imputed_at: new Date().toISOString(),
        })
        .eq("id", data.noteId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Logger l'action
      await logAction({
        entityType: "imputation",
        entityId: data.noteId,
        action: "create",
        newValues: {
          note_id: data.noteId,
          budget_line_id: budgetLineId,
          dossier_id: dossier.id,
          montant: data.montant,
          imputation_code: buildImputationCode(data),
          forcer: data.forcer_imputation || false,
        },
      });

      return { note: updatedNote, dossier, budgetLineId, availability };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notes-a-imputer"] });
      queryClient.invalidateQueries({ queryKey: ["notes-imputees"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["dossiers"] });
      toast({
        title: "Imputation réussie",
        description: `Dossier ${result.dossier.numero} créé. Disponible: ${result.availability.disponible.toLocaleString("fr-FR")} FCFA`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'imputation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Construire le code d'imputation
  const buildImputationCode = (data: ImputationData): string => {
    const parts: string[] = [];
    
    // On récupère les codes des éléments sélectionnés
    if (data.os_id) {
      const os = objectifsStrategiques.find(o => o.id === data.os_id);
      if (os) parts.push(os.code);
    }
    if (data.mission_id) {
      const mission = missions.find(m => m.id === data.mission_id);
      if (mission) parts.push(mission.code);
    }
    if (data.nbe_id) {
      const nbe = nomenclaturesNBE.find(n => n.id === data.nbe_id);
      if (nbe) parts.push(nbe.code);
    }
    if (data.sysco_id && planComptableSYSCO.length > 0) {
      const sysco = planComptableSYSCO.find((s: any) => s.id === data.sysco_id);
      if (sysco) parts.push(sysco.code);
    }

    return parts.join("-") || "N/A";
  };

  return {
    notesAImputer,
    notesImputees,
    loadingNotes,
    loadingImputees,
    // Référentiels
    objectifsStrategiques,
    missions,
    directions,
    nomenclaturesNBE,
    planComptableSYSCO,
    // Fonctions de récupération dynamique
    fetchActions,
    fetchActivites,
    fetchSousActivites,
    // Calculs
    calculateAvailability,
    buildImputationCode,
    // Actions
    imputeNote: imputeMutation.mutateAsync,
    isImputing: imputeMutation.isPending,
  };
}
