import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Shield,
  Loader2,
  FileSearch,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const controleSdctSchema = z
  .object({
    montant_verifie: z.boolean(),
    imputation_correcte: z.boolean(),
    documents_complets: z.boolean(),
    calcul_retenues_ok: z.boolean(),
    observation: z.string().optional(),
    decision: z.enum(['valider', 'rejeter']),
    motif_rejet: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'rejeter' && !data.motif_rejet) {
        return false;
      }
      return true;
    },
    {
      message: 'Motif de rejet requis',
      path: ['motif_rejet'],
    }
  );

type ControleSdctFormData = z.infer<typeof controleSdctSchema>;

interface ControleSdctFormProps {
  liquidationId: string;
  liquidation: {
    id: string;
    numero: string;
    montant: number;
    montant_ht?: number;
    tva_montant?: number;
    net_a_payer?: number;
    service_fait?: boolean;
    current_step?: number;
    statut?: string;
    engagement?: {
      numero: string;
      montant: number;
      budget_line?: {
        code: string;
        label: string;
      };
    };
  };
  onSuccess?: () => void;
}

const CHECKLIST_ITEMS = [
  { key: 'montant_verifie', label: 'Montant conforme à la facture', icon: FileSearch },
  { key: 'imputation_correcte', label: 'Imputation budgétaire correcte', icon: ClipboardCheck },
  { key: 'documents_complets', label: 'Pièces justificatives complètes', icon: CheckCircle2 },
  {
    key: 'calcul_retenues_ok',
    label: 'Calcul des retenues correct (TVA, AIRSI, etc.)',
    icon: Shield,
  },
];

export function ControleSdctForm({ liquidationId, liquidation, onSuccess }: ControleSdctFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'valider' | 'rejeter' | null>(null);
  const { logAction } = useAuditLog();
  const { hasAnyRole } = usePermissions();

  // DAAF (ex-SDCT) fait le contrôle de la liquidation
  const canControl = hasAnyRole(['ADMIN', 'DAAF', 'DAF', 'SDCT']);
  const isServiceFaitDone = liquidation.service_fait === true;

  const form = useForm<ControleSdctFormData>({
    resolver: zodResolver(controleSdctSchema),
    defaultValues: {
      montant_verifie: false,
      imputation_correcte: false,
      documents_complets: false,
      calcul_retenues_ok: false,
      observation: '',
      decision: 'valider',
      motif_rejet: '',
    },
  });

  const allChecked =
    form.watch('montant_verifie') &&
    form.watch('imputation_correcte') &&
    form.watch('documents_complets') &&
    form.watch('calcul_retenues_ok');

  const handleValidate = () => {
    if (!allChecked) {
      toast.error('Veuillez valider tous les points de contrôle');
      return;
    }
    form.setValue('decision', 'valider');
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
    form.setValue('decision', 'rejeter');
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

      // Déterminer le nouveau statut
      // Après validation DAAF → validé_daaf (DG valide ensuite)
      const newStatut = isValidation ? 'validé_daaf' : 'rejete';
      const newStep = isValidation ? 2 : liquidation.current_step || 1;

      const { error } = await supabase
        .from('budget_liquidations')
        .update({
          statut: newStatut,
          current_step: newStep,
          workflow_status: isValidation ? 'en_validation' : 'rejete',
          ...(isValidation
            ? {}
            : {
                rejection_reason: formData.motif_rejet,
                rejected_at: new Date().toISOString(),
                rejected_by: user.id,
              }),
        })
        .eq('id', liquidationId);

      if (error) throw error;

      // Logger l'action
      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: isValidation ? 'validate' : 'reject',
        oldValues: {
          statut: liquidation.statut,
          current_step: liquidation.current_step,
        },
        newValues: {
          statut: newStatut,
          current_step: newStep,
          action_type: 'VALIDATION_DAAF',
          checklist: {
            montant_verifie: formData.montant_verifie,
            imputation_correcte: formData.imputation_correcte,
            documents_complets: formData.documents_complets,
            calcul_retenues_ok: formData.calcul_retenues_ok,
          },
          observation: formData.observation,
          ...(isValidation ? {} : { motif_rejet: formData.motif_rejet }),
          needs_dg_validation: needsDgValidation,
        },
      });

      // Notifier le DG si validation
      if (isValidation) {
        const { data: dgUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'DG');
        if (dgUsers?.length) {
          await supabase.from('notifications').insert(
            dgUsers.map((u) => ({
              user_id: u.user_id,
              type: 'validation',
              title: 'Liquidation à valider (DG)',
              message: `La liquidation ${liquidation.numero} a été validée par la DAAF et attend votre visa`,
              entity_type: 'liquidation',
              entity_id: liquidationId,
            }))
          );
        }
      }

      toast.success(
        isValidation ? 'Validation DAAF accordée — transmis au DG' : 'Liquidation rejetée'
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

  if (!isServiceFaitDone) {
    return (
      <Card className="border-warning/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium text-warning">Service fait non certifié</p>
              <p className="text-sm text-muted-foreground">
                Le service fait doit être certifié avant la validation DAAF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Validation DAAF
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Récapitulatif */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Engagement:</span>
                <span className="ml-2 font-medium">{liquidation.engagement?.numero}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ligne budg.:</span>
                <span className="ml-2 font-mono text-xs">
                  {liquidation.engagement?.budget_line?.code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Montant HT:</span>
                <span className="ml-2 font-medium">{formatCurrency(liquidation.montant_ht)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Net à payer:</span>
                <span className="ml-2 font-bold text-success">
                  {formatCurrency(liquidation.net_a_payer || liquidation.montant)}
                </span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-6">
              {/* Checklist de contrôle */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Points de contrôle
                </h4>
                {CHECKLIST_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <FormField
                      key={item.key}
                      control={form.control}
                      name={item.key as keyof ControleSdctFormData}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                              disabled={!canControl || loading}
                            />
                          </FormControl>
                          <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>

              <Separator />

              {/* Observation */}
              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations du contrôle</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notes ou remarques sur le contrôle..."
                        rows={3}
                        disabled={!canControl || loading}
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
                        disabled={!canControl || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alerte si pas de droit */}
              {!canControl && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Accès restreint</p>
                    <p className="text-muted-foreground">
                      Seul le rôle DAAF peut effectuer cette validation.
                    </p>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              {canControl && (
                <div className="flex justify-end gap-2">
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
                  <Button type="button" onClick={handleValidate} disabled={loading || !allChecked}>
                    {loading && pendingDecision === 'valider' && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider le contrôle
                  </Button>
                </div>
              )}

              {/* Indicateur seuil DG */}
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-secondary font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Workflow 2 étapes
                </div>
                <p className="text-muted-foreground mt-1">
                  Après validation DAAF, la liquidation sera transmise au DG pour validation finale.
                </p>
              </div>
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
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Confirmer la validation
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Confirmer le rejet
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {pendingDecision === 'valider'
                    ? `Vous confirmez la validation DAAF de la liquidation ${liquidation.numero}.`
                    : `Vous allez rejeter la liquidation ${liquidation.numero}.`}
                </p>
                {pendingDecision === 'rejeter' && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <strong>Motif:</strong> {form.getValues('motif_rejet')}
                  </div>
                )}
                {pendingDecision === 'valider' && (
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <p className="font-medium">→ Sera transmis au DG pour validation finale</p>
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
                pendingDecision === 'rejeter' ? 'bg-destructive hover:bg-destructive/90' : ''
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
