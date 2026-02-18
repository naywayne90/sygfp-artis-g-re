/**
 * Tableau comparatif pivoté pour l'évaluation COJO
 * Critères en lignes, soumissionnaires en colonnes
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { computeEvaluations } from './EvaluationCOJO';
import type { PassationMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import { STATUTS_SOUMISSIONNAIRE } from '@/hooks/usePassationsMarche';
import { cn } from '@/lib/utils';
import { BarChart3, FileDown, Trophy, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const SEUIL_TECHNIQUE = 70;

interface ComparatifEvaluationProps {
  passation: PassationMarche;
  onExportPV: () => void;
}

export function ComparatifEvaluation({ passation, onExportPV }: ComparatifEvaluationProps) {
  const soumissionnaires = useMemo(
    () => (passation.soumissionnaires || []) as Soumissionnaire[],
    [passation.soumissionnaires]
  );

  const evaluations = useMemo(() => computeEvaluations(soumissionnaires), [soumissionnaires]);

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  if (soumissionnaires.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun soumissionnaire a comparer</p>
        <p className="text-xs mt-1">Ajoutez des soumissionnaires dans l'onglet Soumissionnaires</p>
      </div>
    );
  }

  // Separate qualified (sorted by rank) and unqualified
  const qualified = evaluations.filter((e) => e.isQualifie && e.noteFinale !== null);
  const unqualified = evaluations.filter((e) => !e.isQualifie || e.noteFinale === null);
  const allOrdered = [...qualified, ...unqualified];

  const bestRankId = qualified.length > 0 ? qualified[0].soumissionnaire.id : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tableau comparatif des offres
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExportPV} className="gap-1">
            <FileDown className="h-4 w-4" />
            Exporter PV COJO
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40 bg-muted/50 font-bold">Critère</TableHead>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  const statutConfig = STATUTS_SOUMISSIONNAIRE[s.statut];
                  return (
                    <TableHead
                      key={s.id}
                      className={cn('text-center min-w-[130px]', isBest && 'bg-green-50')}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{s.raison_sociale}</p>
                        {statutConfig && (
                          <Badge className={cn('text-[10px]', statutConfig.color)}>
                            {statutConfig.label}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Row: Offre financière */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Offre financière</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  return (
                    <TableCell
                      key={s.id}
                      className={cn('text-center font-mono text-sm', isBest && 'bg-green-50')}
                    >
                      {s.offre_financiere ? (
                        <span className={isBest ? 'font-bold' : ''}>
                          {formatMontant(s.offre_financiere)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row: Note technique */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Note technique (/100)</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  const isBelowThreshold =
                    s.note_technique !== null && (s.note_technique ?? 0) < SEUIL_TECHNIQUE;
                  return (
                    <TableCell
                      key={s.id}
                      className={cn(
                        'text-center font-mono',
                        isBest && 'bg-green-50',
                        isBelowThreshold && 'text-red-600'
                      )}
                    >
                      {s.note_technique !== null ? (
                        <span className={isBest ? 'font-bold' : ''}>
                          {s.note_technique.toFixed(1)}
                          {isBelowThreshold && ' ⚠️'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row: Note financière */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Note financière (/100)</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  return (
                    <TableCell
                      key={s.id}
                      className={cn('text-center font-mono', isBest && 'bg-green-50')}
                    >
                      {s.note_financiere !== null ? (
                        <span className={isBest ? 'font-bold' : ''}>
                          {s.note_financiere.toFixed(1)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row: Note finale */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Note finale</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  return (
                    <TableCell key={s.id} className={cn('text-center', isBest && 'bg-green-50')}>
                      {ev.noteFinale !== null ? (
                        <span className={cn('font-bold text-lg', isBest && 'text-green-700')}>
                          {ev.noteFinale.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row: Qualifié technique */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Qualifié technique</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  return (
                    <TableCell key={s.id} className={cn('text-center', isBest && 'bg-green-50')}>
                      {ev.isQualifie ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="text-[10px] text-red-500">(&lt; {SEUIL_TECHNIQUE})</span>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row: Rang */}
              <TableRow>
                <TableCell className="font-medium bg-muted/30">Rang</TableCell>
                {allOrdered.map((ev) => {
                  const s = ev.soumissionnaire;
                  const isBest = s.id === bestRankId;
                  return (
                    <TableCell key={s.id} className={cn('text-center', isBest && 'bg-green-50')}>
                      {ev.rang !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={cn('font-bold text-lg', isBest && 'text-green-700')}>
                            {ev.rang}
                          </span>
                          {isBest && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-50 border border-green-300 rounded" />
            Meilleur rang
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            Note tech. &lt; {SEUIL_TECHNIQUE} = Non qualifié
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-500" />
            1er du classement
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
