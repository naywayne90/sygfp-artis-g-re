import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState, EmptyStateNoResults } from '@/components/shared/EmptyState';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  type ExportColumn,
} from '@/lib/export/export-service';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  History,
  FileSpreadsheet,
  FileDown,
  FileText,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof TrendingUp }> =
  {
    virement_sortant: { label: 'Virement sortant', color: 'text-red-600', icon: TrendingDown },
    virement_entrant: { label: 'Virement entrant', color: 'text-green-600', icon: TrendingUp },
    ajustement_positif: { label: 'Ajustement +', color: 'text-green-600', icon: TrendingUp },
    ajustement_negatif: { label: 'Ajustement -', color: 'text-red-600', icon: TrendingDown },
    engagement: { label: 'Engagement', color: 'text-orange-600', icon: TrendingDown },
    liquidation: { label: 'Liquidation', color: 'text-blue-600', icon: TrendingDown },
    ordonnancement: { label: 'Ordonnancement', color: 'text-purple-600', icon: TrendingDown },
    paiement: { label: 'Paiement', color: 'text-green-600', icon: TrendingDown },
    annulation: { label: 'Annulation', color: 'text-gray-600', icon: TrendingUp },
    import: { label: 'Import', color: 'text-primary', icon: TrendingUp },
  };

// ============================================================================
// Types
// ============================================================================

interface BudgetMovement {
  id: string;
  budget_line_id: string;
  event_type: string;
  delta: number;
  dotation_avant: number | null;
  dotation_apres: number | null;
  disponible_avant: number | null;
  disponible_apres: number | null;
  ref_code: string | null;
  ref_id: string | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  budget_line?: { code: string; label: string };
  created_by_profile?: { full_name: string };
}

// ============================================================================
// Export configuration
// ============================================================================

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'date', label: 'Date', type: 'string', width: 20 },
  { key: 'type', label: 'Type', type: 'string', width: 20 },
  { key: 'ligne', label: 'Ligne budgétaire', type: 'string', width: 15 },
  { key: 'ligne_label', label: 'Libellé', type: 'string', width: 30 },
  { key: 'delta', label: 'Delta (FCFA)', type: 'number', format: 'currency', width: 18 },
  { key: 'dotation_avant', label: 'Dotation avant', type: 'number', format: 'currency', width: 18 },
  { key: 'dotation_apres', label: 'Dotation après', type: 'number', format: 'currency', width: 18 },
  { key: 'reference', label: 'Référence', type: 'string', width: 18 },
  { key: 'commentaire', label: 'Commentaire', type: 'string', width: 30 },
  { key: 'utilisateur', label: 'Utilisateur', type: 'string', width: 20 },
];

function prepareExportData(movements: BudgetMovement[]) {
  return movements.map((m) => ({
    date: format(new Date(m.created_at), 'dd/MM/yyyy HH:mm'),
    type: EVENT_TYPE_LABELS[m.event_type]?.label || m.event_type,
    ligne: m.budget_line?.code || '-',
    ligne_label: m.budget_line?.label || '-',
    delta: m.delta,
    dotation_avant: m.dotation_avant || 0,
    dotation_apres: m.dotation_apres || 0,
    reference: m.ref_code || '-',
    commentaire: m.commentaire || '',
    utilisateur: m.created_by_profile?.full_name || '-',
  }));
}

// ============================================================================
// Component
// ============================================================================

export function BudgetMovementJournal() {
  const { exercice } = useExercice();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const {
    data: movements = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['budget-movements-journal', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_history')
        .select(
          `
          *,
          budget_line:budget_lines!budget_history_budget_line_id_fkey(code, label),
          created_by_profile:profiles!budget_history_created_by_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as BudgetMovement[];
    },
    enabled: !!exercice,
  });

  // Filtered movements
  const filteredMovements = useMemo(
    () =>
      movements.filter((m) => {
        const matchesSearch =
          !searchTerm ||
          m.budget_line?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.budget_line?.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.ref_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.commentaire?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = eventTypeFilter === 'all' || m.event_type === eventTypeFilter;

        return matchesSearch && matchesType;
      }),
    [movements, searchTerm, eventTypeFilter]
  );

  // Stats
  const stats = useMemo(
    () => ({
      total: movements.length,
      virements: movements.filter((m) => m.event_type.includes('virement')).length,
      engagements: movements.filter((m) => m.event_type === 'engagement').length,
      ajustements: movements.filter((m) => m.event_type.includes('ajustement')).length,
    }),
    [movements]
  );

  // Totals
  const totals = useMemo(() => {
    const positiveDeltas = filteredMovements
      .filter((m) => m.delta > 0)
      .reduce((sum, m) => sum + m.delta, 0);
    const negativeDeltas = filteredMovements
      .filter((m) => m.delta < 0)
      .reduce((sum, m) => sum + m.delta, 0);
    return {
      positive: positiveDeltas,
      negative: negativeDeltas,
      net: positiveDeltas + negativeDeltas,
    };
  }, [filteredMovements]);

  // Active filters check
  const hasActiveFilters = searchTerm || eventTypeFilter !== 'all';

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(
      prepareExportData(filteredMovements),
      EXPORT_COLUMNS,
      `journal_mouvements_${exercice}`
    );
    toast.success('Export CSV réussi');
  };

  const handleExportExcel = () => {
    exportToExcel(
      prepareExportData(filteredMovements),
      EXPORT_COLUMNS,
      `journal_mouvements_${exercice}`
    );
    toast.success('Export Excel réussi');
  };

  const handleExportPDF = () => {
    exportToPDF(
      prepareExportData(filteredMovements),
      EXPORT_COLUMNS,
      `Journal des Mouvements Budgétaires - Exercice ${exercice}`,
      `journal_mouvements_${exercice}`
    );
    toast.success('Export PDF réussi');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Total mouvements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{stats.virements}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Virements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 shrink-0 text-orange-500" />
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{stats.engagements}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Engagements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{stats.ajustements}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Ajustements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 sm:items-end">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>

              {/* Export menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exporter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setEventTypeFilter('all');
                  }}
                >
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Journal des Mouvements
          </CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `${filteredMovements.length}/${movements.length} mouvement(s) affiché(s)`
              : `${movements.length} mouvement(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              icon={<History className="h-12 w-12" />}
              title="Aucun mouvement budgétaire"
              description="Les mouvements apparaîtront ici lors de l'exécution de virements, engagements et autres opérations."
            />
          ) : filteredMovements.length === 0 ? (
            <EmptyStateNoResults
              searchTerm={searchTerm}
              onClear={() => {
                setSearchTerm('');
                setEventTypeFilter('all');
              }}
            />
          ) : (
            <ScrollArea className="h-[350px] sm:h-[400px] lg:h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ligne budgétaire</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Avant</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Après</TableHead>
                    <TableHead className="hidden lg:table-cell">Référence</TableHead>
                    <TableHead className="hidden lg:table-cell">Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((m) => {
                    const typeConfig = EVENT_TYPE_LABELS[m.event_type] || {
                      label: m.event_type,
                      color: 'text-muted-foreground',
                      icon: ArrowRightLeft,
                    };
                    const Icon = typeConfig.icon;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          <span className="hidden sm:inline">
                            {format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                          <span className="sm:hidden">
                            {format(new Date(m.created_at), 'dd/MM', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
                            <Icon className="h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-mono text-xs">{m.budget_line?.code || '-'}</span>
                            {m.budget_line?.label && (
                              <p className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[150px] lg:max-w-[200px]">
                                {m.budget_line.label}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              m.delta >= 0
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {m.delta >= 0 ? '+' : ''}
                            {formatCurrency(m.delta)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground hidden md:table-cell">
                          {m.dotation_avant !== null ? formatCurrency(m.dotation_avant) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                          {m.dotation_apres !== null ? formatCurrency(m.dotation_apres) : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {m.ref_code && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {m.ref_code}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                          {m.created_by_profile?.full_name || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell className="text-right text-xs sm:text-sm">
                      Total ({filteredMovements.length})
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-mono text-xs sm:text-sm">
                      <div className="space-y-0.5">
                        <div className="text-green-600">+{formatCurrency(totals.positive)}</div>
                        <div className="text-red-600">{formatCurrency(totals.negative)}</div>
                        <div className="font-bold border-t pt-0.5">
                          = {totals.net >= 0 ? '+' : ''}
                          {formatCurrency(totals.net)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell" />
                    <TableCell className="hidden md:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                  </TableRow>
                </TableFooter>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
