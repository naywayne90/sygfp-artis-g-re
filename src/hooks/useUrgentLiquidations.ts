/**
 * Hook de gestion des liquidations urgentes
 * Marquage/démarquage, liste dédiée, compteur
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';

// Helper pour accéder aux colonnes non encore générées dans les types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface UrgentLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  date_liquidation: string;
  statut: string | null;
  // Champs urgence
  reglement_urgent: boolean;
  urgence_motif: string | null;
  urgence_date: string | null;
  urgence_par: string | null;
  // Relations jointes
  engagement?: {
    id: string;
    numero: string;
    objet: string;
    fournisseur: string | null;
    budget_line?: {
      code: string;
      label: string;
      direction?: { label: string; sigle: string | null } | null;
    } | null;
  } | null;
  urgence_user?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface MarkUrgentParams {
  liquidationId: string;
  motif: string;
}

export interface UrgentStats {
  total: number;
  enAttente: number;
  validees: number;
  montantTotal: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useUrgentLiquidations() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Liquidations urgentes
  // ────────────────────────────────────────────────────────────────────────────

  const {
    data: urgentLiquidations = [],
    isLoading,
    error,
    refetch,
  } = useQuery<UrgentLiquidation[]>({
    queryKey: ['urgent-liquidations', exercice],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('budget_liquidations')
        .select(`
          id, numero, montant, net_a_payer, date_liquidation, statut,
          reglement_urgent, urgence_motif, urgence_date, urgence_par,
          engagement:budget_engagements(
            id, numero, objet, fournisseur,
            budget_line:budget_lines(
              code, label,
              direction:directions(label, sigle)
            )
          ),
          urgence_user:profiles!budget_liquidations_urgence_par_fkey(id, full_name)
        `)
        .eq('exercice', exercice)
        .eq('reglement_urgent', true)
        .order('urgence_date', { ascending: false });

      if (error) throw error;
      return (data || []) as UrgentLiquidation[];
    },
    enabled: !!exercice,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Compteur urgences non traitées
  // ────────────────────────────────────────────────────────────────────────────

  const { data: urgentCount = 0 } = useQuery<number>({
    queryKey: ['urgent-liquidations-count', exercice],
    queryFn: async () => {
      const { count, error } = await supabaseAny
        .from('budget_liquidations')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exercice)
        .eq('reglement_urgent', true)
        .in('statut', ['soumis', 'valide']); // En attente de règlement

      if (error) throw error;
      return count || 0;
    },
    enabled: !!exercice,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // COMPUTED: Statistiques
  // ────────────────────────────────────────────────────────────────────────────

  const stats: UrgentStats = {
    total: urgentLiquidations.length,
    enAttente: urgentLiquidations.filter(l => l.statut === 'soumis' || l.statut === 'valide').length,
    validees: urgentLiquidations.filter(l => l.statut === 'valide').length,
    montantTotal: urgentLiquidations.reduce((acc, l) => acc + (l.net_a_payer || l.montant), 0),
  };

  // ────────────────────────────────────────────────────────────────────────────
  // MUTATION: Marquer comme urgent
  // ────────────────────────────────────────────────────────────────────────────

  const markUrgentMutation = useMutation({
    mutationFn: async ({ liquidationId, motif }: MarkUrgentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer l'état avant
      const { data: liquidationBefore, error: fetchError } = await supabaseAny
        .from('budget_liquidations')
        .select('id, numero, reglement_urgent, urgence_motif, urgence_date, urgence_par')
        .eq('id', liquidationId)
        .single();

      if (fetchError) throw fetchError;

      const newValues = {
        reglement_urgent: true,
        urgence_motif: motif,
        urgence_date: new Date().toISOString(),
        urgence_par: user.id,
      };

      const { error } = await supabaseAny
        .from('budget_liquidations')
        .update(newValues)
        .eq('id', liquidationId);

      if (error) throw error;

      // Audit trail
      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: 'mark_urgent',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          reglement_urgent: liquidationBefore?.reglement_urgent,
          urgence_motif: liquidationBefore?.urgence_motif,
          urgence_date: liquidationBefore?.urgence_date,
        },
        newValues,
        justification: motif,
        resume: `Marquage urgent de la liquidation ${liquidationBefore?.numero}`,
      });

      return liquidationBefore?.numero;
    },
    onSuccess: (numero) => {
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations'] });
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations-count'] });
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success(`Liquidation ${numero} marquée comme urgente`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // MUTATION: Retirer le marquage urgent
  // ────────────────────────────────────────────────────────────────────────────

  const removeUrgentMutation = useMutation({
    mutationFn: async (liquidationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer l'état avant
      const { data: liquidationBefore, error: fetchError } = await supabaseAny
        .from('budget_liquidations')
        .select('id, numero, reglement_urgent, urgence_motif, urgence_date, urgence_par')
        .eq('id', liquidationId)
        .single();

      if (fetchError) throw fetchError;

      const newValues = {
        reglement_urgent: false,
        urgence_motif: null,
        urgence_date: null,
        urgence_par: null,
      };

      const { error } = await supabaseAny
        .from('budget_liquidations')
        .update(newValues)
        .eq('id', liquidationId);

      if (error) throw error;

      // Audit trail
      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: 'remove_urgent',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          reglement_urgent: liquidationBefore?.reglement_urgent,
          urgence_motif: liquidationBefore?.urgence_motif,
          urgence_date: liquidationBefore?.urgence_date,
          urgence_par: liquidationBefore?.urgence_par,
        },
        newValues,
        resume: `Retrait marquage urgent de la liquidation ${liquidationBefore?.numero}`,
      });

      return liquidationBefore?.numero;
    },
    onSuccess: (numero) => {
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations'] });
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations-count'] });
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success(`Marquage urgent retiré de ${numero}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // HELPER: Vérifier si une liquidation est urgente
  // ────────────────────────────────────────────────────────────────────────────

  const isUrgent = (liquidationId: string): boolean => {
    return urgentLiquidations.some(l => l.id === liquidationId);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────────────────────────────────────

  return {
    // Données
    urgentLiquidations,
    urgentCount,
    stats,

    // État
    isLoading,
    error: error as Error | null,

    // Actions
    markAsUrgent: markUrgentMutation.mutateAsync,
    removeUrgent: removeUrgentMutation.mutateAsync,
    refetch,

    // Helpers
    isUrgent,

    // État des mutations
    isMarking: markUrgentMutation.isPending,
    isRemoving: removeUrgentMutation.isPending,
  };
}

export default useUrgentLiquidations;
