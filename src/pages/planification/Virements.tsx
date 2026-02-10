import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import {
  useBudgetTransfers,
  type BudgetTransfer,
  type CreateTransferData,
} from '@/hooks/useBudgetTransfers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState, EmptyStateNoResults } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetMovementJournal } from '@/components/budget/BudgetMovementJournal';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  type ExportColumn,
} from '@/lib/export/export-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Search,
  ArrowRightLeft,
  TrendingUp,
  Check,
  X,
  Play,
  MoreVertical,
  Copy,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  History,
  FileText,
  Download,
  Filter,
  Eye,
  BarChart3,
  FileSpreadsheet,
  FileDown,
  AlertTriangle,
  Send,
} from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  brouillon: {
    label: 'Brouillon',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    variant: 'secondary',
  },
  soumis: {
    label: 'Soumis',
    icon: Send,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    variant: 'outline',
  },
  en_attente: {
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    variant: 'outline',
  },
  valide: {
    label: 'Validé',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    variant: 'default',
  },
  approuve: {
    label: 'Approuvé',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    variant: 'default',
  },
  execute: {
    label: 'Exécuté',
    icon: Play,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    variant: 'default',
  },
  rejete: {
    label: 'Rejeté',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    variant: 'destructive',
  },
  annule: {
    label: 'Annulé',
    icon: Ban,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    variant: 'destructive',
  },
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'code', label: 'Code', type: 'text' },
  { key: 'type_transfer', label: 'Type', type: 'text' },
  {
    key: 'status',
    label: 'Statut',
    type: 'text',
    format: (v) => STATUS_CONFIG[String(v)]?.label || String(v),
  },
  { key: 'from_line.code', label: 'Ligne source', type: 'text' },
  { key: 'to_line.code', label: 'Ligne destination', type: 'text' },
  { key: 'amount', label: 'Montant (FCFA)', type: 'currency' },
  { key: 'motif', label: 'Justification', type: 'text' },
  { key: 'requested_at', label: 'Date de demande', type: 'date' },
  { key: 'requested_by_profile.full_name', label: 'Demandeur', type: 'text' },
  { key: 'approved_by_profile.full_name', label: 'Validateur', type: 'text' },
  { key: 'rejection_reason', label: 'Motif de rejet', type: 'text' },
];

// ============================================================================
// StatusBadge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.brouillon;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={`gap-1 ${config.color} ${config.bgColor} border-0`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Virements() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const [activeTab, setActiveTab] = useState('demandes');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<BudgetTransfer | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);

  const {
    transfers,
    isLoading,
    stats,
    createTransfer,
    submitTransfer,
    validateTransfer,
    rejectTransfer,
    executeTransfer,
    cancelTransfer,
    isCreating,
    isExecuting,
  } = useBudgetTransfers({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type_transfer: typeFilter !== 'all' ? typeFilter : undefined,
  });

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    if (!searchTerm) return transfers;
    const search = searchTerm.toLowerCase();
    return transfers.filter(
      (t) =>
        t.code?.toLowerCase().includes(search) ||
        t.motif.toLowerCase().includes(search) ||
        t.from_line?.code.toLowerCase().includes(search) ||
        t.from_line?.label.toLowerCase().includes(search) ||
        t.to_line?.code.toLowerCase().includes(search) ||
        t.to_line?.label.toLowerCase().includes(search) ||
        t.requested_by_profile?.full_name.toLowerCase().includes(search)
    );
  }, [transfers, searchTerm]);

  // Active filters count
  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    searchTerm.length > 0,
  ].filter(Boolean).length;

  // Totals for footer
  const totals = useMemo(
    () => ({
      amount: filteredTransfers.reduce((sum, t) => sum + t.amount, 0),
      count: filteredTransfers.length,
    }),
    [filteredTransfers]
  );

  // Stats for charts
  const chartData = useMemo(() => {
    if (!transfers) return { byStatus: [], byType: [], byMonth: [] };

    const byStatus = Object.entries(
      transfers.reduce<Record<string, number>>((acc, t) => {
        const status = t.status || 'brouillon';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color:
        status === 'execute'
          ? '#0088FE'
          : status === 'approuve' || status === 'valide'
            ? '#00C49F'
            : status === 'rejete'
              ? '#FF8042'
              : status === 'annule'
                ? '#999'
                : '#FFBB28',
    }));

    const byType = [
      { name: 'Virements', value: stats.virementsCount, color: '#0088FE' },
      { name: 'Ajustements', value: stats.ajustementsCount, color: '#00C49F' },
    ].filter((d) => d.value > 0);

    const byMonth = transfers
      .filter((t) => t.status === 'execute' && t.executed_at)
      .reduce<Record<string, number>>((acc, t) => {
        const month = format(new Date(t.executed_at as string), 'MMM yyyy', { locale: fr });
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {});

    return {
      byStatus,
      byType,
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
    };
  }, [transfers, stats]);

  // Handlers
  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success('Code copié');
  };

  const handleViewDetails = (transfer: BudgetTransfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsDialog(true);
  };

  const handleReject = () => {
    if (!selectedTransfer || !rejectReason.trim()) return;
    rejectTransfer({ id: selectedTransfer.id, reason: rejectReason });
    setShowRejectDialog(false);
    setRejectReason('');
    setSelectedTransfer(null);
  };

  const handleCancel = () => {
    if (!selectedTransfer || !cancelReason.trim()) return;
    cancelTransfer({ id: selectedTransfer.id, reason: cancelReason });
    setShowCancelDialog(false);
    setCancelReason('');
    setSelectedTransfer(null);
  };

  const handleExecuteConfirm = () => {
    if (!selectedTransfer) return;
    executeTransfer(selectedTransfer.id);
    setShowExecuteConfirm(false);
    setShowDetailsDialog(false);
    setSelectedTransfer(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const handleExport = (formatType: 'csv' | 'excel' | 'pdf') => {
    const options = {
      title: 'Virements & Ajustements Budgétaires',
      subtitle: `Exercice ${exercice}`,
      filename: `virements_${exercice}`,
      exercice,
      showTotals: true,
      totalColumns: ['amount'],
    };

    const data = filteredTransfers.map((t) => ({
      ...t,
      'from_line.code': t.from_line?.code || 'N/A',
      'to_line.code': t.to_line?.code || '-',
      'requested_by_profile.full_name': t.requested_by_profile?.full_name || '-',
      'approved_by_profile.full_name': t.approved_by_profile?.full_name || '-',
    }));

    if (formatType === 'csv') exportToCSV(data, EXPORT_COLUMNS, options);
    else if (formatType === 'excel') exportToExcel(data, EXPORT_COLUMNS, options);
    else exportToPDF(data, EXPORT_COLUMNS, { ...options, orientation: 'landscape' });

    toast.success(`Export ${formatType.toUpperCase()} généré`);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Virements & Ajustements"
        description="Transferts de crédits entre lignes budgétaires"
        icon={ArrowRightLeft}
        backUrl="/"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileDown className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Transfer Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button onClick={() => setShowCreateDialog(true)} disabled={!canWrite}>
                    {!canWrite ? (
                      <Lock className="h-4 w-4 sm:mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Nouveau</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {!canWrite && (
                <TooltipContent>
                  <p>{getDisabledMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="truncate">En attente</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {formatCurrency(stats.totalPendingAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="truncate">Validés</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.validated}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  prêts à exécuter
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <Play className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="truncate">Exécutés</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.executed}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {stats.executedThisMonth} ce mois
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="truncate">Rejetés</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.rejected}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  demandes refusées
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Montant exécuté</span>
                </div>
                <p className="text-sm sm:text-lg font-bold truncate">
                  {formatCurrency(stats.totalExecutedAmount)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  total transféré
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <ArrowRightLeft className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="truncate">Total demandes</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{transfers?.length || 0}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {stats.virementsCount} VIR / {stats.ajustementsCount} AJU
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="demandes" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Demandes</span> ({transfers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <History className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB: Demandes */}
        {/* ============================================================ */}
        <TabsContent value="demandes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Code, motif, ligne..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="virement">Virements</SelectItem>
                      <SelectItem value="ajustement">Ajustements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                      <X className="h-4 w-4" />
                      Effacer ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              </div>
              {/* Filter indicator */}
              {activeFiltersCount > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>
                    {filteredTransfers.length} / {transfers?.length || 0} demande(s) affichée(s)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfers Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredTransfers.length === 0 ? (
                searchTerm || activeFiltersCount > 0 ? (
                  <div className="p-8">
                    <EmptyStateNoResults searchTerm={searchTerm} onClear={clearFilters} />
                  </div>
                ) : (
                  <div className="p-8">
                    <EmptyState
                      icon={ArrowRightLeft}
                      title="Aucun virement"
                      description="Aucune demande de virement ou d'ajustement budgétaire n'a été créée pour cet exercice."
                      actionLabel={canWrite ? 'Créer un virement' : undefined}
                      onAction={canWrite ? () => setShowCreateDialog(true) : undefined}
                    />
                  </div>
                )
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Source</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <ArrowRight className="h-4 w-4 mx-auto" />
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Destination</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="hidden xl:table-cell">Demandeur</TableHead>
                      <TableHead className="w-10 sm:w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => (
                      <TableRow
                        key={transfer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetails(transfer)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-sm font-medium">
                              {transfer.code || '-'}
                            </span>
                            {transfer.code && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hidden sm:inline-flex sm:opacity-0 sm:group-hover:opacity-100"
                                onClick={(e) => handleCopyCode(transfer.code as string, e)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className={
                              transfer.type_transfer === 'ajustement'
                                ? 'text-green-600 border-green-200 bg-green-50'
                                : 'text-blue-600 border-blue-200 bg-blue-50'
                            }
                          >
                            {transfer.type_transfer === 'ajustement' ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                AJU
                              </>
                            ) : (
                              <>
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                VIR
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {transfer.from_line ? (
                            <div className="max-w-[100px] lg:max-w-[160px]">
                              <div className="font-mono text-xs truncate">
                                {transfer.from_line.code}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {transfer.from_line.label}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-w-[100px] lg:max-w-[160px]">
                            <div className="font-mono text-xs truncate">
                              {transfer.to_line?.code}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {transfer.to_line?.label}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm font-medium whitespace-nowrap">
                          {formatCurrency(transfer.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={transfer.status || 'brouillon'} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(transfer.requested_at), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[120px]">
                          {transfer.requested_by_profile?.full_name || '-'}
                        </TableCell>
                        <TableCell>
                          <TransferActions
                            transfer={transfer}
                            onSubmit={() => submitTransfer(transfer.id)}
                            onValidate={() => validateTransfer(transfer.id)}
                            onReject={() => {
                              setSelectedTransfer(transfer);
                              setShowRejectDialog(true);
                            }}
                            onExecute={() => {
                              setSelectedTransfer(transfer);
                              setShowExecuteConfirm(true);
                            }}
                            onCancel={() => {
                              setSelectedTransfer(transfer);
                              setShowCancelDialog(true);
                            }}
                            onView={() => handleViewDetails(transfer)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell className="text-right text-xs sm:text-sm">
                        Total ({totals.count})
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" />
                      <TableCell className="hidden md:table-cell" />
                      <TableCell className="hidden xl:table-cell" />
                      <TableCell className="hidden md:table-cell" />
                      <TableCell className="text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(totals.amount)}
                      </TableCell>
                      <TableCell />
                      <TableCell className="hidden lg:table-cell" />
                      <TableCell className="hidden xl:table-cell" />
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Journal */}
        {/* ============================================================ */}
        <TabsContent value="journal">
          <BudgetMovementJournal />
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Statistiques */}
        {/* ============================================================ */}
        <TabsContent value="stats" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-[250px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !transfers?.length ? (
            <EmptyState
              icon={BarChart3}
              title="Aucune donnée statistique"
              description="Les statistiques seront disponibles dès que des virements seront créés."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Répartition par statut */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Répartition par statut</CardTitle>
                  <CardDescription>{transfers.length} demande(s) au total</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData.byStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartData.byStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition par type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Virements vs Ajustements</CardTitle>
                  <CardDescription>Répartition par type de mouvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData.byType}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartData.byType.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Volume mensuel des exécutions */}
              {chartData.byMonth.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Volume mensuel des exécutions
                    </CardTitle>
                    <CardDescription>Montants transférés par mois (FCFA)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="amount" name="Montant" fill="#0088FE" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Summary card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Résumé financier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-50">
                      <p className="text-xs sm:text-sm text-muted-foreground">Total demandé</p>
                      <p className="text-sm sm:text-lg font-bold text-blue-700 truncate">
                        {formatCurrency(stats.totalAmount)}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50">
                      <p className="text-xs sm:text-sm text-muted-foreground">Total exécuté</p>
                      <p className="text-sm sm:text-lg font-bold text-green-700 truncate">
                        {formatCurrency(stats.totalExecutedAmount)}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-50">
                      <p className="text-xs sm:text-sm text-muted-foreground">En cours</p>
                      <p className="text-sm sm:text-lg font-bold text-amber-700 truncate">
                        {formatCurrency(stats.totalPendingAmount)}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-gray-50">
                      <p className="text-xs sm:text-sm text-muted-foreground">Taux exec.</p>
                      <p className="text-sm sm:text-lg font-bold">
                        {transfers.length > 0
                          ? Math.round((stats.executed / transfers.length) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* Dialogs */}
      {/* ============================================================ */}

      {/* Create Dialog */}
      <CreateTransferDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createTransfer}
        isLoading={isCreating}
        exercice={exercice || new Date().getFullYear()}
      />

      {/* Details Dialog */}
      {selectedTransfer && (
        <TransferDetailsDialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedTransfer(null);
          }}
          transfer={selectedTransfer}
          onSubmit={() => submitTransfer(selectedTransfer.id)}
          onValidate={() => validateTransfer(selectedTransfer.id)}
          onReject={() => setShowRejectDialog(true)}
          onExecute={() => setShowExecuteConfirm(true)}
          onCancel={() => setShowCancelDialog(true)}
          isExecuting={isExecuting}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeter la demande
            </DialogTitle>
            <DialogDescription>
              {selectedTransfer?.code} - {formatCurrency(selectedTransfer?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motif du rejet (obligatoire)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Annuler la demande
            </DialogTitle>
            <DialogDescription>
              {selectedTransfer?.code} - {formatCurrency(selectedTransfer?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motif d'annulation (obligatoire)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Expliquez la raison de l'annulation..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Retour
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim()}>
              <Ban className="h-4 w-4 mr-2" />
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Confirmation Dialog */}
      <Dialog open={showExecuteConfirm} onOpenChange={setShowExecuteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmer l'exécution
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les montants seront définitivement transférés.
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Code :</span>
                <span className="font-mono font-medium">{selectedTransfer.code}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Montant :</span>
                <span className="font-mono font-bold">
                  {formatCurrency(selectedTransfer.amount)}
                </span>
              </div>
              {selectedTransfer.from_line && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                  <span className="text-muted-foreground">Source :</span>
                  <span className="text-red-600 truncate">
                    {selectedTransfer.from_line.code} (-{formatCurrency(selectedTransfer.amount)})
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground">Destination :</span>
                <span className="text-green-600 truncate">
                  {selectedTransfer.to_line?.code} (+{formatCurrency(selectedTransfer.amount)})
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={handleExecuteConfirm} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter le transfert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Transfer Actions Dropdown
// ============================================================================

function TransferActions({
  transfer,
  onSubmit,
  onValidate,
  onReject,
  onExecute,
  onCancel,
  onView,
}: {
  transfer: BudgetTransfer;
  onSubmit: () => void;
  onValidate: () => void;
  onReject: () => void;
  onExecute: () => void;
  onCancel: () => void;
  onView: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {transfer.status === 'brouillon' && (
          <>
            <DropdownMenuItem onClick={onSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel} className="text-destructive">
              <Ban className="h-4 w-4 mr-2" />
              Annuler
            </DropdownMenuItem>
          </>
        )}

        {['soumis', 'en_attente'].includes(transfer.status || '') && (
          <>
            <DropdownMenuItem onClick={onValidate}>
              <Check className="h-4 w-4 mr-2" />
              Valider
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReject} className="text-destructive">
              <X className="h-4 w-4 mr-2" />
              Rejeter
            </DropdownMenuItem>
          </>
        )}

        {['valide', 'approuve'].includes(transfer.status || '') && (
          <DropdownMenuItem onClick={onExecute}>
            <Play className="h-4 w-4 mr-2" />
            Exécuter
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Create Transfer Dialog
// ============================================================================

function CreateTransferDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  exercice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTransferData) => void;
  isLoading: boolean;
  exercice: number;
}) {
  const [type, setType] = useState<'virement' | 'ajustement'>('virement');
  const [fromLineId, setFromLineId] = useState('');
  const [toLineId, setToLineId] = useState('');
  const [amount, setAmount] = useState(0);
  const [motif, setMotif] = useState('');
  const [justificationRenforcee, setJustificationRenforcee] = useState('');

  const { data: budgetLines } = useQuery({
    queryKey: ['budget-lines-transfer', exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from('budget_lines')
        .select('id, code, label, dotation_initiale, dotation_modifiee')
        .eq('exercice', exercice)
        .order('code');
      return data || [];
    },
    enabled: open,
  });

  const fromLine = budgetLines?.find((l) => l.id === fromLineId);
  const toLine = budgetLines?.find((l) => l.id === toLineId);

  const { data: fromEngaged } = useQuery({
    queryKey: ['from-engaged', fromLineId],
    queryFn: async () => {
      const { data } = await supabase
        .from('budget_engagements')
        .select('montant')
        .eq('budget_line_id', fromLineId)
        .in('statut', ['valide', 'en_cours']);
      return data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    },
    enabled: !!fromLineId,
  });

  const fromDotation = fromLine ? fromLine.dotation_modifiee || fromLine.dotation_initiale : 0;
  const fromDisponible = fromDotation - (fromEngaged || 0);

  const isValid =
    toLineId &&
    amount > 0 &&
    motif.trim() &&
    (type === 'ajustement' ||
      (fromLineId && fromLineId !== toLineId && amount <= fromDisponible)) &&
    (type === 'virement' || justificationRenforcee.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      type_transfer: type,
      from_budget_line_id: type === 'virement' ? fromLineId : null,
      to_budget_line_id: toLineId,
      amount,
      motif,
      justification_renforcee: type === 'ajustement' ? justificationRenforcee : undefined,
    });

    // Reset
    setType('virement');
    setFromLineId('');
    setToLineId('');
    setAmount(0);
    setMotif('');
    setJustificationRenforcee('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau virement / ajustement</DialogTitle>
          <DialogDescription>
            Créer une demande de mouvement budgétaire pour l'exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as 'virement' | 'ajustement')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="virement">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Virement
              </TabsTrigger>
              <TabsTrigger value="ajustement">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ajustement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {type === 'virement' && (
            <div className="space-y-2">
              <Label>Ligne source (à débiter) *</Label>
              <Select value={fromLineId} onValueChange={setFromLineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la ligne source..." />
                </SelectTrigger>
                <SelectContent>
                  {budgetLines?.map((line) => (
                    <SelectItem key={line.id} value={line.id} disabled={line.id === toLineId}>
                      {line.code} - {line.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromLine && (
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>Dotation: {formatCurrency(fromDotation)}</span>
                  <span
                    className={
                      fromDisponible < 0
                        ? 'text-destructive font-medium'
                        : 'text-green-600 font-medium'
                    }
                  >
                    Disponible: {formatCurrency(fromDisponible)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-2">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ligne destination (à créditer) *</Label>
            <Select value={toLineId} onValueChange={setToLineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la ligne destination..." />
              </SelectTrigger>
              <SelectContent>
                {budgetLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id} disabled={line.id === fromLineId}>
                    {line.code} - {line.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {toLine && (
              <div className="text-sm text-muted-foreground">
                Dotation actuelle:{' '}
                {formatCurrency(toLine.dotation_modifiee || toLine.dotation_initiale)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={type === 'virement' ? fromDisponible : undefined}
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            {type === 'virement' && fromLine && amount > fromDisponible && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le montant dépasse le disponible de la ligne source (
                  {formatCurrency(fromDisponible)})
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Justification *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif du mouvement..."
              rows={2}
            />
          </div>

          {type === 'ajustement' && (
            <div className="space-y-2">
              <Label htmlFor="justification_renforcee">
                Justification renforcée (obligatoire pour ajustement) *
              </Label>
              <Textarea
                id="justification_renforcee"
                value={justificationRenforcee}
                onChange={(e) => setJustificationRenforcee(e.target.value)}
                placeholder="Source des fonds, délibération, note de service..."
                rows={3}
              />
            </div>
          )}

          {/* Preview */}
          {toLine && amount > 0 && (
            <Card className="bg-muted/50 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Aperçu du mouvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {type === 'virement' && fromLine && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center">
                    <span className="font-mono text-xs truncate">{fromLine.code}</span>
                    <span className="text-xs sm:text-sm">
                      {formatCurrency(fromDotation)}
                      <ArrowRight className="inline h-3 w-3 mx-1" />
                      <span className="text-red-600 font-medium">
                        {formatCurrency(fromDotation - amount)}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center">
                  <span className="font-mono text-xs truncate">{toLine.code}</span>
                  <span className="text-xs sm:text-sm">
                    {formatCurrency(toLine.dotation_modifiee || toLine.dotation_initiale)}
                    <ArrowRight className="inline h-3 w-3 mx-1" />
                    <span className="text-green-600 font-medium">
                      {formatCurrency(
                        (toLine.dotation_modifiee || toLine.dotation_initiale) + amount
                      )}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le brouillon'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Transfer Details Dialog with Workflow Timeline
// ============================================================================

function TransferDetailsDialog({
  open,
  onOpenChange,
  transfer,
  onSubmit,
  onValidate,
  onReject,
  onExecute,
  onCancel,
  isExecuting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: BudgetTransfer;
  onSubmit: () => void;
  onValidate: () => void;
  onReject: () => void;
  onExecute: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}) {
  const status = transfer.status || 'brouillon';

  // Build workflow timeline steps
  const timelineSteps = [
    {
      label: 'Création',
      date: transfer.requested_at,
      actor: transfer.requested_by_profile?.full_name,
      done: true,
      icon: FileText,
    },
    {
      label: 'Soumission',
      date: status !== 'brouillon' ? transfer.requested_at : null,
      done: !['brouillon'].includes(status),
      icon: Send,
    },
    {
      label: 'Validation',
      date: transfer.approved_at,
      actor: transfer.approved_by_profile?.full_name,
      done: ['valide', 'approuve', 'execute'].includes(status),
      icon: CheckCircle,
    },
    {
      label: 'Exécution',
      date: transfer.executed_at,
      done: status === 'execute',
      icon: Play,
    },
  ];

  // Check for rejection or cancellation
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="font-mono text-base sm:text-lg">
              {transfer.code || 'Brouillon'}
            </DialogTitle>
            {transfer.code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(transfer.code as string);
                  toast.success('Code copié');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <StatusBadge status={status} />
            <Badge
              variant="outline"
              className={
                transfer.type_transfer === 'ajustement' ? 'text-green-600' : 'text-blue-600'
              }
            >
              {transfer.type_transfer === 'ajustement' ? 'Ajustement' : 'Virement'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Montant du transfert</p>
            <p className="text-xl sm:text-3xl font-bold font-mono">
              {formatCurrency(transfer.amount)}
            </p>
          </div>

          {/* Workflow Timeline */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Workflow
            </Label>
            <div className="flex items-center gap-1">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = step.done;
                return (
                  <div key={i} className="flex items-center gap-1 flex-1">
                    <div
                      className={`flex flex-col items-center flex-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <div
                        className={`rounded-full p-1.5 ${isActive ? 'bg-primary/10' : 'bg-muted'}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] sm:text-xs mt-1 text-center leading-tight">
                        {step.label}
                      </span>
                      {step.date && isActive && (
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {format(new Date(step.date), 'dd/MM', { locale: fr })}
                        </span>
                      )}
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${isActive && timelineSteps[i + 1]?.done ? 'bg-primary' : 'bg-muted'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source & Destination */}
          <div className="grid grid-cols-1 gap-3">
            {transfer.from_line && (
              <div className="p-3 rounded-lg border bg-red-50/50">
                <Label className="text-xs text-muted-foreground">Ligne source (débitée)</Label>
                <p className="font-mono text-sm font-medium">{transfer.from_line.code}</p>
                <p className="text-sm">{transfer.from_line.label}</p>
                {status === 'execute' && transfer.from_dotation_avant !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(transfer.from_dotation_avant)}{' '}
                    <ArrowRight className="inline h-3 w-3" />{' '}
                    {formatCurrency(transfer.from_dotation_apres || 0)}
                  </p>
                )}
              </div>
            )}
            <div className="p-3 rounded-lg border bg-green-50/50">
              <Label className="text-xs text-muted-foreground">Ligne destination (créditée)</Label>
              <p className="font-mono text-sm font-medium">{transfer.to_line?.code}</p>
              <p className="text-sm">{transfer.to_line?.label}</p>
              {status === 'execute' && transfer.to_dotation_avant !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(transfer.to_dotation_avant)}{' '}
                  <ArrowRight className="inline h-3 w-3" />{' '}
                  {formatCurrency(transfer.to_dotation_apres || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Justification */}
          <div>
            <Label className="text-xs text-muted-foreground">Justification</Label>
            <p className="text-sm mt-1">{transfer.motif}</p>
          </div>

          {transfer.justification_renforcee && (
            <div>
              <Label className="text-xs text-muted-foreground">Justification renforcée</Label>
              <p className="text-sm mt-1">{transfer.justification_renforcee}</p>
            </div>
          )}

          {/* Rejection / Cancellation alerts */}
          {transfer.rejection_reason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Motif du rejet :</strong> {transfer.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {transfer.cancel_reason && (
            <Alert>
              <Ban className="h-4 w-4" />
              <AlertDescription>
                <strong>Motif d'annulation :</strong> {transfer.cancel_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground border-t pt-3">
            <div>
              <p>
                Créé le :{' '}
                {format(new Date(transfer.requested_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
              {transfer.requested_by_profile && (
                <p>Par : {transfer.requested_by_profile.full_name}</p>
              )}
            </div>
            {transfer.approved_at && (
              <div>
                <p>
                  Validé le :{' '}
                  {format(new Date(transfer.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
                {transfer.approved_by_profile && (
                  <p>Par : {transfer.approved_by_profile.full_name}</p>
                )}
              </div>
            )}
            {transfer.executed_at && (
              <div>
                <p>
                  Exécuté le :{' '}
                  {format(new Date(transfer.executed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            )}
            {transfer.cancelled_at && (
              <div>
                <p>
                  Annulé le :{' '}
                  {format(new Date(transfer.cancelled_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>

          {status === 'brouillon' && (
            <>
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <Ban className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button onClick={onSubmit}>
                <Send className="h-4 w-4 mr-1" />
                Soumettre
              </Button>
            </>
          )}

          {['soumis', 'en_attente'].includes(status) && (
            <>
              <Button variant="destructive" size="sm" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Rejeter
              </Button>
              <Button onClick={onValidate}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider
              </Button>
            </>
          )}

          {['valide', 'approuve'].includes(status) && (
            <Button onClick={onExecute} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
