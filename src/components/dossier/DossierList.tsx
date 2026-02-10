import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  History, 
  Paperclip, 
  RefreshCw,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Dossier } from "@/hooks/useDossiers";
import { DossierEmptyState } from "./DossierEmptyState";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DossierListProps {
  dossiers: Dossier[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onView: (dossier: Dossier) => void;
  onEdit: (dossier: Dossier) => void;
  onHistory: (dossier: Dossier) => void;
  onAttach: (dossier: Dossier) => void;
  onChangeStatus: (dossier: Dossier) => void;
  onAssign: (dossier: Dossier) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSort: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  hasFilters?: boolean;
  searchTerm?: string;
  onReset?: () => void;
  onCreate?: () => void;
}

const STATUT_COLORS: Record<string, string> = {
  en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  termine: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  annule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  suspendu: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const STATUT_LABELS: Record<string, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
  suspendu: "Suspendu",
};

const ETAPE_LABELS: Record<string, string> = {
  note: "Note",
  expression_besoin: "Expression besoin",
  marche: "Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
};

const TYPE_COLORS: Record<string, string> = {
  AEF: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  SEF: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  MARCHE: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

export function DossierList({ 
  dossiers, 
  loading, 
  pagination,
  onView, 
  onEdit, 
  onHistory,
  onAttach,
  onChangeStatus,
  onAssign,
  onPageChange,
  onPageSizeChange,
  onSort,
  _sortField,
  _sortDirection,
  hasFilters = false,
  searchTerm = "",
  onReset,
  onCreate
}: DossierListProps) {
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(montant);
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[130px]">Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="w-[120px]">Montant</TableHead>
                <TableHead className="w-[120px]">Étape</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[100px]">Modifié</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (dossiers.length === 0) {
    return (
      <DossierEmptyState 
        hasFilters={hasFilters}
        searchTerm={searchTerm}
        onReset={onReset}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[130px]">
                <SortableHeader field="numero">Numéro</SortableHeader>
              </TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="w-[80px]">Type</TableHead>
              <TableHead>Bénéficiaire</TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="montant_estime">Montant</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">Étape</TableHead>
              <TableHead className="w-[100px]">Statut</TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader field="updated_at">Modifié</SortableHeader>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dossiers.map((dossier) => (
              <TableRow
                key={dossier.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(dossier)}
              >
                <TableCell className="font-mono font-medium text-primary">
                  {dossier.numero}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="truncate" title={dossier.objet}>
                    {dossier.objet}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dossier.direction?.sigle || dossier.direction?.code || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {dossier.type_dossier && (
                    <Badge className={TYPE_COLORS[dossier.type_dossier] || ""} variant="outline">
                      {dossier.type_dossier}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <div className="truncate">
                    {dossier.beneficiaire?.raison_sociale || "-"}
                  </div>
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatMontant(dossier.montant_estime)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {ETAPE_LABELS[dossier.etape_courante] || dossier.etape_courante}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={STATUT_COLORS[dossier.statut_global] || ""}>
                    {STATUT_LABELS[dossier.statut_global] || dossier.statut_global}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(dossier.updated_at), "dd/MM/yy", { locale: fr })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(dossier)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onHistory(dossier)}>
                        <History className="h-4 w-4 mr-2" />
                        Historique
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAttach(dossier)}>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Joindre pièce
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(dossier)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeStatus(dossier)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Changer statut
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssign(dossier)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assigner à...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Afficher</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>sur {pagination.total} dossiers</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={pagination.page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm">
            Page {pagination.page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={pagination.page >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
