/**
 * NotificationCenter - Centre de notifications enrichi
 * Onglets par catégorie, filtres avancés, actions groupées
 */

import { useState, useMemo } from 'react';
import { format, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  CheckCheck,
  FileCheck,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
  Filter,
  Calendar,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

import { NotificationCard, type NotificationData } from './NotificationCard';
import { useNotificationsEnhanced, type NotificationCategory } from '@/hooks/useNotificationsEnhanced';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationCenterProps {
  /** Classe CSS additionnelle */
  className?: string;
  /** Afficher les préférences */
  showPreferences?: boolean;
  /** Hauteur maximale (scroll) */
  maxHeight?: number | string;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type ReadFilter = 'all' | 'unread' | 'read';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG: Record<NotificationCategory | 'all', { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'Toutes', icon: <Bell className="h-4 w-4" />, color: '' },
  ordonnancements: { label: 'Ordonnancements', icon: <FileCheck className="h-4 w-4" />, color: 'text-blue-600' },
  reglements: { label: 'Règlements', icon: <CreditCard className="h-4 w-4" />, color: 'text-green-600' },
  autres: { label: 'Autres', icon: <MoreHorizontal className="h-4 w-4" />, color: 'text-muted-foreground' },
};

// ============================================================================
// COMPOSANT
// ============================================================================

export function NotificationCenter({
  className,
  showPreferences = true,
  maxHeight = 600,
}: NotificationCenterProps) {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const {
    notifications,
    countByCategory,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    realtimeStatus,
  } = useNotificationsEnhanced();

  // Filtrer les notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Filtre par catégorie
    if (activeCategory !== 'all') {
      const categoryTypes: Record<NotificationCategory, string[]> = {
        ordonnancements: ['ordonnancement'],
        reglements: ['reglement', 'reglement_partiel'],
        autres: [], // Tout ce qui n'est pas dans les catégories précédentes
      };

      if (activeCategory === 'autres') {
        const excludedTypes = [...categoryTypes.ordonnancements, ...categoryTypes.reglements];
        result = result.filter((n) => !excludedTypes.includes(n.type));
      } else {
        result = result.filter((n) => categoryTypes[activeCategory].includes(n.type));
      }
    }

    // Filtre par lu/non-lu
    if (readFilter === 'unread') {
      result = result.filter((n) => !n.is_read);
    } else if (readFilter === 'read') {
      result = result.filter((n) => n.is_read);
    }

    // Filtre par date
    const today = startOfDay(new Date());
    if (dateFilter === 'today') {
      result = result.filter((n) => isAfter(new Date(n.created_at), today));
    } else if (dateFilter === 'week') {
      result = result.filter((n) => isAfter(new Date(n.created_at), subDays(today, 7)));
    } else if (dateFilter === 'month') {
      result = result.filter((n) => isAfter(new Date(n.created_at), subDays(today, 30)));
    } else if (dateFilter === 'custom' && customDateRange.from) {
      result = result.filter((n) => {
        const date = new Date(n.created_at);
        const afterFrom = customDateRange.from ? isAfter(date, startOfDay(customDateRange.from)) : true;
        const beforeTo = customDateRange.to ? isBefore(date, startOfDay(customDateRange.to)) : true;
        return afterFrom && beforeTo;
      });
    }

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search)
      );
    }

    return result;
  }, [notifications, activeCategory, readFilter, dateFilter, customDateRange, searchTerm]);

  // Stats par catégorie
  const categoryStats = useMemo(() => ({
    all: notifications.length,
    ordonnancements: countByCategory.ordonnancements,
    reglements: countByCategory.reglements,
    autres: countByCategory.autres,
  }), [notifications.length, countByCategory]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Centre de notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {filteredNotifications.length} notification(s)
              {/* Indicateur Realtime */}
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                )}
                title={`Realtime: ${realtimeStatus}`}
              />
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => markAllAsRead()} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => clearReadNotifications()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer les lues
                </DropdownMenuItem>
                {showPreferences && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/notifications">
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Onglets par catégorie */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as NotificationCategory | 'all')}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {(Object.keys(CATEGORY_CONFIG) as (NotificationCategory | 'all')[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = categoryStats[cat];
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs gap-1">
                  <span className={config.color}>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3" /> Toutes
                  </span>
                </SelectItem>
                <SelectItem value="unread">
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Non lues
                  </span>
                </SelectItem>
                <SelectItem value="read">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Lues
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-[130px] h-9">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="custom">Personnalisé...</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    {customDateRange.from
                      ? `${format(customDateRange.from, 'dd/MM')} - ${customDateRange.to ? format(customDateRange.to, 'dd/MM') : '...'}`
                      : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Contenu par onglet */}
          {(Object.keys(CATEGORY_CONFIG) as (NotificationCategory | 'all')[]).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              <ScrollArea style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}>
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune notification</p>
                    <p className="text-sm mt-1">
                      {searchTerm || readFilter !== 'all' || dateFilter !== 'all'
                        ? 'Essayez de modifier vos filtres'
                        : 'Vous êtes à jour !'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {filteredNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification as NotificationData}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default NotificationCenter;
