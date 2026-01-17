import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface PaymentKPIs {
  dotation_totale: number;
  total_engage: number;
  total_liquide: number;
  total_ordonnance: number;
  total_paye: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  taux_paiement: number;
  taux_execution_global: number;
}

export interface PositionTresorerie {
  solde_disponible: number;
  montant_a_payer: number;
  nb_ordres_a_payer: number;
  nb_partiels: number;
}

export function usePaymentKPIs() {
  const { exercice } = useExercice();

  const kpis = useQuery({
    queryKey: ["payment-kpis", exercice],
    queryFn: async () => {
      // Calculer manuellement depuis budget_lines
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select("dotation_initiale, total_engage, total_liquide, total_ordonnance, total_paye")
        .eq("exercice", exercice)
        .eq("is_active", true);

      const totals = (budgetLines || []).reduce(
        (acc, bl) => ({
          dotation_totale: acc.dotation_totale + (bl.dotation_initiale || 0),
          total_engage: acc.total_engage + (bl.total_engage || 0),
          total_liquide: acc.total_liquide + (bl.total_liquide || 0),
          total_ordonnance: acc.total_ordonnance + (bl.total_ordonnance || 0),
          total_paye: acc.total_paye + (bl.total_paye || 0),
        }),
        { dotation_totale: 0, total_engage: 0, total_liquide: 0, total_ordonnance: 0, total_paye: 0 }
      );

      return {
        ...totals,
        taux_engagement: totals.dotation_totale > 0 ? (totals.total_engage / totals.dotation_totale) * 100 : 0,
        taux_liquidation: totals.total_engage > 0 ? (totals.total_liquide / totals.total_engage) * 100 : 0,
        taux_ordonnancement: totals.total_liquide > 0 ? (totals.total_ordonnance / totals.total_liquide) * 100 : 0,
        taux_paiement: totals.total_ordonnance > 0 ? (totals.total_paye / totals.total_ordonnance) * 100 : 0,
        taux_execution_global: totals.dotation_totale > 0 ? (totals.total_paye / totals.dotation_totale) * 100 : 0,
      } as PaymentKPIs;
    },
    enabled: !!exercice,
  });

  const positionTresorerie = useQuery({
    queryKey: ["position-tresorerie", exercice],
    queryFn: async () => {
      // Solde disponible
      const { data: comptes } = await supabase
        .from("comptes_bancaires")
        .select("solde_actuel")
        .eq("est_actif", true);

      const solde_disponible = (comptes || []).reduce((sum, c) => sum + (c.solde_actuel || 0), 0);

      // Ordres à payer
      const { data: ordres } = await supabase
        .from("ordonnancements")
        .select("montant, montant_paye")
        .eq("exercice", exercice)
        .in("statut", ["valide", "signe"]);

      const ordresAPayer = (ordres || []).filter(o => (o.montant || 0) > (o.montant_paye || 0));
      const partiels = (ordres || []).filter(o => (o.montant_paye || 0) > 0 && (o.montant_paye || 0) < (o.montant || 0));

      return {
        solde_disponible,
        montant_a_payer: ordresAPayer.reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0),
        nb_ordres_a_payer: ordresAPayer.length,
        nb_partiels: partiels.length,
      } as PositionTresorerie;
    },
    enabled: !!exercice,
  });

  return {
    kpis,
    positionTresorerie,
  };
}
