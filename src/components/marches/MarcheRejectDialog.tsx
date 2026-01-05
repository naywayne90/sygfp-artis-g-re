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
import { Loader2, XCircle } from "lucide-react";
import { useMarches, Marche } from "@/hooks/useMarches";

interface MarcheRejectDialogProps {
  marche: Marche | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MarcheRejectDialog({ marche, open, onOpenChange, onSuccess }: MarcheRejectDialogProps) {
  const { rejectMarche, isRejecting } = useMarches();
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!marche || !reason.trim()) return;

    try {
      await rejectMarche({ marcheId: marche.id, reason: reason.trim() });
      setReason("");
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter le marché
          </DialogTitle>
          <DialogDescription>
            Cette action rejettera le marché <strong>{marche?.numero}</strong>. Un motif est obligatoire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason">Motif du rejet *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez les raisons du rejet..."
              className="mt-1.5"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isRejecting || !reason.trim()}
          >
            {isRejecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Rejeter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
