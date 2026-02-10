-- ============================================================================
-- Migration: Canvas Notes Direction
-- Ajouter les champs necessaires pour le canvas de notes ARTI
-- ============================================================================

-- Champs d'identification
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS destinataire TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS expediteur TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS objet TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS date_note DATE DEFAULT CURRENT_DATE;

-- Champs de template/metadata
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'note_descriptive';
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Champs de rattachement strategique et budget
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS objectifs_strategiques TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS action_rattachement TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS budget_previsionnel TEXT;

-- Champs d'observations DG et decision
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS observations_dg TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS decision_dg TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS date_decision DATE;

-- Champs de signature
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS signataire_nom TEXT;
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS signataire_titre TEXT;

-- ============================================================================
-- Table de templates de notes
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_templates (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  contenu_html TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]',
  en_tete_arti BOOLEAN DEFAULT true,
  signature_zone BOOLEAN DEFAULT true,
  est_actif BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS sur note_templates (lecture publique, ecriture admin)
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "note_templates_read_all"
  ON note_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "note_templates_admin_write"
  ON note_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dg')
    )
  );

-- ============================================================================
-- Templates par defaut
-- ============================================================================

INSERT INTO note_templates (id, label, description, category, contenu_html, sort_order) VALUES
  ('note_descriptive', 'Note descriptive', 'Note descriptive avec expose, avis et recommandations', 'officiel',
   '<h2>Expose</h2><p></p><h2>Avis</h2><p></p><h2>Recommandations</h2><p></p>', 1),
  ('note_interne', 'Note interne', 'Note interne simple entre directions', 'general',
   '<p></p>', 2),
  ('note_service', 'Note de service', 'Note de service officielle', 'officiel',
   '<h2>Objet</h2><p></p><h2>Dispositions</h2><p></p>', 3),
  ('compte_rendu', 'Compte rendu', 'Compte rendu de reunion ou activite', 'general',
   '<h2>Participants</h2><p></p><h2>Ordre du jour</h2><p></p><h2>Deliberations</h2><p></p><h2>Decisions</h2><p></p>', 4),
  ('rapport', 'Rapport', 'Rapport detaille avec sommaire', 'general',
   '<h2>Introduction</h2><p></p><h2>Analyse</h2><p></p><h2>Conclusions</h2><p></p><h2>Recommandations</h2><p></p>', 5),
  ('memo', 'Memo', 'Memo rapide', 'general',
   '<p></p>', 6),
  ('note_vierge', 'Note vierge', 'Canvas vide sans structure predéfinie', 'general',
   '<p></p>', 7)
ON CONFLICT (id) DO NOTHING;
