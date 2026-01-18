/**
 * Hook pour gérer les lignes estimatives des Notes AEF
 *
 * Chaque Note AEF peut avoir plusieurs lignes avec:
 * - Catégorie (fournitures, équipement, services, etc.)
 * - Description
 * - Quantité, Prix unitaire, Montant total
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CATEGORIES_LIGNE = [
  { value: "fournitures", label: "Fournitures" },
  { value: "equipement", label: "Équipement" },
  { value: "services", label: "Services" },
  { value: "travaux", label: "Travaux" },
  { value: "honoraires", label: "Honoraires" },
  { value: "transport", label: "Transport" },
  { value: "hebergement", label: "Hébergement" },
  { value: "restauration", label: "Restauration" },
  { value: "communication", label: "Communication" },
  { value: "formation", label: "Formation" },
  { value: "autre", label: "Autre" },
] as const;

export type CategorieTypeLigne = typeof CATEGORIES_LIGNE[number]["value"];

export interface LigneEstimativeAEF {
  id: string;
  note_aef_id: string;
  categorie: CategorieTypeLigne;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLigneInput {
  note_aef_id: string;
  categorie: CategorieTypeLigne;
  description: string;
  quantite?: number;
  prix_unitaire?: number;
  ordre?: number;
}

export interface UpdateLigneInput {
  id: string;
  categorie?: CategorieTypeLigne;
  description?: string;
  quantite?: number;
  prix_unitaire?: number;
  ordre?: number;
}

export function useLignesEstimativesAEF(noteAefId: string | undefined) {
  const queryClient = useQueryClient();

  // Récupérer les lignes d'une note AEF
  const { data: lignes, isLoading, error } = useQuery({
    queryKey: ["lignes-estimatives-aef", noteAefId],
    queryFn: async () => {
      if (!noteAefId) return [];

      const { data, error } = await supabase
        .from("lignes_estimatives_aef")
        .select("*")
        .eq("note_aef_id", noteAefId)
        .order("ordre", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as LigneEstimativeAEF[];
    },
    enabled: !!noteAefId,
  });

  // Calculer le total
  const total = lignes?.reduce((sum, ligne) => sum + (ligne.montant || 0), 0) || 0;

  // Créer une ligne
  const createMutation = useMutation({
    mutationFn: async (input: CreateLigneInput) => {
      const { data, error } = await supabase
        .from("lignes_estimatives_aef")
        .insert({
          note_aef_id: input.note_aef_id,
          categorie: input.categorie,
          description: input.description,
          quantite: input.quantite || 1,
          prix_unitaire: input.prix_unitaire || 0,
          ordre: input.ordre || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lignes-estimatives-aef", noteAefId] });
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast.success("Ligne ajoutée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Mettre à jour une ligne
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateLigneInput) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from("lignes_estimatives_aef")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lignes-estimatives-aef", noteAefId] });
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Supprimer une ligne
  const deleteMutation = useMutation({
    mutationFn: async (ligneId: string) => {
      const { error } = await supabase
        .from("lignes_estimatives_aef")
        .delete()
        .eq("id", ligneId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lignes-estimatives-aef", noteAefId] });
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast.success("Ligne supprimée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Réordonner les lignes
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        ordre: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("lignes_estimatives_aef")
          .update({ ordre: update.ordre })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lignes-estimatives-aef", noteAefId] });
    },
    onError: (error: Error) => {
      toast.error("Erreur de réorganisation: " + error.message);
    },
  });

  // Dupliquer une ligne
  const duplicateMutation = useMutation({
    mutationFn: async (ligneId: string) => {
      const ligne = lignes?.find((l) => l.id === ligneId);
      if (!ligne) throw new Error("Ligne non trouvée");

      const { data, error } = await supabase
        .from("lignes_estimatives_aef")
        .insert({
          note_aef_id: ligne.note_aef_id,
          categorie: ligne.categorie,
          description: ligne.description + " (copie)",
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          ordre: (ligne.ordre || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lignes-estimatives-aef", noteAefId] });
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast.success("Ligne dupliquée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    lignes: lignes || [],
    total,
    isLoading,
    error,
    createLigne: createMutation.mutate,
    updateLigne: updateMutation.mutate,
    deleteLigne: deleteMutation.mutate,
    reorderLignes: reorderMutation.mutate,
    duplicateLigne: duplicateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook pour créer plusieurs lignes en une fois (utile pour pré-remplissage)
 */
export function useBulkCreateLignes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: CreateLigneInput[]) => {
      const { data, error } = await supabase
        .from("lignes_estimatives_aef")
        .insert(
          inputs.map((input, index) => ({
            note_aef_id: input.note_aef_id,
            categorie: input.categorie,
            description: input.description,
            quantite: input.quantite || 1,
            prix_unitaire: input.prix_unitaire || 0,
            ordre: input.ordre ?? index,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["lignes-estimatives-aef", variables[0].note_aef_id]
        });
        queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      }
      toast.success(`${variables.length} ligne(s) ajoutée(s)`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
}
