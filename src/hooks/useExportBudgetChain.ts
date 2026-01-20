/**
 * Hook d'export Excel pour la chaîne d'exécution budgétaire
 * Expression de Besoin → Engagement → Liquidation → Ordonnancement → Règlement
 *
 * Exports conformes aux formats Excel partagés
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, ExportColumn, ExportOptions } from "@/lib/export/export-service";
import { splitImputation } from "@/lib/budget/imputation-utils";

// ============================================================================
// Types
// ============================================================================

export type ExportStep = "expression" | "engagement" | "liquidation" | "ordonnancement" | "reglement";

export interface ExportFilters {
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  directionId?: string;
}

export interface ExportResult {
  success: boolean;
  rowCount: number;
  filename?: string;
  error?: string;
}

// ============================================================================
// Colonnes par étape (format officiel ARTI)
// ============================================================================

const EXPRESSION_COLUMNS: ExportColumn[] = [
  { key: "rowNum", label: "N°", type: "number", width: 5 },
  { key: "numero", label: "N° Dépense", type: "text", width: 18 },
  { key: "created_at", label: "Date", type: "date", width: 12 },
  { key: "fournisseur", label: "Fournisseur", type: "text", width: 30 },
  { key: "objet", label: "Objet", type: "text", width: 40 },
  { key: "montant_estime", label: "Montant Estimé", type: "currency", width: 15 },
  { key: "direction_sigle", label: "Direction", type: "text", width: 10 },
  { key: "urgence", label: "Urgence", type: "text", width: 10 },
  { key: "statut", label: "Statut", type: "text", width: 12 },
];

const ENGAGEMENT_COLUMNS: ExportColumn[] = [
  { key: "rowNum", label: "N°", type: "number", width: 5 },
  { key: "numero", label: "N° Dépense", type: "text", width: 18 },
  { key: "date_engagement", label: "Date", type: "date", width: 12 },
  { key: "fournisseur", label: "Fournisseur", type: "text", width: 30 },
  { key: "objet", label: "Objet", type: "text", width: 40 },
  { key: "montant", label: "Montant", type: "currency", width: 15 },
  { key: "budget_line_code", label: "Imputation", type: "text", width: 20 },
  { key: "direction_sigle", label: "Direction", type: "text", width: 10 },
  { key: "statut", label: "Statut", type: "text", width: 12 },
  { key: "workflow_status", label: "Étape Workflow", type: "text", width: 15 },
];

const LIQUIDATION_COLUMNS: ExportColumn[] = [
  { key: "rowNum", label: "N°", type: "number", width: 5 },
  { key: "numero", label: "N° Dépense", type: "text", width: 18 },
  { key: "date_liquidation", label: "Date", type: "date", width: 12 },
  { key: "fournisseur", label: "Fournisseur", type: "text", width: 30 },
  { key: "objet", label: "Objet", type: "text", width: 40 },
  { key: "montant", label: "Montant", type: "currency", width: 15 },
  { key: "net_a_payer", label: "Net à Payer", type: "currency", width: 15 },
  { key: "reference_facture", label: "Réf. Facture", type: "text", width: 15 },
  { key: "engagement_numero", label: "N° Engagement", type: "text", width: 18 },
  { key: "statut", label: "Statut", type: "text", width: 12 },
];

const ORDONNANCEMENT_COLUMNS: ExportColumn[] = [
  { key: "rowNum", label: "N°", type: "number", width: 5 },
  { key: "numero", label: "N° Dépense", type: "text", width: 18 },
  { key: "imputation_court", label: "Imputation (10 car.)", type: "text", width: 12 },
  { key: "imputation_suite", label: "Imputation (Suite)", type: "text", width: 25 },
  { key: "beneficiaire", label: "Bénéficiaire", type: "text", width: 30 },
  { key: "objet", label: "Objet", type: "text", width: 40 },
  { key: "montant", label: "Montant", type: "currency", width: 15 },
  { key: "mode_paiement", label: "Mode Paiement", type: "text", width: 12 },
  { key: "liquidation_numero", label: "N° Liquidation", type: "text", width: 18 },
  { key: "statut", label: "Statut", type: "text", width: 12 },
];

const REGLEMENT_COLUMNS: ExportColumn[] = [
  { key: "rowNum", label: "N°", type: "number", width: 5 },
  { key: "numero", label: "N° Dépense", type: "text", width: 18 },
  { key: "imputation", label: "Imputation", type: "text", width: 25 },
  { key: "sous_activite", label: "Sous-activité", type: "text", width: 30 },
  { key: "beneficiaire", label: "Bénéficiaire", type: "text", width: 30 },
  { key: "montant", label: "Montant", type: "currency", width: 15 },
  { key: "date_paiement", label: "Date Paiement", type: "date", width: 12 },
  { key: "mode_paiement", label: "Mode", type: "text", width: 12 },
  { key: "reference_paiement", label: "Référence", type: "text", width: 20 },
  { key: "ordonnancement_numero", label: "N° Ordonnancement", type: "text", width: 18 },
  { key: "statut", label: "Statut", type: "text", width: 12 },
];

// ============================================================================
// Hook principal
// ============================================================================

export function useExportBudgetChain() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // Fonctions de fetch avec filtres
  // ============================================================================

  const fetchExpressions = useCallback(async (filters: ExportFilters) => {
    let query = supabase
      .from("expressions_besoin")
      .select(`
        id, numero, objet, description, montant_estime, urgence, statut,
        created_at, submitted_at, validated_at,
        direction:directions(sigle, label),
        marche:marches(
          prestataire:prestataires(raison_sociale)
        )
      `)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false });

    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }
    if (filters.directionId) {
      query = query.eq("direction_id", filters.directionId);
    }
    if (filters.dateDebut) {
      query = query.gte("created_at", filters.dateDebut);
    }
    if (filters.dateFin) {
      query = query.lte("created_at", filters.dateFin + "T23:59:59");
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item, index) => ({
      rowNum: index + 1,
      numero: item.numero || "-",
      created_at: item.created_at,
      fournisseur: item.marche?.prestataire?.raison_sociale || "-",
      objet: item.objet || "-",
      montant_estime: item.montant_estime || 0,
      direction_sigle: item.direction?.sigle || "-",
      urgence: item.urgence || "normal",
      statut: item.statut || "-",
    }));
  }, [exercice]);

  const fetchEngagements = useCallback(async (filters: ExportFilters) => {
    let query = supabase
      .from("budget_engagements")
      .select(`
        id, numero, objet, montant, fournisseur, date_engagement, statut, workflow_status,
        budget_line:budget_lines(
          code, label,
          direction:directions(sigle)
        )
      `)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false });

    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }
    if (filters.dateDebut) {
      query = query.gte("date_engagement", filters.dateDebut);
    }
    if (filters.dateFin) {
      query = query.lte("date_engagement", filters.dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item, index) => ({
      rowNum: index + 1,
      numero: item.numero || "-",
      date_engagement: item.date_engagement,
      fournisseur: item.fournisseur || "-",
      objet: item.objet || "-",
      montant: item.montant || 0,
      budget_line_code: item.budget_line?.code || "-",
      direction_sigle: item.budget_line?.direction?.sigle || "-",
      statut: item.statut || "-",
      workflow_status: item.workflow_status || "-",
    }));
  }, [exercice]);

  const fetchLiquidations = useCallback(async (filters: ExportFilters) => {
    let query = supabase
      .from("budget_liquidations")
      .select(`
        id, numero, montant, net_a_payer, date_liquidation, reference_facture, statut,
        engagement:budget_engagements(
          numero, objet, fournisseur,
          budget_line:budget_lines(
            code,
            direction:directions(sigle)
          )
        )
      `)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false });

    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }
    if (filters.dateDebut) {
      query = query.gte("date_liquidation", filters.dateDebut);
    }
    if (filters.dateFin) {
      query = query.lte("date_liquidation", filters.dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item, index) => ({
      rowNum: index + 1,
      numero: item.numero || "-",
      date_liquidation: item.date_liquidation,
      fournisseur: item.engagement?.fournisseur || "-",
      objet: item.engagement?.objet || "-",
      montant: item.montant || 0,
      net_a_payer: item.net_a_payer || item.montant || 0,
      reference_facture: item.reference_facture || "-",
      engagement_numero: item.engagement?.numero || "-",
      statut: item.statut || "-",
    }));
  }, [exercice]);

  const fetchOrdonnancements = useCallback(async (filters: ExportFilters) => {
    let query = supabase
      .from("ordonnancements")
      .select(`
        id, numero, montant, beneficiaire, mode_paiement, objet, statut,
        created_at, date_prevue_paiement,
        liquidation:budget_liquidations(
          numero,
          engagement:budget_engagements(
            budget_line:budget_lines(
              code, label,
              sous_activite:sous_activites(code, libelle)
            )
          )
        )
      `)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false });

    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }
    if (filters.dateDebut) {
      query = query.gte("created_at", filters.dateDebut);
    }
    if (filters.dateFin) {
      query = query.lte("created_at", filters.dateFin + "T23:59:59");
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item, index) => {
      const budgetLineCode = item.liquidation?.engagement?.budget_line?.code || "";
      const { imputation_10, imputation_suite } = splitImputation(budgetLineCode);
      return {
        rowNum: index + 1,
        numero: item.numero || "-",
        imputation_court: imputation_10,
        imputation_suite: imputation_suite,
        beneficiaire: item.beneficiaire || "-",
        objet: item.objet || "-",
        montant: item.montant || 0,
        mode_paiement: item.mode_paiement || "-",
        liquidation_numero: item.liquidation?.numero || "-",
        statut: item.statut || "-",
      };
    });
  }, [exercice]);

  const fetchReglements = useCallback(async (filters: ExportFilters) => {
    let query = supabase
      .from("reglements")
      .select(`
        id, numero, montant, date_paiement, mode_paiement, reference_paiement, statut,
        ordonnancement:ordonnancements(
          numero, beneficiaire,
          liquidation:budget_liquidations(
            engagement:budget_engagements(
              budget_line:budget_lines(
                code,
                sous_activite:sous_activites(code, libelle)
              )
            )
          )
        )
      `)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false });

    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }
    if (filters.dateDebut) {
      query = query.gte("date_paiement", filters.dateDebut);
    }
    if (filters.dateFin) {
      query = query.lte("date_paiement", filters.dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item, index) => {
      const budgetLine = item.ordonnancement?.liquidation?.engagement?.budget_line;
      const { imputation_complete } = splitImputation(budgetLine?.code);
      return {
        rowNum: index + 1,
        numero: item.numero || "-",
        imputation: imputation_complete || "-",
        sous_activite: budgetLine?.sous_activite?.libelle || "-",
        beneficiaire: item.ordonnancement?.beneficiaire || "-",
        montant: item.montant || 0,
        date_paiement: item.date_paiement,
        mode_paiement: item.mode_paiement || "-",
        reference_paiement: item.reference_paiement || "-",
        ordonnancement_numero: item.ordonnancement?.numero || "-",
        statut: item.statut || "-",
      };
    });
  }, [exercice]);

  // ============================================================================
  // Export générique par étape
  // ============================================================================

  const exportStep = useCallback(async (
    step: ExportStep,
    filters: ExportFilters = {},
    exportAll: boolean = false
  ): Promise<ExportResult> => {
    setIsExporting(true);

    try {
      let data: Record<string, unknown>[];
      let columns: ExportColumn[];
      let title: string;
      let filename: string;

      // Si exportAll, on ignore les filtres de statut
      const effectiveFilters = exportAll ? { ...filters, statut: undefined } : filters;

      switch (step) {
        case "expression":
          data = await fetchExpressions(effectiveFilters);
          columns = EXPRESSION_COLUMNS;
          title = "Expressions de Besoin";
          filename = `expressions_besoin_${exercice}`;
          break;

        case "engagement":
          data = await fetchEngagements(effectiveFilters);
          columns = ENGAGEMENT_COLUMNS;
          title = "Engagements Budgétaires";
          filename = `engagements_${exercice}`;
          break;

        case "liquidation":
          data = await fetchLiquidations(effectiveFilters);
          columns = LIQUIDATION_COLUMNS;
          title = "Liquidations";
          filename = `liquidations_${exercice}`;
          break;

        case "ordonnancement":
          data = await fetchOrdonnancements(effectiveFilters);
          columns = ORDONNANCEMENT_COLUMNS;
          title = "Ordonnancements";
          filename = `ordonnancements_${exercice}`;
          break;

        case "reglement":
          data = await fetchReglements(effectiveFilters);
          columns = REGLEMENT_COLUMNS;
          title = "Règlements";
          filename = `reglements_${exercice}`;
          break;

        default:
          throw new Error(`Étape d'export inconnue: ${step}`);
      }

      if (data.length === 0) {
        toast({
          title: "Export vide",
          description: "Aucune donnée ne correspond aux critères de filtrage.",
          variant: "default",
        });
        return { success: true, rowCount: 0 };
      }

      // Construire le sous-titre avec les filtres
      const filterParts: string[] = [];
      if (filters.statut) filterParts.push(`Statut: ${filters.statut}`);
      if (filters.dateDebut) filterParts.push(`Du: ${filters.dateDebut}`);
      if (filters.dateFin) filterParts.push(`Au: ${filters.dateFin}`);
      const subtitle = filterParts.length > 0 ? filterParts.join(" | ") : "Toutes les données";

      const options: ExportOptions = {
        title,
        subtitle,
        filename,
        exercice,
        showTotals: true,
        totalColumns: ["montant", "montant_estime", "net_a_payer"],
      };

      const result = exportToExcel(data, columns, options);

      if (result.success) {
        toast({
          title: "Export réussi",
          description: `${result.rowCount} enregistrement(s) exporté(s).`,
        });
      } else {
        toast({
          title: "Erreur d'export",
          description: result.error || "Une erreur est survenue lors de l'export.",
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de l'export";
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false, rowCount: 0, error: errorMsg };
    } finally {
      setIsExporting(false);
    }
  }, [exercice, fetchExpressions, fetchEngagements, fetchLiquidations, fetchOrdonnancements, fetchReglements, toast]);

  // ============================================================================
  // Fonctions d'export spécifiques
  // ============================================================================

  const exportExpressions = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep("expression", filters, exportAll),
    [exportStep]
  );

  const exportEngagements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep("engagement", filters, exportAll),
    [exportStep]
  );

  const exportLiquidations = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep("liquidation", filters, exportAll),
    [exportStep]
  );

  const exportOrdonnancements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep("ordonnancement", filters, exportAll),
    [exportStep]
  );

  const exportReglements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep("reglement", filters, exportAll),
    [exportStep]
  );

  // ============================================================================
  // Export chaîne complète
  // ============================================================================

  const exportFullChain = useCallback(async (filters: ExportFilters = {}): Promise<void> => {
    setIsExporting(true);

    try {
      // Export séquentiel de toutes les étapes
      const steps: { name: string; fn: () => Promise<ExportResult> }[] = [
        { name: "Expressions", fn: () => exportExpressions(filters, true) },
        { name: "Engagements", fn: () => exportEngagements(filters, true) },
        { name: "Liquidations", fn: () => exportLiquidations(filters, true) },
        { name: "Ordonnancements", fn: () => exportOrdonnancements(filters, true) },
        { name: "Règlements", fn: () => exportReglements(filters, true) },
      ];

      let successCount = 0;
      for (const step of steps) {
        const result = await step.fn();
        if (result.success && result.rowCount > 0) {
          successCount++;
        }
        // Petit délai entre les exports
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: "Export complet terminé",
        description: `${successCount} fichier(s) exporté(s) avec succès.`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportExpressions, exportEngagements, exportLiquidations, exportOrdonnancements, exportReglements, toast]);

  return {
    isExporting,
    exportExpressions,
    exportEngagements,
    exportLiquidations,
    exportOrdonnancements,
    exportReglements,
    exportFullChain,
    exportStep,
  };
}

export default useExportBudgetChain;
