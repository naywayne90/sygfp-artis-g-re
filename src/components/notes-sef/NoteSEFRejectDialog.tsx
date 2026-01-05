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
import { NoteSEF } from "@/hooks/useNotesSEF";
import { Loader2, XCircle } from "lucide-react";

interface NoteSEFRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
  onConfirm: (noteId: string, motif: string) => Promise<void>;
}

export function NoteSEFRejectDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteSEFRejectDialogProps) {
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter la note
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de rejeter la note{" "}
            <strong>{note?.numero || "N/A"}</strong>. Cette action sera
            enregistrée dans l'historique.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="motif-rejet" className="text-foreground">
            Motif de rejet *
          </Label>
          <Textarea
            id="motif-rejet"
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
