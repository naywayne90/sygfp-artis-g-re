import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Engagement } from '@/hooks/useEngagements';
import { formatCurrency } from '@/lib/utils';

interface EngagementDegageDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, montant_degage: number, motif: string) => void;
  isLoading?: boolean;
}

export function EngagementDegageDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: EngagementDegageDialogProps) {
  const [montant, setMontant] = useState<number>(0);
  const [motif, setMotif] = useState('');

  const montantRestant = engagement ? engagement.montant - (engagement.montant_degage || 0) : 0;

  useEffect(() => {
    if (open && engagement) {
      setMontant(montantRestant);
      setMotif('');
    }
  }, [open, engagement, montantRestant]);

  const isOverflow = montant > montantRestant;
  const isValid = montant > 0 && !isOverflow && motif.trim().length > 0;

  const handleConfirm = () => {
    if (engagement && isValid) {
      onConfirm(engagement.id, montant, motif);
      setMontant(0);
      setMotif('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Déengager</AlertDialogTitle>
          <AlertDialogDescription>
            Déengagement de l'engagement <strong>{engagement?.numero}</strong>. Les crédits seront
            restitués à la ligne budgétaire.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Montant engagé : <strong>{formatCurrency(engagement?.montant || 0)}</strong>
            {(engagement?.montant_degage || 0) > 0 && (
              <span>
                {' '}
                — Déjà dégagé : <strong>{formatCurrency(engagement?.montant_degage || 0)}</strong>
              </span>
            )}
            <br />
            Restant : <strong>{formatCurrency(montantRestant)}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant_degage">Montant à dégager (FCFA) *</Label>
            <Input
              id="montant_degage"
              type="number"
              value={montant}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              min={0}
              max={montantRestant}
            />
            {isOverflow && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le montant à dégager ({formatCurrency(montant)}) dépasse le montant restant (
                  {formatCurrency(montantRestant)})
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif_degagement">Motif du déengagement *</Label>
            <Textarea
              id="motif_degagement"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez la raison du déengagement..."
              rows={4}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setMontant(0);
              setMotif('');
            }}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Déengagement en cours...' : 'Confirmer le déengagement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
