-- ============================================================
-- P6: Complement systeme de notifications
-- Migration: 20260207_p6_notifications.sql
-- ============================================================
-- La table `notifications` existe deja avec le schema:
--   id, user_id, title, message, type, category, entity_type, entity_id,
--   is_read, is_urgent, urgence, email_envoye, date_email, created_at, read_at
-- Les tables notification_templates, notification_recipients,
--   notification_logs, notification_preferences existent aussi.
-- Les triggers sur ordonnancements/reglements existent deja dans
--   20260203170000_triggers_notifications.sql
-- ============================================================

-- Fonctions utilitaires adaptees au schema existant (is_read au lieu de read)

-- Marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compter les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM notifications WHERE user_id = auth.uid() AND is_read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alias pour compatibilite (certaines migrations utilisent get_unread_notifications_count)
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN get_unread_notification_count();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour creer une notification (compatible avec le schema existant)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category, is_read, is_urgent, urgence)
  VALUES (p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, 'workflow', false, false, 'normale')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: notifier le prochain validateur quand un step workflow est complete
-- Adapte au schema reel: wf_step_history.action = 'valide'
-- ============================================================

CREATE OR REPLACE FUNCTION notify_workflow_step()
RETURNS TRIGGER AS $$
DECLARE
  v_next_step RECORD;
  v_instance RECORD;
  v_validator RECORD;
BEGIN
  -- Recuperer l'instance de workflow
  SELECT * INTO v_instance FROM wf_instances WHERE id = NEW.instance_id;

  IF v_instance IS NULL THEN
    RETURN NEW;
  END IF;

  -- Si le step est valide, notifier le prochain validateur
  IF NEW.action = 'valide' THEN
    -- Trouver le prochain step (step_order = current + 1)
    SELECT ws.* INTO v_next_step
    FROM wf_steps ws
    WHERE ws.workflow_id = v_instance.workflow_id
      AND ws.step_order = NEW.step_order + 1;

    IF v_next_step IS NOT NULL THEN
      -- Trouver les validateurs pour ce step (profiles avec le bon role)
      FOR v_validator IN
        SELECT p.id
        FROM profiles p
        WHERE p.profil_fonctionnel = v_next_step.role_required
          AND (v_next_step.direction_required IS NULL OR p.direction_id = (
            SELECT id FROM directions WHERE code = v_next_step.direction_required LIMIT 1
          ))
          AND p.is_active = true
      LOOP
        PERFORM create_notification(
          v_validator.id,
          'workflow',
          'Nouvelle validation requise',
          format('Un dossier %s necessite votre validation a l''etape "%s"',
            v_instance.entity_type, v_next_step.label),
          v_instance.entity_type,
          v_instance.entity_id
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creer le trigger (seulement si wf_step_history existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wf_step_history') THEN
    DROP TRIGGER IF EXISTS trg_notify_workflow_step ON wf_step_history;
    CREATE TRIGGER trg_notify_workflow_step
      AFTER INSERT ON wf_step_history
      FOR EACH ROW
      EXECUTE FUNCTION notify_workflow_step();
  END IF;
END $$;
