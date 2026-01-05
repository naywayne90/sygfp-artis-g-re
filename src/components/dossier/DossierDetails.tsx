import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Banknote
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
  note: "Note",
  expression_besoin: "Expression de besoin",
  marche: "Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
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
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(montant);
  };

  const handleDeleteDocument = async (docId: string) => {
    const success = await deleteDocument(docId);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  if (!dossier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-primary">{dossier.numero}</span>
            <Badge variant={dossier.statut_global === "en_cours" ? "default" : "secondary"}>
              {dossier.statut_global === "en_cours" ? "En cours" :
               dossier.statut_global === "termine" ? "Terminé" :
               dossier.statut_global === "annule" ? "Annulé" : "Suspendu"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="resume" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-1">Objet</h4>
                    <p>{dossier.objet}</p>
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
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Estimé</p>
                      <p className="text-lg font-bold">{formatMontant(dossier.montant_estime)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Engagé</p>
                      <p className="text-lg font-bold text-blue-600">{formatMontant(dossier.montant_engage)}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Liquidé</p>
                      <p className="text-lg font-bold text-orange-600">{formatMontant(dossier.montant_liquide)}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Ordonnancé</p>
                      <p className="text-lg font-bold text-green-600">{formatMontant(dossier.montant_ordonnance)}</p>
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
