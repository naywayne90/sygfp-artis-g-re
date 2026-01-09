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

type Action = {
  id: string;
  os_id: string;
  mission_id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  objectif?: { code: string; libelle: string };
  mission?: { code: string; libelle: string };
};

export default function ActionsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Action | null>(null);
  const [formData, setFormData] = useState({ os_id: "", mission_id: "", code: "", libelle: "" });

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "actions",
    "actions-programmatiques",
    ["code", "libelle", "os_id", "mission_id"]
  );

  const { data: actions, isLoading } = useQuery({
    queryKey: ["actions-programmatiques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select(`*, objectif:objectifs_strategiques(code, libelle), mission:missions(code, libelle)`)
        .order("code");
      if (error) throw error;
      return data as Action[];
    },
  });

  const { data: objectifs } = useQuery({
    queryKey: ["objectifs-strategiques-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: missions } = useQuery({
    queryKey: ["missions-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("actions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions-programmatiques"] });
      toast.success("Action créée avec succès");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Action> }) => {
      const { error } = await supabase.from("actions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions-programmatiques"] });
      toast.success("Action mise à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { error } = await supabase.from("actions").update({ est_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions-programmatiques"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ os_id: "", mission_id: "", code: "", libelle: "" });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: Action) => {
    setEditingItem(item);
    setFormData({
      os_id: item.os_id,
      mission_id: item.mission_id,
      code: item.code,
      libelle: item.libelle,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.os_id || !formData.mission_id || !formData.code || !formData.libelle) {
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
    queryClient.invalidateQueries({ queryKey: ["actions-programmatiques"] });
  };

  const handleExport = () => {
    if (actions) exportToCSV(actions, "actions");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "A1.1" },
        { name: "libelle", example: "Déployer la fibre optique" },
        { name: "os_id", example: "uuid-objectif" },
        { name: "mission_id", example: "uuid-mission" },
      ],
      "actions"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Gérez les actions liées aux objectifs stratégiques et missions</CardDescription>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
            onDownloadTemplate={handleDownloadTemplate}
            isImporting={isImporting}
            entityName="actions"
          />
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvelle Action</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier l'action" : "Nouvelle Action"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Modifiez les informations de l'action" : "Créez une nouvelle action"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Objectif *</Label>
                  <Select value={formData.os_id} onValueChange={(v) => setFormData({ ...formData, os_id: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un objectif stratégique" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectifs?.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          {os.code} - {os.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Mission *</Label>
                  <Select value={formData.mission_id} onValueChange={(v) => setFormData({ ...formData, mission_id: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {missions?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code} - {m.libelle}
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
                    placeholder="A1.1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Déployer la fibre optique nationale"
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
        <TabHelpSection tabKey="actions" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : actions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune action définie
                  </TableCell>
                </TableRow>
              ) : (
                actions?.map((item) => (
                  <TableRow key={item.id} className={!item.est_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.libelle}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.objectif?.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.mission?.code}</Badge>
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
