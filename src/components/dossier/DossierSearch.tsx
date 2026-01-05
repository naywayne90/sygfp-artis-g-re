import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { DossierFilters } from "@/hooks/useDossiers";

interface DossierSearchProps {
  filters: DossierFilters;
  onFiltersChange: (filters: DossierFilters) => void;
  directions: { id: string; code: string; label: string; sigle: string | null }[];
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

export function DossierSearch({ filters, onFiltersChange, directions, exercices }: DossierSearchProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleReset = () => {
    onFiltersChange({
      search: "",
      direction_id: "",
      exercice: null,
      statut: "",
      etape: "",
    });
  };

  const hasFilters = filters.search || filters.direction_id || filters.statut || filters.etape;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, objet, bénéficiaire..."
            value={filters.search}
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
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-1 block">Direction</label>
            <Select
              value={filters.direction_id}
              onValueChange={(value) => onFiltersChange({ ...filters, direction_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {directions.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.sigle || dir.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Exercice</label>
            <Select
              value={filters.exercice?.toString() || ""}
              onValueChange={(value) => onFiltersChange({ ...filters, exercice: value ? parseInt(value) : null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {exercices.map((ex) => (
                  <SelectItem key={ex} value={ex.toString()}>
                    {ex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Statut</label>
            <Select
              value={filters.statut}
              onValueChange={(value) => onFiltersChange({ ...filters, statut: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {STATUTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Étape</label>
            <Select
              value={filters.etape}
              onValueChange={(value) => onFiltersChange({ ...filters, etape: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {ETAPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
