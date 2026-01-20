/**
 * Hook pour récupérer la liste des directions
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Direction {
  id: string;
  code: string;
  label: string;
  sigle: string | null;
  est_active?: boolean | null;
}

/**
 * Récupère toutes les directions actives
 */
export function useDirections() {
  return useQuery({
    queryKey: ["directions"],
    queryFn: async (): Promise<Direction[]> => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label, sigle, est_active")
        .eq("est_active", true)
        .order("sigle", { ascending: true });

      if (error) {
        console.error("Erreur récupération directions:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

export default useDirections;
