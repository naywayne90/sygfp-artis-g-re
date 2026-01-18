/**
 * SpendingCaseTimeline - Timeline avancée pour la chaîne de dépense
 *
 * Affiche toutes les étapes: SEF → AEF → Imputation → Passation → Engagement → Liquidation → Ordonnancement → Règlement
 * Avec statut, navigation et indicateurs visuels.
 *
 * Utilise le feature flag WORKFLOW_V2 pour activer les règles strictes.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ChevronRight,
  Lock,
  Unlock,
  SkipForward,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useFeatureFlag } from "@/lib/feature-flags/flags";
import {
  SpendingCase,
  SpendingStage,
  SpendingStepData,
  SPENDING_STAGES,
  STAGE_CONFIG,
  STAGE_ORDER,
  StepStatus,
  getSpendingProgress,
} from "@/types/spending-case";
import { useSpendingCase, useStagePermission } from "@/hooks/useSpendingCase";

// Configuration visuelle des étapes
const STAGE_VISUAL_CONFIG: Record<
  SpendingStage,
  {
    icon: typeof FileText;
    color: string;
    bgColor: string;
    route: string;
  }
> = {
  note_sef: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    route: "/notes-sef",
  },
  note_aef: {
    icon: FileEdit,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500",
    route: "/notes-aef",
  },
  imputation: {
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    route: "/execution/imputation",
  },
  passation_marche: {
    icon: ScrollText,
    color: "text-pink-600",
    bgColor: "bg-pink-500",
    route: "/execution/passation-marche",
  },
  engagement: {
    icon: Signature,
    color: "text-orange-600",
    bgColor: "bg-orange-500",
    route: "/engagements",
  },
  liquidation: {
    icon: Receipt,
    color: "text-amber-600",
    bgColor: "bg-amber-500",
    route: "/liquidations",
  },
  ordonnancement: {
    icon: FileOutput,
    color: "text-lime-600",
    bgColor: "bg-lime-500",
    route: "/ordonnancements",
  },
  reglement: {
    icon: Banknote,
    color: "text-green-600",
    bgColor: "bg-green-500",
    route: "/reglements",
  },
};

interface SpendingCaseTimelineProps {
  /** Dossier reference (format ARTIXXXX) */
  dossierRef?: string;
  /** Dossier ID */
  dossierId?: string;
  /** Pre-loaded spending case data */
  spendingCase?: SpendingCase;
  /** Show compact version */
  compact?: boolean;
  /** Show amounts on steps */
  showAmounts?: boolean;
  /** Show navigation buttons */
  showNavigation?: boolean;
  /** Highlight current step */
  highlightCurrent?: boolean;
  /** Callback on step click */
  onStepClick?: (stage: SpendingStage, entityId?: string) => void;
  /** Custom class */
  className?: string;
}

export function SpendingCaseTimeline({
  dossierRef,
  dossierId,
  spendingCase: initialSpendingCase,
  compact = false,
  showAmounts = true,
  showNavigation = false,
  highlightCurrent = true,
  onStepClick,
  className,
}: SpendingCaseTimelineProps) {
  const navigate = useNavigate();
  const workflowV2Enabled = useFeatureFlag("WORKFLOW_V2");
  const timelineAdvanced = useFeatureFlag("TIMELINE_ADVANCED");

  const [selectedStage, setSelectedStage] = useState<SpendingStage | null>(null);

  // Use hook if not provided
  const {
    spendingCase: loadedCase,
    isLoading,
    getAvailableTransitions,
    transition,
    isTransitioning,
  } = useSpendingCase({
    dossierRef,
    dossierId,
    enabled: !initialSpendingCase && !!(dossierRef || dossierId),
  });

  const spendingCase = initialSpendingCase || loadedCase;

  const getStepData = (stage: SpendingStage): SpendingStepData | undefined => {
    return spendingCase?.timeline.steps.find((s) => s.stage === stage);
  };

  const getStatusIcon = (status?: StepStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-white" />;
      case "deferred":
        return <Clock className="h-4 w-4 text-white" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-white animate-pulse" />;
      case "skipped":
        return <SkipForward className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: StepStatus, defaultColor?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "deferred":
        return "bg-yellow-500";
      case "in_progress":
        return defaultColor || "bg-primary";
      case "skipped":
        return "bg-gray-400";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = (status?: StepStatus) => {
    switch (status) {
      case "completed":
        return "Validé";
      case "rejected":
        return "Rejeté";
      case "deferred":
        return "Différé";
      case "in_progress":
        return "En cours";
      case "skipped":
        return "Ignoré";
      default:
        return "En attente";
    }
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(montant) + " F"
    );
  };

  const handleStepClick = (stage: SpendingStage) => {
    const stepData = getStepData(stage);
    if (onStepClick) {
      onStepClick(stage, stepData?.entityId);
    } else if (showNavigation && stepData?.entityId) {
      navigate(`${STAGE_VISUAL_CONFIG[stage].route}?id=${stepData.entityId}`);
    } else if (timelineAdvanced) {
      setSelectedStage(stage);
    }
  };

  const availableTransitions = spendingCase ? getAvailableTransitions() : [];
  const progress = spendingCase ? getSpendingProgress(spendingCase) : 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2 animate-pulse">
            {SPENDING_STAGES.map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="h-10 w-10 rounded-full bg-muted" />
                {i < SPENDING_STAGES.length - 1 && (
                  <div className="h-1 flex-1 mx-1 bg-muted" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!spendingCase) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun dossier chargé
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        {!compact && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Chaîne de la dépense
                {workflowV2Enabled && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Workflow V2
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{progress}%</span>
                <Progress value={progress} className="w-20 h-2" />
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={compact ? "py-3" : "pt-0"}>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {SPENDING_STAGES.map((stage, index) => {
              const stepData = getStepData(stage);
              const config = STAGE_CONFIG[stage];
              const visual = STAGE_VISUAL_CONFIG[stage];
              const Icon = visual.icon;
              const isCurrent = spendingCase.currentStage === stage;
              const canTransition = availableTransitions.includes(stage);

              return (
                <div
                  key={stage}
                  className="flex items-center flex-1 min-w-[60px]"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleStepClick(stage)}
                        className={cn(
                          "flex flex-col items-center w-full transition-all duration-300",
                          "cursor-pointer hover:opacity-80",
                          highlightCurrent && isCurrent && "scale-110"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative",
                            getStatusColor(stepData?.status, visual.bgColor),
                            isCurrent && "ring-4 ring-primary/30",
                            stepData?.status === "completed" &&
                              "shadow-lg shadow-green-200",
                            canTransition &&
                              "ring-2 ring-amber-400 ring-offset-2"
                          )}
                        >
                          {getStatusIcon(stepData?.status) || (
                            <Icon className="h-5 w-5 text-white opacity-70" />
                          )}
                          {workflowV2Enabled && stepData?.status === "pending" && (
                            <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-xs mt-1 text-center font-medium",
                            isCurrent && "text-primary",
                            stepData?.status === "completed" && "text-green-600",
                            stepData?.status === "rejected" && "text-red-600",
                            !stepData?.status && "text-muted-foreground"
                          )}
                        >
                          {compact ? config.shortLabel : config.label}
                        </span>
                        {showAmounts && stepData?.montant && !compact && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatMontant(stepData.montant)}
                          </span>
                        )}
                        {stepData?.date && !compact && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(stepData.date), "dd/MM", {
                              locale: fr,
                            })}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                        <p className="text-xs">
                          Statut:{" "}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              stepData?.status === "completed" &&
                                "bg-green-100 text-green-700",
                              stepData?.status === "rejected" &&
                                "bg-red-100 text-red-700"
                            )}
                          >
                            {getStatusLabel(stepData?.status)}
                          </Badge>
                        </p>
                        {stepData?.reference && (
                          <p className="text-xs">Réf: {stepData.reference}</p>
                        )}
                        {stepData?.montant && (
                          <p className="text-xs">
                            Montant:{" "}
                            {new Intl.NumberFormat("fr-FR").format(
                              stepData.montant
                            )}{" "}
                            FCFA
                          </p>
                        )}
                        {stepData?.date && (
                          <p className="text-xs">
                            Date:{" "}
                            {format(
                              new Date(stepData.date),
                              "dd/MM/yyyy HH:mm",
                              { locale: fr }
                            )}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Validation: {config.validationRole}
                        </p>
                        {canTransition && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <Unlock className="h-3 w-3" />
                            Transition disponible
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
                  {index < SPENDING_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-1 transition-colors duration-300 relative",
                        stepData?.status === "completed"
                          ? "bg-green-500"
                          : "bg-muted"
                      )}
                    >
                      {stepData?.status === "completed" && (
                        <ChevronRight className="absolute -right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
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
              {workflowV2Enabled && (
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Verrouillé</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Detail Dialog */}
      <StageDetailDialog
        stage={selectedStage}
        spendingCase={spendingCase}
        open={!!selectedStage}
        onOpenChange={(open) => !open && setSelectedStage(null)}
        onNavigate={(route) => navigate(route)}
      />
    </TooltipProvider>
  );
}

// Stage Detail Dialog Component
interface StageDetailDialogProps {
  stage: SpendingStage | null;
  spendingCase: SpendingCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (route: string) => void;
}

function StageDetailDialog({
  stage,
  spendingCase,
  open,
  onOpenChange,
  onNavigate,
}: StageDetailDialogProps) {
  if (!stage) return null;

  const config = STAGE_CONFIG[stage];
  const visual = STAGE_VISUAL_CONFIG[stage];
  const stepData = spendingCase.timeline.steps.find((s) => s.stage === stage);
  const { canValidate, userRole, requiredRole } = useStagePermission(stage);
  const Icon = visual.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", visual.bgColor)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            {config.label}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Statut</span>
            <Badge
              variant={
                stepData?.status === "completed"
                  ? "default"
                  : stepData?.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {stepData?.status === "completed"
                ? "Validé"
                : stepData?.status === "rejected"
                ? "Rejeté"
                : stepData?.status === "in_progress"
                ? "En cours"
                : "En attente"}
            </Badge>
          </div>

          {/* Reference */}
          {stepData?.reference && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Référence</span>
              <span className="font-mono">{stepData.reference}</span>
            </div>
          )}

          {/* Montant */}
          {stepData?.montant && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Montant</span>
              <span className="font-medium">
                {new Intl.NumberFormat("fr-FR").format(stepData.montant)} FCFA
              </span>
            </div>
          )}

          {/* Date */}
          {stepData?.date && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Date</span>
              <span>
                {format(new Date(stepData.date), "dd/MM/yyyy HH:mm", {
                  locale: fr,
                })}
              </span>
            </div>
          )}

          {/* Validation info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Rôle requis</span>
            <Badge variant="outline">{requiredRole}</Badge>
          </div>

          {/* Rejection reason */}
          {stepData?.rejectionReason && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg">
              <span className="text-sm font-medium">Motif de rejet:</span>
              <p className="text-sm mt-1">{stepData.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {stepData?.entityId && (
              <Button
                onClick={() => onNavigate(`${visual.route}?id=${stepData.entityId}`)}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir le détail
              </Button>
            )}
            {!stepData?.entityId && canValidate && (
              <Button
                variant="outline"
                onClick={() => onNavigate(visual.route)}
                className="flex-1"
              >
                Créer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SpendingCaseTimeline;
