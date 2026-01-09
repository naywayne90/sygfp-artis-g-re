import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileSpreadsheet, 
  Eye, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Loader2,
  Filter,
  History,
  RotateCcw,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useImportJobs, ImportJob, ImportRow } from "@/hooks/useImportJobs";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import logoArti from "@/assets/logo-arti.jpg";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> },
  parsed: { label: "Analysé", color: "bg-blue-100 text-blue-800", icon: <FileSpreadsheet className="h-3 w-3" /> },
  validated: { label: "Validé", color: "bg-purple-100 text-purple-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  importing: { label: "En cours", color: "bg-yellow-100 text-yellow-800", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "Terminé", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Échoué", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
  rolled_back: { label: "Annulé", color: "bg-orange-100 text-orange-800", icon: <RotateCcw className="h-3 w-3" /> },
};

export default function HistoriqueImports() {
  const { exercice } = useExercice();
  const { fetchAllJobs, fetchImportRows, exportErrors, retryImport } = useImportJobs();
  
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterExercice, setFilterExercice] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Detail dialog
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [detailRows, setDetailRows] = useState<ImportRow[]>([]);
  const [detailTab, setDetailTab] = useState<"summary" | "rows" | "errors">("summary");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch jobs
  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: Parameters<typeof fetchAllJobs>[0] = {};
      if (filterExercice !== "all") {
        options.exercice = Number(filterExercice);
      }
      if (filterStatus !== "all") {
        options.status = filterStatus;
      }
      const data = await fetchAllJobs(options);
      setJobs(data);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllJobs, filterExercice, filterStatus]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // View job details
  const handleViewDetails = async (job: ImportJob) => {
    setSelectedJob(job);
    setDetailTab("summary");
    setIsLoadingDetail(true);
    
    try {
      const { rows } = await fetchImportRows(job.id, { limit: 200 });
      setDetailRows(rows);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Handle retry
  const handleRetry = async (job: ImportJob) => {
    const success = await retryImport(job.id);
    if (success) {
      loadJobs();
    }
  };

  // Handle export errors
  const handleExportErrors = async (job: ImportJob) => {
    await exportErrors(job.id);
  };

  // Available years
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Stats
  const statsTotal = jobs.length;
  const statsCompleted = jobs.filter(j => j.status === "completed").length;
  const statsFailed = jobs.filter(j => j.status === "failed").length;
  const statsPending = jobs.filter(j => ["draft", "parsed", "validated", "importing"].includes(j.status)).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoArti} alt="ARTI" className="h-12 w-12 rounded-lg object-cover" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Historique des Imports
            </h1>
            <p className="text-muted-foreground">
              Traçabilité complète de tous les imports budgétaires
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadJobs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{statsTotal}</div>
            <div className="text-sm text-muted-foreground">Total imports</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{statsCompleted}</div>
            <div className="text-sm text-muted-foreground">Terminés</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{statsFailed}</div>
            <div className="text-sm text-muted-foreground">Échoués</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{statsPending}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={filterExercice} onValueChange={setFilterExercice}>
                <SelectTrigger>
                  <SelectValue placeholder="Exercice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les exercices</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      Exercice {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="importing">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des imports</CardTitle>
          <CardDescription>
            Cliquez sur "Voir détails" pour explorer les lignes importées
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(job.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.exercice_id || "—"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={job.filename}>
                        {job.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {job.module?.replace(/_/g, " ") || "budget"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {job.stats?.rows_total || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {job.stats?.rows_ok || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {job.stats?.rows_error || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(job)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          {job.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(job)}
                            >
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Détails de l'import
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as typeof detailTab)} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="rows">Lignes ({detailRows.length})</TabsTrigger>
                <TabsTrigger value="errors">
                  Erreurs ({detailRows.filter(r => r.status === "error").length})
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
                        <span>{format(new Date(selectedJob.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge className={STATUS_CONFIG[selectedJob.status]?.color}>
                          {STATUS_CONFIG[selectedJob.status]?.label}
                        </Badge>
                      </div>
                      {selectedJob.completed_at && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Terminé le</span>
                          <span>{format(new Date(selectedJob.completed_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</span>
                        </div>
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
                      <CardTitle className="text-base">Statistiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{selectedJob.stats?.rows_total || 0}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{selectedJob.stats?.rows_new || 0}</div>
                          <div className="text-sm text-muted-foreground">Nouvelles</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{selectedJob.stats?.rows_update || 0}</div>
                          <div className="text-sm text-muted-foreground">Mises à jour</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{selectedJob.stats?.rows_error || 0}</div>
                          <div className="text-sm text-muted-foreground">Erreurs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    {selectedJob.stats?.rows_error > 0 && (
                      <Button variant="outline" onClick={() => handleExportErrors(selectedJob)}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter erreurs (CSV)
                      </Button>
                    )}
                    {selectedJob.status === "failed" && (
                      <Button variant="outline" onClick={() => handleRetry(selectedJob)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rejouer l'import
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
                        {detailRows.slice(0, 100).map((row) => (
                          <TableRow key={row.id} className={row.status === "error" ? "bg-red-50/50" : ""}>
                            <TableCell className="font-mono text-xs">{row.row_index}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === "error" ? "destructive" : row.status === "imported" ? "default" : "secondary"}>
                                {row.status}
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
                    {detailRows.filter(r => r.status === "error").length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>Aucune erreur</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detailRows.filter(r => r.status === "error").map((row) => (
                          <Alert key={row.id} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Ligne {row.row_index}</AlertTitle>
                            <AlertDescription>
                              {row.error_messages.join("; ")}
                            </AlertDescription>
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
