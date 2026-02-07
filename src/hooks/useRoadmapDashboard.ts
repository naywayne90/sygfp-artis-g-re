import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import type { DirectionRoadmapStats, RoadmapStats, PlanTravail, Tache } from '@/types/roadmap';

function computeStats(plans: PlanTravail[], taches: Tache[]): RoadmapStats {
  const today = new Date();
  const tachesEnRetard = taches.filter((t) => {
    if (!t.date_fin) return false;
    if (t.statut === 'termine' || t.statut === 'annule') return false;
    return new Date(t.date_fin) < today;
  });

  return {
    totalPlans: plans.length,
    plansEnCours: plans.filter((p) => p.statut === 'en_cours').length,
    totalTaches: taches.length,
    tachesTerminees: taches.filter((t) => t.statut === 'termine').length,
    tachesEnRetard: tachesEnRetard.length,
    avancementGlobal:
      taches.length > 0
        ? Math.round(taches.reduce((sum, t) => sum + (t.avancement || 0), 0) / taches.length)
        : 0,
    budgetTotal: plans.reduce((sum, p) => sum + (p.budget_alloue || 0), 0),
    budgetConsomme: plans.reduce((sum, p) => sum + (p.budget_consomme || 0), 0),
  };
}

interface TacheEnRetard extends Tache {
  direction_code?: string;
  direction_nom?: string;
}

export function useRoadmapDashboard() {
  const { exerciceId, exercice } = useExercice();

  const plansQuery = useQuery({
    queryKey: ['roadmap-dashboard-plans', exerciceId],
    queryFn: async () => {
      const { data, error } = await (
        supabase.from('plans_travail' as string) as ReturnType<typeof supabase.from>
      )
        .select('*, direction:directions(id, code, nom)')
        .eq('est_actif', true)
        .eq('exercice_id', exerciceId);

      if (error) throw error;
      return (data ?? []) as unknown as PlanTravail[];
    },
    enabled: !!exerciceId,
  });

  const tachesQuery = useQuery({
    queryKey: ['roadmap-dashboard-taches', exercice],
    queryFn: async () => {
      const { data, error } = await (
        supabase.from('taches' as string) as ReturnType<typeof supabase.from>
      )
        .select(
          '*, responsable:profiles!responsable_id(id, nom, prenom), sous_activite:sous_activites(id, code, libelle)'
        )
        .eq('est_active', true)
        .eq('exercice', exercice);

      if (error) throw error;
      return (data ?? []) as unknown as Tache[];
    },
    enabled: !!exercice,
  });

  const plans = plansQuery.data ?? [];
  const taches = tachesQuery.data ?? [];

  // Global stats
  const globalStats = computeStats(plans, taches);

  // Stats by direction
  const directionMap = new Map<string, { code: string; nom: string; plans: PlanTravail[] }>();
  for (const plan of plans) {
    const dirId = plan.direction_id;
    if (!directionMap.has(dirId)) {
      directionMap.set(dirId, {
        code: plan.direction?.code ?? '?',
        nom: plan.direction?.nom ?? 'Direction inconnue',
        plans: [],
      });
    }
    const entry = directionMap.get(dirId);
    if (entry) entry.plans.push(plan);
  }

  const directionStats: DirectionRoadmapStats[] = Array.from(directionMap.entries()).map(
    ([dirId, info]) => ({
      direction_id: dirId,
      direction_code: info.code,
      direction_nom: info.nom,
      stats: computeStats(info.plans, []),
    })
  );

  // Top overdue tasks
  const today = new Date();
  const topTachesEnRetard: TacheEnRetard[] = taches
    .filter((t) => {
      if (!t.date_fin) return false;
      if (t.statut === 'termine' || t.statut === 'annule') return false;
      return new Date(t.date_fin) < today;
    })
    .sort((a, b) => new Date(a.date_fin ?? '').getTime() - new Date(b.date_fin ?? '').getTime())
    .slice(0, 10);

  return {
    globalStats,
    directionStats,
    topTachesEnRetard,
    plans,
    taches,
    isLoading: plansQuery.isLoading || tachesQuery.isLoading,
    error: plansQuery.error || tachesQuery.error,
  };
}
