/**
 * LiquidationTimeline - Timeline simplifiée du workflow de liquidation
 *
 * Affiche 3 étapes : ○ Certifié SF → ○ DAAF → ○ DG (si requis)
 * Avec dates, acteurs et motifs si applicable
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Receipt,
  ClipboardCheck,
  Shield,
  Crown,
  FileCheck,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Liquidation,
  requiresDgValidation,
  SEUIL_VALIDATION_DG,
  useLiquidations,
} from '@/hooks/useLiquidations';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending' | 'rejected' | 'skipped';
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
}

interface ValidationStep {
  id: string;
  step_order: number;
  role: string;
  status: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { full_name: string | null } | null;
}

interface LiquidationTimelineProps {
  liquidation: Liquidation;
  compact?: boolean;
  className?: string;
}

export function LiquidationTimeline({
  liquidation,
  compact = false,
  className,
}: LiquidationTimelineProps) {
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const { getValidationSteps } = useLiquidations();

  useEffect(() => {
    if (liquidation?.id) {
      getValidationSteps(liquidation.id).then(setValidationSteps);
    }
  }, [liquidation?.id, getValidationSteps]);

  const needsDG = requiresDgValidation(liquidation.montant);

  // Build simplified 3-step timeline
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    const statut = liquidation.statut || 'brouillon';

    // Step 1: Création (always completed)
    steps.push({
      key: 'creation',
      label: 'Création',
      icon: FileEdit,
      status: 'completed',
      date: liquidation.created_at,
      actor: liquidation.creator?.full_name,
    });

    // Step 2: Certifié SF
    const sfCertified =
      liquidation.service_fait === true ||
      statut === 'certifié_sf' ||
      statut === 'soumis' ||
      statut === 'validé_daaf' ||
      statut === 'validé_dg';
    const sfIsCurrent = statut === 'brouillon' || statut === 'certifié_sf';

    steps.push({
      key: 'certifie_sf',
      label: 'Certifié SF',
      icon: ClipboardCheck,
      status:
        sfCertified && !sfIsCurrent
          ? 'completed'
          : sfIsCurrent && liquidation.service_fait
            ? 'completed'
            : sfIsCurrent
              ? 'current'
              : 'pending',
      date: liquidation.service_fait_date,
      comment: sfCertified ? 'Service fait certifié' : undefined,
    });

    // Step 3: Soumission
    const hasBeenSubmitted = !['brouillon', 'certifié_sf'].includes(statut);
    steps.push({
      key: 'soumission',
      label: 'Soumission',
      icon: Send,
      status: hasBeenSubmitted ? 'completed' : 'pending',
      date: liquidation.submitted_at,
    });

    // Step 4: Documents
    const hasDocuments = liquidation.attachments && liquidation.attachments.length > 0;
    steps.push({
      key: 'documents',
      label: 'Pièces justificatives',
      icon: FileCheck,
      status: hasDocuments ? 'completed' : 'pending',
      comment: hasDocuments
        ? `${liquidation.attachments?.length} document(s)`
        : 'En attente des pièces',
    });

    // Step 5: Validation DAAF
    const daafValidation = validationSteps.find((v) => v.role === 'DAAF' || v.role === 'DAF');
    const daafCompleted = daafValidation?.status === 'valide';
    const daafRejected = daafValidation?.status === 'rejete';
    const daafIsCurrent = statut === 'soumis' && !daafCompleted && !daafRejected;

    steps.push({
      key: 'daaf',
      label: 'Validation DAAF',
      icon: Shield,
      status: daafCompleted
        ? 'completed'
        : daafRejected
          ? 'rejected'
          : daafIsCurrent
            ? 'current'
            : 'pending',
      date: daafValidation?.validated_at,
      actor: daafValidation?.validator?.full_name,
      comment: daafValidation?.comments,
    });

    // Step 6: Validation DG (conditionnelle)
    if (needsDG) {
      const dgValidation = validationSteps.find((v) => v.role === 'DG');
      const dgCompleted = dgValidation?.status === 'valide';
      const dgRejected = dgValidation?.status === 'rejete';
      const dgIsCurrent = statut === 'validé_daaf' && !dgCompleted && !dgRejected;

      steps.push({
        key: 'dg',
        label: 'Validation DG',
        icon: Crown,
        status: dgCompleted
          ? 'completed'
          : dgRejected
            ? 'rejected'
            : dgIsCurrent
              ? 'current'
              : 'pending',
        date: dgValidation?.validated_at,
        actor: dgValidation?.validator?.full_name,
        comment:
          dgValidation?.comments ||
          (dgIsCurrent
            ? `Montant ≥ ${formatCurrency(SEUIL_VALIDATION_DG)} — validation DG requise`
            : undefined),
      });
    }

    // Final
    if (statut === 'validé_dg') {
      steps.push({
        key: 'validation_finale',
        label: 'Liquidation validée',
        icon: CheckCircle2,
        status: 'completed',
        date: liquidation.validated_at || liquidation.date_liquidation,
      });
    } else if (statut === 'rejete') {
      const rejectedStep = validationSteps.find((v) => v.status === 'rejete');
      steps.push({
        key: 'rejet',
        label: 'Rejetée',
        icon: XCircle,
        status: 'rejected',
        comment: rejectedStep?.comments || liquidation.rejection_reason,
        actor: rejectedStep?.validator?.full_name,
        date: rejectedStep?.validated_at || liquidation.rejected_at,
      });
    }

    return steps;
  };

  const steps = buildTimelineSteps();

  const getStatusColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-primary text-white ring-4 ring-primary/30';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'skipped':
        return 'bg-muted/50 text-muted-foreground/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLineColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0',
                        getStatusColor(step.status)
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{step.label}</p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(step.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      )}
                      {step.actor && <p className="text-xs">Par: {step.actor}</p>}
                      {step.comment && <p className="text-xs max-w-xs">{step.comment}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
                {index < steps.length - 1 && (
                  <div className={cn('h-0.5 w-4 mx-1 shrink-0', getLineColor(step.status))} />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Workflow de validation
          {needsDG && (
            <Badge variant="outline" className="text-xs ml-auto border-secondary/30 text-secondary">
              Validation DG requise
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {/* Vertical line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-4 top-8 w-0.5 h-full -ml-px',
                      getLineColor(step.status)
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                    getStatusColor(step.status)
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{step.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        step.status === 'completed' && 'border-green-500 text-green-600',
                        step.status === 'current' && 'border-primary text-primary',
                        step.status === 'rejected' && 'border-red-500 text-red-600',
                        step.status === 'pending' &&
                          'border-muted-foreground text-muted-foreground',
                        step.status === 'skipped' && 'border-muted text-muted-foreground/50'
                      )}
                    >
                      {step.status === 'completed' && 'Terminé'}
                      {step.status === 'current' && 'En cours'}
                      {step.status === 'rejected' && 'Rejeté'}
                      {step.status === 'pending' && 'En attente'}
                      {step.status === 'skipped' && 'Non requis'}
                    </Badge>
                  </div>

                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {step.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(step.date), 'dd MMMM yyyy à HH:mm', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                    {step.actor && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{step.actor}</span>
                      </div>
                    )}
                    {step.comment && (
                      <p className="text-sm mt-2 p-2 bg-muted/50 rounded text-foreground">
                        {step.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
