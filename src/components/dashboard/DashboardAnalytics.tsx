/**
 * DashboardAnalytics - Dashboard spécialisé Suivi et Évaluation (DSESP)
 * Focalisé sur: Graphiques d'évolution, Comparatifs, Indicateurs de performance
 */
// @ts-nocheck - Types seront mis à jour après exécution de la migration et régénération des types
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  PieChart,
  LineChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Clock,
  Zap,
  Building2,
} from "lucide-react";
import { useDirectionDashboard, useAllDirectionsStats } from "@/hooks/dashboard/useDirectionDashboard";
import { formatMontant, formatMontantCompact } from "@/lib/config/sygfp-constants";
import { cn } from "@/lib/utils";

interface DashboardAnalyticsProps {
  directionId: string;
  directionCode: string;
  directionNom: string;
}

export function DashboardAnalytics({
  directionId,
  directionCode,
  directionNom,
}: DashboardAnalyticsProps) {
  const navigate = useNavigate();
  const { kpis, evolution, isLoading, refetch } = useDirectionDashboard(directionId);
  const { data: allDirectionsStats, isLoading: isLoadingAll } = useAllDirectionsStats();

  if (isLoading || isLoadingAll) {
    return <DashboardAnalyticsSkeleton />;
  }

  // Calcul des métriques globales
  const totalStats = allDirectionsStats?.reduce(
    (acc, dir) => ({
      totalEngagements: acc.totalEngagements + (dir.total_engagements || 0),
      totalLiquidations: acc.totalLiquidations + (dir.total_liquidations || 0),
      totalOrdonnancements: acc.totalOrdonnancements + (dir.total_ordonnancements || 0),
      totalSEF: acc.totalSEF + (dir.sef_total || 0),
    }),
    { totalEngagements: 0, totalLiquidations: 0, totalOrdonnancements: 0, totalSEF: 0 }
  ) || { totalEngagements: 0, totalLiquidations: 0, totalOrdonnancements: 0, totalSEF: 0 };

  // Top 5 directions par engagement
  const topDirections = [...(allDirectionsStats || [])]
    .sort((a, b) => (b.total_engagements || 0) - (a.total_engagements || 0))
    .slice(0, 5);

  // Calcul taux global
  const tauxGlobal = totalStats.totalSEF > 0
    ? Math.round((totalStats.totalOrdonnancements / totalStats.totalEngagements) * 100)
    : 0;

  // Évolution mensuelle
  const evolutionData = evolution || [];
  const currentMonth = new Date().getMonth();
  const evolutionTrend = evolutionData.length >= 2
    ? evolutionData[currentMonth]?.engagements > evolutionData[currentMonth - 1]?.engagements
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Analytics</h1>
            <p className="text-muted-foreground">{directionNom} - Suivi et Évaluation</p>
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

      {/* KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Engagements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagements Globaux</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMontantCompact(totalStats.totalEngagements)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {evolutionTrend !== null && (
                evolutionTrend ? (
                  <span className="text-success flex items-center text-xs">
                    <ArrowUpRight className="h-3 w-3" /> En hausse
                  </span>
                ) : (
                  <span className="text-warning flex items-center text-xs">
                    <ArrowDownRight className="h-3 w-3" /> En baisse
                  </span>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liquidations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Liquidations Globales</CardTitle>
            <LineChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMontantCompact(totalStats.totalLiquidations)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes directions confondues
            </p>
          </CardContent>
        </Card>

        {/* Ordonnancements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ordonnancements</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMontantCompact(totalStats.totalOrdonnancements)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant total ordonnancé
            </p>
          </CardContent>
        </Card>

        {/* Taux de transformation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux Transformation</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxGlobal}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ordo / Engagements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Évolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Évolution Mensuelle
          </CardTitle>
          <CardDescription>Montants par mois pour l'exercice en cours</CardDescription>
        </CardHeader>
        <CardContent>
          {evolutionData.length > 0 ? (
            <div className="space-y-4">
              {/* Mini bar chart simulé */}
              <div className="flex items-end gap-1 h-32">
                {evolutionData.map((month, index) => {
                  const maxValue = Math.max(...evolutionData.map(m => m.engagements || 0));
                  const height = maxValue > 0 ? ((month.engagements || 0) / maxValue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all",
                          index === currentMonth ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {month.mois_nom}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Engagements</p>
                  <p className="font-semibold text-emerald-500">
                    {formatMontantCompact(
                      evolutionData.reduce((sum, m) => sum + (m.engagements || 0), 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liquidations</p>
                  <p className="font-semibold text-blue-500">
                    {formatMontantCompact(
                      evolutionData.reduce((sum, m) => sum + (m.liquidations || 0), 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ordonnancements</p>
                  <p className="font-semibold text-purple-500">
                    {formatMontantCompact(
                      evolutionData.reduce((sum, m) => sum + (m.ordonnancements || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Aucune donnée d'évolution disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparatif Directions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-emerald-500" />
            Top 5 Directions par Engagement
          </CardTitle>
          <CardDescription>Classement des directions par volume d'engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDirections.map((dir, index) => {
              const percent = totalStats.totalEngagements > 0
                ? Math.round((dir.total_engagements / totalStats.totalEngagements) * 100)
                : 0;
              const colors = [
                "bg-emerald-500",
                "bg-blue-500",
                "bg-purple-500",
                "bg-orange-500",
                "bg-pink-500",
              ];
              return (
                <div key={dir.direction_code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium w-6">#{index + 1}</span>
                      <Badge variant="outline">{dir.direction_code}</Badge>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {dir.direction_nom}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatMontantCompact(dir.total_engagements)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", colors[index])}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Direction actuelle */}
      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle>Indicateurs de la Direction DSESP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {kpis.notes_sef.total}
                </div>
                <p className="text-xs text-muted-foreground">Notes SEF</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {kpis.engagements.total}
                </div>
                <p className="text-xs text-muted-foreground">Engagements</p>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {kpis.liquidations.total}
                </div>
                <p className="text-xs text-muted-foreground">Liquidations</p>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {kpis.taux_execution}%
                </div>
                <p className="text-xs text-muted-foreground">Taux exécution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/etats-execution")}
            >
              <BarChart3 className="h-4 w-4" />
              États d'Exécution
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/planification/structure")}
            >
              <Target className="h-4 w-4" />
              Structure Budget
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/admin/journal-audit")}
            >
              <Activity className="h-4 w-4" />
              Journal Activité
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/recherche")}
            >
              <Building2 className="h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardAnalyticsSkeleton() {
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
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardAnalytics;
