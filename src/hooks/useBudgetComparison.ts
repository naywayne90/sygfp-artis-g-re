import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Totaux agrégés d'un exercice budgétaire utilisés par le comparatif N/N-1.
 * Les champs `calc_*` du select proviennent de la vue d'exécution —
 * si l'exercice N-1 n'a pas de vue matérialisée, on retombe sur les colonnes
 * de base (`dotation_initiale`, `total_engage`, `total_paye`).
 */
export interface BudgetExerciceTotals {
  exercice: number;
  count: number;
  dotation: number;
  engage: number;
  paye: number;
}

interface ComparisonResult {
  current: BudgetExerciceTotals;
  previous: BudgetExerciceTotals;
  deltas: {
    dotation: number; // en % (peut être Infinity si previous = 0)
    engage: number;
    paye: number;
  };
  isLoading: boolean;
  hasPrevious: boolean; // false si l'exercice N-1 n'a aucune ligne
}

const EMPTY_TOTALS = (exercice: number): BudgetExerciceTotals => ({
  exercice,
  count: 0,
  dotation: 0,
  engage: 0,
  paye: 0,
});

/**
 * Calcule le delta en pourcentage entre deux valeurs.
 * Retourne 0 si les deux valeurs sont nulles, Infinity si previous = 0 et current > 0.
 */
function computeDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : Infinity;
  }
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

async function fetchExerciceTotals(exercice: number): Promise<BudgetExerciceTotals> {
  const { data, error } = await supabase
    .from('budget_lines')
    .select('dotation_initiale, dotation_modifiee, total_engage, total_paye')
    .eq('exercice', exercice)
    .eq('is_active', true);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    dotation_initiale: number | null;
    dotation_modifiee: number | null;
    total_engage: number | null;
    total_paye: number | null;
  }>;

  return rows.reduce<BudgetExerciceTotals>((acc, row) => {
    const dot = row.dotation_modifiee ?? row.dotation_initiale ?? 0;
    return {
      exercice,
      count: acc.count + 1,
      dotation: acc.dotation + dot,
      engage: acc.engage + (row.total_engage ?? 0),
      paye: acc.paye + (row.total_paye ?? 0),
    };
  }, EMPTY_TOTALS(exercice));
}

/**
 * Hook qui renvoie un comparatif N vs N-1 (dotation, engagé, payé).
 *
 * Usage :
 * ```tsx
 * const { current, previous, deltas, hasPrevious } = useBudgetComparison(exercice);
 * ```
 */
export function useBudgetComparison(currentExercice: number | null | undefined): ComparisonResult {
  const previousExercice = currentExercice ? currentExercice - 1 : null;

  const currentQuery = useQuery({
    queryKey: ['budget-comparison', currentExercice],
    queryFn: () => fetchExerciceTotals(currentExercice!),
    enabled: !!currentExercice,
    staleTime: 30_000,
  });

  const previousQuery = useQuery({
    queryKey: ['budget-comparison', previousExercice],
    queryFn: () => fetchExerciceTotals(previousExercice!),
    enabled: !!previousExercice,
    staleTime: 30_000,
  });

  const current = currentQuery.data ?? EMPTY_TOTALS(currentExercice ?? 0);
  const previous = previousQuery.data ?? EMPTY_TOTALS(previousExercice ?? 0);

  return {
    current,
    previous,
    deltas: {
      dotation: computeDelta(current.dotation, previous.dotation),
      engage: computeDelta(current.engage, previous.engage),
      paye: computeDelta(current.paye, previous.paye),
    },
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    hasPrevious: previous.count > 0,
  };
}

// Exposé pour tests unitaires — pas d'usage dans l'app.
export const __testing__ = { computeDelta };
