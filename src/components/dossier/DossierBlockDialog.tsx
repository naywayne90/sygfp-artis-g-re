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
import { AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react";
import { Dossier } from "@/hooks/useDossiers";

interface DossierBlockDialogProps {
  dossier: Dossier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dossierId: string, motif: string) => Promise<void>;
  mode: "block" | "unblock";
}

export function DossierBlockDialog({
  dossier,
  open,
  onOpenChange,
  onConfirm,
  mode,
}: DossierBlockDialogProps) {
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!dossier || !motif.trim()) return;
    setLoading(true);
    try {
      await onConfirm(dossier.id, motif);
      onOpenChange(false);
      setMotif("");
    } finally {
      setLoading(false);
    }
  };

  if (!dossier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "block" ? (
              <>
                <Lock className="h-5 w-5 text-destructive" />
                Bloquer le dossier
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5 text-green-600" />
                Débloquer le dossier
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "block" ? (
              <>
                Le dossier <strong>{dossier.numero}</strong> sera bloqué et aucune action ne pourra être effectuée jusqu'au déblocage.
              </>
            ) : (
              <>
                Le dossier <strong>{dossier.numero}</strong> sera débloqué et les actions pourront reprendre.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {mode === "block" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm">
              Cette action est réversible mais sera enregistrée dans le journal d'audit.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="motif">
            {mode === "block" ? "Motif du blocage *" : "Commentaire de déblocage *"}
          </Label>
          <Textarea
            id="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={
              mode === "block"
                ? "Expliquez la raison du blocage..."
                : "Expliquez pourquoi le dossier est débloqué..."
            }
            rows={3}
            required
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant={mode === "block" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading || !motif.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "block" ? "Bloquer" : "Débloquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
