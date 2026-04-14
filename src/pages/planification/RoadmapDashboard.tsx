import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRoadmapDashboard } from '@/hooks/useRoadmapDashboard';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Clock,
  Percent,
  ClipboardCheck,
} from 'lucide-react';
import type { TacheStatut } from '@/types/roadmap';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const formatCurrencyShort = (amount: number) => {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' Md';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + ' M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + ' k';
  return amount.toString();
};

function daysBetween(dateStr: string): number {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUT_COLORS: Record<string, string> = {
  planifie: '#94a3b8',
  en_cours: '#3b82f6',
  termine: '#22c55e',
  en_retard: '#ef4444',
  suspendu: '#f59e0b',
  annule: '#6b7280',
};

const STATUT_LABELS: Record<string, string> = {
  planifie: 'Planifie',
  en_cours: 'En cours',
  termine: 'Termine',
  en_retard: 'En retard',
  suspendu: 'Suspendu',
  annule: 'Annule',
};

function exportDashboardCSV(
  directionStats: {
    direction_code: string;
    direction_nom: string;
    stats: {
      totalPlans: number;
      totalTaches: number;
      avancementGlobal: number;
      budgetTotal: number;
      budgetConsomme: number;
    };
  }[],
  format: 'csv' | 'excel'
) {
  const separator = format === 'excel' ? ';' : ',';
  const headers = [
    'Direction',
    'Code',
    'Plans',
    'Taches',
    'Avancement (%)',
    'Budget Alloue',
    'Budget Consomme',
  ];
  const rows = directionStats.map((ds) => [
    ds.direction_nom,
    ds.direction_code,
    ds.stats.totalPlans,
    ds.stats.totalTaches,
    ds.stats.avancementGlobal,
    ds.stats.budgetTotal,
    ds.stats.budgetConsomme,
  ]);
  const csv = [headers.join(separator), ...rows.map((r) => r.join(separator))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard_feuille_de_route_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatutBadgeVariant(
  statut: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'termine':
      return 'default';
    case 'en_retard':
      return 'destructive';
    case 'en_cours':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getExecutionColor(rate: number): string {
  if (rate > 100) return 'text-destructive';
  if (rate >= 80) return 'text-orange-500';
  return 'text-green-600';
}

function getExecutionProgressClass(rate: number): string {
  if (rate > 100) return '[&>div]:bg-destructive';
  if (rate >= 80) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-green-600';
}

export default function RoadmapDashboard() {
  const navigate = useNavigate();
  const { globalStats, directionStats, topTachesEnRetard, plans, taches, isLoading } =
    useRoadmapDashboard();

  const tauxExecution = useMemo(() => {
    if (globalStats.budgetTotal === 0) return 0;
    return Math.round((globalStats.budgetConsomme / globalStats.budgetTotal) * 100);
  }, [globalStats.budgetConsomme, globalStats.budgetTotal]);

  // Pie chart data: count taches by statut
  const statutPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of taches) {
      const s = t.statut as string;
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([statut, value]) => ({
        name: STATUT_LABELS[statut] || statut,
        value,
        statut,
      }))
      .filter((d) => d.value > 0);
  }, [taches]);

  // Bar chart data: budget per direction
  const budgetBarData = useMemo(() => {
    return directionStats.map((ds) => ({
      name: ds.direction_code,
      alloue: ds.stats.budgetTotal,
      consomme: ds.stats.budgetConsomme,
    }));
  }, [directionStats]);

  // Recent activity: last 5 tasks by updated_at
  const activiteRecente = useMemo(() => {
    return [...taches]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [taches]);

  // Submission status overview per direction
  const submissionOverview = useMemo(() => {
    const byDirection = new Map<
      string,
      {
        code: string;
        nom: string;
        brouillon: number;
        soumis: number;
        valide: number;
        enCours: number;
      }
    >();

    for (const plan of plans) {
      const dirId = plan.direction_id;
      if (!byDirection.has(dirId)) {
        byDirection.set(dirId, {
          code: plan.direction?.code || plan.direction?.sigle || '?',
          nom: plan.direction?.label || 'Direction',
          brouillon: 0,
          soumis: 0,
          valide: 0,
          enCours: 0,
        });
      }
      const entry = byDirection.get(dirId);
      if (!entry) continue;
      if (plan.statut === 'brouillon') entry.brouillon++;
      else if (plan.statut === 'soumis') entry.soumis++;
      else if (plan.statut === 'en_cours') entry.enCours++;
      else if (plan.statut === 'valide') entry.valide++;
    }

    return Array.from(byDirection.values());
  }, [plans]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Tableau de Bord - Feuille de Route
          </h1>
          <p className="text-muted-foreground">Vue consolidee de toutes les directions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/planification/projets')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Plan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportDashboardCSV(directionStats, 'csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDashboardCSV(directionStats, 'excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter Excel (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <Percent className="h-4 w-4" />
              Taux execution
            </div>
            <p className={`text-2xl font-bold ${getExecutionColor(tauxExecution)}`}>
              {tauxExecution}%
            </p>
            {globalStats.budgetTotal > 0 && (
              <Progress
                value={Math.min(tauxExecution, 100)}
                className={`mt-1 ${getExecutionProgressClass(tauxExecution)}`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Taux d'execution global bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Taux d&apos;execution budgetaire global</span>
            </div>
            <span className={`text-xl font-bold ${getExecutionColor(tauxExecution)}`}>
              {tauxExecution}%
            </span>
          </div>
          <Progress
            value={Math.min(tauxExecution, 100)}
            className={`h-4 ${getExecutionProgressClass(tauxExecution)}`}
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Consomme: {formatCurrency(globalStats.budgetConsomme)}</span>
            <span>Alloue: {formatCurrency(globalStats.budgetTotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart - Repartition par statut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Repartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {statutPieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune tache</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statutPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }: { name: string; value: number }) =>
                      `${name}: ${value}`
                    }
                  >
                    {statutPieData.map((entry) => (
                      <Cell key={entry.statut} fill={STATUT_COLORS[entry.statut] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Budget par direction */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Budget par direction</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetBarData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune direction</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={budgetBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v: number) => formatCurrencyShort(v)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="alloue" name="Alloue" fill="#3b82f6" />
                  <Bar dataKey="consomme" name="Consomme" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statut des soumissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Statut des soumissions par direction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissionOverview.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Brouillon</TableHead>
                  <TableHead>Soumis</TableHead>
                  <TableHead>Valide</TableHead>
                  <TableHead>En cours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionOverview.map((dir) => (
                  <TableRow key={dir.code}>
                    <TableCell className="font-medium">{dir.nom}</TableCell>
                    <TableCell>
                      {dir.brouillon > 0 ? (
                        <Badge className="bg-gray-100 text-gray-800">{dir.brouillon}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {dir.soumis > 0 ? (
                        <Badge className="bg-amber-100 text-amber-800">{dir.soumis}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {dir.valide > 0 ? (
                        <Badge className="bg-green-100 text-green-800">{dir.valide}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {dir.enCours > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800">{dir.enCours}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune soumission</p>
          )}
        </CardContent>
      </Card>

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
                    <TableHead>Responsable</TableHead>
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
                      <TableCell className="text-sm">
                        {tache.responsable
                          ? tache.responsable.full_name ||
                            `${tache.responsable.first_name ?? ''} ${tache.responsable.last_name ?? ''}`.trim() ||
                            '-'
                          : '-'}
                      </TableCell>
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

      {/* Activite recente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activite recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activiteRecente.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Aucune activite recente</p>
          ) : (
            <div className="space-y-3">
              {activiteRecente.map((tache) => (
                <div
                  key={tache.id}
                  className="flex items-start gap-3 border-l-2 border-muted pl-3 py-1"
                >
                  <Badge variant={getStatutBadgeVariant(tache.statut)} className="shrink-0 mt-0.5">
                    {STATUT_LABELS[tache.statut as TacheStatut] || tache.statut}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tache.libelle}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>
                        {new Date(tache.updated_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {tache.responsable && (
                        <>
                          <span>-</span>
                          <span>
                            {tache.responsable.full_name ||
                              `${tache.responsable.first_name ?? ''} ${tache.responsable.last_name ?? ''}`.trim()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {tache.avancement}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
