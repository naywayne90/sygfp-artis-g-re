import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Users,
  Eye,
  FileCheck
} from "lucide-react";
import { usePrestataires, usePrestaireRequests } from "@/hooks/usePrestataires";
import { useSecteursActivite } from "@/hooks/useSecteursActivite";
import { useExercice } from "@/contexts/ExerciceContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function Prestataires() {
  const { exercice } = useExercice();
  const { prestataires, prestatairesActifs, isLoading, stats } = usePrestataires();
  const { stats: requestStats } = usePrestaireRequests();
  const { secteurs } = useSecteursActivite();

  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("actifs");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState<typeof prestataires[0] | null>(null);

  // Filtrer
  const filteredPrestataires = prestataires.filter(p => {
    const matchSearch = 
      p.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    
    if (selectedTab === "actifs") {
      return matchSearch && p.statut === "ACTIF";
    } else if (selectedTab === "inactifs") {
      return matchSearch && p.statut !== "ACTIF";
    }
    return matchSearch;
  });

  // Obtenir le libellé du secteur
  const getSecteurLibelle = (id: string | null) => {
    if (!id) return "-";
    const secteur = secteurs.find(s => s.id === id);
    return secteur ? secteur.libelle : "-";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            placeholder="Rechercher par nom, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/contractualisation/validation-prestataires">
              <FileCheck className="h-4 w-4 mr-2" />
              Panier de validation ({requestStats.enregistre + requestStats.enVerif})
            </Link>
          </Button>
          <Button asChild>
            <Link to="/contractualisation/demande-prestataire">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
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
              <TabsTrigger value="inactifs">
                Inactifs ({stats.inactifs})
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
                      <TableCell className="font-mono text-sm">{prestataire.code}</TableCell>
                      <TableCell className="font-medium">{prestataire.raison_sociale}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {prestataire.email && <div>{prestataire.email}</div>}
                          {prestataire.telephone && <div className="text-muted-foreground">{prestataire.telephone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getSecteurLibelle(prestataire.secteur_principal_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{prestataire.ninea || "-"}</TableCell>
                      <TableCell>
                        {prestataire.statut === "ACTIF" ? (
                          <Badge variant="default" className="bg-green-600">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPrestataire(prestataire);
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

      {/* Dialog Détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fiche Prestataire</DialogTitle>
          </DialogHeader>
          {selectedPrestataire && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPrestataire.raison_sociale}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedPrestataire.code}</p>
                </div>
                {selectedPrestataire.statut === "ACTIF" ? (
                  <Badge variant="default" className="bg-green-600">Actif</Badge>
                ) : (
                  <Badge variant="secondary">Inactif</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedPrestataire.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p>{selectedPrestataire.telephone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p>{selectedPrestataire.adresse || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secteur Principal</p>
                  <p>{getSecteurLibelle(selectedPrestataire.secteur_principal_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secteur Secondaire</p>
                  <p>{getSecteurLibelle(selectedPrestataire.secteur_secondaire_id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">NINEA</p>
                  <p className="font-mono">{selectedPrestataire.ninea || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RCCM</p>
                  <p className="font-mono">{selectedPrestataire.rccm || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compte Contribuable</p>
                  <p className="font-mono">{selectedPrestataire.cc || "-"}</p>
                </div>
              </div>

              {selectedPrestataire.rib_banque && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Informations bancaires</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Banque</p>
                      <p>{selectedPrestataire.rib_banque}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">N° Compte</p>
                      <p className="font-mono">{selectedPrestataire.rib_numero || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clé</p>
                      <p>{selectedPrestataire.rib_cle || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPrestataire.validated_at && (
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  Validé le {format(new Date(selectedPrestataire.validated_at), "dd MMMM yyyy", { locale: fr })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
