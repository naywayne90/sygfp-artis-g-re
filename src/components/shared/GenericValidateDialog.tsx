import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";

interface GenericValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display identifier for the entity (e.g. "SEF-2026-001") */
  entityLabel?: string;
  /** Entity type name for dialog text (e.g. "la note", "l'engagement") */
  entityName?: string;
  /** Custom dialog title */
  title?: string;
  /** Custom description message */
  message?: string;
  /** Whether to show an optional comments field */
  showComments?: boolean;
  /** Label for the confirm button */
  confirmLabel?: string;
  onConfirm: (comments?: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function GenericValidateDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName = "l'element",
  title,
  message,
  showComments = true,
  confirmLabel = "Valider",
  onConfirm,
  isLoading: externalLoading,
}: GenericValidateDialogProps) {
  const [comments, setComments] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm(comments || undefined);
      setComments("");
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            {title || `Valider ${entityName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {message || (
              <>
                Vous etes sur le point de valider {entityName}
                {entityLabel && (
                  <> <strong>{entityLabel}</strong></>
                )}
                . Cette action sera enregistree dans l'historique.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showComments && (
          <div className="space-y-2 py-4">
            <Label htmlFor="validate-comments">Commentaires (optionnel)</Label>
            <Textarea
              id="validate-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajoutez un commentaire si necessaire..."
              rows={3}
            />
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setComments("");
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
