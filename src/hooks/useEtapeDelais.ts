import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface EtapeDelai {
  module: string;
  exercice: number;
  delai_moyen_validation: number;
  delai_min: number | null;
  delai_max: number | null;
  count_valides: number;
}

export interface DelaiStats {
  engagement: EtapeDelai | null;
  liquidation: EtapeDelai | null;
  ordonnancement: EtapeDelai | null;
  global: {
    delaiMoyenTotal: number;
    modulesPlusRapide: string;
    modulePlusLent: string;
  };
}

const MODULE_LABELS: Record<string, string> = {
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
};

export function useEtapeDelais() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["etape-delais", exercice],
    queryFn: async (): Promise<DelaiStats> => {
      // Query each module separately since the view might not exist yet
      const [engagementResult, liquidationResult, ordonnancementResult] = await Promise.all([
        supabase
          .from("budget_engagements")
          .select("delai_validation_jours, statut")
          .eq("exercice", exercice)
          .not("delai_validation_jours", "is", null),
        supabase
          .from("budget_liquidations")
          .select("delai_validation_jours, statut")
          .eq("exercice", exercice)
          .not("delai_validation_jours", "is", null),
        supabase
          .from("ordonnancements")
          .select("delai_validation_jours, statut")
          .eq("exercice", exercice)
          .not("delai_validation_jours", "is", null),
      ]);

      const calculateStats = (data: any[] | null): EtapeDelai | null => {
        if (!data || data.length === 0) return null;
        const delais = data.map(d => d.delai_validation_jours).filter(d => d !== null);
        if (delais.length === 0) return null;
        
        return {
          module: "",
          exercice: exercice || 0,
          delai_moyen_validation: delais.reduce((a, b) => a + b, 0) / delais.length,
          delai_min: Math.min(...delais),
          delai_max: Math.max(...delais),
          count_valides: data.filter(d => d.statut === "valide" || d.statut === "signe").length,
        };
      };

      const engagement = calculateStats(engagementResult.data);
      const liquidation = calculateStats(liquidationResult.data);
      const ordonnancement = calculateStats(ordonnancementResult.data);

      // Calculate global stats
      const allDelais = [
        engagement?.delai_moyen_validation,
        liquidation?.delai_moyen_validation,
        ordonnancement?.delai_moyen_validation,
      ].filter((d): d is number => d !== null && d !== undefined);

      const modules = [
        { name: "engagement", delai: engagement?.delai_moyen_validation },
        { name: "liquidation", delai: liquidation?.delai_moyen_validation },
        { name: "ordonnancement", delai: ordonnancement?.delai_moyen_validation },
      ].filter(m => m.delai !== null && m.delai !== undefined);

      const plusRapide = modules.sort((a, b) => (a.delai || 0) - (b.delai || 0))[0];
      const plusLent = modules.sort((a, b) => (b.delai || 0) - (a.delai || 0))[0];

      return {
        engagement: engagement ? { ...engagement, module: "engagement" } : null,
        liquidation: liquidation ? { ...liquidation, module: "liquidation" } : null,
        ordonnancement: ordonnancement ? { ...ordonnancement, module: "ordonnancement" } : null,
        global: {
          delaiMoyenTotal: allDelais.length > 0 
            ? allDelais.reduce((a, b) => a + b, 0) / allDelais.length 
            : 0,
          modulesPlusRapide: plusRapide ? MODULE_LABELS[plusRapide.name] || plusRapide.name : "N/A",
          modulePlusLent: plusLent ? MODULE_LABELS[plusLent.name] || plusLent.name : "N/A",
        },
      };
    },
    enabled: !!exercice,
  });
}
