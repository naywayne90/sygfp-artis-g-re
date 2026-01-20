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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTresorerie, TYPES_OPERATION, CompteBancaire } from "@/hooks/useTresorerie";
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function OperationTresorerieList() {
  const { operations, comptes, createOperation, rapprocher } = useTresorerie();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState({ compteId: "all", type: "all", rapproche: "all" });
  const [form, setForm] = useState({
    compte_id: "",
    type_operation: "entree" as "entree" | "sortie" | "virement",
    date_operation: new Date().toISOString().split("T")[0],
    date_valeur: "",
    montant: 0,
    libelle: "",
    reference_externe: "",
    compte_destination_id: "",
  });

  const resetForm = () => {
    setForm({
      compte_id: "",
      type_operation: "entree",
      date_operation: new Date().toISOString().split("T")[0],
      date_valeur: "",
      montant: 0,
      libelle: "",
      reference_externe: "",
      compte_destination_id: "",
    });
  };

  const handleSubmit = async () => {
    await createOperation.mutateAsync({
      ...form,
      date_valeur: form.date_valeur || null,
      compte_destination_id: form.type_operation === "virement" ? form.compte_destination_id : null,
    });
    setOpen(false);
    resetForm();
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const getCompteLabel = (id: string) => {
    const compte = comptes.data?.find(c => c.id === id);
    return compte ? `${compte.code} - ${compte.libelle}` : "-";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "entree": return <ArrowUpRight className="h-4 w-4 text-success" />;
      case "sortie": return <ArrowDownRight className="h-4 w-4 text-destructive" />;
      case "virement": return <ArrowLeftRight className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const filteredOperations = operations.data?.filter(op => {
    if (filter.compteId !== "all" && op.compte_id !== filter.compteId) return false;
    if (filter.type !== "all" && op.type_operation !== filter.type) return false;
    if (filter.rapproche === "true" && !op.rapproche) return false;
    if (filter.rapproche === "false" && op.rapproche) return false;
    return true;
  }) || [];

  const exportCSV = () => {
    const headers = ["Numéro", "Date", "Type", "Compte", "Montant", "Libellé", "Référence", "Rapproché"];
    const rows = filteredOperations.map(op => [
      op.numero,
      op.date_operation,
      op.type_operation,
      getCompteLabel(op.compte_id),
      op.montant,
      op.libelle,
      op.reference_externe || "",
      op.rapproche ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `operations_tresorerie_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Opérations de trésorerie</CardTitle>
          <CardDescription>Entrées, sorties et virements internes</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle opération
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle opération de trésorerie</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type d'opération *</Label>
                    <Select value={form.type_operation} onValueChange={(v: any) => setForm({ ...form, type_operation: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_OPERATION.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Compte *</Label>
                    <Select value={form.compte_id} onValueChange={(v) => setForm({ ...form, compte_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {comptes.data?.filter(c => c.est_actif).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.code} - {c.libelle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.type_operation === "virement" && (
                  <div className="space-y-2">
                    <Label>Compte destination *</Label>
                    <Select value={form.compte_destination_id} onValueChange={(v) => setForm({ ...form, compte_destination_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {comptes.data?.filter(c => c.est_actif && c.id !== form.compte_id).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.code} - {c.libelle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date opération *</Label>
                    <Input
                      type="date"
                      value={form.date_operation}
                      onChange={(e) => setForm({ ...form, date_operation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date valeur</Label>
                    <Input
                      type="date"
                      value={form.date_valeur}
                      onChange={(e) => setForm({ ...form, date_valeur: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Montant *</Label>
                  <Input
                    type="number"
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Libellé *</Label>
                  <Input
                    value={form.libelle}
                    onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                    placeholder="Description de l'opération"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Référence externe</Label>
                  <Input
                    value={form.reference_externe}
                    onChange={(e) => setForm({ ...form, reference_externe: e.target.value })}
                    placeholder="N° chèque, virement, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!form.compte_id || !form.montant || !form.libelle || (form.type_operation === "virement" && !form.compte_destination_id)}
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex gap-4 mb-4">
          <Select value={filter.compteId} onValueChange={(v) => setFilter({ ...filter, compteId: v })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les comptes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les comptes</SelectItem>
              {comptes.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.type} onValueChange={(v) => setFilter({ ...filter, type: v })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tous types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {TYPES_OPERATION.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.rapproche} onValueChange={(v) => setFilter({ ...filter, rapproche: v })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Rapprochement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="true">Rapprochées</SelectItem>
              <SelectItem value="false">Non rapprochées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {operations.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : !filteredOperations.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune opération trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Solde après</TableHead>
                <TableHead>Rapproché</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-mono text-sm">{op.numero}</TableCell>
                  <TableCell>{format(new Date(op.date_operation), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(op.type_operation)}
                      <span className="capitalize">{op.type_operation}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getCompteLabel(op.compte_id)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{op.libelle}</TableCell>
                  <TableCell className={`text-right font-medium ${op.type_operation === "entree" ? "text-success" : op.type_operation === "sortie" ? "text-destructive" : ""}`}>
                    {op.type_operation === "entree" ? "+" : "-"}{formatMontant(op.montant)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {op.solde_apres !== null ? formatMontant(op.solde_apres) : "-"}
                  </TableCell>
                  <TableCell>
                    {op.rapproche ? (
                      <Badge variant="outline" className="text-success border-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!op.rapproche && (
                      <Button variant="ghost" size="sm" onClick={() => rapprocher.mutate(op.id)}>
                        Rapprocher
                      </Button>
                    )}
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
