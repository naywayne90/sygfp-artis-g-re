/**
 * ExpressionBesoinTimeline - Timeline du workflow d'expression de besoin
 *
 * Affiche l'historique des étapes du workflow:
 * CRÉATION → SOUMISSION → VALIDATION (multi-step) → VALIDÉ/REJETÉ/DIFFÉRÉ
 *
 * Avec dates, acteurs et motifs si applicable
 */

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
  ArrowRight,
  AlertCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExpressionBesoin, VALIDATION_STEPS } from "@/hooks/useExpressionsBesoin";

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "rejected" | "deferred";
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
}

interface ExpressionBesoinTimelineProps {
  expression: ExpressionBesoin;
  compact?: boolean;
  className?: string;
}

export function ExpressionBesoinTimeline({
  expression,
  compact = false,
  className,
}: ExpressionBesoinTimelineProps) {
  // Build timeline steps based on expression status
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Creation (always completed)
    steps.push({
      key: "creation",
      label: "Création",
      icon: FileEdit,
      status: "completed",
      date: expression.created_at,
      actor: expression.creator?.full_name,
    });

    // Step 2: Submission
    const hasBeenSubmitted = expression.statut !== "brouillon";
    steps.push({
      key: "soumission",
      label: "Soumission",
      icon: Send,
      status: hasBeenSubmitted
        ? "completed"
        : "current",
      date: expression.submitted_at,
    });

    // Step 3: Multi-step validation (only if submitted)
    if (hasBeenSubmitted && expression.statut !== "rejeté" && expression.statut !== "différé") {
      const currentStep = expression.current_validation_step || 1;

      // Add each validation step
      VALIDATION_STEPS.forEach((step) => {
        const validation = expression.validations?.find(v => v.step_order === step.order);
        const isCompleted = validation?.status === "approved";
        const isCurrent = step.order === currentStep && expression.statut === "soumis";
        const isPending = step.order > currentStep && !isCompleted;

        steps.push({
          key: `validation_${step.order}`,
          label: step.label,
          icon: Users,
          status: isCompleted
            ? "completed"
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
    if (expression.statut === "validé") {
      steps.push({
        key: "validation_finale",
        label: "Validation finale",
        icon: CheckCircle2,
        status: "completed",
        date: expression.validated_at,
        actor: expression.validator?.full_name,
      });
    } else if (expression.statut === "rejeté") {
      steps.push({
        key: "rejet",
        label: "Rejet",
        icon: XCircle,
        status: "rejected",
        comment: expression.rejection_reason,
      });
    } else if (expression.statut === "différé") {
      steps.push({
        key: "differe",
        label: "Différé",
        icon: Clock,
        status: "deferred",
        date: expression.date_differe,
        comment: expression.motif_differe,
      });
    } else if (expression.statut === "satisfaite") {
      steps.push({
        key: "satisfaite",
        label: "Satisfaite",
        icon: CheckCircle2,
        status: "completed",
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
      case "deferred":
        return "bg-orange-500 text-white";
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
      case "deferred":
        return "bg-orange-500";
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
          <ArrowRight className="h-4 w-4" />
          Historique du workflow
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
                        step.status === "deferred" && "border-orange-500 text-orange-600",
                        step.status === "pending" && "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {step.status === "completed" && "Terminé"}
                      {step.status === "current" && "En cours"}
                      {step.status === "rejected" && "Rejeté"}
                      {step.status === "deferred" && "Différé"}
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
