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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface LiquidationDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motif: string, dateReprise?: string) => void;
  isLoading?: boolean;
}

export function LiquidationDeferDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: LiquidationDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");

  const handleConfirm = () => {
    if (motif.trim()) {
      onConfirm(motif.trim(), dateReprise || undefined);
      setMotif("");
      setDateReprise("");
    }
  };

  const handleClose = () => {
    setMotif("");
    setDateReprise("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <Clock className="h-5 w-5" />
            Différer la liquidation
          </DialogTitle>
          <DialogDescription>
            Veuillez indiquer le motif du report et optionnellement une date de reprise.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du report *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Indiquez le motif du report..."
              className="mt-2"
              rows={4}
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
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {isLoading ? "Report..." : "Confirmer le report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
