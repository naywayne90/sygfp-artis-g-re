import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteSEF, useNotesSEF } from "@/hooks/useNotesSEF";
import { Loader2 } from "lucide-react";

interface NoteSEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteSEF | null;
}

export function NoteSEFForm({ open, onOpenChange, note }: NoteSEFFormProps) {
  const { createNote, updateNote, directions, profiles, isCreating, isUpdating } = useNotesSEF();

  const [formData, setFormData] = useState({
    objet: "",
    description: "",
    direction_id: "",
    demandeur_id: "",
    urgence: "normale",
    commentaire: "",
  });

  useEffect(() => {
    if (note) {
      setFormData({
        objet: note.objet || "",
        description: note.description || "",
        direction_id: note.direction_id || "",
        demandeur_id: note.demandeur_id || "",
        urgence: note.urgence || "normale",
        commentaire: note.commentaire || "",
      });
    } else {
      setFormData({
        objet: "",
        description: "",
        direction_id: "",
        demandeur_id: "",
        urgence: "normale",
        commentaire: "",
      });
    }
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (note) {
        await updateNote({ id: note.id, ...formData });
      } else {
        await createNote(formData);
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
            {note ? "Modifier la note SEF" : "Nouvelle Note SEF"}
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
                placeholder="Objet de la note"
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
              <Label htmlFor="demandeur">Demandeur</Label>
              <Select
                value={formData.demandeur_id}
                onValueChange={(value) => setFormData({ ...formData, demandeur_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un demandeur" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name || ""} {profile.last_name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgence">Urgence</Label>
              <Select
                value={formData.urgence}
                onValueChange={(value) => setFormData({ ...formData, urgence: value })}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de la note"
                rows={4}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                placeholder="Commentaires additionnels"
                rows={2}
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
