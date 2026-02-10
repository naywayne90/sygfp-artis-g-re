import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useExport } from "@/hooks/useExport";

interface ExportButtonsProps {
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  filters?: Record<string, unknown>;
  entityType?: "budget_lines" | "referentiel";
  showReferentielsOption?: boolean;
}

export function ExportButtons({
  onExportExcel,
  onExportCSV,
  filters,
  entityType = "budget_lines",
  showReferentielsOption = true,
}: ExportButtonsProps) {
  const { isExporting, exportBudgetLines, _exportToCSV } = useExport();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [includeReferentiels, setIncludeReferentiels] = useState(true);

  const handleExportExcel = async () => {
    if (onExportExcel) {
      onExportExcel();
    } else if (entityType === "budget_lines") {
      setShowExportDialog(true);
    }
  };

  const handleConfirmExport = async () => {
    setShowExportDialog(false);
    await exportBudgetLines(filters, includeReferentiels);
  };

  const handleExportCSV = async () => {
    if (onExportCSV) {
      onExportCSV();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCSV} disabled={!onExportCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Exporter CSV (rapide)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Options d'export Excel</DialogTitle>
            <DialogDescription>
              Configurez les options pour l'export de la structure budgétaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {showReferentielsOption && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-refs"
                  checked={includeReferentiels}
                  onCheckedChange={(checked) => setIncludeReferentiels(checked as boolean)}
                />
                <Label htmlFor="include-refs" className="text-sm font-normal">
                  Inclure les référentiels (OS, Actions, Directions, NBE)
                </Label>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>L'export inclura :</p>
              <ul className="list-disc list-inside mt-2">
                <li>Toutes les lignes budgétaires filtrées</li>
                <li>Codes, montants, imputations</li>
                {includeReferentiels && (
                  <li>Onglets référentiels (OS, Actions, Directions, NBE)</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExportButtons;
