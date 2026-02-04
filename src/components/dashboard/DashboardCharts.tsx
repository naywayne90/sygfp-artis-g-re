/**
 * DashboardCharts - Graphiques pour le dashboard principal
 * Utilise Recharts pour les visualisations (Pie, Bar, Line, Area)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PieChartIcon, BarChart3, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChartData } from '@/hooks/useDashboardData';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardChartsProps {
  /** Données des graphiques */
  data: ChartData | null;
  /** En chargement */
  isLoading?: boolean;
  /** Classe CSS */
  className?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  muted: '#9CA3AF',
};

const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899', // pink
];

// ============================================================================
// TOOLTIP PERSONNALISÉ
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      {label && <p className="font-medium text-sm mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value.toLocaleString('fr-FR')}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// GRAPHIQUE CAMEMBERT - RÉPARTITION PAR STATUT
// ============================================================================

interface StatusPieChartProps {
  data: ChartData['repartitionStatut'];
  isLoading?: boolean;
}

function StatusPieChart({ data, isLoading }: StatusPieChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => <span className="text-sm">{value}</span>}
        />
        {/* Texte central */}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          <tspan x="50%" dy="-0.5em" className="text-2xl font-bold fill-gray-900">
            {total}
          </tspan>
          <tspan x="50%" dy="1.5em" className="text-sm fill-gray-500">
            Total
          </tspan>
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// GRAPHIQUE BARRES - ÉVOLUTION MENSUELLE
// ============================================================================

interface MonthlyBarChartProps {
  data: ChartData['evolutionMensuelle'];
  isLoading?: boolean;
}

function MonthlyBarChart({ data, isLoading }: MonthlyBarChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-end justify-around h-[300px] gap-2 px-4">
        {Array(12)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={i}
              className="w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="notes"
          name="Notes"
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="dossiers"
          name="Dossiers"
          fill={COLORS.secondary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// GRAPHIQUE LIGNE - ÉVOLUTION DES MONTANTS
// ============================================================================

interface AmountLineChartProps {
  data: ChartData['evolutionMensuelle'];
  isLoading?: boolean;
}

function AmountLineChart({ data, isLoading }: AmountLineChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  // Formatter les montants en millions
  const formatMontant = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatMontant} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [`${formatMontant(value)} FCFA`, 'Montant']}
        />
        <Area
          type="monotone"
          dataKey="montant"
          name="Montant"
          stroke={COLORS.success}
          strokeWidth={2}
          fill="url(#colorMontant)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// GRAPHIQUE BARRES HORIZONTALES - RÉPARTITION PAR DIRECTION
// ============================================================================

interface DirectionBarChartProps {
  data: ChartData['repartitionDirection'];
  isLoading?: boolean;
}

function DirectionBarChart({ data, isLoading }: DirectionBarChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="direction" type="category" tick={{ fontSize: 12 }} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="notes" name="Notes" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function DashboardCharts({
  data,
  isLoading,
  className,
}: DashboardChartsProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {/* Graphique 1: Répartition par statut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-blue-600" />
            Répartition par statut
          </CardTitle>
          <CardDescription>
            Distribution des notes SEF selon leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPieChart
            data={data?.repartitionStatut || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Graphique 2: Évolution mensuelle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            Évolution mensuelle
          </CardTitle>
          <CardDescription>
            Nombre de notes et dossiers créés par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="count" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="count">Quantité</TabsTrigger>
              <TabsTrigger value="amount">Montants</TabsTrigger>
            </TabsList>
            <TabsContent value="count">
              <MonthlyBarChart
                data={data?.evolutionMensuelle || []}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="amount">
              <AmountLineChart
                data={data?.evolutionMensuelle || []}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Graphique 3: Répartition par direction (pleine largeur) */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-600" />
            Répartition par direction
          </CardTitle>
          <CardDescription>
            Nombre de notes par direction (Top 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DirectionBarChart
            data={data?.repartitionDirection || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardCharts;
