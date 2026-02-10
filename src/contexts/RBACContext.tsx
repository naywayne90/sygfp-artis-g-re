/* eslint-disable react-refresh/only-export-components */
/**
 * Contexte RBAC Global
 * Fournit les informations de permissions à toute l'application
 */

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PROFILS_FONCTIONNELS,
  ROLES_HIERARCHIQUES,
  VALIDATION_MATRIX,
  canAccessRoute,
  getAccessibleRoutes,
} from '@/lib/config/rbac-config';

// Types
export interface RBACUser {
  id: string;
  email: string;
  fullName: string;
  profilFonctionnel: string;
  roleHierarchique: string;
  directionId: string | null;
  directionCode: string | null;
  directionLibelle: string | null;
  isActive: boolean;
}

export interface RBACContextValue {
  // Utilisateur
  user: RBACUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Profils
  isAdmin: boolean;
  isDG: boolean;
  isCB: boolean;
  isDAF: boolean;
  isTresorerie: boolean;
  isAuditeur: boolean;
  isDirecteur: boolean;
  isOperateur: boolean;

  // Niveau hiérarchique
  hierarchyLevel: number;
  isAgent: boolean;
  isChefService: boolean;
  isSousDirecteur: boolean;
  isDirecteurHierarchique: boolean;
  isDGHierarchique: boolean;

  // Vérifications
  canAccess: (route: string) => boolean;
  canValidate: (entityType: keyof typeof VALIDATION_MATRIX) => boolean;
  canAccessData: (directionId: string | null) => boolean;
  canCreate: (entityType: string) => boolean;
  canExport: () => boolean;

  // Routes accessibles
  accessibleRoutes: string[];

  // Labels et couleurs
  getProfilLabel: () => string;
  getProfilColor: () => string;
  getRoleLabel: () => string;
}

const RBACContext = createContext<RBACContextValue | null>(null);

interface RBACProviderProps {
  children: ReactNode;
}

export function RBACProvider({ children }: RBACProviderProps) {
  // Extract userId synchronously from localStorage, then track via onAuthStateChange
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('sb-tjagvgqthlibdpvztvaf-auth-token');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.user?.id ?? null;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });

  useEffect(() => {
    // Confirm session and listen for auth state changes (login/logout)
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Récupérer le profil utilisateur avec direction - skip getUser(), use userId directly
  const { data: profile, isLoading } = useQuery({
    queryKey: ['rbac-context-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          *,
          direction:directions!profiles_direction_id_fkey(code, label)
        `
        )
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[RBAC] Profile query error:', error.message);
        throw error;
      }
      if (!data) {
        console.warn('[RBAC] Profile query returned null for user:', userId);
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 500,
  });

  // Construire l'objet utilisateur
  const user: RBACUser | null = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      email: profile.email || '',
      fullName: profile.full_name || '',
      profilFonctionnel: profile.profil_fonctionnel || 'OPERATEUR',
      roleHierarchique: profile.role_hierarchique || 'Agent',
      directionId: profile.direction_id,
      directionCode: profile.direction?.code || null,
      directionLibelle: profile.direction?.label || null,
      isActive: profile.is_active ?? true,
    };
  }, [profile]);

  // Profils fonctionnels
  const isAdmin = user?.profilFonctionnel === 'ADMIN' || user?.profilFonctionnel === 'Admin';
  const isDG = user?.profilFonctionnel === 'DG';
  const isCB = user?.profilFonctionnel === 'CB';
  const isDAF = user?.profilFonctionnel === 'DAAF';
  const isTresorerie = user?.profilFonctionnel === 'TRESORERIE';
  const isAuditeur = user?.profilFonctionnel === 'AUDITEUR';
  const isDirecteur = user?.profilFonctionnel === 'DIRECTEUR';
  const isOperateur = user?.profilFonctionnel === 'OPERATEUR';

  // Niveau hiérarchique
  const hierarchyLevel = useMemo(() => {
    if (!user?.roleHierarchique) return 1;
    const role = Object.values(ROLES_HIERARCHIQUES).find((r) => r.code === user.roleHierarchique);
    return role?.niveau || 1;
  }, [user?.roleHierarchique]);

  const isAgent = hierarchyLevel === 1;
  const isChefService = hierarchyLevel === 2;
  const isSousDirecteur = hierarchyLevel === 3;
  const isDirecteurHierarchique = hierarchyLevel === 4;
  const isDGHierarchique = hierarchyLevel === 5;

  // Vérifier l'accès à une route
  const canAccess = (route: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return canAccessRoute(route, user.profilFonctionnel, user.roleHierarchique);
  };

  // Vérifier si peut valider
  const canValidate = (entityType: keyof typeof VALIDATION_MATRIX): boolean => {
    if (!user) return false;
    if (isAdmin) return true;

    const rule = VALIDATION_MATRIX[entityType];
    if (!rule) return false;
    return (rule.validators as readonly string[]).includes(user.profilFonctionnel);
  };

  // Vérifier l'accès aux données par direction
  const canAccessData = (directionId: string | null): boolean => {
    if (!user) return false;
    if (isAdmin || isDG || isAuditeur) return true;
    if (isCB || isDAF || isTresorerie) return true;
    if (!directionId) return true;
    return user.directionId === directionId;
  };

  // Vérifier si peut créer
  const canCreate = (entityType: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isAuditeur) return false;

    switch (entityType) {
      case 'note_sef':
      case 'note_aef':
        return true;
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
  };

  // Vérifier si peut exporter
  const canExport = (): boolean => {
    if (!user) return false;
    if (isAdmin || isDG || isCB || isDAF || isTresorerie || isAuditeur || isDirecteur) return true;
    return hierarchyLevel >= 3;
  };

  // Routes accessibles
  const accessibleRoutes = useMemo(() => {
    if (!user) return [];
    return getAccessibleRoutes(user.profilFonctionnel, user.roleHierarchique);
  }, [user]);

  // Labels et couleurs
  const getProfilLabel = (): string => {
    if (!user) return '';
    const profil =
      PROFILS_FONCTIONNELS[user.profilFonctionnel as keyof typeof PROFILS_FONCTIONNELS];
    return profil?.label || user.profilFonctionnel;
  };

  const getProfilColor = (): string => {
    if (!user) return '#6b7280';
    const profil =
      PROFILS_FONCTIONNELS[user.profilFonctionnel as keyof typeof PROFILS_FONCTIONNELS];
    return profil?.color || '#6b7280';
  };

  const getRoleLabel = (): string => {
    if (!user) return '';
    const role = Object.values(ROLES_HIERARCHIQUES).find((r) => r.code === user.roleHierarchique);
    return role?.label || user.roleHierarchique;
  };

  // isLoading is true while user is not identified OR profile query is running
  const effectiveLoading = !userId || isLoading;

  const value: RBACContextValue = {
    user,
    isLoading: effectiveLoading,
    isAuthenticated: !!user,
    isAdmin,
    isDG,
    isCB,
    isDAF,
    isTresorerie,
    isAuditeur,
    isDirecteur,
    isOperateur,
    hierarchyLevel,
    isAgent,
    isChefService,
    isSousDirecteur,
    isDirecteurHierarchique,
    isDGHierarchique,
    canAccess,
    canValidate,
    canAccessData,
    canCreate,
    canExport,
    accessibleRoutes,
    getProfilLabel,
    getProfilColor,
    getRoleLabel,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

/**
 * Hook pour utiliser le contexte RBAC
 */
export function useRBAC(): RBACContextValue {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

/**
 * Hook simplifié pour vérifier rapidement les permissions
 */
export function useHasPermission() {
  const rbac = useRBAC();

  return {
    canAccess: rbac.canAccess,
    canValidate: rbac.canValidate,
    canCreate: rbac.canCreate,
    canExport: rbac.canExport,
    isAdmin: rbac.isAdmin,
    isDG: rbac.isDG,
    isCB: rbac.isCB,
    isDAF: rbac.isDAF,
    profile: rbac.user?.profilFonctionnel,
    role: rbac.user?.roleHierarchique,
    direction: rbac.user?.directionId,
  };
}

export default RBACContext;
