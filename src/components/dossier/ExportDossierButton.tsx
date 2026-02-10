import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useExportDossierComplet } from "@/hooks/useExportDossierComplet";

interface ExportDossierButtonProps {
  dossierId: string;
  dossierNumero?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportDossierButton({
  dossierId,
  _dossierNumero,
  variant = "outline",
  size = "default",
}: ExportDossierButtonProps) {
  const { isExporting, exportDossierComplet } = useExportDossierComplet();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem
          onClick={() => exportDossierComplet(dossierId, "pdf")}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2 text-red-500" />
          Récapitulatif PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportDossierComplet(dossierId, "excel")}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          Export Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
