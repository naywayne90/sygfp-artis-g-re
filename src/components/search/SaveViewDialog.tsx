import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bookmark, Star } from "lucide-react";
import { SavedViewFilters } from "@/hooks/useSavedViews";

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SavedViewFilters;
  onSave: (name: string, description: string, isDefault: boolean) => void;
}

export function SaveViewDialog({
  open,
  onOpenChange,
  filters,
  onSave,
}: SaveViewDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), isDefault);
    // Reset form
    setName("");
    setDescription("");
    setIsDefault(false);
  };

  const getFiltersSummary = () => {
    const parts: string[] = [];
    if (filters.search) parts.push(`Recherche: "${filters.search}"`);
    if (filters.statut) parts.push(`Statut: ${filters.statut}`);
    if (filters.etape) parts.push(`Étape: ${filters.etape}`);
    if (filters.direction_id) parts.push("Direction filtrée");
    if (filters.mes_dossiers) parts.push("Mes dossiers uniquement");
    if (filters.en_retard) parts.push("En retard");
    if (filters.date_debut || filters.date_fin) parts.push("Période filtrée");
    if (filters.montant_min !== null || filters.montant_max !== null) {
      parts.push("Montant filtré");
    }
    return parts.length > 0 ? parts.join(", ") : "Aucun filtre actif";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Sauvegarder la vue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-name">Nom de la vue *</Label>
            <Input
              id="view-name"
              placeholder="Ex: Dossiers à valider cette semaine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="view-description">Description (optionnelle)</Label>
            <Textarea
              id="view-description"
              placeholder="Décrivez cette vue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <Label htmlFor="is-default" className="text-sm cursor-pointer">
                Définir comme vue par défaut
              </Label>
            </div>
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Filtres inclus:</p>
            <p className="text-sm">{getFiltersSummary()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Bookmark className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
