/**
 * Barre de filtres unifiée pour les pages de liste
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Search, X, Filter } from "lucide-react";
import { STATUT_CATEGORIES, STATUT_CATEGORY_LABELS, type StatutCategoryType } from "@/lib/config/sygfp-constants";

interface ListFiltersProps {
  /** Valeur de recherche */
  searchValue: string;
  /** Handler de changement de recherche */
  onSearchChange: (value: string) => void;
  /** Placeholder du champ de recherche */
  searchPlaceholder?: string;
  /** Catégorie de statut sélectionnée */
  statusCategory?: StatutCategoryType;
  /** Handler de changement de catégorie */
  onStatusCategoryChange?: (value: StatutCategoryType) => void;
  /** Afficher le filtre de statut */
  showStatusFilter?: boolean;
  /** Éléments de filtre additionnels */
  children?: React.ReactNode;
  /** Classes additionnelles */
  className?: string;
}

export function ListFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  statusCategory,
  onStatusCategoryChange,
  showStatusFilter = true,
  children,
  className,
}: ListFiltersProps) {
  const hasFilters = searchValue || (statusCategory && statusCategory !== STATUT_CATEGORIES.TOUS);
  
  const clearFilters = () => {
    onSearchChange('');
    if (onStatusCategoryChange) {
      onStatusCategoryChange(STATUT_CATEGORIES.TOUS);
    }
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg",
      className
    )}>
      {/* Recherche */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtre par statut */}
      {showStatusFilter && onStatusCategoryChange && (
        <Select
          value={statusCategory || STATUT_CATEGORIES.TOUS}
          onValueChange={(v) => onStatusCategoryChange(v as StatutCategoryType)}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUT_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filtres additionnels */}
      {children}

      {/* Bouton effacer les filtres */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
}
