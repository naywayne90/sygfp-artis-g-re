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
import { Loader2, XCircle } from "lucide-react";

interface GenericRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display identifier for the entity (e.g. "SEF-2026-001") */
  entityLabel?: string;
  /** Entity type name for dialog text (e.g. "la note", "l'engagement") */
  entityName?: string;
  /** Custom dialog title */
  title?: string;
  onConfirm: (motif: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function GenericRejectDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName = "l'element",
  title,
  onConfirm,
  isLoading: externalLoading,
}: GenericRejectDialogProps) {
  const [motif, setMotif] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    if (!motif.trim()) return;

    setInternalLoading(true);
    try {
      await onConfirm(motif);
      setMotif("");
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {title || `Rejeter ${entityName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous etes sur le point de rejeter {entityName}
            {entityLabel && (
              <> <strong>{entityLabel}</strong></>
            )}
            . Cette action sera enregistree dans l'historique.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="reject-motif" className="text-foreground">
            Motif de rejet *
          </Label>
          <Textarea
            id="reject-motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Indiquez le motif du rejet (obligatoire)"
            rows={4}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setMotif("");
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !motif.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le rejet
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
