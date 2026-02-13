import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { type Imputation, useImputations } from '@/hooks/useImputations';
import { usePermissions } from '@/hooks/usePermissions';
import { ChaineDepenseCompact } from '@/components/workflow/ChaineDepenseCompact';
import { ImputationRejectDialog } from '@/components/imputation/ImputationRejectDialog';
import { ImputationDeferDialog } from '@/components/imputation/ImputationDeferDialog';
import { formatMontant } from '@/lib/config/sygfp-constants';
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
  MoreHorizontal,
  Trash2,
  FileDown,
  ShoppingCart,
  AlertTriangle,
  Tag,
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface ImputationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imputation: Imputation | null;
  onRefresh?: () => void;
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
    a_valider: {
      label: '\u00C0 valider',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    valide: { label: 'Valid\u00E9e', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejet\u00E9e',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Diff\u00E9r\u00E9e',
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

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '\u2014';
  return format(new Date(dateStr), "dd MMM yyyy '\u00E0' HH:mm", { locale: fr });
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '\u2014';
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
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
    case 'delete':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'update':
      return <Edit className="h-4 w-4 text-blue-500" />;
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

/** Compute completedSteps for ChaineDepenseCompact based on imputation statut */
const getCompletedSteps = (statut: string): number[] => {
  switch (statut) {
    case 'valide':
      return [1, 2, 3]; // SEF + AEF + Imputation
    case 'a_valider':
    case 'brouillon':
      return [1, 2]; // SEF + AEF done
    case 'rejete':
    case 'differe':
      return [1, 2]; // SEF + AEF done, imputation pending
    default:
      return [1, 2];
  }
};

// ============================================
// TAB 1: INFORMATIONS
// ============================================

function TabInformations({
  imputation,
  noteAef,
}: {
  imputation: Imputation;
  noteAef: { note_sef_id: string | null } | null;
}) {
  const navigate = useNavigate();

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
              label="R\u00E9f\u00E9rence"
              value={
                imputation.reference ? (
                  <span className="font-mono text-primary">{imputation.reference}</span>
                ) : null
              }
            />
            <InfoRow label="Objet" value={imputation.objet} />
            <InfoRow
              label="Direction"
              value={imputation.direction?.sigle || imputation.direction?.label}
            />
            <InfoRow
              label="CB cr\u00E9ateur"
              value={getPersonName(imputation.created_by_profile)}
            />
            <InfoRow label="Statut" value={getStatusBadge(imputation.statut)} />
            <InfoRow label="Cr\u00E9\u00E9e le" value={formatDateTime(imputation.created_at)} />
            <InfoRow label="Exercice" value={imputation.exercice} />
            <InfoRow
              label="Code imputation"
              value={
                imputation.code_imputation ? (
                  <span className="font-mono text-xs">{imputation.code_imputation}</span>
                ) : null
              }
            />
            <InfoRow
              label="Source financement"
              value={
                imputation.source_financement ? (
                  <span className="capitalize">
                    {imputation.source_financement.replace(/_/g, ' ')}
                  </span>
                ) : null
              }
            />
          </CardContent>
        </Card>

        {/* NAEF source */}
        {imputation.note_aef && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Note AEF source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="N\u00B0 AEF"
                value={
                  <span className="font-mono text-blue-600">
                    {imputation.note_aef.numero || '\u2014'}
                  </span>
                }
              />
              <InfoRow label="Objet" value={imputation.note_aef.objet} />
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={() => navigate(`/notes-aef/${imputation.note_aef_id}`)}
              >
                <ExternalLink className="h-4 w-4" />
                Voir la Note AEF
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Note SEF liée */}
        {noteAef?.note_sef_id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => navigate(`/notes-sef/${noteAef.note_sef_id}`)}
          >
            <FileText className="h-4 w-4" />
            Voir la Note SEF source
          </Button>
        )}

        {/* Montant principal */}
        <Card>
          <CardContent className="pt-4 space-y-0">
            <InfoRow
              label="Montant"
              value={
                <span className="font-mono text-lg font-bold text-primary">
                  {formatMontant(imputation.montant)}
                </span>
              }
            />
          </CardContent>
        </Card>

        {/* Commentaire */}
        {imputation.commentaire && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Commentaire</p>
              <p className="text-sm">{imputation.commentaire}</p>
            </CardContent>
          </Card>
        )}

        {/* Motif rejet */}
        {imputation.statut === 'rejete' && imputation.motif_rejet && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Motif de rejet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{imputation.motif_rejet}</p>
              {imputation.rejected_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Rejet\u00E9e le {formatDateTime(imputation.rejected_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Motif diff\u00E9r\u00E9 */}
        {imputation.statut === 'differe' && imputation.motif_differe && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm">{imputation.motif_differe}</p>
              {(imputation as unknown as Record<string, unknown>).date_differe && (
                <p className="text-xs text-muted-foreground">
                  Date de reprise :{' '}
                  {formatDate(
                    (imputation as unknown as Record<string, unknown>).date_differe as string
                  )}
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

interface BudgetLineDetail {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number | null;
  dotation_modifiee: number | null;
  total_engage: number | null;
  montant_reserve: number | null;
}

interface NomenclatureItem {
  id: string;
  code: string | null;
  libelle: string;
}

function TabBudget({
  imputation,
  budgetLine,
  loadingBudget,
  nomenclatures,
  loadingNomenclatures,
}: {
  imputation: Imputation;
  budgetLine: BudgetLineDetail | null;
  loadingBudget: boolean;
  nomenclatures: {
    os: NomenclatureItem | null;
    mission: NomenclatureItem | null;
    action: NomenclatureItem | null;
    activite: NomenclatureItem | null;
  };
  loadingNomenclatures: boolean;
}) {
  const dotation = budgetLine
    ? Math.max(budgetLine.dotation_modifiee || 0, budgetLine.dotation_initiale || 0)
    : 0;
  const totalEngage = budgetLine?.total_engage || 0;
  const montant = imputation.montant;
  const disponibleApres = dotation - totalEngage - montant;
  const ratio = dotation > 0 ? ((totalEngage + montant) / dotation) * 100 : 0;
  const progressColor =
    ratio >= 90 ? 'text-destructive' : ratio >= 50 ? 'text-orange-600' : 'text-green-600';

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Ligne budg\u00E9taire */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Ligne budg\u00E9taire
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBudget ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : budgetLine ? (
              <div className="space-y-0">
                <InfoRow
                  label="Code"
                  value={<span className="font-mono">{budgetLine.code}</span>}
                />
                <InfoRow label="Libell\u00E9" value={budgetLine.label} />
              </div>
            ) : imputation.budget_line ? (
              <div className="space-y-0">
                <InfoRow
                  label="Code"
                  value={<span className="font-mono">{imputation.budget_line.code}</span>}
                />
                <InfoRow label="Libell\u00E9" value={imputation.budget_line.label} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <CreditCard className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune ligne budg\u00E9taire</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disponibilit\u00E9 */}
        {budgetLine && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Disponibilit\u00E9 budg\u00E9taire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Dotation"
                value={<span className="font-mono">{formatMontant(dotation)}</span>}
              />
              <InfoRow
                label="Engag\u00E9 avant"
                value={
                  <span className="font-mono text-orange-600">{formatMontant(totalEngage)}</span>
                }
              />
              <InfoRow
                label="Cette imputation"
                value={
                  <span className="font-mono font-bold text-primary">{formatMontant(montant)}</span>
                }
              />
              <Separator />
              <InfoRow
                label="Disponible apr\u00E8s"
                value={
                  <span
                    className={`font-mono font-bold ${disponibleApres >= 0 ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {formatMontant(disponibleApres)}
                  </span>
                }
              />

              {/* Barre de progression */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Consommation</span>
                  <span className={progressColor}>{Math.min(ratio, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(ratio, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rattachement programmatique */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rattachement programmatique</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingNomenclatures ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow
                  label="Objectif strat\u00E9gique"
                  value={
                    nomenclatures.os
                      ? `${nomenclatures.os.code || ''} - ${nomenclatures.os.libelle}`
                      : null
                  }
                />
                <InfoRow
                  label="Mission"
                  value={
                    nomenclatures.mission
                      ? `${nomenclatures.mission.code || ''} - ${nomenclatures.mission.libelle}`
                      : null
                  }
                />
                <InfoRow
                  label="Action"
                  value={
                    nomenclatures.action
                      ? `${nomenclatures.action.code || ''} - ${nomenclatures.action.libelle}`
                      : null
                  }
                />
                <InfoRow
                  label="Activit\u00E9"
                  value={
                    nomenclatures.activite
                      ? `${nomenclatures.activite.code || ''} - ${nomenclatures.activite.libelle}`
                      : null
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 3: PIECES JOINTES
// ============================================

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

function TabPieces({ pieces, isLoading }: { pieces: Attachment[]; isLoading: boolean }) {
  const { toast } = useToast();

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(attachment.file_path, 60);

      if (error) {
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
        description: 'Impossible de t\u00E9l\u00E9charger le fichier',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Chargement des pi\u00E8ces jointes...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pi\u00E8ces jointes (NAEF source)</span>
          <Badge variant="secondary" className="gap-1">
            <Paperclip className="h-3 w-3" />
            {pieces.length}
          </Badge>
        </div>

        <Separator />

        {pieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Paperclip className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune pi\u00E8ce jointe</p>
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
                  title="T\u00E9l\u00E9charger"
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
// TAB 4: CHAINE & HISTORIQUE
// ============================================

interface AuditLogEntry {
  id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
  user_profile?: { first_name: string | null; last_name: string | null } | null;
}

function TabChaineHistorique({
  imputation,
  noteAef,
  auditLogs,
  loadingLogs,
}: {
  imputation: Imputation;
  noteAef: { note_sef_id: string | null } | null;
  auditLogs: AuditLogEntry[];
  loadingLogs: boolean;
}) {
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Cha\u00EEne de la d\u00E9pense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cha\u00EEne de la d\u00E9pense</CardTitle>
          </CardHeader>
          <CardContent>
            <ChaineDepenseCompact
              currentStep={3}
              completedSteps={getCompletedSteps(imputation.statut)}
              size="sm"
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Liens cha\u00EEne */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Liens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Note SEF */}
            {noteAef?.note_sef_id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/notes-sef/${noteAef.note_sef_id}`)}
              >
                <FileText className="h-4 w-4 text-slate-600" />
                Note SEF
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}

            {/* Note AEF */}
            {imputation.note_aef_id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/notes-aef/${imputation.note_aef_id}`)}
              >
                <FileText className="h-4 w-4 text-blue-600" />
                Note AEF {imputation.note_aef?.numero || ''}
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}

            {/* Imputation courante */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Imputation {imputation.reference || ''}</span>
              {getStatusBadge(imputation.statut)}
            </div>

            {/* \u00C9tapes suivantes (gris\u00E9es) */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 opacity-50">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expression de besoin</span>
              <Badge variant="outline" className="text-[10px] ml-auto">
                \u00C0 venir
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Journal d'audit */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Journal d'audit
          </h4>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-0">
              {auditLogs.map((entry, index) => {
                const oldStatut =
                  entry.old_values && typeof entry.old_values === 'object'
                    ? (entry.old_values as Record<string, unknown>).statut
                    : null;
                const newStatut =
                  entry.new_values && typeof entry.new_values === 'object'
                    ? (entry.new_values as Record<string, unknown>).statut
                    : null;

                return (
                  <div key={entry.id} className="flex gap-3 pb-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="flex-shrink-0 mt-0.5">{getHistoryIcon(entry.action)}</div>
                      {index < auditLogs.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        {oldStatut && newStatut && oldStatut !== newStatut && (
                          <span className="text-xs text-muted-foreground">
                            {String(oldStatut)} \u2192 {String(newStatut)}
                          </span>
                        )}
                        {newStatut && !oldStatut && (
                          <Badge variant="outline" className="text-[10px]">
                            {String(newStatut)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getPersonName(entry.user_profile)} \u2014{' '}
                        {formatDateTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
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
  imputation,
  canValidate,
  isCreator,
  onOpenChange,
  onNavigate,
  setRejectOpen,
  setDeferOpen,
  submitImputation,
  validateImputation,
  deleteImputation,
}: {
  imputation: Imputation;
  canValidate: boolean;
  isCreator: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (path: string) => void;
  setRejectOpen: (v: boolean) => void;
  setDeferOpen: (v: boolean) => void;
  submitImputation: (id: string) => Promise<unknown>;
  validateImputation: (id: string) => Promise<unknown>;
  deleteImputation: (id: string) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const isBrouillon = imputation.statut === 'brouillon';
  const isAValider = imputation.statut === 'a_valider';
  const isValide = imputation.statut === 'valide';

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
        {/* Exporter PDF */}
        <DropdownMenuItem
          onClick={() =>
            toast({ title: 'Export PDF', description: 'Fonctionnalit\u00E9 \u00E0 venir' })
          }
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exporter PDF
        </DropdownMenuItem>

        {/* Modifier (cr\u00E9ateur + brouillon) */}
        {isCreator && isBrouillon && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast({ title: 'Modification', description: 'Fonctionnalit\u00E9 \u00E0 venir' })
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          </>
        )}

        {/* Soumettre (cr\u00E9ateur + brouillon) */}
        {isCreator && isBrouillon && (
          <DropdownMenuItem
            onClick={() => handleAction(() => submitImputation(imputation.id), 'Soumission')}
          >
            <Send className="mr-2 h-4 w-4" />
            Soumettre
          </DropdownMenuItem>
        )}

        {/* Supprimer (cr\u00E9ateur + brouillon) */}
        {isCreator && isBrouillon && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleAction(() => deleteImputation(imputation.id), 'Suppression')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        )}

        {/* Valider (canValidate + a_valider) */}
        {canValidate && isAValider && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction(() => validateImputation(imputation.id), 'Validation')}
            >
              <CheckCircle className="mr-2 h-4 w-4 text-success" />
              Valider
            </DropdownMenuItem>
          </>
        )}

        {/* Rejeter (canValidate + a_valider) */}
        {canValidate && isAValider && (
          <DropdownMenuItem onClick={() => setRejectOpen(true)}>
            <XCircle className="mr-2 h-4 w-4 text-destructive" />
            Rejeter
          </DropdownMenuItem>
        )}

        {/* Diff\u00E9rer (canValidate + a_valider) */}
        {canValidate && isAValider && (
          <DropdownMenuItem onClick={() => setDeferOpen(true)}>
            <Clock className="mr-2 h-4 w-4 text-warning" />
            Diff\u00E9rer
          </DropdownMenuItem>
        )}

        {/* Voir NAEF */}
        {imputation.note_aef_id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onNavigate(`/notes-aef/${imputation.note_aef_id}`);
                onOpenChange(false);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Voir NAEF
            </DropdownMenuItem>
          </>
        )}

        {/* Cr\u00E9er Expression de Besoin (valid\u00E9) */}
        {isValide && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onNavigate(`/execution/expression-besoin?sourceImputation=${imputation.id}`);
                onOpenChange(false);
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cr\u00E9er Exp. Besoin
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

export function ImputationDetailSheet({
  open,
  onOpenChange,
  imputation,
  onRefresh,
}: ImputationDetailSheetProps) {
  const navigate = useNavigate();
  const { hasAnyRole, userId } = usePermissions();
  const canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF', 'SDPM']);
  const isCreator = !!userId && imputation?.created_by === userId;

  // Mutations
  const {
    submitImputation,
    validateImputation,
    rejectImputation,
    deferImputation,
    deleteImputation,
  } = useImputations();

  // Dialog states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deferOpen, setDeferOpen] = useState(false);

  // Fetch budget line details
  const { data: budgetLine = null, isLoading: loadingBudget } = useQuery({
    queryKey: ['budget-line-detail', imputation?.budget_line_id],
    queryFn: async () => {
      if (!imputation?.budget_line_id) return null;
      const { data, error } = await supabase
        .from('budget_lines')
        .select(
          'id, code, label, dotation_initiale, dotation_modifiee, total_engage, montant_reserve'
        )
        .eq('id', imputation.budget_line_id)
        .single();
      if (error) return null;
      return data as BudgetLineDetail;
    },
    enabled: open && !!imputation?.budget_line_id,
  });

  // Fetch note AEF for note_sef_id
  const { data: noteAef = null } = useQuery({
    queryKey: ['imputation-note-aef', imputation?.note_aef_id],
    queryFn: async () => {
      if (!imputation?.note_aef_id) return null;
      const { data, error } = await supabase
        .from('notes_dg')
        .select('note_sef_id')
        .eq('id', imputation.note_aef_id)
        .single();
      if (error) return null;
      return data as { note_sef_id: string | null };
    },
    enabled: open && !!imputation?.note_aef_id,
  });

  // Fetch attachments from NAEF
  const { data: pieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ['imputation-pieces', imputation?.note_aef_id],
    queryFn: async () => {
      if (!imputation?.note_aef_id) return [];
      const { data, error } = await supabase
        .from('note_attachments')
        .select('id, file_name, file_path, file_type, file_size, created_at')
        .eq('note_id', imputation.note_aef_id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data as Attachment[];
    },
    enabled: open && !!imputation?.note_aef_id,
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['imputation-audit-logs', imputation?.id],
    queryFn: async () => {
      if (!imputation?.id) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, old_values, new_values, created_at, user_id')
        .eq('entity_type', 'imputation')
        .eq('entity_id', imputation.id)
        .order('created_at', { ascending: false });
      if (error) return [];

      // Fetch user profiles for each log
      const userIds = [...new Set(data.map((l) => l.user_id).filter(Boolean))] as string[];
      let profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
        }
      }

      return data.map((entry) => ({
        ...entry,
        user_profile: entry.user_id ? profileMap[entry.user_id] || null : null,
      })) as AuditLogEntry[];
    },
    enabled: open && !!imputation?.id,
  });

  // Fetch nomenclatures
  const { data: nomenclatures, isLoading: loadingNomenclatures } = useQuery({
    queryKey: [
      'imputation-nomenclatures',
      imputation?.os_id,
      imputation?.mission_id,
      imputation?.action_id,
      imputation?.activite_id,
    ],
    queryFn: async () => {
      const result: {
        os: NomenclatureItem | null;
        mission: NomenclatureItem | null;
        action: NomenclatureItem | null;
        activite: NomenclatureItem | null;
      } = { os: null, mission: null, action: null, activite: null };

      if (imputation?.os_id) {
        const { data } = await supabase
          .from('objectifs_strategiques')
          .select('id, code, libelle')
          .eq('id', imputation.os_id)
          .single();
        if (data) result.os = { id: data.id, code: data.code, libelle: data.libelle };
      }
      if (imputation?.mission_id) {
        const { data } = await supabase
          .from('missions')
          .select('id, code, libelle')
          .eq('id', imputation.mission_id)
          .single();
        if (data) result.mission = { id: data.id, code: data.code, libelle: data.libelle };
      }
      if (imputation?.action_id) {
        const { data } = await supabase
          .from('actions')
          .select('id, code, libelle')
          .eq('id', imputation.action_id)
          .single();
        if (data) result.action = { id: data.id, code: data.code, libelle: data.libelle };
      }
      if (imputation?.activite_id) {
        const { data } = await supabase
          .from('activites')
          .select('id, code, libelle')
          .eq('id', imputation.activite_id)
          .single();
        if (data) result.activite = { id: data.id, code: data.code, libelle: data.libelle };
      }
      return result;
    },
    enabled:
      open &&
      !!(
        imputation?.os_id ||
        imputation?.mission_id ||
        imputation?.action_id ||
        imputation?.activite_id
      ),
  });

  if (!imputation) return null;

  const handleReject = async (motif: string) => {
    await rejectImputation({ id: imputation.id, motif });
    setRejectOpen(false);
    onRefresh?.();
  };

  const handleDefer = async (motif: string, dateReprise?: string) => {
    await deferImputation({ id: imputation.id, motif, dateReprise });
    setDeferOpen(false);
    onRefresh?.();
  };

  const handleSubmit = async (id: string) => {
    await submitImputation(id);
    onRefresh?.();
  };

  const handleValidate = async (id: string) => {
    await validateImputation(id);
    onRefresh?.();
  };

  const handleDelete = async (id: string) => {
    await deleteImputation(id);
    onRefresh?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[550px] md:w-[650px] overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-base flex items-center gap-2 flex-1 min-w-0">
                <Tag className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{imputation.objet}</span>
              </SheetTitle>
              <ActionMenu
                imputation={imputation}
                canValidate={canValidate}
                isCreator={isCreator}
                onOpenChange={onOpenChange}
                onNavigate={navigate}
                setRejectOpen={setRejectOpen}
                setDeferOpen={setDeferOpen}
                submitImputation={handleSubmit}
                validateImputation={handleValidate}
                deleteImputation={handleDelete}
              />
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getStatusBadge(imputation.statut)}
              {imputation.reference && (
                <Badge variant="outline" className="font-mono text-xs">
                  {imputation.reference}
                </Badge>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="informations" className="px-6 pb-6">
            <TabsList className="w-full">
              <TabsTrigger value="informations" className="flex-1 gap-1">
                <Info className="h-3 w-3" />
                <span className="hidden sm:inline">Infos</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="hidden sm:inline">Budget</span>
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
                <span className="hidden sm:inline">Cha\u00EEne</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="mt-4">
              <TabInformations imputation={imputation} noteAef={noteAef} />
            </TabsContent>

            <TabsContent value="budget" className="mt-4">
              <TabBudget
                imputation={imputation}
                budgetLine={budgetLine}
                loadingBudget={loadingBudget}
                nomenclatures={
                  nomenclatures || { os: null, mission: null, action: null, activite: null }
                }
                loadingNomenclatures={loadingNomenclatures}
              />
            </TabsContent>

            <TabsContent value="pieces" className="mt-4">
              <TabPieces pieces={pieces} isLoading={loadingPieces} />
            </TabsContent>

            <TabsContent value="historique" className="mt-4">
              <TabChaineHistorique
                imputation={imputation}
                noteAef={noteAef}
                auditLogs={auditLogs}
                loadingLogs={loadingLogs}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <ImputationRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        imputationReference={imputation.reference}
        onConfirm={handleReject}
      />
      <ImputationDeferDialog
        open={deferOpen}
        onOpenChange={setDeferOpen}
        imputationReference={imputation.reference}
        onConfirm={handleDefer}
      />
    </>
  );
}
