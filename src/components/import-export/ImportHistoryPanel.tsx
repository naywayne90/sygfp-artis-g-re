import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileSpreadsheet, 
  Eye, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  History,
  Terminal,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportRun {
  id: string;
  created_at: string;
  exercice: number;
  filename: string;
  sheet_name: string | null;
  status: string;
  total_rows: number;
  ok_rows: number;
  error_rows: number;
  imported_at: string | null;
  created_by: string | null;
}

interface ImportLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  details: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> },
  validated: { label: "Validé", color: "bg-purple-100 text-purple-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  importing: { label: "En cours", color: "bg-yellow-100 text-yellow-800", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  imported: { label: "Importé", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Échoué", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

interface ImportHistoryPanelProps {
  exercice: number;
}

export function ImportHistoryPanel({ exercice: _exercice }: ImportHistoryPanelProps) {
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<ImportRun | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("import_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRuns(data || []);
    } catch (error) {
      console.error("Error loading import runs:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const loadLogs = async (runId: string) => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("import_logs")
        .select("*")
        .eq("run_id", runId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleViewDetails = (run: ImportRun) => {
    setSelectedRun(run);
    loadLogs(run.id);
  };

  const exportRunErrors = async (run: ImportRun) => {
    try {
      const { data, error } = await supabase
        .from("import_budget_staging")
        .select("*")
        .eq("run_id", run.id)
        .eq("validation_status", "error");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("Aucune erreur à exporter");
        return;
      }

      // Create CSV
      const headers = ["Ligne", "Imputation", "Montant", "Erreurs"];
      const rows = data.map(row => [
        row.row_number,
        row.computed_imputation || row.raw_imputation || "",
        row.raw_montant || "",
        row.validation_errors || "",
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(r => r.join(";")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `erreurs_import_${run.id.slice(0, 8)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Erreurs exportées");
    } catch (error) {
      console.error("Error exporting errors:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  // Stats
  const statsTotal = runs.length;
  const statsImported = runs.filter(r => r.status === "imported").length;
  const statsFailed = runs.filter(r => r.status === "failed").length;

  return (
    <div className="space-y-4">
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
            <div className="text-2xl font-bold text-green-600">{statsImported}</div>
            <div className="text-sm text-muted-foreground">Réussis</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{statsFailed}</div>
            <div className="text-sm text-muted-foreground">Échoués</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center justify-center">
            <Button variant="outline" onClick={loadRuns} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des imports
          </CardTitle>
          <CardDescription>
            Traçabilité complète des imports budgétaires avec logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun import enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercice</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Lignes</TableHead>
                  <TableHead className="text-right">OK</TableHead>
                  <TableHead className="text-right">Erreurs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const statusConfig = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{run.exercice}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={run.filename}>
                        {run.filename}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {run.total_rows || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {run.ok_rows || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {run.error_rows || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(run)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          {run.error_rows > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportRunErrors(run)}
                            >
                              <Download className="h-4 w-4" />
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
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Logs de l'import
            </DialogTitle>
          </DialogHeader>

          {selectedRun && (
            <div className="flex-1 overflow-hidden">
              <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fichier:</span>
                  <span className="font-medium">{selectedRun.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exercice:</span>
                  <Badge variant="outline">{selectedRun.exercice}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge className={STATUS_CONFIG[selectedRun.status]?.color || ""}>
                    {STATUS_CONFIG[selectedRun.status]?.label || selectedRun.status}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg bg-slate-950 p-4">
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-slate-400 text-center py-12">Aucun log disponible</p>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex gap-2 ${
                          log.level === "error" ? "text-red-400" :
                          log.level === "warn" ? "text-yellow-400" :
                          log.level === "info" ? "text-blue-400" :
                          "text-slate-300"
                        }`}
                      >
                        <span className="text-slate-500">
                          {format(new Date(log.timestamp), "HH:mm:ss")}
                        </span>
                        <span className={`uppercase w-12 ${
                          log.level === "error" ? "text-red-500" :
                          log.level === "warn" ? "text-yellow-500" :
                          "text-blue-500"
                        }`}>
                          [{log.level}]
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
