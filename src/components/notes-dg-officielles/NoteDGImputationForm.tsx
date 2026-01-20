/**
 * Formulaire d'ajout d'une imputation sur une Note DG
 */

import { useState } from "react";
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
  useNoteDGImputations,
  useNotesDirectionGenerale,
  CreateImputationInput,
  InstructionType,
  ImputationPriorite,
  INSTRUCTION_TYPES,
  PRIORITES,
} from "@/hooks/useNotesDirectionGenerale";

interface NoteDGImputationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
}

const INITIAL_STATE: Omit<CreateImputationInput, "note_id"> = {
  destinataire: "",
  direction_id: null,
  instruction_type: "DIFFUSION",
  priorite: "normale",
  delai: null,
  commentaire: null,
};

export function NoteDGImputationForm({
  open,
  onOpenChange,
  noteId,
}: NoteDGImputationFormProps) {
  const { directions } = useNotesDirectionGenerale();
  const { addImputation, isAdding } = useNoteDGImputations(noteId);
  const [formData, setFormData] = useState<Omit<CreateImputationInput, "note_id">>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.destinataire?.trim()) {
      newErrors.destinataire = "Le destinataire est obligatoire";
    }
    if (!formData.instruction_type) {
      newErrors.instruction_type = "Le type d'instruction est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addImputation({
        note_id: noteId,
        ...formData,
      });
      setFormData(INITIAL_STATE);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  const handleChange = (
    field: keyof Omit<CreateImputationInput, "note_id">,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une imputation</DialogTitle>
          <DialogDescription>
            Définissez un destinataire et les instructions associées
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="destinataire">Destinataire *</Label>
            <Input
              id="destinataire"
              value={formData.destinataire}
              onChange={(e) => handleChange("destinataire", e.target.value)}
              placeholder="Nom ou fonction du destinataire"
              className={errors.destinataire ? "border-destructive" : ""}
            />
            {errors.destinataire && (
              <p className="text-sm text-destructive">{errors.destinataire}</p>
            )}
          </div>

          {/* Direction (optionnel) */}
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

          {/* Type d'instruction */}
          <div className="space-y-2">
            <Label htmlFor="instruction_type">Type d'instruction *</Label>
            <Select
              value={formData.instruction_type}
              onValueChange={(value) =>
                handleChange("instruction_type", value as InstructionType)
              }
            >
              <SelectTrigger className={errors.instruction_type ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTRUCTION_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.instruction_type && (
              <p className="text-sm text-destructive">{errors.instruction_type}</p>
            )}
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priorite">Priorité</Label>
            <Select
              value={formData.priorite || "normale"}
              onValueChange={(value) =>
                handleChange("priorite", value as ImputationPriorite)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la priorité" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Délai */}
          <div className="space-y-2">
            <Label htmlFor="delai">Délai (optionnel)</Label>
            <Input
              id="delai"
              type="date"
              value={formData.delai || ""}
              onChange={(e) => handleChange("delai", e.target.value || null)}
            />
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire || ""}
              onChange={(e) => handleChange("commentaire", e.target.value || null)}
              placeholder="Instructions complémentaires..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NoteDGImputationForm;
