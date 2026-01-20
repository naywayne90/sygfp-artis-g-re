/**
 * Formulaire de création/édition d'une Note Direction Générale
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import {
  useNotesDirectionGenerale,
  NoteDirectionGenerale,
  CreateNoteDGInput,
} from "@/hooks/useNotesDirectionGenerale";
import { format } from "date-fns";

interface NoteDGFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteDirectionGenerale | null;
}

const INITIAL_FORM_STATE: CreateNoteDGInput = {
  date_note: format(new Date(), "yyyy-MM-dd"),
  destinataire: "",
  objet: "",
  direction_id: null,
  nom_prenoms: "",
  expose: "",
  avis: "",
  recommandations: "",
  nb_pages: 0,
};

export function NoteDGForm({ open, onOpenChange, note }: NoteDGFormProps) {
  const { createNote, updateNote, directions, isCreating, isUpdating } =
    useNotesDirectionGenerale();
  const [formData, setFormData] = useState<CreateNoteDGInput>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!note;
  const isLoading = isCreating || isUpdating;

  // Initialiser le formulaire avec les données de la note si édition
  useEffect(() => {
    if (note) {
      setFormData({
        date_note: note.date_note || format(new Date(), "yyyy-MM-dd"),
        destinataire: note.destinataire || "",
        objet: note.objet || "",
        direction_id: note.direction_id || null,
        nom_prenoms: note.nom_prenoms || "",
        expose: note.expose || "",
        avis: note.avis || "",
        recommandations: note.recommandations || "",
        nb_pages: note.nb_pages || 0,
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
  }, [note, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.destinataire?.trim()) {
      newErrors.destinataire = "Le destinataire est obligatoire";
    }
    if (!formData.objet?.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }
    if (!formData.date_note) {
      newErrors.date_note = "La date est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing && note) {
        await updateNote({
          id: note.id,
          ...formData,
        });
      } else {
        await createNote(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleChange = (
    field: keyof CreateNoteDGInput,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la note DG" : "Nouvelle note DG"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la note"
              : "Créez une nouvelle note officielle du Directeur Général"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* En-tête */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_note">Date de la note *</Label>
              <Input
                id="date_note"
                type="date"
                value={formData.date_note || ""}
                onChange={(e) => handleChange("date_note", e.target.value)}
                className={errors.date_note ? "border-destructive" : ""}
              />
              {errors.date_note && (
                <p className="text-sm text-destructive">{errors.date_note}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction_id">Direction (optionnel)</Label>
              <Select
                value={formData.direction_id || ""}
                onValueChange={(value) =>
                  handleChange("direction_id", value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle ? `${dir.sigle} - ${dir.label}` : dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="destinataire">Destinataire *</Label>
            <Input
              id="destinataire"
              value={formData.destinataire || ""}
              onChange={(e) => handleChange("destinataire", e.target.value)}
              placeholder="Ex: Tous les Directeurs, M. le Directeur de..."
              className={errors.destinataire ? "border-destructive" : ""}
            />
            {errors.destinataire && (
              <p className="text-sm text-destructive">{errors.destinataire}</p>
            )}
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet">Objet *</Label>
            <Input
              id="objet"
              value={formData.objet || ""}
              onChange={(e) => handleChange("objet", e.target.value)}
              placeholder="Objet de la note"
              className={errors.objet ? "border-destructive" : ""}
            />
            {errors.objet && (
              <p className="text-sm text-destructive">{errors.objet}</p>
            )}
          </div>

          {/* Nom et Prénoms (signataire) */}
          <div className="space-y-2">
            <Label htmlFor="nom_prenoms">Signataire</Label>
            <Input
              id="nom_prenoms"
              value={formData.nom_prenoms || ""}
              onChange={(e) => handleChange("nom_prenoms", e.target.value)}
              placeholder="Ex: Le Directeur Général"
            />
          </div>

          {/* Corps de la note */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expose">Exposé</Label>
              <Textarea
                id="expose"
                value={formData.expose || ""}
                onChange={(e) => handleChange("expose", e.target.value)}
                placeholder="Description du contexte et des faits..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avis">Avis</Label>
              <Textarea
                id="avis"
                value={formData.avis || ""}
                onChange={(e) => handleChange("avis", e.target.value)}
                placeholder="Avis et observations..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommandations">Recommandations</Label>
              <Textarea
                id="recommandations"
                value={formData.recommandations || ""}
                onChange={(e) => handleChange("recommandations", e.target.value)}
                placeholder="Actions recommandées ou instructions..."
                rows={3}
              />
            </div>
          </div>

          {/* Nombre de pages */}
          <div className="space-y-2">
            <Label htmlFor="nb_pages">Nombre de pages</Label>
            <Input
              id="nb_pages"
              type="number"
              min="0"
              value={formData.nb_pages || 0}
              onChange={(e) => handleChange("nb_pages", parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NoteDGForm;
