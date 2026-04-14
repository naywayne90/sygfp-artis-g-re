import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface StatsDirection {
  direction_id: string | null;
  direction: string | null;
  direction_label: string | null;
  total_notes: number;
  validees: number;
  en_attente: number;
  differees: number;
  rejetees: number;
  montant_valide: number;
}

export interface BudgetDirection {
  direction_id: string | null;
  direction_code: string | null;
  direction_label: string | null;
  budget_initial: number;
  budget_modifie: number;
  total_engagements: number;
  total_liquidations: number;
  total_ordonnancements: number;
  total_reglements: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
}

export interface SuiviDirectionRow {
  direction_id: string;
  direction_code: string;
  direction_label: string;
  // Budget
  budget_initial: number;
  budget_modifie: number;
  total_engagements: number;
  total_liquidations: number;
  total_ordonnancements: number;
  total_reglements: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  // Notes
  total_notes: number;
  notes_validees: number;
  notes_en_attente: number;
  notes_differees: number;
  notes_rejetees: number;
  montant_valide: number;
}

export interface SuiviGlobalKPIs {
  budget_total: number;
  engagements_total: number;
  liquidations_total: number;
  ordonnancements_total: number;
  reglements_total: number;
  taux_engagement_global: number;
  taux_liquidation_global: number;
  taux_ordonnancement_global: number;
  total_notes: number;
  notes_validees: number;
  notes_en_attente: number;
  nb_directions: number;
}

function useStatsParDirection() {
  return useQuery({
    queryKey: ['stats-par-direction'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_stats_par_direction').select('*');
      if (error) throw error;
      return (data || []) as StatsDirection[];
    },
    staleTime: 30_000,
  });
}

function useBudgetParDirection(exerciceId: string | null) {
  return useQuery({
    queryKey: ['tableau-financier-all', exerciceId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tableau_financier', {
        p_exercice_id: exerciceId ?? null,
        p_direction_id: null,
      });
      if (error) throw error;
      return (data || []) as BudgetDirection[];
    },
    enabled: !!exerciceId,
    staleTime: 30_000,
  });
}

export function useSuiviDirections() {
  const { exerciceId } = useExercice();

  const {
    data: budgetData,
    isLoading: budgetLoading,
    error: budgetError,
  } = useBudgetParDirection(exerciceId);

  const { data: statsData, isLoading: statsLoading, error: statsError } = useStatsParDirection();

  const isLoading = budgetLoading || statsLoading;
  const error = budgetError || statsError;

  // Fusionner budget + stats par direction_id
  const rows: SuiviDirectionRow[] = (budgetData || [])
    .filter((b) => b.direction_id)
    .map((b) => {
      const stats = (statsData || []).find((s) => s.direction_id === b.direction_id);
      return {
        direction_id: b.direction_id!,
        direction_code: b.direction_code || '',
        direction_label: b.direction_label || '',
        budget_initial: b.budget_initial || 0,
        budget_modifie: b.budget_modifie || 0,
        total_engagements: b.total_engagements || 0,
        total_liquidations: b.total_liquidations || 0,
        total_ordonnancements: b.total_ordonnancements || 0,
        total_reglements: b.total_reglements || 0,
        taux_engagement: b.taux_engagement || 0,
        taux_liquidation: b.taux_liquidation || 0,
        taux_ordonnancement: b.taux_ordonnancement || 0,
        total_notes: stats?.total_notes || 0,
        notes_validees: stats?.validees || 0,
        notes_en_attente: stats?.en_attente || 0,
        notes_differees: stats?.differees || 0,
        notes_rejetees: stats?.rejetees || 0,
        montant_valide: stats?.montant_valide || 0,
      };
    });

  // KPIs globaux
  const kpis: SuiviGlobalKPIs = rows.reduce(
    (acc, r) => ({
      budget_total: acc.budget_total + r.budget_modifie,
      engagements_total: acc.engagements_total + r.total_engagements,
      liquidations_total: acc.liquidations_total + r.total_liquidations,
      ordonnancements_total: acc.ordonnancements_total + r.total_ordonnancements,
      reglements_total: acc.reglements_total + r.total_reglements,
      taux_engagement_global: 0,
      taux_liquidation_global: 0,
      taux_ordonnancement_global: 0,
      total_notes: acc.total_notes + r.total_notes,
      notes_validees: acc.notes_validees + r.notes_validees,
      notes_en_attente: acc.notes_en_attente + r.notes_en_attente,
      nb_directions: acc.nb_directions + 1,
    }),
    {
      budget_total: 0,
      engagements_total: 0,
      liquidations_total: 0,
      ordonnancements_total: 0,
      reglements_total: 0,
      taux_engagement_global: 0,
      taux_liquidation_global: 0,
      taux_ordonnancement_global: 0,
      total_notes: 0,
      notes_validees: 0,
      notes_en_attente: 0,
      nb_directions: 0,
    }
  );

  // Calculer les taux globaux
  if (kpis.budget_total > 0) {
    kpis.taux_engagement_global = (kpis.engagements_total / kpis.budget_total) * 100;
    kpis.taux_liquidation_global = (kpis.liquidations_total / kpis.budget_total) * 100;
    kpis.taux_ordonnancement_global = (kpis.ordonnancements_total / kpis.budget_total) * 100;
  }

  return { rows, kpis, isLoading, error };
}
