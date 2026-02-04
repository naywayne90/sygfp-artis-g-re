/**
 * Hook de notifications avec abonnement Realtime Supabase
 * Met à jour automatiquement la liste des notifications en temps réel
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  is_urgent: boolean;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export type NotificationType =
  | 'validation'
  | 'rejet'
  | 'differe'
  | 'piece_manquante'
  | 'alerte'
  | 'info'
  | 'echeance'
  | 'budget_insuffisant'
  | 'assignation'
  | 'roadmap_soumission'
  | 'roadmap_validation'
  | 'roadmap_rejet'
  | 'tache_bloquee'
  | 'tache_retard'
  | 'dossier_a_valider'
  | 'note_validee'
  | 'note_rejetee';

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  isUrgent?: boolean;
  limit?: number;
}

export interface UseNotificationsRealtimeOptions {
  /** Activer l'abonnement Realtime */
  enableRealtime?: boolean;
  /** Afficher un toast pour les nouvelles notifications */
  showToasts?: boolean;
  /** Jouer un son pour les notifications urgentes */
  playSound?: boolean;
  /** Nombre max de notifications à charger */
  limit?: number;
}

export interface UseNotificationsRealtimeReturn {
  /** Liste des notifications */
  notifications: Notification[];
  /** Nombre de notifications non lues */
  unreadCount: number;
  /** En chargement */
  isLoading: boolean;
  /** Erreur */
  error: Error | null;
  /** Marquer une notification comme lue */
  markAsRead: (id: string) => Promise<void>;
  /** Marquer toutes comme lues */
  markAllAsRead: () => Promise<void>;
  /** Supprimer une notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Supprimer les notifications lues */
  clearReadNotifications: () => Promise<void>;
  /** Rafraîchir manuellement */
  refetch: () => void;
  /** Statut de la connexion Realtime */
  realtimeStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const NOTIFICATION_SOUNDS = {
  default: '/sounds/notification.mp3',
  urgent: '/sounds/notification-urgent.mp3',
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNotificationsRealtime(
  options?: UseNotificationsRealtimeOptions
): UseNotificationsRealtimeReturn {
  const {
    enableRealtime = true,
    showToasts = true,
    playSound = false,
    limit = 50,
  } = options || {};

  const { userId } = usePermissions();
  const queryClient = useQueryClient();

  const [realtimeStatus, setRealtimeStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Récupérer les notifications
  // ────────────────────────────────────────────────────────────────────────────

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications-realtime', userId, limit],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!userId,
    staleTime: 10000, // 10 secondes
  });

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY: Compter les non lues
  // ────────────────────────────────────────────────────────────────────────────

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count-realtime', userId],
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
      queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
      toast.success('Notifications lues supprimées');
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REALTIME SUBSCRIPTION
  // ────────────────────────────────────────────────────────────────────────────

  const handleNewNotification = useCallback(
    (payload: RealtimePostgresChangesPayload<Notification>) => {
      const newNotification = payload.new as Notification;

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });

      // Afficher un toast
      if (showToasts && newNotification.title) {
        toast(newNotification.title, {
          description: newNotification.message,
          duration: newNotification.is_urgent ? 10000 : 5000,
          action: newNotification.is_urgent
            ? {
                label: 'Voir',
                onClick: () => {
                  // La navigation est gérée par le composant NotificationDropdown
                },
              }
            : undefined,
        });
      }

      // Jouer un son
      if (playSound) {
        try {
          const soundUrl = newNotification.is_urgent
            ? NOTIFICATION_SOUNDS.urgent
            : NOTIFICATION_SOUNDS.default;
          const audio = new Audio(soundUrl);
          audio.play().catch(() => {
            // Ignorer les erreurs de lecture audio (autoplay bloqué)
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
      .channel(`notifications:${userId}`)
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
          // Rafraîchir quand une notification est mise à jour
          queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });
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
          queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count-realtime'] });
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
  // RETURN
  // ────────────────────────────────────────────────────────────────────────────

  return {
    notifications,
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAsRead: async (id: string) => {
      await markAsReadMutation.mutateAsync(id);
    },
    markAllAsRead: async () => {
      await markAllAsReadMutation.mutateAsync();
    },
    deleteNotification: async (id: string) => {
      await deleteNotificationMutation.mutateAsync(id);
    },
    clearReadNotifications: async () => {
      await clearReadMutation.mutateAsync();
    },
    refetch,
    realtimeStatus,
  };
}

// ============================================================================
// HOOK POUR CRÉER DES NOTIFICATIONS
// ============================================================================

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isUrgent?: boolean;
  metadata?: Record<string, unknown>;
}

export function useCreateNotification() {
  return useMutation({
    mutationFn: async (params: CreateNotificationParams) => {
      const { error } = await supabase.from('notifications').insert([
        {
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          entity_type: params.entityType,
          entity_id: params.entityId,
          is_urgent: params.isUrgent || false,
          metadata: params.metadata,
        },
      ]);
      if (error) throw error;
    },
    onError: (error) => {
      console.error('[useCreateNotification] Erreur:', error);
    },
  });
}

export default useNotificationsRealtime;
