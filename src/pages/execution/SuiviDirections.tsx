import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Building2,
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  FileCheck,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSuiviDirections, SuiviDirectionRow } from '@/hooks/useSuiviDirections';
import { formatCurrency } from '@/lib/utils';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
  '#a855f7',
  '#0ea5e9',
];

type SortKey =
  | 'direction_code'
  | 'budget_modifie'
  | 'taux_engagement'
  | 'total_notes'
  | 'notes_en_attente';
type SortDir = 'asc' | 'desc';

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function getTauxColor(taux: number): string {
  if (taux >= 75) return 'text-green-600';
  if (taux >= 50) return 'text-yellow-600';
  if (taux >= 25) return 'text-orange-600';
  return 'text-red-600';
}

function getTauxBadge(taux: number) {
  if (taux >= 75) return <Badge className="bg-green-100 text-green-700">{taux.toFixed(1)}%</Badge>;
  if (taux >= 50)
    return <Badge className="bg-yellow-100 text-yellow-700">{taux.toFixed(1)}%</Badge>;
  if (taux >= 25)
    return <Badge className="bg-orange-100 text-orange-700">{taux.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-700">{taux.toFixed(1)}%</Badge>;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuiviDirections() {
  const { rows, kpis, isLoading, error } = useSuiviDirections();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('budget_modifie');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = rows
    .filter(
      (r) =>
        r.direction_code.toLowerCase().includes(search.toLowerCase()) ||
        r.direction_label.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  // Data pour le graphique barres (top 10 budgets)
  const chartBudgetData = [...rows]
    .sort((a, b) => b.budget_modifie - a.budget_modifie)
    .slice(0, 10)
    .map((r) => ({
      name: r.direction_code,
      budget: r.budget_modifie,
      engagements: r.total_engagements,
      liquidations: r.total_liquidations,
    }));

  // Data pour le pie chart (répartition engagements)
  const pieData = rows
    .filter((r) => r.total_engagements > 0)
    .map((r) => ({
      name: r.direction_code,
      value: r.total_engagements,
    }));

  // Data pour le graphique notes
  const chartNotesData = rows
    .filter((r) => r.total_notes > 0)
    .sort((a, b) => b.total_notes - a.total_notes)
    .slice(0, 10)
    .map((r) => ({
      name: r.direction_code,
      validees: r.notes_validees,
      en_attente: r.notes_en_attente,
      differees: r.notes_differees,
      rejetees: r.notes_rejetees,
    }));

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erreur lors du chargement des données : {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          Suivi des Directions
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de l'exécution budgétaire et des notes par direction
        </p>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          title="Budget Total"
          value={formatCompact(kpis.budget_total)}
          subtitle={formatCurrency(kpis.budget_total)}
          icon={Wallet}
          color="bg-blue-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Engagements"
          value={`${kpis.taux_engagement_global.toFixed(1)}%`}
          subtitle={formatCurrency(kpis.engagements_total)}
          icon={CreditCard}
          color="bg-green-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Liquidations"
          value={`${kpis.taux_liquidation_global.toFixed(1)}%`}
          subtitle={formatCurrency(kpis.liquidations_total)}
          icon={Receipt}
          color="bg-yellow-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Ordonnancements"
          value={`${kpis.taux_ordonnancement_global.toFixed(1)}%`}
          subtitle={formatCurrency(kpis.ordonnancements_total)}
          icon={FileCheck}
          color="bg-purple-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Notes Totales"
          value={String(kpis.total_notes)}
          subtitle={`${kpis.notes_validees} validées`}
          icon={FileText}
          color="bg-indigo-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Directions"
          value={String(kpis.nb_directions)}
          subtitle={`${kpis.notes_en_attente} notes en attente`}
          icon={Building2}
          color="bg-cyan-500"
          isLoading={isLoading}
        />
      </div>

      {/* Onglets */}
      <Tabs defaultValue="tableau" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tableau">Tableau Détaillé</TabsTrigger>
          <TabsTrigger value="budget">Exécution Budgétaire</TabsTrigger>
          <TabsTrigger value="notes">Suivi des Notes</TabsTrigger>
        </TabsList>

        {/* Onglet Tableau */}
        <TabsContent value="tableau" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une direction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} direction{filtered.length > 1 ? 's' : ''}
            </span>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader
                        label="Direction"
                        sortKey="direction_code"
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortableHeader
                        label="Budget Modifié"
                        sortKey="budget_modifie"
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortableHeader
                        label="Taux Eng."
                        sortKey="taux_engagement"
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={toggleSort}
                      />
                      <TableHead className="text-right">Taux Liq.</TableHead>
                      <TableHead className="text-right">Taux Ord.</TableHead>
                      <SortableHeader
                        label="Notes"
                        sortKey="total_notes"
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortableHeader
                        label="En Attente"
                        sortKey="notes_en_attente"
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={toggleSort}
                      />
                      <TableHead>Progression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune direction trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => <DirectionRow key={row.direction_id} row={row} />)
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Budget */}
        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top 10 — Budget vs Engagements vs Liquidations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartBudgetData}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v: number) => formatCompact(v)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Bar
                        dataKey="engagements"
                        name="Engagements"
                        fill="#10b981"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="liquidations"
                        name="Liquidations"
                        fill="#f59e0b"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Répartition des Engagements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucun engagement enregistré
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cartes par direction */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))
              : rows
                  .sort((a, b) => b.budget_modifie - a.budget_modifie)
                  .map((row) => <DirectionBudgetCard key={row.direction_id} row={row} />)}
          </div>
        </TabsContent>

        {/* Onglet Notes */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes par Direction (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartNotesData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Aucune note enregistrée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartNotesData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="validees" name="Validées" fill="#10b981" stackId="notes" />
                    <Bar dataKey="en_attente" name="En attente" fill="#f59e0b" stackId="notes" />
                    <Bar dataKey="differees" name="Différées" fill="#8b5cf6" stackId="notes" />
                    <Bar dataKey="rejetees" name="Rejetées" fill="#ef4444" stackId="notes" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cartes notes par direction */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))
              : rows
                  .filter((r) => r.total_notes > 0)
                  .sort((a, b) => b.notes_en_attente - a.notes_en_attente)
                  .map((row) => <DirectionNotesCard key={row.direction_id} row={row} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 text-right"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/40'}`}
        />
        {active && <span className="text-[10px]">{currentDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </TableHead>
  );
}

function DirectionRow({ row }: { row: SuiviDirectionRow }) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <div>
          <span className="font-medium">{row.direction_code}</span>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.direction_label}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatCurrency(row.budget_modifie)}
      </TableCell>
      <TableCell className="text-right">{getTauxBadge(row.taux_engagement)}</TableCell>
      <TableCell className="text-right">
        <span className={getTauxColor(row.taux_liquidation)}>
          {row.taux_liquidation.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className={getTauxColor(row.taux_ordonnancement)}>
          {row.taux_ordonnancement.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell className="text-right">{row.total_notes}</TableCell>
      <TableCell className="text-right">
        {row.notes_en_attente > 0 ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {row.notes_en_attente}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell>
        <div className="w-24">
          <Progress value={row.taux_engagement} className="h-2" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function DirectionBudgetCard({ row }: { row: SuiviDirectionRow }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{row.direction_code}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {row.direction_label}
            </p>
          </div>
          {getTauxBadge(row.taux_engagement)}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-mono">{formatCompact(row.budget_modifie)}</span>
          </div>
          <Progress value={row.taux_engagement} className="h-1.5" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Eng.</p>
            <p className="font-medium">{formatCompact(row.total_engagements)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Liq.</p>
            <p className="font-medium">{formatCompact(row.total_liquidations)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Ord.</p>
            <p className="font-medium">{formatCompact(row.total_ordonnancements)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectionNotesCard({ row }: { row: SuiviDirectionRow }) {
  const total = row.total_notes || 1;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{row.direction_code}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {row.direction_label}
            </p>
          </div>
          <Badge variant="outline">
            {row.total_notes} note{row.total_notes > 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>
              {row.notes_validees} validées ({((row.notes_validees / total) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-yellow-500" />
            <span>{row.notes_en_attente} en attente</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-purple-500" />
            <span>{row.notes_differees} différées</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>{row.notes_rejetees} rejetées</span>
          </div>
        </div>
        {row.montant_valide > 0 && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Montant validé :{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(row.montant_valide)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
