/**
 * Hook pour charger les roles configurables par module depuis system_config.
 *
 * Les cles suivent le pattern : ROLES_{MODULE}_{ACTION}
 * Ex: ROLES_IMPUTATION_CREATE, ROLES_IMPUTATION_VALIDATE
 *
 * Permet de modifier les roles autorises dans Parametres > Roles Modules
 * sans toucher au code.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ModuleAction = 'CREATE' | 'VALIDATE' | 'REJECT' | 'DEFER' | 'SUBMIT';

interface ModuleRolesConfig {
  createRoles: string[];
  validateRoles: string[];
  rejectRoles: string[];
  isLoading: boolean;
}

/**
 * Charge les roles configurables pour un module depuis system_config.
 * Retourne les valeurs par defaut si le parametre n'existe pas en base.
 */
export function useModuleRolesConfig(
  moduleName: string,
  defaults?: { create?: string[]; validate?: string[]; reject?: string[] }
): ModuleRolesConfig {
  const moduleKey = moduleName.toUpperCase();

  const { data, isLoading } = useQuery({
    queryKey: ['module-roles-config', moduleKey],
    queryFn: async () => {
      const { data: configs, error } = await supabase
        .from('system_config')
        .select('key, value')
        .like('key', `ROLES_${moduleKey}_%`)
        .eq('category', 'roles_modules');

      if (error) throw error;

      const result: Record<string, string[]> = {};
      for (const config of configs || []) {
        const action = config.key.replace(`ROLES_${moduleKey}_`, '');
        result[action] = Array.isArray(config.value) ? config.value : [];
      }
      return result;
    },
    staleTime: 60_000, // 1 min — les roles ne changent pas souvent
  });

  return {
    createRoles: data?.CREATE ?? defaults?.create ?? ['ADMIN'],
    validateRoles: data?.VALIDATE ?? defaults?.validate ?? ['ADMIN'],
    rejectRoles: data?.REJECT ?? defaults?.reject ?? ['ADMIN'],
    isLoading,
  };
}

/**
 * Verifie si un role utilisateur est dans la liste configuree pour une action.
 */
export function isRoleAuthorized(userRoles: string[], authorizedRoles: string[]): boolean {
  return userRoles.some((role) => authorizedRoles.includes(role));
}

/**
 * Met a jour les roles configurables pour un module.
 * Utilise en tant que mutation dans le parametrage.
 */
export async function updateModuleRoles(
  moduleName: string,
  action: ModuleAction,
  roles: string[]
): Promise<void> {
  const key = `ROLES_${moduleName.toUpperCase()}_${action}`;

  const { error } = await supabase.from('system_config').upsert(
    {
      key,
      value: roles,
      label: `Rôles autorisés - ${action.toLowerCase()} ${moduleName.toLowerCase()}`,
      category: 'roles_modules',
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
}
