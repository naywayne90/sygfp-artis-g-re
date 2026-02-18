import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Soumissionnaire,
  StatutSoumissionnaire,
  STATUTS_SOUMISSIONNAIRE,
  LotMarche,
  PassationMarche,
} from '@/hooks/usePassationsMarche';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  FileText,
  Building2,
  Trophy,
  Ban,
  ClipboardCheck,
  Calculator,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';

const SEUIL_TECHNIQUE = 70;
const POIDS_TECHNIQUE = 0.7;
const POIDS_FINANCIER = 0.3;

type EvalStep = 1 | 2 | 3;

const STEPS: { step: EvalStep; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Conformite', icon: ClipboardCheck },
  { step: 2, label: 'Evaluation', icon: Calculator },
  { step: 3, label: 'Classement', icon: ListOrdered },
];

interface SoumEval {
  soumissionnaire: Soumissionnaire;
  noteFinale: number | null;
  isQualifie: boolean;
  rang: number | null;
}

function computeEvaluations(soumissionnaires: Soumissionnaire[]): SoumEval[] {
  const evals: SoumEval[] = soumissionnaires.map((s) => {
    const hasTech = s.note_technique !== null && s.note_technique !== undefined;
    const hasFin = s.note_financiere !== null && s.note_financiere !== undefined;
    // Use DB value if available, otherwise compute client-side
    const isQualifie =
      s.qualifie_technique || (hasTech && (s.note_technique ?? 0) >= SEUIL_TECHNIQUE);
    const noteFinale =
      s.note_finale ??
      (isQualifie && hasTech && hasFin
        ? (s.note_technique ?? 0) * POIDS_TECHNIQUE + (s.note_financiere ?? 0) * POIDS_FINANCIER
        : null);
    const rang = s.rang_classement ?? null;
    return { soumissionnaire: s, noteFinale, isQualifie, rang };
  });

  // Sort: ranked first (by rang or noteFinale), then unranked
  const ranked = evals
    .filter((e) => e.noteFinale !== null && e.isQualifie)
    .sort((a, b) => {
      if (a.rang !== null && b.rang !== null) return a.rang - b.rang;
      return (b.noteFinale ?? 0) - (a.noteFinale ?? 0);
    });

  const unranked = evals.filter((e) => e.noteFinale === null || !e.isQualifie);

  // Assign client-side rank if DB rank not set
  ranked.forEach((e, idx) => {
    if (e.rang === null) e.rang = idx + 1;
  });

  return [...ranked, ...unranked];
}

interface EvaluationCOJOProps {
  passation: PassationMarche;
  onUpdateSoumissionnaire: (data: {
    id: string;
    note_technique?: number | null;
    note_financiere?: number | null;
    statut?: StatutSoumissionnaire;
    motif_elimination?: string | null;
  }) => Promise<unknown>;
  readOnly?: boolean;
}

export function EvaluationCOJO({
  passation,
  onUpdateSoumissionnaire,
  readOnly = false,
}: EvaluationCOJOProps) {
  const lots = useMemo(() => (passation.lots || []) as LotMarche[], [passation.lots]);
  const allSoumissionnaires = useMemo(
    () => (passation.soumissionnaires || []) as Soumissionnaire[],
    [passation.soumissionnaires]
  );
  const isAlloti = passation.allotissement && lots.length > 0;

  const [currentStep, setCurrentStep] = useState<EvalStep>(1);
  const [selectedEvalLotId, setSelectedEvalLotId] = useState<string | null>(
    isAlloti ? lots[0]?.id || null : null
  );

  // Elimination dialog
  const [eliminateDialogOpen, setEliminateDialogOpen] = useState(false);
  const [eliminateTarget, setEliminateTarget] = useState<string | null>(null);
  const [eliminateMotif, setEliminateMotif] = useState('');

  // PV dialog
  const [pvDialogOpen, setPvDialogOpen] = useState(false);

  // Filter soumissionnaires by lot
  const currentSoumissionnaires = useMemo(() => {
    if (isAlloti && selectedEvalLotId) {
      return allSoumissionnaires.filter((s) => s.lot_marche_id === selectedEvalLotId);
    }
    return allSoumissionnaires.filter((s) => !s.lot_marche_id);
  }, [isAlloti, selectedEvalLotId, allSoumissionnaires]);

  const evaluations = useMemo(
    () => computeEvaluations(currentSoumissionnaires),
    [currentSoumissionnaires]
  );

  // Step 1 soumissionnaires: statut "recu"
  const step1Soums = currentSoumissionnaires.filter((s) => s.statut === 'recu');
  // Step 2 soumissionnaires: statut "conforme" (or "qualifie" that still needs evaluation)
  const step2Soums = currentSoumissionnaires.filter(
    (s) => s.statut === 'conforme' || (s.statut === 'qualifie' && s.note_technique === null)
  );
  // Step 3: all evaluated + qualified
  const step3Evals = evaluations.filter(
    (e) => e.isQualifie && e.noteFinale !== null && e.soumissionnaire.statut !== 'elimine'
  );

  // Progress
  const totalCount = currentSoumissionnaires.length;
  const conformeOrBeyond = currentSoumissionnaires.filter((s) => s.statut !== 'recu').length;
  const evaluatedCount = currentSoumissionnaires.filter((s) => s.note_technique !== null).length;
  const hasRetenu = currentSoumissionnaires.some((s) => s.statut === 'retenu');

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  // Handlers
  const handleConformer = async (soumId: string) => {
    await onUpdateSoumissionnaire({ id: soumId, statut: 'conforme' });
  };

  const handleNoteChange = async (
    soumId: string,
    field: 'note_technique' | 'note_financiere',
    value: string
  ) => {
    const numVal = value === '' ? null : Math.min(100, Math.max(0, parseFloat(value)));
    if (numVal !== null && isNaN(numVal)) return;
    await onUpdateSoumissionnaire({ id: soumId, [field]: numVal });
  };

  const handleAttribuer = async (soumId: string) => {
    await onUpdateSoumissionnaire({ id: soumId, statut: 'retenu' });
  };

  const handleEliminer = async () => {
    if (!eliminateTarget || !eliminateMotif.trim()) return;
    await onUpdateSoumissionnaire({
      id: eliminateTarget,
      statut: 'elimine',
      motif_elimination: eliminateMotif,
    });
    setEliminateDialogOpen(false);
    setEliminateTarget(null);
    setEliminateMotif('');
  };

  const openEliminateDialog = (soumId: string) => {
    setEliminateTarget(soumId);
    setEliminateMotif('');
    setEliminateDialogOpen(true);
  };

  // PV content
  const pvContent = useMemo(() => {
    const lotLabel =
      isAlloti && selectedEvalLotId
        ? `Lot ${lots.find((l) => l.id === selectedEvalLotId)?.numero || '?'} - ${lots.find((l) => l.id === selectedEvalLotId)?.designation || ''}`
        : 'Marche global (non alloti)';

    const lines = [
      `PV D'EVALUATION DES OFFRES`,
      `=========================`,
      ``,
      `Reference passation: ${passation.reference || 'N/A'}`,
      `Objet: ${passation.expression_besoin?.objet || 'N/A'}`,
      `Perimetre: ${lotLabel}`,
      `Mode de passation: ${passation.mode_passation.replace(/_/g, ' ')}`,
      `Date: ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `CLASSEMENT DES SOUMISSIONNAIRES`,
      `-------------------------------`,
      ``,
    ];

    for (const ev of evaluations) {
      const s = ev.soumissionnaire;
      const statutLabel = STATUTS_SOUMISSIONNAIRE[s.statut]?.label || s.statut;
      if (ev.rang !== null) {
        lines.push(
          `${ev.rang}. ${s.raison_sociale} - Note tech: ${s.note_technique ?? '-'}/100 - Note fin: ${s.note_financiere ?? '-'}/100 - Note finale: ${ev.noteFinale?.toFixed(2) ?? 'N/A'} - Statut: ${statutLabel}`
        );
      } else {
        lines.push(
          `   ${s.raison_sociale} - Note tech: ${s.note_technique ?? '-'}/100 - NON QUALIFIE (< ${SEUIL_TECHNIQUE}) - Statut: ${statutLabel}`
        );
      }
      if (s.motif_elimination) {
        lines.push(`      Motif: ${s.motif_elimination}`);
      }
    }

    lines.push(
      '',
      `Total soumissionnaires: ${totalCount}`,
      `Evalues: ${evaluatedCount}/${totalCount}`
    );

    const retenu = evaluations.find((e) => e.soumissionnaire.statut === 'retenu');
    if (retenu) {
      lines.push(``, `ATTRIBUTAIRE PROPOSE: ${retenu.soumissionnaire.raison_sociale}`);
      lines.push(`Offre financiere: ${formatMontant(retenu.soumissionnaire.offre_financiere)}`);
      lines.push(`Note finale: ${retenu.noteFinale?.toFixed(2) ?? 'N/A'}`);
    }

    return lines.join('\n');
  }, [evaluations, passation, isAlloti, selectedEvalLotId, lots, totalCount, evaluatedCount]);

  if (allSoumissionnaires.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun soumissionnaire a evaluer</p>
        <p className="text-xs mt-1">Ajoutez des soumissionnaires dans l'onglet Soumissionnaires</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lot selector if alloti */}
      {isAlloti && (
        <div className="flex gap-2 flex-wrap">
          {lots.map((lot) => {
            const lotSoums = allSoumissionnaires.filter((s) => s.lot_marche_id === lot.id);
            return (
              <Button
                key={lot.id}
                variant={selectedEvalLotId === lot.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEvalLotId(lot.id)}
                className="gap-1"
              >
                Lot {lot.numero}
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                  {lotSoums.length}
                </Badge>
              </Button>
            );
          })}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isDone =
            (s.step === 1 && step1Soums.length === 0 && conformeOrBeyond > 0) ||
            (s.step === 2 && evaluatedCount > 0 && step2Soums.length === 0) ||
            (s.step === 3 && hasRetenu);
          return (
            <div key={s.step} className="flex items-center">
              <button
                onClick={() => setCurrentStep(s.step)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {isDone && !isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.step}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Conformite administrative */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Etape 1 : Conformite administrative
            </CardTitle>
            <CardDescription>
              Verifier la conformite administrative de chaque soumissionnaire (dossier complet,
              pieces requises, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step1Soums.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Tous les soumissionnaires ont ete verifies.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setCurrentStep(2)}
                >
                  Passer a l'evaluation <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead className="text-right">Offre financiere</TableHead>
                    <TableHead className="w-20 text-center">Date depot</TableHead>
                    <TableHead className="w-44 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {step1Soums.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{s.raison_sociale}</p>
                            {s.rccm && (
                              <p className="text-xs text-muted-foreground">RCCM: {s.rccm}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMontant(s.offre_financiere)}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.date_depot ? new Date(s.date_depot).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {readOnly ? (
                          <Badge className={STATUTS_SOUMISSIONNAIRE[s.statut].color}>
                            {STATUTS_SOUMISSIONNAIRE[s.statut].label}
                          </Badge>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => handleConformer(s.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Conforme
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openEliminateDialog(s.id)}
                            >
                              <Ban className="h-3 w-3" />
                              Eliminer
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Summary of already processed */}
            {conformeOrBeyond > 0 && step1Soums.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                {conformeOrBeyond} soumissionnaire(s) deja traite(s) sur {totalCount}
              </div>
            )}

            {/* Eliminated in this step */}
            {currentSoumissionnaires.filter((s) => s.statut === 'elimine' && s.motif_elimination)
              .length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-red-600">Elimines :</p>
                {currentSoumissionnaires
                  .filter((s) => s.statut === 'elimine')
                  .map((s) => (
                    <div key={s.id} className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="h-3 w-3 flex-shrink-0" />
                      {s.raison_sociale} — {s.motif_elimination || 'Elimine'}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Evaluation technique + financiere */}
      {currentStep === 2 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Etape 2 : Evaluation technique et financiere
                </CardTitle>
                <CardDescription>
                  Note finale = (Tech x {POIDS_TECHNIQUE * 100}%) + (Fin x {POIDS_FINANCIER * 100}%)
                  — Seuil technique : {SEUIL_TECHNIQUE}/100
                </CardDescription>
              </div>
              {/* Progress indicator */}
              <div className="text-right">
                <span className="text-sm font-medium">
                  {evaluatedCount}/
                  {
                    currentSoumissionnaires.filter(
                      (s) => s.statut !== 'elimine' && s.statut !== 'recu'
                    ).length
                  }
                </span>
                <p className="text-xs text-muted-foreground">evalues</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const evaluableSoums = currentSoumissionnaires.filter(
                (s) => s.statut === 'conforme' || s.statut === 'qualifie' || s.statut === 'retenu'
              );

              if (evaluableSoums.length === 0) {
                return (
                  <div className="text-center py-6">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                    <p className="text-sm text-muted-foreground">
                      Aucun soumissionnaire conforme a evaluer.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verifiez la conformite administrative (etape 1) d'abord.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setCurrentStep(1)}
                    >
                      Retour a l'etape 1
                    </Button>
                  </div>
                );
              }

              return (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entreprise</TableHead>
                        <TableHead className="w-28 text-center">Note Tech. (/100)</TableHead>
                        <TableHead className="w-28 text-center">Note Fin. (/100)</TableHead>
                        <TableHead className="w-24 text-center">Note Finale</TableHead>
                        <TableHead className="w-28 text-center">Qualifie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluableSoums.map((s) => {
                        const ev = evaluations.find((e) => e.soumissionnaire.id === s.id);
                        const isBelowThreshold =
                          s.note_technique !== null && (s.note_technique ?? 0) < SEUIL_TECHNIQUE;
                        const isRetenu = s.statut === 'retenu';

                        return (
                          <TableRow
                            key={s.id}
                            className={cn(
                              isBelowThreshold && 'bg-red-50/50',
                              isRetenu && 'bg-green-50'
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">{s.raison_sociale}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Offre: {formatMontant(s.offre_financiere)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Note technique */}
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={s.note_technique ?? ''}
                                  onChange={(e) =>
                                    handleNoteChange(s.id, 'note_technique', e.target.value)
                                  }
                                  className={cn(
                                    'w-20 mx-auto text-center h-8',
                                    isBelowThreshold && 'border-red-300 bg-red-50'
                                  )}
                                  disabled={readOnly || isRetenu}
                                />
                                {isBelowThreshold && (
                                  <p className="text-xs text-red-600 font-medium">
                                    &lt; {SEUIL_TECHNIQUE}
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            {/* Note financiere */}
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={isBelowThreshold ? '' : (s.note_financiere ?? '')}
                                onChange={(e) =>
                                  handleNoteChange(s.id, 'note_financiere', e.target.value)
                                }
                                className="w-20 mx-auto text-center h-8"
                                disabled={readOnly || isBelowThreshold || isRetenu}
                              />
                            </TableCell>

                            {/* Note finale */}
                            <TableCell className="text-center">
                              {ev?.noteFinale !== null && ev?.noteFinale !== undefined ? (
                                <span className="font-bold text-lg">
                                  {ev.noteFinale.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>

                            {/* Qualifie badge */}
                            <TableCell className="text-center">
                              {s.note_technique === null ? (
                                <Badge variant="outline" className="text-xs">
                                  En attente
                                </Badge>
                              ) : isBelowThreshold ? (
                                <Badge variant="destructive" className="text-xs">
                                  Non qualifie
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                                  Qualifie
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <Progress
                      value={
                        evaluableSoums.length > 0
                          ? (evaluableSoums.filter((s) => s.note_technique !== null).length /
                              evaluableSoums.length) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Auto-eliminated warning */}
                  {currentSoumissionnaires.filter(
                    (s) =>
                      s.statut === 'elimine' && s.motif_elimination?.includes('Score technique')
                  ).length > 0 && (
                    <Alert className="mt-3 bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-xs">
                        Des soumissionnaires ont ete auto-elimines car leur note technique est
                        inferieure a {SEUIL_TECHNIQUE}/100.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Next step */}
                  {evaluableSoums.filter(
                    (s) =>
                      s.note_technique !== null &&
                      (s.note_technique ?? 0) >= SEUIL_TECHNIQUE &&
                      s.note_financiere !== null
                  ).length > 0 && (
                    <div className="mt-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                        Voir le classement <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Classement + Attribution */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Etape 3 : Classement et attribution
                  </CardTitle>
                  <CardDescription>
                    Soumissionnaires qualifies classes par note finale decroissante
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPvDialogOpen(true)}
                  className="gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Generer PV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {step3Evals.length === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                  <p className="text-sm text-muted-foreground">
                    Aucun soumissionnaire qualifie pour le classement.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setCurrentStep(2)}
                  >
                    Retour a l'evaluation
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rang</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead className="w-24 text-center">Note Tech.</TableHead>
                      <TableHead className="w-24 text-center">Note Fin.</TableHead>
                      <TableHead className="w-24 text-center">Note Finale</TableHead>
                      <TableHead className="w-28 text-center">Statut</TableHead>
                      {!readOnly && <TableHead className="w-36 text-center">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {step3Evals.map((ev) => {
                      const s = ev.soumissionnaire;
                      const isRetenu = s.statut === 'retenu';
                      const statutConfig = STATUTS_SOUMISSIONNAIRE[s.statut];

                      return (
                        <TableRow
                          key={s.id}
                          className={cn(
                            isRetenu && 'bg-green-50',
                            ev.rang === 1 && !isRetenu && 'bg-yellow-50/50'
                          )}
                        >
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              {ev.rang === 1 ? (
                                <Trophy className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <span className="font-bold text-lg">{ev.rang}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {ev.rang === 1 ? '1er' : ev.rang === 2 ? '2eme' : `${ev.rang}eme`}
                            </p>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">{s.raison_sociale}</p>
                                <p className="text-xs text-muted-foreground">
                                  Offre: {formatMontant(s.offre_financiere)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center font-mono">
                            {s.note_technique?.toFixed(1) ?? '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {s.note_financiere?.toFixed(1) ?? '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                'font-bold text-lg',
                                ev.rang === 1 && 'text-yellow-600',
                                ev.rang === 2 && 'text-gray-500',
                                ev.rang === 3 && 'text-orange-600'
                              )}
                            >
                              {ev.noteFinale?.toFixed(2)}
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge className={statutConfig.color}>{statutConfig.label}</Badge>
                          </TableCell>

                          {!readOnly && (
                            <TableCell className="text-center">
                              {isRetenu ? (
                                <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                                  <Award className="h-3 w-3" />
                                  Attributaire
                                </span>
                              ) : ev.rang === 1 && !hasRetenu ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAttribuer(s.id)}
                                >
                                  <Award className="h-3 w-3" />
                                  Attribuer
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recap card if retenu */}
          {(() => {
            const retenu = evaluations.find((e) => e.soumissionnaire.statut === 'retenu');
            if (!retenu) return null;
            return (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <Award className="h-5 w-5" />
                    Prestataire retenu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entreprise :</span>{' '}
                      <span className="font-bold">{retenu.soumissionnaire.raison_sociale}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Offre financiere :</span>{' '}
                      <span className="font-bold">
                        {formatMontant(retenu.soumissionnaire.offre_financiere)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Note technique :</span>{' '}
                      <span className="font-bold">
                        {retenu.soumissionnaire.note_technique?.toFixed(1)}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Note financiere :</span>{' '}
                      <span className="font-bold">
                        {retenu.soumissionnaire.note_financiere?.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Note finale :</span>{' '}
                      <span className="font-bold text-lg text-green-700">
                        {retenu.noteFinale?.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({retenu.soumissionnaire.note_technique?.toFixed(1)} x 70% +{' '}
                        {retenu.soumissionnaire.note_financiere?.toFixed(1)} x 30%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
          Note tech. &lt; {SEUIL_TECHNIQUE} = Non qualifie
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-yellow-500" />
          1er du classement
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          Attributaire retenu
        </div>
      </div>

      {/* Elimination Dialog */}
      <Dialog open={eliminateDialogOpen} onOpenChange={setEliminateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Eliminer le soumissionnaire
            </DialogTitle>
            <DialogDescription>Le motif d'elimination est obligatoire</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="motif_elimination">Motif *</Label>
              <Textarea
                id="motif_elimination"
                value={eliminateMotif}
                onChange={(e) => setEliminateMotif(e.target.value)}
                placeholder="Indiquez le motif d'elimination..."
                rows={3}
              />
            </div>
            {!eliminateMotif.trim() && (
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Le motif est obligatoire pour eliminer un soumissionnaire.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminer}
              disabled={!eliminateMotif.trim()}
            >
              Confirmer l'elimination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PV Dialog */}
      <Dialog open={pvDialogOpen} onOpenChange={setPvDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PV d'evaluation des offres
            </DialogTitle>
            <DialogDescription>Document recapitulatif de l'evaluation</DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg overflow-y-auto max-h-[50vh]">
            <pre className="text-sm whitespace-pre-wrap font-mono">{pvContent}</pre>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(pvContent);
              }}
            >
              Copier le texte
            </Button>
            <Button onClick={() => setPvDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
