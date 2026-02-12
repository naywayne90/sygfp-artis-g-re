import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotesAEF, NoteAEF } from '@/hooks/useNotesAEF';
import { useNotesAEFList } from '@/hooks/useNotesAEFList';
import { usePermissions } from '@/hooks/usePermissions';
import { useExercice } from '@/contexts/ExerciceContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  FileText,
  Search,
  CreditCard,
  Send,
  Loader2,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ValidationNotesAEF() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { hasAnyRole, isAdmin: _isAdmin } = usePermissions();
  const canValidateDAAF = hasAnyRole(['ADMIN', 'DAAF']);
  const canValidateDG = hasAnyRole(['ADMIN', 'DG']);
  const canValidate = canValidateDAAF || canValidateDG;

  // Hook pour les mutations
  const { validateNote, rejectNote, deferNote, refetch: _refetchMutations } = useNotesAEF();

  // Hook pour la liste avec filtres
  const {
    notes,
    counts: _counts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useNotesAEFList({ pageSize: 100 });

  // État local pour les dialogs
  const [selectedNote, setSelectedNote] = useState<NoteAEF | null>(null);
  const [actionType, setActionType] = useState<'validate' | 'reject' | 'defer' | null>(null);
  const [motif, setMotif] = useState('');
  const [deadlineCorrection, setDeadlineCorrection] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrer les notes à valider (soumis ou a_valider)
  const notesToValidate = notes.filter((n) => n.statut === 'soumis' || n.statut === 'a_valider');
  const notesDeferees = notes.filter((n) => n.statut === 'differe');
  const notesToImpute = notes.filter((n) => n.statut === 'a_imputer');

  // Statistiques urgentes
  const urgentNotes = notesToValidate.filter(
    (n) => n.priorite === 'urgente' || n.priorite === 'haute'
  );

  const handleAction = (note: NoteAEF, action: 'validate' | 'reject' | 'defer') => {
    setSelectedNote(note);
    setActionType(action);
    setMotif('');
    setDeadlineCorrection('');
  };

  const handleConfirm = async () => {
    if (!selectedNote || !actionType) return;

    setIsProcessing(true);
    try {
      switch (actionType) {
        case 'validate':
          await validateNote(selectedNote.id);
          break;
        case 'reject':
          if (!motif.trim()) {
            throw new Error('Le motif de rejet est obligatoire');
          }
          await rejectNote({ noteId: selectedNote.id, motif });
          break;
        case 'defer':
          if (!motif.trim()) {
            throw new Error('Le motif de report est obligatoire');
          }
          await deferNote({
            noteId: selectedNote.id,
            motif,
            deadlineCorrection: deadlineCorrection || undefined,
          });
          break;
      }
      setSelectedNote(null);
      setActionType(null);
      refetch();
    } catch (error: unknown) {
      console.error("Erreur lors de l'action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToDetail = (noteId: string) => {
    navigate(`/notes-aef/${noteId}`);
  };

  const handleGoToImputation = (noteId: string) => {
    navigate(`/execution/imputation?sourceAef=${noteId}`);
  };

  if (!exercice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Veuillez sélectionner un exercice</p>
      </div>
    );
  }

  if (!canValidate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldCheck className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Accès restreint</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Seuls les rôles DAAF et DG peuvent accéder à l'espace de validation des Notes AEF.
        </p>
        <Button variant="outline" onClick={() => navigate('/notes-aef')}>
          Retour aux Notes AEF
        </Button>
      </div>
    );
  }

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

  const formatMontant = (montant: number | null) => {
    if (!montant) return '—';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  const getOriginBadge = (note: NoteAEF) => {
    const isDirectAEF = note.is_direct_aef || note.origin === 'DIRECT';
    if (isDirectAEF) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
          Direct DG
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
        Via SEF
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Validation Notes AEF"
        description="File d'attente des notes AEF à valider"
        icon={FileCheck}
        backUrl="/notes-aef"
      >
        {canValidateDAAF && (
          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <UserCheck className="h-3 w-3" />
            DAAF
          </Badge>
        )}
        {canValidateDG && (
          <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
            <ShieldCheck className="h-3 w-3" />
            DG
          </Badge>
        )}
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={urgentNotes.length > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold text-destructive">{urgentNotes.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{notesToValidate.length}</p>
              </div>
              <Send className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold text-orange-600">{notesDeferees.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À imputer</p>
                <p className="text-2xl font-bold text-success">{notesToImpute.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, objet, direction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="a_valider">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="a_valider" className="gap-2">
            <Send className="h-4 w-4" />À valider ({notesToValidate.length})
          </TabsTrigger>
          <TabsTrigger value="differees" className="gap-2">
            <Clock className="h-4 w-4" />
            Différées ({notesDeferees.length})
          </TabsTrigger>
          <TabsTrigger value="a_imputer" className="gap-2">
            <CreditCard className="h-4 w-4" />À imputer ({notesToImpute.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="a_valider" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes AEF en attente de validation
              </CardTitle>
              <CardDescription>Validez, différez ou rejetez les notes soumises</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : notesToValidate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="rounded-full bg-success/10 p-3">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Tout est à jour !</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aucune note en attente de validation
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead className="hidden md:table-cell">Objet</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Urgence</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notesToValidate.map((note) => (
                      <TableRow key={note.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleGoToDetail(note.id)}
                            className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {note.reference_pivot || note.numero || '—'}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {note.objet}
                        </TableCell>
                        <TableCell>
                          {note.direction?.sigle || note.direction?.label || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMontant(note.montant_estime)}
                        </TableCell>
                        <TableCell>{getUrgenceBadge(note.priorite)}</TableCell>
                        <TableCell>{getOriginBadge(note)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {format(new Date(note.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(note, 'validate')}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(note, 'defer')}
                              className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(note, 'reject')}
                              className="gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="differees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Notes différées
              </CardTitle>
              <CardDescription>Notes en attente de conditions de reprise</CardDescription>
            </CardHeader>
            <CardContent>
              {notesDeferees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="rounded-full bg-muted p-3">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucune note différée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead className="hidden md:table-cell">Objet</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead className="hidden lg:table-cell">Date report</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notesDeferees.map((note) => (
                      <TableRow key={note.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleGoToDetail(note.id)}
                            className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {note.reference_pivot || note.numero || '—'}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {note.objet}
                        </TableCell>
                        <TableCell>
                          {note.direction?.sigle || note.direction?.label || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMontant(note.montant_estime)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-orange-700">
                          {note.motif_differe || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {note.date_differe
                            ? format(new Date(note.date_differe), 'dd MMM yyyy', {
                                locale: fr,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(note, 'validate')}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Reprendre
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="a_imputer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-success" />
                Notes validées à imputer
              </CardTitle>
              <CardDescription>Notes validées en attente d'imputation budgétaire</CardDescription>
            </CardHeader>
            <CardContent>
              {notesToImpute.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="rounded-full bg-muted p-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucune note en attente d'imputation</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead className="hidden md:table-cell">Objet</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Validé par</TableHead>
                      <TableHead className="hidden lg:table-cell">Date validation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notesToImpute.map((note) => (
                      <TableRow key={note.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleGoToDetail(note.id)}
                            className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {note.reference_pivot || note.numero || '—'}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {note.objet}
                        </TableCell>
                        <TableCell>
                          {note.direction?.sigle || note.direction?.label || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMontant(note.montant_estime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-success/10 text-success">
                            DG
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {note.validated_at
                            ? format(new Date(note.validated_at), 'dd MMM yyyy', { locale: fr })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleGoToImputation(note.id)}
                            className="gap-1"
                          >
                            <ArrowRight className="h-3 w-3" />
                            Imputer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation */}
      <Dialog
        open={!!selectedNote && !!actionType}
        onOpenChange={() => {
          setSelectedNote(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'validate' && (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Valider la note AEF
                </>
              )}
              {actionType === 'reject' && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Rejeter la note AEF
                </>
              )}
              {actionType === 'defer' && (
                <>
                  <Clock className="h-5 w-5 text-orange-600" />
                  Différer la note AEF
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Note :{' '}
              <strong className="font-mono">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </strong>
              <br />
              Objet : {selectedNote?.objet}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'validate' ? (
            <div className="py-4">
              <Alert className="border-success/20 bg-success/5">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  En validant cette note, elle sera disponible pour{' '}
                  <strong>imputation budgétaire</strong>.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="motif">
                  {actionType === 'reject' ? 'Motif de rejet *' : 'Motif de report *'}
                </Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder={
                    actionType === 'reject'
                      ? 'Expliquez la raison du rejet...'
                      : 'Expliquez les conditions de reprise...'
                  }
                  rows={3}
                  className={!motif.trim() ? 'border-destructive' : ''}
                />
              </div>

              {actionType === 'defer' && (
                <div>
                  <Label htmlFor="deadline">Date limite de correction (optionnelle)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadlineCorrection}
                    onChange={(e) => setDeadlineCorrection(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedNote(null);
                setActionType(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || (actionType !== 'validate' && !motif.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'validate' && 'Confirmer la validation'}
              {actionType === 'reject' && 'Confirmer le rejet'}
              {actionType === 'defer' && 'Confirmer le report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
