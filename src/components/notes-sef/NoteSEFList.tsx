import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { NoteSEF } from "@/hooks/useNotesSEF";
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
  FolderOpen,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onDelete?: (noteId: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
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
  onDelete,
  showActions = true,
  emptyMessage = "Aucune note trouvée",
}: NoteSEFListProps) {
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);

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
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium font-mono">
                    {note.numero || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                    {note.objet}
                  </TableCell>
                  <TableCell>
                    {note.direction?.sigle || note.direction?.label || "—"}
                  </TableCell>
                  <TableCell>{getUrgenceBadge(note.urgence)}</TableCell>
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
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {format(new Date(note.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(note)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                          )}

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
