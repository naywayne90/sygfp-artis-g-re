/**
 * Hook RBAC Enforcer
 * Contrôle l'accès par route et par donnée (direction_id)
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  canAccessRoute,
  routeRequiresDirectionFilter,
  getAccessibleRoutes,
  ROLES_HIERARCHIQUES,
  VALIDATION_MATRIX,
  canRoleValidate
} from '@/lib/config/rbac-config';

// Types
export interface UserRBACContext {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  profilFonctionnel: string | null;
  roleHierarchique: string | null;
  directionId: string | null;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface RBACEnforcerResult {
  // Contexte utilisateur
  user: UserRBACContext;

  // Vérifications d'accès
  canAccessCurrentRoute: boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessData: (directionId: string | null) => boolean;

  // Vérifications de validation
  canValidate: (entityType: keyof typeof VALIDATION_MATRIX) => boolean;
  canCreate: (entityType: string) => boolean;
  canEdit: (entityType: string, createdBy?: string) => boolean;
  canDelete: (entityType: string) => boolean;
  canExport: () => boolean;

  // Niveau hiérarchique
  hierarchyLevel: number;
  isAboveLevel: (level: number) => boolean;

  // Profil fonctionnel
  isAdmin: boolean;
  isDG: boolean;
  isCB: boolean;
  isDAF: boolean;
  isTresorerie: boolean;
  isAuditeur: boolean;
  isDirecteur: boolean;
  isOperateur: boolean;

  // Navigation
  redirectToAllowed: () => void;
  getAccessibleRoutes: () => string[];

  // Scope direction
  requiresDirectionFilter: boolean;
  userDirectionId: string | null;
}

/**
 * Hook principal pour l'enforcement RBAC
 */
export function useRBACEnforcer(): RBACEnforcerResult {
  const location = useLocation();
  const navigate = useNavigate();

  // Récupérer le profil utilisateur
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['rbac-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 1,
  });

  // Contexte utilisateur
  const user: UserRBACContext = useMemo(() => ({
    userId: profile?.id || null,
    email: profile?.email || null,
    fullName: profile?.full_name || null,
    profilFonctionnel: profile?.profil_fonctionnel || null,
    roleHierarchique: profile?.role_hierarchique || null,
    directionId: profile?.direction_id || null,
    isActive: profile?.is_active ?? false,
    isLoading,
    error: error as Error | null,
  }), [profile, isLoading, error]);

  // Niveau hiérarchique
  const hierarchyLevel = useMemo(() => {
    if (!user.roleHierarchique) return 1;
    const role = Object.values(ROLES_HIERARCHIQUES).find(r => r.code === user.roleHierarchique);
    return role?.niveau || 1;
  }, [user.roleHierarchique]);

  // Profils fonctionnels
  const isAdmin = user.profilFonctionnel === 'ADMIN' || user.profilFonctionnel === 'Admin';
  const isDG = user.profilFonctionnel === 'DG';
  const isCB = user.profilFonctionnel === 'CB';
  const isDAF = user.profilFonctionnel === 'DAAF';
  const isTresorerie = user.profilFonctionnel === 'TRESORERIE';
  const isAuditeur = user.profilFonctionnel === 'AUDITEUR';
  const isDirecteur = user.profilFonctionnel === 'DIRECTEUR';
  const isOperateur = user.profilFonctionnel === 'OPERATEUR';

  // Vérifier si peut accéder à une route
  const checkCanAccessRoute = useCallback((route: string): boolean => {
    if (!user.profilFonctionnel) return false;
    if (isAdmin) return true;
    return canAccessRoute(route, user.profilFonctionnel, user.roleHierarchique || undefined);
  }, [user.profilFonctionnel, user.roleHierarchique, isAdmin]);

  // Route actuelle
  const canAccessCurrentRoute = useMemo(() => {
    if (isLoading) return true; // Attendre le chargement
    if (!user.isActive) return false;
    return checkCanAccessRoute(location.pathname);
  }, [isLoading, user.isActive, location.pathname, checkCanAccessRoute]);

  // Vérifier si peut accéder à une donnée (par direction)
  const canAccessData = useCallback((directionId: string | null): boolean => {
    if (isAdmin || isDG || isAuditeur) return true;
    if (isCB || isDAF || isTresorerie) return true; // Accès transversal
    if (!directionId) return true;
    return user.directionId === directionId;
  }, [isAdmin, isDG, isAuditeur, isCB, isDAF, isTresorerie, user.directionId]);

  // Vérifier si peut valider
  const checkCanValidate = useCallback((entityType: keyof typeof VALIDATION_MATRIX): boolean => {
    if (!user.profilFonctionnel) return false;
    if (isAdmin) return true;
    return canRoleValidate(user.profilFonctionnel, entityType);
  }, [user.profilFonctionnel, isAdmin]);

  // Vérifier si peut créer
  const canCreate = useCallback((entityType: string): boolean => {
    if (!user.profilFonctionnel) return false;
    if (isAdmin) return true;
    if (isAuditeur) return false; // Lecture seule

    // Règles spécifiques par entité
    switch (entityType) {
      case 'note_sef':
      case 'note_aef':
        return true; // Tout le monde peut créer
      case 'engagement':
        return isCB || isDAF;
      case 'liquidation':
        return isDAF;
      case 'ordonnancement':
        return isDG;
      case 'reglement':
        return isTresorerie;
      default:
        return true;
    }
  }, [user.profilFonctionnel, isAdmin, isAuditeur, isCB, isDAF, isDG, isTresorerie]);

  // Vérifier si peut éditer
  const canEdit = useCallback((entityType: string, createdBy?: string): boolean => {
    if (!user.profilFonctionnel) return false;
    if (isAdmin) return true;
    if (isAuditeur) return false;

    // Propriétaire peut toujours éditer ses brouillons
    if (createdBy && createdBy === user.userId) return true;

    // Règles spécifiques
    switch (entityType) {
      case 'engagement':
        return isCB || isDAF;
      case 'liquidation':
        return isDAF || isCB;
      case 'budget':
        return isCB || isDAF;
      default:
        return true;
    }
  }, [user.profilFonctionnel, user.userId, isAdmin, isAuditeur, isCB, isDAF]);

  // Vérifier si peut supprimer
  const canDelete = useCallback((_entityType: string): boolean => {
    if (isAdmin) return true;
    return false; // Suppression réservée aux admins par défaut
  }, [isAdmin]);

  // Vérifier si peut exporter
  const canExport = useCallback((): boolean => {
    if (isAdmin || isDG || isCB || isDAF || isTresorerie || isAuditeur || isDirecteur) return true;
    return hierarchyLevel >= 3; // Sous-directeur et au-dessus
  }, [isAdmin, isDG, isCB, isDAF, isTresorerie, isAuditeur, isDirecteur, hierarchyLevel]);

  // Vérifier si au-dessus d'un niveau
  const isAboveLevel = useCallback((level: number): boolean => {
    return hierarchyLevel > level;
  }, [hierarchyLevel]);

  // Rediriger vers une route autorisée
  const redirectToAllowed = useCallback(() => {
    if (!user.profilFonctionnel) {
      navigate('/auth');
      return;
    }

    // Trouver la première route accessible
    const accessibleRoutes = getAccessibleRoutes(user.profilFonctionnel, user.roleHierarchique || undefined);
    if (accessibleRoutes.length > 0) {
      navigate(accessibleRoutes[0]);
    } else {
      navigate('/');
    }
  }, [user.profilFonctionnel, user.roleHierarchique, navigate]);

  // Récupérer les routes accessibles
  const getAccessibleRoutesForUser = useCallback((): string[] => {
    if (!user.profilFonctionnel) return [];
    return getAccessibleRoutes(user.profilFonctionnel, user.roleHierarchique || undefined);
  }, [user.profilFonctionnel, user.roleHierarchique]);

  // Vérifier si la route nécessite un filtre direction
  const requiresDirectionFilter = useMemo(() => {
    return routeRequiresDirectionFilter(location.pathname);
  }, [location.pathname]);

  return {
    user,
    canAccessCurrentRoute,
    canAccessRoute: checkCanAccessRoute,
    canAccessData,
    canValidate: checkCanValidate,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    hierarchyLevel,
    isAboveLevel,
    isAdmin,
    isDG,
    isCB,
    isDAF,
    isTresorerie,
    isAuditeur,
    isDirecteur,
    isOperateur,
    redirectToAllowed,
    getAccessibleRoutes: getAccessibleRoutesForUser,
    requiresDirectionFilter,
    userDirectionId: user.directionId,
  };
}

/**
 * Hook pour vérifier l'accès à une entité spécifique
 */
export function useEntityAccess(entityType: string, entity?: {
  created_by?: string;
  direction_id?: string;
  statut?: string;
}) {
  const rbac = useRBACEnforcer();

  const canView = useMemo(() => {
    if (!entity) return true;
    return rbac.canAccessData(entity.direction_id || null);
  }, [entity, rbac]);

  const canEditEntity = useMemo(() => {
    if (!entity) return false;
    return rbac.canEdit(entityType, entity.created_by);
  }, [entity, entityType, rbac]);

  const canValidateEntity = useMemo(() => {
    // Map entity type to validation type
    const validationMap: Record<string, keyof typeof VALIDATION_MATRIX> = {
      'note_sef': 'NOTE_SEF',
      'note_aef': 'NOTE_AEF',
      'engagement': 'ENGAGEMENT',
      'liquidation': 'LIQUIDATION',
      'ordonnancement': 'ORDONNANCEMENT',
      'reglement': 'REGLEMENT',
      'marche': 'MARCHE',
      'imputation': 'IMPUTATION',
      'virement': 'VIREMENT',
    };

    const validationType = validationMap[entityType];
    if (!validationType) return false;
    return rbac.canValidate(validationType);
  }, [entityType, rbac]);

  const canDeleteEntity = useMemo(() => {
    return rbac.canDelete(entityType);
  }, [entityType, rbac]);

  const isOwner = useMemo(() => {
    if (!entity?.created_by) return false;
    return entity.created_by === rbac.user.userId;
  }, [entity, rbac.user.userId]);

  const isDraft = useMemo(() => {
    return entity?.statut === 'brouillon' || entity?.statut === 'draft';
  }, [entity]);

  return {
    canView,
    canEdit: canEditEntity,
    canValidate: canValidateEntity,
    canDelete: canDeleteEntity,
    isOwner,
    isDraft,
    canEditIfOwnerAndDraft: isOwner && isDraft,
  };
}

export default useRBACEnforcer;
