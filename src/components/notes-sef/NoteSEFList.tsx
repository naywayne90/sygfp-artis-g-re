import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NoteSEF } from '@/hooks/useNotesSEF';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  FileText,
  FolderOpen,
  ExternalLink,
  AlertCircle,
  Plus,
  RefreshCw,
  Paperclip,
  RotateCcw,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ARTIReferenceInline } from '@/components/shared/ARTIReferenceBadge';

interface NoteSEFListProps {
  notes: NoteSEF[];
  title: string;
  description?: string;
  onEdit?: (note: NoteSEF) => void;
  onView?: (note: NoteSEF) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteSEF) => void;
  onDefer?: (note: NoteSEF) => void;
  onResume?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onCreate?: () => void;
  onRetry?: () => void;
  showActions?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  error?: string | null;
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    soumis: {
      label: 'Soumis',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    a_valider: { label: 'À valider', className: 'bg-warning/10 text-warning border-warning/20' },
    valide: { label: 'Validé', className: 'bg-success/10 text-success border-success/20' },
    valide_auto: {
      label: 'Validé (auto)',
      className: 'bg-success/10 text-success border-success/20 border-dashed',
    },
    rejete: {
      label: 'Rejeté',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Différé',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
  };
  const variant = variants[status || 'brouillon'] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
    normale: { label: 'Normale', className: 'bg-secondary text-secondary-foreground' },
    haute: { label: 'Haute', className: 'bg-warning text-warning-foreground' },
    urgente: { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
  };
  const variant = variants[urgence || 'normale'] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

// Composant skeleton pour le chargement
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8 rounded" />
      </TableCell>
    </TableRow>
  );
}

export function NoteSEFList({
  notes,
  title,
  description,
  onEdit,
  onView,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  onResume,
  onDelete,
  onCreate,
  onRetry,
  showActions = true,
  emptyMessage = 'Aucune note trouvée',
  isLoading = false,
  error = null,
}: NoteSEFListProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF']);

  // Navigation vers la page détail avec conservation du contexte
  const handleNavigateToDetail = (note: NoteSEF) => {
    const currentTab = searchParams.get('tab') || '';
    const detailUrl = currentTab
      ? `/notes-sef/${note.id}?tab=${currentTab}`
      : `/notes-sef/${note.id}`;
    navigate(detailUrl);
  };

  // État d'erreur
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // État de chargement avec skeleton
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="hidden lg:table-cell">Demandeur</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead className="hidden xl:table-cell">Date souhaitée</TableHead>
                <TableHead className="hidden 2xl:table-cell">Exposé</TableHead>
                <TableHead className="hidden 2xl:table-cell">Avis</TableHead>
                <TableHead className="hidden 2xl:table-cell">Recommandations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden 2xl:table-cell text-center">PJ</TableHead>
                <TableHead className="hidden xl:table-cell">Créée le</TableHead>
                {showActions && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        ) : notes.length === 0 ? (
          // État vide amélioré
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">{emptyMessage}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Les notes apparaîtront ici une fois créées
              </p>
            </div>
            {onCreate && (
              <Button onClick={onCreate} className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Créer une note SEF
              </Button>
            )}
          </div>
        ) : (
          // Table avec données
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="hidden lg:table-cell">Demandeur</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead className="hidden xl:table-cell">Date souhaitée</TableHead>
                <TableHead className="hidden 2xl:table-cell">Exposé</TableHead>
                <TableHead className="hidden 2xl:table-cell">Avis</TableHead>
                <TableHead className="hidden 2xl:table-cell">Recommandations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden 2xl:table-cell text-center">PJ</TableHead>
                <TableHead className="hidden xl:table-cell">Créée le</TableHead>
                {showActions && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow
                  key={note.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => (onView ? onView(note) : handleNavigateToDetail(note))}
                >
                  <TableCell className="font-medium">
                    {note.dossier_ref ? (
                      <span className="font-mono text-primary">{note.dossier_ref}</span>
                    ) : (
                      <ARTIReferenceInline
                        reference={note.reference_pivot || note.numero}
                        className="text-primary"
                      />
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                    {note.objet}
                  </TableCell>
                  <TableCell>
                    {note.direction?.sigle ||
                      note.direction?.label ||
                      (note.numero?.startsWith('MIG-') ||
                      /^\d{4}-\d{4}-/.test(note.numero || '') ? (
                        <Badge variant="outline" className="text-xs bg-muted">
                          Migré
                        </Badge>
                      ) : (
                        '—'
                      ))}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {note.demandeur ? (
                      `${note.demandeur.first_name || ''} ${note.demandeur.last_name || ''}`.trim() ||
                      '—'
                    ) : note.numero?.startsWith('MIG-') ||
                      /^\d{4}-\d{4}-/.test(note.numero || '') ? (
                      <Badge variant="outline" className="text-xs bg-muted">
                        Migré
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{getUrgenceBadge(note.urgence)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {note.date_souhaitee
                      ? format(new Date(note.date_souhaitee), 'dd MMM yyyy', { locale: fr })
                      : '—'}
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell max-w-[120px]">
                    <span
                      className="line-clamp-1 text-sm text-muted-foreground"
                      title={note.expose || ''}
                    >
                      {note.expose
                        ? note.expose.substring(0, 40) + (note.expose.length > 40 ? '...' : '')
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell max-w-[120px]">
                    <span
                      className="line-clamp-1 text-sm text-muted-foreground"
                      title={note.avis || ''}
                    >
                      {note.avis
                        ? note.avis.substring(0, 40) + (note.avis.length > 40 ? '...' : '')
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell max-w-[120px]">
                    <span
                      className="line-clamp-1 text-sm text-muted-foreground"
                      title={note.recommandations || ''}
                    >
                      {note.recommandations
                        ? note.recommandations.substring(0, 40) +
                          (note.recommandations.length > 40 ? '...' : '')
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(note.statut)}
                      {note.dossier_id && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-success/10 text-success">
                                <FolderOpen className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Dossier créé</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell text-center">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(note as any).pieces_count > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="gap-1">
                              <Paperclip className="h-3 w-3" />
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(note as any).pieces_count}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <p>{(note as any).pieces_count} pièce(s) jointe(s)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {format(new Date(note.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleNavigateToDetail(note)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ouvrir la page
                          </DropdownMenuItem>
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(note)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Panneau de détail
                            </DropdownMenuItem>
                          )}

                          {note.statut === 'brouillon' && onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                          )}

                          {note.statut === 'brouillon' && onSubmit && (
                            <DropdownMenuItem onClick={() => onSubmit(note.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Soumettre
                            </DropdownMenuItem>
                          )}

                          {canValidate &&
                            (note.statut === 'soumis' ||
                              note.statut === 'a_valider' ||
                              note.statut === 'differe') && (
                              <>
                                <DropdownMenuSeparator />
                                {onValidate && (
                                  <DropdownMenuItem onClick={() => onValidate(note.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                    Valider
                                  </DropdownMenuItem>
                                )}
                                {onReject && note.statut !== 'differe' && (
                                  <DropdownMenuItem onClick={() => onReject(note)}>
                                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                    Rejeter
                                  </DropdownMenuItem>
                                )}
                                {onDefer && note.statut !== 'differe' && (
                                  <DropdownMenuItem onClick={() => onDefer(note)}>
                                    <Clock className="mr-2 h-4 w-4 text-warning" />
                                    Différer
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                          {/* Bouton Reprendre pour les notes différées ou rejetées (créateur/admin) */}
                          {(note.statut === 'differe' || note.statut === 'rejete') && onResume && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onResume(note.id)}>
                                <RotateCcw className="mr-2 h-4 w-4 text-primary" />
                                Reprendre / Re-soumettre
                              </DropdownMenuItem>
                            </>
                          )}

                          {note.statut === 'brouillon' && onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(note.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
