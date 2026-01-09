import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface ImportJobStats {
  rows_total: number;
  rows_ok: number;
  rows_error: number;
  rows_warning: number;
  rows_new: number;
  rows_update: number;
}

export interface ImportJob {
  id: string;
  created_by: string | null;
  created_at: string;
  module: string;
  exercice_id: number | null;
  filename: string;
  storage_path: string | null;
  status: "draft" | "parsed" | "validated" | "importing" | "completed" | "failed" | "rolled_back";
  stats: ImportJobStats;
  errors_count: number;
  notes: string | null;
  completed_at: string | null;
}

export interface ImportRow {
  id: string;
  job_id: string;
  row_index: number;
  sheet_name: string | null;
  raw: Record<string, unknown>;
  normalized: Record<string, unknown> | null;
  status: "pending" | "ok" | "error" | "warning" | "imported";
  error_messages: string[];
  target_id: string | null;
  target_action: "insert" | "update" | "skip" | null;
  created_at: string;
}

export interface ParsedExcelRow {
  rowIndex: number;
  sheetName: string;
  raw: Record<string, unknown>;
  normalized?: Record<string, unknown>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const MAX_FILE_SIZE_MB = 20;

export function useImportJobs() {
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Create a new import job
  const createImportJob = useCallback(async (
    module: string,
    exerciceId: number | null,
    filename: string
  ): Promise<ImportJob | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour importer");
        return null;
      }

      const { data, error } = await supabase
        .from("import_jobs")
        .insert({
          created_by: user.id,
          module,
          exercice_id: exerciceId,
          filename,
          status: "draft",
          stats: {
            rows_total: 0,
            rows_ok: 0,
            rows_error: 0,
            rows_warning: 0,
            rows_new: 0,
            rows_update: 0,
          } as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const job = {
        ...data,
        stats: data.stats as unknown as ImportJobStats,
        status: data.status as ImportJob["status"],
      } as ImportJob;

      setCurrentJob(job);
      return job;
    } catch (error) {
      console.error("Error creating import job:", error);
      toast.error("Erreur lors de la création du job d'import");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (
    jobId: string,
    file: File
  ): Promise<string | null> => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Le fichier dépasse la limite de ${MAX_FILE_SIZE_MB} Mo`);
      return null;
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const storagePath = `${user.id}/${jobId}_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("imports")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update job with storage path
      const { error: updateError } = await supabase
        .from("import_jobs")
        .update({ storage_path: storagePath })
        .eq("id", jobId);

      if (updateError) throw updateError;

      setUploadProgress(100);
      return storagePath;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erreur lors du téléchargement du fichier");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Store parsed rows in import_rows table
  const storeImportRows = useCallback(async (
    jobId: string,
    parsedRows: ParsedExcelRow[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Delete existing rows for this job (in case of re-parse)
      await supabase
        .from("import_rows")
        .delete()
        .eq("job_id", jobId);

      // Prepare rows for insertion
      const rowsToInsert = parsedRows.map((row) => ({
        job_id: jobId,
        row_index: row.rowIndex,
        sheet_name: row.sheetName,
        raw: row.raw as unknown as Json,
        normalized: (row.normalized || null) as unknown as Json,
        status: row.isValid 
          ? (row.warnings.length > 0 ? "warning" : "ok") 
          : "error",
        error_messages: [...row.errors, ...row.warnings],
      }));

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rowsToInsert.length; i += batchSize) {
        const batch = rowsToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from("import_rows")
          .insert(batch);

        if (error) throw error;
      }

      // Calculate stats
      const okRows = parsedRows.filter(r => r.isValid && r.warnings.length === 0).length;
      const warningRows = parsedRows.filter(r => r.isValid && r.warnings.length > 0).length;
      const errorRows = parsedRows.filter(r => !r.isValid).length;

      // Update job stats and status
      const { error: updateError } = await supabase
        .from("import_jobs")
        .update({
          status: "parsed",
          stats: {
            rows_total: parsedRows.length,
            rows_ok: okRows,
            rows_error: errorRows,
            rows_warning: warningRows,
            rows_new: 0,
            rows_update: 0,
          } as unknown as Json,
          errors_count: errorRows,
        })
        .eq("id", jobId);

      if (updateError) throw updateError;

      // Log to audit
      await supabase.from("audit_logs").insert({
        action: "IMPORT_PARSED",
        entity_type: "import_jobs",
        entity_id: jobId,
        new_values: {
          total: parsedRows.length,
          ok: okRows,
          errors: errorRows,
          warnings: warningRows,
        } as unknown as Json,
      });

      return true;
    } catch (error) {
      console.error("Error storing import rows:", error);
      toast.error("Erreur lors du stockage des données");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch import rows with pagination and filters
  const fetchImportRows = useCallback(async (
    jobId: string,
    options?: {
      status?: "ok" | "error" | "warning" | "all";
      offset?: number;
      limit?: number;
    }
  ): Promise<{ rows: ImportRow[]; total: number }> => {
    try {
      let query = supabase
        .from("import_rows")
        .select("*", { count: "exact" })
        .eq("job_id", jobId)
        .order("row_index");

      if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
      }

      if (options?.offset !== undefined) {
        query = query.range(
          options.offset, 
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const rows = (data || []).map(row => ({
        ...row,
        raw: row.raw as Record<string, unknown>,
        normalized: row.normalized as Record<string, unknown> | null,
        status: row.status as ImportRow["status"],
        target_action: row.target_action as ImportRow["target_action"],
      })) as ImportRow[];

      setImportRows(rows);
      return { rows, total: count || 0 };
    } catch (error) {
      console.error("Error fetching import rows:", error);
      return { rows: [], total: 0 };
    }
  }, []);

  // Validate import (mark as ready for import)
  const validateImportJob = useCallback(async (jobId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if there are blocking errors
      const { count: errorCount } = await supabase
        .from("import_rows")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId)
        .eq("status", "error");

      if ((errorCount || 0) > 0) {
        toast.error(`Il reste ${errorCount} erreur(s) à corriger avant validation`);
        return false;
      }

      const { error } = await supabase
        .from("import_jobs")
        .update({ status: "validated" })
        .eq("id", jobId);

      if (error) throw error;

      toast.success("Import validé, prêt pour l'exécution");
      return true;
    } catch (error) {
      console.error("Error validating import:", error);
      toast.error("Erreur lors de la validation");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute import (process validated rows)
  const executeImport = useCallback(async (
    jobId: string,
    processRow: (row: ImportRow) => Promise<{ 
      success: boolean; 
      targetId?: string; 
      action?: "insert" | "update" | "skip";
      error?: string;
    }>
  ): Promise<{ success: boolean; inserted: number; updated: number; errors: number }> => {
    setIsLoading(true);
    
    try {
      // Update status to importing
      await supabase
        .from("import_jobs")
        .update({ status: "importing" })
        .eq("id", jobId);

      // Fetch all non-error rows
      const { data: rows, error: fetchError } = await supabase
        .from("import_rows")
        .select("*")
        .eq("job_id", jobId)
        .in("status", ["ok", "warning"])
        .order("row_index");

      if (fetchError) throw fetchError;

      let inserted = 0;
      let updated = 0;
      let errors = 0;

      // Process each row
      for (const row of rows || []) {
        const typedRow: ImportRow = {
          ...row,
          raw: row.raw as Record<string, unknown>,
          normalized: row.normalized as Record<string, unknown> | null,
          status: row.status as ImportRow["status"],
          target_action: row.target_action as ImportRow["target_action"],
        };

        try {
          const result = await processRow(typedRow);

          if (result.success) {
            await supabase
              .from("import_rows")
              .update({
                status: "imported",
                target_id: result.targetId || null,
                target_action: result.action || null,
              })
              .eq("id", row.id);

            if (result.action === "insert") inserted++;
            else if (result.action === "update") updated++;
          } else {
            await supabase
              .from("import_rows")
              .update({
                status: "error",
                error_messages: [...(row.error_messages || []), result.error || "Erreur inconnue"],
              })
              .eq("id", row.id);
            errors++;
          }
        } catch (err) {
          await supabase
            .from("import_rows")
            .update({
              status: "error",
              error_messages: [...(row.error_messages || []), String(err)],
            })
            .eq("id", row.id);
          errors++;
        }
      }

      // Update job status and stats
      const finalStatus = errors === 0 ? "completed" : (inserted + updated > 0 ? "completed" : "failed");
      
      await supabase
        .from("import_jobs")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          stats: {
            rows_total: rows?.length || 0,
            rows_ok: inserted + updated,
            rows_error: errors,
            rows_warning: 0,
            rows_new: inserted,
            rows_update: updated,
          } as unknown as Json,
          errors_count: errors,
        })
        .eq("id", jobId);

      // Log to audit
      await supabase.from("audit_logs").insert({
        action: "IMPORT_BUDGET",
        entity_type: "import_jobs",
        entity_id: jobId,
        new_values: {
          status: finalStatus,
          inserted,
          updated,
          errors,
        } as unknown as Json,
      });

      if (errors === 0) {
        toast.success(`Import terminé: ${inserted} créées, ${updated} mises à jour`);
      } else {
        toast.warning(`Import partiel: ${inserted + updated} réussies, ${errors} erreurs`);
      }

      return { success: errors === 0, inserted, updated, errors };
    } catch (error) {
      console.error("Error executing import:", error);
      
      await supabase
        .from("import_jobs")
        .update({ status: "failed" })
        .eq("id", jobId);

      toast.error("Erreur lors de l'exécution de l'import");
      return { success: false, inserted: 0, updated: 0, errors: 1 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark job as failed
  const markJobFailed = useCallback(async (jobId: string, notes: string): Promise<void> => {
    try {
      await supabase
        .from("import_jobs")
        .update({ 
          status: "failed",
          notes,
        })
        .eq("id", jobId);

      await supabase.from("audit_logs").insert({
        action: "IMPORT_FAILED",
        entity_type: "import_jobs",
        entity_id: jobId,
        new_values: { notes } as unknown as Json,
      });
    } catch (error) {
      console.error("Error marking job as failed:", error);
    }
  }, []);

  // Fetch a job by ID
  const fetchJob = useCallback(async (jobId: string): Promise<ImportJob | null> => {
    try {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;

      const job = {
        ...data,
        stats: data.stats as unknown as ImportJobStats,
        status: data.status as ImportJob["status"],
      } as ImportJob;

      setCurrentJob(job);
      return job;
    } catch (error) {
      console.error("Error fetching job:", error);
      return null;
    }
  }, []);

  // Export errors to CSV
  const exportErrors = useCallback(async (jobId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("import_rows")
        .select("row_index, sheet_name, raw, error_messages, status")
        .eq("job_id", jobId)
        .in("status", ["error", "warning"])
        .order("row_index");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("Aucune erreur à exporter");
        return;
      }

      const headers = ["Ligne", "Onglet", "Statut", "Erreurs", "Données brutes"];
      const rows = data.map(row => [
        row.row_index,
        row.sheet_name || "",
        row.status,
        (row.error_messages || []).join("; "),
        JSON.stringify(row.raw),
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rapport_erreurs_import_${jobId.slice(0, 8)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success("Rapport d'erreurs exporté");
    } catch (error) {
      console.error("Error exporting errors:", error);
      toast.error("Erreur lors de l'export");
    }
  }, []);

  // Fetch all import jobs with optional filters
  const fetchAllJobs = useCallback(async (options?: {
    exercice?: number;
    status?: string;
    module?: string;
    limit?: number;
  }): Promise<ImportJob[]> => {
    try {
      let query = supabase
        .from("import_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.exercice) {
        query = query.eq("exercice_id", options.exercice);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.module) {
        query = query.eq("module", options.module);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(job => ({
        ...job,
        stats: job.stats as unknown as ImportJobStats,
        status: job.status as ImportJob["status"],
      })) as ImportJob[];
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      return [];
    }
  }, []);

  // Retry a failed import (reset status to draft)
  const retryImport = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("import_jobs")
        .update({ 
          status: "draft",
          completed_at: null,
          notes: null,
        })
        .eq("id", jobId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "IMPORT_RETRY",
        entity_type: "import_jobs",
        entity_id: jobId,
      });

      toast.success("Import réinitialisé, vous pouvez le rejouer");
      return true;
    } catch (error) {
      console.error("Error retrying import:", error);
      toast.error("Erreur lors de la réinitialisation");
      return false;
    }
  }, []);

  return {
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
    fetchJob,
    exportErrors,
    fetchAllJobs,
    retryImport,
  };
}
