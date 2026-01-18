/**
 * Hook RBAC complet
 * Combine profile utilisateur + rôles + permissions
 * Fournit les helpers: canCreate, canValidate, canExport, etc.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import type {
  ModuleCode,
  WorkflowStep,
  ProfilFonctionnel,
  RoleHierarchique,
  AppRole,
  UserProfile,
} from "@/lib/rbac/types";
import {
  CREATE_PERMISSIONS,
  VALIDATION_PERMISSIONS,
  EXPORT_PERMISSIONS,
  BYPASS_ROLES,
  BYPASS_PROFILS,
  PERMISSION_MESSAGES,
  ROLE_HIERARCHY_LEVELS,
} from "@/lib/rbac/config";

// ============================================
// TYPES INTERNES
// ============================================

interface RBACContext {
  // État
  isLoading: boolean;
  isAuthenticated: boolean;

  // Profil utilisateur
  userId: string | null;
  profile: UserProfile | null;
  roles: AppRole[];
  roleHierarchique: RoleHierarchique | null;
  profilFonctionnel: ProfilFonctionnel | null;
  directionId: string | null;

  // Flags pratiques
  isAdmin: boolean;
  isDG: boolean;
  isCB: boolean;
  isDAF: boolean;
  isTresorerie: boolean;
  isAuditeur: boolean;

  // Helpers de permission
  canCreate: (module: ModuleCode) => boolean;
  canValidate: (step: WorkflowStep) => boolean;
  canExport: (module: ModuleCode) => boolean;
  canRead: (module: ModuleCode) => boolean;
  canUpdate: (module: ModuleCode, createdBy?: string) => boolean;
  canDelete: (module: ModuleCode, createdBy?: string) => boolean;

  // Helpers de niveau hiérarchique
  hasMinLevel: (level: RoleHierarchique) => boolean;
  isAboveLevel: (level: RoleHierarchique) => boolean;

  // Helpers de rôle
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasProfil: (profil: ProfilFonctionnel) => boolean;

  // Helpers d'exercice
  canAccessExercice: (exercice: number) => boolean;

  // Messages d'erreur
  getErrorMessage: (action: keyof typeof PERMISSION_MESSAGES) => string;
  getRequiredRole: (step: WorkflowStep) => string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useRBAC(): RBACContext {
  const { exercice, isUserAdmin: exerciceAdmin } = useExercice();

  // Récupérer l'utilisateur authentifié
  const { data: authUser, isLoading: isLoadingAuth } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Récupérer le profil complet
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Erreur chargement profil:", error);
        return null;
      }

      return data as UserProfile;
    },
    enabled: !!authUser?.id,
  });

  // Récupérer les rôles actifs
  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["user-roles-rbac", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, is_active")
        .eq("user_id", authUser.id)
        .eq("is_active", true);

      if (error) {
        console.error("Erreur chargement rôles:", error);
        return [];
      }

      return data.map(r => r.role as AppRole);
    },
    enabled: !!authUser?.id,
  });

  // ============================================
  // VALEURS DÉRIVÉES
  // ============================================

  const isLoading = isLoadingAuth || isLoadingProfile || isLoadingRoles;
  const isAuthenticated = !!authUser;
  const roles = userRoles || [];
  const roleHierarchique = profile?.role_hierarchique || null;
  const profilFonctionnel = profile?.profil_fonctionnel || null;
  const directionId = profile?.direction_id || null;

  // Flags pratiques
  const isAdmin = roles.includes("ADMIN") ||
    profilFonctionnel === "Admin" ||
    exerciceAdmin;
  const isDG = roles.includes("DG") || roleHierarchique === "DG";
  const isCB = roles.includes("CB");
  const isDAF = roles.includes("DAAF") || roles.includes("DAF");
  const isTresorerie = roles.includes("TRESORERIE") || roles.includes("TRESORIER");
  const isAuditeur = roles.includes("AUDITOR") || profilFonctionnel === "Auditeur";

  // ============================================
  // HELPERS DE RÔLE
  // ============================================

  const hasRole = (role: AppRole): boolean => {
    if (isAdmin) return true;
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    if (isAdmin) return true;
    return checkRoles.some(r => roles.includes(r));
  };

  const hasProfil = (profil: ProfilFonctionnel): boolean => {
    if (isAdmin) return true;
    return profilFonctionnel === profil;
  };

  // ============================================
  // HELPERS DE NIVEAU HIÉRARCHIQUE
  // ============================================

  const hasMinLevel = (level: RoleHierarchique): boolean => {
    if (isAdmin) return true;
    if (!roleHierarchique) return false;

    const currentLevel = ROLE_HIERARCHY_LEVELS[roleHierarchique] || 0;
    const requiredLevel = ROLE_HIERARCHY_LEVELS[level] || 0;

    return currentLevel >= requiredLevel;
  };

  const isAboveLevel = (level: RoleHierarchique): boolean => {
    if (isAdmin) return true;
    if (!roleHierarchique) return false;

    const currentLevel = ROLE_HIERARCHY_LEVELS[roleHierarchique] || 0;
    const targetLevel = ROLE_HIERARCHY_LEVELS[level] || 0;

    return currentLevel > targetLevel;
  };

  // ============================================
  // HELPERS DE PERMISSION PAR MODULE
  // ============================================

  const canCreate = (module: ModuleCode): boolean => {
    if (isAdmin) return true;
    if (!profilFonctionnel) return false;

    const allowedProfils = CREATE_PERMISSIONS[module];
    if (!allowedProfils) return false;

    return allowedProfils.includes(profilFonctionnel);
  };

  const canExport = (module: ModuleCode): boolean => {
    if (isAdmin) return true;
    if (!profilFonctionnel) return false;

    const allowedProfils = EXPORT_PERMISSIONS[module];
    if (!allowedProfils) return false;

    return allowedProfils.includes(profilFonctionnel);
  };

  const canRead = (module: ModuleCode): boolean => {
    // Tous les utilisateurs authentifiés peuvent lire (RLS filtre)
    if (isAuthenticated) return true;
    return false;
  };

  const canUpdate = (module: ModuleCode, createdBy?: string): boolean => {
    if (isAdmin) return true;

    // Peut modifier si créateur ou profil autorisé à créer
    if (createdBy && createdBy === authUser?.id) return true;

    // Les validateurs peuvent aussi modifier dans certains cas
    if (profilFonctionnel === "Validateur" || profilFonctionnel === "Controleur") {
      return true;
    }

    return canCreate(module);
  };

  const canDelete = (module: ModuleCode, createdBy?: string): boolean => {
    if (isAdmin) return true;

    // Seul le créateur peut supprimer (et uniquement les brouillons)
    if (createdBy && createdBy === authUser?.id) return true;

    return false;
  };

  // ============================================
  // HELPERS DE VALIDATION PAR ÉTAPE
  // ============================================

  const canValidate = (step: WorkflowStep): boolean => {
    if (isAdmin) return true;

    const config = VALIDATION_PERMISSIONS[step];
    if (!config) return false;

    // Vérifier par rôle
    if (config.roles.some(r => roles.includes(r))) return true;

    // Vérifier par rôle hiérarchique
    if (config.roleHierarchique && roleHierarchique) {
      if (config.roleHierarchique.includes(roleHierarchique)) return true;
    }

    // Vérifier par profil fonctionnel
    if (config.profilFonctionnel && profilFonctionnel) {
      if (config.profilFonctionnel.includes(profilFonctionnel)) return true;
    }

    return false;
  };

  // ============================================
  // HELPERS D'EXERCICE
  // ============================================

  const canAccessExercice = (targetExercice: number): boolean => {
    if (isAdmin) return true;

    // Si l'utilisateur a un exercice_actif spécifique
    if (profile?.exercice_actif) {
      return profile.exercice_actif === targetExercice;
    }

    // Sinon, accès à tous les exercices (RLS filtre côté serveur)
    return true;
  };

  // ============================================
  // MESSAGES D'ERREUR
  // ============================================

  const getErrorMessage = (action: keyof typeof PERMISSION_MESSAGES): string => {
    return PERMISSION_MESSAGES[action] || "Action non autorisée";
  };

  const getRequiredRole = (step: WorkflowStep): string => {
    const config = VALIDATION_PERMISSIONS[step];
    if (!config) return "Administrateur";

    // Retourner le premier rôle autorisé
    const roleLabels: Partial<Record<AppRole, string>> = {
      DG: "Directeur Général",
      CB: "Contrôleur Budgétaire",
      DAAF: "DAAF",
      TRESORERIE: "Trésorerie",
      ADMIN: "Administrateur",
    };

    return roleLabels[config.roles[0]] || config.roles[0];
  };

  // ============================================
  // RETURN
  // ============================================

  return {
    // État
    isLoading,
    isAuthenticated,

    // Profil
    userId: authUser?.id || null,
    profile,
    roles,
    roleHierarchique,
    profilFonctionnel,
    directionId,

    // Flags
    isAdmin,
    isDG,
    isCB,
    isDAF,
    isTresorerie,
    isAuditeur,

    // Helpers permission
    canCreate,
    canValidate,
    canExport,
    canRead,
    canUpdate,
    canDelete,

    // Helpers niveau
    hasMinLevel,
    isAboveLevel,

    // Helpers rôle
    hasRole,
    hasAnyRole,
    hasProfil,

    // Helpers exercice
    canAccessExercice,

    // Messages
    getErrorMessage,
    getRequiredRole,
  };
}

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default useRBAC;
