import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  ExternalLink, 
  FileText, 
  CreditCard,
  Receipt,
  FileCheck,
  AlertTriangle,
  Clock,
  User,
  Banknote,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  validation: <Bell className="h-4 w-4 text-primary" />,
  rejet: <X className="h-4 w-4 text-destructive" />,
  differe: <Clock className="h-4 w-4 text-warning" />,
  piece_manquante: <FileText className="h-4 w-4 text-orange-500" />,
  alerte: <AlertTriangle className="h-4 w-4 text-warning" />,
  info: <Bell className="h-4 w-4 text-muted-foreground" />,
  echeance: <Clock className="h-4 w-4 text-purple-500" />,
  budget_insuffisant: <Banknote className="h-4 w-4 text-destructive" />,
  assignation: <User className="h-4 w-4 text-primary" />,
};

const TYPE_COLORS: Record<string, string> = {
  validation: "bg-primary/10 border-primary/20",
  rejet: "bg-destructive/10 border-destructive/20",
  differe: "bg-warning/10 border-warning/20",
  piece_manquante: "bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
  alerte: "bg-warning/10 border-warning/20",
  info: "bg-muted border-muted",
  echeance: "bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
  budget_insuffisant: "bg-destructive/10 border-destructive/20",
  assignation: "bg-primary/10 border-primary/20",
};

const ENTITY_ROUTES: Record<string, string> = {
  note: "/notes-aef",
  note_aef: "/notes-aef",
  notes_dg: "/notes-aef",
  note_sef: "/notes-sef",
  notes_sef: "/notes-sef",
  engagement: "/engagements",
  budget_engagements: "/engagements",
  liquidation: "/liquidations",
  budget_liquidations: "/liquidations",
  ordonnancement: "/ordonnancements",
  ordonnancements: "/ordonnancements",
  expression_besoin: "/execution/expression-besoin",
  expressions_besoin: "/execution/expression-besoin",
  imputation: "/execution/imputation",
  imputations: "/execution/imputation",
  marche: "/marches",
  marches: "/marches",
  dossier: "/recherche",
  dossiers: "/recherche",
  reglement: "/reglements",
  reglements: "/reglements",
  virement: "/planification/virements",
  credit_transfers: "/planification/virements",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    // Naviguer vers l'entité si possible
    if (notification.entity_type && notification.entity_id) {
      const route = ENTITY_ROUTES[notification.entity_type];
      if (route) {
        navigate(`${route}?id=${notification.entity_id}`);
        setOpen(false);
      }
    }
  };

  const getEntityUrl = (entityType: string | null, entityId: string | null) => {
    if (!entityType || !entityId) return null;
    const route = ENTITY_ROUTES[entityType];
    return route ? `${route}?id=${entityId}` : null;
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
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive animate-pulse"
          >
            {unreadCount.data! > 9 ? "9+" : unreadCount.data}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[400px] bg-background border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {(unreadCount.data || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount.data} non lue{(unreadCount.data || 0) > 1 ? "s" : ""}
                </Badge>
              )}
            </h3>
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

          <ScrollArea className="max-h-[450px]">
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
                        "p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-4",
                        !notification.is_read && "bg-muted/30",
                        TYPE_COLORS[notification.type] || "border-muted"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          {TYPE_ICONS[notification.type] || <Bell className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm leading-tight", !notification.is_read && "font-medium")}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                            {url && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                Voir <ExternalLink className="h-3 w-3" />
                              </span>
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

          <div className="p-2 border-t bg-muted/30">
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
