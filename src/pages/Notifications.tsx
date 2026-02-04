/**
 * Page Notifications - Centre de notifications enrichi
 * Intègre NotificationCenter avec onglets par catégorie et filtres avancés
 */

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useNotificationsEnhanced } from "@/hooks/useNotificationsEnhanced";
import { Bell, Settings } from "lucide-react";

export default function Notifications() {
  const { unreadCount } = useNotificationsEnhanced();

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
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationCenter maxHeight={700} showPreferences={false} />
        </TabsContent>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
