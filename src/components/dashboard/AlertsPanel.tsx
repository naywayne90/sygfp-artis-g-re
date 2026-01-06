import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardAlerts, type DashboardAlert } from "@/hooks/useDashboardAlerts";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  ArrowRight,
  Clock,
  FileWarning,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const getAlertIcon = (type: DashboardAlert["type"]) => {
  switch (type) {
    case "depassement": return TrendingUp;
    case "retard": return Clock;
    case "echeance": return Calendar;
    case "piece_manquante": return FileWarning;
    case "seuil": return AlertCircle;
    default: return AlertTriangle;
  }
};

const getAlertColor = (severity: DashboardAlert["severity"]) => {
  switch (severity) {
    case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warning": return "bg-warning/10 text-warning border-warning/20";
    case "info": return "bg-primary/10 text-primary border-primary/20";
  }
};

const getSeverityBadge = (severity: DashboardAlert["severity"]) => {
  switch (severity) {
    case "critical": return <Badge variant="destructive">Critique</Badge>;
    case "warning": return <Badge variant="outline" className="border-warning text-warning">Attention</Badge>;
    case "info": return <Badge variant="secondary">Info</Badge>;
  }
};

interface AlertsPanelProps {
  maxItems?: number;
  showHeader?: boolean;
  filterSeverity?: DashboardAlert["severity"][];
}

export function AlertsPanel({ maxItems = 10, showHeader = true, filterSeverity }: AlertsPanelProps) {
  const { data: alerts, isLoading } = useDashboardAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const filteredAlerts = alerts?.filter(alert => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (filterSeverity && !filterSeverity.includes(alert.severity)) return false;
    return true;
  }).slice(0, maxItems) || [];

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune alerte active</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = filteredAlerts.filter(a => a.severity === "critical").length;
  const warningCount = filteredAlerts.filter(a => a.severity === "warning").length;

  return (
    <Card className={criticalCount > 0 ? "border-destructive/50" : warningCount > 0 ? "border-warning/50" : ""}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${criticalCount > 0 ? 'text-destructive' : 'text-warning'}`} />
              Alertes ({filteredAlerts.length})
            </span>
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="border-warning text-warning">{warningCount} attention</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={!showHeader ? "pt-6" : ""}>
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div 
                key={alert.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="p-2 rounded-full bg-background/50">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{alert.title}</p>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs opacity-80 line-clamp-2">{alert.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {alert.link && (
                    <Link to={alert.link}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-50 hover:opacity-100"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
