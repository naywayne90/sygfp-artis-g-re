/**
 * Hook pour les permissions via intérim
 *
 * Permet de vérifier si l'utilisateur courant agit en intérim
 * et de récupérer les rôles hérités du titulaire.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';

// ============================================================================
// TYPES
// ============================================================================

export interface InterimPermissionInfo {
  /** ID de l'intérim actif */
  interimId: string;
  /** ID du titulaire */
  titulaireId: string;
  /** Nom complet du titulaire */
  titulaireNom: string;
  /** Rôle hiérarchique du titulaire (DG, Directeur, etc.) */
  titulaireRoleHierarchique: string | null;
  /** Profil fonctionnel du titulaire */
  titulaireProfilFonctionnel: string | null;
  /** Date de fin de l'intérim */
  dateFin: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Retourne les informations de permission intérim pour l'utilisateur courant.
 * Si l'utilisateur a un intérim actif, retourne les rôles du titulaire
 * qu'il peut exercer.
 */
export function useInterimPermissions() {
  const { userId } = usePermissions();

  const { data: interimInfo, isLoading } = useQuery<InterimPermissionInfo | null>({
    queryKey: ['interim-permissions', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Chercher un intérim actif pour cet utilisateur
      const { data: interims, error: interimError } = await supabase.rpc(
        'get_active_interim_for_user',
        { p_user_id: userId }
      );

      if (interimError || !interims || (interims as unknown[]).length === 0) {
        return null;
      }

      const activeInterim = (
        interims as Array<{
          interim_id: string;
          titulaire_id: string;
          titulaire_nom: string;
          date_fin: string;
        }>
      )[0];

      // Récupérer le profil du titulaire pour connaitre son rôle
      const { data: titulaireProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role_hierarchique, profil_fonctionnel')
        .eq('id', activeInterim.titulaire_id)
        .single();

      if (profileError) {
        console.error('[useInterimPermissions] Erreur profil titulaire:', profileError);
        return null;
      }

      return {
        interimId: activeInterim.interim_id,
        titulaireId: activeInterim.titulaire_id,
        titulaireNom: activeInterim.titulaire_nom,
        titulaireRoleHierarchique: titulaireProfile?.role_hierarchique ?? null,
        titulaireProfilFonctionnel: titulaireProfile?.profil_fonctionnel ?? null,
        dateFin: activeInterim.date_fin,
      };
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  /**
   * Retourne les codes de rôle workflow hérités via l'intérim.
   * Ces codes correspondent aux mappings dans useWorkflowEngine.
   */
  const getInterimWorkflowRoles = (): string[] => {
    if (!interimInfo) return [];

    const roles: string[] = [];

    // Mapper le rôle hiérarchique du titulaire
    if (interimInfo.titulaireRoleHierarchique) {
      const roleMapping: Record<string, string> = {
        DG: 'DG',
        DGA: 'DGA',
        Directeur: 'DIRECTEUR',
        'Sous-Directeur': 'SOUS_DIRECTEUR',
        'Chef de Service': 'CHEF_SERVICE',
        Agent: 'AGENT',
      };
      const mapped = roleMapping[interimInfo.titulaireRoleHierarchique];
      if (mapped) roles.push(mapped);
    }

    // Mapper le profil fonctionnel du titulaire
    if (interimInfo.titulaireProfilFonctionnel) {
      const profilMapping: Record<string, string[]> = {
        Admin: [
          'DG',
          'DGA',
          'DIRECTEUR',
          'SOUS_DIRECTEUR',
          'CHEF_SERVICE',
          'CONTROLEUR',
          'TRESORIER',
          'VALIDATEUR',
          'AGENT',
          'AUDITEUR',
        ],
        Validateur: ['VALIDATEUR'],
        Controleur: ['CONTROLEUR'],
        Tresorerie: ['TRESORIER'],
        Operationnel: ['AGENT'],
      };
      const additionalRoles = profilMapping[interimInfo.titulaireProfilFonctionnel] || [];
      roles.push(...additionalRoles);
    }

    return [...new Set(roles)];
  };

  return {
    /** Info intérim actif ou null */
    interimInfo,
    /** True si l'utilisateur agit en intérim */
    isActingAsInterim: !!interimInfo,
    /** Rôles workflow hérités via l'intérim */
    interimWorkflowRoles: getInterimWorkflowRoles(),
    /** Nom du titulaire si intérim actif */
    titulaireNom: interimInfo?.titulaireNom ?? null,
    /** Rôle hiérarchique du titulaire */
    titulaireRole: interimInfo?.titulaireRoleHierarchique ?? null,
    /** Chargement */
    isLoading,
  };
}
