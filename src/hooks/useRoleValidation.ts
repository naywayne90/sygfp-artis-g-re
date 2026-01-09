import { useCallback } from "react";
import { usePermissions } from "./usePermissions";
import { useSeparationOfDuties } from "./useSeparationOfDuties";
import { toast } from "sonner";

/**
 * Hook centralisé pour valider les droits de l'utilisateur avant chaque action critique
 * Implémente les règles strictes "Qui valide quoi" du compte-rendu SYGFP
 */
export function useRoleValidation() {
  const {
    isAdmin,
    canValidateNoteSEF,
    canValidateNoteAEF,
    canImpute,
    canValidateEngagement,
    canValidateLiquidation,
    canSignOrdonnancement,
    canExecuteReglement,
    canValidateMarche,
    canApproveVirement,
    getRequiredRoleMessage,
    userRoles,
    userId,
  } = usePermissions();

  const { checkSeparation } = useSeparationOfDuties();

  /**
   * Vérifie si l'utilisateur peut effectuer une action et affiche un toast si non
   * Retourne true si l'action est autorisée, false sinon
   */
  const validateAction = useCallback(
    async (
      action: 
        | "validate_note_sef"
        | "validate_note_aef"
        | "impute"
        | "validate_engagement"
        | "validate_liquidation"
        | "sign_ordonnancement"
        | "execute_reglement"
        | "validate_marche"
        | "approve_virement",
      options?: {
        entityType?: string;
        entityId?: string;
        showToast?: boolean;
        checkSeparationOfDuties?: boolean;
      }
    ): Promise<{ allowed: boolean; reason?: string }> => {
      const { showToast = true, checkSeparationOfDuties = true, entityType, entityId } = options || {};

      // Mapping des actions vers les fonctions de vérification
      const actionChecks: Record<string, () => boolean> = {
        validate_note_sef: canValidateNoteSEF,
        validate_note_aef: canValidateNoteAEF,
        impute: canImpute,
        validate_engagement: canValidateEngagement,
        validate_liquidation: canValidateLiquidation,
        sign_ordonnancement: canSignOrdonnancement,
        execute_reglement: canExecuteReglement,
        validate_marche: canValidateMarche,
        approve_virement: canApproveVirement,
      };

      const checkFn = actionChecks[action];
      if (!checkFn) {
        return { allowed: false, reason: "Action inconnue" };
      }

      // Vérifier le rôle
      const hasRole = checkFn();
      if (!hasRole) {
        const requiredRole = getRequiredRoleMessage(action);
        const reason = `Action non autorisée. Rôle requis : ${requiredRole}`;
        
        if (showToast) {
          toast.error("Action non autorisée", {
            description: `Rôle requis : ${requiredRole}`,
          });
        }
        
        // Log tentative non autorisée (sera envoyé à l'audit)
        console.warn(`[AUDIT] Tentative d'action non autorisée: ${action} par utilisateur ${userId} (rôles: ${userRoles.join(", ")})`);
        
        return { allowed: false, reason };
      }

      // Vérifier la séparation des fonctions si demandé
      if (checkSeparationOfDuties && entityType && entityId) {
        const separationCheck = await checkSeparation(entityType, entityId, action);
        
        if (!separationCheck.can_proceed) {
          const reason = separationCheck.reason === "same_user" 
            ? "Vous ne pouvez pas valider une opération que vous avez créée (séparation des fonctions)"
            : "Contrôle de séparation des fonctions non respecté";
          
          if (showToast) {
            toast.error("Séparation des fonctions", {
              description: reason,
            });
          }
          
          return { allowed: false, reason };
        }
      }

      return { allowed: true };
    },
    [
      canValidateNoteSEF,
      canValidateNoteAEF,
      canImpute,
      canValidateEngagement,
      canValidateLiquidation,
      canSignOrdonnancement,
      canExecuteReglement,
      canValidateMarche,
      canApproveVirement,
      getRequiredRoleMessage,
      checkSeparation,
      userId,
      userRoles,
    ]
  );

  /**
   * Raccourcis pour chaque type de validation
   */
  const validateNoteSEF = useCallback(
    async (noteId: string, showToast = true) =>
      validateAction("validate_note_sef", {
        entityType: "notes_sef",
        entityId: noteId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const validateNoteAEF = useCallback(
    async (noteId: string, showToast = true) =>
      validateAction("validate_note_aef", {
        entityType: "notes_aef",
        entityId: noteId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const validateImputation = useCallback(
    async (showToast = true) =>
      validateAction("impute", { showToast, checkSeparationOfDuties: false }),
    [validateAction]
  );

  const validateEngagement = useCallback(
    async (engagementId: string, showToast = true) =>
      validateAction("validate_engagement", {
        entityType: "budget_engagements",
        entityId: engagementId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const validateLiquidation = useCallback(
    async (liquidationId: string, showToast = true) =>
      validateAction("validate_liquidation", {
        entityType: "budget_liquidations",
        entityId: liquidationId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const signOrdonnancement = useCallback(
    async (ordonnancementId: string, showToast = true) =>
      validateAction("sign_ordonnancement", {
        entityType: "ordonnancements",
        entityId: ordonnancementId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const executeReglement = useCallback(
    async (reglementId: string, showToast = true) =>
      validateAction("execute_reglement", {
        entityType: "reglements",
        entityId: reglementId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const validateMarche = useCallback(
    async (marcheId: string, showToast = true) =>
      validateAction("validate_marche", {
        entityType: "marches",
        entityId: marcheId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  const approveVirement = useCallback(
    async (virementId: string, showToast = true) =>
      validateAction("approve_virement", {
        entityType: "credit_transfers",
        entityId: virementId,
        showToast,
        checkSeparationOfDuties: true,
      }),
    [validateAction]
  );

  return {
    // Fonction générique
    validateAction,
    
    // Raccourcis spécifiques
    validateNoteSEF,
    validateNoteAEF,
    validateImputation,
    validateEngagement,
    validateLiquidation,
    signOrdonnancement,
    executeReglement,
    validateMarche,
    approveVirement,
    
    // États
    isAdmin,
    userRoles,
    userId,
  };
}
