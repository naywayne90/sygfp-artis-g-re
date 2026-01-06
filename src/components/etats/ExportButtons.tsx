import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

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

  const exportToCSV = () => {
    try {
      const headers = columns.map((c) => c.label).join(";");
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const value = col.key.split(".").reduce((obj, key) => obj?.[key], row);
            if (typeof value === "number") {
              return formatMontant(value);
            }
            return value || "";
          })
          .join(";")
      );

      const csv = [headers, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Export CSV réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const exportToPDF = () => {
    try {
      // Create printable HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin: 1cm; size: A4 landscape; }
            body { font-family: Arial, sans-serif; font-size: 10px; }
            h1 { text-align: center; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            td.number { text-align: right; }
            .footer { margin-top: 20px; font-size: 9px; color: #666; }
            tfoot td { font-weight: bold; background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
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
            SYGFP - Système de Gestion des Finances Publiques - ARTI
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
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
