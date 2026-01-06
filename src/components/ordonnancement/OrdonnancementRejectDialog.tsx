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
import { XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrdonnancements } from "@/hooks/useOrdonnancements";

interface OrdonnancementRejectDialogProps {
  ordonnancement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrdonnancementRejectDialog({
  ordonnancement,
  open,
  onOpenChange,
}: OrdonnancementRejectDialogProps) {
  const { rejectOrdonnancement } = useOrdonnancements();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("Le motif de rejet est obligatoire");
      return;
    }

    await rejectOrdonnancement.mutateAsync({
      id: ordonnancement.id,
      reason: reason.trim(),
    });
    setReason("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Rejeter l'ordonnancement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action est définitive. L'ordonnancement sera marqué comme rejeté et ne pourra plus être validé.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Ordonnancement</p>
            <p className="font-medium">{ordonnancement?.numero}</p>
            <p className="text-sm">{ordonnancement?.objet}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motif du rejet *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Expliquez le motif du rejet..."
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectOrdonnancement.isPending}
          >
            {rejectOrdonnancement.isPending ? "Rejet..." : "Confirmer le rejet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
