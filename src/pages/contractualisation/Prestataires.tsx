import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Users,
  Eye,
  FileCheck,
  FileWarning,
  Ban,
  Power,
  Copy,
  CreditCard,
  FileText,
  History,
  User,
  Download
} from "lucide-react";
import { usePrestataires, usePrestaireRequests } from "@/hooks/usePrestataires";
import { useSupplierExpiredDocuments } from "@/hooks/useSupplierDocuments";
import { useSecteursActivite } from "@/hooks/useSecteursActivite";
import { useExercice } from "@/contexts/ExerciceContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Sub-components for the details dialog tabs
import { SupplierIdentityTab } from "@/components/prestataires/SupplierIdentityTab";
import { SupplierBankTab } from "@/components/prestataires/SupplierBankTab";
import { SupplierDocumentsTab } from "@/components/prestataires/SupplierDocumentsTab";

export default function Prestataires() {
  const { exercice } = useExercice();
  const { prestataires, prestatairesActifs, isLoading, stats, suspendSupplier, activateSupplier } = usePrestataires();
  const { stats: requestStats } = usePrestaireRequests();
  const { secteurs } = useSecteursActivite();

  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("actifs");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState<typeof prestataires[0] | null>(null);
  const [detailsTab, setDetailsTab] = useState("identite");
  
  // Suspend dialog
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendMotif, setSuspendMotif] = useState("");

  // Get document stats for expiry alerts
  const { stats: docStats } = useSupplierExpiredDocuments();

  // Filtrer
  const filteredPrestataires = prestataires.filter(p => {
    const matchSearch = 
      p.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.ninea?.toLowerCase().includes(search.toLowerCase());
    
    if (selectedTab === "actifs") {
      return matchSearch && p.statut === "ACTIF";
    } else if (selectedTab === "suspendus") {
      return matchSearch && p.statut === "SUSPENDU";
    } else if (selectedTab === "inactifs") {
      return matchSearch && (p.statut === "INACTIF" || p.statut === "NOUVEAU" || p.statut === "EN_QUALIFICATION");
    }
    return matchSearch;
  });

  // Obtenir le libellé du secteur
  const getSecteurLibelle = (id: string | null) => {
    if (!id) return "-";
    const secteur = secteurs.find(s => s.id === id);
    return secteur ? secteur.libelle : "-";
  };

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case "ACTIF":
        return <Badge className="bg-green-600">Actif</Badge>;
      case "SUSPENDU":
        return <Badge variant="destructive">Suspendu</Badge>;
      case "EN_QUALIFICATION":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">En qualification</Badge>;
      case "NOUVEAU":
        return <Badge variant="outline">Nouveau</Badge>;
      default:
        return <Badge variant="secondary">Inactif</Badge>;
    }
  };

  const handleSuspend = () => {
    if (!selectedPrestataire || !suspendMotif.trim()) return;
    suspendSupplier({ id: selectedPrestataire.id, motif: suspendMotif });
    setShowSuspendDialog(false);
    setSuspendMotif("");
    setShowDetailsDialog(false);
  };

  const handleActivate = () => {
    if (!selectedPrestataire) return;
    activateSupplier(selectedPrestataire.id);
    setShowDetailsDialog(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Prestataires</h1>
        <p className="page-description">
          Répertoire des fournisseurs et prestataires - Exercice {exercice}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prestataires
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Référentiel officiel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actifs}</div>
            <p className="text-xs text-muted-foreground">Qualifiés et validés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Docs. Expirés
            </CardTitle>
            <FileWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{docStats.expired}</div>
            <p className="text-xs text-muted-foreground">Documents à renouveler: {docStats.toRenew}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nouveaux (30j)
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nouveaux}</div>
            <p className="text-xs text-muted-foreground">Ajoutés récemment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspendus
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspendus}</div>
            <p className="text-xs text-muted-foreground">Bloqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, code, email, NINEA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contractualisation/validation-prestataires">
              <FileCheck className="h-4 w-4 mr-2" />
              Panier ({requestStats.enregistre + requestStats.enVerif})
            </Link>
          </Button>
          <Button asChild>
            <Link to="/contractualisation/demande-prestataire">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau prestataire
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="actifs">
                Actifs ({stats.actifs})
              </TabsTrigger>
              <TabsTrigger value="suspendus">
                Suspendus ({stats.suspendus})
              </TabsTrigger>
              <TabsTrigger value="inactifs">
                Autres ({stats.inactifs})
              </TabsTrigger>
              <TabsTrigger value="all">
                Tous ({stats.total})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Raison sociale</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>NINEA</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredPrestataires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun prestataire</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrestataires.map((prestataire) => (
                    <TableRow key={prestataire.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">{prestataire.code}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(prestataire.code, "Code")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{prestataire.raison_sociale}</p>
                          {prestataire.sigle && (
                            <p className="text-xs text-muted-foreground">{prestataire.sigle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {prestataire.email && <div>{prestataire.email}</div>}
                          {prestataire.telephone && <div className="text-muted-foreground">{prestataire.telephone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getSecteurLibelle(prestataire.secteur_principal_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{prestataire.ninea || "-"}</TableCell>
                      <TableCell>{getStatusBadge(prestataire.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPrestataire(prestataire);
                            setDetailsTab("identite");
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Tabs>
      </Card>

      {/* Dialog Détails avec onglets */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Fiche Prestataire</span>
              {selectedPrestataire && getStatusBadge(selectedPrestataire.statut)}
            </DialogTitle>
            {selectedPrestataire && (
              <DialogDescription className="flex items-center gap-2">
                <span className="font-mono">{selectedPrestataire.code}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(selectedPrestataire.code, "Code")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedPrestataire && (
            <Tabs value={detailsTab} onValueChange={setDetailsTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="identite">
                  <User className="h-4 w-4 mr-2" />
                  Identité
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Users className="h-4 w-4 mr-2" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="banque">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Banque
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="historique">
                  <History className="h-4 w-4 mr-2" />
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="identite" className="mt-4">
                <SupplierIdentityTab 
                  prestataire={selectedPrestataire} 
                  getSecteurLibelle={getSecteurLibelle}
                />
              </TabsContent>

              <TabsContent value="contact" className="mt-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Contact principal</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom</p>
                        <p>{selectedPrestataire.contact_nom || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fonction</p>
                        <p>{selectedPrestataire.contact_fonction || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p>{selectedPrestataire.contact_telephone || selectedPrestataire.telephone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{selectedPrestataire.contact_email || selectedPrestataire.email || "-"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Adresse</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Adresse</p>
                        <p>{selectedPrestataire.adresse || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p>{selectedPrestataire.ville || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="banque" className="mt-4">
                <SupplierBankTab supplierId={selectedPrestataire.id} />
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <SupplierDocumentsTab supplierId={selectedPrestataire.id} />
              </TabsContent>

              <TabsContent value="historique" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Historique des engagements et paiements à venir</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-6">
            {selectedPrestataire?.statut === "ACTIF" && (
              <Button
                variant="destructive"
                onClick={() => setShowSuspendDialog(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspendre
              </Button>
            )}
            {selectedPrestataire?.statut === "SUSPENDU" && (
              <Button
                variant="default"
                onClick={handleActivate}
              >
                <Power className="h-4 w-4 mr-2" />
                Réactiver
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suspension */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre le prestataire</DialogTitle>
            <DialogDescription>
              Cette action bloquera la sélection de ce prestataire dans les marchés et engagements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Motif de suspension *</Label>
              <Textarea
                value={suspendMotif}
                onChange={(e) => setSuspendMotif(e.target.value)}
                placeholder="Indiquez le motif de la suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendMotif.trim()}
            >
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
