import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNotesAEF, NoteAEF } from '@/hooks/useNotesAEF';
import { useNoteAccessControl } from '@/hooks/useNoteAccessControl';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  FileEdit,
  DollarSign,
  Building2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Download,
  Trash2,
  History,
  Shield,
  LinkIcon,
  Paperclip,
  Loader2,
  Upload,
  X,
  FolderOpen,
  Wallet,
  QrCode,
  GitBranch,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { DecisionBlock } from '@/components/workflow/DecisionBlock';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { NoteAEFRejectDialog } from '@/components/notes-aef/NoteAEFRejectDialog';
import { NoteAEFDeferDialog } from '@/components/notes-aef/NoteAEFDeferDialog';
import { NoteAEFImputeDialog } from '@/components/notes-aef/NoteAEFImputeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constants for file upload validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
];

// Helper functions
const getStatusBadge = (statut: string | null) => {
  const statusConfig: Record<
    string,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      className?: string;
    }
  > = {
    brouillon: { label: 'Brouillon', variant: 'outline' },
    soumis: { label: 'Soumis', variant: 'secondary', className: 'bg-blue-100 text-blue-700' },
    a_valider: {
      label: 'À valider',
      variant: 'secondary',
      className: 'bg-amber-100 text-amber-700',
    },
    valide: { label: 'Validé', variant: 'default', className: 'bg-green-600' },
    a_imputer: { label: 'À imputer', variant: 'default', className: 'bg-purple-600' },
    impute: { label: 'Imputé', variant: 'default', className: 'bg-emerald-600' },
    rejete: { label: 'Rejeté', variant: 'destructive' },
    differe: { label: 'Différé', variant: 'secondary', className: 'bg-orange-100 text-orange-700' },
  };

  const config = statusConfig[statut || 'brouillon'] || statusConfig.brouillon;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

const getOriginBadge = (note: NoteAEF) => {
  if (note.is_direct_aef || note.origin === 'DIRECT') {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        AEF Directe
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
      Via Note SEF
    </Badge>
  );
};

const formatMontant = (montant: number | null) => {
  if (montant === null || montant === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
};

// Timeline event interface
interface HistoryEvent {
  id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  commentaire: string | null;
  old_statut: string | null;
  new_statut: string | null;
  performer?: { first_name: string | null; last_name: string | null } | null;
}

// Extended note type with extra profile relations
interface NoteAEFExtended extends NoteAEF {
  validated_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
  differe_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
  rejected_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
  rejected_at?: string | null;
}

export default function NoteAEFDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { validateNote, rejectNote, deferNote, submitNote, deleteNote, imputeNote } = useNotesAEF();
  const { canValidateNoteAEF, canImpute } = usePermissions();

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialogs state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showImputeDialog, setShowImputeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch note details
  const {
    data: note,
    isLoading: noteLoading,
    refetch,
  } = useQuery({
    queryKey: ['note-aef-detail', id],
    queryFn: async () => {
      if (!id) return null;
      // Select with explicit columns to avoid "Type instantiation too deep"
      const { data, error } = await supabase.from('notes_dg').select('*').eq('id', id).single();

      if (error) throw error;

      // Fetch related data separately to avoid deep type instantiation
      const [dirRes, sefRes, blRes] = await Promise.all([
        data.direction_id
          ? supabase
              .from('directions')
              .select('id, label, sigle')
              .eq('id', data.direction_id)
              .single()
          : { data: null },
        data.note_sef_id
          ? supabase
              .from('notes_sef')
              .select('id, numero, objet, dossier_id')
              .eq('id', data.note_sef_id)
              .single()
          : { data: null },
        data.budget_line_id
          ? supabase
              .from('budget_lines')
              .select('id, code, label, dotation_initiale')
              .eq('id', data.budget_line_id)
              .single()
          : { data: null },
      ]);

      const profileFields = 'id, first_name, last_name';
      const profileIds = [
        data.created_by,
        data.validated_by,
        data.imputed_by,
        data.differe_by,
        data.rejected_by,
      ].filter(Boolean) as string[];
      const { data: profiles } =
        profileIds.length > 0
          ? await supabase.from('profiles').select(profileFields).in('id', profileIds)
          : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return {
        ...data,
        direction: dirRes.data,
        note_sef: sefRes.data,
        budget_line: blRes.data,
        created_by_profile: profileMap.get(data.created_by) ?? null,
        validated_by_profile: profileMap.get(data.validated_by ?? '') ?? null,
        imputed_by_profile: profileMap.get(data.imputed_by ?? '') ?? null,
        differe_by_profile: profileMap.get(data.differe_by ?? '') ?? null,
        rejected_by_profile: profileMap.get(data.rejected_by ?? '') ?? null,
      } as NoteAEFExtended;
    },
    enabled: !!id,
  });

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['note-aef-history', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('notes_aef_history')
        .select(
          `
          *,
          performer:profiles(id, first_name, last_name)
        `
        )
        .eq('note_id', id)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }
      return data as HistoryEvent[];
    },
    enabled: !!id,
  });

  // Fetch linked SEF note details if exists
  const { data: linkedNoteSEF } = useQuery({
    queryKey: ['linked-note-sef', note?.note_sef_id],
    queryFn: async () => {
      if (!note?.note_sef_id) return null;
      const { data, error } = await supabase
        .from('notes_sef')
        .select(
          `
          id, numero, objet, statut, validated_at,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_sef_created_by_fkey(id, first_name, last_name)
        `
        )
        .eq('id', note.note_sef_id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!note?.note_sef_id,
  });

  // Fetch attachments
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['note-aef-attachments', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('note_attachments')
        .select('*')
        .eq('note_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attachments:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch budget availability data
  const { data: budgetData } = useQuery({
    queryKey: ['note-aef-budget', note?.budget_line_id],
    queryFn: async () => {
      if (!note?.budget_line_id) return null;
      const { data: line, error: lineError } = await supabase
        .from('budget_lines')
        .select('id, code, label, dotation_initiale, dotation_modifiee')
        .eq('id', note.budget_line_id)
        .single();
      if (lineError || !line) return null;

      const dotation = line.dotation_modifiee || line.dotation_initiale || 0;

      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('montant')
        .eq('budget_line_id', note.budget_line_id)
        .neq('statut', 'annule');

      const totalEngaged = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const disponible = dotation - totalEngaged;
      const utilisation = dotation > 0 ? Math.round((totalEngaged / dotation) * 100) : 0;

      return { ...line, dotation, totalEngaged, disponible, utilisation };
    },
    enabled: !!note?.budget_line_id,
  });

  // Access control
  const accessControl = useNoteAccessControl(note, 'AEF');

  // Handle actions
  const handleSubmit = async () => {
    if (!note) return;
    setIsSubmitting(true);
    try {
      await submitNote(note.id);
      toast.success('Note soumise pour validation');
      refetch();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) || 'Erreur lors de la soumission'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (!note) return;
    setIsSubmitting(true);
    try {
      await validateNote(note.id);
      toast.success('Note validée avec succès');
      refetch();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) || 'Erreur lors de la validation'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    setIsSubmitting(true);
    try {
      await deleteNote(note.id);
      toast.success('Note supprimée');
      navigate('/notes-aef');
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) || 'Erreur lors de la suppression'
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !note) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} dépasse la limite de 10 MB`);
        errorCount++;
        continue;
      }

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        toast.error(`${file.name}: type de fichier non autorisé`);
        errorCount++;
        continue;
      }

      try {
        // Generate unique path: {exercice}/AEF/{note_id}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${note.exercice}/AEF/${note.id}/${timestamp}_${safeName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('note-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erreur upload: ${file.name}`);
          errorCount++;
          continue;
        }

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Insert metadata into note_attachments table
        const { error: insertError } = await supabase.from('note_attachments').insert({
          note_id: note.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          uploaded_by: user?.id,
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          // Try to delete uploaded file on failure
          await supabase.storage.from('note-attachments').remove([filePath]);
          toast.error(`Erreur enregistrement: ${file.name}`);
          errorCount++;
          continue;
        }

        successCount++;
      } catch (err) {
        console.error('File upload error:', err);
        toast.error(`Erreur: ${file.name}`);
        errorCount++;
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(false);

    // Show summary
    if (successCount > 0) {
      toast.success(`${successCount} fichier(s) ajouté(s)`);
      // Refresh attachments
      queryClient.invalidateQueries({ queryKey: ['note-aef-attachments', id] });
    }
    if (errorCount > 0 && successCount === 0) {
      toast.error(`Échec de l'upload de ${errorCount} fichier(s)`);
    }
  };

  // Handle file delete
  const handleDeleteFile = async (attachment: {
    id: string;
    file_path: string;
    file_name: string;
  }) => {
    if (!note || note.statut !== 'brouillon') {
      toast.error('Suppression possible uniquement pour les brouillons');
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('note-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('note_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast.success(`${attachment.file_name} supprimé`);
      queryClient.invalidateQueries({ queryKey: ['note-aef-attachments', id] });
    } catch (err) {
      console.error('Delete file error:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Handle file download
  const handleDownloadFile = async (attachment: { file_path: string; file_name: string }) => {
    try {
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(attachment.file_path, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Impossible de télécharger le fichier');
    }
  };

  // Timeline icon helper
  const getTimelineIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <FileText className="h-4 w-4" />;
      case 'submitted':
        return <Send className="h-4 w-4" />;
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'deferred':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'imputed':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'resubmitted':
        return <Send className="h-4 w-4 text-purple-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Création',
      submitted: 'Soumission',
      validated: 'Validation DG',
      rejected: 'Rejet',
      deferred: 'Différé',
      imputed: 'Imputation',
      resubmitted: 'Re-soumission',
      updated: 'Modification',
    };
    return labels[action] || action;
  };

  // Loading state
  if (noteLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Note not found
  if (!note) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Note introuvable
            </CardTitle>
            <CardDescription>La note AEF demandée n'existe pas ou a été supprimée.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/notes-aef')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!accessControl.canView && !accessControl.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Accès refusé
            </CardTitle>
            <CardDescription>{accessControl.denyReason}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/notes-aef')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={`Note AEF - ${note?.numero || ''}`}
        description={note?.objet || 'Détail de la note'}
        icon={FileEdit}
        backUrl="/notes-aef"
        breadcrumbs={[
          { label: 'Chaîne de la Dépense' },
          { label: 'Notes AEF', href: '/notes-aef' },
          { label: note?.numero || 'Détail' },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge(note.statut)}
          {getOriginBadge(note)}
          {accessControl.canEdit && (
            <Button variant="outline" onClick={() => navigate(`/notes-aef?edit=${note.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          {accessControl.canSubmit && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </Button>
          )}
          {accessControl.canValidate && canValidateNoteAEF() && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleValidate}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider
            </Button>
          )}
          {accessControl.canReject && canValidateNoteAEF() && (
            <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
          )}
          {accessControl.canDefer && canValidateNoteAEF() && (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-600"
              onClick={() => setShowDeferDialog(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Différer
            </Button>
          )}
          {accessControl.canImpute && canImpute() && (
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowImputeDialog(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Imputer
            </Button>
          )}
          {accessControl.canResubmit && (
            <Button variant="outline" onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Re-soumettre
            </Button>
          )}
          {/* Bouton Voir Dossier - récupère dossier_id depuis note ou SEF liée */}
          {(note.dossier_id || note.note_sef?.dossier_id) && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/recherche?dossier=${note.dossier_id || note.note_sef?.dossier_id}`)
              }
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Voir le dossier
            </Button>
          )}
          {accessControl.canDelete && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PageHeader>

      {/* 5-Tab Detail Panel */}
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resume" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Résumé
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="pieces" className="gap-1.5">
            <Paperclip className="h-4 w-4" />
            Pièces jointes
            {attachments.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {attachments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1.5">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1.5">
            <GitBranch className="h-4 w-4" />
            Workflow
          </TabsTrigger>
        </TabsList>

        {/* ──── TAB 1: RÉSUMÉ ──── */}
        <TabsContent value="resume" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Origin - Linked SEF Note */}
              {linkedNoteSEF && (
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      Note SEF d'origine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{linkedNoteSEF.numero}</p>
                        <p className="text-sm text-muted-foreground">{linkedNoteSEF.objet}</p>
                      </div>
                      <Link to={`/notes-sef/${linkedNoteSEF.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir NSEF
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {linkedNoteSEF.direction?.sigle || linkedNoteSEF.direction?.label}
                      </span>
                      {linkedNoteSEF.validated_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Validée le {formatDate(linkedNoteSEF.validated_at)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Direct AEF Justification */}
              {(note.is_direct_aef || note.origin === 'DIRECT') && note.justification && (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Justification AEF Directe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{note.justification}</p>
                  </CardContent>
                </Card>
              )}

              {/* Main information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Objet</label>
                    <p className="mt-1">{note.objet}</p>
                  </div>
                  {note.contenu && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description / Contenu
                      </label>
                      <p className="mt-1 whitespace-pre-wrap">{note.contenu}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Détails financiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Montant estimé
                    </label>
                    <p className="mt-1 text-lg font-semibold">
                      {formatMontant(note.montant_estime)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Type de dépense
                    </label>
                    <p className="mt-1 capitalize">{note.type_depense || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Urgence</label>
                    <p className="mt-1 capitalize">{note.priorite || 'Normale'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Direction</label>
                    <p className="mt-1">{note.direction?.label || note.direction?.sigle || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Decision Blocks */}
              {note.validated_at && note.validated_by_profile && (
                <DecisionBlock
                  type="validation"
                  acteur={note.validated_by_profile}
                  date={note.validated_at}
                />
              )}
              {note.statut === 'rejete' && note.rejected_by_profile && (
                <DecisionBlock
                  type="rejet"
                  acteur={note.rejected_by_profile}
                  date={note.rejected_at}
                  commentaire={note.rejection_reason}
                />
              )}
              {note.statut === 'differe' && note.differe_by_profile && (
                <DecisionBlock
                  type="differe"
                  acteur={note.differe_by_profile}
                  date={note.date_differe}
                  commentaire={note.motif_differe}
                  dateReprise={note.deadline_correction}
                />
              )}
              {note.imputed_at && note.imputed_by_profile && (
                <DecisionBlock
                  type="imputation"
                  acteur={note.imputed_by_profile}
                  date={note.imputed_at}
                  ligneBudgetaire={note.budget_line}
                />
              )}
            </div>

            {/* Sidebar - Technical info + QR code for validated notes */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Référence</span>
                    <span className="font-mono">{note.numero || '-'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exercice</span>
                    <span>{note.exercice}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé par</span>
                    <span>
                      {note.created_by_profile
                        ? `${note.created_by_profile.first_name || ''} ${note.created_by_profile.last_name || ''}`.trim()
                        : '-'}
                    </span>
                  </div>
                  {note.submitted_at && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Soumis le</span>
                        <span>{formatDate(note.submitted_at)}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière MAJ</span>
                    <span>{formatDate(note.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code for validated/imputed notes */}
              {['valide', 'a_imputer', 'impute'].includes(note.statut || '') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code de vérification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-3">
                    <QRCodeCanvas
                      value={`${window.location.origin}/verify?type=note_aef&ref=${note.numero || note.id}`}
                      size={150}
                      level="M"
                      includeMargin
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Scannez pour vérifier l'authenticité
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ──── TAB 2: BUDGET ──── */}
        <TabsContent value="budget" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget line info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Ligne budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Code</label>
                      <p className="mt-1 font-mono text-lg">{budgetData.code}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Libellé</label>
                      <p className="mt-1">{budgetData.label}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Dotation
                        </label>
                        <p className="mt-1 font-semibold">{formatMontant(budgetData.dotation)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Engagé</label>
                        <p className="mt-1 font-semibold text-orange-600">
                          {formatMontant(budgetData.totalEngaged)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : note.budget_line ? (
                  <div className="space-y-2">
                    <p className="font-mono">{note.budget_line.code}</p>
                    <p className="text-sm text-muted-foreground">{note.budget_line.label}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune ligne budgétaire assignée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Budget disponible + progress bar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Disponible budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {formatMontant(budgetData.disponible)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Montant disponible</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Utilisation</span>
                        <span className="font-medium">{budgetData.utilisation}%</span>
                      </div>
                      <Progress
                        value={budgetData.utilisation}
                        className={`h-3 ${budgetData.utilisation > 80 ? '[&>div]:bg-red-500' : budgetData.utilisation > 50 ? '[&>div]:bg-orange-500' : '[&>div]:bg-green-500'}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 FCFA</span>
                        <span>{formatMontant(budgetData.dotation)}</span>
                      </div>
                    </div>
                    {note.montant_estime && budgetData.disponible < note.montant_estime && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                          Le montant estimé ({formatMontant(note.montant_estime)}) dépasse le
                          disponible
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {note.budget_line_id
                      ? 'Chargement des données budgétaires...'
                      : 'Aucune ligne budgétaire assignée'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ──── TAB 3: PIÈCES JOINTES ──── */}
        <TabsContent value="pieces" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Pièces jointes
                <Badge variant="secondary" className="ml-1">
                  {attachments.length}
                </Badge>
              </CardTitle>
              {note.statut === 'brouillon' && accessControl.canEdit && (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="sm" disabled={isUploading} className="gap-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {note.statut === 'brouillon' && accessControl.canEdit && (
                <p className="text-xs text-muted-foreground mb-3">
                  Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF • Max 10 MB
                </p>
              )}
              {attachmentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune pièce jointe
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{att.file_name}</p>
                          {att.file_size && (
                            <p className="text-xs text-muted-foreground">
                              {(att.file_size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadFile(att)}
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {note.statut === 'brouillon' && accessControl.canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFile(att)}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── TAB 4: HISTORIQUE ──── */}
        <TabsContent value="historique" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique des actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun historique disponible
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getTimelineIcon(event.action)}
                          </div>
                          {index < history.length - 1 && (
                            <div className="w-px flex-1 bg-border my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{getActionLabel(event.action)}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(event.performed_at)}
                            </span>
                          </div>
                          {event.performer && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              par {event.performer.first_name} {event.performer.last_name}
                            </p>
                          )}
                          {event.commentaire && (
                            <p className="text-xs mt-1 text-muted-foreground bg-muted p-2 rounded">
                              {event.commentaire}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── TAB 5: WORKFLOW ──── */}
        <TabsContent value="workflow" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkflowTimeline entityType="note_aef" entityId={note.id} variant="vertical" />

            {/* QR Code for validated notes */}
            {['valide', 'a_imputer', 'impute'].includes(note.statut || '') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code de vérification
                  </CardTitle>
                  <CardDescription>
                    Ce QR code permet de vérifier l'authenticité de cette note
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <QRCodeCanvas
                    value={`${window.location.origin}/verify?type=note_aef&ref=${note.numero || note.id}`}
                    size={200}
                    level="M"
                    includeMargin
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Référence: <span className="font-mono font-medium">{note.numero}</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NoteAEFRejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        note={note as NoteAEF}
        onConfirm={async (noteId, motif) => {
          await rejectNote({ noteId, motif });
          refetch();
        }}
      />

      <NoteAEFDeferDialog
        open={showDeferDialog}
        onOpenChange={setShowDeferDialog}
        note={note as NoteAEF}
        onConfirm={async (data) => {
          await deferNote(data);
          refetch();
        }}
      />

      <NoteAEFImputeDialog
        open={showImputeDialog}
        onOpenChange={setShowImputeDialog}
        note={note as NoteAEF}
        onConfirm={async (noteId, budgetLineId) => {
          await imputeNote({ noteId, budgetLineId });
          refetch();
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note {note.numero} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
