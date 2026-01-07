import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "./usePermissions";

export interface SeparationOfDutiesCheck {
  can_proceed: boolean;
  reason: string;
  creator_id: string | null;
  current_user_id: string | null;
}

export function useSeparationOfDuties() {
  const { userId, isAdmin } = usePermissions();

  const checkSeparation = async (
    entityType: string,
    entityId: string,
    action: string
  ): Promise<SeparationOfDutiesCheck> => {
    const { data, error } = await supabase.rpc("check_separation_of_duties", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_action: action,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error checking separation of duties:", error);
      return {
        can_proceed: false,
        reason: "error",
        creator_id: null,
        current_user_id: userId || null,
      };
    }

    return {
      can_proceed: (data as any)?.can_proceed ?? false,
      reason: (data as any)?.reason ?? "error",
      creator_id: (data as any)?.creator_id ?? null,
      current_user_id: (data as any)?.current_user_id ?? userId ?? null,
    };
  };

  return {
    checkSeparation,
    isAdmin,
  };
}

// Hook pour vérifier les permissions avec conditions
export function usePermissionWithConditions() {
  const { userId } = usePermissions();

  const checkPermission = async (
    actionCode: string,
    entityId?: string,
    directionId?: string,
    exercice?: number
  ): Promise<{ granted: boolean; via_delegation: boolean; reason: string }> => {
    if (!userId) {
      return { granted: false, via_delegation: false, reason: "not_authenticated" };
    }

    const { data, error } = await supabase.rpc("check_permission_with_conditions", {
      p_user_id: userId,
      p_action_code: actionCode,
      p_entity_id: entityId || null,
      p_direction_id: directionId || null,
      p_exercice: exercice || null,
    });

    if (error) {
      console.error("Error checking permission:", error);
      return { granted: false, via_delegation: false, reason: "error" };
    }

    return data as { granted: boolean; via_delegation: boolean; reason: string };
  };

  return { checkPermission };
}
