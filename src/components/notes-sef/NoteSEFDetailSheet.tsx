import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNoteSEFDetail, type Attachment } from '@/hooks/useNoteSEFDetail';
import { type NoteSEF, type NoteSEFHistory } from '@/hooks/useNotesSEF';
import { ARTIReferenceInline } from '@/components/shared/ARTIReferenceBadge';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { ChaineDepenseCompact } from '@/components/workflow/ChaineDepenseCompact';
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
  BookOpen,
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
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface NoteSEFDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
  defaultTab?: string;
  onEdit?: (note: NoteSEF) => void;
  onNavigateToDetail?: (note: NoteSEF) => void;
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
    a_valider: { label: 'À valider', className: 'bg-warning/10 text-warning border-warning/20' },
    valide: { label: 'Validé', className: 'bg-success/10 text-success border-success/20' },
    valide_auto: {
      label: 'Validé (auto)',
      className: 'bg-success/10 text-success border-success/20 border-dashed',
    },
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
    case 'creation':
    case 'created':
      return <FilePlus className="h-4 w-4 text-blue-500" />;
    case 'soumission':
    case 'submitted':
      return <Send className="h-4 w-4 text-indigo-500" />;
    case 'validation':
    case 'validated':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejet':
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'report':
    case 'deferred':
    case 'differe':
      return <Clock className="h-4 w-4 text-orange-500" />;
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

// ============================================
// TAB 1: INFORMATIONS
// ============================================

function TabInformations({
  note,
  onEdit,
  onNavigateToDetail,
}: {
  note: NoteSEF;
  onEdit?: (note: NoteSEF) => void;
  onNavigateToDetail?: (note: NoteSEF) => void;
}) {
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* QR Code pour notes validées */}
        {note.statut === 'valide' && (
          <div className="flex justify-center py-2">
            <QRCodeGenerator
              reference={note.reference_pivot || note.numero || note.id}
              type="NOTE_SEF"
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
                note.dossier_ref ? (
                  <span className="font-mono text-primary">{note.dossier_ref}</span>
                ) : (
                  <ARTIReferenceInline
                    reference={note.reference_pivot || note.numero}
                    className="text-primary"
                  />
                )
              }
            />
            <InfoRow label="Statut" value={getStatusBadge(note.statut)} />
            <InfoRow label="Urgence" value={getUrgenceBadge(note.urgence)} />
            <InfoRow label="Exercice" value={note.exercice} />
          </CardContent>
        </Card>

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
            <InfoRow label="Demandeur" value={getPersonName(note.demandeur)} />
            <InfoRow
              label="Bénéficiaire"
              value={
                note.beneficiaire?.raison_sociale ||
                getPersonName(note.beneficiaire_interne) ||
                null
              }
            />
            <InfoRow label="Date souhaitée" value={formatDate(note.date_souhaitee)} />
          </CardContent>
        </Card>

        {/* Budget (conditionnel) */}
        {(note.montant_estime ||
          note.type_depense ||
          note.objectif_strategique ||
          note.mission) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {note.montant_estime != null && (
                <InfoRow
                  label="Montant estimé"
                  value={<span className="font-mono">{formatMontant(note.montant_estime)}</span>}
                />
              )}
              {note.type_depense && <InfoRow label="Type dépense" value={note.type_depense} />}
              {note.objectif_strategique && (
                <InfoRow
                  label="Obj. stratégique"
                  value={`${note.objectif_strategique.code} - ${note.objectif_strategique.libelle}`}
                />
              )}
              {note.mission && (
                <InfoRow label="Mission" value={`${note.mission.code} - ${note.mission.libelle}`} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Autres */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Autres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Justification" value={note.justification} />
            <InfoRow label="Description" value={note.description} />
            <InfoRow label="Créée le" value={formatDateTime(note.created_at)} />
            <InfoRow label="Créée par" value={getPersonName(note.created_by_profile)} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          {note.statut === 'brouillon' && onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
              onClick={() => onEdit(note)}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          )}
          {onNavigateToDetail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
              onClick={() => onNavigateToDetail(note)}
            >
              <ExternalLink className="h-4 w-4" />
              Page complète
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 2: CONTENU
// ============================================

function TabContenu({ note }: { note: NoteSEF }) {
  const hasContent = note.expose || note.avis || note.recommandations || note.commentaire;

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
        {note.expose && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Exposé</p>
            <p className="text-sm whitespace-pre-wrap">{note.expose}</p>
          </div>
        )}

        {note.avis && (
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Avis</p>
            <p className="text-sm whitespace-pre-wrap">{note.avis}</p>
          </div>
        )}

        {note.recommandations && (
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
              Recommandations
            </p>
            <p className="text-sm whitespace-pre-wrap">{note.recommandations}</p>
          </div>
        )}

        {note.commentaire && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Commentaire</p>
            <p className="text-sm whitespace-pre-wrap">{note.commentaire}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TAB 3: PIECES JOINTES
// ============================================

function TabPieces({ pieces, isLoading }: { pieces: Attachment[]; isLoading: boolean }) {
  const { toast } = useToast();
  const MAX_PJ = 3;

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('notes-sef')
        .createSignedUrl(attachment.fichier_url, 60);

      if (error) {
        // Fallback: ancien bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('notes_sef_pieces')
          .download(attachment.fichier_url);

        if (fallbackError) throw fallbackError;

        const url = URL.createObjectURL(fallbackData);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.nom;
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
                {/* Miniature pour les images */}
                {piece.type_fichier?.startsWith('image/') ? (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {getFileIcon(piece.type_fichier)}
                  </div>
                )}

                {/* Infos fichier */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{piece.nom}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(piece.taille)}</span>
                    <span>{formatDate(piece.uploaded_at)}</span>
                  </div>
                </div>

                {/* Bouton téléchargement */}
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
// TAB 4: HISTORIQUE & CHAINE
// ============================================

function TabHistorique({
  note,
  history,
  linkedNoteAEF,
  loadingHistory,
  loadingAEF,
}: {
  note: NoteSEF;
  history: NoteSEFHistory[];
  linkedNoteAEF: { id: string; numero: string; objet: string; statut: string | null } | null;
  loadingHistory: boolean;
  loadingAEF: boolean;
}) {
  const navigate = useNavigate();

  const isValidated = note.statut === 'valide' || note.statut === 'valide_auto';

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
              currentStep={1}
              completedSteps={isValidated ? [1] : []}
              size="sm"
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Note AEF associée */}
        {loadingAEF ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Recherche de la Note AEF liée...</span>
          </div>
        ) : linkedNoteAEF ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Note AEF associée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="Numéro"
                value={<span className="font-mono text-blue-600">{linkedNoteAEF.numero}</span>}
              />
              <InfoRow label="Objet" value={linkedNoteAEF.objet} />
              {linkedNoteAEF.statut && (
                <InfoRow label="Statut" value={getStatusBadge(linkedNoteAEF.statut)} />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={() => navigate(`/notes-aef/${linkedNoteAEF.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
                Voir la Note AEF
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Separator />

        {/* Historique */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
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
                  {/* Timeline line */}
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
// MAIN COMPONENT
// ============================================

export function NoteSEFDetailSheet({
  open,
  onOpenChange,
  note,
  defaultTab = 'informations',
  onEdit,
  onNavigateToDetail,
}: NoteSEFDetailSheetProps) {
  const { pieces, history, linkedNoteAEF, loadingPieces, loadingHistory, loadingAEF } =
    useNoteSEFDetail(open && note ? note.id : null);

  if (!note) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[550px] md:w-[650px] overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="truncate">{note.objet}</span>
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(note.statut)}
            {getUrgenceBadge(note.urgence)}
          </div>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="px-6 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="informations" className="flex-1 gap-1">
              <Info className="h-3 w-3" />
              <span className="hidden sm:inline">Infos</span>
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
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="mt-4">
            <TabInformations note={note} onEdit={onEdit} onNavigateToDetail={onNavigateToDetail} />
          </TabsContent>

          <TabsContent value="contenu" className="mt-4">
            <TabContenu note={note} />
          </TabsContent>

          <TabsContent value="pieces" className="mt-4">
            <TabPieces pieces={pieces} isLoading={loadingPieces} />
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <TabHistorique
              note={note}
              history={history}
              linkedNoteAEF={linkedNoteAEF}
              loadingHistory={loadingHistory}
              loadingAEF={loadingAEF}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
