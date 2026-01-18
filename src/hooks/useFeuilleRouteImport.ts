/**
 * useFeuilleRouteImport - Hook pour l'import des feuilles de route par direction
 *
 * Gère l'upload, la validation, la détection des doublons et l'import batch
 * avec possibilité de rollback.
 */

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";
import * as XLSX from "xlsx";

// Types pour l'import
export interface FeuilleRouteRow {
  rowIndex: number;
  code_imput?: string;
  libelle?: string;
  direction_code?: string;
  action_code?: string;
  montant_prevu?: number;
  description?: string;
  responsable?: string;
  date_debut?: string;
  date_fin?: string;
  // Raw data for preview
  rawData: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RowValidation extends FeuilleRouteRow {
  validation: ValidationResult;
  isDuplicate: boolean;
  existingId?: string;
  action: "create" | "update" | "skip";
}

export interface ImportStats {
  total: number;
  toCreate: number;
  toUpdate: number;
  toSkip: number;
  duplicates: number;
  errors: number;
  warnings: number;
}

export interface ImportBatch {
  id: string;
  filename: string;
  directionId: string;
  exerciceId: string;
  stats: ImportStats;
  status: "pending" | "in_progress" | "completed" | "error" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

export interface ColumnMapping {
  code_imput: string | null;
  libelle: string | null;
  direction_code: string | null;
  action_code: string | null;
  montant_prevu: string | null;
  description: string | null;
  responsable: string | null;
  date_debut: string | null;
  date_fin: string | null;
}

const DEFAULT_MAPPING: ColumnMapping = {
  code_imput: null,
  libelle: null,
  direction_code: null,
  action_code: null,
  montant_prevu: null,
  description: null,
  responsable: null,
  date_debut: null,
  date_fin: null,
};

// Colonnes détectables automatiquement
const AUTO_DETECT_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  code_imput: [/code.*imput/i, /^code$/i, /code.*activite/i, /^imput/i],
  libelle: [/libelle/i, /^lib/i, /designation/i, /^activite$/i, /^nom$/i],
  direction_code: [/direction/i, /^dir$/i, /code.*dir/i],
  action_code: [/action/i, /code.*action/i],
  montant_prevu: [/montant/i, /budget/i, /prevision/i, /allocation/i],
  description: [/description/i, /^desc$/i, /detail/i],
  responsable: [/responsable/i, /resp/i, /charge/i],
  date_debut: [/date.*debut/i, /debut/i, /start/i],
  date_fin: [/date.*fin/i, /fin/i, /end/i, /echeance/i],
};

export function useFeuilleRouteImport() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const { exerciceId } = useExercice();

  // State
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [validatedRows, setValidatedRows] = useState<RowValidation[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

  // Fetch directions for selection
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label, sigle")
        .eq("est_active", true)
        .order("code");

      if (error) throw error;
      return data;
    },
  });

  // Fetch existing activities for duplicate detection
  const { data: existingActivities = [] } = useQuery({
    queryKey: ["existing-activities", exerciceId, selectedDirection],
    queryFn: async () => {
      if (!exerciceId || !selectedDirection) return [];

      const { data, error } = await supabase
        .from("activites")
        .select("id, code, libelle, direction_id, exercice_id")
        .eq("exercice_id", exerciceId)
        .eq("direction_id", selectedDirection);

      if (error) throw error;
      return data;
    },
    enabled: !!exerciceId && !!selectedDirection,
  });

  // Parse Excel/CSV file
  const parseFile = useCallback(async (uploadedFile: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          // Parse to JSON
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

          if (jsonData.length < 2) {
            throw new Error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données");
          }

          // Extract headers (first row)
          const fileHeaders = (jsonData[0] as string[]).map((h) =>
            String(h || "").trim()
          );

          // Extract data rows
          const rows: Record<string, unknown>[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];
            if (row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
              const rowObj: Record<string, unknown> = {};
              fileHeaders.forEach((header, idx) => {
                rowObj[header] = row[idx];
              });
              rows.push(rowObj);
            }
          }

          setHeaders(fileHeaders);
          setRawData(rows);
          setFile(uploadedFile);

          // Auto-detect mapping
          const autoMapping = autoDetectMapping(fileHeaders);
          setMapping(autoMapping);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsBinaryString(uploadedFile);
    });
  }, []);

  // Auto-detect column mapping
  const autoDetectMapping = (fileHeaders: string[]): ColumnMapping => {
    const detected: ColumnMapping = { ...DEFAULT_MAPPING };

    for (const [field, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
      for (const header of fileHeaders) {
        for (const pattern of patterns) {
          if (pattern.test(header)) {
            detected[field as keyof ColumnMapping] = header;
            break;
          }
        }
        if (detected[field as keyof ColumnMapping]) break;
      }
    }

    return detected;
  };

  // Map raw data to typed rows
  const mapRows = useCallback((): FeuilleRouteRow[] => {
    return rawData.map((row, index) => ({
      rowIndex: index + 2, // +2 for 1-based indexing + header row
      code_imput: mapping.code_imput ? String(row[mapping.code_imput] || "").trim() : undefined,
      libelle: mapping.libelle ? String(row[mapping.libelle] || "").trim() : undefined,
      direction_code: mapping.direction_code ? String(row[mapping.direction_code] || "").trim() : undefined,
      action_code: mapping.action_code ? String(row[mapping.action_code] || "").trim() : undefined,
      montant_prevu: mapping.montant_prevu ? parseFloat(String(row[mapping.montant_prevu] || 0)) : undefined,
      description: mapping.description ? String(row[mapping.description] || "").trim() : undefined,
      responsable: mapping.responsable ? String(row[mapping.responsable] || "").trim() : undefined,
      date_debut: mapping.date_debut ? parseDate(row[mapping.date_debut]) : undefined,
      date_fin: mapping.date_fin ? parseDate(row[mapping.date_fin]) : undefined,
      rawData: row,
    }));
  }, [rawData, mapping]);

  // Validate rows and detect duplicates
  const validateRows = useCallback(async (): Promise<RowValidation[]> => {
    const mappedRows = mapRows();
    const validations: RowValidation[] = [];

    for (const row of mappedRows) {
      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      // Required field validation
      if (!row.code_imput) {
        validation.errors.push("Code imputation manquant");
        validation.isValid = false;
      }

      if (!row.libelle) {
        validation.errors.push("Libellé manquant");
        validation.isValid = false;
      }

      // Montant validation
      if (row.montant_prevu !== undefined && isNaN(row.montant_prevu)) {
        validation.warnings.push("Montant invalide, sera ignoré");
      }

      // Date validation
      if (row.date_debut && !isValidDate(row.date_debut)) {
        validation.warnings.push("Date début invalide");
      }

      if (row.date_fin && !isValidDate(row.date_fin)) {
        validation.warnings.push("Date fin invalide");
      }

      // Duplicate detection
      const existing = existingActivities.find(
        (a) =>
          a.code === row.code_imput ||
          (a.libelle?.toLowerCase() === row.libelle?.toLowerCase())
      );

      const isDuplicate = !!existing;
      let action: RowValidation["action"] = "create";

      if (isDuplicate) {
        if (existing.code === row.code_imput) {
          validation.warnings.push(`Doublon détecté: code "${row.code_imput}" existe déjà`);
          action = "skip"; // Skip exact code duplicates
        } else {
          validation.warnings.push(`Libellé similaire trouvé: "${existing.libelle}"`);
          action = "create"; // Allow create with warning for similar labels
        }
      }

      validations.push({
        ...row,
        validation,
        isDuplicate,
        existingId: existing?.id,
        action,
      });
    }

    setValidatedRows(validations);

    // Calculate stats
    const newStats: ImportStats = {
      total: validations.length,
      toCreate: validations.filter((v) => v.action === "create" && v.validation.isValid).length,
      toUpdate: validations.filter((v) => v.action === "update").length,
      toSkip: validations.filter((v) => v.action === "skip").length,
      duplicates: validations.filter((v) => v.isDuplicate).length,
      errors: validations.filter((v) => !v.validation.isValid).length,
      warnings: validations.filter((v) => v.validation.warnings.length > 0).length,
    };
    setStats(newStats);

    return validations;
  }, [mapRows, existingActivities]);

  // Execute import
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!exerciceId || !selectedDirection || !file) {
        throw new Error("Direction et exercice requis");
      }

      const rowsToImport = validatedRows.filter(
        (v) => v.action === "create" && v.validation.isValid
      );

      if (rowsToImport.length === 0) {
        throw new Error("Aucune ligne valide à importer");
      }

      // Create import batch record
      const batchId = crypto.randomUUID();
      setCurrentBatchId(batchId);

      const { data: userData } = await supabase.auth.getUser();

      // Create import log
      const { error: logError } = await supabase.from("import_logs").insert({
        id: batchId,
        type_import: "activites",
        nom_fichier: file.name,
        format_fichier: file.name.endsWith(".csv") ? "csv" : "xlsx",
        taille_fichier: file.size,
        nb_lignes_total: validatedRows.length,
        nb_lignes_importees: 0,
        nb_lignes_erreur: stats?.errors || 0,
        nb_lignes_ignorees: stats?.toSkip || 0,
        statut: "en_cours",
        exercice_id: exerciceId,
        user_id: userData.user?.id,
        started_at: new Date().toISOString(),
      });

      if (logError) throw logError;

      // Prepare activities for insert
      const activitiesToInsert = rowsToImport.map((row) => ({
        code: row.code_imput,
        libelle: row.libelle,
        direction_id: selectedDirection,
        exercice_id: exerciceId,
        plan_travail_id: null, // Can be linked later
        est_active: true,
        import_batch_id: batchId,
        // Metadata stored as JSONB if needed
      }));

      // Batch insert
      const { data: insertedData, error: insertError } = await supabase
        .from("activites")
        .insert(activitiesToInsert)
        .select("id");

      if (insertError) {
        // Update import log with error
        await supabase
          .from("import_logs")
          .update({
            statut: "erreur",
            message: insertError.message,
            erreurs: [{ message: insertError.message }],
            completed_at: new Date().toISOString(),
          })
          .eq("id", batchId);

        throw insertError;
      }

      // Update import log with success
      await supabase
        .from("import_logs")
        .update({
          nb_lignes_importees: insertedData?.length || 0,
          statut: "termine",
          message: `${insertedData?.length || 0} activités importées avec succès`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchId);

      // Audit log
      await logAction({
        entityType: "activites",
        entityId: batchId,
        action: "CREATE",
        newValues: {
          type: "batch_import",
          filename: file.name,
          direction_id: selectedDirection,
          count: insertedData?.length || 0,
        },
      });

      return {
        batchId,
        importedCount: insertedData?.length || 0,
      };
    },
    onSuccess: (result) => {
      toast.success(`${result.importedCount} activités importées avec succès`);
      queryClient.invalidateQueries({ queryKey: ["existing-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activites"] });
      queryClient.invalidateQueries({ queryKey: ["import-logs"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });

  // Rollback import batch
  const rollbackMutation = useMutation({
    mutationFn: async (batchId: string) => {
      // Check if any activities from this batch are linked to engagements
      const { data: linkedActivities, error: checkError } = await supabase
        .from("activites")
        .select(`
          id,
          budget_engagements(id)
        `)
        .eq("import_batch_id", batchId);

      if (checkError) throw checkError;

      const hasEngagements = linkedActivities?.some(
        (a) => a.budget_engagements && (a.budget_engagements as unknown[]).length > 0
      );

      if (hasEngagements) {
        throw new Error("Impossible d'annuler: des engagements sont liés à ces activités");
      }

      // Delete activities from batch
      const { error: deleteError } = await supabase
        .from("activites")
        .delete()
        .eq("import_batch_id", batchId);

      if (deleteError) throw deleteError;

      // Update import log
      await supabase
        .from("import_logs")
        .update({
          statut: "annule",
          message: "Import annulé par l'utilisateur",
        })
        .eq("id", batchId);

      // Audit log
      await logAction({
        entityType: "activites",
        entityId: batchId,
        action: "DELETE",
        newValues: {
          type: "batch_rollback",
          batch_id: batchId,
        },
      });

      return batchId;
    },
    onSuccess: () => {
      toast.success("Import annulé avec succès");
      queryClient.invalidateQueries({ queryKey: ["existing-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activites"] });
      queryClient.invalidateQueries({ queryKey: ["import-logs"] });
      setCurrentBatchId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'annulation: ${error.message}`);
    },
  });

  // Fetch import history
  const { data: importHistory = [] } = useQuery({
    queryKey: ["import-logs", "activites", selectedDirection],
    queryFn: async () => {
      let query = supabase
        .from("import_logs")
        .select("*")
        .eq("type_import", "activites")
        .order("started_at", { ascending: false })
        .limit(20);

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  // Reset state
  const reset = useCallback(() => {
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setMapping(DEFAULT_MAPPING);
    setValidatedRows([]);
    setStats(null);
    setCurrentBatchId(null);
  }, []);

  // Update single row action
  const updateRowAction = useCallback(
    (rowIndex: number, action: RowValidation["action"]) => {
      setValidatedRows((prev) =>
        prev.map((row) =>
          row.rowIndex === rowIndex ? { ...row, action } : row
        )
      );

      // Recalculate stats
      setStats((prev) => {
        if (!prev) return null;
        const updated = validatedRows.map((row) =>
          row.rowIndex === rowIndex ? { ...row, action } : row
        );
        return {
          ...prev,
          toCreate: updated.filter((v) => v.action === "create" && v.validation.isValid).length,
          toUpdate: updated.filter((v) => v.action === "update").length,
          toSkip: updated.filter((v) => v.action === "skip").length,
        };
      });
    },
    [validatedRows]
  );

  return {
    // State
    file,
    rawData,
    headers,
    mapping,
    validatedRows,
    stats,
    currentBatchId,
    selectedDirection,
    directions,
    existingActivities,
    importHistory,

    // Actions
    parseFile,
    setMapping,
    setSelectedDirection,
    validateRows,
    updateRowAction,
    reset,

    // Mutations
    executeImport: importMutation.mutateAsync,
    isImporting: importMutation.isPending,

    rollbackImport: rollbackMutation.mutateAsync,
    isRollingBack: rollbackMutation.isPending,
  };
}

// Helper functions
function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;

  // Handle Excel date serial numbers
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }

  // Handle string dates
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    // Try DD/MM/YYYY format
    const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  return undefined;
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export default useFeuilleRouteImport;
