// @ts-nocheck
/**
 * Charger Budget - Import Excel avec mapping colonnes
 *
 * Fonctionnalités:
 * - Upload fichier Excel
 * - Mapping colonnes flexible
 * - Dry-run avec prévisualisation erreurs
 * - Import confirmé après validation
 * - Historique des imports
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Download,
  Eye,
  History,
  ArrowRight,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetImport } from "@/hooks/useBudgetImport";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Colonnes attendues pour le mapping
const EXPECTED_COLUMNS = [
  { key: "code", label: "Code ligne", required: true },
  { key: "label", label: "Libellé", required: true },
  { key: "level", label: "Niveau (os/mission/action/activite/sous_activite/ligne)", required: true },
  { key: "dotation_initiale", label: "Dotation initiale", required: true },
  { key: "direction_code", label: "Code Direction", required: false },
  { key: "os_code", label: "Code OS", required: false },
  { key: "mission_code", label: "Code Mission", required: false },
  { key: "action_code", label: "Code Action", required: false },
  { key: "activite_code", label: "Code Activité", required: false },
  { key: "nbe_code", label: "Code NBE", required: false },
  { key: "sysco_code", label: "Code SYSCO", required: false },
];

type ImportStep = "upload" | "mapping" | "validation" | "confirm" | "result";

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newRows: number;
  updateRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
  parsedRows: ParsedRow[];
}

export default function ChargerBudget() {
  const { selectedExercice, isReadOnly } = useExercice();
  const {
    importHistory,
    isLoading: isLoadingHistory,
    validateImportData,
    executeImport,
    isValidating,
    isImporting,
    refetch,
  } = useBudgetImport();

  // State
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("import");

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Vérifier le type de fichier
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(uploadedFile.type) &&
        !uploadedFile.name.endsWith(".xlsx") &&
        !uploadedFile.name.endsWith(".xls") &&
        !uploadedFile.name.endsWith(".csv")) {
      toast.error("Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV.");
      return;
    }

    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données.");
        setIsProcessing(false);
        return;
      }

      // Première ligne = en-têtes
      const headers = (jsonData[0] as string[]).map(h => String(h || "").trim());
      setExcelColumns(headers);

      // Reste = données
      const data = jsonData.slice(1).map((row: any, index: number) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, i) => {
          rowData[header] = row[i];
        });
        return rowData;
      });

      setRawData(data);

      // Mapping automatique basé sur les noms de colonnes similaires
      const autoMapping: Record<string, string> = {};
      EXPECTED_COLUMNS.forEach(expected => {
        const match = headers.find(h =>
          h.toLowerCase().includes(expected.key.toLowerCase()) ||
          h.toLowerCase().includes(expected.label.toLowerCase().split(" ")[0])
        );
        if (match) {
          autoMapping[expected.key] = match;
        }
      });
      setColumnMapping(autoMapping);

      setStep("mapping");
      toast.success(`Fichier chargé: ${data.length} lignes détectées`);
    } catch (error) {
      console.error("Erreur lecture fichier:", error);
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Validate mapping
  const handleValidateMapping = useCallback(async () => {
    // Vérifier les colonnes requises
    const missingRequired = EXPECTED_COLUMNS
      .filter(c => c.required && !columnMapping[c.key])
      .map(c => c.label);

    if (missingRequired.length > 0) {
      toast.error(`Colonnes requises manquantes: ${missingRequired.join(", ")}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Transformer les données avec le mapping
      const mappedData = rawData.map((row, index) => {
        const mapped: Record<string, any> = {};
        Object.entries(columnMapping).forEach(([targetKey, sourceCol]) => {
          if (sourceCol) {
            mapped[targetKey] = row[sourceCol];
          }
        });
        return mapped;
      });

      // Appeler la validation
      const result = await validateImportData(mappedData, columnMapping);

      setValidationResult(result);
      setStep("validation");

      if (result.errorRows === 0) {
        toast.success("Validation réussie! Aucune erreur détectée.");
      } else {
        toast.warning(`${result.errorRows} ligne(s) avec erreurs détectées.`);
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      toast.error("Erreur lors de la validation");
    } finally {
      setIsProcessing(false);
    }
  }, [rawData, columnMapping, validateImportData]);

  // Execute import
  const handleExecuteImport = useCallback(async () => {
    if (!validationResult || !file) return;

    try {
      await executeImport(validationResult, file.name, file.size);
      setStep("result");
      toast.success("Import terminé avec succès!");
      refetch();
    } catch (error) {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'import");
    }
  }, [validationResult, file, executeImport, refetch]);

  // Reset
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setExcelColumns([]);
    setColumnMapping({});
    setValidationResult(null);
  };

  // Download template
  const handleDownloadTemplate = () => {
    const headers = EXPECTED_COLUMNS.map(c => c.label);
    const sampleData = [
      ["OS-01", "Objectif Stratégique 1", "os", "100000000", "DIR01", "", "", "", "", "", ""],
      ["MIS-01-01", "Mission 1.1", "mission", "50000000", "DIR01", "OS-01", "", "", "", "", ""],
      ["LIG-001", "Ligne budgétaire exemple", "ligne", "10000000", "DIR01", "OS-01", "MIS-01-01", "ACT-01", "ACTIV-01", "NBE001", "SYSCO001"],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    XLSX.writeFile(wb, `template_budget_${selectedExercice?.annee || new Date().getFullYear()}.xlsx`);
    toast.success("Template téléchargé");
  };

  // Export errors
  const handleExportErrors = () => {
    if (!validationResult) return;

    const errorData = validationResult.errors.map(e => ({
      Ligne: e.row,
      Champ: e.field,
      Erreur: e.message,
    }));

    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Erreurs");
    XLSX.writeFile(wb, `erreurs_import_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Rapport d'erreurs exporté");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Charger le Budget
          </h1>
          <p className="text-muted-foreground">
            Import Excel avec mapping colonnes - Exercice {selectedExercice?.annee}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template Excel
          </Button>
          {step !== "upload" && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recommencer
            </Button>
          )}
        </div>
      </div>

      {isReadOnly && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mode lecture seule</AlertTitle>
          <AlertDescription>
            L'exercice sélectionné est en lecture seule. Les imports ne sont pas autorisés.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          {/* Progress Steps */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                {["upload", "mapping", "validation", "confirm", "result"].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === s
                          ? "bg-blue-600 text-white"
                          : ["upload", "mapping", "validation", "confirm", "result"].indexOf(step) > i
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {["upload", "mapping", "validation", "confirm", "result"].indexOf(step) > i ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 4 && (
                      <div
                        className={`w-16 md:w-24 h-1 mx-2 ${
                          ["upload", "mapping", "validation", "confirm", "result"].indexOf(step) > i
                            ? "bg-green-600"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Upload</span>
                <span>Mapping</span>
                <span>Validation</span>
                <span>Confirmation</span>
                <span>Résultat</span>
              </div>
            </CardContent>
          </Card>

          {/* Step: Upload */}
          {step === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle>1. Charger le fichier</CardTitle>
                <CardDescription>
                  Sélectionnez un fichier Excel (.xlsx, .xls) ou CSV contenant les lignes budgétaires
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="mb-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:underline">Cliquez pour sélectionner</span>
                      <span className="text-muted-foreground"> ou glissez-déposez votre fichier</span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={isReadOnly || isProcessing}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Formats acceptés: Excel (.xlsx, .xls), CSV
                  </p>
                  {isProcessing && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Lecture du fichier...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Mapping */}
          {step === "mapping" && (
            <Card>
              <CardHeader>
                <CardTitle>2. Mapping des colonnes</CardTitle>
                <CardDescription>
                  Associez les colonnes de votre fichier aux champs du budget ({rawData.length} lignes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXPECTED_COLUMNS.map(col => (
                    <div key={col.key} className="flex items-center gap-4">
                      <div className="w-1/2">
                        <Label className="flex items-center gap-1">
                          {col.label}
                          {col.required && <span className="text-red-500">*</span>}
                        </Label>
                      </div>
                      <div className="w-1/2">
                        <Select
                          value={columnMapping[col.key] || "none"}
                          onValueChange={(v) =>
                            setColumnMapping({
                              ...columnMapping,
                              [col.key]: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Non mappé --</SelectItem>
                            {excelColumns.map(c => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Retour
                  </Button>
                  <Button onClick={handleValidateMapping} disabled={isProcessing || isValidating}>
                    {(isProcessing || isValidating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Valider le mapping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Validation */}
          {step === "validation" && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>3. Résultat de la validation (Dry-run)</CardTitle>
                <CardDescription>
                  Vérifiez les erreurs avant de confirmer l'import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Lignes analysées</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                      <div className="text-sm text-muted-foreground">Lignes valides</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-red-600">{validationResult.errorRows}</div>
                      <div className="text-sm text-muted-foreground">Lignes en erreur</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-orange-600">{validationResult.warningRows}</div>
                      <div className="text-sm text-muted-foreground">Avertissements</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Nouvelles lignes</AlertTitle>
                    <AlertDescription>{validationResult.newRows} ligne(s) seront créées</AlertDescription>
                  </Alert>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Mises à jour</AlertTitle>
                    <AlertDescription>{validationResult.updateRows} ligne(s) seront mises à jour</AlertDescription>
                  </Alert>
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Erreurs ({validationResult.errors.length})
                      </h4>
                      <Button variant="outline" size="sm" onClick={handleExportErrors}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                    <ScrollArea className="h-48 border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Ligne</TableHead>
                            <TableHead className="w-32">Champ</TableHead>
                            <TableHead>Erreur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.errors.slice(0, 50).map((err, i) => (
                            <TableRow key={i}>
                              <TableCell>{err.row}</TableCell>
                              <TableCell>{err.field}</TableCell>
                              <TableCell className="text-red-600">{err.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    {validationResult.errors.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ... et {validationResult.errors.length - 50} autres erreurs
                      </p>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-600 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Avertissements ({validationResult.warnings.length})
                    </h4>
                    <ScrollArea className="h-32 border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Ligne</TableHead>
                            <TableHead className="w-32">Champ</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.warnings.slice(0, 20).map((warn, i) => (
                            <TableRow key={i}>
                              <TableCell>{warn.row}</TableCell>
                              <TableCell>{warn.field}</TableCell>
                              <TableCell className="text-orange-600">{warn.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep("mapping")}>
                    Retour
                  </Button>
                  {validationResult.errorRows === 0 ? (
                    <Button onClick={() => setStep("confirm")}>
                      Continuer vers la confirmation
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setStep("confirm")}>
                      Continuer malgré les erreurs
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>4. Confirmation de l'import</CardTitle>
                <CardDescription>
                  Vérifiez les informations avant de procéder à l'import définitif
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Résumé de l'import</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Fichier: <strong>{file?.name}</strong></li>
                      <li>Exercice: <strong>{selectedExercice?.annee}</strong></li>
                      <li>Lignes valides à importer: <strong>{validationResult.validRows}</strong></li>
                      <li>Nouvelles lignes: <strong>{validationResult.newRows}</strong></li>
                      <li>Mises à jour: <strong>{validationResult.updateRows}</strong></li>
                      {validationResult.errorRows > 0 && (
                        <li className="text-red-600">
                          Lignes ignorées (erreurs): <strong>{validationResult.errorRows}</strong>
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>

                {validationResult.errorRows > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Attention</AlertTitle>
                    <AlertDescription>
                      {validationResult.errorRows} ligne(s) en erreur seront ignorées lors de l'import.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep("validation")}>
                    Retour
                  </Button>
                  <Button
                    onClick={handleExecuteImport}
                    disabled={isImporting || validationResult.validRows === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmer l'import
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Result */}
          {step === "result" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                  Import terminé avec succès
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Succès</AlertTitle>
                  <AlertDescription>
                    L'import a été effectué avec succès. Les lignes budgétaires ont été créées/mises à jour.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleReset}>
                    <Upload className="h-4 w-4 mr-2" />
                    Nouvel import
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("history")}>
                    <History className="h-4 w-4 mr-2" />
                    Voir l'historique
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des imports
              </CardTitle>
              <CardDescription>
                Liste des imports effectués
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : importHistory && importHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Lignes</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Utilisateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((imp: any) => (
                      <TableRow key={imp.id}>
                        <TableCell>
                          {new Date(imp.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {imp.file_name || "-"}
                        </TableCell>
                        <TableCell>
                          {imp.lines_imported || imp.total_lines || 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              imp.status === "imported" || imp.status === "termine"
                                ? "bg-green-100 text-green-800"
                                : imp.status === "failed" || imp.status === "echec"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {imp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{imp.created_by_profile?.full_name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  Aucun historique d'import
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
