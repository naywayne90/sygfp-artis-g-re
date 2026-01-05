import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export type TacheStatut = 'planifie' | 'en_cours' | 'termine' | 'en_retard' | 'suspendu' | 'annule';
export type TachePriorite = 'basse' | 'normale' | 'haute' | 'critique';

export interface Tache {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  sous_activite_id: string;
  date_debut?: string;
  date_fin?: string;
  date_fin_reelle?: string;
  duree_prevue?: number;
  responsable_id?: string;
  raci_responsable?: string;
  raci_accountable?: string;
  raci_consulted?: string[];
  raci_informed?: string[];
  avancement: number;
  budget_line_id?: string;
  budget_prevu: number;
  livrables?: string[];
  statut: TacheStatut;
  priorite: TachePriorite;
  exercice: number;
  est_active: boolean;
  created_at: string;
  updated_at: string;
  sous_activite?: {
    id: string;
    code: string;
    libelle: string;
    activite?: {
      id: string;
      code: string;
      libelle: string;
      action?: {
        id: string;
        code: string;
        libelle: string;
        mission?: { id: string; code: string; libelle: string };
        os?: { id: string; code: string; libelle: string };
      };
    };
  };
  responsable?: { id: string; full_name: string; email: string };
  budget_line?: { id: string; code: string; label: string; direction_id?: string };
}

export interface TacheFormData {
  code: string;
  libelle: string;
  description?: string;
  sous_activite_id: string;
  date_debut?: string;
  date_fin?: string;
  duree_prevue?: number;
  responsable_id?: string;
  raci_responsable?: string;
  raci_accountable?: string;
  raci_consulted?: string[];
  raci_informed?: string[];
  avancement?: number;
  budget_line_id?: string;
  budget_prevu?: number;
  livrables?: string[];
  statut?: TacheStatut;
  priorite?: TachePriorite;
}

export interface TacheProgressUpdate {
  tache_id: string;
  previous_avancement: number;
  new_avancement: number;
  comment?: string;
}

export function useTaches() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const { data: taches, isLoading, error } = useQuery({
    queryKey: ["taches-planification", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taches")
        .select(`
          *,
          sous_activite:sous_activites(
            id, code, libelle,
            activite:activites(
              id, code, libelle,
              action:actions(
                id, code, libelle,
                mission:missions(id, code, libelle),
                os:objectifs_strategiques(id, code, libelle)
              )
            )
          ),
          responsable:profiles!taches_responsable_id_fkey(id, full_name, email),
          budget_line:budget_lines(id, code, label, direction_id)
        `)
        .eq("exercice", exercice)
        .order("code");
      
      if (error) throw error;
      return data as unknown as Tache[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TacheFormData) => {
      const { error } = await supabase.from("taches").insert({
        ...data,
        exercice,
        avancement: data.avancement || 0,
        budget_prevu: data.budget_prevu || 0,
        statut: data.statut || 'planifie',
        priorite: data.priorite || 'normale',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches-planification"] });
      toast.success("Tâche créée avec succès");
    },
    onError: (error: Error) => toast.error("Erreur: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TacheFormData> }) => {
      const { error } = await supabase
        .from("taches")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches-planification"] });
      toast.success("Tâche mise à jour");
    },
    onError: (error: Error) => toast.error("Erreur: " + error.message),
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (update: TacheProgressUpdate) => {
      // Insert history
      const { error: historyError } = await supabase
        .from("tache_progress_history")
        .insert({
          tache_id: update.tache_id,
          previous_avancement: update.previous_avancement,
          new_avancement: update.new_avancement,
          comment: update.comment,
        });
      if (historyError) throw historyError;

      // Determine new status
      let newStatut: TacheStatut = 'en_cours';
      if (update.new_avancement === 100) newStatut = 'termine';
      else if (update.new_avancement === 0) newStatut = 'planifie';

      // Update tache
      const updateData: Record<string, unknown> = {
        avancement: update.new_avancement,
        statut: newStatut,
        updated_at: new Date().toISOString(),
      };
      if (update.new_avancement === 100) {
        updateData.date_fin_reelle = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("taches")
        .update(updateData)
        .eq("id", update.tache_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches-planification"] });
      toast.success("Avancement mis à jour");
    },
    onError: (error: Error) => toast.error("Erreur: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("taches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches-planification"] });
      toast.success("Tâche supprimée");
    },
    onError: (error: Error) => toast.error("Erreur: " + error.message),
  });

  // Calculate stats
  const stats = {
    total: taches?.length || 0,
    planifie: taches?.filter(t => t.statut === 'planifie').length || 0,
    en_cours: taches?.filter(t => t.statut === 'en_cours').length || 0,
    termine: taches?.filter(t => t.statut === 'termine').length || 0,
    en_retard: taches?.filter(t => {
      if (!t.date_fin || t.statut === 'termine') return false;
      return new Date(t.date_fin) < new Date() && t.avancement < 100;
    }).length || 0,
    avancementGlobal: taches?.length 
      ? Math.round(taches.reduce((acc, t) => acc + t.avancement, 0) / taches.length) 
      : 0,
  };

  return {
    taches,
    isLoading,
    error,
    stats,
    createTache: createMutation.mutate,
    updateTache: updateMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    deleteTache: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

// Hook for fetching reference data
export function useTacheReferences() {
  const { data: sousActivites } = useQuery({
    queryKey: ["sous-activites-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sous_activites")
        .select(`
          id, code, libelle,
          activite:activites(
            id, code, libelle,
            action:actions(id, code, libelle)
          )
        `)
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, direction_id")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: budgetLines } = useQuery({
    queryKey: ["budget-lines-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_lines")
        .select("id, code, label, direction_id")
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: objectifsStrategiques } = useQuery({
    queryKey: ["os-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label, sigle")
        .eq("est_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  return { sousActivites, profiles, budgetLines, objectifsStrategiques, directions };
}
