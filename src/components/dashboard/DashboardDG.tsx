/**
 * Dashboard DG — Tableau de bord du Directeur Général de l'ARTI
 *
 * Architecture en 3 niveaux :
 *   1. DÉCISION  — Corbeille DG : toutes les actions en attente de décision
 *   2. PILOTAGE  — Santé budgétaire, exécution, pipeline 9 étapes
 *   3. INTELLIGENCE — Directions, dossiers, délais, accès rapide
 *
 * Données DG exclusives :
 *   - Notes SEF à valider
 *   - Notes AEF à valider
 *   - Imputations visées par le CB à valider
 *   - Marchés attribués à approuver
 *   - Engagements post-DAAF à valider
 *   - Ordonnancements à signer
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDGDashboard, type CorbeilleDGItem } from '@/hooks/useDashboardByRole';
import { useDashboardAlerts } from '@/hooks/useDashboardAlerts';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  ArrowRight,
  Search,
  Users,
  Timer,
  Bell,
  ChevronRight,
  ShoppingCart,
  ClipboardList,
  ClipboardCheck,
  FileSignature,
  Banknote,
  Inbox,
  Gavel,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

// ─── Mapping des icônes pour la corbeille ───
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  FileSignature,
  ClipboardCheck,
  ShoppingCart,
  CreditCard,
  FileCheck,
};

// ─── Couleurs Tailwind dynamiques (bg, text, border) ───
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-blue-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    ring: 'ring-indigo-500/20',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    ring: 'ring-cyan-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    ring: 'ring-emerald-500/20',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    ring: 'ring-green-500/20',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    ring: 'ring-purple-500/20',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-amber-500/20',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    ring: 'ring-teal-500/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    ring: 'ring-red-500/20',
  },
};

// ════════════════════════════════════════════
// COMPOSANT CORBEILLE DG (Niveau 1 — Décision)
// ════════════════════════════════════════════

function CorbeilleDG({
  items,
  totalCount,
  totalMontant,
}: {
  items: CorbeilleDGItem[];
  totalCount: number;
  totalMontant: number;
}) {
  if (totalCount === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                Aucune action en attente
              </p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                Toutes vos validations sont à jour
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.05]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Inbox className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </div>
            {totalCount} action{totalCount > 1 ? 's' : ''} en attente
          </CardTitle>
          {totalMontant > 0 && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {formatCurrency(totalMontant)}
            </Badge>
          )}
        </div>
        <CardDescription>Décisions requises du Directeur Général</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] || FileText;
            const colors = COLOR_MAP[item.color] || COLOR_MAP.blue;
            return (
              <Link key={item.key} to={item.link} className="block group">
                <div
                  className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md hover:ring-2 ${colors.ring} transition-all duration-200`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${colors.text}`}>{item.count}</span>
                    <span className="text-[10px] text-muted-foreground">
                      à {item.action.toLowerCase()}
                    </span>
                  </div>
                  {item.montant > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {formatCurrency(item.montant)}
                    </p>
                  )}
                  <ArrowRight className="absolute bottom-2 right-2 h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════
// COMPOSANT PIPELINE 9 ÉTAPES
// ════════════════════════════════════════════

function PipelineChaine({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useDGDashboard>['data']>;
}) {
  const steps = [
    {
      label: 'Notes SEF',
      count: stats.pipeline.notesSEF,
      icon: FileText,
      color: 'blue',
      link: '/notes-sef',
      pending: stats.pipeline.notesSEFAValider,
    },
    {
      label: 'Notes AEF',
      count: stats.pipeline.notesAEF,
      icon: FileSignature,
      color: 'indigo',
      link: '/notes-aef',
      pending: stats.pipeline.notesAEFAValider,
    },
    {
      label: 'Imputations',
      count: stats.pipeline.imputations,
      icon: ClipboardList,
      color: 'cyan',
      link: '/execution/imputation',
      pending: stats.pipeline.imputationsEnAttente,
    },
    {
      label: 'Expr. Besoin',
      count: stats.pipeline.expressionsBesoin,
      icon: ShoppingCart,
      color: 'teal',
      link: '/execution/expression-besoin',
    },
    {
      label: 'Marchés',
      count: stats.pipeline.marches,
      icon: Receipt,
      color: 'emerald',
      link: '/execution/passation-marche',
      pending: stats.marchesAApprouver,
    },
    {
      label: 'Engagements',
      count: stats.pipeline.engagements,
      icon: CreditCard,
      color: 'green',
      link: '/engagements',
      pending: stats.engagementsAValiderDG,
    },
    {
      label: 'Liquidations',
      count: stats.pipeline.liquidations,
      icon: Receipt,
      color: 'amber',
      link: '/liquidations',
    },
    {
      label: 'Ordonnanc.',
      count: stats.pipeline.ordonnancements,
      icon: FileCheck,
      color: 'purple',
      link: '/ordonnancements',
      pending: stats.ordonnancementsASigner,
    },
    {
      label: 'Règlements',
      count: stats.pipeline.reglements,
      icon: Banknote,
      color: 'green',
      link: '/reglements',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-4 w-4 text-primary" />
          Chaîne de la Dépense
        </CardTitle>
        <CardDescription>Pipeline d'exécution budgétaire — 9 étapes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const colors = COLOR_MAP[step.color] || COLOR_MAP.blue;
            return (
              <Link key={idx} to={step.link} className="block">
                <div
                  className={`p-3 rounded-lg ${colors.bg} hover:shadow-md transition-all border border-transparent hover:${colors.border} text-center relative`}
                >
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${colors.text}`} />
                  <p className="text-lg font-bold">{step.count}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{step.label}</p>
                  {(step.pending || 0) > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 text-[10px] h-5 px-1"
                    >
                      {step.pending}
                    </Badge>
                  )}
                  {idx < 8 && (
                    <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/20" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════
// COMPOSANT PRINCIPAL : DASHBOARD DG
// ════════════════════════════════════════════

export function DashboardDG() {
  const { data: stats, isLoading } = useDGDashboard();
  const { data: alerts } = useDashboardAlerts();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical') || [];
  const warningAlerts = alerts?.filter((a) => a.severity === 'warning') || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════
          HEADER — Titre + Recherche rapide
          ══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord DG</h1>
          <p className="text-muted-foreground">
            Direction Générale — Pilotage de l'exécution budgétaire
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un dossier, N° engagement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════
          NIVEAU 1 — DÉCISION : Corbeille DG
          ══════════════════════════════════════════ */}
      <CorbeilleDG
        items={stats?.corbeille || []}
        totalCount={stats?.pendingDGActions || 0}
        totalMontant={stats?.pendingDGMontant || 0}
      />

      {/* ══════════════════════════════════════════
          ALERTES CRITIQUES
          ══════════════════════════════════════════ */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique
              {criticalAlerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {criticalAlerts.slice(0, 6).map((alert) => (
                <Link key={alert.id} to={alert.link || '#'} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:border-destructive/30 transition-colors">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════
          NIVEAU 2 — PILOTAGE : KPIs stratégiques
          ══════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Global
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.budgetGlobal || 0)}</div>
            <p className="text-xs text-muted-foreground">Exercice en cours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux Consommation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.tauxConsommation || 0}%</div>
            <Progress value={stats?.tauxConsommation || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers Bloqués
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.dossiersBloques || 0}</div>
            <p className="text-xs text-muted-foreground">Différés ou rejetés</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertes</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-500">{criticalAlerts.length}</span>
              <span className="text-xs text-muted-foreground">
                critique{criticalAlerts.length > 1 ? 's' : ''}
              </span>
              {warningAlerts.length > 0 && (
                <span className="text-sm text-amber-500 ml-1">
                  +{warningAlerts.length} warning{warningAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Lignes dépassées : {stats?.alertesDepassement || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exécution budgétaire (4 jauges) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Exécution budgétaire
          </CardTitle>
          <CardDescription>Progression de la consommation budgétaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                label: 'Engagé',
                value: stats?.budgetEngage || 0,
                base: stats?.budgetGlobal || 0,
                baseLabel: 'du budget',
                color: 'bg-primary/10',
              },
              {
                label: 'Liquidé',
                value: stats?.budgetLiquide || 0,
                base: stats?.budgetEngage || 0,
                baseLabel: 'des engagements',
                color: 'bg-secondary/10',
              },
              {
                label: 'Ordonnancé',
                value: stats?.budgetOrdonnance || 0,
                base: stats?.budgetLiquide || 0,
                baseLabel: 'des liquidations',
                color: 'bg-amber-500/10',
              },
              {
                label: 'Payé',
                value: stats?.budgetPaye || 0,
                base: stats?.budgetOrdonnance || 0,
                baseLabel: 'des ordonnancements',
                color: 'bg-green-500/10',
              },
            ].map((gauge) => {
              const pct = gauge.base > 0 ? Math.round((gauge.value / gauge.base) * 100) : 0;
              return (
                <div key={gauge.label} className={`p-4 rounded-lg ${gauge.color} space-y-2`}>
                  <p className="text-xs text-muted-foreground">{gauge.label}</p>
                  <p className="text-xl font-bold">{formatCurrency(gauge.value)}</p>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {pct}% {gauge.baseLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline 9 étapes */}
      <PipelineChaine stats={stats!} />

      {/* ══════════════════════════════════════════
          NIVEAU 3 — INTELLIGENCE : Monitoring
          ══════════════════════════════════════════ */}

      {/* Délais + Synthèse mois */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Délais de traitement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4 text-primary" />
              Délais de traitement
            </CardTitle>
            <CardDescription>Temps moyen de validation par étape</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              {[
                {
                  label: 'Engagement',
                  value: stats?.delais.moyenEngagement,
                  icon: CreditCard,
                  seuilOk: 7,
                  seuilAlert: 15,
                },
                {
                  label: 'Liquidation',
                  value: stats?.delais.moyenLiquidation,
                  icon: Receipt,
                  seuilOk: 10,
                  seuilAlert: 20,
                },
                {
                  label: 'Ordonnancement',
                  value: stats?.delais.moyenOrdonnancement,
                  icon: FileCheck,
                  seuilOk: 5,
                  seuilAlert: 10,
                },
              ].map((d) => {
                const Icon = d.icon;
                // Couleur selon seuil : vert ≤ ok, ambre ≤ alert, rouge sinon
                const hasValue = d.value !== null && d.value !== undefined;
                const level = !hasValue
                  ? 'gray'
                  : (d.value as number) <= d.seuilOk
                    ? 'green'
                    : (d.value as number) <= d.seuilAlert
                      ? 'amber'
                      : 'red';
                const levelClasses: Record<string, { bg: string; text: string; value: string }> = {
                  green: {
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-500',
                    value: 'text-emerald-600',
                  },
                  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', value: 'text-amber-600' },
                  red: { bg: 'bg-red-500/10', text: 'text-red-500', value: 'text-red-600' },
                  gray: {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    value: 'text-muted-foreground',
                  },
                };
                const c = levelClasses[level];
                return (
                  <div
                    key={d.label}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border"
                    title={
                      hasValue
                        ? `Seuil SYGFP : ≤ ${d.seuilOk}j OK, ≤ ${d.seuilAlert}j à surveiller, > ${d.seuilAlert}j critique`
                        : 'Aucune donnée disponible'
                    }
                  >
                    <div className={`p-2 rounded-full ${c.bg}`}>
                      <Icon className={`h-4 w-4 ${c.text}`} />
                    </div>
                    <p className={`text-xl font-bold ${c.value}`}>
                      {hasValue ? `${d.value}j` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-muted-foreground text-center">{d.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Synthèse mensuelle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ce mois
            </CardTitle>
            <CardDescription>Activité de validation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                <div className="p-2 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-bold">{stats?.synthèseMois.dossiersTraites || 0}</p>
                <p className="text-[10px] text-muted-foreground text-center">Validations</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xl font-bold">{stats?.pendingDGActions || 0}</p>
                <p className="text-[10px] text-muted-foreground text-center">En attente</p>
              </div>
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-lg border"
                title={`${stats?.synthèseMois.dossiersTraites ?? 0} validés sur ${stats?.synthèseMois.totalActionsMois ?? 0} décisions prises ce mois (validations, rejets, différés, annulations)`}
              >
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xl font-bold">{stats?.synthèseMois.tauxValidation || 0}%</p>
                <p className="text-[10px] text-muted-foreground text-center">
                  Taux validation
                  {stats?.synthèseMois.totalActionsMois ? (
                    <>
                      <br />
                      <span className="text-[9px]">
                        {stats.synthèseMois.dossiersTraites}/{stats.synthèseMois.totalActionsMois}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conformité réglementaire CI — DGP & Intérêts moratoires */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gavel className="h-4 w-4 text-orange-500" />
            Conformité DGP (Délai Global de Paiement)
          </CardTitle>
          <CardDescription>
            Seuils réglementaires Côte d'Ivoire : 30 j tolérance · 45 j max avant intérêts
            moratoires (4,5 %/an)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div
              className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20"
              title="Engagements validés il y a plus de 30 jours sans paiement associé"
            >
              <CalendarClock className="h-7 w-7 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.dgp.risque30j ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Risque DGP (&gt; 30 j)</p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20"
              title="Engagements qui déclenchent des intérêts moratoires (au-delà de 45 j)"
            >
              <AlertTriangle className="h-7 w-7 text-red-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.dgp.critique45j ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Critique DGP (&gt; 45 j)</p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20"
              title="Estimation : 4,5 %/an × montant × jours de retard au-delà de 45 j"
            >
              <Banknote className="h-7 w-7 text-red-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold text-red-600 dark:text-red-400 break-all">
                  {formatCurrency(stats?.dgp.interetsMoratoiresEstimes ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Intérêts moratoires estimés</p>
              </div>
            </div>
          </div>
          {(stats?.dgp.critique45j ?? 0) > 0 && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-red-100/60 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Action recommandée : prioriser la chaîne liquidation → ordonnancement → règlement
                sur les dossiers les plus anciens pour limiter l'exposition aux intérêts moratoires.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top directions + État dossiers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Directions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Top 5 Directions
            </CardTitle>
            <CardDescription>Par dotation budgétaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topDirections.map((dir, index) => (
                <div key={dir.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">
                        {index + 1}.
                      </span>
                      <span className="font-medium shrink-0">{dir.code}</span>
                      <span className="text-sm text-muted-foreground truncate" title={dir.label}>
                        {dir.label}
                      </span>
                    </div>
                    <Badge
                      variant={
                        dir.tauxExecution > 80
                          ? 'destructive'
                          : dir.tauxExecution > 50
                            ? 'default'
                            : 'secondary'
                      }
                      className="shrink-0"
                    >
                      {dir.tauxExecution}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={dir.tauxExecution} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-28 text-right shrink-0">
                      {formatCurrency(dir.dotation)}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.topDirections || stats.topDirections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée budgétaire
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* État des dossiers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4 text-primary" />
              État des dossiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="text-xl font-bold">{stats?.dossiersEnCours || 0}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="text-xl font-bold">{stats?.dossiersBloques || 0}</p>
                  <p className="text-xs text-muted-foreground">Bloqués</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xl font-bold">{stats?.dossiersValides || 0}</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats?.dossiersSoldes || 0}</p>
                  <p className="text-xs text-muted-foreground">Soldés</p>
                </div>
              </div>
            </div>

            {/* Prestataires + Navigation */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-500" />
                  <span className="text-sm text-muted-foreground">Prestataires actifs</span>
                </div>
                <Link to="/contractualisation/prestataires">
                  <Badge variant="outline" className="cursor-pointer">
                    {stats?.prestatairesActifs || 0}
                  </Badge>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accès rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {[
              {
                label: 'Suivi DG',
                link: '/suivi-dg',
                icon: CheckCircle2,
                color: 'bg-primary/10 text-primary',
              },
              {
                label: 'Budget',
                link: '/planification/structure',
                icon: Wallet,
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              },
              {
                label: 'Recherche',
                link: '/recherche',
                icon: Search,
                color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              },
              {
                label: 'Alertes',
                link: '/alertes-budgetaires',
                icon: AlertTriangle,
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              },
              {
                label: 'États Exéc.',
                link: '/etats-execution',
                icon: TrendingUp,
                color:
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
              },
              {
                label: 'Prestataires',
                link: '/contractualisation/prestataires',
                icon: Users,
                color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.link} to={item.link}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg ${item.color} hover:shadow-md transition-all cursor-pointer`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
