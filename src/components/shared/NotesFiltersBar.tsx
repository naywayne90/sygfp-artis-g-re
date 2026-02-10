/**
 * Barre de filtres partagée pour SEF/AEF
 * Filtres: Direction, Urgence, Dates
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FiltersState {
  directionId: string | null;
  urgence: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface NotesFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters: FiltersState;
  onFiltersChange: (filters: Partial<FiltersState>) => void;
  onResetFilters: () => void;
  showUrgence?: boolean;
  urgenceField?: 'urgence' | 'priorite';
}

const URGENCE_OPTIONS = [
  { value: 'basse', label: 'Basse' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'urgente', label: 'Urgente' },
];

export function NotesFiltersBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  filters,
  onFiltersChange,
  onResetFilters,
  showUrgence = true,
}: NotesFiltersBarProps) {
  // Fetch directions
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-active-filters"],
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

  const activeFiltersCount = [
    filters.directionId,
    filters.urgence,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({ dateFrom: date ? date.toISOString() : null });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({ dateTo: date ? date.toISOString() : null });
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9 pr-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtres avancés */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Direction */}
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Direction</Label>
          <Select
            value={filters.directionId || "all"}
            onValueChange={(value) => 
              onFiltersChange({ directionId: value === "all" ? null : value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les directions</SelectItem>
              {directions.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.sigle || dir.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgence */}
        {showUrgence && (
          <div className="min-w-[140px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Urgence</Label>
            <Select
              value={filters.urgence || "all"}
              onValueChange={(value) => 
                onFiltersChange({ urgence: value === "all" ? null : value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {URGENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date de début */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Du</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom
                  ? format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: fr })
                  : "Début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={handleDateFromChange}
                locale={fr}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date de fin */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Au</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo
                  ? format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: fr })
                  : "Fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={handleDateToChange}
                locale={fr}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Bouton reset */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
