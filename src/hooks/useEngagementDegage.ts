/**
 * Hook pour le dégagement (total ou partiel) d'un engagement.
 * Extrait de useEngagements.ts (P2-10 part 2).
 * DAAF/ADMIN uniquement.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';

export function useEngagementDegage() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Dégagement (total ou partiel) — DAAF/ADMIN uniquement (Prompt 8)
  const degageMutation = useMutation({
    mutationFn: async ({ id, montant, motif }: { id: string; montant: number; motif: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer l'engagement
      const { data: engagement, error: fetchError } = await supabase
        .from('budget_engagements')
        .select('statut, montant, montant_degage, budget_line_id, numero, created_by')
        .eq('id', id)
        .single();

      if (fetchError || !engagement) throw new Error('Engagement introuvable');

      if (engagement.statut !== 'valide')
        throw new Error('Seuls les engagements validés peuvent être dégagés');

      const montantRestant = engagement.montant - (engagement.montant_degage || 0);
      if (montant <= 0) throw new Error('Le montant à dégager doit être supérieur à 0');
      if (montant > montantRestant)
        throw new Error(
          `Le montant à dégager (${montant.toLocaleString('fr-FR')} FCFA) dépasse le montant restant (${montantRestant.toLocaleString('fr-FR')} FCFA)`
        );

      const nouveauMontantDegage = (engagement.montant_degage || 0) + montant;

      // Mettre à jour l'engagement — statut reste 'valide'
      const { error: updateError } = await supabase
        .from('budget_engagements')
        .update({
          montant_degage: nouveauMontantDegage,
          motif_degage: motif,
          degage_by: user.id,
          degage_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Impact budget : géré automatiquement par le trigger DB
      // trg_recalc_elop_engagements recalcule budget_lines.total_engage
      // quand montant_degage change sur budget_engagements

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'degage',
        newValues: { montant, motif, total: nouveauMontantDegage >= engagement.montant },
      });

      // Notifier le créateur
      if (engagement.created_by) {
        const isTotal = nouveauMontantDegage >= engagement.montant;
        await supabase.from('notifications').insert({
          user_id: engagement.created_by,
          type: 'degagement',
          title: isTotal ? 'Dégagement total' : 'Dégagement partiel',
          message: `L'engagement ${engagement.numero} a été ${isTotal ? 'totalement dégagé' : `partiellement dégagé (${montant.toLocaleString('fr-FR')} FCFA)`} : ${motif}`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      toast.success('Dégagement effectué avec succès');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du dégagement', {
        description: error.message,
      });
    },
  });

  return {
    degageEngagement: degageMutation.mutateAsync,
    isDegaging: degageMutation.isPending,
  };
}
