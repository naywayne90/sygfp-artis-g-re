import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TYPES_NOTIFICATION = [
  { value: "validation", label: "Demande de validation" },
  { value: "rejet", label: "Rejet" },
  { value: "differe", label: "Différé" },
  { value: "piece_manquante", label: "Pièce manquante" },
  { value: "alerte", label: "Alerte" },
  { value: "info", label: "Information" },
  { value: "echeance", label: "Échéance" },
  { value: "budget_insuffisant", label: "Budget insuffisant" },
  { value: "assignation", label: "Assignation" },
  { value: "roadmap_soumission", label: "Feuille de route soumise" },
  { value: "roadmap_validation", label: "Feuille de route validée" },
  { value: "roadmap_rejet", label: "Feuille de route rejetée" },
  { value: "tache_bloquee", label: "Tâche bloquée" },
  { value: "tache_retard", label: "Tâche en retard" },
  { value: "dossier_a_valider", label: "Dossier à valider" },
];

export interface Notification {
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
}

export function useNotifications() {
  const queryClient = useQueryClient();

  // Récupérer les notifications de l'utilisateur
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Notifications non lues
  const unreadCount = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
  });

  // Marquer comme lue
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // Marquer toutes comme lues
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success("Toutes les notifications marquées comme lues");
    },
  });

  // Créer une notification (usage interne)
  const createNotification = async ({
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    isUrgent = false,
  }: {
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    isUrgent?: boolean;
  }) => {
    const { error } = await supabase.from("notifications").insert([{
      user_id: userId,
      type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      is_urgent: isUrgent,
    }]);
    if (error) {
      console.error("Erreur création notification:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
}

// Hook pour envoyer des notifications depuis les workflows
export function useNotificationSender() {
  const { createNotification } = useNotifications();

  const notifyValidation = async (userId: string, entityType: string, entityId: string, entityNumero: string) => {
    await createNotification({
      userId,
      type: "validation",
      title: `${entityType} à valider`,
      message: `Le ${entityType} ${entityNumero} nécessite votre validation.`,
      entityType,
      entityId,
    });
  };

  const notifyRejet = async (userId: string, entityType: string, entityId: string, entityNumero: string, motif: string) => {
    await createNotification({
      userId,
      type: "rejet",
      title: `${entityType} rejeté`,
      message: `Le ${entityType} ${entityNumero} a été rejeté. Motif: ${motif}`,
      entityType,
      entityId,
      isUrgent: true,
    });
  };

  const notifyDiffere = async (userId: string, entityType: string, entityId: string, entityNumero: string, motif: string, deadline: string) => {
    await createNotification({
      userId,
      type: "differe",
      title: `${entityType} différé`,
      message: `Le ${entityType} ${entityNumero} a été différé jusqu'au ${deadline}. Motif: ${motif}`,
      entityType,
      entityId,
    });
  };

  const notifyPieceManquante = async (userId: string, entityType: string, entityId: string, entityNumero: string, piece: string) => {
    await createNotification({
      userId,
      type: "piece_manquante",
      title: "Pièce manquante",
      message: `Le ${entityType} ${entityNumero} nécessite: ${piece}`,
      entityType,
      entityId,
      isUrgent: true,
    });
  };

  return {
    notifyValidation,
    notifyRejet,
    notifyDiffere,
    notifyPieceManquante,
  };
}
