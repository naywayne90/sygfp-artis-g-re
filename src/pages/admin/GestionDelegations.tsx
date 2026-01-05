import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, UserCog, Calendar, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role_hierarchique: string | null;
};

type Delegation = {
  id: string;
  delegateur_id: string;
  delegataire_id: string;
  date_debut: string;
  date_fin: string;
  perimetre: string[];
  motif: string | null;
  est_active: boolean | null;
  created_at: string;
  delegateur?: Profile;
  delegataire?: Profile;
};

const PERIMETRES = [
  { value: "notes", label: "Notes SEF/AEF" },
  { value: "engagements", label: "Engagements" },
  { value: "liquidations", label: "Liquidations" },
  { value: "ordonnancements", label: "Ordonnancements" },
  { value: "marches", label: "Marchés" },
  { value: "expressions_besoin", label: "Expressions de besoin" },
];

export default function GestionDelegations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDelegation, setEditingDelegation] = useState<Delegation | null>(null);
  const [formData, setFormData] = useState({
    delegateur_id: "",
    delegataire_id: "",
    date_debut: "",
    date_fin: "",
    perimetre: [] as string[],
    motif: "",
    est_active: true,
  });

  const { data: delegations, isLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delegations")
        .select(`
          *,
          delegateur:profiles!delegations_delegateur_id_fkey(id, full_name, email, role_hierarchique),
          delegataire:profiles!delegations_delegataire_id_fkey(id, full_name, email, role_hierarchique)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Delegation[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users-for-delegation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role_hierarchique")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        delegateur_id: data.delegateur_id,
        delegataire_id: data.delegataire_id,
        date_debut: data.date_debut,
        date_fin: data.date_fin,
        perimetre: data.perimetre,
        motif: data.motif || null,
        est_active: data.est_active,
      };

      if (data.id) {
        const { error } = await supabase
          .from("delegations")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("delegations")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingDelegation ? "Délégation mise à jour" : "Délégation créée");
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingDelegation(null);
    setFormData({
      delegateur_id: "",
      delegataire_id: "",
      date_debut: format(new Date(), "yyyy-MM-dd"),
      date_fin: "",
      perimetre: [],
      motif: "",
      est_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (delegation: Delegation) => {
    setEditingDelegation(delegation);
    setFormData({
      delegateur_id: delegation.delegateur_id,
      delegataire_id: delegation.delegataire_id,
      date_debut: delegation.date_debut,
      date_fin: delegation.date_fin,
      perimetre: delegation.perimetre,
      motif: delegation.motif || "",
      est_active: delegation.est_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDelegation(null);
  };

  const handleSave = () => {
    if (!formData.delegateur_id || !formData.delegataire_id) {
      toast.error("Sélectionnez le délégateur et le délégataire");
      return;
    }
    if (!formData.date_debut || !formData.date_fin) {
      toast.error("Les dates sont requises");
      return;
    }
    if (formData.perimetre.length === 0) {
      toast.error("Sélectionnez au moins un périmètre");
      return;
    }
    saveMutation.mutate({ ...formData, id: editingDelegation?.id });
  };

  const togglePerimetre = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      perimetre: prev.perimetre.includes(value)
        ? prev.perimetre.filter((p) => p !== value)
        : [...prev.perimetre, value],
    }));
  };

  const isDelegationActive = (delegation: Delegation) => {
    const today = new Date();
    const debut = new Date(delegation.date_debut);
    const fin = new Date(delegation.date_fin);
    return delegation.est_active && today >= debut && today <= fin;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Délégations</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les délégations temporaires de pouvoir de validation.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Délégation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Délégations Configurées
          </CardTitle>
          <CardDescription>
            {delegations?.length || 0} délégation(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Délégateur</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Délégataire</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Périmètre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : delegations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune délégation configurée
                    </TableCell>
                  </TableRow>
                ) : (
                  delegations?.map((delegation) => (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delegation.delegateur?.full_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{delegation.delegateur?.role_hierarchique}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delegation.delegataire?.full_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{delegation.delegataire?.role_hierarchique}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(delegation.date_debut), "dd/MM/yyyy", { locale: fr })}
                          {" → "}
                          {format(new Date(delegation.date_fin), "dd/MM/yyyy", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {delegation.perimetre.slice(0, 2).map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {PERIMETRES.find((x) => x.value === p)?.label || p}
                            </Badge>
                          ))}
                          {delegation.perimetre.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{delegation.perimetre.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isDelegationActive(delegation) ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : delegation.est_active ? (
                          <Badge variant="secondary">Planifiée</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(delegation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingDelegation ? "Modifier la délégation" : "Nouvelle délégation"}</DialogTitle>
            <DialogDescription>
              Configurez une délégation temporaire de pouvoir de validation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Délégateur (qui délègue) *</Label>
                <Select
                  value={formData.delegateur_id}
                  onValueChange={(value) => setFormData({ ...formData, delegateur_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(u => u.id !== formData.delegataire_id).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Délégataire (qui reçoit) *</Label>
                <Select
                  value={formData.delegataire_id}
                  onValueChange={(value) => setFormData({ ...formData, delegataire_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(u => u.id !== formData.delegateur_id).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin *</Label>
                <Input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  min={formData.date_debut}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Périmètre de délégation *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PERIMETRES.map((p) => (
                  <div key={p.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={p.value}
                      checked={formData.perimetre.includes(p.value)}
                      onCheckedChange={() => togglePerimetre(p.value)}
                    />
                    <label htmlFor={p.value} className="text-sm">{p.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Textarea
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                placeholder="Congé, mission, etc."
                rows={2}
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
