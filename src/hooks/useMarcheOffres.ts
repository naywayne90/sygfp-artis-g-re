import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarcheOffre {
  id: string;
  marche_id: string;
  prestataire_id: string | null;
  nom_fournisseur: string | null;
  montant_offre: number;
  delai_execution: number | null;
  note_technique: number | null;
  note_financiere: number | null;
  note_globale: number | null;
  observations: string | null;
  est_retenu: boolean;
  motif_selection: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  prestataire?: {
    id: string;
    raison_sociale: string;
    code: string;
  } | null;
}

export interface CreateOffreData {
  marche_id: string;
  prestataire_id?: string | null;
  nom_fournisseur?: string | null;
  montant_offre: number;
  delai_execution?: number;
  note_technique?: number;
  note_financiere?: number;
  observations?: string;
}

export function useMarcheOffres(marcheId?: string) {
  const queryClient = useQueryClient();

  // Fetch offres for a marché
  const { data: offres = [], isLoading, refetch } = useQuery({
    queryKey: ["marche-offres", marcheId],
    queryFn: async () => {
      if (!marcheId) return [];
      
      const { data, error } = await supabase
        .from("marche_offres")
        .select(`
          *,
          prestataire:prestataires(id, raison_sociale, code)
        `)
        .eq("marche_id", marcheId)
        .order("note_globale", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as MarcheOffre[];
    },
    enabled: !!marcheId,
  });

  // Add new offre
  const createOffreMutation = useMutation({
    mutationFn: async (data: CreateOffreData) => {
      // Calculate note_globale (60% technique, 40% financière)
      const note_globale = data.note_technique && data.note_financiere
        ? (data.note_technique * 0.6) + (data.note_financiere * 0.4)
        : null;

      const { data: offre, error } = await supabase
        .from("marche_offres")
        .insert({
          ...data,
          note_globale,
        })
        .select()
        .single();

      if (error) throw error;
      return offre;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-offres", marcheId] });
      toast.success("Offre ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update offre
  const updateOffreMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<MarcheOffre>) => {
      // Recalculate note_globale if notes change
      let note_globale = data.note_globale;
      if (data.note_technique !== undefined && data.note_financiere !== undefined) {
        note_globale = (data.note_technique * 0.6) + (data.note_financiere * 0.4);
      }

      const { error } = await supabase
        .from("marche_offres")
        .update({ ...data, note_globale })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-offres", marcheId] });
      toast.success("Offre mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Select winner (attribute marché)
  const selectWinnerMutation = useMutation({
    mutationFn: async ({ offreId, motif }: { offreId: string; motif: string }) => {
      // Reset all offres
      await supabase
        .from("marche_offres")
        .update({ est_retenu: false, motif_selection: null })
        .eq("marche_id", marcheId!);

      // Set winner
      const { data: offre, error: offreError } = await supabase
        .from("marche_offres")
        .update({ est_retenu: true, motif_selection: motif })
        .eq("id", offreId)
        .select("prestataire_id")
        .single();

      if (offreError) throw offreError;

      // Update marché status to attributed
      const { error: marcheError } = await supabase
        .from("marches")
        .update({
          statut: "attribue",
          prestataire_id: offre.prestataire_id,
          date_attribution: new Date().toISOString().split("T")[0],
        })
        .eq("id", marcheId!);

      if (marcheError) throw marcheError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-offres", marcheId] });
      queryClient.invalidateQueries({ queryKey: ["marches"] });
      toast.success("Fournisseur retenu - Marché attribué");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete offre
  const deleteOffreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marche_offres")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-offres", marcheId] });
      toast.success("Offre supprimée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const offreRetenue = offres.find(o => o.est_retenu);

  return {
    offres,
    offreRetenue,
    isLoading,
    refetch,
    createOffre: createOffreMutation.mutateAsync,
    updateOffre: updateOffreMutation.mutateAsync,
    selectWinner: selectWinnerMutation.mutateAsync,
    deleteOffre: deleteOffreMutation.mutateAsync,
    isCreating: createOffreMutation.isPending,
    isUpdating: updateOffreMutation.isPending,
    isSelecting: selectWinnerMutation.isPending,
  };
}
