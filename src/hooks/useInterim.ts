/**
 * Hook de gestion des intérims
 * Permet de vérifier si l'utilisateur agit en intérim et de gérer les intérims
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Interim {
  id: string;
  titulaire_id: string;
  interimaire_id: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  est_actif: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  titulaire?: Profile;
  interimaire?: Profile;
}

export interface Profile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role_hierarchique: string | null;
  poste: string | null;
  direction_id: string | null;
}

export interface ActiveInterim {
  interim_id: string;
  titulaire_id: string;
  titulaire_nom: string;
  date_fin: string;
}

export interface CreateInterimParams {
  titulaire_id: string;
  interimaire_id: string;
  date_debut: string;
  date_fin: string;
  motif: string;
}

// ============================================================================
// HOOK: useActiveInterim - Vérifier si l'utilisateur agit en intérim
// ============================================================================

export function useActiveInterim() {
  const { userId } = usePermissions();

  return useQuery<ActiveInterim | null>({
    queryKey: ['active-interim', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_active_interim_for_user', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[useActiveInterim] Erreur:', error);
        return null;
      }

      // La fonction retourne un tableau, on prend le premier résultat
      const interims = data as ActiveInterim[] | null;
      return interims && interims.length > 0 ? interims[0] : null;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 secondes
  });
}

// ============================================================================
// HOOK: useInterims - Liste et gestion des intérims
// ============================================================================

export function useInterims(options?: { includeInactive?: boolean }) {
  const { includeInactive = false } = options || {};
  const queryClient = useQueryClient();

  // Récupérer la liste des intérims
  const {
    data: interims = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Interim[]>({
    queryKey: ['interims', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('interims')
        .select(`
          *,
          titulaire:profiles!interims_titulaire_id_fkey(
            id, full_name, first_name, last_name, email, role_hierarchique, poste, direction_id
          ),
          interimaire:profiles!interims_interimaire_id_fkey(
            id, full_name, first_name, last_name, email, role_hierarchique, poste, direction_id
          )
        `)
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('est_actif', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Interim[];
    },
  });

  // Créer un intérim via la fonction RPC
  const createInterimMutation = useMutation({
    mutationFn: async (params: CreateInterimParams) => {
      const { data, error } = await supabase.rpc('create_interim', {
        p_titulaire_id: params.titulaire_id,
        p_interimaire_id: params.interimaire_id,
        p_date_debut: params.date_debut,
        p_date_fin: params.date_fin,
        p_motif: params.motif,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success('Intérim créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['interims'] });
      queryClient.invalidateQueries({ queryKey: ['active-interim'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Terminer un intérim
  const endInterimMutation = useMutation({
    mutationFn: async (interimId: string) => {
      const { data, error } = await supabase.rpc('end_interim', {
        p_interim_id: interimId,
      });

      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      toast.success('Intérim terminé');
      queryClient.invalidateQueries({ queryKey: ['interims'] });
      queryClient.invalidateQueries({ queryKey: ['active-interim'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mettre à jour un intérim (simple update, pas via RPC)
  const updateInterimMutation = useMutation({
    mutationFn: async (params: { id: string; date_fin?: string; motif?: string }) => {
      const { error } = await supabase
        .from('interims')
        .update({
          date_fin: params.date_fin,
          motif: params.motif,
        })
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Intérim mis à jour');
      queryClient.invalidateQueries({ queryKey: ['interims'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    interims,
    isLoading,
    error: error as Error | null,
    refetch,
    createInterim: createInterimMutation.mutateAsync,
    endInterim: endInterimMutation.mutateAsync,
    updateInterim: updateInterimMutation.mutateAsync,
    isCreating: createInterimMutation.isPending,
    isEnding: endInterimMutation.isPending,
    isUpdating: updateInterimMutation.isPending,
  };
}

// ============================================================================
// HOOK: useCanValidateAsInterim - Vérifier si l'utilisateur peut valider en intérim
// ============================================================================

export function useCanValidateAsInterim(titulaireId: string | undefined) {
  const { userId } = usePermissions();

  return useQuery<boolean>({
    queryKey: ['can-validate-as-interim', userId, titulaireId],
    queryFn: async () => {
      if (!userId || !titulaireId) return false;

      const { data, error } = await supabase.rpc('can_validate_as_interim', {
        p_user_id: userId,
        p_titulaire_id: titulaireId,
      });

      if (error) {
        console.error('[useCanValidateAsInterim] Erreur:', error);
        return false;
      }

      return data as boolean;
    },
    enabled: !!userId && !!titulaireId,
    staleTime: 30000,
  });
}

// ============================================================================
// HOOK: useUsersForInterim - Liste des utilisateurs pour sélection
// ============================================================================

export function useUsersForInterim() {
  return useQuery<Profile[]>({
    queryKey: ['users-for-interim'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email, role_hierarchique, poste, direction_id')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return (data || []) as Profile[];
    },
  });
}

export default useInterims;
