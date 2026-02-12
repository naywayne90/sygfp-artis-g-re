import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectionRef {
  id: string;
  code: string;
  label: string;
  sigle: string | null;
  est_active: boolean;
}

export interface OSRef {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
}

export interface MissionRef {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  os_id: string | null;
}

export interface ActionRef {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  mission_id: string;
  os_id: string;
}

export interface ActiviteRef {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  action_id: string;
}

export interface SousActiviteRef {
  id: string;
  code: string;
  libelle: string;
  est_active: boolean;
  activite_id: string;
}

export function useBaseReferentiels() {
  // Directions
  const { data: directions = [], isLoading: loadingDirections } = useQuery({
    queryKey: ['ref-directions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle, est_active')
        .order('est_active', { ascending: false })
        .order('label');
      if (error) throw error;
      return data as DirectionRef[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Objectifs Stratégiques
  const { data: objectifsStrategiques = [], isLoading: loadingOS } = useQuery({
    queryKey: ['ref-objectifs-strategiques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .order('code');
      if (error) throw error;
      return (data || []).map((d) => ({ ...d, est_active: true })) as OSRef[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Missions
  const { data: missions = [], isLoading: loadingMissions } = useQuery({
    queryKey: ['ref-missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, code, libelle')
        .order('code');
      if (error) throw error;
      return (data || []).map((d) => ({ ...d, est_active: true, os_id: null })) as MissionRef[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Actions
  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ['ref-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('id, code, libelle, est_active, mission_id, os_id')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data as ActionRef[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Activités
  const { data: activites = [], isLoading: loadingActivites } = useQuery({
    queryKey: ['ref-activites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activites')
        .select('id, code, libelle, est_active, action_id')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data as ActiviteRef[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sous-Activités
  const { data: sousActivites = [], isLoading: loadingSousActivites } = useQuery({
    queryKey: ['ref-sous-activites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sous_activites')
        .select('id, code, libelle, est_active, activite_id')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data as SousActiviteRef[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    loadingDirections ||
    loadingOS ||
    loadingMissions ||
    loadingActions ||
    loadingActivites ||
    loadingSousActivites;

  return {
    directions,
    objectifsStrategiques,
    missions,
    actions,
    activites,
    sousActivites,
    isLoading,
    loadingDirections,
    loadingOS,
    loadingMissions,
    loadingActions,
    loadingActivites,
    loadingSousActivites,
  };
}
