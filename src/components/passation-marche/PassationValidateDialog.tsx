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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { PassationMarche, MODES_PASSATION } from "@/hooks/usePassationsMarche";

interface PassationValidateDialogProps {
  passation: PassationMarche | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function PassationValidateDialog({
  passation,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: PassationValidateDialogProps) {
  const [comments, setComments] = useState("");
  const [hasConfirmedChecklist, setHasConfirmedChecklist] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setComments("");
    setHasConfirmedChecklist(false);
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  const getModeName = (value: string) =>
    MODES_PASSATION.find((m) => m.value === value)?.label || value;

  if (!passation) return null;

  // Vérifier les pièces jointes
  const piecesJointes = passation.pieces_jointes || [];
  const hasDocuments = piecesJointes.length > 0;
  const hasPrestataire = passation.prestataire_retenu_id || 
    (passation.prestataires_sollicites || []).some((p: any) => p.selectionne);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Valider la passation
          </DialogTitle>
          <DialogDescription>
            Confirmez la validation de cette passation de marché
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Résumé de la passation */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence:</span>
                <span className="font-mono font-medium">{passation.reference || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant="outline">{getModeName(passation.mode_passation)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant retenu:</span>
                <span className="font-bold">{formatMontant(passation.montant_retenu)}</span>
              </div>
              {passation.prestataire_retenu && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prestataire:</span>
                  <span className="font-medium">{passation.prestataire_retenu.raison_sociale}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertes de contrôle */}
          {!hasDocuments && (
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucune pièce justificative n'a été jointe à cette passation.
              </AlertDescription>
            </Alert>
          )}

          {!hasPrestataire && (
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucun prestataire n'a été sélectionné pour cette passation.
              </AlertDescription>
            </Alert>
          )}

          {/* Checklist de validation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirmation de validation</Label>
            <div className="flex items-start gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="confirm-checklist"
                checked={hasConfirmedChecklist}
                onChange={(e) => setHasConfirmedChecklist(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="confirm-checklist" className="text-sm cursor-pointer">
                Je confirme avoir vérifié la conformité de la procédure de passation, 
                la validité des pièces justificatives et la sélection du prestataire.
              </label>
            </div>
          </div>

          {/* Commentaires */}
          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires (optionnel)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Observations ou remarques..."
              rows={3}
            />
          </div>

          {/* Info de validation */}
          <Alert className="bg-green-50 border-green-200">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              La validation permettra de créer l'engagement budgétaire correspondant 
              et mettra à jour le statut du dossier.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasConfirmedChecklist || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmer la validation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
