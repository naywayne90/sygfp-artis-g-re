/**
 * CoherenceReportCard - Affichage d'un rapport de cohérence
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileWarning,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CoherenceReport,
  Anomaly,
  ANOMALY_TYPE_LABELS,
  ANOMALY_SEVERITY_CONFIG,
} from "@/hooks/useCoherenceCheck";

interface CoherenceReportCardProps {
  report: CoherenceReport;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CoherenceReportCard({ report, onRefresh, isRefreshing }: CoherenceReportCardProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleType = (type: string) => {
    const newSet = new Set(expandedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setExpandedTypes(newSet);
  };

  // Grouper les anomalies par type
  const anomaliesByType = report.anomalies.reduce((acc, anomaly) => {
    if (!acc[anomaly.type]) {
      acc[anomaly.type] = [];
    }
    acc[anomaly.type].push(anomaly);
    return acc;
  }, {} as Record<string, Anomaly[]>);

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

  const getStatusBadge = () => {
    if (report.anomaliesCount === 0) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aucune anomalie
        </Badge>
      );
    }
    if (report.errorsCount > 0) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {report.errorsCount} erreur(s)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {report.warningsCount} avertissement(s)
      </Badge>
    );
  };

  const exportReport = () => {
    const content = {
      ...report,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-coherence-${format(new Date(report.generatedAt), "yyyy-MM-dd-HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Rapport de Cohérence</CardTitle>
              <CardDescription>
                Généré le {format(new Date(report.generatedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Résumé */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{report.totalChecks}</div>
            <div className="text-xs text-muted-foreground">Règles vérifiées</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{report.errorsCount}</div>
            <div className="text-xs text-red-600">Erreurs</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-700">{report.warningsCount}</div>
            <div className="text-xs text-amber-600">Avertissements</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{report.infosCount}</div>
            <div className="text-xs text-blue-600">Informations</div>
          </div>
        </div>

        {/* Liste des anomalies */}
        {report.anomaliesCount > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {Object.entries(anomaliesByType).map(([type, anomalies]) => (
                <Collapsible
                  key={type}
                  open={expandedTypes.has(type)}
                  onOpenChange={() => toggleType(type)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedTypes.has(type) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {getSeverityIcon(anomalies[0].severity)}
                        <span className="font-medium">
                          {ANOMALY_TYPE_LABELS[type as keyof typeof ANOMALY_TYPE_LABELS] || type}
                        </span>
                      </div>
                      <Badge variant="secondary">{anomalies.length}</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-2">
                      {anomalies.map((anomaly) => (
                        <AnomalyItem key={anomaly.id} anomaly={anomaly} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">Toutes les vérifications sont passées</p>
            <p className="text-sm">Aucune incohérence détectée dans les données</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AnomalyItemProps {
  anomaly: Anomaly;
}

function AnomalyItem({ anomaly }: AnomalyItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = ANOMALY_SEVERITY_CONFIG[anomaly.severity];

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} border-opacity-50`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {anomaly.entityRef && (
              <Badge variant="outline" className="text-xs">
                {anomaly.entityRef}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${config.color}`}>
              {config.label}
            </Badge>
          </div>
          <p className={`text-sm ${config.color}`}>{anomaly.message}</p>
          {anomaly.suggestedAction && (
            <p className="text-xs text-muted-foreground mt-1">
              💡 {anomaly.suggestedAction}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      {showDetails && (
        <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono overflow-auto">
          <pre>{JSON.stringify(anomaly.details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
