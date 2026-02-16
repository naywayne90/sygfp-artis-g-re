import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck } from 'lucide-react';
import { formatMontant } from '@/lib/config/sygfp-constants';

interface ExpressionBesoinVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string) => void;
  expressionNumero: string | null;
  montant: number | null;
  exercice: number | null;
}

export function ExpressionBesoinVerifyDialog({
  open,
  onOpenChange,
  onConfirm,
  expressionNumero,
  montant,
  exercice,
}: ExpressionBesoinVerifyDialogProps) {
  const [comments, setComments] = useState('');
  const [certified, setCertified] = useState(false);

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments('');
    setCertified(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setComments('');
      setCertified(false);
    }
    onOpenChange(value);
  };

  const formatMontantOrDash = (m: number | null) => (m ? formatMontant(m) : '-');

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Vérifier la couverture budgétaire
          </AlertDialogTitle>
          <AlertDialogDescription>
            En tant que Contrôleur Budgétaire (CB), vous vérifiez la couverture budgétaire de
            l'expression de besoin <strong>{expressionNumero || 'en cours'}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Résumé budgétaire */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant estimé</span>
              <span className="font-medium">{formatMontantOrDash(montant)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exercice</span>
              <span className="font-medium">{exercice || '-'}</span>
            </div>
          </div>

          {/* Certification obligatoire */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="certify-budget"
              checked={certified}
              onCheckedChange={(checked) => setCertified(checked === true)}
            />
            <Label htmlFor="certify-budget" className="text-sm leading-relaxed cursor-pointer">
              Je certifie avoir vérifié la couverture budgétaire et confirme que les crédits sont
              disponibles pour cette expression de besoin.
            </Label>
          </div>

          {/* Commentaires */}
          <div>
            <Label htmlFor="verify-comments">Commentaires (optionnel)</Label>
            <Textarea
              id="verify-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Observations sur la couverture budgétaire..."
              rows={2}
              className="mt-2"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!certified}>
            Confirmer la vérification
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
