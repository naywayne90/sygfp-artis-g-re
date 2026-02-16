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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShieldCheck } from 'lucide-react';

interface ExpressionBesoinValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string) => void;
  expressionNumero: string | null;
  verifiedAt?: string | null;
  verifierName?: string | null;
}

export function ExpressionBesoinValidateDialog({
  open,
  onOpenChange,
  onConfirm,
  expressionNumero,
  verifiedAt,
  verifierName,
}: ExpressionBesoinValidateDialogProps) {
  const [comments, setComments] = useState('');

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider l'expression de besoin</AlertDialogTitle>
          <AlertDialogDescription>
            En tant que DG/DAAF, vous validez l'expression de besoin{' '}
            <strong>{expressionNumero || 'en cours'}</strong> déjà vérifiée par le CB. Cette action
            permettra la création d'une passation de marché.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Info vérification CB */}
          {verifiedAt && (
            <div className="flex items-start gap-2 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Couverture budgétaire vérifiée
                </p>
                <p className="text-blue-600/70 dark:text-blue-400/70">
                  {verifierName ? `Par ${verifierName}` : 'Par le CB'}
                  {' le '}
                  {format(new Date(verifiedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="validate-comments">Commentaires (optionnel)</Label>
            <Textarea
              id="validate-comments"
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
          <AlertDialogAction onClick={handleConfirm}>Valider</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
