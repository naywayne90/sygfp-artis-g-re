import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowRight, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BudgetExerciceTotals } from '@/hooks/useBudgetComparison';

interface BudgetComparisonCardProps {
  current: BudgetExerciceTotals;
  previous: BudgetExerciceTotals;
  deltas: { dotation: number; engage: number; paye: number };
  hasPrevious: boolean;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const formatDelta = (delta: number): string => {
  if (!Number.isFinite(delta)) return 'N/A';
  if (delta === 0) return '0,00 %';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} %`;
};

// Sémantique : dotation/payé, la hausse est neutre/positive ; engagé, la hausse peut
// signaler une forte consommation → même palette que les KPIs ELOP existants.
function DeltaBadge({
  delta,
  context,
}: {
  delta: number;
  context: 'dotation' | 'engage' | 'paye';
}) {
  if (!Number.isFinite(delta)) {
    return (
      <Badge variant="outline" className="font-mono text-[11px]">
        N/A
      </Badge>
    );
  }
  const isZero = delta === 0;
  const isUp = delta > 0;

  // Pour l'engagé, une forte hausse est un signal orange/rouge ; pour les autres,
  // on reste neutre (info seulement). Baisse de dotation = orange (coupe budgétaire).
  let colorClass = 'bg-muted text-muted-foreground border-muted-foreground/30';
  if (!isZero) {
    if (context === 'engage') {
      colorClass = isUp
        ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300';
    } else if (context === 'dotation') {
      colorClass = isUp
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
        : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300';
    } else {
      colorClass = isUp
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300'
        : 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  }

  const Icon = isZero ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <Badge variant="outline" className={cn('font-mono text-[11px] gap-1', colorClass)}>
      <Icon className="h-3 w-3" />
      {formatDelta(delta)}
    </Badge>
  );
}

function ComparisonRow({
  label,
  currentValue,
  previousValue,
  delta,
  context,
}: {
  label: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  context: 'dotation' | 'engage' | 'paye';
}) {
  return (
    <div
      data-testid={`comparison-row-${context}`}
      className="flex items-center justify-between gap-4 py-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center gap-2 text-sm font-mono">
          <span className="font-semibold text-foreground">{formatCurrency(currentValue)}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">{formatCurrency(previousValue)}</span>
        </div>
      </div>
      <DeltaBadge delta={delta} context={context} />
    </div>
  );
}

export function BudgetComparisonCard({
  current,
  previous,
  deltas,
  hasPrevious,
  isLoading,
}: BudgetComparisonCardProps) {
  return (
    <Card data-testid="budget-comparison-card" className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Comparatif {current.exercice} vs {previous.exercice}
            </CardTitle>
            <CardDescription>
              {hasPrevious
                ? `${current.count} ligne(s) en ${current.exercice} · ${previous.count} en ${previous.exercice}`
                : `Aucune donnée disponible pour l'exercice ${previous.exercice}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px]">
            N / N-1
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="py-4 text-sm text-muted-foreground" data-testid="comparison-loading">
            Calcul du comparatif...
          </div>
        ) : !hasPrevious ? (
          <div
            data-testid="comparison-empty"
            className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground"
          >
            Aucune ligne budgétaire trouvée pour l'exercice {previous.exercice}. Le comparatif
            nécessite des données sur les deux exercices.
          </div>
        ) : (
          <div className="grid gap-1 md:grid-cols-3 md:divide-x md:divide-border">
            <div className="md:pr-4">
              <ComparisonRow
                label="Dotation totale"
                currentValue={current.dotation}
                previousValue={previous.dotation}
                delta={deltas.dotation}
                context="dotation"
              />
            </div>
            <div className="md:px-4">
              <ComparisonRow
                label="Engagé"
                currentValue={current.engage}
                previousValue={previous.engage}
                delta={deltas.engage}
                context="engage"
              />
            </div>
            <div className="md:pl-4">
              <ComparisonRow
                label="Payé"
                currentValue={current.paye}
                previousValue={previous.paye}
                delta={deltas.paye}
                context="paye"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
