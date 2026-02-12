import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BudgetLineWithRelations } from '@/hooks/useBudgetLines';

interface BudgetLineRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
  onConfirm: (id: string, reason: string) => void;
}

export function BudgetLineRejectDialog({
  open,
  onOpenChange,
  budgetLine,
  onConfirm,
}: BudgetLineRejectDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!budgetLine || reason.trim().length < 10) return;
    onConfirm(budgetLine.id, reason.trim());
    setReason('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setReason('');
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Rejeter la ligne budgétaire</DialogTitle>
          <DialogDescription>
            {budgetLine && <span className="font-mono">{budgetLine.code}</span>}
            {budgetLine && ` — ${budgetLine.label}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason">Motif du rejet *</Label>
          <Textarea
            id="reject-reason"
            placeholder="Indiquez le motif du rejet (min. 10 caractères)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          {reason.length > 0 && reason.trim().length < 10 && (
            <p className="text-xs text-destructive">
              Le motif doit contenir au moins 10 caractères ({reason.trim().length}/10)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length < 10}
          >
            Rejeter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
