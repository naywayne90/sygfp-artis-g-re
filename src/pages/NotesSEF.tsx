import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteSEFForm } from "@/components/notes-sef/NoteSEFForm";
import { NoteSEFList } from "@/components/notes-sef/NoteSEFList";
import { NoteSEFDetails } from "@/components/notes-sef/NoteSEFDetails";
import { NoteSEFRejectDialog } from "@/components/notes-sef/NoteSEFRejectDialog";
import { NoteSEFDeferDialog } from "@/components/notes-sef/NoteSEFDeferDialog";
import { useNotesSEF, NoteSEF } from "@/hooks/useNotesSEF";
import { usePermissions } from "@/hooks/usePermissions";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { useExport } from "@/hooks/useExport";
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
  Loader2,
  Download,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function NotesSEF() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();
  const { isExporting, exportToExcel } = useExport();
  const {
    notes,
    notesByStatus,
    isLoading,
    submitNote,
    validateNote,
    rejectNote,
    deferNote,
    deleteNote,
  } = useNotesSEF();

  const handleExportExcel = async () => {
    const exportData = filteredNotes.map((note) => ({
      "N° Note": note.numero || "",
      "Objet": note.objet,
      "Direction": note.direction?.label || note.direction?.sigle || "",
      "Demandeur": note.demandeur
        ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`
        : "",
      "Statut": getStatutLabel(note.statut),
      "Urgence": getUrgenceLabel(note.urgence),
      "Exercice": note.exercice,
      "Date Création": note.created_at
        ? new Date(note.created_at).toLocaleDateString("fr-FR")
        : "",
      "Description": note.description || "",
      "Commentaire": note.commentaire || "",
    }));

    await exportToExcel(
      exportData,
      `notes_sef_${exercice}_${activeTab}`,
      "Notes SEF"
    );
  };

  const getStatutLabel = (statut: string | null) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      soumis: "Soumis",
      a_valider: "À valider",
      valide: "Validé",
      rejete: "Rejeté",
      differe: "Différé",
    };
    return labels[statut || "brouillon"] || statut || "";
  };

  const getUrgenceLabel = (urgence: string | null) => {
    const labels: Record<string, string> = {
      basse: "Basse",
      normale: "Normale",
      haute: "Haute",
      urgente: "Urgente",
    };
    return labels[urgence || "normale"] || urgence || "";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("toutes");
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteSEF | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteSEF | null>(null);
  const [rejectingNote, setRejectingNote] = useState<NoteSEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteSEF | null>(null);

  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    const getNotesForTab = () => {
      switch (activeTab) {
        case "a_valider":
          return notesByStatus.a_valider;
        case "validees":
          return notesByStatus.valide;
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

  const handleEdit = (note: NoteSEF) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingNote(null);
  };

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
  };

  const handleDefer = async (data: {
    noteId: string;
    motif: string;
    condition?: string;
    dateReprise?: string;
  }) => {
    await deferNote(data);
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
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting || filteredNotes.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter Excel
          </Button>
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

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
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
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notesByStatus.differe.length}
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
                  {notesByStatus.rejete.length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="toutes">Toutes ({notes.length})</TabsTrigger>
          <TabsTrigger value="a_valider">
            À valider ({notesByStatus.a_valider.length})
          </TabsTrigger>
          <TabsTrigger value="validees">
            Validées ({notesByStatus.valide.length})
          </TabsTrigger>
          <TabsTrigger value="differees">
            Différées ({notesByStatus.differe.length})
          </TabsTrigger>
          <TabsTrigger value="rejetees">
            Rejetées ({notesByStatus.rejete.length})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="toutes">
              <NoteSEFList
                notes={filteredNotes}
                title="Toutes les notes SEF"
                description={`${filteredNotes.length} note(s) trouvée(s)`}
                onView={setViewingNote}
                onEdit={handleEdit}
                onSubmit={submitNote}
                onValidate={validateNote}
                onReject={setRejectingNote}
                onDefer={setDeferringNote}
                onDelete={deleteNote}
              />
            </TabsContent>

            <TabsContent value="a_valider">
              <NoteSEFList
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

            <TabsContent value="validees">
              <NoteSEFList
                notes={filteredNotes}
                title="Notes validées"
                description="Notes ayant été validées"
                onView={setViewingNote}
                showActions={true}
                emptyMessage="Aucune note validée"
              />
            </TabsContent>

            <TabsContent value="differees">
              <NoteSEFList
                notes={filteredNotes}
                title="Notes différées"
                description="Notes en attente de conditions de reprise"
                onView={setViewingNote}
                onValidate={canValidate ? validateNote : undefined}
                showActions={true}
                emptyMessage="Aucune note différée"
              />
            </TabsContent>

            <TabsContent value="rejetees">
              <NoteSEFList
                notes={filteredNotes}
                title="Notes rejetées"
                description="Notes ayant été rejetées"
                onView={setViewingNote}
                showActions={true}
                emptyMessage="Aucune note rejetée"
              />
            </TabsContent>
          </>
        )}
      </Tabs>

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
