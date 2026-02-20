import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Loader2,
  FileText,
  Banknote,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const validationDgSchema = z.object({
  observation: z.string().optional(),
  motif_rejet: z.string().optional(),
});

type ValidationDgFormData = z.infer<typeof validationDgSchema>;

interface ValidationDgFormProps {
  liquidationId: string;
  liquidation: {
    id: string;
    numero: string;
    montant: number;
    montant_ht?: number;
    net_a_payer?: number;
    statut?: string;
    current_step?: number;
    service_fait?: boolean;
    service_fait_date?: string;
    reference_facture?: string;
    engagement?: {
      numero: string;
      objet: string;
      montant: number;
      fournisseur?: string;
      budget_line?: {
        code: string;
        label: string;
        direction?: { label: string; sigle?: string };
      };
    };
  };
  onSuccess?: () => void;
}

export function ValidationDgForm({ liquidationId, liquidation, onSuccess }: ValidationDgFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'valider' | 'rejeter' | null>(null);
  const { logAction } = useAuditLog();
  const { hasAnyRole } = usePermissions();

  // Seul DG ou ADMIN peut valider
  const canValidate = hasAnyRole(['ADMIN', 'DG']);
  const isWaitingDg = liquidation.statut === 'validé_daaf';

  const form = useForm<ValidationDgFormData>({
    resolver: zodResolver(validationDgSchema),
    defaultValues: {
      observation: '',
      motif_rejet: '',
    },
  });

  const handleValidate = () => {
    setPendingDecision('valider');
    setShowConfirm(true);
  };

  const handleReject = () => {
    const motif = form.getValues('motif_rejet');
    if (!motif) {
      toast.error('Veuillez indiquer un motif de rejet');
      form.setFocus('motif_rejet');
      return;
    }
    setPendingDecision('rejeter');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const formData = form.getValues();
      const isValidation = pendingDecision === 'valider';

      const { error } = await supabase
        .from('budget_liquidations')
        .update({
          statut: isValidation ? 'validé_dg' : 'rejete',
          workflow_status: isValidation ? 'termine' : 'rejete',
          validated_at: isValidation ? new Date().toISOString() : null,
          validated_by: isValidation ? user.id : null,
          rejected_at: !isValidation ? new Date().toISOString() : null,
          rejected_by: !isValidation ? user.id : null,
          rejection_reason: !isValidation ? formData.motif_rejet : null,
          observation: formData.observation
            ? `${liquidation.engagement?.numero || ''} - DG: ${formData.observation}`
            : undefined,
        })
        .eq('id', liquidationId);

      if (error) throw error;

      // Impact budget : total_liquide += net_a_payer sur validation DG
      let budgetImpact: {
        budget_line_id: string;
        old_total_liquide: number;
        new_total_liquide: number;
        net_a_payer: number;
      } | null = null;

      if (isValidation) {
        // Récupérer l'engagement_id depuis la liquidation
        const { data: liqData } = await supabase
          .from('budget_liquidations')
          .select('engagement_id, net_a_payer, montant')
          .eq('id', liquidationId)
          .single();

        if (liqData?.engagement_id) {
          const netAPayer = liqData.net_a_payer || liqData.montant;
          const { data: engData } = await supabase
            .from('budget_engagements')
            .select('budget_line_id')
            .eq('id', liqData.engagement_id)
            .single();

          if (engData?.budget_line_id) {
            const { data: currentLine } = await supabase
              .from('budget_lines')
              .select('id, total_liquide')
              .eq('id', engData.budget_line_id)
              .single();

            if (currentLine) {
              const oldTotalLiquide = currentLine.total_liquide || 0;
              const newTotalLiquide = oldTotalLiquide + netAPayer;

              const { error: blError } = await supabase
                .from('budget_lines')
                .update({ total_liquide: newTotalLiquide })
                .eq('id', currentLine.id);

              if (blError) throw blError;

              budgetImpact = {
                budget_line_id: currentLine.id,
                old_total_liquide: oldTotalLiquide,
                new_total_liquide: newTotalLiquide,
                net_a_payer: netAPayer,
              };
            }
          }
        }
      }

      // Logger l'action
      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: isValidation ? 'validate' : 'reject',
        oldValues: {
          statut: liquidation.statut,
        },
        newValues: {
          statut: isValidation ? 'validé_dg' : 'rejete',
          action_type: 'VALIDATION_DG',
          observation: formData.observation,
          ...(isValidation ? {} : { motif_rejet: formData.motif_rejet }),
          ...(budgetImpact ? { budget_impact: budgetImpact } : {}),
        },
      });

      toast.success(
        isValidation ? 'Liquidation validée par le DG' : 'Liquidation rejetée par le DG'
      );

      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur:', error);
      toast.error('Erreur: ' + message);
    } finally {
      setLoading(false);
    }
  };

  if (!isWaitingDg) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/30">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-primary" />
            Validation Directeur Général
            <Badge className="bg-primary text-white ml-2">En attente</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Récapitulatif complet */}
          <div className="space-y-4 mb-6">
            {/* Engagement */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Engagement source
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Numéro:</span>
                  <span className="ml-2 font-medium">{liquidation.engagement?.numero}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Montant engagé:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(liquidation.engagement?.montant)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Objet:</span>
                  <span className="ml-2">{liquidation.engagement?.objet}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="ml-2">{liquidation.engagement?.fournisseur || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Direction:</span>
                  <span className="ml-2">
                    {liquidation.engagement?.budget_line?.direction?.sigle ||
                      liquidation.engagement?.budget_line?.direction?.label ||
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Montants liquidation */}
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Liquidation
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Montant HT</div>
                  <div className="font-bold">{formatCurrency(liquidation.montant_ht)}</div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Montant TTC</div>
                  <div className="font-bold">{formatCurrency(liquidation.montant)}</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <div className="text-xs text-muted-foreground">Net à payer</div>
                  <div className="font-bold text-success">
                    {formatCurrency(liquidation.net_a_payer || liquidation.montant)}
                  </div>
                </div>
              </div>
            </div>

            {/* Service fait */}
            {liquidation.service_fait && (
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg text-sm">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <span className="font-medium">Service fait certifié</span>
                  {liquidation.service_fait_date && (
                    <span className="text-muted-foreground ml-2">
                      le{' '}
                      {format(new Date(liquidation.service_fait_date), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  )}
                  {liquidation.reference_facture && (
                    <span className="text-muted-foreground ml-2">
                      - Réf: {liquidation.reference_facture}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <Form {...form}>
            <form className="space-y-6">
              {/* Observation */}
              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observation (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Commentaires éventuels..."
                        rows={2}
                        disabled={!canValidate || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motif de rejet */}
              <FormField
                control={form.control}
                name="motif_rejet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-destructive">
                      Motif de rejet (si applicable)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Indiquer le motif si vous souhaitez rejeter..."
                        rows={2}
                        disabled={!canValidate || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alerte si pas de droit */}
              {!canValidate && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Accès restreint</p>
                    <p className="text-muted-foreground">
                      Seul le Directeur Général peut valider cette liquidation.
                    </p>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              {canValidate && (
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    {loading && pendingDecision === 'rejeter' && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    type="button"
                    onClick={handleValidate}
                    disabled={loading}
                    className="bg-success hover:bg-success/90"
                  >
                    {loading && pendingDecision === 'valider' && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <Crown className="h-4 w-4 mr-2" />
                    Valider (DG)
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingDecision === 'valider' ? (
                <>
                  <Crown className="h-5 w-5 text-success" />
                  Confirmer la validation DG
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Confirmer le rejet DG
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {pendingDecision === 'valider'
                    ? `En tant que Directeur Général, vous validez définitivement la liquidation ${liquidation.numero} pour un montant de ${formatCurrency(liquidation.net_a_payer || liquidation.montant)}.`
                    : `Vous allez rejeter la liquidation ${liquidation.numero}.`}
                </p>
                {pendingDecision === 'rejeter' && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <strong>Motif:</strong> {form.getValues('motif_rejet')}
                  </div>
                )}
                {pendingDecision === 'valider' && (
                  <div className="bg-success/10 p-3 rounded-lg">
                    <p>✓ La liquidation passera à l'étape d'ordonnancement.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                pendingDecision === 'rejeter'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-success hover:bg-success/90'
              }
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
