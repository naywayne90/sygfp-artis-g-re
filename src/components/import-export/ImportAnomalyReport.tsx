import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  XCircle, 
  Download, 
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  Copy,
  Filter,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StagingRow {
  id: string;
  row_number: number;
  raw_imputation: string | null;
  raw_montant: string | null;
  computed_imputation: string | null;
  validation_status: string;
  validation_errors: string | null;
}

interface AnomalyCategory {
  type: string;
  label: string;
  count: number;
  severity: "error" | "warning" | "info";
  icon: React.ReactNode;
}

interface ImportAnomalyReportProps {
  runId: string | null;
  exercice: number;
}

export function ImportAnomalyReport({ runId, exercice }: ImportAnomalyReportProps) {
  const [runs, setRuns] = useState<{ id: string; filename: string; created_at: string }[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runId);
  const [stagingData, setStagingData] = useState<StagingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [anomalyCategories, setAnomalyCategories] = useState<AnomalyCategory[]>([]);

  // Load available runs
  const loadRuns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("import_runs")
        .select("id, filename, created_at")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRuns(data || []);
      
      if (data && data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading runs:", error);
    }
  }, [exercice, selectedRunId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (runId) {
      setSelectedRunId(runId);
    }
  }, [runId]);

  // Load staging data for selected run
  const loadStagingData = useCallback(async () => {
    if (!selectedRunId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from("import_budget_staging")
        .select("*")
        .eq("run_id", selectedRunId)
        .order("row_number");

      if (filterStatus !== "all") {
        query = query.eq("validation_status", filterStatus);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      setStagingData(data || []);

      // Categorize anomalies
      categorizeAnomalies(data || []);
    } catch (error) {
      console.error("Error loading staging data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRunId, filterStatus]);

  useEffect(() => {
    loadStagingData();
  }, [loadStagingData]);

  // Categorize anomalies by type
  const categorizeAnomalies = (data: StagingRow[]) => {
    const categories: Record<string, { count: number; severity: "error" | "warning" | "info" }> = {
      doublon: { count: 0, severity: "warning" },
      imputation_invalide: { count: 0, severity: "error" },
      montant_invalide: { count: 0, severity: "error" },
      champ_manquant: { count: 0, severity: "error" },
      format_incorrect: { count: 0, severity: "warning" },
      mismatch: { count: 0, severity: "warning" },
    };

    data.forEach((row) => {
      if (!row.validation_errors) return;
      const errors = row.validation_errors.toLowerCase();
      
      if (errors.includes("doublon")) categories.doublon.count++;
      if (errors.includes("imputation") && (errors.includes("invalide") || errors.includes("absent"))) 
        categories.imputation_invalide.count++;
      if (errors.includes("montant") && (errors.includes("invalide") || errors.includes("négatif"))) 
        categories.montant_invalide.count++;
      if (errors.includes("manquant") || errors.includes("absent")) 
        categories.champ_manquant.count++;
      if (errors.includes("format") || errors.includes("chiffres")) 
        categories.format_incorrect.count++;
      if (errors.includes("mismatch")) 
        categories.mismatch.count++;
    });

    const categoryList: AnomalyCategory[] = [
      { 
        type: "doublon", 
        label: "Doublons détectés", 
        count: categories.doublon.count, 
        severity: "warning" as const,
        icon: <Copy className="h-4 w-4" />,
      },
      { 
        type: "imputation_invalide", 
        label: "Imputations invalides", 
        count: categories.imputation_invalide.count, 
        severity: "error" as const,
        icon: <XCircle className="h-4 w-4" />,
      },
      { 
        type: "montant_invalide", 
        label: "Montants invalides", 
        count: categories.montant_invalide.count, 
        severity: "error" as const,
        icon: <TrendingDown className="h-4 w-4" />,
      },
      { 
        type: "champ_manquant", 
        label: "Champs manquants", 
        count: categories.champ_manquant.count, 
        severity: "error" as const,
        icon: <AlertCircle className="h-4 w-4" />,
      },
      { 
        type: "format_incorrect", 
        label: "Formats incorrects", 
        count: categories.format_incorrect.count, 
        severity: "warning" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      { 
        type: "mismatch", 
        label: "Incohérences calcul", 
        count: categories.mismatch.count, 
        severity: "warning" as const,
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ].filter(c => c.count > 0);

    setAnomalyCategories(categoryList);
  };

  // Export anomalies to CSV
  const exportAnomalies = () => {
    const errorRows = stagingData.filter(r => r.validation_status !== "ok");
    
    if (errorRows.length === 0) {
      toast.info("Aucune anomalie à exporter");
      return;
    }

    const headers = ["Ligne", "Statut", "Imputation Brute", "Imputation Calculée", "Montant", "Erreurs"];
    const rows = errorRows.map(row => [
      row.row_number,
      row.validation_status,
      row.raw_imputation || "",
      row.computed_imputation || "",
      row.raw_montant || "",
      (row.validation_errors || "").replace(/;/g, " | "),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(r => r.join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_anomalies_${exercice}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Rapport exporté");
  };

  // Stats
  const totalRows = stagingData.length;
  const okRows = stagingData.filter(r => r.validation_status === "ok").length;
  const warningRows = stagingData.filter(r => r.validation_status === "warning").length;
  const errorRows = stagingData.filter(r => r.validation_status === "error").length;
  const qualityScore = totalRows > 0 ? Math.round((okRows / totalRows) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Run selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Rapport d'Anomalies
              </CardTitle>
              <CardDescription>
                Analyse qualité des données importées avec catégorisation des erreurs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedRunId || ""} onValueChange={setSelectedRunId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Sélectionner un import" />
                </SelectTrigger>
                <SelectContent>
                  {runs.map((run) => (
                    <SelectItem key={run.id} value={run.id}>
                      {run.filename} ({format(new Date(run.created_at), "dd/MM HH:mm")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadStagingData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedRunId ? (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertTitle>Aucun import sélectionné</AlertTitle>
          <AlertDescription>
            Sélectionnez un import dans la liste ci-dessus pour voir le rapport d'anomalies.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Quality Score */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Score Qualité</span>
                  <span className={`text-2xl font-bold ${
                    qualityScore >= 90 ? "text-green-600" :
                    qualityScore >= 70 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {qualityScore}%
                  </span>
                </div>
                <Progress 
                  value={qualityScore} 
                  className={`h-3 ${
                    qualityScore >= 90 ? "[&>div]:bg-green-500" :
                    qualityScore >= 70 ? "[&>div]:bg-amber-500" :
                    "[&>div]:bg-red-500"
                  }`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{okRows} lignes valides</span>
                  <span>{totalRows} total</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">{okRows}</div>
                <div className="text-xs text-muted-foreground">Valides</div>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-amber-600">{warningRows}</div>
                <div className="text-xs text-muted-foreground">Avertissements</div>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-4 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-600">{errorRows}</div>
                <div className="text-xs text-muted-foreground">Erreurs</div>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Categories */}
          {anomalyCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Catégories d'anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {anomalyCategories.map((cat) => (
                    <Badge
                      key={cat.type}
                      variant="outline"
                      className={`gap-1 px-3 py-1 ${
                        cat.severity === "error" ? "border-red-300 bg-red-50 text-red-700" :
                        cat.severity === "warning" ? "border-amber-300 bg-amber-50 text-amber-700" :
                        "border-blue-300 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}: {cat.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Détail des lignes
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les lignes</SelectItem>
                      <SelectItem value="ok">Valides uniquement</SelectItem>
                      <SelectItem value="warning">Avertissements</SelectItem>
                      <SelectItem value="error">Erreurs uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportAnomalies}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stagingData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>Aucune anomalie détectée</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ligne</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Imputation</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Erreurs / Avertissements</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stagingData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-sm">
                            {row.row_number}
                          </TableCell>
                          <TableCell>
                            <Badge className={`gap-1 ${
                              row.validation_status === "ok" 
                                ? "bg-green-100 text-green-800" 
                                : row.validation_status === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {row.validation_status === "ok" && <CheckCircle2 className="h-3 w-3" />}
                              {row.validation_status === "warning" && <AlertTriangle className="h-3 w-3" />}
                              {row.validation_status === "error" && <XCircle className="h-3 w-3" />}
                              {row.validation_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate">
                            {row.computed_imputation || row.raw_imputation || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.raw_montant || "—"}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            {row.validation_errors ? (
                              <span className={`text-sm ${
                                row.validation_status === "error" ? "text-red-600" : "text-amber-600"
                              }`}>
                                {row.validation_errors.split(";").slice(0, 2).join("; ")}
                                {row.validation_errors.split(";").length > 2 && "..."}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
