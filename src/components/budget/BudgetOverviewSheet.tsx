import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wallet,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { formatCurrency } from '@/lib/utils';

/** Données par ligne budgétaire */
interface BudgetLineOverview {
  id: string;
  code: string;
  label: string;
  direction_label: string;
  dotation_initiale: number;
  virements_recus: number;
  virements_emis: number;
  dotation_actuelle: number;
  total_engage: number;
  disponible: number;
  taux_engagement: number;
}

/** Résumé global */
interface BudgetGlobalSummary {
  total_dotation_initiale: number;
  total_dotation_actuelle: number;
  total_engage: number;
  total_disponible: number;
  taux_global: number;
  nb_lignes: number;
  nb_lignes_depassement: number;
  total_virements_recus: number;
  total_virements_emis: number;
}

interface BudgetOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Onglet à afficher par défaut : dotation ou disponible */
  defaultTab?: 'dotation' | 'disponible';
}

/** Couleur du taux d'engagement */
function getTauxStyle(taux: number) {
  if (taux > 100) return { color: 'text-red-700 font-bold', bg: 'bg-red-100 dark:bg-red-900/30' };
  if (taux > 90) return { color: 'text-red-600 font-semibold', bg: 'bg-red-50 dark:bg-red-900/20' };
  if (taux > 70)
    return { color: 'text-orange-600 font-medium', bg: 'bg-orange-50 dark:bg-orange-900/20' };
  return { color: 'text-green-600 font-medium', bg: '' };
}

/** Couleur du disponible */
function getDisponibleStyle(disponible: number, dotation: number) {
  if (disponible < 0) return 'text-red-700 font-bold';
  const ratio = dotation > 0 ? ((dotation - disponible) / dotation) * 100 : 0;
  if (ratio > 90) return 'text-red-600 font-semibold';
  if (ratio > 70) return 'text-orange-600 font-medium';
  return 'text-green-600 font-medium';
}

/** Barre de progression inline */
function MiniProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const barColor =
    value > 100
      ? 'bg-red-500'
      : value > 90
        ? 'bg-red-400'
        : value > 70
          ? 'bg-orange-400'
          : 'bg-green-500';

  return (
    <div
      className={`relative h-2 w-full rounded-full bg-secondary overflow-hidden ${className || ''}`}
    >
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all duration-300`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Hook pour charger toutes les données budget par ligne */
function useBudgetOverview(enabled: boolean) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['budget-overview-all-lines', exercice],
    enabled: enabled && !!exercice,
    queryFn: async (): Promise<{ lines: BudgetLineOverview[]; summary: BudgetGlobalSummary }> => {
      const currentExercice = exercice || new Date().getFullYear();

      // 1. Charger toutes les lignes actives
      const { data: budgetLines, error: linesError } = await supabase
        .from('budget_lines')
        .select(
          `
          id, code, label, dotation_initiale, total_engage,
          direction:directions(label, sigle)
        `
        )
        .eq('exercice', currentExercice)
        .eq('is_active', true)
        .order('code');

      if (linesError) throw linesError;
      if (!budgetLines || budgetLines.length === 0) {
        return {
          lines: [],
          summary: {
            total_dotation_initiale: 0,
            total_dotation_actuelle: 0,
            total_engage: 0,
            total_disponible: 0,
            taux_global: 0,
            nb_lignes: 0,
            nb_lignes_depassement: 0,
            total_virements_recus: 0,
            total_virements_emis: 0,
          },
        };
      }

      // 2. Charger tous les virements exécutés
      const { data: virements, error: virementsError } = await supabase
        .from('credit_transfers')
        .select('from_budget_line_id, to_budget_line_id, amount')
        .eq('exercice', currentExercice)
        .eq('status', 'execute');

      if (virementsError) {
        console.error('[BudgetOverview] Erreur chargement virements:', virementsError);
      }

      // Map virements par ligne
      const virementsMap = new Map<string, { recus: number; emis: number }>();
      virements?.forEach((v) => {
        if (v.from_budget_line_id) {
          const c = virementsMap.get(v.from_budget_line_id) || { recus: 0, emis: 0 };
          c.emis += v.amount || 0;
          virementsMap.set(v.from_budget_line_id, c);
        }
        if (v.to_budget_line_id) {
          const c = virementsMap.get(v.to_budget_line_id) || { recus: 0, emis: 0 };
          c.recus += v.amount || 0;
          virementsMap.set(v.to_budget_line_id, c);
        }
      });

      // 3. Calculer par ligne
      let totalDotInit = 0;
      let totalDotAct = 0;
      let totalEngage = 0;
      let nbDepassement = 0;
      let totalVirRecus = 0;
      let totalVirEmis = 0;

      const lines: BudgetLineOverview[] = budgetLines.map((bl) => {
        const dotInit = bl.dotation_initiale || 0;
        const vir = virementsMap.get(bl.id) || { recus: 0, emis: 0 };
        const dotActuelle = dotInit + vir.recus - vir.emis;
        const engage = bl.total_engage || 0;
        const disponible = dotActuelle - engage;
        const taux = dotActuelle > 0 ? (engage / dotActuelle) * 100 : 0;

        totalDotInit += dotInit;
        totalDotAct += dotActuelle;
        totalEngage += engage;
        totalVirRecus += vir.recus;
        totalVirEmis += vir.emis;
        if (disponible < 0) nbDepassement++;

        const dirData = bl.direction as { label?: string; sigle?: string } | null;

        return {
          id: bl.id,
          code: bl.code,
          label: bl.label,
          direction_label: dirData?.sigle || dirData?.label || '—',
          dotation_initiale: dotInit,
          virements_recus: vir.recus,
          virements_emis: vir.emis,
          dotation_actuelle: dotActuelle,
          total_engage: engage,
          disponible,
          taux_engagement: taux,
        };
      });

      const totalDisponible = totalDotAct - totalEngage;
      const tauxGlobal = totalDotAct > 0 ? (totalEngage / totalDotAct) * 100 : 0;

      return {
        lines,
        summary: {
          total_dotation_initiale: totalDotInit,
          total_dotation_actuelle: totalDotAct,
          total_engage: totalEngage,
          total_disponible: totalDisponible,
          taux_global: tauxGlobal,
          nb_lignes: lines.length,
          nb_lignes_depassement: nbDepassement,
          total_virements_recus: totalVirRecus,
          total_virements_emis: totalVirEmis,
        },
      };
    },
    staleTime: 1000 * 30,
  });
}

export function BudgetOverviewSheet({
  open,
  onOpenChange,
  defaultTab = 'dotation',
}: BudgetOverviewSheetProps) {
  const { exercice } = useExercice();
  const { data, isLoading, isError, error } = useBudgetOverview(open);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync defaultTab and reset search when sheet re-opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setSearch('');
    }
  }, [open, defaultTab]);

  const filteredLines = useMemo(() => {
    if (!data?.lines) return [];
    if (!search.trim()) return data.lines;
    const q = search.toLowerCase();
    return data.lines.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.direction_label.toLowerCase().includes(q)
    );
  }, [data?.lines, search]);

  const summary = data?.summary;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Situation Budgétaire — Exercice {exercice || new Date().getFullYear()}
          </SheetTitle>
          <SheetDescription>
            Vue consolidée des dotations et disponibilités par ligne budgétaire
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des données budgétaires...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
            <AlertTriangle className="h-10 w-10 opacity-70" />
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="text-xs text-muted-foreground max-w-sm text-center">
              {error instanceof Error
                ? error.message
                : 'Impossible de charger les données budgétaires. Veuillez réessayer.'}
            </p>
          </div>
        ) : !summary ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée budgétaire disponible</p>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* KPIs globaux */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Dotation Initiale</span>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(summary.total_dotation_initiale)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs text-muted-foreground">Dotation Actuelle</span>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(summary.total_dotation_actuelle)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="flex items-center gap-0.5 text-green-600">
                      <ArrowUpRight className="h-3 w-3" />+
                      {formatCurrency(summary.total_virements_recus)}
                    </span>
                    <span className="flex items-center gap-0.5 text-red-500">
                      <ArrowDownRight className="h-3 w-3" />-
                      {formatCurrency(summary.total_virements_emis)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Total Engagé</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(summary.total_engage)}</p>
                  <p className={`text-xs mt-1 ${getTauxStyle(summary.taux_global).color}`}>
                    {summary.taux_global.toFixed(1)}% de consommation
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`${summary.total_disponible < 0 ? 'border-red-300 dark:border-red-700' : 'border-green-200 dark:border-green-800'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {summary.total_disponible < 0 ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-xs text-muted-foreground">Total Disponible</span>
                  </div>
                  <p
                    className={`text-lg font-bold ${summary.total_disponible < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {formatCurrency(summary.total_disponible)}
                  </p>
                  {summary.nb_lignes_depassement > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {summary.nb_lignes_depassement} ligne
                      {summary.nb_lignes_depassement > 1 ? 's' : ''} en dépassement
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Barre de consommation globale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taux de consommation global</span>
                <span className={getTauxStyle(summary.taux_global).color}>
                  {summary.taux_global.toFixed(1)}%
                </span>
              </div>
              <MiniProgressBar value={summary.taux_global} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{summary.nb_lignes} lignes budgétaires actives</span>
                <span>
                  Engagé: {formatCurrency(summary.total_engage)} /{' '}
                  {formatCurrency(summary.total_dotation_actuelle)}
                </span>
              </div>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code, libellé ou direction..."
                className="pl-9"
              />
            </div>

            {/* Onglets détail */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dotation" className="gap-1 text-xs">
                  <Wallet className="h-4 w-4" />
                  Dotation Actuelle
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {filteredLines.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="disponible" className="gap-1 text-xs">
                  <Banknote className="h-4 w-4" />
                  Disponible
                  {summary.nb_lignes_depassement > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[10px]">
                      {summary.nb_lignes_depassement}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab Dotation Actuelle */}
              <TabsContent value="dotation" className="mt-3">
                <div className="rounded-md border max-h-[50vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs min-w-[80px]">Code</TableHead>
                        <TableHead className="text-xs min-w-[150px]">Libellé</TableHead>
                        <TableHead className="text-xs">Direction</TableHead>
                        <TableHead className="text-xs text-right">Dotation Initiale</TableHead>
                        <TableHead className="text-xs text-right text-green-600">
                          Vir. Reçus
                        </TableHead>
                        <TableHead className="text-xs text-right text-red-500">Vir. Émis</TableHead>
                        <TableHead className="text-xs text-right font-semibold">
                          Dotation Actuelle
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Aucune ligne trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLines.map((line) => (
                          <TableRow
                            key={line.id}
                            className={line.disponible < 0 ? 'bg-red-50/50 dark:bg-red-950/10' : ''}
                          >
                            <TableCell className="font-mono text-xs">{line.code}</TableCell>
                            <TableCell
                              className="text-xs max-w-[200px] truncate"
                              title={line.label}
                            >
                              {line.label}
                            </TableCell>
                            <TableCell className="text-xs">{line.direction_label}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {formatCurrency(line.dotation_initiale)}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono text-green-600">
                              {line.virements_recus > 0
                                ? `+${formatCurrency(line.virements_recus)}`
                                : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono text-red-500">
                              {line.virements_emis > 0
                                ? `-${formatCurrency(line.virements_emis)}`
                                : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono font-semibold">
                              {formatCurrency(line.dotation_actuelle)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Tab Disponible */}
              <TabsContent value="disponible" className="mt-3">
                <div className="rounded-md border max-h-[50vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs min-w-[80px]">Code</TableHead>
                        <TableHead className="text-xs min-w-[150px]">Libellé</TableHead>
                        <TableHead className="text-xs">Direction</TableHead>
                        <TableHead className="text-xs text-right">Dotation Actuelle</TableHead>
                        <TableHead className="text-xs text-right">Engagé</TableHead>
                        <TableHead className="text-xs text-right font-semibold">
                          Disponible
                        </TableHead>
                        <TableHead className="text-xs text-right min-w-[100px]">Taux</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Aucune ligne trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLines.map((line) => {
                          const tauxStyle = getTauxStyle(line.taux_engagement);
                          return (
                            <TableRow
                              key={line.id}
                              className={
                                line.disponible < 0 ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                              }
                            >
                              <TableCell className="font-mono text-xs">{line.code}</TableCell>
                              <TableCell
                                className="text-xs max-w-[200px] truncate"
                                title={line.label}
                              >
                                {line.label}
                              </TableCell>
                              <TableCell className="text-xs">{line.direction_label}</TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {formatCurrency(line.dotation_actuelle)}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono text-orange-600">
                                {formatCurrency(line.total_engage)}
                              </TableCell>
                              <TableCell
                                className={`text-xs text-right font-mono ${getDisponibleStyle(line.disponible, line.dotation_actuelle)}`}
                              >
                                {formatCurrency(line.disponible)}
                                {line.disponible < 0 && (
                                  <AlertTriangle className="inline ml-1 h-3 w-3 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`font-mono ${tauxStyle.color}`}>
                                    {line.taux_engagement.toFixed(1)}%
                                  </span>
                                  <MiniProgressBar value={line.taux_engagement} className="w-16" />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
