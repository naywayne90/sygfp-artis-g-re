/**
 * Hook de gestion des règles de relance automatique
 * CRUD pour reminder_rules + lecture reminder_history
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface ReminderRule {
  id: string;
  name: string;
  entity_type: string;
  trigger_status: string;
  delay_hours: number;
  action_type: string;
  trigger_role: string | null;
  recipients: unknown;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderHistoryEntry {
  id: string;
  rule_id: string;
  entity_id: string;
  entity_type: string;
  sent_at: string;
  sent_to: unknown;
  status: string;
}

interface CreateRuleParams {
  name: string;
  entity_type: string;
  trigger_status: string;
  delay_hours: number;
  action_type: string;
  trigger_role?: string;
  recipients: string[];
  description?: string;
}

interface UpdateRuleParams {
  id: string;
  name?: string;
  trigger_status?: string;
  delay_hours?: number;
  action_type?: string;
  trigger_role?: string;
  recipients?: string[];
  description?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useReminderRules() {
  const queryClient = useQueryClient();

  const {
    data: rules = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ReminderRule[]>({
    queryKey: ['reminder-rules'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('reminder_rules')
        .select('*')
        .order('entity_type', { ascending: true });

      if (error) throw error;
      return (data || []) as ReminderRule[];
    },
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery<ReminderHistoryEntry[]>({
    queryKey: ['reminder-history'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('reminder_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ReminderHistoryEntry[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (params: CreateRuleParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabaseAny
        .from('reminder_rules')
        .insert({
          ...params,
          trigger_role: params.trigger_role || null,
          description: params.description || null,
          created_by: userData.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReminderRule;
    },
    onSuccess: () => {
      toast.success('Règle de relance créée');
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la création', { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: UpdateRuleParams) => {
      const { id, ...updates } = params;
      const { error } = await supabaseAny
        .from('reminder_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Règle de relance mise à jour');
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la mise à jour', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabaseAny
        .from('reminder_rules')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data: unknown, variables: { id: string; is_active: boolean }) => {
      toast.success(variables.is_active ? 'Règle activée' : 'Règle désactivée');
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors du changement de statut', { description: err.message });
    },
  });

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter((r) => r.is_active).length,
    remindersSentToday: history.filter((h) => h.sent_at.startsWith(today)).length,
  };

  return {
    rules,
    history,
    stats,
    isLoading,
    isLoadingHistory,
    error: error as Error | null,
    refetch,
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
}
