/**
 * Hook pour différer et reprendre un engagement.
 * Extrait de useEngagements.ts (P2-10 part 1).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { VALIDATION_STEPS } from '@/hooks/useEngagements';
import { checkValidationPermission } from '@/hooks/useCheckValidationPermission';

export function useEngagementDeferResume() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Defer engagement
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get current step pour déterminer le rôle requis
      const { data: engagement } = await supabase
        .from('budget_engagements')
        .select('current_step, numero, created_by')
        .eq('id', id)
        .single();

      const currentStep = engagement?.current_step || 1;
      const requiredRole = VALIDATION_STEPS[currentStep - 1]?.role;
      if (!requiredRole) throw new Error(`Étape de validation ${currentStep} invalide`);

      // Vérifier la permission via RPC unifiée
      const permCheck = await checkValidationPermission(user.id, 'engagements', requiredRole);
      if (!permCheck.isAllowed) {
        throw new Error(`Permission insuffisante pour différer à l'étape ${requiredRole}.`);
      }

      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'differe',
          workflow_status: 'differe',
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
          differe_by: user.id,
        })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'defer',
        newValues: { motif, dateReprise },
      });

      // Notifier le créateur du report
      if (engagement?.created_by) {
        await supabase.from('notifications').insert({
          user_id: engagement.created_by,
          type: 'differe',
          title: 'Engagement différé',
          message: `L'engagement ${engagement.numero} a été différé : ${motif}`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement différé');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors du report de l'engagement", {
        description: error.message,
      });
    },
  });

  // Resume deferred engagement
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'soumis',
          workflow_status: 'en_validation',
          date_differe: null,
          motif_differe: null,
          deadline_correction: null,
          differe_by: null,
        })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'resume',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement repris');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la reprise de l'engagement", {
        description: error.message,
      });
    },
  });

  return {
    deferEngagement: deferMutation.mutateAsync,
    resumeEngagement: resumeMutation.mutateAsync,
    isDeferring: deferMutation.isPending,
    isResuming: resumeMutation.isPending,
  };
}
