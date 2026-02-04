/**
 * Hook dédié aux compteurs des Notes SEF par statut
 * Optimisé avec cache séparé des données de liste
 */

import { useQuery } from '@tanstack/react-query';
import { notesSefService } from '@/lib/notes-sef/notesSefService';
import { useExercice } from '@/contexts/ExerciceContext';
import type { NoteSEFCounts } from '@/lib/notes-sef/types';

interface UseNotesSEFCountsReturn {
  counts: NoteSEFCounts;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultCounts: NoteSEFCounts = {
  total: 0,
  brouillon: 0,
  soumis: 0,
  a_valider: 0,
  valide: 0,
  differe: 0,
  rejete: 0,
};

/**
 * Hook pour récupérer les compteurs par statut des Notes SEF
 * Cache de 30 secondes, rechargement au focus fenêtre
 */
export function useNotesSEFCounts(): UseNotesSEFCountsReturn {
  const { exercice } = useExercice();

  const {
    data: countsResult,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['notes-sef-counts', exercice],
    queryFn: async () => {
      if (!exercice) return null;
      return notesSefService.getCounts(exercice);
    },
    enabled: !!exercice,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
  });

  const counts = countsResult?.success && countsResult.data ? countsResult.data : defaultCounts;

  return {
    counts,
    isLoading,
    error: queryError ? (queryError as Error).message : null,
    refetch,
  };
}

/**
 * Calcule le compteur pour un onglet spécifique
 */
export function getTabCount(counts: NoteSEFCounts, tab: string): number {
  switch (tab) {
    case 'toutes':
      return counts.total;
    case 'brouillons':
      return counts.brouillon;
    case 'a_valider':
      return counts.soumis + counts.a_valider;
    case 'validees':
      return counts.valide;
    case 'differees':
      return counts.differe;
    case 'rejetees':
      return counts.rejete;
    case 'a_imputer':
      // Notes validées en attente d'imputation
      return counts.valide;
    default:
      return 0;
  }
}
