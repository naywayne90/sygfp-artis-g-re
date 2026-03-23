/**
 * Hook de gestion de la configuration des alertes DMG
 * CRUD pour dmg_alert_config
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface DMGAlertConfig {
  id: string;
  alert_type: string;
  seuil_warning: number;
  seuil_critical: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateAlertConfigParams {
  id: string;
  seuil_warning?: number;
  seuil_critical?: number;
  description?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDMGAlertConfig() {
  const queryClient = useQueryClient();

  const {
    data: configs = [],
    isLoading,
    error,
    refetch,
  } = useQuery<DMGAlertConfig[]>({
    queryKey: ['dmg-alert-config'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('dmg_alert_config')
        .select('*')
        .order('alert_type', { ascending: true });

      if (error) throw error;
      return (data || []) as DMGAlertConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: UpdateAlertConfigParams) => {
      const { id, ...updates } = params;
      const { error } = await supabaseAny
        .from('dmg_alert_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seuils d'alerte mis à jour");
      queryClient.invalidateQueries({ queryKey: ['dmg-alert-config'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la mise à jour', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabaseAny
        .from('dmg_alert_config')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data: unknown, variables: { id: string; is_active: boolean }) => {
      toast.success(variables.is_active ? 'Alerte activée' : 'Alerte désactivée');
      queryClient.invalidateQueries({ queryKey: ['dmg-alert-config'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors du changement de statut', { description: err.message });
    },
  });

  return {
    configs,
    isLoading,
    error: error as Error | null,
    refetch,
    updateConfig: updateMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
}
