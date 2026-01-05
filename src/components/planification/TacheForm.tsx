import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { type Tache, type TacheFormData, useTacheReferences } from "@/hooks/useTaches";

interface TacheFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TacheFormData) => void;
  editingTache?: Tache | null;
  isSubmitting?: boolean;
}

const initialFormData: TacheFormData = {
  code: "",
  libelle: "",
  description: "",
  sous_activite_id: "",
  date_debut: "",
  date_fin: "",
  duree_prevue: undefined,
  responsable_id: "",
  raci_responsable: "",
  raci_accountable: "",
  raci_consulted: [],
  raci_informed: [],
  avancement: 0,
  budget_line_id: "",
  budget_prevu: 0,
  livrables: [],
  statut: "planifie",
  priorite: "normale",
};

export function TacheForm({ isOpen, onClose, onSubmit, editingTache, isSubmitting }: TacheFormProps) {
  const [formData, setFormData] = useState<TacheFormData>(initialFormData);
  const [newLivrable, setNewLivrable] = useState("");
  const { sousActivites, profiles, budgetLines } = useTacheReferences();

  useEffect(() => {
    if (editingTache) {
      setFormData({
        code: editingTache.code,
        libelle: editingTache.libelle,
        description: editingTache.description || "",
        sous_activite_id: editingTache.sous_activite_id,
        date_debut: editingTache.date_debut || "",
        date_fin: editingTache.date_fin || "",
        duree_prevue: editingTache.duree_prevue,
        responsable_id: editingTache.responsable_id || "",
        raci_responsable: editingTache.raci_responsable || "",
        raci_accountable: editingTache.raci_accountable || "",
        raci_consulted: editingTache.raci_consulted || [],
        raci_informed: editingTache.raci_informed || [],
        avancement: editingTache.avancement,
        budget_line_id: editingTache.budget_line_id || "",
        budget_prevu: editingTache.budget_prevu,
        livrables: editingTache.livrables || [],
        statut: editingTache.statut,
        priorite: editingTache.priorite,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingTache, isOpen]);

  const handleSubmit = () => {
    if (!formData.code || !formData.libelle || !formData.sous_activite_id) {
      return;
    }
    onSubmit(formData);
  };

  const addLivrable = () => {
    if (newLivrable.trim()) {
      setFormData({
        ...formData,
        livrables: [...(formData.livrables || []), newLivrable.trim()],
      });
      setNewLivrable("");
    }
  };

  const removeLivrable = (index: number) => {
    setFormData({
      ...formData,
      livrables: formData.livrables?.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTache ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            {editingTache ? "Modifiez les informations de la tâche" : "Créez une nouvelle tâche de planification physique"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="raci">RACI</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="T1.1.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Sous-activité *</Label>
                <Select
                  value={formData.sous_activite_id}
                  onValueChange={(v) => setFormData({ ...formData, sous_activite_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sousActivites?.map((sa) => (
                      <SelectItem key={sa.id} value={sa.id}>
                        {sa.code} - {sa.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                placeholder="Libellé de la tâche"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de la tâche..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(v) => setFormData({ ...formData, statut: v as TacheFormData['statut'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planifie">Planifié</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                    <SelectItem value="en_retard">En retard</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={formData.priorite}
                  onValueChange={(v) => setFormData({ ...formData, priorite: v as TacheFormData['priorite'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Livrables</Label>
              <div className="flex gap-2">
                <Input
                  value={newLivrable}
                  onChange={(e) => setNewLivrable(e.target.value)}
                  placeholder="Ajouter un livrable..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLivrable())}
                />
                <Button type="button" variant="outline" onClick={addLivrable}>
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.livrables?.map((livrable, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {livrable}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeLivrable(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planning" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin prévue</Label>
                <Input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée prévue (jours)</Label>
                <Input
                  type="number"
                  value={formData.duree_prevue || ""}
                  onChange={(e) => setFormData({ ...formData, duree_prevue: parseInt(e.target.value) || undefined })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Avancement (%)</Label>
                <Input
                  type="number"
                  value={formData.avancement || 0}
                  onChange={(e) => setFormData({ ...formData, avancement: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsable principal</Label>
              <Select
                value={formData.responsable_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, responsable_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="raci" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Définissez la matrice RACI pour cette tâche (Responsable, Accountable, Consulted, Informed)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>R - Responsable (Réalise)</Label>
                <Select
                  value={formData.raci_responsable || "none"}
                  onValueChange={(v) => setFormData({ ...formData, raci_responsable: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>A - Accountable (Approuve)</Label>
                <Select
                  value={formData.raci_accountable || "none"}
                  onValueChange={(v) => setFormData({ ...formData, raci_accountable: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              Les rôles "Consulted" et "Informed" peuvent être définis via les paramètres avancés.
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Ligne budgétaire associée</Label>
              <Select
                value={formData.budget_line_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, budget_line_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {budgetLines?.map((bl) => (
                    <SelectItem key={bl.id} value={bl.id}>
                      {bl.code} - {bl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget prévu (FCFA)</Label>
              <Input
                type="number"
                value={formData.budget_prevu || ""}
                onChange={(e) => setFormData({ ...formData, budget_prevu: parseFloat(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {editingTache ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
