import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Inventaire, useApprovisionnement } from "@/hooks/useApprovisionnement";

const STATUTS = [
  { value: "brouillon", label: "En cours", variant: "secondary" as const },
  { value: "cloture", label: "Clôturé", variant: "default" as const },
];

export function InventaireList() {
  const {
    inventaires,
    loadingInventaires,
    createInventaire,
    updateInventaireLigne,
    applyInventaireAdjustments,
  } = useApprovisionnement();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInventaire, setSelectedInventaire] = useState<Inventaire | null>(null);
  const [formData, setFormData] = useState({
    libelle: "",
    observations: "",
  });

  const filteredInventaires = inventaires.filter(
    (i) =>
      i.numero.toLowerCase().includes(search.toLowerCase()) ||
      i.libelle.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      libelle: "",
      observations: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.libelle) return;
    await createInventaire.mutateAsync(formData);
    setShowForm(false);
    resetForm();
  };

  const handleUpdateLigne = async (ligneId: string, stock_physique: number, justification?: string) => {
    await updateInventaireLigne.mutateAsync({ id: ligneId, stock_physique, justification });
    // Refresh
    const updated = inventaires.find((i) => i.id === selectedInventaire?.id);
    if (updated) setSelectedInventaire(updated);
  };

  const handleCloturer = async (id: string) => {
    await applyInventaireAdjustments.mutateAsync(id);
    setSelectedInventaire(null);
  };

  const getStatutBadge = (statut: string) => {
    const s = STATUTS.find((st) => st.value === statut);
    return <Badge variant={s?.variant || "secondary"}>{s?.label || statut}</Badge>;
  };

  const countEcarts = (inventaire: Inventaire) => {
    return inventaire.lignes?.filter((l) => l.stock_physique !== null && l.ecart !== 0).length || 0;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Inventaires ({inventaires.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel inventaire
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingInventaires ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Articles</TableHead>
                  <TableHead className="text-right">Écarts</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventaires.map((inventaire) => (
                  <TableRow key={inventaire.id}>
                    <TableCell className="font-mono text-sm">{inventaire.numero}</TableCell>
                    <TableCell>
                      {format(new Date(inventaire.date_inventaire), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{inventaire.libelle}</TableCell>
                    <TableCell className="text-right">{inventaire.lignes?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      {countEcarts(inventaire) > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {countEcarts(inventaire)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatutBadge(inventaire.statut)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedInventaire(inventaire)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {inventaire.statut === "brouillon" ? "Saisir" : "Voir"}
                          </DropdownMenuItem>
                          {inventaire.statut === "brouillon" && (
                            <DropdownMenuItem onClick={() => handleCloturer(inventaire.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Clôturer et ajuster
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInventaires.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun inventaire trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel inventaire</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                placeholder="Ex: Inventaire annuel 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Observations</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Remarques..."
                rows={2}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tous les articles actifs seront inclus dans l'inventaire avec leur stock théorique actuel.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.libelle || createInventaire.isPending}>
              Créer l'inventaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saisie Dialog */}
      <Dialog open={!!selectedInventaire} onOpenChange={() => setSelectedInventaire(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInventaire?.statut === "brouillon" ? "Saisie inventaire" : "Détails inventaire"}{" "}
              {selectedInventaire?.numero}
            </DialogTitle>
          </DialogHeader>
          {selectedInventaire && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedInventaire.date_inventaire), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Libellé</p>
                  <p className="font-medium">{selectedInventaire.libelle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatutBadge(selectedInventaire.statut)}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-right">Stock théorique</TableHead>
                    <TableHead className="text-right">Stock physique</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Ajusté</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInventaire.lignes?.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell className="font-mono text-sm">{ligne.article?.code}</TableCell>
                      <TableCell>{ligne.article?.libelle}</TableCell>
                      <TableCell className="text-right">{ligne.stock_theorique}</TableCell>
                      <TableCell className="text-right">
                        {selectedInventaire.statut === "brouillon" ? (
                          <Input
                            type="number"
                            min={0}
                            className="w-20 h-8 text-right"
                            defaultValue={ligne.stock_physique ?? ""}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleUpdateLigne(ligne.id, val);
                              }
                            }}
                          />
                        ) : (
                          ligne.stock_physique ?? "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {ligne.stock_physique !== null && ligne.ecart !== 0 ? (
                          <Badge variant={ligne.ecart > 0 ? "default" : "destructive"}>
                            {ligne.ecart > 0 ? "+" : ""}
                            {ligne.ecart}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedInventaire.statut === "brouillon" &&
                        ligne.stock_physique !== null &&
                        ligne.ecart !== 0 ? (
                          <Input
                            className="h-8 text-sm"
                            placeholder="Motif..."
                            defaultValue={ligne.justification || ""}
                            onBlur={(e) => {
                              handleUpdateLigne(
                                ligne.id,
                                ligne.stock_physique!,
                                e.target.value
                              );
                            }}
                          />
                        ) : (
                          ligne.justification || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {ligne.ajustement_effectue ? (
                          <Badge variant="default">Oui</Badge>
                        ) : (
                          <span className="text-muted-foreground">Non</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedInventaire.statut === "brouillon" && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedInventaire(null)}>
                    Fermer
                  </Button>
                  <Button onClick={() => handleCloturer(selectedInventaire.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Clôturer et ajuster le stock
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
