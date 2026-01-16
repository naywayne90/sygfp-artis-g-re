/**
 * Hook pour la gestion des accès basés sur les rôles
 * Centralise la logique d'autorisation pour l'application SYGFP
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "./usePermissions";
import { 
  VALIDATION_MATRIX, 
  VISIBILITY_RULES,
  canRoleValidate,
  getVisibilityLevel,
  type ValidationType 
} from "@/lib/config/rbac-config";

interface UserContext {
  userId: string | null;
  directionId: string | null;
  serviceId: string | null;
  roleHierarchique: string | null;
  profilFonctionnel: string | null;
  roles: string[];
}

interface AccessResult {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canValidate: boolean;
  canReject: boolean;
  canDefer: boolean;
  canImpute: boolean;
  canSign: boolean;
  visibilityLevel: 'own' | 'service' | 'direction' | 'all';
  denyReason?: string;
}

interface EntityContext {
  createdBy?: string | null;
  directionId?: string | null;
  serviceId?: string | null;
  statut?: string | null;
}

export function useRoleBasedAccess() {
  const { 
    userId, 
    userRoles, 
    isAdmin, 
    hasRole, 
    hasAnyRole,
    isLoading: permissionsLoading 
  } = usePermissions();

  // Récupérer le contexte utilisateur complet
  const { data: userContext, isLoading: contextLoading } = useQuery({
    queryKey: ["user-context", userId],
    queryFn: async (): Promise<UserContext> => {
      if (!userId) {
        return {
          userId: null,
          directionId: null,
          serviceId: null,
          roleHierarchique: null,
          profilFonctionnel: null,
          roles: [],
        };
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, direction_id, role_hierarchique, profil_fonctionnel")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user context:", error);
        return {
          userId,
          directionId: null,
          serviceId: null,
          roleHierarchique: null,
          profilFonctionnel: null,
          roles: userRoles,
        };
      }

      return {
        userId,
        directionId: profile?.direction_id || null,
        serviceId: null, // À implémenter si nécessaire
        roleHierarchique: profile?.role_hierarchique || null,
        profilFonctionnel: profile?.profil_fonctionnel || null,
        roles: userRoles,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const isLoading = permissionsLoading || contextLoading;

  /**
   * Vérifie si l'utilisateur peut valider un type d'entité spécifique
   */
  const canValidateEntity = (entityType: ValidationType): boolean => {
    if (isAdmin) return true;
    
    const rule = VALIDATION_MATRIX[entityType];
    if (!rule) return false;

    return userRoles.some(role => (rule.validators as readonly string[]).includes(role));
  };

  /**
   * Récupère le niveau de visibilité de l'utilisateur
   */
  const getUserVisibilityLevel = (): 'own' | 'service' | 'direction' | 'all' => {
    if (isAdmin) return 'all';
    if (hasAnyRole(['DG', 'AUDITEUR'])) return 'all';
    if (hasRole('DIRECTEUR')) return 'direction';
    if (hasRole('SOUS_DIRECTEUR')) return 'direction';
    if (hasRole('CHEF_SERVICE')) return 'service';
    return 'own';
  };

  /**
   * Vérifie si l'utilisateur peut accéder à une entité
   */
  const canAccessEntity = (entity: EntityContext): boolean => {
    if (isAdmin) return true;
    if (hasAnyRole(['DG', 'AUDITEUR'])) return true;

    const visibilityLevel = getUserVisibilityLevel();

    switch (visibilityLevel) {
      case 'all':
        return true;
      case 'direction':
        return entity.directionId === userContext?.directionId || entity.createdBy === userId;
      case 'service':
        return entity.serviceId === userContext?.serviceId || entity.createdBy === userId;
      case 'own':
      default:
        return entity.createdBy === userId;
    }
  };

  /**
   * Calcule les droits d'accès complets pour une entité
   */
  const getEntityAccess = (entity: EntityContext, entityType?: ValidationType): AccessResult => {
    const isOwner = entity.createdBy === userId;
    const isSameDirection = entity.directionId === userContext?.directionId;
    const isDG = hasRole('DG');
    const isCB = hasAnyRole(['CB', 'DAAF']);
    const statut = entity.statut || 'brouillon';
    const visibilityLevel = getUserVisibilityLevel();

    // Accès par défaut
    let access: AccessResult = {
      canView: false,
      canCreate: true,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canValidate: false,
      canReject: false,
      canDefer: false,
      canImpute: false,
      canSign: false,
      visibilityLevel,
    };

    // Admin bypass
    if (isAdmin) {
      return {
        ...access,
        canView: true,
        canEdit: true,
        canDelete: true,
        canSubmit: true,
        canValidate: true,
        canReject: true,
        canDefer: true,
        canImpute: true,
        canSign: true,
      };
    }

    // Règles de visibilité
    access.canView = canAccessEntity(entity);

    if (!access.canView) {
      access.denyReason = "Vous n'avez pas les droits pour accéder à cette entité";
      return access;
    }

    // Édition (brouillon uniquement par créateur)
    access.canEdit = (isOwner || isAdmin) && statut === 'brouillon';

    // Suppression (brouillon uniquement)
    access.canDelete = (isOwner || isAdmin) && statut === 'brouillon';

    // Soumission (brouillon par créateur)
    access.canSubmit = (isOwner || isAdmin) && statut === 'brouillon';

    // Validation (selon la matrice)
    if (entityType) {
      access.canValidate = canValidateEntity(entityType) && 
                           ['soumis', 'a_valider', 'en_attente'].includes(statut);
      access.canReject = access.canValidate;
      access.canDefer = access.canValidate;
    } else {
      access.canValidate = (isDG || isAdmin) && ['soumis', 'a_valider'].includes(statut);
      access.canReject = access.canValidate;
      access.canDefer = access.canValidate;
    }

    // Imputation (CB uniquement)
    access.canImpute = (isCB || isAdmin) && ['valide', 'a_imputer'].includes(statut);

    // Signature (DG uniquement)
    access.canSign = (isDG || isAdmin) && statut === 'a_signer';

    return access;
  };

  /**
   * Vérifie si l'utilisateur peut modifier après validation
   */
  const canModifyAfterValidation = (statut: string): boolean => {
    if (isAdmin) return true;
    
    // Seuls les admins peuvent modifier après validation
    const finalStatuses = ['valide', 'impute', 'ordonnance', 'regle', 'solde'];
    return !finalStatuses.includes(statut);
  };

  /**
   * Message d'erreur pour rôle insuffisant
   */
  const getAccessDeniedMessage = (entityType: ValidationType): string => {
    const rule = VALIDATION_MATRIX[entityType];
    if (!rule) return "Accès refusé";
    
    return `Cette action nécessite le rôle ${rule.requiredRole}. ${rule.description}`;
  };

  return {
    // Contexte
    userContext,
    isLoading,
    isAdmin,
    
    // Vérifications principales
    canValidateEntity,
    canAccessEntity,
    getEntityAccess,
    getUserVisibilityLevel,
    canModifyAfterValidation,
    
    // Helpers
    getAccessDeniedMessage,
    
    // Raccourcis courants
    isDG: hasRole('DG'),
    isCB: hasAnyRole(['CB', 'DAAF']),
    isDirecteur: hasRole('DIRECTEUR'),
    isTresorerie: hasAnyRole(['TRESORERIE', 'AGENT_COMPTABLE', 'AC']),
    isAuditeur: hasRole('AUDITEUR'),
    
    // Validations spécifiques
    canValidateNoteSEF: () => canValidateEntity('NOTE_SEF'),
    canValidateNoteAEF: () => canValidateEntity('NOTE_AEF'),
    canValidateEngagement: () => canValidateEntity('ENGAGEMENT'),
    canValidateLiquidation: () => canValidateEntity('LIQUIDATION'),
    canSignOrdonnancement: () => canValidateEntity('ORDONNANCEMENT'),
    canExecuteReglement: () => canValidateEntity('REGLEMENT'),
    canValidateMarche: () => canValidateEntity('MARCHE'),
    canApproveVirement: () => canValidateEntity('VIREMENT'),
    canImpute: () => hasAnyRole(['CB', 'ADMIN']),
  };
}
