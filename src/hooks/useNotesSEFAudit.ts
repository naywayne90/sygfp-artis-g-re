import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useCallback } from "react";
import { NoteSEF } from "./useNotesSEF";
import { Json } from "@/integrations/supabase/types";
export type NoteSEFAction = 
  | "creation"
  | "modification"
  | "ajout_piece"
  | "suppression_piece"
  | "reference_generated"
  | "soumission"
  | "resoumission"
  | "passage_a_valider"
  | "validation"
  | "rejet"
  | "report"
  | "duplication";

interface AuditParams {
  noteId: string;
  action: NoteSEFAction;
  oldStatut?: string | null;
  newStatut?: string | null;
  commentaire?: string;
  details?: Json;
}

interface NotificationParams {
  note: NoteSEF;
  action: "soumission" | "validation" | "rejet" | "report";
  motif?: string;
  dateReprise?: string;
}

/**
 * Hook pour la traçabilité et les notifications des Notes SEF
 */
export function useNotesSEFAudit() {
  const { exercice } = useExercice();

  /**
   * Enregistrer un événement dans notes_sef_history
   */
  const logAuditEvent = useCallback(async ({
    noteId,
    action,
    oldStatut,
    newStatut,
    commentaire,
    details,
  }: AuditParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log dans notes_sef_history
      const { error } = await supabase.from("notes_sef_history").insert({
        note_id: noteId,
        action,
        old_statut: oldStatut || null,
        new_statut: newStatut || null,
        commentaire,
        performed_by: user.id,
      });

      if (error) {
        console.error("Erreur audit SEF:", error);
      }

      // Log aussi dans audit_logs pour le dashboard "Activités récentes"
      await supabase.from("audit_logs").insert([{
        entity_type: "note_sef",
        entity_id: noteId,
        action: action,
        exercice,
        user_id: user.id,
        new_values: details || { statut: newStatut },
        old_values: oldStatut ? { statut: oldStatut } : null,
      }]);
    } catch (err) {
      console.error("Erreur audit SEF:", err);
    }
  }, [exercice]);

  /**
   * Récupérer les validateurs (DG, DAAF, ADMIN)
   */
  const getValidators = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["DG", "DAAF", "ADMIN"]);

    if (error) {
      console.error("Erreur récupération validateurs:", error);
      return [];
    }

    // Dédupliquer les user_ids
    const uniqueUserIds = [...new Set(data.map(r => r.user_id))];
    return uniqueUserIds;
  }, []);

  /**
   * Envoyer des notifications
   */
  const sendNotifications = useCallback(async ({
    note,
    action,
    motif,
    dateReprise,
  }: NotificationParams) => {
    try {
      const reference = note.reference_pivot || note.numero || "Note SEF";

      if (action === "soumission") {
        // Notifier tous les validateurs
        const validatorIds = await getValidators();
        
        for (const userId of validatorIds) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "validation",
            title: "Note SEF à valider",
            message: `La note ${reference} nécessite votre validation.`,
            entity_type: "note_sef",
            entity_id: note.id,
            is_urgent: note.urgence === "urgente" || note.urgence === "haute",
          });
        }
      } else if (action === "validation") {
        // Notifier le créateur et le demandeur
        const recipients = new Set<string>();
        if (note.created_by) recipients.add(note.created_by);
        if (note.demandeur_id) recipients.add(note.demandeur_id);

        for (const userId of recipients) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "info",
            title: "Note SEF validée ✓",
            message: `La note ${reference} a été validée. Un dossier a été créé automatiquement.`,
            entity_type: "note_sef",
            entity_id: note.id,
          });
        }
      } else if (action === "rejet") {
        // Notifier le créateur et le demandeur
        const recipients = new Set<string>();
        if (note.created_by) recipients.add(note.created_by);
        if (note.demandeur_id) recipients.add(note.demandeur_id);

        for (const userId of recipients) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "rejet",
            title: "Note SEF rejetée",
            message: `La note ${reference} a été rejetée. Motif: ${motif || "Non spécifié"}`,
            entity_type: "note_sef",
            entity_id: note.id,
            is_urgent: true,
          });
        }
      } else if (action === "report") {
        // Notifier le créateur et le demandeur
        const recipients = new Set<string>();
        if (note.created_by) recipients.add(note.created_by);
        if (note.demandeur_id) recipients.add(note.demandeur_id);

        const dateInfo = dateReprise ? ` Date de reprise: ${dateReprise}` : "";

        for (const userId of recipients) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "differe",
            title: "Note SEF différée",
            message: `La note ${reference} a été différée. Motif: ${motif || "Non spécifié"}.${dateInfo}`,
            entity_type: "note_sef",
            entity_id: note.id,
          });
        }
      }
    } catch (err) {
      console.error("Erreur envoi notifications:", err);
    }
  }, [getValidators]);

  /**
   * Log création
   */
  const logCreation = useCallback(async (noteId: string, details?: Json) => {
    await logAuditEvent({
      noteId,
      action: "creation",
      newStatut: "brouillon",
      details,
    });
  }, [logAuditEvent]);

  /**
   * Log modification
   */
  const logModification = useCallback(async (noteId: string, oldStatut: string | null, details?: Json) => {
    await logAuditEvent({
      noteId,
      action: "modification",
      oldStatut,
      newStatut: oldStatut,
      details,
    });
  }, [logAuditEvent]);

  /**
   * Log ajout pièce
   */
  const logAjoutPiece = useCallback(async (noteId: string, nomFichier: string) => {
    await logAuditEvent({
      noteId,
      action: "ajout_piece",
      commentaire: `Fichier ajouté: ${nomFichier}`,
    });
  }, [logAuditEvent]);

  /**
   * Log suppression pièce
   */
  const logSuppressionPiece = useCallback(async (noteId: string, nomFichier: string) => {
    await logAuditEvent({
      noteId,
      action: "suppression_piece",
      commentaire: `Fichier supprimé: ${nomFichier}`,
    });
  }, [logAuditEvent]);

  /**
   * Log génération de référence pivot
   * Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
   */
  const logReferenceGenerated = useCallback(async (noteId: string, reference: string) => {
    await logAuditEvent({
      noteId,
      action: "reference_generated",
      commentaire: `Référence générée: ${reference}`,
      details: { reference } as unknown as Json,
    });
  }, [logAuditEvent]);

  /**
   * Log soumission + notification aux validateurs
   * La référence pivot est générée automatiquement par le trigger backend
   */
  const logSoumission = useCallback(async (note: NoteSEF) => {
    // Log la génération de référence si présente
    if (note.reference_pivot) {
      await logReferenceGenerated(note.id, note.reference_pivot);
    }

    await logAuditEvent({
      noteId: note.id,
      action: "soumission",
      oldStatut: "brouillon",
      newStatut: "soumis",
      commentaire: note.reference_pivot ? `Référence: ${note.reference_pivot}` : undefined,
    });
    
    await sendNotifications({ note, action: "soumission" });
  }, [logAuditEvent, logReferenceGenerated, sendNotifications]);

  /**
   * Log validation + notification au créateur/demandeur
   */
  const logValidation = useCallback(async (note: NoteSEF, dossierId?: string) => {
    await logAuditEvent({
      noteId: note.id,
      action: "validation",
      oldStatut: note.statut,
      newStatut: "valide",
      details: dossierId ? { dossier_id: dossierId } : undefined,
    });
    
    await sendNotifications({ note, action: "validation" });
  }, [logAuditEvent, sendNotifications]);

  /**
   * Log rejet + notification au créateur/demandeur
   */
  const logRejet = useCallback(async (note: NoteSEF, motif: string) => {
    await logAuditEvent({
      noteId: note.id,
      action: "rejet",
      oldStatut: note.statut,
      newStatut: "rejete",
      commentaire: motif,
    });
    
    await sendNotifications({ note, action: "rejet", motif });
  }, [logAuditEvent, sendNotifications]);

  /**
   * Log report/différé + notification au créateur/demandeur
   */
  const logReport = useCallback(async (note: NoteSEF, motif: string, dateReprise?: string) => {
    await logAuditEvent({
      noteId: note.id,
      action: "report",
      oldStatut: note.statut,
      newStatut: "differe",
      commentaire: `${motif}${dateReprise ? ` - Reprise: ${dateReprise}` : ""}`,
    });
    
    await sendNotifications({ note, action: "report", motif, dateReprise });
  }, [logAuditEvent, sendNotifications]);

  return {
    logAuditEvent,
    logCreation,
    logModification,
    logAjoutPiece,
    logSuppressionPiece,
    logReferenceGenerated,
    logSoumission,
    logValidation,
    logRejet,
    logReport,
    sendNotifications,
    getValidators,
  };
}
