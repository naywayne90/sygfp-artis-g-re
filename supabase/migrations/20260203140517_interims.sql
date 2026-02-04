-- =====================================================
-- Migration : Module de Gestion des Intérims
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Objectif : Permettre la délégation temporaire de validation
-- =====================================================

-- Table des intérims
CREATE TABLE IF NOT EXISTS interims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulaire_id UUID NOT NULL REFERENCES profiles(id),
  interimaire_id UUID NOT NULL REFERENCES profiles(id),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  motif TEXT NOT NULL,
  est_actif BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dates_valides CHECK (date_fin >= date_debut),
  CONSTRAINT pas_auto_interim CHECK (titulaire_id != interimaire_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_interims_actif ON interims(titulaire_id, est_actif) WHERE est_actif = true;
CREATE INDEX IF NOT EXISTS idx_interims_interimaire ON interims(interimaire_id, est_actif) WHERE est_actif = true;
CREATE INDEX IF NOT EXISTS idx_interims_dates ON interims(date_debut, date_fin);

-- Fonction : Vérifier si un utilisateur agit en tant qu'intérimaire
CREATE OR REPLACE FUNCTION get_active_interim_for_user(p_user_id UUID)
RETURNS TABLE(interim_id UUID, titulaire_id UUID, titulaire_nom TEXT, date_fin DATE)
LANGUAGE sql
STABLE
AS $func$
  SELECT i.id, i.titulaire_id, COALESCE(p.full_name, p.first_name || ' ' || p.last_name), i.date_fin
  FROM interims i
  JOIN profiles p ON p.id = i.titulaire_id
  WHERE i.interimaire_id = p_user_id
  AND i.est_actif = true
  AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin;
$func$;

-- Fonction : Vérifier si un utilisateur a un intérimaire actif
CREATE OR REPLACE FUNCTION get_active_interim_for_titulaire(p_titulaire_id UUID)
RETURNS TABLE(interim_id UUID, interimaire_id UUID, interimaire_nom TEXT, date_debut DATE, date_fin DATE)
LANGUAGE sql
STABLE
AS $func$
  SELECT i.id, i.interimaire_id, COALESCE(p.full_name, p.first_name || ' ' || p.last_name), i.date_debut, i.date_fin
  FROM interims i
  JOIN profiles p ON p.id = i.interimaire_id
  WHERE i.titulaire_id = p_titulaire_id
  AND i.est_actif = true
  AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin;
$func$;

-- Fonction : Créer un intérim
CREATE OR REPLACE FUNCTION create_interim(
  p_titulaire_id UUID,
  p_interimaire_id UUID,
  p_date_debut DATE,
  p_date_fin DATE,
  p_motif TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_id UUID;
BEGIN
  -- Vérifier que le titulaire et l'intérimaire sont différents
  IF p_titulaire_id = p_interimaire_id THEN
    RAISE EXCEPTION 'Le titulaire ne peut pas être son propre intérimaire';
  END IF;

  -- Vérifier les dates
  IF p_date_fin < p_date_debut THEN
    RAISE EXCEPTION 'La date de fin doit être postérieure à la date de début';
  END IF;

  -- Vérifier qu'il n'y a pas déjà un intérim actif pour ce titulaire sur la période
  IF EXISTS (
    SELECT 1 FROM interims
    WHERE titulaire_id = p_titulaire_id
    AND est_actif = true
    AND date_fin >= p_date_debut
    AND date_debut <= p_date_fin
  ) THEN
    RAISE EXCEPTION 'Un intérim est déjà actif pour ce titulaire sur cette période';
  END IF;

  -- Vérifier que l'intérimaire n'a pas déjà un intérim actif comme intérimaire sur la période
  IF EXISTS (
    SELECT 1 FROM interims
    WHERE interimaire_id = p_interimaire_id
    AND est_actif = true
    AND date_fin >= p_date_debut
    AND date_debut <= p_date_fin
  ) THEN
    RAISE EXCEPTION 'L''intérimaire est déjà assigné à un autre intérim sur cette période';
  END IF;

  INSERT INTO interims (titulaire_id, interimaire_id, date_debut, date_fin, motif, created_by)
  VALUES (p_titulaire_id, p_interimaire_id, p_date_debut, p_date_fin, p_motif, auth.uid())
  RETURNING id INTO v_id;

  -- Créer une notification pour l'intérimaire
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
  VALUES (
    p_interimaire_id,
    'interim_assigne',
    'Intérim assigné',
    'Vous êtes désigné comme intérimaire du ' || p_date_debut::TEXT || ' au ' || p_date_fin::TEXT,
    'interims',
    v_id,
    'workflow'
  );

  RETURN v_id;
END;
$func$;

-- Fonction : Terminer un intérim
CREATE OR REPLACE FUNCTION end_interim(p_interim_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_interimaire_id UUID;
BEGIN
  -- Récupérer l'intérimaire pour notification
  SELECT interimaire_id INTO v_interimaire_id
  FROM interims
  WHERE id = p_interim_id AND est_actif = true;

  IF v_interimaire_id IS NULL THEN
    RETURN false;
  END IF;

  -- Terminer l'intérim
  UPDATE interims
  SET est_actif = false,
      date_fin = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = p_interim_id;

  -- Notifier l'intérimaire
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
  VALUES (
    v_interimaire_id,
    'interim_termine',
    'Intérim terminé',
    'Votre période d''intérim a pris fin.',
    'interims',
    p_interim_id,
    'workflow'
  );

  RETURN true;
END;
$func$;

-- Fonction : Vérifier si un utilisateur peut valider pour un autre (via intérim)
CREATE OR REPLACE FUNCTION can_validate_as_interim(p_user_id UUID, p_titulaire_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM interims
    WHERE interimaire_id = p_user_id
    AND titulaire_id = p_titulaire_id
    AND est_actif = true
    AND CURRENT_DATE BETWEEN date_debut AND date_fin
  );
$func$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_interims_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_interims_updated_at ON interims;
CREATE TRIGGER trigger_interims_updated_at
BEFORE UPDATE ON interims
FOR EACH ROW EXECUTE FUNCTION update_interims_updated_at();

-- Trigger pour désactiver automatiquement les intérims expirés
CREATE OR REPLACE FUNCTION deactivate_expired_interims()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE interims
  SET est_actif = false, updated_at = NOW()
  WHERE est_actif = true AND date_fin < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$func$;

-- RLS (Row Level Security)
ALTER TABLE interims ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut voir les intérims
CREATE POLICY "interims_select_all" ON interims
  FOR SELECT USING (true);

-- Politique: Seuls les utilisateurs authentifiés peuvent créer/modifier
CREATE POLICY "interims_insert" ON interims
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "interims_update" ON interims
  FOR UPDATE USING (
    auth.uid() = created_by
    OR auth.uid() = titulaire_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_hierarchique IN ('DG', 'Directeur')
    )
  );

-- Permissions
GRANT SELECT ON interims TO authenticated;
GRANT INSERT, UPDATE ON interims TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_interim_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_interim_for_titulaire TO authenticated;
GRANT EXECUTE ON FUNCTION create_interim TO authenticated;
GRANT EXECUTE ON FUNCTION end_interim TO authenticated;
GRANT EXECUTE ON FUNCTION can_validate_as_interim TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_expired_interims TO service_role;

-- Comments
COMMENT ON TABLE interims IS 'Table de gestion des intérims pour délégation de validation';
COMMENT ON FUNCTION get_active_interim_for_user IS 'Retourne les intérims actifs où l''utilisateur est intérimaire';
COMMENT ON FUNCTION get_active_interim_for_titulaire IS 'Retourne l''intérimaire actif pour un titulaire donné';
COMMENT ON FUNCTION create_interim IS 'Crée un nouvel intérim avec validations';
COMMENT ON FUNCTION end_interim IS 'Termine un intérim avant sa date de fin prévue';
COMMENT ON FUNCTION can_validate_as_interim IS 'Vérifie si un utilisateur peut valider en tant qu''intérimaire';
COMMENT ON FUNCTION deactivate_expired_interims IS 'Désactive les intérims expirés (à appeler via cron)';
