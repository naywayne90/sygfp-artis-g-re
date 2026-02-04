/**
 * NotesSEFFilters - Barre de filtres pour la liste des Notes SEF
 * Recherche avec debounce, Direction dropdown, Période (date range)
 */

import { useState, useEffect } from 'react';
import { Search, X, CalendarIcon, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DirectionRef } from '@/lib/notes-sef/types';

export interface FiltersState {
  directionId: string | null;
  urgence: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface NotesSEFFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  onReset: () => void;
  directions: DirectionRef[];
  className?: string;
}

export function NotesSEFFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onReset,
  directions,
  className,
}: NotesSEFFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );

  // Sync dates with filters
  useEffect(() => {
    const newDateFrom = dateFrom ? dateFrom.toISOString().split('T')[0] : null;
    const newDateTo = dateTo ? dateTo.toISOString().split('T')[0] : null;

    if (filters.dateFrom !== newDateFrom || filters.dateTo !== newDateTo) {
      onFiltersChange({
        ...filters,
        dateFrom: newDateFrom,
        dateTo: newDateTo,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // Count active filters
  const activeFiltersCount = [
    filters.directionId,
    filters.urgence,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onReset();
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Recherche */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, objet..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Direction */}
      <Select
        value={filters.directionId || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, directionId: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les directions</SelectItem>
          {directions.map((dir) => (
            <SelectItem key={dir.id} value={dir.id}>
              {dir.sigle ? `${dir.sigle} - ${dir.label}` : dir.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Période - Date de début */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[140px] justify-start text-left font-normal',
              !dateFrom && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Du'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={setDateFrom}
            locale={fr}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Période - Date de fin */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[140px] justify-start text-left font-normal',
              !dateTo && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Au'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={setDateTo}
            locale={fr}
            disabled={(date) => dateFrom ? date < dateFrom : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Indicateur filtres actifs + Reset */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Filter className="h-4 w-4" />
          <span>Réinitialiser</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}
