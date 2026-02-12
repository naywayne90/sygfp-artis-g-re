/**
 * Hook pour vérifier les permissions de validation via RPC unifiée.
 *
 * Combine 3 modes : rôle direct, délégation, intérim.
 * À utiliser dans les mutations de validation (useNotesSEF, useEngagements, etc.)
 */

import { supabase } from '@/integrations/supabase/client';

export interface ValidationPermissionResult {
  isAllowed: boolean;
  validationMode: 'direct' | 'delegation' | 'interim' | null;
  onBehalfOfId: string | null;
  onBehalfOfName: string | null;
}

/**
 * Appelle la RPC `check_validation_permission` pour vérifier
 * si un utilisateur peut valider un module avec un rôle donné.
 *
 * @param userId - L'ID de l'utilisateur à vérifier
 * @param module - Le module ('notes_sef', 'engagements', 'liquidations', 'ordonnancements')
 * @param requiredRole - Le rôle requis ('DG', 'SAF', 'CB', 'DAF', etc.)
 */
export async function checkValidationPermission(
  userId: string,
  module: string,
  requiredRole: string
): Promise<ValidationPermissionResult> {
  const { data, error } = await supabase.rpc('check_validation_permission', {
    p_user_id: userId,
    p_module: module,
    p_required_role: requiredRole,
  });

  if (error) {
    console.error('[checkValidationPermission] RPC error:', error);
    return {
      isAllowed: false,
      validationMode: null,
      onBehalfOfId: null,
      onBehalfOfName: null,
    };
  }

  // La RPC retourne un tableau avec une seule ligne
  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return {
      isAllowed: false,
      validationMode: null,
      onBehalfOfId: null,
      onBehalfOfName: null,
    };
  }

  return {
    isAllowed: row.is_allowed ?? false,
    validationMode: row.validation_mode as ValidationPermissionResult['validationMode'],
    onBehalfOfId: row.on_behalf_of_id ?? null,
    onBehalfOfName: row.on_behalf_of_name ?? null,
  };
}
