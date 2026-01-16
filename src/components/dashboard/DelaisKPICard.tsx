import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEtapeDelais } from "@/hooks/useEtapeDelais";
import { Clock, TrendingDown, TrendingUp, Timer } from "lucide-react";

export function DelaisKPICard() {
  const { data: delaisStats, isLoading } = useEtapeDelais();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-12 w-12 bg-muted rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDelai = (delai: number | null | undefined) => {
    if (delai === null || delai === undefined) return "N/A";
    return `${Math.round(delai)} j`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5 text-primary" />
          Délais de validation
        </CardTitle>
        <CardDescription>Temps moyen par étape</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Global stats */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Délai moyen global</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatDelai(delaisStats?.global.delaiMoyenTotal)}
            </span>
          </div>

          {/* Per-module stats */}
          <div className="grid grid-cols-3 gap-2">
            {/* Engagement */}
            <div className="text-center p-2 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Engagement</p>
              <p className="text-lg font-semibold">
                {formatDelai(delaisStats?.engagement?.delai_moyen_validation)}
              </p>
              {delaisStats?.engagement?.count_valides && (
                <p className="text-xs text-muted-foreground">
                  ({delaisStats.engagement.count_valides} validé{delaisStats.engagement.count_valides > 1 ? "s" : ""})
                </p>
              )}
            </div>

            {/* Liquidation */}
            <div className="text-center p-2 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Liquidation</p>
              <p className="text-lg font-semibold">
                {formatDelai(delaisStats?.liquidation?.delai_moyen_validation)}
              </p>
              {delaisStats?.liquidation?.count_valides && (
                <p className="text-xs text-muted-foreground">
                  ({delaisStats.liquidation.count_valides} validé{delaisStats.liquidation.count_valides > 1 ? "s" : ""})
                </p>
              )}
            </div>

            {/* Ordonnancement */}
            <div className="text-center p-2 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Ordonnancement</p>
              <p className="text-lg font-semibold">
                {formatDelai(delaisStats?.ordonnancement?.delai_moyen_validation)}
              </p>
              {delaisStats?.ordonnancement?.count_valides && (
                <p className="text-xs text-muted-foreground">
                  ({delaisStats.ordonnancement.count_valides} validé{delaisStats.ordonnancement.count_valides > 1 ? "s" : ""})
                </p>
              )}
            </div>
          </div>

          {/* Quick insights */}
          {delaisStats?.global.delaiMoyenTotal > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <TrendingDown className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">
                Plus rapide: <span className="font-medium text-success">{delaisStats.global.modulesPlusRapide}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <TrendingUp className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">
                Plus lent: <span className="font-medium text-warning">{delaisStats.global.modulePlusLent}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
