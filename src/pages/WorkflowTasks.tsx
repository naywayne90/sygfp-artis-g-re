/**
 * Centre de Pilotage — Page "À traiter"
 *
 * Remplace l'ancienne page WorkflowTaskCenter qui utilisait la table workflow_tasks (vide).
 * Utilise désormais useSidebarBadges() qui agrège les vrais compteurs de toutes les tables métier
 * (notes_sef, notes_dg, expressions_besoin, budget_engagements, budget_liquidations,
 *  ordonnancements, reglements, credit_transfers).
 *
 * Architecture :
 *   1. KPIs globaux (total, modules actifs, différés, urgents)
 *   2. Mini-chaîne visuelle avec compteurs par étape
 *   3. Grille de modules triée par urgence avec navigation directe
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExerciceSubtitle } from '@/components/exercice/ExerciceSubtitle';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarBadges, type SidebarBadges } from '@/hooks/useSidebarBadges';
import { useQueryClient } from '@tanstack/react-query';
import { useExercice } from '@/contexts/ExerciceContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Activity,
  FileText,
  FileInput,
  ShoppingCart,
  Gavel,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────
interface ModuleInfo {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  route: string;
  count: number;
  step: number;
  extras: { label: string; count: number; variant: 'warning' | 'destructive' | 'info' }[];
}

// ─── Helpers ────────────────────────────────────────────────
function buildModules(b: SidebarBadges): ModuleInfo[] {
  return [
    {
      key: 'sef',
      label: 'Notes SEF',
      shortLabel: 'SEF',
      icon: FileText,
      route: '/notes-sef',
      count: b.sefAValider,
      step: 1,
      extras:
        b.sefDifferes > 0
          ? [{ label: 'Différé(s)', count: b.sefDifferes, variant: 'warning' as const }]
          : [],
    },
    {
      key: 'aef',
      label: 'Notes AEF',
      shortLabel: 'AEF',
      icon: FileText,
      route: '/notes-aef',
      count: b.aefAValider,
      step: 2,
      extras: [
        ...(b.aefAImputer > 0
          ? [{ label: 'À imputer', count: b.aefAImputer, variant: 'info' as const }]
          : []),
        ...(b.aefDifferes > 0
          ? [{ label: 'Différé(s)', count: b.aefDifferes, variant: 'warning' as const }]
          : []),
      ],
    },
    {
      key: 'imp',
      label: 'Imputation',
      shortLabel: 'IMP',
      icon: FileInput,
      route: '/execution/imputation',
      count: b.imputationsATraiter,
      step: 3,
      extras: [],
    },
    {
      key: 'eb',
      label: 'Expression Besoin',
      shortLabel: 'EB',
      icon: ShoppingCart,
      route: '/execution/expression-besoin',
      count: b.ebAValider,
      step: 4,
      extras: [],
    },
    {
      key: 'pm',
      label: 'Passation Marché',
      shortLabel: 'PM',
      icon: Gavel,
      route: '/execution/passation-marche',
      count: b.marchesEnCours,
      step: 5,
      extras: [],
    },
    {
      key: 'eng',
      label: 'Engagements',
      shortLabel: 'ENG',
      icon: CreditCard,
      route: '/engagements',
      count: b.engagementsAValider,
      step: 6,
      extras: [
        ...(b.engagementsDifferes > 0
          ? [{ label: 'Différé(s)', count: b.engagementsDifferes, variant: 'warning' as const }]
          : []),
      ],
    },
    {
      key: 'liq',
      label: 'Liquidations',
      shortLabel: 'LIQ',
      icon: Receipt,
      route: '/liquidations',
      count: b.liquidationsAValider,
      step: 7,
      extras: [
        ...(b.liquidationsDifferes > 0
          ? [{ label: 'Différé(s)', count: b.liquidationsDifferes, variant: 'warning' as const }]
          : []),
        ...(b.liquidationsUrgentes > 0
          ? [{ label: 'Urgent(s)', count: b.liquidationsUrgentes, variant: 'destructive' as const }]
          : []),
      ],
    },
    {
      key: 'ordo',
      label: 'Ordonnancements',
      shortLabel: 'ORD',
      icon: FileCheck,
      route: '/ordonnancements',
      count: b.ordoAValider,
      step: 8,
      extras: [
        ...(b.ordoEnSignature > 0
          ? [{ label: 'En signature', count: b.ordoEnSignature, variant: 'info' as const }]
          : []),
      ],
    },
    {
      key: 'reg',
      label: 'Règlements',
      shortLabel: 'RÈG',
      icon: Banknote,
      route: '/reglements',
      count: b.reglementsATraiter,
      step: 9,
      extras: [],
    },
    {
      key: 'vir',
      label: 'Virements',
      shortLabel: 'VIR',
      icon: ArrowLeftRight,
      route: '/planification/virements',
      count: b.virementsEnAttente,
      step: 10,
      extras: [],
    },
  ];
}

// ─── KPI Cards ──────────────────────────────────────────────
function KPICards({ badges, modules }: { badges: SidebarBadges; modules: ModuleInfo[] }) {
  const modulesActifs = modules.filter((m) => m.count > 0).length;
  const totalDifferes =
    badges.sefDifferes +
    badges.aefDifferes +
    badges.engagementsDifferes +
    badges.liquidationsDifferes;
  const totalUrgents = badges.liquidationsUrgentes;

  const kpis = [
    {
      label: 'À traiter',
      value: badges.totalATraiter,
      icon: Activity,
      color: badges.totalATraiter > 0 ? 'text-primary' : 'text-muted-foreground',
      bgColor: badges.totalATraiter > 0 ? 'bg-primary/10' : 'bg-muted/50',
      borderColor: badges.totalATraiter > 0 ? 'border-primary/30' : '',
      pulse: badges.totalATraiter > 10,
    },
    {
      label: 'Modules actifs',
      value: modulesActifs,
      suffix: `/${modules.length}`,
      icon: LayoutGrid,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: '',
      progress: (modulesActifs / modules.length) * 100,
    },
    {
      label: 'Différés',
      value: totalDifferes,
      icon: Clock,
      color: totalDifferes > 0 ? 'text-amber-600' : 'text-muted-foreground',
      bgColor: totalDifferes > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-muted/50',
      borderColor: totalDifferes > 0 ? 'border-amber-400/30' : '',
    },
    {
      label: 'Urgents',
      value: totalUrgents,
      icon: Zap,
      color: totalUrgents > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: totalUrgents > 0 ? 'bg-destructive/10' : 'bg-muted/50',
      borderColor: totalUrgents > 0 ? 'border-destructive/30' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className={cn('border', kpi.borderColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className={cn('text-3xl font-bold', kpi.color)}>{kpi.value}</p>
                    {kpi.suffix && (
                      <span className="text-lg text-muted-foreground">{kpi.suffix}</span>
                    )}
                  </div>
                  {kpi.progress !== undefined && (
                    <Progress value={kpi.progress} className="h-1.5 mt-2 w-24" />
                  )}
                </div>
                <div className={cn('p-3 rounded-xl', kpi.bgColor)}>
                  <Icon className={cn('h-6 w-6', kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Chain Visual ───────────────────────────────────────────
function ChainVisual({
  modules,
  onNavigate,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  modules: ModuleInfo[];
  onNavigate: (route: string) => void;
  lastUpdated?: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  // Only the 9 chain steps (exclude virements)
  const chainSteps = modules.filter((m) => m.step <= 9);
  const chainTotal = chainSteps.reduce(
    (sum, s) => sum + s.count + s.extras.reduce((a, e) => a + e.count, 0),
    0
  );

  return (
    <TooltipProvider>
      <Card className="animate-fade-in">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Chaîne de la dépense
              </span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                {chainTotal} total
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  MàJ {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: fr })}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {chainSteps.map((step, index) => {
              const hasItems = step.count > 0;
              const totalExtra = step.extras.reduce((s, e) => s + e.count, 0);
              const hasUrgent = step.extras.some((e) => e.variant === 'destructive');
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNavigate(step.route)}
                        className={cn(
                          'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer',
                          'hover:bg-accent hover:shadow-sm',
                          hasItems && 'bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                            hasItems
                              ? hasUrgent
                                ? 'bg-destructive text-destructive-foreground shadow-md shadow-destructive/25'
                                : 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {step.count + totalExtra || 0}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            hasItems
                              ? hasUrgent
                                ? 'text-destructive'
                                : 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        >
                          {step.shortLabel}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-xs">
                          {step.count} à traiter
                          {step.extras
                            .map((e) => ` + ${e.count} ${e.label.toLowerCase()}`)
                            .join('')}
                        </p>
                        <p className="text-xs text-muted-foreground">Cliquer pour ouvrir</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {index < chainSteps.length - 1 && (
                    <div
                      className={cn(
                        'w-6 h-0.5 mx-0.5 shrink-0 transition-colors',
                        hasItems && chainSteps[index + 1]?.count > 0
                          ? 'bg-primary/40'
                          : 'bg-muted-foreground/20'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ─── Module Card ────────────────────────────────────────────
function ModuleCard({ module, onNavigate }: { module: ModuleInfo; onNavigate: () => void }) {
  const Icon = module.icon;
  const hasItems = module.count > 0;
  const hasExtras = module.extras.length > 0;
  const totalWithExtras = module.count + module.extras.reduce((s, e) => s + e.count, 0);
  const isUrgent = module.extras.some((e) => e.variant === 'destructive');

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        hasItems && 'border-primary/30 bg-primary/[0.02]',
        isUrgent && 'border-destructive/40 bg-destructive/[0.02]',
        !hasItems && !hasExtras && 'opacity-60 hover:opacity-100'
      )}
      onClick={onNavigate}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              hasItems
                ? isUrgent
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {hasItems ? (
            <Badge
              variant={isUrgent ? 'destructive' : 'default'}
              className="text-sm px-2.5 py-0.5 font-bold"
            >
              {totalWithExtras}
            </Badge>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-success opacity-60" />
          )}
        </div>

        <h3 className="font-semibold text-sm mb-1">{module.label}</h3>

        {hasItems ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{module.count} en attente de traitement</p>
            {module.extras.map((extra) => (
              <Badge
                key={extra.label}
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5',
                  extra.variant === 'warning' &&
                    'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30',
                  extra.variant === 'destructive' &&
                    'border-destructive text-destructive bg-destructive/5',
                  extra.variant === 'info' &&
                    'border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30'
                )}
              >
                + {extra.count} {extra.label.toLowerCase()}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-success/80">Tout est à jour</p>
        )}

        <div className="mt-3 pt-3 border-t">
          {hasItems ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-between text-xs h-8 group-hover:bg-primary/10 group-hover:text-primary',
                isUrgent && 'group-hover:bg-destructive/10 group-hover:text-destructive'
              )}
            >
              Traiter
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 text-muted-foreground"
            >
              Consulter
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────
function CentrePilotageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-24" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}

// ─── Alerte Top 3 ───────────────────────────────────────────
function TopUrgentBanner({
  modules,
  onNavigate,
}: {
  modules: ModuleInfo[];
  onNavigate: (route: string) => void;
}) {
  const topModules = modules.filter((m) => m.count > 0).slice(0, 3);
  if (topModules.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02] animate-fade-in">
      <CardContent className="py-4 px-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Actions prioritaires</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topModules.map((mod) => {
            const Icon = mod.icon;
            const isUrgent = mod.extras.some((e) => e.variant === 'destructive');
            return (
              <Button
                key={mod.key}
                variant={isUrgent ? 'destructive' : 'default'}
                size="sm"
                className="gap-2"
                onClick={() => onNavigate(mod.route)}
              >
                <Icon className="h-4 w-4" />
                {mod.label}
                <Badge
                  variant="outline"
                  className={cn(
                    'ml-1 text-[10px] px-1.5 h-4',
                    isUrgent
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground'
                  )}
                >
                  {mod.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ────────────────────────────────────────
export default function WorkflowTasks() {
  const { data: badges, isLoading, isFetching } = useSidebarBadges();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  const modules = useMemo(() => {
    if (!badges) return [];
    return buildModules(badges);
  }, [badges]);

  // Tri par nombre d'items (les plus chargés en premier)
  const sortedModules = useMemo(
    () =>
      [...modules].sort((a, b) => {
        const totalA = a.count + a.extras.reduce((s, e) => s + e.count, 0);
        const totalB = b.count + b.extras.reduce((s, e) => s + e.count, 0);
        return totalB - totalA;
      }),
    [modules]
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sidebar-badges', exercice] });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Centre de pilotage"
          description={
            badges ? `${badges.totalATraiter} action(s) en attente de traitement` : 'Chargement...'
          }
        />
        <ExerciceSubtitle title="" />

        {isLoading || !badges ? (
          <CentrePilotageSkeleton />
        ) : (
          <>
            {/* KPIs */}
            <KPICards badges={badges} modules={modules} />

            {/* Actions prioritaires (top 3) */}
            <TopUrgentBanner modules={sortedModules} onNavigate={(route) => navigate(route)} />

            {/* Chaîne visuelle */}
            <ChainVisual
              modules={modules}
              onNavigate={(route) => navigate(route)}
              lastUpdated={badges.lastUpdated}
              onRefresh={handleRefresh}
              isRefreshing={isFetching}
            />

            {/* Grille de modules */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Détail par module
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedModules.map((mod) => (
                  <ModuleCard key={mod.key} module={mod} onNavigate={() => navigate(mod.route)} />
                ))}
              </div>
            </div>

            {/* Tout est OK message */}
            {badges.totalATraiter === 0 && (
              <Card className="border-success/30 bg-success/5 animate-fade-in">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-semibold text-success mb-2">Tout est à jour !</h3>
                  <p className="text-muted-foreground">
                    Aucune action en attente de traitement pour cet exercice.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
