/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  FileEdit,
  Target,
  ScrollText,
  Signature,
  Receipt,
  FileOutput,
  Banknote,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Define the expense chain steps
export const ETAPES_CHAINE_DEPENSE = [
  {
    key: 'note_sef',
    label: 'Note SEF',
    shortLabel: 'SEF',
    icon: FileText,
    color: 'bg-blue-500',
    route: '/notes-sef',
  },
  {
    key: 'note_aef',
    label: 'Note AEF',
    shortLabel: 'AEF',
    icon: FileEdit,
    color: 'bg-indigo-500',
    route: '/notes-dg',
  },
  {
    key: 'imputation',
    label: 'Imputation',
    shortLabel: 'IMP',
    icon: Target,
    color: 'bg-purple-500',
    route: '/imputations',
  },
  {
    key: 'expression_besoin',
    label: 'Expr. Besoin',
    shortLabel: 'EB',
    icon: FileEdit,
    color: 'bg-fuchsia-500',
    route: '/execution/expression-besoin',
  },
  {
    key: 'passation_marche',
    label: 'Passation',
    shortLabel: 'PM',
    icon: ScrollText,
    color: 'bg-pink-500',
    route: '/passation-marche',
  },
  {
    key: 'engagement',
    label: 'Engagement',
    shortLabel: 'ENG',
    icon: Signature,
    color: 'bg-orange-500',
    route: '/engagements',
  },
  {
    key: 'liquidation',
    label: 'Liquidation',
    shortLabel: 'LIQ',
    icon: Receipt,
    color: 'bg-amber-500',
    route: '/liquidations',
  },
  {
    key: 'ordonnancement',
    label: 'Ordonnancement',
    shortLabel: 'ORD',
    icon: FileOutput,
    color: 'bg-lime-500',
    route: '/ordonnancements',
  },
  {
    key: 'reglement',
    label: 'Règlement',
    shortLabel: 'REG',
    icon: Banknote,
    color: 'bg-green-500',
    route: '/reglements',
  },
];

interface StepData {
  key: string;
  status: 'completed' | 'current' | 'pending' | 'rejected' | 'deferred';
  date?: string;
  montant?: number;
  reference?: string;
  entityId?: string;
}

interface DossierStepTimelineProps {
  /** Dossier ID to fetch steps for */
  dossierId?: string;
  /** Current step key (if not using dossierId) */
  currentStep?: string;
  /** Pre-loaded step data (if not using dossierId) */
  stepsData?: StepData[];
  /** Show compact version */
  compact?: boolean;
  /** Show amounts on steps */
  showAmounts?: boolean;
  /** Highlight a specific step */
  highlightStep?: string;
  /** Callback when clicking on a step */
  onStepClick?: (step: string, entityId?: string) => void;
  /** Show navigation buttons */
  showNavigation?: boolean;
  /** Custom class */
  className?: string;
}

export function DossierStepTimeline({
  dossierId,
  currentStep,
  stepsData: initialStepsData,
  compact = false,
  showAmounts = true,
  highlightStep,
  onStepClick,
  showNavigation = false,
  className,
}: DossierStepTimelineProps) {
  const [stepsData, setStepsData] = useState<StepData[]>(initialStepsData || []);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadDossierSteps = useCallback(async () => {
    if (!dossierId) return;

    setLoading(true);
    try {
      // Fetch dossier etapes
      const { data: etapes, error } = await supabase
        .from('dossier_etapes')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Also fetch dossier info for current step
      const { data: dossier } = await supabase
        .from('dossiers')
        .select('etape_courante')
        .eq('id', dossierId)
        .single();

      const currentStepKey = dossier?.etape_courante || '';
      const currentIndex = ETAPES_CHAINE_DEPENSE.findIndex((e) => e.key === currentStepKey);

      // Map etapes to steps
      const mapped: StepData[] = ETAPES_CHAINE_DEPENSE.map((etapeConfig, index) => {
        const etapeDossier = etapes?.find((e) => e.type_etape === etapeConfig.key);

        let status: StepData['status'] = 'pending';
        if (etapeDossier) {
          if (etapeDossier.statut === 'valide' || etapeDossier.statut === 'termine') {
            status = 'completed';
          } else if (etapeDossier.statut === 'rejete') {
            status = 'rejected';
          } else if (etapeDossier.statut === 'differe') {
            status = 'deferred';
          } else if (index === currentIndex) {
            status = 'current';
          }
        } else if (index < currentIndex) {
          // Implicit completion if before current step
          status = 'completed';
        } else if (index === currentIndex) {
          status = 'current';
        }

        return {
          key: etapeConfig.key,
          status,
          date: etapeDossier?.created_at,
          montant: etapeDossier?.montant,
          reference: etapeDossier?.reference,
          entityId: etapeDossier?.ref_id,
        };
      });

      setStepsData(mapped);
    } catch (error) {
      console.error('Error loading dossier steps:', error);
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (dossierId && !initialStepsData) {
      loadDossierSteps();
    }
  }, [dossierId, initialStepsData, loadDossierSteps]);

  useEffect(() => {
    if (initialStepsData) {
      setStepsData(initialStepsData);
    }
  }, [initialStepsData]);

  // If we only have currentStep, generate stepsData from it
  useEffect(() => {
    if (currentStep && !dossierId && !initialStepsData) {
      const currentIndex = ETAPES_CHAINE_DEPENSE.findIndex((e) => e.key === currentStep);
      const generated: StepData[] = ETAPES_CHAINE_DEPENSE.map((etape, index) => ({
        key: etape.key,
        status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending',
      }));
      setStepsData(generated);
    }
  }, [currentStep, dossierId, initialStepsData]);

  const getStepStatus = (key: string): StepData | undefined => {
    return stepsData.find((s) => s.key === key);
  };

  const getStatusIcon = (status?: StepData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-white" />;
      case 'deferred':
        return <Clock className="h-4 w-4 text-white" />;
      case 'current':
        return <AlertCircle className="h-4 w-4 text-white animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: StepData['status'], defaultColor?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'deferred':
        return 'bg-yellow-500';
      case 'current':
        return defaultColor || 'bg-primary';
      default:
        return 'bg-muted';
    }
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(montant) + ' F'
    );
  };

  const handleStepClick = (etape: (typeof ETAPES_CHAINE_DEPENSE)[0], stepData?: StepData) => {
    if (onStepClick) {
      onStepClick(etape.key, stepData?.entityId);
    } else if (showNavigation && stepData?.entityId) {
      navigate(`${etape.route}?id=${stepData.entityId}`);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2">
            {ETAPES_CHAINE_DEPENSE.map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                {i < ETAPES_CHAINE_DEPENSE.length - 1 && <Skeleton className="h-1 flex-1 mx-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        {!compact && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Chaîne de la dépense
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? 'py-3' : 'pt-0'}>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {ETAPES_CHAINE_DEPENSE.map((etape, index) => {
              const stepData = getStepStatus(etape.key);
              const isHighlighted = highlightStep === etape.key;
              const Icon = etape.icon;

              return (
                <div key={etape.key} className="flex items-center flex-1 min-w-[60px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleStepClick(etape, stepData)}
                        className={cn(
                          'flex flex-col items-center w-full transition-all duration-300',
                          (onStepClick || (showNavigation && stepData?.entityId)) &&
                            'cursor-pointer hover:opacity-80',
                          isHighlighted && 'scale-110'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                            getStatusColor(stepData?.status, etape.color),
                            stepData?.status === 'current' && 'ring-4 ring-primary/30',
                            stepData?.status === 'completed' && 'shadow-lg shadow-green-200',
                            isHighlighted && 'ring-4 ring-amber-400'
                          )}
                        >
                          {getStatusIcon(stepData?.status) || (
                            <Icon className="h-5 w-5 text-white opacity-70" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-xs mt-1 text-center font-medium',
                            stepData?.status === 'current' && 'text-primary',
                            stepData?.status === 'completed' && 'text-green-600',
                            stepData?.status === 'rejected' && 'text-red-600',
                            !stepData?.status && 'text-muted-foreground'
                          )}
                        >
                          {compact ? etape.shortLabel : etape.label}
                        </span>
                        {showAmounts && stepData?.montant && !compact && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatMontant(stepData.montant)}
                          </span>
                        )}
                        {stepData?.date && !compact && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(stepData.date), 'dd/MM', { locale: fr })}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{etape.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Statut:{' '}
                          {stepData?.status === 'completed'
                            ? 'Validé'
                            : stepData?.status === 'current'
                              ? 'En cours'
                              : stepData?.status === 'rejected'
                                ? 'Rejeté'
                                : stepData?.status === 'deferred'
                                  ? 'Différé'
                                  : 'En attente'}
                        </p>
                        {stepData?.reference && (
                          <p className="text-xs">Réf: {stepData.reference}</p>
                        )}
                        {stepData?.montant && (
                          <p className="text-xs">
                            Montant: {new Intl.NumberFormat('fr-FR').format(stepData.montant)} FCFA
                          </p>
                        )}
                        {stepData?.date && (
                          <p className="text-xs">
                            Date:{' '}
                            {format(new Date(stepData.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </p>
                        )}
                        {showNavigation && stepData?.entityId && (
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />
                            Cliquer pour voir
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Connector line */}
                  {index < ETAPES_CHAINE_DEPENSE.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-1 transition-colors duration-300',
                        stepData?.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend for compact mode */}
          {compact && (
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Validé</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span>En attente</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
