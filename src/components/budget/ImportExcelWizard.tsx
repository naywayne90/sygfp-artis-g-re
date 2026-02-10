import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Info,
  Shield,
  Eye,
  Settings2,
  Database,
  Layers,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { useImportJobs } from "@/hooks/useImportJobs";
import { useARTIImport, ARTIParsedRow } from "@/hooks/useARTIImport";
import { useReferentielSync, AllReferentielsResult } from "@/hooks/useReferentielSync";
import { useAuditLog } from "@/hooks/useAuditLog";
import logoArti from "@/assets/logo-arti.jpg";

interface ImportExcelWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type WizardStep = "exercice" | "detect" | "preview" | "confirm";

const STEPS: { id: WizardStep; title: string; description: string; icon: React.ReactNode }[] = [
  { id: "exercice", title: "Exercice & Fichier", description: "Charger le fichier Excel", icon: <Upload className="h-4 w-4" /> },
  { id: "detect", title: "Détection", description: "Analyse automatique", icon: <Settings2 className="h-4 w-4" /> },
  { id: "preview", title: "Prévisualisation", description: "Vérifier les données", icon: <Eye className="h-4 w-4" /> },
  { id: "confirm", title: "Confirmation", description: "Valider l'import", icon: <Shield className="h-4 w-4" /> },
];

export function ImportExcelWizard({ open, onOpenChange, onImportComplete }: ImportExcelWizardProps) {
  const { exercice: contextExercice } = useExercice();
  const { logAction } = useAuditLog();
  const {
    currentJob,
    createImportJob,
    uploadFile,
    markJobFailed,
  } = useImportJobs();

  const { parseARTIExcel, executeARTIImport } = useARTIImport();
  const { importAllReferentiels, refreshDropdowns, _isSyncing, _detectReferenceSheets } = useReferentielSync();
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Step 1: Exercice & File
  const [selectedExercice, setSelectedExercice] = useState<number>(contextExercice);
  const [file, setFile] = useState<File | null>(null);
  
  // Step 2: Detection results
  const [step, setStep] = useState<WizardStep>("exercice");
  const [parsedRows, setParsedRows] = useState<ARTIParsedRow[]>([]);
  const [parseInfo, setParseInfo] = useState<{
    sheetUsed: string;
    sheetReason: string;
    mapping: Record<string, string | null>;
    headers: string[];
    allSheets: string[];
    stats: { total: number; ok: number; warning: number; error: number; new: number; update: number };
  } | null>(null);
  
  // Step 3: Preview filter
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error" | "warning" | "new" | "update" | "duplicate">("all");
  
  // Step 4: Import options - SAFE MODE by default
  const [safeMode, setSafeMode] = useState(true); // Never replace existing lines
  const [replaceAmount, setReplaceAmount] = useState(false); // Advanced: replace only montant if line exists
  const [syncReferentiels, setSyncReferentiels] = useState(true); // Sync referentials option
  const [isProcessing, setIsProcessing] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState<{ inserted: number; updated: number; skipped: number; errors: number } | null>(null);
  const [referentielStats, setReferentielStats] = useState<AllReferentielsResult | null>(null);

  const resetWizard = useCallback(() => {
    setStep("exercice");
    setFile(null);
    setParsedRows([]);
    setParseInfo(null);
    setStatusFilter("all");
    setSafeMode(true);
    setReplaceAmount(false);
    setSyncReferentiels(true);
    setIsProcessing(false);
    setImportComplete(false);
    setImportStats(null);
    setReferentielStats(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onOpenChange(false);
  }, [resetWizard, onOpenChange]);

  // Step 1: File selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Seuls les fichiers .xlsx et .xls sont acceptés");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20 Mo");
      return;
    }

    setFile(selectedFile);
  }, []);

  // Step 2: Auto-detection and parsing
  const handleDetection = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setStep("detect");

    try {
      // Create import job for audit trail
      const job = await createImportJob("budget_structure", selectedExercice, file.name);
      if (!job) throw new Error("Échec de création du job d'import");

      await uploadFile(job.id, file);

      // Parse with ARTI format - prioritizes "Groupé (2)" sheet
      const result = await parseARTIExcel(file, selectedExercice);

      setParsedRows(result.rows);
      setParseInfo({
        sheetUsed: result.sheetUsed,
        sheetReason: result.sheetReason,
        mapping: result.mapping,
        headers: result.headers,
        allSheets: result.allSheets,
        stats: result.stats,
      });

      toast.success(`${result.rows.length} ligne(s) analysées depuis "${result.sheetUsed}"`);
      setStep("preview");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(`Erreur lors de l'analyse: ${String(error)}`);
      if (currentJob) {
        await markJobFailed(currentJob.id, String(error));
      }
      setStep("exercice");
    } finally {
      setIsProcessing(false);
    }
  }, [file, selectedExercice, createImportJob, uploadFile, parseARTIExcel, markJobFailed, currentJob]);

  // Step 4: Execute import with audit logging
  const handleImport = useCallback(async () => {
    // Guard: Require exercice
    if (!selectedExercice) {
      toast.error("Veuillez sélectionner un exercice avant d'importer");
      return;
    }
    
    if (!currentJob || !file) return;

    setIsProcessing(true);
    try {
      // Step 1: Sync referentials first if enabled
      if (syncReferentiels) {
        toast.info("Synchronisation des référentiels en cours...");
        const refResult = await importAllReferentiels(file);
        setReferentielStats(refResult);
        
        if (refResult.summary.totalInserted > 0 || refResult.summary.totalUpdated > 0) {
          toast.success(`Référentiels: ${refResult.summary.totalInserted} ajouté(s), ${refResult.summary.totalUpdated} mis à jour`);
        }
        
        // Refresh dropdowns after referential sync
        refreshDropdowns();
      }

      // Step 2: Filter rows based on mode and execute import
      let rowsToImport: ARTIParsedRow[];
      const importOptions: { replaceAmountOnly?: boolean } = {};
      
      if (safeMode && !replaceAmount) {
        // SAFE mode: Only new lines
        rowsToImport = parsedRows.filter(r => r.decision === "NEW" && r.isValid);
      } else if (safeMode && replaceAmount) {
        // SAFE mode + Replace Amount: All valid lines, but only update montant
        rowsToImport = parsedRows.filter(r => r.isValid);
        importOptions.replaceAmountOnly = true;
      } else {
        // Full replace mode: All valid lines with full update
        rowsToImport = parsedRows.filter(r => r.isValid);
      }

      const result = await executeARTIImport(rowsToImport, selectedExercice, currentJob.id, importOptions);
      
      const skipped = (safeMode && !replaceAmount) ? parsedRows.filter(r => r.decision === "UPDATE").length : 0;
      
      // AUDIT: Log the import action
      await logAction({
        entityType: "budget_import",
        entityId: currentJob.id,
        action: "create",
        newValues: {
          filename: file.name,
          exercice: selectedExercice,
          sheet_used: parseInfo?.sheetUsed || "",
          total_rows: parsedRows.length,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped + skipped,
          errors: result.errors,
          mode: safeMode ? (replaceAmount ? "safe_update_amount" : "safe") : "replace",
          sync_referentiels: syncReferentiels,
        },
      });
      
      setImportStats({
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped + skipped,
        errors: result.errors,
      });
      setImportComplete(true);
      
      // Refresh all data
      refreshDropdowns();
      
      if (result.errors === 0 && onImportComplete) {
        onImportComplete();
      }

      toast.success(`Import terminé: ${result.inserted} créée(s), ${result.updated} mise(s) à jour`);
    } catch (error) {
      toast.error(`Erreur lors de l'import: ${String(error)}`);
      
      // AUDIT: Log failed import
      if (currentJob) {
        await logAction({
          entityType: "budget_import",
          entityId: currentJob.id,
          action: "create",
          newValues: {
            filename: file?.name || "",
            exercice: selectedExercice,
            error: String(error),
            status: "failed",
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentJob, file, parsedRows, selectedExercice, safeMode, replaceAmount, syncReferentiels, executeARTIImport, importAllReferentiels, refreshDropdowns, onImportComplete]);

  // Computed stats (must be before export functions that use them)
  const stats = parseInfo?.stats || {
    total: parsedRows.length,
    ok: parsedRows.filter(r => r.isValid && r.warnings.length === 0).length,
    warning: parsedRows.filter(r => r.isValid && r.warnings.length > 0).length,
    error: parsedRows.filter(r => !r.isValid).length,
    new: parsedRows.filter(r => r.decision === "NEW").length,
    update: parsedRows.filter(r => r.decision === "UPDATE").length,
  };

  const duplicates = stats.update;

  // Export full import report (all rows with status)
  const handleExportFullReport = useCallback(() => {
    const headers = [
      "Ligne Excel",
      "Statut",
      "Décision",
      "Code Imputation (18 chiffres)",
      "Libellé Projet",
      "Montant Initial",
      "OS",
      "Action",
      "Activité",
      "Sous-Activité",
      "Direction",
      "Nature Dépense",
      "NBE (6 chiffres)",
      "Erreurs",
      "Avertissements"
    ];

    const csvRows = parsedRows.map(row => {
      let statut = "";
      if (!row.isValid) {
        statut = "REJETÉE";
      } else if (row.decision === "UPDATE") {
        statut = "DOUBLON (ignorée)";
      } else if (row.warnings.length > 0) {
        statut = "VALIDE (avec alertes)";
      } else {
        statut = "VALIDE";
      }

      return [
        row.rowIndex,
        statut,
        row.decision,
        row.normalized?.code || "",
        row.normalized?.label || row.raw.libelle || "",
        row.normalized?.dotation_initiale?.toLocaleString("fr-FR") || row.raw.montant || "",
        row.raw.os || "",
        row.raw.action || "",
        row.raw.activite || "",
        row.raw.sousActivite || "",
        row.raw.direction || "",
        row.raw.natureDepense || "",
        row.raw.nbe || "",
        row.errors.join(" | "),
        row.warnings.join(" | "),
      ];
    });

    // Add summary section at the end
    csvRows.push([]);
    csvRows.push(["=== RÉSUMÉ DU RAPPORT D'IMPORT ===", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["Fichier source", file?.name || "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["Exercice", selectedExercice.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["Onglet utilisé", parseInfo?.sheetUsed || "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["Date d'analyse", new Date().toLocaleString("fr-FR"), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push([]);
    csvRows.push(["LIGNES VALIDES (prêtes à importer)", stats.new.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["LIGNES AVEC ALERTES", stats.warning.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["LIGNES REJETÉES (erreurs)", stats.error.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["DOUBLONS DÉTECTÉS", duplicates.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    csvRows.push(["TOTAL ANALYSÉ", stats.total.toString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);

    const csvContent = [headers, ...csvRows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RAPPORT_IMPORT_BUDGET_${selectedExercice}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Rapport d'import complet téléchargé");
  }, [parsedRows, selectedExercice, file, parseInfo, stats, duplicates]);

  // Export only errors (for quick review)
  const handleExportErrors = useCallback(() => {
    const errorRows = parsedRows.filter(r => !r.isValid);
    
    if (errorRows.length === 0) {
      toast.info("Aucune erreur à exporter");
      return;
    }
    
    const headers = ["Ligne Excel", "Code Imputation", "Montant", "OS", "Direction", "NBE", "Erreur(s)"];
    const csvRows = errorRows.map(row => [
      row.rowIndex,
      row.normalized?.code || row.raw.imputation || "",
      row.raw.montant || "",
      row.raw.os || "",
      row.raw.direction || "",
      row.raw.nbe || "",
      row.errors.join(" | "),
    ]);

    const csvContent = [headers, ...csvRows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ERREURS_IMPORT_${selectedExercice}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${errorRows.length} erreur(s) exportée(s)`);
  }, [parsedRows, selectedExercice]);

  const filteredRows = parsedRows.filter((row) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "ok") return row.isValid && row.warnings.length === 0;
    if (statusFilter === "warning") return row.isValid && row.warnings.length > 0;
    if (statusFilter === "error") return !row.isValid;
    if (statusFilter === "new") return row.decision === "NEW";
    if (statusFilter === "update" || statusFilter === "duplicate") return row.decision === "UPDATE";
    return true;
  });

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  // Available years
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // ==================== STEP RENDERERS ====================

  const renderExerciceStep = () => (
    <div className="space-y-6">
      {/* Header with ARTI branding */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
        <img src={logoArti} alt="ARTI" className="h-12 w-12 rounded-lg object-cover" />
        <div>
          <h3 className="font-semibold text-lg">Import Structure Budgétaire ARTI</h3>
          <p className="text-blue-100 text-sm">Assistant d'importation Excel en 4 étapes</p>
        </div>
      </div>

      {/* Exercise selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            Choisir l'exercice budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={String(selectedExercice)} onValueChange={(v) => setSelectedExercice(Number(v))}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Sélectionner l'exercice" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>
                  Exercice {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* File upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            Charger le fichier Excel
          </CardTitle>
          <CardDescription>
            Fichiers .xlsx ou .xls jusqu'à 20 Mo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary hover:underline font-medium">
                Cliquez pour sélectionner un fichier
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                ou glissez-déposez votre fichier Excel ici
              </p>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
              <Badge variant="secondary">Prêt</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about expected format */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Format attendu (ARTI)</AlertTitle>
        <AlertDescription>
          <p className="mb-2">L'assistant recherchera automatiquement l'onglet <strong>"Groupé (2)"</strong> en priorité, sinon <strong>"Feuil3"</strong>.</p>
          <div className="grid grid-cols-2 gap-x-4 text-sm">
            <div>• OS (2 chiffres)</div>
            <div>• Action (2 chiffres)</div>
            <div>• Activité (3 chiffres)</div>
            <div>• Sous-Activité (2 chiffres)</div>
            <div>• Direction (2 chiffres)</div>
            <div>• Nature Dépense (1 chiffre)</div>
            <div>• NBE (6 chiffres)</div>
            <div>• Montant</div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            L'imputation (18 chiffres) sera recalculée automatiquement pour éviter les erreurs de précision Excel.
          </p>
        </AlertDescription>
      </Alert>

      {/* Help link */}
      <div className="flex items-center justify-center">
        <Link to="/planification/aide-import" className="text-sm text-primary hover:underline flex items-center gap-1">
          <HelpCircle className="h-4 w-4" />
          Consulter l'aide complète sur l'import
        </Link>
      </div>

      {/* Guard: Exercise required */}
      {!selectedExercice && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Exercice requis</AlertTitle>
          <AlertDescription>
            Vous devez sélectionner un exercice budgétaire avant de pouvoir importer des données.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderDetectStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <h3 className="text-lg font-medium">Analyse du fichier en cours...</h3>
      <p className="text-muted-foreground text-center max-w-md">
        Détection automatique de l'onglet principal, mapping des colonnes et validation des données.
      </p>
      <Progress value={50} className="w-64" />
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Detection result */}
      {parseInfo && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Onglet détecté: {parseInfo.sheetUsed}
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            {parseInfo.sheetReason}
            {parseInfo.allSheets.length > 1 && (
              <span className="block text-sm mt-1">
                Autres onglets disponibles: {parseInfo.allSheets.filter(s => s !== parseInfo.sheetUsed).join(", ")}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Card 
          className={`cursor-pointer hover:border-primary transition-colors ${statusFilter === "all" ? "border-primary ring-1 ring-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === "ok" ? "border-green-500 ring-1 ring-green-500" : ""}`}
          onClick={() => setStatusFilter("ok")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
            <div className="text-xs text-muted-foreground">Valides</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-blue-500 transition-colors ${statusFilter === "new" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
          onClick={() => setStatusFilter("new")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-xs text-muted-foreground">Nouvelles</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-orange-500 transition-colors ${statusFilter === "duplicate" ? "border-orange-500 ring-1 ring-orange-500" : ""}`}
          onClick={() => setStatusFilter("duplicate")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold text-orange-600">{duplicates}</div>
            <div className="text-xs text-muted-foreground">Doublons</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-yellow-500 transition-colors ${statusFilter === "warning" ? "border-yellow-500 ring-1 ring-yellow-500" : ""}`}
          onClick={() => setStatusFilter("warning")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-xs text-muted-foreground">Alertes</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-destructive transition-colors ${statusFilter === "error" ? "border-destructive ring-1 ring-destructive" : ""}`}
          onClick={() => setStatusFilter("error")}
        >
          <CardContent className="pt-3 pb-2 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.error}</div>
            <div className="text-xs text-muted-foreground">Invalides</div>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportFullReport}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le rapport d'import (CSV)
          </Button>
          {stats.error > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportErrors} className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Exporter {stats.error} erreur(s)
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span><strong>{stats.new}</strong> prêtes à importer</span>
          {stats.error > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <XCircle className="h-4 w-4 text-destructive" />
              <span><strong>{stats.error}</strong> rejetées</span>
            </>
          )}
          {duplicates > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span><strong>{duplicates}</strong> doublons</span>
            </>
          )}
        </div>
      </div>

      {/* Preview table - first 50 lines */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Aperçu des données (50 premières lignes)</span>
            <Badge variant="outline">{filteredRows.length} / {stats.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 sticky left-0 bg-background">Ligne</TableHead>
                  <TableHead className="w-20">Décision</TableHead>
                  <TableHead className="min-w-[180px]">Code Imputation</TableHead>
                  <TableHead className="min-w-[200px]">Libellé</TableHead>
                  <TableHead className="text-right min-w-[120px]">Montant</TableHead>
                  <TableHead className="w-14">OS</TableHead>
                  <TableHead className="w-14">Dir</TableHead>
                  <TableHead>Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.slice(0, 50).map((row) => (
                  <TableRow 
                    key={row.rowIndex} 
                    className={
                      !row.isValid 
                        ? "bg-red-50/50 dark:bg-red-950/10" 
                        : row.decision === "UPDATE" 
                        ? "bg-orange-50/50 dark:bg-orange-950/10"
                        : row.warnings.length > 0 
                        ? "bg-yellow-50/50 dark:bg-yellow-950/10" 
                        : ""
                    }
                  >
                    <TableCell className="font-mono text-xs sticky left-0 bg-inherit">{row.rowIndex}</TableCell>
                    <TableCell>
                      {row.decision === "NEW" && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600 gap-1 text-xs">
                          <Plus className="h-3 w-3" />
                          Créer
                        </Badge>
                      )}
                      {row.decision === "UPDATE" && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 gap-1 text-xs">
                          <RefreshCw className="h-3 w-3" />
                          Doublon
                        </Badge>
                      )}
                      {row.decision === "ERROR" && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <XCircle className="h-3 w-3" />
                          Erreur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.normalized?.code || row.raw.imputation || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={row.normalized?.label || row.raw.libelle || ""}>
                      {row.normalized?.label || row.raw.libelle || <span className="text-muted-foreground italic">vide</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.normalized?.dotation_initiale?.toLocaleString("fr-FR") || row.raw.montant || "—"} FCFA
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.raw.os || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.raw.direction || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      {row.errors.length > 0 && (
                        <span className="text-destructive block">{row.errors[0]}</span>
                      )}
                      {row.warnings.length > 0 && (
                        <span className="text-yellow-600 block">{row.warnings[0]}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {filteredRows.length > 50 && (
            <p className="text-sm text-muted-foreground text-center py-2 border-t">
              ... et {filteredRows.length - 50} autres lignes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Column mapping info */}
      {parseInfo && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Colonnes détectées automatiquement</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(parseInfo.mapping).map(([key, value]) => (
                <Badge 
                  key={key} 
                  variant={value ? "secondary" : "outline"} 
                  className={!value ? "text-muted-foreground border-dashed" : ""}
                >
                  {key}: {value || "non mappé"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      {!importComplete ? (
        <>
          {/* SAFE mode toggle */}
          <Card className={safeMode ? "border-green-500 bg-green-50/50 dark:bg-green-950/10" : "border-orange-500 bg-orange-50/50 dark:bg-orange-950/10"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className={`h-5 w-5 ${safeMode ? "text-green-600" : "text-orange-600"}`} />
                Mode d'import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="safe-mode" className="text-base font-medium">
                    Mode SAFE (recommandé)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {safeMode 
                      ? "Ajouter uniquement les nouvelles imputations, ne jamais remplacer les existantes"
                      : "Attention: les lignes existantes seront mises à jour avec les nouvelles valeurs"
                    }
                  </p>
                </div>
                <Switch
                  id="safe-mode"
                  checked={safeMode}
                  onCheckedChange={setSafeMode}
                />
              </div>
              
              {safeMode && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <Label htmlFor="replace-amount" className="text-sm font-medium text-muted-foreground">
                      Option avancée: Remplacer le montant si la ligne existe
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {replaceAmount 
                        ? `Les ${duplicates} doublon(s) détectés verront leur montant mis à jour (autres champs inchangés)`
                        : "Les doublons seront ignorés (comportement par défaut)"
                      }
                    </p>
                  </div>
                  <Switch
                    id="replace-amount"
                    checked={replaceAmount}
                    onCheckedChange={setReplaceAmount}
                  />
                </div>
              )}
              
              {!safeMode && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Attention</AlertTitle>
                  <AlertDescription>
                    En désactivant le mode SAFE, {duplicates} ligne(s) existante(s) seront entièrement remplacées.
                    Cette action est irréversible.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sync referentiels toggle */}
          <Card className={syncReferentiels ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/10" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className={`h-5 w-5 ${syncReferentiels ? "text-blue-600" : "text-muted-foreground"}`} />
                Synchronisation des référentiels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-ref" className="text-base font-medium">
                    Charger automatiquement les référentiels
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {syncReferentiels 
                      ? "Les onglets OS, Direction, Action, Activité, Sous-Activité, NBE, Nature de dépense seront synchronisés (UPSERT par code, sans suppression)"
                      : "Les référentiels ne seront pas mis à jour depuis ce fichier"
                    }
                  </p>
                </div>
                <Switch
                  id="sync-ref"
                  checked={syncReferentiels}
                  onCheckedChange={setSyncReferentiels}
                />
              </div>
              
              {syncReferentiels && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    OS
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Direction
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Action
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Activité
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Sous-Activité
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    NBE
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Nature Dépense
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Résumé de l'import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Fichier</span>
                <span className="font-medium">{file?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Onglet source</span>
                <span className="font-medium">{parseInfo?.sheetUsed}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Exercice cible</span>
                <span className="font-medium">{selectedExercice}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  Nouvelles lignes à créer
                </span>
                <span className="font-medium text-blue-600">{stats.new}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                  Doublons détectés
                </span>
                <span className={`font-medium ${safeMode ? "text-muted-foreground line-through" : "text-orange-600"}`}>
                  {duplicates} {safeMode && "(ignorés)"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Lignes invalides
                </span>
                <span className="font-medium text-muted-foreground">{stats.error} (ignorées)</span>
              </div>
            </CardContent>
          </Card>

          {/* Audit notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Traçabilité complète</AlertTitle>
            <AlertDescription>
              Toutes les actions seront enregistrées dans le Journal d'Audit. 
              Aucune suppression ni reset ne sera effectué.
            </AlertDescription>
          </Alert>

          {/* Import button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleImport} 
              disabled={isProcessing || (safeMode ? stats.new === 0 : (stats.new + stats.update) === 0)}
              className="min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider l'import ({safeMode ? stats.new : stats.new + stats.update} ligne{(safeMode ? stats.new : stats.new + stats.update) > 1 ? "s" : ""})
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        /* Import complete */
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            {importStats?.errors === 0 ? (
              <CheckCircle2 className="h-20 w-20 text-green-600" />
            ) : (
              <AlertTriangle className="h-20 w-20 text-yellow-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold">
              {importStats?.errors === 0 ? "Import réussi !" : "Import terminé avec des erreurs"}
            </h3>
            <p className="text-muted-foreground mt-2">
              {importStats?.inserted} nouvelle(s) ligne(s) créée(s)
              {importStats?.updated ? `, ${importStats.updated} mise(s) à jour` : ""}
              {importStats?.skipped ? `, ${importStats.skipped} doublon(s) ignoré(s)` : ""}
              {importStats?.errors ? `, ${importStats.errors} erreur(s)` : ""}
            </p>
          </div>

          {/* Budget lines stats */}
          <Card className="max-w-md mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Lignes budgétaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{importStats?.inserted}</div>
                  <div className="text-sm text-muted-foreground">Créées</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{importStats?.updated}</div>
                  <div className="text-sm text-muted-foreground">Mises à jour</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referentiels stats */}
          {referentielStats && referentielStats.summary.sheetsFound > 0 && (
            <Card className="max-w-md mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Référentiels synchronisés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{referentielStats.summary.totalInserted}</div>
                    <div className="text-sm text-muted-foreground">Ajoutés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{referentielStats.summary.totalUpdated}</div>
                    <div className="text-sm text-muted-foreground">Mis à jour</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-center pt-2 border-t">
                  {referentielStats.os.sheetFound && <Badge variant="outline" className="text-xs">OS: {referentielStats.os.inserted + referentielStats.os.updated}</Badge>}
                  {referentielStats.directions.sheetFound && <Badge variant="outline" className="text-xs">Dir: {referentielStats.directions.inserted + referentielStats.directions.updated}</Badge>}
                  {referentielStats.actions.sheetFound && <Badge variant="outline" className="text-xs">Action: {referentielStats.actions.inserted + referentielStats.actions.updated}</Badge>}
                  {referentielStats.activites.sheetFound && <Badge variant="outline" className="text-xs">Activ: {referentielStats.activites.inserted + referentielStats.activites.updated}</Badge>}
                  {referentielStats.sousActivites.sheetFound && <Badge variant="outline" className="text-xs">S/Act: {referentielStats.sousActivites.inserted + referentielStats.sousActivites.updated}</Badge>}
                  {referentielStats.nbe.sheetFound && <Badge variant="outline" className="text-xs">NBE: {referentielStats.nbe.inserted + referentielStats.nbe.updated}</Badge>}
                  {referentielStats.natureDepense.sheetFound && <Badge variant="outline" className="text-xs">NatDep: {referentielStats.natureDepense.inserted + referentielStats.natureDepense.updated}</Badge>}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetWizard}>
              Nouvel import
            </Button>
            <Button onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img src={logoArti} alt="ARTI" className="h-8 w-8 rounded object-cover" />
            <span>Import Structure Budgétaire — Exercice {selectedExercice}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress stepper */}
        <div className="space-y-3">
          <div className="flex justify-between">
            {STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`flex-1 text-center ${
                  s.id === step
                    ? "text-primary"
                    : stepIndex > idx
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      stepIndex > idx
                        ? "bg-primary text-primary-foreground"
                        : s.id === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepIndex > idx ? <Check className="h-4 w-4" /> : s.icon}
                  </div>
                </div>
                <p className="text-xs font-medium hidden sm:block">{s.title}</p>
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            {step === "exercice" && renderExerciceStep()}
            {step === "detect" && renderDetectStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "confirm" && renderConfirmStep()}
          </div>
        </ScrollArea>

        {/* Navigation */}
        {!importComplete && step !== "detect" && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "preview") setStep("exercice");
                else if (step === "confirm") setStep("preview");
              }}
              disabled={step === "exercice" || isProcessing}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {step === "exercice" && (
              <Button
                onClick={handleDetection}
                disabled={!file || isProcessing}
              >
                Analyser le fichier
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === "preview" && (
              <Button
                onClick={() => setStep("confirm")}
                disabled={isProcessing || (stats.new + stats.update) === 0}
              >
                Continuer
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
