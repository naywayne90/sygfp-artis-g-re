import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Liquidation, VALIDATION_STEPS, DOCUMENTS_REQUIS } from "@/hooks/useLiquidations";
import { LiquidationChecklist } from "./LiquidationChecklist";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Building, 
  Calendar, 
  FileText, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Download,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiquidationDetailsProps {
  liquidation: Liquidation;
}

const formatMontant = (montant: number | null) => {
  if (montant === null || montant === undefined) return "N/A";
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const getStatusBadge = (statut: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground border-muted" },
    soumis: { label: "Soumis", className: "bg-secondary/10 text-secondary border-secondary/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    differe: { label: "Différé", className: "bg-warning/10 text-warning border-warning/20" },
  };
  const variant = variants[statut || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

export function LiquidationDetails({ liquidation }: LiquidationDetailsProps) {
  const getDocLabel = (code: string) => {
    return DOCUMENTS_REQUIS.find(d => d.code === code)?.label || code;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{liquidation.numero}</h2>
          <p className="text-muted-foreground">
            Liquidation créée le {format(new Date(liquidation.created_at), "dd MMMM yyyy", { locale: fr })}
          </p>
        </div>
        {getStatusBadge(liquidation.statut)}
      </div>

      {/* Rejection/Defer reason */}
      {liquidation.statut === "rejete" && liquidation.rejection_reason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Motif du rejet</div>
                <p className="text-sm mt-1">{liquidation.rejection_reason}</p>
                {liquidation.rejected_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Rejeté le {format(new Date(liquidation.rejected_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {liquidation.statut === "differe" && liquidation.motif_differe && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <div className="font-medium text-warning">Motif du report</div>
                <p className="text-sm mt-1">{liquidation.motif_differe}</p>
                {liquidation.deadline_correction && (
                  <p className="text-sm mt-2">
                    Date de reprise prévue: {format(new Date(liquidation.deadline_correction), "dd/MM/yyyy", { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Engagement source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Numéro engagement:</span>
              <span className="ml-2 font-medium">{liquidation.engagement?.numero || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Montant engagé:</span>
              <span className="ml-2 font-medium">{formatMontant(liquidation.engagement?.montant || 0)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Objet:</span>
              <span className="ml-2 font-medium">{liquidation.engagement?.objet || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ligne budgétaire:</span>
              <span className="ml-2 font-medium">{liquidation.engagement?.budget_line?.code || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Direction:</span>
              <span className="ml-2 font-medium">
                {liquidation.engagement?.budget_line?.direction?.sigle || 
                 liquidation.engagement?.budget_line?.direction?.label || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fournisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Fournisseur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-muted-foreground">Raison sociale:</span>
              <span className="ml-2 font-medium">
                {liquidation.engagement?.marche?.prestataire?.raison_sociale || 
                 liquidation.engagement?.fournisseur || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Montants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Détail des montants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground text-xs">Montant HT</div>
              <div className="font-bold">{formatMontant(liquidation.montant_ht)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground text-xs">TVA ({liquidation.tva_taux || 0}%)</div>
              <div className="font-bold">{formatMontant(liquidation.tva_montant)}</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <div className="text-muted-foreground text-xs">Montant TTC</div>
              <div className="font-bold text-primary">{formatMontant(liquidation.montant)}</div>
            </div>
            {liquidation.airsi_montant && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-muted-foreground text-xs">AIRSI ({liquidation.airsi_taux || 0}%)</div>
                <div className="font-bold">{formatMontant(liquidation.airsi_montant)}</div>
              </div>
            )}
            {liquidation.retenue_source_montant && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-muted-foreground text-xs">Retenue source ({liquidation.retenue_source_taux || 0}%)</div>
                <div className="font-bold">{formatMontant(liquidation.retenue_source_montant)}</div>
              </div>
            )}
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <div className="text-muted-foreground text-xs">Net à payer</div>
              <div className="font-bold text-success">{formatMontant(liquidation.net_a_payer)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service fait */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Service fait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Certifié:</span>
              {liquidation.service_fait ? (
                <Badge className="bg-success">Oui</Badge>
              ) : (
                <Badge variant="outline">Non</Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-2 font-medium">
                {liquidation.service_fait_date 
                  ? format(new Date(liquidation.service_fait_date), "dd/MM/yyyy", { locale: fr })
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Référence facture:</span>
              <span className="ml-2 font-medium">{liquidation.reference_facture || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Régime fiscal:</span>
              <span className="ml-2 font-medium">{liquidation.regime_fiscal || "N/A"}</span>
            </div>
          </div>
          {liquidation.observation && (
            <div className="mt-4">
              <span className="text-muted-foreground">Observation:</span>
              <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{liquidation.observation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      {liquidation.attachments && liquidation.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Pièces justificatives ({liquidation.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liquidation.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{att.file_name}</div>
                      <div className="text-xs text-muted-foreground">{getDocLabel(att.document_type)}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Circuit de validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {VALIDATION_STEPS.map((step) => {
              const currentStep = liquidation.current_step || 0;
              const isCompleted = liquidation.statut === "valide" || step.order < currentStep;
              const isCurrent = step.order === currentStep && liquidation.statut === "soumis";
              const isRejected = liquidation.statut === "rejete" && step.order === currentStep;

              return (
                <div 
                  key={step.order} 
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrent ? "bg-secondary/10 border border-secondary/30" : 
                    isRejected ? "bg-destructive/10 border border-destructive/30" :
                    isCompleted ? "bg-success/10" : "bg-muted/50"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isRejected ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : isCurrent ? (
                    <AlertCircle className="h-5 w-5 text-secondary" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.role}</div>
                  </div>
                  <Badge variant="outline" className={
                    isCompleted ? "bg-success/10 text-success" :
                    isRejected ? "bg-destructive/10 text-destructive" :
                    isCurrent ? "bg-secondary/10 text-secondary" : ""
                  }>
                    {isCompleted ? "Validé" : 
                     isRejected ? "Rejeté" :
                     isCurrent ? "En cours" : "En attente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
