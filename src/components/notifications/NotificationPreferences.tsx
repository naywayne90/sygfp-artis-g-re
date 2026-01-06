import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TYPES_NOTIFICATION } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings, Bell, Mail } from "lucide-react";

interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
}

export function NotificationPreferences() {
  const queryClient = useQueryClient();

  // Récupérer les préférences
  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        notification_type: p.notification_type || "",
        in_app_enabled: p.in_app_enabled ?? true,
        email_enabled: p.email_enabled ?? false,
      })) as NotificationPreference[];
    },
  });

  // Mettre à jour une préférence
  const updatePreference = useMutation({
    mutationFn: async ({ type, field, value }: { type: string; field: "in_app_enabled" | "email_enabled"; value: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier si la préférence existe
      const existing = preferences.data?.find(p => p.notification_type === type);
      
      if (existing) {
        const { error } = await supabase
          .from("notification_preferences")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert([{
            user_id: user.id,
            notification_type: type,
            in_app_enabled: field === "in_app_enabled" ? value : true,
            email_enabled: field === "email_enabled" ? value : false,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Préférences mises à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Activer/désactiver toutes les notifications
  const toggleAll = useMutation({
    mutationFn: async ({ field, value }: { field: "in_app_enabled" | "email_enabled"; value: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      for (const type of TYPES_NOTIFICATION) {
        const existing = preferences.data?.find(p => p.notification_type === type.value);
        
        if (existing) {
          await supabase
            .from("notification_preferences")
            .update({ [field]: value })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("notification_preferences")
            .insert([{
              user_id: user.id,
              notification_type: type.value,
              in_app_enabled: field === "in_app_enabled" ? value : true,
              email_enabled: field === "email_enabled" ? value : false,
            }]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Toutes les préférences mises à jour");
    },
  });

  const getPreference = (type: string, field: "in_app_enabled" | "email_enabled") => {
    const pref = preferences.data?.find(p => p.notification_type === type);
    if (field === "in_app_enabled") return pref?.in_app_enabled ?? true;
    return pref?.email_enabled ?? false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Préférences de notifications
        </CardTitle>
        <CardDescription>
          Configurez comment vous souhaitez recevoir les notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll.mutate({ field: "in_app_enabled", value: true })}
          >
            <Bell className="h-4 w-4 mr-2" />
            Activer toutes (in-app)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll.mutate({ field: "email_enabled", value: true })}
          >
            <Mail className="h-4 w-4 mr-2" />
            Activer toutes (email)
          </Button>
        </div>

        {preferences.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type de notification</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4" />
                    In-app
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TYPES_NOTIFICATION.map((type) => (
                <TableRow key={type.value}>
                  <TableCell className="font-medium">{type.label}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={getPreference(type.value, "in_app_enabled")}
                      onCheckedChange={(checked) => 
                        updatePreference.mutate({ type: type.value, field: "in_app_enabled", value: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={getPreference(type.value, "email_enabled")}
                      onCheckedChange={(checked) => 
                        updatePreference.mutate({ type: type.value, field: "email_enabled", value: checked })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
