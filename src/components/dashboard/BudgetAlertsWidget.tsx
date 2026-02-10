/**
 * Widget des alertes budgétaires pour le Dashboard
 * Affiche les seuils 75/90/95/100% de consommation budgétaire
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { useBudgetSummary } from "@/hooks/useBudgetAvailability";
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatMontantCompact } from "@/lib/config/sygfp-constants";

interface BudgetAlertsWidgetProps {
  showHeader?: boolean;
  maxAlerts?: number;
  compact?: boolean;
}

const SEUIL_CONFIG = [
  { seuil: 75, niveau: "info", label: "Attention", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { seuil: 90, niveau: "warning", label: "Alerte", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  { seuil: 95, niveau: "critical", label: "Critique", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  { seuil: 100, niveau: "blocking", label: "Bloquant", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
];

const getNiveauIcon = (niveau: string) => {
  switch (niveau) {
    case "info":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    case "critical":
      return AlertOctagon;
    case "blocking":
      return AlertOctagon;
    default:
      return AlertCircle;
  }
};

const getNiveauBadge = (niveau: string) => {
  switch (niveau) {
    case "info":
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Info</Badge>;
    case "warning":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Attention</Badge>;
    case "critical":
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Critique</Badge>;
    case "blocking":
      return <Badge variant="destructive">Bloquant</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
};

const getProgressColor = (taux: number): string => {
  if (taux >= 100) return "bg-red-500";
  if (taux >= 95) return "bg-orange-500";
  if (taux >= 90) return "bg-yellow-500";
  if (taux >= 75) return "bg-blue-500";
  return "bg-green-500";
};

export function BudgetAlertsWidget({
  showHeader = true,
  maxAlerts = 5,
  compact = false,
}: BudgetAlertsWidgetProps) {
  const {
    alerts,
    isLoadingAlerts,
    unacknowledgedCount,
    checkAlerts,
    acknowledgeAlert,
    NIVEAU_COLORS: _NIVEAU_COLORS,
    NIVEAU_LABELS: _NIVEAU_LABELS,
  } = useBudgetAlerts();

  const { summary, isLoading: isLoadingSummary } = useBudgetSummary();

  const isLoading = isLoadingAlerts || isLoadingSummary;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrer les alertes non résolues
  const activeAlerts = alerts.filter(a => !a.resolved_at).slice(0, maxAlerts);
  const criticalCount = activeAlerts.filter(a => a.niveau === "critical" || a.niveau === "blocking").length;
  const warningCount = activeAlerts.filter(a => a.niveau === "warning").length;

  // Déterminer le status global
  const globalTaux = summary.taux_global;
  const globalStatus = globalTaux >= 100 ? "blocking"
    : globalTaux >= 95 ? "critical"
    : globalTaux >= 90 ? "warning"
    : globalTaux >= 75 ? "info"
    : "ok";

  return (
    <Card className={
      globalStatus === "blocking" ? "border-red-500/50" :
      globalStatus === "critical" ? "border-orange-500/50" :
      globalStatus === "warning" ? "border-yellow-500/50" :
      ""
    }>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Budget
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unacknowledgedCount}
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => checkAlerts.mutate()}
                disabled={checkAlerts.isPending}
                title="Vérifier les alertes"
              >
                <RefreshCw className={`h-4 w-4 ${checkAlerts.isPending ? "animate-spin" : ""}`} />
              </Button>
              <Link to="/planification/budget">
                <Button variant="ghost" size="sm" className="gap-1">
                  Détails
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardTitle>
          <CardDescription>
            Taux d'engagement global : {summary.taux_global.toFixed(1)}%
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className={!showHeader ? "pt-6" : ""}>
        {/* Résumé global */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Engagement global</span>
            <span className={`text-sm font-bold ${
              globalStatus === "blocking" ? "text-red-600" :
              globalStatus === "critical" ? "text-orange-600" :
              globalStatus === "warning" ? "text-yellow-600" :
              globalStatus === "info" ? "text-blue-600" :
              "text-green-600"
            }`}>
              {summary.taux_global.toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.min(summary.taux_global, 100)} className="h-3" />
            <div
              className={`absolute inset-0 h-3 rounded-full ${getProgressColor(summary.taux_global)}`}
              style={{ width: `${Math.min(summary.taux_global, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Engagé: {formatMontantCompact(summary.total_engage)}</span>
            <span>Disponible: {formatMontantCompact(summary.total_disponible)}</span>
          </div>

          {/* Indicateurs de seuils */}
          <div className="flex gap-1 mt-2">
            {SEUIL_CONFIG.map(s => (
              <div
                key={s.seuil}
                className={`flex-1 h-1 rounded-full ${
                  summary.taux_global >= s.seuil ? s.bgColor : "bg-gray-200"
                }`}
                title={`Seuil ${s.seuil}%: ${s.label}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>75%</span>
            <span>90%</span>
            <span>95%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Stats rapides */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{summary.nb_lignes}</div>
              <div className="text-xs text-muted-foreground">Lignes</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className={`text-lg font-bold ${summary.nb_lignes_depassement > 0 ? "text-red-600" : "text-green-600"}`}>
                {summary.nb_lignes_depassement}
              </div>
              <div className="text-xs text-muted-foreground">Dépassements</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className={`text-lg font-bold ${criticalCount > 0 ? "text-orange-600" : warningCount > 0 ? "text-yellow-600" : "text-blue-600"}`}>
                {activeAlerts.length}
              </div>
              <div className="text-xs text-muted-foreground">Alertes</div>
            </div>
          </div>
        )}

        {/* Liste des alertes actives */}
        {activeAlerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="text-sm">Aucune alerte budgétaire active</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Alertes actives</span>
              <span>{activeAlerts.length} alerte{activeAlerts.length > 1 ? "s" : ""}</span>
            </div>
            {activeAlerts.map((alert) => {
              const Icon = getNiveauIcon(alert.niveau);
              const config = SEUIL_CONFIG.find(s => s.niveau === alert.niveau) || SEUIL_CONFIG[0];

              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className={`p-1 rounded ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${config.color}`}>
                        {alert.seuil_atteint}%
                      </span>
                      {getNiveauBadge(alert.niveau)}
                    </div>
                    <p className="text-xs mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    {alert.budget_line && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {alert.budget_line.code}
                      </p>
                    )}
                  </div>
                  {!alert.acknowledged_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => acknowledgeAlert.mutate(alert.id)}
                      title="Accuser réception"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lien vers la liste complète */}
        {alerts.length > maxAlerts && (
          <div className="mt-3 text-center">
            <Link to="/admin/alertes-budget">
              <Button variant="link" size="sm" className="text-xs">
                Voir toutes les alertes ({alerts.length})
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
