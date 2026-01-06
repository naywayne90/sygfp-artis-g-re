import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useContrats, TYPES_CONTRAT, STATUTS_CONTRAT, Contrat } from "@/hooks/useContrats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, Edit, FileSignature, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContratDetails } from "./ContratDetails";

export function ContratList() {
  const { contrats, createContrat, updateContrat } = useContrats();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);
  const [filter, setFilter] = useState({ type: "", statut: "" });
  const [form, setForm] = useState({
    prestataire_id: "",
    type_contrat: "",
    objet: "",
    montant_initial: 0,
    date_signature: "",
    date_notification: "",
    date_debut: "",
    date_fin: "",
    delai_execution: 0,
    statut: "brouillon",
    marche_id: null as string | null,
    dossier_id: null as string | null,
    engagement_id: null as string | null,
  });

  // Récupérer les prestataires
  const prestataires = useQuery({
    queryKey: ["prestataires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("id, raison_sociale")
        .eq("est_actif", true)
        .order("raison_sociale");
      if (error) throw error;
      return data as { id: string; raison_sociale: string }[];
    },
  });

  const resetForm = () => {
    setForm({
      prestataire_id: "",
      type_contrat: "",
      objet: "",
      montant_initial: 0,
      date_signature: "",
      date_notification: "",
      date_debut: "",
      date_fin: "",
      delai_execution: 0,
      statut: "brouillon",
      marche_id: null,
      dossier_id: null,
      engagement_id: null,
    });
  };

  const handleSubmit = async () => {
    await createContrat.mutateAsync({
      ...form,
      montant_actuel: form.montant_initial,
      lot_id: null,
      exercice: new Date().getFullYear(),
      created_by: null,
    } as any);
    setOpen(false);
    resetForm();
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const getStatutBadge = (statut: string) => {
    const s = STATUTS_CONTRAT.find(x => x.value === statut);
    return <Badge className={s?.color || ""}>{s?.label || statut}</Badge>;
  };

  const getPrestataireName = (id: string) => {
    const p = prestataires.data?.find(x => x.id === id);
    return p?.raison_sociale || "-";
  };

  const filteredContrats = contrats.data?.filter(c => {
    if (filter.type && c.type_contrat !== filter.type) return false;
    if (filter.statut && c.statut !== filter.statut) return false;
    return true;
  }) || [];

  const exportCSV = () => {
    const headers = ["Numéro", "Objet", "Prestataire", "Type", "Montant", "Date signature", "Statut"];
    const rows = filteredContrats.map(c => [
      c.numero,
      c.objet,
      getPrestataireName(c.prestataire_id),
      c.type_contrat,
      c.montant_actuel || c.montant_initial,
      c.date_signature || "",
      c.statut,
    ]);
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contrats_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Liste des contrats
            </CardTitle>
            <CardDescription>Gestion des contrats et conventions</CardDescription>
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
                  Nouveau contrat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouveau contrat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de contrat *</Label>
                      <Select value={form.type_contrat} onValueChange={(v) => setForm({ ...form, type_contrat: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_CONTRAT.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prestataire *</Label>
                      <Select value={form.prestataire_id} onValueChange={(v) => setForm({ ...form, prestataire_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {prestataires.data?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.raison_sociale}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Objet *</Label>
                    <Textarea
                      value={form.objet}
                      onChange={(e) => setForm({ ...form, objet: e.target.value })}
                      placeholder="Description du contrat..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant initial *</Label>
                      <Input
                        type="number"
                        value={form.montant_initial}
                        onChange={(e) => setForm({ ...form, montant_initial: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Délai d'exécution (jours)</Label>
                      <Input
                        type="number"
                        value={form.delai_execution}
                        onChange={(e) => setForm({ ...form, delai_execution: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de signature</Label>
                      <Input
                        type="date"
                        value={form.date_signature}
                        onChange={(e) => setForm({ ...form, date_signature: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de notification</Label>
                      <Input
                        type="date"
                        value={form.date_notification}
                        onChange={(e) => setForm({ ...form, date_notification: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Input
                        type="date"
                        value={form.date_debut}
                        onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input
                        type="date"
                        value={form.date_fin}
                        onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS_CONTRAT.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={!form.prestataire_id || !form.type_contrat || !form.objet || !form.montant_initial}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-4 mb-4">
            <Select value={filter.type} onValueChange={(v) => setFilter({ ...filter, type: v })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous types</SelectItem>
                {TYPES_CONTRAT.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter.statut} onValueChange={(v) => setFilter({ ...filter, statut: v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous statuts</SelectItem>
                {STATUTS_CONTRAT.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {contrats.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : !filteredContrats.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contrat trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContrats.map((contrat) => (
                  <TableRow key={contrat.id}>
                    <TableCell className="font-mono text-sm">{contrat.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{contrat.objet}</TableCell>
                    <TableCell>{getPrestataireName(contrat.prestataire_id)}</TableCell>
                    <TableCell>{contrat.type_contrat}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(contrat.montant_actuel || contrat.montant_initial)}
                    </TableCell>
                    <TableCell>{getStatutBadge(contrat.statut)}</TableCell>
                    <TableCell>
                      {contrat.date_fin ? format(new Date(contrat.date_fin), "dd/MM/yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedContrat(contrat); setDetailsOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <ContratDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        contrat={selectedContrat}
        prestataireName={selectedContrat ? getPrestataireName(selectedContrat.prestataire_id) : ""}
      />
    </>
  );
}
