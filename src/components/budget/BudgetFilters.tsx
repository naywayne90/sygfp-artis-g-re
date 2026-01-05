import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { BudgetLineFilters } from "@/hooks/useBudgetLines";

interface BudgetFiltersProps {
  filters: BudgetLineFilters;
  onFiltersChange: (filters: BudgetLineFilters) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "soumis", label: "Soumis" },
  { value: "valide", label: "Validé" },
  { value: "rejete", label: "Rejeté" },
];

export function BudgetFilters({ filters, onFiltersChange }: BudgetFiltersProps) {
  const { data: directions } = useQuery({
    queryKey: ["directions-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("directions")
        .select("id, code, label")
        .eq("est_active", true)
        .order("label");
      return data || [];
    },
  });

  const { data: objectifs } = useQuery({
    queryKey: ["objectifs-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      return data || [];
    },
  });

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.direction_id || 
    filters.os_id || 
    filters.keyword || 
    filters.statut;

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtres</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Recherche</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Code ou libellé..."
              value={filters.keyword || ""}
              onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Direction</Label>
          <Select
            value={filters.direction_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, direction_id: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les directions</SelectItem>
              {directions?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.code} - {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Objectif Stratégique</Label>
          <Select
            value={filters.os_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, os_id: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les OS</SelectItem>
              {objectifs?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.code} - {o.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={filters.statut || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, statut: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}