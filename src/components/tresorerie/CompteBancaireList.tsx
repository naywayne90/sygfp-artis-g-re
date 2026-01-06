import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTresorerie, TYPES_COMPTE, CompteBancaire } from "@/hooks/useTresorerie";
import { Plus, Edit, Landmark } from "lucide-react";

export function CompteBancaireList() {
  const { comptes, createCompte, updateCompte } = useTresorerie();
  const [open, setOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<CompteBancaire | null>(null);
  const [form, setForm] = useState({
    code: "",
    libelle: "",
    banque: "",
    numero_compte: "",
    iban: "",
    bic: "",
    solde_initial: 0,
    type_compte: "courant",
    devise: "XOF",
    est_actif: true,
  });

  const resetForm = () => {
    setForm({
      code: "",
      libelle: "",
      banque: "",
      numero_compte: "",
      iban: "",
      bic: "",
      solde_initial: 0,
      type_compte: "courant",
      devise: "XOF",
      est_actif: true,
    });
    setEditingCompte(null);
  };

  const handleEdit = (compte: CompteBancaire) => {
    setEditingCompte(compte);
    setForm({
      code: compte.code,
      libelle: compte.libelle,
      banque: compte.banque || "",
      numero_compte: compte.numero_compte || "",
      iban: compte.iban || "",
      bic: compte.bic || "",
      solde_initial: compte.solde_initial,
      type_compte: compte.type_compte,
      devise: compte.devise,
      est_actif: compte.est_actif,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (editingCompte) {
      await updateCompte.mutateAsync({ id: editingCompte.id, ...form });
    } else {
      await createCompte.mutateAsync(form);
    }
    setOpen(false);
    resetForm();
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant) + " FCFA";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Comptes bancaires
        </CardTitle>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCompte ? "Modifier le compte" : "Nouveau compte bancaire"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="CPT-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_compte">Type *</Label>
                  <Select value={form.type_compte} onValueChange={(v) => setForm({ ...form, type_compte: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_COMPTE.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé *</Label>
                <Input
                  id="libelle"
                  value={form.libelle}
                  onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                  placeholder="Compte principal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banque">Banque</Label>
                  <Input
                    id="banque"
                    value={form.banque}
                    onChange={(e) => setForm({ ...form, banque: e.target.value })}
                    placeholder="BIAO-CI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_compte">N° Compte</Label>
                  <Input
                    id="numero_compte"
                    value={form.numero_compte}
                    onChange={(e) => setForm({ ...form, numero_compte: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={form.iban}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={form.bic}
                    onChange={(e) => setForm({ ...form, bic: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solde_initial">Solde initial</Label>
                  <Input
                    id="solde_initial"
                    type="number"
                    value={form.solde_initial}
                    onChange={(e) => setForm({ ...form, solde_initial: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="devise">Devise</Label>
                  <Input
                    id="devise"
                    value={form.devise}
                    onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="est_actif">Compte actif</Label>
                <Switch
                  id="est_actif"
                  checked={form.est_actif}
                  onCheckedChange={(v) => setForm({ ...form, est_actif: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!form.code || !form.libelle}>
                {editingCompte ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {comptes.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : !comptes.data?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun compte bancaire configuré</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Solde actuel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comptes.data.map((compte) => (
                <TableRow key={compte.id}>
                  <TableCell className="font-mono">{compte.code}</TableCell>
                  <TableCell className="font-medium">{compte.libelle}</TableCell>
                  <TableCell>{compte.banque || "-"}</TableCell>
                  <TableCell>
                    {TYPES_COMPTE.find(t => t.value === compte.type_compte)?.label || compte.type_compte}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={compte.solde_actuel < 0 ? "text-destructive" : "text-success"}>
                      {formatMontant(compte.solde_actuel)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={compte.est_actif ? "default" : "secondary"}>
                      {compte.est_actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(compte)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
