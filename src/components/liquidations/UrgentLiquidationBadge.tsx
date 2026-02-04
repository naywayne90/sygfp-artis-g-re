/**
 * UrgentLiquidationBadge - Badge visuel pour liquidation urgente
 * Badge rouge clignotant avec tooltip affichant motif, date et auteur
 */

import { Flame, Clock, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UrgentLiquidationBadgeProps {
  /** Motif de l'urgence */
  motif?: string | null;
  /** Date du marquage */
  date?: string | null;
  /** Nom de l'utilisateur qui a marqué */
  marqueParNom?: string | null;
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mode d'affichage */
  variant?: 'badge' | 'dot' | 'icon' | 'full';
  /** Animation clignotante */
  animate?: boolean;
  /** Afficher le détail au hover */
  showDetails?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function UrgentLiquidationBadge({
  motif,
  date,
  marqueParNom,
  size = 'md',
  variant = 'badge',
  animate = true,
  showDetails = true,
  className,
}: UrgentLiquidationBadgeProps) {
  // Tailles
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const badgeSizes = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  // Formater la date
  const formattedDate = date
    ? format(new Date(date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;
  const relativeDate = date
    ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
    : null;

  // Contenu du tooltip/hover
  const detailContent = (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-medium text-red-600">
        <Flame className="h-4 w-4" />
        Règlement urgent
      </div>
      {motif && (
        <div className="text-sm">
          <span className="text-muted-foreground">Motif: </span>
          <span>{motif}</span>
        </div>
      )}
      {date && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formattedDate}</span>
          <span className="text-muted-foreground/50">({relativeDate})</span>
        </div>
      )}
      {marqueParNom && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Marqué par {marqueParNom}</span>
        </div>
      )}
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Dot
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === 'dot') {
    const dot = (
      <span
        className={cn(
          'inline-block rounded-full bg-red-500',
          dotSizes[size],
          animate && 'animate-pulse',
          className
        )}
      />
    );

    if (!showDetails) return dot;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{dot}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {detailContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Icon
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === 'icon') {
    const icon = (
      <Flame
        className={cn(
          'text-red-500',
          iconSizes[size],
          animate && 'animate-pulse',
          className
        )}
      />
    );

    if (!showDetails) return icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{icon}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {detailContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Full (badge avec détails au hover)
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === 'full') {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Badge
            variant="destructive"
            className={cn(
              'gap-1 cursor-help',
              badgeSizes[size],
              animate && 'animate-pulse',
              className
            )}
          >
            <Flame className={iconSizes[size]} />
            RÈGLEMENT URGENT
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" side="bottom" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <Flame className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-600">Règlement urgent</h4>
                <p className="text-xs text-muted-foreground">
                  Traitement prioritaire demandé
                </p>
              </div>
            </div>

            {motif && (
              <div className="p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Motif:</p>
                <p className="text-sm">{motif}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
              {date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{relativeDate}</span>
                </div>
              )}
              {marqueParNom && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{marqueParNom}</span>
                </div>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Badge (default)
  // ────────────────────────────────────────────────────────────────────────────

  const badge = (
    <Badge
      variant="destructive"
      className={cn(
        'gap-1',
        badgeSizes[size],
        animate && 'animate-pulse',
        className
      )}
    >
      <Flame className={iconSizes[size]} />
      URGENT
    </Badge>
  );

  if (!showDetails) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {detailContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// COMPOSANT: Indicateur sidebar
// ============================================================================

export interface UrgentIndicatorProps {
  /** Nombre d'urgences */
  count: number;
  /** Classe CSS */
  className?: string;
}

export function UrgentSidebarIndicator({ count, className }: UrgentIndicatorProps) {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse',
              className
            )}
          >
            <Flame className="h-3 w-3" />
            <span>{count}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {count} liquidation{count > 1 ? 's' : ''} urgente{count > 1 ? 's' : ''} en attente
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default UrgentLiquidationBadge;
