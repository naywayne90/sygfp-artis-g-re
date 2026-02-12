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

// Helper for tables not yet in generated Supabase types.
// Uses 'directions' (shallow FK depth) as type placeholder to avoid deep instantiation.
function fromTable(table: string) {
  return supabase.from(table as 'directions');
}

interface EngRow {
  id: string;
  numero_engagement: string | null;
  objet: string | null;
  montant: number | null;
  statut: string | null;
  date_engagement: string | null;
}

interface LiqRow {
  id: string;
  numero_liquidation: string | null;
  reference_facture: string | null;
  montant_liquide: number | null;
  statut: string | null;
  date_liquidation: string | null;
}

interface OrdRow {
  id: string;
  numero_ordonnancement: string | null;
  montant_ordonnance: number | null;
  statut: string | null;
  date_ordonnancement: string | null;
}

interface RegRow {
  id: string;
  numero_reglement: string | null;
  montant_regle: number | null;
  statut: string | null;
  date_reglement: string | null;
}

export function useBudgetLineELOP(budgetLineId: string | null) {
  const { data: engagements, isLoading: loadingE } = useQuery({
    queryKey: ['budget-line-engagements', budgetLineId],
    queryFn: async () => {
      const { data, error } = await fromTable('budget_engagements')
        .select('*')
        .eq('budget_line_id' as 'id', budgetLineId!);

      if (error) throw error;
      const rows = (data || []) as unknown as EngRow[];
      return rows.map(
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
      const { data, error } = await fromTable('budget_liquidations')
        .select('*')
        .eq('budget_line_id' as 'id', budgetLineId!);

      if (error) throw error;
      const rows = (data || []) as unknown as LiqRow[];
      return rows.map(
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
      const { data, error } = await fromTable('budget_ordonnancements')
        .select('*')
        .eq('budget_line_id' as 'id', budgetLineId!);

      if (error) throw error;
      const rows = (data || []) as unknown as OrdRow[];
      return rows.map(
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
      const { data, error } = await fromTable('budget_reglements')
        .select('*')
        .eq('budget_line_id' as 'id', budgetLineId!);

      if (error) throw error;
      const rows = (data || []) as unknown as RegRow[];
      return rows.map(
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
