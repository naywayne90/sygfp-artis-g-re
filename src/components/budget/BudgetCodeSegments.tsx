import { Fragment } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { segmentBudgetCode, type BudgetSegmentType } from '@/lib/budget/code-segments';

/**
 * Palette déjà utilisée par <ImputationCodeDisplay /> pour garder une cohérence
 * visuelle entre les affichages segmentés de la chaîne d'imputation et ceux
 * de la structure budgétaire.
 */
const SEGMENT_COLORS: Record<BudgetSegmentType, string> = {
  os: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  mission: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  action: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  activite: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  sous_activite: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  nbe: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  other: 'bg-muted text-foreground',
};

interface BudgetCodeSegmentsProps {
  code: string | null | undefined;
  /** `compact` (défaut) : segments sans libellé, hauteur table. */
  compact?: boolean;
  className?: string;
}

/**
 * Affiche un code budgétaire décomposé en segments colorés.
 *
 * Pour un code connu (16/18/19 chiffres), chaque tranche est rendue dans son
 * propre `<span>` coloré et un tooltip précise le type (OS, Mission, Action…).
 * Pour un code non standard, on revient à un simple affichage monospaced.
 */
export function BudgetCodeSegments({ code, compact = true, className }: BudgetCodeSegmentsProps) {
  const segments = segmentBudgetCode(code);

  if (segments.length === 0) {
    return <span className={cn('font-mono text-sm text-muted-foreground', className)}>-</span>;
  }

  // Code non standard → simple rendu monospaced
  if (segments.length === 1 && segments[0].type === 'other') {
    return (
      <span data-testid="budget-code-segments" className={cn('font-mono text-sm', className)}>
        {segments[0].value}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <span
        data-testid="budget-code-segments"
        className={cn(
          'inline-flex items-center font-mono leading-none',
          compact ? 'text-[11px]' : 'text-sm gap-0.5',
          className
        )}
      >
        {segments.map((seg, idx) => (
          <Fragment key={`${seg.type}-${idx}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  data-segment-type={seg.type}
                  className={cn('rounded-sm px-1 py-0.5 cursor-help', SEGMENT_COLORS[seg.type])}
                >
                  {seg.value}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <span className="font-medium">{seg.label}</span>
                <span className="ml-1 font-mono text-muted-foreground">{seg.value}</span>
              </TooltipContent>
            </Tooltip>
            {idx < segments.length - 1 && (
              <span aria-hidden className="mx-0.5 text-muted-foreground/60">
                ·
              </span>
            )}
          </Fragment>
        ))}
      </span>
    </TooltipProvider>
  );
}
