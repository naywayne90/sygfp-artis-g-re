/**
 * useRoadmapDiff - Hook pour la gestion du diff et versioning des feuilles de route
 *
 * Gère le calcul des différences, la sélection des changements,
 * et l'application sélective lors du réaménagement.
 */

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";

// Types
export type ChangeType = "add" | "modify" | "remove";

export interface DiffField {
  field: string;
  old: unknown;
  new: unknown;
}

export interface PendingChange {
  id: string;
  direction_id: string;
  exercice_id: string;
  import_batch_id: string | null;
  activite_id: string | null;
  change_type: ChangeType;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  diff_fields: DiffField[] | null;
  parent_action_id: string | null;
  parent_action_code: string | null;
  is_hierarchy_valid: boolean;
  hierarchy_warning: string | null;
  is_selected: boolean;
  status: "pending" | "applied" | "rejected" | "skipped";
  applied_at: string | null;
  applied_by: string | null;
  created_at: string;
}

export interface VersionSnapshot {
  id: string;
  direction_id: string;
  exercice_id: string;
  submission_id: string | null;
  version_number: number;
  snapshot_date: string;
  snapshot_by: string | null;
  snapshot_data: Record<string, unknown>[];
  nb_activites: number;
  montant_total: number;
  reason: string | null;
  created_at: string;
}

export interface DiffStats {
  total: number;
  additions: number;
  modifications: number;
  removals: number;
  selected: number;
  hierarchyErrors: number;
}

export interface ApplyResult {
  applied_count: number;
  skipped_count: number;
  error_count: number;
}

/**
 * Hook pour calculer et gérer le diff d'un import
 */
export function useRoadmapDiff(importBatchId: string | null, directionId?: string) {
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();
  const { log } = useAuditLog();

  // État local pour les sélections optimistes
  const [localSelections, setLocalSelections] = useState<Record<string, boolean>>({});

  // Récupérer les changements en attente
  const changesQuery = useQuery({
    queryKey: ["roadmap-pending-changes", importBatchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_pending_changes")
        .select("*")
        .eq("import_batch_id", importBatchId!)
        .eq("status", "pending")
        .order("change_type")
        .order("created_at");

      if (error) throw error;
      return data as PendingChange[];
    },
    enabled: !!importBatchId,
  });

  // Calculer les statistiques
  const stats: DiffStats = {
    total: changesQuery.data?.length ?? 0,
    additions: changesQuery.data?.filter((c) => c.change_type === "add").length ?? 0,
    modifications: changesQuery.data?.filter((c) => c.change_type === "modify").length ?? 0,
    removals: changesQuery.data?.filter((c) => c.change_type === "remove").length ?? 0,
    selected:
      changesQuery.data?.filter(
        (c) => localSelections[c.id] ?? c.is_selected
      ).length ?? 0,
    hierarchyErrors:
      changesQuery.data?.filter((c) => !c.is_hierarchy_valid).length ?? 0,
  };

  // Mutation pour calculer le diff
  const calculateDiffMutation = useMutation({
    mutationFn: async ({
      batchId,
      dirId,
      exId,
    }: {
      batchId: string;
      dirId: string;
      exId: string;
    }) => {
      // Créer un snapshot avant le calcul
      const { data: snapshotId, error: snapshotError } = await supabase.rpc(
        "create_roadmap_snapshot",
        {
          p_direction_id: dirId,
          p_exercice_id: exId,
          p_reason: "Avant réaménagement (import)",
        }
      );

      if (snapshotError) {
        console.warn("Erreur création snapshot:", snapshotError);
      }

      // Calculer le diff
      const { data, error } = await supabase.rpc("calculate_import_diff", {
        p_import_batch_id: batchId,
        p_direction_id: dirId,
        p_exercice_id: exId,
      });

      if (error) throw error;
      return { changes: data, snapshotId };
    },
    onSuccess: ({ changes }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-pending-changes"] });
      toast.success(`${changes?.length ?? 0} changement(s) détecté(s)`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur calcul diff: ${error.message}`);
    },
  });

  // Mutation pour basculer la sélection d'un changement
  const toggleSelectionMutation = useMutation({
    mutationFn: async ({
      changeId,
      isSelected,
    }: {
      changeId: string;
      isSelected: boolean;
    }) => {
      const { data, error } = await supabase.rpc("toggle_change_selection", {
        p_change_id: changeId,
        p_is_selected: isSelected,
      });

      if (error) throw error;
      return { changeId, isSelected };
    },
    onMutate: async ({ changeId, isSelected }) => {
      // Mise à jour optimiste
      setLocalSelections((prev) => ({
        ...prev,
        [changeId]: isSelected,
      }));
    },
    onError: (error: Error, { changeId }) => {
      // Rollback
      setLocalSelections((prev) => {
        const newState = { ...prev };
        delete newState[changeId];
        return newState;
      });
      toast.error(`Erreur: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-pending-changes"] });
    },
  });

  // Mutation pour sélectionner/désélectionner tous
  const toggleAllMutation = useMutation({
    mutationFn: async ({
      batchId,
      isSelected,
      changeType,
    }: {
      batchId: string;
      isSelected: boolean;
      changeType?: ChangeType;
    }) => {
      let query = supabase
        .from("roadmap_pending_changes")
        .update({ is_selected: isSelected })
        .eq("import_batch_id", batchId)
        .eq("status", "pending");

      if (changeType) {
        query = query.eq("change_type", changeType);
      }

      const { error } = await query;
      if (error) throw error;

      return { isSelected, changeType };
    },
    onSuccess: () => {
      setLocalSelections({});
      queryClient.invalidateQueries({ queryKey: ["roadmap-pending-changes"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour appliquer les changements sélectionnés
  const applyChangesMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.rpc("apply_selected_changes", {
        p_import_batch_id: batchId,
      });

      if (error) throw error;
      return data[0] as ApplyResult;
    },
    onSuccess: (result, batchId) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-pending-changes"] });
      queryClient.invalidateQueries({ queryKey: ["activites"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });

      log({
        action: "roadmap_changes_applied",
        entity_type: "import_batch",
        entity_id: batchId,
        details: result,
      });

      toast.success(
        `${result.applied_count} changement(s) appliqué(s), ${result.skipped_count} ignoré(s)`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erreur application: ${error.message}`);
    },
  });

  // Helper pour obtenir la sélection effective d'un changement
  const getEffectiveSelection = useCallback(
    (change: PendingChange) => {
      return localSelections[change.id] ?? change.is_selected;
    },
    [localSelections]
  );

  // Helper pour formatter les champs de diff
  const formatDiffField = (field: DiffField): string => {
    const fieldLabels: Record<string, string> = {
      libelle: "Libellé",
      montant_prevu: "Montant prévu",
      description: "Description",
      responsable: "Responsable",
      date_debut_prevue: "Date début",
      date_fin_prevue: "Date fin",
    };

    return fieldLabels[field.field] || field.field;
  };

  return {
    // Données
    changes: changesQuery.data ?? [],
    stats,
    isLoading: changesQuery.isLoading,
    isError: changesQuery.isError,

    // Actions
    calculateDiff: (batchId: string, dirId: string, exId: string) =>
      calculateDiffMutation.mutateAsync({ batchId, dirId, exId }),

    toggleSelection: (changeId: string, isSelected: boolean) =>
      toggleSelectionMutation.mutate({ changeId, isSelected }),

    toggleAll: (batchId: string, isSelected: boolean, changeType?: ChangeType) =>
      toggleAllMutation.mutate({ batchId, isSelected, changeType }),

    applyChanges: (batchId: string) => applyChangesMutation.mutateAsync(batchId),

    // États des mutations
    isCalculating: calculateDiffMutation.isPending,
    isToggling: toggleSelectionMutation.isPending,
    isApplying: applyChangesMutation.isPending,

    // Helpers
    getEffectiveSelection,
    formatDiffField,

    // Refetch
    refetch: changesQuery.refetch,
  };
}

/**
 * Hook pour récupérer l'historique des versions (snapshots)
 */
export function useRoadmapVersionHistory(directionId?: string) {
  const { exerciceId } = useExercice();

  return useQuery({
    queryKey: ["roadmap-snapshots", directionId, exerciceId],
    queryFn: async () => {
      let query = supabase
        .from("roadmap_version_snapshots")
        .select("*")
        .order("version_number", { ascending: false });

      if (directionId) {
        query = query.eq("direction_id", directionId);
      }

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as VersionSnapshot[];
    },
    enabled: !!exerciceId,
  });
}

/**
 * Hook pour comparer deux versions
 */
export function useCompareVersions(snapshotId1?: string, snapshotId2?: string) {
  return useQuery({
    queryKey: ["roadmap-version-compare", snapshotId1, snapshotId2],
    queryFn: async () => {
      const [{ data: v1 }, { data: v2 }] = await Promise.all([
        supabase
          .from("roadmap_version_snapshots")
          .select("*")
          .eq("id", snapshotId1!)
          .single(),
        supabase
          .from("roadmap_version_snapshots")
          .select("*")
          .eq("id", snapshotId2!)
          .single(),
      ]);

      if (!v1 || !v2) {
        throw new Error("Versions non trouvées");
      }

      // Calculer les différences
      const v1Activities = new Map(
        (v1.snapshot_data as unknown as Array<{ code: string }>).map((a) => [
          a.code,
          a,
        ])
      );
      const v2Activities = new Map(
        (v2.snapshot_data as unknown as Array<{ code: string }>).map((a) => [
          a.code,
          a,
        ])
      );

      const added: unknown[] = [];
      const removed: unknown[] = [];
      const modified: { old: unknown; new: unknown; changes: string[] }[] = [];

      // Chercher les ajouts et modifications
      v2Activities.forEach((activity, code) => {
        const oldActivity = v1Activities.get(code);
        if (!oldActivity) {
          added.push(activity);
        } else {
          const changes: string[] = [];
          const oldAct = oldActivity as Record<string, unknown>;
          const newAct = activity as Record<string, unknown>;

          if (oldAct.libelle !== newAct.libelle) changes.push("libelle");
          if (oldAct.montant_prevu !== newAct.montant_prevu)
            changes.push("montant_prevu");
          if (oldAct.description !== newAct.description)
            changes.push("description");

          if (changes.length > 0) {
            modified.push({ old: oldActivity, new: activity, changes });
          }
        }
      });

      // Chercher les suppressions
      v1Activities.forEach((activity, code) => {
        if (!v2Activities.has(code)) {
          removed.push(activity);
        }
      });

      return {
        version1: v1 as VersionSnapshot,
        version2: v2 as VersionSnapshot,
        diff: {
          added,
          removed,
          modified,
        },
      };
    },
    enabled: !!snapshotId1 && !!snapshotId2,
  });
}
