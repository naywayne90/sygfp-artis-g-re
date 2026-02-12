/**
 * Hook pour la liste paginée des Notes SEF
 * Gère la recherche serveur-side avec debounce et les compteurs
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notesSefService, type ListNotesOptions } from '@/lib/notes-sef/notesSefService';
import type { NoteSEFEntity, NoteSEFCounts, PaginatedResult } from '@/lib/notes-sef/types';
import { useExercice } from '@/contexts/ExerciceContext';
import type { FiltersState } from '@/components/shared/NotesFiltersBar';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UseNotesSEFListOptions {
  pageSize?: number;
  initialTab?: string;
}

export interface UseNotesSEFListReturn {
  // Data
  notes: NoteSEFEntity[];
  counts: NoteSEFCounts;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // State
  isLoading: boolean;
  isCountsLoading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  activeTab: string;
  filters: FiltersState;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: FiltersState) => void;
  resetFilters: () => void;
  refetch: () => void;
}

const defaultFilters: FiltersState = {
  directionId: null,
  urgence: null,
  dateFrom: null,
  dateTo: null,
};

/**
 * Hook principal pour la liste paginée des Notes SEF
 * avec recherche serveur-side et debounce 300ms
 */
export function useNotesSEFList(options: UseNotesSEFListOptions = {}): UseNotesSEFListReturn {
  const { pageSize: initialPageSize = 20, initialTab = 'toutes' } = options;
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // État local
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  // Debounce de la recherche (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, filters]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  // Convertir l'onglet actif en filtre de statut
  const statutFilter = useMemo(() => {
    switch (activeTab) {
      case 'brouillons':
        return 'brouillon';
      case 'a_valider':
        return ['soumis', 'a_valider']; // Soumis + À valider
      case 'validees':
        return ['valide', 'valide_auto']; // Valide + Valide auto (SEF shadow)
      case 'differees':
        return 'differe';
      case 'rejetees':
        return 'rejete';
      default:
        return undefined; // Toutes les notes
    }
  }, [activeTab]);

  // Query pour les compteurs (séparée pour éviter les recalculs)
  const { data: countsResult, isLoading: isCountsLoading } = useQuery({
    queryKey: ['notes-sef-counts', exercice],
    queryFn: async () => {
      if (!exercice) return null;
      return notesSefService.getCounts(exercice);
    },
    enabled: !!exercice,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
  });

  // Query pour les notes paginées
  const {
    data: listResult,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['notes-sef-list', exercice, page, pageSize, debouncedSearch, statutFilter, filters],
    queryFn: async () => {
      if (!exercice) return null;

      const options: ListNotesOptions = {
        exercice,
        page,
        pageSize,
        search: debouncedSearch || undefined,
        statut: statutFilter,
        direction_id: filters.directionId || undefined,
        urgence: filters.urgence || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      };

      return notesSefService.listPaginated(options);
    },
    enabled: !!exercice,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
  });

  // Invalider les compteurs et la liste après une mutation
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notes-sef-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notes-sef-list'] });
    queryClient.invalidateQueries({ queryKey: ['notes-sef'] }); // Pour l'ancien hook
  }, [queryClient]);

  // Données par défaut
  const defaultCounts: NoteSEFCounts = {
    total: 0,
    brouillon: 0,
    soumis: 0,
    a_valider: 0,
    valide: 0,
    differe: 0,
    rejete: 0,
  };

  const defaultPagination: PaginatedResult<NoteSEFEntity> = {
    data: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
  };

  // Extraire les données
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const counts = countsResult?.success ? countsResult.data! : defaultCounts;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const paginatedData = listResult?.success ? listResult.data! : defaultPagination;

  return {
    // Data
    notes: paginatedData.data,
    counts,
    pagination: {
      page: paginatedData.page,
      pageSize: paginatedData.pageSize,
      total: paginatedData.total,
      totalPages: paginatedData.totalPages,
    },

    // State
    isLoading,
    isCountsLoading,
    error: queryError ? (queryError as Error).message : null,

    // Filters
    searchQuery,
    activeTab,
    filters,

    // Actions
    setSearchQuery,
    setActiveTab,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    refetch: () => {
      invalidateQueries();
      refetch();
    },
  };
}
