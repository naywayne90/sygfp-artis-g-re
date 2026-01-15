import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteAEFForm } from "@/components/notes-aef/NoteAEFForm";
import { NoteAEFList } from "@/components/notes-aef/NoteAEFList";
import { NoteAEFDetails } from "@/components/notes-aef/NoteAEFDetails";
import { NoteAEFRejectDialog } from "@/components/notes-aef/NoteAEFRejectDialog";
import { NoteAEFDeferDialog } from "@/components/notes-aef/NoteAEFDeferDialog";
import { NoteAEFImputeDialog } from "@/components/notes-aef/NoteAEFImputeDialog";
import { useNotesAEF, NoteAEF } from "@/hooks/useNotesAEF";
import { usePermissions } from "@/hooks/usePermissions";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { ModuleHelp, MODULE_HELP_CONFIG } from "@/components/help/ModuleHelp";
import {
  Plus,
  Lock,
  Search,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function NotesAEF() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();
  const {
    notes,
    notesByStatus,
    isLoading,
    submitNote,
    validateNote,
    rejectNote,
    deferNote,
    imputeNote,
    deleteNote,
  } = useNotesAEF();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("toutes");
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteAEF | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteAEF | null>(null);
  const [rejectingNote, setRejectingNote] = useState<NoteAEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteAEF | null>(null);
  const [imputingNote, setImputingNote] = useState<NoteAEF | null>(null);
  
  // ID de la note SEF pour pré-remplissage (depuis URL ?prefill=...)
  const [prefillNoteSEFId, setPrefillNoteSEFId] = useState<string | null>(null);

  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);

  // Gérer le prefill depuis l'URL
  useEffect(() => {
    const prefillId = searchParams.get("prefill");
    if (prefillId) {
      setPrefillNoteSEFId(prefillId);
      setFormOpen(true);
      // Nettoyer l'URL après utilisation
      searchParams.delete("prefill");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    const getNotesForTab = () => {
      switch (activeTab) {
        case "a_valider":
          return notesByStatus.a_valider;
        case "validees":
          return notesByStatus.valide;
        case "a_imputer":
          return notesByStatus.valide_a_imputer;
        case "rejetees":
          return notesByStatus.rejete;
        case "differees":
          return notesByStatus.differe;
        default:
          return notes;
      }
    };

    const tabNotes = getNotesForTab();

    if (!searchQuery.trim()) return tabNotes;

    const query = searchQuery.toLowerCase();
    return tabNotes.filter(
      (note) =>
        note.numero?.toLowerCase().includes(query) ||
        note.objet.toLowerCase().includes(query) ||
        note.direction?.label?.toLowerCase().includes(query)
    );
  }, [notes, notesByStatus, activeTab, searchQuery]);

  const handleEdit = (note: NoteAEF) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingNote(null);
      setPrefillNoteSEFId(null);
    }
  };

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
  };

  const handleDefer = async (data: {
    noteId: string;
    motif: string;
    deadlineCorrection?: string;
  }) => {
    await deferNote(data);
  };

  const handleImpute = async (noteId: string, budgetLineId: string) => {
    await imputeNote({ noteId, budgetLineId });
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
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle 
          title="Notes AEF" 
          description="Gestion des Notes Avec Effet Financier" 
        />
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
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notes.length}</p>
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
                  {notesByStatus.a_valider.length}
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
                <p className="text-sm text-muted-foreground">À imputer</p>
                <p className="text-2xl font-bold text-primary">
                  {notesByStatus.valide_a_imputer.length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-success">
                  {notesByStatus.valide.length}
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
                <p className="text-sm text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold text-destructive">
                  {notesByStatus.rejete.length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notesByStatus.differe.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, objet ou direction..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="toutes">Toutes ({notes.length})</TabsTrigger>
          <TabsTrigger value="a_valider">
            À valider ({notesByStatus.a_valider.length})
          </TabsTrigger>
          <TabsTrigger value="a_imputer" className="text-primary">
            À imputer ({notesByStatus.valide_a_imputer.length})
          </TabsTrigger>
          <TabsTrigger value="validees">
            Validées ({notesByStatus.valide.length})
          </TabsTrigger>
          <TabsTrigger value="rejetees">
            Rejetées ({notesByStatus.rejete.length})
          </TabsTrigger>
          <TabsTrigger value="differees">
            Différées ({notesByStatus.differe.length})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="toutes">
              <NoteAEFList
                notes={filteredNotes}
                title="Toutes les notes AEF"
                description={`${filteredNotes.length} note(s) trouvée(s)`}
                onView={setViewingNote}
                onEdit={handleEdit}
                onSubmit={submitNote}
                onValidate={validateNote}
                onReject={setRejectingNote}
                onDefer={setDeferringNote}
                onImpute={setImputingNote}
                onDelete={deleteNote}
              />
            </TabsContent>

            <TabsContent value="a_valider">
              <NoteAEFList
                notes={filteredNotes}
                title="Notes à valider"
                description="Notes en attente de validation"
                onView={setViewingNote}
                onValidate={canValidate ? validateNote : undefined}
                onReject={canValidate ? setRejectingNote : undefined}
                onDefer={canValidate ? setDeferringNote : undefined}
                emptyMessage="Aucune note en attente de validation"
              />
            </TabsContent>

            <TabsContent value="a_imputer">
              <NoteAEFList
                notes={filteredNotes}
                title="Notes validées à imputer"
                description="Notes validées en attente d'imputation sur une ligne budgétaire"
                onView={setViewingNote}
                onImpute={setImputingNote}
                emptyMessage="Aucune note en attente d'imputation"
              />
            </TabsContent>

            <TabsContent value="validees">
              <NoteAEFList
                notes={filteredNotes}
                title="Notes validées"
                description="Notes ayant été validées"
                onView={setViewingNote}
                onImpute={setImputingNote}
                emptyMessage="Aucune note validée"
              />
            </TabsContent>

            <TabsContent value="rejetees">
              <NoteAEFList
                notes={filteredNotes}
                title="Notes rejetées"
                description="Notes ayant été rejetées"
                onView={setViewingNote}
                emptyMessage="Aucune note rejetée"
              />
            </TabsContent>

            <TabsContent value="differees">
              <NoteAEFList
                notes={filteredNotes}
                title="Notes différées"
                description="Notes en attente de conditions de reprise"
                onView={setViewingNote}
                onValidate={canValidate ? validateNote : undefined}
                emptyMessage="Aucune note différée"
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialogs */}
      <NoteAEFForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        note={editingNote}
        initialNoteSEFId={prefillNoteSEFId}
      />

      <NoteAEFDetails
        open={!!viewingNote}
        onOpenChange={() => setViewingNote(null)}
        note={viewingNote}
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
