import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  FileText,
  Building2,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileSignature,
  History,
  FolderOpen,
  Shield,
  QrCode,
  Lock,
  GitBranch,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useOrdonnancements, VALIDATION_STEPS, MODES_PAIEMENT } from "@/hooks/useOrdonnancements";
import { OrdonnancementSignatures } from "./OrdonnancementSignatures";
import { ParapheurIntern } from "./ParapheurIntern";
import { OrdonnancementTimeline } from "./OrdonnancementTimeline";
import { ChaineDepenseTimeline } from "@/components/workflow/ChaineDepenseTimeline";
import { DossierGED } from "@/components/ged";
import { DossierStepTimeline } from "@/components/shared/DossierStepTimeline";

interface OrdonnancementDetailsProps {
  ordonnancement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumis: { label: "Soumis", className: "bg-secondary/10 text-secondary border-secondary/20" },
    en_validation: { label: "En validation", className: "bg-warning/10 text-warning border-warning/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    en_signature: { label: "En signature", className: "bg-blue-100 text-blue-700 border-blue-200" },
    ordonnance: { label: "ORDONNANCÉ", className: "bg-green-600 text-white border-green-700 font-bold" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 border-orange-200" },
    transmis: { label: "Transmis", className: "bg-primary/10 text-primary border-primary/20" },
  };
  const variant = variants[status] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getValidationStatusIcon = (status: string) => {
  switch (status) {
    case "validated":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "pending":
      return <Clock className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function OrdonnancementDetails({
  ordonnancement,
  open,
  onOpenChange,
}: OrdonnancementDetailsProps) {
  const { getValidations } = useOrdonnancements();
  const [validations, setValidations] = useState<any[]>([]);

  useEffect(() => {
    if (open && ordonnancement?.id) {
      getValidations(ordonnancement.id).then(setValidations);
    }
  }, [open, ordonnancement?.id]);

  const engagement = ordonnancement?.liquidation?.engagement;
  const liquidation = ordonnancement?.liquidation;
  const modePaiementLabel = MODES_PAIEMENT.find(
    (m) => m.value === ordonnancement?.mode_paiement
  )?.label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Détails du mandat
          </DialogTitle>
        </DialogHeader>

        {/* Dossier step timeline for expense chain visualization */}
        <DossierStepTimeline
          currentStep="ordonnancement"
          engagementId={engagement?.id}
          liquidationId={liquidation?.id}
          ordonnancementId={ordonnancement?.id}
          engagementStatus={engagement ? "valide" : undefined}
          liquidationStatus={liquidation ? "valide" : undefined}
          ordonnancementStatus={ordonnancement?.statut}
          reglementStatus={ordonnancement?.montant_paye > 0 ? "en_cours" : undefined}
          compact
        />

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="parapheur" className="gap-2">
              <FileSignature className="h-4 w-4" />
              Parapheur
            </TabsTrigger>
            <TabsTrigger value="signatures" className="gap-2">
              <User className="h-4 w-4" />
              Validations
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4 pt-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{ordonnancement?.numero || "—"}</h3>
                    <p className="text-muted-foreground">{ordonnancement?.objet}</p>
                  </div>
                  {getStatusBadge(ordonnancement?.statut || ordonnancement?.workflow_status)}
                </div>

                {/* Statut ORDONNANCÉ avec signature */}
                {ordonnancement?.statut === "ordonnance" && (
                  <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-green-700 text-lg">ORDONNANCÉ</p>
                            <Lock className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Cet ordonnancement a été validé et signé. Les étapes précédentes sont verrouillées.
                          </p>
                          {ordonnancement.date_ordonnancement && (
                            <p className="text-sm">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Date d'ordonnancement: {format(new Date(ordonnancement.date_ordonnancement), "dd MMMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          )}
                          {ordonnancement.signature_hash && (
                            <div className="mt-3 p-3 bg-white dark:bg-background rounded border">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Empreinte de signature</span>
                              </div>
                              <p className="font-mono text-xs break-all">{ordonnancement.signature_hash}</p>
                            </div>
                          )}
                          {ordonnancement.qr_code_data && (
                            <div className="mt-3 p-3 bg-white dark:bg-background rounded border">
                              <div className="flex items-center gap-2 mb-2">
                                <QrCode className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Données QR de vérification</span>
                              </div>
                              <p className="font-mono text-xs break-all overflow-x-auto">{ordonnancement.qr_code_data}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alerte si rejeté ou différé */}
                {ordonnancement?.statut === "rejete" && ordonnancement?.rejection_reason && (
                  <Card className="border-destructive">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Motif du rejet</p>
                          <p className="text-sm text-muted-foreground">
                            {ordonnancement.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {ordonnancement?.statut === "differe" && ordonnancement?.motif_differe && (
                  <Card className="border-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-600">Motif du report</p>
                          <p className="text-sm text-muted-foreground">
                            {ordonnancement.motif_differe}
                          </p>
                          {ordonnancement.deadline_correction && (
                            <p className="text-sm mt-1">
                              Date de reprise prévue:{" "}
                              {format(new Date(ordonnancement.deadline_correction), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations bénéficiaire */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Informations du bénéficiaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bénéficiaire:</span>
                        <p className="font-medium">{ordonnancement?.beneficiaire}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mode de paiement:</span>
                        <p className="font-medium">{modePaiementLabel}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Banque:</span>
                        <p className="font-medium">{ordonnancement?.banque || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">RIB/Compte:</span>
                        <p className="font-medium">{ordonnancement?.rib || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Montants et dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Montant et échéances
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Montant ordonnancé:</span>
                        <p className="font-bold text-lg text-primary">
                          {formatMontant(ordonnancement?.montant || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date prévue de paiement:</span>
                        <p className="font-medium">
                          {ordonnancement?.date_prevue_paiement
                            ? format(new Date(ordonnancement.date_prevue_paiement), "dd MMMM yyyy", { locale: fr })
                            : "—"}
                        </p>
                      </div>
                      {ordonnancement?.observation && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Observation:</span>
                          <p className="font-medium">{ordonnancement.observation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Références */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Références
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">N° Liquidation:</span>
                        <p className="font-medium">{liquidation?.numero || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">N° Engagement:</span>
                        <p className="font-medium">{engagement?.numero || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Imputation budgétaire:</span>
                        <p className="font-medium">
                          {engagement?.budget_line?.code} - {engagement?.budget_line?.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow de validation */}
                {validations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Circuit de validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validations.map((validation, index) => {
                          const stepInfo = VALIDATION_STEPS.find(
                            (s) => s.order === validation.step_order
                          );
                          return (
                            <div
                              key={validation.id}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                                {getValidationStatusIcon(validation.status)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{stepInfo?.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {validation.status === "validated" && validation.validated_at
                                    ? `Validé le ${format(new Date(validation.validated_at), "dd/MM/yyyy à HH:mm", { locale: fr })}`
                                    : validation.status === "pending"
                                    ? "En attente de validation"
                                    : "En attente"}
                                </p>
                                {validation.comments && (
                                  <p className="text-xs mt-1 italic">"{validation.comments}"</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {validation.role}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations de création */}
                <div className="text-xs text-muted-foreground">
                  <p>
                    Créé le{" "}
                    {ordonnancement?.created_at
                      ? format(new Date(ordonnancement.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })
                      : "—"}
                    {ordonnancement?.created_by_profile?.full_name && (
                      <> par {ordonnancement.created_by_profile.full_name}</>
                    )}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents">
            <div className="pt-4">
              <DossierGED
                entityType="ordonnancement"
                entityId={ordonnancement?.id}
                dossierId={ordonnancement?.dossier_id || undefined}
                reference={ordonnancement?.numero || ""}
                exercice={ordonnancement?.exercice || undefined}
                etape="ordonnancement"
                showChecklist={true}
                readOnly={ordonnancement?.statut === "valide" || ordonnancement?.statut === "transmis" || ordonnancement?.statut === "ordonnance"}
              />
            </div>
          </TabsContent>

          <TabsContent value="parapheur">
            <div className="pt-4">
              <ParapheurIntern
                ordonnancementId={ordonnancement?.id}
                ordonnancementNumero={ordonnancement?.numero || ""}
                canSign={ordonnancement?.statut === "en_signature"}
              />
            </div>
          </TabsContent>

          <TabsContent value="signatures">
            <div className="pt-4">
              <OrdonnancementSignatures
                ordonnancementId={ordonnancement?.id}
                ordonnancementStatut={ordonnancement?.statut}
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="pt-4 space-y-4">
              {/* Workflow interne ordonnancement */}
              <OrdonnancementTimeline ordonnancement={ordonnancement} />

              {/* Chaîne de dépense globale */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Chaîne de dépense
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChaineDepenseTimeline
                    engagement={engagement ? { id: engagement.id, numero: engagement.numero, statut: "valide" } : null}
                    liquidation={liquidation ? { id: liquidation.id, numero: liquidation.numero, statut: "valide" } : null}
                    ordonnancement={ordonnancement ? {
                      id: ordonnancement.id,
                      numero: ordonnancement.numero,
                      statut: ordonnancement.statut,
                      montant: ordonnancement.montant
                    } : null}
                    reglement={ordonnancement?.montant_paye > 0 ? {
                      id: "paid",
                      numero: null,
                      statut: "valide",
                      montant: ordonnancement.montant_paye
                    } : null}
                    currentEtape="ordonnancement"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
