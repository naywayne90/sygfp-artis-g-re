/**
 * Composant affichant la progression dans le workflow 9 étapes
 */

import { cn } from "@/lib/utils";
import { Check, Circle, AlertCircle } from "lucide-react";
import { WORKFLOW_STEPS, type WorkflowStep, isValidatedStatus, type Statut } from "@/lib/workflow/workflowEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DossierState {
  step: WorkflowStep;
  statut: Statut | null;
}

interface WorkflowStepsProgressProps {
  currentStep: WorkflowStep;
  dossierStates?: Partial<Record<WorkflowStep, DossierState>>;
  className?: string;
  compact?: boolean;
  showLabels?: boolean;
}

export function WorkflowStepsProgress({
  currentStep,
  dossierStates = {},
  className,
  compact = false,
  showLabels = true,
}: WorkflowStepsProgressProps) {
  const steps = Object.values(WORKFLOW_STEPS);

  const getStepStatus = (step: WorkflowStep): 'completed' | 'current' | 'upcoming' | 'error' => {
    const state = dossierStates[step];
    
    if (state?.statut) {
      if (isValidatedStatus(state.statut)) return 'completed';
      if (state.statut === 'rejete') return 'error';
    }
    
    if (step === currentStep) return 'current';
    if (step < currentStep) return 'completed';
    return 'upcoming';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;
          const state = dossierStates[step.id];

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full border-2 transition-colors",
                          compact ? "h-6 w-6" : "h-8 w-8",
                          {
                            'bg-primary border-primary text-primary-foreground': status === 'completed',
                            'bg-primary/20 border-primary text-primary': status === 'current',
                            'bg-muted border-muted-foreground/30 text-muted-foreground': status === 'upcoming',
                            'bg-destructive/20 border-destructive text-destructive': status === 'error',
                          }
                        )}
                      >
                        {status === 'completed' ? (
                          <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                        ) : status === 'error' ? (
                          <AlertCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                        ) : (
                          <span className={cn(compact ? "text-[10px]" : "text-xs", "font-bold")}>
                            {step.id}
                          </span>
                        )}
                      </div>
                      
                      {showLabels && !compact && (
                        <span
                          className={cn(
                            "mt-1.5 text-[10px] text-center max-w-[70px] leading-tight",
                            {
                              'text-primary font-medium': status === 'completed' || status === 'current',
                              'text-muted-foreground': status === 'upcoming',
                              'text-destructive': status === 'error',
                            }
                          )}
                        >
                          {step.labelShort}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {state?.statut && (
                        <p className="text-xs mt-1">
                          Statut: <span className="font-medium">{state.statut}</span>
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 mx-1",
                    compact ? "h-0.5" : "h-0.5",
                    {
                      'bg-primary': getStepStatus(step.id) === 'completed',
                      'bg-muted-foreground/30': getStepStatus(step.id) !== 'completed',
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
