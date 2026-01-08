import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import * as XLSX from "xlsx";

export type ExportType = "excel" | "csv" | "pdf" | "zip";
export type EntityType = "budget_lines" | "engagement" | "liquidation" | "ordonnancement" | "dossier" | "note_aef" | "note_sef" | "marche";

interface ExportOptions {
  type: ExportType;
  entityType: EntityType;
  entityId?: string;
  filters?: Record<string, unknown>;
  includeReferentiels?: boolean;
}

export function useExport() {
  const { exercice } = useExercice();
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = useCallback((content: string | Blob, fileName: string, contentType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Export via edge function (for PDF/complex exports)
  const exportViaEdgeFunction = useCallback(async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await supabase.functions.invoke("generate-export", {
        body: {
          type: options.type,
          entity_type: options.entityType,
          entity_id: options.entityId,
          exercice,
          filters: options.filters,
          include_referentiels: options.includeReferentiels,
        },
      });

      if (response.error) throw response.error;

      const content = response.data;
      const timestamp = Date.now();
      
      if (options.type === "pdf") {
        // For PDF, we get HTML that needs to be printed
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(content);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      } else {
        const fileName = `${options.entityType}_${exercice}_${timestamp}.${options.type === "excel" ? "csv" : options.type}`;
        downloadFile(content, fileName, "text/csv; charset=utf-8");
      }

      toast.success("Export réussi");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export: " + error.message);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [exercice, downloadFile]);

  // Local Excel export (faster, uses xlsx library)
  const exportToExcel = useCallback(async (
    data: Record<string, unknown>[],
    fileName: string,
    sheetName = "Données"
  ) => {
    setIsExporting(true);
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Style: freeze first row
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
      
      // Auto-width columns
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });

      downloadFile(blob, `${fileName}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast.success("Export Excel réussi");
    } catch (error: any) {
      console.error("Excel export error:", error);
      toast.error("Erreur lors de l'export Excel");
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [downloadFile]);

  // Local CSV export
  const exportToCSV = useCallback(async (
    data: Record<string, unknown>[],
    fileName: string
  ) => {
    setIsExporting(true);
    try {
      if (data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(";"),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
            return String(value);
          }).join(";")
        )
      ];

      const BOM = "\uFEFF";
      const csvContent = BOM + csvRows.join("\n");
      
      downloadFile(csvContent, `${fileName}.csv`, "text/csv; charset=utf-8");
      toast.success("Export CSV réussi");
    } catch (error: any) {
      console.error("CSV export error:", error);
      toast.error("Erreur lors de l'export CSV");
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [downloadFile]);

  // Export budget lines with referentials
  const exportBudgetLines = useCallback(async (
    filters?: Record<string, unknown>,
    includeReferentiels = false
  ) => {
    setIsExporting(true);
    try {
      // Fetch data
      let query = supabase
        .from("budget_lines")
        .select(`
          code, label, dotation_initiale, dotation_modifiee, disponible_calcule, total_engage,
          source_financement, commentaire, statut, created_at,
          direction:directions(code, sigle),
          objectif_strategique:objectifs_strategiques(code, libelle),
          mission:missions(code, libelle),
          action:actions(code, libelle),
          activite:activites(code, libelle),
          sous_activite:sous_activites(code, libelle),
          nomenclature_nbe(code, libelle),
          plan_comptable_sysco(code, libelle)
        `)
        .eq("exercice", exercice)
        .order("code");

      if (filters?.direction_id) {
        query = query.eq("direction_id", filters.direction_id as string);
      }
      if (filters?.os_id) {
        query = query.eq("os_id", filters.os_id as string);
      }
      if (filters?.statut) {
        query = query.eq("statut", filters.statut as string);
      }

      const { data: lines, error } = await query;
      if (error) throw error;

      // Transform data for export
      const exportData = (lines || []).map((line: any) => ({
        "Code": line.code,
        "Libellé": line.label,
        "Dotation Initiale": line.dotation_initiale || 0,
        "Dotation Modifiée": line.dotation_modifiee || line.dotation_initiale || 0,
        "Disponible": line.disponible_calcule || 0,
        "Engagé": line.total_engage || 0,
        "Direction": line.direction?.sigle || "",
        "OS": line.objectif_strategique?.code || "",
        "Mission": line.mission?.code || "",
        "Action": line.action?.code || "",
        "Activité": line.activite?.code || "",
        "Sous-activité": line.sous_activite?.code || "",
        "NBE": line.nomenclature_nbe?.code || "",
        "SYSCO": line.plan_comptable_sysco?.code || "",
        "Source Financement": line.source_financement || "",
        "Statut": line.statut || "",
        "Commentaire": line.commentaire || "",
      }));

      const workbook = XLSX.utils.book_new();
      
      // Main sheet
      const mainSheet = XLSX.utils.json_to_sheet(exportData);
      mainSheet["!cols"] = [
        { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(workbook, mainSheet, "Lignes Budgétaires");

      // Add referential sheets if requested
      if (includeReferentiels) {
        const [osRes, actionsRes, directionsRes, nbeRes] = await Promise.all([
          supabase.from("objectifs_strategiques").select("code, libelle").order("code"),
          supabase.from("actions").select("code, libelle").order("code"),
          supabase.from("directions").select("code, label, sigle").order("code"),
          supabase.from("nomenclature_nbe").select("code, libelle").order("code"),
        ]);

        if (osRes.data?.length) {
          const osSheet = XLSX.utils.json_to_sheet(osRes.data.map((o: { code: string; libelle: string }) => ({
            "Code OS": o.code, "Libellé": o.libelle
          })));
          XLSX.utils.book_append_sheet(workbook, osSheet, "OS");
        }

        if (actionsRes.data?.length) {
          const actionsSheet = XLSX.utils.json_to_sheet(actionsRes.data.map((a: { code: string; libelle: string }) => ({
            "Code Action": a.code, "Libellé": a.libelle
          })));
          XLSX.utils.book_append_sheet(workbook, actionsSheet, "Actions");
        }

        if (directionsRes.data?.length) {
          const dirsSheet = XLSX.utils.json_to_sheet(directionsRes.data.map((d: { code: string; label: string; sigle: string | null }) => ({
            "Code": d.code, "Libellé": d.label, "Sigle": d.sigle
          })));
          XLSX.utils.book_append_sheet(workbook, dirsSheet, "Directions");
        }

        if (nbeRes.data?.length) {
          const nbeSheet = XLSX.utils.json_to_sheet(nbeRes.data.map((n: { code: string; libelle: string }) => ({
            "Code NBE": n.code, "Libellé": n.libelle
          })));
          XLSX.utils.book_append_sheet(workbook, nbeSheet, "NBE");
        }
      }

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });

      const fileName = `structure_budgetaire_${exercice}_${Date.now()}.xlsx`;
      downloadFile(blob, fileName, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      
      toast.success(`${exportData.length} lignes exportées`);
    } catch (error: any) {
      console.error("Budget export error:", error);
      toast.error("Erreur lors de l'export: " + error.message);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [exercice, downloadFile]);

  // Print/PDF for document fiches
  const printDocument = useCallback(async (
    entityType: EntityType,
    entityId: string
  ) => {
    setIsExporting(true);
    try {
      await exportViaEdgeFunction({
        type: "pdf",
        entityType,
        entityId,
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportViaEdgeFunction]);

  return {
    isExporting,
    exportToExcel,
    exportToCSV,
    exportBudgetLines,
    exportViaEdgeFunction,
    printDocument,
  };
}

export default useExport;
