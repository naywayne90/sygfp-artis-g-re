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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";

// Motifs prédéfinis de rejet
const MOTIFS_REJET = [
  { value: "documents_incomplets", label: "Documents incomplets ou manquants" },
  { value: "procedure_non_conforme", label: "Procédure non conforme" },
  { value: "montant_depassement", label: "Dépassement du seuil autorisé" },
  { value: "prestataire_non_qualifie", label: "Prestataire non qualifié" },
  { value: "offre_non_conforme", label: "Offre non conforme aux spécifications" },
  { value: "budget_insuffisant", label: "Budget insuffisant" },
  { value: "autre", label: "Autre motif (à préciser)" },
];

interface PassationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motif: string) => Promise<void>;
  isLoading?: boolean;
  reference?: string;
}

export function PassationRejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  reference,
}: PassationRejectDialogProps) {
  const [motifType, setMotifType] = useState("");
  const [motifDetail, setMotifDetail] = useState("");

  const handleConfirm = async () => {
    const motifLabel = MOTIFS_REJET.find((m) => m.value === motifType)?.label || "";
    const fullMotif = motifType === "autre" 
      ? motifDetail 
      : motifDetail 
        ? `${motifLabel}: ${motifDetail}` 
        : motifLabel;

    await onConfirm(fullMotif);
    setMotifType("");
    setMotifDetail("");
  };

  const isValid = motifType && (motifType !== "autre" || motifDetail.trim().length > 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter la passation
          </DialogTitle>
          <DialogDescription>
            {reference 
              ? `Rejeter la passation ${reference}` 
              : "Indiquez le motif du rejet"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Le rejet est irréversible. Le créateur devra corriger les éléments 
              et resoumettre une nouvelle passation si nécessaire.
            </AlertDescription>
          </Alert>

          {/* Type de motif */}
          <div className="space-y-2">
            <Label htmlFor="motif-type">Motif du rejet *</Label>
            <Select value={motifType} onValueChange={setMotifType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {MOTIFS_REJET.map((motif) => (
                  <SelectItem key={motif.value} value={motif.value}>
                    {motif.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Détails */}
          <div className="space-y-2">
            <Label htmlFor="motif-detail">
              {motifType === "autre" ? "Précisez le motif *" : "Détails complémentaires"}
            </Label>
            <Textarea
              id="motif-detail"
              value={motifDetail}
              onChange={(e) => setMotifDetail(e.target.value)}
              placeholder={
                motifType === "autre"
                  ? "Décrivez le motif du rejet..."
                  : "Ajoutez des précisions si nécessaire..."
              }
              rows={4}
            />
            {motifType === "autre" && motifDetail.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Minimum 10 caractères pour le motif personnalisé
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
