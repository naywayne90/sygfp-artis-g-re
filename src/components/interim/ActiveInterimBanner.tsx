/**
 * ActiveInterimBanner - Bannière affichée quand l'utilisateur agit en intérim
 * Se place généralement en haut de la page ou dans la sidebar
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveInterim } from '@/hooks/useInterim';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

export interface ActiveInterimBannerProps {
  /** Classe CSS additionnelle */
  className?: string;
  /** Style compact (pour sidebar) */
  compact?: boolean;
  /** Peut être fermé temporairement */
  dismissible?: boolean;
  /** Callback quand fermé */
  onDismiss?: () => void;
  /** Variante de style */
  variant?: 'default' | 'warning' | 'info';
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ActiveInterimBanner({
  className,
  compact = false,
  dismissible = false,
  onDismiss,
  variant = 'warning',
}: ActiveInterimBannerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: activeInterim, isLoading } = useActiveInterim();

  // Ne rien afficher si pas d'intérim actif ou en chargement
  if (isLoading || !activeInterim || isDismissed) {
    return null;
  }

  const { titulaire_nom, date_fin } = activeInterim;
  const dateFinObj = new Date(date_fin);
  const joursRestants = differenceInDays(dateFinObj, new Date());
  const dateFinFormatted = format(dateFinObj, 'dd MMMM yyyy', { locale: fr });

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const variantClasses = {
    default: 'border-amber-300 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700',
    warning: 'border-orange-300 bg-orange-50 dark:bg-orange-950/50 dark:border-orange-700',
    info: 'border-blue-300 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700',
  };

  const iconClasses = {
    default: 'text-amber-600 dark:text-amber-400',
    warning: 'text-orange-600 dark:text-orange-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  // Version compacte pour sidebar
  if (compact) {
    return (
      <div
        className={cn(
          'rounded-lg border p-3 cursor-pointer transition-all',
          variantClasses[variant],
          className
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className={cn('h-4 w-4', iconClasses[variant])} />
            <span className="text-sm font-medium">Intérim actif</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-current/10 space-y-1">
            <p className="text-xs text-muted-foreground">
              Vous agissez pour le compte de
            </p>
            <p className="text-sm font-semibold">{titulaire_nom}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>Jusqu'au {dateFinFormatted}</span>
            </div>
            {joursRestants <= 3 && joursRestants >= 0 && (
              <Badge variant="destructive" className="text-[10px] mt-1">
                {joursRestants === 0
                  ? "Dernier jour"
                  : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // Version standard (bannière large)
  return (
    <Alert
      className={cn(
        'relative',
        variantClasses[variant],
        className
      )}
    >
      <UserCheck className={cn('h-5 w-5', iconClasses[variant])} />
      <AlertTitle className="flex items-center gap-2">
        <span>Vous agissez en intérim</span>
        <Badge variant="outline" className="font-semibold border-current/30">
          P.O.
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1">
            <p>
              Vous représentez <span className="font-semibold">{titulaire_nom}</span> et
              pouvez effectuer des validations en son nom.
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Jusqu'au {dateFinFormatted}</span>
              </div>
              {joursRestants <= 7 && joursRestants >= 0 && (
                <Badge
                  variant={joursRestants <= 3 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {joursRestants === 0
                    ? "Dernier jour"
                    : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`}
                </Badge>
              )}
            </div>
          </div>

          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              Masquer
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// VARIANTES PRÉ-CONFIGURÉES
// ============================================================================

/**
 * Bannière pour la page d'accueil/dashboard
 */
export function InterimDashboardBanner({ className }: { className?: string }) {
  return (
    <ActiveInterimBanner
      className={className}
      variant="warning"
      dismissible={true}
    />
  );
}

/**
 * Bannière compacte pour la sidebar
 */
export function InterimSidebarBanner({ className }: { className?: string }) {
  return (
    <ActiveInterimBanner
      className={className}
      compact={true}
      variant="info"
    />
  );
}

/**
 * Indicateur minimaliste (juste un point + tooltip)
 */
export function InterimIndicator({ className }: { className?: string }) {
  const { data: activeInterim, isLoading } = useActiveInterim();

  if (isLoading || !activeInterim) return null;

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      title={`Intérim pour ${activeInterim.titulaire_nom}`}
    >
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
        P.O.
      </span>
    </div>
  );
}

export default ActiveInterimBanner;
