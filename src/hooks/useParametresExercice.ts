import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface ParametreExercice {
  id: string;
  exercice: number;
  code_parametre: string;
  libelle: string;
  valeur_numerique: number | null;
  valeur_texte: string | null;
  type_parametre: "numeric" | "text" | "boolean";
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export function useParametresExercice() {
  const queryClient = useQueryClient();
  const { exercice, isReadOnly } = useExercice();

  // Fetch parameters for current exercise
  const { data: parametres = [], isLoading } = useQuery({
    queryKey: ["parametres-exercice", exercice],
    queryFn: async (): Promise<ParametreExercice[]> => {
      try {
        const { data, error } = await supabase
          .from('ref_parametres_exercice' as any)
          .select('*')
          .eq('exercice', exercice)
          .eq('actif', true)
          .order('code_parametre');
        
        if (error) {
          console.warn("Error fetching parametres:", error);
          return [];
        }
        return (data || []) as unknown as ParametreExercice[];
      } catch (e) {
        console.warn("Table ref_parametres_exercice not available:", e);
        return [];
      }
    },
    enabled: !!exercice,
  });

  // Get a specific parameter by code
  const getParametre = (code: string): ParametreExercice | undefined => {
    return parametres.find(p => p.code_parametre === code);
  };

  // Get numeric value with default
  const getValeurNumerique = (code: string, defaut: number = 0): number => {
    const param = getParametre(code);
    return param?.valeur_numerique ?? defaut;
  };

  // Get text value with default
  const getValeurTexte = (code: string, defaut: string = ""): string => {
    const param = getParametre(code);
    return param?.valeur_texte ?? defaut;
  };

  // Update parameter mutation
  const updateParametre = useMutation({
    mutationFn: async ({ 
      id, 
      valeur_numerique, 
      valeur_texte 
    }: { 
      id: string; 
      valeur_numerique?: number | null; 
      valeur_texte?: string | null;
    }) => {
      if (isReadOnly) {
        throw new Error("Impossible de modifier les paramètres d'un exercice clôturé");
      }

      const { data, error } = await supabase
        .from('ref_parametres_exercice' as any)
        .update({
          valeur_numerique,
          valeur_texte,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres-exercice", exercice] });
      toast.success("Paramètre mis à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Copy parameters from previous exercise
  const copyFromPreviousExercice = useMutation({
    mutationFn: async () => {
      if (!exercice) throw new Error("Aucun exercice sélectionné");
      const previousExercice = exercice - 1;

      const { data: previousParams, error: fetchError } = await supabase
        .from('ref_parametres_exercice' as any)
        .select("*")
        .eq("exercice", previousExercice)
        .eq("actif", true);

      if (fetchError) throw fetchError;
      if (!previousParams || previousParams.length === 0) {
        throw new Error(`Aucun paramètre trouvé pour l'exercice ${previousExercice}`);
      }

      const newParams = (previousParams as unknown as ParametreExercice[]).map(p => ({
        exercice: exercice,
        code_parametre: p.code_parametre,
        libelle: p.libelle,
        valeur_numerique: p.valeur_numerique,
        valeur_texte: p.valeur_texte,
        type_parametre: p.type_parametre,
        description: p.description,
        actif: true,
      }));

      const { error: insertError } = await supabase
        .from('ref_parametres_exercice' as any)
        .insert(newParams);

      if (insertError) throw insertError;
      return { count: newParams.length };
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ["parametres-exercice", exercice] });
      toast.success(`${count} paramètre(s) copié(s)`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Common parameters helpers
  const plafondValidationAuto = getValeurNumerique("plafond_validation_auto", 5000000);
  const seuilAlerteBudget = getValeurNumerique("seuil_alerte_budget", 80);
  const delaiPaiementMax = getValeurNumerique("delai_paiement_max", 90);
  const tauxTVADefaut = getValeurNumerique("taux_tva_defaut", 18);

  return {
    parametres,
    isLoading,
    isReadOnly,
    getParametre,
    getValeurNumerique,
    getValeurTexte,
    plafondValidationAuto,
    seuilAlerteBudget,
    delaiPaiementMax,
    tauxTVADefaut,
    updateParametre,
    copyFromPreviousExercice,
  };
}
