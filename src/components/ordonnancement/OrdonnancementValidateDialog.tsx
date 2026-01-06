import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useOrdonnancements, VALIDATION_STEPS } from "@/hooks/useOrdonnancements";

interface OrdonnancementValidateDialogProps {
  ordonnancement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrdonnancementValidateDialog({
  ordonnancement,
  open,
  onOpenChange,
}: OrdonnancementValidateDialogProps) {
  const { validateStep } = useOrdonnancements();
  const [comments, setComments] = useState("");

  const currentStep = ordonnancement?.current_step || 1;
  const stepInfo = VALIDATION_STEPS.find((s) => s.order === currentStep);

  const handleValidate = async () => {
    await validateStep.mutateAsync({
      ordonnancementId: ordonnancement.id,
      stepOrder: currentStep,
      comments: comments || undefined,
    });
    setComments("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Valider l'étape
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Étape actuelle</p>
            <p className="font-medium">{stepInfo?.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ordonnancement: {ordonnancement?.numero}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires (optionnel)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={validateStep.isPending}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {validateStep.isPending ? "Validation..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
