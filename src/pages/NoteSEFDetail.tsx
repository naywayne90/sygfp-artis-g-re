/**
 * Page détail d'une Note SEF
 * Route: /notes-sef/:id
 * 
 * - Affiche tous les champs de la note
 * - Pièces jointes avec téléchargement (URL signée)
 * - Historique (timeline)
 * - Édition si brouillon et créateur/admin
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useNotesSEF, NoteSEF, NoteSEFHistory } from "@/hooks/useNotesSEF";
import { notesSefService } from "@/lib/notes-sef/notesSefService";
import { supabase } from "@/integrations/supabase/client";
import { PrintButton } from "@/components/export/PrintButton";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { NoteSEFRejectDialog } from "@/components/notes-sef/NoteSEFRejectDialog";
import { NoteSEFDeferDialog } from "@/components/notes-sef/NoteSEFDeferDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  History,
  FolderOpen,
  ExternalLink,
  Upload,
  Download,
  Trash2,
  Loader2,
  Send,
  Edit,
  Save,
  X,
  Paperclip,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface Attachment {
  id: string;
  note_id: string;
  nom: string;
  fichier_url: string;
  type_fichier: string | null;
  taille: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

// ============================================
// HELPERS
// ============================================

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground", icon: <Edit className="h-3 w-3" /> },
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Send className="h-3 w-3" /> },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20", icon: <Clock className="h-3 w-3" /> },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20", icon: <CheckCircle className="h-3 w-3" /> },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <Clock className="h-3 w-3" /> },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return (
    <Badge variant="outline" className={`${variant.className} flex items-center gap-1.5`}>
      {variant.icon}
      {variant.label}
    </Badge>
  );
};

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground" },
    urgente: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    création: "Création du brouillon",
    soumission: "Soumis pour validation",
    validation: "Validé",
    rejet: "Rejeté",
    report: "Différé",
    modification: "Modifié",
    ajout_piece: "Pièce jointe ajoutée",
    suppression_piece: "Pièce jointe supprimée",
    upload_echec: "Échec upload",
  };
  return labels[action] || action;
};

const getActionIcon = (action: string) => {
  const icons: Record<string, React.ReactNode> = {
    création: <FileText className="h-4 w-4" />,
    soumission: <Send className="h-4 w-4 text-blue-500" />,
    validation: <CheckCircle className="h-4 w-4 text-success" />,
    rejet: <XCircle className="h-4 w-4 text-destructive" />,
    report: <Clock className="h-4 w-4 text-warning" />,
    modification: <Edit className="h-4 w-4" />,
    ajout_piece: <Paperclip className="h-4 w-4 text-primary" />,
    suppression_piece: <Trash2 className="h-4 w-4 text-muted-foreground" />,
    upload_echec: <AlertTriangle className="h-4 w-4 text-destructive" />,
  };
  return icons[action] || <History className="h-4 w-4" />;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function NoteSEFDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermissions();
  const { fetchHistory, submitNote, validateNote, rejectNote, deferNote } = useNotesSEF();

  // État local
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Partial<NoteSEF>>({});
  const [history, setHistory] = useState<NoteSEFHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [rejectingNote, setRejectingNote] = useState<NoteSEF | null>(null);
  const [deferringNote, setDeferringNote] = useState<NoteSEF | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permissions
  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);
  const isAdmin = hasAnyRole(["ADMIN"]);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Query pour la note
  const { data: note, isLoading: loadingNote, error } = useQuery({
    queryKey: ['note-sef-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await notesSefService.getById(id);
      if (!result.success) throw new Error(result.error);
      return result.data as unknown as NoteSEF;
    },
    enabled: !!id,
  });

  // Charger historique et pièces jointes
  useEffect(() => {
    if (note) {
      // Historique
      setLoadingHistory(true);
      fetchHistory(note.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoadingHistory(false));

      // Pièces jointes
      fetchAttachments();
    }
  }, [note?.id]);

  // Vérifier les permissions
  const isCreator = currentUserId && note?.created_by === currentUserId;
  const canModify = (isCreator || isAdmin) && note?.statut === "brouillon";
  const canSubmit = canModify;
  const canValidateNote = canValidate && (note?.statut === "soumis" || note?.statut === "a_valider" || note?.statut === "differe");

  // Navigation retour
  const handleBack = () => {
    const returnTab = searchParams.get('tab');
    if (returnTab) {
      navigate(`/notes-sef?tab=${returnTab}`);
    } else {
      navigate('/notes-sef');
    }
  };

  // Charger les pièces jointes
  const fetchAttachments = async () => {
    if (!note) return;
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("notes_sef_pieces")
        .select("*")
        .eq("note_id", note.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Télécharger une pièce jointe (URL signée)
  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("notes-sef")
        .createSignedUrl(attachment.fichier_url, 60);

      if (error) {
        // Fallback: essayer avec l'ancien bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from("notes_sef_pieces")
          .download(attachment.fichier_url);
        
        if (fallbackError) throw fallbackError;
        
        const url = URL.createObjectURL(fallbackData);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.nom;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Ouvrir l'URL signée dans un nouvel onglet
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  // Uploader un fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !note) return;

    setUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse 10MB`,
            variant: "destructive",
          });
          continue;
        }

        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${note.exercice}/${note.id}/${timestamp}_${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("notes-sef")
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          toast({
            title: "Erreur upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        await supabase.from("notes_sef_pieces").insert({
          note_id: note.id,
          nom: file.name,
          fichier_url: filePath,
          type_fichier: file.type,
          taille: file.size,
          uploaded_by: user.id,
        });

        await supabase.from("notes_sef_history").insert({
          note_id: note.id,
          action: 'ajout_piece',
          commentaire: `Pièce jointe: ${file.name}`,
          performed_by: user.id,
        });
      }

      toast({ title: "Fichier(s) ajouté(s)" });
      fetchAttachments();
      
      // Refresh history
      fetchHistory(note.id).then(setHistory);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le fichier",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Supprimer un fichier
  const handleDeleteFile = async (attachment: Attachment) => {
    if (!confirm("Supprimer ce fichier ?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.storage.from("notes-sef").remove([attachment.fichier_url]);
      await supabase.from("notes_sef_pieces").delete().eq("id", attachment.id);

      if (user && note) {
        await supabase.from("notes_sef_history").insert({
          note_id: note.id,
          action: 'suppression_piece',
          commentaire: `Suppression: ${attachment.nom}`,
          performed_by: user.id,
        });
      }

      toast({ title: "Fichier supprimé" });
      fetchAttachments();
      if (note) fetchHistory(note.id).then(setHistory);
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  // Activer le mode édition
  const handleStartEdit = () => {
    if (!note) return;
    setEditedFields({
      objet: note.objet,
      description: note.description,
      justification: note.justification,
      commentaire: note.commentaire,
    });
    setIsEditing(true);
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditedFields({});
    setIsEditing(false);
  };

  // Sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!note) return;
    setSavingChanges(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("notes_sef")
        .update({
          objet: editedFields.objet,
          description: editedFields.description,
          justification: editedFields.justification,
          commentaire: editedFields.commentaire,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id);

      if (error) throw error;

      // Log history
      await supabase.from("notes_sef_history").insert({
        note_id: note.id,
        action: 'modification',
        commentaire: "Modification des champs",
        performed_by: user.id,
      });

      toast({ title: "Modifications enregistrées" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['note-sef-detail', id] });
      fetchHistory(note.id).then(setHistory);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    } finally {
      setSavingChanges(false);
    }
  };

  // Soumettre
  const handleSubmit = async () => {
    if (!note) return;
    await submitNote(note.id);
    queryClient.invalidateQueries({ queryKey: ['note-sef-detail', id] });
    toast({ title: "Note soumise pour validation" });
  };

  // Valider
  const handleValidate = async () => {
    if (!note) return;
    await validateNote(note.id);
    queryClient.invalidateQueries({ queryKey: ['note-sef-detail', id] });
    toast({ title: "Note validée" });
  };

  // Rejeter (via dialog)
  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
    setRejectingNote(null);
    queryClient.invalidateQueries({ queryKey: ['note-sef-detail', id] });
    toast({ title: "Note rejetée" });
  };

  // Différer (via dialog)
  const handleDefer = async (data: { noteId: string; motif: string; condition?: string; dateReprise?: string }) => {
    await deferNote(data);
    setDeferringNote(null);
    queryClient.invalidateQueries({ queryKey: ['note-sef-detail', id] });
    toast({ title: "Note différée" });
  };

  // Aller au dossier
  const handleGoToDossier = () => {
    if (note?.dossier_id) {
      navigate(`/recherche?dossier=${note.dossier_id}`);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loadingNote) {
    return (
      <div className="space-y-6 animate-fade-in">
        <WorkflowStepIndicator currentStep={1} />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <p>Note introuvable ou erreur de chargement</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowStepIndicator currentStep={1} />

      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold font-mono">
                {note.reference_pivot || note.numero || "Nouvelle note"}
              </h1>
              <p className="text-sm text-muted-foreground">Exercice {note.exercice}</p>
            </div>
          </div>
          {getStatusBadge(note.statut)}
        </div>
        <div className="flex items-center gap-2">
          <PrintButton entityType="note_sef" entityId={note.id} label="Imprimer" />
        </div>
      </div>

      {/* Actions bar */}
      {(canModify || canSubmit || canValidateNote) && !isEditing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Actions :</span>

              {canModify && (
                <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              )}

              {canSubmit && (
                <Button variant="default" size="sm" onClick={handleSubmit} className="gap-2">
                  <Send className="h-4 w-4" />
                  Soumettre pour validation
                </Button>
              )}

              {canValidateNote && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleValidate}
                    className="gap-2 bg-success hover:bg-success/90"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Valider
                  </Button>

                  {note.statut !== "differe" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectingNote(note)}
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeferringNote(note)}
                        className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
                      >
                        <Clock className="h-4 w-4" />
                        Différer
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode édition bar */}
      {isEditing && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warning">Mode édition actif</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="gap-2">
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={savingChanges} className="gap-2">
                  {savingChanges ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {getStatusBadge(note.statut)}
                {getUrgenceBadge(note.urgence)}
              </div>

              {/* Objet */}
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Objet</Label>
                {isEditing ? (
                  <Input
                    value={editedFields.objet || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, objet: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium text-lg mt-1">{note.objet}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedFields.description || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="whitespace-pre-wrap mt-1">{note.description || "—"}</p>
                )}
              </div>

              {/* Justification */}
              <div className="p-3 rounded-lg bg-muted/50">
                <Label className="text-muted-foreground text-xs uppercase">Justification</Label>
                {isEditing ? (
                  <Textarea
                    value={editedFields.justification || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, justification: e.target.value })}
                    className="mt-1 bg-background"
                    rows={3}
                  />
                ) : (
                  <p className="whitespace-pre-wrap mt-1">{note.justification || "—"}</p>
                )}
              </div>

              <Separator />

              {/* Métadonnées */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Direction</p>
                    <p className="font-medium">{note.direction?.label || note.direction?.sigle || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Demandeur</p>
                    <p className="font-medium">
                      {note.demandeur
                        ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim() || "—"
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Date souhaitée</p>
                    <p className="font-medium">
                      {note.date_souhaitee
                        ? format(new Date(note.date_souhaitee), "dd MMM yyyy", { locale: fr })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bénéficiaire */}
              {(note.beneficiaire || note.beneficiaire_interne) && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Bénéficiaire</p>
                      <p className="font-medium">
                        {note.beneficiaire?.raison_sociale ||
                          (note.beneficiaire_interne
                            ? `${note.beneficiaire_interne.first_name || ""} ${note.beneficiaire_interne.last_name || ""}`.trim()
                            : "—")}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Commentaire */}
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Commentaire</Label>
                {isEditing ? (
                  <Textarea
                    value={editedFields.commentaire || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, commentaire: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="whitespace-pre-wrap mt-1">{note.commentaire || "—"}</p>
                )}
              </div>

              {/* Lien dossier */}
              {note.dossier_id && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-success" />
                      <span className="font-medium">Dossier créé</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleGoToDossier} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Voir le dossier
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Pièces jointes
                </CardTitle>
                {canModify && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="gap-2"
                    >
                      {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Ajouter
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttachments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Aucune pièce jointe</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{att.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(att.taille)} •{" "}
                            {format(new Date(att.uploaded_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadFile(att)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {canModify && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(att)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale - Historique */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique
              </CardTitle>
              <CardDescription>Timeline des événements</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Aucun événement</p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-3">
                      {/* Timeline line */}
                      {index < history.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border" />
                      )}
                      {/* Icon */}
                      <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                        {getActionIcon(entry.action)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="font-medium text-sm">{getActionLabel(entry.action)}</p>
                        {entry.commentaire && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">{entry.commentaire}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(entry.performed_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Infos techniques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span>{format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifié le</span>
                <span>{format(new Date(note.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{note.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
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
