/**
 * NotesSEFTable - Tableau des Notes SEF avec colonnes triables
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { NoteSEFEntity } from '@/lib/notes-sef/types';
import {
  STATUT_LABELS,
  STATUT_BADGE_VARIANTS,
} from '@/lib/notes-sef/constants';
import { ValidationButtons } from '@/components/validation';

interface NotesSEFTableProps {
  notes: NoteSEFEntity[];
  isLoading?: boolean;
  onRefresh?: () => void;
  showValidationButtons?: boolean;
}

type SortKey = 'reference' | 'objet' | 'direction' | 'montant' | 'statut' | 'created_at';
type SortOrder = 'asc' | 'desc';

// Tronquer le texte avec tooltip
function TruncatedText({
  text,
  maxLength = 100,
}: {
  text: string | null;
  maxLength?: number;
}) {
  if (!text) return <span className="text-muted-foreground">—</span>;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{text.slice(0, maxLength)}...</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <p className="whitespace-pre-wrap">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Formater le montant
function formatMontant(montant: number | null | undefined): string {
  if (montant == null) return '—';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

// Badge de statut coloré
function StatutBadge({ statut }: { statut: string | null }) {
  if (!statut) return <Badge variant="outline">—</Badge>;

  const config = STATUT_BADGE_VARIANTS[statut as keyof typeof STATUT_BADGE_VARIANTS];
  const label = STATUT_LABELS[statut as keyof typeof STATUT_LABELS] || statut;

  return (
    <Badge className={cn('font-medium', config?.className || 'bg-muted')}>
      {label}
    </Badge>
  );
}

// Skeleton de ligne
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
    </TableRow>
  );
}

export function NotesSEFTable({
  notes,
  isLoading = false,
  onRefresh,
  showValidationButtons = false,
}: NotesSEFTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Toggle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Sort icon
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Sortable header
  const SortableHeader = ({
    columnKey,
    children,
  }: {
    columnKey: SortKey;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => handleSort(columnKey)}
    >
      {children}
      <SortIcon columnKey={columnKey} />
    </Button>
  );

  // Sort notes
  const sortedNotes = [...notes].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case 'reference':
        comparison = (a.reference_pivot || '').localeCompare(b.reference_pivot || '');
        break;
      case 'objet':
        comparison = (a.objet || '').localeCompare(b.objet || '');
        break;
      case 'direction':
        comparison = (a.direction?.label || '').localeCompare(b.direction?.label || '');
        break;
      case 'statut':
        comparison = (a.statut || '').localeCompare(b.statut || '');
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Vérifier si la note peut être validée
  const canValidate = (note: NoteSEFEntity) => {
    return ['soumis', 'a_valider'].includes(note.statut || '');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">N°</TableHead>
            <TableHead className="w-32">
              <SortableHeader columnKey="reference">Référence</SortableHeader>
            </TableHead>
            <TableHead className="min-w-[200px]">
              <SortableHeader columnKey="objet">Objet</SortableHeader>
            </TableHead>
            <TableHead className="w-32">
              <SortableHeader columnKey="direction">Direction</SortableHeader>
            </TableHead>
            <TableHead className="w-32">Montant</TableHead>
            <TableHead className="w-28">
              <SortableHeader columnKey="statut">Statut</SortableHeader>
            </TableHead>
            <TableHead className="w-28">
              <SortableHeader columnKey="created_at">Créée le</SortableHeader>
            </TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
          ) : sortedNotes.length === 0 ? (
            // Empty state
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p>Aucune note trouvée</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // Data rows
            sortedNotes.map((note, index) => (
              <TableRow
                key={note.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/notes-sef/${note.id}`)}
              >
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {note.reference_pivot || note.numero || '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TruncatedText text={note.objet} maxLength={80} />
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {note.direction?.sigle || note.direction?.label || '—'}
                  </span>
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatMontant(null)} {/* montant_estime non disponible */}
                </TableCell>
                <TableCell>
                  <StatutBadge statut={note.statut} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(note.created_at), 'dd/MM/yyyy', { locale: fr })}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {showValidationButtons && canValidate(note) ? (
                    <ValidationButtons
                      entityType="notes_sef"
                      entityId={note.id}
                      currentStatus={note.statut || 'brouillon'}
                      onSuccess={onRefresh}
                      size="sm"
                    />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/notes-sef/${note.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                        {canValidate(note) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Valider
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600">
                              <Clock className="mr-2 h-4 w-4" />
                              Différer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
