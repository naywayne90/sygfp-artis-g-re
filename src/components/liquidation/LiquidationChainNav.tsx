/**
 * Navigation horizontale chaine de depense : Passation > Engagement > Liquidation > Ordonnancement
 * Affiche les liens cliquables entre les etapes liees a une liquidation.
 */

import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Gavel,
  CreditCard,
  Receipt,
  Banknote,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';
import type { Liquidation } from '@/hooks/useLiquidations';
import {
  buildLiquidationChainSteps,
  type LiquidationChainStep,
} from '@/lib/liquidation/liquidationChainSteps';

const ICONS = {
  Gavel,
  CreditCard,
  Receipt,
  Banknote,
} as const;

interface LiquidationChainNavProps {
  liquidation: Liquidation;
  onCloseDialog?: () => void;
}

export function LiquidationChainNav({ liquidation, onCloseDialog }: LiquidationChainNavProps) {
  const navigate = useNavigate();

  const steps = buildLiquidationChainSteps(liquidation);

  const handleClick = (step: LiquidationChainStep) => {
    if (!step.url || step.status === 'current') return;
    onCloseDialog?.();
    navigate(step.url);
  };

  const StatusIcon = ({ status }: { status: LiquidationChainStep['status'] }) => {
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
        const Icon = ICONS[step.iconName];
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
