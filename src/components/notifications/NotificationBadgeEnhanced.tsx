/**
 * NotificationBadgeEnhanced - Badge de notification avec distinction visuelle
 * Animation pour notifications critiques, tooltip avec aperçu
 */

import { useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  X,
  FileCheck,
  CreditCard,
  Receipt,
  Clock,
  AlertTriangle,
  User,
  Banknote,
  FileText,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationBadgeType =
  | 'validation'
  | 'rejet'
  | 'differe'
  | 'piece_manquante'
  | 'alerte'
  | 'info'
  | 'echeance'
  | 'budget_insuffisant'
  | 'assignation'
  | 'ordonnancement'
  | 'reglement'
  | 'reglement_partiel'
  | 'note_soumise'
  | 'note_validee'
  | 'note_rejetee'
  | 'engagement_cree'
  | 'liquidation_validee'
  | 'dossier_a_valider';

export interface NotificationBadgeEnhancedProps {
  /** Type de notification */
  type: NotificationBadgeType | string;
  /** Texte à afficher (optionnel) */
  label?: string;
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher l'icône */
  showIcon?: boolean;
  /** Animation pour notification critique */
  animate?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
  /** Nombre (pour compteur) */
  count?: number;
  /** Afficher comme point/dot */
  dot?: boolean;
}

export interface NotificationPreviewProps {
  /** Titre de la notification */
  title: string;
  /** Message */
  message: string;
  /** Type */
  type: string;
  /** Date de création */
  createdAt: string;
  /** Est urgente */
  isUrgent?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  validation: {
    icon: <Bell className="h-3 w-3" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
    label: 'Validation',
  },
  rejet: {
    icon: <X className="h-3 w-3" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    label: 'Rejeté',
  },
  differe: {
    icon: <Clock className="h-3 w-3" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700',
    label: 'Différé',
  },
  piece_manquante: {
    icon: <FileText className="h-3 w-3" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
    label: 'Pièce manquante',
  },
  alerte: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700',
    label: 'Alerte',
  },
  info: {
    icon: <Bell className="h-3 w-3" />,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-muted-foreground/30',
    label: 'Information',
  },
  echeance: {
    icon: <Clock className="h-3 w-3" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
    label: 'Échéance',
  },
  budget_insuffisant: {
    icon: <Banknote className="h-3 w-3" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    label: 'Budget insuffisant',
  },
  assignation: {
    icon: <User className="h-3 w-3" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
    label: 'Assignation',
  },
  ordonnancement: {
    icon: <FileCheck className="h-3 w-3" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
    label: 'Ordonnancement',
  },
  reglement: {
    icon: <CreditCard className="h-3 w-3" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
    label: 'Règlement',
  },
  reglement_partiel: {
    icon: <Receipt className="h-3 w-3" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
    label: 'Règlement partiel',
  },
  note_soumise: {
    icon: <FileText className="h-3 w-3" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700',
    label: 'Note soumise',
  },
  note_validee: {
    icon: <CheckCheck className="h-3 w-3" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
    label: 'Note validée',
  },
  note_rejetee: {
    icon: <X className="h-3 w-3" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    label: 'Note rejetée',
  },
  engagement_cree: {
    icon: <FileText className="h-3 w-3" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
    label: 'Engagement créé',
  },
  liquidation_validee: {
    icon: <Receipt className="h-3 w-3" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
    label: 'Liquidation validée',
  },
  dossier_a_valider: {
    icon: <FileText className="h-3 w-3" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
    label: 'Dossier à valider',
  },
};

const DEFAULT_CONFIG = {
  icon: <Bell className="h-3 w-3" />,
  color: 'text-muted-foreground',
  bgColor: 'bg-muted border-muted-foreground/30',
  label: 'Notification',
};

// ============================================================================
// COMPOSANT: NotificationBadgeEnhanced
// ============================================================================

export function NotificationBadgeEnhanced({
  type,
  label,
  size = 'md',
  showIcon = true,
  animate = false,
  className,
  count,
  dot = false,
}: NotificationBadgeEnhancedProps) {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  // Mode point/dot
  if (dot) {
    return (
      <span
        className={cn(
          'inline-block rounded-full',
          size === 'sm' && 'h-1.5 w-1.5',
          size === 'md' && 'h-2 w-2',
          size === 'lg' && 'h-3 w-3',
          config.color.replace('text-', 'bg-'),
          animate && 'animate-pulse',
          className
        )}
      />
    );
  }

  // Mode compteur uniquement
  if (count !== undefined) {
    return (
      <Badge
        variant="destructive"
        className={cn(
          'font-semibold',
          sizeClasses[size],
          animate && 'animate-pulse',
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    );
  }

  // Mode badge complet
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium border',
        sizeClasses[size],
        config.bgColor,
        config.color,
        animate && 'animate-bounce-subtle',
        className
      )}
    >
      {showIcon && (
        <span className={cn(iconSizes[size], 'shrink-0')}>
          {config.icon}
        </span>
      )}
      {label || config.label}
    </Badge>
  );
}

// ============================================================================
// COMPOSANT: NotificationPreviewTooltip
// ============================================================================

export function NotificationPreviewTooltip({
  title,
  message,
  type,
  createdAt,
  isUrgent,
  children,
}: NotificationPreviewProps & { children: React.ReactNode }) {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-0 overflow-hidden">
          <div className={cn('p-3 border-l-4', config.bgColor.split(' ')[0], config.color.replace('text-', 'border-l-'))}>
            <div className="flex items-start gap-2">
              <span className={cn('shrink-0 mt-0.5', config.color)}>{config.icon}</span>
              <div className="min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  {title}
                  {isUrgent && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0">
                      Urgent
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// COMPOSANT: NotificationTypeBadge - Version simplifiée pour les listes
// ============================================================================

export function NotificationTypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', config.color)}>
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}

// ============================================================================
// HOOK: Obtenir la configuration d'un type
// ============================================================================

export function useNotificationTypeConfig(type: string) {
  return useMemo(() => TYPE_CONFIG[type] || DEFAULT_CONFIG, [type]);
}

export default NotificationBadgeEnhanced;
