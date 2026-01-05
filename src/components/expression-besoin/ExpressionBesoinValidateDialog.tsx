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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExpressionBesoinValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string) => void;
  expressionNumero: string | null;
}

export function ExpressionBesoinValidateDialog({
  open,
  onOpenChange,
  onConfirm,
  expressionNumero,
}: ExpressionBesoinValidateDialogProps) {
  const [comments, setComments] = useState("");

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider l'expression de besoin</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de valider l'expression de besoin{" "}
            <strong>{expressionNumero || "en cours"}</strong>. Cette action
            permettra la création d'un engagement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="validate-comments">Commentaires (optionnel)</Label>
          <Textarea
            id="validate-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={2}
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setComments("")}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Valider</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
