import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, TrendingUp, FileSpreadsheet } from "lucide-react";

const budgetLines = [
  { code: "2.1", label: "Personnel", dotation: 500000000, engage: 450000000, liquide: 400000000 },
  { code: "2.2", label: "Biens et services", dotation: 800000000, engage: 650000000, liquide: 520000000 },
  { code: "2.3", label: "Investissements", dotation: 1200000000, engage: 780000000, liquide: 450000000 },
  { code: "6.1", label: "Fournitures", dotation: 150000000, engage: 120000000, liquide: 95000000 },
  { code: "6.2", label: "Entretien", dotation: 200000000, engage: 180000000, liquide: 160000000 },
];

const formatMontant = (montant: number) => {
  if (montant >= 1000000000) {
    return (montant / 1000000000).toFixed(1) + ' Mds';
  }
  if (montant >= 1000000) {
    return (montant / 1000000).toFixed(0) + ' M';
  }
  return new Intl.NumberFormat('fr-FR').format(montant);
};

const formatMontantFull = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function EtatsExecution() {
  const currentYear = new Date().getFullYear();

  const totalDotation = budgetLines.reduce((acc, l) => acc + l.dotation, 0);
  const totalEngage = budgetLines.reduce((acc, l) => acc + l.engage, 0);
  const totalLiquide = budgetLines.reduce((acc, l) => acc + l.liquide, 0);

  const tauxEngagement = Math.round((totalEngage / totalDotation) * 100);
  const tauxLiquidation = Math.round((totalLiquide / totalDotation) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">États d'Exécution Budgétaire</h1>
          <p className="page-description">
            Suivi et analyse de l'exécution du budget - Exercice {currentYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue={currentYear.toString()}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
              <SelectItem value={(currentYear - 2).toString()}>{currentYear - 2}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dotation totale</p>
                <p className="text-2xl font-bold">{formatMontant(totalDotation)}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant engagé</p>
                <p className="text-2xl font-bold text-secondary">{formatMontant(totalEngage)}</p>
                <p className="text-xs text-muted-foreground">{tauxEngagement}% du budget</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant liquidé</p>
                <p className="text-2xl font-bold text-success">{formatMontant(totalLiquide)}</p>
                <p className="text-xs text-muted-foreground">{tauxLiquidation}% du budget</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <FileSpreadsheet className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className="text-2xl font-bold">{formatMontant(totalDotation - totalEngage)}</p>
                <p className="text-xs text-muted-foreground">{100 - tauxEngagement}% restant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progression de l'exécution</CardTitle>
          <CardDescription>
            Comparaison entre les engagements et les liquidations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux d'engagement</span>
              <span className="text-sm font-bold text-secondary">{tauxEngagement}%</span>
            </div>
            <Progress value={tauxEngagement} className="h-3" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de liquidation</span>
              <span className="text-sm font-bold text-success">{tauxLiquidation}%</span>
            </div>
            <Progress value={tauxLiquidation} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Budget Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exécution par ligne budgétaire</CardTitle>
          <CardDescription>
            Détail de l'exécution pour chaque ligne du budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Libellé</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Dotation</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Engagé</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Liquidé</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Disponible</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Taux</th>
                </tr>
              </thead>
              <tbody>
                {budgetLines.map((line) => {
                  const taux = Math.round((line.engage / line.dotation) * 100);
                  const disponible = line.dotation - line.engage;
                  return (
                    <tr key={line.code} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{line.code}</td>
                      <td className="py-3 px-4">{line.label}</td>
                      <td className="py-3 px-4 text-right">{formatMontantFull(line.dotation)}</td>
                      <td className="py-3 px-4 text-right text-secondary">{formatMontantFull(line.engage)}</td>
                      <td className="py-3 px-4 text-right text-success">{formatMontantFull(line.liquide)}</td>
                      <td className="py-3 px-4 text-right">{formatMontantFull(disponible)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={taux} className="w-16 h-2" />
                          <span className="text-sm font-medium w-10">{taux}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-bold">
                  <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                  <td className="py-3 px-4 text-right">{formatMontantFull(totalDotation)}</td>
                  <td className="py-3 px-4 text-right text-secondary">{formatMontantFull(totalEngage)}</td>
                  <td className="py-3 px-4 text-right text-success">{formatMontantFull(totalLiquide)}</td>
                  <td className="py-3 px-4 text-right">{formatMontantFull(totalDotation - totalEngage)}</td>
                  <td className="py-3 px-4 text-center">{tauxEngagement}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
