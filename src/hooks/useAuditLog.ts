import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Json } from "@/integrations/supabase/types";
import { useCallback } from "react";
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
  | "cancel"
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
  entityId?: string;
  action: AuditAction | string;
  module?: string;
  entityCode?: string;
  resume?: string;
  oldValues?: Json;
  newValues?: Json;
  justification?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hook unifié pour enregistrer les actions dans l'audit trail
 * Fusionne useAuditLog + useAuditLogEnhanced
 */
export function useAuditLog() {
  const { exercice } = useExercice();

  /**
   * Enregistre une action dans le journal d'audit
   */
  const logAction = useCallback(async ({
    entityType,
    entityId,
    action,
    module,
    entityCode,
    resume,
    oldValues,
    newValues,
    justification,
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

      // Try to use the RPC function first
      const { data, error: rpcError } = await supabase.rpc("log_audit_action", {
        p_entity_type: entityType,
        p_entity_id: entityId || null,
        p_action: action.toUpperCase(),
        p_module: module || null,
        p_entity_code: entityCode || null,
        p_resume: resume || null,
        p_old_values: oldValues || null,
        p_new_values: enrichedNewValues,
        p_justification: justification || null,
        p_exercice: exercice,
      });

      if (rpcError) {
        // Fallback to direct insert
        console.warn("RPC failed, using direct insert:", rpcError);
        const { error } = await supabase.from("audit_logs").insert([{
          entity_type: entityType,
          entity_id: entityId || null,
          action: action.toUpperCase(),
          old_values: oldValues || null,
          new_values: enrichedNewValues,
          exercice: exercice,
        }]);

        if (error) {
          console.error("Audit log error:", error);
        }
      }

      return data;
    } catch (err) {
      console.error("Audit log error:", err);
    }
  }, [exercice]);

  /**
   * Log une action de validation
   */
  const logValidation = useCallback(async (
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
  }, [logAction]);

  /**
   * Log un changement de rôle utilisateur
   */
  const logRoleChange = useCallback(async (
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
  }, [logAction]);

  /**
   * Log une action budgétaire
   */
  const logBudgetAction = useCallback(async (
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
  }, [logAction]);

  // Convenience methods for common actions
  const logCreate = useCallback((params: Omit<AuditLogParams, "action">) => 
    logAction({ ...params, action: "create" }), [logAction]);

  const logUpdate = useCallback((params: Omit<AuditLogParams, "action">) => 
    logAction({ ...params, action: "update" }), [logAction]);

  const logValidate = useCallback((params: Omit<AuditLogParams, "action">) => 
    logAction({ ...params, action: "validate" }), [logAction]);

  const logReject = useCallback((params: Omit<AuditLogParams, "action"> & { justification: string }) => 
    logAction({ ...params, action: "reject" }), [logAction]);

  const logSubmit = useCallback((params: Omit<AuditLogParams, "action">) => 
    logAction({ ...params, action: "submit" }), [logAction]);

  const logExecute = useCallback((params: Omit<AuditLogParams, "action">) => 
    logAction({ ...params, action: "execute" }), [logAction]);

  const logCancel = useCallback((params: Omit<AuditLogParams, "action"> & { justification: string }) => 
    logAction({ ...params, action: "cancel" }), [logAction]);

  return { 
    logAction, 
    logValidation, 
    logRoleChange, 
    logBudgetAction,
    logCreate,
    logUpdate,
    logValidate,
    logReject,
    logSubmit,
    logExecute,
    logCancel,
    // Liste des actions auditées pour référence
    auditedActions: AUDITED_ACTIONS,
  };
}

// Alias for backward compatibility
export const useAuditLogEnhanced = useAuditLog;
