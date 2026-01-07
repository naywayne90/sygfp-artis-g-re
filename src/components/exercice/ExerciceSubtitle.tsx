import { useExercice } from "@/contexts/ExerciceContext";
import { Lock } from "lucide-react";

interface ExerciceSubtitleProps {
  title: string;
  description?: string;
}

/**
 * Composant réutilisable pour afficher le titre de page avec l'exercice courant
 * et un indicateur de lecture seule si applicable
 */
export function ExerciceSubtitle({ title, description }: ExerciceSubtitleProps) {
  const { exercice, isReadOnly } = useExercice();

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="page-title">{title}</h1>
        {isReadOnly && (
          <Lock className="h-5 w-5 text-warning" />
        )}
      </div>
      <p className="page-description">
        {description ? `${description} — ` : ""}Exercice {exercice}
        {isReadOnly && (
          <span className="ml-2 text-warning">(Lecture seule)</span>
        )}
      </p>
    </div>
  );
}
