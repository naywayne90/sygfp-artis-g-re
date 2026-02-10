import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Upload, 
  Users, 
  ClipboardCheck
} from "lucide-react";
import { usePrestaireRequests } from "@/hooks/usePrestataires";
import { useSecteursActivite } from "@/hooks/useSecteursActivite";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ValidationPrestataires() {
  const { 
    requests, 
    _pendingRequests, 
    isLoading, 
    stats,
    setEnVerification,
    validateRequest,
    refuseRequest,
    validateBulk,
    importCSV,
  } = usePrestaireRequests();
  
  const { secteurs } = useSecteursActivite();

  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [refuseRequestId, setRefuseRequestId] = useState<string | null>(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<typeof requests[0] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Filtrer les demandes
  const filteredRequests = requests.filter(r => {
    const matchSearch = 
      r.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.telephone?.includes(search);
    
    if (selectedTab === "pending") {
      return matchSearch && (r.statut === "ENREGISTRE" || r.statut === "EN_VERIF");
    } else if (selectedTab === "validated") {
      return matchSearch && r.statut === "VALIDE";
    } else if (selectedTab === "refused") {
      return matchSearch && r.statut === "REFUSE";
    }
    return matchSearch;
  });

  // Obtenir le libellé du secteur
  const getSecteurLibelle = (id: string | null) => {
    if (!id) return "-";
    const secteur = secteurs.find(s => s.id === id);
    return secteur ? secteur.libelle : "-";
  };

  // Statut badge
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "ENREGISTRE":
        return <Badge variant="outline" className="bg-blue-50"><Clock className="h-3 w-3 mr-1" />Enregistré</Badge>;
      case "EN_VERIF":
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />En vérification</Badge>;
      case "VALIDE":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Validé</Badge>;
      case "REFUSE":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  // Gérer la sélection
  const toggleSelect = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredRequests
      .filter(r => r.statut === "ENREGISTRE" || r.statut === "EN_VERIF")
      .map(r => r.id);
    
    if (selectedRequests.length === pendingIds.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingIds);
    }
  };

  // Valider en masse
  const handleBulkValidate = async () => {
    if (selectedRequests.length === 0) return;
    await validateBulk.mutateAsync(selectedRequests);
    setSelectedRequests([]);
  };

  // Refuser
  const handleRefuse = async () => {
    if (!refuseRequestId || !refuseComment.trim()) {
      toast.error("Le commentaire est obligatoire");
      return;
    }
    await refuseRequest.mutateAsync({ requestId: refuseRequestId, commentaire: refuseComment });
    setShowRefuseDialog(false);
    setRefuseComment("");
    setRefuseRequestId(null);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      
      // Parse header
      const header = lines[0].split(";").map(h => h.trim().toLowerCase());
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(";").map(v => v?.trim());
        const row: Record<string, string> = {};
        header.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return {
          raison_sociale: row.raison_sociale || row.nom || "",
          email: row.email || "",
          telephone: row.telephone || row.tel || "",
          adresse: row.adresse || "",
          ninea: row.ninea || "",
          rccm: row.rccm || "",
          code_comptable: row.code_comptable || "",
        };
      }).filter(r => r.raison_sociale);

      if (rows.length === 0) {
        toast.error("Aucune donnée valide trouvée");
        return;
      }

      await importCSV.mutateAsync(rows);
      setShowImportDialog(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Validation des Prestataires</h1>
        <p className="page-description">
          Panier de validation - Services Généraux
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Demandes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enregistrées</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enregistre}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Vérification</CardTitle>
            <Eye className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enVerif}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.valide}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.refuse}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {selectedRequests.length > 0 && (
            <Button onClick={handleBulkValidate} disabled={validateBulk.isPending}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Valider ({selectedRequests.length})
            </Button>
          )}
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des prestataires</DialogTitle>
                <DialogDescription>
                  Format CSV : raison_sociale;email;telephone;adresse;ninea;rccm;code_comptable
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="file" accept=".csv" onChange={handleImportCSV} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs & Table */}
      <Card>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="pending">
                En attente ({stats.enregistre + stats.enVerif})
              </TabsTrigger>
              <TabsTrigger value="validated">
                Validées ({stats.valide})
              </TabsTrigger>
              <TabsTrigger value="refused">
                Refusées ({stats.refuse})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedTab === "pending" && (
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedRequests.length > 0 && selectedRequests.length === filteredRequests.filter(r => r.statut === "ENREGISTRE" || r.statut === "EN_VERIF").length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Raison sociale</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune demande
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      {selectedTab === "pending" && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedRequests.includes(request.id)}
                            onCheckedChange={() => toggleSelect(request.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{request.raison_sociale}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.email && <div>{request.email}</div>}
                          {request.telephone && <div className="text-muted-foreground">{request.telephone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getSecteurLibelle(request.secteur_principal_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.submitted_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{getStatutBadge(request.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {request.statut === "ENREGISTRE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEnVerification.mutate(request.id)}
                            >
                              Vérifier
                            </Button>
                          )}
                          
                          {(request.statut === "ENREGISTRE" || request.statut === "EN_VERIF") && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => validateRequest.mutate(request.id)}
                                disabled={validateRequest.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setRefuseRequestId(request.id);
                                  setShowRefuseDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Tabs>
      </Card>

      {/* Dialog Refus */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du refus
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={refuseComment}
              onChange={(e) => setRefuseComment(e.target.value)}
              placeholder="Motif du refus (obligatoire)..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefuseDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRefuse} disabled={refuseRequest.isPending}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Raison sociale</p>
                  <p className="font-medium">{selectedRequest.raison_sociale}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatutBadge(selectedRequest.statut)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedRequest.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p>{selectedRequest.telephone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p>{selectedRequest.adresse || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NINEA</p>
                  <p>{selectedRequest.ninea || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RCCM</p>
                  <p>{selectedRequest.rccm || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code comptable</p>
                  <p>{selectedRequest.code_comptable || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge variant="outline">{selectedRequest.source}</Badge>
                </div>
              </div>
              
              {selectedRequest.rib_banque && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Informations bancaires</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Banque</p>
                      <p>{selectedRequest.rib_banque}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">N° Compte</p>
                      <p>{selectedRequest.rib_numero || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clé</p>
                      <p>{selectedRequest.rib_cle || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.commentaire_controle && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2 text-destructive">Motif du refus</p>
                  <p className="text-sm bg-destructive/10 p-3 rounded">
                    {selectedRequest.commentaire_controle}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
