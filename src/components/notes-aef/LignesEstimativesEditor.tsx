/**
 * LignesEstimativesEditor - Éditeur de lignes estimatives pour Notes AEF
 *
 * Permet d'ajouter/modifier/supprimer des lignes avec:
 * - Catégorie (dropdown)
 * - Description
 * - Quantité × Prix unitaire = Montant
 */

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useLignesEstimativesAEF,
  CATEGORIES_LIGNE,
  CategorieTypeLigne,
  LigneEstimativeAEF,
} from "@/hooks/useLignesEstimativesAEF";
import {
  Plus,
  Trash2,
  Edit,
  Copy,
  GripVertical,
  Calculator,
  Loader2,
  Package,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LignesEstimativesEditorProps {
  noteAefId: string;
  readonly?: boolean;
}

const formatMontant = (value: number) => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

const formatInputNumber = (value: string) => {
  const number = value.replace(/\D/g, "");
  return number ? parseInt(number, 10).toLocaleString("fr-FR") : "";
};

const parseInputNumber = (value: string) => {
  return parseInt(value.replace(/\s/g, "").replace(/,/g, ""), 10) || 0;
};

// Couleurs par catégorie
const CATEGORIE_COLORS: Record<CategorieTypeLigne, string> = {
  fournitures: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  equipement: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  services: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  travaux: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  honoraires: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  transport: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  hebergement: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  restauration: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  communication: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  formation: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  autre: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface NewLigneFormData {
  categorie: CategorieTypeLigne;
  description: string;
  quantite: string;
  prix_unitaire: string;
}

const defaultFormData: NewLigneFormData = {
  categorie: "fournitures",
  description: "",
  quantite: "1",
  prix_unitaire: "",
};

export function LignesEstimativesEditor({
  noteAefId,
  readonly = false,
}: LignesEstimativesEditorProps) {
  const {
    lignes,
    total,
    isLoading,
    createLigne,
    updateLigne,
    deleteLigne,
    duplicateLigne,
    isCreating,
    isDeleting,
  } = useLignesEstimativesAEF(noteAefId);

  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<NewLigneFormData>(defaultFormData);
  const [editingLigne, setEditingLigne] = useState<LigneEstimativeAEF | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Calculer le montant prévisualisé
  const calculatedMontant =
    parseInputNumber(formData.quantite) * parseInputNumber(formData.prix_unitaire);

  const handleCreateLigne = () => {
    if (!formData.description.trim()) return;

    createLigne({
      note_aef_id: noteAefId,
      categorie: formData.categorie,
      description: formData.description.trim(),
      quantite: parseInputNumber(formData.quantite) || 1,
      prix_unitaire: parseInputNumber(formData.prix_unitaire) || 0,
    });

    setFormData(defaultFormData);
    setShowNewForm(false);
  };

  const handleUpdateLigne = () => {
    if (!editingLigne) return;

    updateLigne({
      id: editingLigne.id,
      categorie: formData.categorie,
      description: formData.description.trim(),
      quantite: parseInputNumber(formData.quantite) || 1,
      prix_unitaire: parseInputNumber(formData.prix_unitaire) || 0,
    });

    setEditingLigne(null);
    setFormData(defaultFormData);
  };

  const handleStartEdit = (ligne: LigneEstimativeAEF) => {
    setEditingLigne(ligne);
    setFormData({
      categorie: ligne.categorie,
      description: ligne.description,
      quantite: ligne.quantite.toString(),
      prix_unitaire: formatInputNumber(ligne.prix_unitaire.toString()),
    });
    setShowNewForm(false);
  };

  const handleCancelEdit = () => {
    setEditingLigne(null);
    setFormData(defaultFormData);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteLigne(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lignes estimatives
            <Badge variant="secondary">{lignes.length}</Badge>
          </CardTitle>
          {!readonly && !showNewForm && !editingLigne && (
            <Button
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout/édition */}
        {(showNewForm || editingLigne) && !readonly && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.categorie}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categorie: value as CategorieTypeLigne })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES_LIGNE.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                CATEGORIE_COLORS[cat.value].replace(/text-\S+/, "bg-current")
                              )}
                            />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantite}
                      onChange={(e) =>
                        setFormData({ ...formData, quantite: e.target.value })
                      }
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label>Prix unitaire</Label>
                    <Input
                      value={formData.prix_unitaire}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prix_unitaire: formatInputNumber(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="text-right font-mono"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      Montant
                    </Label>
                    <div className="h-10 flex items-center justify-end px-3 rounded-md border bg-muted font-mono font-medium">
                      {formatMontant(calculatedMontant)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez cette ligne de dépense..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewForm(false);
                    handleCancelEdit();
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={editingLigne ? handleUpdateLigne : handleCreateLigne}
                  disabled={!formData.description.trim() || isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingLigne ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des lignes */}
        {lignes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune ligne estimative</p>
            {!readonly && (
              <p className="text-sm">Cliquez sur "Ajouter" pour créer une ligne</p>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center w-[80px]">Qté</TableHead>
                  <TableHead className="text-right w-[120px]">P.U.</TableHead>
                  <TableHead className="text-right w-[130px]">Montant</TableHead>
                  {!readonly && <TableHead className="w-[100px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", CATEGORIE_COLORS[ligne.categorie])}
                      >
                        {CATEGORIES_LIGNE.find((c) => c.value === ligne.categorie)?.label ||
                          ligne.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block" title={ligne.description}>
                        {ligne.description}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {ligne.quantite}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMontant(ligne.prix_unitaire)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatMontant(ligne.montant)}
                    </TableCell>
                    {!readonly && (
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(ligne)}
                            title="Modifier"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateLigne(ligne.id)}
                            title="Dupliquer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(ligne.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Total */}
        {lignes.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Total estimé</span>
              <span className="text-xl font-bold font-mono text-primary">
                {formatMontant(total)} FCFA
              </span>
            </div>
          </>
        )}

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La ligne sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

/**
 * Composant lecture seule pour afficher les lignes dans les détails
 */
export function LignesEstimativesReadonly({ noteAefId }: { noteAefId: string }) {
  return <LignesEstimativesEditor noteAefId={noteAefId} readonly />;
}
