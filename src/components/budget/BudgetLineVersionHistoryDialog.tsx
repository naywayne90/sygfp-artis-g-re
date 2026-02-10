/**
 * BudgetLineVersionHistoryDialog - Historique des versions avec restauration
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  RotateCcw,
  Loader2,
  User,
  Calendar,
  FileEdit,
  Ban,
  CheckCircle,
  Plus,
  Eye,
} from "lucide-react";
import {
  useBudgetLineVersions,
  BudgetLineVersion,
} from "@/hooks/useBudgetLineVersions";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetLineVersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(num) + " FCFA";
};

export function BudgetLineVersionHistoryDialog({
  open,
  onOpenChange,
  budgetLine,
}: BudgetLineVersionHistoryDialogProps) {
  const {
    versions,
    isLoading,
    restoreVersion,
    isRestoring,
    getVersionDiff,
    getChangeTypeLabel,
    getChangeTypeColor,
    formatValue,
  } = useBudgetLineVersions(budgetLine?.id);

  const [restoreTarget, setRestoreTarget] = useState<BudgetLineVersion | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<BudgetLineVersion | null>(null);

  const handleRestore = () => {
    if (!restoreTarget) return;

    restoreVersion({
      versionId: restoreTarget.id,
      reason: restoreReason || undefined,
    });

    setRestoreTarget(null);
    setRestoreReason("");
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "creation":
        return <Plus className="h-4 w-4" />;
      case "modification":
        return <FileEdit className="h-4 w-4" />;
      case "deactivation":
        return <Ban className="h-4 w-4" />;
      case "reactivation":
        return <CheckCircle className="h-4 w-4" />;
      case "restoration":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  if (!budgetLine) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des versions
            </DialogTitle>
            <DialogDescription>
              Ligne: <span className="font-mono font-bold">{budgetLine.code}</span> -{" "}
              {budgetLine.label}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !versions || versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune version enregistrée</p>
                <p className="text-sm">
                  L'historique des modifications sera affiché ici après la première modification.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {versions.map((version, index) => {
                  const diffs = getVersionDiff(version);
                  const isLatest = index === 0;
                  const isFirst = index === versions.length - 1;

                  return (
                    <AccordionItem key={version.id} value={version.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {getChangeTypeIcon(version.change_type)}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Version {version.version_number}</span>
                                {isLatest && (
                                  <Badge variant="default" className="text-xs">
                                    Actuelle
                                  </Badge>
                                )}
                                {isFirst && !isLatest && (
                                  <Badge variant="outline" className="text-xs">
                                    Originale
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(version.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                                {version.created_by_name && (
                                  <>
                                    <span>•</span>
                                    <User className="h-3 w-3" />
                                    <span>{version.created_by_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={getChangeTypeColor(version.change_type)}>
                            {getChangeTypeLabel(version.change_type)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2 pl-11">
                          {/* Summary */}
                          {version.change_summary && (
                            <p className="text-sm text-muted-foreground">
                              {version.change_summary}
                            </p>
                          )}

                          {/* Reason */}
                          {version.change_reason && (
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Motif:
                              </p>
                              <p className="text-sm">{version.change_reason}</p>
                            </div>
                          )}

                          {/* Diff table */}
                          {diffs.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="w-[30%]">Champ</TableHead>
                                    <TableHead className="w-[35%]">Avant</TableHead>
                                    <TableHead className="w-[35%]">Après</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {diffs.map((diff) => (
                                    <TableRow key={diff.field}>
                                      <TableCell className="font-medium">{diff.label}</TableCell>
                                      <TableCell className="text-red-600 bg-red-50/50">
                                        {formatValue(diff.field, diff.oldValue)}
                                      </TableCell>
                                      <TableCell className="text-green-600 bg-green-50/50">
                                        {formatValue(diff.field, diff.newValue)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Snapshot viewer */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVersion(version)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le snapshot
                            </Button>

                            {/* Restore button (not for latest version) */}
                            {!isLatest && version.change_type !== "restoration" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setRestoreTarget(version)}
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Restaurer cette version
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Revenir aux valeurs de la version {version.version_number}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Créé le{" "}
                            {format(new Date(version.created_at), "dd/MM/yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snapshot viewer */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Snapshot - Version {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              État de la ligne au moment de cette version
            </DialogDescription>
          </DialogHeader>

          {selectedVersion?.snapshot && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Code:</div>
                <div className="font-mono">{selectedVersion.snapshot.code}</div>

                <div className="font-medium">Libellé:</div>
                <div>{selectedVersion.snapshot.label}</div>

                <div className="font-medium">Niveau:</div>
                <div>{selectedVersion.snapshot.level}</div>

                <div className="font-medium">Dotation:</div>
                <div>{formatCurrency(selectedVersion.snapshot.dotation_initiale)}</div>

                <div className="font-medium">Source:</div>
                <div>{selectedVersion.snapshot.source_financement || "-"}</div>

                <div className="font-medium">Statut:</div>
                <div>{selectedVersion.snapshot.statut || "-"}</div>

                {selectedVersion.snapshot.commentaire && (
                  <>
                    <div className="font-medium">Commentaire:</div>
                    <div>{selectedVersion.snapshot.commentaire}</div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedVersion(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurer la version {restoreTarget?.version_number}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Vous allez restaurer les valeurs de la version{" "}
                <strong>{restoreTarget?.version_number}</strong>.
              </p>
              <p className="mb-4">
                Cette action créera une nouvelle version et les valeurs actuelles seront conservées
                dans l'historique.
              </p>

              <div className="space-y-2">
                <Label htmlFor="restore-reason">Motif de la restauration (optionnel)</Label>
                <Input
                  id="restore-reason"
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  placeholder="Ex: Annulation de la dernière modification"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restauration...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BudgetLineVersionHistoryDialog;
