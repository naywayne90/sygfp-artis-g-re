import { useState, useCallback, useEffect } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileSpreadsheet, 
  Loader2, 
  FileDown, 
  AlertCircle,
  FileWarning,
  LayoutTemplate
} from "lucide-react";
import * as XLSX from "xlsx";

// Template column definitions matching Feuil3/Table15 structure
const TEMPLATE_COLUMNS = [
  { key: "imputation", header: "Imputation", width: 20 },
  { key: "os", header: "OS", width: 8 },
  { key: "action", header: "Action", width: 10 },
  { key: "activite", header: "Activité", width: 12 },
  { key: "sous_activite", header: "Sous-activité", width: 15 },
  { key: "libelle", header: "Libellé projet", width: 40 },
  { key: "direction", header: "Direction", width: 12 },
  { key: "nature_depense", header: "Nature dépense", width: 15 },
  { key: "nbe", header: "NBE", width: 12 },
  { key: "budget_initial", header: "Budget initial", width: 18 },
  { key: "direction_execution", header: "Direction charge exécution", width: 25 },
];

interface ImportRun {
  id: string;
  filename: string;
  created_at: string;
  status: string;
  total_rows: number;
  ok_rows: number;
  error_rows: number;
}

export function BudgetExport() {
  const { exercice } = useExercice();
  const [selectedExercice, setSelectedExercice] = useState<number>(exercice || new Date().getFullYear());
  const [isExportingTemplate, setIsExportingTemplate] = useState(false);
  const [isExportingBudget, setIsExportingBudget] = useState(false);
  const [isExportingErrors, setIsExportingErrors] = useState(false);
  const [importRuns, setImportRuns] = useState<ImportRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [budgetLineCount, setBudgetLineCount] = useState<number>(0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch import runs with errors
  useEffect(() => {
    const fetchImportRuns = async () => {
      const { data, error } = await supabase
        .from("import_runs")
        .select("id, filename, created_at, status, total_rows, ok_rows, error_rows")
        .eq("exercice_id", String(selectedExercice))
        .gt("error_rows", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setImportRuns(data);
        if (data.length > 0 && !selectedRunId) {
          setSelectedRunId(data[0].id);
        }
      }
    };

    const fetchBudgetLineCount = async () => {
      const { count, error } = await supabase
        .from("budget_lines")
        .select("*", { count: "exact", head: true })
        .eq("exercice", selectedExercice);

      if (!error && count !== null) {
        setBudgetLineCount(count);
      }
    };

    fetchImportRuns();
    fetchBudgetLineCount();
  }, [selectedExercice]);

  // Export empty template
  const handleExportTemplate = useCallback(async () => {
    setIsExportingTemplate(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create headers array
      const headers = TEMPLATE_COLUMNS.map(col => col.header);
      
      // Create worksheet with headers only
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths
      worksheet["!cols"] = TEMPLATE_COLUMNS.map(col => ({ wch: col.width }));
      
      // Add the sheet
      XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");
      
      // Add a reference sheet with instructions
      const instructions = [
        ["Instructions de remplissage du template budget"],
        [""],
        ["Colonnes obligatoires:"],
        ["- Imputation: Code unique de la ligne budgétaire (17 ou 19 chiffres)"],
        ["- Budget initial: Montant de la dotation en FCFA"],
        [""],
        ["Colonnes optionnelles (si Imputation non fournie):"],
        ["- OS: Code de l'Objectif Stratégique (2 chiffres)"],
        ["- Action: Code de l'Action (2 chiffres, optionnel)"],
        ["- Activité: Code de l'Activité (3 chiffres)"],
        ["- Sous-activité: Code de la Sous-activité (3 chiffres)"],
        ["- Direction: Code de la Direction (2 chiffres)"],
        ["- Nature dépense: Code de la nature (1 chiffre)"],
        ["- NBE: Code nomenclature (6 chiffres)"],
        [""],
        ["Format accepté pour les codes:"],
        ["- Numérique: 01, 123, 671700"],
        ["- Texte: \"01 - Libellé\", \"671700 : Description\""],
        [""],
        ["Le système extrait automatiquement les codes numériques."],
      ];
      
      const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
      instructionSheet["!cols"] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");
      
      const fileName = `Template_Budget_${selectedExercice}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Template exporté: ${fileName}`);
    } catch (error) {
      console.error("Export template error:", error);
      toast.error("Erreur lors de l'export du template");
    } finally {
      setIsExportingTemplate(false);
    }
  }, [selectedExercice]);

  // Export budget lines
  const handleExportBudget = useCallback(async () => {
    setIsExportingBudget(true);
    
    try {
      // Fetch budget lines with related data
      const { data: lines, error } = await supabase
        .from("budget_lines")
        .select(`
          code,
          label,
          dotation_initiale,
          direction_id,
          os_id,
          activite_id,
          sous_activite_id,
          nbe_id,
          directions:direction_id(code, label),
          objectifs_strategiques:os_id(code, libelle),
          activites:activite_id(code, libelle),
          sous_activites:sous_activite_id(code, libelle),
          nomenclature_nbe:nbe_id(code, libelle)
        `)
        .eq("exercice", selectedExercice)
        .order("code");

      if (error) throw error;

      if (!lines || lines.length === 0) {
        toast.warning("Aucune ligne budgétaire à exporter pour cet exercice");
        return;
      }

      // Transform data to match template format
      const exportData = lines.map((line: any) => ({
        "Imputation": line.code || "",
        "OS": line.objectifs_strategiques?.code || "",
        "Action": "", // Not directly stored, would need to parse from code
        "Activité": line.activites?.code || "",
        "Sous-activité": line.sous_activites?.code || "",
        "Libellé projet": line.label || "",
        "Direction": line.directions?.code ? `${line.directions.code} - ${line.directions.label || ""}` : "",
        "Nature dépense": "", // Extracted from code if needed
        "NBE": line.nomenclature_nbe?.code ? `${line.nomenclature_nbe.code} : ${line.nomenclature_nbe.libelle || ""}` : "",
        "Budget initial": line.dotation_initiale || 0,
        "Direction charge exécution": line.directions?.label || "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      worksheet["!cols"] = TEMPLATE_COLUMNS.map(col => ({ wch: col.width }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");
      
      const fileName = `Budget_${selectedExercice}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Budget exporté: ${lines.length} lignes`);
    } catch (error) {
      console.error("Export budget error:", error);
      toast.error("Erreur lors de l'export du budget");
    } finally {
      setIsExportingBudget(false);
    }
  }, [selectedExercice]);

  // Export error report
  const handleExportErrors = useCallback(async () => {
    if (!selectedRunId) {
      toast.error("Sélectionnez un import à analyser");
      return;
    }

    setIsExportingErrors(true);
    
    try {
      // Fetch staging data with errors
      const { data: stagingData, error } = await supabase
        .from("import_budget_staging")
        .select("*")
        .eq("run_id", selectedRunId)
        .eq("validation_status", "error")
        .order("row_number");

      if (error) throw error;

      if (!stagingData || stagingData.length === 0) {
        toast.info("Aucune erreur trouvée pour cet import");
        return;
      }

      // Get run info
      const run = importRuns.find(r => r.id === selectedRunId);

      // Transform data for export
      const exportData = stagingData.map((row: any) => ({
        "Ligne": row.row_number,
        "Statut": row.validation_status,
        "Erreurs": row.validation_errors || "",
        "Imputation fichier": row.raw_imputation || "",
        "Imputation calculée": row.computed_imputation || "",
        "OS": row.raw_os || "",
        "Action": row.raw_action || "",
        "Activité": row.raw_activite || "",
        "Sous-activité": row.raw_sous_activite || "",
        "Direction": row.raw_direction || "",
        "Nature dépense": row.raw_nature_depense || "",
        "NBE": row.raw_nbe || "",
        "NBE calculé": row.computed_nbe_code || "",
        "Montant": row.raw_montant || "",
      }));

      const workbook = XLSX.utils.book_new();
      
      // Error details sheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 8 },  // Ligne
        { wch: 10 }, // Statut
        { wch: 50 }, // Erreurs
        { wch: 20 }, // Imputation fichier
        { wch: 20 }, // Imputation calculée
        { wch: 15 }, // OS
        { wch: 15 }, // Action
        { wch: 15 }, // Activité
        { wch: 15 }, // Sous-activité
        { wch: 15 }, // Direction
        { wch: 15 }, // Nature dépense
        { wch: 15 }, // NBE
        { wch: 15 }, // NBE calculé
        { wch: 15 }, // Montant
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Erreurs");

      // Summary sheet
      const summary = [
        ["Rapport d'erreurs d'import"],
        [""],
        ["Fichier source:", run?.filename || "Inconnu"],
        ["Date import:", run ? new Date(run.created_at).toLocaleString("fr-FR") : ""],
        [""],
        ["Statistiques:"],
        ["Total lignes:", run?.total_rows || 0],
        ["Lignes valides:", run?.ok_rows || 0],
        ["Lignes en erreur:", run?.error_rows || 0],
        [""],
        ["Erreurs fréquentes:"],
      ];

      // Count error types
      const errorCounts: Record<string, number> = {};
      stagingData.forEach((row: any) => {
        if (row.validation_errors) {
          const errors = row.validation_errors.split(";");
          errors.forEach((err: string) => {
            const cleanErr = err.trim().split(":")[0].trim();
            errorCounts[cleanErr] = (errorCounts[cleanErr] || 0) + 1;
          });
        }
      });

      Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([err, count]) => {
          summary.push([`- ${err}:`, count]);
        });

      const summarySheet = XLSX.utils.aoa_to_sheet(summary);
      summarySheet["!cols"] = [{ wch: 30 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Résumé");

      const fileName = `Erreurs_Import_${selectedExercice}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Rapport d'erreurs exporté: ${stagingData.length} erreur(s)`);
    } catch (error) {
      console.error("Export errors error:", error);
      toast.error("Erreur lors de l'export du rapport");
    } finally {
      setIsExportingErrors(false);
    }
  }, [selectedRunId, selectedExercice, importRuns]);

  return (
    <div className="space-y-6">
      {/* Exercice selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercice budgétaire</CardTitle>
          <CardDescription>
            Sélectionnez l'exercice pour les exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="export-exercice">Exercice</Label>
            <Select
              value={String(selectedExercice)}
              onValueChange={(v) => setSelectedExercice(parseInt(v))}
            >
              <SelectTrigger id="export-exercice" className="mt-1.5">
                <SelectValue placeholder="Sélectionner l'exercice" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year} {year === currentYear && "(actif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Template de chargement
          </CardTitle>
          <CardDescription>
            Télécharger un fichier Excel vide avec la structure attendue pour l'import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Format: Feuil3 / Table15 compatible
              </p>
              <p className="text-xs text-muted-foreground">
                Colonnes: Imputation, OS, Action, Activité, Sous-activité, Direction, NBE, Budget initial...
              </p>
            </div>
            <Button
              onClick={handleExportTemplate}
              disabled={isExportingTemplate}
              variant="outline"
              className="gap-2"
            >
              {isExportingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Exporter Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Budget de l'exercice
          </CardTitle>
          <CardDescription>
            Exporter toutes les lignes budgétaires dans le format standard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{budgetLineCount} ligne(s)</Badge>
                <span className="text-sm text-muted-foreground">
                  pour l'exercice {selectedExercice}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Export pré-rempli au même format que le template d'import
              </p>
            </div>
            <Button
              onClick={handleExportBudget}
              disabled={isExportingBudget || budgetLineCount === 0}
              className="gap-2"
            >
              {isExportingBudget ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter Budget
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Export Error Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-destructive" />
            Rapport d'erreurs d'import
          </CardTitle>
          <CardDescription>
            Exporter les erreurs d'un import précédent pour correction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importRuns.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun import avec erreurs trouvé pour l'exercice {selectedExercice}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="import-run">Import à analyser</Label>
                <Select
                  value={selectedRunId || ""}
                  onValueChange={setSelectedRunId}
                >
                  <SelectTrigger id="import-run">
                    <SelectValue placeholder="Sélectionner un import" />
                  </SelectTrigger>
                  <SelectContent>
                    {importRuns.map((run) => (
                      <SelectItem key={run.id} value={run.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{run.filename}</span>
                          <Badge variant="destructive" className="text-xs">
                            {run.error_rows} erreur(s)
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRunId && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const run = importRuns.find(r => r.id === selectedRunId);
                      if (!run) return null;
                      return (
                        <span>
                          {new Date(run.created_at).toLocaleDateString("fr-FR")} - {run.error_rows} erreur(s) sur {run.total_rows} lignes
                        </span>
                      );
                    })()}
                  </div>
                  <Button
                    onClick={handleExportErrors}
                    disabled={isExportingErrors}
                    variant="destructive"
                    className="gap-2"
                  >
                    {isExportingErrors ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileWarning className="h-4 w-4" />
                    )}
                    Exporter Erreurs
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
