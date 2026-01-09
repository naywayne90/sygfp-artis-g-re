import { useState, useCallback, useEffect } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StepExerciceUpload } from "./wizard/StepExerciceUpload";
import { StepSheetSelection } from "./wizard/StepSheetSelection";
import { StepPreviewMapping } from "./wizard/StepPreviewMapping";
import { StepValidationImport } from "./wizard/StepValidationImport";
import { ChevronLeft, ChevronRight, Check, RotateCcw, ShieldAlert, Lock } from "lucide-react";
import { useExcelParser, SheetData, ColumnMapping, ParsedRow } from "@/hooks/useExcelParser";
import { useImportStaging } from "@/hooks/useImportStaging";
import { useReferentielSync } from "@/hooks/useReferentielSync";
import { useImportSecurity } from "@/hooks/useImportSecurity";

export type { SheetData, ColumnMapping } from "@/hooks/useExcelParser";

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: "error" | "warning";
}

const STEPS = [
  { id: 1, title: "Exercice & Fichier", description: "Choix exercice et upload" },
  { id: 2, title: "Sélection Onglet", description: "Choisir l'onglet à importer" },
  { id: 3, title: "Aperçu & Mapping", description: "Mapper les colonnes" },
  { id: 4, title: "Validation & Import", description: "Vérifier et importer" },
];

const REQUIRED_COLUMNS: (keyof ColumnMapping)[] = ["imputation", "montant"];

export function BudgetImportWizard() {
  const { exercice } = useExercice();
  const { parseExcelFile, autoDetectMapping, parseSheetData } = useExcelParser();
  const { 
    currentRunId, 
    isLoading: isStagingLoading, 
    createImportRun, 
    loadStagingData, 
    validateImportRun, 
    executeImport 
  } = useImportStaging();
  const {
    isSyncing,
    detectReferenceSheets,
    importAllReferentiels,
    refreshDropdowns,
  } = useReferentielSync();
  const {
    canImport,
    isBudgetLockedForUser,
    isCheckingValidation,
    budgetValidation,
    getImportBlockReason,
    logImportAction,
    hasImportOverrideRole,
  } = useImportSecurity();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedExercice, setSelectedExercice] = useState<number>(exercice || new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    imputation: null,
    os: null,
    action: null,
    activite: null,
    sousActivite: null,
    direction: null,
    natureDépense: null,
    nbe: null,
    montant: null,
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState<{ 
    success: number; 
    inserted: number;
    updated: number;
    errors: number 
  } | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  
  // Reference sync state
  const [syncReferentielsEnabled, setSyncReferentielsEnabled] = useState(false);
  const [detectedRefSheets, setDetectedRefSheets] = useState<{ name: string; type: string }[]>([]);
  const [refsSynced, setRefsSynced] = useState(false);
  
  // Override justification for validated budgets
  const [overrideJustification, setOverrideJustification] = useState("");

  // Block reason for display
  const importBlockReason = getImportBlockReason();

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setRefsSynced(false);
    try {
      const parsedSheets = await parseExcelFile(uploadedFile);
      setSheets(parsedSheets);
      
      // Detect reference sheets
      const sheetNames = parsedSheets.map(s => s.name);
      const refDetection = detectReferenceSheets(sheetNames);
      setDetectedRefSheets(refDetection.detectedSheets);
      if (refDetection.hasReferenceData) {
        setSyncReferentielsEnabled(true); // Enable by default if refs detected
      }
      
      // Auto-select sheet: prioritize "Groupé (2)", then "Feuil3"
      const groupeSheet = parsedSheets.find(s => 
        s.name.toLowerCase().includes("groupé") || 
        s.name.includes("Groupe") || 
        s.name === "Groupé (2)"
      );
      const feuil3Sheet = parsedSheets.find(s => s.name === "Feuil3");
      
      if (groupeSheet) {
        setSelectedSheet(groupeSheet.name);
        setMapping(autoDetectMapping(groupeSheet.headers));
      } else if (feuil3Sheet) {
        setSelectedSheet(feuil3Sheet.name);
        setMapping(autoDetectMapping(feuil3Sheet.headers));
      } else if (parsedSheets.length > 0) {
        setSelectedSheet(parsedSheets[0].name);
        setMapping(autoDetectMapping(parsedSheets[0].headers));
      }
      
      toast.success(`Fichier chargé: ${parsedSheets.length} onglet(s) détecté(s)`);
    } catch (error) {
      toast.error("Erreur lors de la lecture du fichier Excel");
      console.error(error);
    }
  }, [parseExcelFile, autoDetectMapping, detectReferenceSheets]);

  const handleSheetSelect = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    const sheet = sheets.find(s => s.name === sheetName);
    if (sheet) {
      const detectedMapping = autoDetectMapping(sheet.headers);
      setMapping(detectedMapping);
    }
  }, [sheets, autoDetectMapping]);

  const getMissingRequiredColumns = useCallback((): (keyof ColumnMapping)[] => {
    return REQUIRED_COLUMNS.filter(col => !mapping[col]);
  }, [mapping]);

  // Parse data when mapping changes or sheet is selected
  useEffect(() => {
    if (selectedSheet && currentStep >= 3) {
      const sheet = sheets.find(s => s.name === selectedSheet);
      if (sheet) {
        const parsed = parseSheetData(sheet, mapping);
        setParsedRows(parsed);
      }
    }
  }, [selectedSheet, mapping, sheets, currentStep, parseSheetData]);

  const validateData = useCallback(async () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    const errors: ValidationError[] = [];
    
    // Check for missing required mappings
    const missingCols = getMissingRequiredColumns();
    if (missingCols.length > 0) {
      missingCols.forEach(col => {
        errors.push({
          row: 0,
          column: col,
          message: `Colonne obligatoire "${col}" non mappée`,
          severity: "error",
        });
      });
    }

    // Validate file structure before import
    if (!file) {
      errors.push({
        row: 0,
        column: "général",
        message: "Aucun fichier sélectionné",
        severity: "error",
      });
    }

    // Collect validation errors from parsed rows
    const seenImputations = new Map<string, number>();
    const seenCodes = new Map<string, number>();
    
    parsedRows.forEach((row) => {
      // Add row-specific errors
      row.errors.forEach((errorMsg) => {
        errors.push({
          row: row.rowNumber,
          column: errorMsg.includes("Imputation") ? "imputation" : 
                  errorMsg.includes("Montant") ? "montant" : "général",
          message: errorMsg,
          severity: "error",
        });
      });

      // Check for duplicate imputations
      if (row.computed.imputation) {
        const existingRow = seenImputations.get(row.computed.imputation);
        if (existingRow) {
          errors.push({
            row: row.rowNumber,
            column: "imputation",
            message: `Doublon: "${row.computed.imputation}" déjà présent (ligne ${existingRow})`,
            severity: "warning",
          });
        } else {
          seenImputations.set(row.computed.imputation, row.rowNumber);
        }
      }

      // Check for existing codes in database (simulation - would need API call)
      // This is a placeholder for checking against existing budget lines
      const codeKey = row.computed.imputation;
      if (codeKey) {
        // Check if this code already exists in parsed rows with different data
        const existingInFile = seenCodes.get(codeKey);
        if (existingInFile && existingInFile !== row.rowNumber) {
          errors.push({
            row: row.rowNumber,
            column: "imputation",
            message: `Code "${codeKey}" dupliqué dans le fichier (ligne ${existingInFile}). Les doublons seront mis à jour.`,
            severity: "warning",
          });
        }
        seenCodes.set(codeKey, row.rowNumber);
      }

      // Validate montant is positive
      if (row.computed.montant !== null && row.computed.montant < 0) {
        errors.push({
          row: row.rowNumber,
          column: "montant",
          message: `Montant négatif: ${row.computed.montant}`,
          severity: "error",
        });
      }
    });

    // Summary validation
    if (parsedRows.length === 0) {
      errors.push({
        row: 0,
        column: "général",
        message: "Aucune ligne de données à importer",
        severity: "error",
      });
    }

    setValidationErrors(errors);
    setIsValidating(false);
    
    const hasBlockingErrors = errors.some(e => e.severity === "error");
    
    // If validation passed, create import run and load staging data
    if (!hasBlockingErrors && file && selectedSheet) {
      const newRunId = await createImportRun(selectedExercice, file.name, selectedSheet);
      if (newRunId) {
        setRunId(newRunId);
        await loadStagingData(newRunId, parsedRows);
        toast.success(`Validation réussie: ${parsedRows.length} lignes prêtes à importer`);
        
        // Log to budget_history
        console.log(`[AUDIT] Import préparé: exercice=${selectedExercice}, fichier=${file.name}, lignes=${parsedRows.length}`);
      }
    }
    
    return !hasBlockingErrors;
  }, [
    getMissingRequiredColumns, 
    parsedRows, 
    file, 
    selectedSheet, 
    selectedExercice, 
    createImportRun, 
    loadStagingData
  ]);

  const handleImport = useCallback(async () => {
    if (!runId) {
      toast.error("Aucun import en cours");
      return;
    }

    // Check if justification is required for validated budget
    if (budgetValidation?.isValidated && hasImportOverrideRole && !overrideJustification.trim()) {
      toast.error("Une justification est requise pour importer sur un budget validé");
      return;
    }

    setIsImporting(true);
    
    try {
      // Log import start
      await logImportAction(runId, file?.name || "unknown", "start", {
        totalRows: parsedRows.length,
        justification: overrideJustification || undefined,
      });

      const result = await executeImport(runId);
      
      setImportStats({ 
        success: result.importedCount, 
        inserted: result.insertedCount,
        updated: result.updatedCount,
        errors: result.errorCount 
      });
      setImportComplete(true);
      
      // Log import result
      await logImportAction(
        runId, 
        file?.name || "unknown", 
        result.success ? "success" : "error",
        {
          totalRows: parsedRows.length,
          insertedRows: result.insertedCount,
          updatedRows: result.updatedCount,
          errorRows: result.errorCount,
          justification: overrideJustification || undefined,
        }
      );
      
      if (result.success) {
        toast.success(`Import réussi: ${result.insertedCount} créées, ${result.updatedCount} mises à jour`);
      } else {
        toast.warning(`Import partiel: ${result.importedCount} réussies, ${result.errorCount} erreurs`);
      }
    } catch (error) {
      console.error("Import error:", error);
      
      // Log import error
      if (runId) {
        await logImportAction(runId, file?.name || "unknown", "error", {
          errorRows: parsedRows.length,
        });
      }
      
      toast.error("Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  }, [runId, executeImport, budgetValidation, hasImportOverrideRole, overrideJustification, logImportAction, file, parsedRows]);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setFile(null);
    setSheets([]);
    setSelectedSheet(null);
    setMapping({
      imputation: null,
      os: null,
      action: null,
      activite: null,
      sousActivite: null,
      direction: null,
      natureDépense: null,
      nbe: null,
      montant: null,
    });
    setParsedRows([]);
    setValidationErrors([]);
    setImportComplete(false);
    setImportStats(null);
    setRunId(null);
    setSyncReferentielsEnabled(false);
    setDetectedRefSheets([]);
    setRefsSynced(false);
    setOverrideJustification("");
  }, []);

  // Block import if user doesn't have permission
  if (!canImport && importBlockReason) {
    return (
      <Alert variant="destructive" className="my-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Import bloqué</AlertTitle>
        <AlertDescription>{importBlockReason}</AlertDescription>
      </Alert>
    );
  }

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return file !== null && selectedExercice > 0;
      case 2:
        return selectedSheet !== null;
      case 3:
        return getMissingRequiredColumns().length === 0;
      case 4:
        return validationErrors.filter(e => e.severity === "error").length === 0;
      default:
        return false;
    }
  }, [currentStep, file, selectedExercice, selectedSheet, getMissingRequiredColumns, validationErrors]);

  const handleNext = useCallback(async () => {
    // Sync referentiels before moving to step 3 if enabled
    if (currentStep === 2 && syncReferentielsEnabled && !refsSynced && file) {
      const result = await importAllReferentiels(file);
      if (result.summary.totalInserted + result.summary.totalUpdated > 0) {
        toast.success(`Référentiels synchronisés: ${result.summary.totalInserted} créés, ${result.summary.totalUpdated} mis à jour`);
        refreshDropdowns();
      }
      setRefsSynced(true);
    }
    
    if (currentStep === 2 && selectedSheet) {
      const sheet = sheets.find(s => s.name === selectedSheet);
      if (sheet) {
        const detectedMapping = autoDetectMapping(sheet.headers);
        setMapping(detectedMapping);
      }
    }
    
    if (currentStep === 3) {
      await validateData();
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, selectedSheet, sheets, autoDetectMapping, validateData, syncReferentielsEnabled, refsSynced, file, importAllReferentiels, refreshDropdowns]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const progressPercent = (currentStep / 4) * 100;

  // Get current sheet for preview
  const currentSheet = sheets.find(s => s.name === selectedSheet);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep
                  ? "text-primary font-medium"
                  : step.id < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <StepExerciceUpload
            selectedExercice={selectedExercice}
            onExerciceChange={setSelectedExercice}
            file={file}
            onFileUpload={handleFileUpload}
          />
        )}

        {currentStep === 2 && (
          <StepSheetSelection
            sheets={sheets}
            selectedSheet={selectedSheet}
            onSheetSelect={handleSheetSelect}
            syncReferentiels={syncReferentielsEnabled}
            onSyncReferentielsChange={setSyncReferentielsEnabled}
            detectedRefSheets={detectedRefSheets}
          />
        )}

        {currentStep === 3 && currentSheet && (
          <StepPreviewMapping
            sheet={currentSheet}
            mapping={mapping}
            onMappingChange={setMapping}
            missingRequired={getMissingRequiredColumns()}
            parsedRows={parsedRows}
          />
        )}

        {currentStep === 4 && (
          <StepValidationImport
            validationErrors={validationErrors}
            isValidating={isValidating || isStagingLoading}
            isImporting={isImporting}
            importComplete={importComplete}
            importStats={importStats}
            onValidate={validateData}
            onImport={handleImport}
            parsedRows={parsedRows}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={importComplete ? resetWizard : handleBack}
          disabled={currentStep === 1 && !importComplete}
        >
          {importComplete ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nouvel import
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </>
          )}
        </Button>

        {!importComplete && currentStep < 4 && (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
