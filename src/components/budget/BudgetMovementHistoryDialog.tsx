import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  FileText, 
  Banknote,
  Download,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useBudgetHistory } from "@/hooks/useBudgetTransfers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetMovementHistoryDialogProps {
  budgetLineId: string | null;
  budgetLineCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  icon: React.ComponentType<{ className?: string }>;
  direction: "in" | "out" | "neutral";
}> = {
  import_initial: { 
    label: "Import initial", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Download,
    direction: "neutral"
  },
  virement_emis: { 
    label: "Virement émis", 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: ArrowUpRight,
    direction: "out"
  },
  virement_recu: { 
    label: "Virement reçu", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: ArrowDownRight,
    direction: "in"
  },
  engagement: { 
    label: "Engagement", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: FileText,
    direction: "out"
  },
  liquidation: { 
    label: "Liquidation", 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: Banknote,
    direction: "out"
  },
  ajustement: { 
    label: "Ajustement", 
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    icon: RefreshCw,
    direction: "neutral"
  },
};

export function BudgetMovementHistoryDialog({
  budgetLineId,
  budgetLineCode,
  open,
  onOpenChange,
}: BudgetMovementHistoryDialogProps) {
  const { history, isLoading } = useBudgetHistory(budgetLineId || undefined);
  const [filterType, setFilterType] = useState<string>("all");

  const formatMontant = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.abs(amount)) + " FCFA";
  };

  const filteredHistory = history?.filter(h => 
    filterType === "all" || h.event_type === filterType
  );

  // Calculer les totaux
  const totals = {
    initial: history?.find(h => h.event_type === "import_initial")?.delta || 0,
    virementsRecus: history?.filter(h => h.event_type === "virement_recu")
      .reduce((s, h) => s + h.delta, 0) || 0,
    virementsEmis: history?.filter(h => h.event_type === "virement_emis")
      .reduce((s, h) => s + Math.abs(h.delta), 0) || 0,
    engagements: history?.filter(h => h.event_type === "engagement")
      .reduce((s, h) => s + Math.abs(h.delta), 0) || 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Historique des mouvements
            {budgetLineCode && (
              <Badge variant="outline" className="font-mono">{budgetLineCode}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Résumé des mouvements */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Initial</p>
              <p className="font-bold text-blue-600">{formatMontant(totals.initial)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" /> Reçu
              </p>
              <p className="font-bold text-green-600">+{formatMontant(totals.virementsRecus)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingDown className="h-3 w-3" /> Émis
              </p>
              <p className="font-bold text-red-600">-{formatMontant(totals.virementsEmis)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Engagé</p>
              <p className="font-bold text-orange-600">-{formatMontant(totals.engagements)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtre par type */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrer par :</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mouvements</SelectItem>
              <SelectItem value="import_initial">Import initial</SelectItem>
              <SelectItem value="virement_emis">Virements émis</SelectItem>
              <SelectItem value="virement_recu">Virements reçus</SelectItem>
              <SelectItem value="engagement">Engagements</SelectItem>
              <SelectItem value="liquidation">Liquidations</SelectItem>
              <SelectItem value="ajustement">Ajustements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : !filteredHistory?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun mouvement trouvé
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((movement) => {
                const config = EVENT_TYPE_CONFIG[movement.event_type] || {
                  label: movement.event_type,
                  color: "bg-muted",
                  icon: RefreshCw,
                  direction: "neutral"
                };
                const Icon = config.icon;

                return (
                  <div
                    key={movement.id}
                    className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        {movement.ref_code && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {movement.ref_code}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </span>
                      </div>
                      
                      {movement.commentaire && (
                        <p className="text-sm text-muted-foreground truncate">
                          {movement.commentaire}
                        </p>
                      )}
                      
                      {/* Affichage avant/après */}
                      {(movement.dotation_avant !== null || movement.disponible_avant !== null) && (
                        <div className="flex gap-4 mt-2 text-xs">
                          {movement.dotation_avant !== null && (
                            <div>
                              <span className="text-muted-foreground">Dotation:</span>{" "}
                              <span className="font-mono">{formatMontant(movement.dotation_avant)}</span>
                              {movement.dotation_apres !== null && (
                                <>
                                  {" → "}
                                  <span className="font-mono font-medium">{formatMontant(movement.dotation_apres)}</span>
                                </>
                              )}
                            </div>
                          )}
                          {movement.disponible_avant !== null && (
                            <div>
                              <span className="text-muted-foreground">Dispo:</span>{" "}
                              <span className="font-mono">{formatMontant(movement.disponible_avant)}</span>
                              {movement.disponible_apres !== null && (
                                <>
                                  {" → "}
                                  <span className={`font-mono font-medium ${(movement.disponible_apres || 0) < 0 ? 'text-destructive' : ''}`}>
                                    {formatMontant(movement.disponible_apres)}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`text-right font-mono font-bold ${
                      config.direction === "in" ? "text-green-600" :
                      config.direction === "out" ? "text-red-600" :
                      "text-foreground"
                    }`}>
                      {config.direction === "in" ? "+" : config.direction === "out" ? "-" : ""}
                      {formatMontant(movement.delta)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}