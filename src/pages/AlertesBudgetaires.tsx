import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useBudgetAlerts, BudgetAlert } from "@/hooks/useBudgetAlerts";
import { useExercice } from "@/contexts/ExerciceContext";
import { cn } from "@/lib/utils";

const formatMontant = (montant: number | null) => {
  if (montant === null) return "N/A";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

const getNiveauIcon = (niveau: string) => {
  switch (niveau) {
    case "blocking":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "critical":
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    default:
      return <Bell className="h-5 w-5 text-blue-600" />;
  }
};

const AlertCard = ({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: BudgetAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) => {
  const { NIVEAU_COLORS, NIVEAU_LABELS } = useBudgetAlerts();
  const colors = NIVEAU_COLORS[alert.niveau];

  return (
    <Card className={cn("transition-all", colors.border, !alert.acknowledged_at && "ring-2 ring-offset-2", 
      alert.niveau === 'blocking' && !alert.acknowledged_at && "ring-red-500",
      alert.niveau === 'critical' && !alert.acknowledged_at && "ring-orange-500",
    )}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className={cn("p-2 rounded-full h-fit", colors.bg)}>
            {getNiveauIcon(alert.niveau)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn(colors.bg, colors.text)}>
                    {NIVEAU_LABELS[alert.niveau]}
                  </Badge>
                  <Badge variant="outline">Seuil {alert.seuil_atteint}%</Badge>
                  {alert.acknowledged_at && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Vu
                    </Badge>
                  )}
                  {alert.resolved_at && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Résolu
                    </Badge>
                  )}
                </div>
                <p className="font-medium mt-1">{alert.message}</p>
              </div>
            </div>

            {/* Détails chiffrés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground text-xs">Dotation</span>
                <p className="font-medium">{formatMontant(alert.montant_dotation)}</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground text-xs">Engagé</span>
                <p className="font-medium text-primary">{formatMontant(alert.montant_engage)}</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground text-xs">Taux</span>
                <p className="font-medium">{alert.taux_actuel?.toFixed(1)}%</p>
              </div>
              <div className={cn("p-2 rounded", 
                (alert.montant_disponible || 0) <= 0 ? "bg-red-100" : "bg-green-100"
              )}>
                <span className="text-muted-foreground text-xs">Disponible</span>
                <p className={cn("font-medium", 
                  (alert.montant_disponible || 0) <= 0 ? "text-red-600" : "text-green-600"
                )}>
                  {formatMontant(alert.montant_disponible)}
                </p>
              </div>
            </div>

            {/* Actions et métadonnées */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{format(new Date(alert.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</span>
                {alert.budget_line && (
                  <Link 
                    to={`/planification/budget?search=${alert.budget_line.code}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {alert.budget_line.code}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex gap-2">
                {!alert.acknowledged_at && (
                  <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Accuser réception
                  </Button>
                )}
                {alert.acknowledged_at && !alert.resolved_at && (
                  <Button size="sm" variant="default" onClick={() => onResolve(alert.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Résoudre
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AlertesBudgetaires() {
  const { exercice } = useExercice();
  const {
    alerts,
    isLoadingAlerts,
    unacknowledgedCount,
    rules,
    isLoadingRules,
    checkAlerts,
    acknowledgeAlert,
    resolveAlert,
    updateRule,
  } = useBudgetAlerts();

  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = !searchTerm || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.budget_line?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "pending" && !alert.resolved_at) ||
      (filter === "resolved" && alert.resolved_at);

    return matchesSearch && matchesFilter;
  });

  const pendingCount = alerts.filter(a => !a.resolved_at).length;
  const resolvedCount = alerts.filter(a => a.resolved_at).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-warning" />
            Alertes Budgétaires
          </h1>
          <p className="page-description">
            Gestion des alertes de seuils budgétaires - Exercice {exercice}
          </p>
        </div>
        <Button 
          onClick={() => checkAlerts.mutate()} 
          disabled={checkAlerts.isPending}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", checkAlerts.isPending && "animate-spin")} />
          Vérifier les seuils
        </Button>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unacknowledgedCount}</p>
              <p className="text-sm text-muted-foreground">Non acquittées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-sm text-muted-foreground">Résolues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.filter(r => r.actif).length}</p>
              <p className="text-sm text-muted-foreground">Règles actives</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertes
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unacknowledgedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4 mt-4">
          {/* Filtres */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Rechercher par code ou message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                En attente ({pendingCount})
              </Button>
              <Button
                variant={filter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("resolved")}
              >
                Résolues ({resolvedCount})
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Toutes ({alerts.length})
              </Button>
            </div>
          </div>

          {/* Liste des alertes */}
          {isLoadingAlerts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                {filter === "pending" 
                  ? "Aucune alerte en attente. Le budget est sous contrôle !" 
                  : "Aucune alerte trouvée avec ces critères."}
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
                    onResolve={(id) => resolveAlert.mutate({ alertId: id })}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'alerte</CardTitle>
              <CardDescription>
                Configurez les seuils de déclenchement des alertes budgétaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRules ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        rule.actif ? "bg-muted/50" : "bg-muted/20 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
                          rule.seuil_pct >= 100 ? "bg-red-100 text-red-700" :
                          rule.seuil_pct >= 95 ? "bg-orange-100 text-orange-700" :
                          rule.seuil_pct >= 90 ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {rule.seuil_pct}%
                        </div>
                        <div>
                          <p className="font-medium">{rule.description || `Seuil à ${rule.seuil_pct}%`}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{rule.scope}</Badge>
                            <Badge variant="secondary">{rule.canal}</Badge>
                            {rule.destinataires_roles?.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={rule.actif}
                        onCheckedChange={(checked) => 
                          updateRule.mutate({ ruleId: rule.id, updates: { actif: checked } })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
