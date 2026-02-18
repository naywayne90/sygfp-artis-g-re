import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePassationMarcheExport } from '@/hooks/usePassationMarcheExport';
import { useExercice } from '@/contexts/ExerciceContext';
import type { PassationMarche } from '@/hooks/usePassationsMarche';
import { Download, FileSpreadsheet, Loader2, ChevronDown } from 'lucide-react';

interface PassationExportButtonProps {
  passations: PassationMarche[];
  disabled?: boolean;
}

export function PassationExportButton({ passations, disabled }: PassationExportButtonProps) {
  const { exportExcel, isExporting } = usePassationMarcheExport();
  const { exercice } = useExercice();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          data-testid="export-passation-btn"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exporter
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem
          onClick={() => exportExcel(passations, undefined, exercice ?? undefined)}
          disabled={passations.length === 0}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (4 feuilles)
          <span className="ml-auto text-xs text-muted-foreground">{passations.length}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
