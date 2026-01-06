import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Filter, RotateCcw } from "lucide-react";
import { EtatFilters as EtatFiltersType } from "@/hooks/useEtatsExecution";

interface EtatFiltersProps {
  filters: EtatFiltersType;
  onFiltersChange: (filters: EtatFiltersType) => void;
  directions: { id: string; code: string; label: string; sigle: string | null }[];
  objectifsStrategiques: { id: string; code: string; libelle: string }[];
  missions: { id: string; code: string; libelle: string }[];
  nomenclaturesNBE: { id: string; code: string; libelle: string }[];
  planComptableSYSCO: { id: string; code: string; libelle: string }[];
  exercice: number;
}

export function EtatFilters({
  filters,
  onFiltersChange,
  directions,
  objectifsStrategiques,
  missions,
  nomenclaturesNBE,
  planComptableSYSCO,
  exercice,
}: EtatFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EtatFiltersType>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: EtatFiltersType = { exercice };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = 
    filters.direction_id || 
    filters.os_id || 
    filters.mission_id || 
    filters.nbe_id || 
    filters.sysco_id || 
    filters.periode_debut || 
    filters.periode_fin;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filtres</span>
            {hasActiveFilters && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Actifs
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Réduire" : "Développer"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Quick filters always visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Période début</Label>
            <Input
              type="date"
              value={localFilters.periode_debut || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, periode_debut: e.target.value || undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Période fin</Label>
            <Input
              type="date"
              value={localFilters.periode_fin || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, periode_fin: e.target.value || undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Direction</Label>
            <Select
              value={localFilters.direction_id || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, direction_id: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.sigle || dir.code} - {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Objectif Stratégique</Label>
            <Select
              value={localFilters.os_id || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, os_id: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
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
        </div>

        {/* Extended filters */}
        {isExpanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs">Mission</Label>
              <Select
                value={localFilters.mission_id || "all"}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, mission_id: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les missions</SelectItem>
                  {missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nomenclature NBE</Label>
              <Select
                value={localFilters.nbe_id || "all"}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, nbe_id: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les NBE</SelectItem>
                  {nomenclaturesNBE.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.code} - {n.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Compte SYSCO</Label>
              <Select
                value={localFilters.sysco_id || "all"}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, sysco_id: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
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
            <div className="flex items-end">
              <Button onClick={handleApply} className="w-full">
                Appliquer les filtres
              </Button>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="flex justify-end mt-4">
            <Button onClick={handleApply} size="sm">
              Appliquer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
