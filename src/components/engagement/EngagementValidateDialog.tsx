import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Engagement, VALIDATION_STEPS } from "@/hooks/useEngagements";

interface EngagementValidateDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, comments?: string) => void;
  isLoading?: boolean;
}

export function EngagementValidateDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: EngagementValidateDialogProps) {
  const [comments, setComments] = useState("");

  const currentStep = engagement?.current_step || 1;
  const stepInfo = VALIDATION_STEPS.find((s) => s.order === currentStep);
  const isLastStep = currentStep >= VALIDATION_STEPS.length;

  const handleConfirm = () => {
    if (engagement) {
      onConfirm(engagement.id, comments || undefined);
      setComments("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider l'engagement</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de valider l'étape {currentStep} ({stepInfo?.label}) 
            pour l'engagement <strong>{engagement?.numero}</strong>.
            {isLastStep && " Ceci est la dernière étape de validation."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="comments">Commentaires (optionnel)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajoutez un commentaire si nécessaire..."
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setComments("")}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? "Validation..." : isLastStep ? "Valider définitivement" : "Valider l'étape"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
