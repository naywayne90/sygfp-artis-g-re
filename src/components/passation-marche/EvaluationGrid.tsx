import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Soumissionnaire,
  StatutSoumissionnaire,
  STATUTS_SOUMISSIONNAIRE,
  SEUIL_NOTE_TECHNIQUE,
  POIDS_TECHNIQUE,
  POIDS_FINANCIER,
} from '@/hooks/usePassationsMarche';
import { cn } from '@/lib/utils';
import { Award, Building2, Trophy } from 'lucide-react';

interface EvaluationGridProps {
  soumissionnaires: Soumissionnaire[];
  onUpdate: (data: {
    id: string;
    note_technique?: number | null;
    note_financiere?: number | null;
    statut?: StatutSoumissionnaire;
  }) => Promise<unknown>;
  readOnly?: boolean;
}

interface EvalRow {
  soumissionnaire: Soumissionnaire;
  noteFinale: number | null;
  isQualifie: boolean;
  rang: number | null;
}

function computeRows(soumissionnaires: Soumissionnaire[]): EvalRow[] {
  const rows: EvalRow[] = soumissionnaires.map((s) => {
    const hasTech = s.note_technique !== null;
    const hasFin = s.note_financiere !== null;
    const isQualifie = hasTech && (s.note_technique ?? 0) >= SEUIL_NOTE_TECHNIQUE;
    const noteFinale =
      isQualifie && hasFin
        ? (s.note_technique ?? 0) * POIDS_TECHNIQUE + (s.note_financiere ?? 0) * POIDS_FINANCIER
        : null;
    return { soumissionnaire: s, noteFinale, isQualifie, rang: null };
  });

  // Sort: qualified with note_finale first (desc), then rest
  const qualified = rows
    .filter((r) => r.noteFinale !== null)
    .sort((a, b) => (b.noteFinale ?? 0) - (a.noteFinale ?? 0));

  const rest = rows.filter((r) => r.noteFinale === null);

  qualified.forEach((r, idx) => {
    r.rang = idx + 1;
  });

  return [...qualified, ...rest];
}

export function EvaluationGrid({
  soumissionnaires,
  onUpdate,
  readOnly = false,
}: EvaluationGridProps) {
  const rows = useMemo(() => computeRows(soumissionnaires), [soumissionnaires]);

  const handleNoteChange = async (
    soumId: string,
    field: 'note_technique' | 'note_financiere',
    value: string
  ) => {
    const numVal = value === '' ? null : Math.min(100, Math.max(0, parseFloat(value)));

    // Auto-update statut based on note_technique
    if (field === 'note_technique') {
      const current = soumissionnaires.find((s) => s.id === soumId);
      if (numVal !== null && numVal >= SEUIL_NOTE_TECHNIQUE && current?.statut !== 'retenu') {
        await onUpdate({ id: soumId, note_technique: numVal, statut: 'qualifie' });
      } else if (numVal !== null && numVal < SEUIL_NOTE_TECHNIQUE) {
        await onUpdate({ id: soumId, note_technique: numVal, statut: 'elimine' });
      } else {
        await onUpdate({ id: soumId, [field]: numVal });
      }
    } else {
      await onUpdate({ id: soumId, [field]: numVal });
    }
  };

  const handleAttribuer = async (soumId: string) => {
    await onUpdate({ id: soumId, statut: 'retenu' });
  };

  if (soumissionnaires.length === 0) {
    return (
      <div data-testid="evaluation-grid" className="text-center py-8 text-muted-foreground">
        <p>Aucun soumissionnaire a evaluer</p>
        <p className="text-xs mt-1">Ajoutez des soumissionnaires dans l'onglet Soumissionnaires</p>
      </div>
    );
  }

  return (
    <div data-testid="evaluation-grid" className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Grille d'evaluation
          </CardTitle>
          <CardDescription>
            Note finale = (Tech x {POIDS_TECHNIQUE * 100}%) + (Fin x {POIDS_FINANCIER * 100}%) |
            Seuil technique: {SEUIL_NOTE_TECHNIQUE}/100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rang</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead className="w-28 text-center">Note Tech. (/100)</TableHead>
                <TableHead className="w-28 text-center">Qualification</TableHead>
                <TableHead className="w-28 text-center">Note Fin. (/100)</TableHead>
                <TableHead className="w-24 text-center">Note Finale</TableHead>
                <TableHead className="w-24 text-center">Statut</TableHead>
                {!readOnly && <TableHead className="w-28 text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const s = row.soumissionnaire;
                const statutConfig = STATUTS_SOUMISSIONNAIRE[s.statut];
                const isRetenu = s.statut === 'retenu';
                const isEliminated = s.statut === 'elimine';
                const isBelowThreshold =
                  s.note_technique !== null && (s.note_technique ?? 0) < SEUIL_NOTE_TECHNIQUE;
                const finDisabled = !row.isQualifie || isEliminated || isRetenu || readOnly;

                return (
                  <TableRow
                    key={s.id}
                    className={cn(
                      isRetenu && 'bg-green-50',
                      isBelowThreshold && !isEliminated && 'bg-red-50/50',
                      isEliminated && 'bg-red-50/30 opacity-60'
                    )}
                  >
                    {/* Rang */}
                    <TableCell className="text-center" data-testid={`rang-${s.id}`}>
                      {row.rang !== null ? (
                        row.rang === 1 ? (
                          <Trophy className="h-4 w-4 text-yellow-500 mx-auto" />
                        ) : (
                          <span className="font-bold text-lg">{row.rang}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Entreprise */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm">{s.raison_sociale}</span>
                      </div>
                    </TableCell>

                    {/* Note technique */}
                    <TableCell className="text-center">
                      <Input
                        data-testid={`note-tech-${s.id}`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={s.note_technique ?? ''}
                        onChange={(e) => handleNoteChange(s.id, 'note_technique', e.target.value)}
                        className={cn(
                          'w-20 mx-auto text-center h-8',
                          isBelowThreshold && 'border-red-300 bg-red-50'
                        )}
                        disabled={isEliminated || isRetenu || readOnly}
                      />
                    </TableCell>

                    {/* Qualification */}
                    <TableCell className="text-center" data-testid={`qualification-${s.id}`}>
                      {s.note_technique !== null ? (
                        row.isQualifie ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Qualifie
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Non qualifie</Badge>
                        )
                      ) : null}
                    </TableCell>

                    {/* Note financiere */}
                    <TableCell className="text-center">
                      <Input
                        data-testid={`note-fin-${s.id}`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={
                          isBelowThreshold || s.note_technique === null
                            ? ''
                            : (s.note_financiere ?? '')
                        }
                        onChange={(e) => handleNoteChange(s.id, 'note_financiere', e.target.value)}
                        className="w-20 mx-auto text-center h-8"
                        disabled={finDisabled}
                      />
                    </TableCell>

                    {/* Note Finale */}
                    <TableCell className="text-center" data-testid={`note-finale-${s.id}`}>
                      {row.noteFinale !== null ? (
                        <span
                          className={cn('font-bold text-lg', row.rang === 1 && 'text-yellow-600')}
                        >
                          {row.noteFinale.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Statut */}
                    <TableCell className="text-center">
                      <Badge className={statutConfig.color}>{statutConfig.label}</Badge>
                    </TableCell>

                    {/* Action */}
                    {!readOnly && (
                      <TableCell className="text-center">
                        {row.rang === 1 && !isRetenu && (
                          <Button
                            data-testid="attribuer-btn"
                            variant="default"
                            size="sm"
                            className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAttribuer(s.id)}
                          >
                            <Award className="h-3 w-3" />
                            Attribuer
                          </Button>
                        )}
                        {isRetenu && (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Retenu
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
