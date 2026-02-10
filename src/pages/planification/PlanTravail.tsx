import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useExercice } from '@/contexts/ExerciceContext';
import { useBudgetLines, BudgetLineWithRelations } from '@/hooks/useBudgetLines';
import { useBaseReferentiels } from '@/hooks/useBaseReferentiels';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatters,
  type ExportColumn,
  type ExportOptions,
} from '@/lib/export/export-service';
import {
  ClipboardList,
  Search,
  Download,
  Filter,
  Target,
  Building2,
  TrendingUp,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Sheet,
  ChevronDown,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA'
  );
};

/** Dotation effective = dotation_modifiee si dispo, sinon dotation_initiale */
function getEffectiveDotation(line: BudgetLineWithRelations): number {
  return line.dotation_modifiee ?? line.dotation_initiale ?? 0;
}

function getExecutionColor(rate: number): string {
  if (rate >= 75) return 'text-green-600';
  if (rate >= 50) return 'text-orange-500';
  if (rate >= 25) return 'text-amber-500';
  return 'text-muted-foreground';
}

function getProgressColor(rate: number): string {
  if (rate >= 75) return 'bg-green-500';
  if (rate >= 50) return 'bg-orange-500';
  if (rate >= 25) return 'bg-amber-500';
  return '';
}

// ============================================================================
// Types
// ============================================================================

interface AggregatedData {
  id: string;
  code: string;
  label: string;
  dotation: number;
  engage: number;
  liquide: number;
  ordonnance: number;
  paye: number;
  disponible: number;
  tauxExecution: number;
  linesCount: number;
}

// ============================================================================
// Export Configuration
// ============================================================================

const aggregatedExportColumns: ExportColumn[] = [
  { key: 'code', label: 'Code', type: 'text', width: 10 },
  { key: 'label', label: 'Libellé', type: 'text', width: 35 },
  { key: 'linesCount', label: 'Nb Lignes', type: 'number', width: 10 },
  { key: 'dotation', label: 'Dotation', type: 'currency', width: 18 },
  { key: 'engage', label: 'Engagé', type: 'currency', width: 18 },
  { key: 'liquide', label: 'Liquidé', type: 'currency', width: 18 },
  { key: 'ordonnance', label: 'Ordonnancé', type: 'currency', width: 18 },
  { key: 'paye', label: 'Payé', type: 'currency', width: 18 },
  { key: 'disponible', label: 'Disponible', type: 'currency', width: 18 },
  {
    key: 'tauxExecution',
    label: 'Taux Exécution',
    type: 'text',
    width: 14,
    format: (v: unknown) => {
      const num = typeof v === 'number' ? v : 0;
      return `${num.toFixed(1)}%`;
    },
  },
];

const detailExportColumns: ExportColumn[] = [
  { key: 'code', label: 'Code Imputation', type: 'text', width: 22 },
  { key: 'label', label: 'Libellé', type: 'text', width: 35 },
  { key: 'level', label: 'Niveau', type: 'text', width: 12 },
  { key: 'direction.code', label: 'Dir. Code', type: 'text', width: 8 },
  { key: 'direction.label', label: 'Direction', type: 'text', width: 25 },
  { key: 'objectif_strategique.code', label: 'OS Code', type: 'text', width: 8 },
  { key: 'objectif_strategique.libelle', label: 'Objectif Stratégique', type: 'text', width: 30 },
  { key: 'source_financement', label: 'Source Financement', type: 'text', width: 18 },
  { key: 'dotation_initiale', label: 'Dotation Initiale', type: 'currency', width: 18 },
  { key: 'dotation_modifiee', label: 'Dotation Modifiée', type: 'currency', width: 18 },
  { key: 'total_engage', label: 'Engagé', type: 'currency', width: 15 },
  { key: 'total_liquide', label: 'Liquidé', type: 'currency', width: 15 },
  { key: 'total_ordonnance', label: 'Ordonnancé', type: 'currency', width: 15 },
  { key: 'total_paye', label: 'Payé', type: 'currency', width: 15 },
  {
    key: 'disponible_calcule',
    label: 'Disponible',
    type: 'currency',
    width: 15,
  },
  {
    key: 'statut',
    label: 'Statut',
    type: 'text',
    width: 12,
    format: (v: unknown) => formatters.status(v),
  },
];

const aggregatedTotalColumns = [
  'dotation',
  'engage',
  'liquide',
  'ordonnance',
  'paye',
  'disponible',
];

const detailTotalColumns = [
  'dotation_initiale',
  'dotation_modifiee',
  'total_engage',
  'total_liquide',
  'total_ordonnance',
  'total_paye',
  'disponible_calcule',
];

// ============================================================================
// Component
// ============================================================================

export default function PlanTravail() {
  const { exercice } = useExercice();
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState('par-os');

  const { budgetLines, isLoading } = useBudgetLines({});
  const { directions, objectifsStrategiques } = useBaseReferentiels();

  // ========================================================================
  // Filtered lines (filters apply to ALL views)
  // ========================================================================
  const filteredLines = useMemo(() => {
    if (!budgetLines) return [];

    return budgetLines.filter((line) => {
      const matchesSearch =
        !searchTerm ||
        line.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.label.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDirection = directionFilter === 'all' || line.direction_id === directionFilter;

      const matchesOS = osFilter === 'all' || line.os_id === osFilter;

      return matchesSearch && matchesDirection && matchesOS;
    });
  }, [budgetLines, searchTerm, directionFilter, osFilter]);

  // ========================================================================
  // Aggregate by OS (using filtered lines)
  // ========================================================================
  const dataByOS = useMemo(() => {
    if (!filteredLines.length) return [];

    const grouped: Record<string, AggregatedData> = {};

    filteredLines.forEach((line) => {
      const osId = line.os_id || 'non_affecte';
      const os = objectifsStrategiques?.find((o) => o.id === line.os_id);

      if (!grouped[osId]) {
        grouped[osId] = {
          id: osId,
          code: os?.code || '-',
          label: os?.libelle || 'Non affecté',
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
          disponible: 0,
          tauxExecution: 0,
          linesCount: 0,
        };
      }

      const dotation = getEffectiveDotation(line);
      grouped[osId].dotation += dotation;
      grouped[osId].engage += line.total_engage || 0;
      grouped[osId].liquide += line.total_liquide || 0;
      grouped[osId].ordonnance += line.total_ordonnance || 0;
      grouped[osId].paye += line.total_paye || 0;
      grouped[osId].linesCount += 1;
    });

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        disponible: item.dotation - item.engage,
        tauxExecution: item.dotation > 0 ? (item.paye / item.dotation) * 100 : 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredLines, objectifsStrategiques]);

  // ========================================================================
  // Aggregate by Direction (using filtered lines)
  // ========================================================================
  const dataByDirection = useMemo(() => {
    if (!filteredLines.length) return [];

    const grouped: Record<string, AggregatedData> = {};

    filteredLines.forEach((line) => {
      const dirId = line.direction_id || 'non_affecte';
      const dir = directions?.find((d) => d.id === line.direction_id);

      if (!grouped[dirId]) {
        grouped[dirId] = {
          id: dirId,
          code: dir?.code || '-',
          label: dir?.label || 'Non affecté',
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
          disponible: 0,
          tauxExecution: 0,
          linesCount: 0,
        };
      }

      const dotation = getEffectiveDotation(line);
      grouped[dirId].dotation += dotation;
      grouped[dirId].engage += line.total_engage || 0;
      grouped[dirId].liquide += line.total_liquide || 0;
      grouped[dirId].ordonnance += line.total_ordonnance || 0;
      grouped[dirId].paye += line.total_paye || 0;
      grouped[dirId].linesCount += 1;
    });

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        disponible: item.dotation - item.engage,
        tauxExecution: item.dotation > 0 ? (item.paye / item.dotation) * 100 : 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredLines, directions]);

  // ========================================================================
  // Totals (from filtered lines)
  // ========================================================================
  const totals = useMemo(() => {
    return filteredLines.reduce(
      (acc, line) => {
        const dotation = getEffectiveDotation(line);
        return {
          dotation: acc.dotation + dotation,
          engage: acc.engage + (line.total_engage || 0),
          liquide: acc.liquide + (line.total_liquide || 0),
          ordonnance: acc.ordonnance + (line.total_ordonnance || 0),
          paye: acc.paye + (line.total_paye || 0),
        };
      },
      { dotation: 0, engage: 0, liquide: 0, ordonnance: 0, paye: 0 }
    );
  }, [filteredLines]);

  const hasActiveFilters = searchTerm || directionFilter !== 'all' || osFilter !== 'all';

  // ========================================================================
  // Export handlers
  // ========================================================================
  function getExportOptions(title: string, filename: string): ExportOptions {
    return {
      title,
      subtitle: `Exercice ${exercice}${hasActiveFilters ? ' (filtré)' : ''}`,
      filename,
      exercice: exercice ?? undefined,
      showTotals: true,
      orientation: 'landscape',
    };
  }

  function handleExportAggregated(
    data: AggregatedData[],
    title: string,
    filename: string,
    format: 'csv' | 'excel' | 'pdf'
  ) {
    const options = {
      ...getExportOptions(title, filename),
      totalColumns: aggregatedTotalColumns,
    };

    const rows = data as unknown as Record<string, unknown>[];
    let result;

    switch (format) {
      case 'csv':
        result = exportToCSV(rows, aggregatedExportColumns, options);
        break;
      case 'excel':
        result = exportToExcel(rows, aggregatedExportColumns, options);
        break;
      case 'pdf':
        result = exportToPDF(rows, aggregatedExportColumns, options);
        break;
    }

    if (result.success) {
      toast.success(`Export ${format.toUpperCase()} de ${data.length} lignes réussi`);
    } else {
      toast.error(result.error || "Erreur lors de l'export");
    }
  }

  function handleExportDetail(format: 'csv' | 'excel' | 'pdf') {
    const options = {
      ...getExportOptions('Plan de Travail - Détail des lignes budgétaires', 'plan_travail_detail'),
      totalColumns: detailTotalColumns,
    };

    // Prepare data with computed disponible
    const rows = filteredLines.map((line) => ({
      ...line,
      dotation_modifiee: getEffectiveDotation(line),
      disponible_calcule: getEffectiveDotation(line) - (line.total_engage || 0),
    })) as unknown as Record<string, unknown>[];

    let result;
    switch (format) {
      case 'csv':
        result = exportToCSV(rows, detailExportColumns, options);
        break;
      case 'excel':
        result = exportToExcel(rows, detailExportColumns, options);
        break;
      case 'pdf':
        result = exportToPDF(rows, detailExportColumns, options);
        break;
    }

    if (result.success) {
      toast.success(`Export ${format.toUpperCase()} de ${filteredLines.length} lignes réussi`);
    } else {
      toast.error(result.error || "Erreur lors de l'export");
    }
  }

  // ========================================================================
  // Export dropdown component
  // ========================================================================
  function ExportDropdown({
    onExport,
    size = 'sm',
  }: {
    onExport: (format: 'csv' | 'excel' | 'pdf') => void;
    size?: 'sm' | 'default';
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('excel')}>
            <Sheet className="mr-2 h-4 w-4" />
            Export Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ========================================================================
  // Aggregated table renderer
  // ========================================================================
  const renderAggregatedTable = (data: AggregatedData[], title: string, filename: string) => {
    const totalDotation = data.reduce((s, d) => s + d.dotation, 0);
    const totalEngage = data.reduce((s, d) => s + d.engage, 0);
    const totalLiquide = data.reduce((s, d) => s + d.liquide, 0);
    const totalOrdonnance = data.reduce((s, d) => s + d.ordonnance, 0);
    const totalPaye = data.reduce((s, d) => s + d.paye, 0);
    const totalDisponible = data.reduce((s, d) => s + d.disponible, 0);
    const totalLines = data.reduce((s, d) => s + d.linesCount, 0);
    const globalTaux = totalDotation > 0 ? (totalPaye / totalDotation) * 100 : 0;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {data.length} élément(s) - {totalLines} ligne(s) - Total:{' '}
              {formatCurrency(totalDotation)}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Filtré
                </Badge>
              )}
            </CardDescription>
          </div>
          <ExportDropdown
            onExport={(format) => handleExportAggregated(data, title, filename, format)}
          />
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <EmptyStateNoData entityName="donnée" />
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-center">Lignes</TableHead>
                    <TableHead className="text-right">Dotation</TableHead>
                    <TableHead className="text-right">Engagé</TableHead>
                    <TableHead className="text-right">Liquidé</TableHead>
                    <TableHead className="text-right">Ordonnancé</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-center w-[130px]">Exécution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.label}>
                        {item.label}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.linesCount}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.dotation)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(item.engage)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        {formatCurrency(item.liquide)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-600">
                        {formatCurrency(item.ordonnance)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(item.paye)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={item.disponible < 0 ? 'text-destructive font-bold' : ''}>
                          {formatCurrency(item.disponible)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(item.tauxExecution, 100)}
                            className={`h-2 w-16 ${getProgressColor(item.tauxExecution)}`}
                          />
                          <span
                            className={`text-xs font-medium w-12 text-right ${getExecutionColor(item.tauxExecution)}`}
                          >
                            {item.tauxExecution.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-center">{totalLines}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totalDotation)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-600">
                      {formatCurrency(totalEngage)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600">
                      {formatCurrency(totalLiquide)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-purple-600">
                      {formatCurrency(totalOrdonnance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(totalPaye)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={totalDisponible < 0 ? 'text-destructive' : ''}>
                        {formatCurrency(totalDisponible)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${getExecutionColor(globalTaux)}`}>
                        {globalTaux.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ========================================================================
  // KPI Skeleton
  // ========================================================================
  const KPISkeleton = () => (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ========================================================================
  // Detail table totals
  // ========================================================================
  const detailTotals = useMemo(() => {
    return filteredLines.reduce(
      (acc, line) => {
        const dotation = getEffectiveDotation(line);
        return {
          dotation: acc.dotation + (line.dotation_initiale || 0),
          dotationModifiee: acc.dotationModifiee + dotation,
          engage: acc.engage + (line.total_engage || 0),
          liquide: acc.liquide + (line.total_liquide || 0),
          ordonnance: acc.ordonnance + (line.total_ordonnance || 0),
          paye: acc.paye + (line.total_paye || 0),
        };
      },
      { dotation: 0, dotationModifiee: 0, engage: 0, liquide: 0, ordonnance: 0, paye: 0 }
    );
  }, [filteredLines]);

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Plan de Travail"
        description="Suivi de l'exécution budgétaire par objectif stratégique et par direction"
        icon={ClipboardList}
        backUrl="/"
      >
        <Badge variant="outline" className="text-lg px-4 py-2">
          Exercice {exercice}
        </Badge>
      </PageHeader>

      {/* KPIs */}
      {isLoading ? (
        <KPISkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate">{formatCurrency(totals.dotation)}</p>
                  <p className="text-xs text-muted-foreground">Dotation totale</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-orange-600 truncate">
                    {formatCurrency(totals.engage)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Engagé (
                    {totals.dotation > 0
                      ? ((totals.engage / totals.dotation) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-blue-600 truncate">
                    {formatCurrency(totals.liquide)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Liquidé (
                    {totals.engage > 0
                      ? ((totals.liquide / totals.engage) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-purple-600 truncate">
                    {formatCurrency(totals.ordonnance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ordonnancé (
                    {totals.liquide > 0
                      ? ((totals.ordonnance / totals.liquide) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-green-600 truncate">
                    {formatCurrency(totals.paye)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payé (
                    {totals.dotation > 0
                      ? ((totals.paye / totals.dotation) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={totals.dotation - totals.engage < 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p
                    className={`text-xl font-bold truncate ${
                      totals.dotation - totals.engage < 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {formatCurrency(totals.dotation - totals.engage)}
                  </p>
                  <p className="text-xs text-muted-foreground">Disponible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Recherche
              </label>
              <Input
                placeholder="Code ou libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Direction
              </label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {directions?.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectif Stratégique
              </label>
              <Select value={osFilter} onValueChange={setOsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les OS</SelectItem>
                  {objectifsStrategiques?.map((os) => (
                    <SelectItem key={os.id} value={os.id}>
                      {os.code} - {os.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setDirectionFilter('all');
                  setOsFilter('all');
                }}
                disabled={!hasActiveFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
          {hasActiveFilters && (
            <p className="mt-3 text-sm text-muted-foreground">
              {filteredLines.length} / {budgetLines?.length || 0} ligne(s) affichée(s) selon les
              filtres
            </p>
          )}
        </CardContent>
      </Card>

      {/* Views */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="par-os" className="gap-2">
            <Target className="h-4 w-4" />
            Par Objectif Stratégique
          </TabsTrigger>
          <TabsTrigger value="par-direction" className="gap-2">
            <Building2 className="h-4 w-4" />
            Par Direction
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Détail lignes ({filteredLines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="par-os">
          {renderAggregatedTable(dataByOS, 'Exécution par Objectif Stratégique', 'plan_travail_os')}
        </TabsContent>

        <TabsContent value="par-direction">
          {renderAggregatedTable(
            dataByDirection,
            'Exécution par Direction',
            'plan_travail_direction'
          )}
        </TabsContent>

        <TabsContent value="detail">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Détail des lignes budgétaires</CardTitle>
                <CardDescription>
                  {filteredLines.length} ligne(s) - Total:{' '}
                  {formatCurrency(detailTotals.dotationModifiee)}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Filtré
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <ExportDropdown onExport={handleExportDetail} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredLines.length === 0 ? (
                <EmptyStateNoData entityName="ligne budgétaire" />
              ) : (
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>OS</TableHead>
                        <TableHead className="text-right">Dotation Init.</TableHead>
                        <TableHead className="text-right">Dotation Mod.</TableHead>
                        <TableHead className="text-right">Engagé</TableHead>
                        <TableHead className="text-right">Liquidé</TableHead>
                        <TableHead className="text-right">Ordonnancé</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.map((line) => {
                        const dotationEff = getEffectiveDotation(line);
                        const disponible = dotationEff - (line.total_engage || 0);
                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {line.code}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate" title={line.label}>
                              {line.label}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{line.direction?.code || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">
                                {line.objectif_strategique?.code || '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(line.dotation_initiale || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(dotationEff)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-orange-600">
                              {formatCurrency(line.total_engage || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-blue-600">
                              {formatCurrency(line.total_liquide || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-purple-600">
                              {formatCurrency(line.total_ordonnance || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-green-600">
                              {formatCurrency(line.total_paye || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              <span className={disponible < 0 ? 'text-destructive font-bold' : ''}>
                                {formatCurrency(disponible)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={4}>TOTAL ({filteredLines.length} lignes)</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(detailTotals.dotation)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(detailTotals.dotationModifiee)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          {formatCurrency(detailTotals.engage)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {formatCurrency(detailTotals.liquide)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-purple-600">
                          {formatCurrency(detailTotals.ordonnance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatCurrency(detailTotals.paye)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              detailTotals.dotationModifiee - detailTotals.engage < 0
                                ? 'text-destructive'
                                : ''
                            }
                          >
                            {formatCurrency(detailTotals.dotationModifiee - detailTotals.engage)}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
