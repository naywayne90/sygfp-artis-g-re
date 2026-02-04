// @ts-nocheck - Audit log property access
/**
 * Hook pour l'export standardisé SYGFP
 * Fournit des fonctions d'export avec contexte automatique (exercice, utilisateur)
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useRBAC } from "@/contexts/RBACContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  ExportColumn,
  ExportOptions,
  ExportResult,
} from "@/lib/export";
import { getExportTemplate, getModuleTemplates, ExportTemplate } from "@/lib/export";

interface UseStandardExportOptions {
  module: string;
  title: string;
  subtitle?: string;
  filename?: string;
  direction?: string;
  showTotals?: boolean;
  totalColumns?: string[];
  logExport?: boolean;
}

interface ExportParams {
  data: Record<string, unknown>[];
  columns?: ExportColumn[];
  templateId?: string;
  filters?: Record<string, unknown>;
}

export function useStandardExport(options: UseStandardExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const { exercice } = useExercice();
  const { user } = useRBAC();
  const { log } = useAuditLog();

  // Get available templates for this module
  const templates = getModuleTemplates(options.module);

  // Build export options with context
  const buildExportOptions = useCallback(
    (filters?: Record<string, unknown>): ExportOptions => ({
      title: options.title,
      subtitle: options.subtitle,
      filename: options.filename || `${options.module}_export`,
      exercice,
      direction: options.direction,
      user: user?.fullName || user?.email || undefined,
      filters,
      showTotals: options.showTotals,
      totalColumns: options.totalColumns,
    }),
    [exercice, user, options]
  );

  // Get columns from template or use provided columns
  const getColumns = useCallback(
    (columns?: ExportColumn[], templateId?: string): ExportColumn[] => {
      if (columns && columns.length > 0) {
        return columns;
      }
      if (templateId) {
        const template = getExportTemplate(options.module, templateId);
        if (template) {
          return template.columns;
        }
      }
      // Use first template as default
      if (templates.length > 0) {
        return templates[0].columns;
      }
      return [];
    },
    [options.module, templates]
  );

  // Log export action
  const logExportAction = useCallback(
    async (format: string, rowCount: number, filters?: Record<string, unknown>) => {
      if (options.logExport !== false) {
        try {
          await log({
            action: "export",
            entity_type: options.module,
            details: {
              format,
              row_count: rowCount,
              exercice,
              filters,
              title: options.title,
            },
          });
        } catch (error) {
          console.error("Failed to log export:", error);
        }
      }
    },
    [log, options.module, options.title, options.logExport, exercice]
  );

  // Excel export
  const toExcel = useCallback(
    async ({ data, columns, templateId, filters }: ExportParams): Promise<ExportResult> => {
      if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return { success: false, error: "Aucune donnée à exporter", rowCount: 0 };
      }

      setIsExporting(true);
      try {
        const exportColumns = getColumns(columns, templateId);
        if (exportColumns.length === 0) {
          throw new Error("Aucune colonne définie pour l'export");
        }

        const result = exportToExcel(data, exportColumns, buildExportOptions(filters));

        if (result.success) {
          toast.success(`${result.rowCount} lignes exportées en Excel`);
          await logExportAction("excel", result.rowCount || 0, filters);
        } else {
          toast.error(result.error || "Erreur lors de l'export Excel");
        }

        return result;
      } catch (error) {
        console.error("Excel export error:", error);
        toast.error("Erreur lors de l'export Excel");
        return { success: false, error: String(error) };
      } finally {
        setIsExporting(false);
      }
    },
    [getColumns, buildExportOptions, logExportAction]
  );

  // CSV export
  const toCsv = useCallback(
    async ({ data, columns, templateId, filters }: ExportParams): Promise<ExportResult> => {
      if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return { success: false, error: "Aucune donnée à exporter", rowCount: 0 };
      }

      setIsExporting(true);
      try {
        const exportColumns = getColumns(columns, templateId);
        if (exportColumns.length === 0) {
          throw new Error("Aucune colonne définie pour l'export");
        }

        const result = exportToCSV(data, exportColumns, buildExportOptions(filters));

        if (result.success) {
          toast.success(`${result.rowCount} lignes exportées en CSV`);
          await logExportAction("csv", result.rowCount || 0, filters);
        } else {
          toast.error(result.error || "Erreur lors de l'export CSV");
        }

        return result;
      } catch (error) {
        console.error("CSV export error:", error);
        toast.error("Erreur lors de l'export CSV");
        return { success: false, error: String(error) };
      } finally {
        setIsExporting(false);
      }
    },
    [getColumns, buildExportOptions, logExportAction]
  );

  // PDF export
  const toPdf = useCallback(
    async ({ data, columns, templateId, filters }: ExportParams): Promise<ExportResult> => {
      if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return { success: false, error: "Aucune donnée à exporter", rowCount: 0 };
      }

      setIsExporting(true);
      try {
        const exportColumns = getColumns(columns, templateId);
        if (exportColumns.length === 0) {
          throw new Error("Aucune colonne définie pour l'export");
        }

        const result = exportToPDF(data, exportColumns, buildExportOptions(filters));

        if (result.success) {
          toast.success("Document PDF généré");
          await logExportAction("pdf", result.rowCount || 0, filters);
        } else {
          toast.error(result.error || "Erreur lors de l'export PDF");
        }

        return result;
      } catch (error) {
        console.error("PDF export error:", error);
        toast.error("Erreur lors de l'export PDF");
        return { success: false, error: String(error) };
      } finally {
        setIsExporting(false);
      }
    },
    [getColumns, buildExportOptions, logExportAction]
  );

  return {
    isExporting,
    templates,
    toExcel,
    toCsv,
    toPdf,
    getColumns,
  };
}

export default useStandardExport;
