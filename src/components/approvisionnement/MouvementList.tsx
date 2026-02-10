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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Settings2,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TYPES_MOUVEMENTS, useApprovisionnement } from "@/hooks/useApprovisionnement";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "entree":
      return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
    case "sortie":
      return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
    case "transfert":
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    case "ajustement":
      return <Settings2 className="h-4 w-4 text-orange-600" />;
    default:
      return null;
  }
};

const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "entree":
      return "default";
    case "sortie":
      return "destructive";
    default:
      return "secondary";
  }
};

export function MouvementList() {
  const { articles, mouvements, loadingMouvements, createMouvement } = useApprovisionnement();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type_mouvement: "entree" as "entree" | "sortie" | "transfert" | "ajustement",
    article_id: "",
    quantite: 1,
    motif: "",
    reference_document: "",
    destination: "",
    beneficiaire: "",
  });

  const filteredMouvements = mouvements.filter((m) => {
    const matchSearch =
      m.numero.toLowerCase().includes(search.toLowerCase()) ||
      m.article?.libelle?.toLowerCase().includes(search.toLowerCase()) ||
      m.article?.code?.toLowerCase().includes(search.toLowerCase()) ||
      m.motif.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.type_mouvement === filterType;
    return matchSearch && matchType;
  });

  const resetForm = () => {
    setFormData({
      type_mouvement: "entree",
      article_id: "",
      quantite: 1,
      motif: "",
      reference_document: "",
      destination: "",
      beneficiaire: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.article_id || !formData.motif || formData.quantite <= 0) {
      return;
    }
    await createMouvement.mutateAsync(formData);
    setShowForm(false);
    resetForm();
  };

  const exportCSV = () => {
    const headers = [
      "Numéro",
      "Date",
      "Type",
      "Article (Code)",
      "Article (Libellé)",
      "Quantité",
      "Stock avant",
      "Stock après",
      "Motif",
      "Référence",
      "Créé par",
    ];
    const rows = filteredMouvements.map((m) => [
      m.numero,
      format(new Date(m.date_mouvement), "dd/MM/yyyy HH:mm"),
      TYPES_MOUVEMENTS.find((t) => t.value === m.type_mouvement)?.label || m.type_mouvement,
      m.article?.code || "",
      m.article?.libelle || "",
      m.quantite,
      m.stock_avant,
      m.stock_apres,
      m.motif,
      m.reference_document || "",
      m.creator?.full_name || "",
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mouvements_stock_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedArticle = articles.find((a) => a.id === formData.article_id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Mouvements de stock ({mouvements.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau mouvement
            </Button>
          </div>
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {TYPES_MOUVEMENTS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loadingMouvements ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Article</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Stock avant</TableHead>
                <TableHead className="text-right">Stock après</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMouvements.map((mouvement) => (
                <TableRow key={mouvement.id}>
                  <TableCell className="font-mono text-sm">{mouvement.numero}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(mouvement.date_mouvement), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getTypeBadgeVariant(mouvement.type_mouvement)}
                      className="gap-1"
                    >
                      {getTypeIcon(mouvement.type_mouvement)}
                      {TYPES_MOUVEMENTS.find((t) => t.value === mouvement.type_mouvement)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{mouvement.article?.libelle}</div>
                    <div className="text-xs text-muted-foreground">{mouvement.article?.code}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {mouvement.type_mouvement === "entree" && "+"}
                    {mouvement.type_mouvement === "sortie" && "-"}
                    {mouvement.quantite} {mouvement.article?.unite}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {mouvement.stock_avant}
                  </TableCell>
                  <TableCell className="text-right font-medium">{mouvement.stock_apres}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={mouvement.motif}>
                    {mouvement.motif}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {mouvement.creator?.full_name || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMouvements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucun mouvement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau mouvement de stock</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Type de mouvement *</Label>
              <Select
                value={formData.type_mouvement}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    type_mouvement: v as "entree" | "sortie" | "transfert" | "ajustement",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_MOUVEMENTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Article *</Label>
              <Select
                value={formData.article_id}
                onValueChange={(v) => setFormData({ ...formData, article_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.libelle} (Stock: {a.stock_actuel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedArticle && (
                <p className="text-sm text-muted-foreground">
                  Stock actuel: {selectedArticle.stock_actuel} {selectedArticle.unite}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {formData.type_mouvement === "ajustement" ? "Nouveau stock *" : "Quantité *"}
              </Label>
              <Input
                type="number"
                min={formData.type_mouvement === "ajustement" ? 0 : 1}
                value={formData.quantite}
                onChange={(e) =>
                  setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })
                }
              />
              {formData.type_mouvement === "sortie" && selectedArticle && (
                <p className="text-sm text-muted-foreground">
                  Maximum disponible: {selectedArticle.stock_actuel}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Motif / Justification *</Label>
              <Textarea
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                placeholder="Raison du mouvement..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Référence document</Label>
              <Input
                value={formData.reference_document}
                onChange={(e) => setFormData({ ...formData, reference_document: e.target.value })}
                placeholder="N° BL, Bon de sortie..."
              />
            </div>
            {(formData.type_mouvement === "sortie" || formData.type_mouvement === "transfert") && (
              <>
                <div className="space-y-2">
                  <Label>Bénéficiaire / Destinataire</Label>
                  <Input
                    value={formData.beneficiaire}
                    onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
                    placeholder="Nom du bénéficiaire..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="Service, bureau..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.article_id ||
                !formData.motif ||
                formData.quantite <= 0 ||
                createMouvement.isPending
              }
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
