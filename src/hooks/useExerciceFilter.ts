import { useExercice } from "@/contexts/ExerciceContext";

/**
 * Hook pour filtrer les données par exercice
 * Retourne l'exercice actif et une fonction de filtre
 */
export function useExerciceFilter() {
  const { exercice } = useExercice();

  /**
   * Ajoute le filtre exercice à une requête Supabase
   */
  const addExerciceFilter = <T extends { eq: (column: string, value: number) => T }>(
    query: T,
    column: string = "exercice"
  ): T => {
    if (exercice) {
      return query.eq(column, exercice);
    }
    return query;
  };

  /**
   * Vérifie si un objet correspond à l'exercice actif
   */
  const matchesExercice = (item: { exercice?: number | null }): boolean => {
    if (!exercice) return true;
    return item.exercice === exercice;
  };

  return {
    exercice,
    addExerciceFilter,
    matchesExercice,
  };
}
