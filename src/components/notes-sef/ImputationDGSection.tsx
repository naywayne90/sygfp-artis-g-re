/**
 * Section Imputation DG pour les Notes SEF (PROMPT 27)
 *
 * Affiche et permet d'éditer les instructions d'imputation du DG
 * vers les différentes directions/services.
 *
 * Seul le DG peut ajouter/modifier/supprimer des lignes.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNoteImputation,
  useNoteImputationMutations,
  NoteImputationLigne,
  CreateLigneInput,
  InstructionType,
  ImputationPriorite,
  INSTRUCTION_TYPE_LABELS,
  PRIORITE_LABELS,
  PRIORITE_COLORS,
} from "@/hooks/useNoteImputations";
import { useDirections } from "@/hooks/useDirections";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  ArrowRight,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

interface ImputationDGSectionProps {
  noteSefId: string;
  noteStatut: string | null;
}

export function ImputationDGSection({ noteSefId, noteStatut: _noteStatut }: ImputationDGSectionProps) {
  const { hasAnyRole } = usePermissions();
  const canEdit = hasAnyRole(["DG", "ADMIN"]);

  const { data: imputation, isLoading, error } = useNoteImputation(noteSefId);
  const { addLigne, updateLigne, deleteLigne, isLoading: isMutating } = useNoteImputationMutations(noteSefId);
  const { data: directions = [] } = useDirections();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<NoteImputationLigne | null>(null);
  const [deletingLigneId, setDeletingLigneId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateLigneInput>({
    destinataire: "",
    destinataire_id: null,
    instruction_type: "ATTRIBUTION",
    action_detail: "",
    priorite: "normale",
    delai: "",
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      destinataire: "",
      destinataire_id: null,
      instruction_type: "ATTRIBUTION",
      action_detail: "",
      priorite: "normale",
      delai: "",
    });
    setEditingLigne(null);
  };

  // Open dialog for new ligne
  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (ligne: NoteImputationLigne) => {
    setEditingLigne(ligne);
    setFormData({
      destinataire: ligne.destinataire,
      destinataire_id: ligne.destinataire_id,
      instruction_type: ligne.instruction_type,
      action_detail: ligne.action_detail || "",
      priorite: ligne.priorite,
      delai: ligne.delai || "",
    });
    setDialogOpen(true);
  };

  // Handle direction selection
  const handleDirectionChange = (directionId: string) => {
    const direction = directions.find(d => d.id === directionId);
    if (direction) {
      setFormData(prev => ({
        ...prev,
        destinataire_id: direction.id,
        destinataire: direction.sigle || direction.label,
      }));
    }
  };

  // Save ligne
  const handleSave = async () => {
    if (!formData.destinataire.trim()) return;

    if (editingLigne) {
      await updateLigne.mutateAsync({
        id: editingLigne.id,
        ...formData,
      });
    } else {
      await addLigne.mutateAsync(formData);
    }

    setDialogOpen(false);
    resetForm();
  };

  // Delete ligne
  const handleDeleteConfirm = async () => {
    if (deletingLigneId) {
      await deleteLigne.mutateAsync(deletingLigneId);
      setDeleteDialogOpen(false);
      setDeletingLigneId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Impossible de charger les imputations: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const lignes = imputation?.lignes || [];
  const hasLignes = lignes.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Imputation DG
              </CardTitle>
              <CardDescription>
                Instructions de distribution aux directions et services
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleAddNew} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasLignes ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Aucune instruction d'imputation. Cliquez sur \"Ajouter\" pour créer une ligne."
                  : "Aucune instruction d'imputation pour cette note."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info sur l'imputeur */}
              {imputation?.impute_par && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>
                    Imputé par {imputation.impute_par.first_name} {imputation.impute_par.last_name}
                    {" le "}
                    {format(new Date(imputation.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </span>
                </div>
              )}

              {/* Table des lignes */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Détail</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead className="hidden sm:table-cell">Délai</TableHead>
                    {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne, index) => (
                    <TableRow key={ligne.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          {ligne.destinataire}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {INSTRUCTION_TYPE_LABELS[ligne.instruction_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {ligne.action_detail || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITE_COLORS[ligne.priorite]}>
                          {PRIORITE_LABELS[ligne.priorite]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {ligne.delai || "—"}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(ligne)}
                              disabled={isMutating}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingLigneId(ligne.id);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </CardContent>
      </Card>

      {/* Dialog d'ajout/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLigne ? "Modifier la ligne" : "Ajouter une instruction"}
            </DialogTitle>
            <DialogDescription>
              Définissez l'instruction d'imputation pour une direction ou un service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Sélection de direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction / Service</label>
              <Select
                value={formData.destinataire_id || "custom"}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setFormData(prev => ({ ...prev, destinataire_id: null }));
                  } else {
                    handleDirectionChange(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner ou saisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Saisie libre</SelectItem>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle || dir.label} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinataire (saisie libre si custom) */}
            {!formData.destinataire_id && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Destinataire</label>
                <Input
                  value={formData.destinataire}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinataire: e.target.value }))}
                  placeholder="Ex: DAAF, DG, Service X..."
                />
              </div>
            )}

            {/* Type d'instruction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type d'instruction</label>
              <Select
                value={formData.instruction_type}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  instruction_type: value as InstructionType
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(INSTRUCTION_TYPE_LABELS) as [InstructionType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Détail de l'action */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Détail de l'action (optionnel)</label>
              <Textarea
                value={formData.action_detail || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, action_detail: e.target.value }))}
                placeholder="Précisions sur l'action attendue..."
                rows={2}
              />
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select
                value={formData.priorite}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  priorite: value as ImputationPriorite
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITE_LABELS) as [ImputationPriorite, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Délai */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Délai (optionnel)</label>
              <Input
                value={formData.delai || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, delai: e.target.value }))}
                placeholder="Ex: Sous 48h, Urgent, 25/01/2026..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.destinataire.trim() || isMutating}
            >
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLigne ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La ligne d'imputation sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ImputationDGSection;
