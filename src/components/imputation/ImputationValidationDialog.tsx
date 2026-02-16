import { useQuery } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatMontant } from '@/lib/config/sygfp-constants';
import { type Imputation } from '@/hooks/useImputations';
import { CheckCircle, AlertTriangle, Loader2, Info, ShieldAlert } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface BudgetImpactPreview {
  success: boolean;
  error?: string;
  has_budget_line?: boolean;
  reference?: string;
  objet?: string;
  montant?: number;
  statut?: string;
  forced?: boolean;
  budget_line_id?: string;
  budget_code?: string;
  budget_label?: string;
  dotation?: number;
  engage?: number;
  reserve?: number;
  disponible_avant?: number;
  disponible_apres?: number;
  is_sufficient?: boolean;
}

interface ImputationValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imputation: Imputation | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

// ============================================
// HOOK
// ============================================

function useBudgetImpactPreview(imputationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['budget-impact-preview', imputationId],
    queryFn: async () => {
      if (!imputationId) return null;
      const { data, error } = await supabase.rpc(
        'get_budget_impact_preview' as 'acknowledge_budget_alert',
        { p_imputation_id: imputationId } as never
      );
      if (error) throw error;
      return data as unknown as BudgetImpactPreview;
    },
    enabled: enabled && !!imputationId,
    staleTime: 0,
    gcTime: 0,
  });
}

// ============================================
// COMPONENT
// ============================================

export function ImputationValidationDialog({
  open,
  onOpenChange,
  imputation,
  onConfirm,
  isLoading = false,
}: ImputationValidationDialogProps) {
  const {
    data: preview,
    isLoading: loadingPreview,
    error: previewError,
  } = useBudgetImpactPreview(imputation?.id ?? null, open && !!imputation);

  const hasBudgetLine = preview?.has_budget_line ?? false;
  const isSufficient = preview?.is_sufficient ?? true;
  const isForced = preview?.forced ?? false;

  // Calcul du ratio de consommation
  const dotation = preview?.dotation ?? 0;
  const totalConsomme =
    (preview?.engage ?? 0) + (preview?.reserve ?? 0) + (imputation?.montant ?? 0);
  const ratio = dotation > 0 ? Math.min((totalConsomme / dotation) * 100, 100) : 0;

  const canConfirm = !loadingPreview && !previewError && (isSufficient || isForced);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Valider l'imputation
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ref: <span className="font-medium">{imputation?.reference || 'N/A'}</span>
            {' \u2014 '}Montant:{' '}
            <span className="font-semibold text-foreground">
              {formatMontant(imputation?.montant ?? 0)}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Contenu principal */}
        <div className="space-y-4 py-2">
          {/* Loading state */}
          {loadingPreview && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Calcul de l'impact budgétaire...
              </span>
            </div>
          )}

          {/* Error state */}
          {previewError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Impossible de calculer l'impact budgétaire :{' '}
                {previewError instanceof Error ? previewError.message : 'Erreur inconnue'}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview OK but no budget line */}
          {preview && !loadingPreview && !hasBudgetLine && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aucune ligne budgétaire</AlertTitle>
              <AlertDescription>
                Cette imputation n'est pas rattachée à une ligne budgétaire. Aucune réservation de
                crédits ne sera effectuée.
              </AlertDescription>
            </Alert>
          )}

          {/* Budget impact card */}
          {preview && !loadingPreview && hasBudgetLine && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Impact budgétaire
                </h4>

                {/* Ligne budgétaire */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ligne budgétaire</span>
                  <span className="font-mono text-xs text-right max-w-[60%] truncate">
                    {preview.budget_code} — {preview.budget_label}
                  </span>
                </div>

                {/* Dotation */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dotation actuelle</span>
                  <span className="font-mono">{formatMontant(preview.dotation ?? 0)}</span>
                </div>

                {/* Engage */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Déjà engagé</span>
                  <span className="font-mono text-orange-600">
                    {formatMontant(preview.engage ?? 0)}
                  </span>
                </div>

                {/* Reserve */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Déjà réservé</span>
                  <span className="font-mono text-orange-600">
                    {formatMontant(preview.reserve ?? 0)}
                  </span>
                </div>

                {/* Disponible avant */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disponible avant</span>
                  <span className="font-mono font-medium">
                    {formatMontant(preview.disponible_avant ?? 0)}
                  </span>
                </div>

                <Separator />

                {/* Montant à réserver */}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-primary">Montant à réserver</span>
                  <span className="font-mono font-bold text-primary">
                    {formatMontant(imputation?.montant ?? 0)}
                  </span>
                </div>

                {/* Disponible après */}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Disponible après</span>
                  <span
                    className={`font-mono font-bold ${
                      (preview.disponible_apres ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'
                    }`}
                  >
                    {formatMontant(preview.disponible_apres ?? 0)}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Consommation</span>
                    <span
                      className={
                        ratio >= 90
                          ? 'text-destructive'
                          : ratio >= 70
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }
                    >
                      {ratio.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={ratio} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerte budget insuffisant */}
          {preview && !loadingPreview && hasBudgetLine && !isSufficient && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Budget insuffisant</AlertTitle>
              <AlertDescription>
                Le disponible sera négatif après cette validation.
                {isForced
                  ? " L'imputation est forcée : la validation est autorisée malgré le dépassement."
                  : ' Un dépassement nécessite une justification et un virement correctif.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Info box */}
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Cette action est irréversible. Le montant sera réservé sur la ligne budgétaire et le
                disponible diminuera en conséquence.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={!canConfirm || isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmer la validation
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
