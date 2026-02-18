-- ============================================================
-- Prompt 7 — Evaluation COJO : colonnes + trigger sur soumissionnaires_lot
-- Date: 2026-02-18
-- Description:
--   1a. Nouvelles colonnes (qualifie_technique, note_finale, rang_classement)
--   1b. Trigger auto-calcul note_finale
--   1c. Fonction de classement recalculate_ranking()
-- ============================================================

-- ============================================================
-- 1a. NOUVELLES COLONNES sur soumissionnaires_lot
-- ============================================================
ALTER TABLE soumissionnaires_lot
  ADD COLUMN IF NOT EXISTS qualifie_technique BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS note_finale NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS rang_classement INTEGER;

-- ============================================================
-- 1b. TRIGGER auto-calcul note_finale
-- ============================================================
-- Formule : note_finale = ROUND((note_technique * 0.7) + (note_financiere * 0.3), 2)
-- Seuil technique : note_technique >= 70 pour etre qualifie
-- Si note_technique < 70 : statut = 'elimine', motif auto

CREATE OR REPLACE FUNCTION public.calculate_note_finale()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer qualifie_technique
  IF NEW.note_technique IS NOT NULL THEN
    NEW.qualifie_technique := (NEW.note_technique >= 70);
  ELSE
    NEW.qualifie_technique := false;
  END IF;

  -- Calculer note_finale si les deux notes sont presentes
  IF NEW.note_technique IS NOT NULL AND NEW.note_financiere IS NOT NULL THEN
    NEW.note_finale := ROUND((NEW.note_technique * 0.7) + (NEW.note_financiere * 0.3), 2);
  ELSE
    NEW.note_finale := NULL;
  END IF;

  -- Auto-elimination si note_technique < 70
  IF NEW.note_technique IS NOT NULL AND NEW.note_technique < 70 THEN
    NEW.statut := 'elimine';
    NEW.motif_elimination := 'Score technique insuffisant (< 70/100)';
    NEW.note_finale := NULL;
    NEW.rang_classement := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_calculate_note_finale ON soumissionnaires_lot;
CREATE TRIGGER trg_calculate_note_finale
  BEFORE INSERT OR UPDATE OF note_technique, note_financiere ON soumissionnaires_lot
  FOR EACH ROW
  EXECUTE FUNCTION calculate_note_finale();

-- ============================================================
-- 1c. FONCTION de classement
-- ============================================================
-- Classe les soumissionnaires qualifies par note_finale DESC
-- Met a jour rang_classement (1, 2, 3...)
-- Les elimines ont rang_classement = NULL

CREATE OR REPLACE FUNCTION public.recalculate_ranking(
  p_passation_id UUID,
  p_lot_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Calculer le rang pour les qualifies
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (ORDER BY note_finale DESC NULLS LAST) AS new_rang
    FROM soumissionnaires_lot
    WHERE passation_marche_id = p_passation_id
      AND (p_lot_id IS NULL OR lot_marche_id = p_lot_id)
      AND qualifie_technique = true
      AND note_finale IS NOT NULL
      AND statut NOT IN ('elimine')
  )
  UPDATE soumissionnaires_lot s
  SET rang_classement = r.new_rang
  FROM ranked r
  WHERE s.id = r.id AND (s.rang_classement IS DISTINCT FROM r.new_rang);

  -- Rang NULL pour les non qualifies / elimines
  UPDATE soumissionnaires_lot
  SET rang_classement = NULL
  WHERE passation_marche_id = p_passation_id
    AND (p_lot_id IS NULL OR lot_marche_id = p_lot_id)
    AND (qualifie_technique = false OR note_finale IS NULL OR statut = 'elimine')
    AND rang_classement IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- INDEX pour performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_soumissionnaires_lot_note_finale
  ON soumissionnaires_lot(note_finale DESC NULLS LAST)
  WHERE qualifie_technique = true;

CREATE INDEX IF NOT EXISTS idx_soumissionnaires_lot_rang
  ON soumissionnaires_lot(rang_classement)
  WHERE rang_classement IS NOT NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Colonnes ajoutees: qualifie_technique, note_finale, rang_classement
-- Trigger: trg_calculate_note_finale (BEFORE INSERT/UPDATE OF note_technique, note_financiere)
-- Fonction: calculate_note_finale() - calcul auto + elimination auto si < 70
-- Fonction: recalculate_ranking(p_passation_id, p_lot_id) - classement par note_finale DESC
-- 2 index partiels pour performances
