/**
 * Barre de filtres du module Virements (onglet "Demandes").
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Filtres : recherche plein texte, type (virement/ajustement), statut.
 * Affiche un compteur de résultats filtrés + bouton "Effacer".
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { STATUS_CONFIG } from './constants';

interface VirementFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
}

export function VirementFilters({
  searchTerm,
  onSearchTermChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  activeFiltersCount,
  filteredCount,
  totalCount,
  onClear,
}: VirementFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Code, motif, ligne..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="virement">Virements</SelectItem>
                <SelectItem value="ajustement">Ajustements</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
                <X className="h-4 w-4" />
                Effacer ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              {filteredCount} / {totalCount} demande(s) affichée(s)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
