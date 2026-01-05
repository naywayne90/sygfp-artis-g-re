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
import { Plus, Edit, Archive, RotateCcw, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExportButtons } from "../referentiel/ImportExportButtons";
import { useReferentielImportExport } from "@/hooks/useReferentielImportExport";

type NomenclatureNBE = {
  id: string;
  code: string;
  libelle: string;
  niveau: string | null;
  parent_code: string | null;
  est_active: boolean;
};

const NIVEAUX = [
  { value: "titre", label: "Titre" },
  { value: "chapitre", label: "Chapitre" },
  { value: "article", label: "Article" },
  { value: "paragraphe", label: "Paragraphe" },
];

export default function NomenclatureNBETab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NomenclatureNBE | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", niveau: "", parent_code: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "nomenclature_nbe",
    "nomenclature-nbe",
    ["code", "libelle"]
  );

  const { data: items, isLoading } = useQuery({
    queryKey: ["nomenclature-nbe", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("nomenclature_nbe")
        .select("*")
        .order("code");
      
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,libelle.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as NomenclatureNBE[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("nomenclature_nbe").insert({
        ...data,
        niveau: data.niveau || null,
        parent_code: data.parent_code || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature-nbe"] });
      toast.success("Nomenclature créée");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NomenclatureNBE> }) => {
      const { error } = await supabase.from("nomenclature_nbe").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature-nbe"] });
      toast.success("Nomenclature mise à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { error } = await supabase.from("nomenclature_nbe").update({ est_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature-nbe"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ code: "", libelle: "", niveau: "", parent_code: "" });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: NomenclatureNBE) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      niveau: item.niveau || "",
      parent_code: item.parent_code || "",
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
    queryClient.invalidateQueries({ queryKey: ["nomenclature-nbe"] });
  };

  const handleExport = () => {
    if (items) exportToCSV(items, "nomenclature_nbe");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "21" },
        { name: "libelle", example: "Dépenses de personnel" },
        { name: "niveau", example: "titre" },
        { name: "parent_code", example: "" },
      ],
      "nomenclature_nbe"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Nomenclature NBE</CardTitle>
          <CardDescription>Nomenclature Budgétaire de l'État</CardDescription>
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
              <Button><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier" : "Nouvelle entrée"}</DialogTitle>
                <DialogDescription>Nomenclature budgétaire</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="21"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Dépenses de personnel"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Niveau</Label>
                  <Select value={formData.niveau} onValueChange={(v) => setFormData({ ...formData, niveau: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVEAUX.map((n) => (
                        <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code parent</Label>
                  <Input
                    className="col-span-3"
                    value={formData.parent_code}
                    onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                    placeholder="2"
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code ou libellé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="rounded-md border max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="w-24">Niveau</TableHead>
                <TableHead className="w-24">Parent</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune nomenclature définie
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => (
                  <TableRow key={item.id} className={!item.est_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.libelle}</TableCell>
                    <TableCell>
                      {item.niveau && <Badge variant="outline">{item.niveau}</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.parent_code || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.est_active ? "default" : "secondary"}>
                        {item.est_active ? "Actif" : "Inactif"}
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
        <div className="mt-2 text-sm text-muted-foreground">
          {items?.length || 0} entrées
        </div>
      </CardContent>
    </Card>
  );
}
