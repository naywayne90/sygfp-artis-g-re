-- =====================================================
-- Migration : Fonctions de Notifications (adaptées)
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Note : Adapté à la structure existante (colonnes en anglais)
-- =====================================================

-- La table notifications existe déjà avec la structure suivante:
-- id, user_id, title, message, type, category, entity_type, entity_id,
-- is_read, is_urgent, created_at, read_at, urgence

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
AS $func$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
  VALUES (p_user_id, p_type, p_titre, p_message, p_entity_type, p_entity_id, COALESCE(p_metadata->>'category', 'system'))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$func$;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$func$;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$func$;

-- Fonction pour obtenir les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $func$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND is_read = false
  );
END;
$func$;

-- Fonction pour supprimer les anciennes notifications (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$func$;

-- =====================================================
-- Triggers pour notifications automatiques
-- =====================================================

-- Trigger pour notes_sef
CREATE OR REPLACE FUNCTION notify_on_notes_sef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
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
        v_message := 'Votre note ' || COALESCE(NEW.numero, '') || ' a été rejetée.';
        v_type := 'note_rejetee';
      WHEN 'differe' THEN
        v_titre := 'Note différée';
        v_message := 'Votre note ' || COALESCE(NEW.numero, '') || ' a été différée.';
        v_type := 'note_differee';
      ELSE
        v_titre := 'Changement de statut';
        v_message := 'Votre note ' || COALESCE(NEW.numero, 'brouillon') || ' est passée au statut: ' || NEW.statut;
        v_type := 'statut_change';
    END CASE;

    -- Notifier le créateur
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (NEW.created_by, v_type, v_titre, v_message, 'notes_sef', NEW.id, 'workflow');

    -- Si soumis, notifier les DG
    IF NEW.statut = 'soumis' THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
      SELECT p.id, 'note_a_valider', 'Nouvelle note à valider',
             'La note ' || COALESCE(NEW.numero, '') || ' est en attente de validation.',
             'notes_sef', NEW.id, 'workflow'
      FROM profiles p
      WHERE p.role_hierarchique = 'DG' AND p.id != NEW.created_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_notify_notes_sef_status ON notes_sef;
CREATE TRIGGER trigger_notify_notes_sef_status
AFTER UPDATE OF statut ON notes_sef
FOR EACH ROW EXECUTE FUNCTION notify_on_notes_sef_status_change();

-- Trigger pour notes_dg (AEF)
CREATE OR REPLACE FUNCTION notify_on_notes_aef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    CASE NEW.statut
      WHEN 'soumis' THEN
        v_titre := 'Note AEF soumise';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, 'brouillon') || ' a été soumise.';
        v_type := 'aef_soumise';
      WHEN 'valide' THEN
        v_titre := 'Note AEF validée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été validée.';
        v_type := 'aef_validee';
      WHEN 'a_imputer' THEN
        v_titre := 'Note AEF à imputer';
        v_message := 'La note AEF ' || COALESCE(NEW.numero, '') || ' est prête pour imputation.';
        v_type := 'aef_a_imputer';
      WHEN 'impute' THEN
        v_titre := 'Note AEF imputée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été imputée.';
        v_type := 'aef_imputee';
      WHEN 'rejete' THEN
        v_titre := 'Note AEF rejetée';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' a été rejetée.';
        v_type := 'aef_rejetee';
      ELSE
        v_titre := 'Changement de statut AEF';
        v_message := 'Votre note AEF ' || COALESCE(NEW.numero, '') || ' est passée au statut: ' || NEW.statut;
        v_type := 'aef_statut_change';
    END CASE;

    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (NEW.created_by, v_type, v_titre, v_message, 'notes_dg', NEW.id, 'workflow');
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_notify_notes_aef_status ON notes_dg;
CREATE TRIGGER trigger_notify_notes_aef_status
AFTER UPDATE OF statut ON notes_dg
FOR EACH ROW EXECUTE FUNCTION notify_on_notes_aef_status_change();

-- =====================================================
-- Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO service_role;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION create_notification IS 'Crée une nouvelle notification pour un utilisateur';
COMMENT ON FUNCTION mark_notification_read IS 'Marque une notification spécifique comme lue';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marque toutes les notifications de l''utilisateur comme lues';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Retourne le nombre de notifications non lues';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Supprime les notifications lues de plus de 30 jours';
COMMENT ON FUNCTION notify_on_notes_sef_status_change IS 'Trigger: notifications automatiques pour notes_sef';
COMMENT ON FUNCTION notify_on_notes_aef_status_change IS 'Trigger: notifications automatiques pour notes_dg';
