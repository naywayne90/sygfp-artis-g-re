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

type PlanComptable = {
  id: string;
  code: string;
  libelle: string;
  classe: string | null;
  type: string | null;
  est_active: boolean;
};

const CLASSES = [
  { value: "1", label: "Classe 1 - Comptes de capitaux" },
  { value: "2", label: "Classe 2 - Comptes d'immobilisations" },
  { value: "3", label: "Classe 3 - Comptes de stocks" },
  { value: "4", label: "Classe 4 - Comptes de tiers" },
  { value: "5", label: "Classe 5 - Comptes financiers" },
  { value: "6", label: "Classe 6 - Comptes de charges" },
  { value: "7", label: "Classe 7 - Comptes de produits" },
  { value: "8", label: "Classe 8 - Comptes spéciaux" },
  { value: "9", label: "Classe 9 - Comptabilité analytique" },
];

const TYPES = [
  { value: "actif", label: "Actif" },
  { value: "passif", label: "Passif" },
  { value: "charge", label: "Charge" },
  { value: "produit", label: "Produit" },
];

export default function PlanComptableSYSCOTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanComptable | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", classe: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "plan_comptable_sysco",
    "plan-comptable-sysco",
    ["code", "libelle"]
  );

  const { data: items, isLoading } = useQuery({
    queryKey: ["plan-comptable-sysco", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("plan_comptable_sysco")
        .select("*")
        .order("code");
      
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,libelle.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PlanComptable[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("plan_comptable_sysco").insert({
        ...data,
        classe: data.classe || null,
        type: data.type || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-comptable-sysco"] });
      toast.success("Compte créé");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanComptable> }) => {
      const { error } = await supabase.from("plan_comptable_sysco").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-comptable-sysco"] });
      toast.success("Compte mis à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { error } = await supabase.from("plan_comptable_sysco").update({ est_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-comptable-sysco"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({ code: "", libelle: "", classe: "", type: "" });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: PlanComptable) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      classe: item.classe || "",
      type: item.type || "",
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
    queryClient.invalidateQueries({ queryKey: ["plan-comptable-sysco"] });
  };

  const handleExport = () => {
    if (items) exportToCSV(items, "plan_comptable_sysco");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "601" },
        { name: "libelle", example: "Achats de marchandises" },
        { name: "classe", example: "6" },
        { name: "type", example: "charge" },
      ],
      "plan_comptable_sysco"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plan Comptable SYSCO</CardTitle>
          <CardDescription>Système Comptable Ouest Africain</CardDescription>
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
                <DialogTitle>{editingItem ? "Modifier" : "Nouveau compte"}</DialogTitle>
                <DialogDescription>Plan comptable SYSCO</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="601"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Libellé *</Label>
                  <Input
                    className="col-span-3"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Achats de marchandises"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Classe</Label>
                  <Select value={formData.classe} onValueChange={(v) => setFormData({ ...formData, classe: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <TableHead className="w-16">Classe</TableHead>
                <TableHead className="w-20">Type</TableHead>
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
                    Aucun compte défini
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => (
                  <TableRow key={item.id} className={!item.est_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.libelle}</TableCell>
                    <TableCell>{item.classe || "-"}</TableCell>
                    <TableCell>
                      {item.type && <Badge variant="outline">{item.type}</Badge>}
                    </TableCell>
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
