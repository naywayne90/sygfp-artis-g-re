import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Banknote, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExercice } from '@/contexts/ExerciceContext';
import { useTableauFinancier, useDirections } from '@/hooks/useTableauFinancier';

const formatMontant = (montant: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(montant);

const formatTaux = (taux: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(taux / 100);

function getTauxColor(taux: number): string {
  if (taux >= 75) return 'bg-green-500';
  if (taux >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getTauxTextColor(taux: number): string {
  if (taux >= 75) return 'text-green-700';
  if (taux >= 50) return 'text-orange-700';
  return 'text-red-700';
}

function ProgressBar({ value }: { value: number }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getTauxColor(clampedValue)}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-12 text-right ${getTauxTextColor(clampedValue)}`}>
        {formatTaux(clampedValue)}
      </span>
    </div>
  );
}

export default function DashboardFinancier() {
  const { exercice } = useExercice();
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  const selectedDirection = directionFilter === 'all' ? undefined : directionFilter;
  const { data: rows, isLoading, refetch, isFetching } = useTableauFinancier(selectedDirection);
  const { data: directions } = useDirections();

  const totals = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        budget_initial: 0,
        total_engagements: 0,
        total_liquidations: 0,
        total_ordonnancements: 0,
        taux_engagement: 0,
        taux_liquidation: 0,
        taux_ordonnancement: 0,
      };
    }
    const budget = rows.reduce((sum, r) => sum + (r.budget_initial || 0), 0);
    const eng = rows.reduce((sum, r) => sum + (r.total_engagements || 0), 0);
    const liq = rows.reduce((sum, r) => sum + (r.total_liquidations || 0), 0);
    const ordo = rows.reduce((sum, r) => sum + (r.total_ordonnancements || 0), 0);
    return {
      budget_initial: budget,
      total_engagements: eng,
      total_liquidations: liq,
      total_ordonnancements: ordo,
      taux_engagement: budget > 0 ? (eng / budget) * 100 : 0,
      taux_liquidation: budget > 0 ? (liq / budget) * 100 : 0,
      taux_ordonnancement: budget > 0 ? (ordo / budget) * 100 : 0,
    };
  }, [rows]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau Financier</h1>
            <p className="text-muted-foreground">
              Vue consolidee de l'execution budgetaire - Exercice {exercice ?? '--'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Toutes les directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les directions</SelectItem>
              {directions?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.code} - {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Budget Total"
          value={totals.budget_initial}
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          isLoading={isLoading}
          color="blue"
        />
        <KPICard
          title="Total Engage"
          value={totals.total_engagements}
          taux={totals.taux_engagement}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          isLoading={isLoading}
          color="green"
        />
        <KPICard
          title="Total Liquide"
          value={totals.total_liquidations}
          taux={totals.taux_liquidation}
          icon={<Banknote className="h-5 w-5 text-orange-600" />}
          isLoading={isLoading}
          color="orange"
        />
        <KPICard
          title="Total Ordonnance"
          value={totals.total_ordonnancements}
          taux={totals.taux_ordonnancement}
          icon={<TrendingDown className="h-5 w-5 text-purple-600" />}
          isLoading={isLoading}
          color="purple"
        />
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Execution par direction</CardTitle>
          <CardDescription>
            Detail des montants et taux d'execution budgetaire par direction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !rows || rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucune donnee disponible pour cet exercice</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Direction</TableHead>
                    <TableHead className="text-right min-w-[140px]">Budget Init.</TableHead>
                    <TableHead className="text-right min-w-[140px]">Engage</TableHead>
                    <TableHead className="text-right min-w-[140px]">Liquide</TableHead>
                    <TableHead className="text-right min-w-[140px]">Ordonnance</TableHead>
                    <TableHead className="min-w-[160px]">Taux Eng.</TableHead>
                    <TableHead className="min-w-[160px]">Taux Liq.</TableHead>
                    <TableHead className="min-w-[160px]">Taux Ordo.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.direction_id}>
                      <TableCell className="font-medium">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {row.direction_code}
                          </span>
                          <br />
                          {row.direction_label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMontant(row.budget_initial || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMontant(row.total_engagements || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMontant(row.total_liquidations || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMontant(row.total_ordonnancements || 0)}
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={row.taux_engagement || 0} />
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={row.taux_liquidation || 0} />
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={row.taux_ordonnancement || 0} />
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total row */}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatMontant(totals.budget_initial)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatMontant(totals.total_engagements)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatMontant(totals.total_liquidations)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatMontant(totals.total_ordonnancements)}
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={totals.taux_engagement} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={totals.taux_liquidation} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={totals.taux_ordonnancement} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: number;
  taux?: number;
  icon: React.ReactNode;
  isLoading: boolean;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  orange: 'bg-orange-50 border-orange-200',
  purple: 'bg-purple-50 border-purple-200',
};

function KPICard({ title, value, taux, icon, isLoading, color }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={colorMap[color]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold">{formatMontant(value)}</p>
        {taux !== undefined && (
          <p className={`text-xs mt-1 ${getTauxTextColor(taux)}`}>Taux: {formatTaux(taux)}</p>
        )}
      </CardContent>
    </Card>
  );
}
