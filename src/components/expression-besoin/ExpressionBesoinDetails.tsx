import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExpressionBesoin } from "@/hooks/useExpressionsBesoin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Building2,
  Briefcase,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ExpressionBesoinDetailsProps {
  expression: ExpressionBesoin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon", variant: "secondary", icon: <FileText className="h-4 w-4" /> },
  soumis: { label: "Soumis", variant: "outline", icon: <Clock className="h-4 w-4" /> },
  validé: { label: "Validé", variant: "default", icon: <CheckCircle2 className="h-4 w-4" /> },
  rejeté: { label: "Rejeté", variant: "destructive", icon: <XCircle className="h-4 w-4" /> },
  différé: { label: "Différé", variant: "outline", icon: <Clock className="h-4 w-4" /> },
};

export function ExpressionBesoinDetails({
  expression,
  open,
  onOpenChange,
}: ExpressionBesoinDetailsProps) {
  const status = STATUS_CONFIG[expression.statut || "brouillon"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Expression de besoin {expression.numero || ""}
            </DialogTitle>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Objet</span>
                <p className="font-medium">{expression.objet}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Direction</span>
                  <p className="font-medium">
                    {expression.direction?.sigle || expression.direction?.label || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Exercice</span>
                  <p className="font-medium">{expression.exercice}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Montant estimé</span>
                  <p className="font-medium">
                    {expression.montant_estime
                      ? new Intl.NumberFormat("fr-FR").format(expression.montant_estime) + " FCFA"
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Urgence</span>
                  <Badge variant="outline">
                    {expression.urgence === "tres_urgent"
                      ? "Très urgent"
                      : expression.urgence === "urgent"
                      ? "Urgent"
                      : "Normal"}
                  </Badge>
                </div>
              </div>

              {(expression.numero_lot || expression.intitule_lot) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Numéro de lot</span>
                    <p className="font-medium">{expression.numero_lot || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Intitulé du lot</span>
                    <p className="font-medium">{expression.intitule_lot || "-"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marché lié */}
          {expression.marche && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Marché lié
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Numéro</span>
                    <p className="font-medium">{expression.marche.numero || "En attente"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Montant</span>
                    <p className="font-medium">
                      {new Intl.NumberFormat("fr-FR").format(expression.marche.montant)} FCFA
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">Objet</span>
                    <p className="font-medium">{expression.marche.objet}</p>
                  </div>
                  {expression.marche.prestataire && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Fournisseur</span>
                      <p className="font-medium">
                        {expression.marche.prestataire.raison_sociale}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dossier lié */}
          {expression.dossier && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dossier lié
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Numéro</span>
                    <p className="font-medium">{expression.dossier.numero}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Objet</span>
                    <p className="font-medium">{expression.dossier.objet}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description et justification */}
          {(expression.description || expression.justification || expression.specifications) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détails du besoin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {expression.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="whitespace-pre-wrap">{expression.description}</p>
                  </div>
                )}
                {expression.justification && (
                  <div>
                    <span className="text-sm text-muted-foreground">Justification</span>
                    <p className="whitespace-pre-wrap">{expression.justification}</p>
                  </div>
                )}
                {expression.specifications && (
                  <div>
                    <span className="text-sm text-muted-foreground">Spécifications</span>
                    <p className="whitespace-pre-wrap">{expression.specifications}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Calendrier */}
          {(expression.calendrier_debut || expression.calendrier_fin) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendrier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Date début</span>
                    <p className="font-medium">
                      {expression.calendrier_debut
                        ? format(new Date(expression.calendrier_debut), "dd MMMM yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date fin</span>
                    <p className="font-medium">
                      {expression.calendrier_fin
                        ? format(new Date(expression.calendrier_fin), "dd MMMM yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Motif de rejet ou différé */}
          {expression.statut === "rejeté" && expression.rejection_reason && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Motif du rejet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{expression.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          {expression.statut === "différé" && expression.motif_differe && (
            <Card className="border-warning/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <Clock className="h-4 w-4" />
                  Motif du report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{expression.motif_differe}</p>
                {expression.deadline_correction && (
                  <p className="text-sm text-muted-foreground">
                    Date de reprise prévue:{" "}
                    {format(new Date(expression.deadline_correction), "dd MMMM yyyy", { locale: fr })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Historique */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Suivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span>{format(new Date(expression.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                </div>
                {expression.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soumis le</span>
                    <span>{format(new Date(expression.submitted_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                  </div>
                )}
                {expression.validated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validé le</span>
                    <span>
                      {format(new Date(expression.validated_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      {expression.validator && ` par ${expression.validator.full_name}`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
