/**
 * useSpendingCase - Hook pour gérer un dossier de dépense complet
 *
 * Gère la chaîne: SEF → AEF → Imputation → Passation → Engagement → Liquidation → Ordonnancement → Règlement
 * Avec règles de transition et validation des étapes.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  SpendingCase,
  SpendingStage,
  StepStatus,
  SpendingTimeline,
  SpendingStepData,
  SPENDING_STAGES,
  STAGE_CONFIG,
  STAGE_ORDER,
  canTransitionTo,
  getNextStage,
  getStageStatus,
  isStageComplete,
} from "@/types/spending-case";
import { isFeatureEnabled } from "@/lib/feature-flags/flags";

interface UseSpendingCaseOptions {
  dossierRef?: string;
  dossierId?: string;
  enabled?: boolean;
}

interface TransitionOptions {
  stage: SpendingStage;
  entityId?: string;
  reference?: string;
  montant?: number;
  skipValidation?: boolean; // Admin only
}

export function useSpendingCase({ dossierRef, dossierId, enabled = true }: UseSpendingCaseOptions) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch spending case data
  const {
    data: spendingCase,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["spending-case", dossierRef || dossierId],
    queryFn: async (): Promise<SpendingCase | null> => {
      // Build query
      let query = supabase.from("dossiers").select(`
        *,
        direction:directions(id, code, label),
        demandeur:profiles!dossiers_demandeur_id_fkey(id, full_name),
        beneficiaire:prestataires(id, raison_sociale)
      `);

      if (dossierRef) {
        query = query.eq("numero", dossierRef);
      } else if (dossierId) {
        query = query.eq("id", dossierId);
      } else {
        return null;
      }

      const { data: dossier, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      if (!dossier) return null;

      // Fetch related etapes
      const { data: etapes } = await supabase
        .from("dossier_etapes")
        .select("*")
        .eq("dossier_id", dossier.id)
        .order("created_at", { ascending: true });

      // Build timeline from etapes
      const timeline: SpendingTimeline = {
        steps: buildStepsFromEtapes(etapes || [], dossier.etape_courante),
        lastUpdate: dossier.updated_at,
        history: [], // Could be loaded from audit_logs if needed
      };

      // Map to SpendingCase
      const spendingCase: SpendingCase = {
        id: dossier.id,
        dossierRef: dossier.numero,
        numero: dossier.numero,
        exercice: dossier.exercice,
        directionId: dossier.direction_id,
        objet: dossier.objet,
        demandeurId: dossier.demandeur_id,
        montantEstime: dossier.montant_estime || 0,
        montantEngage: dossier.montant_engage,
        montantLiquide: dossier.montant_liquide,
        montantOrdonnance: dossier.montant_ordonnance,
        montantPaye: dossier.montant_paye,
        currentStage: (dossier.etape_courante as SpendingStage) || "note_sef",
        status: mapDossierStatus(dossier.statut_global),
        timeline,
        createdAt: dossier.created_at,
        updatedAt: dossier.updated_at,
        noteSefId: findEntityId(etapes, "note_sef"),
        noteAefId: findEntityId(etapes, "note_aef"),
        imputationId: findEntityId(etapes, "imputation"),
        passationMarcheId: findEntityId(etapes, "passation_marche"),
        engagementId: findEntityId(etapes, "engagement"),
        liquidationId: findEntityId(etapes, "liquidation"),
        ordonnancementId: findEntityId(etapes, "ordonnancement"),
        reglementId: findEntityId(etapes, "reglement"),
        beneficiaireId: dossier.beneficiaire_id,
        beneficiaireNom: dossier.beneficiaire?.raison_sociale,
      };

      return spendingCase;
    },
    enabled: enabled && !!(dossierRef || dossierId),
  });

  // Transition to next stage
  const transitionMutation = useMutation({
    mutationFn: async ({
      stage,
      entityId,
      reference,
      montant,
      skipValidation = false,
    }: TransitionOptions) => {
      if (!spendingCase) throw new Error("Dossier non chargé");

      // Check if workflow_v2 is enabled
      if (!isFeatureEnabled("WORKFLOW_V2") && !skipValidation) {
        // Legacy mode - just update without strict validation
        return await updateStageDirectly(spendingCase.id, stage, entityId, reference, montant);
      }

      // Get user info for role check
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("profil_fonctionnel")
        .eq("id", userData.user?.id)
        .single();

      const userRole = profile?.profil_fonctionnel || "OPERATEUR";
      const isAdmin = userRole === "ADMIN";

      // Validate transition
      if (!skipValidation && !isAdmin) {
        const { allowed, reason } = canTransitionTo(spendingCase, stage, userRole, isAdmin);
        if (!allowed) {
          throw new Error(reason || "Transition non autorisée");
        }
      }

      // Update dossier_etapes
      await updateStageDirectly(spendingCase.id, stage, entityId, reference, montant);

      // Audit log
      await logAction({
        entityType: "dossier",
        entityId: spendingCase.id,
        action: "TRANSITION",
        newValues: {
          from_stage: spendingCase.currentStage,
          to_stage: stage,
          entity_id: entityId,
          reference,
          montant,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-case", dossierRef || dossierId] });
      queryClient.invalidateQueries({ queryKey: ["dossier-etapes"] });
      toast.success("Étape mise à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la transition");
    },
  });

  // Update step status (validate, reject, defer)
  const updateStepStatusMutation = useMutation({
    mutationFn: async ({
      stage,
      status,
      reason,
    }: {
      stage: SpendingStage;
      status: StepStatus;
      reason?: string;
    }) => {
      if (!spendingCase) throw new Error("Dossier non chargé");

      // Find existing etape
      const { data: etape } = await supabase
        .from("dossier_etapes")
        .select("id")
        .eq("dossier_id", spendingCase.id)
        .eq("type_etape", stage)
        .single();

      const statusMap: Record<StepStatus, string> = {
        pending: "en_attente",
        in_progress: "en_cours",
        completed: "valide",
        rejected: "rejete",
        deferred: "differe",
        skipped: "ignore",
      };

      if (etape) {
        // Update existing
        const { error } = await supabase
          .from("dossier_etapes")
          .update({
            statut: statusMap[status],
            commentaire: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", etape.id);

        if (error) throw error;
      }

      // Update dossier current stage if completing
      if (status === "completed") {
        const nextStage = getNextStage(stage);
        if (nextStage) {
          await supabase
            .from("dossiers")
            .update({
              etape_courante: nextStage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", spendingCase.id);
        } else {
          // Final stage - mark as completed
          await supabase
            .from("dossiers")
            .update({
              statut_global: "termine",
              updated_at: new Date().toISOString(),
            })
            .eq("id", spendingCase.id);
        }
      }

      // Audit log
      await logAction({
        entityType: "dossier",
        entityId: spendingCase.id,
        action: status === "completed" ? "VALIDATE" : status === "rejected" ? "REJECT" : "UPDATE",
        newValues: {
          stage,
          status,
          reason,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-case", dossierRef || dossierId] });
      toast.success("Statut mis à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  // Helpers
  const getAvailableTransitions = (): SpendingStage[] => {
    if (!spendingCase) return [];

    const available: SpendingStage[] = [];
    const currentOrder = STAGE_ORDER[spendingCase.currentStage];

    // Next stage is always a candidate if current is complete
    if (isStageComplete(spendingCase, spendingCase.currentStage)) {
      const nextStage = getNextStage(spendingCase.currentStage);
      if (nextStage) {
        available.push(nextStage);
      }
    }

    // Check if passation can be skipped
    if (
      spendingCase.currentStage === "imputation" &&
      isStageComplete(spendingCase, "imputation")
    ) {
      // Can skip to engagement if montant < seuil
      if ((spendingCase.montantEstime || 0) < 5000000) {
        available.push("engagement");
      }
    }

    return available;
  };

  const isCurrentStage = (stage: SpendingStage): boolean => {
    return spendingCase?.currentStage === stage;
  };

  const canProceed = (): boolean => {
    if (!spendingCase) return false;
    return isStageComplete(spendingCase, spendingCase.currentStage);
  };

  return {
    spendingCase,
    isLoading,
    error,
    refetch,

    // Mutations
    transition: transitionMutation.mutateAsync,
    isTransitioning: transitionMutation.isPending,

    updateStepStatus: updateStepStatusMutation.mutateAsync,
    isUpdatingStatus: updateStepStatusMutation.isPending,

    // Helpers
    getAvailableTransitions,
    isCurrentStage,
    canProceed,
    getStageStatus: (stage: SpendingStage) =>
      spendingCase ? getStageStatus(spendingCase, stage) : "pending",
    isStageComplete: (stage: SpendingStage) =>
      spendingCase ? isStageComplete(spendingCase, stage) : false,
  };
}

// Helper functions

function buildStepsFromEtapes(
  etapes: Array<{
    type_etape: string;
    statut: string;
    montant?: number;
    ref_id?: string;
    reference?: string;
    created_at: string;
    validated_by?: string;
    validated_at?: string;
    commentaire?: string;
  }>,
  currentStage: string | null
): SpendingStepData[] {
  const statusMap: Record<string, StepStatus> = {
    en_attente: "pending",
    en_cours: "in_progress",
    valide: "completed",
    termine: "completed",
    rejete: "rejected",
    differe: "deferred",
    ignore: "skipped",
  };

  const currentOrder = currentStage ? STAGE_ORDER[currentStage as SpendingStage] : 1;

  return SPENDING_STAGES.map((stage) => {
    const etape = etapes.find((e) => e.type_etape === stage);
    const stageOrder = STAGE_ORDER[stage];

    let status: StepStatus = "pending";
    if (etape) {
      status = statusMap[etape.statut] || "pending";
    } else if (stageOrder < currentOrder) {
      // Implicit completion if before current
      status = "completed";
    } else if (stageOrder === currentOrder) {
      status = "in_progress";
    }

    return {
      stage,
      status,
      entityId: etape?.ref_id,
      reference: etape?.reference,
      montant: etape?.montant,
      date: etape?.created_at,
      validatedBy: etape?.validated_by,
      validatedAt: etape?.validated_at,
      rejectionReason: etape?.statut === "rejete" ? etape.commentaire : undefined,
      deferralReason: etape?.statut === "differe" ? etape.commentaire : undefined,
    };
  });
}

function findEntityId(
  etapes: Array<{ type_etape: string; ref_id?: string }> | null,
  stage: SpendingStage
): string | undefined {
  return etapes?.find((e) => e.type_etape === stage)?.ref_id;
}

function mapDossierStatus(
  statut: string | null
): SpendingCase["status"] {
  switch (statut) {
    case "termine":
      return "completed";
    case "annule":
      return "cancelled";
    case "suspendu":
      return "blocked";
    case "en_cours":
    default:
      return "in_progress";
  }
}

async function updateStageDirectly(
  dossierId: string,
  stage: SpendingStage,
  entityId?: string,
  reference?: string,
  montant?: number
) {
  // Check if etape exists
  const { data: existing } = await supabase
    .from("dossier_etapes")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("type_etape", stage)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("dossier_etapes")
      .update({
        ref_id: entityId,
        reference,
        montant,
        statut: "valide",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Insert new
    const { error } = await supabase.from("dossier_etapes").insert({
      dossier_id: dossierId,
      type_etape: stage,
      ref_id: entityId,
      reference,
      montant,
      statut: "valide",
    });

    if (error) throw error;
  }

  // Update dossier current stage
  const nextStage = getNextStage(stage);
  const { error: updateError } = await supabase
    .from("dossiers")
    .update({
      etape_courante: nextStage || stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dossierId);

  if (updateError) throw updateError;
}

// Hook for checking if user can perform action on a stage
export function useStagePermission(stage: SpendingStage) {
  const { data: profile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("profil_fonctionnel, role_hierarchique")
        .eq("id", userData.user.id)
        .single();

      return data;
    },
  });

  const requiredRole = STAGE_CONFIG[stage].validationRole;
  const userRole = profile?.profil_fonctionnel;

  const canValidate =
    userRole === "ADMIN" ||
    userRole === requiredRole ||
    (requiredRole === "DG" && userRole === "DG");

  const canView = true; // Everyone can view based on their visibility rules

  return {
    canValidate,
    canView,
    userRole,
    requiredRole,
  };
}
