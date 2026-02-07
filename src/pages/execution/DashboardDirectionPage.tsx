import { useExercice } from '@/contexts/ExerciceContext';
import {
  useDashboardDirectionStats,
  useUserDirection,
  type RoadmapStats,
  type AlertStats,
  type MissionStats,
} from '@/hooks/useDashboardStats';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Building2,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useGenerateReport } from '@/hooks/useGenerateReport';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DashboardNoDirection } from '@/components/dashboard/DashboardNoDirection';
import { DashboardGeneric } from '@/components/dashboard/DashboardGeneric';
import { DashboardAICB } from '@/components/dashboard/DashboardAICB';
import { DashboardHR } from '@/components/dashboard/DashboardHR';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { DashboardMissions } from '@/components/dashboard/DashboardMissions';

// Mapping des directions vers leurs dashboards spécialisés
const DIRECTION_DASHBOARDS: Record<
  string,
  React.ComponentType<{
    directionId: string;
    directionCode: string;
    directionNom: string;
  }>
> = {
  AICB: DashboardAICB,
  DGPECRP: DashboardHR,
  DSESP: DashboardAnalytics,
  CM: DashboardMissions,
};

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  progress,
  link,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
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

function RoadmapOverview({
  stats,
  directionLabel,
}: {
  stats: RoadmapStats | undefined;
  directionLabel: string;
}) {
  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Avancement Feuille de Route
        </CardTitle>
        <CardDescription>{directionLabel}</CardDescription>
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
                <p className="text-sm text-muted-foreground">Avancement moyen des activités</p>
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

  const totalAlerts = alerts.dossiers_bloques + alerts.taches_en_retard;

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
                Toutes les tâches sont dans les délais normaux
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
                    {alerts.dossiers_bloques} tâche(s) bloquée(s)
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
        </div>
      </CardContent>
    </Card>
  );
}

function MissionsTable({ missions }: { missions: MissionStats[] }) {
  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucune donnée d'exécution par mission
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          Avancement par Mission
        </CardTitle>
        <CardDescription>Performance des missions de la direction</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {missions.map((mission) => (
              <div key={mission.mission_id} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1">
                      {mission.mission_code}
                    </Badge>
                    <p className="text-sm font-medium truncate">{mission.mission_libelle}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold">{mission.taux_realisation}%</p>
                    <p className="text-xs text-muted-foreground">
                      {mission.activites_realisees}/{mission.total_activites}
                    </p>
                  </div>
                </div>
                <Progress value={mission.taux_realisation} className="h-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RecentActivities({ directionId }: { directionId: string }) {
  const { exerciceId } = useExercice();

  const { data: recentTasks, isLoading } = useQuery({
    queryKey: ['recent-activities', exerciceId, directionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_task_executions')
        .select('id, activite_code, activite_libelle, status, taux_avancement, updated_at')
        .eq('exercice_id', exerciceId ?? '')
        .eq('direction_id', directionId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!exerciceId && !!directionId,
  });

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    non_demarre: { label: 'Non démarré', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    en_cours: { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    realise: { label: 'Réalisé', color: 'text-green-600', bgColor: 'bg-green-100' },
    bloque: { label: 'Bloqué', color: 'text-red-600', bgColor: 'bg-red-100' },
    annule: { label: 'Annulé', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Activités Récentes
        </CardTitle>
        <CardDescription>Dernières mises à jour</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
          </div>
        ) : recentTasks && recentTasks.length > 0 ? (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const config = statusConfig[task.status] || statusConfig.non_demarre;
                return (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{task.activite_code}</p>
                        <p className="text-sm font-medium truncate">{task.activite_libelle}</p>
                      </div>
                      <Badge className={`${config.bgColor} ${config.color} border-0`}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={task.taux_avancement || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {task.taux_avancement || 0}%
                      </span>
                    </div>
                    {task.updated_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Modifié le {new Date(task.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Aucune activité récente</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardDirectionPage() {
  const { exercice, exerciceId: _exerciceId } = useExercice();
  const { hasAnyRole } = usePermissions();
  const { data: userProfile, isLoading: loadingProfile } = useUserDirection();

  // Récupérer la direction de l'utilisateur
  const directionId = userProfile?.direction_id || null;
  const directionInfo = userProfile?.directions as {
    id: string;
    code: string;
    label: string;
  } | null;

  const { roadmap, missions, alerts, isLoading, refetch } = useDashboardDirectionStats(directionId);
  const { generateReport, isGenerating } = useGenerateReport();

  // Si DG, rediriger vers le dashboard global
  const isDG = hasAnyRole(['DG']);

  const handleExport = async (format: 'pdf' | 'excel') => {
    const reportFormat = format === 'pdf' ? 'html' : 'csv';
    toast.info(`Export ${format.toUpperCase()} en cours...`);
    await generateReport({
      report_type: 'execution_budgetaire',
      format: reportFormat,
      filters: directionId ? { direction_id: directionId } : undefined,
    });
  };

  if (loadingProfile) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
        </div>
      </div>
    );
  }

  if (!directionId && !isDG) {
    return <DashboardNoDirection />;
  }

  // Vérifier si la direction a un dashboard spécialisé
  const directionCode = directionInfo?.code || '';
  const SpecializedDashboard = DIRECTION_DASHBOARDS[directionCode];

  // Si dashboard spécialisé disponible, l'utiliser
  if (SpecializedDashboard && directionId && directionInfo) {
    return (
      <SpecializedDashboard
        directionId={directionId}
        directionCode={directionInfo.code}
        directionNom={directionInfo.label}
      />
    );
  }

  // Pour les directions sans dashboard spécialisé mais avec directionId, utiliser DashboardGeneric
  // sauf pour certaines directions qui ont déjà des dashboards existants (DG, DAAF, CB, DSI, SDMG)
  const existingDashboards = ['DG', 'DAAF', 'CB', 'DSI', 'SDMG', 'DMG'];
  if (directionId && directionInfo && !existingDashboards.includes(directionCode)) {
    return (
      <DashboardGeneric
        directionId={directionId}
        directionCode={directionInfo.code}
        directionNom={directionInfo.label}
      />
    );
  }

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

  const directionLabel = directionInfo
    ? `${directionInfo.code} - ${directionInfo.label}`
    : 'Ma Direction';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Direction</h1>
          <p className="text-muted-foreground">
            {directionLabel} - Exercice {exercice}
          </p>
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

      {/* Lien vers dashboard DG si admin */}
      {isDG && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm">Vous avez accès au dashboard Direction Générale</span>
              </div>
              <Link to="/execution/dashboard-dg">
                <Button size="sm">
                  Voir le dashboard DG
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Alertes */}
      <AlertsOverview alerts={alerts} />

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feuille de route */}
        <RoadmapOverview stats={roadmap} directionLabel={directionLabel} />

        {/* Missions */}
        <MissionsTable missions={missions} />
      </div>

      {/* Activités récentes */}
      {directionId && <RecentActivities directionId={directionId} />}
    </div>
  );
}
