/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ELOPRecord {
  id: string;
  numero: string | null;
  objet: string | null;
  reference: string | null;
  montant: number;
  statut: string | null;
  date: string | null;
}

interface ELOPTotals {
  totalEngage: number;
  totalLiquide: number;
  totalOrdonnance: number;
  totalPaye: number;
}

export function useBudgetLineELOP(budgetLineId: string | null) {
  const { data: engagements, isLoading: loadingE } = useQuery({
    queryKey: ['budget-line-engagements', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_engagements')
        .select('id, numero_engagement, objet, montant, statut, date_engagement')
        .eq('budget_line_id', budgetLineId!)
        .order('date_engagement', { ascending: false });

      if (error) throw error;
      return (data || []).map(
        (e): ELOPRecord => ({
          id: e.id,
          numero: e.numero_engagement,
          objet: e.objet,
          reference: null,
          montant: e.montant || 0,
          statut: e.statut,
          date: e.date_engagement,
        })
      );
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  const { data: liquidations, isLoading: loadingL } = useQuery({
    queryKey: ['budget-line-liquidations', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_liquidations')
        .select(
          'id, numero_liquidation, reference_facture, montant_liquide, statut, date_liquidation'
        )
        .eq('budget_line_id', budgetLineId!)
        .order('date_liquidation', { ascending: false });

      if (error) throw error;
      return (data || []).map(
        (l): ELOPRecord => ({
          id: l.id,
          numero: l.numero_liquidation,
          objet: null,
          reference: l.reference_facture,
          montant: l.montant_liquide || 0,
          statut: l.statut,
          date: l.date_liquidation,
        })
      );
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  const { data: ordonnancements, isLoading: loadingO } = useQuery({
    queryKey: ['budget-line-ordonnancements', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_ordonnancements')
        .select('id, numero_ordonnancement, montant_ordonnance, statut, date_ordonnancement')
        .eq('budget_line_id', budgetLineId!)
        .order('date_ordonnancement', { ascending: false });

      if (error) throw error;
      return (data || []).map(
        (o): ELOPRecord => ({
          id: o.id,
          numero: o.numero_ordonnancement,
          objet: null,
          reference: null,
          montant: o.montant_ordonnance || 0,
          statut: o.statut,
          date: o.date_ordonnancement,
        })
      );
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  const { data: reglements, isLoading: loadingR } = useQuery({
    queryKey: ['budget-line-reglements', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_reglements')
        .select('id, numero_reglement, montant_regle, statut, date_reglement')
        .eq('budget_line_id', budgetLineId!)
        .order('date_reglement', { ascending: false });

      if (error) throw error;
      return (data || []).map(
        (r): ELOPRecord => ({
          id: r.id,
          numero: r.numero_reglement,
          objet: null,
          reference: null,
          montant: r.montant_regle || 0,
          statut: r.statut,
          date: r.date_reglement,
        })
      );
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  const totals: ELOPTotals = {
    totalEngage: engagements?.reduce((s, e) => s + e.montant, 0) || 0,
    totalLiquide: liquidations?.reduce((s, l) => s + l.montant, 0) || 0,
    totalOrdonnance: ordonnancements?.reduce((s, o) => s + o.montant, 0) || 0,
    totalPaye: reglements?.reduce((s, r) => s + r.montant, 0) || 0,
  };

  return {
    engagements: engagements || [],
    liquidations: liquidations || [],
    ordonnancements: ordonnancements || [],
    reglements: reglements || [],
    totals,
    isLoading: loadingE || loadingL || loadingO || loadingR,
  };
}

export type { ELOPRecord, ELOPTotals };
