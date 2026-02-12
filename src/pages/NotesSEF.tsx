import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteSEFForm } from '@/components/notes-sef/NoteSEFForm';
import { NoteSEFList } from '@/components/notes-sef/NoteSEFList';
import { NoteSEFDetailSheet } from '@/components/notes-sef/NoteSEFDetailSheet';
import { NoteSEFRejectDialog } from '@/components/notes-sef/NoteSEFRejectDialog';
import { NoteSEFDeferDialog } from '@/components/notes-sef/NoteSEFDeferDialog';
import { useNotesSEF, NoteSEF } from '@/hooks/useNotesSEF';
import { useNotesSEFList } from '@/hooks/useNotesSEFList';
import { useNotesSEFExport } from '@/hooks/useNotesSEFExport';
import { usePermissions } from '@/hooks/usePermissions';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { useRBAC } from '@/contexts/RBACContext';
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
  Edit,
  Download,
  Loader2,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NotesSEF() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();
  const { canCreate: canCreateRBAC } = useRBAC();

  // Vérification combinée : exercice ouvert ET profil autorisé à créer
  const canCreateNoteSEF = canWrite && canCreateRBAC('note_sef');
  const { exportNotesSEF, exportNotesSEFPDF, isExporting, exportProgress } = useNotesSEFExport();

  // Nouveau hook pour la liste paginée avec filtres avancés
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
  } = useNotesSEFList({ pageSize: 50 });

  // Hook existant pour les mutations
  const { submitNote, validateNote, rejectNote, deferNote, resubmitNote, deleteNote } =
    useNotesSEF();

  // État local pour les dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteSEF | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteSEF | null>(null);
  const navigate = useNavigate();
  const [rejectingNote, setRejectingNote] = useState<NoteSEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteSEF | null>(null);

  const canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF']);

  // Compteurs dérivés
  const brouillonsCount = counts.brouillon;
  // Compteur "À valider" = soumis + a_valider
  const aValiderCount = counts.soumis + counts.a_valider;

  // Convertir l'onglet actif en filtre de statut pour l'export
  const statutFilterForExport = useMemo(() => {
    switch (activeTab) {
      case 'a_valider':
        return ['soumis', 'a_valider'];
      case 'validees':
        return 'valide';
      case 'differees':
        return 'differe';
      case 'rejetees':
        return 'rejete';
      default:
        return undefined;
    }
  }, [activeTab]);

  const handleExportExcel = async () => {
    await exportNotesSEF(
      { statut: statutFilterForExport, search: searchQuery || undefined },
      activeTab
    );
  };

  const handleExportPDF = async () => {
    await exportNotesSEFPDF(
      { statut: statutFilterForExport, search: searchQuery || undefined },
      activeTab
    );
  };

  const handleEdit = (note: NoteSEF) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingNote(null);
      refetch(); // Rafraîchir après fermeture
    }
  };

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
    refetch();
  };

  const handleDefer = async (data: {
    noteId: string;
    motif: string;
    condition?: string;
    dateReprise?: string;
  }) => {
    await deferNote(data);
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

  const handleResume = async (noteId: string) => {
    await resubmitNote(noteId);
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
      <WorkflowStepIndicator currentStep={1} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.notes_sef} />

      {/* Header */}
      <PageHeader
        title="Notes SEF"
        description="Gestion des Notes Sans Effet Financier"
        icon={FileText}
        stepNumber={1}
        backUrl="/"
      >
        {canValidate && (
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/notes-sef/validation')}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Espace validation ({aValiderCount})
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting} className="gap-2">
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? exportProgress || 'Export...' : 'Exporter'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exporter en Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
              <Printer className="h-4 w-4 mr-2" />
              Exporter en PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => setFormOpen(true)}
                  className="gap-2"
                  disabled={!canCreateNoteSEF}
                >
                  {!canCreateNoteSEF ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Nouvelle note SEF
                </Button>
              </span>
            </TooltipTrigger>
            {!canCreateNoteSEF && (
              <TooltipContent>
                <p>
                  {!canWrite
                    ? getDisabledMessage()
                    : "Vous n'avez pas les droits pour créer une Note SEF"}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </PageHeader>

      {/* KPIs - Compteurs serveur-side */}
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
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold text-muted-foreground">{brouillonsCount}</p>
              </div>
              <Edit className="h-8 w-8 text-muted-foreground/50" />
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
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-success">{counts.valide}</p>
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

      {/* Recherche et filtres avancés */}
      <Card>
        <CardContent className="pt-6">
          <NotesFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par référence, objet, direction, demandeur..."
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={resetFilters}
            showUrgence={true}
          />
        </CardContent>
      </Card>

      {/* Tabs - Filtre serveur-side */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="toutes">Toutes ({counts.total})</TabsTrigger>
          <TabsTrigger value="brouillons">Brouillons ({brouillonsCount})</TabsTrigger>
          <TabsTrigger value="a_valider">À valider ({aValiderCount})</TabsTrigger>
          <TabsTrigger value="validees">Validées ({counts.valide})</TabsTrigger>
          <TabsTrigger value="differees">Différées ({counts.differe})</TabsTrigger>
          <TabsTrigger value="rejetees">Rejetées ({counts.rejete})</TabsTrigger>
        </TabsList>

        <TabsContent value="toutes">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Toutes les notes SEF"
            description={
              pagination.totalPages > 1
                ? `${pagination.total} note(s) trouvée(s) \u2022 Page ${pagination.page}/${pagination.totalPages}`
                : `${pagination.total} note(s) trouvée(s)`
            }
            onView={(note) => setSelectedNote(note)}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onValidate={handleValidate}
            onReject={setRejectingNote}
            onDefer={setDeferringNote}
            onDelete={handleDelete}
            onCreate={canCreateNoteSEF ? () => setFormOpen(true) : undefined}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
          />
        </TabsContent>

        <TabsContent value="brouillons">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Brouillons"
            description="Notes en cours de rédaction"
            onView={(note) => setSelectedNote(note)}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onCreate={canCreateNoteSEF ? () => setFormOpen(true) : undefined}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucun brouillon"
          />
        </TabsContent>

        <TabsContent value="a_valider">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Notes à valider"
            description="Notes en attente de validation"
            onView={(note) => setSelectedNote(note)}
            onValidate={canValidate ? handleValidate : undefined}
            onReject={canValidate ? setRejectingNote : undefined}
            onDefer={canValidate ? setDeferringNote : undefined}
            onCreate={canCreateNoteSEF ? () => setFormOpen(true) : undefined}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucune note en attente de validation"
          />
        </TabsContent>

        <TabsContent value="validees">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Notes validées"
            description="Notes ayant été validées"
            onView={(note) => setSelectedNote(note)}
            showActions={true}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucune note validée"
          />
        </TabsContent>

        <TabsContent value="differees">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Notes différées"
            description="Notes en attente de conditions de reprise"
            onView={(note) => setSelectedNote(note)}
            onValidate={canValidate ? handleValidate : undefined}
            onResume={handleResume}
            showActions={true}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucune note différée"
          />
        </TabsContent>

        <TabsContent value="rejetees">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Notes rejetées"
            description="Notes ayant été rejetées"
            onView={(note) => setSelectedNote(note)}
            onResume={handleResume}
            showActions={true}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucune note rejetée"
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.total > 0 && (
        <NotesPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Dialogs */}
      <NoteSEFForm open={formOpen} onOpenChange={handleCloseForm} note={editingNote} />

      <NoteSEFRejectDialog
        open={!!rejectingNote}
        onOpenChange={() => setRejectingNote(null)}
        note={rejectingNote}
        onConfirm={handleReject}
      />

      <NoteSEFDeferDialog
        open={!!deferringNote}
        onOpenChange={() => setDeferringNote(null)}
        note={deferringNote}
        onConfirm={handleDefer}
      />

      {/* Sheet de détail (remplace le Drawer aperçu rapide) */}
      <NoteSEFDetailSheet
        open={!!selectedNote}
        onOpenChange={(open) => !open && setSelectedNote(null)}
        note={selectedNote}
        onEdit={handleEdit}
        onNavigateToDetail={(note) => {
          setSelectedNote(null);
          navigate(`/notes-sef/${note.id}`);
        }}
      />
    </div>
  );
}
