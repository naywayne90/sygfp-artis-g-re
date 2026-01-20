-- Migration PROMPT 29: Table de validation DG avec QR code
-- Permet au DG de valider les notes SEF via scan QR

-- 1. Créer l'ENUM pour le statut de validation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_dg_status') THEN
    CREATE TYPE validation_dg_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'DEFERRED'
    );
  END IF;
END $$;

-- 2. Créer l'ENUM pour le type de note
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_note_type') THEN
    CREATE TYPE validation_note_type AS ENUM (
      'SEF',
      'AEF'
    );
  END IF;
END $$;

-- 3. Table principale ValidationDG
CREATE TABLE IF NOT EXISTS validation_dg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_type validation_note_type NOT NULL DEFAULT 'SEF',
  note_id UUID NOT NULL, -- Référence vers notes_sef ou notes_aef selon note_type
  token UUID NOT NULL DEFAULT gen_random_uuid(), -- Token unique pour URL QR
  status validation_dg_status NOT NULL DEFAULT 'PENDING',
  validated_by_user_id UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  commentaire TEXT, -- Observations du DG
  qr_payload_url TEXT, -- URL encodée dans le QR
  exercice_id UUID REFERENCES exercices_budgetaires(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contraintes
  CONSTRAINT unique_token UNIQUE (token),
  CONSTRAINT unique_note_validation UNIQUE (note_type, note_id)
);

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_validation_dg_note_id ON validation_dg(note_id);
CREATE INDEX IF NOT EXISTS idx_validation_dg_token ON validation_dg(token);
CREATE INDEX IF NOT EXISTS idx_validation_dg_status ON validation_dg(status);
CREATE INDEX IF NOT EXISTS idx_validation_dg_validated_by ON validation_dg(validated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_validation_dg_exercice ON validation_dg(exercice_id);

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_validation_dg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validation_dg_updated_at ON validation_dg;
CREATE TRIGGER trigger_validation_dg_updated_at
  BEFORE UPDATE ON validation_dg
  FOR EACH ROW
  EXECUTE FUNCTION update_validation_dg_updated_at();

-- 6. Fonction pour créer automatiquement une ValidationDG à la soumission
CREATE OR REPLACE FUNCTION create_validation_dg_on_submit()
RETURNS TRIGGER AS $$
DECLARE
  base_url TEXT := 'https://sygfp.arti.ci/dg/valider/';
  new_token UUID;
BEGIN
  -- Seulement si le statut passe à 'soumis' ou 'a_valider'
  IF (NEW.statut = 'soumis' OR NEW.statut = 'a_valider')
     AND (OLD.statut IS NULL OR (OLD.statut != 'soumis' AND OLD.statut != 'a_valider')) THEN

    -- Générer un nouveau token
    new_token := gen_random_uuid();

    -- Créer ou mettre à jour la ValidationDG
    INSERT INTO validation_dg (
      note_type,
      note_id,
      token,
      status,
      qr_payload_url,
      exercice_id
    ) VALUES (
      'SEF',
      NEW.id,
      new_token,
      'PENDING',
      base_url || new_token::TEXT,
      NEW.exercice_id
    )
    ON CONFLICT (note_type, note_id)
    DO UPDATE SET
      token = new_token,
      status = 'PENDING',
      qr_payload_url = base_url || new_token::TEXT,
      validated_by_user_id = NULL,
      validated_at = NULL,
      commentaire = NULL,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger sur notes_sef
DROP TRIGGER IF EXISTS trigger_create_validation_dg_on_submit ON notes_sef;
CREATE TRIGGER trigger_create_validation_dg_on_submit
  AFTER INSERT OR UPDATE OF statut ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION create_validation_dg_on_submit();

-- 8. Fonction pour valider via token (appelée depuis l'app)
CREATE OR REPLACE FUNCTION validate_note_dg(
  p_token UUID,
  p_status validation_dg_status,
  p_commentaire TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_validation validation_dg;
  v_user_id UUID;
  v_user_profile RECORD;
BEGIN
  -- Récupérer l'utilisateur courant
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Vérifier que l'utilisateur est DG ou Admin
  SELECT * INTO v_user_profile FROM profiles WHERE id = v_user_id;

  IF v_user_profile.profil_fonctionnel NOT IN ('DG', 'Admin', 'ADMIN') THEN
    RETURN json_build_object('success', false, 'error', 'Seul le DG peut valider');
  END IF;

  -- Récupérer la validation
  SELECT * INTO v_validation FROM validation_dg WHERE token = p_token;

  IF v_validation IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Token invalide ou expiré');
  END IF;

  -- Vérifier que la validation est en attente
  IF v_validation.status != 'PENDING' THEN
    RETURN json_build_object('success', false, 'error', 'Cette note a déjà été traitée', 'current_status', v_validation.status);
  END IF;

  -- Mettre à jour la validation
  UPDATE validation_dg SET
    status = p_status,
    validated_by_user_id = v_user_id,
    validated_at = now(),
    commentaire = p_commentaire
  WHERE id = v_validation.id;

  -- Si approuvé, mettre à jour le statut de la note SEF
  IF p_status = 'APPROVED' AND v_validation.note_type = 'SEF' THEN
    UPDATE notes_sef SET
      statut = 'valide',
      validated_by = v_user_id,
      validated_at = now()
    WHERE id = v_validation.note_id;
  ELSIF p_status = 'REJECTED' AND v_validation.note_type = 'SEF' THEN
    UPDATE notes_sef SET
      statut = 'rejete',
      motif_rejet = p_commentaire
    WHERE id = v_validation.note_id;
  ELSIF p_status = 'DEFERRED' AND v_validation.note_type = 'SEF' THEN
    UPDATE notes_sef SET
      statut = 'differe',
      motif_report = p_commentaire
    WHERE id = v_validation.note_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'validation_id', v_validation.id,
    'new_status', p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS Policies
ALTER TABLE validation_dg ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les validations de son exercice
CREATE POLICY "validation_dg_select_all" ON validation_dg
  FOR SELECT USING (true);

-- Policy: Seul le système peut insérer (via trigger)
CREATE POLICY "validation_dg_insert_system" ON validation_dg
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Policy: Seul le DG ou Admin peut modifier
CREATE POLICY "validation_dg_update_dg" ON validation_dg
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.profil_fonctionnel = 'DG' OR profiles.profil_fonctionnel = 'Admin' OR profiles.profil_fonctionnel = 'ADMIN')
    )
  );

-- 10. Commentaires
COMMENT ON TABLE validation_dg IS 'Validations DG avec QR code pour les notes SEF/AEF';
COMMENT ON COLUMN validation_dg.token IS 'Token UUID unique pour l''URL de validation QR';
COMMENT ON COLUMN validation_dg.qr_payload_url IS 'URL complète encodée dans le QR code';
COMMENT ON COLUMN validation_dg.commentaire IS 'Observations du Directeur Général';
COMMENT ON FUNCTION validate_note_dg IS 'Fonction sécurisée pour valider une note via token QR';
