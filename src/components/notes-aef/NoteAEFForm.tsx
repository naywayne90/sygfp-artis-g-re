import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteAEF, useNotesAEF } from "@/hooks/useNotesAEF";
import { Loader2 } from "lucide-react";

interface NoteAEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteAEF | null;
}

const formatNumber = (value: string) => {
  const number = value.replace(/\D/g, "");
  return number ? parseInt(number, 10).toLocaleString("fr-FR") : "";
};

const parseNumber = (value: string) => {
  return parseInt(value.replace(/\s/g, "").replace(/,/g, ""), 10) || 0;
};

export function NoteAEFForm({ open, onOpenChange, note }: NoteAEFFormProps) {
  const { createNote, updateNote, directions, isCreating, isUpdating } = useNotesAEF();

  const [formData, setFormData] = useState({
    objet: "",
    contenu: "",
    direction_id: "",
    priorite: "normale",
    montant_estime: "",
  });

  useEffect(() => {
    if (note) {
      setFormData({
        objet: note.objet || "",
        contenu: note.contenu || "",
        direction_id: note.direction_id || "",
        priorite: note.priorite || "normale",
        montant_estime: note.montant_estime ? formatNumber(note.montant_estime.toString()) : "",
      });
    } else {
      setFormData({
        objet: "",
        contenu: "",
        direction_id: "",
        priorite: "normale",
        montant_estime: "",
      });
    }
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        objet: formData.objet,
        contenu: formData.contenu || null,
        direction_id: formData.direction_id || null,
        priorite: formData.priorite,
        montant_estime: parseNumber(formData.montant_estime),
      };

      if (note) {
        await updateNote({ id: note.id, ...payload });
      } else {
        await createNote(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {note ? "Modifier la note AEF" : "Nouvelle Note AEF"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="objet">Objet *</Label>
              <Input
                id="objet"
                value={formData.objet}
                onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                required
                placeholder="Objet de la demande"
              />
            </div>

            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction_id}
                onValueChange={(value) => setFormData({ ...formData, direction_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle || dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priorite">Urgence</Label>
              <Select
                value={formData.priorite}
                onValueChange={(value) => setFormData({ ...formData, priorite: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="montant">Montant estimé (FCFA)</Label>
              <Input
                id="montant"
                value={formData.montant_estime}
                onChange={(e) =>
                  setFormData({ ...formData, montant_estime: formatNumber(e.target.value) })
                }
                placeholder="0"
                className="text-right"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="contenu">Description / Justificatifs</Label>
              <Textarea
                id="contenu"
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                placeholder="Description détaillée de la demande et justificatifs"
                rows={5}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.objet}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {note ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
