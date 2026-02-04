// @ts-nocheck - Tables/columns not in generated types
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";

// Étapes de validation workflow
export const VALIDATION_STEPS = [
  { order: 1, role: "SAF", label: "Service Administratif et Financier" },
  { order: 2, role: "CB", label: "Contrôleur Budgétaire" },
  { order: 3, role: "DAF", label: "Directeur Administratif et Financier" },
  { order: 4, role: "DG", label: "Directeur Général" },
];

// Étapes de signature
export const SIGNATURE_STEPS = [
  { order: 1, role: "CB", label: "Contrôleur Budgétaire" },
  { order: 2, role: "DAF", label: "Directeur Administratif et Financier" },
  { order: 3, role: "DG", label: "Directeur Général (Ordonnateur)" },
  { order: 4, role: "AC", label: "Agent Comptable" },
];

export const MODES_PAIEMENT = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
];

export interface OrdonnancementFormData {
  liquidation_id: string;
  beneficiaire: string;
  banque?: string;
  rib?: string;
  mode_paiement: string;
  montant: number;
  date_prevue_paiement?: string;
  observation?: string;
  objet: string;
}

export interface OrdonnancementAvailability {
  montant_liquide: number;
  ordonnancements_anterieurs: number;
  ordonnancement_actuel: number;
  cumul: number;
  restant_a_ordonnancer: number;
  is_valid: boolean;
}

export interface SignatureData {
  signataire_id: string;
  signataire_role: string;
  signature_hash?: string;
  qr_code_data?: string;
  signed_at: string;
}

// Generate hash for document signature verification
const generateSignatureHash = (data: {
  ordonnancementId: string;
  numero: string;
  montant: number;
  beneficiaire: string;
  signataire: string;
  signedAt: string;
}): string => {
  // Simple hash based on critical data - in production use crypto library
  const payload = `${data.ordonnancementId}|${data.numero}|${data.montant}|${data.beneficiaire}|${data.signataire}|${data.signedAt}`;
  // Base64 encode for now - replace with proper cryptographic hash in production
  return btoa(payload).slice(0, 32);
};

// Generate QR code data for verification
const generateQRCodeData = (data: {
  numero: string;
  montant: number;
  beneficiaire: string;
  hash: string;
  signedAt: string;
}): string => {
  return JSON.stringify({
    type: "ORDONNANCEMENT_SYGFP",
    ref: data.numero,
    montant: data.montant,
    beneficiaire: data.beneficiaire,
    hash: data.hash,
    date: data.signedAt,
    v: "1.0",
  });
};

export function useOrdonnancements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Récupérer les ordonnancements
  const {
    data: ordonnancements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ordonnancements", exercice],
    queryFn: async () => {
      let query = supabase
        .from("ordonnancements")
        .select(`
          *,
          liquidation:budget_liquidations(
            id,
            numero,
            montant,
            engagement:budget_engagements(
              id,
              numero,
              objet,
              montant,
              fournisseur,
              budget_line:budget_lines(
                id,
                code,
                label,
                dotation_initiale
              )
            )
          ),
          created_by_profile:profiles!ordonnancements_created_by_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
  });

  // Récupérer les liquidations validées disponibles pour ordonnancement
  const { data: liquidationsValidees = [] } = useQuery({
    queryKey: ["liquidations-validees-pour-ordonnancement", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_liquidations")
        .select(`
          id,
          numero,
          montant,
          date_liquidation,
          engagement:budget_engagements(
            id,
            numero,
            objet,
            montant,
            fournisseur,
            budget_line:budget_lines(
              id,
              code,
              label
            )
          )
        `)
        .eq("statut", "valide")
        .eq("exercice", exercice)
        .order("date_liquidation", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
  });

  // Calculer le restant à ordonnancer pour une liquidation
  const calculateOrdonnancementAvailability = async (liquidationId: string, currentOrdonnancementId?: string) => {
    // Récupérer la liquidation
    const { data: liquidation, error: liqError } = await supabase
      .from("budget_liquidations")
      .select("montant")
      .eq("id", liquidationId)
      .single();

    if (liqError) throw liqError;

    // Récupérer les ordonnancements existants pour cette liquidation
    let query = supabase
      .from("ordonnancements")
      .select("id, montant, statut")
      .eq("liquidation_id", liquidationId)
      .not("statut", "eq", "rejete");

    if (currentOrdonnancementId) {
      query = query.not("id", "eq", currentOrdonnancementId);
    }

    const { data: existingOrdonnancements, error: ordError } = await query;
    if (ordError) throw ordError;

    const totalOrdonnance = (existingOrdonnancements || []).reduce(
      (sum, ord) => sum + (ord.montant || 0),
      0
    );

    return {
      montantLiquide: liquidation?.montant || 0,
      ordonnancementsAnterieurs: totalOrdonnance,
      restantAOrdonnancer: (liquidation?.montant || 0) - totalOrdonnance,
    };
  };

  // Créer un ordonnancement
  const createOrdonnancement = useMutation({
    mutationFn: async (data: OrdonnancementFormData) => {
      // Vérifier la disponibilité
      const availability = await calculateOrdonnancementAvailability(data.liquidation_id);
      if (data.montant > availability.restantAOrdonnancer) {
        throw new Error(
          `Montant trop élevé. Restant à ordonnancer: ${availability.restantAOrdonnancer.toLocaleString("fr-FR")} FCFA`
        );
      }

      // Generate atomic sequence number
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_sequence", {
        p_doc_type: "ORD",
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: "global",
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error("Échec génération numéro");

      const numero = seqData[0].full_code;

      const { data: ordonnancement, error } = await supabase
        .from("ordonnancements")
        .insert({
          numero,
          liquidation_id: data.liquidation_id,
          beneficiaire: data.beneficiaire,
          banque: data.banque || null,
          rib: data.rib || null,
          mode_paiement: data.mode_paiement,
          montant: data.montant,
          objet: data.objet,
          date_prevue_paiement: data.date_prevue_paiement || null,
          observation: data.observation || null,
          statut: "brouillon",
          workflow_status: "brouillon",
          exercice: exercice,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: ordonnancement.id,
        action: "CREATE",
        newValues: {
          numero,
          montant: data.montant,
          beneficiaire: data.beneficiaire,
          mode_paiement: data.mode_paiement,
          liquidation_id: data.liquidation_id,
        },
      });

      return ordonnancement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  // Soumettre un ordonnancement
  const submitOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      // Créer les étapes de validation
      const validationSteps = VALIDATION_STEPS.map((step) => ({
        ordonnancement_id: id,
        step_order: step.order,
        role: step.role,
        status: step.order === 1 ? "pending" : "waiting",
      }));

      const { error: validationError } = await supabase
        .from("ordonnancement_validations")
        .insert(validationSteps);

      if (validationError) throw validationError;

      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          current_step: 1,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: id,
        action: "SUBMIT",
        oldValues: { statut: "brouillon" },
        newValues: { statut: "soumis", workflow_status: "en_validation" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement soumis pour validation");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });

  // Valider une étape
  const validateStep = useMutation({
    mutationFn: async ({
      ordonnancementId,
      stepOrder,
      comments,
    }: {
      ordonnancementId: string;
      stepOrder: number;
      comments?: string;
    }) => {
      const currentStep = VALIDATION_STEPS.find(s => s.order === stepOrder);

      // Mettre à jour l'étape de validation
      const { error: validationError } = await supabase
        .from("ordonnancement_validations")
        .update({
          status: "validated",
          validated_at: new Date().toISOString(),
          comments,
        })
        .eq("ordonnancement_id", ordonnancementId)
        .eq("step_order", stepOrder);

      if (validationError) throw validationError;

      const nextStep = stepOrder + 1;
      const isLastStep = nextStep > VALIDATION_STEPS.length;

      if (isLastStep) {
        // Toutes les étapes validées
        const { error } = await supabase
          .from("ordonnancements")
          .update({
            statut: "valide",
            workflow_status: "valide",
            validated_at: new Date().toISOString(),
          })
          .eq("id", ordonnancementId);

        if (error) throw error;
      } else {
        // Passer à l'étape suivante
        const { error: nextError } = await supabase
          .from("ordonnancement_validations")
          .update({ status: "pending" })
          .eq("ordonnancement_id", ordonnancementId)
          .eq("step_order", nextStep);

        if (nextError) throw nextError;

        const { error } = await supabase
          .from("ordonnancements")
          .update({ current_step: nextStep })
          .eq("id", ordonnancementId);

        if (error) throw error;
      }

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: ordonnancementId,
        action: "VALIDATE",
        newValues: {
          step: stepOrder,
          step_role: currentStep?.role,
          step_label: currentStep?.label,
          comments,
          is_final_validation: isLastStep,
          new_status: isLastStep ? "valide" : "en_validation",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Étape validée avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la validation");
    },
  });

  // Rejeter un ordonnancement
  const rejectOrdonnancement = useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from("ordonnancements")
        .select("statut, workflow_status, numero")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "rejete",
          workflow_status: "rejete",
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: id,
        action: "REJECT",
        oldValues: { statut: oldData?.statut, workflow_status: oldData?.workflow_status },
        newValues: {
          statut: "rejete",
          rejection_reason: reason,
          numero: oldData?.numero,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement rejeté");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du rejet");
    },
  });

  // Différer un ordonnancement
  const deferOrdonnancement = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from("ordonnancements")
        .select("statut, workflow_status, numero")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "differe",
          workflow_status: "differe",
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
        })
        .eq("id", id);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: id,
        action: "DEFER",
        oldValues: { statut: oldData?.statut },
        newValues: {
          statut: "differe",
          motif_differe: motif,
          deadline_correction: dateReprise,
          numero: oldData?.numero,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement différé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du report");
    },
  });

  // Reprendre un ordonnancement différé
  const resumeOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          motif_differe: null,
          date_differe: null,
          deadline_correction: null,
        })
        .eq("id", id);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: id,
        action: "RESUME",
        oldValues: { statut: "differe" },
        newValues: { statut: "soumis", workflow_status: "en_validation" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement repris");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la reprise");
    },
  });

  // Soumettre à la signature (après validation complète)
  const submitToSignature = useMutation({
    mutationFn: async (id: string) => {
      // Create signature steps
      const signatureSteps = SIGNATURE_STEPS.map((step) => ({
        ordonnancement_id: id,
        signataire_role: step.role,
        signataire_label: step.label,
        signature_order: step.order,
        status: "pending",
      }));

      const { error: sigError } = await (supabase
        .from("ordonnancement_signatures" as any)
        .insert(signatureSteps) as any);

      if (sigError) throw sigError;

      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "en_signature",
          workflow_status: "en_signature",
          signature_status: "in_progress",
        })
        .eq("id", id);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: id,
        action: "SUBMIT_TO_SIGNATURE",
        oldValues: { statut: "valide" },
        newValues: { statut: "en_signature", signature_status: "in_progress" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement soumis à la signature");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });

  // Supprimer un ordonnancement (brouillon uniquement)
  const deleteOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordonnancements")
        .delete()
        .eq("id", id)
        .eq("statut", "brouillon");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement supprimé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  // Récupérer les validations d'un ordonnancement
  const getValidations = async (ordonnancementId: string) => {
    const { data, error } = await supabase
      .from("ordonnancement_validations")
      .select(`
        *,
        validated_by_profile:profiles!ordonnancement_validations_validated_by_fkey(
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq("ordonnancement_id", ordonnancementId)
      .order("step_order", { ascending: true });

    if (error) throw error;
    return data;
  };

  // Signer un ordonnancement (avec génération hash et QR)
  const signOrdonnancement = useMutation({
    mutationFn: async ({
      ordonnancementId,
      signatureOrder,
    }: {
      ordonnancementId: string;
      signatureOrder: number;
    }) => {
      // Get ordonnancement data for hash generation
      const { data: ordonnancement, error: ordError } = await supabase
        .from("ordonnancements")
        .select("numero, montant, beneficiaire")
        .eq("id", ordonnancementId)
        .single();

      if (ordError) throw ordError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const signedAt = new Date().toISOString();

      // Generate signature hash
      const signatureHash = generateSignatureHash({
        ordonnancementId,
        numero: ordonnancement.numero,
        montant: ordonnancement.montant,
        beneficiaire: ordonnancement.beneficiaire,
        signataire: profile?.full_name || user.email || "",
        signedAt,
      });

      // Generate QR code data
      const qrCodeData = generateQRCodeData({
        numero: ordonnancement.numero,
        montant: ordonnancement.montant,
        beneficiaire: ordonnancement.beneficiaire,
        hash: signatureHash,
        signedAt,
      });

      // Update signature record
      const { error: sigError } = await (supabase
        .from("ordonnancement_signatures" as any)
        .update({
          status: "signed",
          signed_at: signedAt,
          signed_by: user.id,
          signature_hash: signatureHash,
          qr_code_data: qrCodeData,
        })
        .eq("ordonnancement_id", ordonnancementId)
        .eq("signature_order", signatureOrder) as any);

      if (sigError) throw sigError;

      // Check if all signatures are complete
      const currentSignatureStep = SIGNATURE_STEPS.find(s => s.order === signatureOrder);
      const isLastSignature = signatureOrder >= SIGNATURE_STEPS.length;

      if (isLastSignature) {
        // All signatures complete - mark as ORDONNANCÉ
        const { error: updateError } = await supabase
          .from("ordonnancements")
          .update({
            statut: "ordonnance",
            workflow_status: "ordonnance",
            signature_status: "complete",
            signature_hash: signatureHash,
            qr_code_data: qrCodeData,
            date_ordonnancement: signedAt,
          })
          .eq("id", ordonnancementId);

        if (updateError) throw updateError;

        // Lock previous steps (engagement, liquidation)
        // This is done by updating the related records to prevent modification
        const { data: ordData } = await supabase
          .from("ordonnancements")
          .select("liquidation_id")
          .eq("id", ordonnancementId)
          .single();

        if (ordData?.liquidation_id) {
          // Mark liquidation as locked
          await supabase
            .from("budget_liquidations")
            .update({ is_locked: true })
            .eq("id", ordData.liquidation_id);

          // Get and lock engagement
          const { data: liqData } = await supabase
            .from("budget_liquidations")
            .select("engagement_id")
            .eq("id", ordData.liquidation_id)
            .single();

          if (liqData?.engagement_id) {
            await supabase
              .from("budget_engagements")
              .update({ is_locked: true })
              .eq("id", liqData.engagement_id);
          }
        }
      }

      // Audit log
      await logAction({
        entityType: "ordonnancement",
        entityId: ordonnancementId,
        action: "SIGN",
        newValues: {
          signature_order: signatureOrder,
          signature_role: currentSignatureStep?.role,
          signature_label: currentSignatureStep?.label,
          signature_hash: signatureHash,
          is_final_signature: isLastSignature,
          new_status: isLastSignature ? "ordonnance" : "en_signature",
        },
      });

      return { signatureHash, qrCodeData };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancement-signatures", variables.ordonnancementId] });
      toast.success("Signature apposée avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la signature");
    },
  });

  // Get signatures for an ordonnancement
  const getSignatures = async (ordonnancementId: string) => {
    const { data, error } = await (supabase
      .from("ordonnancement_signatures" as any)
      .select(`
        *,
        signed_by_profile:profiles!ordonnancement_signatures_signed_by_fkey(
          id,
          full_name
        )
      `)
      .eq("ordonnancement_id", ordonnancementId)
      .order("signature_order", { ascending: true }) as any);

    if (error) throw error;
    return data;
  };

  // Calculate availability with proper interface
  const calculateAvailability = async (
    liquidationId: string,
    currentAmount: number,
    excludeOrdonnancementId?: string
  ): Promise<OrdonnancementAvailability> => {
    const result = await calculateOrdonnancementAvailability(liquidationId, excludeOrdonnancementId);

    const cumul = result.ordonnancementsAnterieurs + currentAmount;
    const restant = result.montantLiquide - cumul;

    return {
      montant_liquide: result.montantLiquide,
      ordonnancements_anterieurs: result.ordonnancementsAnterieurs,
      ordonnancement_actuel: currentAmount,
      cumul,
      restant_a_ordonnancer: restant,
      is_valid: restant >= 0,
    };
  };

  return {
    ordonnancements,
    isLoading,
    error,
    liquidationsValidees,
    createOrdonnancement,
    submitOrdonnancement,
    validateStep,
    rejectOrdonnancement,
    deferOrdonnancement,
    resumeOrdonnancement,
    submitToSignature,
    deleteOrdonnancement,
    calculateOrdonnancementAvailability,
    calculateAvailability,
    getValidations,
    signOrdonnancement,
    getSignatures,
  };
}
