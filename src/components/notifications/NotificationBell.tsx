import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  validation: "🔔",
  rejet: "❌",
  differe: "⏳",
  piece_manquante: "📎",
  alerte: "⚠️",
  info: "ℹ️",
  echeance: "📅",
};

const TYPE_COLORS: Record<string, string> = {
  validation: "bg-blue-100 border-blue-200",
  rejet: "bg-red-100 border-red-200",
  differe: "bg-yellow-100 border-yellow-200",
  piece_manquante: "bg-orange-100 border-orange-200",
  alerte: "bg-amber-100 border-amber-200",
  info: "bg-gray-100 border-gray-200",
  echeance: "bg-purple-100 border-purple-200",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recentNotifications = notifications.data?.slice(0, 10) || [];

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  const getEntityUrl = (entityType: string | null, entityId: string | null) => {
    if (!entityType || !entityId) return null;
    const routes: Record<string, string> = {
      note: "/notes",
      engagement: "/engagements",
      liquidation: "/liquidations",
      ordonnancement: "/ordonnancements",
      expression_besoin: "/execution/expression-besoin",
    };
    return routes[entityType] || null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {(unreadCount.data || 0) > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive"
          >
            {unreadCount.data! > 9 ? "9+" : unreadCount.data}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {(unreadCount.data || 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Tout lire
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => {
                  const url = getEntityUrl(notification.entity_type, notification.entity_id);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notification.is_read && "bg-muted/30",
                        TYPE_COLORS[notification.type] || ""
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl">{TYPE_ICONS[notification.type] || "📌"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm", !notification.is_read && "font-medium")}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), "dd MMM HH:mm", { locale: fr })}
                            </span>
                            {url && (
                              <Link
                                to={url}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Voir <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t">
            <Link to="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-sm">
                Voir toutes les notifications
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
