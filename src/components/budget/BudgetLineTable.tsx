import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BudgetLineWithRelations, getDisplayBudgetCode } from '@/hooks/useBudgetLines';
import { BudgetLineActionsMenu } from './BudgetLineActionsMenu';

const getVersionBadge = (version: string) => {
  switch (version) {
    case 'V2':
      return (
        <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 border-primary text-primary">
          V2
        </Badge>
      );
    case 'V1':
      return (
        <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
          V1
        </Badge>
      );
    default:
      return null;
  }
};

interface BudgetLineTableProps {
  lines: BudgetLineWithRelations[];
  onEdit: (line: BudgetLineWithRelations) => void;
  onSubmit: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (line: BudgetLineWithRelations) => void;
  onEditWithVersioning?: (line: BudgetLineWithRelations) => void;
  onViewVersionHistory?: (line: BudgetLineWithRelations) => void;
  onViewDetail?: (line: BudgetLineWithRelations, tab?: string) => void;
  onExportLine?: (line: BudgetLineWithRelations) => void;
}

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA'
  );
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'brouillon':
      return <Badge variant="secondary">Brouillon</Badge>;
    case 'soumis':
      return (
        <Badge variant="default" className="bg-blue-500">
          Soumis
        </Badge>
      );
    case 'valide':
      return (
        <Badge variant="default" className="bg-green-500">
          Validé
        </Badge>
      );
    case 'rejete':
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">Brouillon</Badge>;
  }
};

export function BudgetLineTable({
  lines,
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDelete,
  onViewHistory,
  onEditWithVersioning,
  onViewVersionHistory,
  onViewDetail,
  onExportLine,
}: BudgetLineTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Libellé</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-right">Dotation Init.</TableHead>
            <TableHead className="text-right">Dotation Act.</TableHead>
            <TableHead className="text-right">Engagé</TableHead>
            <TableHead className="text-right">Liquidé</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                Aucune ligne budgétaire trouvée
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => {
              const displayCode = getDisplayBudgetCode(line);
              const engage = line.calc_total_engage ?? line.total_engage ?? 0;
              const liquide = line.calc_total_liquide ?? line.total_liquide ?? 0;
              const paye = line.calc_total_paye ?? line.total_paye ?? 0;
              const virementsRecus = line.calc_virements_recus ?? 0;
              const virementsEmis = line.calc_virements_emis ?? 0;
              const dotationActuelle =
                line.calc_dotation_actuelle ?? line.dotation_modifiee ?? line.dotation_initiale;
              const disponible =
                line.calc_disponible ?? line.disponible_calcule ?? dotationActuelle - engage;
              const tauxExec =
                dotationActuelle > 0 ? Math.round((paye / dotationActuelle) * 100) : 0;

              return (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center">
                      <span>{displayCode.code}</span>
                      {getVersionBadge(displayCode.version)}
                    </div>
                    {displayCode.version === 'V2' && line.code && (
                      <div className="text-xs text-muted-foreground">Réf: {line.code}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{line.label}</div>
                    {line.nomenclature_nbe && (
                      <div className="text-xs text-muted-foreground">
                        NBE: {line.nomenclature_nbe.code}
                      </div>
                    )}
                    {line.ref_nve && (
                      <div className="text-xs text-muted-foreground">
                        NVE: {line.ref_nve.code_nve}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{line.direction?.code || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrency(line.dotation_initiale)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(dotationActuelle)}
                    {(virementsRecus > 0 || virementsEmis > 0) && (
                      <div className="text-xs text-muted-foreground">
                        {virementsRecus > 0 && (
                          <span className="text-green-600">
                            +{formatCurrency(virementsRecus).replace(' FCFA', '')}
                          </span>
                        )}
                        {virementsEmis > 0 && (
                          <span className="text-red-600 ml-1">
                            -{formatCurrency(virementsEmis).replace(' FCFA', '')}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {formatCurrency(engage)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {formatCurrency(liquide)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(paye)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-bold ${disponible < 0 ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : 'text-green-600'}`}
                  >
                    {formatCurrency(disponible)}
                    {disponible < 0 && <div className="text-xs">Dépassement</div>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(line.statut)}
                      {tauxExec > 0 && (
                        <div className="text-xs text-muted-foreground">{tauxExec}% exécuté</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <BudgetLineActionsMenu
                      line={line}
                      onEdit={onEdit}
                      onSubmit={onSubmit}
                      onValidate={onValidate}
                      onReject={onReject}
                      onDelete={onDelete}
                      onViewHistory={onViewHistory}
                      onEditWithVersioning={onEditWithVersioning}
                      onViewVersionHistory={onViewVersionHistory}
                      onViewDetail={onViewDetail}
                      onExportLine={onExportLine}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
