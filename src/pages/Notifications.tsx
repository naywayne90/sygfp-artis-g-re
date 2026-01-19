import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { 
  Bell, 
  CheckCheck, 
  Settings, 
  Trash2, 
  ExternalLink,
  Clock,
  AlertTriangle,
  FileText,
  X,
  User,
  Banknote,
  Filter,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  validation: <Bell className="h-5 w-5 text-primary" />,
  rejet: <X className="h-5 w-5 text-destructive" />,
  differe: <Clock className="h-5 w-5 text-warning" />,
  piece_manquante: <FileText className="h-5 w-5 text-orange-500" />,
  alerte: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Bell className="h-5 w-5 text-muted-foreground" />,
  echeance: <Clock className="h-5 w-5 text-purple-500" />,
  budget_insuffisant: <Banknote className="h-5 w-5 text-destructive" />,
  assignation: <User className="h-5 w-5 text-primary" />,
  roadmap_soumission: <FileText className="h-5 w-5 text-indigo-500" />,
  roadmap_validation: <CheckCheck className="h-5 w-5 text-green-500" />,
  roadmap_rejet: <X className="h-5 w-5 text-destructive" />,
  tache_bloquee: <AlertTriangle className="h-5 w-5 text-red-500" />,
  tache_retard: <Clock className="h-5 w-5 text-orange-600" />,
  dossier_a_valider: <FileText className="h-5 w-5 text-primary" />,
};

const TYPE_LABELS: Record<string, string> = {
  validation: "Validation",
  rejet: "Rejet",
  differe: "Différé",
  piece_manquante: "Pièce manquante",
  alerte: "Alerte",
  info: "Information",
  echeance: "Échéance",
  budget_insuffisant: "Budget insuffisant",
  assignation: "Assignation",
  roadmap_soumission: "Feuille de route soumise",
  roadmap_validation: "Feuille de route validée",
  roadmap_rejet: "Feuille de route rejetée",
  tache_bloquee: "Tâche bloquée",
  tache_retard: "Tâche en retard",
  dossier_a_valider: "Dossier à valider",
};

const TYPE_COLORS: Record<string, string> = {
  validation: "bg-primary/10 border-primary/20 text-primary",
  rejet: "bg-destructive/10 border-destructive/20 text-destructive",
  differe: "bg-warning/10 border-warning/20 text-warning",
  piece_manquante: "bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
  alerte: "bg-warning/10 border-warning/20 text-warning",
  info: "bg-muted border-muted text-muted-foreground",
  echeance: "bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400",
  budget_insuffisant: "bg-destructive/10 border-destructive/20 text-destructive",
  assignation: "bg-primary/10 border-primary/20 text-primary",
  roadmap_soumission: "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400",
  roadmap_validation: "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
  roadmap_rejet: "bg-destructive/10 border-destructive/20 text-destructive",
  tache_bloquee: "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
  tache_retard: "bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
  dossier_a_valider: "bg-primary/10 border-primary/20 text-primary",
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
  roadmap_submission: "/planification/soumissions-feuilles-route",
  task_execution: "/planification/execution-physique",
};

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const navigate = useNavigate();

  const filteredNotifications = notifications.data?.filter(n => {
    if (filter === "unread" && n.is_read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  }) || [];

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.entity_type && notification.entity_id) {
      const route = ENTITY_ROUTES[notification.entity_type];
      if (route) {
        navigate(`${route}?id=${notification.entity_id}`);
      }
    }
  };

  // Statistiques par type
  const typeStats = notifications.data?.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

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

        <TabsContent value="notifications" className="space-y-4">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(TYPE_LABELS).slice(0, 6).map(([type, label]) => (
              <Card 
                key={type} 
                className={cn(
                  "cursor-pointer transition-all hover:scale-105",
                  typeFilter === type && "ring-2 ring-primary"
                )}
                onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  {TYPE_ICONS[type]}
                  <div>
                    <p className="text-lg font-bold">{typeStats[type] || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Toutes les notifications</CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                  {filter === "unread" && " non lue" + (filteredNotifications.length !== 1 ? "s" : "")}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                          "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                          !notification.is_read ? "bg-muted/30 border-primary/20" : "hover:bg-muted/20",
                          "border-l-4",
                          TYPE_COLORS[notification.type]?.split(" ")[0] || "border-l-muted"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            {TYPE_ICONS[notification.type] || <Bell className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={cn("font-medium", !notification.is_read && "font-semibold")}>
                                    {notification.title}
                                  </h3>
                                  <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[notification.type])}>
                                    {TYPE_LABELS[notification.type] || notification.type}
                                  </Badge>
                                  {!notification.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                  )}
                                  {notification.is_urgent && (
                                    <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="text-xs text-muted-foreground block">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/70 block">
                                    {format(new Date(notification.created_at), "dd MMM HH:mm", { locale: fr })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              {notification.entity_type && notification.entity_id && (
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  Voir le détail
                                </span>
                              )}
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="text-xs"
                                >
                                  Marquer comme lu
                                </Button>
                              )}
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
