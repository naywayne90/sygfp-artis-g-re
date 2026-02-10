/**
 * PassationTimeline - Timeline du workflow de passation de marché
 *
 * Affiche l'historique des étapes du workflow:
 * BROUILLON → SOUMIS → VALIDÉ/REJETÉ/DIFFÉRÉ
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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PassationMarche } from "@/hooks/usePassationsMarche";

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "rejected" | "deferred";
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
}

interface PassationTimelineProps {
  passation: PassationMarche;
  compact?: boolean;
  className?: string;
}

export function PassationTimeline({
  passation,
  compact = false,
  className,
}: PassationTimelineProps) {
  // Build timeline steps based on passation status
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Creation (always completed)
    steps.push({
      key: "creation",
      label: "Création",
      icon: FileEdit,
      status: "completed",
      date: passation.created_at,
      actor: passation.creator?.full_name,
    });

    // Step 2: Submission
    const isSubmitted = ["soumis", "en_analyse", "valide", "rejete", "differe"].includes(
      passation.statut
    );
    steps.push({
      key: "soumission",
      label: "Soumission",
      icon: Send,
      status: isSubmitted
        ? "completed"
        : passation.statut === "brouillon"
        ? "current"
        : "pending",
      date: passation.submitted_at,
    });

    // Step 3: Final status (validation/rejection/defer)
    if (passation.statut === "valide") {
      steps.push({
        key: "validation",
        label: "Validation",
        icon: CheckCircle2,
        status: "completed",
        date: passation.validated_at,
      });
    } else if (passation.statut === "rejete") {
      steps.push({
        key: "rejet",
        label: "Rejet",
        icon: XCircle,
        status: "rejected",
        date: (passation as any).rejected_at,
        comment: passation.rejection_reason,
      });
    } else if (passation.statut === "differe") {
      steps.push({
        key: "differe",
        label: "Différé",
        icon: Clock,
        status: "deferred",
        date: (passation as any).differed_at,
        comment: passation.motif_differe,
      });
    } else if (passation.statut === "soumis" || passation.statut === "en_analyse") {
      steps.push({
        key: "en_attente",
        label: "En attente de décision",
        icon: AlertCircle,
        status: "current",
      });
    } else {
      // Brouillon - final step is pending
      steps.push({
        key: "decision",
        label: "Décision",
        icon: CheckCircle2,
        status: "pending",
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
        <div className={cn("flex items-center gap-2", className)}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
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
                      {step.comment && (
                        <p className="text-xs max-w-xs">{step.comment}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                {index < steps.length - 1 && (
                  <div className={cn("h-0.5 w-6 mx-1", getLineColor(step.status))} />
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
