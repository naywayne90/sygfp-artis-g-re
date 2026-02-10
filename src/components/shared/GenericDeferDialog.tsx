import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";

export interface DeferDialogData {
  motif: string;
  condition?: string;
  dateReprise?: string;
}

interface GenericDeferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display identifier for the entity (e.g. "SEF-2026-001") */
  entityLabel?: string;
  /** Entity type name for dialog text (e.g. "la note", "l'engagement") */
  entityName?: string;
  /** Custom dialog title */
  title?: string;
  /** Whether to show the "Condition de reprise" field */
  showCondition?: boolean;
  onConfirm: (data: DeferDialogData) => Promise<void> | void;
  isLoading?: boolean;
}

export function GenericDeferDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName = "l'element",
  title,
  showCondition = false,
  onConfirm,
  isLoading: externalLoading,
}: GenericDeferDialogProps) {
  const [motif, setMotif] = useState("");
  const [condition, setCondition] = useState("");
  const [dateReprise, setDateReprise] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  const reset = () => {
    setMotif("");
    setCondition("");
    setDateReprise("");
  };

  const handleConfirm = async () => {
    if (!motif.trim()) return;

    setInternalLoading(true);
    try {
      await onConfirm({
        motif,
        condition: condition || undefined,
        dateReprise: dateReprise || undefined,
      });
      reset();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <Clock className="h-5 w-5" />
            {title || `Differer ${entityName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous etes sur le point de differer {entityName}
            {entityLabel && (
              <> <strong>{entityLabel}</strong></>
            )}
            . Precisez les conditions de reprise.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="defer-motif" className="text-foreground">
              Motif du report *
            </Label>
            <Textarea
              id="defer-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Indiquez le motif du report (obligatoire)"
              rows={3}
              className="mt-2"
            />
          </div>

          {showCondition && (
            <div>
              <Label htmlFor="defer-condition" className="text-foreground">
                Condition de reprise
              </Label>
              <Textarea
                id="defer-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Condition pour reprendre le traitement (optionnel)"
                rows={2}
                className="mt-2"
              />
            </div>
          )}

          <div>
            <Label htmlFor="defer-date-reprise" className="text-foreground">
              Date de reprise prevue
            </Label>
            <Input
              id="defer-date-reprise"
              type="date"
              value={dateReprise}
              onChange={(e) => setDateReprise(e.target.value)}
              className="mt-2"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !motif.trim()}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le report
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
