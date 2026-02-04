// @ts-nocheck
/**
 * LiquidationTimeline - Timeline du workflow de liquidation
 *
 * Affiche l'historique des étapes du workflow:
 * CRÉATION → SERVICE FAIT → SOUMISSION → VALIDATION (multi-step SAF→CB→DAF→DG) → VALIDÉ/REJETÉ
 *
 * Avec dates, acteurs et motifs si applicable
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileEdit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Users,
  FileCheck,
  Receipt,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Liquidation, VALIDATION_STEPS, useLiquidations } from "@/hooks/useLiquidations";

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "rejected";
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
}

interface ValidationStep {
  id: string;
  step_order: number;
  role: string;
  status: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { full_name: string | null } | null;
}

interface LiquidationTimelineProps {
  liquidation: Liquidation;
  compact?: boolean;
  className?: string;
}

export function LiquidationTimeline({
  liquidation,
  compact = false,
  className,
}: LiquidationTimelineProps) {
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const { getValidationSteps } = useLiquidations();

  useEffect(() => {
    if (liquidation?.id) {
      getValidationSteps(liquidation.id).then(setValidationSteps);
    }
  }, [liquidation?.id]);

  // Build timeline steps based on liquidation status
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Creation (always completed)
    steps.push({
      key: "creation",
      label: "Création",
      icon: FileEdit,
      status: "completed",
      date: liquidation.created_at,
      actor: liquidation.creator?.full_name,
    });

    // Step 2: Service fait (attestation)
    const hasServiceFait = liquidation.date_service_fait != null;
    steps.push({
      key: "service_fait",
      label: "Service fait",
      icon: ClipboardCheck,
      status: hasServiceFait ? "completed" : liquidation.statut === "brouillon" ? "current" : "completed",
      date: liquidation.date_service_fait,
      comment: hasServiceFait ? "Attestation de service fait validée" : undefined,
    });

    // Step 3: Documents (facture, PV)
    const hasDocuments = liquidation.documents && liquidation.documents.length > 0;
    steps.push({
      key: "documents",
      label: "Pièces justificatives",
      icon: FileCheck,
      status: hasDocuments ? "completed" : "pending",
      comment: hasDocuments
        ? `${liquidation.documents?.length} document(s) fourni(s)`
        : "En attente des pièces",
    });

    // Step 4: Submission
    const hasBeenSubmitted = liquidation.statut !== "brouillon";
    steps.push({
      key: "soumission",
      label: "Soumission",
      icon: Send,
      status: hasBeenSubmitted ? "completed" : "pending",
    });

    // Step 5: Multi-step validation (only if submitted)
    if (hasBeenSubmitted && liquidation.statut !== "rejete") {
      const currentStep = liquidation.current_step || 1;

      // Add each validation step
      VALIDATION_STEPS.forEach((step) => {
        const validation = validationSteps.find((v) => v.step_order === step.order);
        const isCompleted = validation?.status === "valide";
        const isRejected = validation?.status === "rejete";
        const isCurrent = step.order === currentStep && liquidation.statut === "soumis";
        const isPending = step.order > currentStep && !isCompleted;

        steps.push({
          key: `validation_${step.order}`,
          label: step.label,
          icon: Users,
          status: isCompleted
            ? "completed"
            : isRejected
            ? "rejected"
            : isCurrent
            ? "current"
            : isPending
            ? "pending"
            : "pending",
          date: validation?.validated_at,
          actor: validation?.validator?.full_name,
          comment: validation?.comments,
        });
      });
    }

    // Final status
    if (liquidation.statut === "valide") {
      steps.push({
        key: "validation_finale",
        label: "Liquidation validée",
        icon: CheckCircle2,
        status: "completed",
        date: liquidation.date_liquidation,
      });
    } else if (liquidation.statut === "rejete") {
      // Find rejection reason from validation steps
      const rejectedStep = validationSteps.find((v) => v.status === "rejete");
      steps.push({
        key: "rejet",
        label: "Rejetée",
        icon: XCircle,
        status: "rejected",
        comment: rejectedStep?.comments || liquidation.motif_rejet,
        actor: rejectedStep?.validator?.full_name,
        date: rejectedStep?.validated_at,
      });
    }

    return steps;
  };

  const steps = buildTimelineSteps();

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "current":
        return "bg-primary text-white ring-4 ring-primary/30";
      case "rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getLineColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2 overflow-x-auto", className)}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                        getStatusColor(step.status)
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{step.label}</p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(step.date), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </p>
                      )}
                      {step.actor && (
                        <p className="text-xs">Par: {step.actor}</p>
                      )}
                      {step.comment && (
                        <p className="text-xs max-w-xs">{step.comment}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                {index < steps.length - 1 && (
                  <div className={cn("h-0.5 w-4 mx-1 shrink-0", getLineColor(step.status))} />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Historique du workflow de liquidation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {/* Vertical line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 w-0.5 h-full -ml-px",
                      getLineColor(step.status)
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                    getStatusColor(step.status)
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{step.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        step.status === "completed" && "border-green-500 text-green-600",
                        step.status === "current" && "border-primary text-primary",
                        step.status === "rejected" && "border-red-500 text-red-600",
                        step.status === "pending" && "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {step.status === "completed" && "Terminé"}
                      {step.status === "current" && "En cours"}
                      {step.status === "rejected" && "Rejeté"}
                      {step.status === "pending" && "En attente"}
                    </Badge>
                  </div>

                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {step.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(step.date), "dd MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                    {step.actor && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{step.actor}</span>
                      </div>
                    )}
                    {step.comment && (
                      <p className="text-sm mt-2 p-2 bg-muted/50 rounded text-foreground">
                        {step.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
