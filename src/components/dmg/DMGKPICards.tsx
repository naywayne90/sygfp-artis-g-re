import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, Banknote, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DMGKPIs } from '@/hooks/useDMGDashboard';

interface DMGKPICardsProps {
  kpis: DMGKPIs | undefined;
  isLoading: boolean;
  traiteesCount?: number;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

function AnimatedNumber({ value, duration = 1000, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(startValue + diff * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString('fr-FR')}</span>;
}

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading: boolean;
  pulse?: boolean;
}

function KPICard({
  title,
  value,
  subtitle,
  icon,
  colorClass,
  bgClass,
  trend,
  trendValue,
  isLoading,
  pulse = false,
}: KPICardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
      pulse && value > 0 && 'animate-pulse'
    )}>
      <div className={cn('absolute inset-0 opacity-10', bgClass)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-full', bgClass)}>
          <span className={colorClass}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <AnimatedNumber
              value={value}
              className={cn('text-3xl font-bold', colorClass)}
            />
          )}
          {trend && trendValue && (
            <span className={cn(
              'flex items-center text-xs font-medium',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
               trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              {trendValue}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DMGKPICards({ kpis, isLoading, traiteesCount = 0 }: DMGKPICardsProps) {
  const urgentesCount = kpis?.liquidations_urgentes?.count ?? 0;
  const attenteCount = kpis?.liquidations_attente?.count ?? 0;
  const montantTotal = kpis?.engagements_a_liquider?.montant ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Liquidations Urgentes */}
      <KPICard
        title="Liquidations Urgentes"
        value={urgentesCount}
        subtitle={urgentesCount > 0 ? 'Nécessitent une action immédiate' : 'Aucune urgence'}
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass="text-red-600"
        bgClass="bg-red-500"
        isLoading={isLoading}
        pulse={urgentesCount > 0}
      />

      {/* Liquidations À Traiter */}
      <KPICard
        title="À Traiter"
        value={attenteCount}
        subtitle="Liquidations en attente"
        icon={<Clock className="h-5 w-5" />}
        colorClass="text-orange-600"
        bgClass="bg-orange-500"
        isLoading={isLoading}
      />

      {/* Montant Total Engagé */}
      <KPICard
        title="Montant Engagé"
        value={Math.round(montantTotal / 1000000)}
        subtitle={`${(montantTotal / 1000000).toFixed(1)}M FCFA à liquider`}
        icon={<Banknote className="h-5 w-5" />}
        colorClass="text-blue-600"
        bgClass="bg-blue-500"
        isLoading={isLoading}
      />

      {/* Traitées ce mois */}
      <KPICard
        title="Traitées ce mois"
        value={traiteesCount}
        subtitle="Liquidations finalisées"
        icon={<CheckCircle className="h-5 w-5" />}
        colorClass="text-green-600"
        bgClass="bg-green-500"
        trend="up"
        trendValue="+12%"
        isLoading={isLoading}
      />
    </div>
  );
}

export default DMGKPICards;
