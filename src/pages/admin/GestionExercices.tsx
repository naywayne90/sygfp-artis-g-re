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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Pencil, Calendar, Loader2, Lock, Unlock, CheckCircle2, AlertTriangle, FileSpreadsheet, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExerciceInitWizard } from "@/components/exercice/ExerciceInitWizard";

interface Exercice {
  id: string;
  annee: number;
  statut: string;
  date_ouverture: string | null;
  date_cloture: string | null;
  est_actif: boolean;
  budget_valide: boolean;
  budget_valide_at: string | null;
  budget_total: number | null;
  budget_lignes_count: number | null;
}

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(1)} M`;
  }
  return new Intl.NumberFormat('fr-FR').format(montant);
};

export default function GestionExercices() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showInitWizard, setShowInitWizard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
            Gérez les exercices budgétaires et leur initialisation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Aide
          </Button>
          <Button variant="outline" onClick={() => setShowInitWizard(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Assistant d'initialisation
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel exercice
          </Button>
        </div>
      </div>

      {/* Section d'aide */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
                À propos de ce module
              </CardTitle>
              <CardDescription>
                Comprendre et gérer les exercices budgétaires de votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">📅 Qu'est-ce qu'un exercice budgétaire ?</h4>
                <p className="text-muted-foreground">
                  Un exercice budgétaire représente une année fiscale de gestion. Il définit la période pendant laquelle 
                  le budget est planifié, exécuté et suivi. Chaque exercice contient les lignes budgétaires, les engagements, 
                  liquidations et paiements associés à cette année.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">📊 Les indicateurs affichés</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• <strong>Total exercices</strong> : Nombre d'exercices créés dans le système</li>
                    <li>• <strong>Exercice actif</strong> : L'année de l'exercice actuellement en cours d'exécution</li>
                    <li>• <strong>Budgets validés</strong> : Exercices dont le budget a été officiellement validé</li>
                    <li>• <strong>En attente</strong> : Exercices ouverts mais non encore validés</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🔄 Cycle de vie d'un exercice</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• <strong>Ouvert</strong> : L'exercice est créé, le budget peut être préparé</li>
                    <li>• <strong>En cours</strong> : L'exercice est actif, les opérations peuvent être effectuées</li>
                    <li>• <strong>Clôturé</strong> : L'exercice est terminé, plus de nouvelles opérations</li>
                    <li>• <strong>Archivé</strong> : L'exercice est archivé pour consultation uniquement</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚙️ Actions disponibles</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• <strong>Nouvel exercice</strong> : Créer un nouvel exercice pour une année donnée</li>
                  <li>• <strong>Assistant d'initialisation</strong> : Importer les lignes budgétaires depuis un fichier Excel</li>
                  <li>• <strong>Modifier</strong> : Changer le statut ou les dates d'un exercice existant</li>
                  <li>• <strong>Actif/Inactif</strong> : Activer ou désactiver l'accès à un exercice</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold mb-1 text-amber-700 dark:text-amber-400">💡 Bon à savoir</h4>
                <p className="text-muted-foreground">
                  Un seul exercice peut être "En cours" à la fois. Le budget doit être validé avant de pouvoir 
                  effectuer des engagements. Les exercices clôturés restent consultables mais ne permettent plus 
                  de nouvelles opérations.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total exercices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{exercices?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Exercice actif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {exercices?.find(e => e.statut === "en_cours")?.annee || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Budgets validés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {exercices?.filter(e => e.budget_valide).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {exercices?.filter(e => e.statut === "ouvert" && !e.budget_valide).length || 0}
            </p>
          </CardContent>
        </Card>
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
                <TableHead>Budget</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercices?.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ex.budget_valide ? (
                        <Lock className="h-4 w-4 text-success" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {ex.annee}
                    </div>
                  </TableCell>
                  <TableCell>{getStatutBadge(ex.statut)}</TableCell>
                  <TableCell>
                    {ex.budget_total ? formatMontant(ex.budget_total) + " FCFA" : "-"}
                  </TableCell>
                  <TableCell>{ex.budget_lignes_count || 0}</TableCell>
                  <TableCell>
                    {ex.date_ouverture
                      ? format(new Date(ex.date_ouverture), "dd/MM/yyyy", { locale: fr })
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

      {/* Init Wizard */}
      <ExerciceInitWizard open={showInitWizard} onOpenChange={setShowInitWizard} />
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
