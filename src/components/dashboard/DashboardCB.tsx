import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardAlerts } from '@/hooks/useDashboardAlerts';
import {
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardCB() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: alerts } = useDashboardAlerts();

  const warningAlerts =
    alerts?.filter((a) => a.severity === 'warning' || a.severity === 'critical') || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Controle Budgetaire</h1>
          <p className="text-muted-foreground">Suivi et validation des credits</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-4">
        <Link to="/engagements?filter=a_viser">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.engagementsEnCours || 0} visas en attente</p>
                <p className="text-xs text-muted-foreground">Engagements a viser</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/planification/structure">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{formatMontant(stats?.budgetDisponible || 0)}</p>
                <p className="text-xs text-muted-foreground">Credits disponibles</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/etats-execution">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.tauxEngagement || 0}%</p>
                <p className="text-xs text-muted-foreground">Taux d'execution</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card className={stats?.depassementsBudgetaires ? 'border-destructive/50' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{stats?.depassementsBudgetaires || 0} depassements</p>
              <p className="text-xs text-muted-foreground">Lignes budgetaires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Execution budgetaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux d'engagement</span>
                <Badge variant="outline">{stats?.tauxEngagement || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux de liquidation</span>
                <Badge variant="secondary">{stats?.tauxLiquidation || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux de paiement</span>
                <Badge className="bg-success/10 text-success border-success/20">
                  {stats?.tauxPaiement || 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credits budgetaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Budget total</span>
                <span className="font-medium">{formatMontant(stats?.budgetTotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Engage</span>
                <span className="font-medium">{formatMontant(stats?.montantEngage || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disponible</span>
                <span className="font-medium text-success">
                  {formatMontant(stats?.budgetDisponible || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Visas et controles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">En attente</span>
                <Badge variant="outline">{stats?.engagementsEnCours || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vises ce mois</span>
                <Badge variant="secondary">{stats?.engagementsValides || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rejetes</span>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  {stats?.engagementsRejetes || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides CB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Acces rapides Controle Budgetaire
          </CardTitle>
          <CardDescription>Modules frequemment utilises</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link to="/engagements" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-warning" />
                <p className="font-medium">Engagements</p>
                <p className="text-xs text-muted-foreground">Validation des visas</p>
              </div>
            </Link>
            <Link to="/planification/structure" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Structure budgetaire</p>
                <p className="text-xs text-muted-foreground">Suivi des credits</p>
              </div>
            </Link>
            <Link to="/etats-execution" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="font-medium">Etats d'execution</p>
                <p className="text-xs text-muted-foreground">Rapports budgetaires</p>
              </div>
            </Link>
            <Link to="/liquidations" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-secondary" />
                <p className="font-medium">Liquidations</p>
                <p className="text-xs text-muted-foreground">Suivi des paiements</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {warningAlerts.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertes budgetaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningAlerts.slice(0, 5).map((alert) => (
                <Link key={alert.id} to={alert.link || '#'} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors">
                    <Badge
                      variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
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
