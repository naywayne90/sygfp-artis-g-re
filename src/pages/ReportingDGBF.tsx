/**
 * Reporting DGBF — Direction Générale du Budget et des Finances
 *
 * Tableau de bord de suivi de l'exécution budgétaire au format DGBF :
 * - Taux d'exécution par étape de la chaîne de dépense
 * - Situation des engagements, liquidations, ordonnancements, règlements
 * - Suivi des délais de paiement (DGP)
 * - Conformité réglementaire (RGCP/UEMOA)
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
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Scale,
  Building,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import { useExercice } from '@/contexts/ExerciceContext';
import { useEtatsExecution } from '@/hooks/useEtatsExecution';
import { useLiquidationLight, useLiquidationCounts } from '@/hooks/useLiquidations';
import { useDGPBatch, computeDGPStats } from '@/hooks/useDGP';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// HELPERS
// ============================================================================

/** Affiche le taux avec 1 décimale si < 1%, sinon arrondi entier */
function formatTaux(val: number): string {
  if (val === 0) return '0';
  if (val > 0 && val < 1) return val.toFixed(1);
  return String(Math.round(val));
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReportingDGBF() {
  const { exercice } = useExercice();

  // Données d'exécution budgétaire
  const { summary, etapesStats, isLoading: isLoadingEtats } = useEtatsExecution({});

  // Données DGP
  const { data: lightData, isLoading: isLoadingDGP } = useLiquidationLight();
  const { data: liqCounts } = useLiquidationCounts();
  const dgpMap = useDGPBatch(lightData ?? []);
  const dgpStats = useMemo(() => computeDGPStats(dgpMap), [dgpMap]);

  const isLoading = isLoadingEtats || isLoadingDGP;

  // Chaîne de dépense simplifiée
  const chaineData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        etape: 'Dotation budgétaire',
        montant: summary.dotation_totale,
        taux: 100,
        couleur: 'text-primary',
      },
      {
        etape: 'Engagements',
        montant: summary.montant_engage,
        taux: summary.taux_engagement,
        couleur:
          summary.taux_engagement > 75
            ? 'text-green-600'
            : summary.taux_engagement > 50
              ? 'text-orange-600'
              : 'text-red-600',
      },
      {
        etape: 'Liquidations',
        montant: summary.montant_liquide,
        taux: summary.taux_liquidation,
        couleur:
          summary.taux_liquidation > 75
            ? 'text-green-600'
            : summary.taux_liquidation > 50
              ? 'text-orange-600'
              : 'text-red-600',
      },
      {
        etape: 'Ordonnancements',
        montant: summary.montant_ordonnance,
        taux: summary.taux_ordonnancement,
        couleur:
          summary.taux_ordonnancement > 75
            ? 'text-green-600'
            : summary.taux_ordonnancement > 50
              ? 'text-orange-600'
              : 'text-red-600',
      },
      {
        etape: 'Règlements',
        montant: summary.montant_paye,
        taux: summary.taux_paiement,
        couleur:
          summary.taux_paiement > 75
            ? 'text-green-600'
            : summary.taux_paiement > 50
              ? 'text-orange-600'
              : 'text-red-600',
      },
    ];
  }, [summary]);

  // Taux d'exécution global
  const tauxGlobal = summary
    ? summary.dotation_totale > 0
      ? Math.round((summary.montant_paye / summary.dotation_totale) * 1000) / 10
      : 0
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reporting DGBF"
          description="Direction Générale du Budget et des Finances"
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
        title="Reporting DGBF"
        description={`Direction Générale du Budget et des Finances — Exercice ${exercice}`}
      />

      {/* ═══════ EN-TÊTE RAPPORT ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Situation d'exécution budgétaire — ARTI
              </CardTitle>
              <CardDescription>
                Exercice {exercice} — Édité le{' '}
                {format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">
              Taux global : {tauxGlobal}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ═══════ KPIs TAUX D'EXÉCUTION ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux d'engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTaux(summary?.taux_engagement ?? 0)}%</div>
            <Progress value={summary?.taux_engagement ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.montant_engage ?? 0)} /{' '}
              {formatCurrency(summary?.dotation_totale ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de liquidation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTaux(summary?.taux_liquidation ?? 0)}%</div>
            <Progress value={summary?.taux_liquidation ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.montant_liquide ?? 0)} /{' '}
              {formatCurrency(summary?.montant_engage ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux d'ordonnancement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTaux(summary?.taux_ordonnancement ?? 0)}%
            </div>
            <Progress value={summary?.taux_ordonnancement ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.montant_ordonnance ?? 0)} /{' '}
              {formatCurrency(summary?.montant_liquide ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTaux(summary?.taux_paiement ?? 0)}%</div>
            <Progress value={summary?.taux_paiement ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.montant_paye ?? 0)} /{' '}
              {formatCurrency(summary?.montant_ordonnance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ CHAÎNE DE DÉPENSE ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Chaîne de la dépense — Flux d'exécution
          </CardTitle>
          <CardDescription>
            De la dotation au règlement — taux de transformation entre étapes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étape</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Taux</TableHead>
                <TableHead>Progression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chaineData.map((row, idx) => (
                <TableRow key={row.etape}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {idx > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      {row.etape}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.montant)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${row.couleur}`}>{formatTaux(row.taux)}%</span>
                  </TableCell>
                  <TableCell>
                    <Progress value={row.taux} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════ RESTES À EXÉCUTER ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Restes à exécuter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Reste à engager</p>
              <p className="text-lg font-bold">{formatCurrency(summary?.reste_a_engager ?? 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Reste à liquider</p>
              <p className="text-lg font-bold">{formatCurrency(summary?.reste_a_liquider ?? 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Reste à ordonnancer</p>
              <p className="text-lg font-bold">
                {formatCurrency(summary?.reste_a_ordonnancer ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Reste à payer</p>
              <p className="text-lg font-bold">{formatCurrency(summary?.reste_a_payer ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ SITUATION PAR ÉTAPE ═══════ */}
      {etapesStats && etapesStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Situation par étape de la chaîne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étape</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Brouillon</TableHead>
                  <TableHead className="text-center">Soumis</TableHead>
                  <TableHead className="text-center">Validé</TableHead>
                  <TableHead className="text-center">Rejeté</TableHead>
                  <TableHead className="text-right">Montant total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etapesStats.map((etape) => (
                  <TableRow key={etape.etape}>
                    <TableCell className="font-medium">{etape.label}</TableCell>
                    <TableCell className="text-center font-semibold">{etape.total}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {etape.brouillon}
                    </TableCell>
                    <TableCell className="text-center text-blue-600">{etape.soumis}</TableCell>
                    <TableCell className="text-center text-green-600">{etape.valide}</TableCell>
                    <TableCell className="text-center text-red-600">{etape.rejete}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(etape.montant_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ═══════ CONFORMITÉ DGP ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Conformité Délai Global de Paiement
          </CardTitle>
          <CardDescription>
            Suivi réglementaire art. 132/139 Code des Marchés Publics CI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Liquidations suivies</p>
              <p className="text-xl font-bold">{dgpStats.total}</p>
            </div>
            <div className="p-3 rounded-lg border border-green-200 bg-green-50/30">
              <p className="text-xs text-green-700">Dans les délais</p>
              <p className="text-xl font-bold text-green-700">{dgpStats.dansDelai}</p>
            </div>
            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/30">
              <p className="text-xs text-orange-700">En alerte</p>
              <p className="text-xl font-bold text-orange-700">{dgpStats.enAlerte}</p>
            </div>
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/30">
              <p className="text-xs text-red-700">Hors délai</p>
              <p className="text-xl font-bold text-red-700">{dgpStats.horsDelai}</p>
            </div>
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/30">
              <p className="text-xs text-red-700">Intérêts moratoires</p>
              <p className="text-lg font-bold text-red-700">
                {formatCurrency(dgpStats.totalInteretsMoratoires)}
              </p>
              <p className="text-xs text-red-500">
                +{formatCurrency(dgpStats.expositionJournaliere)}/jour
              </p>
            </div>
          </div>

          {dgpStats.horsDelai > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                {dgpStats.horsDelai} liquidation(s) en dépassement du DGP — risque d'intérêts
                moratoires signalé
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ SITUATION LIQUIDATIONS ═══════ */}
      {liqCounts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Situation des liquidations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              <div className="text-center p-2 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">Brouillon</p>
                <p className="text-lg font-bold">{liqCounts.brouillon}</p>
              </div>
              <div className="text-center p-2 rounded bg-blue-50">
                <p className="text-xs text-blue-600">Soumis</p>
                <p className="text-lg font-bold text-blue-700">{liqCounts.soumis}</p>
              </div>
              <div className="text-center p-2 rounded bg-indigo-50">
                <p className="text-xs text-indigo-600">Validé DAAF</p>
                <p className="text-lg font-bold text-indigo-700">{liqCounts.valide_daaf}</p>
              </div>
              <div className="text-center p-2 rounded bg-purple-50">
                <p className="text-xs text-purple-600">Visa CB</p>
                <p className="text-lg font-bold text-purple-700">{liqCounts.valide_cf}</p>
              </div>
              <div className="text-center p-2 rounded bg-green-50">
                <p className="text-xs text-green-600">Validé DG</p>
                <p className="text-lg font-bold text-green-700">{liqCounts.valide_dg}</p>
              </div>
              <div className="text-center p-2 rounded bg-red-50">
                <p className="text-xs text-red-600">Rejeté</p>
                <p className="text-lg font-bold text-red-700">{liqCounts.rejete}</p>
              </div>
              <div className="text-center p-2 rounded bg-orange-50">
                <p className="text-xs text-orange-600">Différé</p>
                <p className="text-lg font-bold text-orange-700">{liqCounts.differe}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Montant total liquidé (service fait certifié)
              </span>
              <span className="text-lg font-bold">{formatCurrency(liqCounts.total_montant)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ NOTE RÉGLEMENTAIRE ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Cadre réglementaire</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Ce rapport est établi conformément aux dispositions du RGCP (UEMOA) et du Code des
            Marchés Publics de Côte d'Ivoire (Décret 2009-259).
          </p>
          <p>
            Les taux d'exécution sont calculés sur la base des données enregistrées dans le SYGFP de
            l'ARTI pour l'exercice {exercice}.
          </p>
          <p>
            Les intérêts moratoires sont calculés conformément à l'article 142 du Code des Marchés
            Publics (taux légal 3,5% + majoration 1%).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
