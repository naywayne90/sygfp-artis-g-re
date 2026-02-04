/**
 * UrgentLiquidationToggle - Toggle de marquage urgence
 * Switch avec icône flamme, dialog de confirmation avec motif obligatoire
 */

import { useState } from 'react';
import { Flame, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useUrgentLiquidations } from '@/hooks/useUrgentLiquidations';

// ============================================================================
// TYPES
// ============================================================================

export interface UrgentLiquidationToggleProps {
  /** ID de la liquidation */
  liquidationId: string;
  /** Numéro de la liquidation (pour affichage) */
  liquidationNumero?: string;
  /** État actuel d'urgence */
  isUrgent?: boolean;
  /** Motif actuel (si urgent) */
  currentMotif?: string | null;
  /** Mode d'affichage */
  variant?: 'switch' | 'button' | 'icon';
  /** Taille */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS additionnelle */
  className?: string;
  /** Désactivé */
  disabled?: boolean;
  /** Callback après changement */
  onToggle?: (isUrgent: boolean) => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function UrgentLiquidationToggle({
  liquidationId,
  liquidationNumero,
  isUrgent: initialIsUrgent = false,
  currentMotif,
  variant = 'switch',
  size = 'md',
  className,
  disabled = false,
  onToggle,
}: UrgentLiquidationToggleProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [motif, setMotif] = useState('');
  const [isUrgentLocal, setIsUrgentLocal] = useState(initialIsUrgent);

  const { markAsUrgent, removeUrgent, isMarking, isRemoving } = useUrgentLiquidations();

  const isLoading = isMarking || isRemoving;

  const handleToggleClick = () => {
    if (isUrgentLocal) {
      // Retirer l'urgence directement
      handleRemoveUrgent();
    } else {
      // Ouvrir le dialog pour ajouter un motif
      setShowDialog(true);
    }
  };

  const handleConfirmUrgent = async () => {
    if (!motif.trim()) return;

    try {
      await markAsUrgent({ liquidationId, motif: motif.trim() });
      setIsUrgentLocal(true);
      setShowDialog(false);
      setMotif('');
      onToggle?.(true);
    } catch {
      // Erreur gérée par le hook
    }
  };

  const handleRemoveUrgent = async () => {
    try {
      await removeUrgent(liquidationId);
      setIsUrgentLocal(false);
      onToggle?.(false);
    } catch {
      // Erreur gérée par le hook
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setMotif('');
  };

  // Tailles
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const buttonSizes = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Switch
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === 'switch') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('flex items-center gap-2', className)}>
                <Switch
                  checked={isUrgentLocal}
                  onCheckedChange={handleToggleClick}
                  disabled={disabled || isLoading}
                  className={cn(
                    isUrgentLocal && 'data-[state=checked]:bg-red-500'
                  )}
                />
                <Label
                  className={cn(
                    'flex items-center gap-1.5 cursor-pointer select-none',
                    isUrgentLocal && 'text-red-600 font-medium'
                  )}
                  onClick={() => !disabled && !isLoading && handleToggleClick()}
                >
                  <Flame
                    className={cn(
                      iconSizes[size],
                      isUrgentLocal && 'text-red-500 animate-pulse'
                    )}
                  />
                  {isLoading ? (
                    <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
                  ) : (
                    <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
                      {isUrgentLocal ? 'Urgent' : 'Marquer urgent'}
                    </span>
                  )}
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isUrgentLocal
                ? `Cliquer pour retirer le marquage urgent${currentMotif ? `\nMotif: ${currentMotif}` : ''}`
                : 'Cliquer pour marquer cette liquidation comme urgente'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <UrgentConfirmDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          liquidationNumero={liquidationNumero}
          motif={motif}
          onMotifChange={setMotif}
          onConfirm={handleConfirmUrgent}
          onCancel={handleCancel}
          isLoading={isMarking}
        />
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Button
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === 'button') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isUrgentLocal ? 'destructive' : 'outline'}
                size={size === 'lg' ? 'default' : 'sm'}
                className={cn(
                  buttonSizes[size],
                  'gap-1.5',
                  isUrgentLocal && 'animate-pulse',
                  className
                )}
                onClick={handleToggleClick}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
                ) : (
                  <Flame className={iconSizes[size]} />
                )}
                {isUrgentLocal ? 'Urgent' : 'Marquer urgent'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isUrgentLocal
                ? 'Cliquer pour retirer le marquage urgent'
                : 'Marquer pour règlement prioritaire'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <UrgentConfirmDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          liquidationNumero={liquidationNumero}
          motif={motif}
          onMotifChange={setMotif}
          onConfirm={handleConfirmUrgent}
          onCancel={handleCancel}
          isLoading={isMarking}
        />
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Icon only
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                isUrgentLocal && 'text-red-500 hover:text-red-600 hover:bg-red-50',
                className
              )}
              onClick={handleToggleClick}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
              ) : (
                <Flame
                  className={cn(
                    iconSizes[size],
                    isUrgentLocal && 'fill-red-500 animate-pulse'
                  )}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isUrgentLocal
              ? `Urgent - Cliquer pour retirer${currentMotif ? `\nMotif: ${currentMotif}` : ''}`
              : 'Marquer comme urgent'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UrgentConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        liquidationNumero={liquidationNumero}
        motif={motif}
        onMotifChange={setMotif}
        onConfirm={handleConfirmUrgent}
        onCancel={handleCancel}
        isLoading={isMarking}
      />
    </>
  );
}

// ============================================================================
// COMPOSANT: Dialog de confirmation
// ============================================================================

interface UrgentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liquidationNumero?: string;
  motif: string;
  onMotifChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function UrgentConfirmDialog({
  open,
  onOpenChange,
  liquidationNumero,
  motif,
  onMotifChange,
  onConfirm,
  onCancel,
  isLoading,
}: UrgentConfirmDialogProps) {
  const isValid = motif.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Flame className="h-5 w-5" />
            Marquer règlement urgent
          </DialogTitle>
          <DialogDescription>
            {liquidationNumero
              ? `Vous allez marquer la liquidation ${liquidationNumero} comme urgente.`
              : 'Vous allez marquer cette liquidation comme urgente.'}
            <br />
            Cette action notifiera la DMG pour un traitement prioritaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Le marquage urgent est réservé aux situations exceptionnelles nécessitant un règlement prioritaire.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgent-motif" className="text-sm font-medium">
              Motif de l'urgence <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="urgent-motif"
              placeholder="Décrivez la raison de l'urgence (minimum 10 caractères)..."
              value={motif}
              onChange={(e) => onMotifChange(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {motif.length}/10 caractères minimum
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isValid || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flame className="h-4 w-4" />
            )}
            Confirmer l'urgence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UrgentLiquidationToggle;
