import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Archive, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExportButtons } from "../referentiel/ImportExportButtons";
import { useReferentielImportExport } from "@/hooks/useReferentielImportExport";

type ObjectifStrategique = {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  annee_debut: number;
  annee_fin: number;
  est_actif: boolean;
};

const currentYear = new Date().getFullYear();

export default function ObjectifsStrategiquesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ObjectifStrategique | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    libelle: "",
    description: "",
    annee_debut: currentYear,
    annee_fin: currentYear + 5,
  });

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "objectifs_strategiques",
    "objectifs-strategiques",
    ["code", "libelle", "annee_debut", "annee_fin"]
  );

  const { data: objectifs, isLoading } = useQuery({
    queryKey: ["objectifs-strategiques"],
    queryFn: async () => {
      const { data, error } = await supabase.from("objectifs_strategiques").select("*").order("code");
      if (error) throw error;
      return data as ObjectifStrategique[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("objectifs_strategiques").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs-strategiques"] });
      toast.success("Objectif stratégique créé avec succès");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ObjectifStrategique> }) => {
      const { error } = await supabase.from("objectifs_strategiques").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs-strategiques"] });
      toast.success("Objectif stratégique mis à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_actif }: { id: string; est_actif: boolean }) => {
      const { error } = await supabase.from("objectifs_strategiques").update({ est_actif }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs-strategiques"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ code: "", libelle: "", description: "", annee_debut: currentYear, annee_fin: currentYear + 5 });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: ObjectifStrategique) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      description: item.description || "",
      annee_debut: item.annee_debut,
      annee_fin: item.annee_fin,
    });
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
    queryClient.invalidateQueries({ queryKey: ["objectifs-strategiques"] });
  };

  const handleExport = () => {
    if (objectifs) exportToCSV(objectifs, "objectifs_strategiques");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "OS1" },
        { name: "libelle", example: "Développer les infrastructures numériques" },
        { name: "description", example: "Description détaillée" },
        { name: "annee_debut", example: "2024" },
        { name: "annee_fin", example: "2029" },
      ],
      "objectifs_strategiques"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Objectifs Stratégiques</CardTitle>
          <CardDescription>Gérez les objectifs stratégiques de l'ARTI</CardDescription>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
            onDownloadTemplate={handleDownloadTemplate}
            isImporting={isImporting}
          />
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvel Objectif</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier l'objectif" : "Nouvel Objectif Stratégique"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Modifiez les informations de l'objectif stratégique" : "Créez un nouvel objectif stratégique"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code *</Label>
                  <Input className="col-span-3" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="OS1" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input className="col-span-3" value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} placeholder="Développer les infrastructures numériques" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Description</Label>
                  <Textarea className="col-span-3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description détaillée..." />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Période</Label>
                  <div className="col-span-3 flex gap-2 items-center">
                    <Input type="number" value={formData.annee_debut} onChange={(e) => setFormData({ ...formData, annee_debut: parseInt(e.target.value) })} className="w-24" />
                    <span>à</span>
                    <Input type="number" value={formData.annee_fin} onChange={(e) => setFormData({ ...formData, annee_fin: parseInt(e.target.value) })} className="w-24" />
                  </div>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="w-28">Période</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
                ))
              ) : objectifs?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun objectif stratégique défini</TableCell></TableRow>
              ) : (
                objectifs?.map((item) => (
                  <TableRow key={item.id} className={!item.est_actif ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell><div><p className="font-medium">{item.libelle}</p>{item.description && <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>}</div></TableCell>
                    <TableCell className="text-sm">{item.annee_debut} - {item.annee_fin}</TableCell>
                    <TableCell><Badge variant={item.est_actif ? "default" : "secondary"}>{item.est_actif ? "Actif" : "Inactif"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActiveMutation.mutate({ id: item.id, est_actif: !item.est_actif })}>
                          {item.est_actif ? <Archive className="h-4 w-4 text-orange-500" /> : <RotateCcw className="h-4 w-4 text-green-500" />}
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
