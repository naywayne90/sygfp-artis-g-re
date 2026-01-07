import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDelegationBadge?: boolean;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  showDelegationBadge = false,
}: PermissionGuardProps) {
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

// Hook helper pour utiliser les permissions dans la logique
export function usePermissionCheck() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isViaDelegation, isLoading, isAdmin } = usePermissions();

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

  return {
    canPerform,
    canPerformAny,
    isViaDelegation,
    isLoading,
    isAdmin,
  };
}
