/**
 * Page Virements & Ajustements budgétaires.
 *
 * Refactorée le 2026-04-08 — le fichier est passé de 1825 lignes à un simple
 * composant orchestrateur qui compose 7 sous-composants situés dans
 * `src/components/virements/` :
 *   - VirementKpiCards       (6 cartes KPI)
 *   - VirementFilters        (barre de filtres)
 *   - VirementTable          (tableau + TransferActions)
 *   - VirementStats          (onglet Statistiques)
 *   - CreateTransferDialog   (dialog de création — contient la règle LOLF 10 %)
 *   - TransferDetailsDialog  (dialog de détail + timeline workflow)
 *   - StatusBadge + constants.tsx (badge statut + STATUS_CONFIG + formatCurrency)
 *
 * Les dialogs simples (rejet, annulation, confirmation d'exécution) restent
 * inline car ils ne sont que des formulaires de confirmation.
 */

import { useMemo, useState } from 'react';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { useBudgetTransfers, type BudgetTransfer } from '@/hooks/useBudgetTransfers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetMovementJournal } from '@/components/budget/BudgetMovementJournal';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export/export-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Lock,
  Paperclip,
  Play,
  Plus,
  Upload,
  XCircle,
} from 'lucide-react';
import { formatCurrency, EXPORT_COLUMNS, STATUS_CONFIG } from '@/components/virements/constants';
import { VirementKpiCards } from '@/components/virements/VirementKpiCards';
import { VirementFilters } from '@/components/virements/VirementFilters';
import { VirementTable } from '@/components/virements/VirementTable';
import { VirementStats, type VirementChartData } from '@/components/virements/VirementStats';
import { CreateTransferDialog } from '@/components/virements/CreateTransferDialog';
import { TransferDetailsDialog } from '@/components/virements/TransferDetailsDialog';

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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);
  const [decisionFile, setDecisionFile] = useState<File | null>(null);

  const {
    transfers,
    isLoading,
    stats,
    createTransfer,
    approveTransferCb,
    rejectTransfer,
    executeTransfer,
    isCreating,
    isExecuting,
  } = useBudgetTransfers({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type_transfer: typeFilter !== 'all' ? typeFilter : undefined,
  });

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

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    searchTerm.length > 0,
  ].filter(Boolean).length;

  const totals = useMemo(
    () => ({
      amount: filteredTransfers.reduce((sum, t) => sum + t.amount, 0),
      count: filteredTransfers.length,
    }),
    [filteredTransfers]
  );

  const chartData: VirementChartData = useMemo(() => {
    if (!transfers) return { byStatus: [], byType: [], byMonth: [] };

    const byStatus = Object.entries(
      transfers.reduce<Record<string, number>>((acc, t) => {
        const status = t.status || 'en_attente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color:
        status === 'execute'
          ? '#10b981' // emerald — exécuté DG
          : status === 'approuve'
            ? '#3b82f6' // blue — approuvé CB
            : status === 'rejete'
              ? '#ef4444' // red — rejeté
              : '#f59e0b', // amber — en attente CB
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

  const handleExecuteConfirm = () => {
    if (!selectedTransfer) return;
    executeTransfer({ id: selectedTransfer.id, decisionFile });
    setShowExecuteConfirm(false);
    setShowDetailsDialog(false);
    setSelectedTransfer(null);
    setDecisionFile(null);
  };

  const handleExecuteDialogClose = (open: boolean) => {
    setShowExecuteConfirm(open);
    if (!open) setDecisionFile(null);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Virements & Ajustements"
        description="Transferts de crédits entre lignes budgétaires"
        icon={ArrowRightLeft}
        backUrl="/"
      >
        <div className="flex flex-wrap items-center gap-2">
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

      <VirementKpiCards isLoading={isLoading} stats={stats} totalCount={transfers?.length || 0} />

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

        <TabsContent value="demandes" className="space-y-4">
          <VirementFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            activeFiltersCount={activeFiltersCount}
            filteredCount={filteredTransfers.length}
            totalCount={transfers?.length || 0}
            onClear={clearFilters}
          />

          <VirementTable
            transfers={filteredTransfers}
            totals={totals}
            isLoading={isLoading}
            canWrite={canWrite}
            searchTerm={searchTerm}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearFilters}
            onCreate={() => setShowCreateDialog(true)}
            onCopyCode={handleCopyCode}
            onViewDetails={handleViewDetails}
            onApproveCb={(id) => approveTransferCb(id)}
            onRejectRequest={(transfer) => {
              setSelectedTransfer(transfer);
              setShowRejectDialog(true);
            }}
            onExecuteRequest={(transfer) => {
              setSelectedTransfer(transfer);
              setShowExecuteConfirm(true);
            }}
          />
        </TabsContent>

        <TabsContent value="journal">
          <BudgetMovementJournal />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <VirementStats
            isLoading={isLoading}
            transfers={transfers}
            stats={stats}
            chartData={chartData}
          />
        </TabsContent>
      </Tabs>

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
          onApproveCb={() => {
            approveTransferCb(selectedTransfer.id);
            setShowDetailsDialog(false);
            setSelectedTransfer(null);
          }}
          onReject={() => setShowRejectDialog(true)}
          onExecute={() => setShowExecuteConfirm(true)}
          isExecuting={isExecuting}
        />
      )}

      {/* Reject Dialog (inline — simple confirmation) */}
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

      {/* Execute Confirmation Dialog (inline — simple confirmation + upload PJ décision DG) */}
      <Dialog open={showExecuteConfirm} onOpenChange={handleExecuteDialogClose}>
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

          {/* PJ décision DG — upload facultatif mais recommandé */}
          <div className="space-y-2">
            <Label htmlFor="decision-dg-file" className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              Décision du DG (PDF, image — facultatif)
            </Label>
            <Input
              id="decision-dg-file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => setDecisionFile(e.target.files?.[0] ?? null)}
              disabled={isExecuting}
              className="cursor-pointer file:cursor-pointer file:mr-3 file:text-xs"
            />
            {decisionFile && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Upload className="h-3 w-3" />
                {decisionFile.name} ({(decisionFile.size / 1024).toFixed(0)} Ko)
              </p>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug">
              Le document justificatif sera joint au virement et consultable dans le détail.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleExecuteDialogClose(false)}
              disabled={isExecuting}
            >
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
