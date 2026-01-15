import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteSEFForm } from "@/components/notes-sef/NoteSEFForm";
import { NoteSEFList } from "@/components/notes-sef/NoteSEFList";
import { NoteSEFDetails } from "@/components/notes-sef/NoteSEFDetails";
import { NoteSEFRejectDialog } from "@/components/notes-sef/NoteSEFRejectDialog";
import { NoteSEFDeferDialog } from "@/components/notes-sef/NoteSEFDeferDialog";
import { useNotesSEF, NoteSEF } from "@/hooks/useNotesSEF";
import { useNotesSEFList } from "@/hooks/useNotesSEFList";
import { useNotesSEFExport } from "@/hooks/useNotesSEFExport";
import { usePermissions } from "@/hooks/usePermissions";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { ModuleHelp, MODULE_HELP_CONFIG } from "@/components/help/ModuleHelp";
import { NotesFiltersBar, type FiltersState } from "@/components/shared/NotesFiltersBar";
import { NotesPagination } from "@/components/shared/NotesPagination";
import {
  Plus,
  Lock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function NotesSEF() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();
  const { exportNotesSEF, isExporting, exportProgress } = useNotesSEFExport();
  
  // Nouveau hook pour la liste paginée
  const {
    notes: filteredNotes,
    counts,
    pagination,
    isLoading,
    error: listError,
    searchQuery,
    activeTab,
    setSearchQuery,
    setActiveTab,
    setPage,
    setPageSize,
    refetch,
  } = useNotesSEFList({ pageSize: 20 });

  // Hook existant pour les mutations
  const {
    submitNote,
    validateNote,
    rejectNote,
    deferNote,
    deleteNote,
  } = useNotesSEF();

  // État local pour les dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteSEF | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteSEF | null>(null);
  const [rejectingNote, setRejectingNote] = useState<NoteSEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteSEF | null>(null);

  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);

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
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle 
          title="Notes SEF" 
          description="Gestion des Notes Sans Effet Financier" 
        />
        <div className="flex items-center gap-2">
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
                  {isExporting ? (exportProgress || "Export...") : "Exporter Excel"}
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
                  <Button 
                    onClick={() => setFormOpen(true)} 
                    className="gap-2"
                    disabled={!canWrite}
                  >
                    {!canWrite ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Nouvelle note SEF
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
        </div>
      </div>

      {/* KPIs - Compteurs serveur-side */}
      <div className="grid gap-4 md:grid-cols-5">
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
                <p className="text-2xl font-bold text-warning">
                  {aValiderCount}
                </p>
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
                <p className="text-2xl font-bold text-success">
                  {counts.valide}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {counts.differe}
                </p>
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
                <p className="text-2xl font-bold text-destructive">
                  {counts.rejete}
                </p>
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
            filters={{ directionId: null, urgence: null, dateFrom: null, dateTo: null }}
            onFiltersChange={() => {}}
            onResetFilters={() => setSearchQuery('')}
            showUrgence={true}
          />
        </CardContent>
      </Card>

      {/* Tabs - Filtre serveur-side */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="toutes">Toutes ({counts.total})</TabsTrigger>
          <TabsTrigger value="a_valider">
            À valider ({aValiderCount})
          </TabsTrigger>
          <TabsTrigger value="validees">
            Validées ({counts.valide})
          </TabsTrigger>
          <TabsTrigger value="differees">
            Différées ({counts.differe})
          </TabsTrigger>
          <TabsTrigger value="rejetees">
            Rejetées ({counts.rejete})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toutes">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Toutes les notes SEF"
            description={`${pagination.total} note(s) trouvée(s)`}
            onView={(note) => setViewingNote(note)}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onValidate={handleValidate}
            onReject={setRejectingNote}
            onDefer={setDeferringNote}
            onDelete={handleDelete}
            onCreate={() => setFormOpen(true)}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
          />
        </TabsContent>

        <TabsContent value="a_valider">
          <NoteSEFList
            notes={filteredNotes as NoteSEF[]}
            title="Notes à valider"
            description="Notes en attente de validation"
            onView={(note) => setViewingNote(note)}
            onValidate={canValidate ? handleValidate : undefined}
            onReject={canValidate ? setRejectingNote : undefined}
            onDefer={canValidate ? setDeferringNote : undefined}
            onCreate={() => setFormOpen(true)}
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
            onView={(note) => setViewingNote(note)}
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
            onView={(note) => setViewingNote(note)}
            onValidate={canValidate ? handleValidate : undefined}
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
            onView={(note) => setViewingNote(note)}
            showActions={true}
            onRetry={refetch}
            isLoading={isLoading}
            error={listError}
            emptyMessage="Aucune note rejetée"
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Afficher</span>
                <Select 
                  value={String(pagination.pageSize)} 
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>par page</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <NoteSEFForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        note={editingNote}
      />

      <NoteSEFDetails
        open={!!viewingNote}
        onOpenChange={() => setViewingNote(null)}
        note={viewingNote}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onValidate={canValidate ? handleValidate : undefined}
        onReject={canValidate ? setRejectingNote : undefined}
        onDefer={canValidate ? setDeferringNote : undefined}
      />

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
    </div>
  );
}
