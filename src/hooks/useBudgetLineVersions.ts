// @ts-nocheck
/**
 * useBudgetLineVersions - Hook pour gérer le versioning des lignes budgétaires
 *
 * Fonctionnalités:
 * - Récupérer l'historique des versions d'une ligne
 * - Créer une nouvelle version lors d'une modification
 * - Restaurer une version précédente
 * - Désactiver/Réactiver une ligne (soft delete)
 * - Comparer deux versions (diff)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import { useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface BudgetLineVersion {
  id: string;
  budget_line_id: string;
  version_number: number;
  snapshot: BudgetLineSnapshot;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  change_type: ChangeType;
  change_reason: string | null;
  change_summary: string | null;
  created_at: string;
  created_by: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  budget_line_code?: string;
  budget_line_label?: string;
}

export interface BudgetLineSnapshot {
  code: string;
  label: string;
  level: string;
  dotation_initiale: number;
  source_financement: string | null;
  direction_id: string | null;
  os_id: string | null;
  mission_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  statut: string | null;
  commentaire: string | null;
}

export type ChangeType =
  | "creation"
  | "modification"
  | "status_change"
  | "restoration"
  | "deactivation"
  | "reactivation";

export interface ModificationData {
  label?: string;
  dotation_initiale?: number;
  source_financement?: string;
  direction_id?: string | null;
  os_id?: string | null;
  mission_id?: string | null;
  action_id?: string | null;
  activite_id?: string | null;
  commentaire?: string | null;
}

export interface VersionDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  type: "added" | "removed" | "changed" | "unchanged";
}

// Labels pour les champs
const FIELD_LABELS: Record<string, string> = {
  code: "Code",
  label: "Libellé",
  level: "Niveau",
  dotation_initiale: "Dotation initiale",
  source_financement: "Source de financement",
  direction_id: "Direction",
  os_id: "Objectif Stratégique",
  mission_id: "Mission",
  action_id: "Action",
  activite_id: "Activité",
  statut: "Statut",
  commentaire: "Commentaire",
  is_active: "Actif",
};

// ============================================
// HOOK
// ============================================

export function useBudgetLineVersions(budgetLineId?: string) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer l'historique des versions d'une ligne
  const {
    data: versions,
    isLoading,
    refetch: refetchVersions,
  } = useQuery({
    queryKey: ["budget-line-versions", budgetLineId],
    queryFn: async () => {
      if (!budgetLineId) return [];

      const { data, error } = await supabase
        .from("budget_line_versions")
        .select(`
          *,
          created_by_profile:profiles!budget_line_versions_created_by_fkey(full_name, email)
        `)
        .eq("budget_line_id", budgetLineId)
        .order("version_number", { ascending: false });

      if (error) throw error;

      return (data || []).map((v: any) => ({
        ...v,
        created_by_name: v.created_by_profile?.full_name,
        created_by_email: v.created_by_profile?.email,
      })) as BudgetLineVersion[];
    },
    enabled: !!budgetLineId,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  // Modifier une ligne avec versioning
  const modifyBudgetLine = useMutation({
    mutationFn: async ({
      budgetLineId,
      changes,
      reason,
    }: {
      budgetLineId: string;
      changes: ModificationData;
      reason?: string;
    }) => {
      // 1. Récupérer les valeurs actuelles
      const { data: currentLine, error: fetchError } = await supabase
        .from("budget_lines")
        .select("*")
        .eq("id", budgetLineId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Préparer old_values et new_values
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      Object.entries(changes).forEach(([key, value]) => {
        if (currentLine[key] !== value) {
          oldValues[key] = currentLine[key];
          newValues[key] = value;
        }
      });

      // Si aucun changement réel
      if (Object.keys(newValues).length === 0) {
        throw new Error("Aucune modification détectée");
      }

      // 3. Mettre à jour la ligne
      const { error: updateError } = await supabase
        .from("budget_lines")
        .update({
          ...changes,
          last_modified_at: new Date().toISOString(),
        })
        .eq("id", budgetLineId);

      if (updateError) throw updateError;

      // 4. Créer la version via RPC
      const { data: version, error: versionError } = await supabase.rpc(
        "create_budget_line_version",
        {
          p_budget_line_id: budgetLineId,
          p_old_values: oldValues,
          p_new_values: newValues,
          p_change_type: "modification",
          p_change_reason: reason || null,
          p_user_id: null, // Utilise auth.uid() dans la fonction
        }
      );

      if (versionError) throw versionError;

      return { line: currentLine, version };
    },
    onSuccess: () => {
      toast.success("Ligne budgétaire modifiée avec versioning");
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-line-versions"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Restaurer une version
  const restoreVersion = useMutation({
    mutationFn: async ({
      versionId,
      reason,
    }: {
      versionId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("restore_budget_line_version", {
        p_version_id: versionId,
        p_reason: reason || "Restauration manuelle",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Version restaurée avec succès");
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-line-versions"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur de restauration: " + error.message);
    },
  });

  // Désactiver une ligne
  const deactivateLine = useMutation({
    mutationFn: async ({
      budgetLineId,
      reason,
    }: {
      budgetLineId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc("deactivate_budget_line", {
        p_budget_line_id: budgetLineId,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ligne désactivée");
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-line-versions"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Réactiver une ligne
  const reactivateLine = useMutation({
    mutationFn: async ({
      budgetLineId,
      reason,
    }: {
      budgetLineId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("reactivate_budget_line", {
        p_budget_line_id: budgetLineId,
        p_reason: reason || "Réactivation manuelle",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ligne réactivée");
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-line-versions"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Comparer deux versions pour obtenir un diff
   */
  const compareVersions = useCallback(
    (oldVersion: BudgetLineVersion, newVersion: BudgetLineVersion): VersionDiff[] => {
      const diffs: VersionDiff[] = [];
      const oldSnapshot = oldVersion.snapshot;
      const newSnapshot = newVersion.snapshot;

      const allKeys = new Set([
        ...Object.keys(oldSnapshot),
        ...Object.keys(newSnapshot),
      ]);

      allKeys.forEach((key) => {
        const oldVal = oldSnapshot[key as keyof BudgetLineSnapshot];
        const newVal = newSnapshot[key as keyof BudgetLineSnapshot];

        let type: VersionDiff["type"] = "unchanged";
        if (oldVal === undefined && newVal !== undefined) {
          type = "added";
        } else if (oldVal !== undefined && newVal === undefined) {
          type = "removed";
        } else if (oldVal !== newVal) {
          type = "changed";
        }

        if (type !== "unchanged") {
          diffs.push({
            field: key,
            label: FIELD_LABELS[key] || key,
            oldValue: oldVal,
            newValue: newVal,
            type,
          });
        }
      });

      return diffs;
    },
    []
  );

  /**
   * Obtenir le diff d'une version par rapport à la précédente
   */
  const getVersionDiff = useCallback(
    (version: BudgetLineVersion): VersionDiff[] => {
      if (!version.old_values || !version.new_values) {
        return [];
      }

      const diffs: VersionDiff[] = [];
      const allKeys = new Set([
        ...Object.keys(version.old_values),
        ...Object.keys(version.new_values),
      ]);

      allKeys.forEach((key) => {
        const oldVal = version.old_values?.[key];
        const newVal = version.new_values?.[key];

        if (oldVal !== newVal) {
          diffs.push({
            field: key,
            label: FIELD_LABELS[key] || key,
            oldValue: oldVal,
            newValue: newVal,
            type: oldVal === undefined ? "added" : newVal === undefined ? "removed" : "changed",
          });
        }
      });

      return diffs;
    },
    []
  );

  /**
   * Formater une valeur pour affichage
   */
  const formatValue = useCallback((field: string, value: any): string => {
    if (value === null || value === undefined) return "-";

    if (field === "dotation_initiale") {
      return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
    }

    if (field === "is_active") {
      return value ? "Oui" : "Non";
    }

    if (typeof value === "boolean") {
      return value ? "Oui" : "Non";
    }

    return String(value);
  }, []);

  /**
   * Obtenir le label du type de changement
   */
  const getChangeTypeLabel = useCallback((type: ChangeType): string => {
    const labels: Record<ChangeType, string> = {
      creation: "Création",
      modification: "Modification",
      status_change: "Changement de statut",
      restoration: "Restauration",
      deactivation: "Désactivation",
      reactivation: "Réactivation",
    };
    return labels[type] || type;
  }, []);

  /**
   * Obtenir la couleur du type de changement
   */
  const getChangeTypeColor = useCallback((type: ChangeType): string => {
    const colors: Record<ChangeType, string> = {
      creation: "bg-green-100 text-green-800",
      modification: "bg-blue-100 text-blue-800",
      status_change: "bg-yellow-100 text-yellow-800",
      restoration: "bg-purple-100 text-purple-800",
      deactivation: "bg-red-100 text-red-800",
      reactivation: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    versions,
    isLoading,

    // Actions
    modifyBudgetLine: modifyBudgetLine.mutate,
    modifyBudgetLineAsync: modifyBudgetLine.mutateAsync,
    restoreVersion: restoreVersion.mutate,
    deactivateLine: deactivateLine.mutate,
    reactivateLine: reactivateLine.mutate,
    refetchVersions,

    // Helpers
    compareVersions,
    getVersionDiff,
    formatValue,
    getChangeTypeLabel,
    getChangeTypeColor,

    // Loading states
    isModifying: modifyBudgetLine.isPending,
    isRestoring: restoreVersion.isPending,
    isDeactivating: deactivateLine.isPending,
    isReactivating: reactivateLine.isPending,
  };
}

export default useBudgetLineVersions;
