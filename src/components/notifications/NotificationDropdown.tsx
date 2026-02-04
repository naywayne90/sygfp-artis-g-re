/**
 * NotificationDropdown - Dropdown de notifications pour le header
 * Badge avec compteur, liste compacte, lien vers le centre complet
 * Intégré avec useNotificationsEnhanced pour le Realtime
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Settings,
  Volume2,
  VolumeX,
  CheckCheck,
  X,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { NotificationCard, type NotificationData } from './NotificationCard';
import { useNotificationsEnhanced } from '@/hooks/useNotificationsEnhanced';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationDropdownProps {
  /** Classe CSS additionnelle */
  className?: string;
  /** Nombre max de notifications à afficher */
  maxItems?: number;
  /** Afficher le bouton son */
  showSoundToggle?: boolean;
}

// ============================================================================
// COMPOSANT: NotificationBell (Badge avec compteur pour le header)
// ============================================================================

export function NotificationBell({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const { unreadCount, realtimeStatus } = useNotificationsEnhanced({
    enableRealtime: true,
    showToasts: false,
    limit: 1,
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      aria-label="Notifications"
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center animate-pulse"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
      {/* Indicateur Realtime */}
      <span
        className={cn(
          'absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background',
          realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
    </Button>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL: NotificationDropdown
// ============================================================================

export function NotificationDropdown({
  className,
  maxItems = 5,
  showSoundToggle = true,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    realtimeStatus,
  } = useNotificationsEnhanced({
    enableRealtime: true,
    showToasts: true,
    playSound: soundEnabled,
    limit: maxItems + 5,
  });

  const displayedNotifications = notifications.slice(0, maxItems);
  const hasMore = notifications.length > maxItems;

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/admin/notifications');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Indicateur Realtime */}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background',
              realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Indicateur Realtime */}
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                realtimeStatus === 'connected'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : realtimeStatus === 'connecting'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              )}
              title={`Realtime: ${realtimeStatus}`}
            >
              {realtimeStatus === 'connected' ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
            </div>

            {showSoundToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSettings}
              title="Paramètres"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="max-h-[450px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune notification</p>
              <p className="text-sm mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {displayedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification as NotificationData}
                  onClick={handleNotificationClick}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  compact
                  showActions={false}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tout lire
              </Button>
            )}
            {notifications.some((n) => n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => clearReadNotifications()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Vider les lues
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 flex items-center gap-1"
            onClick={handleViewAll}
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Indicateur de plus de notifications */}
        {hasMore && (
          <div className="px-4 pb-2 text-center border-t">
            <Link
              to="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              +{notifications.length - maxItems} autres notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationDropdown;
