import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PassationMarche,
  Soumissionnaire,
  WORKFLOW_STEPS,
  usePassationsMarche,
} from '@/hooks/usePassationsMarche';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  Send,
  Lock,
  BarChart3,
  Award,
  CheckCircle2,
  XCircle,
  FileSignature,
  CreditCard,
  ExternalLink,
  Loader2,
  Timer,
  AlertTriangle,
} from 'lucide-react';

interface WorkflowActionBarProps {
  passation: PassationMarche;
}

type ActionType =
  | 'publish'
  | 'close'
  | 'startEval'
  | 'proposeAttribution'
  | 'approve'
  | 'rejectAttribution'
  | 'sign';

interface ActionConfig {
  type: ActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'destructive' | 'outline';
  className?: string;
  disabled: boolean;
  disabledReason?: string;
  dialogTitle: string;
  dialogDescription: string;
  needsMotif?: boolean;
  needsDateCloture?: boolean;
  needsContratUrl?: boolean;
}

export function WorkflowActionBar({ passation }: WorkflowActionBarProps) {
  const navigate = useNavigate();
  const { hasAnyRole, isAdmin } = usePermissions();
  const {
    publishPassation,
    closePassation,
    startEvaluationPassation,
    proposeAttributionPassation,
    approvePassation,
    rejectAttributionPassation,
    signPassation,
  } = usePassationsMarche();

  const [confirmAction, setConfirmAction] = useState<ActionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [motif, setMotif] = useState('');
  const [dateCloture, setDateCloture] = useState('');
  const [contratUrl, setContratUrl] = useState('');

  // Role checks
  const isDAAF = isAdmin || hasAnyRole(['DAAF']);
  const isDG = isAdmin || hasAnyRole(['DG']);

  // Get soumissionnaires
  const allSoumissionnaires = (passation.soumissionnaires || []) as Soumissionnaire[];
  const conformes = allSoumissionnaires.filter(
    (s) => s.statut !== 'recu' && s.statut !== 'elimine'
  );
  const evaluated = allSoumissionnaires.filter((s) => s.note_finale !== null);
  const retenus = allSoumissionnaires.filter((s) => s.statut === 'retenu');

  // Timeline
  const stepKeys = WORKFLOW_STEPS.map((s) => s.key);
  const currentIdx = stepKeys.indexOf(passation.statut as (typeof stepKeys)[number]);

  // Compute actions based on statut + role
  const actions = useMemo((): ActionConfig[] => {
    const result: ActionConfig[] = [];

    if (passation.statut === 'brouillon' && isDAAF) {
      const hasSoums = allSoumissionnaires.length > 0;
      result.push({
        type: 'publish',
        label: 'Publier',
        icon: Send,
        variant: 'default',
        className: 'bg-cyan-600 hover:bg-cyan-700',
        disabled: !hasSoums,
        disabledReason: !hasSoums ? 'Ajoutez au moins un soumissionnaire' : undefined,
        dialogTitle: 'Publier la passation',
        dialogDescription:
          'La passation sera visible et les soumissionnaires pourront deposer leurs offres. Vous pouvez definir une date de cloture.',
        needsDateCloture: true,
      });
    }

    if (passation.statut === 'publie' && isDAAF) {
      result.push({
        type: 'close',
        label: 'Cloturer',
        icon: Lock,
        variant: 'default',
        className: 'bg-indigo-600 hover:bg-indigo-700',
        disabled: false,
        dialogTitle: 'Cloturer la passation',
        dialogDescription: 'Plus aucune offre ne pourra etre deposee apres la cloture.',
      });
    }

    if (passation.statut === 'cloture' && isDAAF) {
      const hasConformes = conformes.length > 0;
      result.push({
        type: 'startEval',
        label: "Lancer l'evaluation",
        icon: BarChart3,
        variant: 'default',
        className: 'bg-amber-600 hover:bg-amber-700',
        disabled: !hasConformes,
        disabledReason: !hasConformes ? 'Aucun soumissionnaire conforme' : undefined,
        dialogTitle: "Lancer l'evaluation",
        dialogDescription: `${conformes.length} soumissionnaire(s) conforme(s) seront evalues.`,
      });
    }

    if (passation.statut === 'en_evaluation' && isDAAF) {
      const allEvaluated = allSoumissionnaires.length > 0 && evaluated.length === conformes.length;
      const hasRetenu = retenus.length > 0;
      const canPropose = allEvaluated && hasRetenu;
      const reasons: string[] = [];
      if (!allEvaluated)
        reasons.push(`${conformes.length - evaluated.length} soumissionnaire(s) non evalue(s)`);
      if (!hasRetenu) reasons.push('Aucun soumissionnaire retenu');

      result.push({
        type: 'proposeAttribution',
        label: 'Proposer attribution',
        icon: Award,
        variant: 'default',
        className: 'bg-purple-600 hover:bg-purple-700',
        disabled: !canPropose,
        disabledReason: reasons.length > 0 ? reasons.join(', ') : undefined,
        dialogTitle: "Proposer l'attribution au DG",
        dialogDescription: `Le marche sera propose au DG pour approbation. Attributaire : ${retenus[0]?.raison_sociale || '-'}`,
      });
    }

    if (passation.statut === 'attribue' && isDG) {
      result.push({
        type: 'approve',
        label: 'Approuver',
        icon: CheckCircle2,
        variant: 'default',
        className: 'bg-green-600 hover:bg-green-700',
        disabled: false,
        dialogTitle: "Approuver l'attribution",
        dialogDescription: `Confirmez l'attribution du marche a ${retenus[0]?.raison_sociale || "l'attributaire"}.`,
      });
      result.push({
        type: 'rejectAttribution',
        label: 'Rejeter',
        icon: XCircle,
        variant: 'destructive',
        disabled: false,
        dialogTitle: "Rejeter l'attribution",
        dialogDescription: "La passation retournera en phase d'evaluation.",
        needsMotif: true,
      });
    }

    if (passation.statut === 'approuve' && isDAAF) {
      result.push({
        type: 'sign',
        label: 'Marquer signe',
        icon: FileSignature,
        variant: 'default',
        className: 'bg-emerald-600 hover:bg-emerald-700',
        disabled: false,
        dialogTitle: 'Marquer le contrat comme signe',
        dialogDescription: 'Fournissez le lien vers le contrat signe.',
        needsContratUrl: true,
      });
    }

    return result;
  }, [
    passation.statut,
    isDAAF,
    isDG,
    allSoumissionnaires.length,
    conformes.length,
    evaluated.length,
    retenus,
  ]);

  // Timer for cloture
  const clotureDaysLeft = useMemo(() => {
    if (passation.statut !== 'publie' || !passation.date_cloture) return null;
    const now = new Date();
    const cloture = new Date(passation.date_cloture);
    const diff = Math.ceil((cloture.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [passation.statut, passation.date_cloture]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setIsLoading(true);
    try {
      switch (confirmAction.type) {
        case 'publish':
          await publishPassation({
            id: passation.id,
            dateCloture: dateCloture || undefined,
          });
          break;
        case 'close':
          await closePassation(passation.id);
          break;
        case 'startEval':
          await startEvaluationPassation(passation.id);
          break;
        case 'proposeAttribution':
          await proposeAttributionPassation(passation.id);
          break;
        case 'approve':
          await approvePassation(passation.id);
          break;
        case 'rejectAttribution':
          await rejectAttributionPassation({ id: passation.id, motif });
          break;
        case 'sign':
          await signPassation({ id: passation.id, contratUrl });
          break;
      }
      setConfirmAction(null);
      setMotif('');
      setDateCloture('');
      setContratUrl('');
    } catch {
      // Error handled by mutation's onError
    } finally {
      setIsLoading(false);
    }
  };

  const canConfirm = () => {
    if (!confirmAction) return false;
    if (confirmAction.needsMotif && !motif.trim()) return false;
    if (confirmAction.needsContratUrl && !contratUrl.trim()) return false;
    return true;
  };

  return (
    <>
      <Card className="border-2" data-testid="workflow-action-bar">
        <CardContent className="pt-4 pb-3 space-y-3">
          {/* Timeline visuelle */}
          <div className="flex items-center justify-between px-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCurrent = step.key === passation.statut;
              const isPast = currentIdx >= 0 && idx < currentIdx;
              const isFuture = currentIdx >= 0 && idx > currentIdx;
              // If statut not in workflow (legacy), show all as muted
              const isLegacy = currentIdx < 0;

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                        isLegacy && 'bg-muted border-muted-foreground/20 text-muted-foreground',
                        isPast && 'bg-green-500 border-green-500 text-white',
                        isCurrent &&
                          'bg-primary border-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1',
                        isFuture && 'bg-background border-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] mt-1 text-center whitespace-nowrap',
                        isCurrent && 'font-bold text-primary',
                        isPast && 'text-green-700 font-medium',
                        isFuture && 'text-muted-foreground',
                        isLegacy && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {/* Connecting line */}
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-1 mt-[-14px]',
                        isPast && currentIdx > idx + 1
                          ? 'bg-green-400'
                          : isPast && currentIdx === idx + 1
                            ? 'bg-gradient-to-r from-green-400 to-primary'
                            : 'bg-muted-foreground/15'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions + Timer */}
          {(actions.length > 0 || clotureDaysLeft !== null || passation.statut === 'signe') && (
            <div className="flex items-center justify-between pt-2 border-t">
              {/* Left: timer or post-signature CTA */}
              <div className="flex items-center gap-2">
                {clotureDaysLeft !== null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs gap-1',
                      clotureDaysLeft <= 0 && 'bg-red-50 text-red-700 border-red-300',
                      clotureDaysLeft > 0 &&
                        clotureDaysLeft <= 3 &&
                        'bg-orange-50 text-orange-700 border-orange-300',
                      clotureDaysLeft > 3 && 'bg-blue-50 text-blue-700 border-blue-300'
                    )}
                  >
                    <Timer className="h-3 w-3" />
                    {clotureDaysLeft <= 0
                      ? 'Cloture depassee'
                      : `Cloture dans ${clotureDaysLeft} jour${clotureDaysLeft > 1 ? 's' : ''}`}
                  </Badge>
                )}

                {passation.statut === 'signe' && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      navigate(`/engagements?sourcePM=${passation.id}`);
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Creer l'engagement budgetaire
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                {passation.motif_rejet_attribution && passation.statut === 'en_evaluation' && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Attribution rejetee : {passation.motif_rejet_attribution}</span>
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  {actions.map((action) => {
                    const Icon = action.icon;
                    const btn = (
                      <Button
                        key={action.type}
                        variant={action.variant}
                        size="sm"
                        className={cn('gap-1.5', action.className)}
                        disabled={action.disabled}
                        onClick={() => {
                          setConfirmAction(action);
                          setMotif('');
                          setDateCloture('');
                          setContratUrl('');
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {action.label}
                      </Button>
                    );

                    if (action.disabled && action.disabledReason) {
                      return (
                        <Tooltip key={action.type}>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>{btn}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Pre-requis : {action.disabledReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return btn;
                  })}
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction?.dialogTitle}</DialogTitle>
            <DialogDescription>{confirmAction?.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {confirmAction?.needsDateCloture && (
              <div className="space-y-2">
                <Label htmlFor="date-cloture">Date de cloture prevue (optionnel)</Label>
                <Input
                  id="date-cloture"
                  type="date"
                  value={dateCloture}
                  onChange={(e) => setDateCloture(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {confirmAction?.needsMotif && (
              <div className="space-y-2">
                <Label htmlFor="motif">Motif du rejet *</Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Indiquez le motif du rejet..."
                  rows={3}
                />
              </div>
            )}

            {confirmAction?.needsContratUrl && (
              <div className="space-y-2">
                <Label htmlFor="contrat-url">Lien du contrat signe *</Label>
                <Input
                  id="contrat-url"
                  type="url"
                  value={contratUrl}
                  onChange={(e) => setContratUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !canConfirm()}
              variant={confirmAction?.variant === 'destructive' ? 'destructive' : 'default'}
              className={cn(confirmAction?.variant !== 'destructive' && confirmAction?.className)}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
