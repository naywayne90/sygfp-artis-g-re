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
import { AlertCircle, Shield, XCircle, Loader2 } from "lucide-react";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";

interface LiquidationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  liquidationNumero?: string;
}

const MIN_REASON_LENGTH = 10; // Minimum 10 caractères pour le motif

export function LiquidationRejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  liquidationNumero,
}: LiquidationRejectDialogProps) {
  const [reason, setReason] = useState("");
  const { canValidateLiquidation, isDG, isCB, isAdmin } = useRoleBasedAccess();

  // Vérifier si l'utilisateur a le droit de rejeter
  const hasRejectPermission = canValidateLiquidation() || isDG || isCB || isAdmin;

  // Validation du motif
  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH;
  const remainingChars = MIN_REASON_LENGTH - reason.trim().length;

  const handleConfirm = () => {
    if (isReasonValid && hasRejectPermission) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeter la liquidation
          </DialogTitle>
          <DialogDescription>
            {liquidationNumero && (
              <span className="block mb-1">
                Liquidation : <strong>{liquidationNumero}</strong>
              </span>
            )}
            Cette action est irréversible. Le motif du rejet est obligatoire et sera visible
            dans l'historique d'audit.
          </DialogDescription>
        </DialogHeader>

        {/* Vérification des droits */}
        {!hasRejectPermission && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez pas les droits nécessaires pour rejeter cette liquidation.
              Seuls les rôles DG, DAAF, CB ou Admin peuvent effectuer cette action.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="reason" className="flex items-center gap-2">
                Motif du rejet
                <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
              </Label>
              {reason.length > 0 && remainingChars > 0 && (
                <span className="text-xs text-muted-foreground">
                  {remainingChars} caractère(s) restant(s)
                </span>
              )}
            </div>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez précisément le motif du rejet (minimum 10 caractères)..."
              className={`mt-1 ${!isReasonValid && reason.length > 0 ? "border-destructive" : ""}`}
              rows={4}
              disabled={!hasRejectPermission}
            />
            {reason.length > 0 && !isReasonValid && (
              <p className="text-xs text-destructive mt-1">
                Le motif doit contenir au moins {MIN_REASON_LENGTH} caractères.
              </p>
            )}
          </div>

          {/* Warning about audit trail */}
          <Alert className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Ce rejet sera enregistré dans l'audit trail avec votre identité,
              la date/heure et le motif fourni.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isReasonValid || !hasRejectPermission || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejet en cours...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmer le rejet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
