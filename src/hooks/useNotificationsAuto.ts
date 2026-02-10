import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

interface NotificationAutoParams {
  type: "validation" | "rejet" | "differe" | "piece_manquante" | "alerte" | "info" | "echeance" | "budget_insuffisant" | "assignation" | "roadmap_soumission" | "roadmap_validation" | "roadmap_rejet" | "tache_bloquee" | "tache_retard" | "dossier_a_valider";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isUrgent?: boolean;
  recipientUserId?: string;
  recipientRole?: string;
  actionUrl?: string;
}

/**
 * Service de notifications automatiques
 * Utilisé pour notifier les utilisateurs lors d'actions du workflow
 */
export function useNotificationsAuto() {
  const { exercice: _exercice } = useExercice();

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

  /**
   * Notifications pour les soumissions de feuille de route
   */
  const onRoadmapSoumission = async (
    roadmapId: string,
    roadmapCode: string,
    directionName: string
  ) => {
    // Notifier le DG et DAAF
    await notifyRole({
      type: "roadmap_soumission",
      title: "Feuille de route à valider",
      message: `La feuille de route ${roadmapCode} de la direction ${directionName} nécessite votre validation.`,
      entityType: "roadmap_submission",
      entityId: roadmapId,
      recipientRole: "DG",
    });
    await notifyRole({
      type: "roadmap_soumission",
      title: "Feuille de route à valider",
      message: `La feuille de route ${roadmapCode} de la direction ${directionName} nécessite votre validation.`,
      entityType: "roadmap_submission",
      entityId: roadmapId,
      recipientRole: "DAAF",
    });
  };

  /**
   * Notifications pour la validation de feuille de route
   */
  const onRoadmapValidation = async (
    roadmapId: string,
    roadmapCode: string,
    creatorId: string
  ) => {
    await notifyUser({
      type: "roadmap_validation",
      title: "Feuille de route validée",
      message: `Votre feuille de route ${roadmapCode} a été validée avec succès.`,
      entityType: "roadmap_submission",
      entityId: roadmapId,
      recipientUserId: creatorId,
    });
  };

  /**
   * Notifications pour le rejet de feuille de route
   */
  const onRoadmapRejet = async (
    roadmapId: string,
    roadmapCode: string,
    creatorId: string,
    motif: string
  ) => {
    await notifyUser({
      type: "roadmap_rejet",
      title: "Feuille de route rejetée",
      message: `Votre feuille de route ${roadmapCode} a été rejetée. Motif: ${motif}`,
      entityType: "roadmap_submission",
      entityId: roadmapId,
      isUrgent: true,
      recipientUserId: creatorId,
    });
  };

  /**
   * Notifications pour les tâches bloquées
   */
  const onTacheBloquee = async (
    taskId: string,
    taskName: string,
    assigneeId: string,
    blockedReason: string
  ) => {
    // Notifier l'assigné
    await notifyUser({
      type: "tache_bloquee",
      title: "Tâche bloquée",
      message: `La tâche "${taskName}" est bloquée. Raison: ${blockedReason}`,
      entityType: "task_execution",
      entityId: taskId,
      isUrgent: true,
      recipientUserId: assigneeId,
    });
    // Notifier les managers (Directeurs)
    await notifyRole({
      type: "tache_bloquee",
      title: "Tâche bloquée dans votre direction",
      message: `La tâche "${taskName}" est bloquée. Raison: ${blockedReason}`,
      entityType: "task_execution",
      entityId: taskId,
      isUrgent: true,
      recipientRole: "Directeur",
    });
  };

  /**
   * Notifications pour les tâches en retard
   */
  const onTacheRetard = async (
    taskId: string,
    taskName: string,
    assigneeId: string,
    daysLate: number
  ) => {
    await notifyUser({
      type: "tache_retard",
      title: "Tâche en retard",
      message: `La tâche "${taskName}" est en retard de ${daysLate} jour(s).`,
      entityType: "task_execution",
      entityId: taskId,
      isUrgent: daysLate > 3,
      recipientUserId: assigneeId,
    });
  };

  /**
   * Notifications pour les dossiers de dépense à valider
   * Notifie DG et Directeurs selon le type de dossier
   */
  const onDossierAValider = async (
    entityType: string,
    entityId: string,
    entityCode: string,
    montant: number
  ) => {
    const montantFormatted = montant.toLocaleString("fr-FR");

    // Pour les Notes SEF, notifier le DG
    if (entityType === "note_sef" || entityType === "notes_sef") {
      await notifyRole({
        type: "dossier_a_valider",
        title: "Note SEF à valider",
        message: `La Note SEF ${entityCode} (${montantFormatted} FCFA) nécessite votre validation.`,
        entityType,
        entityId,
        recipientRole: "DG",
      });
    }

    // Pour les Notes AEF, notifier les Directeurs
    if (entityType === "note_aef" || entityType === "notes_dg") {
      await notifyRole({
        type: "dossier_a_valider",
        title: "Note AEF à valider",
        message: `La Note AEF ${entityCode} (${montantFormatted} FCFA) nécessite votre validation.`,
        entityType,
        entityId,
        recipientRole: "Directeur",
      });
    }

    // Pour les engagements, notifier le CB
    if (entityType === "engagement" || entityType === "budget_engagements") {
      await notifyRole({
        type: "dossier_a_valider",
        title: "Engagement à valider",
        message: `L'engagement ${entityCode} (${montantFormatted} FCFA) nécessite votre validation.`,
        entityType,
        entityId,
        recipientRole: "CB",
      });
    }

    // Pour les ordonnancements, notifier le DG pour signature
    if (entityType === "ordonnancement" || entityType === "ordonnancements") {
      await notifyRole({
        type: "dossier_a_valider",
        title: "Ordonnancement à signer",
        message: `L'ordonnancement ${entityCode} (${montantFormatted} FCFA) nécessite votre signature.`,
        entityType,
        entityId,
        isUrgent: true,
        recipientRole: "DG",
      });
    }
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
    onRoadmapSoumission,
    onRoadmapValidation,
    onRoadmapRejet,
    onTacheBloquee,
    onTacheRetard,
    onDossierAValider,
  };
}
