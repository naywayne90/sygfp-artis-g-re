import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle } from "lucide-react";
import { Dossier } from "@/hooks/useDossiers";
import { cn } from "@/lib/utils";

interface DossierStatusDialogProps {
  dossier: Dossier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dossierId: string, newStatus: string, comment?: string) => Promise<void>;
}

const STATUTS = [
  { value: "en_cours", label: "En cours", description: "Le dossier est en cours de traitement", color: "border-blue-500 bg-blue-50" },
  { value: "termine", label: "Terminé", description: "Le dossier est clôturé avec succès", color: "border-green-500 bg-green-50" },
  { value: "suspendu", label: "Suspendu", description: "Le traitement est temporairement interrompu", color: "border-yellow-500 bg-yellow-50" },
  { value: "annule", label: "Annulé", description: "Le dossier est définitivement annulé", color: "border-red-500 bg-red-50" },
];

export function DossierStatusDialog({ dossier, open, onOpenChange, onConfirm }: DossierStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [comment, setComment] = useState("");

  const handleConfirm = async () => {
    if (!dossier || !selectedStatus) return;
    setLoading(true);
    try {
      await onConfirm(dossier.id, selectedStatus, comment);
      onOpenChange(false);
      setSelectedStatus("");
      setComment("");
    } finally {
      setLoading(false);
    }
  };

  if (!dossier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Changer le statut du dossier</DialogTitle>
          <DialogDescription>
            Dossier {dossier.numero} - Statut actuel: {dossier.statut_global}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nouveau statut</Label>
            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="space-y-2"
            >
              {STATUTS.filter((s) => s.value !== dossier.statut_global).map((statut) => (
                <div
                  key={statut.value}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedStatus === statut.value ? statut.color : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedStatus(statut.value)}
                >
                  <RadioGroupItem value={statut.value} id={statut.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={statut.value} className="font-medium cursor-pointer">
                      {statut.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{statut.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {(selectedStatus === "suspendu" || selectedStatus === "annule") && (
            <div className="space-y-2">
              <Label htmlFor="comment">Motif (obligatoire)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Indiquez le motif de ce changement..."
                rows={3}
              />
              {!comment && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Le motif est obligatoire pour ce statut
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading ||
              !selectedStatus ||
              ((selectedStatus === "suspendu" || selectedStatus === "annule") && !comment)
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
