import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Json } from "@/integrations/supabase/types";

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete" | "validate" | "reject" | "archive";
  oldValues?: Json;
  newValues?: Json;
}

/**
 * Hook pour enregistrer les actions dans l'audit trail
 */
export function useAuditLog() {
  const { exercice } = useExercice();

  const logAction = async ({
    entityType,
    entityId,
    action,
    oldValues,
    newValues,
  }: AuditLogParams) => {
    try {
      const { error } = await supabase.from("audit_logs").insert([{
        entity_type: entityType,
        entity_id: entityId,
        action,
        old_values: oldValues || null,
        new_values: newValues || null,
        exercice: exercice,
      }]);

      if (error) {
        console.error("Erreur audit log:", error);
      }
    } catch (err) {
      console.error("Erreur audit log:", err);
    }
  };

  return { logAction };
}
