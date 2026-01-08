import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Prestataire {
  id: string;
  code: string;
  raison_sociale: string;
  sigle?: string | null;
  ninea?: string | null;
  rccm?: string | null;
  centre_impots?: string | null;
  adresse?: string | null;
  ville?: string | null;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  banque?: string | null;
  code_banque?: string | null;
  code_guichet?: string | null;
  numero_compte?: string | null;
  cle_rib?: string | null;
  iban?: string | null;
  mode_paiement?: string | null;
  modalites_paiement?: string | null;
  statut?: string | null;
}

export interface Marche {
  id: string;
  numero: string | null;
  objet: string;
  montant: number;
  mode_passation: string;
  type_marche?: string | null;
  type_procedure?: string | null;
  nombre_lots?: number | null;
  numero_lot?: number | null;
  intitule_lot?: string | null;
  duree_execution?: number | null;
  observations?: string | null;
  statut: string | null;
  validation_status?: string | null;
  current_validation_step?: number | null;
  date_lancement?: string | null;
  date_attribution?: string | null;
  date_signature?: string | null;
  prestataire_id?: string | null;
  note_id?: string | null;
  dossier_id?: string | null;
  exercice?: number | null;
  created_by?: string | null;
  created_at: string;
  // Relations
  prestataire?: Prestataire | null;
  note?: { id: string; numero: string | null; objet: string } | null;
  differe_motif?: string | null;
  differe_at?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
}

export interface MarcheFormData {
  // Objet
  objet: string;
  montant: number;
  // Passation
  mode_passation: string;
  type_marche?: string;
  type_procedure?: string;
  nombre_lots?: number;
  numero_lot?: number;
  intitule_lot?: string;
  duree_execution?: number;
  date_attribution?: string;
  observations?: string;
  // Références
  note_id?: string;
  dossier_id?: string;
  prestataire_id?: string;
  // Justification si gré à gré
  mode_force?: boolean;
  justification_derogation?: string;
}

// Workflow de validation
export const VALIDATION_STEPS = [
  { order: 1, role: "ASSISTANT_SDPM", label: "Assistant SDPM", description: "Saisie du marché" },
  { order: 2, role: "SDPM", label: "SDPM", description: "Validation SDPM" },
  { order: 3, role: "SDCT", label: "SDCT", description: "Vérification conformité fournisseur/procédure" },
  { order: 4, role: "CB", label: "Contrôleur Budgétaire", description: "Validation budgétaire" },
];

export const TYPES_MARCHE = [
  { value: "fourniture", label: "Fournitures" },
  { value: "services", label: "Services" },
  { value: "travaux", label: "Travaux" },
  { value: "prestations_intellectuelles", label: "Prestations intellectuelles" },
];

export const TYPES_PROCEDURE = [
  { value: "appel_offres_ouvert", label: "Appel d'offres ouvert" },
  { value: "appel_offres_restreint", label: "Appel d'offres restreint" },
  { value: "consultation", label: "Consultation" },
  { value: "gre_a_gre", label: "Gré à gré" },
  { value: "demande_cotation", label: "Demande de cotation" },
];

export const DOCUMENTS_REQUIS = [
  { type: "proforma", label: "Proforma / Devis", required: true },
  { type: "fiche_contrat", label: "Fiche de contrat", required: true },
  { type: "bon_commande", label: "Bon de commande", required: true },
  { type: "pv_reception", label: "PV de réception", required: false },
  { type: "autres", label: "Autres documents", required: false },
];

export function useMarches() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch marchés par statut
  const fetchMarches = async (filters?: { statut?: string; validation_status?: string }): Promise<Marche[]> => {
    const currentYear = exercice || new Date().getFullYear();
    
    // @ts-ignore - Supabase type instantiation issue workaround
    const { data, error } = await supabase
      .from("marches")
      .select("*")
      .eq("exercice", currentYear)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    let filtered = (data || []) as any[];
    
    if (filters?.statut) {
      filtered = filtered.filter((m: any) => m.statut === filters.statut);
    }
    if (filters?.validation_status) {
      filtered = filtered.filter((m: any) => m.validation_status === filters.validation_status);
    }
    
    return filtered as Marche[];
  };

  // Marchés à valider
  const { data: marchesAValider = [], isLoading: loadingAValider } = useQuery({
    queryKey: ["marches-a-valider", exercice],
    queryFn: () => fetchMarches({ validation_status: "en_attente" }),
    enabled: !!exercice,
  });

  // Marchés validés
  const { data: marchesValides = [], isLoading: loadingValides } = useQuery({
    queryKey: ["marches-valides", exercice],
    queryFn: () => fetchMarches({ validation_status: "valide" }),
    enabled: !!exercice,
  });

  // Marchés rejetés
  const { data: marchesRejetes = [], isLoading: loadingRejetes } = useQuery({
    queryKey: ["marches-rejetes", exercice],
    queryFn: () => fetchMarches({ validation_status: "rejete" }),
    enabled: !!exercice,
  });

  // Marchés différés
  const { data: marchesDifferes = [], isLoading: loadingDifferes } = useQuery({
    queryKey: ["marches-differes", exercice],
    queryFn: () => fetchMarches({ validation_status: "differe" }),
    enabled: !!exercice,
  });

  // Tous les marchés
  const { data: allMarches = [], isLoading: loadingAll, refetch: refetchMarches } = useQuery({
    queryKey: ["marches-all", exercice],
    queryFn: () => fetchMarches(),
    enabled: !!exercice,
  });

  // Fetch prestataires
  const { data: prestataires = [] } = useQuery({
    queryKey: ["prestataires-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("statut", "actif")
        .order("raison_sociale");
      if (error) throw error;
      return (data || []) as unknown as Prestataire[];
    },
  });

  // Fetch notes imputées pour lier
  const { data: notesImputees = [] } = useQuery({
    queryKey: ["notes-imputees-for-marche", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_dg")
        .select("id, numero, objet, montant_estime, direction:directions(sigle)")
        .eq("statut", "impute")
        .eq("exercice", exercice || new Date().getFullYear());
      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Créer un marché
  const createMarcheMutation = useMutation({
    mutationFn: async (data: MarcheFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Non authentifié");

      // Generate atomic sequence number
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_sequence", {
        p_doc_type: "MARCHE",
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: "global",
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error("Échec génération numéro");

      const numero = seqData[0].full_code;

      const { data: marche, error } = await supabase
        .from("marches")
        .insert({
          numero,
          objet: data.objet,
          montant: data.montant,
          mode_passation: data.mode_passation,
          type_marche: data.type_marche || "fourniture",
          type_procedure: data.type_procedure || "consultation",
          nombre_lots: data.nombre_lots || 1,
          numero_lot: data.numero_lot || 1,
          intitule_lot: data.intitule_lot,
          duree_execution: data.duree_execution,
          date_attribution: data.date_attribution,
          observations: data.observations,
          note_id: data.note_id,
          dossier_id: data.dossier_id,
          prestataire_id: data.prestataire_id,
          mode_force: data.mode_force || false,
          justification_derogation: data.justification_derogation,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.user.id,
          statut: "en_preparation",
          validation_status: "en_attente",
          current_validation_step: 1,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Créer les étapes de validation
      for (const step of VALIDATION_STEPS) {
        await supabase.from("marche_validations").insert({
          marche_id: marche.id,
          step_order: step.order,
          role: step.role,
          status: step.order === 1 ? "en_cours" : "en_attente",
        } as any);
      }

      await logAction({
        entityType: "marche",
        entityId: marche.id,
        action: "create",
        newValues: { objet: data.objet, montant: data.montant },
      });

      return marche;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast({ title: "Marché créé", description: "Le marché a été créé avec succès." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Valider une étape
  const validateStepMutation = useMutation({
    mutationFn: async ({ marcheId, stepOrder, comments }: { marcheId: string; stepOrder: number; comments?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Non authentifié");

      // Mettre à jour l'étape courante
      const { error: stepError } = await supabase
        .from("marche_validations")
        .update({
          status: "valide",
          validated_at: new Date().toISOString(),
          validated_by: user.user.id,
          comments,
        } as any)
        .eq("marche_id", marcheId)
        .eq("step_order", stepOrder);

      if (stepError) throw stepError;

      // Vérifier si c'est la dernière étape
      const nextStep = stepOrder + 1;
      const isLastStep = nextStep > VALIDATION_STEPS.length;

      if (isLastStep) {
        // Marché complètement validé
        await supabase
          .from("marches")
          .update({
            validation_status: "valide",
            validated_at: new Date().toISOString(),
            validated_by: user.user.id,
            statut: "attribue",
          } as any)
          .eq("id", marcheId);
      } else {
        // Passer à l'étape suivante
        await supabase
          .from("marches")
          .update({ current_validation_step: nextStep } as any)
          .eq("id", marcheId);

        await supabase
          .from("marche_validations")
          .update({ status: "en_cours" } as any)
          .eq("marche_id", marcheId)
          .eq("step_order", nextStep);
      }

      await logAction({
        entityType: "marche_validation",
        entityId: marcheId,
        action: "validate",
        newValues: { step: stepOrder, comments },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast({ title: "Étape validée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Rejeter un marché
  const rejectMutation = useMutation({
    mutationFn: async ({ marcheId, reason }: { marcheId: string; reason: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Non authentifié");

      if (!reason.trim()) throw new Error("Le motif de rejet est obligatoire");

      const { error } = await supabase
        .from("marches")
        .update({
          validation_status: "rejete",
          rejected_at: new Date().toISOString(),
          rejected_by: user.user.id,
          rejection_reason: reason,
        } as any)
        .eq("id", marcheId);

      if (error) throw error;

      await logAction({
        entityType: "marche",
        entityId: marcheId,
        action: "reject",
        newValues: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast({ title: "Marché rejeté" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Différer un marché
  const deferMutation = useMutation({
    mutationFn: async ({ marcheId, motif, dateReprise }: { marcheId: string; motif: string; dateReprise?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Non authentifié");

      if (!motif.trim()) throw new Error("Le motif est obligatoire");

      const { error } = await supabase
        .from("marches")
        .update({
          validation_status: "differe",
          differe_at: new Date().toISOString(),
          differe_by: user.user.id,
          differe_motif: motif,
          differe_date_reprise: dateReprise || null,
        } as any)
        .eq("id", marcheId);

      if (error) throw error;

      await logAction({
        entityType: "marche",
        entityId: marcheId,
        action: "update",
        newValues: { motif, dateReprise, action_type: "defer" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast({ title: "Marché différé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Reprendre un marché différé
  const resumeMutation = useMutation({
    mutationFn: async (marcheId: string) => {
      const { error } = await supabase
        .from("marches")
        .update({
          validation_status: "en_attente",
          differe_at: null,
          differe_by: null,
          differe_motif: null,
          differe_date_reprise: null,
        } as any)
        .eq("id", marcheId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast({ title: "Marché repris" });
    },
  });

  // Récupérer les validations d'un marché
  const getMarcheValidations = async (marcheId: string) => {
    const { data, error } = await supabase
      .from("marche_validations")
      .select(`
        *,
        validator:profiles!marche_validations_validated_by_fkey(id, first_name, last_name)
      `)
      .eq("marche_id", marcheId)
      .order("step_order");

    if (error) throw error;
    return data;
  };

  return {
    // Données
    allMarches,
    marchesAValider,
    marchesValides,
    marchesRejetes,
    marchesDifferes,
    prestataires,
    notesImputees,
    // Loading states
    loadingAll,
    loadingAValider,
    loadingValides,
    loadingRejetes,
    loadingDifferes,
    // Actions
    createMarche: createMarcheMutation.mutateAsync,
    validateStep: validateStepMutation.mutateAsync,
    rejectMarche: rejectMutation.mutateAsync,
    deferMarche: deferMutation.mutateAsync,
    resumeMarche: resumeMutation.mutateAsync,
    getMarcheValidations,
    refetchMarches,
    // Mutation states
    isCreating: createMarcheMutation.isPending,
    isValidating: validateStepMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeferring: deferMutation.isPending,
  };
}
