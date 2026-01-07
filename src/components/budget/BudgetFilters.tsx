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

const EXECUTION_STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "OUVERTE", label: "Ouverte" },
  { value: "FERMEE", label: "Fermée" },
  { value: "CLOTUREE", label: "Clôturée" },
];

const LEVEL_OPTIONS = [
  { value: "all", label: "Tous les niveaux" },
  { value: "chapitre", label: "Chapitre" },
  { value: "article", label: "Article" },
  { value: "paragraphe", label: "Paragraphe" },
  { value: "ligne", label: "Ligne" },
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

  const { data: nves } = useQuery({
    queryKey: ["ref-nve-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ref_nve")
        .select("id, code_nve, libelle")
        .eq("actif", true)
        .order("code_nve");
      return data || [];
    },
  });

  // Missions - independent filter (no os_id in schema)
  const { data: missions } = useQuery({
    queryKey: ["missions-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("missions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  // Actions filtered by selected Mission
  const { data: actions } = useQuery({
    queryKey: ["actions-filter", filters.mission_id],
    queryFn: async () => {
      let query = supabase
        .from("actions")
        .select("id, code, libelle, mission_id")
        .eq("est_active", true)
        .order("code");
      
      if (filters.mission_id) {
        query = query.eq("mission_id", filters.mission_id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  // Activités filtered by selected Action
  const { data: activites } = useQuery({
    queryKey: ["activites-filter", filters.action_id],
    queryFn: async () => {
      let query = supabase
        .from("activites")
        .select("id, code, libelle, action_id")
        .eq("est_active", true)
        .order("code");
      
      if (filters.action_id) {
        query = query.eq("action_id", filters.action_id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  // Sous-activités filtered by selected Activité
  const { data: sousActivites } = useQuery({
    queryKey: ["sous-activites-filter", filters.activite_id],
    queryFn: async () => {
      let query = supabase
        .from("sous_activites")
        .select("id, code, libelle, activite_id")
        .eq("est_active", true)
        .order("code");
      
      if (filters.activite_id) {
        query = query.eq("activite_id", filters.activite_id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.direction_id || 
    filters.os_id || 
    filters.mission_id ||
    filters.action_id ||
    filters.activite_id ||
    filters.sous_activite_id ||
    filters.keyword || 
    filters.statut ||
    filters.statut_execution ||
    filters.nve_id ||
    filters.level;

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

      {/* Row 1 - Search + Direction + OS */}
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
          <Label>Niveau</Label>
          <Select
            value={filters.level || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, level: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {LEVEL_OPTIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectValue placeholder="Toutes" />
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
              onFiltersChange({ 
                ...filters, 
                os_id: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
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
      </div>

      {/* Row 2 - Cascade: Mission → Action → Activité → Sous-activité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Mission</Label>
          <Select
            value={filters.mission_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ 
                ...filters, 
                mission_id: value === "all" ? undefined : value,
                action_id: undefined,
                activite_id: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les missions</SelectItem>
              {missions?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code} - {m.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={filters.action_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ 
                ...filters, 
                action_id: value === "all" ? undefined : value,
                activite_id: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {actions?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.code} - {a.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Activité</Label>
          <Select
            value={filters.activite_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ 
                ...filters, 
                activite_id: value === "all" ? undefined : value,
                sous_activite_id: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les activités</SelectItem>
              {activites?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.code} - {a.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sous-activité</Label>
          <Select
            value={filters.sous_activite_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ 
                ...filters, 
                sous_activite_id: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sous-activités</SelectItem>
              {sousActivites?.map((sa) => (
                <SelectItem key={sa.id} value={sa.id}>
                  {sa.code} - {sa.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3 - Other filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Nature dépense (NVE)</Label>
          <Select
            value={filters.nve_id || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, nve_id: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les NVE</SelectItem>
              {nves?.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.code_nve} - {n.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut validation</Label>
          <Select
            value={filters.statut || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, statut: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
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

        <div className="space-y-2">
          <Label>Statut exécution</Label>
          <Select
            value={filters.statut_execution || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, statut_execution: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {EXECUTION_STATUS_OPTIONS.map((s) => (
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