import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export const ORIGINES_RECETTES = [
  "Subvention État",
  "Subvention partenaires",
  "Ventes de services",
  "Droits et taxes",
  "Redevances",
  "Intérêts",
  "Dons et legs",
  "Autres recettes",
];

export const CATEGORIES_RECETTES = [
  "Recettes courantes",
  "Recettes exceptionnelles",
  "Recettes d'investissement",
];

export interface Recette {
  id: string;
  numero: string;
  date_recette: string;
  origine: string;
  categorie: string | null;
  description: string | null;
  montant: number;
  compte_id: string | null;
  reference_justificatif: string | null;
  statut: string;
  date_encaissement: string | null;
  exercice: number;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  compte?: { code: string; libelle: string } | null;
}

export function useRecettes() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const recettes = useQuery({
    queryKey: ["recettes", exercice],
    queryFn: async () => {
      if (!exercice) return [];
      const { data, error } = await supabase
        .from("recettes" as any)
        .select("*")
        .eq("exercice", exercice)
        .order("date_recette", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Recette[];
    },
    enabled: !!exercice,
  });

  const createRecette = useMutation({
    mutationFn: async (recette: Partial<Recette>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("recettes" as any)
        .insert([{ ...recette, exercice, created_by: user?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recettes"] });
      toast.success("Recette enregistrée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateRecette = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recette> & { id: string }) => {
      const { data, error } = await supabase
        .from("recettes" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recettes"] });
      toast.success("Recette modifiée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const validerRecette = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("recettes" as any)
        .update({ 
          statut: "validee", 
          validated_by: user?.id, 
          validated_at: new Date().toISOString() 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recettes"] });
      toast.success("Recette validée");
    },
  });

  const encaisserRecette = useMutation({
    mutationFn: async ({ id, compte_id }: { id: string; compte_id: string }) => {
      // Récupérer la recette
      const { data: recette, error: fetchErr } = await supabase
        .from("recettes" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;
      const recetteData = recette as unknown as Recette;

      // Mettre à jour la recette
      const { error: updateErr } = await supabase
        .from("recettes" as any)
        .update({ 
          statut: "encaissee", 
          date_encaissement: new Date().toISOString().split("T")[0],
          compte_id
        })
        .eq("id", id);
      if (updateErr) throw updateErr;

      // Créer une opération de trésorerie
      const { data: { user } } = await supabase.auth.getUser();
      const { error: opErr } = await supabase
        .from("operations_tresorerie" as any)
        .insert([{
          compte_id,
          type_operation: "entree",
          date_operation: new Date().toISOString().split("T")[0],
          montant: recetteData.montant,
          libelle: `Encaissement recette ${recetteData.numero} - ${recetteData.origine}`,
          recette_id: id,
          exercice: recetteData.exercice,
          created_by: user?.id,
        }]);
      if (opErr) throw opErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recettes"] });
      queryClient.invalidateQueries({ queryKey: ["operations-tresorerie"] });
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      toast.success("Recette encaissée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Stats
  const stats = useQuery({
    queryKey: ["recettes-stats", exercice],
    queryFn: async () => {
      const data = recettes.data || [];
      const totalRecettes = data.reduce((sum, r) => sum + (r.montant || 0), 0);
      const encaissees = data.filter(r => r.statut === "encaissee");
      const totalEncaisse = encaissees.reduce((sum, r) => sum + (r.montant || 0), 0);
      const tauxRecouvrement = totalRecettes > 0 ? (totalEncaisse / totalRecettes) * 100 : 0;

      return {
        totalRecettes,
        totalEncaisse,
        tauxRecouvrement,
        nbRecettes: data.length,
        nbEncaissees: encaissees.length,
      };
    },
    enabled: !!recettes.data,
  });

  return {
    recettes,
    stats,
    createRecette,
    updateRecette,
    validerRecette,
    encaisserRecette,
  };
}
