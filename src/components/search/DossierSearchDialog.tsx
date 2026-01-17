import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Filter,
  Save,
  X,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Building2,
  Calendar,
  Banknote,
  FolderOpen,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { useDossiers, DossierFilters } from "@/hooks/useDossiers";
import { useSavedViews, SavedViewFilters } from "@/hooks/useSavedViews";
import { useExercice } from "@/contexts/ExerciceContext";
import { DossierSearchResults } from "./DossierSearchResults";
import { SaveViewDialog } from "./SaveViewDialog";

interface DossierSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUT_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "solde", label: "Soldé" },
  { value: "annule", label: "Annulé" },
  { value: "suspendu", label: "Suspendu" },
  { value: "bloque", label: "Bloqué" },
];

const ETAPE_OPTIONS = [
  { value: "", label: "Toutes les étapes" },
  { value: "note", label: "Note SEF" },
  { value: "expression_besoin", label: "Expression de besoin" },
  { value: "engagement", label: "Engagement" },
  { value: "liquidation", label: "Liquidation" },
  { value: "ordonnancement", label: "Ordonnancement" },
  { value: "reglement", label: "Règlement" },
];

const TYPE_DOSSIER_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "AEF", label: "AEF - Action État de Frais" },
  { value: "SEF", label: "SEF - Standard État de Frais" },
  { value: "investissement", label: "Investissement" },
  { value: "fonctionnement", label: "Fonctionnement" },
];

const DEFAULT_FILTERS: SavedViewFilters = {
  search: "",
  direction_id: "",
  exercice: null,
  statut: "",
  etape: "",
  type_dossier: "",
  date_debut: "",
  date_fin: "",
  montant_min: null,
  montant_max: null,
  beneficiaire_id: "",
  created_by: "",
  en_retard: false,
  mes_dossiers: false,
  os_id: "",
  action_id: "",
  activite_id: "",
};

export function DossierSearchDialog({ open, onOpenChange }: DossierSearchDialogProps) {
  const { exercice } = useExercice();
  const {
    dossiers,
    loading,
    directions,
    beneficiaires,
    users,
    pagination,
    fetchDossiers,
  } = useDossiers();
  const {
    savedViews,
    predefinedViews,
    createView,
    deleteView,
    isLoading: loadingViews,
  } = useSavedViews();

  const [filters, setFilters] = useState<SavedViewFilters>(DEFAULT_FILTERS);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.direction_id) count++;
    if (filters.statut) count++;
    if (filters.etape) count++;
    if (filters.type_dossier) count++;
    if (filters.date_debut) count++;
    if (filters.date_fin) count++;
    if (filters.montant_min !== null) count++;
    if (filters.montant_max !== null) count++;
    if (filters.beneficiaire_id) count++;
    if (filters.created_by) count++;
    if (filters.en_retard) count++;
    if (filters.mes_dossiers) count++;
    if (filters.os_id) count++;
    if (filters.action_id) count++;
    if (filters.activite_id) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleSearch = () => {
    const queryFilters: Partial<DossierFilters> = {
      search: filters.search || "",
      direction_id: filters.direction_id || "",
      exercice: filters.exercice ?? exercice,
      statut: filters.statut || "",
      etape: filters.etape || "",
      type_dossier: filters.type_dossier || "",
      date_debut: filters.date_debut || "",
      date_fin: filters.date_fin || "",
      montant_min: filters.montant_min,
      montant_max: filters.montant_max,
      beneficiaire_id: filters.beneficiaire_id || "",
      created_by: filters.created_by || "",
      en_retard: filters.en_retard || false,
      mes_dossiers: filters.mes_dossiers || false,
    };
    fetchDossiers(queryFilters, 1, 50);
    setHasSearched(true);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setHasSearched(false);
  };

  const handleApplyView = (viewFilters: SavedViewFilters) => {
    setFilters({ ...DEFAULT_FILTERS, ...viewFilters });
    // Auto-search when applying a view
    setTimeout(() => handleSearch(), 100);
  };

  const updateFilter = (key: keyof SavedViewFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Search className="h-5 w-5 text-primary" />
              Recherche de dossiers
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-[calc(90vh-100px)]">
            {/* Sidebar: Saved Views */}
            <div className="w-64 border-r bg-muted/30 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Vues rapides
                  </h3>
                  <div className="space-y-1">
                    {predefinedViews.map((view, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm h-8"
                        onClick={() => handleApplyView(view.filters)}
                      >
                        {view.icon === "user" && <User className="h-3.5 w-3.5 mr-2" />}
                        {view.icon === "alert" && <AlertCircle className="h-3.5 w-3.5 mr-2 text-warning" />}
                        {view.icon === "clock" && <Clock className="h-3.5 w-3.5 mr-2" />}
                        {view.icon === "check" && <CheckCircle className="h-3.5 w-3.5 mr-2 text-success" />}
                        <span className="truncate">{view.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Mes vues sauvegardées
                  </h3>
                  {loadingViews ? (
                    <p className="text-xs text-muted-foreground">Chargement...</p>
                  ) : savedViews.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune vue sauvegardée</p>
                  ) : (
                    <div className="space-y-1">
                      {savedViews.map((view) => (
                        <div key={view.id} className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start text-sm h-8"
                            onClick={() => handleApplyView(view.filters)}
                          >
                            <FolderOpen className="h-3.5 w-3.5 mr-2" />
                            <span className="truncate">{view.name}</span>
                            {view.is_default && (
                              <Star className="h-3 w-3 ml-auto text-warning fill-warning" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteView.mutate(view.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <Tabs defaultValue="filters" className="flex-1 flex flex-col">
                <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
                  <TabsTrigger value="filters" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="results" className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Résultats
                    {hasSearched && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {pagination.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="filters" className="flex-1 mt-0 p-6">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-6">
                      {/* Search bar */}
                      <div className="space-y-2">
                        <Label>Recherche globale</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Numéro de dossier, objet, référence..."
                            value={filters.search || ""}
                            onChange={(e) => updateFilter("search", e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {/* Quick filters */}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="mes-dossiers"
                            checked={filters.mes_dossiers || false}
                            onCheckedChange={(checked) => updateFilter("mes_dossiers", checked)}
                          />
                          <Label htmlFor="mes-dossiers" className="text-sm">
                            Mes dossiers uniquement
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="en-retard"
                            checked={filters.en_retard || false}
                            onCheckedChange={(checked) => updateFilter("en_retard", checked)}
                          />
                          <Label htmlFor="en-retard" className="text-sm text-warning">
                            En retard
                          </Label>
                        </div>
                      </div>

                      <Separator />

                      {/* Main filters grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Direction */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Direction
                          </Label>
                          <Select
                            value={filters.direction_id || ""}
                            onValueChange={(value) => updateFilter("direction_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Toutes les directions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Toutes les directions</SelectItem>
                              {directions.map((dir) => (
                                <SelectItem key={dir.id} value={dir.id}>
                                  {dir.sigle || dir.code} - {dir.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Statut */}
                        <div className="space-y-2">
                          <Label>Statut</Label>
                          <Select
                            value={filters.statut || ""}
                            onValueChange={(value) => updateFilter("statut", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Étape */}
                        <div className="space-y-2">
                          <Label>Étape en cours</Label>
                          <Select
                            value={filters.etape || ""}
                            onValueChange={(value) => updateFilter("etape", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Toutes les étapes" />
                            </SelectTrigger>
                            <SelectContent>
                              {ETAPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Type dossier */}
                        <div className="space-y-2">
                          <Label>Type de dossier</Label>
                          <Select
                            value={filters.type_dossier || ""}
                            onValueChange={(value) => updateFilter("type_dossier", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_DOSSIER_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bénéficiaire */}
                        <div className="space-y-2">
                          <Label>Bénéficiaire / Prestataire</Label>
                          <Select
                            value={filters.beneficiaire_id || ""}
                            onValueChange={(value) => updateFilter("beneficiaire_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les prestataires" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tous les prestataires</SelectItem>
                              {beneficiaires.map((ben) => (
                                <SelectItem key={ben.id} value={ben.id}>
                                  {ben.raison_sociale}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Créateur */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Créé par
                          </Label>
                          <Select
                            value={filters.created_by || ""}
                            onValueChange={(value) => updateFilter("created_by", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les utilisateurs" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tous les utilisateurs</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name || user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Date range */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Période de création
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Du</Label>
                            <Input
                              type="date"
                              value={filters.date_debut || ""}
                              onChange={(e) => updateFilter("date_debut", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Au</Label>
                            <Input
                              type="date"
                              value={filters.date_fin || ""}
                              onChange={(e) => updateFilter("date_fin", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Montant range */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Fourchette de montant (FCFA)
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Minimum</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={filters.montant_min ?? ""}
                              onChange={(e) =>
                                updateFilter(
                                  "montant_min",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Maximum</Label>
                            <Input
                              type="number"
                              placeholder="Illimité"
                              value={filters.montant_max ?? ""}
                              onChange={(e) =>
                                updateFilter(
                                  "montant_max",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="results" className="flex-1 mt-0 overflow-hidden">
                  <DossierSearchResults
                    dossiers={dossiers}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={(page) => fetchDossiers(filters as any, page, 50)}
                    onClose={() => onOpenChange(false)}
                  />
                </TabsContent>
              </Tabs>

              {/* Footer actions */}
              <div className="border-t p-4 flex items-center justify-between bg-card">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={activeFiltersCount === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder la vue
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fermer
                  </Button>
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SaveViewDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        filters={filters}
        onSave={(name, description, isDefault) => {
          createView.mutate({
            name,
            description,
            filters,
            is_default: isDefault,
          });
          setShowSaveDialog(false);
        }}
      />
    </>
  );
}
