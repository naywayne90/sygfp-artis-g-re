import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, XCircle, User, Building2, FileText, Calculator, Lock, FileCheck } from "lucide-react";
import { Engagement, VALIDATION_STEPS, useEngagements } from "@/hooks/useEngagements";
import { EngagementChecklist } from "./EngagementChecklist";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EngagementDetailsProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationStep {
  id: string;
  step_order: number;
  role: string;
  status: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { full_name: string | null } | null;
}

export function EngagementDetails({ engagement, open, onOpenChange }: EngagementDetailsProps) {
  const { getValidationSteps } = useEngagements();
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);

  useEffect(() => {
    if (engagement?.id) {
      getValidationSteps(engagement.id).then(setValidationSteps);
    }
  }, [engagement?.id]);

  if (!engagement) return null;

  const formatMontant = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
  };

  const getStepIcon = (status: string | null) => {
    switch (status) {
      case "valide":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "rejete":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const isLocked = engagement.statut === "valide";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Engagement {engagement.numero}
            {isLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Verrouillé
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details" className="gap-1">
                <FileText className="h-4 w-4" />
                Détails
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1">
                <FileCheck className="h-4 w-4" />
                Pièces
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Informations générales */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Numéro:</span>
                      <span className="ml-2 font-medium">{engagement.numero}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(engagement.date_engagement), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Objet:</span>
                      <p className="mt-1 font-medium">{engagement.objet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fournisseur */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Fournisseur {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Raison sociale:</span>
                      <span className="ml-2 font-medium">{engagement.fournisseur || "N/A"}</span>
                    </div>
                    {engagement.marche && (
                      <div>
                        <span className="text-muted-foreground">Réf. marché:</span>
                        <span className="ml-2 font-medium">{engagement.marche.numero || "N/A"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Imputation budgétaire */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Imputation budgétaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ligne budgétaire:</span>
                      <span className="ml-2 font-medium">{engagement.budget_line?.code || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Libellé:</span>
                      <span className="ml-2 font-medium">{engagement.budget_line?.label || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Montants */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Montants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground text-xs">Montant HT</div>
                      <div className="font-bold">
                        {engagement.montant_ht ? formatMontant(engagement.montant_ht) : "N/A"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground text-xs">TVA ({engagement.tva || 0}%)</div>
                      <div className="font-bold">
                        {engagement.montant_ht && engagement.tva
                          ? formatMontant(engagement.montant_ht * (engagement.tva / 100))
                          : "N/A"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <div className="text-primary text-xs">Montant TTC</div>
                      <div className="font-bold text-primary">{formatMontant(engagement.montant)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow de validation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Workflow de validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {VALIDATION_STEPS.map((step) => {
                      const validation = validationSteps.find((v) => v.step_order === step.order);
                      return (
                        <div
                          key={step.order}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            validation?.status === "valide"
                              ? "bg-success/10"
                              : validation?.status === "rejete"
                              ? "bg-destructive/10"
                              : "bg-muted/50"
                          }`}
                        >
                          {getStepIcon(validation?.status || null)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Étape {step.order}: {step.label}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  validation?.status === "valide"
                                    ? "bg-success/10 text-success"
                                    : validation?.status === "rejete"
                                    ? "bg-destructive/10 text-destructive"
                                    : ""
                                }
                              >
                                {validation?.status === "valide"
                                  ? "Validé"
                                  : validation?.status === "rejete"
                                  ? "Rejeté"
                                  : "En attente"}
                              </Badge>
                            </div>
                            {validation?.validated_at && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(validation.validated_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                                {validation.validator?.full_name && ` par ${validation.validator.full_name}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Motif différé/rejet */}
              {engagement.statut === "differe" && engagement.motif_differe && (
                <Card className="border-warning/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-warning">Motif du report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{engagement.motif_differe}</p>
                    {engagement.deadline_correction && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Date de reprise prévue: {format(new Date(engagement.deadline_correction), "dd/MM/yyyy", { locale: fr })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="checklist">
              <EngagementChecklist 
                engagementId={engagement.id} 
                canEdit={engagement.statut !== "valide"} 
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
