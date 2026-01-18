import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpressionBesoin, VALIDATION_STEPS } from "@/hooks/useExpressionsBesoin";
import { ExpressionBesoinTimeline } from "./ExpressionBesoinTimeline";
import { DossierStepTimeline } from "@/components/shared/DossierStepTimeline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Briefcase,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Package,
  Users,
  Info,
  History,
  CreditCard,
} from "lucide-react";

interface ExpressionBesoinDetailsProps {
  expression: ExpressionBesoin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon", variant: "secondary", icon: <FileText className="h-4 w-4" /> },
  soumis: { label: "À valider", variant: "outline", icon: <Clock className="h-4 w-4" /> },
  validé: { label: "Validé", variant: "default", icon: <CheckCircle2 className="h-4 w-4" /> },
  rejeté: { label: "Rejeté", variant: "destructive", icon: <XCircle className="h-4 w-4" /> },
  différé: { label: "Différé", variant: "outline", icon: <Clock className="h-4 w-4" /> },
  satisfaite: { label: "Satisfaite", variant: "default", icon: <CheckCircle2 className="h-4 w-4" /> },
};

export function ExpressionBesoinDetails({
  expression,
  open,
  onOpenChange,
}: ExpressionBesoinDetailsProps) {
  const status = STATUS_CONFIG[expression.statut || "brouillon"];
  const currentStep = expression.current_validation_step || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="infos" className="gap-1">
              <Info className="h-3 w-3" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1">
              <History className="h-3 w-3" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Onglet Informations */}
          <TabsContent value="infos" className="mt-4 space-y-4">
            {/* Workflow de validation */}
            {expression.statut === "soumis" && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Circuit de validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    {VALIDATION_STEPS.map((step, index) => {
                      const validation = expression.validations?.find(v => v.step_order === step.order);
                      const isCompleted = validation?.status === "approved";
                      const isCurrent = step.order === currentStep;
                      const isPending = step.order > currentStep;

                      return (
                        <div key={step.order} className="flex items-center gap-2 flex-1">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                            ${isCompleted ? 'bg-success text-white' : ''}
                            ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                            ${isPending ? 'bg-muted text-muted-foreground' : ''}
                          `}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isPending ? 'text-muted-foreground' : ''}`}>
                              {step.label}
                            </p>
                            {isCompleted && validation?.validated_at && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(validation.validated_at), "dd/MM HH:mm")}
                              </p>
                            )}
                            {isCurrent && (
                              <p className="text-xs text-primary">En attente</p>
                            )}
                          </div>
                          {index < VALIDATION_STEPS.length - 1 && (
                            <div className={`h-0.5 w-4 ${isCompleted ? 'bg-success' : 'bg-muted'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Imputation source */}
            {expression.imputation && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Imputation source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Référence</span>
                      <p className="font-mono font-medium">{expression.imputation.reference || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Montant</span>
                      <p className="font-medium">
                        {expression.imputation.montant
                          ? new Intl.NumberFormat("fr-FR").format(expression.imputation.montant) + " FCFA"
                          : "-"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Objet</span>
                      <p className="font-medium">{expression.imputation.objet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Livraison */}
            {(expression.lieu_livraison || expression.delai_livraison || expression.contact_livraison) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lieu et délais de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expression.lieu_livraison && (
                    <div>
                      <span className="text-sm text-muted-foreground">Lieu de livraison</span>
                      <p className="font-medium">{expression.lieu_livraison}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {expression.delai_livraison && (
                      <div>
                        <span className="text-sm text-muted-foreground">Délai souhaité</span>
                        <p className="font-medium">{expression.delai_livraison}</p>
                      </div>
                    )}
                    {expression.contact_livraison && (
                      <div>
                        <span className="text-sm text-muted-foreground">Contact sur site</span>
                        <p className="font-medium">{expression.contact_livraison}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Articles */}
            {expression.liste_articles && Array.isArray(expression.liste_articles) && expression.liste_articles.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Articles ({expression.liste_articles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expression.liste_articles.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="font-medium">{item.article}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.quantite} {item.unite}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Suivi simple */}
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
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
            {/* Chaîne de la dépense (si lié à un dossier) */}
            {expression.dossier_id && (
              <DossierStepTimeline
                dossierId={expression.dossier_id}
                highlightStep="expression_besoin"
                showNavigation
              />
            )}

            {/* Workflow interne de l'expression de besoin */}
            <ExpressionBesoinTimeline expression={expression} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
