/**
 * NoteAEFImputeDialog - Dialogue d'imputation amélioré
 * Sélection de ligne budgétaire avec contrôles de disponibilité
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NoteAEF } from '@/hooks/useNotesAEF';
import { useExercice } from '@/contexts/ExerciceContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ARTIReferenceBadge } from '@/components/shared/ARTIReferenceBadge';
import {
  CreditCard,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Building,
  Filter,
  Info,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteAEFImputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
  onConfirm: (noteId: string, budgetLineId: string) => Promise<void>;
}

interface BudgetLineWithAvailability {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_actuelle: number;
  total_engage: number;
  montant_reserve: number;
  disponible_net: number;
  taux_engagement: number;
  direction?: { sigle: string | null; label: string };
  os?: { code: string; libelle: string };
  nbe?: { code: string; libelle: string };
  sysco?: { code: string; libelle: string };
}

export function NoteAEFImputeDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteAEFImputeDialogProps) {
  const { exercice } = useExercice();
  const [selectedBudgetLine, setSelectedBudgetLine] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filtres avancés
  const [filters, setFilters] = useState({
    directionId: '',
    osId: '',
    onlySufficient: false,
  });

  // Forcer l'imputation si insuffisant
  const [forceImputation, setForceImputation] = useState(false);
  const [justification, setJustification] = useState('');

  // Charger les lignes budgétaires avec disponibilité
  const { data: budgetLines = [], isLoading: loadingBudgetLines } = useQuery({
    queryKey: ['budget-lines-imputation', exercice],
    queryFn: async () => {
      const { data: lines, error } = await supabase
        .from('budget_lines')
        .select(
          `
          id,
          code,
          label,
          dotation_initiale,
          dotation_modifiee,
          total_engage,
          montant_reserve,
          direction:directions(sigle, label),
          os:objectifs_strategiques(code, libelle),
          nbe:nomenclature_nbe(code, libelle),
          sysco:plan_comptable_sysco(code, libelle)
        `
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .eq('is_active', true)
        .order('code');

      if (error) throw error;

      // Calculer disponibilités
      const enriched: BudgetLineWithAvailability[] = (lines || []).map((line) => {
        const dotation_actuelle = (line.dotation_modifiee ?? line.dotation_initiale) || 0;
        const total_engage = line.total_engage || 0;
        const montant_reserve = line.montant_reserve || 0;
        const disponible_net = dotation_actuelle - total_engage - montant_reserve;
        const taux_engagement =
          dotation_actuelle > 0 ? (total_engage / dotation_actuelle) * 100 : 0;

        return {
          id: line.id,
          code: line.code,
          label: line.label,
          dotation_initiale: line.dotation_initiale || 0,
          dotation_actuelle,
          total_engage,
          montant_reserve,
          disponible_net,
          taux_engagement,
          direction: line.direction as BudgetLineWithAvailability['direction'],
          os: line.os as BudgetLineWithAvailability['os'],
          nbe: line.nbe as BudgetLineWithAvailability['nbe'],
          sysco: line.sysco as BudgetLineWithAvailability['sysco'],
        };
      });

      return enriched;
    },
    enabled: !!exercice && open,
  });

  // Charger les directions et OS pour filtres
  const { data: directions = [] } = useQuery({
    queryKey: ['directions-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('directions')
        .select('id, sigle, label')
        .eq('est_active', true)
        .order('label');
      return data || [];
    },
  });

  const { data: objectifsStrategiques = [] } = useQuery({
    queryKey: ['os-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .eq('est_actif', true)
        .order('code');
      return data || [];
    },
  });

  // Filtrer les lignes
  const filteredLines = useMemo(() => {
    let result = budgetLines;

    // Recherche texte
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (line) => line.code.toLowerCase().includes(q) || line.label.toLowerCase().includes(q)
      );
    }

    // Filtre direction
    if (filters.directionId) {
      result = result.filter((line) => {
        // On compare par sigle car la FK est potentiellement différente
        const dir = directions.find((d) => d.id === filters.directionId);
        return dir && line.direction?.sigle === dir.sigle;
      });
    }

    // Filtre OS
    if (filters.osId) {
      const os = objectifsStrategiques.find((o) => o.id === filters.osId);
      if (os) {
        result = result.filter((line) => line.os?.code === os.code);
      }
    }

    // Seulement lignes avec disponible suffisant
    if (filters.onlySufficient && note?.montant_estime) {
      result = result.filter((line) => line.disponible_net >= (note.montant_estime || 0));
    }

    return result;
  }, [budgetLines, searchQuery, filters, directions, objectifsStrategiques, note?.montant_estime]);

  // Ligne sélectionnée
  const selectedLine = budgetLines.find((l) => l.id === selectedBudgetLine);

  // Calculs pour la ligne sélectionnée
  const montantNote = note?.montant_estime || 0;
  const isInsufficient = selectedLine ? montantNote > selectedLine.disponible_net : false;
  const disponibleApres = selectedLine ? selectedLine.disponible_net - montantNote : 0;
  const tauxApres =
    selectedLine && selectedLine.dotation_actuelle > 0
      ? ((selectedLine.total_engage + montantNote) / selectedLine.dotation_actuelle) * 100
      : 0;

  // Reset état à l'ouverture
  useEffect(() => {
    if (open) {
      setSelectedBudgetLine('');
      setSearchQuery('');
      setForceImputation(false);
      setJustification('');
      setFilters({ directionId: note?.direction_id || '', osId: '', onlySufficient: false });
    }
  }, [open, note?.direction_id]);

  const handleConfirm = async () => {
    if (!note || !selectedBudgetLine) return;
    if (isInsufficient && !forceImputation) return;
    if (isInsufficient && forceImputation && !justification.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(note.id, selectedBudgetLine);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Imputation budgétaire
            {(note.reference_pivot || note.numero) && (
              <ARTIReferenceBadge reference={note.reference_pivot || note.numero} size="sm" short />
            )}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la ligne budgétaire sur laquelle imputer la note "{note.objet}".
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {/* Résumé de la note */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Objet:</span>
                    <p className="font-medium truncate">{note.objet}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Direction:</span>
                    <p className="font-medium">
                      {note.direction?.sigle || note.direction?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type dépense:</span>
                    <p className="font-medium capitalize">{note.type_depense || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant à imputer:</span>
                    <p className="font-bold text-primary text-lg">{formatMontant(montantNote)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtres */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres et recherche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par code ou libellé..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Select
                      value={filters.directionId}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, directionId: v === '__all__' ? '' : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Toutes</SelectItem>
                        {directions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.sigle || d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={filters.osId}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, osId: v === '__all__' ? '' : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Obj. Stratégique" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tous</SelectItem>
                        {objectifsStrategiques.map((os) => (
                          <SelectItem key={os.id} value={os.id}>
                            {os.code} - {os.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="onlySufficient"
                    checked={filters.onlySufficient}
                    onCheckedChange={(c) =>
                      setFilters((prev) => ({ ...prev, onlySufficient: !!c }))
                    }
                  />
                  <Label htmlFor="onlySufficient" className="text-sm cursor-pointer">
                    Afficher uniquement les lignes avec disponible suffisant (
                    {formatMontant(montantNote)})
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Tableau des lignes budgétaires */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Lignes budgétaires ({filteredLines.length})
                  </span>
                  {selectedLine && (
                    <Badge variant="outline" className="font-mono">
                      Sélectionné: {selectedLine.code}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBudgetLines ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mb-2 opacity-50" />
                    <p>Aucune ligne budgétaire trouvée</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-10" />
                          <TableHead>Code</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead>Dir.</TableHead>
                          <TableHead className="text-right">Dotation</TableHead>
                          <TableHead className="text-right">Engagé</TableHead>
                          <TableHead className="text-right">Disponible</TableHead>
                          <TableHead className="w-24">Taux</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLines.map((line) => {
                          const isSelected = selectedBudgetLine === line.id;
                          const canReceive = line.disponible_net >= montantNote;

                          return (
                            <TableRow
                              key={line.id}
                              className={cn(
                                'cursor-pointer transition-colors',
                                isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
                                !canReceive && !isSelected ? 'opacity-60' : ''
                              )}
                              onClick={() => setSelectedBudgetLine(line.id)}
                            >
                              <TableCell>
                                <input
                                  type="radio"
                                  name="budgetLine"
                                  checked={isSelected}
                                  onChange={() => setSelectedBudgetLine(line.id)}
                                  className="h-4 w-4"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">{line.code}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {line.label}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {line.direction?.sigle || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatMontant(line.dotation_actuelle)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-orange-600">
                                {formatMontant(line.total_engage)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'text-right font-mono text-sm font-medium',
                                  line.disponible_net < 0
                                    ? 'text-destructive'
                                    : line.disponible_net < montantNote
                                      ? 'text-orange-600'
                                      : 'text-green-600'
                                )}
                              >
                                {formatMontant(line.disponible_net)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={Math.min(line.taux_engagement, 100)}
                                    className="h-2 w-12"
                                  />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {line.taux_engagement.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Récapitulatif budgétaire */}
            {selectedLine && (
              <Card
                className={cn(
                  'border-2 transition-colors',
                  isInsufficient && !forceImputation
                    ? 'border-destructive bg-destructive/5'
                    : isInsufficient && forceImputation
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-green-500 bg-green-500/5'
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Récapitulatif budgétaire
                    {!isInsufficient && (
                      <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Disponible suffisant
                      </Badge>
                    )}
                    {isInsufficient && !forceImputation && (
                      <Badge variant="destructive" className="ml-auto">
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqué
                      </Badge>
                    )}
                    {isInsufficient && forceImputation && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-600 ml-auto"
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        Forcé
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Détail de la ligne */}
                  <div className="bg-background rounded-lg p-3 border text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold">{selectedLine.code}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="truncate">{selectedLine.label}</span>
                    </div>
                    {selectedLine.os && (
                      <p className="text-xs text-muted-foreground">
                        OS: {selectedLine.os.code} - {selectedLine.os.libelle}
                      </p>
                    )}
                    {selectedLine.nbe && (
                      <p className="text-xs text-muted-foreground">
                        NBE: {selectedLine.nbe.code} - {selectedLine.nbe.libelle}
                      </p>
                    )}
                  </div>

                  {/* Tableau de calcul */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Dotation</p>
                      <p className="font-bold">{formatMontant(selectedLine.dotation_actuelle)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Engagé</p>
                      <p className="font-bold text-orange-600">
                        {formatMontant(selectedLine.total_engage)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Réservé</p>
                      <p className="font-bold text-amber-600">
                        {formatMontant(selectedLine.montant_reserve)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        selectedLine.disponible_net >= montantNote
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      )}
                    >
                      <p className="text-xs text-muted-foreground">Disponible net</p>
                      <p
                        className={cn(
                          'font-bold',
                          selectedLine.disponible_net >= 0 ? 'text-green-600' : 'text-destructive'
                        )}
                      >
                        {formatMontant(selectedLine.disponible_net)}
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2 border-2 border-primary">
                      <p className="text-xs text-muted-foreground">À imputer</p>
                      <p className="font-bold text-primary">{formatMontant(montantNote)}</p>
                    </div>
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        disponibleApres >= 0
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      )}
                    >
                      <p className="text-xs text-muted-foreground">Dispo. après</p>
                      <p
                        className={cn(
                          'font-bold',
                          disponibleApres >= 0 ? 'text-green-600' : 'text-destructive'
                        )}
                      >
                        {formatMontant(disponibleApres)}
                      </p>
                    </div>
                  </div>

                  {/* Taux d'engagement */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Taux d'engagement après imputation:
                    </span>
                    <Progress value={Math.min(tauxApres, 100)} className="flex-1 h-2" />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        tauxApres > 100
                          ? 'text-destructive'
                          : tauxApres > 80
                            ? 'text-orange-600'
                            : ''
                      )}
                    >
                      {tauxApres.toFixed(1)}%
                    </span>
                    {tauxApres > 80 && tauxApres <= 100 && (
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    )}
                    {tauxApres > 100 && <TrendingDown className="h-4 w-4 text-destructive" />}
                  </div>

                  {/* Alerte si insuffisant */}
                  {isInsufficient && (
                    <Alert variant={forceImputation ? 'default' : 'destructive'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Disponible insuffisant</AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>
                          Le montant à imputer ({formatMontant(montantNote)}) dépasse le disponible
                          net de{' '}
                          <strong>
                            {formatMontant(Math.abs(selectedLine.disponible_net - montantNote))}
                          </strong>
                          .
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <Checkbox
                            id="forceImputation"
                            checked={forceImputation}
                            onCheckedChange={(c) => setForceImputation(!!c)}
                          />
                          <Label htmlFor="forceImputation" className="font-medium cursor-pointer">
                            Forcer l'imputation avec justification
                          </Label>
                        </div>

                        {forceImputation && (
                          <div>
                            <Label htmlFor="justification" className="text-xs">
                              Justification obligatoire:
                            </Label>
                            <Textarea
                              id="justification"
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              placeholder="Expliquez pourquoi cette imputation est nécessaire malgré l'insuffisance..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Succès */}
                  {!isInsufficient && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Imputation validée</AlertTitle>
                      <AlertDescription className="text-green-600/80">
                        Le budget est suffisant. L'imputation créera une réservation et mettra à
                        jour le dossier.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !selectedBudgetLine ||
              isLoading ||
              (isInsufficient && !forceImputation) ||
              (isInsufficient && forceImputation && !justification.trim())
            }
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <CreditCard className="h-4 w-4" />
            Imputer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
