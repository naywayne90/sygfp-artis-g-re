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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NoteSEF } from "@/hooks/useNotesSEF";
import { Loader2, Clock } from "lucide-react";

interface NoteSEFDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
  onConfirm: (data: {
    noteId: string;
    motif: string;
    condition?: string;
    dateReprise?: string;
  }) => Promise<void>;
}

export function NoteSEFDeferDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteSEFDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [condition, setCondition] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!note || !motif.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm({
        noteId: note.id,
        motif,
        condition: condition || undefined,
        dateReprise: dateReprise || undefined,
      });
      setMotif("");
      setCondition("");
      setDateReprise("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMotif("");
    setCondition("");
    setDateReprise("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <Clock className="h-5 w-5" />
            Différer la note
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de différer la note{" "}
            <strong>{note?.numero || "N/A"}</strong>. Précisez les conditions
            de reprise.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif-differe" className="text-foreground">
              Motif du report *
            </Label>
            <Textarea
              id="motif-differe"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Indiquez le motif du report (obligatoire)"
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="condition-reprise" className="text-foreground">
              Condition de reprise
            </Label>
            <Textarea
              id="condition-reprise"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Condition pour reprendre le traitement (optionnel)"
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="date-reprise" className="text-foreground">
              Date de reprise prévue
            </Label>
            <Input
              id="date-reprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              className="mt-2"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !motif.trim()}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le report
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
