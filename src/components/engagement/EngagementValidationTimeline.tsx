import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { VALIDATION_STEPS } from '@/hooks/useEngagements';
import { cn } from '@/lib/utils';

interface ValidationStepData {
  step_order: number;
  role: string;
  status: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { full_name: string | null } | null;
}

interface EngagementValidationTimelineProps {
  currentStep: number;
  statut: string | null;
  validationSteps?: ValidationStepData[];
  compact?: boolean;
}

export function EngagementValidationTimeline({
  currentStep,
  statut,
  validationSteps = [],
  compact,
}: EngagementValidationTimelineProps) {
  const isRejected = statut === 'rejete';

  return (
    <div className={cn('flex items-center gap-0', compact ? 'gap-0' : 'gap-0')}>
      {VALIDATION_STEPS.map((step, index) => {
        const validation = validationSteps.find((v) => v.step_order === step.order);
        const isCompleted = validation?.status === 'valide';
        const isRejectedStep = validation?.status === 'rejete';
        const isCurrent = step.order === currentStep && !isRejected && statut !== 'valide';
        const _isFuture =
          step.order > currentStep || (isRejected && !isCompleted && !isRejectedStep);

        let icon: React.ReactNode;
        let textColor: string;
        let lineColor: string;

        if (isRejectedStep) {
          icon = <XCircle className="h-5 w-5 text-destructive" />;
          textColor = 'text-destructive font-medium';
          lineColor = 'bg-destructive';
        } else if (isCompleted) {
          icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
          textColor = 'text-green-700 font-medium';
          lineColor = 'bg-green-500';
        } else if (isCurrent) {
          icon = <Circle className="h-5 w-5 text-primary fill-primary/20" />;
          textColor = 'text-primary font-semibold';
          lineColor = 'bg-muted-foreground/30';
        } else {
          icon = <Circle className="h-5 w-5 text-muted-foreground/40" />;
          textColor = 'text-muted-foreground/60';
          lineColor = 'bg-muted-foreground/20';
        }

        return (
          <div key={step.order} className="flex items-center">
            <div className="flex flex-col items-center">
              {icon}
              {!compact && (
                <span className={cn('text-[10px] mt-0.5 whitespace-nowrap', textColor)}>
                  {step.role}
                </span>
              )}
              {compact && <span className={cn('text-[9px] mt-0.5', textColor)}>{step.role}</span>}
            </div>
            {index < VALIDATION_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 mx-1',
                  compact ? 'w-4' : 'w-8',
                  isCompleted ? 'bg-green-500' : lineColor
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
