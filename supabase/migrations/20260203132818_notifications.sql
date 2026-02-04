-- =====================================================
-- Migration : Système de Notifications
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- =====================================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  est_lu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, est_lu, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Activer Realtime pour les notifications en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_titre TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, titre, message, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_type, p_titre, p_message, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET est_lu = true
  WHERE id = p_notification_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET est_lu = true
  WHERE user_id = auth.uid() AND est_lu = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Fonction pour obtenir les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND est_lu = false
  );
END;
$$;

-- Fonction pour supprimer les anciennes notifications (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days' AND est_lu = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne peuvent voir que leurs propres notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Politique: Les utilisateurs ne peuvent modifier que leurs propres notifications
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Politique: Les utilisateurs ne peuvent supprimer que leurs propres notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- Triggers pour créer des notifications automatiquement
-- =====================================================

-- Trigger pour notifier lors d'un changement de statut sur notes_sef
CREATE OR REPLACE FUNCTION notify_on_notes_sef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Ne déclencher que si le statut a changé
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    -- Construire le message selon le nouveau statut
    CASE NEW.statut
      WHEN 'soumis' THEN
        v_titre := 'Note soumise';
        v_message := 'Votre note ' || COALESCE(NEW.numero, 'brouillon') || ' a été soumise pour validation.';
        v_type := 'note_soumise';
      WHEN 'valide' THEN
        v_titre := 'Note validée';
        v_message := 'Votre note ' || COALESCE(NEW.numero, '') || ' a été validée.';
        v_type := 'note_validee';
      WHEN 'rejete' THEN
        v_titre := 'Note rejetée';
        v_message := 'Votre note ' || COALESCE(NEW.numero, '') || ' a été rejetée. Motif: ' || COALESCE(NEW.rejection_reason, 'Non spécifié');
        v_type := 'note_rejetee';
      WHEN 'differe' THEN
        v_titre := 'Note différée';
        v_message := 'Votre note ' || COALESCE(NEW.numero, '') || ' a été différée. Motif: ' || COALESCE(NEW.differe_motif, 'Non spécifié');
        v_type := 'note_differee';
      ELSE
        v_titre := 'Changement de statut';
        v_message := 'Votre note ' || COALESCE(NEW.numero, 'brouillon') || ' est passée au statut: ' || NEW.statut;
        v_type := 'statut_change';
    END CASE;

    -- Notifier le créateur de la note
    PERFORM create_notification(
      NEW.created_by,
      v_type,
      v_titre,
      v_message,
      'notes_sef',
      NEW.id,
      jsonb_build_object('old_statut', OLD.statut, 'new_statut', NEW.statut)
    );

    -- Si la note est soumise, notifier les validateurs (DG)
    IF NEW.statut = 'soumis' THEN
      -- Notifier tous les utilisateurs avec le profil DG
      INSERT INTO notifications (user_id, type, titre, message, entity_type, entity_id, metadata)
      SELECT
        p.id,
        'note_a_valider',
        'Nouvelle note à valider',
        'La note ' || COALESCE(NEW.numero, '') || ' est en attente de votre validation.',
        'notes_sef',
        NEW.id,
        jsonb_build_object('direction_id', NEW.direction_id, 'objet', NEW.objet)
      FROM profiles p
      WHERE p.role_hierarchique = 'DG'
      AND p.id != NEW.created_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur notes_sef
DROP TRIGGER IF EXISTS trigger_notify_notes_sef_status ON notes_sef;
CREATE TRIGGER trigger_notify_notes_sef_status
AFTER UPDATE OF statut ON notes_sef
FOR EACH ROW
EXECUTE FUNCTION notify_on_notes_sef_status_change();

-- Trigger pour notifier lors d'un changement de statut sur notes_dg (notes AEF)
CREATE OR REPLACE FUNCTION notify_on_notes_aef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    CASE NEW.statut
      WHEN 'soumis' THEN
        v_titre := 'Note AEF soumise';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, 'brouillon') || ' a été soumise pour validation.';
        v_type := 'aef_soumise';
      WHEN 'valide' THEN
        v_titre := 'Note AEF validée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été validée.';
        v_type := 'aef_validee';
      WHEN 'a_imputer' THEN
        v_titre := 'Note AEF à imputer';
        v_message := 'La note AEF ' || COALESCE(NEW.numero, '') || ' est prête pour l''imputation budgétaire.';
        v_type := 'aef_a_imputer';
      WHEN 'impute' THEN
        v_titre := 'Note AEF imputée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été imputée sur une ligne budgétaire.';
        v_type := 'aef_imputee';
      WHEN 'rejete' THEN
        v_titre := 'Note AEF rejetée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été rejetée. Motif: ' || COALESCE(NEW.rejection_reason, 'Non spécifié');
        v_type := 'aef_rejetee';
      WHEN 'differe' THEN
        v_titre := 'Note AEF différée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été différée.';
        v_type := 'aef_differee';
      ELSE
        v_titre := 'Changement de statut AEF';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' est passée au statut: ' || NEW.statut;
        v_type := 'aef_statut_change';
    END CASE;

    -- Notifier le créateur
    PERFORM create_notification(
      NEW.created_by,
      v_type,
      v_titre,
      v_message,
      'notes_dg',
      NEW.id,
      jsonb_build_object('old_statut', OLD.statut, 'new_statut', NEW.statut)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur notes_dg
DROP TRIGGER IF EXISTS trigger_notify_notes_aef_status ON notes_dg;
CREATE TRIGGER trigger_notify_notes_aef_status
AFTER UPDATE OF statut ON notes_dg
FOR EACH ROW
EXECUTE FUNCTION notify_on_notes_aef_status_change();

-- =====================================================
-- Permissions
-- =====================================================
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO service_role;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE notifications IS 'Table des notifications utilisateur avec support Realtime';
COMMENT ON FUNCTION create_notification IS 'Crée une nouvelle notification pour un utilisateur';
COMMENT ON FUNCTION mark_notification_read IS 'Marque une notification spécifique comme lue';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marque toutes les notifications de l''utilisateur comme lues';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Retourne le nombre de notifications non lues';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Supprime les notifications lues de plus de 30 jours';
