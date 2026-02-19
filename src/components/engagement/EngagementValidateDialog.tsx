import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  Calculator,
  ClipboardList,
  Lock,
  Ban,
} from 'lucide-react';
import {
  Engagement,
  VALIDATION_STEPS,
  getStepFromStatut,
  checkEngagementCompleteness,
  BudgetAvailability,
} from '@/hooks/useEngagements';
import { useEngagementDocuments } from '@/hooks/useEngagementDocuments';
import { IndicateurBudget } from '@/components/engagement/IndicateurBudget';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EngagementValidateDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, comments?: string) => void;
  onAutoReject?: (id: string, reason: string) => void;
  isLoading?: boolean;
}

// Timeline compacte montrant la progression des 4 étapes
function ValidationTimeline({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {VALIDATION_STEPS.map((step) => {
        const isDone = step.order < currentStep;
        const isCurrent = step.order === currentStep;
        return (
          <div key={step.order} className="flex items-center gap-1">
            {step.order > 1 && (
              <div className={`h-px w-4 ${isDone ? 'bg-green-500' : 'bg-muted'}`} />
            )}
            <Badge
              variant="outline"
              className={
                isDone
                  ? 'bg-green-100 text-green-700 border-green-300 text-xs'
                  : isCurrent
                    ? 'bg-blue-100 text-blue-700 border-blue-300 text-xs'
                    : 'bg-muted text-muted-foreground text-xs'
              }
            >
              {isDone ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : isCurrent ? (
                <Circle className="mr-1 h-3 w-3 fill-blue-500" />
              ) : (
                <Circle className="mr-1 h-3 w-3" />
              )}
              {step.role}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// Panneau SAF — Complétude des données + résumé docs
function SAFPanel({ engagement }: { engagement: Engagement }) {
  const completeness = checkEngagementCompleteness(engagement);
  const { checklistStatus, isLoading: docsLoading } = useEngagementDocuments(engagement.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileCheck className="h-4 w-4 text-blue-500" />
        Contrôle de complétude
      </div>

      {/* Complétude données */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Données obligatoires</div>
        {completeness.isComplete ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Toutes les données obligatoires sont renseignées
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Champs manquants :
            </div>
            <ul className="list-disc list-inside text-sm text-destructive/80 pl-2">
              {completeness.missingFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Résumé documents */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Pièces justificatives</div>
        {docsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Chargement...
          </div>
        ) : (
          <div className="text-sm">
            <span className="font-medium">
              {checklistStatus.providedAll}/{checklistStatus.totalAll}
            </span>{' '}
            documents fournis
            {checklistStatus.total > 0 && (
              <span className="text-muted-foreground">
                {' '}
                ({checklistStatus.provided}/{checklistStatus.total} obligatoires)
              </span>
            )}
            {checklistStatus.missingLabels.length > 0 && (
              <div className="mt-1 text-xs text-orange-600">
                Manquants : {checklistStatus.missingLabels.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Panneau CB — Contrôle crédits budgétaires
function CBPanel({
  engagement,
  availability,
  isLoadingBudget,
  onAutoReject,
}: {
  engagement: Engagement;
  availability: BudgetAvailability | null;
  isLoadingBudget: boolean;
  onAutoReject?: (id: string, reason: string) => void;
}) {
  const isInsufficient = availability && !availability.is_sufficient;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calculator className="h-4 w-4 text-blue-500" />
        Contrôle de disponibilité budgétaire
      </div>

      <IndicateurBudget
        compact
        availability={availability}
        isLoading={isLoadingBudget}
        budgetLine={
          engagement.budget_line
            ? { code: engagement.budget_line.code, label: engagement.budget_line.label }
            : null
        }
      />

      {isInsufficient && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Visa impossible</AlertTitle>
            <AlertDescription>
              Les crédits sont insuffisants pour cet engagement. Vous pouvez rejeter
              automatiquement.
            </AlertDescription>
          </Alert>
          {onAutoReject && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() =>
                onAutoReject(
                  engagement.id,
                  `Crédits insuffisants : ${formatCurrency(Math.abs(availability.disponible))} manquants`
                )
              }
            >
              <Ban className="mr-2 h-4 w-4" />
              Rejeter (crédits insuffisants)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Panneau DAAF — Résumé des visas précédents
function DAAFPanel({ engagement }: { engagement: Engagement }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ClipboardList className="h-4 w-4 text-blue-500" />
        Récapitulatif des visas précédents
      </div>

      <div className="rounded-lg border divide-y">
        {/* Visa SAF */}
        <div className="p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Visa SAF</span>
            {engagement.visa_saf_commentaire && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {engagement.visa_saf_commentaire}
              </p>
            )}
          </div>
          <div className="text-right">
            {engagement.visa_saf_date ? (
              <div className="text-xs text-green-600">
                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                {format(new Date(engagement.visa_saf_date), 'dd/MM/yyyy HH:mm', {
                  locale: fr,
                })}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">En attente</span>
            )}
          </div>
        </div>
        {/* Visa CB */}
        <div className="p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Visa CB</span>
            {engagement.visa_cb_commentaire && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {engagement.visa_cb_commentaire}
              </p>
            )}
          </div>
          <div className="text-right">
            {engagement.visa_cb_date ? (
              <div className="text-xs text-green-600">
                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                {format(new Date(engagement.visa_cb_date), 'dd/MM/yyyy HH:mm', {
                  locale: fr,
                })}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">En attente</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Panneau DG — Récapitulatif complet + avertissement verrouillage
function DGPanel({ engagement }: { engagement: Engagement }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 text-blue-500" />
        Validation finale
      </div>

      {/* Résumé des 3 visas */}
      <div className="rounded-lg border divide-y">
        {[
          {
            label: 'Visa SAF',
            date: engagement.visa_saf_date,
            comment: engagement.visa_saf_commentaire,
          },
          {
            label: 'Visa CB',
            date: engagement.visa_cb_date,
            comment: engagement.visa_cb_commentaire,
          },
          {
            label: 'Visa DAAF',
            date: engagement.visa_daaf_date,
            comment: engagement.visa_daaf_commentaire,
          },
        ].map((visa) => (
          <div key={visa.label} className="p-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{visa.label}</span>
              {visa.comment && (
                <p className="text-xs text-muted-foreground mt-0.5">{visa.comment}</p>
              )}
            </div>
            <div className="text-right">
              {visa.date ? (
                <div className="text-xs text-green-600">
                  <CheckCircle2 className="inline h-3 w-3 mr-1" />
                  {format(new Date(visa.date), 'dd/MM/yyyy HH:mm', {
                    locale: fr,
                  })}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">En attente</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Récap engagement */}
      <div className="rounded-lg border p-3 space-y-1">
        <div className="text-xs text-muted-foreground">Engagement</div>
        <div className="text-sm font-medium">{engagement.objet}</div>
        <div className="text-sm">
          Montant : <strong>{formatCurrency(engagement.montant)}</strong>
        </div>
        <div className="text-sm text-muted-foreground">
          Fournisseur : {engagement.fournisseur || 'N/A'}
        </div>
      </div>

      {/* Avertissement verrouillage */}
      <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-700">Validation définitive</AlertTitle>
        <AlertDescription className="text-orange-600">
          Cette action est irréversible. L'engagement sera verrouillé et ne pourra plus être
          modifié. Les crédits seront définitivement consommés.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function EngagementValidateDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
  onAutoReject,
  isLoading,
}: EngagementValidateDialogProps) {
  const [comments, setComments] = useState('');
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);

  const stepNumber = getStepFromStatut(engagement?.statut ?? null);
  const stepInfo = VALIDATION_STEPS[stepNumber - 1];
  const isLastStep = stepNumber >= VALIDATION_STEPS.length;

  // Calcul disponibilité budgétaire pour le panneau CB
  useEffect(() => {
    if (!engagement || stepNumber !== 2 || !open) {
      setAvailability(null);
      return;
    }

    const fetchAvailability = async () => {
      setIsLoadingBudget(true);
      try {
        // Get budget line dotation
        const { data: line } = await supabase
          .from('budget_lines')
          .select('dotation_initiale')
          .eq('id', engagement.budget_line_id)
          .single();

        const dotation_initiale = line?.dotation_initiale || 0;

        const { data: recus } = await supabase
          .from('credit_transfers')
          .select('amount')
          .eq('to_budget_line_id', engagement.budget_line_id)
          .eq('status', 'execute');

        const virements_recus = recus?.reduce((sum, ct) => sum + (ct.amount || 0), 0) || 0;

        const { data: emis } = await supabase
          .from('credit_transfers')
          .select('amount')
          .eq('from_budget_line_id', engagement.budget_line_id)
          .eq('status', 'execute');

        const virements_emis = emis?.reduce((sum, ct) => sum + (ct.amount || 0), 0) || 0;

        const dotation_actuelle = dotation_initiale + virements_recus - virements_emis;

        const { data: prevEngagements } = await supabase
          .from('budget_engagements')
          .select('id, montant')
          .eq('budget_line_id', engagement.budget_line_id)
          .eq('exercice', engagement.exercice || new Date().getFullYear())
          .neq('statut', 'annule')
          .neq('statut', 'rejete')
          .neq('id', engagement.id);

        const engagements_anterieurs =
          prevEngagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        const cumul = engagements_anterieurs + engagement.montant;
        const disponible = dotation_actuelle - cumul;

        setAvailability({
          dotation_initiale,
          virements_recus,
          virements_emis,
          dotation_actuelle,
          engagements_anterieurs,
          engagement_actuel: engagement.montant,
          cumul,
          disponible,
          is_sufficient: disponible >= 0,
        });
      } catch {
        setAvailability(null);
      } finally {
        setIsLoadingBudget(false);
      }
    };

    fetchAvailability();
  }, [engagement, stepNumber, open]);

  const completeness = engagement
    ? checkEngagementCompleteness(engagement)
    : { isComplete: true, missingFields: [] };

  // Bloquer le visa SAF si données incomplètes
  const isSAFBlocked = stepNumber === 1 && !completeness.isComplete;
  // Bloquer le visa CB si crédits insuffisants
  const isCBBlocked = stepNumber === 2 && availability !== null && !availability.is_sufficient;

  const canVisa = !isSAFBlocked && !isCBBlocked;

  const handleConfirm = () => {
    if (engagement) {
      onConfirm(engagement.id, comments || undefined);
      setComments('');
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setComments('');
      setAvailability(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            Visa Etape {stepNumber}/{VALIDATION_STEPS.length} — {stepInfo?.role}
          </DialogTitle>
          <DialogDescription>
            Engagement <strong>{engagement?.numero}</strong> — {stepInfo?.label}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-6 py-2">
            {/* Timeline compacte */}
            <ValidationTimeline currentStep={stepNumber} />

            {/* Panneau selon l'étape */}
            {stepNumber === 1 && engagement && <SAFPanel engagement={engagement} />}
            {stepNumber === 2 && engagement && (
              <CBPanel
                engagement={engagement}
                availability={availability}
                isLoadingBudget={isLoadingBudget}
                onAutoReject={onAutoReject}
              />
            )}
            {stepNumber === 3 && engagement && <DAAFPanel engagement={engagement} />}
            {stepNumber === 4 && engagement && <DGPanel engagement={engagement} />}

            {/* Textarea commentaire (commun à toutes les étapes) */}
            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires (optionnel)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ajoutez un commentaire si nécessaire..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !canVisa}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : isLastStep ? (
              'Valider definitivement'
            ) : (
              `Viser (${stepInfo?.role})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
