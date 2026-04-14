/**
 * P0.1 — Rapprochement bancaire automatique des règlements
 *
 * Permet au Trésorier d'apparier les règlements (côté ARTI) avec les
 * mouvements bancaires constatés sur le relevé. Conformité OHADA / RGCP /
 * IPSAS — pilier du contrôle interne en comptabilité publique.
 *
 * RPCs DB :
 *   - rapprocher_reglement(reglement, mouvement, force_ecart)
 *   - suggerer_rapprochements_auto(exercice)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import type { ReglementWithRelations } from './useReglements';

export type StatutRapprochement =
  | 'non_rapproche'
  | 'rapproche_auto'
  | 'rapproche_manuel'
  | 'ecart_detecte';

export interface SuggestionRapprochement {
  reglement_id: string;
  reglement_numero: string;
  reglement_montant: number;
  reglement_reference: string | null;
  mouvement_id: string;
  mouvement_reference: string;
  mouvement_montant: number;
  match_score: number;
}

interface RapprocherPayload {
  reglementId: string;
  mouvementId: string;
  forceEcart?: boolean;
}

export function useRapprochementBancaire() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  const suggestionsQuery = useQuery<SuggestionRapprochement[]>({
    queryKey: ['rapprochement-suggestions', exercice],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('suggerer_rapprochements_auto', {
        p_exercice: exercice,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as SuggestionRapprochement[];
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  const rapprocherMutation = useMutation<ReglementWithRelations, Error, RapprocherPayload>({
    mutationFn: async ({ reglementId, mouvementId, forceEcart = false }) => {
      const { data, error } = await supabase.rpc('rapprocher_reglement', {
        p_reglement_id: reglementId,
        p_mouvement_id: mouvementId,
        p_force_ecart: forceEcart,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Aucune donnée retournée par rapprocher_reglement');
      return data as unknown as ReglementWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      queryClient.invalidateQueries({ queryKey: ['rapprochement-suggestions'] });
      const isEcart = data.statut_rapprochement === 'ecart_detecte';
      toast.success(isEcart ? 'Rapprochement avec écart enregistré' : 'Rapprochement effectué', {
        description: isEcart
          ? 'Un écart a été constaté entre le règlement et le mouvement bancaire.'
          : 'Le règlement a été rapproché avec le mouvement bancaire.',
      });
    },
    onError: (error) => {
      toast.error('Erreur lors du rapprochement', { description: error.message });
    },
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoadingSuggestions: suggestionsQuery.isLoading,
    refetchSuggestions: suggestionsQuery.refetch,
    rapprocher: rapprocherMutation.mutate,
    rapprocherAsync: rapprocherMutation.mutateAsync,
    isRapprochementPending: rapprocherMutation.isPending,
  };
}

/** Helper d'affichage UI : libellé + couleur du statut */
export function getRapprochementBadge(statut: StatutRapprochement | string) {
  switch (statut) {
    case 'rapproche_auto':
      return {
        label: 'Rapproché (auto)',
        className: 'bg-success/10 text-success border-success/30',
      };
    case 'rapproche_manuel':
      return { label: 'Rapproché', className: 'bg-success/10 text-success border-success/30' };
    case 'ecart_detecte':
      return {
        label: 'Écart détecté',
        className: 'bg-destructive/10 text-destructive border-destructive/30',
      };
    case 'non_rapproche':
    default:
      return { label: 'Non rapproché', className: 'bg-warning/10 text-warning border-warning/30' };
  }
}
