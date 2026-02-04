import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, Circle, XCircle, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface WorkflowTimelineProps {
  entityType: string;
  entityId: string;
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'compact';
}

interface WorkflowStep {
  step_order: number;
  label: string;
  description: string | null;
  role_required: string;
  role_alternatif: string | null;
  est_optionnel: boolean;
  delai_max_heures: number;
}

interface HistoryEntry {
  step_order: number;
  action: string;
  user_name: string | null;
  motif: string | null;
  created_at: string;
}

interface WorkflowStatusData {
  exists: boolean;
  status?: 'en_cours' | 'complete' | 'rejete' | 'annule';
  current_step?: number;
  current_role_required?: string;
  started_at?: string;
  completed_at?: string;
  steps?: WorkflowStep[];
  history?: HistoryEntry[];
  message?: string;
}

type StepStatus = 'completed' | 'current' | 'pending' | 'rejected' | 'differed';

export function WorkflowTimeline({
  entityType,
  entityId,
  className,
  variant = 'vertical'
}: WorkflowTimelineProps) {
  const { data: workflowStatus, isLoading, error } = useQuery<WorkflowStatusData>({
    queryKey: ['wf-status', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_workflow_status', {
          p_entity_type: entityType,
          p_entity_id: entityId
        });
      if (error) throw error;
      return data as unknown as WorkflowStatusData;
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !workflowStatus?.exists) {
    return (
      <div className={cn(
        "text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg flex items-center gap-2",
        className
      )}>
        <Clock className="h-5 w-5" />
        <span>Workflow non démarré</span>
      </div>
    );
  }

  const steps: WorkflowStep[] = workflowStatus.steps || [];
  const history: HistoryEntry[] = workflowStatus.history || [];
  const currentStep = workflowStatus.current_step || 1;
  const status = workflowStatus.status || 'en_cours';

  const getStepStatus = (stepOrder: number): StepStatus => {
    if (status === 'rejete') {
      const rejectionEntry = history.find(h => h.action === 'rejete' && h.step_order === stepOrder);
      if (rejectionEntry) return 'rejected';
      if (stepOrder < currentStep) return 'completed';
      return 'pending';
    }

    const lastHistoryForStep = [...history].reverse().find(h => h.step_order === stepOrder);
    if (lastHistoryForStep?.action === 'differe' && stepOrder === currentStep) {
      return 'differed';
    }

    if (status === 'complete' || stepOrder < currentStep) return 'completed';
    if (stepOrder === currentStep) return 'current';
    return 'pending';
  };

  const getHistoryForStep = (stepOrder: number) => {
    return history.filter(h => h.step_order === stepOrder);
  };

  const getStepIcon = (stepStatus: StepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'current':
        return <Clock className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      case 'differed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const getStepColors = (stepStatus: StepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300', line: 'bg-green-300' };
      case 'current':
        return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300', line: 'bg-blue-300' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300', line: 'bg-red-300' };
      case 'differed':
        return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', line: 'bg-orange-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200', line: 'bg-gray-200' };
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      valide: 'Validé',
      rejete: 'Rejeté',
      differe: 'Différé',
      retourne: 'Retourné',
      commente: 'Commenté',
      delegue: 'Délégué',
      demande_info: 'Info demandée',
      annule: 'Annulé'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      valide: 'text-green-600',
      rejete: 'text-red-600',
      differe: 'text-orange-600',
      retourne: 'text-blue-600',
      commente: 'text-gray-600',
      delegue: 'text-purple-600',
      demande_info: 'text-yellow-600',
      annule: 'text-gray-500'
    };
    return colors[action] || 'text-gray-600';
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-1", className)}>
          {steps.map((step) => {
            const stepStatus = getStepStatus(step.step_order);
            const colors = getStepColors(stepStatus);
            const stepHistory = getHistoryForStep(step.step_order);

            return (
              <Tooltip key={step.step_order}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border-2 cursor-help transition-all",
                      colors.bg,
                      colors.border,
                      colors.text,
                      stepStatus === 'current' && "animate-pulse"
                    )}
                  >
                    {getStepIcon(stepStatus)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.role_required}</p>
                    {stepHistory.length > 0 && (
                      <div className="pt-1 border-t mt-1">
                        {stepHistory.slice(-1).map((h, i) => (
                          <p key={i} className="text-xs">
                            <span className={getActionColor(h.action)}>{getActionLabel(h.action)}</span>
                            {h.user_name && <span> par {h.user_name}</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <TooltipProvider>
        <div className={cn("w-full", className)}>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />

            <div className="relative flex justify-between">
              {steps.map((step) => {
                const stepStatus = getStepStatus(step.step_order);
                const colors = getStepColors(stepStatus);
                const stepHistory = getHistoryForStep(step.step_order);

                return (
                  <Tooltip key={step.step_order}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center cursor-help">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background z-10 transition-all",
                            colors.bg,
                            colors.border,
                            colors.text,
                            stepStatus === 'current' && "ring-2 ring-offset-2 ring-primary"
                          )}
                        >
                          {getStepIcon(stepStatus)}
                        </div>
                        <span className={cn(
                          "mt-2 text-xs text-center max-w-[80px] truncate",
                          stepStatus === 'completed' ? "text-green-600 font-medium" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">{step.label}</p>
                        {step.description && (
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          <span>{step.role_required}</span>
                        </div>
                        {stepHistory.length > 0 && (
                          <div className="border-t pt-2 mt-2 space-y-1">
                            {stepHistory.map((h, i) => (
                              <div key={i} className="text-xs">
                                <span className={cn("font-medium", getActionColor(h.action))}>
                                  {getActionLabel(h.action)}
                                </span>
                                {h.user_name && <span> par {h.user_name}</span>}
                                <span className="text-muted-foreground">
                                  {' '}• {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: fr })}
                                </span>
                                {h.motif && <p className="text-muted-foreground mt-0.5">"{h.motif}"</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Status summary */}
          {status === 'complete' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Workflow terminé</span>
              {workflowStatus.completed_at && (
                <span className="text-green-600">
                  ({formatDistanceToNow(new Date(workflowStatus.completed_at), { addSuffix: true, locale: fr })})
                </span>
              )}
            </div>
          )}

          {status === 'rejete' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Dossier rejeté</span>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Vertical variant (default)
  return (
    <TooltipProvider>
      <div className={cn("space-y-0", className)}>
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.step_order);
          const stepHistory = getHistoryForStep(step.step_order);
          const colors = getStepColors(stepStatus);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.step_order} className="flex">
              {/* Icon and connection line */}
              <div className="flex flex-col items-center mr-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all cursor-help",
                        colors.bg,
                        colors.text,
                        colors.border,
                        stepStatus === 'current' && "animate-pulse ring-2 ring-offset-2 ring-primary"
                      )}
                    >
                      {getStepIcon(stepStatus)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium">{step.label}</p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        <span>Rôle requis : {step.role_required}</span>
                      </div>
                      {step.role_alternatif && (
                        <p className="text-xs text-muted-foreground">
                          Alternatif : {step.role_alternatif}
                        </p>
                      )}
                      <p className="text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Délai max : {step.delai_max_heures}h
                      </p>
                      {stepHistory.length > 0 && (
                        <div className="border-t pt-2 mt-2 space-y-1">
                          {stepHistory.map((h, i) => (
                            <div key={i} className="text-xs">
                              <span className={cn("font-medium", getActionColor(h.action))}>
                                {getActionLabel(h.action)}
                              </span>
                              {h.user_name && <span> par {h.user_name}</span>}
                              <span className="text-muted-foreground block">
                                {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                              {h.motif && (
                                <p className="text-muted-foreground italic mt-0.5">"{h.motif}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Connection line */}
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-16 my-1",
                      stepStatus === 'completed' ? colors.line : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Label and status */}
              <div className="pt-2 pb-8 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("font-medium", colors.text)}>
                    {step.label}
                  </p>
                  {step.est_optionnel && (
                    <Badge variant="outline" className="text-xs">Optionnel</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {step.role_required}
                </p>

                {stepStatus === 'current' && status === 'en_cours' && (
                  <p className="text-xs text-blue-600 mt-2 animate-pulse flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    En attente de validation...
                  </p>
                )}

                {stepStatus === 'differed' && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Différé - En attente de corrections
                  </p>
                )}

                {stepHistory.length > 0 && stepStatus !== 'current' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {stepHistory.slice(-1).map((h, i) => (
                      <span key={i}>
                        <span className={getActionColor(h.action)}>{getActionLabel(h.action)}</span>
                        {h.user_name && ` par ${h.user_name}`}
                        {' • '}
                        {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status summary */}
      {status === 'complete' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Workflow terminé avec succès</span>
          {workflowStatus.completed_at && (
            <span className="text-green-600 ml-auto">
              {format(new Date(workflowStatus.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </span>
          )}
        </div>
      )}

      {status === 'rejete' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          <span>Dossier rejeté</span>
        </div>
      )}
    </TooltipProvider>
  );
}
