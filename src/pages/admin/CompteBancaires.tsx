/**
 * CompteBancaires - Page de gestion des comptes bancaires
 *
 * Fonctionnalités:
 * - Liste avec recherche et filtres
 * - Onglets Actifs / Inactifs
 * - CRUD avec validation
 * - Export CSV
 * - Activer/Désactiver (pas de suppression)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Landmark,
  Plus,
  Search,
  Download,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  Building2,
  AlertTriangle,
} from "lucide-react";
import {
  useCompteBancaires,
  TYPES_COMPTE,
  DEVISES,
  CompteBancaire,
  CreateCompteBancaireData,
} from "@/hooks/useCompteBancaires";
import { toast } from "sonner";

export default function CompteBancaires() {
  // State
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"actif" | "inactif" | "all">("actif");
  const [filterType, setFilterType] = useState<string>("");
  const [filterBanque, setFilterBanque] = useState<string>("");

  // Dialog states
  const [showForm, setShowForm] = useState(false);
  const [editingCompte, setEditingCompte] = useState<CompteBancaire | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CompteBancaire | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [reactivateTarget, setReactivateTarget] = useState<CompteBancaire | null>(null);

  // Form state
  const [form, setForm] = useState<CreateCompteBancaireData>({
    code: "",
    libelle: "",
    banque: "",
    numero_compte: "",
    iban: "",
    bic: "",
    solde_initial: 0,
    devise: "XAF",
    type_compte: "courant",
    est_actif: true,
  });

  // Hook
  const {
    comptes,
    stats,
    banquesUniques,
    isLoading,
    createCompte,
    updateCompte,
    deactivateCompte,
    reactivateCompte,
    checkHasMovements,
    exportToCSV,
    formatMontant,
    isCreating,
    isUpdating,
    isDeactivating,
    isReactivating,
  } = useCompteBancaires({
    search,
    statut: activeTab,
    type_compte: filterType || undefined,
    banque: filterBanque || undefined,
  });

  // Filter comptes by tab
  const filteredComptes = comptes?.filter((c) => {
    if (activeTab === "actif") return c.est_actif;
    if (activeTab === "inactif") return !c.est_actif;
    return true;
  });

  // Reset form
  const resetForm = () => {
    setForm({
      code: "",
      libelle: "",
      banque: "",
      numero_compte: "",
      iban: "",
      bic: "",
      solde_initial: 0,
      devise: "XAF",
      type_compte: "courant",
      est_actif: true,
    });
    setEditingCompte(null);
  };

  // Handle edit
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
      devise: compte.devise || "XAF",
      type_compte: compte.type_compte || "courant",
      est_actif: compte.est_actif,
    });
    setShowForm(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!form.code || !form.libelle) {
      toast.error("Code et libellé sont requis");
      return;
    }

    try {
      if (editingCompte) {
        await updateCompte({ id: editingCompte.id, ...form });
      } else {
        await createCompte(form);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle deactivate
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    // Vérifier les mouvements
    const hasMovements = await checkHasMovements(deactivateTarget.id);
    if (hasMovements && !deactivateReason) {
      toast.error("Ce compte a des mouvements. Veuillez fournir un motif de désactivation.");
      return;
    }

    deactivateCompte({
      id: deactivateTarget.id,
      reason: deactivateReason || undefined,
    });

    setDeactivateTarget(null);
    setDeactivateReason("");
  };

  // Handle reactivate
  const handleReactivate = () => {
    if (!reactivateTarget) return;
    reactivateCompte(reactivateTarget.id);
    setReactivateTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Comptes Bancaires</h1>
            <p className="page-description">
              Gestion des comptes bancaires et caisses
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau compte
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes actifs
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actifs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes inactifs
            </CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactifs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde total (actifs)
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatMontant(stats.soldeTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Banques
            </CardTitle>
            <Building2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banquesUniques.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, libellé, banque..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de compte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                {TYPES_COMPTE.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBanque} onValueChange={setFilterBanque}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Banque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les banques</SelectItem>
                {banquesUniques.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="actif" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Comptes actifs
            <Badge variant="secondary">{stats.actifs}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inactif" className="gap-2">
            <XCircle className="h-4 w-4" />
            Comptes inactifs
            <Badge variant="outline">{stats.inactifs}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            Tous
            <Badge variant="outline">{stats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Liste des comptes
              </CardTitle>
              <CardDescription>
                {filteredComptes?.length || 0} compte(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredComptes?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun compte trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>N° Compte</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Solde actuel</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComptes.map((compte) => (
                      <TableRow
                        key={compte.id}
                        className={!compte.est_actif ? "opacity-60" : ""}
                      >
                        <TableCell className="font-mono font-medium">
                          {compte.code}
                        </TableCell>
                        <TableCell>{compte.libelle}</TableCell>
                        <TableCell>{compte.banque || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {compte.numero_compte || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TYPES_COMPTE.find((t) => t.value === compte.type_compte)
                              ?.label || compte.type_compte}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              compte.solde_actuel < 0
                                ? "text-destructive"
                                : "text-green-600"
                            }
                          >
                            {formatMontant(compte.solde_actuel, compte.devise)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {compte.est_actif ? (
                            <Badge className="bg-green-100 text-green-800">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(compte)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {compte.est_actif ? (
                                <DropdownMenuItem
                                  onClick={() => setDeactivateTarget(compte)}
                                  className="text-orange-600"
                                >
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Désactiver
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setReactivateTarget(compte)}
                                  className="text-green-600"
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  Réactiver
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCompte ? "Modifier le compte" : "Nouveau compte bancaire"}
            </DialogTitle>
            <DialogDescription>
              {editingCompte
                ? "Modifiez les informations du compte"
                : "Renseignez les informations du nouveau compte"}
            </DialogDescription>
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
                  disabled={!!editingCompte}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type_compte">Type *</Label>
                <Select
                  value={form.type_compte}
                  onValueChange={(v) => setForm({ ...form, type_compte: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_COMPTE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
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
                placeholder="Compte principal ARTI"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banque">Banque</Label>
                <Input
                  id="banque"
                  value={form.banque}
                  onChange={(e) => setForm({ ...form, banque: e.target.value })}
                  placeholder="BGFI Bank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_compte">N° Compte</Label>
                <Input
                  id="numero_compte"
                  value={form.numero_compte}
                  onChange={(e) =>
                    setForm({ ...form, numero_compte: e.target.value })
                  }
                  placeholder="01234567890"
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
                  placeholder="GA..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC</Label>
                <Input
                  id="bic"
                  value={form.bic}
                  onChange={(e) => setForm({ ...form, bic: e.target.value })}
                  placeholder="BGFIGALIB"
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
                  onChange={(e) =>
                    setForm({ ...form, solde_initial: Number(e.target.value) })
                  }
                  disabled={!!editingCompte}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="devise">Devise</Label>
                <Select
                  value={form.devise}
                  onValueChange={(v) => setForm({ ...form, devise: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVISES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="est_actif">Compte actif</Label>
              <Switch
                id="est_actif"
                checked={form.est_actif}
                onCheckedChange={(v) => setForm({ ...form, est_actif: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.code || !form.libelle || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingCompte ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={() => setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Désactiver le compte
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Vous allez désactiver le compte{" "}
                <strong>{deactivateTarget?.code}</strong> -{" "}
                {deactivateTarget?.libelle}.
              </p>
              <p>
                Ce compte ne sera plus sélectionnable dans les formulaires, mais
                restera visible pour consultation et historique.
              </p>
              <div className="space-y-2 pt-2">
                <Label htmlFor="deactivate-reason">
                  Motif de désactivation (optionnel)
                </Label>
                <Input
                  id="deactivate-reason"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Ex: Compte fermé, Migration vers nouveau compte..."
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Dialog */}
      <AlertDialog
        open={!!reactivateTarget}
        onOpenChange={() => setReactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-green-500" />
              Réactiver le compte
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                Voulez-vous réactiver le compte{" "}
                <strong>{reactivateTarget?.code}</strong> -{" "}
                {reactivateTarget?.libelle} ?
              </p>
              <p className="mt-2">
                Ce compte sera à nouveau disponible dans les sélecteurs et
                pourra recevoir des mouvements.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isReactivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réactivation...
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Réactiver
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
