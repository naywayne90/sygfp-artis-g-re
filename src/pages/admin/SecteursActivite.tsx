import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, Search, Building2, Layers, BarChart3 } from "lucide-react";
import { useSecteursActivite } from "@/hooks/useSecteursActivite";
import { toast } from "sonner";

export default function SecteursActivite() {
  const {
    secteursPrincipaux,
    secteursSecondaires,
    secteursPrincipauxActifs,
    getSecondairesByPrincipal,
    isLoading,
    createSecteur,
    toggleActif,
    importCSV,
    statsParSecteur,
  } = useSecteursActivite();

  const [searchPrincipal, setSearchPrincipal] = useState("");
  const [searchSecondaire, setSearchSecondaire] = useState("");
  const [filterPrincipal, setFilterPrincipal] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createNiveau, setCreateNiveau] = useState<"PRINCIPAL" | "SECONDAIRE">("PRINCIPAL");
  const [newCode, setNewCode] = useState("");
  const [newLibelle, setNewLibelle] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Filtrer les principaux
  const filteredPrincipaux = secteursPrincipaux.filter(s =>
    s.code.toLowerCase().includes(searchPrincipal.toLowerCase()) ||
    s.libelle.toLowerCase().includes(searchPrincipal.toLowerCase())
  );

  // Filtrer les secondaires
  const filteredSecondaires = secteursSecondaires.filter(s => {
    const matchSearch =
      s.code.toLowerCase().includes(searchSecondaire.toLowerCase()) ||
      s.libelle.toLowerCase().includes(searchSecondaire.toLowerCase());
    const matchPrincipal = filterPrincipal === "all" || s.parent_id === filterPrincipal;
    return matchSearch && matchPrincipal;
  });

  // Créer un secteur
  const handleCreate = async () => {
    if (!newCode || !newLibelle) {
      toast.error("Code et libellé requis");
      return;
    }
    if (createNiveau === "SECONDAIRE" && !newParentId) {
      toast.error("Secteur principal requis pour un secondaire");
      return;
    }

    await createSecteur.mutateAsync({
      niveau: createNiveau,
      code: newCode,
      libelle: newLibelle,
      parent_id: createNiveau === "SECONDAIRE" ? newParentId : null,
    });

    setShowCreateDialog(false);
    setNewCode("");
    setNewLibelle("");
    setNewParentId("");
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      
      // Skip header
      const rows = lines.slice(1).map(line => {
        const [code, libelle, parent_code] = line.split(";").map(s => s?.trim());
        return { code, libelle, parent_code: parent_code || undefined };
      }).filter(r => r.code && r.libelle);

      await importCSV.mutateAsync(rows);
      setShowImportDialog(false);
    };
    reader.readAsText(file);
  };

  // Stats mini
  const totalPrincipaux = secteursPrincipaux.length;
  const totalSecondaires = secteursSecondaires.length;
  const principauxActifs = secteursPrincipaux.filter(s => s.actif).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Secteurs d'Activité</h1>
        <p className="page-description">
          Référentiel des secteurs d'activité des prestataires (2 niveaux)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Secteurs Principaux
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrincipaux}</div>
            <p className="text-xs text-muted-foreground">{principauxActifs} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Secteurs Secondaires
            </CardTitle>
            <Layers className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSecondaires}</div>
            <p className="text-xs text-muted-foreground">Sous-catégories</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prestataires par Secteur
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statsParSecteur.slice(0, 5).map(stat => (
                <Badge key={stat.secteur.id} variant="outline" className="text-xs">
                  {stat.secteur.code}: {stat.count}
                </Badge>
              ))}
              {statsParSecteur.length === 0 && (
                <span className="text-xs text-muted-foreground">Aucun prestataire assigné</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Secteur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un secteur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau secteur principal ou secondaire
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Select
                    value={createNiveau}
                    onValueChange={(v) => setCreateNiveau(v as "PRINCIPAL" | "SECONDAIRE")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRINCIPAL">Principal</SelectItem>
                      <SelectItem value="SECONDAIRE">Secondaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {createNiveau === "SECONDAIRE" && (
                  <div className="space-y-2">
                    <Label>Secteur Principal Parent</Label>
                    <Select value={newParentId} onValueChange={setNewParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {secteursPrincipauxActifs.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} - {s.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Ex: INFO, BTP-ELEC"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Libellé</Label>
                  <Input
                    value={newLibelle}
                    onChange={(e) => setNewLibelle(e.target.value)}
                    placeholder="Libellé complet"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={createSecteur.isPending}>
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des secteurs</DialogTitle>
                <DialogDescription>
                  Format CSV : code;libelle;parent_code (parent_code vide = principal)
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="principaux">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="principaux">
                Secteurs Principaux ({totalPrincipaux})
              </TabsTrigger>
              <TabsTrigger value="secondaires">
                Secteurs Secondaires ({totalSecondaires})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {/* Tab Principaux */}
            <TabsContent value="principaux" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchPrincipal}
                  onChange={(e) => setSearchPrincipal(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Sous-secteurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredPrincipaux.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun secteur principal
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrincipaux.map((secteur) => (
                      <TableRow key={secteur.id}>
                        <TableCell className="font-mono font-medium">
                          {secteur.code}
                        </TableCell>
                        <TableCell>{secteur.libelle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSecondairesByPrincipal(secteur.id, true).length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {secteur.actif ? (
                            <Badge variant="default">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={secteur.actif}
                            onCheckedChange={(checked) =>
                              toggleActif.mutate({ id: secteur.id, actif: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Tab Secondaires */}
            <TabsContent value="secondaires" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchSecondaire}
                    onChange={(e) => setSearchSecondaire(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterPrincipal} onValueChange={setFilterPrincipal}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Tous les principaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les principaux</SelectItem>
                    {secteursPrincipaux.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} - {s.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Secteur Principal</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredSecondaires.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun secteur secondaire
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSecondaires.map((secteur) => {
                      const parent = secteursPrincipaux.find(p => p.id === secteur.parent_id);
                      return (
                        <TableRow key={secteur.id}>
                          <TableCell className="font-mono font-medium">
                            {secteur.code}
                          </TableCell>
                          <TableCell>{secteur.libelle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {parent?.code || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {secteur.actif ? (
                              <Badge variant="default">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={secteur.actif}
                              onCheckedChange={(checked) =>
                                toggleActif.mutate({ id: secteur.id, actif: checked })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
