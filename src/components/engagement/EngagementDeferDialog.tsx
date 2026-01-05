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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Engagement } from "@/hooks/useEngagements";

interface EngagementDeferDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, motif: string, dateReprise?: string) => void;
  isLoading?: boolean;
}

export function EngagementDeferDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: EngagementDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [dateReprise, setDateReprise] = useState("");

  const handleConfirm = () => {
    if (engagement && motif.trim()) {
      onConfirm(engagement.id, motif, dateReprise || undefined);
      setMotif("");
      setDateReprise("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Différer l'engagement</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de différer l'engagement <strong>{engagement?.numero}</strong>.
            Veuillez indiquer le motif et optionnellement une date de reprise.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motif">Motif du report *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez la raison du report..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateReprise">Date de reprise prévue (optionnel)</Label>
            <Input
              id="dateReprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setMotif(""); setDateReprise(""); }}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!motif.trim() || isLoading}
          >
            {isLoading ? "Report en cours..." : "Différer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
