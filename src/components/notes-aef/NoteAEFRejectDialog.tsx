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
import { NoteAEF } from "@/hooks/useNotesAEF";
import { AlertTriangle, Loader2 } from "lucide-react";

interface NoteAEFRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
  onConfirm: (noteId: string, motif: string) => Promise<void>;
}

export function NoteAEFRejectDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteAEFRejectDialogProps) {
  const [motif, setMotif] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!note || !motif.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(note.id, motif);
      setMotif("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setMotif("");
    }
    onOpenChange(value);
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Rejeter la note
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de rejeter la note "{note.objet}".
            Le motif de rejet est obligatoire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du rejet *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
