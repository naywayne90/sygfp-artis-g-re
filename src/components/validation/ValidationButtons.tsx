/**
 * Composant de boutons de validation pour SYGFP
 * 3 actions : Validé (vert), Différé (orange), Rejeté (rouge)
 * Conforme au compte-rendu du 20/01/2026
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationDialog } from './ValidationDialog';
import { useValidation } from '@/hooks/useValidation';
import type {
  ValidationButtonsProps,
  ValidationAction,
  DiffereFormData,
  RejetFormData,
} from '@/types/validation';

// Statuts qui permettent la validation
const VALIDATABLE_STATUSES = ['en_attente', 'soumis', 'brouillon', 'en_cours', 'pending'];

export function ValidationButtons({
  entityType,
  entityId,
  currentStatus,
  onSuccess,
  disabled = false,
  size = 'md',
}: ValidationButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ValidationAction | null>(null);

  const {
    validate,
    differ,
    reject,
    isValidating,
    isDiffering,
    isRejecting,
    isLoading,
  } = useValidation(entityType);

  // Vérifier si l'entité peut être validée
  const canValidate = VALIDATABLE_STATUSES.includes(currentStatus.toLowerCase());

  // Ouvrir le dialog pour une action
  const handleActionClick = (action: ValidationAction) => {
    setCurrentAction(action);
    setDialogOpen(true);
  };

  // Confirmer la validation
  const handleConfirmValidate = () => {
    validate(entityId, {
      onSuccess: () => {
        setDialogOpen(false);
        setCurrentAction(null);
        onSuccess?.();
      },
    });
  };

  // Confirmer le différé
  const handleConfirmDiffer = (data: DiffereFormData) => {
    differ(
      { entityId, data },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setCurrentAction(null);
          onSuccess?.();
        },
      }
    );
  };

  // Confirmer le rejet
  const handleConfirmReject = (data: RejetFormData) => {
    reject(
      { entityId, data },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setCurrentAction(null);
          onSuccess?.();
        },
      }
    );
  };

  // Classes de taille
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const isDisabled = disabled || isLoading || !canValidate;

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Bouton VALIDÉ - Vert */}
        <Button
          onClick={() => handleActionClick('valider')}
          disabled={isDisabled}
          className={cn(
            'bg-[#10B981] hover:bg-[#059669] text-white font-medium shadow-sm',
            'transition-all duration-200 hover:shadow-md',
            sizeClasses[size]
          )}
        >
          <CheckCircle className={cn('mr-2', iconSizes[size])} />
          Valider
        </Button>

        {/* Bouton DIFFÉRÉ - Orange */}
        <Button
          onClick={() => handleActionClick('differer')}
          disabled={isDisabled}
          className={cn(
            'bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium shadow-sm',
            'transition-all duration-200 hover:shadow-md',
            sizeClasses[size]
          )}
        >
          <Clock className={cn('mr-2', iconSizes[size])} />
          Différer
        </Button>

        {/* Bouton REJETÉ - Rouge */}
        <Button
          onClick={() => handleActionClick('rejeter')}
          disabled={isDisabled}
          className={cn(
            'bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium shadow-sm',
            'transition-all duration-200 hover:shadow-md',
            sizeClasses[size]
          )}
        >
          <XCircle className={cn('mr-2', iconSizes[size])} />
          Rejeter
        </Button>
      </div>

      {/* Dialog de validation */}
      {currentAction && (
        <ValidationDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setCurrentAction(null);
          }}
          action={currentAction}
          entityType={entityType}
          onConfirmValidate={handleConfirmValidate}
          onConfirmDiffer={handleConfirmDiffer}
          onConfirmReject={handleConfirmReject}
          isLoading={
            (currentAction === 'valider' && isValidating) ||
            (currentAction === 'differer' && isDiffering) ||
            (currentAction === 'rejeter' && isRejecting)
          }
        />
      )}
    </>
  );
}
