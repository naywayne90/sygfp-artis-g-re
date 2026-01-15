import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NoteSEF, useNotesSEF } from "@/hooks/useNotesSEF";
import { Loader2, Building2, User } from "lucide-react";

interface NoteSEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteSEF | null;
}

export function NoteSEFForm({ open, onOpenChange, note }: NoteSEFFormProps) {
  const { createNote, updateNote, directions, profiles, beneficiaires, isCreating, isUpdating } = useNotesSEF();

  // Type de bénéficiaire: "externe" (prestataire) ou "interne" (profil)
  const [typeBeneficiaire, setTypeBeneficiaire] = useState<"externe" | "interne" | "">("");

  const [formData, setFormData] = useState({
    objet: "",
    description: "",
    direction_id: "",
    demandeur_id: "",
    beneficiaire_id: "",
    beneficiaire_interne_id: "",
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
        beneficiaire_id: note.beneficiaire_id || "",
        beneficiaire_interne_id: note.beneficiaire_interne_id || "",
        urgence: note.urgence || "normale",
        commentaire: note.commentaire || "",
      });
      // Déterminer le type de bénéficiaire selon les données existantes
      if (note.beneficiaire_id) {
        setTypeBeneficiaire("externe");
      } else if (note.beneficiaire_interne_id) {
        setTypeBeneficiaire("interne");
      } else {
        setTypeBeneficiaire("");
      }
    } else {
      setFormData({
        objet: "",
        description: "",
        direction_id: "",
        demandeur_id: "",
        beneficiaire_id: "",
        beneficiaire_interne_id: "",
        urgence: "normale",
        commentaire: "",
      });
      setTypeBeneficiaire("");
    }
  }, [note, open]);

  const handleTypeBeneficiaireChange = (value: "externe" | "interne") => {
    setTypeBeneficiaire(value);
    // Réinitialiser les deux champs quand on change de type
    setFormData(prev => ({
      ...prev,
      beneficiaire_id: "",
      beneficiaire_interne_id: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Préparer les données en nettoyant le bénéficiaire non utilisé
      const dataToSend = {
        ...formData,
        beneficiaire_id: typeBeneficiaire === "externe" ? formData.beneficiaire_id : null,
        beneficiaire_interne_id: typeBeneficiaire === "interne" ? formData.beneficiaire_interne_id : null,
      };

      if (note) {
        await updateNote({ id: note.id, ...dataToSend });
      } else {
        await createNote(dataToSend);
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

            {/* Section Bénéficiaire */}
            <div className="col-span-2 space-y-3 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">Bénéficiaire</Label>
              
              <RadioGroup
                value={typeBeneficiaire}
                onValueChange={(val) => handleTypeBeneficiaireChange(val as "externe" | "interne")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="externe" id="beneficiaire-externe" />
                  <Label htmlFor="beneficiaire-externe" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Prestataire externe
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interne" id="beneficiaire-interne" />
                  <Label htmlFor="beneficiaire-interne" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Agent interne
                  </Label>
                </div>
              </RadioGroup>

              {typeBeneficiaire === "externe" && (
                <Select
                  value={formData.beneficiaire_id}
                  onValueChange={(value) => setFormData({ ...formData, beneficiaire_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiaires.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.raison_sociale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {typeBeneficiaire === "interne" && (
                <Select
                  value={formData.beneficiaire_interne_id}
                  onValueChange={(value) => setFormData({ ...formData, beneficiaire_interne_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name || ""} {profile.last_name || ""} {profile.email ? `(${profile.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!typeBeneficiaire && (
                <p className="text-sm text-muted-foreground italic">
                  Sélectionnez le type de bénéficiaire ci-dessus
                </p>
              )}
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
