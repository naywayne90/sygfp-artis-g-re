import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { URGENCE_OPTIONS } from "@/hooks/useExpressionsBesoin";
import { useExercice } from "@/contexts/ExerciceContext";
import { CreditCard, Calendar, Loader2, Search, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface ImputationValidee {
  id: string;
  reference: string | null;
  objet: string;
  montant: number | null;
  code_imputation: string | null;
  direction_id: string | null;
  dossier_id: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  budget_line?: { id: string; code: string; label: string } | null;
}

interface ArticleLigne {
  id: string;
  article: string;
  quantite: number;
  unite: string;
}

interface ExpressionBesoinFromImputationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceImputation?: ImputationValidee | null;
  imputationsValidees?: ImputationValidee[];
  onSuccess?: () => void;
}

const UNITES = [
  { value: "piece", label: "Pièce(s)" },
  { value: "kg", label: "Kilogramme(s)" },
  { value: "m", label: "Mètre(s)" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "litre", label: "Litre(s)" },
  { value: "lot", label: "Lot(s)" },
  { value: "forfait", label: "Forfait" },
];

export function ExpressionBesoinFromImputationForm({
  open,
  onOpenChange,
  sourceImputation,
  imputationsValidees = [],
  onSuccess,
}: ExpressionBesoinFromImputationFormProps) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const [selectedImputation, setSelectedImputation] = useState<ImputationValidee | null>(null);
  const [searchImputation, setSearchImputation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    objet: "",
    description: "",
    justification: "",
    specifications: "",
    calendrier_debut: "",
    calendrier_fin: "",
    montant_estime: "",
    urgence: "normal",
  });

  const [articles, setArticles] = useState<ArticleLigne[]>([
    { id: crypto.randomUUID(), article: "", quantite: 1, unite: "piece" },
  ]);

  // Auto-sélectionner l'imputation si elle est fournie
  useEffect(() => {
    if (sourceImputation) {
      setSelectedImputation(sourceImputation);
      setFormData((prev) => ({
        ...prev,
        objet: sourceImputation.objet || "",
        montant_estime: sourceImputation.montant?.toString() || "",
      }));
    }
  }, [sourceImputation]);

  const filteredImputations = imputationsValidees.filter(
    (imp) =>
      imp.reference?.toLowerCase().includes(searchImputation.toLowerCase()) ||
      imp.objet.toLowerCase().includes(searchImputation.toLowerCase()) ||
      imp.direction?.sigle?.toLowerCase().includes(searchImputation.toLowerCase())
  );

  const handleSelectImputation = (imputation: ImputationValidee) => {
    setSelectedImputation(imputation);
    setFormData((prev) => ({
      ...prev,
      objet: imputation.objet || "",
      montant_estime: imputation.montant?.toString() || "",
    }));
  };

  const handleAddArticle = () => {
    setArticles((prev) => [
      ...prev,
      { id: crypto.randomUUID(), article: "", quantite: 1, unite: "piece" },
    ]);
  };

  const handleRemoveArticle = (id: string) => {
    if (articles.length > 1) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleArticleChange = (id: string, field: keyof ArticleLigne, value: string | number) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImputation) return;

    setIsCreating(true);
    try {
      // Préparer les articles pour le JSON
      const listeArticles = articles
        .filter((a) => a.article.trim() !== "")
        .map(({ article, quantite, unite }) => ({ article, quantite, unite }));

      // Créer l'expression de besoin
      const { data, error } = await supabase
        .from("expressions_besoin")
        .insert({
          imputation_id: selectedImputation.id,
          dossier_id: selectedImputation.dossier_id,
          direction_id: selectedImputation.direction_id,
          objet: formData.objet,
          description: formData.description || null,
          justification: formData.justification || null,
          specifications: formData.specifications || null,
          calendrier_debut: formData.calendrier_debut || null,
          calendrier_fin: formData.calendrier_fin || null,
          montant_estime: formData.montant_estime ? parseFloat(formData.montant_estime) : null,
          urgence: formData.urgence,
          liste_articles: listeArticles,
          exercice: exercice || new Date().getFullYear(),
          statut: "brouillon",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Expression de besoin créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      queryClient.invalidateQueries({ queryKey: ["imputations-validees-pour-eb"] });
      
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur création EB:", error);
      toast.error("Erreur lors de la création: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedImputation(null);
    setSearchImputation("");
    setFormData({
      objet: "",
      description: "",
      justification: "",
      specifications: "",
      calendrier_debut: "",
      calendrier_fin: "",
      montant_estime: "",
      urgence: "normal",
    });
    setArticles([{ id: crypto.randomUUID(), article: "", quantite: 1, unite: "piece" }]);
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une expression de besoin</DialogTitle>
          <DialogDescription>
            Créer une expression de besoin à partir d'une imputation validée - Exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'imputation */}
          {!selectedImputation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Sélectionner une imputation validée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par référence, objet ou direction..."
                    value={searchImputation}
                    onChange={(e) => setSearchImputation(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredImputations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune imputation validée disponible
                    </p>
                  ) : (
                    filteredImputations.map((imputation) => (
                      <div
                        key={imputation.id}
                        onClick={() => handleSelectImputation(imputation)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium font-mono text-sm">
                              {imputation.reference || "Réf. en attente"}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {imputation.objet}
                            </p>
                            {imputation.direction && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {imputation.direction.sigle || imputation.direction.label}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{formatMontant(imputation.montant)}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informations de l'imputation sélectionnée */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Imputation source
                    </CardTitle>
                    {!sourceImputation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImputation(null)}
                      >
                        Changer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Référence:</span>{" "}
                      <span className="font-medium font-mono">
                        {selectedImputation.reference || "En attente"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant:</span>{" "}
                      <span className="font-medium">{formatMontant(selectedImputation.montant)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Objet:</span>{" "}
                      <span className="font-medium">{selectedImputation.objet}</span>
                    </div>
                    {selectedImputation.direction && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Direction:</span>{" "}
                        <span className="font-medium">
                          {selectedImputation.direction.sigle || selectedImputation.direction.label}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Détails du besoin */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objet">Objet *</Label>
                  <Input
                    id="objet"
                    value={formData.objet}
                    onChange={(e) => setFormData((prev) => ({ ...prev, objet: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée du besoin</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Décrivez le besoin en détail..."
                  />
                </div>

                <div>
                  <Label htmlFor="justification">Justification</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, justification: e.target.value }))
                    }
                    rows={2}
                    placeholder="Pourquoi ce besoin est-il nécessaire ?"
                  />
                </div>

                {/* Liste des articles */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Liste des articles</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddArticle}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Article / Désignation</TableHead>
                          <TableHead className="w-[20%]">Quantité</TableHead>
                          <TableHead className="w-[25%]">Unité</TableHead>
                          <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell>
                              <Input
                                value={article.article}
                                onChange={(e) =>
                                  handleArticleChange(article.id, "article", e.target.value)
                                }
                                placeholder="Nom de l'article..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={article.quantite}
                                onChange={(e) =>
                                  handleArticleChange(
                                    article.id,
                                    "quantite",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={article.unite}
                                onValueChange={(value) =>
                                  handleArticleChange(article.id, "unite", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITES.map((u) => (
                                    <SelectItem key={u.value} value={u.value}>
                                      {u.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveArticle(article.id)}
                                disabled={articles.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="specifications">Spécifications techniques</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, specifications: e.target.value }))
                    }
                    rows={3}
                    placeholder="Spécifications techniques, caractéristiques requises..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montant_estime">Montant estimé (FCFA)</Label>
                    <Input
                      id="montant_estime"
                      type="number"
                      value={formData.montant_estime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, montant_estime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="urgence">Niveau d'urgence</Label>
                    <Select
                      value={formData.urgence}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, urgence: value }))
                      }
                    >
                      <SelectTrigger id="urgence">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calendrier_debut">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date début souhaitée
                    </Label>
                    <Input
                      id="calendrier_debut"
                      type="date"
                      value={formData.calendrier_debut}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_debut: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendrier_fin">Date fin souhaitée</Label>
                    <Input
                      id="calendrier_fin"
                      type="date"
                      value={formData.calendrier_fin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_fin: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedImputation || isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'expression de besoin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
