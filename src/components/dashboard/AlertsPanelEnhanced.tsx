import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts, useDashboardAlertsAggregated, type Alert } from "@/hooks/useAlerts";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Clock,
  FileWarning,
  TrendingUp,
  Calendar,
  Users,
  FileX,
  Banknote,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const getAlertIcon = (type: string) => {
  switch (type) {
    case "depassement":
    case "budget_depassement":
      return TrendingUp;
    case "retard":
    case "retard_paiement":
      return Clock;
    case "echeance":
    case "contrat_echeance":
      return Calendar;
    case "piece_manquante":
    case "document_manquant":
      return FileWarning;
    case "document_expire":
      return FileX;
    case "virement_attente":
      return Banknote;
    case "prestataire_expire":
      return Users;
    case "seuil":
    case "budget_seuil":
      return AlertCircle;
    default:
      return AlertTriangle;
  }
};

const getAlertColor = (severity: "critical" | "warning" | "info") => {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "warning":
      return "bg-warning/10 text-warning border-warning/20";
    case "info":
      return "bg-primary/10 text-primary border-primary/20";
  }
};

const getSeverityBadge = (severity: "critical" | "warning" | "info") => {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critique</Badge>;
    case "warning":
      return <Badge variant="outline" className="border-warning text-warning">Attention</Badge>;
    case "info":
      return <Badge variant="secondary">Info</Badge>;
  }
};

const getAlertLink = (alert: Alert): string | undefined => {
  switch (alert.entity_table) {
    case "budget_lines":
      return `/planification/budget`;
    case "budget_engagements":
      return `/engagements`;
    case "budget_liquidations":
      return `/liquidations`;
    case "ordonnancements":
      return `/ordonnancements`;
    case "credit_transfers":
      return `/planification/virements`;
    case "supplier_documents":
    case "prestataires":
      return `/contractualisation/prestataires`;
    case "contrats":
      return `/contractualisation/contrats`;
    default:
      return undefined;
  }
};

interface AlertsPanelEnhancedProps {
  maxItems?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
}

export function AlertsPanelEnhanced({ 
  maxItems = 10, 
  showHeader = true,
  showViewAll = true,
}: AlertsPanelEnhancedProps) {
  const { data: alerts, isLoading } = useDashboardAlertsAggregated();
  const { resolveAlert, isResolving } = useAlerts();

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

  const displayedAlerts = alerts?.slice(0, maxItems) || [];
  const criticalCount = alerts?.filter(a => a.severity === "critical" && a.status === "open").length || 0;
  const warningCount = alerts?.filter(a => a.severity === "warning" && a.status === "open").length || 0;
  const totalOpen = criticalCount + warningCount;

  if (displayedAlerts.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Alertes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
            <p className="text-sm">Aucune alerte active</p>
            <p className="text-xs mt-1">Tout est en ordre !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={criticalCount > 0 ? "border-destructive/50" : warningCount > 0 ? "border-warning/50" : ""}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${criticalCount > 0 ? "text-destructive" : "text-warning"}`} />
              Alertes
              {totalOpen > 0 && (
                <Badge variant="outline" className="ml-1">
                  {totalOpen}
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive">{criticalCount} critique{criticalCount > 1 ? "s" : ""}</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="border-warning text-warning">
                  {warningCount} attention
                </Badge>
              )}
              {showViewAll && (
                <Link to="/alertes">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Voir tout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={!showHeader ? "pt-6" : ""}>
        <div className="space-y-3">
          {displayedAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const link = getAlertLink(alert);
            
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="p-2 rounded-full bg-background/50 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-sm">{alert.title}</p>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  {alert.description && (
                    <p className="text-xs opacity-80 line-clamp-2">{alert.description}</p>
                  )}
                  {alert.owner_role && (
                    <p className="text-xs opacity-60 mt-1">
                      Responsable : {alert.owner_role}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {link && (
                    <Link to={link}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {!alert.auto_generated && alert.status === "open" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => resolveAlert({ alertId: alert.id })}
                      disabled={isResolving}
                      title="Marquer comme résolu"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
