import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDAFDashboard } from "@/hooks/useDashboardByRole";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
import { 
  FileText, 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardDAF() {
  const { data: stats, isLoading } = useDAFDashboard();
  const { data: alerts } = useDashboardAlerts();

  const warningAlerts = alerts?.filter(a => a.severity === "warning" || a.severity === "critical") || [];

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
      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-4">
        <Link to="/notes-aef?filter=a_imputer">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.notesAImputer || 0} notes à imputer</p>
                <p className="text-xs text-muted-foreground">En attente d'imputation</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/engagements?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.engagementsAValider || 0} engagements</p>
                <p className="text-xs text-muted-foreground">À valider</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/liquidations?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Receipt className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.liquidationsAValider || 0} liquidations</p>
                <p className="text-xs text-muted-foreground">À valider</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card className={stats?.depassementsBudgetaires ? "border-destructive/50" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{stats?.depassementsBudgetaires || 0} dépassements</p>
              <p className="text-xs text-muted-foreground">Lignes budgétaires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Workflow */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Engagements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">À valider</span>
                <Badge variant="outline">{stats?.engagementsAValider || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">En validation</span>
                <Badge variant="secondary">{stats?.engagementsEnValidation || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Validés</span>
                <Badge className="bg-success/10 text-success border-success/20">{stats?.engagementsValides || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant engagé</span>
                <span className="font-medium">{formatMontant(stats?.montantEngageMois || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant liquidé</span>
                <span className="font-medium">{formatMontant(stats?.montantLiquideMois || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">À imputer</span>
                <Badge variant="outline">{stats?.notesAImputer || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total exercice</span>
                <span className="text-muted-foreground">{stats?.notesTotales || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restes à traiter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Restes à traiter
          </CardTitle>
          <CardDescription>Montants en attente par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
              <p className="text-xs text-muted-foreground">FCFA engagés non liquidés</p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reste à payer</span>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatMontant(stats?.resteAPayer || 0)}</p>
              <p className="text-xs text-muted-foreground">FCFA liquidés non payés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {warningAlerts.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningAlerts.slice(0, 5).map(alert => (
                <Link key={alert.id} to={alert.link || "#"} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors">
                    <Badge variant={alert.severity === "critical" ? "destructive" : "outline"} className="text-xs">
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
