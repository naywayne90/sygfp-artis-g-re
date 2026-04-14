/**
 * VirementChainNav — Navigation horizontale entre les entités liées à un virement.
 *
 * Contrairement aux `*ChainNav` de la chaîne de dépense (qui relient Passation ↔
 * Engagement ↔ Liquidation), un virement n'a pas de chaîne séquentielle mais
 * relie des entités "satellites" :
 *
 *   [Ligne source] → [VIREMENT] → [Ligne destination] → [Journal mouvements]
 *
 * Chaque étape est cliquable (sauf l'étape "current") et ouvre la page
 * correspondante (`/planification/structure` pour les lignes budgétaires,
 * `/planification/virements` avec l'onglet journal pour l'historique).
 *
 * Créé le 2026-04-08 pour la Phase 4 du refactor Virements.
 * Inspiré de `PassationChainNav.tsx` et `EngagementChainNav.tsx`.
 */

import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  History,
} from 'lucide-react';
import type { BudgetTransfer } from '@/hooks/useBudgetTransfers';

type ChainStepStatus = 'completed' | 'current' | 'pending' | 'unavailable';

interface ChainStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: ChainStepStatus;
  url: string | null;
  subtitle?: string;
  tooltip?: string;
}

interface VirementChainNavProps {
  transfer: BudgetTransfer;
  onCloseDialog?: () => void;
}

function buildChainSteps(transfer: BudgetTransfer): ChainStep[] {
  const status = transfer.status || 'en_attente';
  const isExecuted = status === 'execute';

  const steps: ChainStep[] = [];

  // 1. Ligne source (débitée) — absente pour les ajustements
  if (transfer.from_line) {
    steps.push({
      key: 'source',
      label: 'Ligne source',
      icon: ArrowDownCircle,
      status: 'completed',
      url: `/planification/structure?line=${transfer.from_budget_line_id}`,
      subtitle: transfer.from_line.code,
      tooltip: transfer.from_line.label,
    });
  }

  // 2. Virement (étape courante)
  steps.push({
    key: 'virement',
    label: transfer.type_transfer === 'ajustement' ? 'Ajustement' : 'Virement',
    icon: ArrowRightLeft,
    status: 'current',
    url: null,
    subtitle: transfer.code || 'En cours',
  });

  // 3. Ligne destination (créditée)
  if (transfer.to_line) {
    steps.push({
      key: 'destination',
      label: 'Ligne destination',
      icon: ArrowUpCircle,
      status: isExecuted ? 'completed' : 'pending',
      url: `/planification/structure?line=${transfer.to_budget_line_id}`,
      subtitle: transfer.to_line.code,
      tooltip: transfer.to_line.label,
    });
  }

  // 4. Journal des mouvements budgétaires
  steps.push({
    key: 'journal',
    label: 'Journal',
    icon: History,
    status: isExecuted ? 'completed' : 'unavailable',
    url: isExecuted ? '/planification/virements?tab=journal' : null,
    tooltip: isExecuted ? 'Voir le mouvement dans le journal' : 'Disponible après exécution',
  });

  return steps;
}

function StatusIcon({ status }: { status: ChainStepStatus }) {
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
}

export function VirementChainNav({ transfer, onCloseDialog }: VirementChainNavProps) {
  const navigate = useNavigate();

  const steps = buildChainSteps(transfer);

  const handleClick = (step: ChainStep) => {
    if (!step.url || step.status === 'current') return;
    onCloseDialog?.();
    navigate(step.url);
  };

  return (
    <div
      className="flex items-center gap-1 px-3 py-2 bg-muted/30 rounded-lg border overflow-x-auto"
      data-testid="virement-chain-nav"
    >
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isClickable = !!step.url && step.status !== 'current';

        return (
          <div key={step.key} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleClick(step)}
              disabled={!isClickable}
              title={step.tooltip}
              data-testid={`chain-step-${step.key}`}
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
                <span className="whitespace-nowrap leading-tight">{step.label}</span>
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
