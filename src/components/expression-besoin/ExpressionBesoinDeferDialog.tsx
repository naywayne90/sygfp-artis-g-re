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
import { Input } from "@/components/ui/input";

interface ExpressionBesoinDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motif: string, dateReprise?: string) => void;
  expressionNumero: string | null;
}

export function ExpressionBesoinDeferDialog({
  open,
  onOpenChange,
  onConfirm,
  expressionNumero,
}: ExpressionBesoinDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");

  const handleConfirm = () => {
    if (motif.trim()) {
      onConfirm(motif.trim(), dateReprise || undefined);
      setMotif("");
      setDateReprise("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Différer l'expression de besoin</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de différer l'expression de besoin{" "}
            <strong>{expressionNumero || "en cours"}</strong>. Elle pourra être
            reprise ultérieurement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="defer-motif">Motif du report *</Label>
            <Textarea
              id="defer-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Indiquez le motif du report..."
              rows={3}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="defer-date">Date de reprise prévue (optionnel)</Label>
            <Input
              id="defer-date"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setMotif("");
              setDateReprise("");
            }}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!motif.trim()}>
            Différer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
