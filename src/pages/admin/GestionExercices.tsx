import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Exercice {
  id: string;
  annee: number;
  statut: string;
  date_ouverture: string | null;
  date_cloture: string | null;
  est_actif: boolean;
}

export default function GestionExercices() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercice, setEditingExercice] = useState<Exercice | null>(null);
  const [formData, setFormData] = useState({
    annee: new Date().getFullYear() + 1,
    statut: "ouvert",
    date_ouverture: "",
    date_cloture: "",
  });

  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .order("annee", { ascending: false });

      if (error) throw error;
      return data as Exercice[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("exercices_budgetaires")
          .update({
            statut: data.statut,
            date_ouverture: data.date_ouverture || null,
            date_cloture: data.date_cloture || null,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exercices_budgetaires").insert({
          annee: data.annee,
          statut: data.statut,
          date_ouverture: data.date_ouverture || null,
          date_cloture: data.date_cloture || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercices-admin"] });
      queryClient.invalidateQueries({ queryKey: ["exercices-budgetaires"] });
      setIsDialogOpen(false);
      setEditingExercice(null);
      toast.success(editingExercice ? "Exercice modifié" : "Exercice créé");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_actif }: { id: string; est_actif: boolean }) => {
      const { error } = await supabase
        .from("exercices_budgetaires")
        .update({ est_actif })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercices-admin"] });
      queryClient.invalidateQueries({ queryKey: ["exercices-budgetaires"] });
      toast.success("Statut mis à jour");
    },
  });

  const openCreate = () => {
    setEditingExercice(null);
    setFormData({
      annee: new Date().getFullYear() + 1,
      statut: "ouvert",
      date_ouverture: "",
      date_cloture: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (exercice: Exercice) => {
    setEditingExercice(exercice);
    setFormData({
      annee: exercice.annee,
      statut: exercice.statut,
      date_ouverture: exercice.date_ouverture || "",
      date_cloture: exercice.date_cloture || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingExercice?.id,
    });
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">En cours</Badge>;
      case "ouvert":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Ouvert</Badge>;
      case "cloture":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Clôturé</Badge>;
      case "archive":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Archivé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Exercices Budgétaires</h1>
          <p className="text-muted-foreground">
            Gérez les exercices budgétaires de l'application
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel exercice
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Année</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'ouverture</TableHead>
                <TableHead>Date de clôture</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercices?.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {ex.annee}
                    </div>
                  </TableCell>
                  <TableCell>{getStatutBadge(ex.statut)}</TableCell>
                  <TableCell>
                    {ex.date_ouverture
                      ? format(new Date(ex.date_ouverture), "dd MMM yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {ex.date_cloture
                      ? format(new Date(ex.date_cloture), "dd MMM yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={ex.est_actif ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: ex.id,
                          est_actif: !ex.est_actif,
                        })
                      }
                    >
                      {ex.est_actif ? "Actif" : "Inactif"}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExercice ? "Modifier l'exercice" : "Nouvel exercice"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={formData.annee}
                onChange={(e) =>
                  setFormData({ ...formData, annee: parseInt(e.target.value) })
                }
                disabled={!!editingExercice}
                min={2020}
                max={2100}
              />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouvert">Ouvert</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="cloture">Clôturé</SelectItem>
                  <SelectItem value="archive">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d'ouverture</Label>
              <Input
                type="date"
                value={formData.date_ouverture}
                onChange={(e) =>
                  setFormData({ ...formData, date_ouverture: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date de clôture</Label>
              <Input
                type="date"
                value={formData.date_cloture}
                onChange={(e) =>
                  setFormData({ ...formData, date_cloture: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingExercice ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
