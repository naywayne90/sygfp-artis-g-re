import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRecettes, ORIGINES_RECETTES, CATEGORIES_RECETTES, Recette } from "@/hooks/useRecettes";
import { useTresorerie } from "@/hooks/useTresorerie";
import { Plus, Eye, Check, Banknote, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-800",
  validee: "bg-blue-100 text-blue-800",
  encaissee: "bg-green-100 text-green-800",
  annulee: "bg-red-100 text-red-800",
};

export function RecetteList() {
  const { recettes, createRecette, validerRecette, encaisserRecette } = useRecettes();
  const { comptes } = useTresorerie();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [encaisserOpen, setEncaisserOpen] = useState(false);
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);
  const [encaissementCompte, setEncaissementCompte] = useState("");
  const [filter, setFilter] = useState({ origine: "", statut: "" });
  const [form, setForm] = useState({
    date_recette: new Date().toISOString().split("T")[0],
    origine: "",
    categorie: "",
    description: "",
    montant: 0,
    reference_justificatif: "",
  });

  const resetForm = () => {
    setForm({
      date_recette: new Date().toISOString().split("T")[0],
      origine: "",
      categorie: "",
      description: "",
      montant: 0,
      reference_justificatif: "",
    });
  };

  const handleSubmit = async () => {
    await createRecette.mutateAsync(form);
    setOpen(false);
    resetForm();
  };

  const handleEncaisser = async () => {
    if (selectedRecette && encaissementCompte) {
      await encaisserRecette.mutateAsync({ id: selectedRecette.id, compte_id: encaissementCompte });
      setEncaisserOpen(false);
      setSelectedRecette(null);
      setEncaissementCompte("");
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const filteredRecettes = recettes.data?.filter(r => {
    if (filter.origine && r.origine !== filter.origine) return false;
    if (filter.statut && r.statut !== filter.statut) return false;
    return true;
  }) || [];

  const exportCSV = () => {
    const headers = ["Numéro", "Date", "Origine", "Catégorie", "Montant", "Statut", "Date encaissement"];
    const rows = filteredRecettes.map(r => [
      r.numero,
      r.date_recette,
      r.origine,
      r.categorie || "",
      r.montant,
      r.statut,
      r.date_encaissement || "",
    ]);
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `recettes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Déclarations de recettes</CardTitle>
          <CardDescription>Enregistrer et suivre les recettes budgétaires</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle recette
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle déclaration de recette</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={form.date_recette}
                      onChange={(e) => setForm({ ...form, date_recette: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant *</Label>
                    <Input
                      type="number"
                      value={form.montant}
                      onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Origine *</Label>
                  <Select value={form.origine} onValueChange={(v) => setForm({ ...form, origine: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'origine" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGINES_RECETTES.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES_RECETTES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Détails de la recette..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Référence justificatif</Label>
                  <Input
                    value={form.reference_justificatif}
                    onChange={(e) => setForm({ ...form, reference_justificatif: e.target.value })}
                    placeholder="N° de reçu, facture, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={!form.origine || !form.montant}>
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex gap-4 mb-4">
          <Select value={filter.origine} onValueChange={(v) => setFilter({ ...filter, origine: v })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes origines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes origines</SelectItem>
              {ORIGINES_RECETTES.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.statut} onValueChange={(v) => setFilter({ ...filter, statut: v })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="validee">Validée</SelectItem>
              <SelectItem value="encaissee">Encaissée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recettes.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : !filteredRecettes.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune recette trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecettes.map((recette) => (
                <TableRow key={recette.id}>
                  <TableCell className="font-mono text-sm">{recette.numero}</TableCell>
                  <TableCell>{format(new Date(recette.date_recette), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>{recette.origine}</TableCell>
                  <TableCell>{recette.categorie || "-"}</TableCell>
                  <TableCell className="text-right font-medium text-success">
                    +{formatMontant(recette.montant)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUT_COLORS[recette.statut] || ""}>
                      {recette.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedRecette(recette); setDetailsOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {recette.statut === "brouillon" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => validerRecette.mutate(recette.id)}
                          title="Valider"
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {recette.statut === "validee" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedRecette(recette); setEncaisserOpen(true); }}
                          title="Encaisser"
                        >
                          <Banknote className="h-4 w-4 text-success" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la recette {selectedRecette?.numero}</DialogTitle>
          </DialogHeader>
          {selectedRecette && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{format(new Date(selectedRecette.date_recette), "dd MMMM yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium text-success">{formatMontant(selectedRecette.montant)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Origine</Label>
                <p className="font-medium">{selectedRecette.origine}</p>
              </div>
              {selectedRecette.categorie && (
                <div>
                  <Label className="text-muted-foreground">Catégorie</Label>
                  <p className="font-medium">{selectedRecette.categorie}</p>
                </div>
              )}
              {selectedRecette.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedRecette.description}</p>
                </div>
              )}
              {selectedRecette.reference_justificatif && (
                <div>
                  <Label className="text-muted-foreground">Référence justificatif</Label>
                  <p>{selectedRecette.reference_justificatif}</p>
                </div>
              )}
              {selectedRecette.date_encaissement && (
                <div>
                  <Label className="text-muted-foreground">Date d'encaissement</Label>
                  <p>{format(new Date(selectedRecette.date_encaissement), "dd MMMM yyyy", { locale: fr })}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Encaisser */}
      <Dialog open={encaisserOpen} onOpenChange={setEncaisserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaisser la recette {selectedRecette?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Montant à encaisser</Label>
              <p className="text-2xl font-bold text-success">{formatMontant(selectedRecette?.montant || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>Compte de destination *</Label>
              <Select value={encaissementCompte} onValueChange={setEncaissementCompte}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le compte" />
                </SelectTrigger>
                <SelectContent>
                  {comptes.data?.filter(c => c.est_actif).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncaisserOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEncaisser} disabled={!encaissementCompte}>
              Confirmer l'encaissement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
