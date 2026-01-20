/**
 * Page Notes Direction Générale (Notes DG officielles)
 * Gestion des notes officielles du Directeur Général avec système d'imputation
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NoteDGList,
  NoteDGForm,
  NoteDGDetails,
  NoteDGRejectDialog,
} from "@/components/notes-dg-officielles";
import {
  useNotesDirectionGenerale,
  NoteDirectionGenerale,
} from "@/hooks/useNotesDirectionGenerale";
import { usePermissions } from "@/hooks/usePermissions";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import {
  Plus,
  Lock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Share2,
  Edit,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NotesDirectionGenerale() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["Admin", "DG"]);

  const {
    notes,
    notesByStatus,
    isLoading,
    refetch,
    submitNote,
    validateNote,
    rejectNote,
    diffuseNote,
    revertToDraft,
    deleteNote,
  } = useNotesDirectionGenerale();

  // État local
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDirectionGenerale | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteDirectionGenerale | null>(null);
  const [rejectingNote, setRejectingNote] = useState<NoteDirectionGenerale | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("toutes");

  // Compteurs
  const counts = {
    total: notes.length,
    brouillon: notesByStatus.brouillon.length,
    soumise_dg: notesByStatus.soumise_dg.length,
    dg_valide: notesByStatus.dg_valide.length,
    dg_rejetee: notesByStatus.dg_rejetee.length,
    diffusee: notesByStatus.diffusee.length,
  };

  // Filtrage par recherche
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let notesToFilter = notes;

    // Filtrer par onglet
    switch (activeTab) {
      case "brouillons":
        notesToFilter = notesByStatus.brouillon;
        break;
      case "soumises":
        notesToFilter = notesByStatus.soumise_dg;
        break;
      case "validees":
        notesToFilter = notesByStatus.dg_valide;
        break;
      case "rejetees":
        notesToFilter = notesByStatus.dg_rejetee;
        break;
      case "diffusees":
        notesToFilter = notesByStatus.diffusee;
        break;
      default:
        notesToFilter = notes;
    }

    // Filtrer par recherche
    if (!query) return notesToFilter;

    return notesToFilter.filter(
      (note) =>
        note.reference?.toLowerCase().includes(query) ||
        note.objet.toLowerCase().includes(query) ||
        note.destinataire.toLowerCase().includes(query) ||
        note.direction?.label?.toLowerCase().includes(query) ||
        note.direction?.sigle?.toLowerCase().includes(query)
    );
  }, [notes, notesByStatus, searchQuery, activeTab]);

  // Handlers
  const handleEdit = (note: NoteDirectionGenerale) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingNote(null);
      refetch();
    }
  };

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
    setRejectingNote(null);
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

  const handleDiffuse = async (noteId: string) => {
    await diffuseNote(noteId);
    refetch();
  };

  const handleRevertToDraft = async (noteId: string) => {
    await revertToDraft(noteId);
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
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle
          title="Notes Direction Générale"
          description="Notes officielles du DG avec système d'imputation"
        />
        <div className="flex items-center gap-2">
          {canValidate && counts.soumise_dg > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate("/notes-dg/validation")}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Espace validation ({counts.soumise_dg})
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={() => setFormOpen(true)}
                    className="gap-2"
                    disabled={!canWrite}
                  >
                    {!canWrite ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Nouvelle note DG
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
                <p className="text-2xl font-bold text-muted-foreground">
                  {counts.brouillon}
                </p>
              </div>
              <Edit className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Soumises</p>
                <p className="text-2xl font-bold text-blue-600">
                  {counts.soumise_dg}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-success">
                  {counts.dg_valide}
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
                  {counts.dg_rejetee}
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
                <p className="text-sm text-muted-foreground">Diffusées</p>
                <p className="text-2xl font-bold text-purple-600">
                  {counts.diffusee}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, objet, destinataire, direction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="toutes">Toutes ({counts.total})</TabsTrigger>
          <TabsTrigger value="brouillons">Brouillons ({counts.brouillon})</TabsTrigger>
          <TabsTrigger value="soumises">Soumises ({counts.soumise_dg})</TabsTrigger>
          <TabsTrigger value="validees">Validées ({counts.dg_valide})</TabsTrigger>
          <TabsTrigger value="rejetees">Rejetées ({counts.dg_rejetee})</TabsTrigger>
          <TabsTrigger value="diffusees">Diffusées ({counts.diffusee})</TabsTrigger>
        </TabsList>

        <TabsContent value="toutes">
          <NoteDGList
            notes={filteredNotes}
            title="Toutes les notes DG"
            description={`${filteredNotes.length} note(s)`}
            onView={setViewingNote}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onValidate={canValidate ? handleValidate : undefined}
            onReject={canValidate ? setRejectingNote : undefined}
            onDiffuse={handleDiffuse}
            onRevertToDraft={handleRevertToDraft}
            onDelete={handleDelete}
            onCreate={() => setFormOpen(true)}
            onRetry={refetch}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="brouillons">
          <NoteDGList
            notes={filteredNotes}
            title="Brouillons"
            description="Notes en cours de rédaction"
            onView={setViewingNote}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onCreate={() => setFormOpen(true)}
            onRetry={refetch}
            isLoading={isLoading}
            emptyMessage="Aucun brouillon"
          />
        </TabsContent>

        <TabsContent value="soumises">
          <NoteDGList
            notes={filteredNotes}
            title="Notes soumises"
            description="En attente de validation DG"
            onView={setViewingNote}
            onValidate={canValidate ? handleValidate : undefined}
            onReject={canValidate ? setRejectingNote : undefined}
            onCreate={() => setFormOpen(true)}
            onRetry={refetch}
            isLoading={isLoading}
            emptyMessage="Aucune note en attente de validation"
          />
        </TabsContent>

        <TabsContent value="validees">
          <NoteDGList
            notes={filteredNotes}
            title="Notes validées"
            description="Prêtes à être diffusées"
            onView={setViewingNote}
            onDiffuse={handleDiffuse}
            onRetry={refetch}
            isLoading={isLoading}
            emptyMessage="Aucune note validée"
          />
        </TabsContent>

        <TabsContent value="rejetees">
          <NoteDGList
            notes={filteredNotes}
            title="Notes rejetées"
            description="À corriger et resoumettre"
            onView={setViewingNote}
            onEdit={handleEdit}
            onRevertToDraft={handleRevertToDraft}
            onRetry={refetch}
            isLoading={isLoading}
            emptyMessage="Aucune note rejetée"
          />
        </TabsContent>

        <TabsContent value="diffusees">
          <NoteDGList
            notes={filteredNotes}
            title="Notes diffusées"
            description="Notes envoyées aux destinataires"
            onView={setViewingNote}
            showActions={false}
            onRetry={refetch}
            isLoading={isLoading}
            emptyMessage="Aucune note diffusée"
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NoteDGForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        note={editingNote}
      />

      <NoteDGDetails
        open={!!viewingNote}
        onOpenChange={() => setViewingNote(null)}
        note={viewingNote}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onValidate={canValidate ? handleValidate : undefined}
        onReject={canValidate ? setRejectingNote : undefined}
        onDiffuse={handleDiffuse}
      />

      <NoteDGRejectDialog
        open={!!rejectingNote}
        onOpenChange={() => setRejectingNote(null)}
        note={rejectingNote}
        onConfirm={handleReject}
      />
    </div>
  );
}
