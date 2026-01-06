import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkflowEtape {
  id: string;
  code: string;
  libelle: string;
  ordre: number;
  description: string | null;
  is_active: boolean;
}

/**
 * Hook pour récupérer les étapes du workflow de la chaîne de la dépense
 */
export function useWorkflowEtapes() {
  return useQuery({
    queryKey: ["workflow-etapes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_etapes")
        .select("*")
        .eq("is_active", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data as WorkflowEtape[];
    },
    staleTime: 1000 * 60 * 60, // 1 heure - données rarement modifiées
  });
}
