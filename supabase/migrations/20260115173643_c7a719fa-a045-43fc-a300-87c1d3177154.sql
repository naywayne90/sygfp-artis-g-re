-- =========================================================
-- Migration: Ajout du trigger d'historisation automatique pour notes_sef
-- =========================================================

-- Fonction de logging automatique des changements de statut
CREATE OR REPLACE FUNCTION log_note_sef_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger uniquement si le statut change
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO notes_sef_history (
      note_id,
      action,
      old_statut,
      new_statut,
      commentaire,
      performed_by,
      performed_at
    ) VALUES (
      NEW.id,
      CASE 
        WHEN OLD.statut = 'brouillon' AND NEW.statut IN ('soumis', 'a_valider') THEN 'SUBMIT'
        WHEN NEW.statut = 'valide' THEN 'VALIDATE'
        WHEN NEW.statut = 'rejete' THEN 'REJECT'
        WHEN NEW.statut = 'differe' THEN 'DEFER'
        WHEN OLD.statut = 'differe' AND NEW.statut IN ('soumis', 'a_valider') THEN 'RESUBMIT'
        ELSE 'STATUS_CHANGE'
      END,
      OLD.statut,
      NEW.statut,
      COALESCE(NEW.rejection_reason, NEW.differe_motif, NEW.decision_reason),
      COALESCE(
        CASE WHEN NEW.statut = 'valide' THEN NEW.validated_by END,
        CASE WHEN NEW.statut = 'rejete' THEN NEW.rejected_by END,
        CASE WHEN NEW.statut = 'differe' THEN NEW.differe_by END,
        NEW.submitted_by,
        auth.uid()
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour logger automatiquement les changements de statut
DROP TRIGGER IF EXISTS trg_log_note_sef_status_change ON notes_sef;
CREATE TRIGGER trg_log_note_sef_status_change
  AFTER UPDATE ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION log_note_sef_status_change();

-- Fonction de logging de création
CREATE OR REPLACE FUNCTION log_note_sef_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notes_sef_history (
    note_id,
    action,
    old_statut,
    new_statut,
    performed_by,
    performed_at
  ) VALUES (
    NEW.id,
    'CREATE_DRAFT',
    NULL,
    NEW.statut,
    COALESCE(NEW.created_by, auth.uid()),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour logger la création
DROP TRIGGER IF EXISTS trg_log_note_sef_creation ON notes_sef;
CREATE TRIGGER trg_log_note_sef_creation
  AFTER INSERT ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION log_note_sef_creation();

-- Ajouter une colonne metadata JSON à notes_sef_history si elle n'existe pas
ALTER TABLE notes_sef_history ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Fonction de logging pour les pièces jointes
CREATE OR REPLACE FUNCTION log_note_sef_attachment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notes_sef_history (
      note_id,
      action,
      metadata,
      performed_by,
      performed_at
    ) VALUES (
      NEW.note_id,
      'ADD_ATTACHMENT',
      jsonb_build_object(
        'file_name', NEW.file_name,
        'file_size', NEW.file_size,
        'file_type', NEW.file_type
      ),
      COALESCE(NEW.uploaded_by, auth.uid()),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notes_sef_history (
      note_id,
      action,
      metadata,
      performed_by,
      performed_at
    ) VALUES (
      OLD.note_id,
      'REMOVE_ATTACHMENT',
      jsonb_build_object(
        'file_name', OLD.file_name,
        'file_size', OLD.file_size,
        'file_type', OLD.file_type
      ),
      auth.uid(),
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour les pièces jointes
DROP TRIGGER IF EXISTS trg_log_note_sef_attachment ON notes_sef_attachments;
CREATE TRIGGER trg_log_note_sef_attachment
  AFTER INSERT OR DELETE ON notes_sef_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_note_sef_attachment_change();

-- Ajuster la politique RLS pour l'insertion dans l'historique
DROP POLICY IF EXISTS "System can insert history" ON notes_sef_history;
CREATE POLICY "Allow insert to history" ON notes_sef_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_notes_sef_history_note_id ON notes_sef_history(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_sef_history_action ON notes_sef_history(action);
CREATE INDEX IF NOT EXISTS idx_notes_sef_history_performed_at ON notes_sef_history(performed_at DESC);

-- Commentaires de documentation
COMMENT ON FUNCTION log_note_sef_status_change() IS 'Logger automatiquement les changements de statut dans notes_sef_history';
COMMENT ON FUNCTION log_note_sef_creation() IS 'Logger automatiquement la création d''une note SEF';
COMMENT ON FUNCTION log_note_sef_attachment_change() IS 'Logger automatiquement les ajouts/suppressions de pièces jointes';