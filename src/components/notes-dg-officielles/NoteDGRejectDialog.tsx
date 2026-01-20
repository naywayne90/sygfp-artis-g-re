/**
 * Dialog de rejet d'une Note DG
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, XCircle } from "lucide-react";
import { NoteDirectionGenerale } from "@/hooks/useNotesDirectionGenerale";

interface NoteDGRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteDirectionGenerale | null;
  onConfirm: (noteId: string, motif: string) => Promise<void>;
}

export function NoteDGRejectDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteDGRejectDialogProps) {
  const [motif, setMotif] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!note) return;

    if (!motif.trim()) {
      setError("Le motif de rejet est obligatoire");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(note.id, motif);
      setMotif("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMotif("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter la note
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de rejeter la note{" "}
            <strong>{note?.reference || "cette note"}</strong>.
            Cette action est réversible (la note pourra être corrigée).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motif">Motif du rejet *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Indiquez les raisons du rejet et les corrections attendues..."
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !motif.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Rejeter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NoteDGRejectDialog;
