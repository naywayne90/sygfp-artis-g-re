/**
 * Tableau de suivi budgetaire des engagements par ligne budgetaire.
 * Affiche: code, libelle, dotation, engage, disponible, taux (barre), nb engagements.
 * Tri par taux de consommation decroissant.
 * Filtre par direction et seuil (>80%, >95%).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, BarChart3, AlertTriangle, AlertCircle, Ban } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getTauxColor } from '@/components/engagement/IndicateurBudget';
import type { Engagement } from '@/hooks/useEngagements';
import {
  computeSuiviBudgetaire,
  useEngagementExport,
  type SuiviBudgetaireLigne,
} from '@/hooks/useEngagementExport';
import { useExercice } from '@/contexts/ExerciceContext';

interface SuiviBudgetaireEngagementsProps {
  engagements: Engagement[];
}

function AlerteIcon({ taux }: { taux: number }) {
  if (taux > 100) return <Ban className="h-4 w-4 text-destructive" />;
  if (taux > 95) return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (taux > 80) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
  return null;
}

function TauxBadge({ taux }: { taux: number }) {
  const info = getTauxColor(taux);
  if (taux > 100) {
    return (
      <Badge variant="destructive" className="animate-pulse text-xs">
        {taux.toFixed(1)}%
      </Badge>
    );
  }
  if (taux > 95) {
    return (
      <Badge variant="destructive" className="text-xs">
        {taux.toFixed(1)}%
      </Badge>
    );
  }
  if (taux > 80) {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
        {taux.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`${info.color} text-xs`}>
      {taux.toFixed(1)}%
    </Badge>
  );
}

export function SuiviBudgetaireEngagements({ engagements }: SuiviBudgetaireEngagementsProps) {
  const { exercice } = useExercice();
  const { exportSuiviBudgetaire, isExporting } = useEngagementExport();

  const [directionFilter, setDirectionFilter] = useState<string>('toutes');
  const [seuilFilter, setSeuilFilter] = useState<string>('tous');

  // Extraire les directions uniques
  const directions = useMemo(() => {
    const dirSet = new Set<string>();
    for (const eng of engagements) {
      const sigle = eng.budget_line?.direction?.sigle;
      if (sigle) dirSet.add(sigle);
    }
    return Array.from(dirSet).sort();
  }, [engagements]);

  // Calculer le suivi
  const suiviComplet = useMemo(() => computeSuiviBudgetaire(engagements), [engagements]);

  // Appliquer les filtres
  const suiviFiltre = useMemo(() => {
    let result = suiviComplet;

    if (directionFilter && directionFilter !== 'toutes') {
      result = result.filter((s) => s.directionSigle === directionFilter);
    }

    if (seuilFilter === '>80') {
      result = result.filter((s) => s.taux > 80);
    } else if (seuilFilter === '>95') {
      result = result.filter((s) => s.taux > 95);
    }

    return result;
  }, [suiviComplet, directionFilter, seuilFilter]);

  // Totaux
  const totals = useMemo(() => {
    const totalDot = suiviFiltre.reduce((sum, s) => sum + s.dotation, 0);
    const totalEng = suiviFiltre.reduce((sum, s) => sum + s.totalEngage, 0);
    const totalDisp = suiviFiltre.reduce((sum, s) => sum + s.disponible, 0);
    const tauxGlobal = totalDot > 0 ? (totalEng / totalDot) * 100 : 0;
    const nbAlerte80 = suiviFiltre.filter((s) => s.taux > 80).length;
    const nbAlerte95 = suiviFiltre.filter((s) => s.taux > 95).length;
    const nbDepassement = suiviFiltre.filter((s) => s.taux > 100).length;
    return { totalDot, totalEng, totalDisp, tauxGlobal, nbAlerte80, nbAlerte95, nbDepassement };
  }, [suiviFiltre]);

  const handleExport = () => {
    const seuilMin = seuilFilter === '>80' ? 80 : seuilFilter === '>95' ? 95 : undefined;
    exportSuiviBudgetaire(
      engagements,
      {
        direction: directionFilter !== 'toutes' ? directionFilter : undefined,
        seuilMin,
      },
      exercice
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Suivi budgétaire par ligne
            </CardTitle>
            <CardDescription>
              {suiviFiltre.length} ligne(s) budgétaire(s)
              {totals.nbAlerte80 > 0 && (
                <span className="text-orange-600 ml-2">
                  {totals.nbAlerte80} en alerte ({'>'}80%)
                </span>
              )}
              {totals.nbDepassement > 0 && (
                <span className="text-destructive ml-2">{totals.nbDepassement} en dépassement</span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={isExporting || suiviFiltre.length === 0}
          >
            <Download className="h-4 w-4" />
            Exporter suivi
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs suivi */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Dotation totale</div>
            <div className="font-bold text-sm">{formatCurrency(totals.totalDot)}</div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Total engagé</div>
            <div className="font-bold text-sm text-orange-600">
              {formatCurrency(totals.totalEng)}
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Disponible</div>
            <div
              className={`font-bold text-sm ${totals.totalDisp >= 0 ? 'text-green-600' : 'text-destructive'}`}
            >
              {formatCurrency(totals.totalDisp)}
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Taux global</div>
            <div className={`font-bold text-sm ${getTauxColor(totals.tauxGlobal).color}`}>
              {totals.tauxGlobal.toFixed(1)}%
            </div>
            <Progress
              value={Math.min(totals.tauxGlobal, 100)}
              className={`h-1.5 ${getTauxColor(totals.tauxGlobal).progressClass}`}
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 flex-wrap">
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes directions</SelectItem>
              {directions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={seuilFilter} onValueChange={setSeuilFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seuil d'alerte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les taux</SelectItem>
              <SelectItem value=">80">Taux {'>'} 80% (alerte)</SelectItem>
              <SelectItem value=">95">Taux {'>'} 95% (critique)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        {suiviFiltre.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune ligne budgétaire ne correspond aux filtres</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Ligne budgétaire</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Dotation</TableHead>
                  <TableHead className="text-right">Engagé</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="w-[200px]">Taux</TableHead>
                  <TableHead className="text-center">Nb eng.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suiviFiltre.map((ligne) => (
                  <SuiviRow key={ligne.budgetLineId} ligne={ligne} />
                ))}
                {/* Ligne total */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell />
                  <TableCell>TOTAL ({suiviFiltre.length} lignes)</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatCurrency(totals.totalDot)}</TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(totals.totalEng)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${totals.totalDisp >= 0 ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {formatCurrency(totals.totalDisp)}
                  </TableCell>
                  <TableCell>
                    <TauxBadge taux={totals.tauxGlobal} />
                  </TableCell>
                  <TableCell className="text-center">
                    {suiviFiltre.reduce((sum, s) => sum + s.nbEngagements, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuiviRow({ ligne }: { ligne: SuiviBudgetaireLigne }) {
  const tauxInfo = getTauxColor(ligne.taux);

  return (
    <TableRow
      className={
        ligne.taux > 100
          ? 'bg-red-50 dark:bg-red-950/20'
          : ligne.taux > 95
            ? 'bg-red-50/50 dark:bg-red-950/10'
            : ligne.taux > 80
              ? 'bg-orange-50/50 dark:bg-orange-950/10'
              : ''
      }
    >
      <TableCell>
        <AlerteIcon taux={ligne.taux} />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-mono text-sm">{ligne.code}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
            {ligne.libelle}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {ligne.directionSigle}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-sm">{formatCurrency(ligne.dotation)}</TableCell>
      <TableCell className="text-right text-sm text-orange-600">
        {formatCurrency(ligne.totalEngage)}
      </TableCell>
      <TableCell
        className={`text-right text-sm ${ligne.disponible >= 0 ? 'text-green-600' : 'text-destructive font-bold'}`}
      >
        {formatCurrency(ligne.disponible)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress
            value={Math.min(ligne.taux, 100)}
            className={`h-2 flex-1 ${tauxInfo.progressClass}`}
          />
          <TauxBadge taux={ligne.taux} />
        </div>
      </TableCell>
      <TableCell className="text-center text-sm">{ligne.nbEngagements}</TableCell>
    </TableRow>
  );
}
