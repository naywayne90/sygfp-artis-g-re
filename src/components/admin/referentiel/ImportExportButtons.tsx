import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, FileDown, FileUp, ArrowDownToLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import logoArti from "@/assets/logo-arti.jpg";

interface ImportExportButtonsProps {
  onImport: (file: File) => void;
  onExport: () => void;
  onDownloadTemplate: () => void;
  isImporting?: boolean;
  entityName?: string;
}

export function ImportExportButtons({
  onImport,
  onExport,
  onDownloadTemplate,
  isImporting = false,
  entityName = "données",
}: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isImporting} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import/Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
          {/* Header avec logo ARTI */}
          <div className="bg-gradient-to-r from-[#004a99] to-[#0066cc] p-4">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-1.5 shadow-md">
                <img src={logoArti} alt="ARTI" className="h-8 w-auto" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Gestion des {entityName}</h3>
                <p className="text-blue-100 text-xs">Import & Export SYGFP</p>
              </div>
            </div>
          </div>

          {/* Section Import */}
          <div className="p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Importer des données
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-foreground">Importer un fichier CSV</p>
                <p className="text-xs text-muted-foreground">Formats acceptés : .csv, .xlsx, .xls</p>
              </div>
              <Upload className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
          </div>

          <DropdownMenuSeparator className="my-0" />

          {/* Section Export */}
          <div className="p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Exporter les données
            </p>
            <div className="space-y-2">
              <button
                onClick={onExport}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-all group border border-transparent hover:border-green-200"
              >
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FileDown className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-foreground">Exporter en CSV</p>
                  <p className="text-xs text-muted-foreground">Télécharger toutes les {entityName}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
            </div>
          </div>

          <DropdownMenuSeparator className="my-0" />

          {/* Section Modèle */}
          <div className="p-3 bg-muted/30">
            <button
              onClick={onDownloadTemplate}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-all group"
            >
              <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <ArrowDownToLine className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-foreground">Télécharger le modèle</p>
                <p className="text-xs text-muted-foreground">Fichier CSV vide avec colonnes</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-4 py-2 border-t">
            <p className="text-[10px] text-muted-foreground text-center">
              SYGFP - Système de Gestion Financière et Programmatique
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
