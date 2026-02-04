/**
 * Hook de notifications amélioré
 * Abonnement Realtime, filtres par type, compteurs par catégorie
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationMetadata {
  reference?: string;
  montant?: number;
  montant_net?: number;
  montant_deja_regle?: number;
  montant_restant?: number;
  montant_reglement_courant?: number;
  fournisseur?: string;
  direction?: string;
  objet?: string;
  mode_paiement?: string;
  banque?: string;
  date?: string;
  validateur?: string;
  motif?: string;
  is_partial?: boolean;
}

export interface EnhancedNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  is_urgent: boolean;
  read_at: string | null;
  created_at: string;
  category?: string | null;
  metadata?: NotificationMetadata | null;
}

export type NotificationCategory = 'ordonnancements' | 'reglements' | 'autres';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface NotificationFilters {
  type?: string;
  category?: NotificationCategory;
  isRead?: boolean;
  isUrgent?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UseNotificationsEnhancedOptions {
  enableRealtime?: boolean;
  showToasts?: boolean;
  playSound?: boolean;
  limit?: number;
}

export interface CountByCategory {
  ordonnancements: number;
  reglements: number;
  autres: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

const CATEGORY_TYPES: Record<NotificationCategory, string[]> = {
  ordonnancements: ['ordonnancement'],
  reglements: ['reglement', 'reglement_partiel'],
  autres: [], // Calculé dynamiquement
};

// ============================================================================
// HELPER: Catégoriser une notification
// ============================================================================

function getNotificationCategory(type: string): NotificationCategory {
  if (CATEGORY_TYPES.ordonnancements.includes(type)) return 'ordonnancements';
  if (CATEGORY_TYPES.reglements.includes(type)) return 'reglements';
  return 'autres';
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNotificationsEnhanced(options?: UseNotificationsEnhancedOptions) {
  const {
    enableRealtime = true,
    showToasts = true,
    playSound = false,
    limit = 100,
  } = options || {};

  const { userId } = usePermissions();
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Récupérer les notifications
  // ────────────────────────────────────────────────────────────────────────────

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<EnhancedNotification[]>({
    queryKey: ['notifications-enhanced', userId, limit],
    queryFn: async (): Promise<EnhancedNotification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Mapper les données vers le type EnhancedNotification
      // Note: metadata n'existe pas encore dans la table, on le met à null
      return (data || []).map((n) => ({
        ...n,
        is_read: n.is_read ?? false,
        is_urgent: n.is_urgent ?? false,
        metadata: null,
      })) as EnhancedNotification[];
    },
    enabled: !!userId,
    staleTime: 10000,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Compter les non lues
  // ────────────────────────────────────────────────────────────────────────────

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count-enhanced', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // COMPUTED: Compteurs par catégorie
  // ────────────────────────────────────────────────────────────────────────────

  const countByCategory = useMemo<CountByCategory>(() => {
    const counts = { ordonnancements: 0, reglements: 0, autres: 0 };
    notifications.forEach((n) => {
      const category = getNotificationCategory(n.type);
      counts[category]++;
    });
    return counts;
  }, [notifications]);

  // ────────────────────────────────────────────────────────────────────────────
  // COMPUTED: Compteurs non lus par catégorie
  // ────────────────────────────────────────────────────────────────────────────

  const unreadByCategory = useMemo<CountByCategory>(() => {
    const counts = { ordonnancements: 0, reglements: 0, autres: 0 };
    notifications.filter((n) => !n.is_read).forEach((n) => {
      const category = getNotificationCategory(n.type);
      counts[category]++;
    });
    return counts;
  }, [notifications]);

  // ────────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ────────────────────────────────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });
    },
  });

  const clearReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
      toast.success('Notifications lues supprimées');
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REALTIME SUBSCRIPTION
  // ────────────────────────────────────────────────────────────────────────────

  const handleNewNotification = useCallback(
    (payload: RealtimePostgresChangesPayload<EnhancedNotification>) => {
      const newNotification = payload.new as EnhancedNotification;

      queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });

      if (showToasts && newNotification.title) {
        const toastOptions = {
          description: newNotification.message,
          duration: newNotification.is_urgent ? 10000 : 5000,
        };

        if (newNotification.is_urgent) {
          toast.error(newNotification.title, toastOptions);
        } else {
          toast(newNotification.title, toastOptions);
        }
      }

      if (playSound) {
        try {
          const audio = new Audio(NOTIFICATION_SOUND_URL);
          audio.play().catch(() => {
            // Ignorer les erreurs autoplay
          });
        } catch {
          // Ignorer les erreurs audio
        }
      }
    },
    [queryClient, showToasts, playSound]
  );

  useEffect(() => {
    if (!enableRealtime || !userId) {
      setRealtimeStatus('disconnected');
      return;
    }

    setRealtimeStatus('connecting');

    const channel: RealtimeChannel = supabase
      .channel(`notifications-enhanced:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleNewNotification
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications-enhanced'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-enhanced'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
      setRealtimeStatus('disconnected');
    };
  }, [enableRealtime, userId, queryClient, handleNewNotification]);

  // ────────────────────────────────────────────────────────────────────────────
  // FILTRAGE
  // ────────────────────────────────────────────────────────────────────────────

  const filterNotifications = useCallback(
    (filters: NotificationFilters): EnhancedNotification[] => {
      let result = notifications;

      if (filters.type) {
        result = result.filter((n) => n.type === filters.type);
      }

      if (filters.category) {
        const categoryTypes = CATEGORY_TYPES[filters.category];
        if (categoryTypes.length > 0) {
          result = result.filter((n) => categoryTypes.includes(n.type));
        } else {
          // Catégorie "autres" = tout ce qui n'est pas dans les catégories définies
          const excludedTypes = [...CATEGORY_TYPES.ordonnancements, ...CATEGORY_TYPES.reglements];
          result = result.filter((n) => !excludedTypes.includes(n.type));
        }
      }

      if (filters.isRead !== undefined) {
        result = result.filter((n) => n.is_read === filters.isRead);
      }

      if (filters.isUrgent !== undefined) {
        result = result.filter((n) => n.is_urgent === filters.isUrgent);
      }

      if (filters.startDate) {
        const startDate = filters.startDate;
        result = result.filter((n) => new Date(n.created_at) >= startDate);
      }

      if (filters.endDate) {
        const endDate = filters.endDate;
        result = result.filter((n) => new Date(n.created_at) <= endDate);
      }

      return result;
    },
    [notifications]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────────────────────────────────────

  return {
    // Data
    notifications,
    unreadCount,
    countByCategory,
    unreadByCategory,

    // Status
    isLoading,
    error: error as Error | null,
    realtimeStatus,

    // Actions
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    clearReadNotifications: clearReadMutation.mutateAsync,
    refetch,

    // Filtrage
    filterNotifications,

    // Helpers
    getNotificationCategory,
  };
}

export default useNotificationsEnhanced;
