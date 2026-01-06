import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Liquidation {
  id: string;
  numero: string;
  montant: number;
  montant_ht: number | null;
  tva_taux: number | null;
  tva_montant: number | null;
  airsi_taux: number | null;
  airsi_montant: number | null;
  retenue_source_taux: number | null;
  retenue_source_montant: number | null;
  net_a_payer: number | null;
  date_liquidation: string;
  reference_facture: string | null;
  observation: string | null;
  service_fait: boolean | null;
  service_fait_date: string | null;
  service_fait_certifie_par: string | null;
  regime_fiscal: string | null;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  engagement_id: string;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  validated_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  // Joined data
  engagement?: {
    id: string;
    numero: string;
    objet: string;
    montant: number;
    fournisseur: string | null;
    budget_line?: {
      id: string;
      code: string;
      label: string;
      direction?: { label: string; sigle: string | null } | null;
    } | null;
    marche?: {
      id: string;
      numero: string | null;
      prestataire?: { id: string; raison_sociale: string } | null;
    } | null;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
  attachments?: LiquidationAttachment[];
}

export interface LiquidationAttachment {
  id: string;
  liquidation_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface LiquidationAvailability {
  montant_engage: number;
  liquidations_anterieures: number;
  liquidation_actuelle: number;
  cumul: number;
  restant_a_liquider: number;
  is_valid: boolean;
}

export const VALIDATION_STEPS = [
  { order: 1, role: "SAF", label: "Service Administratif et Financier" },
  { order: 2, role: "CB", label: "Contrôleur Budgétaire" },
  { order: 3, role: "DAF", label: "Directeur Administratif et Financier" },
  { order: 4, role: "DG", label: "Directeur Général" },
];

export const DOCUMENTS_REQUIS = [
  { code: "facture", label: "Facture", obligatoire: true },
  { code: "pv_reception", label: "PV de réception", obligatoire: true },
  { code: "bon_livraison", label: "Bon de livraison", obligatoire: true },
  { code: "attestation_service_fait", label: "Attestation service fait", obligatoire: false },
  { code: "autre", label: "Autre document", obligatoire: false },
];

export function useLiquidations() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Fetch all liquidations
  const { data: liquidations = [], isLoading, error } = useQuery({
    queryKey: ["liquidations", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_liquidations")
        .select(`
          *,
          engagement:budget_engagements(
            id, numero, objet, montant, fournisseur,
            budget_line:budget_lines(
              id, code, label,
              direction:directions(label, sigle)
            ),
            marche:marches(
              id, numero,
              prestataire:prestataires(id, raison_sociale)
            )
          ),
          creator:profiles!budget_liquidations_created_by_fkey(id, full_name)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch attachments for each liquidation
      const liquidationsWithAttachments = await Promise.all(
        (data || []).map(async (liq) => {
          const { data: attachments } = await supabase
            .from("liquidation_attachments")
            .select("*")
            .eq("liquidation_id", liq.id);
          return { ...liq, attachments: attachments || [] };
        })
      );

      return liquidationsWithAttachments as unknown as Liquidation[];
    },
    enabled: !!exercice,
  });

  // Fetch validated engagements for creating liquidations
  const { data: engagementsValides = [] } = useQuery({
    queryKey: ["engagements-valides-pour-liquidation", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_engagements")
        .select(`
          id, numero, objet, montant, fournisseur,
          budget_line:budget_lines(
            id, code, label,
            direction:directions(id, label, sigle)
          ),
          marche:marches(
            id, numero,
            prestataire:prestataires(id, raison_sociale)
          )
        `)
        .eq("statut", "valide")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Calculate liquidation availability
  const calculateAvailability = async (
    engagementId: string,
    currentAmount: number,
    excludeLiquidationId?: string
  ): Promise<LiquidationAvailability> => {
    // Get engagement amount
    const { data: engagement, error: engError } = await supabase
      .from("budget_engagements")
      .select("montant")
      .eq("id", engagementId)
      .single();

    if (engError) throw engError;

    const montant_engage = engagement?.montant || 0;

    // Get previous liquidations for this engagement
    let query = supabase
      .from("budget_liquidations")
      .select("id, montant")
      .eq("engagement_id", engagementId)
      .neq("statut", "annule")
      .neq("statut", "rejete");

    if (excludeLiquidationId) {
      query = query.neq("id", excludeLiquidationId);
    }

    const { data: prevLiquidations, error: liqError } = await query;
    if (liqError) throw liqError;

    const liquidations_anterieures = prevLiquidations?.reduce((sum, l) => sum + (l.montant || 0), 0) || 0;
    const cumul = liquidations_anterieures + currentAmount;
    const restant_a_liquider = montant_engage - cumul;

    return {
      montant_engage,
      liquidations_anterieures,
      liquidation_actuelle: currentAmount,
      cumul,
      restant_a_liquider,
      is_valid: restant_a_liquider >= 0,
    };
  };

  // Create liquidation
  const createMutation = useMutation({
    mutationFn: async (data: {
      engagement_id: string;
      montant: number;
      montant_ht?: number;
      tva_taux?: number;
      tva_montant?: number;
      airsi_taux?: number;
      airsi_montant?: number;
      retenue_source_taux?: number;
      retenue_source_montant?: number;
      net_a_payer?: number;
      reference_facture?: string;
      observation?: string;
      service_fait_date: string;
      regime_fiscal?: string;
      attachments: { document_type: string; file_name: string; file_path: string; file_size?: number; file_type?: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Check for required documents
      const requiredDocs = DOCUMENTS_REQUIS.filter(d => d.obligatoire).map(d => d.code);
      const providedDocs = data.attachments.map(a => a.document_type);
      const missingDocs = requiredDocs.filter(d => !providedDocs.includes(d));

      if (missingDocs.length > 0) {
        const missingLabels = DOCUMENTS_REQUIS
          .filter(d => missingDocs.includes(d.code))
          .map(d => d.label)
          .join(", ");
        throw new Error(`Documents obligatoires manquants: ${missingLabels}`);
      }

      const { data: liquidation, error } = await supabase
        .from("budget_liquidations")
        .insert({
          numero: "", // Will be auto-generated by trigger
          engagement_id: data.engagement_id,
          montant: data.montant,
          montant_ht: data.montant_ht || null,
          tva_taux: data.tva_taux || null,
          tva_montant: data.tva_montant || null,
          airsi_taux: data.airsi_taux || null,
          airsi_montant: data.airsi_montant || null,
          retenue_source_taux: data.retenue_source_taux || null,
          retenue_source_montant: data.retenue_source_montant || null,
          net_a_payer: data.net_a_payer || data.montant,
          reference_facture: data.reference_facture || null,
          observation: data.observation || null,
          date_liquidation: data.service_fait_date,
          service_fait: true,
          service_fait_date: data.service_fait_date,
          service_fait_certifie_par: user.id,
          regime_fiscal: data.regime_fiscal || null,
          exercice,
          statut: "brouillon",
          workflow_status: "en_attente",
          current_step: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert attachments
      if (data.attachments.length > 0) {
        for (const att of data.attachments) {
          const { error: attError } = await supabase
            .from("liquidation_attachments")
            .insert({
              liquidation_id: liquidation.id,
              document_type: att.document_type,
              file_name: att.file_name,
              file_path: att.file_path,
              file_size: att.file_size || null,
              file_type: att.file_type || null,
              uploaded_by: user.id,
            });

          if (attError) throw attError;
        }
      }

      // Create initial validation steps
      for (const step of VALIDATION_STEPS) {
        await supabase.from("liquidation_validations").insert({
          liquidation_id: liquidation.id,
          step_order: step.order,
          role: step.role,
          status: "en_attente",
        });
      }

      await logAction({
        entityType: "liquidation",
        entityId: liquidation.id,
        action: "create",
        newValues: { numero: liquidation.numero, montant: data.montant },
      });

      return liquidation;
    },
    onSuccess: (liquidation) => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      queryClient.invalidateQueries({ queryKey: ["engagements-valides-pour-liquidation"] });
      toast.success(`Liquidation ${liquidation.numero} créée`);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit liquidation for validation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check attachments
      const { data: attachments } = await supabase
        .from("liquidation_attachments")
        .select("document_type")
        .eq("liquidation_id", id);

      const requiredDocs = DOCUMENTS_REQUIS.filter(d => d.obligatoire).map(d => d.code);
      const providedDocs = (attachments || []).map(a => a.document_type);
      const missingDocs = requiredDocs.filter(d => !providedDocs.includes(d));

      if (missingDocs.length > 0) {
        const missingLabels = DOCUMENTS_REQUIS
          .filter(d => missingDocs.includes(d.code))
          .map(d => d.label)
          .join(", ");
        throw new Error(`Documents obligatoires manquants: ${missingLabels}`);
      }

      const { error } = await supabase
        .from("budget_liquidations")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          current_step: 1,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "liquidation",
        entityId: id,
        action: "submit",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Liquidation soumise pour validation");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Validate liquidation step
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: liquidation, error: fetchError } = await supabase
        .from("budget_liquidations")
        .select("current_step")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const currentStep = liquidation?.current_step || 1;
      const isLastStep = currentStep >= VALIDATION_STEPS.length;

      await supabase
        .from("liquidation_validations")
        .update({
          status: "valide",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments,
        })
        .eq("liquidation_id", id)
        .eq("step_order", currentStep);

      const { error } = await supabase
        .from("budget_liquidations")
        .update({
          current_step: isLastStep ? currentStep : currentStep + 1,
          statut: isLastStep ? "valide" : "soumis",
          workflow_status: isLastStep ? "termine" : "en_validation",
          validated_at: isLastStep ? new Date().toISOString() : null,
          validated_by: isLastStep ? user.id : null,
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "liquidation",
        entityId: id,
        action: "validate",
        newValues: { step: currentStep, comments },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Étape validée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Reject liquidation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: liquidation } = await supabase
        .from("budget_liquidations")
        .select("current_step")
        .eq("id", id)
        .single();

      const currentStep = liquidation?.current_step || 1;

      await supabase
        .from("liquidation_validations")
        .update({
          status: "rejete",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments: reason,
        })
        .eq("liquidation_id", id)
        .eq("step_order", currentStep);

      const { error } = await supabase
        .from("budget_liquidations")
        .update({
          statut: "rejete",
          workflow_status: "rejete",
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "liquidation",
        entityId: id,
        action: "reject",
        newValues: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Liquidation rejetée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Defer liquidation
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
        .from("budget_liquidations")
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
        entityType: "liquidation",
        entityId: id,
        action: "defer",
        newValues: { motif, dateReprise },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Liquidation différée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Resume deferred liquidation
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_liquidations")
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
        entityType: "liquidation",
        entityId: id,
        action: "resume",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Liquidation reprise");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    liquidations,
    isLoading,
    error,
    engagementsValides,
    calculateAvailability,
    createLiquidation: createMutation.mutate,
    submitLiquidation: submitMutation.mutate,
    validateLiquidation: validateMutation.mutate,
    rejectLiquidation: rejectMutation.mutate,
    deferLiquidation: deferMutation.mutate,
    resumeLiquidation: resumeMutation.mutate,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeferring: deferMutation.isPending,
  };
}
