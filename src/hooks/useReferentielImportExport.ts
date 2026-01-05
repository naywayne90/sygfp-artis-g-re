import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ImportResult = {
  success: number;
  errors: number;
  errorDetails: string[];
};

export function useReferentielImportExport(
  tableName: string,
  queryKey: string,
  requiredFields: string[],
  uniqueField: string = "code"
) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[;,]/).map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row);
    }

    return data;
  };

  const validateRow = (row: Record<string, string>, index: number): string | null => {
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === "") {
        return `Ligne ${index + 2}: Champ obligatoire "${field}" manquant`;
      }
    }
    return null;
  };

  const importData = async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    const result: ImportResult = { success: 0, errors: 0, errorDetails: [] };

    try {
      const content = await file.text();
      const data = parseCSV(content);

      if (data.length === 0) {
        throw new Error("Fichier vide ou format invalide");
      }

      // Validate all rows first
      for (let i = 0; i < data.length; i++) {
        const error = validateRow(data[i], i);
        if (error) {
          result.errors++;
          result.errorDetails.push(error);
        }
      }

      // Insert valid rows
      const validRows = data.filter((_, i) => !validateRow(data[i], i));

      for (const row of validRows) {
        // Check for duplicates
        const { data: existing } = await (supabase as any)
          .from(tableName)
          .select("id")
          .eq(uniqueField, row[uniqueField])
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await (supabase as any)
            .from(tableName)
            .update(row)
            .eq(uniqueField, row[uniqueField]);

          if (error) {
            result.errors++;
            result.errorDetails.push(`Erreur mise à jour ${row[uniqueField]}: ${error.message}`);
          } else {
            result.success++;
          }
        } else {
          // Insert new
          const { error } = await (supabase as any).from(tableName).insert(row);

          if (error) {
            result.errors++;
            result.errorDetails.push(`Erreur insertion ${row[uniqueField]}: ${error.message}`);
          } else {
            result.success++;
          }
        }
      }

      toast.success(`Import terminé: ${result.success} succès, ${result.errors} erreurs`);
    } catch (error: any) {
      toast.error("Erreur d'import: " + error.message);
      result.errorDetails.push(error.message);
    } finally {
      setIsImporting(false);
      setImportResult(result);
    }

    return result;
  };

  const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // Get headers from first item, excluding internal fields
    const excludedFields = ["id", "created_at", "updated_at"];
    const headers = Object.keys(data[0]).filter((h) => !excludedFields.includes(h));

    // Build CSV content
    const csvContent = [
      headers.join(";"),
      ...data.map((row) =>
        headers.map((h) => {
          const value = row[h];
          if (value === null || value === undefined) return "";
          if (typeof value === "boolean") return value ? "true" : "false";
          return String(value).replace(/"/g, '""');
        }).join(";")
      ),
    ].join("\n");

    // Download file
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(`Export de ${data.length} lignes réussi`);
  };

  const downloadTemplate = (fields: { name: string; example: string }[], filename: string) => {
    const headers = fields.map((f) => f.name).join(";");
    const example = fields.map((f) => f.example).join(";");
    const csvContent = `${headers}\n${example}`;

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `modele_${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success("Modèle téléchargé");
  };

  return {
    isImporting,
    importResult,
    importData,
    exportToCSV,
    downloadTemplate,
  };
}
