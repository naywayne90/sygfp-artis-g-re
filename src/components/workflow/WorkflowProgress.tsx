import { Check, Clock, Circle, XCircle, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowDossier } from "@/hooks/useWorkflowDossier";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkflowProgressProps {
  dossierId: string;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  valide: {
    icon: Check,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
    label: "Validé",
  },
  soumis: {
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    label: "Soumis",
  },
  a_valider: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-500",
    label: "À valider",
  },
  brouillon: {
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    label: "Brouillon",
  },
  rejete: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
    label: "Rejeté",
  },
  differe: {
    icon: Pause,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-500",
    label: "Différé",
  },
  annule: {
    icon: XCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "Annulé",
  },
  pending: {
    icon: Circle,
    color: "text-gray-300",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "À venir",
  },
};

export function WorkflowProgress({ dossierId, compact = false, className }: WorkflowProgressProps) {
  const { progress, isLoading } = useWorkflowDossier(dossierId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-1", className)}>
          {progress.map((step, _index) => {
            const config = STATUS_CONFIG[step.statut as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            const Icon = config.icon;

            return (
              <Tooltip key={step.etape_code}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border-2",
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <Icon className={cn("h-3 w-3", config.color)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{step.etape_libelle}</p>
                    <p className="text-muted-foreground">{config.label}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Ligne de progression */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
        
        {/* Étapes */}
        <div className="relative flex justify-between">
          {progress.map((step, _index) => {
            const config = STATUS_CONFIG[step.statut as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const isCompleted = step.statut === "valide";
            const isCurrent = step.statut === "soumis" || step.statut === "a_valider" || step.statut === "brouillon";

            return (
              <TooltipProvider key={step.etape_code}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background z-10 transition-all",
                          config.borderColor,
                          isCurrent && "ring-2 ring-offset-2 ring-primary"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", config.color)} />
                      </div>
                      <span className={cn(
                        "mt-2 text-xs text-center max-w-[80px] truncate",
                        isCompleted ? "text-green-600 font-medium" : "text-muted-foreground"
                      )}>
                        {step.etape_libelle}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{step.etape_libelle}</p>
                      <p className="text-sm text-muted-foreground">Statut: {config.label}</p>
                      {step.assigned_to_name && (
                        <p className="text-sm">Assigné à: {step.assigned_to_name}</p>
                      )}
                      {step.date_debut && (
                        <p className="text-xs text-muted-foreground">
                          Début: {new Date(step.date_debut).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {step.date_fin && (
                        <p className="text-xs text-muted-foreground">
                          Fin: {new Date(step.date_fin).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
}
