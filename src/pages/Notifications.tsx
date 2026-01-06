import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { Bell, CheckCheck, Settings, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

const TYPE_LABELS: Record<string, string> = {
  validation: "Validation",
  rejet: "Rejet",
  differe: "Différé",
  piece_manquante: "Pièce manquante",
  alerte: "Alerte",
  info: "Information",
  echeance: "Échéance",
};

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.data?.filter(n => {
    if (filter === "unread") return !n.is_read;
    return true;
  }) || [];

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <p className="page-description">
          Centre de notifications et préférences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {(unreadCount.data || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount.data}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Toutes les notifications</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                >
                  Non lues ({unreadCount.data || 0})
                </Button>
                {(unreadCount.data || 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune notification {filter === "unread" ? "non lue" : ""}</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors",
                          !notification.is_read ? "bg-muted/30 border-primary/20" : "hover:bg-muted/20"
                        )}
                      >
                        <div className="flex gap-4">
                          <span className="text-2xl">{TYPE_ICONS[notification.type] || "📌"}</span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className={cn("font-medium", !notification.is_read && "font-semibold")}>
                                    {notification.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {TYPE_LABELS[notification.type] || notification.type}
                                  </Badge>
                                  {!notification.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(notification.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                                </span>
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                  >
                                    Marquer comme lu
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
