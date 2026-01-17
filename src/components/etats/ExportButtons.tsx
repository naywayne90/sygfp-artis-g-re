import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExportButtonsProps {
  data: any[];
  columns: { key: string; label: string }[];
  filename: string;
  title: string;
}

export function ExportButtons({ data, columns, filename, title }: ExportButtonsProps) {
  const formatMontant = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = data.map((row) => {
        const rowData: Record<string, any> = {};
        columns.forEach((col) => {
          const value = col.key.split(".").reduce((obj, key) => obj?.[key], row);
          rowData[col.label] = value ?? "";
        });
        return rowData;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = columns.map((col) => ({
        wch: Math.max(
          col.label.length,
          ...data.map((row) => {
            const value = col.key.split(".").reduce((obj, key) => obj?.[key], row);
            return String(value ?? "").length;
          })
        ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      // Add title row at the top
      XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: "A1" });
      XLSX.utils.sheet_add_aoa(worksheet, [[`Généré le ${new Date().toLocaleDateString("fr-FR")}`]], { origin: "A2" });
      XLSX.utils.sheet_add_aoa(worksheet, [[""]], { origin: "A3" });

      // Shift existing data down
      const sheetData = excelData.map((row) => Object.values(row));
      XLSX.utils.sheet_add_aoa(worksheet, [columns.map(c => c.label)], { origin: "A4" });
      XLSX.utils.sheet_add_aoa(worksheet, sheetData, { origin: "A5" });

      XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

      // Generate file and download
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Export Excel réussi");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const logoUrl = `${window.location.origin}/favicon.jpg`;
      
      // Create printable HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin: 1cm; size: A4 landscape; }
            body { font-family: Arial, sans-serif; font-size: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .header-left { display: flex; align-items: center; gap: 15px; }
            .logo { height: 50px; width: auto; }
            .header-info { text-align: right; font-size: 9px; color: #666; }
            h1 { text-align: center; font-size: 16px; margin: 15px 0; color: #1e40af; }
            .generated-at { text-align: center; font-size: 10px; color: #666; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
            th { background-color: #1e40af; color: white; font-weight: bold; }
            td.number { text-align: right; }
            .footer { margin-top: 20px; font-size: 9px; color: #666; display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 10px; }
            tfoot td { font-weight: bold; background-color: #f5f5f5; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" alt="ARTI" class="logo" />
            </div>
            <div class="header-info">
              ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <h1>${title}</h1>
          <p class="generated-at">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          <table>
            <thead>
              <tr>
                ${columns.map((c) => `<th>${c.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${columns
                    .map((col) => {
                      const value = col.key.split(".").reduce((obj, key) => obj?.[key], row);
                      const isNumber = typeof value === "number";
                      return `<td class="${isNumber ? "number" : ""}">${
                        isNumber ? formatMontant(value) : value || "-"
                      }</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <span>SYGFP - Système de Gestion des Finances Publiques - ARTI</span>
            <span>Page 1/1</span>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success("Impression lancée");
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
