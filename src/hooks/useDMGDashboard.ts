import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper pour accéder aux fonctions RPC qui ne sont pas dans les types générés
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

export interface DMGKPIs {
  liquidations_urgentes: {
    count: number;
    montant: number;
    montant_formate: string;
  };
  liquidations_attente: {
    count: number;
    montant: number;
    montant_formate: string;
  };
  engagements_a_liquider: {
    count: number;
    montant: number;
    montant_formate: string;
  };
}

export interface DMGAlerte {
  entity_id: string;
  type: string;
  reference: string;
  fournisseur: string;
  montant: number;
  severite: 'critical' | 'warning' | 'info';
  message: string;
}

export interface DMGFournisseur {
  fournisseur: string;
  nb_engagements: number;
  montant_total: number;
  montant_formate: string;
}

export interface DMGEvolution {
  date: string;
  count: number;
  montant: number;
}

export interface DMGDashboardData {
  kpis: DMGKPIs;
  alertes: DMGAlerte[];
  alertes_count: number;
  alertes_critical_count: number;
  top_fournisseurs: DMGFournisseur[];
  evolution_30j: DMGEvolution[];
  generated_at: string;
}

async function fetchDMGDashboardData(): Promise<DMGDashboardData> {
  const { data, error } = await supabaseAny.rpc('get_dmg_dashboard_data');

  if (error) {
    console.error('Erreur fetch DMG dashboard:', error);
    throw new Error(error.message);
  }

  return data as DMGDashboardData;
}

export function useDMGDashboard() {
  return useQuery({
    queryKey: ['dmg-dashboard'],
    queryFn: fetchDMGDashboardData,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 10000, // Considérer les données comme fraîches pendant 10 secondes
    retry: 2,
  });
}

// Hook pour marquer une liquidation comme urgente
export function useMarkLiquidationUrgent() {
  const markUrgent = async (liquidationId: string, motif: string) => {
    const { data, error } = await supabaseAny.rpc('mark_liquidation_urgent', {
      p_liquidation_id: liquidationId,
      p_motif: motif,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  return { markUrgent };
}

// Hook pour retirer le marquage urgent
export function useUnmarkLiquidationUrgent() {
  const unmarkUrgent = async (liquidationId: string) => {
    const { data, error } = await supabaseAny.rpc('unmark_liquidation_urgent', {
      p_liquidation_id: liquidationId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  return { unmarkUrgent };
}

// Hook pour récupérer le compteur d'urgences (pour le badge)
export function useUrgentLiquidationsCount() {
  return useQuery({
    queryKey: ['urgent-liquidations-count'],
    queryFn: async () => {
      const { data, error } = await supabaseAny.rpc('get_urgent_liquidations_count');
      if (error) throw new Error(error.message);
      return data as number;
    },
    refetchInterval: 60000, // Rafraîchir chaque minute
    staleTime: 30000,
  });
}
