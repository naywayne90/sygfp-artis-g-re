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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2, Info, CalendarDays } from "lucide-react";
import { addDays, format } from "date-fns";

// Motifs prédéfinis de report
const MOTIFS_REPORT = [
  { value: "documents_a_completer", label: "Documents à compléter" },
  { value: "verification_prestataire", label: "Vérification du prestataire en cours" },
  { value: "attente_budget", label: "En attente de disponibilité budgétaire" },
  { value: "revision_technique", label: "Révision technique nécessaire" },
  { value: "validation_hierarchique", label: "Attente validation hiérarchique" },
  { value: "autre", label: "Autre motif (à préciser)" },
];

interface PassationDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motif: string, dateReprise?: string) => Promise<void>;
  isLoading?: boolean;
  reference?: string;
}

export function PassationDeferDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  reference,
}: PassationDeferDialogProps) {
  const [motifType, setMotifType] = useState("");
  const [motifDetail, setMotifDetail] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [delaiPreset, setDelaiPreset] = useState("");

  const handleDelaiPreset = (days: string) => {
    setDelaiPreset(days);
    if (days) {
      const date = addDays(new Date(), parseInt(days));
      setDateReprise(format(date, "yyyy-MM-dd"));
    } else {
      setDateReprise("");
    }
  };

  const handleConfirm = async () => {
    const motifLabel = MOTIFS_REPORT.find((m) => m.value === motifType)?.label || "";
    const fullMotif = motifType === "autre" 
      ? motifDetail 
      : motifDetail 
        ? `${motifLabel}: ${motifDetail}` 
        : motifLabel;

    await onConfirm(fullMotif, dateReprise || undefined);
    setMotifType("");
    setMotifDetail("");
    setDateReprise("");
    setDelaiPreset("");
  };

  const isValid = motifType && (motifType !== "autre" || motifDetail.trim().length > 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            Différer la passation
          </DialogTitle>
          <DialogDescription>
            {reference 
              ? `Reporter le traitement de la passation ${reference}` 
              : "Reporter le traitement de cette passation"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-orange-50 border-orange-200">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              La passation sera mise en attente. Elle pourra être reprise 
              ultérieurement pour validation ou rejet.
            </AlertDescription>
          </Alert>

          {/* Type de motif */}
          <div className="space-y-2">
            <Label htmlFor="motif-type">Motif du report *</Label>
            <Select value={motifType} onValueChange={setMotifType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {MOTIFS_REPORT.map((motif) => (
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
              {motifType === "autre" ? "Précisez le motif *" : "Conditions de reprise"}
            </Label>
            <Textarea
              id="motif-detail"
              value={motifDetail}
              onChange={(e) => setMotifDetail(e.target.value)}
              placeholder={
                motifType === "autre"
                  ? "Décrivez le motif du report..."
                  : "Quelles conditions doivent être remplies pour la reprise ?"
              }
              rows={3}
            />
          </div>

          {/* Date de reprise */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Date de reprise prévue
            </Label>
            
            {/* Presets de délai */}
            <div className="flex gap-2 flex-wrap">
              {["7", "14", "30", ""].map((days) => (
                <Button
                  key={days || "custom"}
                  type="button"
                  variant={delaiPreset === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDelaiPreset(days)}
                >
                  {days ? `${days} jours` : "Personnalisé"}
                </Button>
              ))}
            </div>

            <Input
              type="date"
              value={dateReprise}
              onChange={(e) => {
                setDateReprise(e.target.value);
                setDelaiPreset("");
              }}
              min={format(new Date(), "yyyy-MM-dd")}
            />
            <p className="text-xs text-muted-foreground">
              Une alerte de rappel sera créée à cette date
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            Confirmer le report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
