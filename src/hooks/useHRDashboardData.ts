/**
 * Hook pour le dashboard RH - Données réelles depuis Supabase
 * Effectif par direction + Budget formation
 * Les données SIRH (masse salariale, congés, missions) ne sont pas disponibles
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

interface DirectionEffectif {
  direction_id: string;
  code: string;
  label: string;
  effectif: number;
}

export interface HRDashboardData {
  effectifTotal: number;
  directionsParEffectif: DirectionEffectif[];
  budgetFormation: number;
  budgetFormationUtilise: number;
  // Données SIRH non disponibles
  masseSalariale: null;
  congesEnCours: null;
  missionsEnCours: null;
  recrutementsMois: null;
  departsMois: null;
}

export function useHRDashboardData() {
  const { exercice } = useExercice();

  const query = useQuery({
    queryKey: ['hr-dashboard', exercice],
    queryFn: async (): Promise<HRDashboardData> => {
      // 1. Effectif réel: profils actifs groupés par direction
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('direction_id, directions!profiles_direction_id_fkey(id, code, label)')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Grouper par direction
      const directionMap = new Map<string, DirectionEffectif>();
      for (const p of profiles || []) {
        const dir = p.directions as unknown as { id: string; code: string; label: string } | null;
        if (!dir || !p.direction_id) continue;
        const existing = directionMap.get(p.direction_id);
        if (existing) {
          existing.effectif++;
        } else {
          directionMap.set(p.direction_id, {
            direction_id: p.direction_id,
            code: dir.code,
            label: dir.label,
            effectif: 1,
          });
        }
      }

      const directionsParEffectif = Array.from(directionMap.values()).sort(
        (a, b) => b.effectif - a.effectif
      );

      const effectifTotal = (profiles || []).length;

      // 2. Budget formation: lignes budgétaires contenant "formation"
      let budgetFormation = 0;
      let budgetFormationUtilise = 0;

      if (exercice) {
        const { data: budgetLines, error: budgetError } = await supabase
          .from('budget_lines')
          .select('dotation_initiale, total_engage')
          .eq('exercice', exercice)
          .ilike('label', '%formation%');

        if (budgetError) {
          console.warn('Budget formation non disponible:', budgetError.message);
        } else if (budgetLines) {
          for (const line of budgetLines) {
            budgetFormation += line.dotation_initiale || 0;
            budgetFormationUtilise += line.total_engage || 0;
          }
        }
      }

      return {
        effectifTotal,
        directionsParEffectif,
        budgetFormation,
        budgetFormationUtilise,
        masseSalariale: null,
        congesEnCours: null,
        missionsEnCours: null,
        recrutementsMois: null,
        departsMois: null,
      };
    },
    enabled: !!exercice,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
