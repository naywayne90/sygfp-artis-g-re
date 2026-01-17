import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Search,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Plus,
  Minus,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface SelectedBudgetLine {
  id: string;
  code: string;
  label: string;
  montant: number;
  disponible_net: number;
  dotation_actuelle: number;
  dotation_initiale: number;
  total_engage: number;
  montant_reserve: number;
  pourcentage?: number;
}

export interface BudgetLineFilters {
  exercice?: number;
  direction_id?: string | null;
  os_id?: string | null;
  nbe_id?: string | null;
  sysco_id?: string | null;
  action_id?: string | null;
  activite_id?: string | null;
}

interface BudgetLineSelectorProps {
  montantTotal: number;
  selectedLines: SelectedBudgetLine[];
  onSelectionChange: (lines: SelectedBudgetLine[]) => void;
  directionId?: string | null;
  osId?: string | null;
  nbeId?: string | null;
  syscoId?: string | null;
  actionId?: string | null;
  activiteId?: string | null;
  disabled?: boolean;
  showFilters?: boolean;
  onFiltersChange?: (filters: BudgetLineFilters) => void;
}

interface BudgetLineWithAvailability {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_actuelle: number;
  total_engage: number;
  montant_reserve: number;
  disponible_net: number;
  taux_engagement: number;
  direction?: { id: string; sigle: string | null; label: string };
  os?: { id: string; code: string; libelle: string };
  nbe?: { id: string; code: string; libelle: string };
  sysco?: { id: string; code: string; libelle: string };
  action?: { id: string; code: string; libelle: string };
  activite?: { id: string; code: string; libelle: string };
}

export function BudgetLineSelector({
  montantTotal,
  selectedLines,
  onSelectionChange,
  directionId,
  osId,
  nbeId,
  syscoId,
  actionId,
  activiteId,
  disabled = false,
  showFilters = true,
  onFiltersChange,
}: BudgetLineSelectorProps) {
  const { exercice } = useExercice();
  const [search, setSearch] = useState("");
  const [ventilationMode, setVentilationMode] = useState<"single" | "multi">("single");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtres locaux
  const [localFilters, setLocalFilters] = useState<BudgetLineFilters>({
    exercice: exercice || new Date().getFullYear(),
    direction_id: directionId,
    os_id: osId,
    nbe_id: nbeId,
    sysco_id: syscoId,
    action_id: actionId,
    activite_id: activiteId,
  });

  // Sync filters from props
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      direction_id: directionId,
      os_id: osId,
      nbe_id: nbeId,
      sysco_id: syscoId,
      action_id: actionId,
      activite_id: activiteId,
    }));
  }, [directionId, osId, nbeId, syscoId, actionId, activiteId]);

  // Référentiels pour les filtres
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, label, sigle")
        .eq("est_active", true)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  const { data: objectifsStrategiques = [] } = useQuery({
    queryKey: ["os-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: nomenclaturesNBE = [] } = useQuery({
    queryKey: ["nbe-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nomenclature_nbe")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: planComptableSYSCO = [] } = useQuery({
    queryKey: ["sysco-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_comptable_sysco")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["actions-filter", localFilters.os_id],
    queryFn: async () => {
      let query = supabase
        .from("actions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (localFilters.os_id) query = query.eq("os_id", localFilters.os_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: activites = [] } = useQuery({
    queryKey: ["activites-filter", localFilters.action_id],
    queryFn: async () => {
      let query = supabase
        .from("activites")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      if (localFilters.action_id) query = query.eq("action_id", localFilters.action_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les lignes budgétaires disponibles avec filtres améliorés
  const { data: budgetLines = [], isLoading, refetch } = useQuery({
    queryKey: ["budget-lines-available", exercice, localFilters],
    queryFn: async () => {
      let query = supabase
        .from("budget_lines")
        .select(`
          id,
          code,
          label,
          dotation_initiale,
          dotation_modifiee,
          total_engage,
          montant_reserve,
          direction:directions(id, sigle, label),
          os:objectifs_strategiques(id, code, libelle),
          nbe:nomenclature_nbe(id, code, libelle),
          sysco:plan_comptable_sysco(id, code, libelle),
          action:actions(id, code, libelle),
          activite:activites(id, code, libelle)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("is_active", true)
        .order("code");

      // Appliquer les filtres
      if (localFilters.direction_id) query = query.eq("direction_id", localFilters.direction_id);
      if (localFilters.os_id) query = query.eq("os_id", localFilters.os_id);
      if (localFilters.nbe_id) query = query.eq("nbe_id", localFilters.nbe_id);
      if (localFilters.sysco_id) query = query.eq("sysco_id", localFilters.sysco_id);
      if (localFilters.action_id) query = query.eq("action_id", localFilters.action_id);
      if (localFilters.activite_id) query = query.eq("activite_id", localFilters.activite_id);

      const { data: lines, error } = await query;
      if (error) throw error;

      // Calculer les disponibilités en batch pour éviter trop de requêtes
      const lineIds = (lines || []).map(l => l.id);

      // Fetch virements en batch
      const { data: allVirementsRecus } = await supabase
        .from("credit_transfers")
        .select("to_budget_line_id, amount")
        .in("to_budget_line_id", lineIds)
        .eq("status", "execute");

      const { data: allVirementsEmis } = await supabase
        .from("credit_transfers")
        .select("from_budget_line_id, amount")
        .in("from_budget_line_id", lineIds)
        .eq("status", "execute");

      // Grouper les virements par ligne
      const virementsRecusParLigne: Record<string, number> = {};
      const virementsEmisParLigne: Record<string, number> = {};

      allVirementsRecus?.forEach(v => {
        virementsRecusParLigne[v.to_budget_line_id] = (virementsRecusParLigne[v.to_budget_line_id] || 0) + (v.amount || 0);
      });

      allVirementsEmis?.forEach(v => {
        virementsEmisParLigne[v.from_budget_line_id] = (virementsEmisParLigne[v.from_budget_line_id] || 0) + (v.amount || 0);
      });

      const linesWithAvailability: BudgetLineWithAvailability[] = (lines || []).map((line) => {
        const totalRecus = virementsRecusParLigne[line.id] || 0;
        const totalEmis = virementsEmisParLigne[line.id] || 0;

        const dotation_actuelle = (line.dotation_initiale || 0) + totalRecus - totalEmis;
        const total_engage = line.total_engage || 0;
        const montant_reserve = line.montant_reserve || 0;
        const disponible_net = dotation_actuelle - total_engage - montant_reserve;
        const taux_engagement = dotation_actuelle > 0 ? (total_engage / dotation_actuelle) * 100 : 0;

        return {
          id: line.id,
          code: line.code,
          label: line.label,
          dotation_initiale: line.dotation_initiale || 0,
          dotation_actuelle,
          total_engage,
          montant_reserve,
          disponible_net,
          taux_engagement,
          direction: line.direction as BudgetLineWithAvailability["direction"],
          os: line.os as BudgetLineWithAvailability["os"],
          nbe: line.nbe as BudgetLineWithAvailability["nbe"],
          sysco: line.sysco as BudgetLineWithAvailability["sysco"],
          action: line.action as BudgetLineWithAvailability["action"],
          activite: line.activite as BudgetLineWithAvailability["activite"],
        };
      });

      return linesWithAvailability;
    },
    enabled: !!exercice,
  });

  // Notifier les changements de filtres
  const handleFilterChange = (key: keyof BudgetLineFilters, value: string | null) => {
    const newFilters = { ...localFilters, [key]: value || null };

    // Reset dependent filters
    if (key === "os_id") {
      newFilters.action_id = null;
      newFilters.activite_id = null;
    }
    if (key === "action_id") {
      newFilters.activite_id = null;
    }

    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const resetFilters = () => {
    const resetFilters: BudgetLineFilters = {
      exercice: exercice || new Date().getFullYear(),
      direction_id: null,
      os_id: null,
      nbe_id: null,
      sysco_id: null,
      action_id: null,
      activite_id: null,
    };
    setLocalFilters(resetFilters);
    onFiltersChange?.(resetFilters);
  };

  const activeFiltersCount = useMemo(() => {
    return [
      localFilters.direction_id,
      localFilters.os_id,
      localFilters.nbe_id,
      localFilters.sysco_id,
      localFilters.action_id,
      localFilters.activite_id,
    ].filter(Boolean).length;
  }, [localFilters]);

  // Filtrer les lignes
  const filteredLines = budgetLines.filter(
    (line) =>
      line.code.toLowerCase().includes(search.toLowerCase()) ||
      line.label.toLowerCase().includes(search.toLowerCase())
  );

  // Montant total sélectionné
  const totalSelected = selectedLines.reduce((sum, l) => sum + l.montant, 0);
  const remainingAmount = montantTotal - totalSelected;

  // Gérer la sélection d'une ligne
  const handleToggleLine = (line: BudgetLineWithAvailability, checked: boolean) => {
    if (disabled) return;

    if (checked) {
      // En mode single, remplacer la sélection
      if (ventilationMode === "single") {
        onSelectionChange([{
          id: line.id,
          code: line.code,
          label: line.label,
          montant: montantTotal,
          disponible_net: line.disponible_net,
          dotation_actuelle: line.dotation_actuelle,
          dotation_initiale: line.dotation_initiale,
          total_engage: line.total_engage,
          montant_reserve: line.montant_reserve,
          pourcentage: 100,
        }]);
      } else {
        // En mode multi, ajouter
        onSelectionChange([
          ...selectedLines,
          {
            id: line.id,
            code: line.code,
            label: line.label,
            montant: remainingAmount > 0 ? remainingAmount : 0,
            disponible_net: line.disponible_net,
            dotation_actuelle: line.dotation_actuelle,
            dotation_initiale: line.dotation_initiale,
            total_engage: line.total_engage,
            montant_reserve: line.montant_reserve,
          },
        ]);
      }
    } else {
      onSelectionChange(selectedLines.filter((l) => l.id !== line.id));
    }
  };

  // Modifier le montant d'une ligne sélectionnée
  const handleMontantChange = (lineId: string, newMontant: number) => {
    if (disabled) return;

    onSelectionChange(
      selectedLines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              montant: newMontant,
              pourcentage: montantTotal > 0 ? (newMontant / montantTotal) * 100 : 0,
            }
          : l
      )
    );
  };

  // Vérifier si une ligne peut recevoir le montant
  const canReceiveAmount = (line: BudgetLineWithAvailability, amount: number): boolean => {
    return line.disponible_net >= amount;
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const isLineSelected = (lineId: string) =>
    selectedLines.some((l) => l.id === lineId);

  const getSelectedLine = (lineId: string) =>
    selectedLines.find((l) => l.id === lineId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Sélection des lignes budgétaires
            </CardTitle>
            <CardDescription>
              Montant à imputer: <strong>{formatMontant(montantTotal)}</strong>
              {budgetLines.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  ({budgetLines.length} ligne{budgetLines.length > 1 ? "s" : ""} disponible{budgetLines.length > 1 ? "s" : ""})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant={ventilationMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setVentilationMode("single");
                if (selectedLines.length > 1) {
                  onSelectionChange([selectedLines[0]]);
                }
              }}
              disabled={disabled}
            >
              Ligne unique
            </Button>
            <Button
              variant={ventilationMode === "multi" ? "default" : "outline"}
              size="sm"
              onClick={() => setVentilationMode("multi")}
              disabled={disabled}
            >
              Multi-lignes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres avancés */}
        {showFilters && (
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres avancés
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </span>
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 p-4 bg-muted/50 rounded-lg">
                {/* Direction */}
                <div>
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={localFilters.direction_id || "all"}
                    onValueChange={(v) => handleFilterChange("direction_id", v === "all" ? null : v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les directions</SelectItem>
                      {directions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.sigle || d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Objectif Stratégique */}
                <div>
                  <Label className="text-xs">Objectif Strat.</Label>
                  <Select
                    value={localFilters.os_id || "all"}
                    onValueChange={(v) => handleFilterChange("os_id", v === "all" ? null : v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les OS</SelectItem>
                      {objectifsStrategiques.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          {os.code} - {os.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NBE */}
                <div>
                  <Label className="text-xs">Nature NBE</Label>
                  <Select
                    value={localFilters.nbe_id || "all"}
                    onValueChange={(v) => handleFilterChange("nbe_id", v === "all" ? null : v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les natures</SelectItem>
                      {nomenclaturesNBE.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.code} - {n.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SYSCO */}
                <div>
                  <Label className="text-xs">Compte SYSCO</Label>
                  <Select
                    value={localFilters.sysco_id || "all"}
                    onValueChange={(v) => handleFilterChange("sysco_id", v === "all" ? null : v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {planComptableSYSCO.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} - {s.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action */}
                <div>
                  <Label className="text-xs">Action</Label>
                  <Select
                    value={localFilters.action_id || "all"}
                    onValueChange={(v) => handleFilterChange("action_id", v === "all" ? null : v)}
                    disabled={disabled || actions.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      {actions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activité */}
                <div>
                  <Label className="text-xs">Activité</Label>
                  <Select
                    value={localFilters.activite_id || "all"}
                    onValueChange={(v) => handleFilterChange("activite_id", v === "all" ? null : v)}
                    disabled={disabled || activites.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les activités</SelectItem>
                      {activites.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
        {/* Résumé de la sélection */}
        {selectedLines.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Montant réparti:</span>
              <span className={totalSelected === montantTotal ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                {formatMontant(totalSelected)} / {formatMontant(montantTotal)}
              </span>
            </div>
            <Progress value={(totalSelected / montantTotal) * 100} className="h-2" />
            
            {remainingAmount > 0 && (
              <Alert variant="default" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Répartition incomplète</AlertTitle>
                <AlertDescription>
                  Il reste {formatMontant(remainingAmount)} à répartir
                </AlertDescription>
              </Alert>
            )}

            {/* Lignes sélectionnées */}
            <div className="space-y-2 mt-4">
              <h4 className="font-medium text-sm">Lignes sélectionnées:</h4>
              {selectedLines.map((line) => {
                const isInsufficient = line.montant > line.disponible_net;
                return (
                  <div
                    key={line.id}
                    className={`flex items-center gap-3 p-2 rounded-md border ${
                      isInsufficient ? "border-destructive bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm">{line.code}</div>
                      <div className="text-xs text-muted-foreground truncate">{line.label}</div>
                      <div className="text-xs">
                        Disponible: <span className={isInsufficient ? "text-destructive" : "text-green-600"}>
                          {formatMontant(line.disponible_net)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ventilationMode === "multi" && (
                        <Input
                          type="number"
                          value={line.montant}
                          onChange={(e) => handleMontantChange(line.id, Number(e.target.value))}
                          className="w-32 text-right"
                          disabled={disabled}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectionChange(selectedLines.filter((l) => l.id !== line.id))}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {isInsufficient && (
                      <Badge variant="destructive" className="shrink-0">
                        Insuffisant
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou libellé..."
            className="pl-9"
            disabled={disabled}
          />
        </div>

        {/* Liste des lignes */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des lignes budgétaires...
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune ligne budgétaire trouvée</p>
          </div>
        ) : (
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Dotation actuelle</TableHead>
                  <TableHead className="text-right">Disponible net</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLines.map((line) => {
                  const isSelected = isLineSelected(line.id);
                  const selectedLine = getSelectedLine(line.id);
                  const canReceive = canReceiveAmount(line, montantTotal);
                  const isInsufficient = selectedLine && selectedLine.montant > line.disponible_net;

                  return (
                    <TableRow
                      key={line.id}
                      className={`cursor-pointer ${isSelected ? "bg-primary/5" : ""} ${
                        !canReceive && !isSelected ? "opacity-50" : ""
                      }`}
                      onClick={() => {
                        if (!disabled && (canReceive || isSelected)) {
                          handleToggleLine(line, !isSelected);
                        }
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleLine(line, !!checked)}
                          disabled={disabled || (!canReceive && !isSelected)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {line.code}
                        {line.direction?.sigle && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {line.direction.sigle}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {line.label}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMontant(line.dotation_actuelle)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        line.disponible_net < 0 ? "text-destructive" :
                        line.disponible_net < montantTotal ? "text-orange-600" :
                        "text-green-600"
                      }`}>
                        {formatMontant(line.disponible_net)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(line.taux_engagement, 100)}
                            className="w-16 h-2"
                          />
                          <span className="text-xs text-muted-foreground">
                            {line.taux_engagement.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canReceive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Limité
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Message d'aide */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Disponible net</strong> = Dotation actuelle − Engagements − Réservations.
            La réservation bloque le montant jusqu'à la création de l'engagement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
