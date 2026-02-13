import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteAEFForm } from '@/components/notes-aef/NoteAEFForm';
import { NoteAEFList } from '@/components/notes-aef/NoteAEFList';
import { NoteAEFDetailSheet } from '@/components/notes-aef/NoteAEFDetailSheet';
import { NoteAEFRejectDialog } from '@/components/notes-aef/NoteAEFRejectDialog';
import { NoteAEFDeferDialog } from '@/components/notes-aef/NoteAEFDeferDialog';
import { NoteAEFImputeDialog } from '@/components/notes-aef/NoteAEFImputeDialog';
import { useNotesAEF, NoteAEF } from '@/hooks/useNotesAEF';
import { useNotesAEFList } from '@/hooks/useNotesAEFList';
import { useNotesAEFExport } from '@/hooks/useNotesAEFExport';
import { usePermissions } from '@/hooks/usePermissions';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';
import { NotesFiltersBar } from '@/components/shared/NotesFiltersBar';
import { NotesPagination } from '@/components/shared/NotesPagination';
import {
  Plus,
  Lock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
  Download,
  FileEdit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function NotesAEF() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();

  // Hook pour l'export Excel
  const { exportNotesAEF, isExporting, exportProgress } = useNotesAEFExport();

  // Nouveau hook pour liste paginée avec filtres
  const {
    notes: filteredNotes,
    counts,
    pagination,
    isLoading,
    error: listError,
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
  } = useNotesAEFList({ pageSize: 20 });

  // Hook existant pour les mutations
  const { submitNote, validateNote, rejectNote, deferNote, imputeNote, deleteNote } = useNotesAEF();

  // État local pour les dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteAEF | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteAEF | null>(null);
  const [rejectingNote, setRejectingNote] = useState<NoteAEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteAEF | null>(null);
  const [imputingNote, setImputingNote] = useState<NoteAEF | null>(null);

  // ID de la note SEF pour pré-remplissage (depuis URL ?prefill=...)
  const [prefillNoteSEFId, setPrefillNoteSEFId] = useState<string | null>(null);

  const canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF']);

  // Handler pour l'export Excel
  const handleExportExcel = async () => {
    await exportNotesAEF({ search: searchQuery || undefined }, activeTab);
  };

  // Gérer le prefill depuis l'URL
  useEffect(() => {
    const prefillId = searchParams.get('prefill');
    if (prefillId) {
      setPrefillNoteSEFId(prefillId);
      setFormOpen(true);
      searchParams.delete('prefill');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Compteur "À valider" = soumis + a_valider
  const aValiderCount = counts.soumis + counts.a_valider;

  const handleEdit = (note: NoteAEF) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingNote(null);
      setPrefillNoteSEFId(null);
      refetch();
    }
  };

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
    refetch();
  };

  const handleDefer = async (data: {
    noteId: string;
    motif: string;
    deadlineCorrection?: string;
  }) => {
    await deferNote(data);
    refetch();
  };

  const handleImpute = async (noteId: string, budgetLineId: string) => {
    await imputeNote({ noteId, budgetLineId });
    refetch();
  };

  const handleSubmit = async (noteId: string) => {
    await submitNote(noteId);
    refetch();
  };

  const handleValidate = async (noteId: string) => {
    await validateNote(noteId);
    refetch();
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    refetch();
  };

  if (!exercice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Veuillez sélectionner un exercice</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={2} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.notes_aef} />

      {/* Header */}
      <PageHeader
        title="Notes AEF"
        description="Gestion des Notes Avec Effet Financier"
        icon={FileEdit}
        stepNumber={2}
        backUrl="/"
      >
        {/* Lien vers espace validation */}
        {hasAnyRole(['ADMIN', 'DG', 'DAAF']) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/notes-aef/validation')}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Validation
                  {counts.soumis + counts.a_valider > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {counts.soumis + counts.a_valider}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Espace de validation DAAF/DG</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? exportProgress || 'Export...' : 'Exporter Excel'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exporter les notes de l'onglet actuel en Excel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={() => setFormOpen(true)} className="gap-2" disabled={!canWrite}>
                  {!canWrite ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Nouvelle note AEF
                </Button>
              </span>
            </TooltipTrigger>
            {!canWrite && (
              <TooltipContent>
                <p>{getDisabledMessage()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{aValiderCount}</p>
              </div>
              <Send className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À imputer</p>
                <p className="text-2xl font-bold text-primary">{counts.a_imputer}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imputées</p>
                <p className="text-2xl font-bold text-success">{counts.impute}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold text-orange-600">{counts.differe}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold text-destructive">{counts.rejete}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="pt-6">
          <NotesFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par référence, objet, direction, montant..."
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={resetFilters}
            showUrgence={true}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="toutes">Toutes ({counts.total})</TabsTrigger>
          <TabsTrigger value="a_valider">À valider ({aValiderCount})</TabsTrigger>
          <TabsTrigger value="a_imputer" className="text-primary">
            À imputer ({counts.a_imputer})
          </TabsTrigger>
          <TabsTrigger value="imputees">Imputées ({counts.impute})</TabsTrigger>
          <TabsTrigger value="differees">Différées ({counts.differe})</TabsTrigger>
          <TabsTrigger value="rejetees">Rejetées ({counts.rejete})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : listError ? (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-destructive">
                <p>Erreur de chargement: {listError}</p>
                <Button variant="outline" onClick={refetch} className="mt-4">
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="toutes">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Toutes les notes AEF"
                description={`${filteredNotes.length} note(s) trouvée(s)`}
                onView={setViewingNote}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onValidate={handleValidate}
                onReject={setRejectingNote}
                onDefer={setDeferringNote}
                onImpute={setImputingNote}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="a_valider">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Notes à valider"
                description="Notes en attente de validation"
                onView={setViewingNote}
                onValidate={canValidate ? handleValidate : undefined}
                onReject={canValidate ? setRejectingNote : undefined}
                onDefer={canValidate ? setDeferringNote : undefined}
                emptyMessage="Aucune note en attente de validation"
              />
            </TabsContent>

            <TabsContent value="a_imputer">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Notes validées à imputer"
                description="Notes validées en attente d'imputation sur une ligne budgétaire"
                onView={setViewingNote}
                onImpute={setImputingNote}
                emptyMessage="Aucune note en attente d'imputation"
              />
            </TabsContent>

            <TabsContent value="imputees">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Notes imputées"
                description="Notes ayant été imputées sur une ligne budgétaire"
                onView={setViewingNote}
                emptyMessage="Aucune note imputée"
              />
            </TabsContent>

            <TabsContent value="differees">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Notes différées"
                description="Notes en attente de conditions de reprise"
                onView={setViewingNote}
                onValidate={canValidate ? handleValidate : undefined}
                emptyMessage="Aucune note différée"
              />
            </TabsContent>

            <TabsContent value="rejetees">
              <NoteAEFList
                notes={filteredNotes as NoteAEF[]}
                title="Notes rejetées"
                description="Notes ayant été rejetées"
                onView={setViewingNote}
                emptyMessage="Aucune note rejetée"
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Pagination */}
      <NotesPagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Dialogs */}
      <NoteAEFForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        note={editingNote}
        initialNoteSEFId={prefillNoteSEFId}
      />

      <NoteAEFDetailSheet
        open={!!viewingNote}
        onOpenChange={() => setViewingNote(null)}
        note={viewingNote}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
      />

      <NoteAEFRejectDialog
        open={!!rejectingNote}
        onOpenChange={() => setRejectingNote(null)}
        note={rejectingNote}
        onConfirm={handleReject}
      />

      <NoteAEFDeferDialog
        open={!!deferringNote}
        onOpenChange={() => setDeferringNote(null)}
        note={deferringNote}
        onConfirm={handleDefer}
      />

      <NoteAEFImputeDialog
        open={!!imputingNote}
        onOpenChange={() => setImputingNote(null)}
        note={imputingNote}
        onConfirm={handleImpute}
      />
    </div>
  );
}
