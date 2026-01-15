import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NoteAEF, useNotesAEF } from "@/hooks/useNotesAEF";
import { Loader2, Link2, FileText, AlertTriangle } from "lucide-react";

interface NoteAEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteAEF | null;
  initialNoteSEFId?: string | null; // Pré-sélection depuis Notes SEF
}

const formatNumber = (value: string) => {
  const number = value.replace(/\D/g, "");
  return number ? parseInt(number, 10).toLocaleString("fr-FR") : "";
};

const parseNumber = (value: string) => {
  return parseInt(value.replace(/\s/g, "").replace(/,/g, ""), 10) || 0;
};

export function NoteAEFForm({ open, onOpenChange, note, initialNoteSEFId }: NoteAEFFormProps) {
  const { createNote, updateNote, directions, notesSEFValidees, isCreating, isUpdating } = useNotesAEF();

  const [formData, setFormData] = useState({
    objet: "",
    contenu: "",
    direction_id: "",
    priorite: "normale",
    montant_estime: "",
    note_sef_id: "", // POINT 2: Liaison obligatoire avec Note SEF validée
  });

  const selectedNoteSEF = notesSEFValidees.find(n => n.id === formData.note_sef_id);

  useEffect(() => {
    if (note) {
      setFormData({
        objet: note.objet || "",
        contenu: note.contenu || "",
        direction_id: note.direction_id || "",
        priorite: note.priorite || "normale",
        montant_estime: note.montant_estime ? formatNumber(note.montant_estime.toString()) : "",
        note_sef_id: (note as any).note_sef_id || "",
      });
    } else if (initialNoteSEFId) {
      // Pré-remplir avec la note SEF depuis l'URL
      setFormData(prev => ({
        ...prev,
        note_sef_id: initialNoteSEFId,
      }));
    } else {
      setFormData({
        objet: "",
        contenu: "",
        direction_id: "",
        priorite: "normale",
        montant_estime: "",
        note_sef_id: "",
      });
    }
  }, [note, open, initialNoteSEFId]);

  // Pré-remplir depuis la note SEF sélectionnée
  useEffect(() => {
    if (selectedNoteSEF && !note) {
      setFormData(prev => ({
        ...prev,
        objet: prev.objet || selectedNoteSEF.objet,
        direction_id: prev.direction_id || selectedNoteSEF.direction_id || "",
      }));
    }
  }, [selectedNoteSEF, note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // POINT 2: Vérification obligatoire de la liaison
    if (!formData.note_sef_id) {
      return;
    }

    try {
      const payload = {
        objet: formData.objet,
        contenu: formData.contenu || null,
        direction_id: formData.direction_id || null,
        priorite: formData.priorite,
        montant_estime: parseNumber(formData.montant_estime),
        note_sef_id: formData.note_sef_id, // Liaison vers Note SEF
      };

      if (note) {
        await updateNote({ id: note.id, ...payload } as any);
      } else {
        await createNote(payload as any);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? "Modifier la note AEF" : "Nouvelle Note AEF"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* POINT 2: Sélection obligatoire de la Note SEF */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-primary" />
                <Label className="font-medium">Note SEF validée (obligatoire) *</Label>
              </div>
              
              <Select
                value={formData.note_sef_id}
                onValueChange={(value) => setFormData({ ...formData, note_sef_id: value })}
              >
                <SelectTrigger className={!formData.note_sef_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une Note SEF validée..." />
                </SelectTrigger>
                <SelectContent>
                  {notesSEFValidees.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucune Note SEF validée disponible
                    </div>
                  ) : (
                    notesSEFValidees.map((noteSEF) => (
                      <SelectItem key={noteSEF.id} value={noteSEF.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{noteSEF.numero}</span>
                          <span className="truncate max-w-[200px]">{noteSEF.objet}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedNoteSEF && (
                <div className="mt-3 p-3 bg-background rounded-lg border">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">N° Note SEF:</span>
                      <p className="font-mono font-medium">{selectedNoteSEF.numero}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Objet:</span>
                      <p className="truncate">{selectedNoteSEF.objet}</p>
                    </div>
                  </div>
                </div>
              )}

              {!formData.note_sef_id && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Une Note AEF doit obligatoirement être liée à une Note SEF validée.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

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
            <Button 
              type="submit" 
              disabled={isLoading || !formData.objet || !formData.note_sef_id}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {note ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}