/**
 * Page de validation des Notes Direction Générale - Espace DG
 *
 * Vue dédiée pour les validateurs (DG/ADMIN) avec :
 * - Liste des notes en statut SOUMISE_DG
 * - Actions : Voir, Valider, Rejeter
 * - Audit complet des actions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotesDirectionGenerale,
  NoteDirectionGenerale,
} from '@/hooks/useNotesDirectionGenerale';
import { usePermissions } from '@/hooks/usePermissions';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  FileCheck,
  FileText,
  Shield,
  Search,
  Loader2,
  Eye,
  Building2,
  ArrowLeft,
  FileSignature,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';

// Skeleton pour le chargement
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-32" />
      </TableCell>
    </TableRow>
  );
}

export default function ValidationNotesDG() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const { logAction } = useAuditLog();

  // Autorisation : DG ou Admin uniquement
  const canValidate = hasAnyRole(['Admin', 'DG']);

  // États des dialogs
  const [selectedNote, setSelectedNote] = useState<NoteDirectionGenerale | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmValidateOpen, setConfirmValidateOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook pour les notes
  const {
    notes: _notes,
    notesByStatus,
    isLoading,
    refetch,
    validateNote,
    rejectNote,
  } = useNotesDirectionGenerale();

  // Notes à valider (statut SOUMISE_DG)
  const notesAValider = notesByStatus.soumise_dg;

  // Filtrer par recherche
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notesAValider;
    const search = searchTerm.toLowerCase();
    return notesAValider.filter(
      (note) =>
        note.reference?.toLowerCase().includes(search) ||
        note.objet.toLowerCase().includes(search) ||
        note.destinataire.toLowerCase().includes(search) ||
        note.direction?.sigle?.toLowerCase().includes(search) ||
        note.direction?.label?.toLowerCase().includes(search)
    );
  }, [notesAValider, searchTerm]);

  // Trier par date de création (plus récent en premier)
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredNotes]);

  // Handlers
  const handleView = (note: NoteDirectionGenerale) => {
    setSelectedNote(note);
    setViewDialogOpen(true);
  };

  const handleValidateClick = (note: NoteDirectionGenerale) => {
    setSelectedNote(note);
    setConfirmValidateOpen(true);
  };

  const handleRejectClick = (note: NoteDirectionGenerale) => {
    setSelectedNote(note);
    setRejectMotif('');
    setRejectError(null);
    setRejectDialogOpen(true);
  };

  const handleConfirmValidate = async () => {
    if (!selectedNote) return;

    setIsProcessing(true);
    try {
      await validateNote(selectedNote.id);

      // Log audit
      await logAction({
        entityType: 'note_direction_generale',
        entityId: selectedNote.id,
        action: 'validate',
        oldValues: { statut: 'soumise_dg' },
        newValues: { statut: 'dg_valide' },
        metadata: {
          reference: selectedNote.reference,
          objet: selectedNote.objet,
        },
      });

      setConfirmValidateOpen(false);
      setSelectedNote(null);
      refetch();
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedNote) return;

    if (!rejectMotif.trim()) {
      setRejectError('Le motif de rejet est obligatoire');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectNote({ noteId: selectedNote.id, motif: rejectMotif });

      // Log audit
      await logAction({
        entityType: 'note_direction_generale',
        entityId: selectedNote.id,
        action: 'reject',
        oldValues: { statut: 'soumise_dg' },
        newValues: { statut: 'dg_rejetee', motif_rejet: rejectMotif },
        justification: rejectMotif,
        metadata: {
          reference: selectedNote.reference,
          objet: selectedNote.objet,
        },
      });

      setRejectDialogOpen(false);
      setSelectedNote(null);
      setRejectMotif('');
      refetch();
    } catch (error) {
      console.error('Erreur rejet:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Vérifier l'accès
  if (!canValidate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-lg font-medium text-muted-foreground">Accès non autorisé</p>
        <p className="text-sm text-muted-foreground">
          Seuls les utilisateurs DG ou Admin peuvent accéder à cette page
        </p>
        <Button variant="outline" onClick={() => navigate('/notes-dg')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Notes DG
        </Button>
      </div>
    );
  }

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
      <PageHeader
        title="Validation Notes DG"
        description="Notes de la Direction Générale à valider"
        icon={FileCheck}
        backUrl="/notes-dg"
      >
        <Badge variant="outline" className="gap-2 px-3 py-1.5">
          <ClipboardList className="h-4 w-4" />
          {notesAValider.length} note(s) à valider
        </Badge>
      </PageHeader>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notesByStatus.soumise_dg.length}
                </p>
              </div>
              <FileSignature className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées aujourd'hui</p>
                <p className="text-2xl font-bold text-success">
                  {
                    notesByStatus.dg_valide.filter(
                      (n) =>
                        n.signed_at &&
                        new Date(n.signed_at).toDateString() === new Date().toDateString()
                    ).length
                  }
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
                <p className="text-sm text-muted-foreground">Rejetées ce mois</p>
                <p className="text-2xl font-bold text-destructive">
                  {
                    notesByStatus.dg_rejetee.filter(
                      (n) =>
                        n.rejected_at &&
                        new Date(n.rejected_at).getMonth() === new Date().getMonth()
                    ).length
                  }
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des notes à valider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes à valider
          </CardTitle>
          <CardDescription>{filteredNotes.length} note(s) en attente de décision</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">N°</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Recommandations</TableHead>
                    <TableHead>Exposé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm ? 'Aucune note correspondante' : 'Aucune note en attente'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? 'Modifiez vos critères de recherche'
                  : 'Toutes les notes ont été traitées'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">N°</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Recommandations</TableHead>
                    <TableHead>Exposé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNotes.map((note, index) => (
                    <TableRow key={note.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {note.direction?.sigle || note.direction?.label || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2" title={note.objet}>
                          {note.objet}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{note.reference || '-'}</TableCell>
                      <TableCell className="max-w-[150px]">
                        <span
                          className="line-clamp-2 text-sm text-muted-foreground"
                          title={note.recommandations || ''}
                        >
                          {note.recommandations || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <span
                          className="line-clamp-2 text-sm text-muted-foreground"
                          title={note.expose || ''}
                        >
                          {note.expose || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {note.date_note
                          ? format(new Date(note.date_note), 'dd/MM/yyyy', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(note)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleValidateClick(note)}
                            className="text-success hover:text-success hover:bg-success/10"
                            title="Valider"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectClick(note)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Rejeter"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Voir Détails */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              {selectedNote?.reference || 'Détails de la note'}
            </DialogTitle>
            <DialogDescription>
              Note soumise le{' '}
              {selectedNote?.created_at
                ? format(new Date(selectedNote.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })
                : '-'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            {selectedNote && (
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Direction</Label>
                    <p className="font-medium">
                      {selectedNote.direction?.sigle
                        ? `${selectedNote.direction.sigle} - ${selectedNote.direction.label}`
                        : selectedNote.direction?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Date</Label>
                    <p className="font-medium">
                      {selectedNote.date_note
                        ? format(new Date(selectedNote.date_note), 'dd MMMM yyyy', { locale: fr })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Destinataire</Label>
                  <p className="font-medium">{selectedNote.destinataire}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Objet</Label>
                  <p className="font-medium">{selectedNote.objet}</p>
                </div>

                {selectedNote.expose && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Exposé</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {selectedNote.expose}
                    </p>
                  </div>
                )}

                {selectedNote.avis && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Avis</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {selectedNote.avis}
                    </p>
                  </div>
                )}

                {selectedNote.recommandations && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Recommandations</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {selectedNote.recommandations}
                    </p>
                  </div>
                )}

                {selectedNote.nom_prenoms && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Signataire</Label>
                    <p className="font-medium">{selectedNote.nom_prenoms}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setViewDialogOpen(false);
                if (selectedNote) handleRejectClick(selectedNote);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                if (selectedNote) handleValidateClick(selectedNote);
              }}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Validation */}
      <AlertDialog open={confirmValidateOpen} onOpenChange={setConfirmValidateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Confirmer la validation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de valider la note <strong>{selectedNote?.reference}</strong>.
              <br />
              <br />
              Cette action est définitive. La note pourra ensuite être diffusée aux destinataires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmValidate}
              disabled={isProcessing}
              className="bg-success hover:bg-success/90"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeter la note
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de rejeter la note <strong>{selectedNote?.reference}</strong>.
              <br />
              Veuillez indiquer le motif du rejet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectMotif">Motif du rejet *</Label>
              <Textarea
                id="rejectMotif"
                value={rejectMotif}
                onChange={(e) => {
                  setRejectMotif(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                placeholder="Indiquez les raisons du rejet et les corrections attendues..."
                rows={4}
                className={rejectError ? 'border-destructive' : ''}
              />
              {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
            </div>

            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">
                La note sera renvoyée au créateur pour correction. Elle pourra être modifiée puis
                resoumise.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isProcessing || !rejectMotif.trim()}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
