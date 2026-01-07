import { useExercice } from "@/contexts/ExerciceContext";
import { ReactNode } from "react";

/**
 * Composant wrapper qui désactive son contenu si l'exercice est en lecture seule
 */
interface ExerciceWriteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ExerciceWriteGuard({ children, fallback }: ExerciceWriteGuardProps) {
  const { canWrite } = useExercice();

  if (!canWrite) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
