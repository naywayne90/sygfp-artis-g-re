import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteAEF } from "@/hooks/useNotesAEF";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  CreditCard,
  ArrowRight,
  ExternalLink,
  Paperclip,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NoteAEFListProps {
  notes: NoteAEF[];
  title: string;
  description?: string;
  onEdit?: (note: NoteAEF) => void;
  onView?: (note: NoteAEF) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteAEF) => void;
  onDefer?: (note: NoteAEF) => void;
  onImpute?: (note: NoteAEF) => void;
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
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumis: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20" },
    a_imputer: { label: "À imputer", className: "bg-success/10 text-success border-success/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    impute: { label: "Imputé", className: "bg-primary/10 text-primary border-primary/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getOriginBadge = (note: NoteAEF) => {
  const isDirectAEF = note.is_direct_aef || note.origin === 'DIRECT';
  if (isDirectAEF) {
    return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Direct DG</Badge>;
  }
  if (note.note_sef_id) {
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Via SEF</Badge>;
  }
  return <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">—</Badge>;
};

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground" },
    urgente: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number | null) => {
  if (!montant) return "—";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

// Composant skeleton pour le chargement
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );
}

export function NoteAEFList({
  notes,
  title,
  description,
  onEdit,
  onView,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  onImpute,
  onDelete,
  onCreate,
  onRetry,
  showActions = true,
  emptyMessage = "Aucune note trouvée",
  isLoading = false,
  error = null,
}: NoteAEFListProps) {
  const navigate = useNavigate();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["ADMIN", "DG"]);
  const canImpute = hasAnyRole(["ADMIN", "DAAF", "CB"]);

  const handleGoToImputation = (note: NoteAEF) => {
    navigate(`/execution/imputation?sourceAef=${note.id}`);
  };

  const handleNavigateToDetail = (noteId: string) => {
    navigate(`/notes-aef/${noteId}`);
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
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden xl:table-cell text-center">PJ</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
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
                Créer une note AEF
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden xl:table-cell text-center">PJ</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow 
                  key={note.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleNavigateToDetail(note.id)}
                >
                  <TableCell className="font-medium">
                    <span className="font-mono text-sm">
                      {note.reference_pivot || note.numero || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {note.objet}
                  </TableCell>
                  <TableCell>
                    {note.direction?.sigle || note.direction?.label || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMontant(note.montant_estime)}
                  </TableCell>
                  <TableCell>{getOriginBadge(note)}</TableCell>
                  <TableCell>{getStatusBadge(note.statut)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-center">
                    {(note as any).attachments_count > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="gap-1">
                              <Paperclip className="h-3 w-3" />
                              {(note as any).attachments_count}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{(note as any).attachments_count} pièce(s) jointe(s)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {format(new Date(note.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        {/* Bouton Imputer visible directement pour les notes a_imputer */}
                        {note.statut === "a_imputer" && !note.imputed_at && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={(e) => { e.stopPropagation(); handleGoToImputation(note); }}
                            className="gap-1"
                          >
                            <CreditCard className="h-3 w-3" />
                            Imputer
                          </Button>
                        )}
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleNavigateToDetail(note.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ouvrir la page
                          </DropdownMenuItem>
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(note)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Aperçu rapide
                            </DropdownMenuItem>
                          )}

                          {/* Actions pour BROUILLON */}
                          {note.statut === "brouillon" && onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                          )}

                          {note.statut === "brouillon" && onSubmit && (
                            <DropdownMenuItem onClick={() => onSubmit(note.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Soumettre
                            </DropdownMenuItem>
                          )}

                          {/* Actions pour A_VALIDER / SOUMIS - DG only */}
                          {canValidate && (note.statut === "soumis" || note.statut === "a_valider") && (
                            <>
                              <DropdownMenuSeparator />
                              {onValidate && (
                                <DropdownMenuItem onClick={() => onValidate(note.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                  Valider
                                </DropdownMenuItem>
                              )}
                              {onReject && (
                                <DropdownMenuItem onClick={() => onReject(note)}>
                                  <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                  Rejeter
                                </DropdownMenuItem>
                              )}
                              {onDefer && (
                                <DropdownMenuItem onClick={() => onDefer(note)}>
                                  <Clock className="mr-2 h-4 w-4 text-warning" />
                                  Différer
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {/* Actions pour A_IMPUTER - Bouton Imputer principal */}
                          {note.statut === "a_imputer" && !note.imputed_at && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleGoToImputation(note)}
                                className="text-primary font-medium"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Imputer
                              </DropdownMenuItem>
                              {canImpute && onImpute && (
                                <DropdownMenuItem onClick={() => onImpute(note)}>
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Imputation rapide
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {/* Suppression pour brouillons */}
                          {note.statut === "brouillon" && onDelete && (
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
                      </div>
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
