import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertTriangle, 
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useImportJobs, ImportRow, ParsedExcelRow } from "@/hooks/useImportJobs";
import * as XLSX from "xlsx";

interface ImportExcelWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type WizardStep = "upload" | "preview" | "validate";

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: "upload", title: "Téléchargement", description: "Charger le fichier Excel" },
  { id: "preview", title: "Aperçu & Erreurs", description: "Vérifier les données" },
  { id: "validate", title: "Validation", description: "Confirmer l'import" },
];

export function ImportExcelWizard({ open, onOpenChange, onImportComplete }: ImportExcelWizardProps) {
  const { exercice } = useExercice();
  const {
    currentJob,
    importRows,
    isLoading,
    uploadProgress,
    createImportJob,
    uploadFile,
    storeImportRows,
    fetchImportRows,
    validateImportJob,
    executeImport,
    markJobFailed,
    exportErrors,
  } = useImportJobs();

  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error" | "warning">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState<{ inserted: number; updated: number; errors: number } | null>(null);

  const resetWizard = useCallback(() => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setStatusFilter("all");
    setIsProcessing(false);
    setImportComplete(false);
    setImportStats(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onOpenChange(false);
  }, [resetWizard, onOpenChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Seuls les fichiers .xlsx et .xls sont acceptés");
      return;
    }

    // Validate file size (20 MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20 Mo");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      // Create import job
      const job = await createImportJob("budget_structure", exercice, selectedFile.name);
      if (!job) throw new Error("Failed to create import job");

      // Upload file to storage
      await uploadFile(job.id, selectedFile);

      // Parse Excel file
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: true, cellDates: true });
      
      const parsed: ParsedExcelRow[] = [];
      
      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          raw: false, // Keep as strings to preserve leading zeros
          defval: "",
        }) as unknown[][];

        if (jsonData.length < 2) continue; // Skip empty sheets

        const headers = jsonData[0] as string[];
        
        // Process data rows (skip header)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as string[];
          if (row.every(cell => !cell || String(cell).trim() === "")) continue; // Skip empty rows

          const rawData: Record<string, unknown> = {};
          headers.forEach((header, idx) => {
            if (header) {
              rawData[header] = row[idx] || "";
            }
          });

          // Basic validation
          const errors: string[] = [];
          const warnings: string[] = [];

          // Check for required fields (customize based on module)
          if (!rawData["Code"] && !rawData["code"]) {
            errors.push("Code manquant");
          }

          parsed.push({
            rowIndex: i + 1, // 1-indexed for user display
            sheetName,
            raw: rawData,
            normalized: rawData, // Same for now, can be transformed
            isValid: errors.length === 0,
            errors,
            warnings,
          });
        }
      }

      // Store parsed rows
      const stored = await storeImportRows(job.id, parsed);
      if (!stored) throw new Error("Failed to store import rows");

      setParsedData(parsed);
      
      // Fetch rows for display
      await fetchImportRows(job.id, { limit: 100 });

      toast.success(`${parsed.length} ligne(s) analysées`);
      setStep("preview");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erreur lors de l'analyse du fichier");
      if (currentJob) {
        await markJobFailed(currentJob.id, String(error));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [exercice, createImportJob, uploadFile, storeImportRows, fetchImportRows, markJobFailed, currentJob]);

  const handleValidate = useCallback(async () => {
    if (!currentJob) return;

    setIsProcessing(true);
    try {
      const validated = await validateImportJob(currentJob.id);
      if (validated) {
        setStep("validate");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentJob, validateImportJob]);

  const handleImport = useCallback(async () => {
    if (!currentJob) return;

    setIsProcessing(true);
    try {
      const result = await executeImport(currentJob.id, async (row: ImportRow) => {
        // Process each row - customize this based on your target table
        // For now, this is a placeholder that would be replaced with actual logic
        try {
          // Example: Insert/update budget_lines
          // const { data, error } = await supabase.from("budget_lines").upsert({...});
          
          return {
            success: true,
            action: "insert" as const,
            targetId: crypto.randomUUID(),
          };
        } catch (err) {
          return {
            success: false,
            error: String(err),
          };
        }
      });

      setImportStats(result);
      setImportComplete(true);
      
      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentJob, executeImport, onImportComplete]);

  const handleExportErrors = useCallback(async () => {
    if (!currentJob) return;
    await exportErrors(currentJob.id);
  }, [currentJob, exportErrors]);

  const filteredRows = parsedData.filter((row) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "ok") return row.isValid && row.warnings.length === 0;
    if (statusFilter === "warning") return row.isValid && row.warnings.length > 0;
    if (statusFilter === "error") return !row.isValid;
    return true;
  });

  const stats = {
    total: parsedData.length,
    ok: parsedData.filter(r => r.isValid && r.warnings.length === 0).length,
    warning: parsedData.filter(r => r.isValid && r.warnings.length > 0).length,
    error: parsedData.filter(r => !r.isValid).length,
  };

  const progressPercent = step === "upload" ? 33 : step === "preview" ? 66 : 100;

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertTitle>Format accepté</AlertTitle>
        <AlertDescription>
          Fichiers Excel (.xlsx, .xls) jusqu'à 20 Mo. Les codes seront préservés comme texte (pas de perte de zéros).
        </AlertDescription>
      </Alert>

      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-lg font-medium text-primary hover:underline">
            Cliquez pour sélectionner un fichier
          </span>
          <p className="text-sm text-muted-foreground mt-2">
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

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyse en cours...</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {file && !isProcessing && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-green-500 ${statusFilter === "ok" ? "border-green-500" : ""}`}
          onClick={() => setStatusFilter("ok")}
        >
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
            <div className="text-sm text-muted-foreground">OK</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-yellow-500 ${statusFilter === "warning" ? "border-yellow-500" : ""}`}
          onClick={() => setStatusFilter("warning")}
        >
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-sm text-muted-foreground">Avertissements</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-destructive ${statusFilter === "error" ? "border-destructive" : ""}`}
          onClick={() => setStatusFilter("error")}
        >
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.error}</div>
            <div className="text-sm text-muted-foreground">Erreurs</div>
          </CardContent>
        </Card>
      </div>

      {/* Export errors button */}
      {stats.error > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExportErrors}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger rapport d'erreurs (CSV)
          </Button>
        </div>
      )}

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu des données</CardTitle>
          <CardDescription>
            {filteredRows.length} ligne(s) affichée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ligne</TableHead>
                  <TableHead className="w-24">Statut</TableHead>
                  <TableHead>Onglet</TableHead>
                  <TableHead>Données</TableHead>
                  <TableHead>Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.slice(0, 50).map((row) => (
                  <TableRow key={`${row.sheetName}-${row.rowIndex}`}>
                    <TableCell className="font-mono">{row.rowIndex}</TableCell>
                    <TableCell>
                      {row.isValid ? (
                        row.warnings.length > 0 ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Avertissement
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Erreur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{row.sheetName}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono">
                      {Object.entries(row.raw).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      {Object.keys(row.raw).length > 3 && "..."}
                    </TableCell>
                    <TableCell className="text-sm text-destructive">
                      {[...row.errors, ...row.warnings].join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {filteredRows.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              ... et {filteredRows.length - 50} autres lignes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderValidateStep = () => (
    <div className="space-y-6">
      {!importComplete ? (
        <>
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Prêt pour l'import</AlertTitle>
            <AlertDescription>
              {stats.ok + stats.warning} ligne(s) seront importées. 
              {stats.error > 0 && ` ${stats.error} ligne(s) avec erreurs seront ignorées.`}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Fichier</span>
                <span className="font-medium">{file?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Exercice</span>
                <span className="font-medium">{exercice}</span>
              </div>
              <div className="flex justify-between">
                <span>Lignes à importer</span>
                <span className="font-medium text-green-600">{stats.ok + stats.warning}</span>
              </div>
              <div className="flex justify-between">
                <span>Lignes ignorées (erreurs)</span>
                <span className="font-medium text-destructive">{stats.error}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleImport} 
              disabled={isProcessing || (stats.ok + stats.warning) === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider l'import
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {importStats?.errors === 0 ? (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-yellow-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">
              {importStats?.errors === 0 ? "Import réussi !" : "Import terminé avec des erreurs"}
            </h3>
            <p className="text-muted-foreground mt-2">
              {importStats?.inserted} nouvelle(s) ligne(s), {importStats?.updated} mise(s) à jour
              {importStats?.errors ? `, ${importStats.errors} erreur(s)` : ""}
            </p>
          </div>

          <Button onClick={handleClose}>
            Fermer
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Excel - Structure Budgétaire
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            {STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`flex-1 text-center ${
                  s.id === step
                    ? "text-primary font-medium"
                    : STEPS.findIndex(st => st.id === step) > idx
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      STEPS.findIndex(st => st.id === step) > idx
                        ? "bg-primary text-primary-foreground"
                        : s.id === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STEPS.findIndex(st => st.id === step) > idx ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                </div>
                <p className="font-medium hidden sm:block">{s.title}</p>
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            {step === "upload" && renderUploadStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "validate" && renderValidateStep()}
          </div>
        </ScrollArea>

        {/* Navigation */}
        {!importComplete && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "preview") setStep("upload");
                else if (step === "validate") setStep("preview");
              }}
              disabled={step === "upload" || isProcessing}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {step === "preview" && (
              <Button
                onClick={handleValidate}
                disabled={isProcessing || stats.ok + stats.warning === 0}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
