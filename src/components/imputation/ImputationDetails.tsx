import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CreditCard,
  Target,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FolderOpen,
  Send,
} from 'lucide-react';
import { Imputation } from '@/hooks/useImputations';

interface ImputationDetailsProps {
  imputation: Imputation;
  onClose?: () => void;
  onSubmit?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReject?: (imputation: Imputation) => void;
  onDefer?: (imputation: Imputation) => void;
  onGoToDossier?: (dossierId: string) => void;
  canValidate?: boolean;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    a_valider: { label: 'À valider', className: 'bg-warning/10 text-warning border-warning/20' },
    valide: { label: 'Validée', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejetée',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Différée',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
  };
  const variant = variants[status] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export function ImputationDetails({
  imputation,
  onClose,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  onGoToDossier,
  canValidate = false,
}: ImputationDetailsProps) {
  const formatMontant = (montant: number) =>
    new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">{imputation.reference || 'Sans référence'}</h2>
            {getStatusBadge(imputation.statut)}
          </div>
          <p className="text-muted-foreground mt-1">{imputation.objet}</p>
        </div>
        <div className="flex gap-2">
          {imputation.dossier_id && onGoToDossier && (
            <Button
              variant="outline"
              onClick={() => onGoToDossier(imputation.dossier_id as string)}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Voir le dossier
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Référence:</span>
                <p className="font-medium font-mono">{imputation.reference || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Code imputation:</span>
                <p className="font-medium font-mono text-xs">{imputation.code_imputation || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Direction:</span>
                <p className="font-medium">
                  {imputation.direction?.sigle || imputation.direction?.label || '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Source financement:</span>
                <p className="font-medium capitalize">
                  {imputation.source_financement?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <span className="text-muted-foreground text-sm">Montant:</span>
              <p className="text-2xl font-bold text-primary">{formatMontant(imputation.montant)}</p>
            </div>

            {imputation.commentaire && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-sm">Commentaire:</span>
                  <p className="mt-1">{imputation.commentaire}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rattachement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Rattachement budgétaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Ligne budgétaire:</span>
              <p className="font-mono text-xs">{imputation.budget_line?.code || '-'}</p>
              <p className="text-sm">{imputation.budget_line?.label || ''}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Note AEF source:</span>
              <p className="font-mono">{imputation.note_aef?.numero || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground">Créée par</p>
                  <p className="font-medium">
                    {imputation.created_by_profile?.first_name}{' '}
                    {imputation.created_by_profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(imputation.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>

              {imputation.submitted_at && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Soumise</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(imputation.submitted_at), 'dd MMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {imputation.validated_at && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validée par</p>
                    <p className="font-medium">
                      {imputation.validated_by_profile?.first_name}{' '}
                      {imputation.validated_by_profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(imputation.validated_at), 'dd MMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {imputation.rejected_at && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rejetée</p>
                    <p className="text-sm">{imputation.motif_rejet}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(imputation.rejected_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {(imputation.statut === 'brouillon' ||
        (imputation.statut === 'a_valider' && canValidate)) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end gap-3">
              {imputation.statut === 'brouillon' && onSubmit && (
                <Button onClick={() => onSubmit(imputation.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  Soumettre pour validation
                </Button>
              )}
              {imputation.statut === 'a_valider' && canValidate && (
                <>
                  {onDefer && (
                    <Button variant="outline" onClick={() => onDefer(imputation)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Différer
                    </Button>
                  )}
                  {onReject && (
                    <Button variant="destructive" onClick={() => onReject(imputation)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  )}
                  {onValidate && (
                    <Button onClick={() => onValidate(imputation.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
