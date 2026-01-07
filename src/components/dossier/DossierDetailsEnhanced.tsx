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
  Plus,
  ExternalLink,
  History,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Dossier, DossierEtape, DossierDocument, useDossiers } from "@/hooks/useDossiers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface DossierDetailsEnhancedProps {
  dossier: Dossier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStep?: (type: string, dossierId: string) => void;
  onBlock?: (dossierId: string) => void;
  onUnblock?: (dossierId: string) => void;
}

const ETAPE_LABELS: Record<string, string> = {
  note: "Note",
  expression_besoin: "Expression de besoin",
  marche: "Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
};

const STATUT_COLORS: Record<string, string> = {
  en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  termine: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  annule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  suspendu: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  bloque: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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

export function DossierDetailsEnhanced({ 
  dossier, 
  open, 
  onOpenChange,
  onCreateStep,
  onBlock,
  onUnblock 
}: DossierDetailsEnhancedProps) {
  const [activeTab, setActiveTab] = useState("resume");
  const [etapes, setEtapes] = useState<DossierEtape[]>([]);
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getDossierEtapes, getDossierDocuments, deleteDocument } = useDossiers();
  const navigate = useNavigate();

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
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(montant);
  };

  const getProgressPercent = () => {
    if (!dossier || !dossier.montant_estime || dossier.montant_estime === 0) return 0;
    return Math.min(100, (dossier.montant_ordonnance / dossier.montant_estime) * 100);
  };

  const getNextStep = () => {
    const stepOrder = ["note", "engagement", "liquidation", "ordonnancement", "reglement"];
    const currentIndex = stepOrder.indexOf(dossier?.etape_courante || "note");
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return null;
  };

  const handleCreateNextStep = () => {
    const nextStep = getNextStep();
    if (nextStep && dossier && onCreateStep) {
      onCreateStep(nextStep, dossier.id);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const success = await deleteDocument(docId);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  if (!dossier) return null;

  const isBlocked = dossier.statut_global === "bloque";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl text-primary font-bold">{dossier.numero}</span>
              <Badge className={STATUT_COLORS[dossier.statut_global] || ""}>
                {isBlocked && <Lock className="h-3 w-3 mr-1" />}
                {dossier.statut_global === "en_cours" ? "En cours" :
                 dossier.statut_global === "termine" ? "Terminé" :
                 dossier.statut_global === "annule" ? "Annulé" :
                 dossier.statut_global === "bloque" ? "Bloqué" : "Suspendu"}
              </Badge>
              {dossier.type_dossier && (
                <Badge variant="outline">{dossier.type_dossier}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {isBlocked && onUnblock && (
                <Button variant="outline" size="sm" onClick={() => onUnblock(dossier.id)}>
                  <Unlock className="h-4 w-4 mr-1" />
                  Débloquer
                </Button>
              )}
              {!isBlocked && getNextStep() && (
                <Button size="sm" onClick={handleCreateNextStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Créer {ETAPE_LABELS[getNextStep()!]}
                </Button>
              )}
            </div>
          </div>
          <DialogTitle className="text-lg font-normal text-muted-foreground line-clamp-1 mt-1">
            {dossier.objet}
          </DialogTitle>
        </DialogHeader>

        {/* Alerte si bloqué */}
        {isBlocked && (dossier as any).motif_blocage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Dossier bloqué</p>
              <p className="text-sm text-muted-foreground">{(dossier as any).motif_blocage}</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="chaine">Chaîne dépense</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            {/* ONGLET RÉSUMÉ */}
            <TabsContent value="resume" className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Estimé</p>
                    <p className="text-lg font-bold">{formatMontant(dossier.montant_estime)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/30">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Engagé</p>
                    <p className="text-lg font-bold text-blue-600">{formatMontant(dossier.montant_engage)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950/30">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Liquidé</p>
                    <p className="text-lg font-bold text-orange-600">{formatMontant(dossier.montant_liquide)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ordonnancé</p>
                    <p className="text-lg font-bold text-green-600">{formatMontant(dossier.montant_ordonnance)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Progression */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progression de l'exécution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taux d'exécution</span>
                      <span className="font-medium">{getProgressPercent().toFixed(1)}%</span>
                    </div>
                    <Progress value={getProgressPercent()} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Direction</p>
                      <p className="font-medium">{dossier.direction?.sigle || dossier.direction?.label || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Demandeur</p>
                      <p className="font-medium">{dossier.demandeur?.full_name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Création</p>
                      <p className="font-medium">{format(new Date(dossier.created_at), "dd/MM/yyyy", { locale: fr })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Étape actuelle</p>
                      <p className="font-medium">{ETAPE_LABELS[dossier.etape_courante] || dossier.etape_courante}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline des étapes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Dernières activités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : etapes.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Aucune activité</p>
                  ) : (
                    <div className="space-y-3">
                      {etapes.slice(-5).reverse().map((etape) => (
                        <div key={etape.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            etape.statut === 'valide' ? 'bg-green-500' :
                            etape.statut === 'rejete' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <Badge variant="outline" className="text-xs">
                            {ETAPE_LABELS[etape.type_etape]}
                          </Badge>
                          <span className="text-muted-foreground">
                            {format(new Date(etape.created_at), "dd/MM HH:mm", { locale: fr })}
                          </span>
                          {etape.montant > 0 && (
                            <span className="font-medium ml-auto">{formatMontant(etape.montant)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET CHAÎNE DE LA DÉPENSE */}
            <TabsContent value="chaine" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Chaîne de la dépense</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : etapes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune étape enregistrée</p>
                  ) : (
                    <div className="space-y-3">
                      {etapes.map((etape) => (
                        <div key={etape.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${
                            etape.statut === 'valide' ? 'bg-green-500' :
                            etape.statut === 'rejete' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <Badge variant="outline">{ETAPE_LABELS[etape.type_etape]}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(etape.created_at), "dd/MM/yyyy", { locale: fr })}
                          </span>
                          {etape.montant > 0 && (
                            <span className="ml-auto font-medium">{formatMontant(etape.montant)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET BUDGET */}
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Imputation budgétaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(dossier as any).code_budgetaire ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-mono text-sm">{(dossier as any).code_budgetaire}</p>
                          <p className="text-xs text-muted-foreground">Ligne budgétaire</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dotation</p>
                          <p className="font-medium text-lg">-</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Consommé</p>
                          <p className="font-medium text-lg text-orange-600">{formatMontant(dossier.montant_engage)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Disponible</p>
                          <p className="font-medium text-lg text-green-600">-</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune imputation budgétaire définie</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Plus className="h-4 w-4 mr-1" />
                        Affecter une ligne budgétaire
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET DOCUMENTS */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Pièces jointes</h3>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun document joint</p>
                  <p className="text-sm mt-1">Glissez-déposez des fichiers ici</p>
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIE_LABELS[doc.categorie] || doc.categorie}
                            </Badge>
                            <span>•</span>
                            <span>{format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr })}</span>
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

            {/* ONGLET JOURNAL */}
            <TabsContent value="journal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Journal d'audit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {etapes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune entrée dans le journal</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                      {etapes.map((etape) => (
                        <div key={etape.id} className="relative pl-8 pb-4">
                          <div className="absolute left-0 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                            {etape.statut === 'valide' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : etape.statut === 'rejete' ? (
                              <XCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {ETAPE_LABELS[etape.type_etape]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(etape.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </span>
                            </div>
                            {etape.montant > 0 && (
                              <p className="text-sm font-medium">{formatMontant(etape.montant)}</p>
                            )}
                            {etape.commentaire && (
                              <p className="text-sm text-muted-foreground mt-1">{etape.commentaire}</p>
                            )}
                            {etape.creator?.full_name && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Par {etape.creator.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions rapides en bas */}
        <Separator />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
          <div className="flex gap-2">
            {!isBlocked && onBlock && dossier.statut_global === 'en_cours' && (
              <Button variant="outline" size="sm" onClick={() => onBlock(dossier.id)}>
                <Lock className="h-4 w-4 mr-1" />
                Bloquer
              </Button>
            )}
            {getNextStep() && !isBlocked && (
              <Button size="sm" onClick={handleCreateNextStep}>
                Créer {ETAPE_LABELS[getNextStep()!]}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
