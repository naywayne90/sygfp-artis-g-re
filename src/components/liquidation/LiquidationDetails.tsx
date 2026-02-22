import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Liquidation,
  VALIDATION_STEPS,
  requiresDgValidation,
  SEUIL_VALIDATION_DG,
  fetchSiblingLiquidations,
  SiblingLiquidation,
} from '@/hooks/useLiquidations';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { CalculsFiscaux } from './CalculsFiscaux';
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
import { supabase } from '@/integrations/supabase/client';
import {
  Building,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  History,
  Link2,
  ExternalLink,
  Calculator,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { UrgentLiquidationBadge } from '@/components/liquidations/UrgentLiquidationBadge';
import { UrgentLiquidationToggle } from '@/components/liquidations/UrgentLiquidationToggle';
import { downloadLiquidationPdf } from '@/services/liquidationPdfService';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [certifierName, setCertifierName] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<SiblingLiquidation[]>([]);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const isUrgent = liquidation.reglement_urgent === true;

  // Récupérer les liquidations "sœurs" du même engagement
  useEffect(() => {
    if (liquidation.engagement_id) {
      fetchSiblingLiquidations(liquidation.engagement_id)
        .then(setSiblings)
        .catch(() => setSiblings([]));
    }
  }, [liquidation.engagement_id, liquidation.statut]);

  // Calcul progression de l'engagement
  const montantEngage = liquidation.engagement?.montant || 0;
  const totalLiquide = siblings.reduce((s, l) => s + (l.montant || 0), 0);
  const _restantALiquider = montantEngage - totalLiquide;
  const _pourcentLiquide =
    montantEngage > 0 ? Math.min((totalLiquide / montantEngage) * 100, 100) : 0;
  const currentTrancheIndex = siblings.findIndex((s) => s.id === liquidation.id);
  const trancheNumero = currentTrancheIndex >= 0 ? currentTrancheIndex + 1 : siblings.length + 1;

  // Récupérer le nom du certificateur du service fait
  useEffect(() => {
    if (liquidation.service_fait_certifie_par) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', liquidation.service_fait_certifie_par)
        .single()
        .then(({ data }) => {
          setCertifierName(data?.full_name || null);
        });
    } else {
      setCertifierName(null);
    }
  }, [liquidation.service_fait_certifie_par]);

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      await downloadLiquidationPdf({ liquidation });
      toast.success('Attestation PDF générée avec succès');
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['liquidations'] });
    queryClient.invalidateQueries({ queryKey: ['urgent-liquidations'] });
    queryClient.invalidateQueries({ queryKey: ['urgent-liquidations-count'] });
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER — toujours visible (au-dessus des onglets)
          ═══════════════════════════════════════════════════════════════════════ */}
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
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isPdfLoading}>
            {isPdfLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Attestation PDF
          </Button>
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

      {/* Toggle urgence */}
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

      {/* Alertes rejet / report — toujours visibles */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          6 ONGLETS
          ═══════════════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="infos" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="infos" className="gap-1">
            <Receipt className="h-3 w-3" />
            <span className="hidden sm:inline">Infos</span>
          </TabsTrigger>
          <TabsTrigger value="calculs" className="gap-1">
            <Calculator className="h-3 w-3" />
            <span className="hidden sm:inline">Calculs</span>
          </TabsTrigger>
          <TabsTrigger value="service-fait" className="gap-1">
            <ClipboardCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Service fait</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FolderOpen className="h-3 w-3" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1">
            <History className="h-3 w-3" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
          <TabsTrigger value="chaine" className="gap-1">
            <Link2 className="h-3 w-3" />
            <span className="hidden sm:inline">Chaîne</span>
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 1 — INFORMATIONS
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="infos" className="mt-4 space-y-4">
          {/* Engagement source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
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

          {/* Suivi de l'engagement — progression de consommation */}
          {(() => {
            const othersCount = siblings.filter((s) => s.id !== liquidation.id).length;
            const othersTotal = siblings
              .filter((s) => s.id !== liquidation.id)
              .reduce((s, l) => s + (l.montant || 0), 0);
            const cumulApres = othersTotal + liquidation.montant;
            const resteApres = montantEngage - cumulApres;
            const tauxApres =
              montantEngage > 0 ? Math.min((cumulApres / montantEngage) * 100, 100) : 0;
            const progressColorClass =
              tauxApres > 95
                ? '[&>div]:bg-destructive'
                : tauxApres >= 80
                  ? '[&>div]:bg-warning'
                  : '';

            return (
              <Card className={resteApres <= 0 ? 'border-success/50' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5" />
                    Suivi de l'engagement
                    {siblings.length > 1 && (
                      <Badge variant="outline" className="ml-auto text-xs font-mono">
                        Tranche {trancheNumero}/{siblings.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Détail chiffré */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Engagement :</span>
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
                      <span className="text-muted-foreground">Montant engagé :</span>
                      <span className="ml-2 font-bold">{formatCurrency(montantEngage)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Déjà liquidé :</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(othersTotal)}
                        {othersCount > 0 && (
                          <span className="text-muted-foreground ml-1">({othersCount})</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cette liquidation :</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(liquidation.montant)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Reste après :</span>
                      <span
                        className={`ml-2 font-bold ${resteApres <= 0 ? 'text-success' : resteApres < montantEngage * 0.05 ? 'text-warning' : ''}`}
                      >
                        {formatCurrency(Math.max(resteApres, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression colorée */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taux de consommation</span>
                      <span className="font-medium">{tauxApres.toFixed(1)}%</span>
                    </div>
                    <Progress value={tauxApres} className={`h-3 ${progressColorClass}`} />
                  </div>

                  {/* Liste des tranches (si plusieurs) */}
                  {siblings.length > 1 && (
                    <div className="space-y-1">
                      {siblings.map((sib, idx) => {
                        const isCurrent = sib.id === liquidation.id;
                        return (
                          <div
                            key={sib.id}
                            className={`flex items-center gap-3 p-2 rounded text-sm ${
                              isCurrent ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
                            }`}
                          >
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                              T{idx + 1}
                            </Badge>
                            <span className={`flex-1 truncate ${isCurrent ? 'font-medium' : ''}`}>
                              {sib.numero}
                            </span>
                            <span className="font-mono text-xs">{formatCurrency(sib.montant)}</span>
                            {getStatusBadge(sib.statut)}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {resteApres <= 0 && (
                    <div className="flex items-center gap-2 text-success text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Engagement intégralement liquidé
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Fournisseur / Prestataire */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
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

          {/* Service fait — résumé lecture seule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-5 w-5" />
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
                      ? format(new Date(liquidation.service_fait_date), 'dd/MM/yyyy', {
                          locale: fr,
                        })
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
                <p className="mt-3 text-sm bg-muted p-3 rounded">{liquidation.observation}</p>
              )}
            </CardContent>
          </Card>

          {/* Circuit de validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
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
                  const isCompleted =
                    liquidation.statut === 'validé_dg' || step.order < currentStep;
                  const isCurrent =
                    step.order === currentStep &&
                    (liquidation.statut === 'soumis' || liquidation.statut === 'validé_daaf');
                  const isRejected = liquidation.statut === 'rejete' && step.order === currentStep;

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
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 2 — CALCULS FISCAUX
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="calculs" className="mt-4">
          <CalculsFiscaux
            montantHT={liquidation.montant_ht || 0}
            initialValues={{
              tva_applicable: liquidation.tva_applicable ?? true,
              tva_taux: liquidation.tva_taux || 0,
              tva_montant: liquidation.tva_montant || 0,
              montant_ttc: liquidation.montant || 0,
              airsi_taux: liquidation.airsi_taux || 0,
              airsi_montant: liquidation.airsi_montant || 0,
              retenue_bic_taux: liquidation.retenue_bic_taux || 0,
              retenue_bic_montant: liquidation.retenue_bic_montant || 0,
              retenue_bnc_taux: liquidation.retenue_bnc_taux || 0,
              retenue_bnc_montant: liquidation.retenue_bnc_montant || 0,
              penalites_montant: liquidation.penalites_montant || 0,
              penalites_nb_jours: liquidation.penalites_nb_jours || 0,
              penalites_taux_journalier: liquidation.penalites_taux_journalier || 0,
              total_retenues: liquidation.total_retenues || 0,
              net_a_payer: liquidation.net_a_payer || 0,
              retenue_source_taux: liquidation.retenue_source_taux || 0,
              retenue_source_montant: liquidation.retenue_source_montant || 0,
            }}
            onChange={() => {}}
            readOnly={true}
          />
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 3 — SERVICE FAIT
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="service-fait" className="mt-4 space-y-4">
          {/* Statut de la certification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-5 w-5" />
                Certification du service fait
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                {liquidation.service_fait ? (
                  <Badge className="bg-success text-white gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Certifié
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3.5 w-3.5" /> Non certifié
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date SF:</span>
                  <span className="ml-2 font-medium">
                    {liquidation.service_fait_date
                      ? format(new Date(liquidation.service_fait_date), 'dd/MM/yyyy', {
                          locale: fr,
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Certifié par:</span>
                  <span className="ml-2 font-medium">{certifierName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Réf facture:</span>
                  <span className="ml-2 font-medium">{liquidation.reference_facture || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Régime fiscal:</span>
                  <span className="ml-2 font-medium">{liquidation.regime_fiscal || 'N/A'}</span>
                </div>
              </div>
              {liquidation.observation && (
                <p className="mt-3 text-sm bg-muted p-3 rounded">{liquidation.observation}</p>
              )}
            </CardContent>
          </Card>

          {/* Formulaire de certification */}
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

          {/* Contrôle SDCT / Validation DAAF */}
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

          {/* Validation DG */}
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
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 4 — DOCUMENTS
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-5 w-5" />
                Pièces justificatives
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

          <LiquidationBudgetImpact liquidation={liquidation} />
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 5 — HISTORIQUE
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="historique" className="mt-4 space-y-6">
          <LiquidationTimeline liquidation={liquidation} />

          <Separator />

          <DossierTimeline
            dossierId={liquidation.dossier_id || liquidation.id}
            entityType="liquidation"
            entityId={liquidation.id}
            maxItems={20}
            compact={true}
          />

          <Separator />

          <DossierAuditLog
            entityType="liquidation"
            entityId={liquidation.id}
            title="Journal d'audit - Liquidation"
            maxItems={50}
          />
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────────
            ONGLET 6 — CHAÎNE
            ───────────────────────────────────────────────────────────────────── */}
        <TabsContent value="chaine" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chaîne de la dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Navigation chaîne existante */}
              <LiquidationChainNav liquidation={liquidation} />

              {/* Timeline dossier */}
              {liquidation.dossier_id && (
                <DossierStepTimeline
                  dossierId={liquidation.dossier_id}
                  highlightStep="liquidation"
                  compact
                  showNavigation
                />
              )}

              {/* 3 colonnes : Engagement → Liquidation → Ordonnancement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Engagement */}
                <Card className="border-2 border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold">{liquidation.engagement?.numero || 'N/A'}</div>
                    <div className="text-sm">
                      {formatCurrency(liquidation.engagement?.montant || 0)}
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-1"
                      onClick={() => navigate(`/engagements?detail=${liquidation.engagement_id}`)}
                    >
                      Voir détails <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Liquidation (courante) */}
                <Card className="border-2 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary">Liquidation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold">{liquidation.numero}</div>
                    <div className="text-sm">{formatCurrency(liquidation.net_a_payer)}</div>
                    <div className="mt-1">{getStatusBadge(liquidation.statut)}</div>
                  </CardContent>
                </Card>

                {/* Ordonnancement */}
                <Card className="border-2 border-muted border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Ordonnancement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">À venir</div>
                  </CardContent>
                </Card>
              </div>

              {/* Bouton "Créer l'ordonnancement" si validé_dg */}
              {liquidation.statut === 'validé_dg' && (
                <Button
                  className="w-full"
                  onClick={() => navigate(`/ordonnancements?sourceLiquidation=${liquidation.id}`)}
                >
                  Créer l'ordonnancement →
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
