import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface DSIEngagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  statut: string | null;
  date_engagement: string;
  created_at: string;
  budget_line?: {
    id: string;
    code: string;
    label: string;
    direction_id: string | null;
    direction?: {
      label: string;
      sigle: string | null;
    } | null;
  } | null;
  creator?: {
    full_name: string | null;
  } | null;
}

export interface DSIDashboardStats {
  direction: { id: string; code: string; label: string } | null;
  budgetTotal: number;
  montantEngage: number;
  resteAFaire: number;
  tauxEngagement: number;
  engagements: DSIEngagement[];
  engagementsEnCours: DSIEngagement[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook pour recuperer les statistiques du dashboard DSI
 * Filtre les donnees par direction DSI (code = "DSI")
 */
export function useDSIDashboardStats(): DSIDashboardStats {
  const { exercice } = useExercice();

  // 1. Recuperer la direction DSI
  const directionQuery = useQuery({
    queryKey: ['direction-dsi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label')
        .eq('code', 'DSI')
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // Cache 1 heure (direction change rarement)
  });

  const directionId = directionQuery.data?.id;

  // 2. Recuperer les lignes budgetaires DSI
  const budgetQuery = useQuery({
    queryKey: ['budget-lines-dsi', exercice, directionId],
    queryFn: async () => {
      if (!directionId || !exercice) return [];

      const { data, error } = await supabase
        .from('budget_lines')
        .select('id, code, label, dotation_initiale')
        .eq('direction_id', directionId)
        .eq('exercice', exercice);

      if (error) throw error;
      return data || [];
    },
    enabled: !!directionId && !!exercice,
  });

  // 3. Recuperer les engagements DSI
  const engagementsQuery = useQuery({
    queryKey: ['engagements-dsi', exercice, directionId],
    queryFn: async () => {
      if (!directionId || !exercice) return [];

      // D'abord recuperer les IDs des lignes budgetaires DSI
      const { data: budgetLineIds, error: blError } = await supabase
        .from('budget_lines')
        .select('id')
        .eq('direction_id', directionId)
        .eq('exercice', exercice);

      if (blError) throw blError;

      if (!budgetLineIds || budgetLineIds.length === 0) {
        return [];
      }

      const ids = budgetLineIds.map((bl) => bl.id);

      // Puis recuperer les engagements lies a ces lignes
      const { data, error } = await supabase
        .from('budget_engagements')
        .select(
          `
          id, numero, objet, montant, statut, date_engagement, created_at,
          budget_line:budget_lines(
            id, code, label, direction_id,
            direction:directions(label, sigle)
          ),
          creator:profiles!budget_engagements_created_by_fkey(full_name)
        `
        )
        .eq('exercice', exercice)
        .in('budget_line_id', ids)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as DSIEngagement[];
    },
    enabled: !!directionId && !!exercice,
  });

  // 4. Recuperer TOUS les engagements DSI valides pour le calcul du montant engage
  const allEngagementsQuery = useQuery({
    queryKey: ['all-engagements-dsi', exercice, directionId],
    queryFn: async () => {
      if (!directionId || !exercice) return [];

      const { data: budgetLineIds, error: blError } = await supabase
        .from('budget_lines')
        .select('id')
        .eq('direction_id', directionId)
        .eq('exercice', exercice);

      if (blError) throw blError;

      if (!budgetLineIds || budgetLineIds.length === 0) {
        return [];
      }

      const ids = budgetLineIds.map((bl) => bl.id);

      const { data, error } = await supabase
        .from('budget_engagements')
        .select('id, montant, statut')
        .eq('exercice', exercice)
        .in('budget_line_id', ids)
        .eq('statut', 'valide');

      if (error) throw error;
      return data || [];
    },
    enabled: !!directionId && !!exercice,
  });

  // 5. Calculer les totaux
  const budgetTotal =
    budgetQuery.data?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

  const montantEngage =
    allEngagementsQuery.data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

  const resteAFaire = Math.max(0, budgetTotal - montantEngage);

  const tauxEngagement = budgetTotal > 0 ? Math.round((montantEngage / budgetTotal) * 100) : 0;

  // Engagements en cours (non valides et non rejetes)
  const engagementsEnCours = (engagementsQuery.data || []).filter(
    (e) => e.statut !== 'valide' && e.statut !== 'rejete'
  );

  const isLoading =
    directionQuery.isLoading ||
    budgetQuery.isLoading ||
    engagementsQuery.isLoading ||
    allEngagementsQuery.isLoading;

  const error =
    directionQuery.error ||
    budgetQuery.error ||
    engagementsQuery.error ||
    allEngagementsQuery.error;

  return {
    direction: directionQuery.data || null,
    budgetTotal,
    montantEngage,
    resteAFaire,
    tauxEngagement,
    engagements: engagementsQuery.data || [],
    engagementsEnCours,
    isLoading,
    error: error as Error | null,
  };
}
