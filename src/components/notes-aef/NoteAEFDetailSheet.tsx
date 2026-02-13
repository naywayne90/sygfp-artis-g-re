import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useNoteAEFDetail,
  type NoteAEFHistoryEntry,
  type NoteAEFAttachment,
} from '@/hooks/useNoteAEFDetail';
import { type NoteAEF } from '@/hooks/useNotesAEF';
import { ARTIReferenceInline } from '@/components/shared/ARTIReferenceBadge';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { ChaineDepenseCompact } from '@/components/workflow/ChaineDepenseCompact';
import { LignesEstimativesReadonly } from '@/components/notes-aef/LignesEstimativesEditor';
import { formatMontant } from '@/lib/config/sygfp-constants';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Loader2,
  ExternalLink,
  Edit,
  FileText,
  Paperclip,
  History,
  Info,
  CreditCard,
  Download,
  Image as ImageIcon,
  File,
  FileArchive,
  FilePlus,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  Link2,
  Zap,
  QrCode,
  Package,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface NoteAEFDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
  defaultTab?: string;
  onEdit?: (note: NoteAEF) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteAEF) => void;
  onDefer?: (note: NoteAEF) => void;
  onImpute?: (note: NoteAEF) => void;
}

// ============================================
// HELPERS
// ============================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '\u2014'}</span>
    </div>
  );
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    soumis: {
      label: 'Soumis',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    a_valider: {
      label: '\u00c0 valider',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    valide: { label: 'Valid\u00e9', className: 'bg-success/10 text-success border-success/20' },
    impute: { label: 'Imput\u00e9', className: 'bg-primary/10 text-primary border-primary/20' },
    rejete: {
      label: 'Rejet\u00e9',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Diff\u00e9r\u00e9',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
  };
  const variant = variants[status || 'brouillon'] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '\u2014';
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '\u2014';
  return format(new Date(dateStr), "dd MMM yyyy '\u00e0' HH:mm", { locale: fr });
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const getFileIcon = (type: string | null) => {
  if (!type) return <File className="h-4 w-4 text-muted-foreground" />;
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes('zip') || type.includes('rar'))
    return <FileArchive className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const getHistoryIcon = (action: string) => {
  switch (action) {
    case 'create':
    case 'creation':
      return <FilePlus className="h-4 w-4 text-blue-500" />;
    case 'submit':
    case 'soumission':
      return <Send className="h-4 w-4 text-indigo-500" />;
    case 'validate':
    case 'validation':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'reject':
    case 'rejet':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'defer':
    case 'differe':
    case 'report':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'impute':
    case 'imputation':
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    default:
      return <History className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPersonName = (
  profile: { first_name: string | null; last_name: string | null } | null | undefined
) => {
  if (!profile) return '\u2014';
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '\u2014';
};

// ============================================
// TAB 1: RESUME (Informations + Contenu)
// ============================================

function TabResume({
  note,
  linkedNoteSEF,
  loadingSEF,
  onEdit,
}: {
  note: NoteAEF;
  linkedNoteSEF: {
    id: string;
    numero: string;
    objet: string;
    statut: string | null;
    reference_pivot: string | null;
  } | null;
  loadingSEF: boolean;
  onEdit?: (note: NoteAEF) => void;
}) {
  const navigate = useNavigate();
  const isDirectAEF = note.is_direct_aef === true;

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Identification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="R\u00e9f\u00e9rence"
              value={
                <ARTIReferenceInline
                  reference={note.reference_pivot || note.numero}
                  className="text-primary"
                />
              }
            />
            {note.numero && note.numero !== note.reference_pivot && (
              <InfoRow
                label="N\u00b0 AEF"
                value={<span className="font-mono text-xs">{note.numero}</span>}
              />
            )}
            <InfoRow label="Statut" value={getStatusBadge(note.statut)} />
            <InfoRow label="Exercice" value={note.exercice} />
            <InfoRow
              label="Origine"
              value={
                isDirectAEF ? (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    <Zap className="h-3 w-3 mr-1" />
                    AEF Directe
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <Link2 className="h-3 w-3 mr-1" />
                    Depuis SEF
                  </Badge>
                )
              }
            />
          </CardContent>
        </Card>

        {/* Note SEF liee */}
        {loadingSEF ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Recherche de la Note SEF li\u00e9e...
            </span>
          </div>
        ) : linkedNoteSEF && !isDirectAEF ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Note SEF source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="R\u00e9f\u00e9rence"
                value={<span className="font-mono text-blue-600">{linkedNoteSEF.numero}</span>}
              />
              <InfoRow label="Objet" value={linkedNoteSEF.objet} />
              {linkedNoteSEF.statut && (
                <InfoRow label="Statut" value={getStatusBadge(linkedNoteSEF.statut)} />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={() => navigate(`/notes-sef/${linkedNoteSEF.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
                Voir la Note SEF
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Justification AEF directe */}
        {isDirectAEF && note.justification && (
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-warning">
                <Zap className="h-4 w-4" />
                Justification AEF directe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{note.justification}</p>
            </CardContent>
          </Card>
        )}

        {/* Acteurs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Acteurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Direction"
              value={
                note.direction
                  ? `${note.direction.sigle || ''} - ${note.direction.label}`.replace(/^- /, '')
                  : null
              }
            />
            <InfoRow label="Cr\u00e9\u00e9 par" value={getPersonName(note.created_by_profile)} />
            <InfoRow label="Date cr\u00e9ation" value={formatDateTime(note.created_at)} />
            {note.submitted_at && (
              <InfoRow label="Soumis le" value={formatDateTime(note.submitted_at)} />
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Montant estim\u00e9"
              value={
                note.montant_estime != null ? (
                  <span className="font-mono">{formatMontant(note.montant_estime)}</span>
                ) : null
              }
            />
            {note.type_depense && (
              <InfoRow
                label="Type d\u00e9pense"
                value={<span className="capitalize">{note.type_depense}</span>}
              />
            )}
          </CardContent>
        </Card>

        {/* Contenu / Objet */}
        {note.contenu && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contenu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.contenu}</p>
            </CardContent>
          </Card>
        )}

        {/* Lignes estimatives */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Lignes estimatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LignesEstimativesReadonly noteAefId={note.id} />
          </CardContent>
        </Card>

        {/* Rejet / Differe */}
        {note.statut === 'rejete' && note.rejection_reason && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Motif de rejet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{note.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        {note.statut === 'differe' && note.motif_differe && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm">{note.motif_differe}</p>
              {note.deadline_correction && (
                <p className="text-xs text-muted-foreground">
                  Date de reprise : {formatDate(note.deadline_correction)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Modifier (brouillon) */}
        {note.statut === 'brouillon' && onEdit && (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onEdit(note)}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 2: IMPUTATION
// ============================================

function TabImputation({ note }: { note: NoteAEF }) {
  const navigate = useNavigate();
  const isValidated = note.statut === 'valide' || note.statut === 'impute';

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Chaine de la depense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cha\u00eene de la d\u00e9pense</CardTitle>
          </CardHeader>
          <CardContent>
            <ChaineDepenseCompact
              currentStep={note.statut === 'impute' ? 3 : 2}
              completedSteps={note.statut === 'impute' ? [1, 2, 3] : isValidated ? [1, 2] : [1]}
              size="sm"
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Imputation budgetaire */}
        {note.budget_line ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Imputation budg\u00e9taire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow
                label="Code"
                value={<span className="font-mono">{note.budget_line.code}</span>}
              />
              <InfoRow label="Libell\u00e9" value={note.budget_line.label} />
              {note.budget_line.dotation_initiale != null && (
                <InfoRow
                  label="Dotation"
                  value={
                    <span className="font-mono">
                      {formatMontant(note.budget_line.dotation_initiale)}
                    </span>
                  }
                />
              )}
              {note.imputed_at && (
                <>
                  <Separator className="my-2" />
                  <InfoRow label="Imput\u00e9 le" value={formatDateTime(note.imputed_at)} />
                  <InfoRow label="Imput\u00e9 par" value={getPersonName(note.imputed_by_profile)} />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CreditCard className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {note.statut === 'valide'
                ? 'En attente d\u2019imputation budg\u00e9taire'
                : 'Pas encore imput\u00e9e'}
            </p>
          </div>
        )}

        {/* Lien vers dossier */}
        {note.dossier_id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => navigate(`/recherche?dossier=${note.dossier_id}`)}
          >
            <FolderOpen className="h-4 w-4" />
            Voir le dossier
          </Button>
        )}

        {/* Validation */}
        {note.validated_at && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Valid\u00e9e le" value={formatDateTime(note.validated_at)} />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 3: PIECES JOINTES
// ============================================

function TabPieces({ pieces, isLoading }: { pieces: NoteAEFAttachment[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Chargement des pi\u00e8ces jointes...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pi\u00e8ces jointes</span>
          <Badge variant="secondary" className="gap-1">
            <Paperclip className="h-3 w-3" />
            {pieces.length}
          </Badge>
        </div>

        <Separator />

        {pieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Paperclip className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune pi\u00e8ce jointe</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {getFileIcon(piece.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{piece.file_name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(piece.file_size)}</span>
                    <span>{formatDate(piece.created_at)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="T\u00e9l\u00e9charger">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 4: HISTORIQUE
// ============================================

function TabHistorique({
  history,
  isLoading,
}: {
  history: NoteAEFHistoryEntry[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <History className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-0 pr-4">
        {history.map((entry, index) => (
          <div key={entry.id} className="flex gap-3 pb-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 mt-0.5">{getHistoryIcon(entry.action)}</div>
              {index < history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">
                  {entry.action.replace(/_/g, ' ')}
                </span>
                {entry.new_statut && (
                  <Badge variant="outline" className="text-[10px]">
                    {entry.new_statut}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {getPersonName(entry.performer)} \u2014 {formatDateTime(entry.performed_at)}
              </p>
              {entry.commentaire && (
                <p className="text-xs mt-1 text-muted-foreground italic">{entry.commentaire}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 5: QR CODE
// ============================================

function TabQRCode({ note }: { note: NoteAEF }) {
  const isValidatedOrImputed = note.statut === 'valide' || note.statut === 'impute';

  if (!isValidatedOrImputed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <QrCode className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Le QR code est g\u00e9n\u00e9r\u00e9 uniquement pour les notes valid\u00e9es ou
          imput\u00e9es
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        <div className="flex justify-center py-4">
          <QRCodeGenerator
            reference={note.reference_pivot || note.numero || note.id}
            type="NOTE_AEF"
            dateValidation={note.validated_at || undefined}
            validateur={note.validated_by || undefined}
            size="lg"
            showHash={true}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informations de v\u00e9rification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="R\u00e9f\u00e9rence"
              value={
                <span className="font-mono text-primary">
                  {note.reference_pivot || note.numero}
                </span>
              }
            />
            <InfoRow label="Type" value="Note AEF" />
            <InfoRow label="Valid\u00e9e le" value={formatDateTime(note.validated_at)} />
            {note.imputed_at && (
              <InfoRow label="Imput\u00e9e le" value={formatDateTime(note.imputed_at)} />
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Scannez ce QR code pour v\u00e9rifier l\u2019authenticit\u00e9 de ce document
        </p>
      </div>
    </ScrollArea>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NoteAEFDetailSheet({
  open,
  onOpenChange,
  note,
  defaultTab = 'resume',
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  onImpute,
}: NoteAEFDetailSheetProps) {
  const navigate = useNavigate();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(['ADMIN', 'DG']);
  const canImpute = hasAnyRole(['ADMIN', 'DAAF', 'CB']);

  const { history, pieces, linkedNoteSEF, loadingHistory, loadingPieces, loadingSEF } =
    useNoteAEFDetail(open && note ? note.id : null, note?.reference_pivot);

  if (!note) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[550px] md:w-[650px] overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="truncate">{note.objet}</span>
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getStatusBadge(note.statut)}
            {note.is_direct_aef && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                <Zap className="h-3 w-3 mr-1" />
                Directe
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Actions par role */}
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {note.statut === 'brouillon' && onEdit && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onEdit(note)}>
              <Edit className="h-3 w-3" />
              Modifier
            </Button>
          )}
          {note.statut === 'brouillon' && onSubmit && (
            <Button variant="default" size="sm" className="gap-1" onClick={() => onSubmit(note.id)}>
              <Send className="h-3 w-3" />
              Soumettre
            </Button>
          )}
          {(note.statut === 'soumis' || note.statut === 'a_valider') &&
            canValidate &&
            onValidate && (
              <Button
                variant="default"
                size="sm"
                className="gap-1 bg-success hover:bg-success/90"
                onClick={() => onValidate(note.id)}
              >
                <CheckCircle className="h-3 w-3" />
                Valider
              </Button>
            )}
          {(note.statut === 'soumis' || note.statut === 'a_valider') && canValidate && onReject && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive border-destructive/30"
              onClick={() => onReject(note)}
            >
              <XCircle className="h-3 w-3" />
              Rejeter
            </Button>
          )}
          {(note.statut === 'soumis' || note.statut === 'a_valider') && canValidate && onDefer && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-orange-600 border-orange-300"
              onClick={() => onDefer(note)}
            >
              <Clock className="h-3 w-3" />
              Diff\u00e9rer
            </Button>
          )}
          {note.statut === 'valide' && canImpute && onImpute && (
            <Button variant="default" size="sm" className="gap-1" onClick={() => onImpute(note)}>
              <CreditCard className="h-3 w-3" />
              Imputer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 ml-auto"
            onClick={() => {
              navigate(`/notes-aef/${note.id}`);
              onOpenChange(false);
            }}
          >
            <ExternalLink className="h-3 w-3" />
            Page compl\u00e8te
          </Button>
        </div>

        <Tabs defaultValue={defaultTab} className="px-6 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="resume" className="flex-1 gap-1">
              <Info className="h-3 w-3" />
              <span className="hidden sm:inline">R\u00e9sum\u00e9</span>
            </TabsTrigger>
            <TabsTrigger value="imputation" className="flex-1 gap-1">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Imputation</span>
            </TabsTrigger>
            <TabsTrigger value="pieces" className="flex-1 gap-1">
              <Paperclip className="h-3 w-3" />
              <span className="hidden sm:inline">PJ</span>
              {pieces.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1 h-4 px-1">
                  {pieces.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex-1 gap-1">
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="flex-1 gap-1">
              <QrCode className="h-3 w-3" />
              <span className="hidden sm:inline">QR</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="mt-4">
            <TabResume
              note={note}
              linkedNoteSEF={linkedNoteSEF}
              loadingSEF={loadingSEF}
              onEdit={onEdit}
            />
          </TabsContent>

          <TabsContent value="imputation" className="mt-4">
            <TabImputation note={note} />
          </TabsContent>

          <TabsContent value="pieces" className="mt-4">
            <TabPieces pieces={pieces} isLoading={loadingPieces} />
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <TabHistorique history={history} isLoading={loadingHistory} />
          </TabsContent>

          <TabsContent value="qrcode" className="mt-4">
            <TabQRCode note={note} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
