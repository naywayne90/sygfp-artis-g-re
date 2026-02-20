import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Liquidation,
  VALIDATION_STEPS,
  DOCUMENTS_REQUIS,
  requiresDgValidation,
  SEUIL_VALIDATION_DG,
} from '@/hooks/useLiquidations';
import { formatCurrency } from '@/lib/utils';
import { ServiceFaitForm } from './ServiceFaitForm';
import { ControleSdctForm } from './ControleSdctForm';
import { ValidationDgForm } from './ValidationDgForm';
import { LiquidationTimeline } from './LiquidationTimeline';
import { LiquidationBudgetImpact } from './LiquidationBudgetImpact';
import { DossierGED } from '@/components/ged';
import { DossierTimeline } from '@/components/dossier/DossierTimeline';
import { DossierAuditLog } from '@/components/dossier/DossierAuditLog';
import { DossierStepTimeline } from '@/components/shared/DossierStepTimeline';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { LiquidationChainNav } from './LiquidationChainNav';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Calendar,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  Shield,
  History,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { UrgentLiquidationBadge } from '@/components/liquidations/UrgentLiquidationBadge';
import { UrgentLiquidationToggle } from '@/components/liquidations/UrgentLiquidationToggle';

interface LiquidationDetailsProps {
  liquidation: Liquidation;
  onRefresh?: () => void;
}

const getStatusBadge = (statut: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground border-muted' },
    certifié_sf: {
      label: 'Service fait certifié',
      className:
        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    },
    soumis: { label: 'Soumis', className: 'bg-secondary/10 text-secondary border-secondary/20' },
    validé_daaf: {
      label: 'Validé DAAF',
      className:
        'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    },
    validé_dg: { label: 'Validé DG', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejeté',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: { label: 'Différé', className: 'bg-warning/10 text-warning border-warning/20' },
  };
  const variant = variants[statut || 'brouillon'] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export function LiquidationDetails({ liquidation, onRefresh }: LiquidationDetailsProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isUrgent = liquidation.reglement_urgent === true;

  const _getDocLabel = (code: string) => {
    return DOCUMENTS_REQUIS.find((d) => d.code === code)?.label || code;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['liquidations'] });
    queryClient.invalidateQueries({ queryKey: ['urgent-liquidations'] });
    queryClient.invalidateQueries({ queryKey: ['urgent-liquidations-count'] });
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{liquidation.numero}</h2>
            {isUrgent && (
              <UrgentLiquidationBadge
                variant="full"
                motif={liquidation.reglement_urgent_motif}
                date={liquidation.reglement_urgent_date}
              />
            )}
          </div>
          <p className="text-muted-foreground">
            Liquidation créée le{' '}
            {format(new Date(liquidation.created_at), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liquidation.statut === 'validé_dg' && liquidation.validated_at && (
            <QRCodeGenerator
              reference={liquidation.numero}
              type="LIQUIDATION"
              dateValidation={liquidation.validated_at}
              validateur="DG"
              size="sm"
              showHash
            />
          )}
          {getStatusBadge(liquidation.statut)}
        </div>
      </div>

      {/* Toggle urgence - visible pour les liquidations non finalisées */}
      {liquidation.statut !== 'validé_dg' && liquidation.statut !== 'rejete' && (
        <div className="flex items-center justify-end">
          <UrgentLiquidationToggle
            liquidationId={liquidation.id}
            liquidationNumero={liquidation.numero}
            isUrgent={isUrgent}
            currentMotif={liquidation.reglement_urgent_motif}
            variant="button"
            size="sm"
            onToggle={() => handleSuccess()}
          />
        </div>
      )}

      {/* Barre chaîne Passation > Engagement > Liquidation > Ordonnancement */}
      <LiquidationChainNav liquidation={liquidation} />

      {/* Timeline de la chaîne de dépense */}
      {liquidation.dossier_id && (
        <DossierStepTimeline
          dossierId={liquidation.dossier_id}
          highlightStep="liquidation"
          compact
          showNavigation
        />
      )}

      {/* Rejection/Defer reason */}
      {liquidation.statut === 'rejete' && liquidation.rejection_reason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Motif du rejet</div>
                <p className="text-sm mt-1">{liquidation.rejection_reason}</p>
                {liquidation.rejected_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Rejeté le{' '}
                    {format(new Date(liquidation.rejected_at), 'dd/MM/yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {liquidation.statut === 'differe' && liquidation.motif_differe && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <div className="font-medium text-warning">Motif du report</div>
                <p className="text-sm mt-1">{liquidation.motif_differe}</p>
                {liquidation.deadline_correction && (
                  <p className="text-sm mt-2">
                    Date de reprise prévue:{' '}
                    {format(new Date(liquidation.deadline_correction), 'dd/MM/yyyy', {
                      locale: fr,
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Engagement source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Numéro engagement:</span>
              <Button
                variant="link"
                className="ml-1 h-auto p-0 font-medium"
                onClick={() => navigate(`/engagements?detail=${liquidation.engagement_id}`)}
              >
                {liquidation.engagement?.numero || 'N/A'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div>
              <span className="text-muted-foreground">Montant engagé:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(liquidation.engagement?.montant || 0)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Objet:</span>
              <span className="ml-2 font-medium">{liquidation.engagement?.objet || 'N/A'}</span>
            </div>
            {liquidation.engagement?.marche && (
              <div>
                <span className="text-muted-foreground">Marché:</span>
                <Button
                  variant="link"
                  className="ml-1 h-auto p-0 font-medium"
                  onClick={() =>
                    navigate(
                      `/execution/passation-marche?detail=${liquidation.engagement?.marche?.id}`
                    )
                  }
                >
                  {liquidation.engagement.marche.numero || 'Voir marché'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Ligne budgétaire:</span>
              <span className="ml-2 font-medium">
                {liquidation.engagement?.budget_line?.code || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Direction:</span>
              <span className="ml-2 font-medium">
                {liquidation.engagement?.budget_line?.direction?.sigle ||
                  liquidation.engagement?.budget_line?.direction?.label ||
                  'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fournisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Fournisseur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-muted-foreground">Raison sociale:</span>
              <span className="ml-2 font-medium">
                {liquidation.engagement?.marche?.prestataire?.raison_sociale ||
                  liquidation.engagement?.fournisseur ||
                  'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Montants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Détail des montants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* HT → TVA → TTC */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground text-xs">Montant HT</div>
              <div className="font-bold">{formatCurrency(liquidation.montant_ht)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground text-xs">
                TVA ({liquidation.tva_taux || 0}%)
              </div>
              <div className="font-bold">{formatCurrency(liquidation.tva_montant)}</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <div className="text-muted-foreground text-xs">Montant TTC</div>
              <div className="font-bold text-primary">{formatCurrency(liquidation.montant)}</div>
            </div>
          </div>

          {/* Retenues fiscales */}
          {(!!liquidation.airsi_montant ||
            !!liquidation.retenue_source_montant ||
            !!liquidation.retenue_bic_montant ||
            !!liquidation.retenue_bnc_montant ||
            !!liquidation.penalites_retard ||
            !!liquidation.penalites_montant) && (
            <>
              <Separator />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Retenues fiscales
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {!!liquidation.airsi_montant && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                    <div className="text-muted-foreground text-xs">
                      AIRSI ({liquidation.airsi_taux || 0}%)
                    </div>
                    <div className="font-bold text-orange-700 dark:text-orange-400">
                      -{formatCurrency(liquidation.airsi_montant)}
                    </div>
                  </div>
                )}
                {!!liquidation.retenue_source_montant && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                    <div className="text-muted-foreground text-xs">
                      Retenue source ({liquidation.retenue_source_taux || 0}%)
                    </div>
                    <div className="font-bold text-orange-700 dark:text-orange-400">
                      -{formatCurrency(liquidation.retenue_source_montant)}
                    </div>
                  </div>
                )}
                {!!liquidation.retenue_bic_montant && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                    <div className="text-muted-foreground text-xs">
                      BIC ({liquidation.retenue_bic_taux || 0}%)
                    </div>
                    <div className="font-bold text-orange-700 dark:text-orange-400">
                      -{formatCurrency(liquidation.retenue_bic_montant)}
                    </div>
                  </div>
                )}
                {!!liquidation.retenue_bnc_montant && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                    <div className="text-muted-foreground text-xs">
                      BNC ({liquidation.retenue_bnc_taux || 0}%)
                    </div>
                    <div className="font-bold text-orange-700 dark:text-orange-400">
                      -{formatCurrency(liquidation.retenue_bnc_montant)}
                    </div>
                  </div>
                )}
                {!!(liquidation.penalites_montant || liquidation.penalites_retard) && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center border border-red-200 dark:border-red-800">
                    <div className="text-muted-foreground text-xs">
                      Pénalités
                      {liquidation.penalites_nb_jours
                        ? ` (${liquidation.penalites_nb_jours}j)`
                        : ''}
                    </div>
                    <div className="font-bold text-red-700 dark:text-red-400">
                      -
                      {formatCurrency(
                        liquidation.penalites_montant || liquidation.penalites_retard
                      )}
                    </div>
                  </div>
                )}
              </div>
              {!!liquidation.total_retenues && (
                <div className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Total retenues</span>
                  <span className="font-bold text-orange-700 dark:text-orange-400">
                    -{formatCurrency(liquidation.total_retenues)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Net à payer - proéminent */}
          <div className="p-4 bg-success/10 rounded-lg text-center border-2 border-success/30">
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Net à payer</div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(liquidation.net_a_payer)}
            </div>
            {liquidation.montant &&
              liquidation.net_a_payer &&
              liquidation.montant !== liquidation.net_a_payer && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(liquidation.montant)} TTC −{' '}
                  {formatCurrency(liquidation.total_retenues || 0)} retenues
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Service fait */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Service fait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Certifié:</span>
              {liquidation.service_fait ? (
                <Badge className="bg-success">Oui</Badge>
              ) : (
                <Badge variant="outline">Non</Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-2 font-medium">
                {liquidation.service_fait_date
                  ? format(new Date(liquidation.service_fait_date), 'dd/MM/yyyy', { locale: fr })
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Référence facture:</span>
              <span className="ml-2 font-medium">{liquidation.reference_facture || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Régime fiscal:</span>
              <span className="ml-2 font-medium">{liquidation.regime_fiscal || 'N/A'}</span>
            </div>
          </div>
          {liquidation.observation && (
            <div className="mt-4">
              <span className="text-muted-foreground">Observation:</span>
              <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{liquidation.observation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === SECTION VALIDATIONS === */}
      <Separator className="my-6" />

      {/* Formulaire Service Fait - pour saisie/certification */}
      {liquidation.statut !== 'validé_dg' && liquidation.statut !== 'rejete' && (
        <ServiceFaitForm
          liquidationId={liquidation.id}
          liquidation={{
            id: liquidation.id,
            numero: liquidation.numero,
            montant: liquidation.montant,
            service_fait: liquidation.service_fait,
            service_fait_date: liquidation.service_fait_date || undefined,
            service_fait_certifie_par: liquidation.service_fait_certifie_par || undefined,
            reference_facture: liquidation.reference_facture || undefined,
            observation: liquidation.observation || undefined,
            statut: liquidation.statut || undefined,
            created_by: liquidation.created_by || undefined,
            engagement: liquidation.engagement
              ? {
                  numero: liquidation.engagement.numero,
                  objet: liquidation.engagement.objet,
                  fournisseur: liquidation.engagement.fournisseur || undefined,
                }
              : undefined,
          }}
          onSuccess={handleSuccess}
          readOnly={liquidation.statut === 'certifié_sf'}
        />
      )}

      {/* Contrôle SDCT - affiché si service fait est certifié */}
      {liquidation.service_fait &&
        liquidation.statut !== 'validé_dg' &&
        liquidation.statut !== 'rejete' &&
        liquidation.statut !== 'validé_daaf' && (
          <ControleSdctForm
            liquidationId={liquidation.id}
            liquidation={{
              id: liquidation.id,
              numero: liquidation.numero,
              montant: liquidation.montant,
              montant_ht: liquidation.montant_ht || undefined,
              net_a_payer: liquidation.net_a_payer || undefined,
              service_fait: liquidation.service_fait,
              current_step: liquidation.current_step || undefined,
              statut: liquidation.statut || undefined,
              engagement: liquidation.engagement
                ? {
                    numero: liquidation.engagement.numero,
                    montant: liquidation.engagement.montant,
                    budget_line: liquidation.engagement.budget_line
                      ? {
                          code: liquidation.engagement.budget_line.code,
                          label: liquidation.engagement.budget_line.label,
                        }
                      : undefined,
                  }
                : undefined,
            }}
            onSuccess={handleSuccess}
          />
        )}

      {/* Validation DG - affiché si en attente de validation DG */}
      {liquidation.statut === 'validé_daaf' && (
        <ValidationDgForm
          liquidationId={liquidation.id}
          liquidation={{
            id: liquidation.id,
            numero: liquidation.numero,
            montant: liquidation.montant,
            montant_ht: liquidation.montant_ht || undefined,
            net_a_payer: liquidation.net_a_payer || undefined,
            statut: liquidation.statut || undefined,
            current_step: liquidation.current_step || undefined,
            service_fait: liquidation.service_fait,
            service_fait_date: liquidation.service_fait_date || undefined,
            reference_facture: liquidation.reference_facture || undefined,
            engagement: liquidation.engagement
              ? {
                  numero: liquidation.engagement.numero,
                  objet: liquidation.engagement.objet,
                  montant: liquidation.engagement.montant,
                  fournisseur: liquidation.engagement.fournisseur || undefined,
                  budget_line: liquidation.engagement.budget_line
                    ? {
                        code: liquidation.engagement.budget_line.code,
                        label: liquidation.engagement.budget_line.label,
                        direction: liquidation.engagement.budget_line.direction || undefined,
                      }
                    : undefined,
                }
              : undefined,
          }}
          onSuccess={handleSuccess}
        />
      )}

      <Separator className="my-6" />

      {/* GED Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            Gestion documentaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DossierGED
            entityType="liquidation"
            entityId={liquidation.id}
            dossierId={liquidation.dossier_id || undefined}
            reference={liquidation.numero}
            exercice={liquidation.exercice || undefined}
            etape="liquidation"
            showChecklist={true}
            readOnly={liquidation.statut === 'validé_dg'}
          />
        </CardContent>
      </Card>

      {/* Impact budgétaire */}
      <LiquidationBudgetImpact liquidation={liquidation} />

      {/* Workflow simplifié — Certifié SF → DAAF → DG (si requis) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Circuit de validation
            {requiresDgValidation(liquidation.montant) && (
              <Badge
                variant="outline"
                className="text-xs border-secondary/30 text-secondary ml-auto"
              >
                Seuil DG ({formatCurrency(SEUIL_VALIDATION_DG)})
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {VALIDATION_STEPS.map((step) => {
              const currentStep = liquidation.current_step || 0;
              const isCompleted = liquidation.statut === 'validé_dg' || step.order < currentStep;
              const isCurrent =
                step.order === currentStep &&
                (liquidation.statut === 'soumis' || liquidation.statut === 'validé_daaf');
              const isRejected = liquidation.statut === 'rejete' && step.order === currentStep;
              // Skip DG step if not required
              if (step.role === 'DG' && !requiresDgValidation(liquidation.montant)) return null;

              return (
                <div
                  key={step.order}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrent
                      ? 'bg-secondary/10 border border-secondary/30'
                      : isRejected
                        ? 'bg-destructive/10 border border-destructive/30'
                        : isCompleted
                          ? 'bg-success/10'
                          : 'bg-muted/50'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isRejected ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : isCurrent ? (
                    <AlertCircle className="h-5 w-5 text-secondary" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.role}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isCompleted
                        ? 'bg-success/10 text-success'
                        : isRejected
                          ? 'bg-destructive/10 text-destructive'
                          : isCurrent
                            ? 'bg-secondary/10 text-secondary'
                            : ''
                    }
                  >
                    {isCompleted
                      ? 'Validé'
                      : isRejected
                        ? 'Rejeté'
                        : isCurrent
                          ? 'En cours'
                          : 'En attente'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Audit */}
      <Separator className="my-6" />

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow" className="gap-1">
            <GitBranch className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <Shield className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4">
          <LiquidationTimeline liquidation={liquidation} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <DossierTimeline
            dossierId={liquidation.dossier_id || liquidation.id}
            entityType="liquidation"
            entityId={liquidation.id}
            maxItems={20}
            compact={true}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <DossierAuditLog
            entityType="liquidation"
            entityId={liquidation.id}
            title="Journal d'audit - Liquidation"
            maxItems={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
