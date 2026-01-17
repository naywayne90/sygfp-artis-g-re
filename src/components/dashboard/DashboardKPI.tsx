import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useDGDashboard,
  useDAFDashboard,
  useControleurDashboard,
} from "@/hooks/useDashboardByRole";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
import { usePermissions } from "@/hooks/usePermissions";
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  ArrowRight,
  Eye,
  Shield,
  Timer,
  AlertCircle,
  BarChart3,
  Settings,
  Activity,
  Target,
  Gauge,
  PieChart,
  LineChart,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

// Empty state component with tracking activation
function EmptyStateWithTracking({
  icon: Icon,
  title,
  description,
  trackingType,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  trackingType: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      <Button variant="outline" size="sm" className="gap-2">
        <Settings className="h-4 w-4" />
        Activer le tracking {trackingType}
      </Button>
    </div>
  );
}

// Section DG : Exécution globale, alertes critiques, dossiers en attente signature
function DGSection() {
  const { data: stats, isLoading } = useDGDashboard();
  const { data: alerts } = useDashboardAlerts();

  const criticalAlerts = alerts?.filter((a) => a.severity === "critical") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertes critiques */}
      {criticalAlerts.length > 0 ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? "s" : ""} critique
              {criticalAlerts.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 4).map((alert) => (
                <Link key={alert.id} to={alert.link || "#"} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:border-destructive/30 transition-colors">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-success">Aucune alerte critique</p>
                <p className="text-sm text-muted-foreground">
                  Toutes les opérations sont dans les seuils normaux
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exécution globale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Exécution budgétaire globale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-primary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Taux global</p>
              <p className="text-2xl font-bold text-primary">{stats?.tauxConsommation || 0}%</p>
              <Progress value={stats?.tauxConsommation || 0} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs text-muted-foreground">Budget total</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetGlobal || 0)}</p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Engagé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetEngage || 0)}</p>
              <Progress
                value={stats?.budgetGlobal ? (stats.budgetEngage / stats.budgetGlobal) * 100 : 0}
                className="h-2"
              />
            </div>
            <div className="p-4 rounded-lg bg-success/10 space-y-2">
              <p className="text-xs text-muted-foreground">Payé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetPaye || 0)}</p>
              <Progress
                value={stats?.budgetGlobal ? (stats.budgetPaye / stats.budgetGlobal) * 100 : 0}
                className="h-2 [&>div]:bg-success"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dossiers en attente de signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5 text-primary" />
            Dossiers en attente de signature
          </CardTitle>
          <CardDescription>Éléments nécessitant votre validation</CardDescription>
        </CardHeader>
        <CardContent>
          {(stats?.dossiersEnCours || 0) > 0 ? (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Link to="/engagements?filter=a_signer" className="block">
                <div className="p-4 rounded-lg border hover:border-primary/30 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <Badge variant="secondary">À signer</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats?.engagementsASigner || 0}</p>
                  <p className="text-xs text-muted-foreground">Engagements</p>
                </div>
              </Link>
              <Link to="/liquidations?filter=a_signer" className="block">
                <div className="p-4 rounded-lg border hover:border-primary/30 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <Receipt className="h-5 w-5 text-warning" />
                    <Badge variant="secondary">À signer</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats?.liquidationsASigner || 0}</p>
                  <p className="text-xs text-muted-foreground">Liquidations</p>
                </div>
              </Link>
              <Link to="/ordonnancements?filter=a_signer" className="block">
                <div className="p-4 rounded-lg border hover:border-primary/30 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <FileCheck className="h-5 w-5 text-secondary" />
                    <Badge variant="secondary">À signer</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats?.ordonnancementsASigner || 0}</p>
                  <p className="text-xs text-muted-foreground">Ordonnancements</p>
                </div>
              </Link>
              <div className="p-4 rounded-lg bg-destructive/10 space-y-2">
                <div className="flex items-center justify-between">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <Badge variant="destructive">Bloqués</Badge>
                </div>
                <p className="text-2xl font-bold">{stats?.dossiersBloques || 0}</p>
                <p className="text-xs text-muted-foreground">À débloquer</p>
              </div>
            </div>
          ) : (
            <EmptyStateWithTracking
              icon={FileCheck}
              title="Aucun dossier en attente"
              description="Les données de signature ne sont pas encore disponibles pour cet exercice."
              trackingType="des signatures"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Section DAF : Engagements par direction, reste à payer, plan trésorerie, tâches
function DAFSection() {
  const { data: stats, isLoading } = useDAFDashboard();
  const { data: alerts } = useDashboardAlerts();

  const warningAlerts = alerts?.filter((a) => a.severity === "warning" || a.severity === "critical") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tâches à traiter */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Link to="/notes-aef?filter=a_imputer">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">{stats?.notesAImputer || 0}</p>
                <p className="text-xs text-muted-foreground">Notes à imputer</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/engagements?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">{stats?.engagementsAValider || 0}</p>
                <p className="text-xs text-muted-foreground">Engagements à valider</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/liquidations?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Receipt className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">{stats?.liquidationsAValider || 0}</p>
                <p className="text-xs text-muted-foreground">Liquidations à valider</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className={stats?.depassementsBudgetaires ? "border-destructive/50" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">{stats?.depassementsBudgetaires || 0}</p>
              <p className="text-xs text-muted-foreground">Dépassements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restes à traiter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-primary" />
            Restes à traiter
          </CardTitle>
          <CardDescription>Montants en attente par étape</CardDescription>
        </CardHeader>
        <CardContent>
          {(stats?.resteAEngager || 0) > 0 ||
          (stats?.resteALiquider || 0) > 0 ||
          (stats?.resteAPayer || 0) > 0 ? (
            <div className="grid gap-4 grid-cols-3">
              <div className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reste à engager</span>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatMontant(stats?.resteAEngager || 0)}</p>
                <p className="text-xs text-muted-foreground">FCFA disponible</p>
              </div>
              <div className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reste à liquider</span>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatMontant(stats?.resteALiquider || 0)}</p>
                <p className="text-xs text-muted-foreground">FCFA engagés</p>
              </div>
              <div className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reste à payer</span>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatMontant(stats?.resteAPayer || 0)}</p>
                <p className="text-xs text-muted-foreground">FCFA liquidés</p>
              </div>
            </div>
          ) : (
            <EmptyStateWithTracking
              icon={Wallet}
              title="Pas de données de reste à traiter"
              description="Les montants seront disponibles une fois que le budget sera chargé et les opérations initiées."
              trackingType="des restes"
            />
          )}
        </CardContent>
      </Card>

      {/* Plan de trésorerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Plan de trésorerie
          </CardTitle>
          <CardDescription>Prévisions et échéances de paiement</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStateWithTracking
            icon={BarChart3}
            title="Plan de trésorerie non configuré"
            description="Le module de prévision de trésorerie n'est pas encore activé pour cet exercice."
            trackingType="de la trésorerie"
          />
        </CardContent>
      </Card>

      {/* Alertes */}
      {warningAlerts.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning text-base">
              <AlertTriangle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningAlerts.slice(0, 4).map((alert) => (
                <Link key={alert.id} to={alert.link || "#"} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors">
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {alert.type}
                    </Badge>
                    <span className="text-sm flex-1 truncate">{alert.title}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Section Contrôleur : Lignes critiques, engagements à viser, délais moyens, anomalies
function ControleurSection() {
  const { data: stats, isLoading } = useControleurDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className={stats?.lignesCritiques ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Lignes critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats?.lignesCritiques || 0}</div>
            <p className="text-xs text-muted-foreground">&gt;90% consommées</p>
          </CardContent>
        </Card>

        <Card className={stats?.lignesAlertes ? "border-warning/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Lignes en alerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats?.lignesAlertes || 0}</div>
            <p className="text-xs text-muted-foreground">&gt;80% consommées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Engagements à viser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.engagementsAViser || 0}</div>
            <p className="text-xs text-muted-foreground">En attente de visa CB</p>
          </CardContent>
        </Card>

        <Card className={stats?.anomaliesDetectees ? "border-orange-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats?.anomaliesDetectees || 0}</div>
            <p className="text-xs text-muted-foreground">Détectées</p>
          </CardContent>
        </Card>
      </div>

      {/* Lignes critiques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-destructive" />
            Lignes budgétaires critiques
          </CardTitle>
          <CardDescription>Lignes avec taux de consommation &gt;90%</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.lignesCritiquesDetails && stats.lignesCritiquesDetails.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {stats.lignesCritiquesDetails.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ligne.code}</p>
                      <p className="text-xs text-muted-foreground truncate">{ligne.label}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatMontant(ligne.engage)}</p>
                        <p className="text-xs text-muted-foreground">
                          sur {formatMontant(ligne.dotation)}
                        </p>
                      </div>
                      <Badge
                        variant="destructive"
                        className={
                          ligne.tauxConsommation >= 100
                            ? "bg-destructive"
                            : "bg-destructive/80"
                        }
                      >
                        {ligne.tauxConsommation.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : stats?.trackingEnabled?.alertes ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="font-medium text-success">Aucune ligne critique</p>
                <p className="text-sm text-muted-foreground">
                  Toutes les lignes sont sous le seuil de 90%
                </p>
              </div>
            </div>
          ) : (
            <EmptyStateWithTracking
              icon={Target}
              title="Suivi des lignes non activé"
              description="Le suivi des seuils de consommation n'est pas configuré pour cet exercice."
              trackingType="des seuils"
            />
          )}
        </CardContent>
      </Card>

      {/* Délais moyens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-5 w-5 text-primary" />
            Délais moyens de traitement
          </CardTitle>
          <CardDescription>Temps moyen entre création et validation</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.trackingEnabled?.delais ? (
            <div className="grid gap-4 grid-cols-2">
              <div className="p-4 rounded-lg bg-primary/10 space-y-2">
                <p className="text-sm text-muted-foreground">Délai engagement</p>
                <p className="text-3xl font-bold">
                  {stats?.delaiMoyenEngagement !== null
                    ? `${stats.delaiMoyenEngagement.toFixed(1)} j`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Création → Validation CB</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/10 space-y-2">
                <p className="text-sm text-muted-foreground">Délai liquidation</p>
                <p className="text-3xl font-bold">
                  {stats?.delaiMoyenLiquidation !== null
                    ? `${stats.delaiMoyenLiquidation.toFixed(1)} j`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Création → Validation DAF</p>
              </div>
            </div>
          ) : (
            <EmptyStateWithTracking
              icon={Timer}
              title="Tracking des délais non activé"
              description="Le calcul des délais moyens nécessite l'activation du tracking temporel."
              trackingType="des délais"
            />
          )}
        </CardContent>
      </Card>

      {/* Anomalies détectées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-orange-500" />
            Anomalies détectées
          </CardTitle>
          <CardDescription>Irrégularités et points d'attention</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.trackingEnabled?.anomalies ? (
            stats?.anomaliesDetails && stats.anomaliesDetails.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {stats.anomaliesDetails.map((anomalie, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        anomalie.severity === "critical"
                          ? "border-destructive/50 bg-destructive/5"
                          : anomalie.severity === "warning"
                          ? "border-warning/50 bg-warning/5"
                          : "border-muted"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-full ${
                          anomalie.severity === "critical"
                            ? "bg-destructive/10"
                            : anomalie.severity === "warning"
                            ? "bg-warning/10"
                            : "bg-muted"
                        }`}
                      >
                        <AlertCircle
                          className={`h-4 w-4 ${
                            anomalie.severity === "critical"
                              ? "text-destructive"
                              : anomalie.severity === "warning"
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              anomalie.severity === "critical"
                                ? "destructive"
                                : anomalie.severity === "warning"
                                ? "outline"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {anomalie.type}
                          </Badge>
                        </div>
                        <p className="text-sm">{anomalie.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="font-medium text-success">Aucune anomalie détectée</p>
                  <p className="text-sm text-muted-foreground">
                    Les contrôles automatiques n'ont relevé aucune irrégularité
                  </p>
                </div>
              </div>
            )
          ) : (
            <EmptyStateWithTracking
              icon={Shield}
              title="Détection d'anomalies non activée"
              description="Le système de détection automatique des anomalies n'est pas configuré."
              trackingType="des anomalies"
            />
          )}
        </CardContent>
      </Card>

      {/* Synthèse budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5 text-primary" />
            Synthèse budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-center">
              <p className="text-xs text-muted-foreground">Total lignes</p>
              <p className="text-2xl font-bold">{stats?.totalLignes || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 space-y-2 text-center">
              <p className="text-xs text-muted-foreground">Montant engagé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.montantEngage || 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 space-y-2 text-center">
              <p className="text-xs text-muted-foreground">Disponible</p>
              <p className="text-xl font-bold">{formatMontant(stats?.montantDisponible || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with conditional rendering
export function DashboardKPI() {
  const { hasAnyRole } = usePermissions();

  // Detect primary role
  const isDG = hasAnyRole(["DG"]);
  const isDAF = hasAnyRole(["DAF", "SDCT", "SAF"]);
  const isControleur = hasAnyRole(["CB", "DAAF"]);

  // Determine visible sections
  const sections = [];
  if (isDG) sections.push({ id: "dg", label: "Direction Générale", icon: TrendingUp });
  if (isDAF) sections.push({ id: "daf", label: "DAF/SDCT", icon: Building2 });
  if (isControleur) sections.push({ id: "controleur", label: "Contrôle Budgétaire", icon: Shield });

  // If user has no specific role, show all sections
  if (sections.length === 0) {
    sections.push({ id: "dg", label: "Direction Générale", icon: TrendingUp });
    sections.push({ id: "daf", label: "DAF/SDCT", icon: Building2 });
    sections.push({ id: "controleur", label: "Contrôle Budgétaire", icon: Shield });
  }

  // Default to first available section
  const defaultSection = sections[0]?.id || "dg";

  // If only one section, render directly without tabs
  if (sections.length === 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          {sections[0].id === "dg" && <TrendingUp className="h-5 w-5 text-primary" />}
          {sections[0].id === "daf" && <Building2 className="h-5 w-5 text-primary" />}
          {sections[0].id === "controleur" && <Shield className="h-5 w-5 text-primary" />}
          <h2 className="text-lg font-semibold">Dashboard KPI - {sections[0].label}</h2>
        </div>
        {sections[0].id === "dg" && <DGSection />}
        {sections[0].id === "daf" && <DAFSection />}
        {sections[0].id === "controleur" && <ControleurSection />}
      </div>
    );
  }

  // Multiple sections - render with tabs
  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultSection} className="space-y-6">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="gap-2">
              <section.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.some((s) => s.id === "dg") && (
          <TabsContent value="dg">
            <DGSection />
          </TabsContent>
        )}

        {sections.some((s) => s.id === "daf") && (
          <TabsContent value="daf">
            <DAFSection />
          </TabsContent>
        )}

        {sections.some((s) => s.id === "controleur") && (
          <TabsContent value="controleur">
            <ControleurSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
