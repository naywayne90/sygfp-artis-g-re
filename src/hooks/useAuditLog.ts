import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Json } from "@/integrations/supabase/types";
import { AUDITED_ACTIONS } from "@/lib/config/rbac-config";

// Types d'actions auditées
type AuditAction = 
  | "create" 
  | "update" 
  | "delete" 
  | "validate" 
  | "reject" 
  | "archive" 
  | "submit" 
  | "defer" 
  | "resume" 
  | "update_locked_field"
  | "impute"
  | "sign"
  | "execute"
  | "transfer"
  | "role_added"
  | "role_removed"
  | "role_changed"
  | "password_changed"
  | "user_activated"
  | "user_deactivated"
  | "budget_modified"
  | "override_request"
  | "login"
  | "logout";

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValues?: Json;
  newValues?: Json;
  metadata?: Record<string, unknown>;
}

/**
 * Hook pour enregistrer les actions dans l'audit trail
 * Toutes les actions sensibles doivent être loggées via ce hook
 */
export function useAuditLog() {
  const { exercice } = useExercice();

  /**
   * Enregistre une action dans le journal d'audit
   */
  const logAction = async ({
    entityType,
    entityId,
    action,
    oldValues,
    newValues,
    metadata,
  }: AuditLogParams) => {
    try {
      // Enrichir les nouvelles valeurs avec les métadonnées
      const enrichedNewValues = {
        ...((typeof newValues === 'object' && newValues !== null) ? newValues : {}),
        ...(metadata || {}),
        _timestamp: new Date().toISOString(),
        _action_type: action.toUpperCase(),
      } as Json;

      const { error } = await supabase.from("audit_logs").insert([{
        entity_type: entityType,
        entity_id: entityId,
        action: action.toUpperCase(),
        old_values: oldValues || null,
        new_values: enrichedNewValues,
        exercice: exercice,
      }]);

      if (error) {
        console.error("Erreur audit log:", error);
      }
    } catch (err) {
      console.error("Erreur audit log:", err);
    }
  };

  /**
   * Log une action de validation
   */
  const logValidation = async (
    entityType: string,
    entityId: string,
    validationType: 'validate' | 'reject' | 'defer',
    details?: { motif?: string; commentaire?: string }
  ) => {
    await logAction({
      entityType,
      entityId,
      action: validationType,
      newValues: details as Json,
    });
  };

  /**
   * Log un changement de rôle utilisateur
   */
  const logRoleChange = async (
    userId: string,
    action: 'role_added' | 'role_removed' | 'role_changed',
    roleCode: string,
    metadata?: Record<string, unknown>
  ) => {
    await logAction({
      entityType: 'user_role',
      entityId: userId,
      action,
      newValues: { role: roleCode, ...metadata } as Json,
    });
  };

  /**
   * Log une action budgétaire
   */
  const logBudgetAction = async (
    entityId: string,
    action: 'impute' | 'transfer' | 'budget_modified',
    details: { montant?: number; ligne_source?: string; ligne_destination?: string; motif?: string }
  ) => {
    await logAction({
      entityType: 'budget',
      entityId,
      action,
      newValues: details as Json,
    });
  };

  return { 
    logAction, 
    logValidation, 
    logRoleChange, 
    logBudgetAction,
    // Liste des actions auditées pour référence
    auditedActions: AUDITED_ACTIONS,
  };
}
