import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { NoteSEF, NoteSEFHistory, useNotesSEF } from "@/hooks/useNotesSEF";
import { PrintButton } from "@/components/export/PrintButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  FolderOpen,
  ExternalLink,
  UserCheck,
  Briefcase,
  Upload,
  Download,
  Trash2,
  Loader2,
  Send,
  Edit,
  Paperclip,
  FileIcon,
  MessageSquare,
} from "lucide-react";

interface NoteSEFDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
  onEdit?: (note: NoteSEF) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteSEF) => void;
  onDefer?: (note: NoteSEF) => void;
}

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

export function NoteSEFDetails({ 
  open, 
  onOpenChange, 
  note,
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
}: NoteSEFDetailsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasAnyRole } = usePermissions();
  const { fetchHistory, submitNote, validateNote } = useNotesSEF();
  
  const [history, setHistory] = useState<NoteSEFHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check permissions
  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);
  const isAdmin = hasAnyRole(["ADMIN"]);
  
  // Check if current user is the creator
  const isCreator = currentUserId && note?.created_by === currentUserId;
  
  // Determine actions based on status and role
  const canModify = (isCreator || isAdmin) && note?.statut === "brouillon";
  const canSubmit = canModify;
  const canAddAttachments = canModify;
  const canValidateNote = canValidate && (note?.statut === "soumis" || note?.statut === "a_valider" || note?.statut === "differe");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (note && open) {
      // Fetch history
      setLoadingHistory(true);
      fetchHistory(note.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
      
      // Fetch attachments
      fetchAttachments();
    }
  }, [note, open]);

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

  // Types de fichiers autorisés
  const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|webp|bmp)$/i;
  const DANGEROUS_EXTENSIONS = /\.(exe|bat|cmd|sh|ps1|vbs|js|msi|dll|scr|pif|com|jar|hta|reg)$/i;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !note) return;

    setUploadingFile(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let successCount = 0;
      let errorCount = 0;

      for (const file of Array.from(files)) {
        // Validation taille (max 10MB)
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse 10MB`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        // Validation extensions dangereuses
        if (DANGEROUS_EXTENSIONS.test(file.name)) {
          toast({
            title: "Type de fichier non autorisé",
            description: `${file.name} - Extensions exécutables interdites`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        // Validation extensions autorisées
        if (!ALLOWED_EXTENSIONS.test(file.name)) {
          toast({
            title: "Type de fichier non supporté",
            description: `${file.name} - Formats acceptés: PDF, Word, Excel, Images`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        // Nettoyer le nom de fichier
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${note.exercice}/${note.id}/${timestamp}_${safeFileName}`;

        // Upload to storage (bucket notes-sef)
        const { error: uploadError } = await supabase.storage
          .from("notes-sef")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Erreur upload",
            description: `Impossible d'uploader ${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        // Create database entry
        const { error: dbError } = await supabase
          .from("notes_sef_pieces")
          .insert({
            note_id: note.id,
            nom: file.name,
            fichier_url: filePath,
            type_fichier: file.type || 'application/octet-stream',
            taille: file.size,
            uploaded_by: user.id,
          });

        if (dbError) {
          console.error("DB error:", dbError);
          errorCount++;
        } else {
          successCount++;
          
          // Log dans l'historique
          await supabase.from('notes_sef_history').insert({
            note_id: note.id,
            action: 'ajout_piece',
            commentaire: `Pièce jointe: ${file.name}`,
            performed_by: user.id,
          });
        }
      }

      if (successCount > 0) {
        toast({ title: `${successCount} fichier(s) ajouté(s)` });
      }
      if (errorCount > 0 && successCount === 0) {
        toast({ title: "Aucun fichier ajouté", variant: "destructive" });
      }
      
      fetchAttachments();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le fichier",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("notes-sef")
        .download(attachment.fichier_url);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.nom;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (attachment: Attachment) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete from storage
      await supabase.storage
        .from("notes-sef")
        .remove([attachment.fichier_url]);
      
      // Delete from database
      await supabase
        .from("notes_sef_pieces")
        .delete()
        .eq("id", attachment.id);
      
      // Log dans l'historique
      if (user && note) {
        await supabase.from('notes_sef_history').insert({
          note_id: note.id,
          action: 'suppression_piece',
          commentaire: `Pièce supprimée: ${attachment.nom}`,
          performed_by: user.id,
        });
      }
      
      toast({ title: "Fichier supprimé" });
      fetchAttachments();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  const handleGoToDossier = () => {
    if (note?.dossier_id) {
      onOpenChange(false);
      navigate(`/recherche?dossier=${note.dossier_id}`);
    }
  };

  const handleSubmitNote = async () => {
    if (!note || !onSubmit) return;
    onSubmit(note.id);
    onOpenChange(false);
  };

  const handleValidateNote = async () => {
    if (!note || !onValidate) return;
    onValidate(note.id);
    onOpenChange(false);
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <span className="font-mono text-lg">{note.reference_pivot || note.numero || "Nouvelle note"}</span>
                <span className="text-muted-foreground font-normal text-sm ml-2">
                  Exercice {note.exercice}
                </span>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(note.statut)}
              {note.id && (
                <PrintButton
                  entityType="note_sef"
                  entityId={note.id}
                  label=""
                  size="sm"
                  variant="outline"
                />
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            
            {/* Actions bar - visible only when actions are available */}
            {(canModify || canSubmit || canValidateNote) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Actions :</span>
                    
                    {canModify && onEdit && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { onEdit(note); onOpenChange(false); }}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Modifier
                      </Button>
                    )}
                    
                    {canSubmit && onSubmit && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleSubmitNote}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Soumettre pour validation
                      </Button>
                    )}
                    
                    {canValidateNote && (
                      <>
                        {onValidate && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleValidateNote}
                            className="gap-2 bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Valider
                          </Button>
                        )}
                        
                        {onReject && note.statut !== "differe" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { onReject(note); onOpenChange(false); }}
                            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeter
                          </Button>
                        )}
                        
                        {onDefer && note.statut !== "differe" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { onDefer(note); onOpenChange(false); }}
                            className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
                          >
                            <Clock className="h-4 w-4" />
                            Différer
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations générales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(note.statut)}
                  {getUrgenceBadge(note.urgence)}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Objet</p>
                  <p className="font-medium text-lg">{note.objet}</p>
                </div>

                {note.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="whitespace-pre-wrap">{note.description}</p>
                  </div>
                )}

                {note.justification && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground font-medium">Justification</p>
                    <p className="whitespace-pre-wrap mt-1">{note.justification}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Direction</p>
                      <p className="font-medium">{note.direction?.label || note.direction?.sigle || "Non spécifiée"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Demandeur</p>
                      <p className="font-medium">
                        {note.demandeur
                          ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim() || "—"
                          : "Non spécifié"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date souhaitée</p>
                      <p className="font-medium">
                        {note.date_souhaitee 
                          ? format(new Date(note.date_souhaitee), "dd MMM yyyy", { locale: fr })
                          : "Non spécifiée"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Exercice</p>
                      <p className="font-medium">{note.exercice}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Créée le</p>
                      <p className="font-medium">
                        {format(new Date(note.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {note.created_by_profile && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Créée par</p>
                        <p className="font-medium">
                          {`${note.created_by_profile.first_name || ""} ${note.created_by_profile.last_name || ""}`.trim() || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bénéficiaire */}
                {(note.beneficiaire || note.beneficiaire_interne) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mt-4">
                    {note.beneficiaire ? (
                      <>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bénéficiaire (Prestataire)</p>
                          <p className="font-medium">{note.beneficiaire.raison_sociale}</p>
                        </div>
                      </>
                    ) : note.beneficiaire_interne ? (
                      <>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bénéficiaire (Agent interne)</p>
                          <p className="font-medium">
                            {`${note.beneficiaire_interne.first_name || ""} ${note.beneficiaire_interne.last_name || ""}`.trim() || "—"}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {note.commentaire && (
                  <div>
                    <p className="text-sm text-muted-foreground">Commentaire</p>
                    <p className="whitespace-pre-wrap">{note.commentaire}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pièces jointes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Pièces jointes
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {attachments.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {canAddAttachments && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="gap-2"
                      >
                        {uploadingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Ajouter
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingAttachments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : attachments.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucune pièce jointe
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{attachment.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.taille)} • 
                              {format(new Date(attachment.uploaded_at), " dd MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(canAddAttachments || attachment.uploaded_by === currentUserId) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFile(attachment)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejet */}
            {note.statut === "rejete" && note.rejection_reason && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Motif de rejet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{note.rejection_reason}</p>
                  {note.rejected_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Rejetée le {format(new Date(note.rejected_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Différé */}
            {note.statut === "differe" && (
              <Card className="border-warning/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Informations de report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {note.differe_motif && (
                    <div>
                      <p className="text-sm text-muted-foreground">Motif</p>
                      <p>{note.differe_motif}</p>
                    </div>
                  )}
                  {note.differe_condition && (
                    <div>
                      <p className="text-sm text-muted-foreground">Condition de reprise</p>
                      <p>{note.differe_condition}</p>
                    </div>
                  )}
                  {note.differe_date_reprise && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date de reprise prévue</p>
                      <p>{format(new Date(note.differe_date_reprise), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                  )}
                  {note.differe_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Différée le {format(new Date(note.differe_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Validation + Lien Dossier */}
            {note.statut === "valide" && note.validated_at && (
              <Card className="border-success/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Validée le {format(new Date(note.validated_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                  
                  {/* Lien vers le dossier créé */}
                  {note.dossier_id && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <FolderOpen className="h-5 w-5 text-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dossier créé automatiquement</p>
                        <p className="text-xs text-muted-foreground">
                          {note.dossier?.numero || "Dossier lié"}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 border-success/30 text-success hover:bg-success/10"
                        onClick={handleGoToDossier}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Voir le dossier
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Historique */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique des événements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucun historique
                  </p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
                    
                    <div className="space-y-4">
                      {history.map((entry, index) => (
                        <div key={entry.id} className="flex gap-4 relative">
                          {/* Timeline dot */}
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${
                            entry.new_statut === "valide" ? "bg-success text-success-foreground" :
                            entry.new_statut === "rejete" ? "bg-destructive text-destructive-foreground" :
                            entry.new_statut === "differe" ? "bg-warning text-warning-foreground" :
                            "bg-primary text-primary-foreground"
                          }`}>
                            {entry.new_statut === "valide" ? <CheckCircle className="h-3 w-3" /> :
                             entry.new_statut === "rejete" ? <XCircle className="h-3 w-3" /> :
                             entry.new_statut === "differe" ? <Clock className="h-3 w-3" /> :
                             <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium capitalize">{entry.action}</span>
                              {entry.old_statut && entry.new_statut && (
                                <span className="text-muted-foreground text-sm">
                                  {entry.old_statut} → {entry.new_statut}
                                </span>
                              )}
                            </div>
                            {entry.commentaire && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                "{entry.commentaire}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(entry.performed_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                              {entry.performer && (
                                <span className="ml-1">
                                  • {entry.performer.first_name || ""} {entry.performer.last_name || ""}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
