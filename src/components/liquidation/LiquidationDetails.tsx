import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Liquidation, VALIDATION_STEPS, DOCUMENTS_REQUIS } from "@/hooks/useLiquidations";
import { LiquidationChecklist } from "./LiquidationChecklist";
import { ServiceFaitForm } from "./ServiceFaitForm";
import { ControleSdctForm } from "./ControleSdctForm";
import { ValidationDgForm } from "./ValidationDgForm";
import { DossierGED } from "@/components/ged";
import { DossierTimeline } from "@/components/dossier/DossierTimeline";
import { DossierAuditLog } from "@/components/dossier/DossierAuditLog";
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
  FileCheck,
  FolderOpen,
  ClipboardCheck,
  Shield,
  History,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface LiquidationDetailsProps {
  liquidation: Liquidation;
  onRefresh?: () => void;
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
    en_validation_dg: { label: "En validation DG", className: "bg-primary/10 text-primary border-primary/20" },
  };
  const variant = variants[statut || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

export function LiquidationDetails({ liquidation, onRefresh }: LiquidationDetailsProps) {
  const queryClient = useQueryClient();
  
  const getDocLabel = (code: string) => {
    return DOCUMENTS_REQUIS.find(d => d.code === code)?.label || code;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["liquidations"] });
    onRefresh?.();
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

      {/* === SECTION VALIDATIONS === */}
      <Separator className="my-6" />
      
      {/* Formulaire Service Fait - pour saisie/certification */}
      {liquidation.statut !== "valide" && liquidation.statut !== "rejete" && (
        <ServiceFaitForm
          liquidationId={liquidation.id}
          liquidation={{
            id: liquidation.id,
            numero: liquidation.numero,
            montant: liquidation.montant,
            service_fait: liquidation.service_fait,
            service_fait_date: liquidation.service_fait_date || undefined,
            service_fait_certifie_par: liquidation.service_fait_certifie_par || undefined,
            reference_facture: liquidation.reference_facture || undefined,
            observation: liquidation.observation || undefined,
            statut: liquidation.statut || undefined,
            engagement: liquidation.engagement ? {
              numero: liquidation.engagement.numero,
              objet: liquidation.engagement.objet,
              fournisseur: liquidation.engagement.fournisseur || undefined,
            } : undefined,
          }}
          onSuccess={handleSuccess}
          readOnly={liquidation.statut === "valide"}
        />
      )}

      {/* Contrôle SDCT - affiché si service fait est certifié */}
      {liquidation.service_fait && 
       liquidation.statut !== "valide" && 
       liquidation.statut !== "rejete" &&
       liquidation.statut !== "en_validation_dg" && (
        <ControleSdctForm
          liquidationId={liquidation.id}
          liquidation={{
            id: liquidation.id,
            numero: liquidation.numero,
            montant: liquidation.montant,
            montant_ht: liquidation.montant_ht || undefined,
            net_a_payer: liquidation.net_a_payer || undefined,
            service_fait: liquidation.service_fait,
            current_step: liquidation.current_step || undefined,
            statut: liquidation.statut || undefined,
            engagement: liquidation.engagement ? {
              numero: liquidation.engagement.numero,
              montant: liquidation.engagement.montant,
              budget_line: liquidation.engagement.budget_line ? {
                code: liquidation.engagement.budget_line.code,
                label: liquidation.engagement.budget_line.label,
              } : undefined,
            } : undefined,
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Validation DG - affiché si en attente de validation DG */}
      {liquidation.statut === "en_validation_dg" && (
        <ValidationDgForm
          liquidationId={liquidation.id}
          liquidation={{
            id: liquidation.id,
            numero: liquidation.numero,
            montant: liquidation.montant,
            montant_ht: liquidation.montant_ht || undefined,
            net_a_payer: liquidation.net_a_payer || undefined,
            statut: liquidation.statut || undefined,
            current_step: liquidation.current_step || undefined,
            service_fait: liquidation.service_fait,
            service_fait_date: liquidation.service_fait_date || undefined,
            reference_facture: liquidation.reference_facture || undefined,
            engagement: liquidation.engagement ? {
              numero: liquidation.engagement.numero,
              objet: liquidation.engagement.objet,
              montant: liquidation.engagement.montant,
              fournisseur: liquidation.engagement.fournisseur || undefined,
              budget_line: liquidation.engagement.budget_line ? {
                code: liquidation.engagement.budget_line.code,
                label: liquidation.engagement.budget_line.label,
                direction: liquidation.engagement.budget_line.direction || undefined,
              } : undefined,
            } : undefined,
          }}
          onSuccess={handleSuccess}
        />
      )}

      <Separator className="my-6" />

      {/* GED Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            Gestion documentaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DossierGED
            entityType="liquidation"
            entityId={liquidation.id}
            dossierId={(liquidation as any).dossier_id || undefined}
            reference={liquidation.numero}
            exercice={liquidation.exercice || undefined}
            etape="liquidation"
            showChecklist={true}
            readOnly={liquidation.statut === "valide"}
          />
        </CardContent>
      </Card>

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
              const isCurrent = step.order === currentStep && 
                (liquidation.statut === "soumis" || liquidation.statut === "en_validation_dg");
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

      {/* Timeline & Audit */}
      <Separator className="my-6" />
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="gap-1">
            <History className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <Shield className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-4">
          <DossierTimeline 
            dossierId={(liquidation as any).dossier_id || liquidation.id}
            entityType="liquidation"
            entityId={liquidation.id}
            maxItems={20}
            compact={true}
          />
        </TabsContent>
        
        <TabsContent value="audit" className="mt-4">
          <DossierAuditLog
            entityType="liquidation"
            entityId={liquidation.id}
            title="Journal d'audit - Liquidation"
            maxItems={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
