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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Engagement } from "@/hooks/useEngagements";

interface EngagementRejectDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function EngagementRejectDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: EngagementRejectDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (engagement && reason.trim()) {
      onConfirm(engagement.id, reason);
      setReason("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rejeter l'engagement</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de rejeter l'engagement <strong>{engagement?.numero}</strong>.
            Cette action est irréversible. Veuillez indiquer le motif du rejet.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="reason">Motif du rejet *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez la raison du rejet..."
            rows={4}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Rejet en cours..." : "Rejeter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
