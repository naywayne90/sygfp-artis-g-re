/**
 * Dialog de création d'un virement ou d'un ajustement budgétaire.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 *
 * ⚠ Contient la logique UI critique du plafond LOLF 10 % (anti-corruption P0).
 * Le plafond est calculé en temps réel :
 *   - Plafond absolu = dotation_initiale × 10 %
 *   - Cumul = virements déjà exécutés sur la même ligne pour l'exercice
 *   - Marge restante = max(0, plafond − cumul)
 * L'alerte `data-testid="ceiling-alert"` s'affiche et le bouton Créer est
 * désactivé dès que `amount > ceilingRestant` (strict — inclusif à la marge).
 *
 * La validation côté hook (`useBudgetTransfers.createMutation`) re-vérifie
 * la même règle via `checkVirementCeiling()` — ceinture + bretelles.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VIREMENT_CEILING_RATIO, type CreateTransferData } from '@/hooks/useBudgetTransfers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  Eye,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from './constants';

interface CreateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTransferData) => void;
  isLoading: boolean;
  exercice: number;
}

export function CreateTransferDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  exercice,
}: CreateTransferDialogProps) {
  const [type, setType] = useState<'virement' | 'ajustement'>('virement');
  const [fromLineId, setFromLineId] = useState('');
  const [toLineId, setToLineId] = useState('');
  const [amount, setAmount] = useState(0);
  const [motif, setMotif] = useState('');
  const [justificationRenforcee, setJustificationRenforcee] = useState('');

  const { data: budgetLines } = useQuery({
    queryKey: ['budget-lines-transfer', exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from('budget_lines')
        .select('id, code, label, dotation_initiale, dotation_modifiee')
        .eq('exercice', exercice)
        .order('code');
      return data || [];
    },
    enabled: open,
  });

  const fromLine = budgetLines?.find((l) => l.id === fromLineId);
  const toLine = budgetLines?.find((l) => l.id === toLineId);

  const { data: fromEngaged } = useQuery({
    queryKey: ['from-engaged', fromLineId],
    queryFn: async () => {
      const { data } = await supabase
        .from('budget_engagements')
        .select('montant')
        .eq('budget_line_id', fromLineId)
        .in('statut', ['valide', 'en_cours']);
      return data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    },
    enabled: !!fromLineId,
  });

  // Cumul des virements déjà exécutés depuis cette ligne sur l'exercice.
  // Sert de base au calcul du plafond LOLF 10 % affiché en temps réel.
  const { data: fromVirementsEmisExecutes } = useQuery({
    queryKey: ['from-virements-emis-executes', fromLineId, exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from('credit_transfers')
        .select('amount')
        .eq('from_budget_line_id', fromLineId)
        .eq('exercice', exercice)
        .eq('status', 'execute');
      return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    },
    enabled: !!fromLineId && type === 'virement',
  });

  const fromDotation = fromLine ? fromLine.dotation_modifiee || fromLine.dotation_initiale : 0;
  const fromDisponible = fromDotation - (fromEngaged || 0);

  // Plafond LOLF 10 % (cumulatif sur l'exercice) — uniquement pour les virements
  const fromDotationInitiale = fromLine?.dotation_initiale || 0;
  const ceilingAbsolu = fromDotationInitiale * VIREMENT_CEILING_RATIO;
  const emisTotal = fromVirementsEmisExecutes || 0;
  const ceilingRestant = Math.max(0, ceilingAbsolu - emisTotal);
  const ceilingDepasse =
    type === 'virement' && !!fromLineId && amount > 0 && amount > ceilingRestant;

  const isValid =
    toLineId &&
    amount > 0 &&
    motif.trim() &&
    (type === 'ajustement' ||
      (fromLineId && fromLineId !== toLineId && amount <= fromDisponible && !ceilingDepasse)) &&
    (type === 'virement' || justificationRenforcee.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      type_transfer: type,
      from_budget_line_id: type === 'virement' ? fromLineId : null,
      to_budget_line_id: toLineId,
      amount,
      motif,
      justification_renforcee: type === 'ajustement' ? justificationRenforcee : undefined,
    });

    // Reset
    setType('virement');
    setFromLineId('');
    setToLineId('');
    setAmount(0);
    setMotif('');
    setJustificationRenforcee('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau virement / ajustement</DialogTitle>
          <DialogDescription>
            Créer une demande de mouvement budgétaire pour l'exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as 'virement' | 'ajustement')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="virement">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Virement
              </TabsTrigger>
              <TabsTrigger value="ajustement">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ajustement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {type === 'virement' && (
            <div className="space-y-2">
              <Label>Ligne source (à débiter) *</Label>
              <Select value={fromLineId} onValueChange={setFromLineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la ligne source..." />
                </SelectTrigger>
                <SelectContent>
                  {budgetLines?.map((line) => (
                    <SelectItem key={line.id} value={line.id} disabled={line.id === toLineId}>
                      {line.code} - {line.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromLine && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex gap-4 flex-wrap">
                    <span>Dotation: {formatCurrency(fromDotation)}</span>
                    <span
                      className={
                        fromDisponible < 0
                          ? 'text-destructive font-medium'
                          : 'text-green-600 font-medium'
                      }
                    >
                      Disponible: {formatCurrency(fromDisponible)}
                    </span>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <span>
                      Plafond LOLF 10 %: <strong>{formatCurrency(ceilingAbsolu)}</strong>
                    </span>
                    <span>Déjà viré: {formatCurrency(emisTotal)}</span>
                    <span
                      className={
                        ceilingRestant <= 0
                          ? 'text-destructive font-medium'
                          : 'text-blue-600 font-medium'
                      }
                    >
                      Marge restante: {formatCurrency(ceilingRestant)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-2">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ligne destination (à créditer) *</Label>
            <Select value={toLineId} onValueChange={setToLineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la ligne destination..." />
              </SelectTrigger>
              <SelectContent>
                {budgetLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id} disabled={line.id === fromLineId}>
                    {line.code} - {line.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {toLine && (
              <div className="text-sm text-muted-foreground">
                Dotation actuelle:{' '}
                {formatCurrency(toLine.dotation_modifiee || toLine.dotation_initiale)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={type === 'virement' ? fromDisponible : undefined}
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            {type === 'virement' && fromLine && amount > fromDisponible && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le montant dépasse le disponible de la ligne source (
                  {formatCurrency(fromDisponible)})
                </AlertDescription>
              </Alert>
            )}
            {type === 'virement' && fromLine && ceilingDepasse && (
              <Alert variant="destructive" data-testid="ceiling-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Plafond LOLF 10 % dépassé : le cumul virements émis depuis cette ligne ne peut pas
                  excéder <strong>{formatCurrency(ceilingAbsolu)}</strong>
                  {emisTotal > 0 && <> (dont déjà exécuté : {formatCurrency(emisTotal)})</>}. Marge
                  restante : <strong>{formatCurrency(ceilingRestant)}</strong>.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Justification *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif du mouvement..."
              rows={2}
            />
          </div>

          {type === 'ajustement' && (
            <div className="space-y-2">
              <Label htmlFor="justification_renforcee">
                Justification renforcée (obligatoire pour ajustement) *
              </Label>
              <Textarea
                id="justification_renforcee"
                value={justificationRenforcee}
                onChange={(e) => setJustificationRenforcee(e.target.value)}
                placeholder="Source des fonds, délibération, note de service..."
                rows={3}
              />
            </div>
          )}

          {/* Preview */}
          {toLine && amount > 0 && (
            <Card className="bg-muted/50 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Aperçu du mouvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {type === 'virement' && fromLine && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center">
                    <span className="font-mono text-xs truncate">{fromLine.code}</span>
                    <span className="text-xs sm:text-sm">
                      {formatCurrency(fromDotation)}
                      <ArrowRight className="inline h-3 w-3 mx-1" />
                      <span className="text-red-600 font-medium">
                        {formatCurrency(fromDotation - amount)}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center">
                  <span className="font-mono text-xs truncate">{toLine.code}</span>
                  <span className="text-xs sm:text-sm">
                    {formatCurrency(toLine.dotation_modifiee || toLine.dotation_initiale)}
                    <ArrowRight className="inline h-3 w-3 mx-1" />
                    <span className="text-green-600 font-medium">
                      {formatCurrency(
                        (toLine.dotation_modifiee || toLine.dotation_initiale) + amount
                      )}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le soumis'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
