/**
 * OriginesFonds - Page de gestion des sources/origines de financement
 *
 * Fonctionnalités:
 * - Liste avec onglets (Actives / Inactives / Toutes)
 * - CRUD complet
 * - Désactivation/Réactivation
 * - Recherche et filtres
 * - Export CSV
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Coins,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Users,
  Receipt,
  Landmark,
  Gift,
  HelpCircle,
} from "lucide-react";
import {
  useFundingSources,
  FundingSource,
  FundingSourceType,
  FUNDING_SOURCE_TYPES,
  CreateFundingSourceData,
} from "@/hooks/useFundingSources";

// Icônes par type
const TYPE_ICONS: Record<FundingSourceType, React.ElementType> = {
  etat: Building2,
  partenaire: Users,
  recette: Receipt,
  emprunt: Landmark,
  don: Gift,
  autre: HelpCircle,
};

export default function OriginesFonds() {
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "all">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<FundingSourceType | "all">("all");

  // Dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<FundingSource | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Form state
  const [formData, setFormData] = useState<CreateFundingSourceData>({
    code: "",
    libelle: "",
    type: "etat",
    description: "",
    ordre: 0,
  });

  const {
    sources,
    stats,
    isLoading,
    createSource,
    updateSource,
    deactivateSource,
    reactivateSource,
    getTypeLabel,
    getTypeColor,
    exportToCSV,
    isCreating,
    isUpdating,
    isDeactivating,
    isReactivating,
  } = useFundingSources({
    status: activeTab,
    type: typeFilter,
    search: searchTerm,
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCreateDialog = () => {
    setEditingSource(null);
    setFormData({
      code: "",
      libelle: "",
      type: "etat",
      description: "",
      ordre: (stats?.total || 0) + 1,
    });
    setShowFormDialog(true);
  };

  const handleOpenEditDialog = (source: FundingSource) => {
    setEditingSource(source);
    setFormData({
      code: source.code,
      libelle: source.libelle,
      type: source.type,
      description: source.description || "",
      ordre: source.ordre,
    });
    setShowFormDialog(true);
  };

  const handleSubmitForm = () => {
    if (!formData.code || !formData.libelle) {
      return;
    }

    if (editingSource) {
      updateSource(
        { id: editingSource.id, ...formData },
        {
          onSuccess: () => {
            setShowFormDialog(false);
            setEditingSource(null);
          },
        }
      );
    } else {
      createSource(formData, {
        onSuccess: () => {
          setShowFormDialog(false);
        },
      });
    }
  };

  const handleDeactivate = () => {
    if (!selectedSource) return;
    deactivateSource(
      { id: selectedSource.id, reason: deactivationReason },
      {
        onSuccess: () => {
          setShowDeactivateDialog(false);
          setSelectedSource(null);
          setDeactivationReason("");
        },
      }
    );
  };

  const handleReactivate = () => {
    if (!selectedSource) return;
    reactivateSource(selectedSource.id, {
      onSuccess: () => {
        setShowReactivateDialog(false);
        setSelectedSource(null);
      },
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Origines des Fonds
          </h1>
          <p className="text-muted-foreground">
            Gérez les sources de financement utilisées dans le système
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle source
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.activeCount || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactives</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.inactiveCount || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Types</p>
                <p className="text-2xl font-bold">
                  {Object.keys(stats?.byType || {}).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as FundingSourceType | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {FUNDING_SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="active">
                Actives ({stats?.activeCount || 0})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactives ({stats?.inactiveCount || 0})
              </TabsTrigger>
              <TabsTrigger value="all">Toutes ({stats?.total || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sources?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune source de financement trouvée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Ordre</TableHead>
                      <TableHead className="w-[120px]">Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="w-[150px]">Type</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources?.map((source) => {
                      const TypeIcon = TYPE_ICONS[source.type];
                      return (
                        <TableRow
                          key={source.id}
                          className={!source.est_actif ? "opacity-60" : ""}
                        >
                          <TableCell className="font-mono">{source.ordre}</TableCell>
                          <TableCell className="font-mono font-medium">
                            {source.code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{source.libelle}</div>
                              {source.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {source.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getTypeColor(source.type)} flex items-center gap-1 w-fit`}
                            >
                              <TypeIcon className="h-3 w-3" />
                              {getTypeLabel(source.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {source.est_actif ? (
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditDialog(source)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                {source.est_actif ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSource(source);
                                      setShowDeactivateDialog(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Désactiver
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSource(source);
                                      setShowReactivateDialog(true);
                                    }}
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
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog Create/Edit */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSource ? "Modifier la source" : "Nouvelle source de financement"}
            </DialogTitle>
            <DialogDescription>
              {editingSource
                ? "Modifiez les informations de cette source de financement."
                : "Ajoutez une nouvelle source de financement au système."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: ETAT, PTF..."
                  disabled={!!editingSource}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordre">Ordre</Label>
                <Input
                  id="ordre"
                  type="number"
                  value={formData.ordre}
                  onChange={(e) =>
                    setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                placeholder="Ex: Budget État"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData({ ...formData, type: v as FundingSourceType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={
                !formData.code || !formData.libelle || isCreating || isUpdating
              }
            >
              {isCreating || isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingSource ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Deactivate */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver cette source ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous êtes sur le point de désactiver la source{" "}
                <strong>{selectedSource?.libelle}</strong>.
              </p>
              <p>
                Elle ne sera plus disponible dans les formulaires de saisie, mais les
                données existantes seront conservées.
              </p>
              <div className="pt-2">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder="Indiquez le motif de désactivation..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeactivating}
            >
              {isDeactivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Reactivate */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réactiver cette source ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de réactiver la source{" "}
              <strong>{selectedSource?.libelle}</strong>. Elle sera à nouveau
              disponible dans les formulaires de saisie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              className="bg-green-600 hover:bg-green-700"
              disabled={isReactivating}
            >
              {isReactivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Réactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
