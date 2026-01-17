/**
 * Barre d'actions de workflow avec bouton principal + dropdown
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  getAvailableTransitions,
  getNextAction,
  type Statut,
  type TransitionContext,
  type NextAction,
} from "@/lib/workflow/workflowEngine";
import {
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Tag,
  PenTool,
  Banknote,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const ACTION_ICONS: Record<string, typeof Send> = {
  SUBMIT: Send,
  VALIDATE: CheckCircle,
  REJECT: XCircle,
  DEFER: Clock,
  RESUBMIT: Send,
  REVISE: Edit,
  IMPUTE: Tag,
  SIGN: PenTool,
  PAY: Banknote,
  FORWARD_DG: Send,
  PREPARE_SIGN: PenTool,
  VALIDATE_DG: CheckCircle,
};

interface WorkflowActionsBarProps {
  moduleCode: string;
  currentStatus: Statut;
  userRoles: string[];
  context?: Partial<TransitionContext>;
  onTransition: (toStatus: Statut, motif?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  showSecondaryActions?: boolean;
  blockingMessage?: string;
}

export function WorkflowActionsBar({
  moduleCode,
  currentStatus,
  userRoles,
  context,
  onTransition,
  disabled = false,
  className,
  showSecondaryActions = true,
  blockingMessage,
}: WorkflowActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [motifDialogOpen, setMotifDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<NextAction | null>(null);
  const [motif, setMotif] = useState("");

  const transitions = getAvailableTransitions(moduleCode, currentStatus, userRoles, context);
  const nextAction = getNextAction(moduleCode, currentStatus, userRoles, context);

  const handleAction = async (action: NextAction) => {
    if (action.requiresMotif) {
      setPendingAction(action);
      setMotifDialogOpen(true);
      return;
    }

    await executeTransition(action.toStatus);
  };

  const executeTransition = async (toStatus: Statut, motifValue?: string) => {
    setIsLoading(true);
    try {
      await onTransition(toStatus, motifValue);
    } finally {
      setIsLoading(false);
      setMotifDialogOpen(false);
      setMotif("");
      setPendingAction(null);
    }
  };

  const confirmMotifAction = async () => {
    if (!pendingAction || !motif.trim()) return;
    await executeTransition(pendingAction.toStatus, motif);
  };

  // Pas d'actions disponibles
  if (transitions.length === 0) {
    if (blockingMessage) {
      return (
        <Alert variant="destructive" className={className}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action bloquée</AlertTitle>
          <AlertDescription>{blockingMessage}</AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  const secondaryActions = transitions.filter(
    (t) => !nextAction || t.to !== nextAction.toStatus
  );

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Bouton principal */}
        {nextAction && (
          <Button
            onClick={() => handleAction(nextAction)}
            disabled={disabled || isLoading}
            variant={nextAction.variant}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {ACTION_ICONS[nextAction.action] && (
                  <span className="h-4 w-4">
                    {(() => {
                      const Icon = ACTION_ICONS[nextAction.action];
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </span>
                )}
              </>
            )}
            {nextAction.label}
          </Button>
        )}

        {/* Actions secondaires */}
        {showSecondaryActions && secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={disabled || isLoading}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((transition, index) => {
                const Icon = ACTION_ICONS[transition.action] || Send;
                const isDestructive = transition.to === 'rejete';

                return (
                  <div key={transition.action}>
                    {index > 0 && isDestructive && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction({
                          action: transition.action,
                          label: transition.actionLabel,
                          variant: isDestructive ? 'destructive' : 'default',
                          requiresMotif: transition.requiresMotif,
                          toStatus: transition.to,
                        })
                      }
                      className={cn(isDestructive && 'text-destructive')}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {transition.actionLabel}
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Dialog pour saisir le motif */}
      <Dialog open={motifDialogOpen} onOpenChange={setMotifDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'REJECT' && 'Motif de rejet'}
              {pendingAction?.action === 'DEFER' && 'Motif de report'}
              {!['REJECT', 'DEFER'].includes(pendingAction?.action || '') && 'Justification'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.action === 'REJECT' &&
                'Veuillez indiquer la raison du rejet. Cette information sera visible par le créateur.'}
              {pendingAction?.action === 'DEFER' &&
                'Veuillez indiquer la raison du report et une date indicative de reprise.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motif">
                Motif <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Saisissez le motif..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMotifDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={confirmMotifAction}
              disabled={!motif.trim() || isLoading}
              variant={pendingAction?.action === 'REJECT' ? 'destructive' : 'default'}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
