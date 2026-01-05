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
import { Input } from "@/components/ui/input";
import { NoteAEF } from "@/hooks/useNotesAEF";
import { Clock, Loader2 } from "lucide-react";

interface NoteAEFDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
  onConfirm: (data: {
    noteId: string;
    motif: string;
    deadlineCorrection?: string;
  }) => Promise<void>;
}

export function NoteAEFDeferDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteAEFDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!note || !motif.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm({
        noteId: note.id,
        motif,
        deadlineCorrection: dateReprise || undefined,
      });
      setMotif("");
      setDateReprise("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setMotif("");
      setDateReprise("");
    }
    onOpenChange(value);
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            Différer la note
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de différer la note "{note.objet}".
            Le motif est obligatoire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du report *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez la raison du report..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="dateReprise">Date de reprise prévue</Label>
            <Input
              id="dateReprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
