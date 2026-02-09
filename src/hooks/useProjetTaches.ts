import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { Tache, TacheInput } from '@/types/roadmap';

type TacheUpdate = Database['public']['Tables']['taches']['Update'];

interface TacheStats {
  total: number;
  planifie: number;
  en_cours: number;
  termine: number;
  en_retard: number;
  suspendu: number;
  annule: number;
  avancementMoyen: number;
}

export function useProjetTaches(sousActiviteId?: string) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projet-taches', exercice, sousActiviteId],
    queryFn: async () => {
      let q = supabase
        .from('taches')
        .select(
          '*, responsable:profiles!responsable_id(id, nom, prenom), sous_activite:sous_activites(id, code, libelle)'
        )
        .eq('est_active', true);

      if (exercice) {
        q = q.eq('exercice', exercice);
      }
      if (sousActiviteId) {
        q = q.eq('sous_activite_id', sousActiviteId);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Tache[];
    },
    enabled: !!exercice,
  });

  const taches = query.data ?? [];

  // Compute stats
  const stats: TacheStats = {
    total: taches.length,
    planifie: taches.filter((t) => t.statut === 'planifie').length,
    en_cours: taches.filter((t) => t.statut === 'en_cours').length,
    termine: taches.filter((t) => t.statut === 'termine').length,
    en_retard: taches.filter((t) => t.statut === 'en_retard').length,
    suspendu: taches.filter((t) => t.statut === 'suspendu').length,
    annule: taches.filter((t) => t.statut === 'annule').length,
    avancementMoyen:
      taches.length > 0
        ? Math.round(taches.reduce((sum, t) => sum + (t.avancement || 0), 0) / taches.length)
        : 0,
  };

  // Tasks overdue: date_fin < today AND statut not termine/annule
  const tachesEnRetard = taches.filter((t) => {
    if (!t.date_fin) return false;
    if (t.statut === 'termine' || t.statut === 'annule') return false;
    return new Date(t.date_fin) < new Date();
  });

  const createMutation = useMutation({
    mutationFn: async (input: TacheInput) => {
      const { data, error } = await supabase
        .from('taches')
        .insert({
          ...input,
          avancement: input.avancement ?? 0,
          statut: input.statut ?? 'planifie',
          priorite: input.priorite ?? 'normale',
          budget_prevu: input.budget_prevu ?? 0,
          est_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Tache;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-taches'] });
      toast.success('Tache creee');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tache> & { id: string }) => {
      const { data, error } = await supabase
        .from('taches')
        .update(updates as unknown as TacheUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Tache;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-taches'] });
      toast.success('Tache mise a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateAvancementMutation = useMutation({
    mutationFn: async ({ id, avancement }: { id: string; avancement: number }) => {
      const statut = avancement >= 100 ? 'termine' : undefined;
      const updatePayload: { avancement: number; statut?: string; date_fin_reelle?: string } = {
        avancement,
      };
      if (statut) {
        updatePayload.statut = statut;
        updatePayload.date_fin_reelle = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('taches')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Tache;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-taches'] });
      toast.success('Avancement mis a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('taches').update({ est_active: false }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-taches'] });
      toast.success('Tache supprimee');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    taches,
    tachesEnRetard,
    stats,
    isLoading: query.isLoading,
    error: query.error,
    createTache: createMutation.mutateAsync,
    updateTache: updateMutation.mutateAsync,
    updateAvancement: updateAvancementMutation.mutateAsync,
    deleteTache: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
