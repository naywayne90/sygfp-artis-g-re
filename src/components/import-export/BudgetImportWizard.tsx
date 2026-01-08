import { useState, useCallback, useEffect } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepExerciceUpload } from "./wizard/StepExerciceUpload";
import { StepSheetSelection } from "./wizard/StepSheetSelection";
import { StepPreviewMapping } from "./wizard/StepPreviewMapping";
import { StepValidationImport } from "./wizard/StepValidationImport";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import { useExcelParser, SheetData, ColumnMapping, ParsedRow } from "@/hooks/useExcelParser";
import { useImportStaging } from "@/hooks/useImportStaging";

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
  const [importStats, setImportStats] = useState<{ success: number; errors: number } | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    try {
      const parsedSheets = await parseExcelFile(uploadedFile);
      setSheets(parsedSheets);
      
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
  }, [parseExcelFile, autoDetectMapping]);

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

    // Collect validation errors from parsed rows
    const seenImputations = new Map<string, number>();
    
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

      // Check for duplicates
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
    });

    setValidationErrors(errors);
    setIsValidating(false);
    
    const hasBlockingErrors = errors.some(e => e.severity === "error");
    
    // If validation passed, create import run and load staging data
    if (!hasBlockingErrors && file && selectedSheet) {
      const newRunId = await createImportRun(selectedExercice, file.name, selectedSheet);
      if (newRunId) {
        setRunId(newRunId);
        await loadStagingData(newRunId, parsedRows);
        toast.success("Données chargées dans la zone de staging");
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

    setIsImporting(true);
    
    try {
      const result = await executeImport(runId);
      
      setImportStats({ 
        success: result.importedCount, 
        errors: result.errorCount 
      });
      setImportComplete(true);
      
      if (result.success) {
        toast.success(`Import réussi: ${result.importedCount} lignes importées`);
      } else {
        toast.warning(`Import partiel: ${result.importedCount} réussies, ${result.errorCount} erreurs`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  }, [runId, executeImport]);

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
  }, []);

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
  }, [currentStep, selectedSheet, sheets, autoDetectMapping, validateData]);

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
