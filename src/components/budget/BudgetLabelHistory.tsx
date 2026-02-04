/**
 * BudgetLabelHistory - Timeline des modifications de libellés budgétaires
 * Affiche l'historique avec possibilité de restaurer une version précédente
 */

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  useBudgetLabelEditor,
  type BudgetEntityType,
  type BudgetLabelEntity,
  type BudgetLabelHistory as BudgetLabelHistoryType,
} from "@/hooks/useBudgetLabelEditor";

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetLabelHistoryProps {
  /** Type d'entité budgétaire */
  entityType: BudgetEntityType;
  /** L'entité dont on affiche l'historique */
  entity: BudgetLabelEntity;
  /** Hauteur max du conteneur (scroll) */
  maxHeight?: number;
  /** Afficher le bouton de restauration */
  showRestore?: boolean;
  /** Mode d'affichage */
  variant?: "timeline" | "compact" | "dialog";
  /** Callback après restauration réussie */
  onRestoreSuccess?: () => void;
  /** Classe CSS additionnelle */
  className?: string;
}

export interface BudgetLabelHistoryDialogProps {
  /** Type d'entité budgétaire */
  entityType: BudgetEntityType;
  /** L'entité dont on affiche l'historique */
  entity: BudgetLabelEntity;
  /** Dialog ouvert */
  open: boolean;
  /** Callback pour fermer */
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// COMPOSANT: Timeline Item
// ============================================================================

interface TimelineItemProps {
  history: BudgetLabelHistoryType;
  isFirst: boolean;
  isLast: boolean;
  onRestore?: () => void;
  showRestore: boolean;
}

function TimelineItem({ history, isFirst, isLast, onRestore, showRestore }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = format(new Date(history.modifie_at), "dd MMMM yyyy 'à' HH:mm", {
    locale: fr,
  });
  const relativeDate = formatDistanceToNow(new Date(history.modifie_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="relative pl-6">
      {/* Ligne verticale */}
      {!isLast && (
        <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border" />
      )}

      {/* Point sur la timeline */}
      <div
        className={cn(
          "absolute left-0 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center",
          isFirst ? "border-primary bg-primary" : "border-muted-foreground"
        )}
      >
        {isFirst && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Contenu */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="pb-6">
          <CollapsibleTrigger asChild>
            <div
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                "hover:bg-muted/50",
                isFirst && "bg-primary/5 border border-primary/20"
              )}
            >
              <div className="flex-1 min-w-0">
                {/* En-tête */}
                <div className="flex items-center gap-2 mb-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    Modification du libellé
                  </span>
                  {isFirst && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Actuel
                    </Badge>
                  )}
                </div>

                {/* Aperçu */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                  <Clock className="h-3 w-3" />
                  <span>{relativeDate}</span>
                  {history.modifie_par_nom && (
                    <>
                      <span className="text-muted-foreground/50">|</span>
                      <User className="h-3 w-3" />
                      <span>{history.modifie_par_nom}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bouton restaurer */}
              {showRestore && !isFirst && onRestore && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore();
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Restaurer cette version</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="pl-6 pt-2 space-y-3">
              {/* Ancien libellé */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Ancien libellé:</span>
                <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm border-l-2 border-red-300">
                  {history.ancien_libelle || <em className="text-muted-foreground">Vide</em>}
                </div>
              </div>

              {/* Nouveau libellé */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Nouveau libellé:</span>
                <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm border-l-2 border-green-300">
                  {history.nouveau_libelle || <em className="text-muted-foreground">Vide</em>}
                </div>
              </div>

              {/* Motif */}
              {history.motif && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Motif:
                  </span>
                  <div className="p-2 bg-muted/50 rounded text-sm">
                    {history.motif}
                  </div>
                </div>
              )}

              {/* Détails */}
              <div className="text-xs text-muted-foreground">
                {formattedDate}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function BudgetLabelHistory({
  entityType,
  entity,
  maxHeight = 400,
  showRestore = true,
  variant = "timeline",
  onRestoreSuccess,
  className,
}: BudgetLabelHistoryProps) {
  const { fetchHistory, restoreLabel, isRestoring, getEntityTypeName } = useBudgetLabelEditor();

  const [history, setHistory] = useState<BudgetLabelHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<BudgetLabelHistoryType | null>(null);

  // Charger l'historique
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHistory(entityType, entity.id);
        setHistory(data);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [entityType, entity.id, fetchHistory]);

  const handleRestoreClick = (item: BudgetLabelHistoryType) => {
    setSelectedHistory(item);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (!selectedHistory) return;

    restoreLabel(
      {
        entityType,
        entityId: entity.id,
        historyId: selectedHistory.id,
        oldValue: selectedHistory.ancien_libelle || "",
      },
      {
        onSuccess: () => {
          setRestoreDialogOpen(false);
          setSelectedHistory(null);
          // Recharger l'historique
          fetchHistory(entityType, entity.id).then(setHistory);
          onRestoreSuccess?.();
        },
      }
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 pl-6">
            <Skeleton className="w-5 h-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Empty state
  // ────────────────────────────────────────────────────────────────────────────

  if (history.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">
          Aucune modification enregistrée pour ce libellé
        </p>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Compact mode
  // ────────────────────────────────────────────────────────────────────────────

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <History className="h-4 w-4" />
          <span>{history.length} modification{history.length > 1 ? "s" : ""}</span>
        </div>
        {history.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[200px]">{item.nouveau_libelle}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.modifie_at), { addSuffix: true, locale: fr })}
            </span>
          </div>
        ))}
        {history.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{history.length - 3} autre{history.length - 3 > 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Timeline mode
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>
              Historique des modifications ({history.length})
            </span>
          </div>
          <Badge variant="outline">
            {getEntityTypeName(entityType)}: {entity.code}
          </Badge>
        </div>

        {/* Timeline */}
        <ScrollArea style={{ maxHeight }}>
          <div className="pr-4">
            {history.map((item, index) => (
              <TimelineItem
                key={item.id}
                history={item}
                isFirst={index === 0}
                isLast={index === history.length - 1}
                showRestore={showRestore}
                onRestore={() => handleRestoreClick(item)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Dialog de confirmation de restauration */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la restauration</DialogTitle>
            <DialogDescription>
              Voulez-vous restaurer l'ancienne version du libellé ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cette action va remplacer le libellé actuel par l'ancienne version.
                L'opération sera enregistrée dans l'historique.
              </AlertDescription>
            </Alert>

            {selectedHistory && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Valeur à restaurer:
                  </span>
                  <div className="p-3 bg-primary/10 rounded-md font-medium">
                    {selectedHistory.ancien_libelle}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Date de l'ancienne modification:{" "}
                  {format(new Date(selectedHistory.modifie_at), "dd/MM/yyyy HH:mm", {
                    locale: fr,
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={isRestoring}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleConfirmRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restauration...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// COMPOSANT: Dialog d'historique
// ============================================================================

export function BudgetLabelHistoryDialog({
  entityType,
  entity,
  open,
  onOpenChange,
}: BudgetLabelHistoryDialogProps) {
  const { getEntityTypeName } = useBudgetLabelEditor();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
          </DialogTitle>
          <DialogDescription>
            {getEntityTypeName(entityType)}: <strong>{entity.code}</strong> - {entity.libelle}
          </DialogDescription>
        </DialogHeader>

        <BudgetLabelHistory
          entityType={entityType}
          entity={entity}
          maxHeight={400}
          showRestore={true}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BudgetLabelHistory;
