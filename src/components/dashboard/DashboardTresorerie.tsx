import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTresorerieDashboard } from "@/hooks/useDashboardByRole";
import { 
  Wallet, 
  CreditCard, 
  ArrowDownRight, 
  Clock, 
  Calendar,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardTresorerie() {
  const { data: stats, isLoading } = useTresorerieDashboard();

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
      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/ordonnancements?filter=valides">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ordres à payer</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordresPayerEnAttente || 0}</div>
              <p className="text-xs text-muted-foreground">En attente de paiement</p>
              <p className="text-sm font-medium text-primary mt-2">{formatMontant(stats?.ordresPayerMontant || 0)} FCFA</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Règlements du jour</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.reglementsDuJour || 0}</div>
            <p className="text-xs text-muted-foreground">Paiements effectués</p>
            <p className="text-sm font-medium mt-2">{formatMontant(stats?.reglementsMontantJour || 0)} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Règlements semaine</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reglementsSemaine || 0}</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
            <p className="text-sm font-medium mt-2">{formatMontant(stats?.reglementsMontantSemaine || 0)} FCFA</p>
          </CardContent>
        </Card>

        <Link to="/reglements?filter=partiels">
          <Card className="hover:border-warning/30 transition-colors cursor-pointer h-full border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Partiels en attente</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats?.reglementsPartiels || 0}</div>
              <p className="text-xs text-muted-foreground">Paiements partiels</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Prévisions de sortie */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
              Prévisions de sortie
            </CardTitle>
            <CardDescription>Échéances de paiement à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">7 prochains jours</p>
                    <p className="text-xs text-muted-foreground">Paiements prévus</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{formatMontant(stats?.previsionSorties7j || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">30 prochains jours</p>
                    <p className="text-xs text-muted-foreground">Paiements prévus</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{formatMontant(stats?.previsionSorties30j || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Position de trésorerie
            </CardTitle>
            <CardDescription>État actuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">À régler</p>
                <p className="text-3xl font-bold">{formatMontant(stats?.ordresPayerMontant || 0)}</p>
                <p className="text-xs text-muted-foreground">FCFA en attente</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Ordres validés</p>
                  <p className="text-lg font-bold">{stats?.ordresPayerEnAttente || 0}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Paiements partiels</p>
                  <p className="text-lg font-bold">{stats?.reglementsPartiels || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/reglements?action=create">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-success/10">
                  <CreditCard className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enregistrer un règlement</p>
                  <p className="text-xs text-muted-foreground">Nouveau paiement</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/ordonnancements?filter=valides">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ordres à payer</p>
                  <p className="text-xs text-muted-foreground">En attente de règlement</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/etats?tab=suivi">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Suivi budgétaire</p>
                  <p className="text-xs text-muted-foreground">États d'exécution</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
