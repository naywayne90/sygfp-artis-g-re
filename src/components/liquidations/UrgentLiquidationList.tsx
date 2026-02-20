/**
 * UrgentLiquidationList - Liste dédiée aux liquidations urgentes
 * Tri par date d'urgence, actions rapides, export Excel
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Flame,
  Eye,
  X,
  Download,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  AlertTriangle,
  User,
  Building2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatCurrency } from '@/lib/utils';

import { useUrgentLiquidations, type UrgentLiquidation } from '@/hooks/useUrgentLiquidations';
import { UrgentLiquidationBadge } from './UrgentLiquidationBadge';

// ============================================================================
// TYPES
// ============================================================================

export interface UrgentLiquidationListProps {
  /** Callback pour voir le détail */
  onViewDetail?: (liquidation: UrgentLiquidation) => void;
  /** Hauteur maximale (scroll) */
  maxHeight?: number | string;
  /** Afficher les stats */
  showStats?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

type SortField = 'urgence_date' | 'montant' | 'numero' | 'fournisseur';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPOSANT
// ============================================================================

export function UrgentLiquidationList({
  onViewDetail,
  maxHeight = 600,
  showStats = true,
  className,
}: UrgentLiquidationListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('urgence_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [confirmRemove, setConfirmRemove] = useState<UrgentLiquidation | null>(null);

  const { urgentLiquidations, stats, isLoading, removeUrgent, isRemoving, refetch } =
    useUrgentLiquidations();

  // Filtrer et trier
  const filteredAndSorted = useMemo(() => {
    let result = urgentLiquidations;

    // Filtrer par recherche
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.numero.toLowerCase().includes(search) ||
          l.engagement?.objet?.toLowerCase().includes(search) ||
          l.engagement?.fournisseur?.toLowerCase().includes(search) ||
          l.urgence_motif?.toLowerCase().includes(search)
      );
    }

    // Trier
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'urgence_date':
          comparison =
            new Date(a.urgence_date || 0).getTime() - new Date(b.urgence_date || 0).getTime();
          break;
        case 'montant':
          comparison = (a.net_a_payer || a.montant) - (b.net_a_payer || b.montant);
          break;
        case 'numero':
          comparison = a.numero.localeCompare(b.numero);
          break;
        case 'fournisseur':
          comparison = (a.engagement?.fournisseur || '').localeCompare(
            b.engagement?.fournisseur || ''
          );
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [urgentLiquidations, searchQuery, sortField, sortDirection]);

  // Gérer le tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Voir le détail
  const handleView = (liquidation: UrgentLiquidation) => {
    if (onViewDetail) {
      onViewDetail(liquidation);
    } else {
      navigate(`/liquidations?id=${liquidation.id}`);
    }
  };

  // Retirer l'urgence
  const handleRemoveUrgent = async () => {
    if (!confirmRemove) return;
    try {
      await removeUrgent(confirmRemove.id);
      setConfirmRemove(null);
    } catch {
      // Erreur gérée par le hook
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredAndSorted.map((l) => ({
      Numéro: l.numero,
      Engagement: l.engagement?.numero || '-',
      Objet: l.engagement?.objet || '-',
      Fournisseur: l.engagement?.fournisseur || '-',
      Direction: l.engagement?.budget_line?.direction?.sigle || '-',
      Montant: l.net_a_payer || l.montant,
      Statut: l.statut,
      'Motif urgence': l.urgence_motif || '-',
      'Date urgence': l.urgence_date ? format(new Date(l.urgence_date), 'dd/MM/yyyy HH:mm') : '-',
      'Marqué par': l.urgence_user?.full_name || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidations urgentes');

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 15 }, // Numéro
      { wch: 15 }, // Engagement
      { wch: 40 }, // Objet
      { wch: 25 }, // Fournisseur
      { wch: 10 }, // Direction
      { wch: 18 }, // Montant
      { wch: 10 }, // Statut
      { wch: 40 }, // Motif
      { wch: 18 }, // Date
      { wch: 20 }, // Marqué par
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `liquidations-urgentes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Icône de tri
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Vide
  // ────────────────────────────────────────────────────────────────────────────

  if (urgentLiquidations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-12 pb-12 text-center">
          <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Aucune liquidation urgente</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les liquidations marquées comme urgentes apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Liste
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-red-600">Liquidations urgentes</CardTitle>
                <CardDescription>
                  {filteredAndSorted.length} liquidation{filteredAndSorted.length !== 1 ? 's' : ''}{' '}
                  urgente{filteredAndSorted.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-2xl font-bold text-red-600">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total urgentes</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-2xl font-bold text-amber-600">{stats.enAttente}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-600">{stats.validees}</p>
                <p className="text-xs text-muted-foreground">Validées</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.montantTotal)}
                </p>
                <p className="text-xs text-muted-foreground">Montant total</p>
              </div>
            </div>
          )}

          {/* Recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, objet, fournisseur, motif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div
            className="overflow-auto rounded-md border"
            style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('numero')}
                  >
                    <span className="flex items-center">
                      Numéro <SortIcon field="numero" />
                    </span>
                  </TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('fournisseur')}
                  >
                    <span className="flex items-center">
                      Fournisseur <SortIcon field="fournisseur" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('montant')}
                  >
                    <span className="flex items-center justify-end">
                      Montant <SortIcon field="montant" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('urgence_date')}
                  >
                    <span className="flex items-center">
                      Urgence <SortIcon field="urgence_date" />
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun résultat pour cette recherche
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((liq) => (
                    <TableRow key={liq.id} className="group">
                      <TableCell>
                        <UrgentLiquidationBadge
                          variant="icon"
                          motif={liq.urgence_motif}
                          date={liq.urgence_date}
                          marqueParNom={liq.urgence_user?.full_name}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{liq.numero}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block">{liq.engagement?.objet || '-'}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md">
                              <div className="space-y-1">
                                <p>{liq.engagement?.objet}</p>
                                {liq.engagement?.budget_line && (
                                  <p className="text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3 inline mr-1" />
                                    {liq.engagement.budget_line.direction?.sigle ||
                                      liq.engagement.budget_line.code}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{liq.engagement?.fournisseur || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(liq.net_a_payer || liq.montant)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">
                            {liq.urgence_date
                              ? formatDistanceToNow(new Date(liq.urgence_date), {
                                  addSuffix: true,
                                  locale: fr,
                                })
                              : '-'}
                          </span>
                          {liq.urgence_user?.full_name && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />
                              {liq.urgence_user.full_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleView(liq)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Voir détail</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setConfirmRemove(liq)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Retirer urgence</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Retirer le marquage urgent ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez retirer le marquage urgent de la liquidation{' '}
              <span className="font-mono font-medium">{confirmRemove?.numero}</span>.
              <br />
              Cette action ne supprimera pas la liquidation elle-même.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUrgent}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? 'Retrait...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UrgentLiquidationList;
