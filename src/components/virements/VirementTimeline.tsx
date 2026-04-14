/**
 * VirementTimeline — Timeline enrichie du workflow d'un virement / ajustement
 *
 * Workflow 2 niveaux CB → DG :
 *   Création → Approbation CB → Exécution DG
 *                       ↘ Rejet (CB ou DG)
 *
 * Deux modes d'affichage :
 *   - compact (par défaut) : ligne horizontale avec tooltip → pour le header du détail
 *   - vertical : carte complète avec acteurs, dates, motif → pour un onglet Historique
 *
 * Créé le 2026-04-08 pour la Phase 4 (remplace la timeline inline dans TransferDetailsDialog).
 * Inspiré de `EngagementTimeline.tsx` et `LiquidationTimeline.tsx`.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  CheckCircle2,
  Play,
  XCircle,
  Calendar,
  User,
  ArrowRightLeft,
  Paperclip,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BudgetTransfer } from '@/hooks/useBudgetTransfers';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
  attachment?: { name: string; url: string } | null;
}

interface VirementTimelineProps {
  transfer: BudgetTransfer;
  /** Mode d'affichage : `compact` (ligne) ou `full` (vertical avec détails) */
  mode?: 'compact' | 'full';
  className?: string;
}

function buildTimelineSteps(transfer: BudgetTransfer): TimelineStep[] {
  const status = transfer.status || 'en_attente';
  const steps: TimelineStep[] = [];

  // 1. Création (toujours complétée)
  steps.push({
    key: 'creation',
    label: 'Création',
    icon: FileText,
    status: 'completed',
    date: transfer.requested_at,
    actor: transfer.requested_by_profile?.full_name,
    comment: transfer.motif,
  });

  // 2. Approbation CB
  if (status === 'rejete' && !transfer.approved_at) {
    // Rejeté par le CB avant approbation
    steps.push({
      key: 'approbation_cb',
      label: 'Rejet CB',
      icon: XCircle,
      status: 'rejected',
      comment: transfer.rejection_reason,
    });
  } else {
    const cbDone = ['approuve', 'execute'].includes(status);
    steps.push({
      key: 'approbation_cb',
      label: 'Approbation CB',
      icon: CheckCircle2,
      status: cbDone ? 'completed' : status === 'en_attente' ? 'current' : 'pending',
      date: transfer.approved_at,
      actor: transfer.approved_by_profile?.full_name,
    });
  }

  // 3. Exécution DG (ou rejet DG)
  if (status === 'rejete' && transfer.approved_at) {
    steps.push({
      key: 'execution_dg',
      label: 'Rejet DG',
      icon: XCircle,
      status: 'rejected',
      comment: transfer.rejection_reason,
    });
  } else if (status !== 'rejete') {
    steps.push({
      key: 'execution_dg',
      label: 'Exécution DG',
      icon: Play,
      status: status === 'execute' ? 'completed' : status === 'approuve' ? 'current' : 'pending',
      date: transfer.executed_at,
      actor: transfer.executed_by_profile?.full_name,
      attachment:
        transfer.decision_file_url && transfer.decision_file_name
          ? { name: transfer.decision_file_name, url: transfer.decision_file_url }
          : null,
    });
  }

  return steps;
}

function getStatusColor(status: TimelineStep['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white';
    case 'current':
      return 'bg-primary text-white ring-4 ring-primary/30';
    case 'rejected':
      return 'bg-red-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getLineColor(status: TimelineStep['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    default:
      return 'bg-muted';
  }
}

export function VirementTimeline({ transfer, mode = 'compact', className }: VirementTimelineProps) {
  const steps = buildTimelineSteps(transfer);

  if (mode === 'compact') {
    return (
      <TooltipProvider>
        <div
          className={cn('flex items-center gap-2 overflow-x-auto', className)}
          data-testid="virement-timeline-compact"
        >
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
                      data-testid={`timeline-step-${step.key}`}
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
                      {step.actor && <p className="text-xs">Par : {step.actor}</p>}
                      {step.comment && <p className="text-xs max-w-xs">{step.comment}</p>}
                      {step.attachment && (
                        <p className="text-xs flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {step.attachment.name}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                {index < steps.length - 1 && (
                  <div className={cn('h-0.5 w-6 mx-1 shrink-0', getLineColor(step.status))} />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className} data-testid="virement-timeline-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Historique du workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="flex items-start gap-4 relative"
                data-testid={`timeline-step-full-${step.key}`}
              >
                {/* Ligne verticale */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-4 top-8 w-0.5 h-full -ml-px',
                      getLineColor(step.status)
                    )}
                  />
                )}

                {/* Icône */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                    getStatusColor(step.status)
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Contenu */}
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
                        step.status === 'pending' && 'border-muted-foreground text-muted-foreground'
                      )}
                    >
                      {step.status === 'completed' && 'Terminé'}
                      {step.status === 'current' && 'En cours'}
                      {step.status === 'rejected' && 'Rejeté'}
                      {step.status === 'pending' && 'En attente'}
                    </Badge>
                  </div>

                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {step.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(step.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
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
                    {step.attachment && (
                      <a
                        href={step.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                        data-testid="timeline-attachment-link"
                      >
                        <Paperclip className="h-3 w-3" />
                        {step.attachment.name}
                      </a>
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
