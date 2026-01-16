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
import { XCircle, Loader2 } from "lucide-react";

interface ImputationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imputationReference: string | null;
  onConfirm: (motif: string) => Promise<void>;
}

export function ImputationRejectDialog({
  open,
  onOpenChange,
  imputationReference,
  onConfirm,
}: ImputationRejectDialogProps) {
  const [motif, setMotif] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!motif.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(motif);
      setMotif("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter l'imputation
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de rejeter l'imputation{" "}
            <span className="font-medium">{imputationReference}</span>.
            Veuillez indiquer le motif du rejet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du rejet *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi cette imputation est rejetée..."
              className="mt-2"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejet en cours...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Confirmer le rejet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
