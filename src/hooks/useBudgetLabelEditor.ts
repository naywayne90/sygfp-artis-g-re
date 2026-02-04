/**
 * useBudgetLabelEditor - Hook pour l'édition des libellés budgétaires
 * Gère l'édition avec historique et audit trail pour:
 * - Objectifs Stratégiques
 * - Missions
 * - Actions
 * - Activités
 *
 * Utilise les fonctions SQL:
 * - update_libelle_budget()
 * - get_historique_libelle()
 * - revert_libelle()
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "./useAuditLog";

// Helper pour accéder aux tables/fonctions qui ne sont pas dans les types générés
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export type BudgetEntityType = 'objectifs_strategiques' | 'missions' | 'actions' | 'activites';

export interface BudgetLabelEntity {
  id: string;
  code: string;
  libelle: string;
  libelle_modifie?: string | null;
  date_modification?: string | null;
  est_actif?: boolean;
  est_active?: boolean;
  description?: string | null;
  annee_debut?: number | null;
  annee_fin?: number | null;
  // Relations
  os_id?: string | null;
  mission_id?: string | null;
  action_id?: string | null;
  parent_code?: string | null;
  parent_libelle?: string | null;
}

export interface BudgetLabelHistory {
  id: string;
  ancien_libelle: string | null;
  nouveau_libelle: string | null;
  modifie_par: string | null;
  modifie_par_nom: string | null;
  modifie_at: string;
  motif: string | null;
}

export interface BudgetLabelUpdateParams {
  entityType: BudgetEntityType;
  entityId: string;
  newLibelle: string;
  motif: string;
}

export interface BudgetLabelRestoreParams {
  entityType: BudgetEntityType;
  entityId: string;
  historyId: string;
  oldValue: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook principal pour l'édition des libellés budgétaires
 */
export function useBudgetLabelEditor(entityType?: BudgetEntityType) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // ──────────────────────────────────────────────────────────────────────────
  // Queries pour chaque type d'entité
  // ──────────────────────────────────────────────────────────────────────────

  // Objectifs Stratégiques
  const { data: objectifsStrategiques = [], isLoading: loadingOS } = useQuery({
    queryKey: ["budget-labels", "objectifs_strategiques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle, description, annee_debut, annee_fin")
        .order("code");
      if (error) throw error;
      return (data || []).map(d => ({ ...d, est_actif: true })) as BudgetLabelEntity[];
    },
    enabled: !entityType || entityType === "objectifs_strategiques",
  });

  // Missions
  const { data: missions = [], isLoading: loadingMissions } = useQuery({
    queryKey: ["budget-labels", "missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("id, code, libelle")
        .order("code");
      if (error) throw error;
      return (data || []).map(d => ({ ...d, est_active: true })) as BudgetLabelEntity[];
    },
    enabled: !entityType || entityType === "missions",
  });

  // Actions
  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["budget-labels", "actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select(`
          id, code, libelle, est_active, mission_id, os_id,
          mission:missions(code, libelle)
        `)
        .order("code");
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        parent_code: (d.mission as { code?: string } | null)?.code,
        parent_libelle: (d.mission as { libelle?: string } | null)?.libelle,
      })) as BudgetLabelEntity[];
    },
    enabled: !entityType || entityType === "actions",
  });

  // Activités
  const { data: activites = [], isLoading: loadingActivites } = useQuery({
    queryKey: ["budget-labels", "activites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activites")
        .select(`
          id, code, libelle, est_active, action_id,
          action:actions(code, libelle)
        `)
        .order("code");
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        parent_code: (d.action as { code?: string } | null)?.code,
        parent_libelle: (d.action as { libelle?: string } | null)?.libelle,
      })) as BudgetLabelEntity[];
    },
    enabled: !entityType || entityType === "activites",
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Historique des modifications (utilise la fonction SQL get_historique_libelle)
  // ──────────────────────────────────────────────────────────────────────────

  const fetchHistory = async (type: BudgetEntityType, entityId: string): Promise<BudgetLabelHistory[]> => {
    const { data, error } = await supabaseAny.rpc("get_historique_libelle", {
      p_table: type,
      p_id: entityId,
    });

    if (error) {
      console.warn("History fetch error:", error);
      // Fallback: lecture directe de la table historique_libelles
      const { data: fallbackData, error: fallbackError } = await supabaseAny
        .from("historique_libelles")
        .select(`
          id, ancien_libelle, nouveau_libelle, modifie_par, modifie_at, motif,
          profile:profiles(full_name)
        `)
        .eq("table_source", type)
        .eq("entity_id", entityId)
        .order("modifie_at", { ascending: false });

      if (fallbackError) {
        console.error("Fallback history fetch error:", fallbackError);
        return [];
      }

      return (fallbackData || []).map((h: Record<string, unknown>) => ({
        id: h.id as string,
        ancien_libelle: h.ancien_libelle as string | null,
        nouveau_libelle: h.nouveau_libelle as string | null,
        modifie_par: h.modifie_par as string | null,
        modifie_par_nom: (h.profile as { full_name?: string } | null)?.full_name || null,
        modifie_at: h.modifie_at as string,
        motif: h.motif as string | null,
      })) as BudgetLabelHistory[];
    }

    return (data || []) as BudgetLabelHistory[];
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Mutation pour mettre à jour un libellé (utilise la fonction SQL update_libelle_budget)
  // ──────────────────────────────────────────────────────────────────────────

  const updateLabelMutation = useMutation({
    mutationFn: async ({ entityType: type, entityId, newLibelle, motif }: BudgetLabelUpdateParams) => {
      // Récupérer l'ancienne valeur pour l'audit trail (utilise supabaseAny car libelle_modifie n'est pas dans tous les types)
      const { data: current, error: fetchError } = await supabaseAny
        .from(type)
        .select("libelle, libelle_modifie")
        .eq("id", entityId)
        .single();

      if (fetchError) throw fetchError;
      const oldLibelle = (current as { libelle_modifie?: string; libelle?: string })?.libelle_modifie ||
                         (current as { libelle?: string })?.libelle || "";

      // Utiliser la fonction SQL pour la mise à jour avec historique
      const { data, error } = await supabaseAny.rpc("update_libelle_budget", {
        p_table: type,
        p_id: entityId,
        p_nouveau_libelle: newLibelle,
        p_motif: motif,
      });

      if (error) {
        // Fallback: mise à jour directe via supabaseAny
        console.warn("RPC error, using fallback:", error);

        const { error: updateError } = await supabaseAny
          .from(type)
          .update({ libelle: newLibelle })
          .eq("id", entityId);

        if (updateError) throw updateError;

        // Enregistrer dans l'historique manuellement
        await supabaseAny
          .from("historique_libelles")
          .insert({
            table_source: type,
            entity_id: entityId,
            ancien_libelle: oldLibelle,
            nouveau_libelle: newLibelle,
            motif: motif,
          });
      }

      // Audit trail
      await logAction({
        entityType: type,
        entityId,
        action: "update",
        oldValues: { libelle: oldLibelle },
        newValues: { libelle: newLibelle },
        justification: motif,
      });

      return { oldLibelle, newLibelle, rpcResult: data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budget-labels", variables.entityType] });
      queryClient.invalidateQueries({ queryKey: ["ref-objectifs-strategiques"] });
      queryClient.invalidateQueries({ queryKey: ["ref-missions"] });
      queryClient.invalidateQueries({ queryKey: ["ref-actions"] });
      queryClient.invalidateQueries({ queryKey: ["ref-activites"] });
      toast.success("Libellé modifié avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Mutation pour restaurer un libellé depuis l'historique
  // ──────────────────────────────────────────────────────────────────────────

  const restoreLabelMutation = useMutation({
    mutationFn: async ({ entityType: type, entityId, historyId, oldValue }: BudgetLabelRestoreParams) => {
      // Récupérer la valeur actuelle pour l'audit trail (sans libelle_modifie car pas dans tous les types)
      const { data: current, error: fetchError } = await supabaseAny
        .from(type)
        .select("libelle, libelle_modifie")
        .eq("id", entityId)
        .single();

      if (fetchError) throw fetchError;
      const currentLibelle = (current as { libelle_modifie?: string; libelle?: string })?.libelle_modifie ||
                             (current as { libelle?: string })?.libelle || "";

      // Option 1: Utiliser revert_libelle si on veut revenir au libellé original
      // Option 2: Utiliser update_libelle_budget avec l'ancienne valeur
      // On utilise update_libelle_budget pour restaurer une valeur spécifique

      const { data, error } = await supabaseAny.rpc("update_libelle_budget", {
        p_table: type,
        p_id: entityId,
        p_nouveau_libelle: oldValue,
        p_motif: `Restauration depuis l'historique (ID: ${historyId})`,
      });

      if (error) {
        // Fallback: mise à jour directe via supabaseAny
        console.warn("RPC error, using fallback:", error);

        const { error: updateError } = await supabaseAny
          .from(type)
          .update({ libelle: oldValue })
          .eq("id", entityId);

        if (updateError) throw updateError;

        // Enregistrer dans l'historique manuellement
        await supabaseAny
          .from("historique_libelles")
          .insert({
            table_source: type,
            entity_id: entityId,
            ancien_libelle: currentLibelle,
            nouveau_libelle: oldValue,
            motif: `Restauration depuis l'historique (ID: ${historyId})`,
          });
      }

      // Audit trail
      await logAction({
        entityType: type,
        entityId,
        action: "update",
        oldValues: { libelle: currentLibelle },
        newValues: { libelle: oldValue },
        justification: "Restauration depuis l'historique",
        metadata: { restored_from_history_id: historyId },
      });

      return { restoredValue: oldValue, rpcResult: data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budget-labels", variables.entityType] });
      queryClient.invalidateQueries({ queryKey: ["ref-objectifs-strategiques"] });
      queryClient.invalidateQueries({ queryKey: ["ref-missions"] });
      queryClient.invalidateQueries({ queryKey: ["ref-actions"] });
      queryClient.invalidateQueries({ queryKey: ["ref-activites"] });
      toast.success("Libellé restauré avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Utilitaires
  // ──────────────────────────────────────────────────────────────────────────

  const getEntityTypeName = (type: BudgetEntityType): string => {
    const names: Record<BudgetEntityType, string> = {
      objectifs_strategiques: "Objectif Stratégique",
      missions: "Mission",
      actions: "Action",
      activites: "Activité",
    };
    return names[type];
  };

  const getEntityTypeNamePlural = (type: BudgetEntityType): string => {
    const names: Record<BudgetEntityType, string> = {
      objectifs_strategiques: "Objectifs Stratégiques",
      missions: "Missions",
      actions: "Actions",
      activites: "Activités",
    };
    return names[type];
  };

  const isLoading = loadingOS || loadingMissions || loadingActions || loadingActivites;

  return {
    // Données
    objectifsStrategiques,
    missions,
    actions,
    activites,
    isLoading,

    // Actions
    updateLabel: updateLabelMutation.mutate,
    restoreLabel: restoreLabelMutation.mutate,
    fetchHistory,

    // États
    isUpdating: updateLabelMutation.isPending,
    isRestoring: restoreLabelMutation.isPending,

    // Utilitaires
    getEntityTypeName,
    getEntityTypeNamePlural,
  };
}

export default useBudgetLabelEditor;
