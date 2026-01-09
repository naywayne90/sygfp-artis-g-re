import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Archive, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExportButtons } from "../referentiel/ImportExportButtons";
import { useReferentielImportExport } from "@/hooks/useReferentielImportExport";
import { TabHelpSection } from "./TabHelpSection";

type SousActivite = {
  id: string;
  activite_id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  activite?: { code: string; libelle: string };
};

export default function SousActivitesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SousActivite | null>(null);
  const [formData, setFormData] = useState({ activite_id: "", code: "", libelle: "" });

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "sous_activites",
    "sous-activites",
    ["code", "libelle", "activite_id"]
  );

  const { data: sousActivites, isLoading } = useQuery({
    queryKey: ["sous-activites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sous_activites")
        .select(`*, activite:activites(code, libelle)`)
        .order("code");
      if (error) throw error;
      return data as SousActivite[];
    },
  });

  const { data: activites } = useQuery({
    queryKey: ["activites-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activites")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("sous_activites").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-activites"] });
      toast.success("Sous-activité créée avec succès");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SousActivite> }) => {
      const { error } = await supabase.from("sous_activites").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-activites"] });
      toast.success("Sous-activité mise à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { error } = await supabase.from("sous_activites").update({ est_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-activites"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ activite_id: "", code: "", libelle: "" });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: SousActivite) => {
    setEditingItem(item);
    setFormData({ activite_id: item.activite_id, code: item.code, libelle: item.libelle });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.activite_id || !formData.code || !formData.libelle) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImport = async (file: File) => {
    await importData(file);
    queryClient.invalidateQueries({ queryKey: ["sous-activites"] });
  };

  const handleExport = () => {
    if (sousActivites) exportToCSV(sousActivites, "sous_activites");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "SA-001" },
        { name: "libelle", example: "Sous-tâche spécifique" },
        { name: "activite_id", example: "uuid-activite" },
      ],
      "sous_activites"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sous-Activités</CardTitle>
          <CardDescription>Gérez les sous-activités liées aux activités</CardDescription>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
            onDownloadTemplate={handleDownloadTemplate}
            isImporting={isImporting}
            entityName="sous-activités"
          />
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvelle Sous-Activité</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier la sous-activité" : "Nouvelle Sous-Activité"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Modifiez les informations" : "Créez une nouvelle sous-activité"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Activité *</Label>
                  <Select value={formData.activite_id} onValueChange={(v) => setFormData({ ...formData, activite_id: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une activité" />
                    </SelectTrigger>
                    <SelectContent>
                      {activites?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SA-001"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Sous-tâche spécifique..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Annuler</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingItem ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <TabHelpSection tabKey="sousactivites" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Activité</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sousActivites?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune sous-activité définie
                  </TableCell>
                </TableRow>
              ) : (
                sousActivites?.map((item) => (
                  <TableRow key={item.id} className={!item.est_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.libelle}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.activite?.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.est_active ? "default" : "secondary"}>
                        {item.est_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActiveMutation.mutate({ id: item.id, est_active: !item.est_active })}
                        >
                          {item.est_active ? (
                            <Archive className="h-4 w-4 text-orange-500" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
