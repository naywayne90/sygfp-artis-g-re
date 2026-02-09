import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDGDashboard } from '@/hooks/useDashboardByRole';
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
  FileSignature,
  Banknote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

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
      {/* Header avec recherche rapide */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord DG</h1>
          <p className="text-muted-foreground">Vue d'ensemble de l'exécution budgétaire</p>
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

      {/* Bandeau d'actions en attente du DG */}
      {(stats?.pendingDGActions || 0) > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-semibold text-primary">
                  {stats?.pendingDGActions} action{(stats?.pendingDGActions || 0) > 1 ? 's' : ''} en
                  attente
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(stats?.pipeline.notesSEFAValider || 0) > 0 && (
                  <Link to="/notes-sef?statut=soumis">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                      <FileText className="h-3 w-3 mr-1" />
                      {stats?.pipeline.notesSEFAValider} Notes SEF
                    </Badge>
                  </Link>
                )}
                {(stats?.pipeline.notesAEFAValider || 0) > 0 && (
                  <Link to="/notes-aef?statut=soumis">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                      <FileSignature className="h-3 w-3 mr-1" />
                      {stats?.pipeline.notesAEFAValider} Notes AEF
                    </Badge>
                  </Link>
                )}
                {(stats?.ordonnancementsASigner || 0) > 0 && (
                  <Link to="/ordonnancements?statut=en_signature">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                      <FileCheck className="h-3 w-3 mr-1" />
                      {stats?.ordonnancementsASigner} Ordonnancements
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? 's' : ''} critique
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

      {/* KPIs principaux - 2 lignes de 4 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Global
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats?.budgetGlobal || 0)}</div>
            <p className="text-xs text-muted-foreground">FCFA - Exercice en cours</p>
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
            <p className="text-xs text-muted-foreground">À débloquer</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépassements
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.alertesDepassement || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lignes en dépassement</p>
          </CardContent>
        </Card>
      </div>

      {/* Deuxième ligne KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes SEF</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pipeline.notesSEF || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pipeline.notesSEFAValider || 0} en attente de validation
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prestataires
            </CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.prestatairesActifs || 0}</div>
            <p className="text-xs text-muted-foreground">Fournisseurs actifs</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers en cours
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dossiersEnCours || 0}</div>
            <p className="text-xs text-muted-foreground">En traitement</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertes</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {criticalAlerts.length + warningAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critiques, {warningAlerts.length} avertissements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exécution budgétaire détaillée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Exécution budgétaire
          </CardTitle>
          <CardDescription>Progression par étape de la chaîne de dépense</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-primary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Engagé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetEngage || 0)}</p>
              <Progress
                value={stats?.budgetGlobal ? (stats.budgetEngage / stats.budgetGlobal) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats?.budgetGlobal
                  ? Math.round((stats.budgetEngage / stats.budgetGlobal) * 100)
                  : 0}
                % du budget
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Liquidé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetLiquide || 0)}</p>
              <Progress
                value={stats?.budgetEngage ? (stats.budgetLiquide / stats.budgetEngage) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats?.budgetEngage
                  ? Math.round((stats.budgetLiquide / stats.budgetEngage) * 100)
                  : 0}
                % des engagements
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 space-y-2">
              <p className="text-xs text-muted-foreground">Ordonnancé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetOrdonnance || 0)}</p>
              <Progress
                value={
                  stats?.budgetLiquide ? (stats.budgetOrdonnance / stats.budgetLiquide) * 100 : 0
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats?.budgetLiquide
                  ? Math.round((stats.budgetOrdonnance / stats.budgetLiquide) * 100)
                  : 0}
                % des liquidations
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 space-y-2">
              <p className="text-xs text-muted-foreground">Payé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetPaye || 0)}</p>
              <Progress
                value={
                  stats?.budgetOrdonnance ? (stats.budgetPaye / stats.budgetOrdonnance) * 100 : 0
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats?.budgetOrdonnance
                  ? Math.round((stats.budgetPaye / stats.budgetOrdonnance) * 100)
                  : 0}
                % des ordonnancements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline complet de la Chaîne de Dépense (9 étapes) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Chaîne de Dépense - 9 Étapes
          </CardTitle>
          <CardDescription>Vue complète du pipeline d'exécution budgétaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
            {[
              {
                label: 'Notes SEF',
                count: stats?.pipeline.notesSEF || 0,
                icon: FileText,
                color: 'blue',
                link: '/notes-sef',
                pending: stats?.pipeline.notesSEFAValider,
              },
              {
                label: 'Notes AEF',
                count: stats?.pipeline.notesAEF || 0,
                icon: FileSignature,
                color: 'indigo',
                link: '/notes-aef',
                pending: stats?.pipeline.notesAEFAValider,
              },
              {
                label: 'Imputations',
                count: 0,
                icon: ClipboardList,
                color: 'cyan',
                link: '/execution/imputation',
              },
              {
                label: 'Expr. Besoin',
                count: stats?.pipeline.expressionsBesoin || 0,
                icon: ShoppingCart,
                color: 'teal',
                link: '/execution/expression-besoin',
              },
              {
                label: 'Marchés',
                count: stats?.pipeline.marches || 0,
                icon: Receipt,
                color: 'emerald',
                link: '/marches',
              },
              {
                label: 'Engagements',
                count: stats?.pipeline.engagements || 0,
                icon: CreditCard,
                color: 'green',
                link: '/engagements',
              },
              {
                label: 'Liquidations',
                count: stats?.pipeline.liquidations || 0,
                icon: Receipt,
                color: 'amber',
                link: '/liquidations',
              },
              {
                label: 'Ordonnanc.',
                count: stats?.pipeline.ordonnancements || 0,
                icon: FileCheck,
                color: 'purple',
                link: '/ordonnancements',
              },
              {
                label: 'Règlements',
                count: stats?.pipeline.reglements || 0,
                icon: Banknote,
                color: 'green',
                link: '/reglements',
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <Link key={idx} to={step.link} className="block">
                  <div
                    className={`p-3 rounded-lg bg-${step.color}-50 dark:bg-${step.color}-950/30 hover:shadow-md transition-all border border-transparent hover:border-${step.color}-200 text-center relative`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 text-${step.color}-600`} />
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
                      <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Délais de traitement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Délais de traitement moyens
          </CardTitle>
          <CardDescription>Temps moyen de validation par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">
                  {stats?.delais.moyenEngagement !== null
                    ? `${stats?.delais.moyenEngagement}j`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Liquidation</p>
                <p className="text-2xl font-bold">
                  {stats?.delais.moyenLiquidation !== null
                    ? `${stats?.delais.moyenLiquidation}j`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <FileCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordonnancement</p>
                <p className="text-2xl font-bold">
                  {stats?.delais.moyenOrdonnancement !== null
                    ? `${stats?.delais.moyenOrdonnancement}j`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Directions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Top 5 Directions
            </CardTitle>
            <CardDescription>Par dotation budgétaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topDirections.map((dir, index) => (
                <div key={dir.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{dir.code}</span>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
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
                    >
                      {dir.tauxExecution}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={dir.tauxExecution} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {formatMontant(dir.dotation)}
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              État des dossiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10">
                <Clock className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersEnCours || 0}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersBloques || 0}</p>
                  <p className="text-xs text-muted-foreground">Bloqués</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersValides || 0}</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersSoldes || 0}</p>
                  <p className="text-xs text-muted-foreground">Soldés</p>
                </div>
              </div>
            </div>

            {/* En attente de signature */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">En attente de votre signature</p>
              <div className="grid gap-2 grid-cols-3">
                <Link to="/engagements?statut=soumis" className="block">
                  <div className="text-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="text-xl font-bold text-primary">
                      {stats?.engagementsASigner || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Engagements</p>
                  </div>
                </Link>
                <Link to="/liquidations?statut=soumis" className="block">
                  <div className="text-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="text-xl font-bold text-amber-500">
                      {stats?.liquidationsASigner || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Liquidations</p>
                  </div>
                </Link>
                <Link to="/ordonnancements?statut=en_signature" className="block">
                  <div className="text-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="text-xl font-bold text-purple-500">
                      {stats?.ordonnancementsASigner || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Ordonnancements</p>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapide aux modules */}
      <Card>
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {[
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
                label: 'Financier',
                link: '/dashboard-financier',
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
              {
                label: 'Ma Direction',
                link: '/espace-direction',
                icon: Building2,
                color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
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
