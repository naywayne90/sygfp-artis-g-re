/**
 * useBudgetImport - Hook pour gérer l'import des lignes budgétaires
 *
 * Fonctionnalités:
 * - Création d'import avec tracking via budget_imports
 * - Rollback/Annulation d'un import complet via budget_import_id
 * - Historique des imports avec statistiques
 * - Intégration avec import_logs pour traçabilité
 * - Suivi de progression en temps réel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import type { TablesInsert } from '@/integrations/supabase/types';

// ============================================
// TYPES
// ============================================

export interface BudgetImportRecord {
  id: string;
  exercice: number;
  file_name: string;
  file_size: number | null;
  total_rows: number;
  success_rows: number | null;
  error_rows: number | null;
  status: 'en_cours' | 'termine' | 'partiel' | 'echec' | 'annule';
  errors: ImportError[] | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  user_id: string | null;
  user?: { full_name: string } | null;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  isUpdate: boolean; // true si le code existe déjà
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newRows: number;
  updateRows: number;
  errors: ImportError[];
  warnings: ImportError[];
  duplicates: string[];
  parsedRows: ImportPreviewRow[];
}

export interface ImportExecutionResult {
  importId: string;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
}

const BATCH_SIZE = 100;

// ============================================
// HOOK
// ============================================

export function useBudgetImport() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  });

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer l'historique des imports
  const {
    data: importHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['budget-imports', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_imports')
        .select(
          `
          *,
          user:profiles!budget_imports_user_id_fkey(full_name)
        `
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BudgetImportRecord[];
    },
    enabled: !!exercice,
  });

  // Compter les lignes par import
  const getImportLineCount = useCallback(async (importId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('budget_lines')
      .select('*', { count: 'exact', head: true })
      .eq('budget_import_id', importId);

    if (error) throw error;
    return count || 0;
  }, []);

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer un enregistrement d'import
  const createImportRecord = useMutation({
    mutationFn: async (params: { fileName: string; fileSize?: number; totalRows: number }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('budget_imports')
        .insert({
          exercice: exercice || new Date().getFullYear(),
          file_name: params.fileName,
          file_size: params.fileSize,
          total_rows: params.totalRows,
          status: 'en_cours',
          user_id: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Finaliser un import
  const finalizeImport = useMutation({
    mutationFn: async (params: {
      importId: string;
      successRows: number;
      errorRows: number;
      errors?: ImportError[];
    }) => {
      const status =
        params.errorRows > 0 ? (params.successRows > 0 ? 'partiel' : 'echec') : 'termine';

      const { error } = await supabase
        .from('budget_imports')
        .update({
          success_rows: params.successRows,
          error_rows: params.errorRows,
          errors: params.errors || null,
          status,
          completed_at: new Date().toISOString(),
        })
        .eq('id', params.importId);

      if (error) throw error;

      // Log dans audit_logs
      await supabase.from('audit_logs').insert({
        entity_type: 'budget_import',
        entity_id: params.importId,
        action: 'IMPORT_COMPLETE',
        new_values: {
          success_rows: params.successRows,
          error_rows: params.errorRows,
          status,
        },
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-imports'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
    },
  });

  // Annuler/Rollback un import
  const rollbackImport = useMutation({
    mutationFn: async (importId: string) => {
      // 1. Vérifier que l'import existe et peut être annulé
      const { data: importRecord, error: fetchError } = await supabase
        .from('budget_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (fetchError) throw new Error('Import non trouvé');
      if (importRecord.status === 'annule') {
        throw new Error('Cet import a déjà été annulé');
      }

      // 2. Compter les lignes liées à cet import
      const { count: lineCount } = await supabase
        .from('budget_lines')
        .select('*', { count: 'exact', head: true })
        .eq('budget_import_id', importId);

      if (!lineCount || lineCount === 0) {
        throw new Error('Aucune ligne associée à cet import');
      }

      // 3. Vérifier qu'aucune ligne n'est engagée
      const { data: engagedLines } = await supabase
        .from('budget_lines')
        .select('id, code, total_engage')
        .eq('budget_import_id', importId)
        .gt('total_engage', 0);

      if (engagedLines && engagedLines.length > 0) {
        throw new Error(
          `Impossible d'annuler: ${engagedLines.length} ligne(s) ont des engagements`
        );
      }

      // 4. Supprimer les lignes budgétaires de cet import
      const { error: deleteError } = await supabase
        .from('budget_lines')
        .delete()
        .eq('budget_import_id', importId);

      if (deleteError) throw deleteError;

      // 5. Marquer l'import comme annulé
      const { data: userData } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('budget_imports')
        .update({
          status: 'annule',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userData.user?.id,
        })
        .eq('id', importId);

      if (updateError) throw updateError;

      // 6. Log dans audit
      await supabase.from('audit_logs').insert({
        entity_type: 'budget_import',
        entity_id: importId,
        action: 'IMPORT_ROLLBACK',
        old_values: {
          status: importRecord.status,
          lines_deleted: lineCount,
        },
        new_values: {
          status: 'annule',
        },
        exercice: exercice || new Date().getFullYear(),
        user_id: userData.user?.id,
      });

      return { linesDeleted: lineCount };
    },
    onSuccess: (result) => {
      toast.success(`Import annulé: ${result.linesDeleted} ligne(s) supprimée(s)`);
      queryClient.invalidateQueries({ queryKey: ['budget-imports'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
    },
    onError: (error: Error) => {
      toast.error("Erreur d'annulation: " + error.message);
    },
  });

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Valider les données avant import
   */
  const validateImportData = useCallback(
    async (
      rawData: Record<string, string>[],
      columnMapping: Record<string, string>
    ): Promise<ImportValidationResult> => {
      const result: ImportValidationResult = {
        totalRows: rawData.length,
        validRows: 0,
        errorRows: 0,
        warningRows: 0,
        newRows: 0,
        updateRows: 0,
        errors: [],
        warnings: [],
        duplicates: [],
        parsedRows: [],
      };

      const seenCodes = new Set<string>();
      const requiredColumns = ['code', 'label', 'level', 'dotation_initiale'];

      // Fetch reference data
      const [directions, objectifs, _missions, _actions, existingLines] = await Promise.all([
        supabase.from('directions').select('id, code'),
        supabase.from('objectifs_strategiques').select('id, code'),
        supabase.from('missions').select('id, code'),
        supabase.from('actions').select('id, code'),
        supabase
          .from('budget_lines')
          .select('code')
          .eq('exercice', exercice || new Date().getFullYear()),
      ]);

      const existingCodes = new Set(existingLines.data?.map((l) => l.code) || []);
      const directionCodes = new Set(directions.data?.map((d) => d.code) || []);
      const osCodes = new Set(objectifs.data?.map((o) => o.code) || []);

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        // Map data using column mapping
        const mappedData: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([targetCol, sourceCol]) => {
          mappedData[targetCol] = row[sourceCol] || '';
        });

        // Required field validation
        requiredColumns.forEach((col) => {
          if (!mappedData[col]) {
            rowErrors.push(`Champ obligatoire manquant: ${col}`);
          }
        });

        // Code uniqueness check
        const code = mappedData.code;
        const isUpdate = existingCodes.has(code);

        if (code) {
          if (seenCodes.has(code)) {
            rowErrors.push(`Code en doublon dans le fichier: ${code}`);
            result.duplicates.push(code);
          } else {
            seenCodes.add(code);
          }
          if (isUpdate) {
            rowWarnings.push(`Code existant (sera mis à jour): ${code}`);
            result.updateRows++;
          } else {
            result.newRows++;
          }
        }

        // Dotation validation
        const dotation = parseFloat(mappedData.dotation_initiale);
        if (isNaN(dotation)) {
          rowErrors.push('Dotation initiale invalide (doit être un nombre)');
        } else if (dotation < 0) {
          rowErrors.push('Dotation initiale négative non autorisée');
        }

        // Reference validation
        if (mappedData.direction_code && !directionCodes.has(mappedData.direction_code)) {
          rowWarnings.push(`Code direction inconnu: ${mappedData.direction_code}`);
        }
        if (mappedData.os_code && !osCodes.has(mappedData.os_code)) {
          rowWarnings.push(`Code OS inconnu: ${mappedData.os_code}`);
        }

        // Level validation
        const validLevels = ['os', 'mission', 'action', 'activite', 'sous_activite', 'ligne'];
        if (mappedData.level && !validLevels.includes(mappedData.level)) {
          rowWarnings.push(`Niveau inconnu: ${mappedData.level}`);
        }

        const isValid = rowErrors.length === 0;

        result.parsedRows.push({
          rowIndex: i + 2,
          data: mappedData,
          errors: rowErrors,
          warnings: rowWarnings,
          isValid,
          isUpdate,
        });

        if (isValid) {
          result.validRows++;
        } else {
          result.errorRows++;
        }
        if (rowWarnings.length > 0) result.warningRows++;

        rowErrors.forEach((e) => result.errors.push({ row: i + 2, message: e }));
        rowWarnings.forEach((w) => result.warnings.push({ row: i + 2, message: w }));
      }

      return result;
    },
    [exercice]
  );

  /**
   * Exécuter l'import des lignes validées
   */
  const executeImport = useCallback(
    async (
      validationResult: ImportValidationResult,
      fileName: string,
      fileSize?: number
    ): Promise<ImportExecutionResult> => {
      // Reset progress
      setProgress({ current: 0, total: 0, percentage: 0 });

      // 1. Créer l'enregistrement d'import
      const importRecord = await createImportRecord.mutateAsync({
        fileName,
        fileSize,
        totalRows: validationResult.totalRows,
      });

      try {
        // 2. Fetch reference maps (fresh data to handle race conditions)
        const [directions, objectifs, missions, actions, activites, existingLines] =
          await Promise.all([
            supabase.from('directions').select('id, code'),
            supabase.from('objectifs_strategiques').select('id, code'),
            supabase.from('missions').select('id, code'),
            supabase.from('actions').select('id, code'),
            supabase.from('activites').select('id, code'),
            supabase
              .from('budget_lines')
              .select('id, code')
              .eq('exercice', exercice || new Date().getFullYear()),
          ]);

        const directionMap = new Map(directions.data?.map((d) => [d.code, d.id]) || []);
        const osMap = new Map(objectifs.data?.map((o) => [o.code, o.id]) || []);
        const missionMap = new Map(missions.data?.map((m) => [m.code, m.id]) || []);
        const actionMap = new Map(actions.data?.map((a) => [a.code, a.id]) || []);
        const activiteMap = new Map(activites.data?.map((a) => [a.code, a.id]) || []);
        // Re-fetch existing codes at execution time to catch any inserted between validation and now
        const existingMap = new Map(existingLines.data?.map((l) => [l.code, l.id]) || []);

        const validRows = validationResult.parsedRows.filter((r) => r.isValid);
        const toInsert: TablesInsert<'budget_lines'>[] = [];
        const toUpdate: { id: string; data: TablesInsert<'budget_lines'>; code: string }[] = [];

        for (const row of validRows) {
          const data = row.data;
          const budgetLine: TablesInsert<'budget_lines'> = {
            code: data.code,
            label: data.label,
            level: data.level || 'ligne',
            type_ligne: data.type_ligne || 'depense',
            dotation_initiale: parseFloat(data.dotation_initiale) || 0,
            source_financement: data.source_financement || 'budget_etat',
            direction_id: data.direction_code ? directionMap.get(data.direction_code) : null,
            os_id: data.os_code ? osMap.get(data.os_code) : null,
            mission_id: data.mission_code ? missionMap.get(data.mission_code) : null,
            action_id: data.action_code ? actionMap.get(data.action_code) : null,
            activite_id: data.activite_code ? activiteMap.get(data.activite_code) : null,
            commentaire: data.commentaire || null,
            exercice: exercice || new Date().getFullYear(),
            statut: 'brouillon',
            budget_import_id: importRecord.id,
          };

          // Use fresh existingMap to correctly classify insert vs update (race condition fix)
          const existingId = existingMap.get(data.code);
          if (existingId) {
            toUpdate.push({ id: existingId, data: budgetLine, code: data.code });
          } else {
            toInsert.push(budgetLine);
          }
        }

        const totalOperations = toInsert.length + toUpdate.length;
        let successCount = 0;
        let errorCount = 0;
        let processed = 0;
        const errors: ImportError[] = [];

        setProgress({ current: 0, total: totalOperations, percentage: 0 });

        // 3. Batch insert new lines with per-batch error handling
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE);

          try {
            const { error: insertError } = await supabase.from('budget_lines').insert(batch);

            if (insertError) {
              // If batch insert fails (e.g. race condition duplicate), fall back to individual inserts
              for (const line of batch) {
                try {
                  const { error: singleError } = await supabase.from('budget_lines').insert(line);

                  if (singleError) {
                    // Code was inserted between validation and execution - try update instead
                    const { data: existing } = await supabase
                      .from('budget_lines')
                      .select('id')
                      .eq('code', line.code)
                      .eq('exercice', line.exercice ?? new Date().getFullYear())
                      .maybeSingle();

                    if (existing) {
                      const { error: updateErr } = await supabase
                        .from('budget_lines')
                        .update(line)
                        .eq('id', existing.id);

                      if (updateErr) {
                        errorCount++;
                        errors.push({ row: 0, message: `${line.code}: ${updateErr.message}` });
                      } else {
                        successCount++;
                      }
                    } else {
                      errorCount++;
                      errors.push({ row: 0, message: `${line.code}: ${singleError.message}` });
                    }
                  } else {
                    successCount++;
                  }
                } catch (singleErr) {
                  errorCount++;
                  errors.push({
                    row: 0,
                    message: `${line.code}: ${singleErr instanceof Error ? singleErr.message : 'Erreur inconnue'}`,
                  });
                }
              }
            } else {
              successCount += batch.length;
            }
          } catch (batchErr) {
            errorCount += batch.length;
            errors.push({
              row: 0,
              message: `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErr instanceof Error ? batchErr.message : 'Erreur inconnue'}`,
            });
          }

          processed += batch.length;
          setProgress({
            current: processed,
            total: totalOperations,
            percentage: Math.round((processed / totalOperations) * 100),
          });
        }

        // 4. Update existing lines
        for (const { id, data, code } of toUpdate) {
          try {
            const { error: updateError } = await supabase
              .from('budget_lines')
              .update(data)
              .eq('id', id);

            if (updateError) {
              errorCount++;
              errors.push({ row: 0, message: `Mise à jour ${code}: ${updateError.message}` });
            } else {
              successCount++;
            }
          } catch (updateErr) {
            errorCount++;
            errors.push({
              row: 0,
              message: `Mise à jour ${code}: ${updateErr instanceof Error ? updateErr.message : 'Erreur inconnue'}`,
            });
          }

          processed++;
          setProgress({
            current: processed,
            total: totalOperations,
            percentage: Math.round((processed / totalOperations) * 100),
          });
        }

        // 5. Finaliser l'import
        await finalizeImport.mutateAsync({
          importId: importRecord.id,
          successRows: successCount,
          errorRows: errorCount,
          errors: errors.length > 0 ? errors : undefined,
        });

        setProgress({ current: totalOperations, total: totalOperations, percentage: 100 });

        return {
          importId: importRecord.id,
          successCount,
          errorCount,
          errors,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        // Marquer comme échec
        await supabase
          .from('budget_imports')
          .update({
            status: 'echec',
            errors: [{ row: 0, message }],
            completed_at: new Date().toISOString(),
          })
          .eq('id', importRecord.id);

        throw error;
      }
    },
    [exercice, createImportRecord, finalizeImport]
  );

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Exporter le rapport d'erreurs en CSV
   */
  const exportErrorReport = useCallback((validationResult: ImportValidationResult) => {
    const lines = [
      'Ligne;Type;Message',
      ...validationResult.errors.map((e) => `${e.row};Erreur;${e.message}`),
      ...validationResult.warnings.map((w) => `${w.row};Avertissement;${w.message}`),
    ];

    const content = lines.join('\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_erreurs_import_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    importHistory,
    isLoadingHistory,
    progress,

    // Actions
    validateImportData,
    executeImport,
    rollbackImport: rollbackImport.mutate,
    refetchHistory,
    getImportLineCount,
    exportErrorReport,

    // Loading states
    isRollingBack: rollbackImport.isPending,
    isExecuting: createImportRecord.isPending || finalizeImport.isPending,
  };
}

export default useBudgetImport;
