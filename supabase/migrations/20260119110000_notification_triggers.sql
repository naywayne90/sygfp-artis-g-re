-- ============================================================================
-- SYGFP - Triggers de Notifications Automatiques
-- Migration: 20260119110000_notification_triggers.sql
--
-- Notifications pour:
-- - Soumission feuille de route (DG/DAAF)
-- - Dossier de dépense à valider (DG/Directeurs)
-- - Tâche bloquée / en retard
-- ============================================================================

-- ============================================================================
-- 1. FONCTION: Notifier les rôles spécifiques
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_role(
  p_role TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insérer une notification pour chaque utilisateur ayant le rôle
  FOR v_user_id IN
    SELECT user_id FROM user_roles WHERE role = p_role
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message, entity_type, entity_id, is_urgent, priority
    ) VALUES (
      v_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id,
      p_is_urgent, CASE WHEN p_is_urgent THEN 'high' ELSE 'normal' END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TRIGGER: Notification soumission Note SEF → DG
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_note_sef_soumise()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à "soumis" ou "en_attente"
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('soumis', 'en_attente', 'en_attente_validation')) THEN

    PERFORM notify_role(
      'DG',
      'dossier_a_valider',
      'Note SEF à valider',
      format('La Note SEF %s (%s FCFA) nécessite votre validation.',
             NEW.reference,
             to_char(COALESCE(NEW.montant_total, 0), 'FM999G999G999')),
      'notes_sef',
      NEW.id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_note_sef_soumise ON notes_sef;
CREATE TRIGGER notify_note_sef_soumise
  AFTER UPDATE ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_note_sef_soumise();

-- ============================================================================
-- 3. TRIGGER: Notification soumission Note AEF → Directeurs
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_note_aef_soumise()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à "soumis" ou "en_attente"
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('soumis', 'en_attente', 'en_attente_validation')) THEN

    PERFORM notify_role(
      'Directeur',
      'dossier_a_valider',
      'Note AEF à valider',
      format('La Note AEF %s (%s FCFA) nécessite votre validation.',
             NEW.reference,
             to_char(COALESCE(NEW.montant_demande, 0), 'FM999G999G999')),
      'notes_dg',
      NEW.id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_note_aef_soumise ON notes_aef;
CREATE TRIGGER notify_note_aef_soumise
  AFTER UPDATE ON notes_aef
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_note_aef_soumise();

-- ============================================================================
-- 4. TRIGGER: Notification soumission feuille de route → DG/DAAF
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_roadmap_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_direction_name TEXT;
BEGIN
  -- Si le statut passe à "soumis"
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('soumis', 'pending_validation')) THEN

    -- Récupérer le nom de la direction
    SELECT libelle INTO v_direction_name
    FROM directions
    WHERE id = NEW.direction_id;

    -- Notifier le DG
    PERFORM notify_role(
      'DG',
      'roadmap_soumission',
      'Feuille de route à valider',
      format('La feuille de route %s de la direction %s nécessite votre validation.',
             COALESCE(NEW.reference, NEW.id::TEXT),
             COALESCE(v_direction_name, 'N/A')),
      'roadmap_submission',
      NEW.id,
      FALSE
    );

    -- Notifier la DAAF
    PERFORM notify_role(
      'DAAF',
      'roadmap_soumission',
      'Feuille de route à valider',
      format('La feuille de route %s de la direction %s nécessite votre validation.',
             COALESCE(NEW.reference, NEW.id::TEXT),
             COALESCE(v_direction_name, 'N/A')),
      'roadmap_submission',
      NEW.id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roadmap_submissions') THEN
    DROP TRIGGER IF EXISTS notify_roadmap_submitted ON roadmap_submissions;
    CREATE TRIGGER notify_roadmap_submitted
      AFTER UPDATE ON roadmap_submissions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_notify_roadmap_submitted();
  END IF;
END;
$$;

-- ============================================================================
-- 5. TRIGGER: Notification engagement à valider → CB
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_engagement_soumis()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à "soumis" ou "en_attente"
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('soumis', 'en_attente', 'en_attente_validation')) THEN

    PERFORM notify_role(
      'CB',
      'dossier_a_valider',
      'Engagement à valider',
      format('L''engagement %s (%s FCFA) nécessite votre validation.',
             NEW.reference,
             to_char(COALESCE(NEW.montant, 0), 'FM999G999G999')),
      'budget_engagements',
      NEW.id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_engagement_soumis ON engagements;
CREATE TRIGGER notify_engagement_soumis
  AFTER UPDATE ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_engagement_soumis();

-- ============================================================================
-- 6. TRIGGER: Notification ordonnancement à signer → DG
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_ordonnancement_a_signer()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à "a_signer" ou "en_attente_signature"
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('a_signer', 'en_attente_signature', 'valide')) THEN

    PERFORM notify_role(
      'DG',
      'dossier_a_valider',
      'Ordonnancement à signer',
      format('L''ordonnancement %s (%s FCFA) nécessite votre signature.',
             NEW.reference,
             to_char(COALESCE(NEW.montant, 0), 'FM999G999G999')),
      'ordonnancements',
      NEW.id,
      TRUE -- Urgent
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_ordonnancement_a_signer ON ordonnancements;
CREATE TRIGGER notify_ordonnancement_a_signer
  AFTER UPDATE ON ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_ordonnancement_a_signer();

-- ============================================================================
-- 7. TRIGGER: Notification tâche bloquée → Assigné + Directeur
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_task_blocked()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à "blocked" ou "bloque"
  IF (OLD.status IS DISTINCT FROM NEW.status) AND
     (NEW.status IN ('blocked', 'bloque')) THEN

    -- Notifier l'assigné
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, is_urgent, priority
      ) VALUES (
        NEW.assigned_to,
        'tache_bloquee',
        'Tâche bloquée',
        format('La tâche "%s" est bloquée. Raison: %s',
               COALESCE(NEW.task_name, 'Sans nom'),
               COALESCE(NEW.blocked_reason, NEW.notes, 'Non spécifiée')),
        'task_execution',
        NEW.id,
        TRUE,
        'high'
      );
    END IF;

    -- Notifier les Directeurs
    PERFORM notify_role(
      'Directeur',
      'tache_bloquee',
      'Tâche bloquée dans votre équipe',
      format('La tâche "%s" est bloquée. Raison: %s',
             COALESCE(NEW.task_name, 'Sans nom'),
             COALESCE(NEW.blocked_reason, NEW.notes, 'Non spécifiée')),
      'task_execution',
      NEW.id,
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_executions') THEN
    DROP TRIGGER IF EXISTS notify_task_blocked ON task_executions;
    CREATE TRIGGER notify_task_blocked
      AFTER UPDATE ON task_executions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_notify_task_blocked();
  END IF;
END;
$$;

-- ============================================================================
-- 8. FONCTION: Vérifier les tâches en retard (à appeler par CRON)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_task RECORD;
  v_days_late INTEGER;
BEGIN
  -- Trouver les tâches en retard (date_fin dépassée, statut non terminé)
  FOR v_task IN
    SELECT te.*,
           EXTRACT(DAY FROM (CURRENT_DATE - te.deadline::DATE))::INTEGER AS days_late
    FROM task_executions te
    WHERE te.deadline IS NOT NULL
      AND te.deadline < CURRENT_DATE
      AND te.status NOT IN ('completed', 'termine', 'cancelled', 'annule')
      AND te.assigned_to IS NOT NULL
      -- Ne pas re-notifier si déjà notifié aujourd'hui
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_type = 'task_execution'
          AND n.entity_id = te.id
          AND n.type = 'tache_retard'
          AND n.created_at::DATE = CURRENT_DATE
      )
  LOOP
    v_days_late := v_task.days_late;

    INSERT INTO notifications (
      user_id, type, title, message, entity_type, entity_id,
      is_urgent, priority
    ) VALUES (
      v_task.assigned_to,
      'tache_retard',
      'Tâche en retard',
      format('La tâche "%s" est en retard de %s jour(s).',
             COALESCE(v_task.task_name, 'Sans nom'),
             v_days_late),
      'task_execution',
      v_task.id,
      v_days_late > 3,
      CASE WHEN v_days_late > 3 THEN 'high' ELSE 'normal' END
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. TRIGGER: Notification validation/rejet → Créateur
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_validation_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Pour les validations
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('valide', 'validé', 'approved')) THEN

    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, priority
      ) VALUES (
        NEW.created_by,
        'validation',
        TG_TABLE_NAME || ' validé(e)',
        format('Votre %s %s a été validé(e) avec succès.',
               TG_TABLE_NAME, COALESCE(NEW.reference, NEW.id::TEXT)),
        TG_TABLE_NAME,
        NEW.id,
        'normal'
      );
    END IF;
  END IF;

  -- Pour les rejets
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND
     (NEW.statut IN ('rejete', 'rejeté', 'rejected')) THEN

    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, is_urgent, priority
      ) VALUES (
        NEW.created_by,
        'rejet',
        TG_TABLE_NAME || ' rejeté(e)',
        format('Votre %s %s a été rejeté(e). Motif: %s',
               TG_TABLE_NAME,
               COALESCE(NEW.reference, NEW.id::TEXT),
               COALESCE(NEW.motif_rejet, 'Non spécifié')),
        TG_TABLE_NAME,
        NEW.id,
        TRUE,
        'high'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DES TRIGGERS DE NOTIFICATIONS
-- ============================================================================

COMMENT ON FUNCTION notify_role IS 'Envoie une notification à tous les utilisateurs ayant un rôle spécifique';
COMMENT ON FUNCTION check_overdue_tasks IS 'Vérifie les tâches en retard et crée des notifications (à appeler quotidiennement)';
