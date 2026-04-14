/**
 * P2 — Intégration et traçabilité du module Règlement
 *
 * Expose 3 hooks basés sur les objets DB créés par la migration P2 :
 *   - useReglementTraceability(reglementId) → timeline chaîne complète
 *       (engagement → liquidation → ordonnancement → règlement → visa
 *        → paiement → rapprochement)
 *   - useReglementAuditLog(reglementId) → entries immuables de audit_log
 *   - useReglementsDelais(exercice) → métriques P50/P90 des délais
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---------- Types ----------

export type TraceabilityStep =
  | 'engagement'
  | 'liquidation'
  | 'ordonnancement_cree'
  | 'ordonnancement_valide'
  | 'reglement_cree'
  | 'visa'
  | 'paiement'
  | 'rapprochement';

export interface TraceabilityEvent {
  step: TraceabilityStep;
  at: string | null;
  label: string;
  montant?: number | null;
  statut?: string | null;
  actor?: string | null;
  hash?: string | null;
  ref?: string | null;
  mode?: string | null;
  ref_id?: string | null;
  statut_rapprochement?: string | null;
}

export interface TraceabilityChain {
  reglement_id: string;
  reglement_numero: string | null;
  reglement_montant: number;
  ordonnancement_id: string | null;
  ordonnancement_numero: string | null;
  ordonnancement_montant: number | null;
  ordonnancement_montant_paye: number | null;
  liquidation_id: string | null;
  liquidation_numero: string | null;
  liquidation_montant: number | null;
  engagement_id: string | null;
  engagement_numero: string | null;
  engagement_montant: number | null;
  mouvement_id: string | null;
  mouvement_reference: string | null;
  mouvement_montant: number | null;
}

export interface TraceabilityResult {
  reglement_id: string;
  chain: TraceabilityChain;
  events: TraceabilityEvent[];
  computed_at: string;
  error?: string;
}

export interface ReglementAuditEntry {
  id: string;
  reglement_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
}

export interface DelaiStats {
  count: number;
  avg: number | null;
  p50: number | null;
  p90: number | null;
  max: number | null;
}

export interface ReglementsDelais {
  exercice: number | null;
  total_reglements: number;
  total_vises: number;
  total_payes: number;
  total_rapproches: number;
  ord_to_visa_h: DelaiStats;
  visa_to_paiement_h: DelaiStats;
  paiement_to_rapprochement_h: DelaiStats;
  computed_at: string;
}

// ---------- Hooks ----------

export function useReglementTraceability(reglementId: string | null | undefined) {
  return useQuery<TraceabilityResult | null>({
    queryKey: ['reglement-traceability', reglementId],
    enabled: !!reglementId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!reglementId) return null;
      const { data, error } = await supabase.rpc('get_reglement_traceability', {
        p_reglement_id: reglementId,
      });
      if (error) throw new Error(error.message);
      return data as unknown as TraceabilityResult;
    },
  });
}

export function useReglementAuditLog(reglementId: string | null | undefined) {
  return useQuery<ReglementAuditEntry[]>({
    queryKey: ['reglement-audit-log', reglementId],
    enabled: !!reglementId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!reglementId) return [];
      const { data, error } = await supabase
        .from('reglements_audit_log')
        .select('*')
        .eq('reglement_id', reglementId)
        .order('changed_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ReglementAuditEntry[];
    },
  });
}

export function useReglementsDelais(exercice: number | null | undefined) {
  return useQuery<ReglementsDelais | null>({
    queryKey: ['reglements-delais', exercice],
    enabled: !!exercice,
    staleTime: 60_000,
    queryFn: async () => {
      if (!exercice) return null;
      const { data, error } = await supabase.rpc('get_reglements_delais', {
        p_exercice: exercice,
      });
      if (error) throw new Error(error.message);
      return data as unknown as ReglementsDelais;
    },
  });
}
