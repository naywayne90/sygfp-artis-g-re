-- ============================================================================
-- SYGFP - Module Notes Direction Générale (Notes DG)
-- Migration: 20260119120000_create_notes_direction_generale.sql
--
-- Notes officielles du DG avec système d'imputation (destinataires/instructions)
-- Ce module est DISTINCT de notes_dg (qui stocke les Notes AEF)
-- ============================================================================

-- ============================================================================
-- 1. TABLE PRINCIPALE: notes_direction_generale
-- ============================================================================

CREATE TABLE IF NOT EXISTS notes_direction_generale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence ARTI
  reference TEXT UNIQUE,
  numero_note TEXT,

  -- Contexte
  exercice INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  date_note DATE NOT NULL DEFAULT CURRENT_DATE,

  -- En-tête
  destinataire TEXT NOT NULL,
  objet TEXT NOT NULL,
  direction_id UUID REFERENCES directions(id),
  nom_prenoms TEXT,

  -- Corps de la note
  expose TEXT,
  avis TEXT,
  recommandations TEXT,

  -- Fichiers annexes (stockage JSON)
  document_annexe_files JSONB DEFAULT '[]'::jsonb,
  nb_pages INTEGER DEFAULT 0,

  -- Statut workflow
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN (
    'brouillon',      -- Draft
    'soumise_dg',     -- Soumise au DG pour signature
    'dg_valide',      -- Validée/Signée par le DG
    'dg_rejetee',     -- Rejetée par le DG
    'diffusee'        -- Diffusée aux destinataires
  )),

  -- Signature
  signed_by UUID REFERENCES profiles(id),
  signed_at TIMESTAMPTZ,
  signature_qr_data TEXT,

  -- Rejet
  motif_rejet TEXT,
  rejected_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,

  -- Traçabilité
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notes_dg_exercice ON notes_direction_generale(exercice);
CREATE INDEX IF NOT EXISTS idx_notes_dg_statut ON notes_direction_generale(statut);
CREATE INDEX IF NOT EXISTS idx_notes_dg_direction ON notes_direction_generale(direction_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_created_by ON notes_direction_generale(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_dg_date ON notes_direction_generale(date_note);

-- Commentaire
COMMENT ON TABLE notes_direction_generale IS 'Notes officielles du Directeur Général avec système d''imputation';

-- ============================================================================
-- 2. TABLE D'IMPUTATION: note_dg_imputations
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_dg_imputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Liaison à la note
  note_id UUID NOT NULL REFERENCES notes_direction_generale(id) ON DELETE CASCADE,

  -- Destinataire de l'imputation
  destinataire TEXT NOT NULL,
  direction_id UUID REFERENCES directions(id),

  -- Type d'instruction
  instruction_type TEXT NOT NULL CHECK (instruction_type IN (
    'ATTRIBUTION',    -- À qui est attribué
    'DIFFUSION',      -- Pour diffusion/information
    'SUIVI',          -- Pour suivi
    'ACTION_SUITE',   -- Pour action/suite à donner
    'CLASSEMENT'      -- Pour classement/archives
  )),

  -- Détails
  priorite TEXT CHECK (priorite IN ('normale', 'urgente', 'tres_urgente')),
  delai DATE,
  commentaire TEXT,

  -- Accusé de réception
  accuse_reception BOOLEAN DEFAULT FALSE,
  date_accuse TIMESTAMPTZ,
  accuse_par UUID REFERENCES profiles(id),

  -- Traçabilité
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_note_dg_imputations_note ON note_dg_imputations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_dg_imputations_type ON note_dg_imputations(instruction_type);
CREATE INDEX IF NOT EXISTS idx_note_dg_imputations_direction ON note_dg_imputations(direction_id);

COMMENT ON TABLE note_dg_imputations IS 'Imputations (destinataires et instructions) des notes DG';

-- ============================================================================
-- 3. FONCTION: Génération référence ARTI pour Notes DG
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_note_dg_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_month TEXT;
  v_year TEXT;
  v_sequence INTEGER;
  v_ref TEXT;
BEGIN
  -- Format: NDG-MM-YY-XXXX (Note DG)
  v_month := LPAD(EXTRACT(MONTH FROM COALESCE(NEW.date_note, CURRENT_DATE))::TEXT, 2, '0');
  v_year := LPAD((EXTRACT(YEAR FROM COALESCE(NEW.date_note, CURRENT_DATE)) % 100)::TEXT, 2, '0');

  -- Récupérer le prochain numéro de séquence
  SELECT COALESCE(MAX(
    CASE WHEN reference ~ ('^NDG-' || v_month || '-' || v_year || '-[0-9]+$')
    THEN SUBSTRING(reference FROM '[0-9]+$')::INTEGER
    ELSE 0 END
  ), 0) + 1
  INTO v_sequence
  FROM notes_direction_generale
  WHERE EXTRACT(YEAR FROM date_note) = EXTRACT(YEAR FROM COALESCE(NEW.date_note, CURRENT_DATE))
    AND EXTRACT(MONTH FROM date_note) = EXTRACT(MONTH FROM COALESCE(NEW.date_note, CURRENT_DATE));

  v_ref := 'NDG-' || v_month || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

  NEW.reference := v_ref;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-génération de référence
DROP TRIGGER IF EXISTS trg_note_dg_reference ON notes_direction_generale;
CREATE TRIGGER trg_note_dg_reference
  BEFORE INSERT ON notes_direction_generale
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_note_dg_reference();

-- ============================================================================
-- 4. FONCTION: Mise à jour du timestamp updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_note_dg_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_note_dg_updated ON notes_direction_generale;
CREATE TRIGGER trg_note_dg_updated
  BEFORE UPDATE ON notes_direction_generale
  FOR EACH ROW
  EXECUTE FUNCTION update_note_dg_timestamp();

DROP TRIGGER IF EXISTS trg_note_dg_imputation_updated ON note_dg_imputations;
CREATE TRIGGER trg_note_dg_imputation_updated
  BEFORE UPDATE ON note_dg_imputations
  FOR EACH ROW
  EXECUTE FUNCTION update_note_dg_timestamp();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE notes_direction_generale ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_dg_imputations ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les notes diffusées
CREATE POLICY notes_dg_select_diffusees ON notes_direction_generale
  FOR SELECT
  USING (
    statut = 'diffusee'
    OR statut = 'dg_valide'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('Admin', 'DG', 'DAAF')
    )
  );

-- Policy: Création par utilisateurs authentifiés
CREATE POLICY notes_dg_insert ON notes_direction_generale
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Modification par créateur ou DG/Admin
CREATE POLICY notes_dg_update ON notes_direction_generale
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('Admin', 'DG')
    )
  );

-- Policy: Suppression par créateur (brouillon uniquement) ou Admin
CREATE POLICY notes_dg_delete ON notes_direction_generale
  FOR DELETE
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'Admin'
    )
  );

-- Policies pour imputations
CREATE POLICY note_dg_imputations_select ON note_dg_imputations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes_direction_generale n
      WHERE n.id = note_id
      AND (
        n.statut IN ('diffusee', 'dg_valide')
        OR n.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('Admin', 'DG', 'DAAF')
        )
      )
    )
  );

CREATE POLICY note_dg_imputations_all ON note_dg_imputations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM notes_direction_generale n
      WHERE n.id = note_id
      AND (
        n.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('Admin', 'DG')
        )
      )
    )
  );

-- ============================================================================
-- 6. SEED DE DONNÉES DE DÉMONSTRATION (optionnel)
-- ============================================================================

-- Note DG de démo
INSERT INTO notes_direction_generale (
  exercice,
  date_note,
  destinataire,
  objet,
  nom_prenoms,
  expose,
  avis,
  recommandations,
  statut,
  created_by
)
SELECT
  2026,
  CURRENT_DATE,
  'Tous les Directeurs',
  'Organisation de la réunion de coordination mensuelle',
  'Le Directeur Général',
  'Dans le cadre de l''amélioration de la coordination inter-directions, il est prévu d''organiser des réunions mensuelles de suivi des activités.',
  'Cette initiative permettra une meilleure circulation de l''information et un suivi plus efficace des projets transversaux.',
  'Il est demandé à chaque direction de préparer un rapport d''activités mensuel à présenter lors de ces réunions.',
  'brouillon',
  (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM notes_direction_generale WHERE objet LIKE '%réunion de coordination%'
)
AND EXISTS (SELECT 1 FROM profiles);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

COMMENT ON FUNCTION generate_note_dg_reference IS 'Génère automatiquement une référence unique pour les notes DG (format NDG-MM-YY-XXXX)';
