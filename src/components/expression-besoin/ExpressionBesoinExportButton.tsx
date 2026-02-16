import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react';
import { useExpressionsBesoinExport } from '@/hooks/useExpressionsBesoinExport';

interface ExpressionBesoinExportButtonProps {
  filters?: { statut?: string; search?: string };
  disabled?: boolean;
}

export function ExpressionBesoinExportButton({
  filters,
  disabled,
}: ExpressionBesoinExportButtonProps) {
  const { exportExcel, exportPDF, exportCSV, isExporting } = useExpressionsBesoinExport();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting} className="gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => exportExcel(filters)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (2 feuilles)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPDF(filters)}>
          <FileText className="h-4 w-4 mr-2" />
          PDF (avec articles)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportCSV(filters)}>
          <FileDown className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
