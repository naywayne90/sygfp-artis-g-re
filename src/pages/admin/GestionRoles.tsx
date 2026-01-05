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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type CustomRole = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  color: string | null;
  is_active: boolean | null;
  is_system: boolean | null;
  created_at: string;
};

export default function GestionRoles() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    description: "",
    color: "#3b82f6",
    is_active: true,
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("label");
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("custom_roles")
          .update({
            code: data.code.toUpperCase(),
            label: data.label,
            description: data.description || null,
            color: data.color,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_roles")
          .insert({
            code: data.code.toUpperCase(),
            label: data.label,
            description: data.description || null,
            color: data.color,
            is_active: data.is_active,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingRole ? "Rôle mis à jour" : "Rôle créé");
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rôle supprimé");
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ code: "", label: "", description: "", color: "#3b82f6", is_active: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: CustomRole) => {
    setEditingRole(role);
    setFormData({
      code: role.code,
      label: role.label,
      description: role.description || "",
      color: role.color || "#3b82f6",
      is_active: role.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
  };

  const handleSave = () => {
    if (!formData.code || !formData.label) {
      toast.error("Code et libellé requis");
      return;
    }
    saveMutation.mutate({ ...formData, id: editingRole?.id });
  };

  const handleDelete = (role: CustomRole) => {
    if (role.is_system) {
      toast.error("Les rôles système ne peuvent pas être supprimés");
      return;
    }
    if (confirm(`Supprimer le rôle "${role.label}" ?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profils & Rôles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles paramétrables du système.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Rôle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Liste des Rôles
          </CardTitle>
          <CardDescription>
            {roles?.length || 0} rôle(s) configuré(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : roles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun rôle configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: role.color || undefined, color: role.color || undefined }}
                        >
                          {role.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{role.label}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="secondary">Système</Badge>
                        ) : (
                          <Badge variant="outline">Personnalisé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "destructive"}>
                          {role.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.is_system && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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

      {/* Dialog création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
            <DialogDescription>
              Les rôles définissent les permissions des utilisateurs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ADMIN"
                  disabled={editingRole?.is_system}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 p-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Administrateur"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
