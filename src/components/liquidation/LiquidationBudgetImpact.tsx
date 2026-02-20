/**
 * LiquidationBudgetImpact — Affiche l'impact budgétaire avant/après validation
 *
 * Avant validation : "Liquidé actuel : X FCFA"
 * Après validation : "Nouveau liquidé : X + net_a_payer FCFA"
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Liquidation } from '@/hooks/useLiquidations';
import { formatCurrency } from '@/lib/utils';

interface BudgetImpactData {
  budgetLineId: string;
  budgetLineCode: string;
  budgetLineLabel: string;
  dotation: number;
  totalEngage: number;
  liquideBefore: number;
  liquideAfter: number;
  tauxAvant: number;
  tauxApres: number;
}

interface LiquidationBudgetImpactProps {
  liquidation: Liquidation;
}

export function LiquidationBudgetImpact({ liquidation }: LiquidationBudgetImpactProps) {
  const [impact, setImpact] = useState<BudgetImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!liquidation.engagement?.budget_line?.id) {
      setLoading(false);
      return;
    }

    const budgetLineId = liquidation.engagement.budget_line.id;

    (async () => {
      try {
        // 1. Récupérer la ligne budgétaire
        const { data: bl } = await supabase
          .from('budget_lines')
          .select(
            'id, code, label, dotation_initiale, virements_recus, virements_emis, total_liquide'
          )
          .eq('id', budgetLineId)
          .single();

        if (!bl) {
          setLoading(false);
          return;
        }

        const dotation =
          (bl.dotation_initiale || 0) + (bl.virements_recus || 0) - (bl.virements_emis || 0);

        // 2. Calculer le total engagé sur cette ligne
        const { data: engSum } = await supabase
          .from('budget_engagements')
          .select('montant')
          .eq('budget_line_id', budgetLineId)
          .in('statut', ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf', 'valide']);

        const totalEngage = (engSum || []).reduce((s, e) => s + (e.montant || 0), 0);

        // 3. Total déjà liquidé (validé) sur cette ligne - hors liquidation courante
        const { data: liqSum } = await supabase
          .from('budget_liquidations')
          .select('id, montant, net_a_payer')
          .eq('engagement_id', liquidation.engagement_id)
          .eq('statut', 'valide')
          .neq('id', liquidation.id);

        const liquideBefore = (liqSum || []).reduce(
          (s, l) => s + (l.net_a_payer || l.montant || 0),
          0
        );

        const netAPayerCourant = liquidation.net_a_payer || liquidation.montant;
        const liquideAfter = liquideBefore + netAPayerCourant;

        setImpact({
          budgetLineId: bl.id,
          budgetLineCode: bl.code,
          budgetLineLabel: bl.label,
          dotation,
          totalEngage,
          liquideBefore,
          liquideAfter,
          tauxAvant: dotation > 0 ? (liquideBefore / dotation) * 100 : 0,
          tauxApres: dotation > 0 ? (liquideAfter / dotation) * 100 : 0,
        });
      } catch {
        // Silently fail - this is informational
      } finally {
        setLoading(false);
      }
    })();
  }, [
    liquidation.engagement?.budget_line?.id,
    liquidation.engagement_id,
    liquidation.id,
    liquidation.montant,
    liquidation.net_a_payer,
  ]);

  if (loading || !impact) return null;

  const isAlreadyValidated = liquidation.statut === 'valide';
  const tauxApresIsDanger = impact.tauxApres > 95;
  const tauxApresIsWarning = impact.tauxApres > 80;

  return (
    <Card
      className={
        tauxApresIsDanger ? 'border-destructive/50' : tauxApresIsWarning ? 'border-warning/50' : ''
      }
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          Impact budgétaire
          <Badge variant="outline" className="ml-auto text-xs">
            {impact.budgetLineCode}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dotation */}
        <div className="text-xs text-muted-foreground">
          Ligne: {impact.budgetLineLabel} — Dotation: {formatCurrency(impact.dotation)}
        </div>

        {/* Avant / Après */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Avant */}
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {isAlreadyValidated ? 'Liquidé avant' : 'Liquidé actuel'}
            </div>
            <div className="text-lg font-bold">{formatCurrency(impact.liquideBefore)}</div>
            <div className="text-xs text-muted-foreground">
              {impact.tauxAvant.toFixed(1)}% de la dotation
            </div>
          </div>

          {/* Flèche */}
          <ArrowRight className="h-5 w-5 text-muted-foreground" />

          {/* Après */}
          <div
            className={`p-3 rounded-lg text-center border-2 ${
              tauxApresIsDanger
                ? 'bg-destructive/10 border-destructive/30'
                : tauxApresIsWarning
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-success/10 border-success/30'
            }`}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {isAlreadyValidated ? 'Liquidé actuel' : 'Après validation'}
            </div>
            <div
              className={`text-lg font-bold ${
                tauxApresIsDanger
                  ? 'text-destructive'
                  : tauxApresIsWarning
                    ? 'text-warning'
                    : 'text-success'
              }`}
            >
              {formatCurrency(impact.liquideAfter)}
            </div>
            <div className="text-xs text-muted-foreground">
              {impact.tauxApres.toFixed(1)}% de la dotation
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Consommation de la ligne budgétaire</span>
            <span>{impact.tauxApres.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(impact.tauxApres, 100)}
            className={`h-2 ${
              tauxApresIsDanger
                ? '[&>div]:bg-destructive'
                : tauxApresIsWarning
                  ? '[&>div]:bg-warning'
                  : ''
            }`}
          />
        </div>

        {/* Détail */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total engagé</span>
            <span>{formatCurrency(impact.totalEngage)}</span>
          </div>
          <div className="flex justify-between">
            <span>Déjà liquidé (validé)</span>
            <span>{formatCurrency(impact.liquideBefore)}</span>
          </div>
          <div className="flex justify-between font-medium text-foreground">
            <span>+ Liquidation courante (net)</span>
            <span>+{formatCurrency(liquidation.net_a_payer || liquidation.montant)}</span>
          </div>
        </div>

        {/* Alertes */}
        {tauxApresIsDanger && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-xs text-destructive">
              Attention: la consommation dépassera 95% de la dotation après validation.
            </p>
          </div>
        )}
        {tauxApresIsWarning && !tauxApresIsDanger && (
          <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-xs text-warning">
              La consommation dépassera 80% de la dotation après validation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
