import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, X, Filter, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { DossierFilters } from "@/hooks/useDossiers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierSearchProps {
  filters: Partial<DossierFilters>;
  onFiltersChange: (filters: Partial<DossierFilters>) => void;
  directions: { id: string; code: string; label: string; sigle: string | null }[];
  beneficiaires: { id: string; raison_sociale: string | null }[];
  users: { id: string; full_name: string | null; email: string }[];
  exercices: number[];
}

const STATUTS = [
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
  { value: "suspendu", label: "Suspendu" },
];

const ETAPES = [
  { value: "note", label: "Note" },
  { value: "expression_besoin", label: "Expression de besoin" },
  { value: "marche", label: "Marché" },
  { value: "engagement", label: "Engagement" },
  { value: "liquidation", label: "Liquidation" },
  { value: "ordonnancement", label: "Ordonnancement" },
  { value: "reglement", label: "Règlement" },
];

const TYPES_DOSSIER = [
  { value: "AEF", label: "AEF - Achat/Engagement/Facture" },
  { value: "SEF", label: "SEF - Service/Engagement/Facture" },
  { value: "MARCHE", label: "Marché public" },
];

export function DossierSearch({ 
  filters, 
  onFiltersChange, 
  directions, 
  beneficiaires,
  users,
  exercices 
}: DossierSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleReset = () => {
    onFiltersChange({
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
    });
  };

  const hasFilters = filters.search || filters.direction_id || filters.statut || filters.etape || 
    filters.type_dossier || filters.date_debut || filters.date_fin || 
    filters.montant_min !== null || filters.montant_max !== null ||
    filters.beneficiaire_id || filters.created_by || filters.en_retard || filters.mes_dossiers;

  const countActiveFilters = () => {
    let count = 0;
    if (filters.direction_id) count++;
    if (filters.statut) count++;
    if (filters.etape) count++;
    if (filters.type_dossier) count++;
    if (filters.date_debut || filters.date_fin) count++;
    if (filters.montant_min !== null || filters.montant_max !== null) count++;
    if (filters.beneficiaire_id) count++;
    if (filters.created_by) count++;
    if (filters.en_retard) count++;
    if (filters.mes_dossiers) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, objet, bénéficiaire, code budget, n° engagement..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {countActiveFilters() > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs font-bold">
              {countActiveFilters()}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filtres de base */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type dossier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type dossier</Label>
              <Select
                value={filters.type_dossier || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, type_dossier: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {TYPES_DOSSIER.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Direction</Label>
              <Select
                value={filters.direction_id || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, direction_id: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle || dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Statut</Label>
              <Select
                value={filters.statut || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, statut: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Étape */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Étape</Label>
              <Select
                value={filters.etape || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, etape: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {ETAPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm">Filtres avancés</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Plage de dates */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.date_debut ? format(new Date(filters.date_debut), "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.date_debut ? new Date(filters.date_debut) : undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, date_debut: date ? format(date, "yyyy-MM-dd") : "" })}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.date_fin ? format(new Date(filters.date_fin), "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.date_fin ? new Date(filters.date_fin) : undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, date_fin: date ? format(date, "yyyy-MM-dd") : "" })}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fourchette de montant */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Montant min (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.montant_min ?? ""}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      montant_min: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Montant max (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.montant_max ?? ""}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      montant_max: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Bénéficiaire */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Bénéficiaire</Label>
                  <Select
                    value={filters.beneficiaire_id || "all"}
                    onValueChange={(value) => onFiltersChange({ ...filters, beneficiaire_id: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {beneficiaires.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.raison_sociale || "Sans nom"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Créateur */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Créé par</Label>
                  <Select
                    value={filters.created_by || "all"}
                    onValueChange={(value) => onFiltersChange({ ...filters, created_by: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exercice */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Exercice</Label>
                  <Select
                    value={filters.exercice?.toString() || "all"}
                    onValueChange={(value) => onFiltersChange({ ...filters, exercice: value === "all" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Courant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Courant</SelectItem>
                      {exercices.map((ex) => (
                        <SelectItem key={ex} value={ex.toString()}>
                          {ex}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* En retard */}
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="en_retard"
                    checked={filters.en_retard || false}
                    onCheckedChange={(checked) => onFiltersChange({ ...filters, en_retard: !!checked })}
                  />
                  <Label htmlFor="en_retard" className="text-sm cursor-pointer">
                    Dossiers en retard uniquement
                  </Label>
                </div>
              </div>

              {/* Mes dossiers */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="mes_dossiers"
                  checked={filters.mes_dossiers || false}
                  onCheckedChange={(checked) => onFiltersChange({ ...filters, mes_dossiers: !!checked })}
                />
                <Label htmlFor="mes_dossiers" className="text-sm cursor-pointer font-medium">
                  Mes dossiers uniquement
                </Label>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
