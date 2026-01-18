/**
 * ReglementTimeline - Timeline du workflow de règlement
 *
 * Affiche l'historique des étapes du workflow:
 * CRÉATION → ENREGISTREMENT → VALIDATION → PAYÉ/SOLDÉ ou REJETÉ (avec renvoi)
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
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Wallet,
  CreditCard,
  RotateCcw,
  Lock,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RENVOI_TARGETS } from "@/hooks/useReglements";

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "rejected";
  date?: string | null;
  actor?: string | null;
  comment?: string | null;
}

interface ReglementTimelineProps {
  reglement: any;
  compact?: boolean;
  className?: string;
}

export function ReglementTimeline({
  reglement,
  compact = false,
  className,
}: ReglementTimelineProps) {
  const ordonnancement = reglement?.ordonnancement;
  const montantOrdonnance = ordonnancement?.montant || 0;
  const montantPaye = ordonnancement?.montant_paye || 0;
  const isFullyPaid = montantPaye >= montantOrdonnance && montantOrdonnance > 0;

  // Build timeline steps based on reglement status
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Creation (always completed if reglement exists)
    steps.push({
      key: "creation",
      label: "Création",
      icon: FileEdit,
      status: "completed",
      date: reglement.created_at,
      actor: reglement.created_by_profile?.full_name ||
             `${reglement.created_by_profile?.prenom || ""} ${reglement.created_by_profile?.nom || ""}`.trim(),
    });

    // Step 2: Enregistrement paiement
    steps.push({
      key: "enregistrement",
      label: "Enregistrement du paiement",
      icon: CreditCard,
      status: "completed",
      date: reglement.date_paiement,
      comment: `${reglement.montant?.toLocaleString("fr-FR")} FCFA - ${reglement.mode_paiement}`,
    });

    // Step 3: Compte bancaire
    if (reglement.compte_bancaire_arti) {
      steps.push({
        key: "compte",
        label: "Compte ARTI",
        icon: Building2,
        status: "completed",
        comment: `${reglement.banque_arti || ""} - ${reglement.compte_bancaire_arti}`,
      });
    }

    // Step 4: Check if rejected
    if (reglement.statut === "rejete") {
      const renvoiLabel = RENVOI_TARGETS.find(t => t.value === reglement.renvoi_target)?.label || reglement.renvoi_target;
      steps.push({
        key: "rejet",
        label: "Rejeté",
        icon: XCircle,
        status: "rejected",
        date: reglement.date_rejet,
        comment: reglement.motif_rejet,
      });
      steps.push({
        key: "renvoi",
        label: renvoiLabel || "Renvoyé",
        icon: RotateCcw,
        status: "rejected",
        comment: `Dossier renvoyé pour correction`,
      });
    } else if (isFullyPaid) {
      // Fully paid - SOLDÉ
      steps.push({
        key: "solde",
        label: "Dossier Soldé",
        icon: Lock,
        status: "completed",
        comment: "Tous les paiements effectués - Dossier clôturé",
      });
    } else {
      // Partial payment
      const restant = montantOrdonnance - montantPaye;
      steps.push({
        key: "partiel",
        label: "Paiement partiel",
        icon: Clock,
        status: "current",
        comment: `Restant: ${restant.toLocaleString("fr-FR")} FCFA`,
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
          <Wallet className="h-4 w-4" />
          Historique du workflow de règlement
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
