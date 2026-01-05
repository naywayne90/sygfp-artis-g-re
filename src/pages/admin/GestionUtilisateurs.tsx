import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Edit, UserCheck, UserX, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  matricule: string | null;
  telephone: string | null;
  direction_id: string | null;
  is_active: boolean | null;
  role_hierarchique: string | null;
  profil_fonctionnel: string | null;
  direction?: { label: string } | null;
};

type Direction = {
  id: string;
  label: string;
  code: string;
};

const ROLES_HIERARCHIQUES = ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'];
const PROFILS_FONCTIONNELS = ['Admin', 'Validateur', 'Operationnel', 'Controleur', 'Auditeur'];

export default function GestionUtilisateurs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, direction:directions(label)`)
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, label, code")
        .order("label");
      if (error) throw error;
      return data as Direction[];
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricule?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDirection = filterDirection === "all" || user.direction_id === filterDirection;
    const matchesRole = filterRole === "all" || user.role_hierarchique === filterRole;
    
    return matchesSearch && matchesDirection && matchesRole;
  });

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      matricule: user.matricule,
      telephone: user.telephone,
      direction_id: user.direction_id,
      role_hierarchique: user.role_hierarchique,
      profil_fonctionnel: user.profil_fonctionnel,
      is_active: user.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          matricule: formData.matricule,
          telephone: formData.telephone,
          direction_id: formData.direction_id,
          role_hierarchique: formData.role_hierarchique as any,
          profil_fonctionnel: formData.profil_fonctionnel as any,
          is_active: formData.is_active,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("Utilisateur mis à jour avec succès");
      setEditingUser(null);
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    }
  };

  const toggleUserStatus = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !user.is_active })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`Utilisateur ${user.is_active ? "désactivé" : "activé"} avec succès`);
      refetch();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les profils utilisateurs, leurs rôles et leurs droits d'accès.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers?.length || 0} utilisateur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions?.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>{dir.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {ROLES_HIERARCHIQUES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Rôle Hiérarchique</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || "Sans nom"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.matricule || "-"}</TableCell>
                      <TableCell>{user.direction?.label || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role_hierarchique || "Agent"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.profil_fonctionnel || "Operationnel"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
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

      {/* Modal d'édition */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              {editingUser?.full_name} ({editingUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input
                  value={formData.matricule || ""}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="MAT-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.telephone || ""}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={formData.direction_id || ""}
                onValueChange={(value) => setFormData({ ...formData, direction_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions?.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>{dir.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle Hiérarchique</Label>
                <Select
                  value={formData.role_hierarchique || "Agent"}
                  onValueChange={(value) => setFormData({ ...formData, role_hierarchique: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_HIERARCHIQUES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profil Fonctionnel</Label>
                <Select
                  value={formData.profil_fonctionnel || "Operationnel"}
                  onValueChange={(value) => setFormData({ ...formData, profil_fonctionnel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILS_FONCTIONNELS.map((profil) => (
                      <SelectItem key={profil} value={profil}>{profil}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
