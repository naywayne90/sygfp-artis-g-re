/**
 * Tableau des virements / ajustements avec menu d'actions contextuel.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Refactoré le 2026-04-08 — workflow 2 niveaux CB → DG :
 *   - Ligne en `en_attente` → le CB peut "Approuver" ou "Rejeter"
 *   - Ligne en `approuve`   → le DG peut "Exécuter" ou "Rejeter"
 *   - Autres états (execute/rejete) → pas d'action métier, uniquement "Voir"
 *
 * Le menu est entièrement filtré côté rôle : les actions réservées au CB
 * ne s'affichent que pour `isCB`, idem pour le DG. L'ADMIN voit tout.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, EmptyStateNoResults } from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Copy,
  Eye,
  MoreVertical,
  Play,
  TrendingUp,
  X,
} from 'lucide-react';
import type { BudgetTransfer } from '@/hooks/useBudgetTransfers';
import { useRBAC } from '@/contexts/RBACContext';
import { formatCurrency } from './constants';
import { StatusBadge } from './StatusBadge';

// -----------------------------------------------------------------------------
// Sub-component: action menu par ligne (workflow 2 niveaux CB → DG)
// -----------------------------------------------------------------------------

interface TransferActionsProps {
  transfer: BudgetTransfer;
  onApproveCb: () => void;
  onReject: () => void;
  onExecute: () => void;
  onView: () => void;
}

function TransferActions({
  transfer,
  onApproveCb,
  onReject,
  onExecute,
  onView,
}: TransferActionsProps) {
  const { isCB, isDG, isAdmin } = useRBAC();
  const status = transfer.status || 'en_attente';

  const canApproveCb = (isCB || isAdmin) && status === 'en_attente';
  const canExecute = (isDG || isAdmin) && status === 'approuve';
  const canReject =
    (canApproveCb || canExecute) && (status === 'en_attente' || status === 'approuve');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>

        {(canApproveCb || canExecute || canReject) && <DropdownMenuSeparator />}

        {canApproveCb && (
          <DropdownMenuItem onClick={onApproveCb}>
            <Check className="h-4 w-4 mr-2" />
            Approuver (CB)
          </DropdownMenuItem>
        )}

        {canExecute && (
          <DropdownMenuItem onClick={onExecute}>
            <Play className="h-4 w-4 mr-2" />
            Valider & Exécuter (DG)
          </DropdownMenuItem>
        )}

        {canReject && (
          <DropdownMenuItem onClick={onReject} className="text-destructive">
            <X className="h-4 w-4 mr-2" />
            Rejeter
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// -----------------------------------------------------------------------------
// Main: table
// -----------------------------------------------------------------------------

interface VirementTableProps {
  transfers: BudgetTransfer[];
  totals: { count: number; amount: number };
  isLoading: boolean;
  canWrite: boolean;
  searchTerm: string;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onCreate: () => void;
  onCopyCode: (code: string, e?: React.MouseEvent) => void;
  onViewDetails: (transfer: BudgetTransfer) => void;
  onApproveCb: (id: string) => void;
  onRejectRequest: (transfer: BudgetTransfer) => void;
  onExecuteRequest: (transfer: BudgetTransfer) => void;
}

export function VirementTable({
  transfers,
  totals,
  isLoading,
  canWrite,
  searchTerm,
  activeFiltersCount,
  onClearFilters,
  onCreate,
  onCopyCode,
  onViewDetails,
  onApproveCb,
  onRejectRequest,
  onExecuteRequest,
}: VirementTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : transfers.length === 0 ? (
          searchTerm || activeFiltersCount > 0 ? (
            <div className="p-8">
              <EmptyStateNoResults searchTerm={searchTerm} onClear={onClearFilters} />
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={ArrowRightLeft}
                title="Aucun virement"
                description="Aucune demande de virement ou d'ajustement budgétaire n'a été créée pour cet exercice."
                actionLabel={canWrite ? 'Créer un virement' : undefined}
                onAction={canWrite ? onCreate : undefined}
              />
            </div>
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="hidden xl:table-cell">
                  <ArrowRight className="h-4 w-4 mx-auto" />
                </TableHead>
                <TableHead className="hidden md:table-cell">Destination</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden xl:table-cell">Demandeur</TableHead>
                <TableHead className="w-10 sm:w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow
                  key={transfer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails(transfer)}
                >
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm font-medium">{transfer.code || '-'}</span>
                      {transfer.code && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hidden sm:inline-flex sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={(e) => onCopyCode(transfer.code as string, e)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={
                        transfer.type_transfer === 'ajustement'
                          ? 'text-green-600 border-green-200 bg-green-50'
                          : 'text-blue-600 border-blue-200 bg-blue-50'
                      }
                    >
                      {transfer.type_transfer === 'ajustement' ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          AJU
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          VIR
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {transfer.from_line ? (
                      <div className="max-w-[100px] lg:max-w-[160px]">
                        <div className="font-mono text-xs truncate">{transfer.from_line.code}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {transfer.from_line.label}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="max-w-[100px] lg:max-w-[160px]">
                      <div className="font-mono text-xs truncate">{transfer.to_line?.code}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {transfer.to_line?.label}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs sm:text-sm font-medium whitespace-nowrap">
                    {formatCurrency(transfer.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={transfer.status || 'en_attente'} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(transfer.requested_at), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[120px]">
                    {transfer.requested_by_profile?.full_name || '-'}
                  </TableCell>
                  <TableCell>
                    <TransferActions
                      transfer={transfer}
                      onApproveCb={() => onApproveCb(transfer.id)}
                      onReject={() => onRejectRequest(transfer)}
                      onExecute={() => onExecuteRequest(transfer)}
                      onView={() => onViewDetails(transfer)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-medium">
                <TableCell className="text-right text-xs sm:text-sm">
                  Total ({totals.count})
                </TableCell>
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="hidden md:table-cell" />
                <TableCell className="hidden xl:table-cell" />
                <TableCell className="hidden md:table-cell" />
                <TableCell className="text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                  {formatCurrency(totals.amount)}
                </TableCell>
                <TableCell />
                <TableCell className="hidden lg:table-cell" />
                <TableCell className="hidden xl:table-cell" />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
