// @ts-nocheck
/**
 * MajFeuillesRoutePage - Mise à jour des feuilles de routes
 *
 * Permet la modification en masse des feuilles de route
 * comme dans l'ancien système (synchroUpdateActivite.aspx)
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileEdit,
  Search,
  RefreshCw,
  Filter,
  Save,
  Edit,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeuilleRoute {
  id: string;
  code: string;
  libelle: string;
  direction_id: string;
  direction_code: string;
  direction_label: string;
  mission_id: string;
  mission_code: string;
  mission_libelle: string;
  os_id: string;
  os_code: string;
  os_libelle: string;
  action_id: string;
  action_code: string;
  action_libelle: string;
  poids: number;
  budget_prevu: number;
  status: string;
}

export default function MajFeuillesRoutePage() {
  const { exerciceId, exercice, isReadOnly } = useExercice();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedMission, setSelectedMission] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeuilleRoute | null>(null);
  const [editForm, setEditForm] = useState({
    libelle: "",
    poids: 0,
    budget_prevu: 0
  });

  // Charger les filtres
  const { data: filterData } = useQuery({
    queryKey: ["feuilles-route-filters", exerciceId],
    queryFn: async () => {
      const [directionsRes, missionsRes] = await Promise.all([
        supabase.from("directions").select("id, code, label").order("code"),
        supabase.from("missions").select("id, code, libelle").order("code")
      ]);

      return {
        directions: directionsRes.data || [],
        missions: missionsRes.data || []
      };
    },
    enabled: !!exerciceId
  });

  // Charger les feuilles de route (activités)
  const { data: feuilles, isLoading, refetch } = useQuery({
    queryKey: ["feuilles-route-maj", exerciceId, selectedDirection, selectedMission],
    queryFn: async () => {
      let query = supabase
        .from("activites")
        .select(`
          id,
          code,
          libelle,
          poids,
          budget_prevu,
          status,
          action:actions!inner(
            id,
            code,
            libelle,
            mission:missions!inner(
              id,
              code,
              libelle,
              os:objectifs_strategiques!inner(
                id,
                code,
                libelle,
                direction:directions!inner(
                  id,
                  code,
                  label
                )
              )
            )
          )
        `)
        .eq("exercice_id", exerciceId);

      const { data, error } = await query.order("code");

      if (error) throw error;

      let result = (data || []).map((item: any) => ({
        id: item.id,
        code: item.code,
        libelle: item.libelle,
        direction_id: item.action?.mission?.os?.direction?.id || "",
        direction_code: item.action?.mission?.os?.direction?.code || "-",
        direction_label: item.action?.mission?.os?.direction?.label || "-",
        mission_id: item.action?.mission?.id || "",
        mission_code: item.action?.mission?.code || "-",
        mission_libelle: item.action?.mission?.libelle || "-",
        os_id: item.action?.mission?.os?.id || "",
        os_code: item.action?.mission?.os?.code || "-",
        os_libelle: item.action?.mission?.os?.libelle || "-",
        action_id: item.action?.id || "",
        action_code: item.action?.code || "-",
        action_libelle: item.action?.libelle || "-",
        poids: item.poids || 0,
        budget_prevu: item.budget_prevu || 0,
        status: item.status || "actif"
      })) as FeuilleRoute[];

      // Filtrer par direction et mission
      if (selectedDirection !== "all") {
        result = result.filter(f => f.direction_id === selectedDirection);
      }
      if (selectedMission !== "all") {
        result = result.filter(f => f.mission_id === selectedMission);
      }

      return result;
    },
    enabled: !!exerciceId
  });

  // Mutation pour mise à jour
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; libelle: string; poids: number; budget_prevu: number }) => {
      const { error } = await supabase
        .from("activites")
        .update({
          libelle: data.libelle,
          poids: data.poids,
          budget_prevu: data.budget_prevu
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feuille de route mise à jour");
      queryClient.invalidateQueries({ queryKey: ["feuilles-route-maj"] });
      setEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  });

  // Filtrer par recherche
  const filteredFeuilles = useMemo(() => {
    if (!feuilles) return [];
    if (!searchQuery) return feuilles;

    const query = searchQuery.toLowerCase();
    return feuilles.filter(f =>
      f.libelle.toLowerCase().includes(query) ||
      f.code.toLowerCase().includes(query) ||
      f.direction_label.toLowerCase().includes(query) ||
      f.mission_libelle.toLowerCase().includes(query)
    );
  }, [feuilles, searchQuery]);

  const handleEdit = (item: FeuilleRoute) => {
    setEditingItem(item);
    setEditForm({
      libelle: item.libelle,
      poids: item.poids,
      budget_prevu: item.budget_prevu
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    updateMutation.mutate({
      id: editingItem.id,
      ...editForm
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredFeuilles.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredFeuilles.map(f => f.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-blue-600" />
            Mise à jour des feuilles de routes
          </h1>
          <p className="text-muted-foreground">
            Exercice {exercice?.annee || "-"} - Réaménagement et modification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alerte mode lecture seule */}
      {isReadOnly && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            L'exercice {exercice?.annee} est en mode lecture seule. Les modifications ne sont pas autorisées.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Direction</label>
              <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {filterData?.directions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} - {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Mission</label>
              <Select value={selectedMission} onValueChange={setSelectedMission}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les missions</SelectItem>
                  {filterData?.missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Feuilles de route</CardTitle>
          <CardDescription>
            {filteredFeuilles.length} activité(s) affichée(s)
            {selectedItems.length > 0 && ` - ${selectedItems.length} sélectionnée(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredFeuilles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedItems.length === filteredFeuilles.length && filteredFeuilles.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-16">N°</TableHead>
                    <TableHead>CODE</TableHead>
                    <TableHead className="min-w-[200px]">LIBELLÉ</TableHead>
                    <TableHead className="hidden md:table-cell">DIRECTION</TableHead>
                    <TableHead className="hidden lg:table-cell">MISSION</TableHead>
                    <TableHead className="hidden xl:table-cell">OS</TableHead>
                    <TableHead className="text-right">POIDS</TableHead>
                    <TableHead className="text-right hidden md:table-cell">BUDGET PRÉVU</TableHead>
                    <TableHead className="w-20">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeuilles.map((feuille, index) => (
                    <TableRow key={feuille.id} className={selectedItems.includes(feuille.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(feuille.id)}
                          onCheckedChange={() => toggleSelectItem(feuille.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {feuille.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]" title={feuille.libelle}>
                        <span className="line-clamp-2">{feuille.libelle}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{feuille.direction_code}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm truncate max-w-[150px] block" title={feuille.mission_libelle}>
                          {feuille.mission_code}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm">{feuille.os_code}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {feuille.poids}%
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {formatMontant(feuille.budget_prevu)} FCFA
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(feuille)}
                          disabled={isReadOnly}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune feuille de route pour cet exercice</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la feuille de route</DialogTitle>
            <DialogDescription>
              {editingItem && `Code: ${editingItem.code}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé</Label>
              <Textarea
                id="libelle"
                value={editForm.libelle}
                onChange={(e) => setEditForm(prev => ({ ...prev, libelle: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poids">Poids (%)</Label>
                <Input
                  id="poids"
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.poids}
                  onChange={(e) => setEditForm(prev => ({ ...prev, poids: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget prévu (FCFA)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={editForm.budget_prevu}
                  onChange={(e) => setEditForm(prev => ({ ...prev, budget_prevu: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {editingItem && (
              <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                <p><strong>Direction:</strong> {editingItem.direction_code} - {editingItem.direction_label}</p>
                <p><strong>Mission:</strong> {editingItem.mission_code} - {editingItem.mission_libelle}</p>
                <p><strong>OS:</strong> {editingItem.os_code} - {editingItem.os_libelle}</p>
                <p><strong>Action:</strong> {editingItem.action_code} - {editingItem.action_libelle}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
