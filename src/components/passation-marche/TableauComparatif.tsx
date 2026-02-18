import { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PassationMarche, LotMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import { FileDown, Loader2, Package, Users } from 'lucide-react';

interface TableauComparatifProps {
  passation: PassationMarche;
  onExportPdf?: () => void;
  isExporting?: boolean;
}

function fmtCurrency(n: number | null): string {
  if (!n) return '-';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

function fmtNote(n: number | null): string {
  if (n == null) return '-';
  return Number(n).toFixed(2);
}

interface ComparatifData {
  soumissionnaires: Soumissionnaire[];
  bestTech: number;
  bestFin: number;
  bestFinal: number;
  bestRank: number;
}

function buildComparatif(soumissionnaires: Soumissionnaire[]): ComparatifData {
  const sorted = [...soumissionnaires].sort(
    (a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999)
  );
  const bestTech = Math.max(...sorted.map((s) => s.note_technique ?? 0));
  const bestFin = Math.max(...sorted.map((s) => s.note_financiere ?? 0));
  const bestFinal = Math.max(...sorted.map((s) => s.note_finale ?? 0));
  const ranks = sorted
    .filter((s) => s.rang_classement !== null)
    .map((s) => s.rang_classement ?? 999);
  const bestRank = ranks.length > 0 ? Math.min(...ranks) : 999;

  return { soumissionnaires: sorted, bestTech, bestFin, bestFinal, bestRank };
}

function ComparatifTable({ data }: { data: ComparatifData }) {
  const { soumissionnaires, bestTech, bestFin, bestFinal, bestRank } = data;

  if (soumissionnaires.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun soumissionnaire pour ce lot</p>
      </div>
    );
  }

  const criteres = [
    {
      label: 'Offre financiere',
      getValue: (s: Soumissionnaire) => fmtCurrency(s.offre_financiere),
      isBest: () => false, // lowest is best for financial, skip highlight
    },
    {
      label: 'Note technique (/100)',
      getValue: (s: Soumissionnaire) => fmtNote(s.note_technique),
      isBest: (s: Soumissionnaire) => s.note_technique === bestTech && bestTech > 0,
    },
    {
      label: 'Qualifie technique',
      getValue: (s: Soumissionnaire) => (s.qualifie_technique ? 'Oui' : 'Non'),
      isBest: (s: Soumissionnaire) => s.qualifie_technique,
    },
    {
      label: 'Note financiere (/100)',
      getValue: (s: Soumissionnaire) => fmtNote(s.note_financiere),
      isBest: (s: Soumissionnaire) => s.note_financiere === bestFin && bestFin > 0,
    },
    {
      label: 'Note finale (70/30)',
      getValue: (s: Soumissionnaire) => fmtNote(s.note_finale),
      isBest: (s: Soumissionnaire) => s.note_finale === bestFinal && bestFinal > 0,
    },
    {
      label: 'Classement',
      getValue: (s: Soumissionnaire) => {
        const r = s.rang_classement;
        if (r == null) return '-';
        if (r === 1) return '1er';
        return `${r}eme`;
      },
      isBest: (s: Soumissionnaire) => s.rang_classement === bestRank && bestRank < 999,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px] font-bold">Critere</TableHead>
            {soumissionnaires.map((s) => (
              <TableHead key={s.id} className="text-center min-w-[140px]">
                <div className="space-y-1">
                  <span className="font-semibold">{s.raison_sociale}</span>
                  {s.statut === 'retenu' && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px]">
                      Retenu
                    </Badge>
                  )}
                  {s.statut === 'elimine' && (
                    <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">
                      Elimine
                    </Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteres.map((critere) => (
            <TableRow key={critere.label}>
              <TableCell className="font-medium text-sm">{critere.label}</TableCell>
              {soumissionnaires.map((s) => {
                const best = critere.isBest(s);
                return (
                  <TableCell
                    key={s.id}
                    className={cn(
                      'text-center text-sm',
                      best && 'bg-green-50 text-green-700 font-bold'
                    )}
                  >
                    {critere.getValue(s)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TableauComparatif({ passation, onExportPdf, isExporting }: TableauComparatifProps) {
  const lots = useMemo(() => (passation.lots || []) as LotMarche[], [passation.lots]);
  const allSoums = useMemo(
    () => (passation.soumissionnaires || []) as Soumissionnaire[],
    [passation.soumissionnaires]
  );
  const isAlloti = passation.allotissement && lots.length > 0;

  const [selectedLotId, setSelectedLotId] = useState<string | null>(
    isAlloti ? (lots[0]?.id ?? null) : null
  );

  // Build comparatif data for current selection
  const comparatifData = useMemo(() => {
    if (isAlloti && selectedLotId) {
      const lot = lots.find((l) => l.id === selectedLotId);
      const lotSoums = (lot?.soumissionnaires || []) as Soumissionnaire[];
      return buildComparatif(lotSoums);
    }
    // Non-alloti: all soumissionnaires without lot assignment
    const noLotSoums = allSoums.filter((s) => !s.lot_marche_id);
    return buildComparatif(noLotSoums.length > 0 ? noLotSoums : allSoums);
  }, [isAlloti, selectedLotId, lots, allSoums]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tableau comparatif des offres
          </CardTitle>
          {onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exporter PV COJO (PDF)
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAlloti && lots.length > 1 ? (
          <Tabs
            value={selectedLotId || lots[0]?.id}
            onValueChange={setSelectedLotId}
            className="w-full"
          >
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {lots.map((lot) => {
                const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
                return (
                  <TabsTrigger key={lot.id} value={lot.id} className="gap-1 text-xs">
                    <Package className="h-3 w-3" />
                    Lot {lot.numero}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
                      {lotSoums.length}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {lots.map((lot) => (
              <TabsContent key={lot.id} value={lot.id}>
                <div className="mb-3 text-sm text-muted-foreground">
                  <span className="font-medium">Lot {lot.numero}</span> — {lot.designation || '-'}
                  {lot.montant_estime && (
                    <span className="ml-2 text-xs">
                      (Montant estime : {fmtCurrency(lot.montant_estime)})
                    </span>
                  )}
                </div>
                <ComparatifTable
                  data={buildComparatif((lot.soumissionnaires || []) as Soumissionnaire[])}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <ComparatifTable data={comparatifData} />
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-300" />
            <span>Meilleur score</span>
          </div>
          <span>|</span>
          <span>{allSoums.length} soumissionnaire(s) au total</span>
          {isAlloti && <span>| {lots.length} lot(s)</span>}
        </div>
      </CardContent>
    </Card>
  );
}
