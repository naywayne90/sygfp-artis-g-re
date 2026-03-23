import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
import {
  Building2,
  FolderKanban,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Eye,
  Plus,
  Send,
  Upload,
  Calendar,
  Users,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tache } from '@/types/roadmap';

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

const PRIORITE_COLORS: Record<string, string> = {
  basse: 'bg-slate-100 text-slate-700',
  normale: 'bg-blue-100 text-blue-700',
  haute: 'bg-orange-100 text-orange-700',
  critique: 'bg-red-100 text-red-700',
};

const STATUT_BAR_COLORS: Record<string, string> = {
  planifie: '#94a3b8',
  en_cours: '#3b82f6',
  termine: '#22c55e',
  en_retard: '#ef4444',
  suspendu: '#eab308',
  annule: '#d1d5db',
};

const STATUT_LABELS: Record<string, string> = {
  planifie: 'Planifie',
  en_cours: 'En cours',
  termine: 'Termine',
  en_retard: 'En retard',
  suspendu: 'Suspendu',
  annule: 'Annule',
};

interface ResponsableSummary {
  id: string;
  nom: string;
  prenom: string;
  taskCount: number;
  avgAvancement: number;
}

export default function RoadmapDirection() {
  const navigate = useNavigate();
  const { directionId: rbacDirectionId, profile } = useRBAC();
  const directionId = rbacDirectionId ?? undefined;
  const { plans, isLoading: plansLoading } = usePlansTravail(directionId);
  const { taches: allTaches, isLoading: tachesLoading } = useProjetTaches();

  const isLoading = plansLoading || tachesLoading;

  // Filter tasks to only those belonging to this direction's plans
  const directionPlanIds = useMemo(() => new Set(plans?.map((p) => p.id) || []), [plans]);
  const directionTaches = useMemo(
    () =>
      (allTaches || []).filter((t) => t.plan_travail_id && directionPlanIds.has(t.plan_travail_id)),
    [allTaches, directionPlanIds]
  );

  // Compute stats from filtered tasks
  const stats = useMemo(
    () => ({
      total: directionTaches.length,
      planifie: directionTaches.filter((t) => t.statut === 'planifie').length,
      en_cours: directionTaches.filter((t) => t.statut === 'en_cours').length,
      termine: directionTaches.filter((t) => t.statut === 'termine').length,
      en_retard: directionTaches.filter((t) => t.statut === 'en_retard').length,
      suspendu: directionTaches.filter((t) => t.statut === 'suspendu').length,
      annule: directionTaches.filter((t) => t.statut === 'annule').length,
      avancementMoyen:
        directionTaches.length > 0
          ? Math.round(
              directionTaches.reduce((sum, t) => sum + (t.avancement || 0), 0) /
                directionTaches.length
            )
          : 0,
    }),
    [directionTaches]
  );

  // Tasks overdue: date_fin < today AND statut not termine/annule
  const tachesEnRetard = useMemo(
    () =>
      directionTaches.filter((t) => {
        if (!t.date_fin) return false;
        if (t.statut === 'termine' || t.statut === 'annule') return false;
        return new Date(t.date_fin) < new Date();
      }),
    [directionTaches]
  );

  // Upcoming deadlines: date_fin within next 14 days
  const prochEcheances = useMemo(() => {
    const today = new Date();
    const in14days = new Date();
    in14days.setDate(today.getDate() + 14);

    return directionTaches
      .filter((t) => {
        if (!t.date_fin) return false;
        if (t.statut === 'termine' || t.statut === 'annule') return false;
        const df = new Date(t.date_fin);
        return df >= today && df <= in14days;
      })
      .sort((a, b) => new Date(a.date_fin || '').getTime() - new Date(b.date_fin || '').getTime())
      .slice(0, 5);
  }, [directionTaches]);

  // Team summary: unique responsables with stats
  const equipe = useMemo(() => {
    const map = new Map<string, ResponsableSummary>();
    directionTaches.forEach((t) => {
      if (!t.responsable) return;
      const key = t.responsable.id;
      const existing = map.get(key);
      if (existing) {
        existing.taskCount += 1;
        existing.avgAvancement =
          (existing.avgAvancement * (existing.taskCount - 1) + (t.avancement || 0)) /
          existing.taskCount;
      } else {
        map.set(key, {
          id: t.responsable.id,
          nom: t.responsable.nom,
          prenom: t.responsable.prenom,
          taskCount: 1,
          avgAvancement: t.avancement || 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.taskCount - a.taskCount);
  }, [directionTaches]);

  const budgetTotal = useMemo(() => plans.reduce((s, p) => s + (p.budget_alloue || 0), 0), [plans]);
  const budgetConsomme = useMemo(
    () => plans.reduce((s, p) => s + (p.budget_consomme || 0), 0),
    [plans]
  );
  const pctBudget = budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0;

  // PieChart data for avancement
  const pieData = useMemo(
    () => [
      { name: 'Realise', value: stats.avancementMoyen },
      { name: 'Restant', value: 100 - stats.avancementMoyen },
    ],
    [stats.avancementMoyen]
  );

  // Stacked bar data for statut breakdown
  const statutBarSegments = useMemo(() => {
    const segments: Array<{ key: string; label: string; count: number; color: string }> = [];
    const keys = ['planifie', 'en_cours', 'termine', 'en_retard', 'suspendu', 'annule'] as const;
    keys.forEach((key) => {
      const count = stats[key];
      if (count > 0) {
        segments.push({
          key,
          label: STATUT_LABELS[key],
          count,
          color: STATUT_BAR_COLORS[key],
        });
      }
    });
    return segments;
  }, [stats]);

  // CSV export
  const handleExport = useCallback(() => {
    const lines: string[] = [];
    lines.push('Type,Code,Libelle,Statut,Budget Alloue,Budget Consomme,Date Debut,Date Fin');
    plans.forEach((p) => {
      lines.push(
        `Plan,"${p.code}","${p.libelle}",${p.statut},${p.budget_alloue},${p.budget_consomme},${p.date_debut ?? ''},${p.date_fin ?? ''}`
      );
    });
    lines.push('');
    lines.push('Code Tache,Libelle,Statut,Avancement,Priorite,Date Fin,Responsable');
    directionTaches.forEach((t) => {
      const resp = t.responsable ? `${t.responsable.prenom} ${t.responsable.nom}` : '';
      lines.push(
        `"${t.code}","${t.libelle}",${t.statut},${t.avancement}%,${t.priorite},${t.date_fin ?? ''},"${resp}"`
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `direction_roadmap_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [plans, directionTaches]);

  const getResponsableName = (t: Tache) =>
    t.responsable ? `${t.responsable.prenom} ${t.responsable.nom}` : '-';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Ma Direction - Feuille de Route
          </h1>
          <p className="text-muted-foreground">
            {profile?.direction_code ?? 'Direction non assignee'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate('/planification/projets')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Plan
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/planification/soumissions-feuilles-route')}
        >
          <Send className="h-4 w-4 mr-2" />
          Mes Soumissions
        </Button>
        <Button variant="outline" onClick={() => navigate('/planification/feuilles-route')}>
          <Upload className="h-4 w-4 mr-2" />
          Importer Activites
        </Button>
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

        {/* Avancement PieChart KPI */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Avancement
            </div>
            {stats.total > 0 ? (
              <div className="relative h-20 w-20 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={36}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{stats.avancementMoyen}%</span>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">-</p>
            )}
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

      {/* Prochaines echeances */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Prochaines echeances
        </h2>
        {prochEcheances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prochEcheances.map((t) => {
              const daysLeft = Math.ceil(
                (new Date(t.date_fin || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <Card key={t.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">{t.libelle}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t.date_fin}</span>
                      <span className={daysLeft <= 3 ? 'text-destructive font-medium' : ''}>
                        {daysLeft === 0
                          ? "Aujourd'hui"
                          : daysLeft === 1
                            ? 'Demain'
                            : `${daysLeft} jours`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={t.avancement} className="flex-1" />
                      <span className="text-xs font-medium">{t.avancement}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{getResponsableName(t)}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${PRIORITE_COLORS[t.priorite] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {t.priorite}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune echeance dans les 14 prochains jours
          </p>
        )}
      </div>

      {/* Taches par statut — Stacked bar */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Taches par statut</h2>
        {stats.total > 0 ? (
          <Card>
            <CardContent className="pt-4">
              {/* Stacked bar */}
              <div className="flex w-full h-8 rounded-md overflow-hidden">
                {statutBarSegments.map((seg) => {
                  const pct = (seg.count / stats.total) * 100;
                  return (
                    <div
                      key={seg.key}
                      className="flex items-center justify-center text-xs font-medium text-white transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: seg.color,
                        minWidth: pct > 0 ? '28px' : '0',
                      }}
                      title={`${seg.label}: ${seg.count}`}
                    >
                      {pct >= 8 ? seg.count : ''}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {statutBarSegments.map((seg) => (
                  <div key={seg.key} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                    <span>
                      {seg.label} ({seg.count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune tache enregistree</p>
        )}
      </div>

      {/* Equipe & Responsabilites */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Equipe
        </h2>
        {equipe.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {equipe.map((member) => (
              <Card key={member.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-sm font-bold">
                    {member.prenom.charAt(0)}
                    {member.nom.charAt(0)}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {member.prenom} {member.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.taskCount} tache{member.taskCount > 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1">
                    <Progress value={Math.round(member.avgAvancement)} className="flex-1" />
                    <span className="text-xs">{Math.round(member.avgAvancement)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun membre assigne</p>
        )}
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
                    <TableHead>Responsable</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Avancement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tachesEnRetard.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.code}</TableCell>
                      <TableCell>{t.libelle}</TableCell>
                      <TableCell className="text-sm">{getResponsableName(t)}</TableCell>
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
