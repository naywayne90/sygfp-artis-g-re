// @ts-nocheck
/**
 * useCoherenceCheck - Hook pour la détection d'incohérences dans les données
 *
 * Règles de validation :
 * 1. Activité doit appartenir à 1 Plan, 1 Direction, 1 Exercice
 * 2. Une dépense doit être liée à une activité existante
 * 3. Montant ne peut pas dépasser le disponible budgétaire
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

// Types d'anomalies
export type AnomalyType =
  | "ACTIVITE_SANS_PLAN"
  | "ACTIVITE_SANS_DIRECTION"
  | "ACTIVITE_SANS_EXERCICE"
  | "DEPENSE_ACTIVITE_INEXISTANTE"
  | "DEPASSEMENT_BUDGET"
  | "DOUBLON_REFERENCE"
  | "LIGNE_BUDGET_ORPHELINE"
  | "IMPUTATION_INVALIDE"
  | "MONTANT_NEGATIF"
  | "DATE_HORS_EXERCICE";

export type AnomalySeverity = "error" | "warning" | "info";

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  entityType: string;
  entityId: string | null;
  entityRef?: string;
  message: string;
  details: Record<string, unknown>;
  suggestedAction?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface CoherenceReport {
  id: string;
  exerciceId: string;
  generatedAt: string;
  generatedBy: string;
  source: "import" | "manual" | "scheduled";
  sourceDetails?: string;
  totalChecks: number;
  anomaliesCount: number;
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
  anomalies: Anomaly[];
  status: "pending" | "reviewed" | "resolved";
}

// Labels français pour les types d'anomalies
export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  ACTIVITE_SANS_PLAN: "Activité sans plan associé",
  ACTIVITE_SANS_DIRECTION: "Activité sans direction",
  ACTIVITE_SANS_EXERCICE: "Activité sans exercice",
  DEPENSE_ACTIVITE_INEXISTANTE: "Dépense liée à une activité inexistante",
  DEPASSEMENT_BUDGET: "Dépassement du budget disponible",
  DOUBLON_REFERENCE: "Référence en doublon",
  LIGNE_BUDGET_ORPHELINE: "Ligne budgétaire orpheline",
  IMPUTATION_INVALIDE: "Imputation budgétaire invalide",
  MONTANT_NEGATIF: "Montant négatif détecté",
  DATE_HORS_EXERCICE: "Date hors de l'exercice",
};

export const ANOMALY_SEVERITY_CONFIG: Record<AnomalySeverity, { label: string; color: string; bgColor: string }> = {
  error: { label: "Erreur", color: "text-red-700", bgColor: "bg-red-100" },
  warning: { label: "Avertissement", color: "text-amber-700", bgColor: "bg-amber-100" },
  info: { label: "Information", color: "text-blue-700", bgColor: "bg-blue-100" },
};

/**
 * Règles de validation
 */
const VALIDATION_RULES = {
  // Règle 1: Activité doit avoir Plan, Direction, Exercice
  checkActiviteCompletude: async (exerciceId: string): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];
    const exerciceAnnee = parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear();

    // Vérifier les activités sans sous-activité (orphelines)
    const { data: orphanActivites, error } = await supabase
      .from("activites")
      .select("id, code, libelle")
      .eq("exercice", exerciceAnnee)
      .is("sous_activite_id", null);

    if (error) {
      console.error("Erreur vérification activités:", error);
      return anomalies;
    }

    orphanActivites?.forEach((act) => {
      anomalies.push({
        id: crypto.randomUUID(),
        type: "ACTIVITE_SANS_PLAN",
        severity: "error",
        entityType: "activite",
        entityId: act.id,
        entityRef: act.code ?? undefined,
        message: `L'activité "${act.code}" n'est rattachée à aucun plan programmatique`,
        details: { activite: act },
        suggestedAction: "Rattacher l'activité à une sous-activité valide",
        createdAt: new Date().toISOString(),
      });
    });

    // Vérifier les activités sans direction
    const { data: activitesSansDirection } = await supabase
      .from("activites")
      .select("id, code, libelle")
      .eq("exercice", exerciceAnnee)
      .is("direction_id", null);

    activitesSansDirection?.forEach((act) => {
      anomalies.push({
        id: crypto.randomUUID(),
        type: "ACTIVITE_SANS_DIRECTION",
        severity: "error",
        entityType: "activite",
        entityId: act.id,
        entityRef: act.code ?? undefined,
        message: `L'activité "${act.code}" n'est rattachée à aucune direction`,
        details: { activite: act },
        suggestedAction: "Attribuer une direction à l'activité",
        createdAt: new Date().toISOString(),
      });
    });

    return anomalies;
  },

  // Règle 2: Dépense liée à activité existante
  checkDepenseActivite: async (exerciceId: string): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];

    // Vérifier les notes SEF avec mission inexistante
    const { data: notesSef } = await supabase
      .from("notes_sef")
      .select("id, numero, mission_id")
      .eq("exercice", parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear())
      .not("mission_id", "is", null);

    if (notesSef) {
      for (const note of notesSef) {
        const { data: mission } = await supabase
          .from("missions")
          .select("id")
          .eq("id", note.mission_id)
          .single();

        if (!mission) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "DEPENSE_ACTIVITE_INEXISTANTE",
            severity: "error",
            entityType: "note_sef",
            entityId: note.id,
            entityRef: note.numero ?? undefined,
            message: `La note SEF "${note.numero}" référence une mission inexistante`,
            details: { noteId: note.id, missionId: note.mission_id },
            suggestedAction: "Corriger la référence de la mission ou la supprimer",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Vérifier les imputations avec ligne budgétaire inexistante
    const { data: imputations } = await supabase
      .from("imputation_lignes")
      .select(`
        id,
        imputation_id,
        budget_line_id,
        imputations!inner(id, exercice_id)
      `)
      .eq("imputations.exercice_id", exerciceId);

    if (imputations) {
      for (const imp of imputations) {
        const { data: ligne } = await supabase
          .from("budget_lines")
          .select("id")
          .eq("id", imp.budget_line_id)
          .single();

        if (!ligne) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "IMPUTATION_INVALIDE",
            severity: "error",
            entityType: "imputation_ligne",
            entityId: imp.id,
            message: `Imputation avec ligne budgétaire inexistante`,
            details: { imputationId: imp.imputation_id, ligneId: imp.budget_line_id },
            suggestedAction: "Corriger ou supprimer la ligne d'imputation",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return anomalies;
  },

  // Règle 3: Montant ne dépasse pas le disponible
  checkDepassementBudget: async (exerciceId: string): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];

    const { data: lignes } = await supabase
      .from("budget_lines")
      .select(`
        id, code, label,
        dotation_initiale, dotation_modifiee,
        total_engage, total_liquide, total_ordonnance
      `)
      .eq("exercice", parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear());

    lignes?.forEach((ligne) => {
      const montantTotal = (ligne.dotation_initiale || 0) + (ligne.dotation_modifiee || 0);
      const disponibleAE = montantTotal - (ligne.total_engage || 0);
      const disponibleCP = montantTotal - (ligne.total_liquide || 0);

      if (disponibleAE < 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "DEPASSEMENT_BUDGET",
          severity: "error",
          entityType: "budget_line",
          entityId: ligne.id,
          entityRef: ligne.code,
          message: `Dépassement AE sur la ligne "${ligne.code}": ${Math.abs(disponibleAE).toLocaleString()} FCFA`,
          details: {
            ligne: ligne.code,
            montantTotal,
            engage: ligne.total_engage,
            depassement: Math.abs(disponibleAE)
          },
          suggestedAction: "Effectuer un virement de crédit ou annuler des engagements",
          createdAt: new Date().toISOString(),
        });
      }

      if (disponibleCP < 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "DEPASSEMENT_BUDGET",
          severity: "error",
          entityType: "budget_line",
          entityId: ligne.id,
          entityRef: ligne.code,
          message: `Dépassement CP sur la ligne "${ligne.code}": ${Math.abs(disponibleCP).toLocaleString()} FCFA`,
          details: {
            ligne: ligne.code,
            montantTotal,
            liquide: ligne.total_liquide,
            depassement: Math.abs(disponibleCP)
          },
          suggestedAction: "Effectuer un virement de crédit ou annuler des liquidations",
          createdAt: new Date().toISOString(),
        });
      }
    });

    return anomalies;
  },

  // Règle 4: Doublons de références
  checkDoublons: async (exerciceId: string): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];
    const exerciceAnnee = parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear();

    // Doublons de codes d'activités
    const { data: activites } = await supabase
      .from("activites")
      .select("code")
      .eq("exercice", exerciceAnnee);

    const codeCount: Record<string, number> = {};
    activites?.forEach((a) => {
      if (a.code) codeCount[a.code] = (codeCount[a.code] || 0) + 1;
    });

    Object.entries(codeCount).forEach(([code, count]) => {
      if (count > 1) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "DOUBLON_REFERENCE",
          severity: "warning",
          entityType: "activite",
          entityId: null,
          entityRef: code,
          message: `Code activité "${code}" en doublon (${count} occurrences)`,
          details: { code, count },
          suggestedAction: "Fusionner ou renommer les activités en doublon",
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Doublons de lignes budgétaires
    const { data: lignes } = await supabase
      .from("budget_lines")
      .select("code")
      .eq("exercice", exerciceAnnee);

    const ligneCount: Record<string, number> = {};
    lignes?.forEach((l) => {
      ligneCount[l.code] = (ligneCount[l.code] || 0) + 1;
    });

    Object.entries(ligneCount).forEach(([code, count]) => {
      if (count > 1) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "DOUBLON_REFERENCE",
          severity: "warning",
          entityType: "budget_line",
          entityId: null,
          entityRef: code,
          message: `Code ligne budgétaire "${code}" en doublon (${count} occurrences)`,
          details: { code, count },
          suggestedAction: "Fusionner ou renommer les lignes en doublon",
          createdAt: new Date().toISOString(),
        });
      }
    });

    return anomalies;
  },

  // Règle 5: Montants négatifs
  checkMontantsNegatifs: async (exerciceId: string): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];
    const exerciceAnnee = parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear();

    const { data: lignes } = await supabase
      .from("budget_lines")
      .select("id, code, dotation_initiale, dotation_modifiee")
      .eq("exercice", exerciceAnnee)
      .or("dotation_initiale.lt.0,dotation_modifiee.lt.0");

    lignes?.forEach((ligne) => {
      if ((ligne.dotation_initiale || 0) < 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "MONTANT_NEGATIF",
          severity: "error",
          entityType: "budget_line",
          entityId: ligne.id,
          entityRef: ligne.code,
          message: `Dotation initiale négative sur la ligne "${ligne.code}"`,
          details: { dotationInitiale: ligne.dotation_initiale },
          suggestedAction: "Corriger la dotation initiale",
          createdAt: new Date().toISOString(),
        });
      }
      if ((ligne.dotation_modifiee || 0) < 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "MONTANT_NEGATIF",
          severity: "warning",
          entityType: "budget_line",
          entityId: ligne.id,
          entityRef: ligne.code,
          message: `Dotation modifiée négative sur la ligne "${ligne.code}"`,
          details: { dotationModifiee: ligne.dotation_modifiee },
          suggestedAction: "Vérifier les virements de crédit",
          createdAt: new Date().toISOString(),
        });
      }
    });

    return anomalies;
  },
};

/**
 * Hook principal pour la vérification de cohérence
 */
export function useCoherenceCheck() {
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();

  // Générer un rapport de cohérence complet
  const generateReport = useMutation({
    mutationFn: async (source: "import" | "manual" | "scheduled" = "manual"): Promise<CoherenceReport> => {
      if (!exerciceId) throw new Error("Aucun exercice sélectionné");

      const allAnomalies: Anomaly[] = [];

      // Exécuter toutes les règles de validation
      const [
        activiteAnomalies,
        depenseAnomalies,
        budgetAnomalies,
        doublonAnomalies,
        montantAnomalies,
      ] = await Promise.all([
        VALIDATION_RULES.checkActiviteCompletude(exerciceId),
        VALIDATION_RULES.checkDepenseActivite(exerciceId),
        VALIDATION_RULES.checkDepassementBudget(exerciceId),
        VALIDATION_RULES.checkDoublons(exerciceId),
        VALIDATION_RULES.checkMontantsNegatifs(exerciceId),
      ]);

      allAnomalies.push(
        ...activiteAnomalies,
        ...depenseAnomalies,
        ...budgetAnomalies,
        ...doublonAnomalies,
        ...montantAnomalies
      );

      const report: CoherenceReport = {
        id: crypto.randomUUID(),
        exerciceId,
        generatedAt: new Date().toISOString(),
        generatedBy: (await supabase.auth.getUser()).data.user?.id || "system",
        source,
        totalChecks: 5,
        anomaliesCount: allAnomalies.length,
        errorsCount: allAnomalies.filter((a) => a.severity === "error").length,
        warningsCount: allAnomalies.filter((a) => a.severity === "warning").length,
        infosCount: allAnomalies.filter((a) => a.severity === "info").length,
        anomalies: allAnomalies,
        status: allAnomalies.length > 0 ? "pending" : "resolved",
      };

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coherence-reports"] });
    },
  });

  // Vérification rapide (sans générer de rapport complet)
  const quickCheck = useMutation({
    mutationFn: async (): Promise<{ hasErrors: boolean; summary: string }> => {
      if (!exerciceId) return { hasErrors: false, summary: "Aucun exercice" };

      const budgetAnomalies = await VALIDATION_RULES.checkDepassementBudget(exerciceId);
      const errors = budgetAnomalies.filter((a) => a.severity === "error");

      return {
        hasErrors: errors.length > 0,
        summary: errors.length > 0
          ? `${errors.length} dépassement(s) budgétaire(s) détecté(s)`
          : "Aucune anomalie critique",
      };
    },
  });

  return {
    generateReport: generateReport.mutate,
    generateReportAsync: generateReport.mutateAsync,
    isGenerating: generateReport.isPending,
    lastReport: generateReport.data,
    quickCheck: quickCheck.mutate,
    quickCheckAsync: quickCheck.mutateAsync,
    isChecking: quickCheck.isPending,
  };
}

/**
 * Hook pour récupérer l'historique des rapports de cohérence
 */
export function useCoherenceReports() {
  const { exerciceId } = useExercice();

  return useQuery({
    queryKey: ["coherence-reports", exerciceId],
    queryFn: async () => {
      // Pour l'instant, on stocke en mémoire / localStorage
      // TODO: Créer une table coherence_reports dans Supabase
      const stored = localStorage.getItem(`coherence-reports-${exerciceId}`);
      if (stored) {
        return JSON.parse(stored) as CoherenceReport[];
      }
      return [];
    },
    enabled: !!exerciceId,
  });
}

/**
 * Hook pour valider les données avant import
 */
export function useImportValidation() {
  const { exerciceId } = useExercice();

  const validateBudgetImport = useMutation({
    mutationFn: async (data: { lignes: Array<{ code: string; montant_ae: number; montant_cp: number }> }): Promise<Anomaly[]> => {
      const anomalies: Anomaly[] = [];

      // Vérifier les montants négatifs
      data.lignes.forEach((ligne, index) => {
        if (ligne.montant_ae < 0) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "MONTANT_NEGATIF",
            severity: "error",
            entityType: "import_ligne",
            entityId: null,
            entityRef: ligne.code,
            message: `Ligne ${index + 1}: Montant AE négatif (${ligne.montant_ae})`,
            details: { ligne, index },
            suggestedAction: "Corriger le montant avant import",
            createdAt: new Date().toISOString(),
          });
        }
        if (ligne.montant_cp < 0) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "MONTANT_NEGATIF",
            severity: "error",
            entityType: "import_ligne",
            entityId: null,
            entityRef: ligne.code,
            message: `Ligne ${index + 1}: Montant CP négatif (${ligne.montant_cp})`,
            details: { ligne, index },
            suggestedAction: "Corriger le montant avant import",
            createdAt: new Date().toISOString(),
          });
        }
      });

      // Vérifier les doublons dans les données à importer
      const codes = data.lignes.map((l) => l.code);
      const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];

      uniqueDuplicates.forEach((code) => {
        anomalies.push({
          id: crypto.randomUUID(),
          type: "DOUBLON_REFERENCE",
          severity: "warning",
          entityType: "import_ligne",
          entityId: null,
          entityRef: code,
          message: `Code "${code}" présent plusieurs fois dans le fichier`,
          details: { code, count: codes.filter((c) => c === code).length },
          suggestedAction: "Fusionner les lignes ou corriger les codes",
          createdAt: new Date().toISOString(),
        });
      });

      // Vérifier si les codes existent déjà
      if (exerciceId) {
        const exerciceAnnee = parseInt(exerciceId.slice(0, 4)) || new Date().getFullYear();
        const { data: existingLignes } = await supabase
          .from("budget_lines")
          .select("code")
          .eq("exercice", exerciceAnnee)
          .in("code", codes);

        existingLignes?.forEach((existing) => {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "DOUBLON_REFERENCE",
            severity: "info",
            entityType: "import_ligne",
            entityId: null,
            entityRef: existing.code,
            message: `Le code "${existing.code}" existe déjà - sera mis à jour`,
            details: { code: existing.code },
            suggestedAction: "Les données existantes seront écrasées",
            createdAt: new Date().toISOString(),
          });
        });
      }

      return anomalies;
    },
  });

  const validateRoadmapImport = useMutation({
    mutationFn: async (data: { activites: Array<{ code: string; libelle: string; montant_prevu: number }> }): Promise<Anomaly[]> => {
      const anomalies: Anomaly[] = [];

      data.activites.forEach((act, index) => {
        if (!act.code?.trim()) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "ACTIVITE_SANS_PLAN",
            severity: "error",
            entityType: "import_activite",
            entityId: null,
            message: `Ligne ${index + 1}: Code activité manquant`,
            details: { activite: act, index },
            suggestedAction: "Renseigner le code de l'activité",
            createdAt: new Date().toISOString(),
          });
        }
        if (!act.libelle?.trim()) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "ACTIVITE_SANS_PLAN",
            severity: "warning",
            entityType: "import_activite",
            entityId: null,
            entityRef: act.code,
            message: `Ligne ${index + 1}: Libellé manquant pour "${act.code}"`,
            details: { activite: act, index },
            suggestedAction: "Renseigner le libellé de l'activité",
            createdAt: new Date().toISOString(),
          });
        }
        if (act.montant_prevu < 0) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: "MONTANT_NEGATIF",
            severity: "error",
            entityType: "import_activite",
            entityId: null,
            entityRef: act.code,
            message: `Ligne ${index + 1}: Montant négatif pour "${act.code}"`,
            details: { activite: act, index },
            suggestedAction: "Corriger le montant prévu",
            createdAt: new Date().toISOString(),
          });
        }
      });

      return anomalies;
    },
  });

  return {
    validateBudgetImport: validateBudgetImport.mutateAsync,
    validateRoadmapImport: validateRoadmapImport.mutateAsync,
    isValidating: validateBudgetImport.isPending || validateRoadmapImport.isPending,
  };
}
