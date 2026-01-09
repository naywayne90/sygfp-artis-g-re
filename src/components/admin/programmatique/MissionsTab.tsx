import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Archive, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExportButtons } from "../referentiel/ImportExportButtons";
import { useReferentielImportExport } from "@/hooks/useReferentielImportExport";
import { TabHelpSection } from "./TabHelpSection";

type Mission = {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
};

export default function MissionsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mission | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "" });

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "missions",
    "missions",
    ["code", "libelle"]
  );

  const { data: missions, isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("missions").select("*").order("code");
      if (error) throw error;
      return data as Mission[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("missions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Mission créée avec succès");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Mission> }) => {
      const { error } = await supabase.from("missions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Mission mise à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { error } = await supabase.from("missions").update({ est_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ code: "", libelle: "" });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: Mission) => {
    setEditingItem(item);
    setFormData({ code: item.code, libelle: item.libelle });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.libelle) {
      toast.error("Le code et le libellé sont obligatoires");
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
    queryClient.invalidateQueries({ queryKey: ["missions"] });
  };

  const handleExport = () => {
    if (missions) exportToCSV(missions, "missions");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "M1" },
        { name: "libelle", example: "Régulation du secteur numérique" },
      ],
      "missions"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Missions</CardTitle>
          <CardDescription>Gérez les missions de l'ARTI</CardDescription>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
            onDownloadTemplate={handleDownloadTemplate}
            isImporting={isImporting}
            entityName="missions"
          />
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvelle Mission</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier la mission" : "Nouvelle Mission"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Modifiez les informations de la mission" : "Créez une nouvelle mission"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="M1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Régulation du secteur numérique"
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
        <TabHelpSection tabKey="missions" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : missions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucune mission définie
                  </TableCell>
                </TableRow>
              ) : (
                missions?.map((item) => (
                  <TableRow key={item.id} className={!item.est_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.libelle}</TableCell>
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
