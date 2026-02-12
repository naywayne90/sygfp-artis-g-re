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
import { BudgetLineWithRelations } from '@/hooks/useBudgetLines';

interface BudgetLineDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
  onConfirm: (id: string) => void;
}

export function BudgetLineDeleteDialog({
  open,
  onOpenChange,
  budgetLine,
  onConfirm,
}: BudgetLineDeleteDialogProps) {
  const handleConfirm = () => {
    if (!budgetLine) return;
    onConfirm(budgetLine.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la ligne budgétaire ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous allez supprimer la ligne{' '}
            <span className="font-mono font-semibold">{budgetLine?.code}</span>
            {' — '}
            <span className="font-medium">{budgetLine?.label}</span>.
            <br />
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
