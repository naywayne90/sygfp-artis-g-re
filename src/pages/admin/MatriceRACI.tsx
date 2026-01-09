import { useState } from "react";
import { useRaciMatrix, RaciEntry } from "@/hooks/useRaciMatrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Plus, Pencil, Trash2, RefreshCw, Info,
  UserCheck, Shield, MessageSquare, Bell, Settings
} from "lucide-react";
import { ValidationMatrix } from "@/components/admin/ValidationMatrix";

const ROLE_COLORS = {
  R: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  I: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function MatriceRACI() {
  const { raciEntries, isLoading, createEntry, updateEntry, deleteEntry, isCreating, isUpdating } = useRaciMatrix();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RaciEntry | null>(null);
  const [formData, setFormData] = useState({
    processus: "",
    processus_code: "",
    description: "",
    role_responsible: "",
    role_accountable: "",
    roles_consulted: "",
    roles_informed: "",
    module_key: "",
    actif: true,
    ordre: 0,
  });

  const resetForm = () => {
    setFormData({
      processus: "",
      processus_code: "",
      description: "",
      role_responsible: "",
      role_accountable: "",
      roles_consulted: "",
      roles_informed: "",
      module_key: "",
      actif: true,
      ordre: 0,
    });
    setEditingEntry(null);
  };

  const handleEdit = (entry: RaciEntry) => {
    setEditingEntry(entry);
    setFormData({
      processus: entry.processus,
      processus_code: entry.processus_code,
      description: entry.description || "",
      role_responsible: entry.role_responsible || "",
      role_accountable: entry.role_accountable || "",
      roles_consulted: entry.roles_consulted.join(", "),
      roles_informed: entry.roles_informed.join(", "),
      module_key: entry.module_key || "",
      actif: entry.actif,
      ordre: entry.ordre,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      processus: formData.processus,
      processus_code: formData.processus_code,
      description: formData.description || null,
      role_responsible: formData.role_responsible || null,
      role_accountable: formData.role_accountable || null,
      roles_consulted: formData.roles_consulted.split(",").map(s => s.trim()).filter(Boolean),
      roles_informed: formData.roles_informed.split(",").map(s => s.trim()).filter(Boolean),
      module_key: formData.module_key || null,
      actif: formData.actif,
      ordre: formData.ordre,
    };

    if (editingEntry) {
      updateEntry({ id: editingEntry.id, ...data });
    } else {
      createEntry(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette entrée RACI ?")) {
      deleteEntry(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Users className="h-6 w-6" />
          Matrice RACI & Validations
        </h1>
        <p className="page-description">
          Définition des responsabilités et règles de validation par processus
        </p>
      </div>

      <Tabs defaultValue="validation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="validation" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Matrice de Validation
          </TabsTrigger>
          <TabsTrigger value="raci" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration RACI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation">
          <ValidationMatrix />
        </TabsContent>

        <TabsContent value="raci" className="space-y-6">

      {/* Légende */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.R}>R</Badge>
                    <span className="text-sm">Responsible</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Celui qui exécute la tâche</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.A}>A</Badge>
                    <span className="text-sm">Accountable</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Celui qui approuve et rend compte</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.C}>C</Badge>
                    <span className="text-sm">Consulted</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Ceux qui sont consultés avant décision</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.I}>I</Badge>
                    <span className="text-sm">Informed</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Ceux qui sont informés après décision</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Processus et responsabilités</CardTitle>
            <CardDescription>{raciEntries?.length || 0} processus définis</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? "Modifier l'entrée" : "Nouvelle entrée RACI"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Processus *</Label>
                    <Input
                      value={formData.processus}
                      onChange={(e) => setFormData({ ...formData, processus: e.target.value })}
                      placeholder="Validation engagement"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      value={formData.processus_code}
                      onChange={(e) => setFormData({ ...formData, processus_code: e.target.value })}
                      placeholder="validation_engagement"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du processus..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge className={ROLE_COLORS.R}>R</Badge> Responsible
                    </Label>
                    <Input
                      value={formData.role_responsible}
                      onChange={(e) => setFormData({ ...formData, role_responsible: e.target.value })}
                      placeholder="SDPM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge className={ROLE_COLORS.A}>A</Badge> Accountable
                    </Label>
                    <Input
                      value={formData.role_accountable}
                      onChange={(e) => setFormData({ ...formData, role_accountable: e.target.value })}
                      placeholder="DAF"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.C}>C</Badge> Consulted (séparés par virgule)
                  </Label>
                  <Input
                    value={formData.roles_consulted}
                    onChange={(e) => setFormData({ ...formData, roles_consulted: e.target.value })}
                    placeholder="DG, Direction"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS.I}>I</Badge> Informed (séparés par virgule)
                  </Label>
                  <Input
                    value={formData.roles_informed}
                    onChange={(e) => setFormData({ ...formData, roles_informed: e.target.value })}
                    placeholder="Trésorerie, Prestataire"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Module associé</Label>
                    <Input
                      value={formData.module_key}
                      onChange={(e) => setFormData({ ...formData, module_key: e.target.value })}
                      placeholder="engagement"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordre</Label>
                    <Input
                      type="number"
                      value={formData.ordre}
                      onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                  />
                  <Label>Actif</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
                  {editingEntry ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Processus</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">
                    <Badge className={ROLE_COLORS.R}>R</Badge>
                  </TableHead>
                  <TableHead className="text-center">
                    <Badge className={ROLE_COLORS.A}>A</Badge>
                  </TableHead>
                  <TableHead className="text-center">
                    <Badge className={ROLE_COLORS.C}>C</Badge>
                  </TableHead>
                  <TableHead className="text-center">
                    <Badge className={ROLE_COLORS.I}>I</Badge>
                  </TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raciEntries?.map((entry) => (
                  <TableRow key={entry.id} className={!entry.actif ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.processus}</p>
                        <p className="text-xs text-muted-foreground">{entry.processus_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.module_key && (
                        <Badge variant="outline">{entry.module_key}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{entry.role_responsible || "-"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{entry.role_accountable || "-"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {entry.roles_consulted.map((role, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {entry.roles_informed.map((role, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={entry.actif}
                        onCheckedChange={(checked) => updateEntry({ id: entry.id, actif: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
