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
import { CheckCircle } from "lucide-react";

interface LiquidationValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string) => void;
  isLoading?: boolean;
  stepLabel?: string;
}

export function LiquidationValidateDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  stepLabel,
}: LiquidationValidateDialogProps) {
  const [comments, setComments] = useState("");

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments("");
  };

  const handleClose = () => {
    setComments("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            Valider l'étape
          </DialogTitle>
          <DialogDescription>
            {stepLabel ? `Validation de l'étape: ${stepLabel}` : "Confirmer la validation de cette étape"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="comments">Commentaires (optionnel)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajoutez un commentaire..."
            className="mt-2"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? "Validation..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
