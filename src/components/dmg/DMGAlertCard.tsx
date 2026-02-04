import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Building2,
  ExternalLink,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DMGAlerte } from '@/hooks/useDMGDashboard';

interface DMGAlertCardProps {
  alerte: DMGAlerte;
  onAction?: (alerteId: string, action: 'view' | 'resolve' | 'dismiss') => void;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-600',
    badgeVariant: 'destructive' as const,
    badgeClass: '',
    label: 'Critique',
    pulse: true,
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800',
    iconClass: 'text-orange-600',
    badgeVariant: 'outline' as const,
    badgeClass: 'border-orange-300 text-orange-700 bg-orange-100/50',
    label: 'Attention',
    pulse: false,
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600',
    badgeVariant: 'secondary' as const,
    badgeClass: '',
    label: 'Info',
    pulse: false,
  },
};

export function DMGAlertCard({ alerte, onAction }: DMGAlertCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = severityConfig[alerte.severite] || severityConfig.info;
  const Icon = config.icon;

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant) + ' FCFA';
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        config.bgClass,
        config.borderClass,
        'border',
        isHovered && 'shadow-lg scale-[1.01]',
        config.pulse && 'animate-pulse'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Indicator bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          alerte.severite === 'critical' && 'bg-red-500',
          alerte.severite === 'warning' && 'bg-orange-500',
          alerte.severite === 'info' && 'bg-blue-500'
        )}
      />

      <CardHeader className="pb-2 pl-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', config.bgClass)}>
              <Icon className={cn('h-5 w-5', config.iconClass)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{alerte.reference}</span>
                <Badge variant={config.badgeVariant} className={cn('text-xs', config.badgeClass)}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alerte.type === 'liquidation_urgente' ? 'Liquidation urgente' : 'Engagement en attente'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2 pl-4">
        <p className="text-sm text-foreground/80 mb-3">{alerte.message}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{alerte.fournisseur}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatMontant(alerte.montant)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pl-4 gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onAction?.(alerte.entity_id, 'view')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Voir détails
        </Button>
        {alerte.severite === 'critical' && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => onAction?.(alerte.entity_id, 'resolve')}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Traiter
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Liste d'alertes
interface DMGAlertListProps {
  alertes: DMGAlerte[];
  onAction?: (alerteId: string, action: 'view' | 'resolve' | 'dismiss') => void;
  maxItems?: number;
}

export function DMGAlertList({ alertes, onAction, maxItems }: DMGAlertListProps) {
  const displayAlertes = maxItems ? alertes.slice(0, maxItems) : alertes;
  const criticalCount = alertes.filter(a => a.severite === 'critical').length;
  const warningCount = alertes.filter(a => a.severite === 'warning').length;

  if (alertes.length === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
            Aucune alerte active
          </h3>
          <p className="text-sm text-green-600 dark:text-green-500">
            Toutes les liquidations sont dans les délais
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex gap-2">
        {criticalCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {criticalCount} critique{criticalCount > 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700 bg-orange-100/50">
            <AlertCircle className="h-3 w-3" />
            {warningCount} attention
          </Badge>
        )}
      </div>

      {/* Alert cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayAlertes.map((alerte) => (
          <DMGAlertCard
            key={alerte.entity_id}
            alerte={alerte}
            onAction={onAction}
          />
        ))}
      </div>

      {maxItems && alertes.length > maxItems && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            Voir les {alertes.length - maxItems} autres alertes
          </Button>
        </div>
      )}
    </div>
  );
}

export default DMGAlertCard;
