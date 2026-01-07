import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface RaciEntry {
  id: string;
  processus: string;
  processus_code: string;
  description: string | null;
  role_responsible: string | null;
  role_accountable: string | null;
  roles_consulted: string[];
  roles_informed: string[];
  module_key: string | null;
  actif: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export function useRaciMatrix() {
  const queryClient = useQueryClient();

  const { data: raciEntries, isLoading, error } = useQuery({
    queryKey: ["raci-matrix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raci_matrix")
        .select("*")
        .order("ordre");
      
      if (error) throw error;
      return (data || []).map(entry => ({
        ...entry,
        roles_consulted: Array.isArray(entry.roles_consulted) ? entry.roles_consulted as string[] : [],
        roles_informed: Array.isArray(entry.roles_informed) ? entry.roles_informed as string[] : [],
      })) as RaciEntry[];
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entry: Omit<RaciEntry, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("raci_matrix")
        .insert({
          processus: entry.processus,
          processus_code: entry.processus_code,
          description: entry.description,
          role_responsible: entry.role_responsible,
          role_accountable: entry.role_accountable,
          roles_consulted: entry.roles_consulted as unknown as Json,
          roles_informed: entry.roles_informed as unknown as Json,
          module_key: entry.module_key,
          actif: entry.actif,
          ordre: entry.ordre,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raci-matrix"] });
      toast.success("Entrée RACI créée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (entry: Partial<RaciEntry> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (entry.processus !== undefined) updateData.processus = entry.processus;
      if (entry.processus_code !== undefined) updateData.processus_code = entry.processus_code;
      if (entry.description !== undefined) updateData.description = entry.description;
      if (entry.role_responsible !== undefined) updateData.role_responsible = entry.role_responsible;
      if (entry.role_accountable !== undefined) updateData.role_accountable = entry.role_accountable;
      if (entry.roles_consulted !== undefined) updateData.roles_consulted = entry.roles_consulted as unknown as Json;
      if (entry.roles_informed !== undefined) updateData.roles_informed = entry.roles_informed as unknown as Json;
      if (entry.module_key !== undefined) updateData.module_key = entry.module_key;
      if (entry.actif !== undefined) updateData.actif = entry.actif;
      if (entry.ordre !== undefined) updateData.ordre = entry.ordre;

      const { error } = await supabase
        .from("raci_matrix")
        .update(updateData)
        .eq("id", entry.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raci-matrix"] });
      toast.success("Entrée RACI mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("raci_matrix")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raci-matrix"] });
      toast.success("Entrée RACI supprimée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Fonction pour obtenir les destinataires suggérés
  const getRaciSuggestions = async (processusCode: string) => {
    const { data, error } = await supabase.rpc("get_raci_informed_roles", {
      p_processus_code: processusCode,
    });
    
    if (error) {
      console.error("Erreur RACI:", error);
      return null;
    }
    return data;
  };

  return {
    raciEntries,
    isLoading,
    error,
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    getRaciSuggestions,
    isCreating: createEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
  };
}
