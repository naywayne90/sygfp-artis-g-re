import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrdonnancements } from "@/hooks/useOrdonnancements";

interface OrdonnancementDeferDialogProps {
  ordonnancement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrdonnancementDeferDialog({
  ordonnancement,
  open,
  onOpenChange,
}: OrdonnancementDeferDialogProps) {
  const { deferOrdonnancement } = useOrdonnancements();
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [error, setError] = useState("");

  const handleDefer = async () => {
    if (!motif.trim()) {
      setError("Le motif du report est obligatoire");
      return;
    }

    await deferOrdonnancement.mutateAsync({
      id: ordonnancement.id,
      motif: motif.trim(),
      dateReprise: dateReprise || undefined,
    });
    setMotif("");
    setDateReprise("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Différer l'ordonnancement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              L'ordonnancement sera mis en attente. Vous pourrez le reprendre ultérieurement.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Ordonnancement</p>
            <p className="font-medium">{ordonnancement?.numero}</p>
            <p className="text-sm">{ordonnancement?.objet}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif du report *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                setError("");
              }}
              placeholder="Expliquez le motif du report..."
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateReprise">Date de reprise prévue (optionnel)</Label>
            <Input
              id="dateReprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleDefer}
            disabled={deferOrdonnancement.isPending}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {deferOrdonnancement.isPending ? "Report..." : "Confirmer le report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
