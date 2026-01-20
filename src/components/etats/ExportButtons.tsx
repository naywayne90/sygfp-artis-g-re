import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileDown, Loader2, Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useRBAC } from "@/contexts/RBACContext";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  ExportColumn,
  ExportOptions,
} from "@/lib/export";
import { getModuleTemplates } from "@/lib/export";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
  title: string;
  subtitle?: string;
  module?: string;
  filters?: Record<string, unknown>;
  showTotals?: boolean;
  totalColumns?: string[];
  direction?: string;
  showCopy?: boolean;
  showPrint?: boolean;
}

export function ExportButtons({
  data,
  columns,
  filename,
  title,
  subtitle,
  module,
  filters,
  showTotals,
  totalColumns,
  direction,
  showCopy = false,
  showPrint = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { exercice } = useExercice();
  const { user } = useRBAC();

  const exportOptions: ExportOptions = {
    title,
    subtitle,
    filename,
    exercice,
    direction,
    user: user?.fullName || user?.email || undefined,
    filters,
    showTotals,
    totalColumns,
  };

  const templates = module ? getModuleTemplates(module) : [];

  const handleExportExcel = async (templateColumns?: ExportColumn[]) => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    setIsExporting(true);
    try {
      const result = exportToExcel(data, templateColumns || columns, exportOptions);
      if (result.success) {
        toast.success(`${result.rowCount} lignes exportées en Excel`);
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    setIsExporting(true);
    try {
      const result = exportToCSV(data, columns, exportOptions);
      if (result.success) {
        toast.success(`${result.rowCount} lignes exportées en CSV`);
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Erreur lors de l'export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async (templateColumns?: ExportColumn[]) => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    setIsExporting(true);
    try {
      const result = exportToPDF(data, templateColumns || columns, exportOptions);
      if (result.success) {
        toast.success("Document PDF généré");
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à copier");
      return;
    }

    try {
      // Format as CSV for clipboard
      const headers = columns.map(c => c.label).join("\t");
      const rows = data.map(row =>
        columns.map(col => {
          const value = row[col.key];
          return value !== null && value !== undefined ? String(value) : "";
        }).join("\t")
      );
      const clipboardText = [headers, ...rows].join("\n");

      await navigator.clipboard.writeText(clipboardText);
      toast.success(`${data.length} ligne(s) copiée(s) dans le presse-papiers`);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Erreur lors de la copie");
    }
  };

  const handlePrint = () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à imprimer");
      return;
    }

    // Use the PDF export function which opens print dialog
    exportToPDF(data, columns, exportOptions);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Copy to clipboard */}
        {showCopy && (
          <>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copier dans le presse-papiers
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Excel exports */}
        {templates.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleExportExcel()}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Colonnes actuelles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleExportExcel(template.columns)}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {template.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem onClick={() => handleExportExcel()}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter en Excel
          </DropdownMenuItem>
        )}

        {/* CSV export */}
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileDown className="h-4 w-4 mr-2" />
          Exporter en CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* PDF exports */}
        {templates.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleExportPDF()}>
                <FileText className="h-4 w-4 mr-2" />
                Colonnes actuelles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleExportPDF(template.columns)}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {template.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem onClick={() => handleExportPDF()}>
            <FileText className="h-4 w-4 mr-2" />
            Exporter en PDF
          </DropdownMenuItem>
        )}

        {/* Print */}
        {showPrint && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
