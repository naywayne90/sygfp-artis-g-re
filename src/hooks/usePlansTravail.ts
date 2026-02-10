import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';
import type { PlanTravail, PlanTravailInput } from '@/types/roadmap';

// Table not yet in generated Supabase types - use untyped client as workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseUntyped = supabase as any;

export function usePlansTravail(directionId?: string) {
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['plans-travail', exerciceId, directionId],
    queryFn: async () => {
      let q = supabaseUntyped
        .from('plans_travail')
        .select(
          '*, direction:directions(id, code, nom), responsable:profiles!responsable_id(id, nom, prenom)'
        )
        .eq('est_actif', true);

      if (exerciceId) {
        q = q.eq('exercice_id', exerciceId);
      }
      if (directionId) {
        q = q.eq('direction_id', directionId);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PlanTravail[];
    },
    enabled: !!exerciceId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: PlanTravailInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      const { data, error } = await supabaseUntyped
        .from('plans_travail')
        .insert({
          ...input,
          budget_consomme: 0,
          est_actif: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PlanTravail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-travail'] });
      toast.success('Plan de travail cree');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanTravail> & { id: string }) => {
      const { data, error } = await supabaseUntyped
        .from('plans_travail')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PlanTravail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-travail'] });
      toast.success('Plan de travail mis a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseUntyped
        .from('plans_travail')
        .update({ est_actif: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-travail'] });
      toast.success('Plan de travail supprime');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createPlan: createMutation.mutateAsync,
    updatePlan: updateMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
