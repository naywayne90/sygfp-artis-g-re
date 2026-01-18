/**
 * BudgetImportHistory - Historique des imports avec possibilité d'annulation
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Undo2,
  FileSpreadsheet,
  Loader2,
  Info,
  Ban,
} from "lucide-react";
import { useBudgetImport, BudgetImportRecord } from "@/hooks/useBudgetImport";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetImportHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  en_cours: { label: "En cours", variant: "secondary", icon: Clock },
  termine: { label: "Terminé", variant: "default", icon: CheckCircle },
  partiel: { label: "Partiel", variant: "outline", icon: AlertTriangle },
  echec: { label: "Échec", variant: "destructive", icon: XCircle },
  annule: { label: "Annulé", variant: "outline", icon: Ban },
};

export function BudgetImportHistory({ open, onOpenChange }: BudgetImportHistoryProps) {
  const { importHistory, isLoadingHistory, rollbackImport, isRollingBack, refetchHistory } = useBudgetImport();
  const [confirmRollback, setConfirmRollback] = useState<BudgetImportRecord | null>(null);

  const handleRollback = async () => {
    if (!confirmRollback) return;

    rollbackImport(confirmRollback.id);
    setConfirmRollback(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canRollback = (record: BudgetImportRecord) => {
    // Peut annuler si l'import est terminé ou partiel (pas déjà annulé ni en cours)
    return ["termine", "partiel"].includes(record.status);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Historique des imports budgétaires
            </DialogTitle>
            <DialogDescription>
              Consultez l'historique des imports et annulez si nécessaire
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !importHistory || importHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun import enregistré</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fichier</TableHead>
                    <TableHead>Lignes</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((record) => {
                    const status = statusConfig[record.status] || statusConfig.en_cours;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                <span className="text-sm">
                                  {formatDistanceToNow(new Date(record.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {formatDate(record.created_at)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[200px]">
                              {record.file_name}
                            </span>
                            {record.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {(record.file_size / 1024).toFixed(1)} Ko
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>Total: {record.total_rows}</span>
                            {record.success_rows !== null && (
                              <span className="text-green-600">
                                Succès: {record.success_rows}
                              </span>
                            )}
                            {record.error_rows !== null && record.error_rows > 0 && (
                              <span className="text-red-600">
                                Erreurs: {record.error_rows}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                          {record.cancelled_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Annulé le {formatDate(record.cancelled_at)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.user?.full_name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {record.errors && record.errors.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Info className="h-4 w-4 text-yellow-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-sm">
                                    <div className="text-sm">
                                      <strong>Erreurs:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {record.errors.slice(0, 5).map((e, i) => (
                                          <li key={i} className="truncate">
                                            L{e.row}: {e.message}
                                          </li>
                                        ))}
                                        {record.errors.length > 5 && (
                                          <li>...et {record.errors.length - 5} autres</li>
                                        )}
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {canRollback(record) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setConfirmRollback(record)}
                                      disabled={isRollingBack}
                                    >
                                      <Undo2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Annuler cet import
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => refetchHistory()}>
              Actualiser
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for rollback */}
      <AlertDialog open={!!confirmRollback} onOpenChange={() => setConfirmRollback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer l'annulation de l'import
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                Vous êtes sur le point d'annuler l'import suivant:
              </p>
              <div className="bg-muted rounded-lg p-3 mb-3">
                <p><strong>Fichier:</strong> {confirmRollback?.file_name}</p>
                <p><strong>Date:</strong> {confirmRollback && formatDate(confirmRollback.created_at)}</p>
                <p><strong>Lignes importées:</strong> {confirmRollback?.success_rows || 0}</p>
              </div>
              <p className="text-destructive font-medium">
                Cette action supprimera toutes les lignes budgétaires créées par cet import.
                Cette action est irréversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRollingBack}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRollingBack}
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Annulation en cours...
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Confirmer l'annulation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BudgetImportHistory;
