/**
 * OrdonnancementTimeline - Timeline du workflow d'ordonnancement
 *
 * Affiche l'historique des étapes du workflow:
 * CRÉATION → SOUMISSION → VALIDATION (SAF→CB→DAF→DG) → SIGNATURE (CB→DAF→DG→AC) → ORDONNANCÉ
 *
 * Avec dates, acteurs et statut de signature
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
  FileSignature,
  CreditCard,
  Shield,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useOrdonnancements, VALIDATION_STEPS, SIGNATURE_STEPS } from "@/hooks/useOrdonnancements";

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "rejected" | "signed";
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
  hash?: string | null;
}

interface OrdonnancementTimelineProps {
  ordonnancement: any;
  compact?: boolean;
  className?: string;
}

export function OrdonnancementTimeline({
  ordonnancement,
  compact = false,
  className,
}: OrdonnancementTimelineProps) {
  const [validations, setValidations] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const { getValidations, getSignatures } = useOrdonnancements();

  useEffect(() => {
    if (ordonnancement?.id) {
      getValidations(ordonnancement.id).then(setValidations);
      getSignatures(ordonnancement.id).then(setSignatures).catch(() => setSignatures([]));
    }
  }, [ordonnancement?.id]);

  // Build timeline steps based on ordonnancement status
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Creation (always completed)
    steps.push({
      key: "creation",
      label: "Création",
      icon: FileEdit,
      status: "completed",
      date: ordonnancement.created_at,
      actor: ordonnancement.created_by_profile?.full_name,
    });

    // Step 2: Submission
    const hasBeenSubmitted = ordonnancement.statut !== "brouillon";
    steps.push({
      key: "soumission",
      label: "Soumission",
      icon: Send,
      status: hasBeenSubmitted ? "completed" : "current",
      date: ordonnancement.submitted_at,
    });

    // Step 3: Multi-step validation (only if submitted)
    if (hasBeenSubmitted && ordonnancement.statut !== "rejete") {
      const currentStep = ordonnancement.current_step || 1;

      VALIDATION_STEPS.forEach((step) => {
        const validation = validations.find((v) => v.step_order === step.order);
        const isCompleted = validation?.status === "validated";
        const isRejected = validation?.status === "rejected";
        const isCurrent = step.order === currentStep &&
          (ordonnancement.statut === "soumis" || ordonnancement.workflow_status === "en_validation");
        const isPending = step.order > currentStep && !isCompleted;

        steps.push({
          key: `validation_${step.order}`,
          label: `Validation ${step.role}`,
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
          actor: validation?.validated_by_profile?.full_name,
          comment: validation?.comments,
        });
      });
    }

    // Step 4: Signature workflow (only if validation complete)
    const isInSignature = ordonnancement.statut === "en_signature" ||
                          ordonnancement.statut === "ordonnance" ||
                          ordonnancement.statut === "valide";

    if (isInSignature || ordonnancement.workflow_status === "valide") {
      SIGNATURE_STEPS.forEach((step) => {
        const signature = signatures.find((s) => s.signature_order === step.order);
        const isSigned = signature?.status === "signed";
        const isPending = !isSigned && ordonnancement.statut === "en_signature";

        steps.push({
          key: `signature_${step.order}`,
          label: `Signature ${step.role}`,
          icon: FileSignature,
          status: isSigned ? "signed" : isPending ? "current" : "pending",
          date: signature?.signed_at,
          actor: signature?.signed_by_profile?.full_name,
          hash: signature?.signature_hash,
        });
      });
    }

    // Final status
    if (ordonnancement.statut === "ordonnance") {
      steps.push({
        key: "ordonnance",
        label: "ORDONNANCÉ",
        icon: CheckCircle2,
        status: "completed",
        date: ordonnancement.date_ordonnancement,
        hash: ordonnancement.signature_hash,
        comment: ordonnancement.qr_code_data ? "QR Code généré" : undefined,
      });
    } else if (ordonnancement.statut === "rejete") {
      steps.push({
        key: "rejet",
        label: "Rejeté",
        icon: XCircle,
        status: "rejected",
        comment: ordonnancement.rejection_reason,
        date: ordonnancement.rejected_at,
      });
    } else if (ordonnancement.statut === "differe") {
      steps.push({
        key: "differe",
        label: "Différé",
        icon: Clock,
        status: "pending",
        date: ordonnancement.date_differe,
        comment: ordonnancement.motif_differe,
      });
    }

    return steps;
  };

  const steps = buildTimelineSteps();

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "signed":
        return "bg-blue-500 text-white";
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
      case "signed":
        return "bg-blue-500";
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
                      {step.hash && (
                        <p className="text-xs font-mono">Hash: {step.hash.slice(0, 12)}...</p>
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
          <CreditCard className="h-4 w-4" />
          Historique du workflow d'ordonnancement
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
                        step.status === "signed" && "border-blue-500 text-blue-600",
                        step.status === "current" && "border-primary text-primary",
                        step.status === "rejected" && "border-red-500 text-red-600",
                        step.status === "pending" && "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {step.status === "completed" && "Terminé"}
                      {step.status === "signed" && "Signé"}
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
                    {step.hash && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        <span className="font-mono text-xs">Hash: {step.hash}</span>
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

        {/* QR Code section if ordonnancé */}
        {ordonnancement.statut === "ordonnance" && ordonnancement.qr_code_data && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Données de vérification</span>
            </div>
            <div className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
              {ordonnancement.qr_code_data}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
