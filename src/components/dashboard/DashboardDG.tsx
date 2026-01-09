import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDGDashboard } from "@/hooks/useDashboardByRole";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
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
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardDG() {
  const { data: stats, isLoading } = useDGDashboard();
  const { data: alerts } = useDashboardAlerts();

  const criticalAlerts = alerts?.filter(a => a.severity === "critical") || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {criticalAlerts.slice(0, 6).map(alert => (
                <Link key={alert.id} to={alert.link || "#"} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:border-destructive/30 transition-colors">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget Global</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats?.budgetGlobal || 0)}</div>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux Consommation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.tauxConsommation || 0}%</div>
            <Progress value={stats?.tauxConsommation || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dossiers Bloqués</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.dossiersBloques || 0}</div>
            <p className="text-xs text-muted-foreground">À débloquer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépassements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.alertesDepassement || 0}</div>
            <p className="text-xs text-muted-foreground">Lignes en dépassement</p>
          </CardContent>
        </Card>
      </div>

      {/* Exécution budgétaire détaillée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Exécution budgétaire
          </CardTitle>
          <CardDescription>Progression par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-primary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Engagé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetEngage || 0)}</p>
              <Progress value={stats?.budgetGlobal ? ((stats.budgetEngage / stats.budgetGlobal) * 100) : 0} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-secondary/10 space-y-2">
              <p className="text-xs text-muted-foreground">Liquidé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetLiquide || 0)}</p>
              <Progress value={stats?.budgetEngage ? ((stats.budgetLiquide / stats.budgetEngage) * 100) : 0} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-warning/10 space-y-2">
              <p className="text-xs text-muted-foreground">Ordonnancé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetOrdonnance || 0)}</p>
              <Progress value={stats?.budgetLiquide ? ((stats.budgetOrdonnance / stats.budgetLiquide) * 100) : 0} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-success/10 space-y-2">
              <p className="text-xs text-muted-foreground">Payé</p>
              <p className="text-xl font-bold">{formatMontant(stats?.budgetPaye || 0)}</p>
              <Progress value={stats?.budgetOrdonnance ? ((stats.budgetPaye / stats.budgetOrdonnance) * 100) : 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Chaîne de Dépense */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Pipeline de la Chaîne de Dépense
          </CardTitle>
          <CardDescription>Progression de l'exécution budgétaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-5">
            <Link to="/notes-aef" className="block">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:shadow-md transition-all border border-transparent hover:border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary" className="text-xs">Notes</Badge>
                </div>
                <p className="text-lg font-bold">Étape 1</p>
                <p className="text-xs text-muted-foreground">Autorisation</p>
              </div>
            </Link>
            
            <Link to="/engagements" className="block">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:shadow-md transition-all border border-transparent hover:border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <Badge variant="secondary" className="text-xs">Eng.</Badge>
                </div>
                <p className="text-lg font-bold">{formatMontant(stats?.budgetEngage || 0)}</p>
                <p className="text-xs text-muted-foreground">engagé</p>
              </div>
            </Link>
            
            <Link to="/liquidations" className="block">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:shadow-md transition-all border border-transparent hover:border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="h-5 w-5 text-amber-600" />
                  <Badge variant="secondary" className="text-xs">Liq.</Badge>
                </div>
                <p className="text-lg font-bold">{formatMontant(stats?.budgetLiquide || 0)}</p>
                <p className="text-xs text-muted-foreground">liquidé</p>
              </div>
            </Link>
            
            <Link to="/ordonnancements" className="block">
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 hover:shadow-md transition-all border border-transparent hover:border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <FileCheck className="h-5 w-5 text-purple-600" />
                  <Badge variant="secondary" className="text-xs">Ord.</Badge>
                </div>
                <p className="text-lg font-bold">{formatMontant(stats?.budgetOrdonnance || 0)}</p>
                <p className="text-xs text-muted-foreground">ordonnancé</p>
              </div>
            </Link>
            
            <Link to="/reglements" className="block">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 hover:shadow-md transition-all border border-transparent hover:border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="text-xs">Règl.</Badge>
                </div>
                <p className="text-lg font-bold">{formatMontant(stats?.budgetPaye || 0)}</p>
                <p className="text-xs text-muted-foreground">payé</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Directions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Top 5 Directions
            </CardTitle>
            <CardDescription>Par dotation budgétaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topDirections.map((dir, index) => (
                <div key={dir.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                      <span className="font-medium">{dir.code}</span>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">{dir.label}</span>
                    </div>
                    <Badge variant={dir.tauxExecution > 80 ? "destructive" : dir.tauxExecution > 50 ? "default" : "secondary"}>
                      {dir.tauxExecution}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={dir.tauxExecution} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-20 text-right">{formatMontant(dir.dotation)}</span>
                  </div>
                </div>
              ))}
              {(!stats?.topDirections || stats.topDirections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* État des dossiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              État des dossiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersEnCours || 0}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersBloques || 0}</p>
                  <p className="text-xs text-muted-foreground">Bloqués</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersValides || 0}</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{stats?.dossiersSoldes || 0}</p>
                  <p className="text-xs text-muted-foreground">Soldés</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
