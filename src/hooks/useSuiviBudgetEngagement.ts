import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

// ============================================================================
// Prompt 9: Suivi des engagements par ligne budgétaire
// RPC get_suivi_engagements_par_ligne(p_exercice, p_direction_id)
// ============================================================================

export interface SuiviLigneBudgetaire {
  budget_line_id: string;
  code: string;
  label: string;
  dotation_actuelle: number;
  total_engage: number;
  disponible_net: number;
  taux_engagement: number;
  nb_engagements: number;
  montant_total_engagements: number;
  dernier_engagement: string | null;
  direction_code: string | null;
  direction_label: string | null;
}

export interface EngagementExportRow {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  montant_ht: number | null;
  tva: number | null;
  fournisseur: string | null;
  date_engagement: string;
  statut: string;
  workflow_status: string | null;
  type_engagement: string;
  exercice: number;
  budget_line_code: string | null;
  budget_line_label: string | null;
  direction_sigle: string | null;
  prestataire_nom: string | null;
  visa_saf_date: string | null;
  visa_cb_date: string | null;
  visa_daaf_date: string | null;
  visa_dg_date: string | null;
  visa_saf_user: string | null;
  visa_cb_user: string | null;
  visa_daaf_user: string | null;
  visa_dg_user: string | null;
  montant_degage: number;
  motif_degage: string | null;
  created_at: string;
  created_by_name: string | null;
}

/**
 * Hook: Suivi des engagements par ligne budgétaire
 * Retourne pour chaque ligne budgétaire: dotation, engagé, disponible, nb engagements, taux
 */
export function useSuiviBudgetEngagement(directionId?: string | null) {
  const { exercice } = useExercice();

  const { data, isLoading, error } = useQuery({
    queryKey: ['suivi-budget-engagement', exercice, directionId],
    queryFn: async (): Promise<SuiviLigneBudgetaire[]> => {
      const { data: rows, error: rpcError } = await supabase.rpc(
        'get_suivi_engagements_par_ligne',
        {
          p_exercice: exercice ?? null,
          p_direction_id: directionId ?? null,
        }
      );

      if (rpcError) throw rpcError;
      return (rows || []) as unknown as SuiviLigneBudgetaire[];
    },
    enabled: !!exercice,
    staleTime: 1000 * 30,
  });

  return {
    lignes: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook: Données d'export des engagements (pour CSV/Excel côté frontend)
 * Retourne les engagements avec toutes les JOINs pour l'export
 */
export function useEngagementExportData(directionId?: string | null, statut?: string | null) {
  const { exercice } = useExercice();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['engagement-export-data', exercice, directionId, statut],
    queryFn: async (): Promise<EngagementExportRow[]> => {
      const { data: rows, error: rpcError } = await supabase.rpc('get_engagement_export_data', {
        p_exercice: exercice ?? null,
        p_direction_id: directionId ?? null,
        p_statut: statut ?? null,
      });

      if (rpcError) throw rpcError;
      return (rows || []) as unknown as EngagementExportRow[];
    },
    enabled: false, // Manual trigger only (export on demand)
  });

  return {
    exportData: data || [],
    isLoading,
    fetchExportData: refetch,
  };
}
