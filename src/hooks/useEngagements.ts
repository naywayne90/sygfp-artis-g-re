import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Engagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  montant_ht: number | null;
  tva: number | null;
  fournisseur: string | null;
  date_engagement: string;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  budget_line_id: string;
  expression_besoin_id: string | null;
  marche_id: string | null;
  note_id: string | null;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  required_documents: string[] | null;
  // Joined data
  budget_line?: {
    id: string;
    code: string;
    label: string;
    dotation_initiale: number;
    direction?: { label: string; sigle: string | null } | null;
    objectif_strategique?: { code: string; libelle: string } | null;
    mission?: { code: string; libelle: string } | null;
    action?: { code: string; libelle: string } | null;
    activite?: { code: string; libelle: string } | null;
    nomenclature_nbe?: { code: string; libelle: string } | null;
    plan_comptable_sysco?: { code: string; libelle: string } | null;
  } | null;
  expression_besoin?: {
    id: string;
    numero: string | null;
    objet: string;
    marche?: {
      id: string;
      numero: string | null;
      prestataire?: { id: string; raison_sociale: string } | null;
    } | null;
  } | null;
  marche?: {
    id: string;
    numero: string | null;
    objet: string;
    montant: number;
    prestataire?: { id: string; raison_sociale: string } | null;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
}

export interface BudgetAvailability {
  dotation_initiale: number;
  engagements_anterieurs: number;
  engagement_actuel: number;
  cumul: number;
  disponible: number;
  is_sufficient: boolean;
}

export const VALIDATION_STEPS = [
  { order: 1, role: "SAF", label: "Service Administratif et Financier" },
  { order: 2, role: "CB", label: "Contrôleur Budgétaire" },
  { order: 3, role: "DAF", label: "Directeur Administratif et Financier" },
  { order: 4, role: "DG", label: "Directeur Général" },
];

export function useEngagements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Fetch all engagements
  const { data: engagements = [], isLoading, error } = useQuery({
    queryKey: ["engagements", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_engagements")
        .select(`
          *,
          budget_line:budget_lines(
            id, code, label, dotation_initiale,
            direction:directions(label, sigle),
            objectif_strategique:objectifs_strategiques(code, libelle),
            mission:missions(code, libelle),
            action:actions(code, libelle),
            activite:activites(code, libelle),
            nomenclature_nbe(code, libelle),
            plan_comptable_sysco(code, libelle)
          ),
          expression_besoin:expressions_besoin(
            id, numero, objet,
            marche:marches(
              id, numero,
              prestataire:prestataires(id, raison_sociale)
            )
          ),
          marche:marches(
            id, numero, objet, montant,
            prestataire:prestataires(id, raison_sociale)
          ),
          creator:profiles!budget_engagements_created_by_fkey(id, full_name)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Engagement[];
    },
    enabled: !!exercice,
  });

  // Fetch validated expressions de besoin for creating engagements
  const { data: expressionsValidees = [] } = useQuery({
    queryKey: ["expressions-validees-pour-engagement", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expressions_besoin")
        .select(`
          id, numero, objet, montant_estime, direction_id, dossier_id,
          direction:directions(id, label),
          marche:marches(
            id, numero, objet, montant, mode_passation,
            prestataire:prestataires(id, raison_sociale, adresse)
          )
        `)
        .eq("statut", "validé")
        .eq("exercice", exercice)
        .order("validated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Calculate budget availability
  const calculateAvailability = async (
    budgetLineId: string,
    currentAmount: number,
    excludeEngagementId?: string
  ): Promise<BudgetAvailability> => {
    // Get budget line dotation
    const { data: line, error: lineError } = await supabase
      .from("budget_lines")
      .select("dotation_initiale")
      .eq("id", budgetLineId)
      .single();

    if (lineError) throw lineError;

    const dotation_initiale = line?.dotation_initiale || 0;

    // Get previous engagements
    let query = supabase
      .from("budget_engagements")
      .select("id, montant")
      .eq("budget_line_id", budgetLineId)
      .eq("exercice", exercice || new Date().getFullYear())
      .neq("statut", "annule");

    if (excludeEngagementId) {
      query = query.neq("id", excludeEngagementId);
    }

    const { data: prevEngagements, error: engError } = await query;
    if (engError) throw engError;

    const engagements_anterieurs = prevEngagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    const cumul = engagements_anterieurs + currentAmount;
    const disponible = dotation_initiale - cumul;

    return {
      dotation_initiale,
      engagements_anterieurs,
      engagement_actuel: currentAmount,
      cumul,
      disponible,
      is_sufficient: disponible >= 0,
    };
  };

  // Generate engagement number using atomic sequence
  const generateNumero = async (): Promise<string> => {
    const year = exercice || new Date().getFullYear();
    
    const { data, error } = await supabase.rpc("get_next_sequence", {
      p_doc_type: "ENG",
      p_exercice: year,
      p_direction_code: null,
      p_scope: "global",
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Échec génération numéro");

    return data[0].full_code;
  };

  // Create engagement
  const createMutation = useMutation({
    mutationFn: async (data: {
      expression_besoin_id: string;
      budget_line_id: string;
      objet: string;
      montant: number;
      montant_ht?: number;
      tva?: number;
      fournisseur: string;
      marche_id?: string;
      dossier_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier la disponibilité budgétaire avant création
      const availability = await calculateAvailability(data.budget_line_id, data.montant);
      if (!availability.is_sufficient) {
        throw new Error(
          `Disponible insuffisant : ${new Intl.NumberFormat("fr-FR").format(availability.disponible)} FCFA disponibles, ${new Intl.NumberFormat("fr-FR").format(data.montant)} FCFA demandés`
        );
      }

      const numero = await generateNumero();

      // Récupérer le dossier_id depuis l'expression de besoin si non fourni
      let dossierId = data.dossier_id;
      if (!dossierId && data.expression_besoin_id) {
        const { data: expr } = await supabase
          .from("expressions_besoin")
          .select("dossier_id")
          .eq("id", data.expression_besoin_id)
          .single();
        dossierId = expr?.dossier_id;
      }

      const { data: engagement, error } = await supabase
        .from("budget_engagements")
        .insert({
          numero,
          objet: data.objet,
          montant: data.montant,
          montant_ht: data.montant_ht || null,
          tva: data.tva || null,
          fournisseur: data.fournisseur,
          date_engagement: new Date().toISOString().split("T")[0],
          budget_line_id: data.budget_line_id,
          expression_besoin_id: data.expression_besoin_id,
          marche_id: data.marche_id || null,
          dossier_id: dossierId || null,
          exercice,
          statut: "brouillon",
          workflow_status: "en_attente",
          current_step: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial validation steps
      for (const step of VALIDATION_STEPS) {
        await supabase.from("engagement_validations").insert({
          engagement_id: engagement.id,
          step_order: step.order,
          role: step.role,
          status: "en_attente",
        });
      }

      // Si lié à un dossier, créer une entrée dans dossier_etapes
      if (dossierId) {
        await supabase.from("dossier_etapes").insert({
          dossier_id: dossierId,
          type_etape: "engagement",
          ref_id: engagement.id,
          montant: data.montant,
          statut: "en_cours",
        } as any);

        // Mettre à jour l'étape courante du dossier et le montant engagé
        await supabase
          .from("dossiers")
          .update({ 
            etape_courante: "engagement",
            montant_engage: data.montant,
          })
          .eq("id", dossierId);
      }

      // Mettre à jour le total engagé de la ligne budgétaire
      const { data: currentLine } = await supabase
        .from("budget_lines")
        .select("total_engage")
        .eq("id", data.budget_line_id)
        .single();

      await supabase
        .from("budget_lines")
        .update({
          total_engage: (currentLine?.total_engage || 0) + data.montant,
        })
        .eq("id", data.budget_line_id);

      await logAction({
        entityType: "engagement",
        entityId: engagement.id,
        action: "create",
        newValues: { numero, objet: data.objet, montant: data.montant },
      });

      return engagement;
    },
    onSuccess: (engagement) => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      queryClient.invalidateQueries({ queryKey: ["expressions-validees-pour-engagement"] });
      toast.success(`Engagement ${engagement.numero} créé`);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit engagement for validation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_engagements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          current_step: 1,
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "submit",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Engagement soumis pour validation");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Validate engagement step
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get current engagement
      const { data: engagement, error: fetchError } = await supabase
        .from("budget_engagements")
        .select("current_step")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const currentStep = engagement?.current_step || 1;
      const isLastStep = currentStep >= VALIDATION_STEPS.length;

      // Update validation record
      await supabase
        .from("engagement_validations")
        .update({
          status: "valide",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments,
        })
        .eq("engagement_id", id)
        .eq("step_order", currentStep);

      // Update engagement
      const { error } = await supabase
        .from("budget_engagements")
        .update({
          current_step: isLastStep ? currentStep : currentStep + 1,
          statut: isLastStep ? "valide" : "soumis",
          workflow_status: isLastStep ? "termine" : "en_validation",
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "validate",
        newValues: { step: currentStep, comments },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Étape validée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Reject engagement
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get current step
      const { data: engagement } = await supabase
        .from("budget_engagements")
        .select("current_step")
        .eq("id", id)
        .single();

      const currentStep = engagement?.current_step || 1;

      // Update validation record
      await supabase
        .from("engagement_validations")
        .update({
          status: "rejete",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments: reason,
        })
        .eq("engagement_id", id)
        .eq("step_order", currentStep);

      const { error } = await supabase
        .from("budget_engagements")
        .update({
          statut: "rejete",
          workflow_status: "rejete",
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "reject",
        newValues: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Engagement rejeté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Defer engagement
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("budget_engagements")
        .update({
          statut: "differe",
          workflow_status: "differe",
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
          differe_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "defer",
        newValues: { motif, dateReprise },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Engagement différé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Resume deferred engagement
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_engagements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          date_differe: null,
          motif_differe: null,
          deadline_correction: null,
          differe_by: null,
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "resume",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Engagement repris");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update engagement (for locked fields with justification)
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      justification,
    }: {
      id: string;
      data: Partial<Engagement>;
      justification?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get old values for audit
      const { data: oldEngagement } = await supabase
        .from("budget_engagements")
        .select("montant, fournisseur, budget_line_id")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("budget_engagements")
        .update(data as any)
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "engagement",
        entityId: id,
        action: "update_locked_field",
        oldValues: oldEngagement,
        newValues: { ...data, justification },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      toast.success("Engagement mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Get validation steps for an engagement
  const getValidationSteps = async (engagementId: string) => {
    const { data, error } = await supabase
      .from("engagement_validations")
      .select(`
        *,
        validator:profiles!engagement_validations_validated_by_fkey(full_name)
      `)
      .eq("engagement_id", engagementId)
      .order("step_order");

    if (error) throw error;
    return data;
  };

  // Filter helpers
  const engagementsAValider = engagements.filter(
    (e) => e.statut === "soumis" && e.workflow_status === "en_validation"
  );
  const engagementsValides = engagements.filter((e) => e.statut === "valide");
  const engagementsRejetes = engagements.filter((e) => e.statut === "rejete");
  const engagementsDifferes = engagements.filter((e) => e.statut === "differe");

  return {
    engagements,
    engagementsAValider,
    engagementsValides,
    engagementsRejetes,
    engagementsDifferes,
    expressionsValidees,
    isLoading,
    error,
    calculateAvailability,
    generateNumero,
    getValidationSteps,
    createEngagement: createMutation.mutateAsync,
    submitEngagement: submitMutation.mutateAsync,
    validateEngagement: validateMutation.mutateAsync,
    rejectEngagement: rejectMutation.mutateAsync,
    deferEngagement: deferMutation.mutateAsync,
    resumeEngagement: resumeMutation.mutateAsync,
    updateEngagement: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
