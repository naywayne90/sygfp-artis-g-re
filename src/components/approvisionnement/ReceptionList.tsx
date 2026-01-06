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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, MoreHorizontal, Eye, CheckCircle, Truck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useApprovisionnement } from "@/hooks/useApprovisionnement";

const STATUTS = [
  { value: "brouillon", label: "Brouillon", variant: "secondary" as const },
  { value: "validee", label: "Validée", variant: "default" as const },
];

export function ReceptionList() {
  const {
    articles,
    receptions,
    loadingReceptions,
    createReception,
    validateReception,
  } = useApprovisionnement();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedReception, setSelectedReception] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fournisseur: "",
    numero_bl: "",
    numero_facture: "",
    observations: "",
    lignes: [{ article_id: "", quantite_recue: 1, quantite_acceptee: 1, prix_unitaire: 0 }],
  });

  const filteredReceptions = receptions.filter(
    (r) =>
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      r.fournisseur?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      fournisseur: "",
      numero_bl: "",
      numero_facture: "",
      observations: "",
      lignes: [{ article_id: "", quantite_recue: 1, quantite_acceptee: 1, prix_unitaire: 0 }],
    });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [
        ...formData.lignes,
        { article_id: "", quantite_recue: 1, quantite_acceptee: 1, prix_unitaire: 0 },
      ],
    });
  };

  const removeLigne = (index: number) => {
    setFormData({
      ...formData,
      lignes: formData.lignes.filter((_, i) => i !== index),
    });
  };

  const updateLigne = (index: number, field: string, value: unknown) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setFormData({ ...formData, lignes: newLignes });
  };

  const handleSubmit = async () => {
    const validLignes = formData.lignes.filter((l) => l.article_id && l.quantite_recue > 0);
    if (validLignes.length === 0) return;

    const reception = {
      fournisseur: formData.fournisseur,
      numero_bl: formData.numero_bl,
      numero_facture: formData.numero_facture,
      observations: formData.observations,
    };

    const lignes = validLignes.map((l) => ({
      article_id: l.article_id,
      quantite_recue: l.quantite_recue,
      quantite_acceptee: l.quantite_acceptee || l.quantite_recue,
      prix_unitaire: l.prix_unitaire || null,
    }));

    await createReception.mutateAsync({ reception, lignes });
    setShowForm(false);
    resetForm();
  };

  const handleValidate = async (id: string) => {
    await validateReception.mutateAsync(id);
  };

  const getStatutBadge = (statut: string) => {
    const s = STATUTS.find((st) => st.value === statut);
    return <Badge variant={s?.variant || "secondary"}>{s?.label || statut}</Badge>;
  };

  const viewedReception = receptions.find((r) => r.id === selectedReception);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Réceptions ({receptions.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle réception
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
          {loadingReceptions ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>N° BL</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.map((reception) => (
                  <TableRow key={reception.id}>
                    <TableCell className="font-mono text-sm">{reception.numero}</TableCell>
                    <TableCell>
                      {format(new Date(reception.date_reception), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{reception.fournisseur || "-"}</TableCell>
                    <TableCell>{reception.numero_bl || "-"}</TableCell>
                    <TableCell>{reception.lignes?.length || 0} article(s)</TableCell>
                    <TableCell>{getStatutBadge(reception.statut)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedReception(reception.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {reception.statut === "brouillon" && (
                            <DropdownMenuItem onClick={() => handleValidate(reception.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider et mettre en stock
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReceptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune réception trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle réception</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fournisseur</Label>
                <Input
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div className="space-y-2">
                <Label>N° Bon de livraison</Label>
                <Input
                  value={formData.numero_bl}
                  onChange={(e) => setFormData({ ...formData, numero_bl: e.target.value })}
                  placeholder="N° BL"
                />
              </div>
              <div className="space-y-2">
                <Label>N° Facture</Label>
                <Input
                  value={formData.numero_facture}
                  onChange={(e) => setFormData({ ...formData, numero_facture: e.target.value })}
                  placeholder="N° Facture"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observations</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Remarques, état de la livraison..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Articles reçus</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-5">
                      <Label className="text-xs">Article *</Label>
                      <Select
                        value={ligne.article_id}
                        onValueChange={(v) => updateLigne(index, "article_id", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {articles.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.code} - {a.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qté reçue *</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-9"
                        value={ligne.quantite_recue}
                        onChange={(e) =>
                          updateLigne(index, "quantite_recue", parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qté acceptée</Label>
                      <Input
                        type="number"
                        min={0}
                        max={ligne.quantite_recue}
                        className="h-9"
                        value={ligne.quantite_acceptee}
                        onChange={(e) =>
                          updateLigne(index, "quantite_acceptee", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Prix unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9"
                        value={ligne.prix_unitaire}
                        onChange={(e) =>
                          updateLigne(index, "prix_unitaire", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.lignes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9"
                          onClick={() => removeLigne(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                formData.lignes.filter((l) => l.article_id).length === 0 ||
                createReception.isPending
              }
            >
              Créer la réception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedReception} onOpenChange={() => setSelectedReception(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la réception {viewedReception?.numero}</DialogTitle>
          </DialogHeader>
          {viewedReception && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(viewedReception.date_reception), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatutBadge(viewedReception.statut)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{viewedReception.fournisseur || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">N° BL / Facture</p>
                  <p className="font-medium">
                    {viewedReception.numero_bl || "-"} / {viewedReception.numero_facture || "-"}
                  </p>
                </div>
              </div>
              {viewedReception.observations && (
                <div>
                  <p className="text-sm text-muted-foreground">Observations</p>
                  <p>{viewedReception.observations}</p>
                </div>
              )}
              {viewedReception.lignes && viewedReception.lignes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Articles reçus</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-right">Reçue</TableHead>
                        <TableHead className="text-right">Acceptée</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                        <TableHead className="text-right">Prix unit.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewedReception.lignes.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium">{l.article?.libelle}</div>
                            <div className="text-xs text-muted-foreground">{l.article?.code}</div>
                          </TableCell>
                          <TableCell className="text-right">{l.quantite_recue}</TableCell>
                          <TableCell className="text-right">{l.quantite_acceptee || l.quantite_recue}</TableCell>
                          <TableCell className="text-right">
                            {l.ecart !== 0 && (
                              <Badge variant={l.ecart > 0 ? "default" : "destructive"}>
                                {l.ecart > 0 ? "+" : ""}{l.ecart}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.prix_unitaire?.toLocaleString("fr-FR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
