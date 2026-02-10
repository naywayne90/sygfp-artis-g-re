/**
 * Liste des Notes Direction Générale (Notes DG officielles)
 * Affiche les notes avec filtres, tri et actions
 */

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
import {
  NoteDirectionGenerale,
  NoteDGStatut,
} from "@/hooks/useNotesDirectionGenerale";
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
  Trash2,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Share2,
  RotateCcw,
} from "lucide-react";

interface NoteDGListProps {
  notes: NoteDirectionGenerale[];
  title: string;
  description?: string;
  onEdit?: (note: NoteDirectionGenerale) => void;
  onView?: (note: NoteDirectionGenerale) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteDirectionGenerale) => void;
  onDiffuse?: (noteId: string) => void;
  onRevertToDraft?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onCreate?: () => void;
  onRetry?: () => void;
  showActions?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  error?: string | null;
}

const getStatusBadge = (status: NoteDGStatut) => {
  const variants: Record<NoteDGStatut, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumise_dg: { label: "Soumise au DG", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    dg_valide: { label: "Validée DG", className: "bg-success/10 text-success border-success/20" },
    dg_rejetee: { label: "Rejetée", className: "bg-destructive/10 text-destructive border-destructive/20" },
    diffusee: { label: "Diffusée", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  };
  const variant = variants[status] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

// Composant skeleton pour le chargement
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell className="hidden 2xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );
}

export function NoteDGList({
  notes,
  title,
  description,
  onEdit,
  onView,
  onSubmit,
  onValidate,
  onReject,
  onDiffuse,
  onRevertToDraft,
  onDelete,
  onCreate,
  onRetry,
  showActions = true,
  emptyMessage = "Aucune note trouvée",
  isLoading = false,
  error = null,
}: NoteDGListProps) {
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["Admin", "DG"]);

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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
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

  // État de chargement
  if (isLoading) {
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Objet</TableHead>
                  <TableHead className="hidden lg:table-cell">Destinataire</TableHead>
                  <TableHead className="hidden xl:table-cell">Exposé</TableHead>
                  <TableHead className="hidden xl:table-cell">Avis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Créé le</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État vide
  if (!notes || notes.length === 0) {
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{emptyMessage}</p>
            {onCreate && (
              <Button onClick={onCreate} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Créer une note
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead className="hidden lg:table-cell">Destinataire</TableHead>
                <TableHead className="hidden xl:table-cell">Exposé</TableHead>
                <TableHead className="hidden xl:table-cell">Avis</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden 2xl:table-cell">Créé le</TableHead>
                {showActions && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow
                  key={note.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onView?.(note)}
                >
                  <TableCell className="font-mono text-sm">
                    {note.reference || "-"}
                  </TableCell>
                  <TableCell>
                    {note.date_note
                      ? format(new Date(note.date_note), "dd/MM/yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[300px]">
                    <span className="line-clamp-1" title={note.objet}>
                      {note.objet}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="line-clamp-1" title={note.destinataire}>
                      {note.destinataire}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell max-w-[150px]">
                    <span className="line-clamp-1 text-sm text-muted-foreground" title={(note as any).expose || ""}>
                      {(note as any).expose ? (note as any).expose.substring(0, 50) + ((note as any).expose.length > 50 ? "..." : "") : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell max-w-[150px]">
                    <span className="line-clamp-1 text-sm text-muted-foreground" title={(note as any).avis || ""}>
                      {(note as any).avis ? (note as any).avis.substring(0, 50) + ((note as any).avis.length > 50 ? "..." : "") : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(note.statut)}
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell text-muted-foreground">
                    {format(new Date(note.created_at), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Voir détails */}
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(note)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                          )}

                          {/* Modifier (brouillon ou rejeté) */}
                          {onEdit && ["brouillon", "dg_rejetee"].includes(note.statut) && (
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Soumettre au DG (brouillon) */}
                          {onSubmit && note.statut === "brouillon" && (
                            <DropdownMenuItem onClick={() => onSubmit(note.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Soumettre au DG
                            </DropdownMenuItem>
                          )}

                          {/* Revenir en brouillon (rejeté) */}
                          {onRevertToDraft && note.statut === "dg_rejetee" && (
                            <DropdownMenuItem onClick={() => onRevertToDraft(note.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reprendre en brouillon
                            </DropdownMenuItem>
                          )}

                          {/* Valider (DG only, soumise) */}
                          {onValidate && canValidate && note.statut === "soumise_dg" && (
                            <DropdownMenuItem onClick={() => onValidate(note.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider
                            </DropdownMenuItem>
                          )}

                          {/* Rejeter (DG only, soumise) */}
                          {onReject && canValidate && note.statut === "soumise_dg" && (
                            <DropdownMenuItem
                              onClick={() => onReject(note)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </DropdownMenuItem>
                          )}

                          {/* Diffuser (validée) */}
                          {onDiffuse && note.statut === "dg_valide" && (
                            <DropdownMenuItem onClick={() => onDiffuse(note.id)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Diffuser
                            </DropdownMenuItem>
                          )}

                          {/* Supprimer (brouillon uniquement) */}
                          {onDelete && note.statut === "brouillon" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(note.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
        </div>
      </CardContent>
    </Card>
  );
}

export default NoteDGList;
