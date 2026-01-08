import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ParsedRow } from "./useExcelParser";

export interface ImportRun {
  id: string;
  exercice_id: string;
  filename: string;
  sheet_name: string;
  status: "draft" | "validated" | "imported" | "failed";
  total_rows: number;
  ok_rows: number;
  error_rows: number;
}

export function useImportStaging() {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new import run
  const createImportRun = useCallback(async (
    exercice: number,
    filename: string,
    sheetName: string
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_import_run", {
        p_exercice: exercice,
        p_filename: filename,
        p_sheet_name: sheetName,
      });

      if (error) throw error;

      const runId = data as string;
      setCurrentRunId(runId);
      
      // Log the creation
      await supabase.rpc("log_import_event", {
        p_run_id: runId,
        p_level: "info",
        p_message: `Import run created for file: ${filename}, sheet: ${sheetName}`,
      });

      return runId;
    } catch (error) {
      console.error("Error creating import run:", error);
      toast.error("Erreur lors de la création de l'import");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load parsed rows into staging table
  const loadStagingData = useCallback(async (
    runId: string,
    parsedRows: ParsedRow[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Clear any existing staging data for this run
      await supabase
        .from("import_budget_staging")
        .delete()
        .eq("run_id", runId);

      // Prepare staging records
      const stagingRecords = parsedRows.map((row) => {
        // Combine errors and warnings for validation_errors field
        const allMessages = [
          ...row.errors,
          ...row.warnings.map(w => `[Warning] ${w}`)
        ];
        
        return {
          run_id: runId,
          row_number: row.rowNumber,
          raw_imputation: row.raw.imputation,
          raw_os: row.raw.os,
          raw_action: row.raw.action,
          raw_activite: row.raw.activite,
          raw_sous_activite: row.raw.sousActivite,
          raw_direction: row.raw.direction,
          raw_nature_depense: row.raw.natureDepense,
          raw_nbe: row.raw.nbe,
          raw_montant: row.raw.montant,
          computed_imputation: row.computed.calculatedImputation || row.computed.imputation,
          computed_nbe_code: row.computed.nbeCode,
          computed_nature_depense_code: row.computed.natureDepenseCode?.toString() || null,
          validation_status: row.isValid ? (row.warnings.length > 0 ? "warning" : "ok") : "error",
          validation_errors: allMessages.length > 0 ? allMessages.join("; ") : null,
        };
      });

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < stagingRecords.length; i += batchSize) {
        const batch = stagingRecords.slice(i, i + batchSize);
        const { error } = await supabase
          .from("import_budget_staging")
          .insert(batch);

        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
      }

      // Update run statistics
      const okRows = parsedRows.filter(r => r.isValid).length;
      const errorRows = parsedRows.filter(r => !r.isValid).length;

      await supabase.rpc("update_import_run_stats", {
        p_run_id: runId,
        p_total_rows: parsedRows.length,
        p_ok_rows: okRows,
        p_error_rows: errorRows,
      });

      // Log the loading
      await supabase.rpc("log_import_event", {
        p_run_id: runId,
        p_level: "info",
        p_message: `Loaded ${parsedRows.length} rows into staging (${okRows} valid, ${errorRows} errors)`,
      });

      return true;
    } catch (error) {
      console.error("Error loading staging data:", error);
      toast.error("Erreur lors du chargement des données");
      
      await supabase.rpc("log_import_event", {
        p_run_id: runId,
        p_level: "error",
        p_message: `Failed to load staging data: ${error}`,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate the import run
  const validateImportRun = useCallback(async (runId: string): Promise<{
    success: boolean;
    okRows: number;
    errorRows: number;
    errors: Array<{ row: number; message: string }>;
  }> => {
    setIsLoading(true);
    try {
      // Fetch staging data with errors
      const { data: stagingData, error: fetchError } = await supabase
        .from("import_budget_staging")
        .select("row_number, validation_status, validation_errors")
        .eq("run_id", runId)
        .order("row_number");

      if (fetchError) throw fetchError;

      const errors: Array<{ row: number; message: string }> = [];
      let okRows = 0;
      let errorRows = 0;

      stagingData?.forEach((row) => {
        if (row.validation_status === "ok") {
          okRows++;
        } else {
          errorRows++;
          if (row.validation_errors) {
            errors.push({
              row: row.row_number,
              message: row.validation_errors,
            });
          }
        }
      });

      // Check for duplicates within the import
      const { data: duplicates, error: dupError } = await supabase
        .from("import_budget_staging")
        .select("computed_imputation, row_number")
        .eq("run_id", runId)
        .not("computed_imputation", "is", null);

      if (!dupError && duplicates) {
        const imputationCounts = new Map<string, number[]>();
        duplicates.forEach((row) => {
          if (row.computed_imputation) {
            if (!imputationCounts.has(row.computed_imputation)) {
              imputationCounts.set(row.computed_imputation, []);
            }
            imputationCounts.get(row.computed_imputation)!.push(row.row_number);
          }
        });

        imputationCounts.forEach((rows, imputation) => {
          if (rows.length > 1) {
            rows.slice(1).forEach((rowNum) => {
              errors.push({
                row: rowNum,
                message: `Doublon d'imputation: "${imputation}" (première occurrence ligne ${rows[0]})`,
              });
            });
          }
        });
      }

      // Update validation status if no blocking errors
      if (errorRows === 0 && errors.length === 0) {
        await supabase.rpc("validate_import_run", { p_run_id: runId });
      }

      return {
        success: errorRows === 0 && errors.length === 0,
        okRows,
        errorRows: errorRows + errors.filter(e => !stagingData?.some(s => s.row_number === e.row && s.validation_status === "error")).length,
        errors,
      };
    } catch (error) {
      console.error("Error validating import:", error);
      return {
        success: false,
        okRows: 0,
        errorRows: 0,
        errors: [{ row: 0, message: String(error) }],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute the final import from staging to budget_lines
  const executeImport = useCallback(async (runId: string): Promise<{
    success: boolean;
    importedCount: number;
    insertedCount: number;
    updatedCount: number;
    errorCount: number;
  }> => {
    setIsLoading(true);
    try {
      const result = await supabase.rpc("finalize_import_run", { p_run_id: runId });

      if (result.error) throw result.error;

      const data = result.data as { 
        success: boolean;
        imported_count: number;
        inserted: number;
        updated: number;
        error_count: number;
      };
      
      return {
        success: data.success && data.error_count === 0,
        importedCount: data.imported_count,
        insertedCount: data.inserted || 0,
        updatedCount: data.updated || 0,
        errorCount: data.error_count,
      };
    } catch (error) {
      console.error("Error executing import:", error);
      
      await supabase.rpc("log_import_event", {
        p_run_id: runId,
        p_level: "error",
        p_message: `Import failed: ${error}`,
      });
      
      return {
        success: false,
        importedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        errorCount: 1,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get staging data for preview
  const getStagingData = useCallback(async (runId: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from("import_budget_staging")
      .select("*")
      .eq("run_id", runId)
      .order("row_number")
      .limit(limit);

    if (error) {
      console.error("Error fetching staging data:", error);
      return [];
    }

    return data || [];
  }, []);

  return {
    currentRunId,
    isLoading,
    createImportRun,
    loadStagingData,
    validateImportRun,
    executeImport,
    getStagingData,
  };
}
