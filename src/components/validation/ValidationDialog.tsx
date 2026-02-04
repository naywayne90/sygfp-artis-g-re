/**
 * Dialog de validation pour les entités SYGFP
 * Gère les 3 types de dialogs : Validation, Différé, Rejet
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Loader2 } from 'lucide-react';
import { DiffereForm } from './DiffereForm';
import { RejetForm } from './RejetForm';
import type { ValidationAction, ValidationEntityType, DiffereFormData, RejetFormData } from '@/types/validation';
import { ENTITY_TYPE_LABELS } from '@/types/validation';

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ValidationAction;
  entityType: ValidationEntityType;
  onConfirmValidate: () => void;
  onConfirmDiffer: (data: DiffereFormData) => void;
  onConfirmReject: (data: RejetFormData) => void;
  isLoading?: boolean;
}

export function ValidationDialog({
  open,
  onOpenChange,
  action,
  entityType,
  onConfirmValidate,
  onConfirmDiffer,
  onConfirmReject,
  isLoading = false,
}: ValidationDialogProps) {
  const entityLabel = ENTITY_TYPE_LABELS[entityType];

  // Dialog de confirmation simple pour la validation
  if (action === 'valider') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Valider {entityLabel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de valider cette {entityLabel.toLowerCase()}.
              Cette action confirmera le passage à l'étape suivante du processus.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 my-4">
            <p className="text-sm text-emerald-800">
              La validation sera enregistrée avec votre identifiant et horodatée dans le journal d'audit.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmValidate}
              disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer la validation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Dialog avec formulaire pour le différé
  if (action === 'differer') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              Différer {entityLabel}
            </DialogTitle>
            <DialogDescription>
              Indiquez les raisons du différé et les conditions de reprise éventuelles.
            </DialogDescription>
          </DialogHeader>

          <DiffereForm
            onSubmit={onConfirmDiffer}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Dialog avec formulaire pour le rejet
  if (action === 'rejeter') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              Rejeter {entityLabel}
            </DialogTitle>
            <DialogDescription>
              Indiquez les raisons du rejet. Cette information sera communiquée au demandeur.
            </DialogDescription>
          </DialogHeader>

          <RejetForm
            onSubmit={onConfirmReject}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            entityLabel={`cette ${entityLabel.toLowerCase()}`}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
