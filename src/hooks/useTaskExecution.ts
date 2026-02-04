// @ts-nocheck - Tables and columns not in generated types
/**
 * useTaskExecution - Hook pour la gestion de l'exécution physique des activités
 *
 * Gère le suivi de l'avancement, les statuts, les preuves et les contributeurs.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";

// Types
export type TaskStatus = "non_demarre" | "en_cours" | "realise" | "bloque" | "annule";

export type ProofType = "document" | "photo" | "rapport" | "pv" | "attestation" | "autre";

export type TaskSource = "manuel" | "import" | "auto";

export interface TaskExecution {
  id: string;
  activite_id: string;
  exercice_id: string;
  status: TaskStatus;
  source: TaskSource;
  date_debut_prevue: string | null;
  date_fin_prevue: string | null;
  date_debut_reelle: string | null;
  date_fin_reelle: string | null;
  taux_avancement: number;
  responsable_id: string | null;
  responsable_nom: string | null;
  commentaire: string | null;
  motif_blocage: string | null;
  date_blocage: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Jointures depuis la vue
  activite_code?: string;
  activite_libelle?: string;
  activite_montant?: number;
  action_id?: string;
  action_code?: string;
  action_libelle?: string;
  mission_id?: string;
  mission_code?: string;
  mission_libelle?: string;
  direction_id?: string;
  direction_code?: string;
  direction_label?: string;
  os_id?: string;
  os_code?: string;
  os_libelle?: string;
  exercice_annee?: number;
  responsable_full_name?: string;
  responsable_display?: string;
  // Audit
  created_by_name?: string;
  updated_by_name?: string;
}

export interface TaskContributor {
  id: string;
  task_execution_id: string;
  user_id: string | null;
  nom: string;
  role: string | null;
  created_at: string;
}

export interface TaskProof {
  id: string;
  task_execution_id: string;
  type: ProofType;
  libelle: string;
  description: string | null;
  filename: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  date_piece: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface TaskHistory {
  id: string;
  task_execution_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  old_taux: number | null;
  new_taux: number | null;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  source: string | null;
  // Jointure
  performer_name?: string;
}

// Configuration des sources
export const TASK_SOURCE_CONFIG: Record<
  TaskSource,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  manuel: {
    label: "Saisie manuelle",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: "edit",
  },
  import: {
    label: "Import fichier",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: "upload",
  },
  auto: {
    label: "Automatique",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: "settings",
  },
};

// Configuration des types de preuves
export const PROOF_TYPE_CONFIG: Record<
  ProofType,
  { label: string; icon: string }
> = {
  document: { label: "Document", icon: "file-text" },
  photo: { label: "Photo", icon: "image" },
  rapport: { label: "Rapport", icon: "file-bar-chart" },
  pv: { label: "Procès-verbal", icon: "scroll" },
  attestation: { label: "Attestation", icon: "award" },
  autre: { label: "Autre", icon: "file" },
};

export interface TaskFilters {
  directionId?: string;
  missionId?: string;
  actionId?: string;
  osId?: string;
  status?: TaskStatus | "all";
  responsableId?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  non_demarre: number;
  en_cours: number;
  realise: number;
  bloque: number;
  annule: number;
  taux_moyen: number;
}

// Configuration des statuts
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  non_demarre: {
    label: "Non démarré",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  en_cours: {
    label: "En cours",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  realise: {
    label: "Réalisé",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  bloque: {
    label: "Bloqué",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  annule: {
    label: "Annulé",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
};

/**
 * Hook principal pour la liste des exécutions avec filtres
 */
export function useTaskExecutions(filters?: TaskFilters) {
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();
  const { log } = useAuditLog();

  // Liste des exécutions
  const executionsQuery = useQuery({
    queryKey: ["task-executions", exerciceId, filters],
    queryFn: async () => {
      // Utiliser la vue enrichie
      let query = supabase
        .from("v_task_executions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      if (filters?.directionId) {
        query = query.eq("direction_id", filters.directionId);
      }

      if (filters?.missionId) {
        query = query.eq("mission_id", filters.missionId);
      }

      if (filters?.actionId) {
        query = query.eq("action_id", filters.actionId);
      }

      if (filters?.osId) {
        query = query.eq("os_id", filters.osId);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.responsableId) {
        query = query.eq("responsable_id", filters.responsableId);
      }

      if (filters?.search) {
        query = query.or(
          `activite_code.ilike.%${filters.search}%,activite_libelle.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as TaskExecution[];
    },
    enabled: !!exerciceId,
  });

  // Statistiques
  const statsQuery = useQuery({
    queryKey: ["task-executions-stats", exerciceId, filters?.directionId],
    queryFn: async () => {
      let query = supabase
        .from("task_executions")
        .select("status, taux_avancement")
        .eq("exercice_id", exerciceId!);

      if (filters?.directionId) {
        // Filtrer par direction via jointure
        const { data: activiteIds } = await supabase
          .from("v_task_executions")
          .select("activite_id")
          .eq("exercice_id", exerciceId!)
          .eq("direction_id", filters.directionId);

        if (activiteIds && activiteIds.length > 0) {
          query = query.in(
            "activite_id",
            activiteIds.map((a) => a.activite_id)
          );
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats: TaskStats = {
        total: data.length,
        non_demarre: data.filter((t) => t.status === "non_demarre").length,
        en_cours: data.filter((t) => t.status === "en_cours").length,
        realise: data.filter((t) => t.status === "realise").length,
        bloque: data.filter((t) => t.status === "bloque").length,
        annule: data.filter((t) => t.status === "annule").length,
        taux_moyen:
          data.length > 0
            ? Math.round(
                data.reduce((sum, t) => sum + (t.taux_avancement || 0), 0) /
                  data.length
              )
            : 0,
      };

      return stats;
    },
    enabled: !!exerciceId,
  });

  // Mutation pour démarrer une tâche
  const startTaskMutation = useMutation({
    mutationFn: async (activiteId: string) => {
      const { data, error } = await supabase.rpc("start_task", {
        p_activite_id: activiteId,
        p_exercice_id: exerciceId!,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, activiteId) => {
      queryClient.invalidateQueries({ queryKey: ["task-executions"] });
      log({
        action: "task_started",
        entity_type: "task_execution",
        entity_id: activiteId,
      });
      toast.success("Tâche démarrée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour marquer comme réalisé
  const completeTaskMutation = useMutation({
    mutationFn: async ({
      activiteId,
      commentaire,
    }: {
      activiteId: string;
      commentaire?: string;
    }) => {
      const { data, error } = await supabase.rpc("mark_task_completed", {
        p_activite_id: activiteId,
        p_exercice_id: exerciceId!,
        p_commentaire: commentaire || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { activiteId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-executions"] });
      log({
        action: "task_completed",
        entity_type: "task_execution",
        entity_id: activiteId,
      });
      toast.success("Tâche marquée comme réalisée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour marquer comme bloqué
  const blockTaskMutation = useMutation({
    mutationFn: async ({
      activiteId,
      motif,
    }: {
      activiteId: string;
      motif: string;
    }) => {
      const { data, error } = await supabase.rpc("mark_task_blocked", {
        p_activite_id: activiteId,
        p_exercice_id: exerciceId!,
        p_motif: motif,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { activiteId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-executions"] });
      log({
        action: "task_blocked",
        entity_type: "task_execution",
        entity_id: activiteId,
      });
      toast.success("Tâche marquée comme bloquée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour mise à jour générale
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      activiteId,
      data,
    }: {
      activiteId: string;
      data: {
        status?: TaskStatus;
        taux_avancement?: number;
        date_debut_reelle?: string;
        date_fin_reelle?: string;
        commentaire?: string;
        responsable_nom?: string;
      };
    }) => {
      const { data: result, error } = await supabase.rpc(
        "upsert_task_execution",
        {
          p_activite_id: activiteId,
          p_exercice_id: exerciceId!,
          p_status: data.status || null,
          p_taux_avancement: data.taux_avancement ?? null,
          p_date_debut_reelle: data.date_debut_reelle || null,
          p_date_fin_reelle: data.date_fin_reelle || null,
          p_commentaire: data.commentaire || null,
          p_responsable_nom: data.responsable_nom || null,
        }
      );
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-executions"] });
      toast.success("Tâche mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    // Données
    executions: executionsQuery.data ?? [],
    stats: statsQuery.data ?? {
      total: 0,
      non_demarre: 0,
      en_cours: 0,
      realise: 0,
      bloque: 0,
      annule: 0,
      taux_moyen: 0,
    },

    // États
    isLoading: executionsQuery.isLoading,
    isError: executionsQuery.isError,

    // Actions rapides
    startTask: startTaskMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    blockTask: blockTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,

    // États mutations
    isStarting: startTaskMutation.isPending,
    isCompleting: completeTaskMutation.isPending,
    isBlocking: blockTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,

    // Refetch
    refetch: executionsQuery.refetch,
  };
}

/**
 * Hook pour le détail d'une exécution
 */
export function useTaskExecutionDetail(taskId: string | null) {
  // Détail
  const detailQuery = useQuery({
    queryKey: ["task-execution-detail", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_task_executions")
        .select("*")
        .eq("id", taskId!)
        .single();

      if (error) throw error;
      return data as TaskExecution;
    },
    enabled: !!taskId,
  });

  // Contributeurs
  const contributorsQuery = useQuery({
    queryKey: ["task-execution-contributors", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_execution_contributors")
        .select("*")
        .eq("task_execution_id", taskId!)
        .order("created_at");

      if (error) throw error;
      return data as TaskContributor[];
    },
    enabled: !!taskId,
  });

  // Preuves
  const proofsQuery = useQuery({
    queryKey: ["task-execution-proofs", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_execution_proofs")
        .select("*")
        .eq("task_execution_id", taskId!)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as TaskProof[];
    },
    enabled: !!taskId,
  });

  // Historique avec nom du performeur
  const historyQuery = useQuery({
    queryKey: ["task-execution-history", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_execution_history")
        .select("*, profiles:performed_by(full_name)")
        .eq("task_execution_id", taskId!)
        .order("performed_at", { ascending: false });

      if (error) throw error;

      // Mapper pour aplatir la jointure
      return (data || []).map(item => ({
        ...item,
        performer_name: (item.profiles as any)?.full_name || null,
        profiles: undefined
      })) as TaskHistory[];
    },
    enabled: !!taskId,
  });

  return {
    task: detailQuery.data,
    contributors: contributorsQuery.data ?? [],
    proofs: proofsQuery.data ?? [],
    history: historyQuery.data ?? [],
    isLoading:
      detailQuery.isLoading ||
      contributorsQuery.isLoading ||
      proofsQuery.isLoading,
    isError: detailQuery.isError,
    refetch: () => {
      detailQuery.refetch();
      contributorsQuery.refetch();
      proofsQuery.refetch();
      historyQuery.refetch();
    },
  };
}

/**
 * Hook pour les activités sans exécution (pour initialisation)
 */
export function useActivitesWithoutExecution(directionId?: string) {
  const { exerciceId } = useExercice();

  return useQuery({
    queryKey: ["activites-without-execution", exerciceId, directionId],
    queryFn: async () => {
      // Récupérer les activités qui n'ont pas encore d'exécution pour cet exercice
      let query = supabase
        .from("activites")
        .select(
          `
          id, code, libelle, montant_prevu,
          action:actions(
            id, code, libelle,
            mission:missions(
              id, code, libelle,
              direction:directions(id, code, label)
            )
          )
        `
        )
        .eq("est_active", true)
        .eq("exercice_id", exerciceId!);

      const { data: activites, error } = await query;
      if (error) throw error;

      // Récupérer les exécutions existantes
      const { data: executions } = await supabase
        .from("task_executions")
        .select("activite_id")
        .eq("exercice_id", exerciceId!);

      const executedIds = new Set(executions?.map((e) => e.activite_id) ?? []);

      // Filtrer les activités sans exécution
      let result = activites?.filter((a) => !executedIds.has(a.id)) ?? [];

      // Filtrer par direction si spécifié
      if (directionId) {
        result = result.filter(
          (a) => (a.action as any)?.mission?.direction?.id === directionId
        );
      }

      return result;
    },
    enabled: !!exerciceId,
  });
}

/**
 * Hook pour les filtres (directions, missions, etc.)
 */
export function useTaskFiltersData() {
  const directionsQuery = useQuery({
    queryKey: ["task-filters-directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label")
        .order("code");

      if (error) throw error;
      return data;
    },
  });

  const osQuery = useQuery({
    queryKey: ["task-filters-os"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .order("code");

      if (error) throw error;
      return data;
    },
  });

  return {
    directions: directionsQuery.data ?? [],
    objectifsStrategiques: osQuery.data ?? [],
    isLoading: directionsQuery.isLoading || osQuery.isLoading,
  };
}
