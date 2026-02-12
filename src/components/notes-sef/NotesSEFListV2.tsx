/**
 * NotesSEFListV2 - Nouvelle version de la liste des Notes SEF
 * Avec onglets, compteurs, filtres et exports
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NotesSEFTabs } from './NotesSEFTabs';
import { NotesSEFFilters } from './NotesSEFFilters';
import { NotesSEFTable } from './NotesSEFTable';
import { NotesSEFExports } from './NotesSEFExports';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { useNotesSEFList } from '@/hooks/useNotesSEFList';
import { useNotesSEF } from '@/hooks/useNotesSEF';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import NoteSEFForm from './NoteSEFForm';

interface NotesSEFListV2Props {
  className?: string;
}

export function NotesSEFListV2({ className }: NotesSEFListV2Props) {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Hook de liste avec pagination et filtres
  const {
    notes,
    counts,
    pagination,
    isLoading,
    isCountsLoading,
    searchQuery,
    activeTab,
    filters,
    setSearchQuery,
    setActiveTab,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    refetch,
  } = useNotesSEFList({ pageSize: 20 });

  // Hook pour les directions (pour les filtres)
  const { directions } = useNotesSEF();

  // Permissions
  const isValidator = hasAnyRole(['ADMIN', 'DG', 'DAAF']);
  const showValidationButtons = isValidator && activeTab === 'a_valider';

  return (
    <div className={className}>
      <Card>
        {/* En-tête */}
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Gestion des Notes SEF</CardTitle>
              <CardDescription className="mt-1">
                {isCountsLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  `${counts.total} note(s) pour l'exercice ${exercice}`
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Exports */}
              <NotesSEFExports activeTab={activeTab} filters={filters} searchQuery={searchQuery} />

              {/* Créer une note */}
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle note
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Onglets avec compteurs */}
          <NotesSEFTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
            isLoading={isCountsLoading}
          />

          {/* Filtres */}
          <NotesSEFFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            directions={directions}
          />

          {/* Tableau */}
          <NotesSEFTable
            notes={notes}
            isLoading={isLoading}
            onRefresh={refetch}
            showValidationButtons={showValidationButtons}
          />

          {/* Pagination */}
          <NotesPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Modal de création */}
      <NoteSEFForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          refetch();
        }}
      />
    </div>
  );
}

export default NotesSEFListV2;
