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
import { Plus, Search, MoreHorizontal, Eye, CheckCircle, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useApprovisionnement } from "@/hooks/useApprovisionnement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUTS = [
  { value: "brouillon", label: "Brouillon", variant: "secondary" as const },
  { value: "soumise", label: "Soumise", variant: "default" as const },
  { value: "validee", label: "Validée", variant: "default" as const },
  { value: "rejetee", label: "Rejetée", variant: "destructive" as const },
];

export function DemandeAchatList() {
  const {
    articles,
    demandesAchat,
    loadingDemandes,
    createDemandeAchat,
    updateDemandeStatut,
  } = useApprovisionnement();

  const { data: directions = [] } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data } = await supabase.from("directions").select("id, label, code").eq("est_active", true);
      return data || [];
    },
  });

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    objet: "",
    justification: "",
    urgence: "normale",
    direction_id: "",
    lignes: [{ designation: "", quantite: 1, unite: "unité", article_id: "", prix_unitaire_estime: 0 }],
  });

  const filteredDemandes = demandesAchat.filter(
    (d) =>
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.objet.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      objet: "",
      justification: "",
      urgence: "normale",
      direction_id: "",
      lignes: [{ designation: "", quantite: 1, unite: "unité", article_id: "", prix_unitaire_estime: 0 }],
    });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [
        ...formData.lignes,
        { designation: "", quantite: 1, unite: "unité", article_id: "", prix_unitaire_estime: 0 },
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

    // If article selected, fill designation
    if (field === "article_id" && value) {
      const article = articles.find((a) => a.id === value);
      if (article) {
        newLignes[index].designation = article.libelle;
        newLignes[index].unite = article.unite;
      }
    }

    setFormData({ ...formData, lignes: newLignes });
  };

  const calculateTotal = () => {
    return formData.lignes.reduce((sum, l) => sum + (l.quantite * (l.prix_unitaire_estime || 0)), 0);
  };

  const handleSubmit = async () => {
    if (!formData.objet || formData.lignes.length === 0) return;

    const demande = {
      objet: formData.objet,
      justification: formData.justification,
      urgence: formData.urgence,
      direction_id: formData.direction_id || null,
      montant_estime: calculateTotal(),
    };

    const lignes = formData.lignes
      .filter((l) => l.designation)
      .map((l) => ({
        designation: l.designation,
        quantite: l.quantite,
        unite: l.unite,
        article_id: l.article_id || null,
        prix_unitaire_estime: l.prix_unitaire_estime || null,
      }));

    await createDemandeAchat.mutateAsync({ demande, lignes });
    setShowForm(false);
    resetForm();
  };

  const handleSubmitDemande = async (id: string) => {
    await updateDemandeStatut.mutateAsync({ id, statut: "soumise" });
  };

  const handleValidateDemande = async (id: string) => {
    await updateDemandeStatut.mutateAsync({ id, statut: "validee" });
  };

  const getStatutBadge = (statut: string) => {
    const s = STATUTS.find((st) => st.value === statut);
    return <Badge variant={s?.variant || "secondary"}>{s?.label || statut}</Badge>;
  };

  const viewedDemande = demandesAchat.find((d) => d.id === selectedDemande);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Demandes d'achat ({demandesAchat.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
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
          {loadingDemandes ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemandes.map((demande) => (
                  <TableRow key={demande.id}>
                    <TableCell className="font-mono text-sm">{demande.numero}</TableCell>
                    <TableCell>
                      {format(new Date(demande.date_demande), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{demande.objet}</TableCell>
                    <TableCell>{demande.direction?.code || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={demande.urgence === "urgente" ? "destructive" : "secondary"}>
                        {demande.urgence}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {demande.montant_estime?.toLocaleString("fr-FR")} FCFA
                    </TableCell>
                    <TableCell>{getStatutBadge(demande.statut)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDemande(demande.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {demande.statut === "brouillon" && (
                            <DropdownMenuItem onClick={() => handleSubmitDemande(demande.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Soumettre
                            </DropdownMenuItem>
                          )}
                          {demande.statut === "soumise" && (
                            <DropdownMenuItem onClick={() => handleValidateDemande(demande.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDemandes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune demande trouvée
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
            <DialogTitle>Nouvelle demande d'achat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={formData.direction_id}
                  onValueChange={(v) => setFormData({ ...formData, direction_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} - {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgence</Label>
                <Select
                  value={formData.urgence}
                  onValueChange={(v) => setFormData({ ...formData, urgence: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objet *</Label>
              <Input
                value={formData.objet}
                onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                placeholder="Objet de la demande..."
              />
            </div>
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Justification du besoin..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Articles demandés</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-3">
                      <Label className="text-xs">Article (optionnel)</Label>
                      <Select
                        value={ligne.article_id}
                        onValueChange={(v) => updateLigne(index, "article_id", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choisir..." />
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
                    <div className="col-span-3">
                      <Label className="text-xs">Désignation *</Label>
                      <Input
                        className="h-9"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(index, "designation", e.target.value)}
                        placeholder="Description..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-9"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, "quantite", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Prix unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9"
                        value={ligne.prix_unitaire_estime}
                        onChange={(e) =>
                          updateLigne(index, "prix_unitaire_estime", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Unité</Label>
                      <Input className="h-9" value={ligne.unite} disabled />
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
              <div className="text-right font-medium">
                Total estimé: {calculateTotal().toLocaleString("fr-FR")} FCFA
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.objet || createDemandeAchat.isPending}
            >
              Créer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedDemande} onOpenChange={() => setSelectedDemande(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande {viewedDemande?.numero}</DialogTitle>
          </DialogHeader>
          {viewedDemande && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(viewedDemande.date_demande), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatutBadge(viewedDemande.statut)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <p className="font-medium">{viewedDemande.direction?.label || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant estimé</p>
                  <p className="font-medium">
                    {viewedDemande.montant_estime?.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objet</p>
                <p className="font-medium">{viewedDemande.objet}</p>
              </div>
              {viewedDemande.justification && (
                <div>
                  <p className="text-sm text-muted-foreground">Justification</p>
                  <p>{viewedDemande.justification}</p>
                </div>
              )}
              {viewedDemande.lignes && viewedDemande.lignes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Articles</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead>Unité</TableHead>
                        <TableHead className="text-right">Prix unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewedDemande.lignes.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.designation}</TableCell>
                          <TableCell className="text-right">{l.quantite}</TableCell>
                          <TableCell>{l.unite}</TableCell>
                          <TableCell className="text-right">
                            {l.prix_unitaire_estime?.toLocaleString("fr-FR")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {((l.quantite || 0) * (l.prix_unitaire_estime || 0)).toLocaleString("fr-FR")}
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
