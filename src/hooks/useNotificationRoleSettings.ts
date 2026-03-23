/**
 * Hook de gestion des paramètres de notification par rôle
 * CRUD pour notification_role_settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationRoleSetting {
  id: string;
  role_code: string;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface UpsertRoleSettingParams {
  role_code: string;
  notification_type: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  in_app_enabled?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNotificationRoleSettings() {
  const queryClient = useQueryClient();

  const {
    data: settings = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationRoleSetting[]>({
    queryKey: ['notification-role-settings'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('notification_role_settings')
        .select('*')
        .order('role_code', { ascending: true });

      if (error) throw error;
      return (data || []) as NotificationRoleSetting[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (params: UpsertRoleSettingParams) => {
      const { data, error } = await supabaseAny
        .from('notification_role_settings')
        .upsert(
          {
            role_code: params.role_code,
            notification_type: params.notification_type,
            email_enabled: params.email_enabled ?? true,
            sms_enabled: params.sms_enabled ?? false,
            in_app_enabled: params.in_app_enabled ?? true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'role_code,notification_type' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as NotificationRoleSetting;
    },
    onSuccess: () => {
      toast.success('Paramètre de notification mis à jour');
      queryClient.invalidateQueries({ queryKey: ['notification-role-settings'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la mise à jour', { description: err.message });
    },
  });

  // Helpers
  const getSettingsForRole = (roleCode: string): NotificationRoleSetting[] =>
    settings.filter((s) => s.role_code === roleCode);

  const getSettingsForType = (type: string): NotificationRoleSetting[] =>
    settings.filter((s) => s.notification_type === type);

  return {
    settings,
    isLoading,
    error: error as Error | null,
    refetch,
    upsertSetting: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    getSettingsForRole,
    getSettingsForType,
  };
}
