import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRoadmapDashboard } from '@/hooks/useRoadmapDashboard';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

function daysBetween(dateStr: string): number {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RoadmapDashboard() {
  const navigate = useNavigate();
  const { globalStats, directionStats, topTachesEnRetard, isLoading } = useRoadmapDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Tableau de Bord - Feuille de Route
          </h1>
          <p className="text-muted-foreground">Vue consolidee de toutes les directions</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              Plans
            </div>
            <p className="text-2xl font-bold">{globalStats.totalPlans}</p>
            <p className="text-xs text-muted-foreground">{globalStats.plansEnCours} en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              Taches
            </div>
            <p className="text-2xl font-bold">{globalStats.totalTaches}</p>
            <p className="text-xs text-muted-foreground">{globalStats.tachesTerminees} terminees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              En retard
            </div>
            <p className="text-2xl font-bold text-destructive">{globalStats.tachesEnRetard}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Avancement
            </div>
            <p className="text-2xl font-bold">{globalStats.avancementGlobal}%</p>
            <Progress value={globalStats.avancementGlobal} className="mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Budget total
            </div>
            <p className="text-lg font-bold">{formatCurrency(globalStats.budgetTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Consomme
            </div>
            <p className="text-lg font-bold">{formatCurrency(globalStats.budgetConsomme)}</p>
            {globalStats.budgetTotal > 0 && (
              <Progress
                value={Math.round((globalStats.budgetConsomme / globalStats.budgetTotal) * 100)}
                className="mt-1"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Direction Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Progression par direction</h2>
        {directionStats.length === 0 ? (
          <EmptyStateNoData entityName="plan de travail" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directionStats.map((ds) => (
              <Card
                key={ds.direction_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/planification/projets?direction=${ds.direction_id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{ds.direction_nom}</span>
                    <Badge variant="outline">{ds.direction_code}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{ds.stats.totalPlans} plan(s)</span>
                      <span className="font-medium">{ds.stats.avancementGlobal}%</span>
                    </div>
                    <Progress value={ds.stats.avancementGlobal} />
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{ds.stats.totalTaches} taches</Badge>
                      <Badge variant="default">{ds.stats.tachesTerminees} terminees</Badge>
                      {ds.stats.tachesEnRetard > 0 && (
                        <Badge variant="destructive">{ds.stats.tachesEnRetard} en retard</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Budget: {formatCurrency(ds.stats.budgetConsomme)} /{' '}
                      {formatCurrency(ds.stats.budgetTotal)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Top overdue tasks */}
      {topTachesEnRetard.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Top taches en retard
          </h2>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libelle</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Retard (j)</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTachesEnRetard.map((tache) => (
                    <TableRow key={tache.id}>
                      <TableCell className="font-mono text-sm">{tache.code}</TableCell>
                      <TableCell>{tache.libelle}</TableCell>
                      <TableCell>{tache.date_fin}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{daysBetween(tache.date_fin ?? '')} j</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={tache.avancement} className="w-16" />
                          <span className="text-sm">{tache.avancement}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tache.statut}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
