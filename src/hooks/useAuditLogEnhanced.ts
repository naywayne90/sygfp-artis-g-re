import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Json } from "@/integrations/supabase/types";
import { useCallback } from "react";

interface AuditLogParams {
  entityType: string;
  entityId?: string;
  action: string;
  module?: string;
  entityCode?: string;
  resume?: string;
  oldValues?: Json;
  newValues?: Json;
  justification?: string;
}

/**
 * Enhanced hook for logging audit actions
 */
export function useAuditLogEnhanced() {
  const { exercice } = useExercice();

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
  }: AuditLogParams) => {
    try {
      // Try to use the RPC function first
      const { data, error: rpcError } = await supabase.rpc("log_audit_action", {
        p_entity_type: entityType,
        p_entity_id: entityId || null,
        p_action: action,
        p_module: module || null,
        p_entity_code: entityCode || null,
        p_resume: resume || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_justification: justification || null,
        p_exercice: exercice,
      });

      if (rpcError) {
        // Fallback to direct insert
        console.warn("RPC failed, using direct insert:", rpcError);
        const { error } = await supabase.from("audit_logs").insert([{
          entity_type: entityType,
          entity_id: entityId || null,
          action,
          module: module || null,
          entity_code: entityCode || null,
          resume: resume || null,
          old_values: oldValues || null,
          new_values: newValues || null,
          justification: justification || null,
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
    logCreate,
    logUpdate,
    logValidate,
    logReject,
    logSubmit,
    logExecute,
    logCancel,
  };
}
