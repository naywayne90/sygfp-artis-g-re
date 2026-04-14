/**
 * Tableau de bord DGP — Délai Global de Paiement
 *
 * Monitoring des délais de paiement (art. 132/139 Code des Marchés Publics CI) :
 * - KPIs : dans délai, en alerte, hors délai, intérêts moratoires
 * - Table détaillée des liquidations hors délai
 * - Répartition par direction
 * - Projections financières (+30j, +60j, +90j)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  TrendingUp,
  Scale,
  Building,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import { useExercice } from '@/contexts/ExerciceContext';
import { useLiquidationLight } from '@/hooks/useLiquidations';
import { useDGPBatch, computeDGPStats, type DGPInfo } from '@/hooks/useDGP';

// ============================================================================
// TYPES
// ============================================================================

interface DGPLiquidationRow {
  id: string;
  numero: string;
  montant: number;
  statut: string | null;
  direction: string;
  dgp: DGPInfo;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TableauBordDGP() {
  const { exercice } = useExercice();
  const { data: lightData, isLoading } = useLiquidationLight();

  // Calcul DGP batch
  const dgpMap = useDGPBatch(lightData ?? []);
  const dgpStats = useMemo(() => computeDGPStats(dgpMap), [dgpMap]);

  // Enrichir les données avec le DGP
  const allRows: DGPLiquidationRow[] = useMemo(() => {
    if (!lightData) return [];
    return lightData
      .filter((liq) => liq.statut && !['annule', 'rejete', 'brouillon'].includes(liq.statut))
      .map((liq) => ({
        id: liq.id,
        numero: liq.numero,
        montant: liq.montant,
        statut: liq.statut,
        direction: '-',
        dgp: dgpMap.get(liq.id)!,
      }))
      .filter((r) => r.dgp);
  }, [lightData, dgpMap]);

  // Répartition par statut DGP
  const horsDelaiRows = useMemo(
    () =>
      allRows
        .filter((r) => r.dgp.statut === 'hors_delai' && !r.dgp.estTermine)
        .sort((a, b) => a.dgp.joursRestants - b.dgp.joursRestants),
    [allRows]
  );

  const alerteRows = useMemo(
    () =>
      allRows
        .filter((r) => r.dgp.statut === 'alerte' && !r.dgp.estTermine)
        .sort((a, b) => a.dgp.joursRestants - b.dgp.joursRestants),
    [allRows]
  );

  const dansDelaiRows = useMemo(
    () => allRows.filter((r) => r.dgp.statut === 'dans_delai' && !r.dgp.estTermine),
    [allRows]
  );

  // Projections financières
  const projections = useMemo(() => {
    let proj30 = 0;
    let proj60 = 0;
    let proj90 = 0;
    dgpMap.forEach((info) => {
      if (info.statut === 'hors_delai' && !info.estTermine) {
        proj30 += info.interetsDetail.projectionPlus30j;
        proj60 += info.interetsDetail.projectionPlus60j;
        proj90 += info.interetsDetail.projectionPlus90j;
      }
    });
    return { proj30, proj60, proj90 };
  }, [dgpMap]);

  // KPIs basés sur les liquidations actives (non terminées) pour cohérence avec les tableaux
  const totalActif = horsDelaiRows.length + alerteRows.length + dansDelaiRows.length;
  const pctDansDelai = totalActif > 0 ? Math.round((dansDelaiRows.length / totalActif) * 100) : 0;
  const pctAlerte = totalActif > 0 ? Math.round((alerteRows.length / totalActif) * 100) : 0;
  const pctHorsDelai = totalActif > 0 ? Math.round((horsDelaiRows.length / totalActif) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tableau de bord DGP"
          description="Délai Global de Paiement — art. 132/139 Code des Marchés Publics CI"
        />
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord DGP"
        description={`Délai Global de Paiement — Exercice ${exercice}`}
      />

      {/* ═══════ ALERTE CRITIQUE ═══════ */}
      {horsDelaiRows.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {horsDelaiRows.length} liquidation(s) hors Délai Global de Paiement
          </AlertTitle>
          <AlertDescription>
            Intérêts moratoires en cours :{' '}
            <strong>{formatCurrency(dgpStats.totalInteretsMoratoires)}</strong>
            {' — '}Exposition journalière :{' '}
            <strong>+{formatCurrency(dgpStats.expositionJournaliere)}/jour</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════ KPIs ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Total suivi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActif}</div>
            <p className="text-xs text-muted-foreground">Délai moyen : {dgpStats.delaiMoyen}j</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Dans les délais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{dansDelaiRows.length}</div>
            <Progress value={pctDansDelai} className="h-1.5 mt-1" />
            <p className="text-xs text-green-600 mt-1">{pctDansDelai}%</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-orange-700">
              <Timer className="h-3.5 w-3.5" />
              En alerte (&gt;70%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{alerteRows.length}</div>
            <Progress value={pctAlerte} className="h-1.5 mt-1" />
            <p className="text-xs text-orange-600 mt-1">{pctAlerte}%</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Hors délai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{horsDelaiRows.length}</div>
            <Progress value={pctHorsDelai} className="h-1.5 mt-1" />
            <p className="text-xs text-red-600 mt-1">{pctHorsDelai}%</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ INTÉRÊTS MORATOIRES & PROJECTIONS ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Intérêts moratoires (art. 142)
            </CardTitle>
            <CardDescription>Taux légal 3,5% + majoration 1% = 4,5% annuel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total intérêts accumulés</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(dgpStats.totalInteretsMoratoires)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Exposition journalière</span>
              <span className="text-lg font-semibold text-orange-600">
                +{formatCurrency(dgpStats.expositionJournaliere)}/jour
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Projections si non payé
            </CardTitle>
            <CardDescription>Estimation des intérêts moratoires futurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-orange-50">
                <span className="text-sm">+30 jours</span>
                <span className="font-semibold text-orange-700">
                  {formatCurrency(projections.proj30)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-red-50">
                <span className="text-sm">+60 jours</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(projections.proj60)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-red-100">
                <span className="text-sm">+90 jours</span>
                <span className="font-bold text-red-700">{formatCurrency(projections.proj90)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ LIQUIDATIONS HORS DÉLAI ═══════ */}
      {horsDelaiRows.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Liquidations hors délai ({horsDelaiRows.length})
            </CardTitle>
            <CardDescription>
              Liquidations ayant dépassé le Délai Global de Paiement — intérêts moratoires en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Liquidation</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">DGP</TableHead>
                  <TableHead className="text-center">Retard</TableHead>
                  <TableHead className="text-right">Intérêts moratoires</TableHead>
                  <TableHead className="text-right">Coût/jour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horsDelaiRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.numero}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.montant)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {row.dgp.delaiMaxJours}j
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{row.dgp.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(row.dgp.interetsMoratoires)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-orange-600">
                      +{formatCurrency(row.dgp.interetsDetail.montantJournalier)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ═══════ LIQUIDATIONS EN ALERTE ═══════ */}
      {alerteRows.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <Timer className="h-4 w-4" />
              Liquidations en alerte ({alerteRows.length})
            </CardTitle>
            <CardDescription>
              Liquidations approchant de la limite du DGP (&gt;70% du délai consommé)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Liquidation</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">DGP</TableHead>
                  <TableHead className="text-center">Reste</TableHead>
                  <TableHead className="text-center">Consommé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerteRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.numero}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.montant)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {row.dgp.delaiMaxJours}j
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className="bg-orange-100 text-orange-700 border-orange-300"
                        variant="outline"
                      >
                        {row.dgp.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <Progress value={row.dgp.pourcentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {row.dgp.pourcentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ═══════ SYNTHÈSE DANS LES DÉLAIS ═══════ */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            Dans les délais ({dansDelaiRows.length})
          </CardTitle>
          <CardDescription>
            Liquidations en cours de traitement dans le délai réglementaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dansDelaiRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune liquidation en cours dans les délais
            </p>
          ) : (
            <div className="text-sm text-muted-foreground">
              {dansDelaiRows.length} liquidation(s) en cours — délai moyen consommé :{' '}
              {dansDelaiRows.length > 0
                ? Math.round(
                    dansDelaiRows.reduce((s, r) => s + r.dgp.pourcentage, 0) / dansDelaiRows.length
                  )
                : 0}
              %
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ RÉFÉRENCES JURIDIQUES ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Références juridiques
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Art. 132/139</strong> — Délai Global de Paiement : 30j (&lt;30M), 60j (30-100M),
            90j (&gt;100M FCFA)
          </p>
          <p>
            <strong>Art. 142</strong> — Intérêts moratoires : taux légal (3,5%) + majoration (1%) =
            4,5% annuel
          </p>
          <p>
            <strong>Art. 145-147</strong> — Pénalités de retard d'exécution : 1/1000 par jour,
            plafonnées à 10%
          </p>
          <p>
            <strong>UEMOA</strong> — Directive relative au RGCP (Règlement Général sur la
            Comptabilité Publique)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
