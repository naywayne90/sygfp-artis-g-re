import { useExercice } from '@/contexts/ExerciceContext';
import {
  useDashboardGlobalStats,
  useDashboardStats,
  type RoadmapStats,
  type AlertStats,
  type DirectionStats,
  type OSStats,
} from '@/hooks/useDashboardStats';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Building2,
  FileText,
  Wallet,
  Receipt,
  FileCheck,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGenerateReport } from '@/hooks/useGenerateReport';

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(2)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return new Intl.NumberFormat('fr-FR').format(montant);
};

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  progress,
  link,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  progress?: number;
  link?: string;
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-600 bg-green-100',
    warning: 'text-amber-600 bg-amber-100',
    destructive: 'text-red-600 bg-red-100',
    muted: 'text-muted-foreground bg-muted',
  };

  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpRight
                  className={`h-3 w-3 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
                <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function RoadmapOverview({ stats }: { stats: RoadmapStats | undefined }) {
  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Avancement Feuille de Route
        </CardTitle>
        <CardDescription>Synthèse globale de l'exécution des activités</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Taux global */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taux de réalisation</span>
              <span className="font-medium">{stats.taux_realisation}%</span>
            </div>
            <Progress value={stats.taux_realisation} className="h-3" />
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats.total_activites}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-100">
              <p className="text-2xl font-bold text-green-600">{stats.activites_realisees}</p>
              <p className="text-xs text-green-600">Réalisées</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-100">
              <p className="text-2xl font-bold text-blue-600">{stats.activites_en_cours}</p>
              <p className="text-xs text-blue-600">En cours</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-100">
              <p className="text-2xl font-bold text-red-600">{stats.activites_bloquees}</p>
              <p className="text-xs text-red-600">Bloquées</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <p className="text-2xl font-bold text-gray-600">{stats.activites_non_demarrees}</p>
              <p className="text-xs text-gray-600">Non démarrées</p>
            </div>
          </div>

          {/* Avancement moyen */}
          <div className="p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Avancement moyen</p>
                <p className="text-xl font-bold">{stats.taux_avancement_moyen}%</p>
              </div>
              <Activity className="h-8 w-8 text-primary/50" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsOverview({ alerts }: { alerts: AlertStats | undefined }) {
  if (!alerts) return null;

  const totalAlerts =
    alerts.dossiers_bloques +
    alerts.taches_en_retard +
    alerts.engagements_en_attente +
    alerts.liquidations_en_attente +
    alerts.ordonnancements_en_attente;

  if (totalAlerts === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Aucune alerte</p>
              <p className="text-sm text-green-600">
                Tous les dossiers sont dans les délais normaux
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          Alertes ({totalAlerts})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.dossiers_bloques > 0 && (
            <Link to="/execution/taches?filter=bloque" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
                <Pause className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    {alerts.dossiers_bloques} dossier(s) bloqué(s)
                  </p>
                  <p className="text-xs text-red-600">Nécessitent une intervention</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-red-400" />
              </div>
            </Link>
          )}

          {alerts.taches_en_retard > 0 && (
            <Link to="/execution/taches?filter=retard" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
                <Clock className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">
                    {alerts.taches_en_retard} tâche(s) en retard
                  </p>
                  <p className="text-xs text-amber-600">Date échéance dépassée</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-amber-400" />
              </div>
            </Link>
          )}

          {alerts.engagements_en_attente > 0 && (
            <Link to="/engagements?filter=en_attente" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">
                    {alerts.engagements_en_attente} engagement(s) en attente
                  </p>
                  <p className="text-xs text-muted-foreground">À valider</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}

          {alerts.liquidations_en_attente > 0 && (
            <Link to="/liquidations?filter=en_attente" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Receipt className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium">
                    {alerts.liquidations_en_attente} liquidation(s) en attente
                  </p>
                  <p className="text-xs text-muted-foreground">À traiter</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}

          {alerts.ordonnancements_en_attente > 0 && (
            <Link to="/ordonnancements?filter=en_attente" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <FileCheck className="h-5 w-5 text-teal-600" />
                <div className="flex-1">
                  <p className="font-medium">
                    {alerts.ordonnancements_en_attente} ordonnancement(s) en attente
                  </p>
                  <p className="text-xs text-muted-foreground">À signer</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DirectionsTable({ directions }: { directions: DirectionStats[] }) {
  if (directions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucune donnée d'exécution par direction
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          Avancement par Direction
        </CardTitle>
        <CardDescription>Performance des directions sur la feuille de route</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Réalisées</TableHead>
                <TableHead className="text-center">En cours</TableHead>
                <TableHead className="text-center">Bloquées</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="w-[150px]">Progression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directions.map((dir) => (
                <TableRow key={dir.direction_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{dir.direction_code}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {dir.direction_label}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{dir.roadmap.total_activites}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {dir.roadmap.activites_realisees}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {dir.roadmap.activites_en_cours}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {dir.roadmap.activites_bloquees > 0 ? (
                      <Badge variant="destructive">{dir.roadmap.activites_bloquees}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {dir.roadmap.taux_realisation}%
                  </TableCell>
                  <TableCell>
                    <Progress value={dir.roadmap.taux_realisation} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function OSTable({ objectifs }: { objectifs: OSStats[] }) {
  if (objectifs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucune donnée par objectif stratégique
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          Avancement par Objectif Stratégique
        </CardTitle>
        <CardDescription>Performance par OS</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {objectifs.map((os) => (
              <div key={os.os_id} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {os.os_code}
                    </Badge>
                    <p className="text-sm font-medium">{os.os_libelle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{os.taux_realisation}%</p>
                    <p className="text-xs text-muted-foreground">
                      {os.activites_realisees}/{os.total_activites} activités
                    </p>
                  </div>
                </div>
                <Progress value={os.taux_realisation} className="h-2" />
                {os.montant_prevu > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Budget prévu: {formatMontant(os.montant_prevu)} FCFA
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function BudgetChainOverview() {
  const { data: budgetStats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (!budgetStats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          Chaîne Budgétaire
        </CardTitle>
        <CardDescription>Progression de l'exécution budgétaire</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Montants */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 text-center">
              <Wallet className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">
                {formatMontant(budgetStats.budgetEngage)}
              </p>
              <p className="text-xs text-blue-600">Engagé</p>
              <p className="text-xs text-blue-500 mt-1">{budgetStats.tauxEngagement}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-center">
              <Receipt className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-700">
                {formatMontant(budgetStats.budgetLiquide)}
              </p>
              <p className="text-xs text-purple-600">Liquidé</p>
              <p className="text-xs text-purple-500 mt-1">{budgetStats.tauxLiquidation}%</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 text-center">
              <FileCheck className="h-5 w-5 text-teal-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-teal-700">
                {formatMontant(budgetStats.budgetOrdonnance)}
              </p>
              <p className="text-xs text-teal-600">Ordonnancé</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">
                {formatMontant(budgetStats.budgetPaye)}
              </p>
              <p className="text-xs text-green-600">Payé</p>
              <p className="text-xs text-green-500 mt-1">{budgetStats.tauxPaiement}%</p>
            </div>
          </div>

          {/* Progress bar chaîne */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-medium">{formatMontant(budgetStats.budgetTotal)} FCFA</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${Math.min(budgetStats.tauxEngagement - budgetStats.tauxLiquidation, 100)}%`,
                }}
                title={`Engagé: ${budgetStats.tauxEngagement}%`}
              />
              <div
                className="h-full bg-purple-500"
                style={{
                  width: `${Math.min(budgetStats.tauxLiquidation - budgetStats.tauxPaiement, 100)}%`,
                }}
                title={`Liquidé: ${budgetStats.tauxLiquidation}%`}
              />
              <div
                className="h-full bg-green-500"
                style={{ width: `${budgetStats.tauxPaiement}%` }}
                title={`Payé: ${budgetStats.tauxPaiement}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Engagé</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Liquidé</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Payé</span>
              </div>
            </div>
          </div>

          {/* Disponible */}
          <div className="p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Budget disponible</p>
                <p className="text-xl font-bold">
                  {formatMontant(budgetStats.budgetDisponible)} FCFA
                </p>
              </div>
              <Badge
                variant={budgetStats.budgetDisponible > 0 ? 'outline' : 'destructive'}
                className={budgetStats.budgetDisponible > 0 ? 'bg-green-50 text-green-700' : ''}
              >
                {budgetStats.budgetDisponible > 0 ? 'Solde positif' : 'Dépassement'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardDGPage() {
  const { exercice, exerciceId: _exerciceId } = useExercice();
  const { hasAnyRole } = usePermissions();
  const { roadmap, alerts, directions, objectifsStrategiques, isLoading, refetch } =
    useDashboardGlobalStats();
  const { generateReport, isGenerating } = useGenerateReport();

  // Vérifier les permissions - DG uniquement
  const canAccess = hasAnyRole(['DG', 'Admin']);

  if (!canAccess) {
    return <Navigate to="/execution/dashboard-direction" replace />;
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    const reportFormat = format === 'pdf' ? 'html' : 'csv';
    toast.info(`Export ${format.toUpperCase()} en cours...`);
    await generateReport({
      report_type: 'execution_budgetaire',
      format: reportFormat,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24" />
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Direction Générale</h1>
          <p className="text-muted-foreground">Vue consolidée - Exercice {exercice}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Export...' : 'Excel'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Export...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Activités"
          value={roadmap?.total_activites || 0}
          subtitle={`${roadmap?.taux_realisation || 0}% réalisé`}
          icon={Target}
          progress={roadmap?.taux_realisation}
          color="primary"
          link="/execution/taches"
        />
        <KPICard
          title="Activités Réalisées"
          value={roadmap?.activites_realisees || 0}
          subtitle={`sur ${roadmap?.total_activites || 0} activités`}
          icon={CheckCircle2}
          color="success"
        />
        <KPICard
          title="Activités Bloquées"
          value={roadmap?.activites_bloquees || 0}
          subtitle="Nécessitent une action"
          icon={Pause}
          color={roadmap?.activites_bloquees ? 'destructive' : 'muted'}
          link="/execution/taches?filter=bloque"
        />
        <KPICard
          title="Tâches en Retard"
          value={alerts?.taches_en_retard || 0}
          subtitle="Date échéance dépassée"
          icon={Clock}
          color={alerts?.taches_en_retard ? 'warning' : 'muted'}
          link="/execution/taches?filter=retard"
        />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feuille de route */}
        <RoadmapOverview stats={roadmap} />

        {/* Chaîne budgétaire */}
        <BudgetChainOverview />
      </div>

      {/* Alertes */}
      <AlertsOverview alerts={alerts} />

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Par Direction */}
        <DirectionsTable directions={directions} />

        {/* Par OS */}
        <OSTable objectifs={objectifsStrategiques} />
      </div>
    </div>
  );
}
