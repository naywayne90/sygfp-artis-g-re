import { useBudgetHistory } from "@/hooks/useBudgetTransfers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, RefreshCw, FileInput, PenLine } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetMovementHistoryProps {
  budgetLineId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(amount)) + " FCFA";
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  virement_debit: <ArrowDownRight className="h-4 w-4 text-red-500" />,
  virement_credit: <ArrowUpRight className="h-4 w-4 text-green-500" />,
  ajustement: <RefreshCw className="h-4 w-4 text-blue-500" />,
  import: <FileInput className="h-4 w-4 text-purple-500" />,
  creation: <PenLine className="h-4 w-4 text-gray-500" />,
  modification: <PenLine className="h-4 w-4 text-orange-500" />,
};

const EVENT_LABELS: Record<string, string> = {
  virement_debit: "Virement (débit)",
  virement_credit: "Virement (crédit)",
  ajustement: "Ajustement",
  import: "Import",
  creation: "Création",
  modification: "Modification",
};

export function BudgetMovementHistory({ budgetLineId }: BudgetMovementHistoryProps) {
  const { history, isLoading } = useBudgetHistory(budgetLineId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun mouvement enregistré
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {history.map((event) => (
          <Card key={event.id} className="border-l-4" style={{
            borderLeftColor: event.delta > 0 ? "rgb(34, 197, 94)" : event.delta < 0 ? "rgb(239, 68, 68)" : "rgb(156, 163, 175)"
          }}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {EVENT_ICONS[event.event_type] || <RefreshCw className="h-4 w-4" />}
                  <CardTitle className="text-sm font-medium">
                    {EVENT_LABELS[event.event_type] || event.event_type}
                  </CardTitle>
                  {event.ref_code && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.ref_code}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Montant:</span>{" "}
                  <span className={`font-mono font-medium ${event.delta > 0 ? "text-green-600" : event.delta < 0 ? "text-red-600" : ""}`}>
                    {event.delta > 0 ? "+" : ""}{formatCurrency(event.delta)}
                  </span>
                </div>
                {event.dotation_avant !== null && event.dotation_apres !== null && (
                  <div>
                    <span className="text-muted-foreground">Dotation:</span>{" "}
                    <span className="font-mono">
                      {formatCurrency(event.dotation_avant)} → {formatCurrency(event.dotation_apres)}
                    </span>
                  </div>
                )}
              </div>
              {event.commentaire && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {event.commentaire}
                </p>
              )}
              {event.created_by_profile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Par: {event.created_by_profile.full_name}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
