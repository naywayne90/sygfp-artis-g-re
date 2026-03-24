import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TacheLivrable {
  id: string;
  tache_id: string;
  nom: string;
  description: string | null;
  date_prevue: string | null;
  statut: 'planifie' | 'en_cours' | 'soumis' | 'valide' | 'rejete';
  soumis_par: string | null;
  soumis_at: string | null;
  valide_par: string | null;
  valide_at: string | null;
  motif_rejet: string | null;
  piece_jointe_path: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  tache?: { id: string; code: string; libelle: string; plan_travail_id: string | null };
}

export function useLivrableValidation(filters?: {
  tacheId?: string;
  planId?: string;
  statut?: string;
}) {
  const queryClient = useQueryClient();

  const {
    data: livrables = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tache-livrables', filters],
    queryFn: async () => {
      let query = supabase
        .from('tache_livrables')
        .select('*, tache:taches(id, code, libelle, plan_travail_id)')
        .order('date_prevue', { ascending: true });

      if (filters?.tacheId) query = query.eq('tache_id', filters.tacheId);
      if (filters?.statut) query = query.eq('statut', filters.statut);

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as unknown as TacheLivrable[];

      // Filter by planId client-side (through tache.plan_travail_id)
      if (filters?.planId) {
        result = result.filter((l) => l.tache?.plan_travail_id === filters.planId);
      }

      return result;
    },
    retry: 2,
    staleTime: 15_000,
  });

  // Create livrable
  const createLivrable = useMutation({
    mutationFn: async (input: {
      tache_id: string;
      nom: string;
      description?: string;
      date_prevue?: string;
    }) => {
      const { data, error } = await supabase
        .from('tache_livrables')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tache-livrables'] });
      toast.success('Livrable ajoute');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  // Submit livrable (direction submits for validation)
  const submitLivrable = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tache_livrables')
        .update({ statut: 'soumis', soumis_par: user?.id, soumis_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tache-livrables'] });
      toast.success('Livrable soumis pour validation');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  // Validate livrable (CB/CM validates)
  const validateLivrable = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tache_livrables')
        .update({ statut: 'valide', valide_par: user?.id, valide_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tache-livrables'] });
      toast.success('Livrable valide');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  // Reject livrable (CB/CM rejects with reason)
  const rejectLivrable = useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tache_livrables')
        .update({
          statut: 'rejete',
          valide_par: user?.id,
          valide_at: new Date().toISOString(),
          motif_rejet: motif,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tache-livrables'] });
      toast.success('Livrable rejete');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  // Delete livrable
  const deleteLivrable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tache_livrables').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tache-livrables'] });
      toast.success('Livrable supprime');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  // Stats
  const stats = {
    total: livrables.length,
    planifie: livrables.filter((l) => l.statut === 'planifie').length,
    enCours: livrables.filter((l) => l.statut === 'en_cours').length,
    soumis: livrables.filter((l) => l.statut === 'soumis').length,
    valide: livrables.filter((l) => l.statut === 'valide').length,
    rejete: livrables.filter((l) => l.statut === 'rejete').length,
    enRetard: livrables.filter(
      (l) => l.date_prevue && new Date(l.date_prevue) < new Date() && l.statut !== 'valide'
    ).length,
  };

  return {
    livrables,
    isLoading,
    stats,
    refetch,
    createLivrable,
    submitLivrable,
    validateLivrable,
    rejectLivrable,
    deleteLivrable,
  };
}
