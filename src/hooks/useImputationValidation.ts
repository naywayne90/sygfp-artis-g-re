/**
 * Hook de validation des imputations contre le budget chargé
 *
 * Vérifie si une imputation existe dans le budget de l'exercice courant
 * et retourne des warnings/erreurs appropriés
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  splitImputation,
  compareImputations,
  type ImputationValidationResult,
} from "@/lib/budget/imputation-utils";

// ============================================================================
// Types
// ============================================================================

export interface BudgetLineMinimal {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  total_engage?: number;
  total_liquide?: number;
  total_ordonnance?: number;
  total_paye?: number;
  is_active: boolean;
}

export interface ValidationOptions {
  /** Autoriser les imputations non trouvées avec justification */
  allowUnknownWithJustification?: boolean;
  /** Bloquer complètement si imputation non trouvée */
  blockIfNotFound?: boolean;
  /** Logger l'action d'audit si warning */
  auditOnWarning?: boolean;
}

export interface UseImputationValidationResult {
  /** Toutes les lignes budgétaires de l'exercice */
  budgetLines: BudgetLineMinimal[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur de chargement */
  error: Error | null;
  /** Valide une imputation */
  validateImputation: (
    imputation: string | null | undefined,
    options?: ValidationOptions
  ) => ImputationValidationResult;
  /** Recherche une ligne budgétaire par code */
  findBudgetLine: (code: string | null | undefined) => BudgetLineMinimal | undefined;
  /** Vérifie si une imputation existe dans le budget */
  imputationExists: (imputation: string | null | undefined) => boolean;
  /** Calcule le disponible pour une ligne budgétaire */
  calculateDisponible: (budgetLineId: string) => number;
  /** Logger un warning d'imputation avec justification */
  logImputationWarning: (
    entityType: string,
    entityId: string,
    imputation: string,
    justification: string
  ) => Promise<void>;
}

// ============================================================================
// Hook principal
// ============================================================================

export function useImputationValidation(): UseImputationValidationResult {
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Charger toutes les lignes budgétaires de l'exercice
  const {
    data: budgetLines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget-lines-validation", exercice],
    queryFn: async (): Promise<BudgetLineMinimal[]> => {
      const { data, error } = await supabase
        .from("budget_lines")
        .select(`
          id,
          code,
          label,
          dotation_initiale,
          total_engage,
          total_liquide,
          total_ordonnance,
          total_paye,
          is_active
        `)
        .eq("exercice", exercice)
        .eq("is_active", true)
        .order("code");

      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Index pour recherche rapide
  const budgetLineIndex = useMemo(() => {
    const index = new Map<string, BudgetLineMinimal>();
    budgetLines.forEach((line) => {
      if (line.code) {
        // Indexer par code exact
        index.set(line.code.toUpperCase(), line);
        // Indexer aussi par code normalisé (sans espaces)
        index.set(line.code.toUpperCase().replace(/\s+/g, ""), line);
      }
    });
    return index;
  }, [budgetLines]);

  /**
   * Recherche une ligne budgétaire par code
   */
  const findBudgetLine = useCallback(
    (code: string | null | undefined): BudgetLineMinimal | undefined => {
      if (!code) return undefined;

      const normalizedCode = code.trim().toUpperCase();

      // Recherche exacte d'abord
      let found = budgetLineIndex.get(normalizedCode);
      if (found) return found;

      // Recherche sans espaces
      found = budgetLineIndex.get(normalizedCode.replace(/\s+/g, ""));
      if (found) return found;

      // Recherche partielle (le code fourni est un préfixe)
      for (const line of budgetLines) {
        if (compareImputations(code, line.code, false)) {
          return line;
        }
      }

      return undefined;
    },
    [budgetLines, budgetLineIndex]
  );

  /**
   * Vérifie si une imputation existe dans le budget
   */
  const imputationExists = useCallback(
    (imputation: string | null | undefined): boolean => {
      return !!findBudgetLine(imputation);
    },
    [findBudgetLine]
  );

  /**
   * Calcule le disponible pour une ligne budgétaire
   */
  const calculateDisponible = useCallback(
    (budgetLineId: string): number => {
      const line = budgetLines.find((l) => l.id === budgetLineId);
      if (!line) return 0;

      const dotation = line.dotation_initiale || 0;
      const engage = line.total_engage || 0;
      const liquide = line.total_liquide || 0;
      const ordonnance = line.total_ordonnance || 0;
      const paye = line.total_paye || 0;

      // Disponible = dotation - max(engagé, liquidé, ordonnancé, payé)
      // Normalement c'est linéaire, mais on prend le max pour être conservateur
      const consomme = Math.max(engage, liquide, ordonnance, paye);
      return Math.max(0, dotation - consomme);
    },
    [budgetLines]
  );

  /**
   * Valide une imputation contre le budget chargé
   */
  const validateImputation = useCallback(
    (
      imputation: string | null | undefined,
      options: ValidationOptions = {}
    ): ImputationValidationResult => {
      const {
        allowUnknownWithJustification = true,
        blockIfNotFound = false,
      } = options;

      const result: ImputationValidationResult = {
        isValid: true,
        isFoundInBudget: false,
        warnings: [],
        errors: [],
      };

      // Vérifier si l'imputation est fournie
      const { isValid, imputation_complete } = splitImputation(imputation);
      if (!isValid || !imputation_complete) {
        result.isValid = false;
        result.errors.push("Imputation non fournie ou invalide");
        return result;
      }

      // Rechercher dans le budget
      const budgetLine = findBudgetLine(imputation_complete);

      if (budgetLine) {
        result.isFoundInBudget = true;
        result.budgetLineId = budgetLine.id;
        result.budgetLineCode = budgetLine.code;
        result.budgetLineLabel = budgetLine.label;
        result.disponible = calculateDisponible(budgetLine.id);

        // Vérifier si la ligne est active
        if (!budgetLine.is_active) {
          result.warnings.push(
            "Cette ligne budgétaire est désactivée. Veuillez vérifier avec le contrôleur budgétaire."
          );
        }

        // Vérifier le disponible
        if (result.disponible !== undefined && result.disponible <= 0) {
          result.warnings.push(
            `Budget épuisé sur cette ligne (disponible: 0 FCFA)`
          );
        }
      } else {
        // Imputation non trouvée dans le budget
        result.isFoundInBudget = false;

        if (blockIfNotFound) {
          result.isValid = false;
          result.errors.push(
            `Imputation "${imputation_complete}" introuvable dans le budget ${exercice}. ` +
              "La validation est bloquée."
          );
        } else if (allowUnknownWithJustification) {
          result.warnings.push(
            `Imputation "${imputation_complete}" introuvable dans le budget chargé de l'exercice ${exercice}. ` +
              "Une justification sera requise pour continuer."
          );
        } else {
          result.warnings.push(
            `Imputation "${imputation_complete}" introuvable dans le budget ${exercice}.`
          );
        }
      }

      return result;
    },
    [exercice, findBudgetLine, calculateDisponible]
  );

  /**
   * Logger un warning d'imputation avec justification (audit)
   */
  const logImputationWarning = useCallback(
    async (
      entityType: string,
      entityId: string,
      imputation: string,
      justification: string
    ): Promise<void> => {
      await logAction({
        entityType,
        entityId,
        action: "imputation_warning",
        newValues: {
          imputation,
          warning: "Imputation non trouvée dans le budget",
          justification,
          exercice,
          logged_at: new Date().toISOString(),
        },
      });
    },
    [logAction, exercice]
  );

  return {
    budgetLines,
    isLoading,
    error: error as Error | null,
    validateImputation,
    findBudgetLine,
    imputationExists,
    calculateDisponible,
    logImputationWarning,
  };
}

export default useImputationValidation;
