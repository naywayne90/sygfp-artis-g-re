import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileWarning, Loader2, ClipboardCheck } from "lucide-react";
import { useSupplierQualification } from "@/hooks/useSupplierDocuments";
import { Prestataire } from "@/hooks/usePrestataires";

interface SupplierQualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestataire: Prestataire;
  action: "evaluate" | "qualify";
  onConfirm: (motif?: string) => void;
  isLoading?: boolean;
}

export function SupplierQualificationDialog({
  open,
  onOpenChange,
  prestataire,
  action,
  onConfirm,
  isLoading = false,
}: SupplierQualificationDialogProps) {
  const [motif, setMotif] = useState("");
  const { canQualify, missingDocuments, expiredDocuments, isLoading: loadingQualification } = useSupplierQualification(
    action === "qualify" ? prestataire.id : undefined
  );

  const handleConfirm = () => {
    onConfirm(action === "evaluate" ? motif : undefined);
  };

  const isEvaluate = action === "evaluate";
  const title = isEvaluate ? "Passer en évaluation" : "Qualifier le prestataire";
  const description = isEvaluate
    ? "Ce prestataire sera marqué comme étant en cours d'évaluation."
    : "Vérifiez que tous les documents obligatoires sont valides avant de qualifier ce prestataire.";

  const hasBlockingIssues = !isEvaluate && (missingDocuments.length > 0 || expiredDocuments.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEvaluate ? (
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Supplier info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{prestataire.raison_sociale}</p>
              <p className="text-sm text-muted-foreground font-mono">{prestataire.code}</p>
            </div>
            <Badge variant="outline">{prestataire.statut || "NOUVEAU"}</Badge>
          </div>

          {/* Qualification check (only for qualify action) */}
          {!isEvaluate && !loadingQualification && (
            <>
              {canQualify ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Tous les documents obligatoires sont valides. Ce prestataire peut être qualifié.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ce prestataire ne peut pas être qualifié. Veuillez résoudre les problèmes suivants :
                  </AlertDescription>
                </Alert>
              )}

              {missingDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <FileWarning className="h-4 w-4" />
                    Documents manquants ({missingDocuments.length})
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside pl-2">
                    {missingDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {expiredDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Documents expirés ({expiredDocuments.length})
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside pl-2">
                    {expiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {loadingQualification && !isEvaluate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification des documents...
            </div>
          )}

          {/* Motif field (only for evaluate) */}
          {isEvaluate && (
            <div className="space-y-2">
              <Label>Motif / Commentaire (optionnel)</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Indiquez les points à vérifier..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (action === "qualify" && hasBlockingIssues)}
            className={isEvaluate ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEvaluate ? "Passer en évaluation" : "Qualifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
