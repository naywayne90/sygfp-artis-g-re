/**
 * Hook générique pour les dashboards par direction
 * Utilise les vues et RPC créées dans la migration 20260205_dashboard_direction.sql
 *
 * Note: Les types Supabase seront mis à jour après exécution de la migration
 * et régénération des types avec `supabase gen types typescript`
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

// Types
export interface DirectionKPIs {
  direction_id: string;
  direction_code: string;
  direction_nom: string;
  exercice: number;
  notes_sef: {
    total: number;
    brouillon: number;
    soumis: number;
    valide: number;
    rejete: number;
  };
  engagements: {
    total: number;
    montant_total: number;
    en_cours: number;
    valide: number;
  };
  liquidations: {
    total: number;
    montant_total: number;
    en_cours: number;
    valide: number;
  };
  ordonnancements: {
    total: number;
    montant_total: number;
    en_cours: number;
    valide: number;
  };
  taux_execution: number;
  budget: {
    dotation_initiale: number;
    credits_disponibles: number;
  };
}

export interface DirectionAlerte {
  direction_id: string;
  direction_code: string;
  type_alerte: string;
  niveau: "info" | "warning" | "danger";
  nombre: number;
  message: string;
}

export interface EvolutionMensuelle {
  mois: number;
  mois_nom: string;
  engagements: number;
  liquidations: number;
  ordonnancements: number;
}

export interface DossierRecent {
  id: string;
  numero_dossier: string;
  objet: string;
  statut: string;
  montant_estime: number;
  created_at: string;
  numero_engagement: string | null;
  statut_engagement: string | null;
  etape_actuelle: string;
}

interface UseDirectionDashboardResult {
  kpis: DirectionKPIs | null;
  alertes: DirectionAlerte[];
  evolution: EvolutionMensuelle[];
  dossiersRecents: DossierRecent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook principal pour récupérer toutes les données d'un dashboard direction
 */
export function useDirectionDashboard(directionId: string | null): UseDirectionDashboardResult {
  const { exercice } = useExercice();

  // KPIs principaux via RPC
  const kpisQuery = useQuery({
    queryKey: ["direction-kpis", directionId, exercice],
    queryFn: async () => {
      if (!directionId || !exercice) return null;

      const { data, error } = await (supabase.rpc as any)("get_direction_kpis", {
        p_direction_id: directionId,
        p_exercice: exercice,
      });

      if (error) throw error;
      return data as unknown as DirectionKPIs;
    },
    enabled: !!directionId && !!exercice,
  });

  // Alertes via vue
  const alertesQuery = useQuery({
    queryKey: ["direction-alertes", directionId],
    queryFn: async () => {
      if (!directionId) return [];

      const { data, error } = await (supabase.from as any)("v_alertes_direction")
        .select("*")
        .eq("direction_id", directionId);

      if (error) {
        console.warn("Alertes direction non disponibles:", error.message);
        return [];
      }
      return (data as unknown as DirectionAlerte[]) || [];
    },
    enabled: !!directionId,
  });

  // Évolution mensuelle via RPC
  const evolutionQuery = useQuery({
    queryKey: ["direction-evolution", directionId, exercice],
    queryFn: async () => {
      if (!directionId || !exercice) return [];

      const { data, error } = await (supabase.rpc as any)("get_evolution_mensuelle_direction", {
        p_direction_id: directionId,
        p_exercice: exercice,
      });

      if (error) {
        console.warn("Évolution mensuelle non disponible:", error.message);
        return [];
      }
      return (data as unknown as EvolutionMensuelle[]) || [];
    },
    enabled: !!directionId && !!exercice,
  });

  // Dossiers récents via RPC
  const dossiersQuery = useQuery({
    queryKey: ["direction-dossiers-recents", directionId, exercice],
    queryFn: async () => {
      if (!directionId || !exercice) return [];

      const { data, error } = await (supabase.rpc as any)("get_dossiers_recents_direction", {
        p_direction_id: directionId,
        p_exercice: exercice,
        p_limit: 10,
      });

      if (error) {
        console.warn("Dossiers récents non disponibles:", error.message);
        return [];
      }
      return (data as unknown as DossierRecent[]) || [];
    },
    enabled: !!directionId && !!exercice,
  });

  const refetch = () => {
    kpisQuery.refetch();
    alertesQuery.refetch();
    evolutionQuery.refetch();
    dossiersQuery.refetch();
  };

  return {
    kpis: kpisQuery.data || null,
    alertes: alertesQuery.data || [],
    evolution: evolutionQuery.data || [],
    dossiersRecents: dossiersQuery.data || [],
    isLoading:
      kpisQuery.isLoading ||
      alertesQuery.isLoading ||
      evolutionQuery.isLoading ||
      dossiersQuery.isLoading,
    isError:
      kpisQuery.isError ||
      alertesQuery.isError ||
      evolutionQuery.isError ||
      dossiersQuery.isError,
    error:
      kpisQuery.error ||
      alertesQuery.error ||
      evolutionQuery.error ||
      dossiersQuery.error,
    refetch,
  };
}

/**
 * Hook simplifié pour obtenir uniquement les KPIs
 */
export function useDirectionKPIs(directionId: string | null) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["direction-kpis-only", directionId, exercice],
    queryFn: async () => {
      if (!directionId || !exercice) return null;

      const { data, error } = await (supabase.rpc as any)("get_direction_kpis", {
        p_direction_id: directionId,
        p_exercice: exercice,
      });

      if (error) throw error;
      return data as unknown as DirectionKPIs;
    },
    enabled: !!directionId && !!exercice,
  });
}

/**
 * Hook pour obtenir les alertes d'une direction
 */
export function useDirectionAlertes(directionId: string | null) {
  return useQuery({
    queryKey: ["direction-alertes-only", directionId],
    queryFn: async () => {
      if (!directionId) return [];

      const { data, error } = await (supabase.from as any)("v_alertes_direction")
        .select("*")
        .eq("direction_id", directionId);

      if (error) {
        console.warn("Alertes non disponibles:", error.message);
        return [];
      }
      return (data as unknown as DirectionAlerte[]) || [];
    },
    enabled: !!directionId,
  });
}

/**
 * Hook pour obtenir la liste de toutes les directions avec leurs stats
 */
export function useAllDirectionsStats() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["all-directions-stats", exercice],
    queryFn: async () => {
      if (!exercice) return [];

      const { data, error } = await (supabase.from as any)("v_dashboard_direction")
        .select("*")
        .eq("exercice", exercice)
        .order("direction_code");

      if (error) {
        console.warn("Stats directions non disponibles:", error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!exercice,
  });
}

// Export des types
export type {
  UseDirectionDashboardResult,
};
