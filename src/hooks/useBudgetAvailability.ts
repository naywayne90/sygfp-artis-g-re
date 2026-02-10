import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface BudgetLineAvailability {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number;
  dotation_actuelle: number; // Calculée: initiale + virements_recus - virements_emis
  total_engage: number;
  total_reserve: number; // Engagements en attente
  disponible: number; // dotation_actuelle - total_engage - total_reserve
  taux_engagement: number; // %
  virements_recus: number;
  virements_emis: number;
}

export interface BudgetSummary {
  total_dotation_initiale: number;
  total_dotation_actuelle: number;
  total_engage: number;
  total_disponible: number;
  taux_global: number;
  nb_lignes: number;
  nb_lignes_depassement: number;
}

/**
 * Hook pour calculer les disponibilités budgétaires en temps réel
 */
export function useBudgetAvailability(budgetLineId?: string) {
  const { exercice } = useExercice();

  // Calcul du disponible pour une ligne spécifique
  const { data: lineAvailability, isLoading: isLoadingLine } = useQuery({
    queryKey: ["budget-availability", budgetLineId, exercice],
    queryFn: async (): Promise<BudgetLineAvailability | null> => {
      if (!budgetLineId) return null;

      // Récupérer la ligne budgétaire
      const { data: line, error: lineError } = await supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale, dotation_modifiee, total_engage")
        .eq("id", budgetLineId)
        .single();

      if (lineError || !line) return null;

      // Calculer les virements
      const { data: virementsRecus } = await supabase
        .from("credit_transfers")
        .select("amount")
        .eq("to_budget_line_id", budgetLineId)
        .eq("status", "execute");

      const { data: virementsEmis } = await supabase
        .from("credit_transfers")
        .select("amount")
        .eq("from_budget_line_id", budgetLineId)
        .eq("status", "execute");

      const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
      const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      // Récupérer les engagements en attente (réservations)
      const { data: engagementsEnAttente } = await supabase
        .from("budget_engagements")
        .select("montant")
        .eq("budget_line_id", budgetLineId)
        .eq("exercice", exercice)
        .in("statut", ["brouillon", "soumis", "en_attente"]);

      const totalReserve = engagementsEnAttente?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      const dotation_initiale = line.dotation_initiale || 0;
      const dotation_modifiee = line.dotation_modifiee || dotation_initiale;
      const dotation_actuelle = dotation_initiale + totalRecus - totalEmis;
      const total_engage = line.total_engage || 0;
      const disponible = dotation_actuelle - total_engage - totalReserve;
      const taux_engagement = dotation_actuelle > 0 ? (total_engage / dotation_actuelle) * 100 : 0;

      return {
        id: line.id,
        code: line.code,
        label: line.label,
        dotation_initiale,
        dotation_modifiee,
        dotation_actuelle,
        total_engage,
        total_reserve: totalReserve,
        disponible,
        taux_engagement,
        virements_recus: totalRecus,
        virements_emis: totalEmis,
      };
    },
    enabled: !!budgetLineId && !!exercice,
    staleTime: 1000 * 30, // 30 secondes
  });

  return {
    lineAvailability,
    isLoading: isLoadingLine,
  };
}

/**
 * Hook pour récupérer un résumé global du budget
 */
export function useBudgetSummary() {
  const { exercice } = useExercice();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["budget-summary", exercice],
    queryFn: async (): Promise<BudgetSummary> => {
      // Récupérer toutes les lignes actives
      const { data: lines } = await supabase
        .from("budget_lines")
        .select("id, dotation_initiale, dotation_modifiee, total_engage")
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("is_active", true);

      if (!lines || lines.length === 0) {
        return {
          total_dotation_initiale: 0,
          total_dotation_actuelle: 0,
          total_engage: 0,
          total_disponible: 0,
          taux_global: 0,
          nb_lignes: 0,
          nb_lignes_depassement: 0,
        };
      }

      // Récupérer tous les virements exécutés
      const { data: virements } = await supabase
        .from("credit_transfers")
        .select("from_budget_line_id, to_budget_line_id, amount")
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("status", "execute");

      // Calculer les virements par ligne
      const virementsMap = new Map<string, { recus: number; emis: number }>();
      
      virements?.forEach(v => {
        if (v.from_budget_line_id) {
          const current = virementsMap.get(v.from_budget_line_id) || { recus: 0, emis: 0 };
          current.emis += v.amount || 0;
          virementsMap.set(v.from_budget_line_id, current);
        }
        if (v.to_budget_line_id) {
          const current = virementsMap.get(v.to_budget_line_id) || { recus: 0, emis: 0 };
          current.recus += v.amount || 0;
          virementsMap.set(v.to_budget_line_id, current);
        }
      });

      let total_dotation_initiale = 0;
      let total_dotation_actuelle = 0;
      let total_engage = 0;
      let nb_lignes_depassement = 0;

      lines.forEach(line => {
        const dotation_initiale = line.dotation_initiale || 0;
        const virements_ligne = virementsMap.get(line.id) || { recus: 0, emis: 0 };
        const dotation_actuelle = dotation_initiale + virements_ligne.recus - virements_ligne.emis;
        const engage = line.total_engage || 0;
        const disponible = dotation_actuelle - engage;

        total_dotation_initiale += dotation_initiale;
        total_dotation_actuelle += dotation_actuelle;
        total_engage += engage;

        if (disponible < 0) {
          nb_lignes_depassement++;
        }
      });

      const total_disponible = total_dotation_actuelle - total_engage;
      const taux_global = total_dotation_actuelle > 0 ? (total_engage / total_dotation_actuelle) * 100 : 0;

      return {
        total_dotation_initiale,
        total_dotation_actuelle,
        total_engage,
        total_disponible,
        taux_global,
        nb_lignes: lines.length,
        nb_lignes_depassement,
      };
    },
    enabled: !!exercice,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    summary: summary || {
      total_dotation_initiale: 0,
      total_dotation_actuelle: 0,
      total_engage: 0,
      total_disponible: 0,
      taux_global: 0,
      nb_lignes: 0,
      nb_lignes_depassement: 0,
    },
    isLoading,
  };
}

/**
 * POINT 3: Fonction utilitaire pour vérifier si un engagement est possible
 * BLOQUE si disponible insuffisant avec message explicite
 */
export async function checkEngagementPossible(
  budgetLineId: string,
  montant: number,
  _exercice: number
): Promise<{ possible: boolean; disponible: number; dotation_actuelle: number; message: string }> {
  // Récupérer la ligne
  const { data: line } = await supabase
    .from("budget_lines")
    .select("dotation_initiale, dotation_modifiee, total_engage")
    .eq("id", budgetLineId)
    .single();

  if (!line) {
    return { possible: false, disponible: 0, dotation_actuelle: 0, message: "Ligne budgétaire introuvable" };
  }

  // Calculer virements
  const { data: virementsRecus } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("to_budget_line_id", budgetLineId)
    .eq("status", "execute");

  const { data: virementsEmis } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("from_budget_line_id", budgetLineId)
    .eq("status", "execute");

  const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
  const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

  // POINT 4: Calcul Dotation Actuelle = Initiale + Reçus - Émis
  const dotation_actuelle = (line.dotation_initiale || 0) + totalRecus - totalEmis;
  const disponible = dotation_actuelle - (line.total_engage || 0);

  if (montant > disponible) {
    return {
      possible: false,
      disponible,
      dotation_actuelle,
      message: `❌ ENGAGEMENT BLOQUÉ: Disponible insuffisant.\n` +
               `Disponible: ${disponible.toLocaleString("fr-FR")} FCFA\n` +
               `Demandé: ${montant.toLocaleString("fr-FR")} FCFA\n` +
               `Écart: ${(montant - disponible).toLocaleString("fr-FR")} FCFA`,
    };
  }

  return {
    possible: true,
    disponible,
    dotation_actuelle,
    message: `✓ Disponible suffisant: ${disponible.toLocaleString("fr-FR")} FCFA`,
  };
}

/**
 * POINT 3: Fonction utilitaire pour vérifier si un virement est possible
 * BLOQUE si disponible source insuffisant avec message explicite
 */
export async function checkVirementPossible(
  fromBudgetLineId: string,
  montant: number
): Promise<{ possible: boolean; disponible: number; dotation_actuelle: number; message: string }> {
  const { data: line } = await supabase
    .from("budget_lines")
    .select("dotation_initiale, dotation_modifiee, total_engage")
    .eq("id", fromBudgetLineId)
    .single();

  if (!line) {
    return { possible: false, disponible: 0, dotation_actuelle: 0, message: "Ligne source introuvable" };
  }

  // Calculer virements existants
  const { data: virementsRecus } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("to_budget_line_id", fromBudgetLineId)
    .eq("status", "execute");

  const { data: virementsEmis } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("from_budget_line_id", fromBudgetLineId)
    .eq("status", "execute");

  const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
  const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

  // POINT 4: Calcul Dotation Actuelle = Initiale + Reçus - Émis
  const dotation_actuelle = (line.dotation_initiale || 0) + totalRecus - totalEmis;
  const disponible = dotation_actuelle - (line.total_engage || 0);

  if (montant > disponible) {
    return {
      possible: false,
      disponible,
      dotation_actuelle,
      message: `❌ VIREMENT BLOQUÉ: Disponible insuffisant sur la ligne source.\n` +
               `Disponible: ${disponible.toLocaleString("fr-FR")} FCFA\n` +
               `Montant demandé: ${montant.toLocaleString("fr-FR")} FCFA`,
    };
  }

  return {
    possible: true,
    disponible,
    dotation_actuelle,
    message: `✓ Virement possible: ${disponible.toLocaleString("fr-FR")} FCFA disponibles`,
  };
}

/**
 * POINT 4: Hook pour obtenir dotation_actuelle et disponible pour affichage
 */
export function useBudgetLineDetails(budgetLineId?: string) {
  const { exercice } = useExercice();

  const { data, isLoading } = useQuery({
    queryKey: ["budget-line-details", budgetLineId, exercice],
    queryFn: async () => {
      if (!budgetLineId) return null;

      const { data: line } = await supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale, dotation_modifiee, total_engage, total_liquide, total_ordonnance, total_paye")
        .eq("id", budgetLineId)
        .single();

      if (!line) return null;

      // Calculer les virements
      const { data: virementsRecus } = await supabase
        .from("credit_transfers")
        .select("amount")
        .eq("to_budget_line_id", budgetLineId)
        .eq("status", "execute");

      const { data: virementsEmis } = await supabase
        .from("credit_transfers")
        .select("amount")
        .eq("from_budget_line_id", budgetLineId)
        .eq("status", "execute");

      const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
      const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      const dotation_initiale = line.dotation_initiale || 0;
      const dotation_actuelle = dotation_initiale + totalRecus - totalEmis;
      const total_engage = line.total_engage || 0;
      const disponible = dotation_actuelle - total_engage;
      const taux_engagement = dotation_actuelle > 0 ? (total_engage / dotation_actuelle) * 100 : 0;

      return {
        ...line,
        dotation_initiale,
        dotation_actuelle,
        virements_recus: totalRecus,
        virements_emis: totalEmis,
        total_engage,
        disponible,
        taux_engagement,
        is_depassement: disponible < 0,
      };
    },
    enabled: !!budgetLineId && !!exercice,
  });

  return { details: data, isLoading };
}
