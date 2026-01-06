import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTresorerie, useTresorerieDashboard } from "@/hooks/useTresorerie";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";

export function PlanTresorerie() {
  const { comptes, stats } = useTresorerie();
  const dashboard = useTresorerieDashboard();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  return (
    <div className="space-y-6">
      {/* Résumé des comptes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Position de trésorerie
          </CardTitle>
          <CardDescription>Soldes actuels par compte</CardDescription>
        </CardHeader>
        <CardContent>
          {comptes.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead className="text-right">Solde initial</TableHead>
                  <TableHead className="text-right">Solde actuel</TableHead>
                  <TableHead className="text-right">Variation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comptes.data?.filter(c => c.est_actif).map((compte) => {
                  const variation = compte.solde_actuel - compte.solde_initial;
                  return (
                    <TableRow key={compte.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{compte.libelle}</span>
                          <span className="text-muted-foreground text-sm ml-2">({compte.code})</span>
                        </div>
                      </TableCell>
                      <TableCell>{compte.banque || "-"}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(compte.solde_initial)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        <span className={compte.solde_actuel < 0 ? "text-destructive" : ""}>
                          {formatMontant(compte.solde_actuel)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {variation >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span className={variation >= 0 ? "text-success" : "text-destructive"}>
                            {variation >= 0 ? "+" : ""}{formatMontant(variation)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMontant(stats.data?.soldeTotal || 0)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Prévisions de décaissements</CardTitle>
          <CardDescription>Basées sur les ordonnancements validés en attente de règlement</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Ordres à payer</div>
                <div className="text-2xl font-bold">{dashboard.data?.ordresAPayer || 0}</div>
                <div className="text-sm text-muted-foreground">
                  {formatMontant(dashboard.data?.montantOrdres || 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Prévision 7 jours</div>
                <div className="text-2xl font-bold text-destructive">
                  -{formatMontant(dashboard.data?.prevision7j || 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Prévision 30 jours</div>
                <div className="text-2xl font-bold text-destructive">
                  -{formatMontant(dashboard.data?.prevision30j || 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Règlements partiels</div>
                <div className="text-2xl font-bold text-warning">
                  {dashboard.data?.reglementsPartiels || 0}
                </div>
                <div className="text-sm text-muted-foreground">en attente de solde</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solde prévisionnel */}
      <Card>
        <CardHeader>
          <CardTitle>Solde prévisionnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Solde actuel</div>
              <div className="text-3xl font-bold">
                {formatMontant(stats.data?.soldeTotal || 0)}
              </div>
            </div>
            <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="text-sm text-muted-foreground mb-2">Après décaissements 7j</div>
              <div className="text-3xl font-bold">
                {formatMontant((stats.data?.soldeTotal || 0) - (dashboard.data?.prevision7j || 0))}
              </div>
            </div>
            <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="text-sm text-muted-foreground mb-2">Après décaissements 30j</div>
              <div className="text-3xl font-bold">
                {formatMontant((stats.data?.soldeTotal || 0) - (dashboard.data?.prevision30j || 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
