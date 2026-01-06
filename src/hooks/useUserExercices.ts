import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserExercice {
  id: string;
  user_id: string;
  exercice_id: string;
  can_read: boolean;
  can_write: boolean;
  granted_by: string | null;
  created_at: string;
  exercice?: {
    annee: number;
    code_exercice: string;
    libelle: string;
    statut: string;
    est_actif: boolean;
  };
}

/**
 * Hook pour récupérer les exercices autorisés pour l'utilisateur courant
 */
export function useUserExercices() {
  return useQuery({
    queryKey: ["user-exercices"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("user_exercices")
        .select(`
          *,
          exercice:exercices_budgetaires (
            annee,
            code_exercice,
            libelle,
            statut,
            est_actif
          )
        `)
        .eq("user_id", user.user.id)
        .eq("can_read", true);

      if (error) throw error;
      return data as UserExercice[];
    },
  });
}

/**
 * Hook pour vérifier si l'utilisateur peut écrire dans l'exercice courant
 */
export function useCanWriteExercice(annee: number | null) {
  return useQuery({
    queryKey: ["can-write-exercice", annee],
    queryFn: async () => {
      if (!annee) return false;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Vérifier si admin ou DG (toujours autorisé)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user.id);

      const userRoles = roles?.map(r => r.role) || [];
      if (userRoles.includes("ADMIN") || userRoles.includes("DG")) {
        return true;
      }

      // Vérifier les permissions spécifiques
      const { data, error } = await supabase
        .from("user_exercices")
        .select(`
          can_write,
          exercice:exercices_budgetaires!inner (annee)
        `)
        .eq("user_id", user.user.id)
        .eq("exercices_budgetaires.annee", annee)
        .single();

      if (error) return false;
      return data?.can_write ?? false;
    },
    enabled: !!annee,
  });
}
