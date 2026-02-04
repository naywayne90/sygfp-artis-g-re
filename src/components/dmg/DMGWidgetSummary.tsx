import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { useDMGDashboard } from '@/hooks/useDMGDashboard';
import { cn } from '@/lib/utils';

interface DMGWidgetSummaryProps {
  className?: string;
}

export function DMGWidgetSummary({ className }: DMGWidgetSummaryProps) {
  const { data, isLoading, isError } = useDMGDashboard();

  const urgentCount = data?.kpis?.liquidations_urgentes?.count ?? 0;
  const criticalCount = data?.alertes_critical_count ?? 0;
  const attenteCount = data?.kpis?.liquidations_attente?.count ?? 0;

  if (isError) {
    return null; // Don't show widget on error
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Gradient accent bar for critical alerts */}
      {criticalCount > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className={cn(
              'h-4 w-4',
              criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'
            )} />
            Suivi DMG
          </CardTitle>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/30">
                <p className={cn(
                  'text-lg font-bold',
                  urgentCount > 0 ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {urgentCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Urgentes</p>
              </div>
              <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/30">
                <p className={cn(
                  'text-lg font-bold',
                  attenteCount > 0 ? 'text-orange-600' : 'text-muted-foreground'
                )}>
                  {attenteCount}
                </p>
                <p className="text-[10px] text-muted-foreground">En attente</p>
              </div>
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30">
                <p className="text-lg font-bold text-blue-600">
                  {data?.top_fournisseurs?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Fournisseurs</p>
              </div>
            </div>

            {/* Status message */}
            {criticalCount > 0 ? (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} à traiter
              </p>
            ) : urgentCount > 0 || attenteCount > 0 ? (
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Des liquidations nécessitent votre attention
              </p>
            ) : (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Toutes les liquidations sont dans les délais
              </p>
            )}

            {/* Action button */}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dashboard-dmg" className="flex items-center justify-center gap-2">
                Voir le dashboard DMG
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DMGWidgetSummary;
