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
import { ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExpressionBesoinValidateDAAFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string) => void;
  isLoading?: boolean;
  expression?: {
    montant_estime?: number | null;
    visa_cb_date?: string | null;
    visa_cb_commentaire?: string | null;
  };
  cbValidatorName?: string;
}

export function ExpressionBesoinValidateDAAFDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  expression,
  cbValidatorName,
}: ExpressionBesoinValidateDAAFDialogProps) {
  const [comments, setComments] = useState('');

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setComments('');
    }
    onOpenChange(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
            Validation administrative (DAAF)
          </AlertDialogTitle>
          <AlertDialogDescription>
            En tant que DAAF, vous validez administrativement cette expression de besoin apres
            verification du CB. Cette action transmettra le dossier au DG pour approbation finale.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Info visa CB */}
          {expression?.visa_cb_date && (
            <div className="flex items-start gap-2 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Couverture budgetaire verifiee (CB)
                </p>
                <p className="text-blue-600/70 dark:text-blue-400/70">
                  {cbValidatorName ? `Par ${cbValidatorName}` : 'Par le CB'}
                  {' le '}
                  {format(new Date(expression.visa_cb_date), 'dd MMMM yyyy a HH:mm', {
                    locale: fr,
                  })}
                </p>
                {expression.visa_cb_commentaire && (
                  <p className="mt-1 text-blue-600/60 dark:text-blue-400/60 italic">
                    {expression.visa_cb_commentaire}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="validate-daaf-comments">Commentaires (optionnel)</Label>
            <Textarea
              id="validate-daaf-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
              className="mt-2"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setComments('')}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            Valider (DAAF)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
