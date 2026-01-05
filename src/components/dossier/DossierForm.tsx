import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DossierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  initialData?: any;
}

export function DossierForm({ open, onOpenChange, onSubmit, initialData }: DossierFormProps) {
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<{ id: string; label: string; sigle: string | null }[]>([]);
  const [formData, setFormData] = useState({
    objet: "",
    direction_id: "",
    montant_estime: 0,
  });

  useEffect(() => {
    if (open) {
      fetchDirections();
      if (initialData) {
        setFormData({
          objet: initialData.objet || "",
          direction_id: initialData.direction_id || "",
          montant_estime: initialData.montant_estime || 0,
        });
      } else {
        setFormData({ objet: "", direction_id: "", montant_estime: 0 });
      }
    }
  }, [open, initialData]);

  const fetchDirections = async () => {
    const { data } = await supabase
      .from("directions")
      .select("id, label, sigle")
      .eq("est_active", true)
      .order("label");
    setDirections(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (result) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier le dossier" : "Nouveau dossier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objet">Objet *</Label>
            <Textarea
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              placeholder="Description de la demande..."
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
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
                    {dir.sigle ? `${dir.sigle} - ${dir.label}` : dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">Montant estimé</Label>
            <Input
              id="montant"
              type="number"
              value={formData.montant_estime}
              onChange={(e) => setFormData({ ...formData, montant_estime: parseFloat(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.objet}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Modifier" : "Créer le dossier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
