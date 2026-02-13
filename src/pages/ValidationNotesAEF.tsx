/**
 * Espace de Validation Notes AEF
 *
 * Vue dédiée pour les validateurs (DG/DAAF) avec :
 * - KPIs spécifiques (Total, Urgentes, Hautes, Normales)
 * - Colonnes budget (Ligne budget, Disponible avec code couleur)
 * - Validation avec contrôle budgétaire (blocage si montant > disponible)
 * - 3 dialogs spécialisés (Valider, Différer, Rejeter)
 * - Tri par urgence + highlighting des lignes urgentes
 */

import { useState, useEffect, useMemo } from 'react';
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
import { useNotesAEF } from '@/hooks/useNotesAEF';
import type { BudgetAvailabilityCheck } from '@/hooks/useNotesAEF';
import { useNotesAEFList } from '@/hooks/useNotesAEFList';
import { usePermissions } from '@/hooks/usePermissions';
import { useExercice } from '@/contexts/ExerciceContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  Building2,
  Ban,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NoteAEFEntity } from '@/lib/notes-aef/types';

// Budget info for batch display in table
interface BudgetInfo {
  dotation: number;
  engaged: number;
  disponible: number;
}

export default function ValidationNotesAEF() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const canValidateDAAF = hasAnyRole(['ADMIN', 'DAAF']);
  const canValidateDG = hasAnyRole(['ADMIN', 'DG']);
  const canValidate = canValidateDAAF || canValidateDG;

  // Mutations hook
  const { validateNote, rejectNote, deferNote, resumeNote, checkBudgetAvailability } =
    useNotesAEF();

  // List hook
  const { notes, isLoading, error, searchQuery, setSearchQuery, refetch } = useNotesAEFList({
    pageSize: 100,
  });

  // ── Dialog states ──────────────────────────────────────────────────────
  const [selectedNote, setSelectedNote] = useState<NoteAEFEntity | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate dialog
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validateComment, setValidateComment] = useState('');
  const [budgetCheck, setBudgetCheck] = useState<BudgetAvailabilityCheck | null>(null);
  const [isBudgetChecking, setIsBudgetChecking] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');

  // Defer dialog
  const [deferDialogOpen, setDeferDialogOpen] = useState(false);
  const [deferMotif, setDeferMotif] = useState('');
  const [deferDate, setDeferDate] = useState('');
  const [deferCondition, setDeferCondition] = useState('');

  // ── Filtered & sorted notes ────────────────────────────────────────────
  const notesToValidate = useMemo(
    () => notes.filter((n) => n.statut === 'soumis' || n.statut === 'a_valider'),
    [notes]
  );
  const notesDeferees = useMemo(() => notes.filter((n) => n.statut === 'differe'), [notes]);
  const notesToImpute = useMemo(() => notes.filter((n) => n.statut === 'a_imputer'), [notes]);

  // Sort by urgency (urgente > haute > normale > basse) then by date (newest first)
  const sortedNotesToValidate = useMemo(() => {
    const urgenceOrder: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };
    return [...notesToValidate].sort((a, b) => {
      const urgA = urgenceOrder[a.priorite || 'normale'] ?? 2;
      const urgB = urgenceOrder[b.priorite || 'normale'] ?? 2;
      if (urgA !== urgB) return urgA - urgB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notesToValidate]);

  // KPI counts
  const urgentCount = useMemo(
    () => notesToValidate.filter((n) => n.priorite === 'urgente').length,
    [notesToValidate]
  );
  const hauteCount = useMemo(
    () => notesToValidate.filter((n) => n.priorite === 'haute').length,
    [notesToValidate]
  );

  // ── Batch budget availability ──────────────────────────────────────────
  const [budgetMap, setBudgetMap] = useState<Map<string, BudgetInfo>>(new Map());

  // Stable key for the effect dependency (sorted unique IDs)
  const budgetLineIdsKey = useMemo(() => {
    const ids = notesToValidate
      .map((n) => n.budget_line_id)
      .filter((id): id is string => Boolean(id));
    return [...new Set(ids)].sort().join(',');
  }, [notesToValidate]);

  useEffect(() => {
    if (!budgetLineIdsKey) {
      setBudgetMap(new Map());
      return;
    }

    const uniqueLineIds = budgetLineIdsKey.split(',');
    let cancelled = false;

    const fetchBatch = async () => {
      // 1. Fetch budget lines (dotation)
      const { data: lines } = await supabase
        .from('budget_lines')
        .select('id, dotation_initiale, dotation_modifiee')
        .in('id', uniqueLineIds);

      if (cancelled || !lines) return;

      // 2. Sum engaged amounts from notes_dg on these budget lines
      const { data: engagedNotes } = await supabase
        .from('notes_dg')
        .select('budget_line_id, montant_estime')
        .in('budget_line_id', uniqueLineIds)
        .in('statut', ['impute', 'a_imputer']);

      if (cancelled) return;

      const engagedByLine = new Map<string, number>();
      engagedNotes?.forEach((n) => {
        if (n.budget_line_id) {
          engagedByLine.set(
            n.budget_line_id,
            (engagedByLine.get(n.budget_line_id) || 0) + (n.montant_estime || 0)
          );
        }
      });

      // 3. Build disponible map
      const newMap = new Map<string, BudgetInfo>();
      lines.forEach((line) => {
        const dotation = Math.max(line.dotation_modifiee || 0, line.dotation_initiale || 0);
        const engaged = engagedByLine.get(line.id) || 0;
        newMap.set(line.id, { dotation, engaged, disponible: dotation - engaged });
      });

      setBudgetMap(newMap);
    };

    fetchBatch();

    return () => {
      cancelled = true;
    };
  }, [budgetLineIdsKey]);

  // ── Dialog handlers ────────────────────────────────────────────────────

  const handleOpenValidate = async (note: NoteAEFEntity) => {
    setSelectedNote(note);
    setValidateComment('');
    setBudgetCheck(null);
    setValidateDialogOpen(true);

    // Budget check when note has a budget line assigned
    if (note.budget_line_id && note.montant_estime) {
      setIsBudgetChecking(true);
      try {
        const result = await checkBudgetAvailability(note.budget_line_id, note.montant_estime);
        setBudgetCheck(result);
      } catch {
        setBudgetCheck({
          isAvailable: false,
          dotation: 0,
          engaged: 0,
          disponible: 0,
          message: 'Erreur lors de la vérification budgétaire',
        });
      } finally {
        setIsBudgetChecking(false);
      }
    }
  };

  const handleOpenReject = (note: NoteAEFEntity) => {
    setSelectedNote(note);
    setRejectMotif('');
    setRejectDialogOpen(true);
  };

  const handleOpenDefer = (note: NoteAEFEntity) => {
    setSelectedNote(note);
    setDeferMotif('');
    setDeferDate('');
    setDeferCondition('');
    setDeferDialogOpen(true);
  };

  const handleConfirmValidate = async () => {
    if (!selectedNote) return;
    if (budgetCheck && !budgetCheck.isAvailable) return;

    setIsProcessing(true);
    try {
      await validateNote(selectedNote.id);
      setValidateDialogOpen(false);
      setSelectedNote(null);
      refetch();
    } catch (err: unknown) {
      console.error('Erreur validation:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedNote || !rejectMotif.trim()) return;
    setIsProcessing(true);
    try {
      await rejectNote({ noteId: selectedNote.id, motif: rejectMotif });
      setRejectDialogOpen(false);
      setSelectedNote(null);
      refetch();
    } catch (err: unknown) {
      console.error('Erreur rejet:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDefer = async () => {
    if (!selectedNote || !deferMotif.trim() || !deferDate) return;
    setIsProcessing(true);
    try {
      await deferNote({
        noteId: selectedNote.id,
        motif: deferMotif,
        deadlineCorrection: deferDate || undefined,
      });
      setDeferDialogOpen(false);
      setSelectedNote(null);
      refetch();
    } catch (err: unknown) {
      console.error('Erreur report:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async (note: NoteAEFEntity) => {
    setIsProcessing(true);
    try {
      await resumeNote(note.id);
      refetch();
    } catch (err: unknown) {
      console.error('Erreur reprise:', err);
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

  // ── Helpers ────────────────────────────────────────────────────────────

  const formatMontant = (montant: number | null) => {
    if (!montant) return '—';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  const getUrgenceBadge = (urgence: string | null) => {
    const isHigh = urgence === 'haute' || urgence === 'urgente';
    const variants: Record<string, { label: string; className: string }> = {
      basse: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
      normale: { label: 'Normale', className: 'bg-secondary text-secondary-foreground' },
      haute: { label: 'Haute', className: 'bg-warning text-warning-foreground' },
      urgente: { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
    };
    const variant = variants[urgence || 'normale'] || variants.normale;
    return (
      <Badge className={cn(variant.className, 'gap-1')}>
        {isHigh && <AlertTriangle className="h-3 w-3" />}
        {variant.label}
      </Badge>
    );
  };

  const getBudgetDisponibleCell = (note: NoteAEFEntity) => {
    if (!note.budget_line_id || !note.montant_estime) {
      return <span className="text-muted-foreground">—</span>;
    }

    const budgetInfo = budgetMap.get(note.budget_line_id);
    if (!budgetInfo) {
      return <Skeleton className="h-4 w-20 inline-block" />;
    }

    const isInsuffisant = budgetInfo.disponible < note.montant_estime;
    const ratio = budgetInfo.disponible > 0 ? note.montant_estime / budgetInfo.disponible : 999;

    let colorClasses: string;
    if (isInsuffisant || ratio >= 0.9) {
      colorClasses = 'text-destructive bg-destructive/10';
    } else if (ratio >= 0.5) {
      colorClasses = 'text-warning bg-warning/10';
    } else {
      colorClasses = 'text-success bg-success/10';
    }

    return (
      <span
        className={cn('px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap', colorClasses)}
      >
        {formatMontant(budgetInfo.disponible)}
      </span>
    );
  };

  // ── Guards ─────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────

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

      {/* KPIs — based on notesToValidate only */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total à valider</p>
                <p className="text-3xl font-bold">{notesToValidate.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-3xl font-bold text-destructive">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={hauteCount > 0 ? 'border-warning' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Haute priorité</p>
                <p className="text-3xl font-bold text-warning">{hauteCount}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Normales</p>
                <p className="text-3xl font-bold text-muted-foreground">
                  {notesToValidate.length - urgentCount - hauteCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
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

        {/* ── Tab: À valider (enriched) ─────────────────────────────────── */}
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
              ) : sortedNotesToValidate.length === 0 ? (
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
                      <TableHead className="hidden md:table-cell max-w-[200px]">Objet</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="hidden lg:table-cell">Ligne budget</TableHead>
                      <TableHead className="hidden lg:table-cell">Disponible</TableHead>
                      <TableHead>Urgence</TableHead>
                      <TableHead className="hidden xl:table-cell">Soumise le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedNotesToValidate.map((note) => (
                      <TableRow
                        key={note.id}
                        className={cn(
                          'group',
                          note.priorite === 'urgente' && 'bg-destructive/5',
                          note.priorite === 'haute' && 'bg-warning/5'
                        )}
                      >
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleGoToDetail(note.id)}
                            className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {note.reference_pivot || note.numero || '—'}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TableCell>
                        <TableCell
                          className="hidden md:table-cell max-w-[200px] truncate"
                          title={note.objet}
                        >
                          {note.objet}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[80px]">
                              {note.direction?.sigle || note.direction?.label || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatMontant(note.montant_estime)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {note.budget_line?.code || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getBudgetDisponibleCell(note)}
                        </TableCell>
                        <TableCell>{getUrgenceBadge(note.priorite)}</TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground whitespace-nowrap">
                          {format(new Date(note.submitted_at || note.created_at), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenValidate(note)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDefer(note)}
                              className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReject(note)}
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

        {/* ── Tab: Différées ──────────────────────────────────────────── */}
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
                            ? format(new Date(note.date_differe), 'dd MMM yyyy', { locale: fr })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleResume(note)}
                              disabled={isProcessing}
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

        {/* ── Tab: À imputer ─────────────────────────────────────────── */}
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Valider avec contrôle budgétaire                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Valider la note AEF
            </DialogTitle>
            <DialogDescription>
              Note :{' '}
              <strong className="font-mono">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </strong>
              <br />
              Objet : {selectedNote?.objet}
              <br />
              Montant : {formatMontant(selectedNote?.montant_estime ?? null)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Budget check section */}
            {selectedNote?.budget_line_id ? (
              isBudgetChecking ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Vérification budgétaire en cours...</span>
                </div>
              ) : budgetCheck ? (
                <div
                  className={cn(
                    'p-3 rounded-lg border',
                    budgetCheck.isAvailable
                      ? 'border-success/30 bg-success/5'
                      : 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {budgetCheck.isAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-success">Budget suffisant</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Budget INSUFFISANT</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    <p>
                      Disponible :{' '}
                      <strong>
                        {new Intl.NumberFormat('fr-FR').format(budgetCheck.disponible)} FCFA
                      </strong>
                    </p>
                    {budgetCheck.isAvailable ? (
                      <p>
                        Après validation :{' '}
                        <strong>
                          {new Intl.NumberFormat('fr-FR').format(
                            budgetCheck.disponible - (selectedNote?.montant_estime || 0)
                          )}{' '}
                          FCFA
                        </strong>
                      </p>
                    ) : (
                      <p className="text-destructive font-medium">
                        Dépassement :{' '}
                        {new Intl.NumberFormat('fr-FR').format(
                          (selectedNote?.montant_estime || 0) - budgetCheck.disponible
                        )}{' '}
                        FCFA
                      </p>
                    )}
                  </div>
                  {!budgetCheck.isAvailable && (
                    <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Validation impossible tant que le budget est insuffisant
                    </p>
                  )}
                </div>
              ) : null
            ) : (
              <Alert className="border-muted">
                <AlertDescription className="text-xs text-muted-foreground">
                  Aucune ligne budgétaire assignée — validation sans contrôle budget.
                </AlertDescription>
              </Alert>
            )}

            {/* Optional comment */}
            <div>
              <Label htmlFor="validate-comment">Commentaire (optionnel)</Label>
              <Textarea
                id="validate-comment"
                value={validateComment}
                onChange={(e) => setValidateComment(e.target.value)}
                placeholder="Commentaire de validation..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmValidate}
              disabled={
                isProcessing || isBudgetChecking || (!!budgetCheck && !budgetCheck.isAvailable)
              }
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Rejeter (motif obligatoire)                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeter la note AEF
            </DialogTitle>
            <DialogDescription>
              Note :{' '}
              <span className="font-mono font-medium">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </span>
              {' — '}
              {selectedNote?.objet}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="reject-motif" className="text-destructive">
                Motif du rejet *
              </Label>
              <Textarea
                id="reject-motif"
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={4}
                className={cn('mt-1', !rejectMotif.trim() && 'border-destructive/50')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectMotif.trim() || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Différer (motif + date obligatoires)                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={deferDialogOpen} onOpenChange={setDeferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Différer la note AEF
            </DialogTitle>
            <DialogDescription>
              Note :{' '}
              <span className="font-mono font-medium">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </span>
              {' — '}
              {selectedNote?.objet}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="defer-motif" className="text-orange-700">
                Motif du report *
              </Label>
              <Textarea
                id="defer-motif"
                value={deferMotif}
                onChange={(e) => setDeferMotif(e.target.value)}
                placeholder="Expliquez la raison du report..."
                rows={3}
                className={cn('mt-1', !deferMotif.trim() && 'border-orange-300')}
              />
            </div>
            <div>
              <Label htmlFor="defer-date" className="text-orange-700">
                Date de reprise estimée *
              </Label>
              <Input
                id="defer-date"
                type="date"
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={cn('mt-1', !deferDate && 'border-orange-300')}
              />
            </div>
            <div>
              <Label htmlFor="defer-condition">Condition de reprise (optionnel)</Label>
              <Textarea
                id="defer-condition"
                value={deferCondition}
                onChange={(e) => setDeferCondition(e.target.value)}
                placeholder="Quelle condition doit être remplie pour reprendre le traitement ?"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeferDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDefer}
              disabled={!deferMotif.trim() || !deferDate || isProcessing}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
