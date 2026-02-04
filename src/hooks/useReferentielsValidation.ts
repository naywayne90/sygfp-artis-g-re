// @ts-nocheck - Tables/columns not in generated types
/**
 * useReferentielsValidation - Hook pour valider la cohérence des référentiels
 *
 * Vérifie que:
 * - Une activité ne peut pas référencer un plan d'une autre direction
 * - Les liens hiérarchiques sont cohérents (OS → Action → Activité)
 * - Les directions sont correctement mappées aux OS
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPES
// ============================================

export interface HierarchieValidationResult {
  niveau: string;
  entite_id: string;
  code: string;
  parent_attendu: string | null;
  parent_reel: string | null;
  est_coherent: boolean;
  message: string;
}

export interface ImportLogEntry {
  id: string;
  type_import: ImportType;
  nom_fichier: string;
  format_fichier?: string;
  taille_fichier?: number;
  nb_lignes_total: number;
  nb_lignes_importees: number;
  nb_lignes_erreur: number;
  nb_lignes_ignorees: number;
  erreurs: ImportError[];
  warnings: string[];
  statut: ImportStatus;
  message?: string;
  exercice_id?: string;
  user_id?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export type ImportType =
  | "os"
  | "missions"
  | "actions"
  | "activites"
  | "sous_activites"
  | "directions"
  | "plans_travail"
  | "budget_lines"
  | "tiers"
  | "other";

export type ImportStatus = "en_cours" | "termine" | "erreur" | "annule";

export interface ImportError {
  ligne: number;
  colonne?: string;
  valeur?: string;
  message: string;
}

export interface ValidationCoherenceParams {
  activiteId?: string;
  actionId?: string;
  missionId?: string;
  osId?: string;
  directionId?: string;
  exerciceId?: string;
}

export interface PlanTravail {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  exercice_id: string;
  direction_id: string;
  statut: "brouillon" | "valide" | "en_cours" | "cloture";
  date_debut?: string;
  date_fin?: string;
  budget_alloue: number;
  budget_consomme: number;
  responsable_id?: string;
  est_actif: boolean;
}

export interface DirectionOSMapping {
  id: string;
  direction_id: string;
  os_id: string;
  exercice_id: string;
  budget_alloue: number;
  budget_consomme: number;
  est_pilote: boolean;
  est_contributeur: boolean;
  est_actif: boolean;
}

// ============================================
// HOOK
// ============================================

export function useReferentielsValidation() {
  /**
   * Valider la cohérence hiérarchique des référentiels
   */
  const validateHierarchie = useCallback(async (
    params: ValidationCoherenceParams
  ): Promise<{ valid: boolean; results: HierarchieValidationResult[] }> => {
    try {
      const { data, error } = await supabase.rpc("validate_hierarchie_referentiels", {
        p_activite_id: params.activiteId || null,
        p_action_id: params.actionId || null,
        p_mission_id: params.missionId || null,
        p_os_id: params.osId || null,
        p_direction_id: params.directionId || null,
        p_exercice_id: params.exerciceId || null,
      });

      if (error) {
        console.error("Erreur validation hiérarchie:", error);
        return { valid: false, results: [] };
      }

      const results = (data || []) as HierarchieValidationResult[];
      const valid = results.every(r => r.est_coherent);

      return { valid, results };
    } catch (err) {
      console.error("Erreur validation:", err);
      return { valid: false, results: [] };
    }
  }, []);

  /**
   * Vérifier qu'une activité peut être rattachée à un plan de travail
   */
  const canLinkActiviteToPlan = useCallback(async (
    activiteId: string,
    planTravailId: string
  ): Promise<{ canLink: boolean; reason?: string }> => {
    try {
      // Récupérer l'activité
      const { data: activite } = await supabase
        .from("activites")
        .select("id, direction_id, action_id")
        .eq("id", activiteId)
        .single();

      if (!activite) {
        return { canLink: false, reason: "Activité non trouvée" };
      }

      // Récupérer le plan de travail
      const { data: plan } = await supabase
        .from("plans_travail")
        .select("id, direction_id, exercice_id")
        .eq("id", planTravailId)
        .single();

      if (!plan) {
        return { canLink: false, reason: "Plan de travail non trouvé" };
      }

      // Vérifier la cohérence direction
      if (activite.direction_id && activite.direction_id !== plan.direction_id) {
        return {
          canLink: false,
          reason: "L'activité appartient à une direction différente du plan de travail",
        };
      }

      return { canLink: true };
    } catch (err) {
      console.error("Erreur vérification lien activité-plan:", err);
      return { canLink: false, reason: "Erreur lors de la vérification" };
    }
  }, []);

  /**
   * Créer un log d'import
   */
  const createImportLog = useCallback(async (
    typeImport: ImportType,
    nomFichier: string,
    options?: {
      formatFichier?: string;
      tailleFichier?: number;
      exerciceId?: string;
    }
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc("create_import_log", {
        p_type_import: typeImport,
        p_nom_fichier: nomFichier,
        p_format_fichier: options?.formatFichier || null,
        p_taille_fichier: options?.tailleFichier || null,
        p_exercice_id: options?.exerciceId || null,
      });

      if (error) {
        console.error("Erreur création import log:", error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error("Erreur création import log:", err);
      return null;
    }
  }, []);

  /**
   * Finaliser un log d'import
   */
  const finalizeImportLog = useCallback(async (
    importId: string,
    results: {
      nbLignesTotal: number;
      nbLignesImportees: number;
      nbLignesErreur?: number;
      nbLignesIgnorees?: number;
      erreurs?: ImportError[];
      warnings?: string[];
      message?: string;
    }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc("finalize_import_log", {
        p_import_id: importId,
        p_nb_lignes_total: results.nbLignesTotal,
        p_nb_lignes_importees: results.nbLignesImportees,
        p_nb_lignes_erreur: results.nbLignesErreur || 0,
        p_nb_lignes_ignorees: results.nbLignesIgnorees || 0,
        p_erreurs: JSON.stringify(results.erreurs || []),
        p_warnings: JSON.stringify(results.warnings || []),
        p_message: results.message || null,
      });

      if (error) {
        console.error("Erreur finalisation import log:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Erreur finalisation import log:", err);
      return false;
    }
  }, []);

  /**
   * Récupérer l'historique des imports
   */
  const getImportHistory = useCallback(async (
    options?: {
      typeImport?: ImportType;
      exerciceId?: string;
      limit?: number;
    }
  ): Promise<ImportLogEntry[]> => {
    try {
      let query = supabase
        .from("import_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.typeImport) {
        query = query.eq("type_import", options.typeImport);
      }

      if (options?.exerciceId) {
        query = query.eq("exercice_id", options.exerciceId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur récupération historique imports:", error);
        return [];
      }

      return (data || []) as ImportLogEntry[];
    } catch (err) {
      console.error("Erreur récupération historique imports:", err);
      return [];
    }
  }, []);

  /**
   * Récupérer les plans de travail d'une direction
   */
  const getPlansTravailByDirection = useCallback(async (
    directionId: string,
    exerciceId?: string
  ): Promise<PlanTravail[]> => {
    try {
      let query = supabase
        .from("plans_travail")
        .select("*")
        .eq("direction_id", directionId)
        .eq("est_actif", true)
        .order("code");

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur récupération plans travail:", error);
        return [];
      }

      return (data || []) as PlanTravail[];
    } catch (err) {
      console.error("Erreur récupération plans travail:", err);
      return [];
    }
  }, []);

  /**
   * Récupérer le mapping Direction-OS
   */
  const getDirectionOSMapping = useCallback(async (
    directionId?: string,
    osId?: string,
    exerciceId?: string
  ): Promise<DirectionOSMapping[]> => {
    try {
      let query = supabase
        .from("direction_os_mapping")
        .select("*")
        .eq("est_actif", true);

      if (directionId) {
        query = query.eq("direction_id", directionId);
      }

      if (osId) {
        query = query.eq("os_id", osId);
      }

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur récupération mapping direction-os:", error);
        return [];
      }

      return (data || []) as DirectionOSMapping[];
    } catch (err) {
      console.error("Erreur récupération mapping direction-os:", err);
      return [];
    }
  }, []);

  /**
   * Vérifier la cohérence complète d'une dépense avant imputation
   */
  const validateDepenseBeforeImputation = useCallback(async (params: {
    activiteId?: string;
    actionId?: string;
    osId?: string;
    directionId: string;
    exerciceId: string;
  }): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // Vérifier le mapping direction-OS
    if (params.osId) {
      const mapping = await getDirectionOSMapping(
        params.directionId,
        params.osId,
        params.exerciceId
      );

      if (mapping.length === 0) {
        errors.push(
          `La direction n'est pas autorisée à imputer sur cet Objectif Stratégique pour cet exercice`
        );
      }
    }

    // Vérifier la hiérarchie
    const hierarchie = await validateHierarchie({
      activiteId: params.activiteId,
      actionId: params.actionId,
      osId: params.osId,
      directionId: params.directionId,
      exerciceId: params.exerciceId,
    });

    if (!hierarchie.valid) {
      errors.push(
        ...hierarchie.results
          .filter(r => !r.est_coherent)
          .map(r => r.message)
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [validateHierarchie, getDirectionOSMapping]);

  return {
    // Validation
    validateHierarchie,
    canLinkActiviteToPlan,
    validateDepenseBeforeImputation,

    // Import logs
    createImportLog,
    finalizeImportLog,
    getImportHistory,

    // Référentiels
    getPlansTravailByDirection,
    getDirectionOSMapping,
  };
}

export default useReferentielsValidation;
