import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  FileSpreadsheet,
  Eye,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Filter,
  History,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useImportJobs, ImportJob, ImportRow } from '@/hooks/useImportJobs';
import { useExercice } from '@/contexts/ExerciceContext';

// ─── Status config ────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Soumis',
    color: 'bg-gray-100 text-gray-800',
    icon: <Clock className="h-3 w-3" />,
  },
  parsed: {
    label: 'Analysé',
    color: 'bg-blue-100 text-blue-800',
    icon: <FileSpreadsheet className="h-3 w-3" />,
  },
  validated: {
    label: 'Validé',
    color: 'bg-purple-100 text-purple-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  importing: {
    label: 'En cours',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: 'Échoué',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-3 w-3" />,
  },
  rolled_back: {
    label: 'Annulé',
    color: 'bg-orange-100 text-orange-800',
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

// Labels FR pour les statuts de lignes
export const ROW_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  ok: 'Valide',
  error: 'Erreur',
  warning: 'Avertissement',
  imported: 'Importé',
};

// ─── Helpers ─────────────────────────────────────────────────────
export function computeStats(jobs: ImportJob[]) {
  return {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    inProgress: jobs.filter((j) => j.status === 'importing').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    pending: jobs.filter((j) => ['draft', 'parsed', 'validated'].includes(j.status)).length,
    cancelled: jobs.filter((j) => j.status === 'rolled_back').length,
  };
}

export function formatProcessingDuration(createdAt: string, completedAt: string | null): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(createdAt).getTime();
  if (ms < 1000) return '< 1s';
  const duration = intervalToDuration({ start: 0, end: ms });
  return formatDuration(duration, { locale: fr, format: ['hours', 'minutes', 'seconds'] });
}

export function computeSuccessRate(job: ImportJob): number | null {
  const total = job.stats?.rows_total ?? 0;
  if (total === 0) return null;
  const ok = job.stats?.rows_ok ?? 0;
  return Math.round((ok / total) * 100);
}

// ─── Composant principal ──────────────────────────────────────────
export default function HistoriqueImports() {
  const { exercice: _exercice } = useExercice();
  const { fetchAllJobs, fetchImportRows, exportErrors, retryImport } = useImportJobs();

  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterExercice, setFilterExercice] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Detail dialog
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [detailRows, setDetailRows] = useState<ImportRow[]>([]);
  const [detailTab, setDetailTab] = useState<'summary' | 'rows' | 'errors'>('summary');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Auto-polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch jobs
  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: Parameters<typeof fetchAllJobs>[0] = {};
      if (filterExercice !== 'all') options.exercice = Number(filterExercice);
      if (filterStatus !== 'all') options.status = filterStatus;
      if (filterDateFrom) options.date_from = filterDateFrom;
      if (filterDateTo) options.date_to = filterDateTo;
      const data = await fetchAllJobs(options);
      setJobs(data);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllJobs, filterExercice, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Auto-polling : rafraîchir toutes les 5s si un job est en cours d'import
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) => j.status === 'importing');
    if (hasActiveJobs) {
      pollingRef.current = setInterval(() => {
        loadJobs();
      }, 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobs, loadJobs]);

  // View job details
  const handleViewDetails = async (job: ImportJob) => {
    setSelectedJob(job);
    setDetailTab('summary');
    setIsLoadingDetail(true);
    try {
      const { rows } = await fetchImportRows(job.id, { limit: 100 });
      setDetailRows(rows);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRetry = async (job: ImportJob) => {
    const success = await retryImport(job.id);
    if (success) loadJobs();
  };

  const handleExportErrors = async (job: ImportJob) => {
    await exportErrors(job.id);
  };

  const handleResetFilters = () => {
    setFilterExercice('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Available years dynamically from data (or fallback)
  const availableYears = Array.from(
    new Set([
      ...jobs.map((j) => j.exercice_id).filter((y): y is number => y !== null),
      new Date().getFullYear(),
    ])
  ).sort((a, b) => b - a);

  // Stats
  const stats = computeStats(jobs);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Historique des Imports"
        description="Traçabilité complète de tous les imports d'activités"
        icon={History}
        showBackButton={false}
      >
        <Button variant="outline" onClick={loadJobs} disabled={isLoading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </PageHeader>

      {/* KPIs — 6 cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total imports</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Terminés
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3" /> En cours
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Échoués
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> En attente
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Annulés
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-44">
              <Select value={filterExercice} onValueChange={setFilterExercice}>
                <SelectTrigger>
                  <SelectValue placeholder="Exercice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les exercices</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      Exercice {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="importing">En cours</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="draft">Soumis</SelectItem>
                  <SelectItem value="parsed">Analysé</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="rolled_back">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Du</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Au</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            {(filterExercice !== 'all' ||
              filterStatus !== 'all' ||
              filterDateFrom ||
              filterDateTo) && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                <XCircle className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table des jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des imports</CardTitle>
          <CardDescription>
            Cliquez sur "Détails" pour explorer les lignes importées ligne par ligne
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun import trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercice</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Lignes</TableHead>
                  <TableHead className="text-right">OK</TableHead>
                  <TableHead className="text-right">Erreurs</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
                  const successRate = computeSuccessRate(job);
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.exercice_id ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate" title={job.filename}>
                        {job.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {job.module?.replace(/_/g, ' ') ?? 'budget'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {job.stats?.rows_total ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {job.stats?.rows_ok ?? 0}
                        {successRate !== null && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({successRate}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {job.stats?.rows_error ?? 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {formatProcessingDuration(job.created_at, job.completed_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(job)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          {job.status === 'failed' && (
                            <Button variant="ghost" size="sm" onClick={() => handleRetry(job)}>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Rejouer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog détail */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Détails de l'import
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <Tabs
              value={detailTab}
              onValueChange={(v) => setDetailTab(v as typeof detailTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="rows">Lignes ({detailRows.length})</TabsTrigger>
                <TabsTrigger value="errors">
                  Erreurs ({detailRows.filter((r) => r.status === 'error').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-mono text-sm">{selectedJob.id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Fichier</span>
                        <span className="font-medium">{selectedJob.filename}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Exercice</span>
                        <Badge variant="outline">{selectedJob.exercice_id}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Date d'import</span>
                        <span>
                          {format(new Date(selectedJob.created_at), 'dd MMMM yyyy à HH:mm', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge className={STATUS_CONFIG[selectedJob.status]?.color}>
                          {STATUS_CONFIG[selectedJob.status]?.label}
                        </Badge>
                      </div>
                      {selectedJob.completed_at && (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Terminé le</span>
                            <span>
                              {format(new Date(selectedJob.completed_at), 'dd MMMM yyyy à HH:mm', {
                                locale: fr,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Durée de traitement</span>
                            <span className="font-mono">
                              {formatProcessingDuration(
                                selectedJob.created_at,
                                selectedJob.completed_at
                              )}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedJob.notes && (
                        <div className="py-2">
                          <span className="text-muted-foreground block mb-1">Notes</span>
                          <p className="text-sm bg-muted p-2 rounded">{selectedJob.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Statistiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedJob.stats?.rows_total ?? 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedJob.stats?.rows_new ?? 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Nouvelles</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedJob.stats?.rows_update ?? 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Mises à jour</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {selectedJob.stats?.rows_error ?? 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Erreurs</div>
                        </div>
                      </div>
                      {(() => {
                        const rate = computeSuccessRate(selectedJob);
                        if (rate === null) return null;
                        return (
                          <div className="mt-4 pt-3 border-t flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Taux de succès
                            </span>
                            <span
                              className={`font-bold text-lg ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
                            >
                              {rate}%
                            </span>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    {(selectedJob.stats?.rows_error ?? 0) > 0 && (
                      <Button variant="outline" onClick={() => handleExportErrors(selectedJob)}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter erreurs (CSV)
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rows" className="flex-1 overflow-hidden">
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14">Ligne</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Données (aperçu)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className={row.status === 'error' ? 'bg-red-50/50' : ''}
                          >
                            <TableCell className="font-mono text-xs">{row.row_index}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  row.status === 'error'
                                    ? 'destructive'
                                    : row.status === 'imported'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {ROW_STATUS_LABELS[row.status] ?? row.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {row.target_action && (
                                <Badge variant="outline">{row.target_action}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[300px] truncate">
                              {JSON.stringify(row.raw).substring(0, 100)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="errors" className="flex-1 overflow-hidden">
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    {detailRows.filter((r) => r.status === 'error').length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>Aucune erreur</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detailRows
                          .filter((r) => r.status === 'error')
                          .map((row) => (
                            <Alert key={row.id} variant="destructive">
                              <XCircle className="h-4 w-4" />
                              <AlertTitle>Ligne {row.row_index}</AlertTitle>
                              <AlertDescription>{row.error_messages.join('; ')}</AlertDescription>
                            </Alert>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
