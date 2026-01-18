/**
 * useRoadmapSubmissions - Hook pour la gestion des soumissions de feuilles de route
 *
 * Gère la liste, le détail, la validation et le rejet des soumissions
 * avec support pour les filtres et les notifications.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";

// Types
export type SubmissionStatus = 'brouillon' | 'soumis' | 'en_revision' | 'valide' | 'rejete';

export interface RoadmapSubmission {
  id: string;
  direction_id: string;
  exercice_id: string;
  import_batch_id: string | null;
  libelle: string;
  description: string | null;
  nb_activites: number;
  montant_total: number;
  status: SubmissionStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  validated_by: string | null;
  validated_at: string | null;
  validation_comment: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Relations
  direction?: {
    id: string;
    label: string;
    code: string;
  };
  exercice?: {
    id: string;
    annee: number;
    libelle: string;
  };
  submitted_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  validated_by_profile?: {
    id: string;
    full_name: string;
  };
  rejected_by_profile?: {
    id: string;
    full_name: string;
  };
}

export interface SubmissionActivity {
  id: string;
  submission_id: string;
  activite_id: string;
  snapshot_data: {
    code?: string;
    libelle?: string;
    montant_prevu?: number;
    created_at?: string;
    [key: string]: unknown;
  } | null;
  status: 'inclus' | 'modifie' | 'nouveau' | 'supprime';
  created_at: string;
  // Activité courante pour comparaison
  activite?: {
    id: string;
    code: string;
    libelle: string;
    montant_prevu: number;
    est_active: boolean;
    updated_at: string;
  };
}

export interface SubmissionHistoryEntry {
  id: string;
  submission_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  performed_by_profile?: {
    id: string;
    full_name: string;
  };
}

export interface SubmissionFilters {
  directionId?: string;
  status?: SubmissionStatus | 'all';
  search?: string;
}

export interface SubmissionStats {
  total: number;
  brouillon: number;
  soumis: number;
  en_revision: number;
  valide: number;
  rejete: number;
}

/**
 * Hook principal pour gérer les soumissions de feuilles de route
 */
export function useRoadmapSubmissions(filters?: SubmissionFilters) {
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();
  const { log } = useAuditLog();

  // Liste des soumissions avec filtres
  const submissionsQuery = useQuery({
    queryKey: ["roadmap-submissions", exerciceId, filters],
    queryFn: async () => {
      let query = supabase
        .from("roadmap_submissions")
        .select(`
          *,
          direction:directions(id, label, code),
          exercice:exercices_budgetaires(id, annee, libelle),
          submitted_by_profile:profiles!roadmap_submissions_submitted_by_fkey(id, full_name, email),
          validated_by_profile:profiles!roadmap_submissions_validated_by_fkey(id, full_name),
          rejected_by_profile:profiles!roadmap_submissions_rejected_by_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      // Filtre par exercice courant
      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      // Filtre par direction
      if (filters?.directionId) {
        query = query.eq("direction_id", filters.directionId);
      }

      // Filtre par statut
      if (filters?.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }

      // Recherche textuelle
      if (filters?.search) {
        query = query.ilike("libelle", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur chargement soumissions:", error);
        throw error;
      }

      return data as RoadmapSubmission[];
    },
    enabled: !!exerciceId,
  });

  // Statistiques par statut
  const statsQuery = useQuery({
    queryKey: ["roadmap-submissions-stats", exerciceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_submissions")
        .select("status")
        .eq("exercice_id", exerciceId!);

      if (error) throw error;

      const stats: SubmissionStats = {
        total: data.length,
        brouillon: data.filter((s) => s.status === "brouillon").length,
        soumis: data.filter((s) => s.status === "soumis").length,
        en_revision: data.filter((s) => s.status === "en_revision").length,
        valide: data.filter((s) => s.status === "valide").length,
        rejete: data.filter((s) => s.status === "rejete").length,
      };

      return stats;
    },
    enabled: !!exerciceId,
  });

  // Mutation pour soumettre une feuille de route
  const submitMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.rpc("submit_roadmap", {
        p_submission_id: submissionId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, submissionId) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions-stats"] });
      log({
        action: "roadmap_submitted",
        entity_type: "roadmap_submission",
        entity_id: submissionId,
      });
      toast.success("Feuille de route soumise pour validation");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour valider une feuille de route
  const validateMutation = useMutation({
    mutationFn: async ({
      submissionId,
      comment,
    }: {
      submissionId: string;
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc("validate_roadmap", {
        p_submission_id: submissionId,
        p_comment: comment || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions-stats"] });
      log({
        action: "roadmap_validated",
        entity_type: "roadmap_submission",
        entity_id: submissionId,
      });
      toast.success("Feuille de route validée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour rejeter une feuille de route
  const rejectMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reason,
    }: {
      submissionId: string;
      reason: string;
    }) => {
      if (!reason?.trim()) {
        throw new Error("Le motif de rejet est obligatoire");
      }

      const { data, error } = await supabase.rpc("reject_roadmap", {
        p_submission_id: submissionId,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions-stats"] });
      log({
        action: "roadmap_rejected",
        entity_type: "roadmap_submission",
        entity_id: submissionId,
      });
      toast.success("Feuille de route rejetée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour demander une révision
  const requestRevisionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      comment,
    }: {
      submissionId: string;
      comment: string;
    }) => {
      const { data, error } = await supabase.rpc("request_revision_roadmap", {
        p_submission_id: submissionId,
        p_comment: comment,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions-stats"] });
      log({
        action: "roadmap_revision_requested",
        entity_type: "roadmap_submission",
        entity_id: submissionId,
      });
      toast.success("Demande de révision envoyée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    // Données
    submissions: submissionsQuery.data ?? [],
    stats: statsQuery.data ?? {
      total: 0,
      brouillon: 0,
      soumis: 0,
      en_revision: 0,
      valide: 0,
      rejete: 0,
    },

    // États
    isLoading: submissionsQuery.isLoading,
    isError: submissionsQuery.isError,
    error: submissionsQuery.error,

    // Actions
    submit: submitMutation.mutate,
    validate: validateMutation.mutate,
    reject: rejectMutation.mutate,
    requestRevision: requestRevisionMutation.mutate,

    // États des mutations
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRequestingRevision: requestRevisionMutation.isPending,

    // Refetch
    refetch: submissionsQuery.refetch,
  };
}

/**
 * Hook pour récupérer le détail d'une soumission avec ses activités
 */
export function useRoadmapSubmissionDetail(submissionId: string | null) {
  // Détail de la soumission
  const submissionQuery = useQuery({
    queryKey: ["roadmap-submission", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_submissions")
        .select(`
          *,
          direction:directions(id, label, code),
          exercice:exercices_budgetaires(id, annee, libelle),
          submitted_by_profile:profiles!roadmap_submissions_submitted_by_fkey(id, full_name, email),
          validated_by_profile:profiles!roadmap_submissions_validated_by_fkey(id, full_name),
          rejected_by_profile:profiles!roadmap_submissions_rejected_by_fkey(id, full_name)
        `)
        .eq("id", submissionId!)
        .single();

      if (error) throw error;
      return data as RoadmapSubmission;
    },
    enabled: !!submissionId,
  });

  // Activités de la soumission avec snapshot pour diff
  const activitiesQuery = useQuery({
    queryKey: ["roadmap-submission-activities", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_submission_activities")
        .select(`
          *,
          activite:activites(id, code, libelle, montant_prevu, est_active, updated_at)
        `)
        .eq("submission_id", submissionId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SubmissionActivity[];
    },
    enabled: !!submissionId,
  });

  // Historique de la soumission
  const historyQuery = useQuery({
    queryKey: ["roadmap-submission-history", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_submission_history")
        .select(`
          *,
          performed_by_profile:profiles!roadmap_submission_history_performed_by_fkey(id, full_name)
        `)
        .eq("submission_id", submissionId!)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      return data as SubmissionHistoryEntry[];
    },
    enabled: !!submissionId,
  });

  return {
    submission: submissionQuery.data,
    activities: activitiesQuery.data ?? [],
    history: historyQuery.data ?? [],
    isLoading:
      submissionQuery.isLoading ||
      activitiesQuery.isLoading ||
      historyQuery.isLoading,
    isError:
      submissionQuery.isError ||
      activitiesQuery.isError ||
      historyQuery.isError,
    refetch: () => {
      submissionQuery.refetch();
      activitiesQuery.refetch();
      historyQuery.refetch();
    },
  };
}

/**
 * Hook pour créer une soumission à partir d'un import batch
 */
export function useCreateSubmissionFromImport() {
  const queryClient = useQueryClient();
  const { log } = useAuditLog();

  return useMutation({
    mutationFn: async ({
      importBatchId,
      directionId,
      exerciceId,
      libelle,
    }: {
      importBatchId: string;
      directionId: string;
      exerciceId: string;
      libelle?: string;
    }) => {
      const { data, error } = await supabase.rpc("create_submission_from_import", {
        p_import_batch_id: importBatchId,
        p_direction_id: directionId,
        p_exercice_id: exerciceId,
        p_libelle: libelle || null,
      });

      if (error) throw error;
      return data as string; // Returns submission ID
    },
    onSuccess: (submissionId) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-submissions"] });
      log({
        action: "roadmap_submission_created",
        entity_type: "roadmap_submission",
        entity_id: submissionId,
      });
      toast.success("Soumission créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

/**
 * Utilitaire pour calculer les différences entre snapshot et état actuel
 */
export function computeActivityDiff(activity: SubmissionActivity): {
  hasChanges: boolean;
  changes: { field: string; old: unknown; new: unknown }[];
} {
  const changes: { field: string; old: unknown; new: unknown }[] = [];

  if (!activity.snapshot_data || !activity.activite) {
    return { hasChanges: false, changes };
  }

  const snapshot = activity.snapshot_data;
  const current = activity.activite;

  // Comparer les champs clés
  if (snapshot.code !== current.code) {
    changes.push({ field: "code", old: snapshot.code, new: current.code });
  }
  if (snapshot.libelle !== current.libelle) {
    changes.push({ field: "libelle", old: snapshot.libelle, new: current.libelle });
  }
  if (snapshot.montant_prevu !== current.montant_prevu) {
    changes.push({
      field: "montant_prevu",
      old: snapshot.montant_prevu,
      new: current.montant_prevu,
    });
  }

  return {
    hasChanges: changes.length > 0,
    changes,
  };
}

/**
 * Hook pour obtenir les directions accessibles pour les soumissions
 */
export function useSubmissionDirections() {
  return useQuery({
    queryKey: ["submission-directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, label, code")
        .order("code");

      if (error) throw error;
      return data;
    },
  });
}
