import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface DashboardStats {
  // Notes SEF
  notesSEFTotal: number;
  notesSEFEnAttente: number;
  notesSEFAValider: number;
  notesSEFValidees: number;
  // Notes AEF
  notesAEFTotal: number;
  notesAEFEnAttente: number;
  notesAEFAValider: number;
  notesAEFImputees: number;
  // Expressions de Besoin
  ebTotal: number;
  ebAValider: number;
  ebValidees: number;
  // Legacy (pour compatibilité)
  notesEnAttente: number;
  notesTotal: number;
  notesAValider: number;
  // Engagements
  engagementsEnCours: number;
  engagementsTotal: number;
  engagementsAValider: number;
  // Liquidations
  liquidationsATraiter: number;
  liquidationsTotal: number;
  liquidationsAValider: number;
  // Ordonnancements
  ordonnancements: number;
  ordonnancementsEnSignature: number;
  ordonnancementsAValider: number;
  // Marchés
  marchesEnCours: number;
  marchesTotal: number;
  // Budget
  budgetTotal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetPaye: number;
  budgetOrdonnance: number;
  budgetDisponible: number;
  tauxEngagement: number;
  tauxLiquidation: number;
  tauxPaiement: number;
  isBudgetLoaded: boolean;
  // Alertes d'incohérence
  hasInconsistency: boolean;
  inconsistencyType: 'none' | 'budget_not_loaded' | 'overspent' | 'data_mismatch';
  inconsistencyMessage: string;
  // Top lignes en dépassement
  topLignesDepassement: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    depassement: number;
  }>;
}

export function useDashboardStats() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-stats", exercice],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch Notes SEF stats
      const { data: notesSEF, error: notesSEFError } = await supabase
        .from("notes_sef")
        .select("id, statut")
        .eq("exercice", exercice);

      if (notesSEFError) throw notesSEFError;

      const notesSEFTotal = notesSEF?.length || 0;
      const notesSEFEnAttente = notesSEF?.filter(n => n.statut === "soumis" || n.statut === "en_attente").length || 0;
      const notesSEFAValider = notesSEF?.filter(n => n.statut === "soumis" || n.statut === "en_attente" || n.statut === "a_valider_dg").length || 0;
      const notesSEFValidees = notesSEF?.filter(n => n.statut === "valide" || n.statut === "valide_auto").length || 0;

      // Fetch Notes AEF stats
      const { data: notesAEF, error: notesAEFError } = await supabase
        .from("notes_dg")
        .select("id, statut")
        .eq("exercice", exercice);

      if (notesAEFError) throw notesAEFError;

      const notesAEFTotal = notesAEF?.length || 0;
      const notesAEFEnAttente = notesAEF?.filter(n => n.statut === "soumis" || n.statut === "en_attente").length || 0;
      const notesAEFAValider = notesAEF?.filter(n => n.statut === "soumis" || n.statut === "a_valider").length || 0;
      const notesAEFImputees = notesAEF?.filter(n => n.statut === "impute").length || 0;

      // Legacy totaux combinés
      const notesTotal = notesSEFTotal + notesAEFTotal;
      const notesEnAttente = notesSEFEnAttente + notesAEFEnAttente;
      const notesAValider = notesSEFAValider + notesAEFAValider;

      // Fetch expressions de besoin stats
      const { data: expressionsBesoin, error: ebError } = await supabase
        .from("expressions_besoin")
        .select("id, statut")
        .eq("exercice", exercice);

      if (ebError) throw ebError;

      const ebTotal = expressionsBesoin?.length || 0;
      const ebAValider = expressionsBesoin?.filter(e => e.statut === "soumis").length || 0;
      const ebValidees = expressionsBesoin?.filter(e => e.statut === "validé").length || 0;

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

      // Fetch budget lines for total budget with engagement details
      const { data: budgetLines, error: budgetError } = await supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale, total_engage")
        .eq("exercice", exercice);

      if (budgetError) throw budgetError;

      const budgetTotal = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      
      // Fetch ordonnancement totals
      const budgetOrdonnance = ordonnancements
        ?.filter(o => o.statut === "valide" || o.statut === "signe")
        .reduce((sum, o) => sum + ((o as any).montant || 0), 0) || 0;

      // CORRECTION: Disponibilité = Budget - Engagé validé (peut être négatif pour détecter dépassement)
      const budgetDisponibleRaw = budgetTotal - budgetEngage;
      const budgetDisponible = Math.max(0, budgetDisponibleRaw);
      
      // CORRECTION: Taux d'engagement sécurisé
      const tauxEngagement = budgetTotal > 0 ? Math.round((budgetEngage / budgetTotal) * 100) : 0;
      const tauxLiquidation = budgetEngage > 0 ? Math.round((budgetLiquide / budgetEngage) * 100) : 0;
      const tauxPaiement = budgetLiquide > 0 ? Math.round((budgetPaye / budgetLiquide) * 100) : 0;
      
      // Indicateur si le budget est chargé
      const isBudgetLoaded = budgetTotal > 0;

      // Détection des incohérences
      let hasInconsistency = false;
      let inconsistencyType: 'none' | 'budget_not_loaded' | 'overspent' | 'data_mismatch' = 'none';
      let inconsistencyMessage = '';

      if (!isBudgetLoaded && (budgetEngage > 0 || budgetLiquide > 0 || budgetPaye > 0)) {
        hasInconsistency = true;
        inconsistencyType = 'budget_not_loaded';
        inconsistencyMessage = `Dotation non chargée mais ${engagementsTotal} engagement(s) enregistré(s) pour un total de ${new Intl.NumberFormat('fr-FR').format(budgetEngage)} FCFA. Veuillez importer les lignes budgétaires.`;
      } else if (budgetDisponibleRaw < 0) {
        hasInconsistency = true;
        inconsistencyType = 'overspent';
        inconsistencyMessage = `Dépassement budgétaire de ${new Intl.NumberFormat('fr-FR').format(Math.abs(budgetDisponibleRaw))} FCFA. Vérifiez les engagements sur les lignes en dépassement.`;
      } else if (budgetLiquide > budgetEngage) {
        hasInconsistency = true;
        inconsistencyType = 'data_mismatch';
        inconsistencyMessage = `Incohérence : montant liquidé (${new Intl.NumberFormat('fr-FR').format(budgetLiquide)} FCFA) supérieur au montant engagé (${new Intl.NumberFormat('fr-FR').format(budgetEngage)} FCFA).`;
      }

      // Calculer les top lignes en dépassement
      const topLignesDepassement = (budgetLines || [])
        .map(bl => ({
          id: bl.id,
          code: bl.code,
          label: bl.label,
          dotation: bl.dotation_initiale || 0,
          engage: bl.total_engage || 0,
          depassement: (bl.total_engage || 0) - (bl.dotation_initiale || 0),
        }))
        .filter(bl => bl.depassement > 0)
        .sort((a, b) => b.depassement - a.depassement)
        .slice(0, 5);

      return {
        // Notes SEF
        notesSEFTotal,
        notesSEFEnAttente,
        notesSEFAValider,
        notesSEFValidees,
        // Notes AEF
        notesAEFTotal,
        notesAEFEnAttente,
        notesAEFAValider,
        notesAEFImputees,
        // Expressions de besoin
        ebTotal,
        ebAValider,
        ebValidees,
        // Legacy
        notesEnAttente,
        notesTotal,
        notesAValider,
        // Autres
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
        budgetOrdonnance,
        budgetDisponible,
        tauxEngagement,
        tauxLiquidation,
        tauxPaiement,
        isBudgetLoaded,
        hasInconsistency,
        inconsistencyType,
        inconsistencyMessage,
        topLignesDepassement,
      };
    },
    enabled: !!exercice,
  });
}
