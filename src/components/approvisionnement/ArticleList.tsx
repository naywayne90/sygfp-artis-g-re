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
import { Plus, Search, Edit, AlertTriangle, Package } from "lucide-react";
import { Article, UNITES, CATEGORIES_ARTICLES, useApprovisionnement } from "@/hooks/useApprovisionnement";

export function ArticleList() {
  const { articles, loadingArticles, createArticle, updateArticle } = useApprovisionnement();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    libelle: "",
    description: "",
    unite: "unité",
    categorie: "",
    seuil_mini: 0,
    emplacement: "",
  });

  const filteredArticles = articles.filter(
    (a) =>
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.libelle.toLowerCase().includes(search.toLowerCase()) ||
      a.categorie?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      code: "",
      libelle: "",
      description: "",
      unite: "unité",
      categorie: "",
      seuil_mini: 0,
      emplacement: "",
    });
    setEditingArticle(null);
  };

  const handleOpenForm = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        code: article.code,
        libelle: article.libelle,
        description: article.description || "",
        unite: article.unite,
        categorie: article.categorie || "",
        seuil_mini: article.seuil_mini,
        emplacement: article.emplacement || "",
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.libelle) {
      return;
    }

    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...formData });
    } else {
      await createArticle.mutateAsync(formData);
    }
    setShowForm(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles ({articles.length})
          </CardTitle>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, libellé ou catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingArticles ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Seuil mini</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-mono font-medium">{article.code}</TableCell>
                  <TableCell>{article.libelle}</TableCell>
                  <TableCell>{article.categorie || "-"}</TableCell>
                  <TableCell>{article.unite}</TableCell>
                  <TableCell className="text-right font-medium">
                    {article.stock_actuel}
                  </TableCell>
                  <TableCell className="text-right">{article.seuil_mini}</TableCell>
                  <TableCell>
                    {article.stock_actuel <= article.seuil_mini ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Sous seuil
                      </Badge>
                    ) : (
                      <Badge variant="secondary">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenForm(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredArticles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun article trouvé
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
            <DialogTitle>
              {editingArticle ? "Modifier l'article" : "Nouvel article"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ART-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Unité *</Label>
                <Select
                  value={formData.unite}
                  onValueChange={(v) => setFormData({ ...formData, unite: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                placeholder="Nom de l'article"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={(v) => setFormData({ ...formData, categorie: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_ARTICLES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seuil minimum</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.seuil_mini}
                  onChange={(e) =>
                    setFormData({ ...formData, seuil_mini: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Emplacement</Label>
              <Input
                value={formData.emplacement}
                onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                placeholder="Magasin A, Étagère 3..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.code || !formData.libelle || createArticle.isPending || updateArticle.isPending}
            >
              {editingArticle ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
