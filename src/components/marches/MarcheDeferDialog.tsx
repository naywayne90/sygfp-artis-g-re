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
import { Loader2, Clock } from "lucide-react";
import { useMarches, Marche } from "@/hooks/useMarches";

interface MarcheDeferDialogProps {
  marche: Marche | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MarcheDeferDialog({ marche, open, onOpenChange, onSuccess }: MarcheDeferDialogProps) {
  const { deferMarche, isDeferring } = useMarches();
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");

  const handleSubmit = async () => {
    if (!marche || !motif.trim()) return;

    try {
      await deferMarche({ 
        marcheId: marche.id, 
        motif: motif.trim(),
        dateReprise: dateReprise || undefined
      });
      setMotif("");
      setDateReprise("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Différer le marché
          </DialogTitle>
          <DialogDescription>
            Cette action mettra en attente le marché <strong>{marche?.numero}</strong>. Un motif est obligatoire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">Motif du différé *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez les raisons du différé..."
              className="mt-1.5"
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
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isDeferring || !motif.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isDeferring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Clock className="mr-2 h-4 w-4" />
            )}
            Différer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
