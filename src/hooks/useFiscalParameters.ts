/**
 * Hook de gestion des paramètres fiscaux
 * Utilise system_config filtré par category='fiscal'
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface FiscalParameter {
  id: string;
  key: string;
  label: string;
  value: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface UpsertFiscalParams {
  key: string;
  label: string;
  value: string;
  description?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const FISCAL_KEYS = {
  TVA_TAUX: 'TVA_TAUX',
  AIRSI_TAUX: 'AIRSI_TAUX',
  RETENUE_BIC_TAUX: 'RETENUE_BIC_TAUX',
  RETENUE_BNC_TAUX: 'RETENUE_BNC_TAUX',
  RETENUE_SOURCE_TAUX: 'RETENUE_SOURCE_TAUX',
  PENALITE_TAUX_JOURNALIER: 'PENALITE_TAUX_JOURNALIER',
} as const;

export const FISCAL_LABELS: Record<string, string> = {
  TVA_TAUX: 'Taux de TVA (%)',
  AIRSI_TAUX: 'Taux AIRSI (%)',
  RETENUE_BIC_TAUX: 'Retenue BIC (%)',
  RETENUE_BNC_TAUX: 'Retenue BNC (%)',
  RETENUE_SOURCE_TAUX: 'Retenue à la source (%)',
  PENALITE_TAUX_JOURNALIER: 'Pénalité journalière (%)',
};

// ============================================================================
// HOOK
// ============================================================================

export function useFiscalParameters() {
  const queryClient = useQueryClient();

  const {
    data: parameters = [],
    isLoading,
    error,
    refetch,
  } = useQuery<FiscalParameter[]>({
    queryKey: ['fiscal-parameters'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('system_config')
        .select('*')
        .eq('category', 'fiscal')
        .order('key', { ascending: true });

      if (error) throw error;
      return (data || []) as FiscalParameter[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (params: UpsertFiscalParams) => {
      const { data, error } = await supabaseAny
        .from('system_config')
        .upsert(
          {
            key: params.key,
            label: params.label,
            value: params.value,
            category: 'fiscal',
            description: params.description || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as FiscalParameter;
    },
    onSuccess: () => {
      toast.success('Paramètre fiscal mis à jour');
      queryClient.invalidateQueries({ queryKey: ['fiscal-parameters'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la mise à jour', { description: err.message });
    },
  });

  // Helper: get a parameter value by key
  const getParameterValue = (key: string): string | null => {
    const param = parameters.find((p) => p.key === key);
    return param ? param.value : null;
  };

  // Helper: get numeric value
  const getNumericValue = (key: string): number | null => {
    const val = getParameterValue(key);
    return val !== null ? parseFloat(val) : null;
  };

  return {
    parameters,
    isLoading,
    error: error as Error | null,
    refetch,
    upsertParameter: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    getParameterValue,
    getNumericValue,
  };
}
