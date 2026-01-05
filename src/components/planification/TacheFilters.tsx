import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useTacheReferences } from "@/hooks/useTaches";

interface TacheFiltersProps {
  filters: {
    search: string;
    os: string;
    direction: string;
    statut: string;
    retardOnly: boolean;
  };
  onFiltersChange: (filters: TacheFiltersProps["filters"]) => void;
}

export function TacheFilters({ filters, onFiltersChange }: TacheFiltersProps) {
  const { objectifsStrategiques, directions } = useTacheReferences();

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      os: "",
      direction: "",
      statut: "",
      retardOnly: false,
    });
  };

  const hasActiveFilters = filters.search || filters.os || filters.direction || filters.statut || filters.retardOnly;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (code, libellé...)"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.os || "all"}
        onValueChange={(v) => onFiltersChange({ ...filters, os: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Objectif stratégique" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les OS</SelectItem>
          {objectifsStrategiques?.map((os) => (
            <SelectItem key={os.id} value={os.id}>
              {os.code} - {os.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.direction || "all"}
        onValueChange={(v) => onFiltersChange({ ...filters, direction: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les directions</SelectItem>
          {directions?.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.sigle || d.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.statut || "all"}
        onValueChange={(v) => onFiltersChange({ ...filters, statut: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="planifie">Planifié</SelectItem>
          <SelectItem value="en_cours">En cours</SelectItem>
          <SelectItem value="termine">Terminé</SelectItem>
          <SelectItem value="en_retard">En retard</SelectItem>
          <SelectItem value="suspendu">Suspendu</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={filters.retardOnly ? "destructive" : "outline"}
        size="sm"
        onClick={() => onFiltersChange({ ...filters, retardOnly: !filters.retardOnly })}
      >
        En retard uniquement
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
}
