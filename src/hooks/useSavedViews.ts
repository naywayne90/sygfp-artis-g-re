// @ts-nocheck - Table not in generated types
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedViewFilters {
  search?: string;
  direction_id?: string;
  exercice?: number | null;
  statut?: string;
  etape?: string;
  type_dossier?: string;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number | null;
  montant_max?: number | null;
  beneficiaire_id?: string;
  created_by?: string;
  en_retard?: boolean;
  mes_dossiers?: boolean;
  os_id?: string;
  action_id?: string;
  activite_id?: string;
}

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: SavedViewFilters;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedViewInput {
  name: string;
  description?: string;
  filters: SavedViewFilters;
  is_default?: boolean;
  is_shared?: boolean;
}

export function useSavedViews() {
  const queryClient = useQueryClient();

  // Get current user's saved views
  const { data: savedViews = [], isLoading } = useQuery({
    queryKey: ["saved-views"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("saved_views")
        .select("*")
        .or(`user_id.eq.${userData.user.id},is_shared.eq.true`)
        .order("name", { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "42P01") return [];
        throw error;
      }

      return (data || []) as SavedView[];
    },
  });

  // Get user's saved views only
  const userViews = savedViews.filter(async (view) => {
    const { data: userData } = await supabase.auth.getUser();
    return view.user_id === userData.user?.id;
  });

  // Get shared views
  const sharedViews = savedViews.filter((view) => view.is_shared);

  // Create a new saved view
  const createView = useMutation({
    mutationFn: async (input: CreateSavedViewInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      // If setting as default, clear other defaults first
      if (input.is_default) {
        await supabase
          .from("saved_views")
          .update({ is_default: false })
          .eq("user_id", userData.user.id);
      }

      const { data, error } = await supabase
        .from("saved_views")
        .insert({
          user_id: userData.user.id,
          name: input.name,
          description: input.description || null,
          filters: input.filters as any,
          is_default: input.is_default || false,
          is_shared: input.is_shared || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
      toast.success("Vue sauvegardée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    },
  });

  // Update a saved view
  const updateView = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreateSavedViewInput> & { id: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      // If setting as default, clear other defaults first
      if (updates.is_default) {
        await supabase
          .from("saved_views")
          .update({ is_default: false })
          .eq("user_id", userData.user.id)
          .neq("id", id);
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.filters !== undefined) updateData.filters = updates.filters;
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;
      if (updates.is_shared !== undefined) updateData.is_shared = updates.is_shared;

      const { data, error } = await supabase
        .from("saved_views")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
      toast.success("Vue mise à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  // Delete a saved view
  const deleteView = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("saved_views")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
      toast.success("Vue supprimée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  // Set a view as default
  const setDefaultView = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      // Clear all defaults
      await supabase
        .from("saved_views")
        .update({ is_default: false })
        .eq("user_id", userData.user.id);

      // Set new default
      const { error } = await supabase
        .from("saved_views")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
      toast.success("Vue par défaut définie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la définition");
    },
  });

  // Get default view
  const defaultView = savedViews.find((view) => view.is_default);

  // Predefined quick views (no database storage needed)
  const predefinedViews: Array<{ name: string; icon: string; filters: SavedViewFilters }> = [
    {
      name: "Mes dossiers à traiter",
      icon: "user",
      filters: { mes_dossiers: true, statut: "en_cours" },
    },
    {
      name: "Dossiers en retard",
      icon: "alert",
      filters: { en_retard: true },
    },
    {
      name: "En attente de validation",
      icon: "clock",
      filters: { etape: "en_validation" },
    },
    {
      name: "Dossiers soldés",
      icon: "check",
      filters: { statut: "solde" },
    },
  ];

  return {
    savedViews,
    userViews,
    sharedViews,
    isLoading,
    defaultView,
    predefinedViews,
    createView,
    updateView,
    deleteView,
    setDefaultView,
  };
}
