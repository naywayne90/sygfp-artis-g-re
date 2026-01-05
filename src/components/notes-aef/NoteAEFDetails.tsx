import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NoteAEF } from "@/hooks/useNotesAEF";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Calendar,
  User,
  FileText,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

interface NoteAEFDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning" },
    valide: { label: "Validé", className: "bg-success/10 text-success" },
    impute: { label: "Imputé", className: "bg-primary/10 text-primary" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700" },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number | null) => {
  if (!montant) return "Non spécifié";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export function NoteAEFDetails({ open, onOpenChange, note }: NoteAEFDetailsProps) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note AEF {note.numero || ""}
            </DialogTitle>
            {getStatusBadge(note.statut)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{note.objet}</h3>
            
            {note.contenu && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                {note.contenu}
              </div>
            )}
          </div>

          <Separator />

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Direction:</span>
              <span className="font-medium">
                {note.direction?.sigle || note.direction?.label || "Non spécifiée"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Montant estimé:</span>
              <span className="font-medium">{formatMontant(note.montant_estime)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Créée le:</span>
              <span>{format(new Date(note.created_at), "dd MMMM yyyy", { locale: fr })}</span>
            </div>

            {note.created_by_profile && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créée par:</span>
                <span>
                  {note.created_by_profile.first_name} {note.created_by_profile.last_name}
                </span>
              </div>
            )}
          </div>

          {/* Imputation */}
          {note.statut === "impute" && note.budget_line && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Imputation budgétaire
                </h4>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-mono text-sm">{note.budget_line.code}</p>
                  <p className="text-sm">{note.budget_line.label}</p>
                  {note.imputed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Imputé le {format(new Date(note.imputed_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      {note.imputed_by_profile && (
                        <> par {note.imputed_by_profile.first_name} {note.imputed_by_profile.last_name}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Rejet */}
          {note.statut === "rejete" && note.rejection_reason && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Motif de rejet
                </h4>
                <div className="bg-destructive/10 p-4 rounded-lg text-sm">
                  {note.rejection_reason}
                </div>
              </div>
            </>
          )}

          {/* Différé */}
          {note.statut === "differe" && note.motif_differe && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Report
                </h4>
                <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-lg text-sm">
                  <p><strong>Motif:</strong> {note.motif_differe}</p>
                  {note.deadline_correction && (
                    <p className="mt-2">
                      <strong>Date de reprise:</strong>{" "}
                      {format(new Date(note.deadline_correction), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Validation */}
          {note.validated_at && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span className="text-success">✓</span> Validée le{" "}
                {format(new Date(note.validated_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
