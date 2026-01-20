import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileCheck, 
  ClipboardCheck, 
  CreditCard 
} from "lucide-react";
import { ExecutionSummary } from "@/hooks/useEtatsExecution";

interface SuiviBudgetaireProps {
  summary: ExecutionSummary;
}

const formatMontant = (montant: number) => {
  if (montant >= 1000000000) {
    return (montant / 1000000000).toFixed(2) + " Mds";
  }
  if (montant >= 1000000) {
    return (montant / 1000000).toFixed(1) + " M";
  }
  return new Intl.NumberFormat("fr-FR").format(montant);
};

const formatMontantFull = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export function SuiviBudgetaire({ summary }: SuiviBudgetaireProps) {
  const getTauxColor = (taux: number) => {
    if (taux >= 80) return "text-success";
    if (taux >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dotation totale</p>
                <p className="text-2xl font-bold">{formatMontant(summary.dotation_totale)}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant engagé</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatMontant(summary.montant_engage)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.taux_engagement.toFixed(1)}% de la dotation
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <FileCheck className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant payé</p>
                <p className="text-2xl font-bold text-success">
                  {formatMontant(summary.montant_paye)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.dotation_totale > 0 ? ((summary.montant_paye / summary.dotation_totale) * 100).toFixed(1) : 0}% de la dotation
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className="text-2xl font-bold">
                  {formatMontant(summary.reste_a_engager)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.dotation_totale > 0 ? ((summary.reste_a_engager / summary.dotation_totale) * 100).toFixed(1) : 0}% restant
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                {summary.reste_a_engager > 0 ? (
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progression de l'exécution budgétaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Taux d'engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getTauxColor(summary.taux_engagement)}`}>
                  {summary.taux_engagement.toFixed(1)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatMontantFull(summary.montant_engage)}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min(summary.taux_engagement, 100)} className="h-3" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Taux de liquidation (sur engagé)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getTauxColor(summary.taux_liquidation)}`}>
                  {summary.taux_liquidation.toFixed(1)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatMontantFull(summary.montant_liquide)}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min(summary.taux_liquidation, 100)} className="h-3" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Taux d'ordonnancement (sur liquidé)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getTauxColor(summary.taux_ordonnancement)}`}>
                  {summary.taux_ordonnancement.toFixed(1)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatMontantFull(summary.montant_ordonnance)}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min(summary.taux_ordonnancement, 100)} className="h-3" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Taux de paiement (sur ordonnancé)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getTauxColor(summary.taux_paiement)}`}>
                  {summary.taux_paiement.toFixed(1)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatMontantFull(summary.montant_paye)}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min(summary.taux_paiement, 100)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Restes à */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Restes à traiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <p className="text-sm text-muted-foreground">Reste à engager</p>
              <p className="text-xl font-bold text-secondary">
                {formatMontant(summary.reste_a_engager)}
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-muted-foreground">Reste à liquider</p>
              <p className="text-xl font-bold text-amber-600">
                {formatMontant(summary.reste_a_liquider)}
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Reste à ordonnancer</p>
              <p className="text-xl font-bold text-blue-600">
                {formatMontant(summary.reste_a_ordonnancer)}
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <p className="text-sm text-muted-foreground">Reste à payer</p>
              <p className="text-xl font-bold text-success">
                {formatMontant(summary.reste_a_payer)}
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
