/**
 * Grille de 6 KPI cards du module Virements & Ajustements.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Affiche skeletons pendant `isLoading`, puis les totaux agrégés
 * (pending, validated, executed, rejected, executed amount, total count).
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRightLeft, CheckCircle, Clock, Play, TrendingUp, XCircle } from 'lucide-react';
import type { TransferStats } from '@/hooks/useBudgetTransfers';
import { formatCurrency } from './constants';

interface VirementKpiCardsProps {
  isLoading: boolean;
  stats: TransferStats;
  totalCount: number;
}

export function VirementKpiCards({ isLoading, stats, totalCount }: VirementKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="truncate">En attente CB</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            niveau 1 — CB approuve
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="truncate">Approuvés CB</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats.validated}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            niveau 2 — DG exécute
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <Play className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="truncate">Exécutés</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats.executed}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {stats.executedThisMonth} ce mois
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="truncate">Rejetés</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats.rejected}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">demandes refusées</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Montant exécuté</span>
          </div>
          <p className="text-sm sm:text-lg font-bold truncate">
            {formatCurrency(stats.totalExecutedAmount)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">total transféré</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <ArrowRightLeft className="h-4 w-4 shrink-0 text-indigo-500" />
            <span className="truncate">Total demandes</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {stats.virementsCount} VIR / {stats.ajustementsCount} AJU
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
