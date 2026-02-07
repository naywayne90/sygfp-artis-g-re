/**
 * DashboardHR - Dashboard spécialisé Ressources Humaines (DGPECRP)
 * Focalisé sur: Effectifs, Mouvements de personnel, Budget masse salariale
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  UserPlus,
  UserMinus,
  Briefcase,
  TrendingUp,
  Building2,
  RefreshCw,
  DollarSign,
  Calendar,
  PieChart,
} from 'lucide-react';
import { useDirectionDashboard } from '@/hooks/dashboard/useDirectionDashboard';
import { useHRDashboardData } from '@/hooks/useHRDashboardData';
import { formatMontant } from '@/lib/config/sygfp-constants';
import { cn } from '@/lib/utils';

interface DashboardHRProps {
  directionId: string;
  directionCode: string;
  directionNom: string;
}

export function DashboardHR({ directionId, directionCode, directionNom }: DashboardHRProps) {
  const navigate = useNavigate();
  const { kpis, isLoading: dirLoading, refetch: dirRefetch } = useDirectionDashboard(directionId);
  const { data: hrData, isLoading: hrLoading, refetch: hrRefetch } = useHRDashboardData();

  const isLoading = dirLoading || hrLoading;

  if (isLoading) {
    return <DashboardHRSkeleton />;
  }

  const effectifTotal = hrData?.effectifTotal ?? 0;
  const directionsParEffectif = hrData?.directionsParEffectif ?? [];
  const budgetFormation = hrData?.budgetFormation ?? 0;
  const budgetFormationUtilise = hrData?.budgetFormationUtilise ?? 0;

  const tauxFormation =
    budgetFormation > 0 ? Math.round((budgetFormationUtilise / budgetFormation) * 100) : 0;

  const refetch = () => {
    dirRefetch();
    hrRefetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Ressources Humaines</h1>
            <p className="text-muted-foreground">{directionNom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            {directionCode}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Effectif Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Effectif Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{effectifTotal}</div>
            <p className="text-xs text-muted-foreground mt-2">Agents actifs</p>
          </CardContent>
        </Card>

        {/* Mouvements - SIRH requis */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="opacity-50 pointer-events-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Mouvements du Mois</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      <span className="text-lg font-bold">--</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <UserMinus className="h-4 w-4" />
                      <span className="text-lg font-bold">--</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">N/D</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Module SIRH requis</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Masse Salariale - SIRH requis */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="opacity-50 pointer-events-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Masse Salariale</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">N/D</div>
                  <p className="text-xs text-muted-foreground mt-1">Module SIRH requis</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Module SIRH requis</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Absences - SIRH requis */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="opacity-50 pointer-events-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">En Absence</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-bold text-muted-foreground">--</span>
                      <span className="text-xs text-muted-foreground ml-1">congés</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-muted-foreground">--</span>
                      <span className="text-xs text-muted-foreground ml-1">missions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Module SIRH requis</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Budget Formation et Répartition */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Budget Formation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Budget Formation
            </CardTitle>
            <CardDescription>Utilisation du budget formation annuel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Budget alloué</span>
              <span className="font-semibold">{formatMontant(budgetFormation)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Utilisé</span>
              <span className="font-semibold text-primary">
                {formatMontant(budgetFormationUtilise)}
              </span>
            </div>
            <Progress value={tauxFormation} className="h-3" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{tauxFormation}% utilisé</span>
              <span className="text-muted-foreground">
                Reste: {formatMontant(budgetFormation - budgetFormationUtilise)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par Direction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Effectif par Direction
            </CardTitle>
            <CardDescription>Répartition du personnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {directionsParEffectif.map((dir, index) => {
                const percent =
                  effectifTotal > 0 ? Math.round((dir.effectif / effectifTotal) * 100) : 0;
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-orange-500',
                  'bg-gray-400',
                  'bg-cyan-500',
                  'bg-rose-500',
                  'bg-amber-500',
                  'bg-indigo-500',
                  'bg-teal-500',
                ];
                return (
                  <div key={dir.direction_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{dir.code}</span>
                      <span className="text-muted-foreground">
                        {dir.effectif} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          colors[index % colors.length]
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers Direction */}
      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle>Dossiers de la Direction</CardTitle>
            <CardDescription>Suivi des dossiers financiers DGPECRP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.notes_sef.total}</div>
                <p className="text-xs text-muted-foreground">Notes SEF</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.engagements.total}</div>
                <p className="text-xs text-muted-foreground">Engagements</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.liquidations.total}</div>
                <p className="text-xs text-muted-foreground">Liquidations</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.taux_execution}%</div>
                <p className="text-xs text-muted-foreground">Taux exécution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions RH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/admin/utilisateurs')}
            >
              <Users className="h-4 w-4" />
              Gérer les Utilisateurs
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/notes-sef?action=new')}
            >
              <Briefcase className="h-4 w-4" />
              Nouvelle Demande
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/etats-execution')}
            >
              <TrendingUp className="h-4 w-4" />
              Rapports
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/admin/delegations')}
            >
              <Building2 className="h-4 w-4" />
              Délégations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardHRSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DashboardHR;
