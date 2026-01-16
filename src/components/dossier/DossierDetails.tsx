import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Download,
  Trash2,
  Building2,
  User,
  Calendar,
  Banknote,
  ArrowRight,
  Wallet,
  FileSignature,
  Receipt,
  ShoppingCart,
  FileCheck,
  PartyPopper
} from "lucide-react";
import { Dossier, DossierEtape, DossierDocument, useDossiers } from "@/hooks/useDossiers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierDetailsProps {
  dossier: Dossier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ETAPE_LABELS: Record<string, string> = {
  note_sef: "Note SEF",
  note_aef: "Note AEF",
  imputation: "Imputation",
  expression_besoin: "Expression de besoin",
  passation_marche: "Passation marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
};

const ETAPE_ICONS: Record<string, React.ReactNode> = {
  note_sef: <FileText className="h-4 w-4" />,
  note_aef: <FileCheck className="h-4 w-4" />,
  imputation: <Receipt className="h-4 w-4" />,
  expression_besoin: <ShoppingCart className="h-4 w-4" />,
  passation_marche: <Building2 className="h-4 w-4" />,
  engagement: <FileSignature className="h-4 w-4" />,
  liquidation: <Receipt className="h-4 w-4" />,
  ordonnancement: <FileCheck className="h-4 w-4" />,
  reglement: <Wallet className="h-4 w-4" />,
};

const CATEGORIE_LABELS: Record<string, string> = {
  proforma: "Facture proforma",
  bon_commande: "Bon de commande",
  contrat: "Contrat",
  pv_reception: "PV de réception",
  facture: "Facture",
  attestation: "Attestation",
  autre: "Autre",
};

const STATUT_ICONS: Record<string, React.ReactNode> = {
  en_attente: <Clock className="h-4 w-4 text-yellow-500" />,
  valide: <CheckCircle className="h-4 w-4 text-green-500" />,
  rejete: <XCircle className="h-4 w-4 text-red-500" />,
  en_cours: <AlertCircle className="h-4 w-4 text-blue-500" />,
};

const WORKFLOW_STEPS = [
  { key: "note_sef", label: "SEF" },
  { key: "note_aef", label: "AEF" },
  { key: "imputation", label: "Imputation" },
  { key: "expression_besoin", label: "EB" },
  { key: "passation_marche", label: "PM" },
  { key: "engagement", label: "Engagement" },
  { key: "liquidation", label: "Liquidation" },
  { key: "ordonnancement", label: "Ordo." },
  { key: "reglement", label: "Règlement" },
];

export function DossierDetails({ dossier, open, onOpenChange }: DossierDetailsProps) {
  const [etapes, setEtapes] = useState<DossierEtape[]>([]);
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { getDossierEtapes, getDossierDocuments, deleteDocument } = useDossiers();

  useEffect(() => {
    if (dossier && open) {
      loadData();
    }
  }, [dossier, open]);

  const loadData = async () => {
    if (!dossier) return;
    setLoading(true);
    try {
      const [etapesData, docsData] = await Promise.all([
        getDossierEtapes(dossier.id),
        getDossierDocuments(dossier.id),
      ]);
      setEtapes(etapesData);
      setDocuments(docsData);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const handleDeleteDocument = async (docId: string) => {
    const success = await deleteDocument(docId);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  if (!dossier) return null;

  // Déterminer le statut de clôture
  const isCloture = dossier.statut_global === "cloture" || dossier.statut_paiement === "solde";
  const montantPaye = dossier.montant_paye || 0;
  const montantEngage = dossier.montant_engage || 0;
  const progressPaiement = montantEngage > 0 ? (montantPaye / montantEngage) * 100 : 0;
  
  // Trouver l'index de l'étape courante
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === dossier.etape_courante);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-primary text-xl">{dossier.numero}</span>
            {isCloture ? (
              <Badge className="bg-success text-success-foreground gap-1">
                <PartyPopper className="h-3 w-3" />
                Clôturé
              </Badge>
            ) : (
              <Badge variant={dossier.statut_global === "en_cours" ? "default" : "secondary"}>
                {dossier.statut_global === "en_cours" ? "En cours" :
                 dossier.statut_global === "termine" ? "Terminé" :
                 dossier.statut_global === "annule" ? "Annulé" : "Suspendu"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="chaine">Chaîne dépense</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[550px] mt-4">
            <TabsContent value="resume" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-1">Objet</h4>
                    <p className="text-lg">{dossier.objet}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Direction</p>
                        <p className="font-medium">
                          {dossier.direction?.sigle || dossier.direction?.label || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Demandeur</p>
                        <p className="font-medium">
                          {dossier.demandeur?.full_name || dossier.demandeur?.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de création</p>
                        <p className="font-medium">
                          {format(new Date(dossier.created_at), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Étape actuelle</p>
                        <p className="font-medium">
                          {ETAPE_LABELS[dossier.etape_courante] || dossier.etape_courante}
                        </p>
                      </div>
                    </div>

                    {dossier.date_cloture && (
                      <div className="flex items-center gap-2 col-span-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-sm text-muted-foreground">Date de clôture</p>
                          <p className="font-medium text-success">
                            {format(new Date(dossier.date_cloture), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Suivi financier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Estimé</p>
                      <p className="text-sm font-bold">{formatMontant(dossier.montant_estime)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-blue-600">Engagé</p>
                      <p className="text-sm font-bold text-blue-600">{formatMontant(dossier.montant_engage)}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <p className="text-xs text-orange-600">Liquidé</p>
                      <p className="text-sm font-bold text-orange-600">{formatMontant(dossier.montant_liquide)}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-xs text-purple-600">Ordonnancé</p>
                      <p className="text-sm font-bold text-purple-600">{formatMontant(dossier.montant_ordonnance || 0)}</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg border ${isCloture ? 'bg-success/10 border-success/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <p className={`text-xs ${isCloture ? 'text-success' : 'text-emerald-600'}`}>Payé</p>
                      <p className={`text-sm font-bold ${isCloture ? 'text-success' : 'text-emerald-600'}`}>{formatMontant(montantPaye)}</p>
                    </div>
                  </div>

                  {/* Barre de progression du paiement */}
                  <div className="pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progression du paiement</span>
                      <span className="text-sm font-medium">{progressPaiement.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPaiement} className="h-3" />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Payé: {formatMontant(montantPaye)}</span>
                      <span>Engagé: {formatMontant(montantEngage)}</span>
                    </div>
                  </div>

                  {isCloture && (
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <PartyPopper className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Dossier soldé et clôturé</p>
                        <p className="text-xs text-success/80">
                          Paiement intégral effectué - chaîne de dépense terminée
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chaine" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progression dans la chaîne de dépense</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Workflow visuel */}
                  <div className="flex items-center justify-between overflow-x-auto pb-4">
                    {WORKFLOW_STEPS.map((step, index) => {
                      const isPast = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const isFuture = index > currentStepIndex;
                      const isComplete = isCloture && index <= currentStepIndex;
                      
                      return (
                        <div key={step.key} className="flex items-center">
                          <div className={`flex flex-col items-center min-w-[70px] ${isFuture ? 'opacity-40' : ''}`}>
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center mb-2
                              ${isComplete ? 'bg-success text-success-foreground' : 
                                isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                                isPast ? 'bg-primary/80 text-primary-foreground' : 
                                'bg-muted text-muted-foreground'}
                            `}>
                              {isComplete ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                ETAPE_ICONS[step.key] || <FileText className="h-4 w-4" />
                              )}
                            </div>
                            <span className={`text-xs text-center font-medium ${isCurrent ? 'text-primary' : ''}`}>
                              {step.label}
                            </span>
                          </div>
                          {index < WORKFLOW_STEPS.length - 1 && (
                            <ArrowRight className={`h-4 w-4 mx-1 flex-shrink-0 ${isPast || isCurrent ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  {/* Détails par étape */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Détails des montants par étape</h4>
                    <div className="grid gap-2">
                      {[
                        { label: "Montant estimé (EB/PM)", value: dossier.montant_estime, color: "text-muted-foreground" },
                        { label: "Montant engagé", value: dossier.montant_engage, color: "text-blue-600" },
                        { label: "Montant liquidé", value: dossier.montant_liquide, color: "text-orange-600" },
                        { label: "Montant ordonnancé", value: dossier.montant_ordonnance || 0, color: "text-purple-600" },
                        { label: "Montant payé", value: montantPaye, color: isCloture ? "text-success" : "text-emerald-600" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                          <span className="text-sm">{item.label}</span>
                          <span className={`font-mono font-medium ${item.color}`}>
                            {formatMontant(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : etapes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune étape enregistrée
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {etapes.map((etape, index) => (
                    <div key={etape.id} className="relative pl-10 pb-6">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        {STATUT_ICONS[etape.statut] || <Clock className="h-3 w-3" />}
                      </div>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {ETAPE_LABELS[etape.type_etape] || etape.type_etape}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(etape.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {etape.montant > 0 && (
                            <p className="font-medium">{formatMontant(etape.montant)}</p>
                          )}
                          {etape.commentaire && (
                            <p className="text-sm text-muted-foreground mt-1">{etape.commentaire}</p>
                          )}
                          {etape.creator?.full_name && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Par {etape.creator.full_name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Documents joints</h3>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <Separator />

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun document joint
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIE_LABELS[doc.categorie] || doc.categorie}
                            </Badge>
                            <span>•</span>
                            <span>
                              {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr })}
                            </span>
                            {doc.file_size && (
                              <>
                                <span>•</span>
                                <span>{(doc.file_size / 1024).toFixed(1)} Ko</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
