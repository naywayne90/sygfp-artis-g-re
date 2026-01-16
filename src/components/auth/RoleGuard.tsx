/**
 * RoleGuard - Composant de protection basé sur les rôles
 * Masque ou affiche du contenu selon les droits de l'utilisateur
 */

import { usePermissions } from "@/hooks/usePermissions";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { VALIDATION_MATRIX, type ValidationType } from "@/lib/config/rbac-config";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ============================================
// ROLE GUARD - Protection par rôle simple
// ============================================

interface RoleGuardProps {
  /** Rôle unique requis */
  role?: string;
  /** Liste de rôles (l'un des rôles suffit) */
  roles?: string[];
  /** Tous les rôles sont requis */
  requireAll?: boolean;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
  /** Afficher un message d'erreur au lieu de masquer */
  showDenied?: boolean;
  /** Message personnalisé pour le refus */
  deniedMessage?: string;
}

export function RoleGuard({
  role,
  roles,
  requireAll = false,
  children,
  fallback = null,
  showDenied = false,
  deniedMessage,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, isAdmin, isLoading } = usePermissions();

  // Loading state
  if (isLoading) {
    return null;
  }

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Vérification des rôles
  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles && roles.length > 0) {
    hasAccess = requireAll 
      ? roles.every(r => hasRole(r)) 
      : hasAnyRole(roles);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Afficher le message de refus
  if (showDenied) {
    return (
      <Alert variant="destructive" className="my-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Accès refusé</AlertTitle>
        <AlertDescription>
          {deniedMessage || `Vous devez avoir le rôle ${role || roles?.join(' ou ')} pour accéder à cette fonctionnalité.`}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{fallback}</>;
}

// ============================================
// VALIDATION GUARD - Protection par type de validation
// ============================================

interface ValidationGuardProps {
  /** Type d'entité à valider */
  entityType: ValidationType;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
  /** Afficher un badge indiquant le rôle requis */
  showRequiredRole?: boolean;
}

export function ValidationGuard({
  entityType,
  children,
  fallback = null,
  showRequiredRole = false,
}: ValidationGuardProps) {
  const { canValidateEntity, isLoading, isAdmin } = useRoleBasedAccess();

  if (isLoading) {
    return null;
  }

  const canValidate = isAdmin || canValidateEntity(entityType);

  if (canValidate) {
    return <>{children}</>;
  }

  if (showRequiredRole) {
    const rule = VALIDATION_MATRIX[entityType];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-muted-foreground cursor-not-allowed">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Rôle requis: {rule?.requiredRole}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{rule?.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

// ============================================
// VISIBILITY GUARD - Protection par niveau de visibilité
// ============================================

interface VisibilityGuardProps {
  /** ID de la direction de l'entité */
  entityDirectionId?: string | null;
  /** ID du créateur de l'entité */
  createdBy?: string | null;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
}

export function VisibilityGuard({
  entityDirectionId,
  createdBy,
  children,
  fallback = null,
}: VisibilityGuardProps) {
  const { canAccessEntity, isLoading, isAdmin } = useRoleBasedAccess();

  if (isLoading) {
    return null;
  }

  const canAccess = isAdmin || canAccessEntity({
    directionId: entityDirectionId,
    createdBy,
  });

  if (canAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================
// ACTION BUTTON GUARD - Protection des boutons d'action
// ============================================

interface ActionButtonGuardProps {
  /** Rôles autorisés */
  roles?: string[];
  /** Type de validation requis */
  validationType?: ValidationType;
  /** Contenu du bouton */
  children: React.ReactNode;
  /** Afficher le bouton désactivé au lieu de le masquer */
  showDisabled?: boolean;
  /** Tooltip quand désactivé */
  disabledTooltip?: string;
}

export function ActionButtonGuard({
  roles,
  validationType,
  children,
  showDisabled = false,
  disabledTooltip = "Vous n'avez pas les droits pour cette action",
}: ActionButtonGuardProps) {
  const { hasAnyRole, isAdmin, isLoading } = usePermissions();
  const { canValidateEntity } = useRoleBasedAccess();

  if (isLoading) {
    return null;
  }

  let hasAccess = isAdmin;

  if (!hasAccess && roles) {
    hasAccess = hasAnyRole(roles);
  }

  if (!hasAccess && validationType) {
    hasAccess = canValidateEntity(validationType);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed opacity-50">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              {disabledTooltip}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

// ============================================
// ROLE BADGE - Badge indicateur de rôle
// ============================================

interface RoleBadgeProps {
  roleCode: string;
  showLabel?: boolean;
}

export function RoleBadge({ roleCode, showLabel = true }: RoleBadgeProps) {
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-600 border-red-500/30',
    DG: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    CB: 'bg-green-500/10 text-green-600 border-green-500/30',
    DAAF: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    DIRECTEUR: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    TRESORERIE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    AUDITEUR: 'bg-stone-500/10 text-stone-600 border-stone-500/30',
    OPERATEUR: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    DG: 'Directeur Général',
    CB: 'Contrôleur Budgétaire',
    DAAF: 'DAF',
    DIRECTEUR: 'Directeur',
    TRESORERIE: 'Trésorerie',
    AUDITEUR: 'Auditeur',
    OPERATEUR: 'Opérateur',
  };

  const colorClass = roleColors[roleCode] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  const label = roleLabels[roleCode] || roleCode;

  return (
    <Badge variant="outline" className={`${colorClass} font-medium`}>
      {showLabel ? label : roleCode}
    </Badge>
  );
}

// ============================================
// ACCESS DENIED COMPONENT
// ============================================

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
}

export function AccessDenied({ 
  title = "Accès refusé", 
  message = "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
  requiredRole,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {requiredRole && (
        <Badge variant="outline" className="text-sm">
          Rôle requis: {requiredRole}
        </Badge>
      )}
    </div>
  );
}
