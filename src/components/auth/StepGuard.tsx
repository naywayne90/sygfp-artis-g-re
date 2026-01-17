/**
 * StepGuard - Composant de protection par étape de workflow
 * Masque ou affiche du contenu selon les droits de l'utilisateur pour une étape spécifique
 */

import { useRBACHelpers } from "@/hooks/useRBACHelpers";
import { ETAPES_CHAINE_DEPENSE, ETAPES_CONFIG, type EtapeChaineType } from "@/lib/config/sygfp-constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, ShieldAlert } from "lucide-react";
import type { EntityContext } from "@/lib/rbac/permissions";

// ============================================
// STEP ACTION GUARD - Protection des actions par étape
// ============================================

interface StepActionGuardProps {
  /** Étape de la chaîne de dépense */
  step: EtapeChaineType;
  /** Action à protéger */
  action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute';
  /** Statut actuel de l'entité (pour vérifier si l'action est possible) */
  statut?: string;
  /** Si true, l'utilisateur est le créateur de l'entité */
  isOwner?: boolean;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
  /** Afficher le bouton désactivé au lieu de le masquer */
  showDisabled?: boolean;
  /** Tooltip personnalisé quand désactivé */
  disabledTooltip?: string;
}

export function StepActionGuard({
  step,
  action,
  statut,
  isOwner = false,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip,
}: StepActionGuardProps) {
  const { 
    isLoading, 
    isAdmin,
    canValidateStep,
    canRejectStep,
    canDeferStep,
    canSubmitStep,
    canCreateStep,
    canSign,
    canExecute,
    getErrorMessage,
  } = useRBACHelpers();

  if (isLoading) {
    return null;
  }

  // Vérifier l'accès selon l'action
  let hasAccess = isAdmin;

  if (!hasAccess) {
    switch (action) {
      case 'validate':
        hasAccess = canValidateStep(step, statut);
        break;
      case 'reject':
        hasAccess = canRejectStep(step, statut);
        break;
      case 'defer':
        hasAccess = canDeferStep(step, statut);
        break;
      case 'submit':
        hasAccess = canSubmitStep(step, isOwner, statut);
        break;
      case 'create':
        hasAccess = canCreateStep(step);
        break;
      case 'sign':
        hasAccess = canSign && step === ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT;
        break;
      case 'execute':
        hasAccess = canExecute && step === ETAPES_CHAINE_DEPENSE.REGLEMENT;
        break;
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showDisabled) {
    const tooltip = disabledTooltip || getErrorMessage(step, action);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed opacity-50 inline-flex">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              {tooltip}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

// ============================================
// STEP VIEW GUARD - Protection de la vue par étape
// ============================================

interface StepViewGuardProps {
  /** Contexte de l'entité */
  entity: EntityContext;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
}

export function StepViewGuard({
  entity,
  children,
  fallback = null,
}: StepViewGuardProps) {
  const { isLoading, canViewDossier } = useRBACHelpers();

  if (isLoading) {
    return null;
  }

  if (canViewDossier(entity)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================
// STEP UPLOAD GUARD - Protection de l'upload par étape
// ============================================

interface StepUploadGuardProps {
  /** Contexte de l'entité */
  entity: EntityContext;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
  /** Afficher le bouton désactivé */
  showDisabled?: boolean;
}

export function StepUploadGuard({
  entity,
  children,
  fallback = null,
  showDisabled = false,
}: StepUploadGuardProps) {
  const { isLoading, canUploadPiece } = useRBACHelpers();

  if (isLoading) {
    return null;
  }

  if (canUploadPiece(entity)) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed opacity-50 inline-flex">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Vous ne pouvez pas ajouter de pièces à ce stade
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

// ============================================
// STEP EDIT GUARD - Protection de l'édition par étape
// ============================================

interface StepEditGuardProps {
  /** Contexte de l'entité */
  entity: EntityContext;
  /** Contenu à afficher si autorisé */
  children: React.ReactNode;
  /** Contenu de remplacement si non autorisé */
  fallback?: React.ReactNode;
  /** Afficher le bouton désactivé */
  showDisabled?: boolean;
}

export function StepEditGuard({
  entity,
  children,
  fallback = null,
  showDisabled = false,
}: StepEditGuardProps) {
  const { isLoading, canEditDossier } = useRBACHelpers();

  if (isLoading) {
    return null;
  }

  if (canEditDossier(entity)) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed opacity-50 inline-flex">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Ce dossier n'est plus modifiable
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

// ============================================
// STEP REQUIRED ROLE BADGE
// ============================================

interface StepRequiredRoleBadgeProps {
  /** Étape de la chaîne de dépense */
  step: EtapeChaineType;
  /** Action concernée */
  action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute';
}

export function StepRequiredRoleBadge({ step, action }: StepRequiredRoleBadgeProps) {
  const { getErrorMessage } = useRBACHelpers();
  const stepConfig = ETAPES_CONFIG[step];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="h-3 w-3" />
            {stepConfig?.labelCourt || step}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getErrorMessage(step, action)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// ACCESS DENIED FOR STEP
// ============================================

interface StepAccessDeniedProps {
  /** Étape de la chaîne de dépense */
  step: EtapeChaineType;
  /** Action concernée */
  action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute';
}

export function StepAccessDenied({ step, action }: StepAccessDeniedProps) {
  const { getErrorMessage } = useRBACHelpers();
  const stepConfig = ETAPES_CONFIG[step];
  
  return (
    <Alert variant="destructive" className="my-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Accès refusé</AlertTitle>
      <AlertDescription>
        {getErrorMessage(step, action)}
        <div className="mt-2">
          <Badge variant="outline">
            Étape : {stepConfig?.label || step}
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}
