/* eslint-disable react-refresh/only-export-components */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Ban } from 'lucide-react';
import { BudgetAvailability } from '@/hooks/useEngagements';
import { formatCurrency } from '@/lib/utils';

interface IndicateurBudgetProps {
  availability: BudgetAvailability | null;
  isLoading?: boolean;
  budgetLine?: { code: string; label: string } | null;
  compact?: boolean;
  mode?: 'creation' | 'consultation';
}

export function getTauxColor(taux: number): {
  color: string;
  bgClass: string;
  progressClass: string;
  label: string;
} {
  if (taux > 100)
    return {
      color: 'text-destructive',
      bgClass: 'bg-red-500',
      progressClass: '[&>div]:bg-red-500',
      label: 'DÉPASSEMENT',
    };
  if (taux > 95)
    return {
      color: 'text-destructive',
      bgClass: 'bg-red-500',
      progressClass: '[&>div]:bg-red-500',
      label: 'Seuil critique',
    };
  if (taux > 80)
    return {
      color: 'text-orange-600',
      bgClass: 'bg-orange-500',
      progressClass: '[&>div]:bg-orange-500',
      label: 'Taux élevé',
    };
  return {
    color: 'text-green-600',
    bgClass: 'bg-green-500',
    progressClass: '[&>div]:bg-green-500',
    label: 'Consommation normale',
  };
}

export function getTauxColorClass(taux: number): string {
  return getTauxColor(taux).color;
}

// Lighter shade for the "cet engagement" segment
function getSegmentLightClass(taux: number): string {
  if (taux > 100) return 'bg-red-300';
  if (taux > 95) return 'bg-red-300';
  if (taux > 80) return 'bg-orange-300';
  return 'bg-green-300';
}

function getSegmentDarkClass(taux: number): string {
  if (taux > 100) return 'bg-red-500';
  if (taux > 95) return 'bg-red-500';
  if (taux > 80) return 'bg-orange-500';
  return 'bg-green-500';
}

function IndicateurBudgetContent({
  availability,
  isLoading,
  budgetLine,
}: Omit<IndicateurBudgetProps, 'compact' | 'mode'>) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Vérification en cours...
      </div>
    );
  }

  if (!availability) {
    return (
      <p className="text-muted-foreground text-sm">
        Sélectionnez une ligne budgétaire pour vérifier la disponibilité
      </p>
    );
  }

  const dotation = availability.dotation_actuelle;
  const anterieurs = availability.engagements_anterieurs;
  const actuel = availability.engagement_actuel;
  const cumul = availability.cumul;
  const disponibleAvant = dotation - anterieurs;

  const tauxAvant = dotation > 0 ? (anterieurs / dotation) * 100 : 0;
  const tauxApres = dotation > 0 ? (cumul / dotation) * 100 : 0;
  const tauxInfo = getTauxColor(tauxApres);
  const isDepassement = tauxApres > 100;

  // Segment widths for the double progress bar (capped visually at 100%)
  const segAvantPct = dotation > 0 ? Math.min((anterieurs / dotation) * 100, 100) : 0;
  const segActuelPct = dotation > 0 ? Math.min((actuel / dotation) * 100, 100 - segAvantPct) : 0;

  return (
    <div className="space-y-4">
      {budgetLine && (
        <p className="text-sm font-medium text-muted-foreground">
          [{budgetLine.code}] — {budgetLine.label}
        </p>
      )}

      {/* 6 metrics grid (3 cols x 2 rows) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 space-y-1">
          <div className="text-xs text-muted-foreground">Dotation de la ligne</div>
          <div className="font-bold text-sm">{formatCurrency(dotation)}</div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <div className="text-xs text-muted-foreground">Déjà engagé</div>
          <div className="font-bold text-sm text-orange-600">{formatCurrency(anterieurs)}</div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <div className="text-xs text-muted-foreground">Disponible avant</div>
          <div className="font-bold text-sm">{formatCurrency(disponibleAvant)}</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">Cet engagement</div>
          <div className="font-bold text-sm text-primary">{formatCurrency(actuel)}</div>
        </div>
        <div
          className={`rounded-lg border p-3 space-y-1 ${
            availability.is_sufficient
              ? 'border-green-500/30 bg-green-50 dark:bg-green-950/20'
              : 'border-red-500/30 bg-red-50 dark:bg-red-950/20'
          }`}
        >
          <div className="text-xs text-muted-foreground">Reste après</div>
          <div
            className={`font-bold text-sm ${
              availability.is_sufficient ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {formatCurrency(availability.disponible)}
          </div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <div className="text-xs text-muted-foreground">Taux de consommation</div>
          <div className={`font-bold text-sm ${tauxInfo.color}`}>{tauxApres.toFixed(1)}%</div>
        </div>
      </div>

      {/* Double progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {tauxAvant.toFixed(0)}% engagé{' '}
            <span className={tauxInfo.color}>→ {tauxApres.toFixed(1)}% après cet engagement</span>
          </span>
          {isDepassement && (
            <Badge variant="destructive" className="animate-pulse text-[10px] h-5 px-1.5">
              BLOQUÉ
            </Badge>
          )}
        </div>
        <div
          className={`relative h-3 w-full rounded-full bg-secondary overflow-hidden ${
            isDepassement ? 'animate-pulse' : ''
          }`}
        >
          {/* Segment 1: engagements antérieurs */}
          <div
            className={`absolute inset-y-0 left-0 rounded-l-full ${getSegmentDarkClass(tauxApres)} transition-all duration-300`}
            style={{ width: `${segAvantPct}%` }}
          />
          {/* Segment 2: cet engagement */}
          <div
            className={`absolute inset-y-0 ${getSegmentLightClass(tauxApres)} transition-all duration-300 ${
              segAvantPct + segActuelPct >= 100 ? 'rounded-r-full' : ''
            }`}
            style={{
              left: `${segAvantPct}%`,
              width: `${segActuelPct}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-sm ${getSegmentDarkClass(tauxApres)}`} />
            <span>Antérieurs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-sm ${getSegmentLightClass(tauxApres)}`}
            />
            <span>Cet engagement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-secondary border" />
            <span>Disponible</span>
          </div>
        </div>
      </div>

      {/* Conditional alert */}
      {isDepassement ? (
        <Alert variant="destructive" className="animate-pulse">
          <Ban className="h-4 w-4" />
          <AlertTitle>BLOQUÉ — Crédits insuffisants</AlertTitle>
          <AlertDescription>
            Il manque <strong>{formatCurrency(Math.abs(availability.disponible))}</strong> pour
            couvrir cet engagement. Le taux atteint {tauxApres.toFixed(1)}%.
          </AlertDescription>
        </Alert>
      ) : tauxApres > 95 ? (
        <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">Seuil critique atteint</AlertTitle>
          <AlertDescription>
            Le taux d'engagement atteint {tauxApres.toFixed(1)}%. Crédits restants :{' '}
            {formatCurrency(availability.disponible)}
          </AlertDescription>
        </Alert>
      ) : tauxApres > 80 ? (
        <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-700">Attention : taux d'engagement élevé</AlertTitle>
          <AlertDescription>
            Le taux d'engagement atteint {tauxApres.toFixed(1)}%. Crédits restants :{' '}
            {formatCurrency(availability.disponible)}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Budget suffisant</AlertTitle>
          <AlertDescription>
            La ligne budgétaire dispose des crédits nécessaires. Taux après engagement :{' '}
            {tauxApres.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function IndicateurBudget({
  availability,
  isLoading,
  budgetLine,
  compact,
}: IndicateurBudgetProps) {
  if (compact) {
    return (
      <IndicateurBudgetContent
        availability={availability}
        isLoading={isLoading}
        budgetLine={budgetLine}
      />
    );
  }

  return (
    <Card
      className={
        availability
          ? availability.is_sufficient
            ? 'border-green-500/50'
            : 'border-destructive/50'
          : undefined
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Contrôle de disponibilité budgétaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <IndicateurBudgetContent
          availability={availability}
          isLoading={isLoading}
          budgetLine={budgetLine}
        />
      </CardContent>
    </Card>
  );
}
