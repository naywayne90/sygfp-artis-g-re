import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import { useCallback } from "react";

/**
 * Hook pour protéger les actions d'écriture sur un exercice clôturé
 * Retourne une fonction wrapper qui empêche l'exécution si l'exercice est en lecture seule
 */
export function useExerciceWriteGuard() {
  const { exercice, exerciceInfo, isReadOnly, canWrite } = useExercice();

  /**
   * Affiche un toast d'erreur si l'exercice est en lecture seule
   */
  const showReadOnlyError = useCallback(() => {
    toast.error("Action non autorisée", {
      description: `L'exercice ${exercice} est ${exerciceInfo?.statut === "cloture" ? "clôturé" : "archivé"}. Aucune modification n'est possible.`,
      duration: 5000,
    });
  }, [exercice, exerciceInfo]);

  /**
   * Wrapper pour les actions d'écriture
   * Si l'exercice est en lecture seule, affiche une erreur et retourne false
   * Sinon, exécute l'action et retourne true
   */
  const guardAction = useCallback(
    <T extends (...args: any[]) => any>(action: T) => {
      return (...args: Parameters<T>): ReturnType<T> | undefined => {
        if (isReadOnly) {
          showReadOnlyError();
          return undefined;
        }
        return action(...args);
      };
    },
    [isReadOnly, showReadOnlyError]
  );

  /**
   * Vérifie si une action d'écriture est autorisée
   * Affiche un toast si non autorisé
   */
  const checkCanWrite = useCallback((): boolean => {
    if (isReadOnly) {
      showReadOnlyError();
      return false;
    }
    return true;
  }, [isReadOnly, showReadOnlyError]);

  /**
   * Message explicatif pour les boutons désactivés
   */
  const getDisabledMessage = useCallback((): string | undefined => {
    if (!isReadOnly) return undefined;
    return exerciceInfo?.statut === "cloture"
      ? "Exercice clôturé - Lecture seule"
      : exerciceInfo?.statut === "archive"
      ? "Exercice archivé - Lecture seule"
      : "Exercice en lecture seule";
  }, [isReadOnly, exerciceInfo]);

  return {
    isReadOnly,
    canWrite,
    exercice,
    exerciceInfo,
    guardAction,
    checkCanWrite,
    showReadOnlyError,
    getDisabledMessage,
  };
}
