import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface DashboardStats {
  notesEnAttente: number;
  notesTotal: number;
  notesAValider: number;
  engagementsEnCours: number;
  engagementsTotal: number;
  engagementsAValider: number;
  liquidationsATraiter: number;
  liquidationsTotal: number;
  liquidationsAValider: number;
  ordonnancements: number;
  ordonnancementsEnSignature: number;
  ordonnancementsAValider: number;
  marchesEnCours: number;
  marchesTotal: number;
  budgetTotal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetPaye: number;
  budgetDisponible: number;
  tauxEngagement: number;
  isBudgetLoaded: boolean;
}

export function useDashboardStats() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-stats", exercice],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch notes stats
      const { data: notes, error: notesError } = await supabase
        .from("notes_dg")
        .select("id, statut")
        .eq("exercice", exercice);

      if (notesError) throw notesError;

      const notesEnAttente = notes?.filter(n => n.statut === "en_attente" || n.statut === "soumis").length || 0;
      const notesAValider = notes?.filter(n => n.statut === "soumis" || n.statut === "en_attente").length || 0;
      const notesTotal = notes?.length || 0;

      // Fetch engagements stats
      const { data: engagements, error: engagementsError } = await supabase
        .from("budget_engagements")
        .select("id, statut, montant")
        .eq("exercice", exercice);

      if (engagementsError) throw engagementsError;

      const engagementsEnCours = engagements?.filter(e => e.statut === "en_attente" || e.statut === "en_cours").length || 0;
      const engagementsAValider = engagements?.filter(e => e.statut === "soumis" || e.statut === "en_attente").length || 0;
      const engagementsTotal = engagements?.length || 0;
      // CORRECTION: Ne compter que les engagements VALIDES
      const budgetEngage = engagements
        ?.filter(e => e.statut === "valide")
        .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Fetch liquidations stats
      const { data: liquidations, error: liquidationsError } = await supabase
        .from("budget_liquidations")
        .select("id, statut, montant")
        .eq("exercice", exercice);

      if (liquidationsError) throw liquidationsError;

      const liquidationsATraiter = liquidations?.filter(l => l.statut === "en_attente").length || 0;
      const liquidationsAValider = liquidations?.filter(l => l.statut === "soumis" || l.statut === "en_attente").length || 0;
      const liquidationsTotal = liquidations?.length || 0;
      const budgetLiquide = liquidations?.filter(l => l.statut === "valide").reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Fetch ordonnancements stats
      const { data: ordonnancements, error: ordoError } = await supabase
        .from("ordonnancements")
        .select("id, statut, montant")
        .eq("exercice", exercice);

      if (ordoError) throw ordoError;

      const ordonnancementsTotal = ordonnancements?.length || 0;
      const ordonnancementsEnSignature = ordonnancements?.filter(o => o.statut === "en_signature" || o.statut === "en_attente").length || 0;
      const ordonnancementsAValider = ordonnancements?.filter(o => o.statut === "soumis" || o.statut === "en_attente" || o.statut === "en_signature").length || 0;

      // CORRECTION: Fetch reglements pour le montant payé (pas ordonnancements)
      const { data: reglements, error: reglementsError } = await supabase
        .from("reglements")
        .select("id, statut, montant")
        .eq("exercice", exercice);

      if (reglementsError) throw reglementsError;

      // Budget payé = règlements au statut "paye"
      const budgetPaye = reglements
        ?.filter(r => r.statut === "paye")
        .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Fetch marches stats
      const { data: marches, error: marchesError } = await supabase
        .from("marches")
        .select("id, statut");

      if (marchesError) throw marchesError;

      const marchesEnCours = marches?.filter(m => m.statut !== "termine" && m.statut !== "annule").length || 0;
      const marchesTotal = marches?.length || 0;

      // Fetch budget lines for total budget
      const { data: budgetLines, error: budgetError } = await supabase
        .from("budget_lines")
        .select("dotation_initiale")
        .eq("exercice", exercice);

      if (budgetError) throw budgetError;

      const budgetTotal = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      
      // CORRECTION: Disponibilité = max(0, Budget - Engagé validé)
      const budgetDisponible = Math.max(0, budgetTotal - budgetEngage);
      
      // CORRECTION: Taux d'engagement sécurisé
      const tauxEngagement = budgetTotal > 0 ? Math.round((budgetEngage / budgetTotal) * 100) : 0;
      
      // Indicateur si le budget est chargé
      const isBudgetLoaded = budgetTotal > 0;

      return {
        notesEnAttente,
        notesTotal,
        notesAValider,
        engagementsEnCours,
        engagementsTotal,
        engagementsAValider,
        liquidationsATraiter,
        liquidationsTotal,
        liquidationsAValider,
        ordonnancements: ordonnancementsTotal,
        ordonnancementsEnSignature,
        ordonnancementsAValider,
        marchesEnCours,
        marchesTotal,
        budgetTotal,
        budgetEngage,
        budgetLiquide,
        budgetPaye,
        budgetDisponible,
        tauxEngagement,
        isBudgetLoaded,
      };
    },
    enabled: !!exercice,
  });
}
