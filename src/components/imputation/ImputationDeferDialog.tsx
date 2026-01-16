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
import { Clock, Loader2 } from "lucide-react";

interface ImputationDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imputationReference: string | null;
  onConfirm: (motif: string, dateReprise?: string) => Promise<void>;
}

export function ImputationDeferDialog({
  open,
  onOpenChange,
  imputationReference,
  onConfirm,
}: ImputationDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!motif.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(motif, dateReprise || undefined);
      setMotif("");
      setDateReprise("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            Différer l'imputation
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de différer l'imputation{" "}
            <span className="font-medium">{imputationReference}</span>.
            Veuillez indiquer le motif et optionnellement une date de reprise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du report *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi cette imputation est différée..."
              className="mt-2"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="dateReprise">Date de reprise prévue (optionnel)</Label>
            <Input
              id="dateReprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              className="mt-2"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="default"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Report en cours...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Confirmer le report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
