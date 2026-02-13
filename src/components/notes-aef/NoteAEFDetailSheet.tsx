import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNoteAEFDetail,
  type NoteAEFHistoryEntry,
  type NoteAEFAttachment,
} from '@/hooks/useNoteAEFDetail';
import { type NoteAEF, type BudgetAvailabilityCheck, useNotesAEF } from '@/hooks/useNotesAEF';
import { ARTIReferenceInline } from '@/components/shared/ARTIReferenceBadge';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { ChaineDepenseCompact } from '@/components/workflow/ChaineDepenseCompact';
import { LignesEstimativesReadonly } from '@/components/notes-aef/LignesEstimativesEditor';
import { NoteAEFRejectDialog } from '@/components/notes-aef/NoteAEFRejectDialog';
import { NoteAEFDeferDialog } from '@/components/notes-aef/NoteAEFDeferDialog';
import { NoteAEFImputeDialog } from '@/components/notes-aef/NoteAEFImputeDialog';
import { formatMontant } from '@/lib/config/sygfp-constants';
import { useNoteAccessControl } from '@/hooks/useNoteAccessControl';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  Package,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Copy,
  BookOpen,
  Eye,
  FileDown,
  RotateCcw,
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
  onRefresh?: () => void;
}

// ============================================
// HELPERS
// ============================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '—'}</span>
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
      label: 'À valider',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    valide: { label: 'Validé', className: 'bg-success/10 text-success border-success/20' },
    a_imputer: { label: 'À imputer', className: 'bg-success/10 text-success border-success/20' },
    impute: { label: 'Imputé', className: 'bg-primary/10 text-primary border-primary/20' },
    rejete: {
      label: 'Rejeté',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Différé',
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

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
    normale: { label: 'Normale', className: 'bg-secondary text-secondary-foreground' },
    haute: { label: 'Haute', className: 'bg-warning text-warning-foreground' },
    urgente: { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
  };
  const variant = variants[urgence || 'normale'] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), "dd MMM yyyy 'à' HH:mm", { locale: fr });
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—';
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
  if (!profile) return '—';
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '—';
};

/** Compute completed steps for ChaineDepenseCompact based on AEF statut */
const getCompletedSteps = (statut: string | null): number[] => {
  switch (statut) {
    case 'impute':
      return [1, 2, 3]; // SEF + AEF + Imputation
    case 'valide':
    case 'a_imputer':
      return [1, 2]; // SEF + AEF validée
    case 'soumis':
    case 'a_valider':
      return [1]; // SEF validée
    default:
      return []; // brouillon/rejeté/différé
  }
};

// ============================================
// TAB 1: INFORMATIONS
// ============================================

function TabInformations({
  note,
  linkedNoteSEF,
  loadingSEF,
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
}) {
  const navigate = useNavigate();
  const isDirectAEF = note.is_direct_aef === true;
  const isValidatedOrImputed =
    note.statut === 'valide' || note.statut === 'a_imputer' || note.statut === 'impute';

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* QR Code pour notes validées/imputées */}
        {isValidatedOrImputed && (
          <div className="flex justify-center py-2">
            <QRCodeGenerator
              reference={note.reference_pivot || note.numero || note.id}
              type="NOTE_AEF"
              dateValidation={note.validated_at || undefined}
              validateur={note.validated_by || undefined}
              size="sm"
              showHash={true}
            />
          </div>
        )}

        {/* Identification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Référence"
              value={
                <ARTIReferenceInline
                  reference={note.reference_pivot || note.numero}
                  className="text-primary"
                />
              }
            />
            {note.numero && note.numero !== note.reference_pivot && (
              <InfoRow
                label="N° AEF"
                value={<span className="font-mono text-xs">{note.numero}</span>}
              />
            )}
            <InfoRow label="Objet" value={note.objet} />
            <InfoRow
              label="Direction"
              value={
                note.direction ? (
                  `${note.direction.sigle || ''} - ${note.direction.label}`.replace(/^- /, '')
                ) : (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
                    Migré
                  </Badge>
                )
              }
            />
            <InfoRow
              label="Demandeur"
              value={
                note.created_by_profile ? (
                  getPersonName(note.created_by_profile)
                ) : (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
                    Migré
                  </Badge>
                )
              }
            />
            <InfoRow label="Urgence" value={getUrgenceBadge(note.priorite)} />
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
            <InfoRow label="Créée le" value={formatDateTime(note.created_at)} />
            {note.submitted_at && (
              <InfoRow label="Soumise le" value={formatDateTime(note.submitted_at)} />
            )}
            {note.validated_at && (
              <InfoRow label="Validée le" value={formatDateTime(note.validated_at)} />
            )}
          </CardContent>
        </Card>

        {/* Note SEF liée */}
        {loadingSEF ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Recherche de la Note SEF liée...</span>
          </div>
        ) : linkedNoteSEF ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Note SEF {isDirectAEF ? '(shadow)' : 'source'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="Référence"
                value={
                  <span className="font-mono text-blue-600">
                    {linkedNoteSEF.reference_pivot || linkedNoteSEF.numero}
                  </span>
                }
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

        {/* Rejet */}
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

        {/* Différé */}
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
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 2: BUDGET
// ============================================

function TabBudget({
  note,
  budgetAvailability,
  loadingBudget,
}: {
  note: NoteAEF;
  budgetAvailability: BudgetAvailabilityCheck | null;
  loadingBudget: boolean;
}) {
  const montant = note.montant_estime || 0;
  const disponible = budgetAvailability?.disponible ?? 0;
  const dotation = budgetAvailability?.dotation ?? 0;
  const progressPct = dotation > 0 ? Math.min((montant / dotation) * 100, 100) : 0;
  const ratioDisponible = disponible > 0 ? Math.min((montant / disponible) * 100, 100) : 0;

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Montant estimé */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Montant estimé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Montant"
              value={
                montant ? (
                  <span className="font-mono text-lg font-bold text-primary">
                    {formatMontant(montant)}
                  </span>
                ) : null
              }
            />
            {note.type_depense && (
              <InfoRow
                label="Type dépense"
                value={<span className="capitalize">{note.type_depense}</span>}
              />
            )}
          </CardContent>
        </Card>

        {/* Ligne budgétaire (si imputé) */}
        {note.budget_line ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Ligne budgétaire imputée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow
                label="Code"
                value={<span className="font-mono">{note.budget_line.code}</span>}
              />
              <InfoRow label="Libellé" value={note.budget_line.label} />
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
                  <InfoRow label="Imputé le" value={formatDateTime(note.imputed_at)} />
                  <InfoRow label="Imputé par" value={getPersonName(note.imputed_by_profile)} />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Budget availability check */
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Disponibilité budgétaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBudget ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Vérification du budget...</span>
                </div>
              ) : budgetAvailability ? (
                <div className="space-y-3">
                  <InfoRow
                    label="Dotation"
                    value={<span className="font-mono">{formatMontant(dotation)}</span>}
                  />
                  <InfoRow
                    label="Engagé"
                    value={
                      <span className="font-mono text-orange-600">
                        {formatMontant(budgetAvailability.engaged)}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Disponible"
                    value={
                      <span
                        className={`font-mono font-bold ${budgetAvailability.isAvailable ? 'text-green-600' : 'text-destructive'}`}
                      >
                        {formatMontant(disponible)}
                      </span>
                    }
                  />
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Montant NAEF vs Disponible</span>
                      <span>{ratioDisponible.toFixed(0)}%</span>
                    </div>
                    <Progress value={ratioDisponible} className="h-2" />
                    <p
                      className={`text-xs font-medium ${budgetAvailability.isAvailable ? 'text-green-600' : 'text-destructive'}`}
                    >
                      {budgetAvailability.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                  <CreditCard className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {note.statut === 'a_imputer'
                      ? "En attente d'imputation budgétaire"
                      : 'Pas encore imputée'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Montant vs Dotation progress (si ligne imputée) */}
        {note.budget_line && note.budget_line.dotation_initiale > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Montant NAEF / Dotation</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
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
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 3: CONTENU
// ============================================

function TabContenu({ note }: { note: NoteAEF }) {
  const hasContent = note.contenu || note.justification || note.objet;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucun contenu renseigné</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Objet / Exposé */}
        {note.objet && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Objet</p>
            <p className="text-sm whitespace-pre-wrap">{note.objet}</p>
          </div>
        )}

        {/* Contenu / Description */}
        {note.contenu && (
          <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-1">
              Description
            </p>
            <p className="text-sm whitespace-pre-wrap">{note.contenu}</p>
          </div>
        )}

        {/* Justification (AEF directe) */}
        {note.justification && (
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
              {note.is_direct_aef ? 'Justification AEF directe' : 'Justification'}
            </p>
            <p className="text-sm whitespace-pre-wrap">{note.justification}</p>
          </div>
        )}

        {/* Bénéficiaire */}
        {note.beneficiaire_id && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Bénéficiaire</CardTitle>
            </CardHeader>
            <CardContent>
              <BeneficiaireDisplay beneficiaireId={note.beneficiaire_id} />
            </CardContent>
          </Card>
        )}

        {/* Type de dépense */}
        {note.type_depense && (
          <Card>
            <CardContent className="pt-4 space-y-0">
              <InfoRow
                label="Type de dépense"
                value={<span className="capitalize">{note.type_depense}</span>}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

/** Petit composant pour afficher le nom du bénéficiaire */
function BeneficiaireDisplay({ beneficiaireId }: { beneficiaireId: string }) {
  const [nom, setNom] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('prestataires')
      .select('raison_sociale')
      .eq('id', beneficiaireId)
      .single()
      .then(({ data }) => {
        if (data) setNom(data.raison_sociale);
      });
  }, [beneficiaireId]);

  return <p className="text-sm">{nom || '—'}</p>;
}

// ============================================
// TAB 4: PIECES JOINTES
// ============================================

function TabPieces({ pieces, isLoading }: { pieces: NoteAEFAttachment[]; isLoading: boolean }) {
  const { toast } = useToast();
  const MAX_PJ = 3;

  const handleDownload = async (attachment: NoteAEFAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(attachment.file_path, 60);

      if (error) {
        // Fallback: download direct
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('note-attachments')
          .download(attachment.file_path);

        if (fallbackError) throw fallbackError;

        const url = URL.createObjectURL(fallbackData);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Chargement des pièces jointes...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Compteur */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pièces jointes</span>
          <Badge variant="secondary" className="gap-1">
            <Paperclip className="h-3 w-3" />
            {pieces.length}/{MAX_PJ}
          </Badge>
        </div>

        <Separator />

        {pieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Paperclip className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune pièce jointe</p>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(piece)}
                  title="Télécharger"
                >
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
// TAB 5: CHAINE & HISTORIQUE
// ============================================

function TabChaineHistorique({
  note,
  history,
  linkedNoteSEF,
  loadingHistory,
  loadingSEF,
}: {
  note: NoteAEF;
  history: NoteAEFHistoryEntry[];
  linkedNoteSEF: {
    id: string;
    numero: string;
    objet: string;
    statut: string | null;
    reference_pivot: string | null;
  } | null;
  loadingHistory: boolean;
  loadingSEF: boolean;
}) {
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Chaîne de la dépense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chaîne de la dépense</CardTitle>
          </CardHeader>
          <CardContent>
            <ChaineDepenseCompact
              currentStep={2}
              completedSteps={getCompletedSteps(note.statut)}
              size="sm"
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Note SEF liée (card résumé) */}
        {loadingSEF ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Recherche SEF liée...</span>
          </div>
        ) : linkedNoteSEF ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Note SEF associée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="N°"
                value={
                  <span className="font-mono text-blue-600">
                    {linkedNoteSEF.reference_pivot || linkedNoteSEF.numero}
                  </span>
                }
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

        <Separator />

        {/* Historique des actions */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Journal d'audit
          </h4>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-0">
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
                      {getPersonName(entry.performer)} — {formatDateTime(entry.performed_at)}
                    </p>
                    {entry.commentaire && (
                      <p className="text-xs mt-1 text-muted-foreground italic">
                        {entry.commentaire}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================
// ACTION MENU
// ============================================

function ActionMenu({
  note,
  access,
  onOpenChange,
  onEdit,
  onNavigate,
  setRejectOpen,
  setDeferOpen,
  setImputeOpen,
  submitNote,
  validateNote,
  duplicateNote,
  deleteNote,
  isSubmitting,
}: {
  note: NoteAEF;
  access: ReturnType<typeof useNoteAccessControl>;
  onOpenChange: (open: boolean) => void;
  onEdit?: (note: NoteAEF) => void;
  onNavigate: (path: string) => void;
  setRejectOpen: (v: boolean) => void;
  setDeferOpen: (v: boolean) => void;
  setImputeOpen: (v: boolean) => void;
  submitNote: (id: string) => Promise<unknown>;
  validateNote: (id: string) => Promise<unknown>;
  duplicateNote: (id: string) => Promise<unknown>;
  deleteNote: (id: string) => Promise<unknown>;
  isSubmitting: boolean;
}) {
  const { toast } = useToast();

  const handleAction = async (action: () => Promise<unknown>, label: string) => {
    try {
      await action();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast({ title: label, description: message, variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        {/* Voir détail */}
        <DropdownMenuItem
          onClick={() => {
            onNavigate(`/notes-aef/${note.id}`);
            onOpenChange(false);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir détail
        </DropdownMenuItem>

        {/* Exporter PDF */}
        <DropdownMenuItem
          onClick={() => toast({ title: 'Export PDF', description: 'Fonctionnalité à venir' })}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exporter PDF
        </DropdownMenuItem>

        {/* Modifier (créateur + brouillon) */}
        {access.canEdit && onEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(note)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          </>
        )}

        {/* Soumettre (créateur + brouillon) */}
        {access.canSubmit && (
          <DropdownMenuItem
            disabled={isSubmitting}
            onClick={() => handleAction(() => submitNote(note.id), 'Soumission')}
          >
            <Send className="mr-2 h-4 w-4" />
            Soumettre
          </DropdownMenuItem>
        )}

        {/* Supprimer (créateur + brouillon) */}
        {access.canDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleAction(() => deleteNote(note.id), 'Suppression')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        )}

        {/* Valider (DG/DAAF + soumis/a_valider) */}
        {access.canValidate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction(() => validateNote(note.id), 'Validation')}
            >
              <CheckCircle className="mr-2 h-4 w-4 text-success" />
              Valider
            </DropdownMenuItem>
          </>
        )}

        {/* Différer (DG/DAAF + soumis/a_valider) */}
        {access.canDefer && (
          <DropdownMenuItem onClick={() => setDeferOpen(true)}>
            <Clock className="mr-2 h-4 w-4 text-warning" />
            Différer
          </DropdownMenuItem>
        )}

        {/* Rejeter (DG/DAAF + soumis/a_valider) */}
        {access.canReject && (
          <DropdownMenuItem onClick={() => setRejectOpen(true)}>
            <XCircle className="mr-2 h-4 w-4 text-destructive" />
            Rejeter
          </DropdownMenuItem>
        )}

        {/* Reprendre (DG/DAAF + différé) → resubmit as brouillon */}
        {access.canResubmit && note.statut === 'differe' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => submitNote(note.id), 'Reprise')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reprendre
            </DropdownMenuItem>
          </>
        )}

        {/* Dupliquer (tous + rejeté) */}
        {note.statut === 'rejete' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction(() => duplicateNote(note.id), 'Duplication')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>
          </>
        )}

        {/* Créer Imputation (CB/DAAF + validé/a_imputer) */}
        {access.canImpute && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setImputeOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4 text-primary" />
              Créer Imputation
            </DropdownMenuItem>
          </>
        )}

        {/* Voir NSEF (si note_sef_id) */}
        {note.note_sef_id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onNavigate(`/notes-sef/${note.note_sef_id}`);
                onOpenChange(false);
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Voir NSEF
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NoteAEFDetailSheet({
  open,
  onOpenChange,
  note,
  defaultTab = 'informations',
  onEdit,
  onRefresh,
}: NoteAEFDetailSheetProps) {
  const navigate = useNavigate();

  // Access control
  const access = useNoteAccessControl(
    note
      ? { created_by: note.created_by, direction_id: note.direction_id, statut: note.statut }
      : null,
    'AEF'
  );

  // Mutations
  const {
    submitNote,
    validateNote,
    rejectNote,
    deferNote,
    imputeNote,
    duplicateNote,
    deleteNote,
    checkBudgetAvailability,
    isSubmitting,
  } = useNotesAEF();

  // Data
  const { history, pieces, linkedNoteSEF, loadingHistory, loadingPieces, loadingSEF } =
    useNoteAEFDetail(open && note ? note.id : null, note?.reference_pivot);

  // Budget availability check
  const [budgetAvailability, setBudgetAvailability] = useState<BudgetAvailabilityCheck | null>(
    null
  );
  const [loadingBudget, setLoadingBudget] = useState(false);

  const noteId = note?.id;
  const budgetLineId = note?.budget_line_id;
  const ligneBudgetaireId = note?.ligne_budgetaire_id;
  const montantEstime = note?.montant_estime;

  useEffect(() => {
    if (!open || !noteId) {
      setBudgetAvailability(null);
      return;
    }
    // Check budget if note has budget_line_id and montant
    if (budgetLineId && montantEstime && montantEstime > 0) {
      setLoadingBudget(true);
      checkBudgetAvailability(budgetLineId, montantEstime)
        .then(setBudgetAvailability)
        .catch(() => setBudgetAvailability(null))
        .finally(() => setLoadingBudget(false));
    } else if (ligneBudgetaireId && montantEstime && montantEstime > 0) {
      setLoadingBudget(true);
      checkBudgetAvailability(ligneBudgetaireId, montantEstime)
        .then(setBudgetAvailability)
        .catch(() => setBudgetAvailability(null))
        .finally(() => setLoadingBudget(false));
    } else {
      setBudgetAvailability(null);
    }
  }, [open, noteId, budgetLineId, ligneBudgetaireId, montantEstime, checkBudgetAvailability]);

  // Dialog states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deferOpen, setDeferOpen] = useState(false);
  const [imputeOpen, setImputeOpen] = useState(false);

  if (!note) return null;

  const handleReject = async (noteId: string, motif: string) => {
    await rejectNote({ noteId, motif });
    onRefresh?.();
  };

  const handleDefer = async (data: {
    noteId: string;
    motif: string;
    deadlineCorrection?: string;
  }) => {
    await deferNote(data);
    onRefresh?.();
  };

  const handleImpute = async (noteId: string, budgetLineId: string) => {
    await imputeNote({ noteId, budgetLineId });
    onRefresh?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[550px] md:w-[650px] overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-base flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{note.objet}</span>
              </SheetTitle>
              <ActionMenu
                note={note}
                access={access}
                onOpenChange={onOpenChange}
                onEdit={onEdit}
                onNavigate={navigate}
                setRejectOpen={setRejectOpen}
                setDeferOpen={setDeferOpen}
                setImputeOpen={setImputeOpen}
                submitNote={submitNote}
                validateNote={validateNote}
                duplicateNote={duplicateNote}
                deleteNote={deleteNote}
                isSubmitting={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getStatusBadge(note.statut)}
              {getUrgenceBadge(note.priorite)}
              {note.is_direct_aef && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Directe
                </Badge>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue={defaultTab} className="px-6 pb-6">
            <TabsList className="w-full">
              <TabsTrigger value="informations" className="flex-1 gap-1">
                <Info className="h-3 w-3" />
                <span className="hidden sm:inline">Infos</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="contenu" className="flex-1 gap-1">
                <BookOpen className="h-3 w-3" />
                <span className="hidden sm:inline">Contenu</span>
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
                <span className="hidden sm:inline">Chaîne</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="mt-4">
              <TabInformations note={note} linkedNoteSEF={linkedNoteSEF} loadingSEF={loadingSEF} />
            </TabsContent>

            <TabsContent value="budget" className="mt-4">
              <TabBudget
                note={note}
                budgetAvailability={budgetAvailability}
                loadingBudget={loadingBudget}
              />
            </TabsContent>

            <TabsContent value="contenu" className="mt-4">
              <TabContenu note={note} />
            </TabsContent>

            <TabsContent value="pieces" className="mt-4">
              <TabPieces pieces={pieces} isLoading={loadingPieces} />
            </TabsContent>

            <TabsContent value="historique" className="mt-4">
              <TabChaineHistorique
                note={note}
                history={history}
                linkedNoteSEF={linkedNoteSEF}
                loadingHistory={loadingHistory}
                loadingSEF={loadingSEF}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <NoteAEFRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        note={note}
        onConfirm={handleReject}
      />
      <NoteAEFDeferDialog
        open={deferOpen}
        onOpenChange={setDeferOpen}
        note={note}
        onConfirm={handleDefer}
      />
      <NoteAEFImputeDialog
        open={imputeOpen}
        onOpenChange={setImputeOpen}
        note={note}
        onConfirm={handleImpute}
      />
    </>
  );
}
