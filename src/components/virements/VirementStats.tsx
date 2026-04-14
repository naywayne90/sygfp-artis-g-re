/**
 * Onglet "Statistiques" du module Virements.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Affiche 3 graphiques (pie by status, pie by type, bar by month) + une
 * card récapitulative (total demandé / exécuté / en cours / taux).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BudgetTransfer, TransferStats } from '@/hooks/useBudgetTransfers';
import { formatCurrency } from './constants';

export interface VirementChartData {
  byStatus: Array<{ name: string; value: number; color: string }>;
  byType: Array<{ name: string; value: number; color: string }>;
  byMonth: Array<{ month: string; amount: number }>;
}

interface VirementStatsProps {
  isLoading: boolean;
  transfers: BudgetTransfer[] | undefined;
  stats: TransferStats;
  chartData: VirementChartData;
}

export function VirementStats({ isLoading, transfers, stats, chartData }: VirementStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!transfers?.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Aucune donnée statistique"
        description="Les statistiques seront disponibles dès que des virements seront créés."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Répartition par statut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Répartition par statut</CardTitle>
          <CardDescription>{transfers.length} demande(s) au total</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.byStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.byStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Virements vs Ajustements</CardTitle>
          <CardDescription>Répartition par type de mouvement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.byType}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.byType.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume mensuel des exécutions */}
      {chartData.byMonth.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Volume mensuel des exécutions</CardTitle>
            <CardDescription>Montants transférés par mois (FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" name="Montant" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Résumé financier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-50">
              <p className="text-xs sm:text-sm text-muted-foreground">Total demandé</p>
              <p className="text-sm sm:text-lg font-bold text-blue-700 truncate">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50">
              <p className="text-xs sm:text-sm text-muted-foreground">Total exécuté</p>
              <p className="text-sm sm:text-lg font-bold text-green-700 truncate">
                {formatCurrency(stats.totalExecutedAmount)}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-50">
              <p className="text-xs sm:text-sm text-muted-foreground">En cours</p>
              <p className="text-sm sm:text-lg font-bold text-amber-700 truncate">
                {formatCurrency(stats.totalPendingAmount)}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-gray-50">
              <p className="text-xs sm:text-sm text-muted-foreground">Taux exec.</p>
              <p className="text-sm sm:text-lg font-bold">
                {transfers.length > 0 ? Math.round((stats.executed / transfers.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
