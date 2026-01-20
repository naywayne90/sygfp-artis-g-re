-- Migration PROMPT 27: Tables d'imputation DG pour Notes SEF
-- Permet au DG d'attribuer des instructions aux directions/services

-- 1. Créer l'ENUM pour les types d'instruction
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instruction_type') THEN
    CREATE TYPE instruction_type AS ENUM (
      'ATTRIBUTION',
      'DIFFUSION',
      'SUIVI',
      'A_FAIRE_SUITE',
      'CLASSEMENT'
    );
  END IF;
END $$;

-- 2. Créer l'ENUM pour les priorités d'imputation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imputation_priorite') THEN
    CREATE TYPE imputation_priorite AS ENUM (
      'basse',
      'normale',
      'haute',
      'urgente'
    );
  END IF;
END $$;

-- 3. Table principale NoteImputation (une par note SEF)
CREATE TABLE IF NOT EXISTS note_imputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_sef_id UUID NOT NULL REFERENCES notes_sef(id) ON DELETE CASCADE,
  impute_par_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte d'unicité : une seule imputation par note SEF
  CONSTRAINT unique_imputation_per_note UNIQUE (note_sef_id)
);

-- 4. Table des lignes d'imputation
CREATE TABLE IF NOT EXISTS note_imputation_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imputation_id UUID NOT NULL REFERENCES note_imputations(id) ON DELETE CASCADE,
  destinataire TEXT NOT NULL, -- Direction ou service destinataire
  destinataire_id UUID REFERENCES directions(id), -- Optionnel: lien vers table directions
  instruction_type instruction_type NOT NULL DEFAULT 'ATTRIBUTION',
  action_detail TEXT, -- Détail de l'action à effectuer
  priorite imputation_priorite NOT NULL DEFAULT 'normale',
  delai TEXT, -- Date ou texte libre (ex: "sous 48h", "urgent", "2026-01-25")
  ordre INTEGER NOT NULL DEFAULT 0, -- Ordre d'affichage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Index pour performances
CREATE INDEX IF NOT EXISTS idx_note_imputations_note_sef_id ON note_imputations(note_sef_id);
CREATE INDEX IF NOT EXISTS idx_note_imputations_impute_par ON note_imputations(impute_par_user_id);
CREATE INDEX IF NOT EXISTS idx_note_imputation_lignes_imputation_id ON note_imputation_lignes(imputation_id);
CREATE INDEX IF NOT EXISTS idx_note_imputation_lignes_destinataire_id ON note_imputation_lignes(destinataire_id);

-- 6. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_note_imputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_note_imputations_updated_at ON note_imputations;
CREATE TRIGGER trigger_note_imputations_updated_at
  BEFORE UPDATE ON note_imputations
  FOR EACH ROW
  EXECUTE FUNCTION update_note_imputation_updated_at();

DROP TRIGGER IF EXISTS trigger_note_imputation_lignes_updated_at ON note_imputation_lignes;
CREATE TRIGGER trigger_note_imputation_lignes_updated_at
  BEFORE UPDATE ON note_imputation_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_imputation_updated_at();

-- 7. RLS Policies
ALTER TABLE note_imputations ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_imputation_lignes ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les imputations
CREATE POLICY "note_imputations_select_all" ON note_imputations
  FOR SELECT USING (true);

CREATE POLICY "note_imputation_lignes_select_all" ON note_imputation_lignes
  FOR SELECT USING (true);

-- Policy: Seul le DG ou Admin peut créer/modifier/supprimer
CREATE POLICY "note_imputations_insert_dg" ON note_imputations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

CREATE POLICY "note_imputations_update_dg" ON note_imputations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

CREATE POLICY "note_imputations_delete_dg" ON note_imputations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

CREATE POLICY "note_imputation_lignes_insert_dg" ON note_imputation_lignes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

CREATE POLICY "note_imputation_lignes_update_dg" ON note_imputation_lignes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

CREATE POLICY "note_imputation_lignes_delete_dg" ON note_imputation_lignes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin')
    )
  );

-- 8. Commentaires
COMMENT ON TABLE note_imputations IS 'Imputations DG sur les notes SEF - instructions aux directions/services';
COMMENT ON TABLE note_imputation_lignes IS 'Lignes d''imputation avec destinataires et instructions';
COMMENT ON COLUMN note_imputations.impute_par_user_id IS 'Utilisateur DG ayant effectué l''imputation';
COMMENT ON COLUMN note_imputation_lignes.instruction_type IS 'Type d''instruction: ATTRIBUTION, DIFFUSION, SUIVI, A_FAIRE_SUITE, CLASSEMENT';
COMMENT ON COLUMN note_imputation_lignes.priorite IS 'Priorité de l''instruction: basse, normale, haute, urgente';
COMMENT ON COLUMN note_imputation_lignes.delai IS 'Délai pour l''action (format libre ou date)';
COMMENT ON COLUMN note_imputation_lignes.ordre IS 'Ordre d''affichage des lignes';
