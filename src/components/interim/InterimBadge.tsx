/**
 * InterimBadge - Badge "P.O." (Par Ordre)
 * Indique qu'un utilisateur agit en intérim pour quelqu'un d'autre
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InterimBadgeProps {
  /** Nom du titulaire remplacé */
  titulaireName: string;
  /** Date de fin de l'intérim */
  dateFin?: string;
  /** Variante de style */
  variant?: 'default' | 'outline' | 'subtle';
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS additionnelle */
  className?: string;
  /** Afficher l'icône */
  showIcon?: boolean;
  /** Afficher le texte complet */
  showFullText?: boolean;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function InterimBadge({
  titulaireName,
  dateFin,
  variant = 'default',
  size = 'md',
  className,
  showIcon = true,
  showFullText = false,
}: InterimBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const variantClasses = {
    default: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
    outline: 'bg-transparent border-amber-500 text-amber-700 dark:text-amber-400',
    subtle: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  };

  const badgeContent = (
    <Badge
      className={cn(
        'font-semibold gap-1 cursor-help',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <UserCheck className={iconSizes[size]} />}
      {showFullText ? `P.O. ${titulaireName}` : 'P.O.'}
    </Badge>
  );

  const tooltipContent = (
    <div className="text-center max-w-xs">
      <p className="font-medium">Par Ordre</p>
      <p className="text-xs text-muted-foreground mt-1">
        Agissant pour le compte de <span className="font-medium">{titulaireName}</span>
      </p>
      {dateFin && (
        <p className="text-xs text-muted-foreground mt-1">
          Jusqu'au {new Date(dateFin).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// VARIANTES PRÉ-CONFIGURÉES
// ============================================================================

/**
 * Badge compact pour les en-têtes et tableaux
 */
export function InterimBadgeCompact({
  titulaireName,
  dateFin,
  className,
}: Pick<InterimBadgeProps, 'titulaireName' | 'dateFin' | 'className'>) {
  return (
    <InterimBadge
      titulaireName={titulaireName}
      dateFin={dateFin}
      variant="subtle"
      size="sm"
      showIcon={false}
      className={className}
    />
  );
}

/**
 * Badge visible pour les signatures et validations
 */
export function InterimBadgeSignature({
  titulaireName,
  dateFin,
  className,
}: Pick<InterimBadgeProps, 'titulaireName' | 'dateFin' | 'className'>) {
  return (
    <InterimBadge
      titulaireName={titulaireName}
      dateFin={dateFin}
      variant="default"
      size="md"
      showIcon={true}
      showFullText={true}
      className={className}
    />
  );
}

export default InterimBadge;
