/**
 * Navigation horizontale chaîne de dépense : ExprBesoin ↔ Passation ↔ Engagement
 * Affiche les liens cliquables entre les étapes liées à une passation.
 */

import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Gavel,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';
import type { PassationMarche } from '@/hooks/usePassationsMarche';

interface PassationChainNavProps {
  passation: PassationMarche;
  onCloseDialog?: () => void;
}

interface ChainStep {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'pending' | 'unavailable';
  url: string | null;
  subtitle: string | null;
}

export function PassationChainNav({ passation, onCloseDialog }: PassationChainNavProps) {
  const navigate = useNavigate();

  const ebExists = !!passation.expression_besoin_id;
  const isSigne = passation.statut === 'signe';
  const hasEngagementDecision = passation.decision === 'engagement_possible';

  const steps: ChainStep[] = [
    {
      key: 'eb',
      label: 'Expression de besoin',
      icon: ClipboardList,
      status: ebExists ? 'completed' : 'unavailable',
      url: ebExists ? `/execution/expression-besoin?id=${passation.expression_besoin_id}` : null,
      subtitle: passation.expression_besoin?.numero || null,
    },
    {
      key: 'passation',
      label: 'Passation de marché',
      icon: Gavel,
      status: 'current',
      url: null, // We're already viewing this
      subtitle: passation.reference || null,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      icon: CreditCard,
      status:
        isSigne && hasEngagementDecision ? 'pending' : isSigne ? 'unavailable' : 'unavailable',
      url: isSigne && hasEngagementDecision ? `/engagements?sourcePM=${passation.id}` : null,
      subtitle: isSigne && hasEngagementDecision ? 'A créer' : null,
    },
  ];

  const handleClick = (step: ChainStep) => {
    if (!step.url || step.status === 'current') return;
    onCloseDialog?.();
    navigate(step.url);
  };

  const StatusIcon = ({ status }: { status: ChainStep['status'] }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'current':
        return <Clock className="h-3.5 w-3.5 text-primary" />;
      case 'pending':
        return <Circle className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />;
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-muted/30 rounded-lg border">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isClickable = !!step.url && step.status !== 'current';

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => handleClick(step)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm',
                step.status === 'current' &&
                  'bg-primary/10 border border-primary/30 font-medium text-primary',
                step.status === 'completed' &&
                  isClickable &&
                  'hover:bg-green-50 cursor-pointer text-green-700',
                step.status === 'pending' &&
                  isClickable &&
                  'hover:bg-orange-50 cursor-pointer text-orange-700',
                step.status === 'unavailable' && 'opacity-40 cursor-default text-muted-foreground',
                !isClickable &&
                  step.status !== 'current' &&
                  step.status !== 'unavailable' &&
                  'cursor-default'
              )}
            >
              <StatusIcon status={step.status} />
              <Icon className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="whitespace-nowrap">{step.label}</span>
                {step.subtitle && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono mt-0.5">
                    {step.subtitle}
                  </Badge>
                )}
              </div>
            </button>

            {idx < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
