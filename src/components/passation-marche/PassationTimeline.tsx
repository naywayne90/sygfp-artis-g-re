/**
 * PassationTimeline - Timeline du workflow 7 étapes de passation de marché
 *
 * brouillon → publié → clôturé → en_évaluation → attribué → approuvé → signé
 *
 * Avec dates, acteurs et statut visuel par étape.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileEdit,
  Send,
  Lock,
  ClipboardCheck,
  Award,
  ShieldCheck,
  FileSignature,
  User,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PassationMarche, STATUTS, LIFECYCLE_STEPS } from '@/hooks/usePassationsMarche';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending' | 'legacy';
  date?: string | null;
  actor?: string | null;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  brouillon: FileEdit,
  publie: Send,
  cloture: Lock,
  en_evaluation: ClipboardCheck,
  attribue: Award,
  approuve: ShieldCheck,
  signe: FileSignature,
};

const STEP_DATES: Record<string, (p: PassationMarche) => string | null> = {
  brouillon: (p) => p.created_at,
  publie: (p) => p.publie_at,
  cloture: (p) => p.cloture_at,
  en_evaluation: (p) => p.evaluation_at,
  attribue: (p) => p.attribue_at,
  approuve: (p) => p.approuve_at,
  signe: (p) => p.signe_at,
};

interface PassationTimelineProps {
  passation: PassationMarche;
  compact?: boolean;
  className?: string;
}

export function PassationTimeline({
  passation,
  compact = false,
  className,
}: PassationTimelineProps) {
  const currentStep = STATUTS[passation.statut]?.step ?? -1;
  const isLegacy = currentStep < 0;

  const buildTimelineSteps = (): TimelineStep[] => {
    if (isLegacy) {
      // For legacy statuts, show a single badge
      return [
        {
          key: passation.statut,
          label: STATUTS[passation.statut]?.label ?? passation.statut,
          icon: FileEdit,
          status: 'legacy',
          date: passation.created_at,
          actor: passation.creator?.full_name,
        },
      ];
    }

    return LIFECYCLE_STEPS.map((key) => {
      const step = STATUTS[key]?.step ?? 0;
      const dateGetter = STEP_DATES[key];
      const date = dateGetter ? dateGetter(passation) : null;

      let status: TimelineStep['status'];
      if (step < currentStep) {
        status = 'completed';
      } else if (step === currentStep) {
        status = 'current';
      } else {
        status = 'pending';
      }

      return {
        key,
        label: STATUTS[key]?.label ?? key,
        icon: STEP_ICONS[key] ?? FileEdit,
        status,
        date,
      };
    });
  };

  const steps = buildTimelineSteps();

  const getStatusColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-primary text-white ring-4 ring-primary/30';
      case 'legacy':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLineColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'legacy':
        return 'bg-gray-400';
      default:
        return 'bg-muted';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', className)}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                        getStatusColor(step.status)
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
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
                    </div>
                  </TooltipContent>
                </Tooltip>
                {index < steps.length - 1 && (
                  <div className={cn('h-0.5 w-4 mx-0.5', getLineColor(step.status))} />
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
          <ArrowRight className="h-4 w-4" />
          Cycle de vie du marché
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
                        step.status === 'legacy' && 'border-gray-400 text-gray-500',
                        step.status === 'pending' && 'border-muted-foreground text-muted-foreground'
                      )}
                    >
                      {step.status === 'completed' && 'Terminé'}
                      {step.status === 'current' && 'En cours'}
                      {step.status === 'legacy' && 'Legacy'}
                      {step.status === 'pending' && 'En attente'}
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
