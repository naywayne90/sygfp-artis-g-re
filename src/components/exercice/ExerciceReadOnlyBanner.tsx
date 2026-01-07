import { useExercice } from "@/contexts/ExerciceContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

/**
 * Bannière affichée quand l'exercice est en lecture seule
 */
export function ExerciceReadOnlyBanner() {
  const { exercice, exerciceInfo, isReadOnly } = useExercice();

  if (!isReadOnly) return null;

  const getStatutLabel = () => {
    switch (exerciceInfo?.statut) {
      case "cloture":
        return "clôturé";
      case "archive":
        return "archivé";
      default:
        return "en lecture seule";
    }
  };

  return (
    <Alert variant="default" className="mb-4 border-warning/50 bg-warning/10">
      <Lock className="h-4 w-4 text-warning" />
      <AlertDescription className="text-warning-foreground">
        <span className="font-medium">Mode lecture seule</span> — L'exercice {exercice} est {getStatutLabel()}. 
        Vous pouvez consulter les données mais aucune création ou modification n'est possible.
      </AlertDescription>
    </Alert>
  );
}
