import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";

interface TopOSWidgetProps {
  lines: BudgetLineWithRelations[];
  engagements: Record<string, number>;
}

const _formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompact = (amount: number) => {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + " Mds";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + " M";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + " K";
  }
  return amount.toString();
};

interface OSData {
  id: string;
  code: string;
  libelle: string;
  dotation: number;
  engaged: number;
  available: number;
  linesCount: number;
}

export function TopOSWidget({ lines, engagements }: TopOSWidgetProps) {
  const topOS = useMemo(() => {
    const osMap = new Map<string, OSData>();

    lines.forEach(line => {
      if (line.os_id && line.objectif_strategique) {
        const existing = osMap.get(line.os_id);
        const engaged = engagements[line.id] || 0;

        if (existing) {
          existing.dotation += line.dotation_initiale;
          existing.engaged += engaged;
          existing.available += (line.dotation_initiale - engaged);
          existing.linesCount += 1;
        } else {
          osMap.set(line.os_id, {
            id: line.os_id,
            code: line.objectif_strategique.code,
            libelle: line.objectif_strategique.libelle,
            dotation: line.dotation_initiale,
            engaged: engaged,
            available: line.dotation_initiale - engaged,
            linesCount: 1,
          });
        }
      }
    });

    // Sort by dotation and get top 5
    return Array.from(osMap.values())
      .sort((a, b) => b.dotation - a.dotation)
      .slice(0, 5);
  }, [lines, engagements]);

  const _maxDotation = topOS.length > 0 ? topOS[0].dotation : 1;

  if (topOS.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Top 5 OS par dotation</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            Aucun objectif stratégique associé
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Top 5 OS par dotation</CardTitle>
        <Target className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        {topOS.map((os, index) => {
          const consumptionRate = os.dotation > 0 ? (os.engaged / os.dotation) * 100 : 0;
          
          return (
            <div key={os.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="font-medium text-sm truncate max-w-[150px]" title={os.libelle}>
                    {os.code}
                  </span>
                </div>
                <span className="text-sm font-mono">
                  {formatCompact(os.dotation)} FCFA
                </span>
              </div>
              <div className="space-y-1">
                <Progress value={consumptionRate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{os.linesCount} ligne(s)</span>
                  <span>
                    Engagé: {formatCompact(os.engaged)} ({consumptionRate.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
