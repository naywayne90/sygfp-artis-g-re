-- ============================================================
-- P6: Systeme de notifications
-- Migration: 20260207_p6_notifications.sql
-- ============================================================

-- Table principale des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'workflow')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT, -- 'note_sef', 'engagement', 'liquidation', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS: chaque user ne voit que ses notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les admins et le systeme peuvent inserer des notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE user_id = auth.uid() AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les non-lues
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM notifications WHERE user_id = auth.uid() AND read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour creer une notification (appelable par triggers)
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
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: notifier le prochain validateur quand un step workflow est complete
-- Adapte au schema reel: wf_step_history.action = 'valide'
-- wf_steps.step_order, wf_instances.entity_type/entity_id
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
        -- Creer notification pour chaque validateur
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
