import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetImportAdvancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  duplicates: string[];
}

const REQUIRED_COLUMNS = ["code", "label", "level", "dotation_initiale"];
const OPTIONAL_COLUMNS = [
  "type_ligne",
  "source_financement", 
  "direction_code", 
  "os_code", 
  "mission_code", 
  "action_code",
  "activite_code",
  "nbe_code",
  "sysco_code",
  "commentaire"
];

const STEPS = [
  { id: 1, title: "Fichier", description: "Charger le fichier" },
  { id: 2, title: "Mapping", description: "Mapper les colonnes" },
  { id: 3, title: "Validation", description: "Contrôler les données" },
  { id: 4, title: "Import", description: "Importer" },
];

export function BudgetImportAdvanced({ open, onOpenChange, onSuccess }: BudgetImportAdvancedProps) {
  const { exercice } = useExercice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importId, setImportId] = useState<string | null>(null);

  const resetState = () => {
    setCurrentStep(1);
    setFile(null);
    setRawData([]);
    setFileHeaders([]);
    setColumnMapping({});
    setParsedRows([]);
    setValidationResult(null);
    setIsProcessing(false);
    setImportProgress(0);
    setImportId(null);
  };

  const downloadTemplate = () => {
    const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(";");
    const example = [
      "6110001",
      "Fournitures de bureau",
      "ligne",
      "5000000",
      "depense",
      "budget_etat",
      "DAAF",
      "OS1",
      "M1",
      "A1",
      "ACT1",
      "611",
      "6011",
      "Budget fonctionnement",
    ].join(";");

    const content = `${headers}\n${example}`;
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `modele_budget_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Modèle téléchargé");
  };

  const parseCSV = (content: string): { headers: string[]; data: Record<string, string>[] } => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return { headers: [], data: [] };

    const headers = lines[0].split(/[;,\t]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[;,\t]/).map((v) => v.trim().replace(/"/g, ""));
      if (values.some(v => v)) { // Skip empty rows
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        data.push(row);
      }
    }

    return { headers, data };
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const content = await selectedFile.text();
      const { headers, data } = parseCSV(content);
      
      if (data.length === 0) {
        throw new Error("Fichier vide ou format invalide");
      }

      setFileHeaders(headers);
      setRawData(data);

      // Auto-map columns that match
      const autoMapping: Record<string, string> = {};
      [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].forEach(col => {
        const match = headers.find(h => 
          h === col || 
          h.replace(/_/g, "") === col.replace(/_/g, "") ||
          h.includes(col) ||
          col.includes(h)
        );
        if (match) autoMapping[col] = match;
      });
      setColumnMapping(autoMapping);
      setCurrentStep(2);
    } catch (error: any) {
      toast.error("Erreur de lecture: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateData = async () => {
    setIsProcessing(true);
    const result: ValidationResult = {
      totalRows: rawData.length,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      errors: [],
      warnings: [],
      duplicates: [],
    };

    const parsed: ParsedRow[] = [];
    const seenCodes = new Set<string>();

    // Fetch reference data
    const [directions, objectifs, _missions, _actions, _activites, _nbe, _sysco, existingLines] = await Promise.all([
      supabase.from("directions").select("id, code"),
      supabase.from("objectifs_strategiques").select("id, code"),
      supabase.from("missions").select("id, code"),
      supabase.from("actions").select("id, code"),
      supabase.from("activites").select("id, code"),
      supabase.from("nomenclature_nbe").select("id, code"),
      supabase.from("plan_comptable_sysco").select("id, code"),
      supabase.from("budget_lines").select("code").eq("exercice", exercice || new Date().getFullYear()),
    ]);

    const existingCodes = new Set(existingLines.data?.map(l => l.code) || []);
    const directionCodes = new Set(directions.data?.map(d => d.code) || []);
    const osCodes = new Set(objectifs.data?.map(o => o.code) || []);

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];

      // Map data using column mapping
      const mappedData: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([targetCol, sourceCol]) => {
        mappedData[targetCol] = row[sourceCol] || "";
      });

      // Required field validation
      REQUIRED_COLUMNS.forEach(col => {
        if (!mappedData[col]) {
          rowErrors.push(`Champ obligatoire manquant: ${col}`);
        }
      });

      // Code uniqueness check
      const code = mappedData.code;
      if (code) {
        if (seenCodes.has(code)) {
          rowErrors.push(`Code en doublon dans le fichier: ${code}`);
          result.duplicates.push(code);
        } else {
          seenCodes.add(code);
        }
        if (existingCodes.has(code)) {
          rowWarnings.push(`Code existant (sera mis à jour): ${code}`);
        }
      }

      // Dotation validation
      const dotation = parseFloat(mappedData.dotation_initiale);
      if (isNaN(dotation)) {
        rowErrors.push("Dotation initiale invalide (doit être un nombre)");
      } else if (dotation < 0) {
        rowErrors.push("Dotation initiale négative non autorisée");
      }

      // Reference validation
      if (mappedData.direction_code && !directionCodes.has(mappedData.direction_code)) {
        rowWarnings.push(`Code direction inconnu: ${mappedData.direction_code}`);
      }
      if (mappedData.os_code && !osCodes.has(mappedData.os_code)) {
        rowWarnings.push(`Code OS inconnu: ${mappedData.os_code}`);
      }

      // Level validation
      const validLevels = ["os", "mission", "action", "activite", "sous_activite", "ligne"];
      if (mappedData.level && !validLevels.includes(mappedData.level)) {
        rowWarnings.push(`Niveau inconnu: ${mappedData.level} (valides: ${validLevels.join(", ")})`);
      }

      const isValid = rowErrors.length === 0;
      
      parsed.push({
        rowIndex: i + 2,
        data: mappedData,
        errors: rowErrors,
        warnings: rowWarnings,
        isValid,
      });

      if (isValid) {
        result.validRows++;
      } else {
        result.errorRows++;
      }
      if (rowWarnings.length > 0) result.warningRows++;

      rowErrors.forEach(e => result.errors.push({ row: i + 2, message: e }));
      rowWarnings.forEach(w => result.warnings.push({ row: i + 2, message: w }));
    }

    setParsedRows(parsed);
    setValidationResult(result);
    setCurrentStep(3);
    setIsProcessing(false);
  };

  const executeImport = async () => {
    if (!validationResult || validationResult.validRows === 0) return;

    setIsProcessing(true);
    setImportProgress(0);

    let importRecordId: string | null = null;

    try {
      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from("budget_imports")
        .insert({
          exercice: exercice || new Date().getFullYear(),
          file_name: file?.name || "import.csv",
          file_size: file?.size,
          total_rows: validationResult.totalRows,
          status: "en_cours",
        })
        .select()
        .single();

      if (importError) throw importError;
      importRecordId = importRecord.id;
      setImportId(importRecord.id);

      // Fetch reference maps in parallel
      const [directions, objectifs, missions, actions, activites, sousActivites, nbe, sysco, existingLines] = await Promise.all([
        supabase.from("directions").select("id, code"),
        supabase.from("objectifs_strategiques").select("id, code"),
        supabase.from("missions").select("id, code"),
        supabase.from("actions").select("id, code"),
        supabase.from("activites").select("id, code"),
        supabase.from("sous_activites").select("id, code"),
        supabase.from("nomenclature_nbe").select("id, code"),
        supabase.from("plan_comptable_sysco").select("id, code"),
        supabase.from("budget_lines").select("id, code").eq("exercice", exercice || new Date().getFullYear()),
      ]);

      const directionMap = new Map(directions.data?.map(d => [d.code, d.id]) || []);
      const osMap = new Map(objectifs.data?.map(o => [o.code, o.id]) || []);
      const missionMap = new Map(missions.data?.map(m => [m.code, m.id]) || []);
      const actionMap = new Map(actions.data?.map(a => [a.code, a.id]) || []);
      const activiteMap = new Map(activites.data?.map(a => [a.code, a.id]) || []);
      const sousActiviteMap = new Map(sousActivites.data?.map(sa => [sa.code, sa.id]) || []);
      const nbeMap = new Map(nbe.data?.map(n => [n.code, n.id]) || []);
      const syscoMap = new Map(sysco.data?.map(s => [s.code, s.id]) || []);
      const existingMap = new Map(existingLines.data?.map(l => [l.code, l.id]) || []);

      const validRows = parsedRows.filter(r => r.isValid);
      
      // Prepare all budget lines for batch operations
      const toInsert: any[] = [];
      const toUpdate: { id: string; data: any }[] = [];
      
      for (const row of validRows) {
        const data = row.data;
        const budgetLine = {
          code: data.code,
          label: data.label,
          level: data.level || "ligne",
          type_ligne: data.type_ligne || "depense",
          dotation_initiale: parseFloat(data.dotation_initiale) || 0,
          source_financement: data.source_financement || "budget_etat",
          direction_id: data.direction_code ? directionMap.get(data.direction_code) : null,
          os_id: data.os_code ? osMap.get(data.os_code) : null,
          mission_id: data.mission_code ? missionMap.get(data.mission_code) : null,
          action_id: data.action_code ? actionMap.get(data.action_code) : null,
          activite_id: data.activite_code ? activiteMap.get(data.activite_code) : null,
          sous_activite_id: data.sous_activite_code ? sousActiviteMap.get(data.sous_activite_code) : null,
          nbe_id: data.nbe_code ? nbeMap.get(data.nbe_code) : null,
          sysco_id: data.sysco_code ? syscoMap.get(data.sysco_code) : null,
          commentaire: data.commentaire || null,
          exercice: exercice || new Date().getFullYear(),
          statut: "brouillon",
          budget_import_id: importRecord.id,
        };

        const existingId = existingMap.get(data.code);
        if (existingId) {
          toUpdate.push({ id: existingId, data: budgetLine });
        } else {
          toInsert.push(budgetLine);
        }
      }

      setImportProgress(20);

      // Batch insert new lines (transactional - if one fails, all fail)
      let successCount = 0;
      let errorCount = 0;
      const errors: { row: number; message: string }[] = [];

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("budget_lines")
          .insert(toInsert);

        if (insertError) {
          // Rollback: delete the import record and mark as failed
          await supabase
            .from("budget_imports")
            .update({
              status: "echec",
              errors: [{ row: 0, message: `Import annulé: ${insertError.message}` }],
              completed_at: new Date().toISOString(),
            })
            .eq("id", importRecord.id);
          
          throw new Error(`Rollback: ${insertError.message}. Aucune ligne n'a été importée.`);
        }
        successCount += toInsert.length;
      }

      setImportProgress(60);

      // Batch update existing lines (one by one for better error handling)
      for (let i = 0; i < toUpdate.length; i++) {
        const { id, data } = toUpdate[i];
        const { error: updateError } = await supabase
          .from("budget_lines")
          .update(data)
          .eq("id", id);

        if (updateError) {
          errorCount++;
          errors.push({ row: i, message: updateError.message });
        } else {
          successCount++;
        }
        
        setImportProgress(60 + Math.round((i + 1) / toUpdate.length * 30));
      }

      setImportProgress(95);

      // Update import record with final stats
      await supabase
        .from("budget_imports")
        .update({
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors.length > 0 ? errors : null,
          status: errorCount > 0 ? "partiel" : "termine",
          completed_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id);

      // Log to audit
      await supabase.from("audit_logs").insert({
        entity_type: "budget_import",
        entity_id: importRecord.id,
        action: "import_completed",
        new_values: {
          file_name: file?.name,
          success_rows: successCount,
          error_rows: errorCount,
          total_rows: validationResult.totalRows,
        },
        exercice: exercice || new Date().getFullYear(),
      });

      setImportProgress(100);
      setCurrentStep(4);
      toast.success(`Import terminé: ${successCount} ligne(s) importée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`);
      onSuccess();
    } catch (error: any) {
      // Mark import as failed if record exists
      if (importRecordId) {
        await supabase
          .from("budget_imports")
          .update({
            status: "echec",
            errors: [{ row: 0, message: error.message }],
            completed_at: new Date().toISOString(),
          })
          .eq("id", importRecordId);
      }
      toast.error("Erreur d'import: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadErrorReport = () => {
    if (!validationResult) return;

    const lines = [
      "Ligne;Type;Message",
      ...validationResult.errors.map(e => `${e.row};Erreur;${e.message}`),
      ...validationResult.warnings.map(w => `${w.row};Avertissement;${w.message}`),
    ];

    const content = lines.join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_erreurs_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) resetState(); onOpenChange(val); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import de la structure budgétaire</DialogTitle>
          <DialogDescription>
            Assistant d'import avec validation et contrôles automatiques
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {/* Step 1: File upload */}
          {currentStep === 1 && (
            <div className="space-y-4 p-4">
              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le modèle CSV
              </Button>

              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {file ? file.name : "Glissez un fichier CSV ou cliquez pour sélectionner"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Formats acceptés: CSV, TXT (séparateur: ; ou ,)
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lecture du fichier...
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column mapping */}
          {currentStep === 2 && (
            <div className="space-y-4 p-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Fichier chargé: {file?.name}</AlertTitle>
                <AlertDescription>
                  {rawData.length} ligne(s) détectée(s). Vérifiez le mapping des colonnes.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <h4 className="font-medium">Colonnes obligatoires</h4>
                {REQUIRED_COLUMNS.map(col => (
                  <div key={col} className="flex items-center gap-4">
                    <Label className="w-40 text-right">{col}*</Label>
                    <select
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      value={columnMapping[col] || ""}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                    >
                      <option value="">-- Sélectionner --</option>
                      {fileHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    {columnMapping[col] && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                ))}

                <h4 className="font-medium mt-4">Colonnes optionnelles</h4>
                {OPTIONAL_COLUMNS.map(col => (
                  <div key={col} className="flex items-center gap-4">
                    <Label className="w-40 text-right text-muted-foreground">{col}</Label>
                    <select
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      value={columnMapping[col] || ""}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                    >
                      <option value="">-- Non mappé --</option>
                      {fileHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Aperçu des 3 premières lignes</h4>
                <div className="border rounded overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(columnMapping).filter(k => columnMapping[k]).map(col => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {Object.entries(columnMapping).filter(([, v]) => v).map(([col, source]) => (
                            <TableCell key={col}>{row[source] || "-"}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Validation */}
          {currentStep === 3 && validationResult && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-4 gap-4">
                <Card value={validationResult.totalRows} label="Total lignes" icon={FileText} />
                <Card value={validationResult.validRows} label="Valides" icon={CheckCircle} color="text-green-600" />
                <Card value={validationResult.errorRows} label="Erreurs" icon={XCircle} color="text-red-600" />
                <Card value={validationResult.warningRows} label="Avertissements" icon={AlertTriangle} color="text-yellow-600" />
              </div>

              {validationResult.duplicates.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Doublons détectés</AlertTitle>
                  <AlertDescription>
                    Codes en doublon: {validationResult.duplicates.join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="errors">
                <TabsList>
                  <TabsTrigger value="errors">
                    Erreurs ({validationResult.errors.length})
                  </TabsTrigger>
                  <TabsTrigger value="warnings">
                    Avertissements ({validationResult.warnings.length})
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    Aperçu valide
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="errors" className="max-h-60 overflow-y-auto">
                  {validationResult.errors.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucune erreur</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {validationResult.errors.slice(0, 50).map((e, i) => (
                        <li key={i} className="flex gap-2 text-red-600">
                          <span className="font-mono">L{e.row}:</span>
                          <span>{e.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="warnings" className="max-h-60 overflow-y-auto">
                  {validationResult.warnings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucun avertissement</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {validationResult.warnings.slice(0, 50).map((w, i) => (
                        <li key={i} className="flex gap-2 text-yellow-600">
                          <span className="font-mono">L{w.row}:</span>
                          <span>{w.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ligne</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Dotation</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.filter(r => r.isValid).slice(0, 10).map((row) => (
                        <TableRow key={row.rowIndex}>
                          <TableCell>{row.rowIndex}</TableCell>
                          <TableCell className="font-mono">{row.data.code}</TableCell>
                          <TableCell>{row.data.label}</TableCell>
                          <TableCell>{parseInt(row.data.dotation_initiale).toLocaleString("fr-FR")} FCFA</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">Valide</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>

              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <Button variant="outline" onClick={downloadErrorReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le rapport d'erreurs
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Import result */}
          {currentStep === 4 && (
            <div className="space-y-4 p-4 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <h3 className="text-xl font-semibold">Import terminé</h3>
              <p className="text-muted-foreground">
                {validationResult?.validRows} ligne(s) budgétaire(s) importée(s) avec succès.
              </p>
              {importId && (
                <p className="text-sm text-muted-foreground">
                  ID Import: {importId}
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Progress bar during import */}
        {isProcessing && currentStep === 3 && (
          <div className="px-4 py-2">
            <Progress value={importProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground mt-1">
              Import en cours... {importProgress}%
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {currentStep > 1 && currentStep < 4 && (
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={isProcessing}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
          )}
          
          {currentStep === 2 && (
            <Button 
              onClick={validateData} 
              disabled={isProcessing || REQUIRED_COLUMNS.some(c => !columnMapping[c])}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Valider les données
            </Button>
          )}

          {currentStep === 3 && validationResult && (
            <Button 
              onClick={executeImport} 
              disabled={isProcessing || validationResult.validRows === 0}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importer {validationResult.validRows} ligne(s)
            </Button>
          )}

          {currentStep === 4 && (
            <Button onClick={() => { resetState(); onOpenChange(false); }}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Card({ value, label, icon: Icon, color = "text-foreground" }: { 
  value: number; 
  label: string; 
  icon: any; 
  color?: string;
}) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}