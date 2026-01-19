/**
 * ImportValidationAlert - Alerte affichant les anomalies détectées avant import
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import {
  Anomaly,
  ANOMALY_TYPE_LABELS,
  ANOMALY_SEVERITY_CONFIG,
} from "@/hooks/useCoherenceCheck";

interface ImportValidationAlertProps {
  anomalies: Anomaly[];
  onProceed?: () => void;
  onCancel?: () => void;
  proceedLabel?: string;
  cancelLabel?: string;
}

export function ImportValidationAlert({
  anomalies,
  onProceed,
  onCancel,
  proceedLabel = "Continuer malgré les avertissements",
  cancelLabel = "Annuler",
}: ImportValidationAlertProps) {
  const [expanded, setExpanded] = useState(false);

  const errors = anomalies.filter((a) => a.severity === "error");
  const warnings = anomalies.filter((a) => a.severity === "warning");
  const infos = anomalies.filter((a) => a.severity === "info");

  const hasBlockingErrors = errors.length > 0;

  if (anomalies.length === 0) {
    return (
      <Alert className="border-green-300 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Validation réussie</AlertTitle>
        <AlertDescription className="text-green-700">
          Aucune anomalie détectée dans les données à importer.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Alert
      variant={hasBlockingErrors ? "destructive" : "default"}
      className={hasBlockingErrors ? "" : "border-amber-300 bg-amber-50"}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          {hasBlockingErrors
            ? `${errors.length} erreur(s) bloquante(s) détectée(s)`
            : `${warnings.length} avertissement(s) détecté(s)`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </AlertTitle>
      <AlertDescription>
        {/* Résumé */}
        <div className="flex gap-3 mt-2 mb-3">
          {errors.length > 0 && (
            <Badge variant="destructive">
              {errors.length} erreur(s)
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              {warnings.length} avertissement(s)
            </Badge>
          )}
          {infos.length > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              {infos.length} info(s)
            </Badge>
          )}
        </div>

        {/* Liste détaillée */}
        {expanded && (
          <ScrollArea className="h-[200px] mt-3 rounded border bg-background p-2">
            <div className="space-y-2">
              {anomalies.map((anomaly) => {
                const config = ANOMALY_SEVERITY_CONFIG[anomaly.severity];
                return (
                  <div
                    key={anomaly.id}
                    className={`p-2 rounded ${config.bgColor} ${config.color}`}
                  >
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(anomaly.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {anomaly.entityRef && (
                            <Badge variant="outline" className="text-xs">
                              {anomaly.entityRef}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {ANOMALY_TYPE_LABELS[anomaly.type as keyof typeof ANOMALY_TYPE_LABELS] || anomaly.type}
                          </span>
                        </div>
                        <p className="text-sm">{anomaly.message}</p>
                        {anomaly.suggestedAction && (
                          <p className="text-xs mt-1 opacity-80">
                            💡 {anomaly.suggestedAction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          {onProceed && !hasBlockingErrors && (
            <Button variant="default" size="sm" onClick={onProceed}>
              {proceedLabel}
            </Button>
          )}
          {hasBlockingErrors && (
            <p className="text-sm text-muted-foreground">
              Corrigez les erreurs avant de pouvoir continuer l'import.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
