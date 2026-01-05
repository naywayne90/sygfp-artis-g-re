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
import { Plus, Edit, Archive, RotateCcw, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExportButtons } from "../referentiel/ImportExportButtons";
import { useReferentielImportExport } from "@/hooks/useReferentielImportExport";

type Prestataire = {
  id: string;
  code: string;
  raison_sociale: string;
  ninea: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  secteur_activite: string | null;
  statut: string | null;
};

export default function PrestatairesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Prestataire | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    raison_sociale: "",
    ninea: "",
    adresse: "",
    email: "",
    telephone: "",
    secteur_activite: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { isImporting, importData, exportToCSV, downloadTemplate } = useReferentielImportExport(
    "prestataires",
    "prestataires",
    ["code", "raison_sociale"]
  );

  const { data: prestataires, isLoading } = useQuery({
    queryKey: ["prestataires", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("prestataires")
        .select("*")
        .order("raison_sociale");
      
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,raison_sociale.ilike.%${searchTerm}%,ninea.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Prestataire[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("prestataires").insert({
        ...data,
        ninea: data.ninea || null,
        adresse: data.adresse || null,
        email: data.email || null,
        telephone: data.telephone || null,
        secteur_activite: data.secteur_activite || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      toast.success("Prestataire créé");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prestataire> }) => {
      const { error } = await supabase.from("prestataires").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      toast.success("Prestataire mis à jour");
      resetForm();
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("prestataires").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: any) => toast.error("Erreur: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      code: "",
      raison_sociale: "",
      ninea: "",
      adresse: "",
      email: "",
      telephone: "",
      secteur_activite: "",
    });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (item: Prestataire) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      raison_sociale: item.raison_sociale,
      ninea: item.ninea || "",
      adresse: item.adresse || "",
      email: item.email || "",
      telephone: item.telephone || "",
      secteur_activite: item.secteur_activite || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.raison_sociale) {
      toast.error("Le code et la raison sociale sont obligatoires");
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
    queryClient.invalidateQueries({ queryKey: ["prestataires"] });
  };

  const handleExport = () => {
    if (prestataires) exportToCSV(prestataires, "prestataires");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      [
        { name: "code", example: "PREST001" },
        { name: "raison_sociale", example: "SENELEC SA" },
        { name: "ninea", example: "123456789" },
        { name: "adresse", example: "Dakar, Sénégal" },
        { name: "email", example: "contact@senelec.sn" },
        { name: "telephone", example: "+221 33 839 30 30" },
        { name: "secteur_activite", example: "Energie" },
      ],
      "prestataires"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prestataires & Fournisseurs</CardTitle>
          <CardDescription>Répertoire des fournisseurs et prestataires</CardDescription>
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
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau Prestataire</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier le prestataire" : "Nouveau Prestataire"}</DialogTitle>
                <DialogDescription>Fiche prestataire / fournisseur</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="PREST001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Raison Sociale *</Label>
                    <Input
                      value={formData.raison_sociale}
                      onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                      placeholder="SENELEC SA"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NINEA</Label>
                    <Input
                      value={formData.ninea}
                      onChange={(e) => setFormData({ ...formData, ninea: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secteur d'activité</Label>
                    <Input
                      value={formData.secteur_activite}
                      onChange={(e) => setFormData({ ...formData, secteur_activite: e.target.value })}
                      placeholder="Énergie"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Dakar, Sénégal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@entreprise.sn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="+221 33 xxx xx xx"
                    />
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, raison sociale ou NINEA..."
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
                <TableHead>Raison Sociale</TableHead>
                <TableHead className="w-28">NINEA</TableHead>
                <TableHead>Contact</TableHead>
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
              ) : prestataires?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun prestataire enregistré
                  </TableCell>
                </TableRow>
              ) : (
                prestataires?.map((item) => (
                  <TableRow key={item.id} className={item.statut === "inactif" ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-bold">{item.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.raison_sociale}</p>
                        {item.secteur_activite && (
                          <p className="text-xs text-muted-foreground">{item.secteur_activite}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.ninea || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.email && <p>{item.email}</p>}
                        {item.telephone && <p className="text-muted-foreground">{item.telephone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.statut === "actif" ? "default" : "secondary"}>
                        {item.statut || "actif"}
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
                          onClick={() => toggleStatusMutation.mutate({ 
                            id: item.id, 
                            statut: item.statut === "actif" ? "inactif" : "actif" 
                          })}
                        >
                          {item.statut === "actif" ? (
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
          {prestataires?.length || 0} prestataires enregistrés
        </div>
      </CardContent>
    </Card>
  );
}
