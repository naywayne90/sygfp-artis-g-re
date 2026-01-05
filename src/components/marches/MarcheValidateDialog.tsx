import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useMarches, Marche, VALIDATION_STEPS } from "@/hooks/useMarches";

interface MarcheValidateDialogProps {
  marche: Marche | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MarcheValidateDialog({ marche, open, onOpenChange, onSuccess }: MarcheValidateDialogProps) {
  const { validateStep, isValidating } = useMarches();
  const [comments, setComments] = useState("");

  const currentStep = VALIDATION_STEPS.find(s => s.order === (marche?.current_validation_step || 1));

  const handleSubmit = async () => {
    if (!marche) return;

    try {
      await validateStep({ 
        marcheId: marche.id, 
        stepOrder: marche.current_validation_step || 1,
        comments: comments.trim() || undefined
      });
      setComments("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Valider l'étape
          </DialogTitle>
          <DialogDescription>
            Validation de l'étape <strong>{currentStep?.label}</strong> pour le marché <strong>{marche?.numero}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{currentStep?.label}</p>
            <p className="text-sm text-muted-foreground">{currentStep?.description}</p>
          </div>

          <div>
            <Label htmlFor="comments">Commentaires (optionnel)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajoutez des commentaires si nécessaire..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isValidating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
