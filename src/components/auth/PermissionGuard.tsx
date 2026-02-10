// @ts-nocheck
/**
 * PermissionGuard - Composant de protection basé sur les permissions
 *
 * Supporte deux modes :
 * 1. Mode legacy : permission/permissions (string-based)
 * 2. Mode RBAC : module/step/action (type-safe)
 *
 * Règle : "l'UI n'affiche jamais un bouton interdit"
 */

import { usePermissions } from "@/hooks/usePermissions";
import { useRBAC } from "@/hooks/useRBAC";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ModuleCode, WorkflowStep, AppRole, ProfilFonctionnel, RoleHierarchique } from "@/lib/rbac/types";

// ============================================
// TYPES
// ============================================

type PermissionAction = "create" | "read" | "update" | "delete" | "validate" | "export";

// Legacy props (backward compatibility)
interface LegacyPermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDelegationBadge?: boolean;
  // New RBAC props not used
  module?: never;
  step?: never;
  action?: never;
  createdBy?: never;
  requireRole?: never;
  requireAnyRole?: never;
  requireProfil?: never;
  requireMinLevel?: never;
  adminOnly?: never;
  showDisabled?: never;
  disabledMessage?: never;
}

// RBAC Module props
interface ModulePermissionGuardProps {
  module: ModuleCode;
  action: Exclude<PermissionAction, "validate">;
  createdBy?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
  disabledMessage?: string;
  // Legacy props not used
  permission?: never;
  permissions?: never;
  requireAll?: never;
  showDelegationBadge?: never;
  step?: never;
  requireRole?: never;
  requireAnyRole?: never;
  requireProfil?: never;
  requireMinLevel?: never;
  adminOnly?: never;
}

// RBAC Step props
interface StepPermissionGuardProps {
  step: WorkflowStep;
  action: "validate";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
  disabledMessage?: string;
  // Legacy props not used
  permission?: never;
  permissions?: never;
  requireAll?: never;
  showDelegationBadge?: never;
  module?: never;
  createdBy?: never;
  requireRole?: never;
  requireAnyRole?: never;
  requireProfil?: never;
  requireMinLevel?: never;
  adminOnly?: never;
}

// RBAC Role/Profil props
interface RolePermissionGuardProps {
  requireRole?: AppRole;
  requireAnyRole?: AppRole[];
  requireProfil?: ProfilFonctionnel;
  requireMinLevel?: RoleHierarchique;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
  disabledMessage?: string;
  // Legacy props not used
  permission?: never;
  permissions?: never;
  requireAll?: never;
  showDelegationBadge?: never;
  module?: never;
  step?: never;
  action?: never;
  createdBy?: never;
  adminOnly?: never;
}

// Admin only props
interface AdminOnlyGuardProps {
  adminOnly: true;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
  disabledMessage?: string;
  // Legacy props not used
  permission?: never;
  permissions?: never;
  requireAll?: never;
  showDelegationBadge?: never;
  module?: never;
  step?: never;
  action?: never;
  createdBy?: never;
  requireRole?: never;
  requireAnyRole?: never;
  requireProfil?: never;
  requireMinLevel?: never;
}

type PermissionGuardProps =
  | LegacyPermissionGuardProps
  | ModulePermissionGuardProps
  | StepPermissionGuardProps
  | RolePermissionGuardProps
  | AdminOnlyGuardProps;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function PermissionGuard(props: PermissionGuardProps) {
  const {
    _children,
    _fallback = null,
  } = props;

  // Detect if using legacy mode
  const isLegacyMode = "permission" in props || "permissions" in props;

  if (isLegacyMode) {
    return <LegacyPermissionGuard {...props as LegacyPermissionGuardProps} />;
  }

  return <RBACPermissionGuard {...props} />;
}

// ============================================
// LEGACY MODE (backward compatibility)
// ============================================

function LegacyPermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  showDelegationBadge = false,
}: LegacyPermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isViaDelegation, isLoading, isAdmin } = usePermissions();

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Still loading permissions
  if (isLoading) {
    return null;
  }

  let hasAccess = false;
  let isDelegated = false;

  if (permission) {
    hasAccess = hasPermission(permission);
    isDelegated = isViaDelegation(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    isDelegated = permissions.some((p) => isViaDelegation(p));
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  if (showDelegationBadge && isDelegated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1">
              {children}
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                Délég.
              </Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Action effectuée via délégation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{children}</>;
}

// ============================================
// RBAC MODE (new type-safe mode)
// ============================================

function RBACPermissionGuard(props: Exclude<PermissionGuardProps, LegacyPermissionGuardProps>) {
  const {
    children,
    fallback = null,
    showDisabled = false,
    disabledMessage = "Vous n'avez pas les droits pour cette action",
  } = props;

  const rbac = useRBAC();

  // Loading state
  if (rbac.isLoading) {
    return null;
  }

  // Calculate permission
  let hasPermission = false;

  if ("adminOnly" in props && props.adminOnly) {
    hasPermission = rbac.isAdmin;
  } else if ("requireRole" in props && props.requireRole) {
    hasPermission = rbac.hasRole(props.requireRole);
  } else if ("requireAnyRole" in props && props.requireAnyRole) {
    hasPermission = rbac.hasAnyRole(props.requireAnyRole);
  } else if ("requireProfil" in props && props.requireProfil) {
    hasPermission = rbac.hasProfil(props.requireProfil);
  } else if ("requireMinLevel" in props && props.requireMinLevel) {
    hasPermission = rbac.hasMinLevel(props.requireMinLevel);
  } else if ("step" in props && props.step && props.action === "validate") {
    hasPermission = rbac.canValidate(props.step);
  } else if ("module" in props && props.module) {
    const { module, action, createdBy } = props;
    switch (action) {
      case "create":
        hasPermission = rbac.canCreate(module);
        break;
      case "read":
        hasPermission = rbac.canRead(module);
        break;
      case "update":
        hasPermission = rbac.canUpdate(module, createdBy);
        break;
      case "delete":
        hasPermission = rbac.canDelete(module, createdBy);
        break;
      case "export":
        hasPermission = rbac.canExport(module);
        break;
      default:
        hasPermission = false;
    }
  }

  // Permission granted
  if (hasPermission) {
    return <>{children}</>;
  }

  // Show disabled with tooltip
  if (showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              <span className="pointer-events-none opacity-50">
                {children}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Return fallback (hidden by default)
  return <>{fallback}</>;
}

// ============================================
// COMPOSANTS UTILITAIRES
// ============================================

/**
 * Affiche les enfants uniquement pour les admins
 */
export function AdminOnly({
  children,
  fallback = null,
  showDisabled = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  return (
    <PermissionGuard
      adminOnly
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage="Réservé aux administrateurs"
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Affiche les enfants uniquement pour les validateurs d'une étape
 */
export function ValidatorOnly({
  step,
  children,
  fallback = null,
  showDisabled = false,
}: {
  step: WorkflowStep;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  const rbac = useRBAC();
  return (
    <PermissionGuard
      step={step}
      action="validate"
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage={`Validation réservée à : ${rbac.getRequiredRole(step)}`}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Affiche les enfants uniquement si l'utilisateur peut créer dans le module
 */
export function CanCreate({
  module,
  children,
  fallback = null,
  showDisabled = false,
}: {
  module: ModuleCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  return (
    <PermissionGuard
      module={module}
      action="create"
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage="Vous n'avez pas les droits pour créer"
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Affiche les enfants uniquement si l'utilisateur peut exporter le module
 */
export function CanExport({
  module,
  children,
  fallback = null,
  showDisabled = false,
}: {
  module: ModuleCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  return (
    <PermissionGuard
      module={module}
      action="export"
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage="Vous n'avez pas les droits pour exporter"
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Affiche les enfants uniquement pour le DG ou supérieur
 */
export function DGOnly({
  children,
  fallback = null,
  showDisabled = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  return (
    <PermissionGuard
      requireMinLevel="DG"
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage="Réservé au Directeur Général"
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Affiche les enfants uniquement pour les Directeurs ou supérieurs
 */
export function DirectorOrAbove({
  children,
  fallback = null,
  showDisabled = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  return (
    <PermissionGuard
      requireMinLevel="Directeur"
      fallback={fallback}
      showDisabled={showDisabled}
      disabledMessage="Réservé aux Directeurs et DG"
    >
      {children}
    </PermissionGuard>
  );
}

// ============================================
// HOOKS HELPER
// ============================================

// Hook helper pour utiliser les permissions dans la logique (legacy)
export function usePermissionCheck() {
  const { hasPermission, hasAnyPermission, _hasAllPermissions, isViaDelegation, isLoading, isAdmin } = usePermissions();
  const rbac = useRBAC();

  const canPerform = (permission: string): boolean => {
    if (isAdmin) return true;
    if (isLoading) return false;
    return hasPermission(permission);
  };

  const canPerformAny = (permissions: string[]): boolean => {
    if (isAdmin) return true;
    if (isLoading) return false;
    return hasAnyPermission(permissions);
  };

  // New RBAC-based checks
  const checkModuleAction = (
    module: ModuleCode,
    action: Exclude<PermissionAction, "validate">,
    createdBy?: string
  ): boolean => {
    switch (action) {
      case "create":
        return rbac.canCreate(module);
      case "read":
        return rbac.canRead(module);
      case "update":
        return rbac.canUpdate(module, createdBy);
      case "delete":
        return rbac.canDelete(module, createdBy);
      case "export":
        return rbac.canExport(module);
      default:
        return false;
    }
  };

  return {
    // Legacy
    canPerform,
    canPerformAny,
    isViaDelegation,
    isLoading,
    isAdmin,
    // RBAC
    checkModuleAction,
    canCreate: rbac.canCreate,
    canValidate: rbac.canValidate,
    canExport: rbac.canExport,
    canUpdate: rbac.canUpdate,
    canDelete: rbac.canDelete,
    hasRole: rbac.hasRole,
    hasAnyRole: rbac.hasAnyRole,
    hasProfil: rbac.hasProfil,
    hasMinLevel: rbac.hasMinLevel,
  };
}
