import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface TableauFinancierRow {
  direction_id: string;
  direction_code: string;
  direction_label: string;
  budget_initial: number;
  budget_modifie: number;
  total_engagements: number;
  total_liquidations: number;
  total_ordonnancements: number;
  total_reglements: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  nb_dossiers_en_cours: number;
  nb_dossiers_bloques: number;
}

export function useTableauFinancier(directionId?: string) {
  const { exerciceId } = useExercice();

  return useQuery({
    queryKey: ['tableau-financier', exerciceId, directionId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tableau_financier', {
        p_exercice_id: exerciceId ?? null,
        p_direction_id: directionId ?? null,
      });
      if (error) throw error;
      return (data || []) as TableauFinancierRow[];
    },
    enabled: !!exerciceId,
  });
}

export function useDirections() {
  return useQuery({
    queryKey: ['directions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label')
        .order('code', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}
