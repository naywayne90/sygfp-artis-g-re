import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

interface NotificationAutoParams {
  type: "validation" | "rejet" | "differe" | "piece_manquante" | "alerte" | "info" | "echeance" | "budget_insuffisant" | "assignation";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isUrgent?: boolean;
  recipientUserId?: string;
  recipientRole?: string;
}

/**
 * Service de notifications automatiques
 * Utilisé pour notifier les utilisateurs lors d'actions du workflow
 */
export function useNotificationsAuto() {
  const { exercice } = useExercice();

  /**
   * Crée une notification pour un utilisateur spécifique
   */
  const notifyUser = async ({
    type,
    title,
    message,
    entityType,
    entityId,
    isUrgent = false,
    recipientUserId,
  }: NotificationAutoParams) => {
    if (!recipientUserId) return;

    try {
      await supabase.from("notifications").insert({
        user_id: recipientUserId,
        type,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        is_urgent: isUrgent,
      });
    } catch (error) {
      console.error("Erreur création notification:", error);
    }
  };

  /**
   * Notifie tous les utilisateurs ayant un rôle spécifique
   */
  const notifyRole = async ({
    type,
    title,
    message,
    entityType,
    entityId,
    isUrgent = false,
    recipientRole,
  }: NotificationAutoParams) => {
    if (!recipientRole) return;

    try {
      // Récupérer les utilisateurs avec ce rôle - utilisation de type assertion pour le rôle
      const { data: users, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", recipientRole as any);

      if (error) throw error;

      // Créer une notification pour chaque utilisateur
      const notifications = users?.map((u) => ({
        user_id: u.user_id,
        type,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        is_urgent: isUrgent,
      })) || [];

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    } catch (error) {
      console.error("Erreur notification rôle:", error);
    }
  };

  /**
   * Notifications pour les validations
   */
  const onValidation = async (
    entityType: string,
    entityId: string,
    entityCode: string,
    creatorId: string
  ) => {
    await notifyUser({
      type: "validation",
      title: `${entityType} validé`,
      message: `Le ${entityType} ${entityCode} a été validé avec succès.`,
      entityType,
      entityId,
      recipientUserId: creatorId,
    });
  };

  /**
   * Notifications pour les rejets
   */
  const onRejet = async (
    entityType: string,
    entityId: string,
    entityCode: string,
    creatorId: string,
    motif: string
  ) => {
    await notifyUser({
      type: "rejet",
      title: `${entityType} rejeté`,
      message: `Le ${entityType} ${entityCode} a été rejeté. Motif: ${motif}`,
      entityType,
      entityId,
      isUrgent: true,
      recipientUserId: creatorId,
    });
  };

  /**
   * Notifications pour les soumissions (valideurs)
   */
  const onSoumission = async (
    entityType: string,
    entityId: string,
    entityCode: string,
    validatorRole: string
  ) => {
    await notifyRole({
      type: "validation",
      title: `${entityType} à valider`,
      message: `Le ${entityType} ${entityCode} nécessite votre validation.`,
      entityType,
      entityId,
      recipientRole: validatorRole,
    });
  };

  /**
   * Notifications pour les différés
   */
  const onDiffere = async (
    entityType: string,
    entityId: string,
    entityCode: string,
    creatorId: string,
    motif: string,
    deadline?: string
  ) => {
    await notifyUser({
      type: "differe",
      title: `${entityType} différé`,
      message: `Le ${entityType} ${entityCode} a été différé${deadline ? ` jusqu'au ${deadline}` : ""}. Motif: ${motif}`,
      entityType,
      entityId,
      recipientUserId: creatorId,
    });
  };

  /**
   * Notifications pour les alertes budgétaires
   */
  const onBudgetInsuffisant = async (
    ligneBudgetaireCode: string,
    montantDisponible: number,
    montantDemande: number
  ) => {
    await notifyRole({
      type: "budget_insuffisant",
      title: "Budget insuffisant",
      message: `La ligne ${ligneBudgetaireCode} n'a plus assez de budget (disponible: ${montantDisponible.toLocaleString()} FCFA, demandé: ${montantDemande.toLocaleString()} FCFA).`,
      isUrgent: true,
      recipientRole: "DAAF",
    });
  };

  /**
   * Notifications pour les assignations de tâches
   */
  const onAssignation = async (
    userId: string,
    taskType: string,
    entityType: string,
    entityId: string,
    entityCode: string
  ) => {
    await notifyUser({
      type: "assignation",
      title: `Nouvelle tâche: ${taskType}`,
      message: `Vous avez une nouvelle tâche de ${taskType.toLowerCase()} pour ${entityType} ${entityCode}.`,
      entityType,
      entityId,
      recipientUserId: userId,
    });
  };

  /**
   * Notifications pour les échéances
   */
  const onEcheance = async (
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    daysRemaining: number
  ) => {
    await notifyUser({
      type: "echeance",
      title: "Échéance proche",
      message: `Le ${entityType} ${entityCode} arrive à échéance dans ${daysRemaining} jour(s).`,
      entityType,
      entityId,
      isUrgent: daysRemaining <= 1,
      recipientUserId: userId,
    });
  };

  return {
    notifyUser,
    notifyRole,
    onValidation,
    onRejet,
    onSoumission,
    onDiffere,
    onBudgetInsuffisant,
    onAssignation,
    onEcheance,
  };
}
