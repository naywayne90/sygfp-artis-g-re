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
import { usePlansTravail } from '@/hooks/usePlansTravail';
import { useProjetTaches } from '@/hooks/useProjetTaches';
import { useRBAC } from '@/hooks/useRBAC';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { Building2, FolderKanban, ListChecks, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const STATUT_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  brouillon: 'secondary',
  valide: 'default',
  en_cours: 'default',
  cloture: 'outline',
};

export default function RoadmapDirection() {
  const navigate = useNavigate();
  const { directionId: rbacDirectionId, profile } = useRBAC();
  const directionId = rbacDirectionId ?? undefined;
  const { plans, isLoading: plansLoading } = usePlansTravail(directionId);
  const { stats, tachesEnRetard, isLoading: tachesLoading } = useProjetTaches();

  const isLoading = plansLoading || tachesLoading;

  const budgetTotal = plans.reduce((s, p) => s + (p.budget_alloue || 0), 0);
  const budgetConsomme = plans.reduce((s, p) => s + (p.budget_consomme || 0), 0);
  const pctBudget = budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Ma Direction - Feuille de Route
        </h1>
        <p className="text-muted-foreground">
          {profile?.direction_code ?? 'Direction non assignee'}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              Plans
            </div>
            <p className="text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              Taches
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{stats.termine} terminees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Avancement
            </div>
            <p className="text-2xl font-bold">{stats.avancementMoyen}%</p>
            <Progress value={stats.avancementMoyen} className="mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              En retard
            </div>
            <p className="text-2xl font-bold text-destructive">{tachesEnRetard.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Budget global</span>
            <span className="text-sm">
              {formatCurrency(budgetConsomme)} / {formatCurrency(budgetTotal)} ({pctBudget}%)
            </span>
          </div>
          <Progress value={pctBudget} />
        </CardContent>
      </Card>

      {/* Plans list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Plans de travail</h2>
        {plans.length === 0 ? (
          <EmptyStateNoData entityName="plan de travail" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const p =
                plan.budget_alloue > 0
                  ? Math.round((plan.budget_consomme / plan.budget_alloue) * 100)
                  : 0;

              return (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{plan.libelle}</CardTitle>
                      <Badge variant={STATUT_COLORS[plan.statut] ?? 'outline'}>{plan.statut}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{plan.code}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget</span>
                      <span>{formatCurrency(plan.budget_alloue)}</span>
                    </div>
                    <Progress value={p} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {plan.date_debut ?? '?'} - {plan.date_fin ?? '?'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/planification/projets/${plan.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Taches par statut */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Taches par statut</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{stats.planifie} planifie(s)</Badge>
          <Badge variant="default">{stats.en_cours} en cours</Badge>
          <Badge variant="default">{stats.termine} termine(s)</Badge>
          {stats.en_retard > 0 && <Badge variant="destructive">{stats.en_retard} en retard</Badge>}
          {stats.suspendu > 0 && <Badge variant="outline">{stats.suspendu} suspendu(s)</Badge>}
          {stats.annule > 0 && <Badge variant="outline">{stats.annule} annule(s)</Badge>}
        </div>
      </div>

      {/* Overdue tasks */}
      {tachesEnRetard.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Taches en retard
          </h2>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libelle</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Avancement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tachesEnRetard.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.code}</TableCell>
                      <TableCell>{t.libelle}</TableCell>
                      <TableCell>{t.date_fin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={t.avancement} className="w-16" />
                          <span className="text-sm">{t.avancement}%</span>
                        </div>
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
