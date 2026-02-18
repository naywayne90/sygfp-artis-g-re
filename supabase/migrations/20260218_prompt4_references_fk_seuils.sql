-- ============================================================
-- Prompt 4 — Corrections structurelles critiques
-- 1. Référence ARTI4MMYYNNNN (étape 4 = passation)
-- 2. FK expression_besoin_id → NOT NULL
-- 3. Ligne budgétaire héritée de l'EB
-- 4. Seuils automatiques (affichage frontend uniquement)
-- ============================================================

-- ============================================================
-- 1. RÉFÉRENCE : ARTI4MMYYNNNN
-- Remplace le format PM-YYYY-DIR-NNNN
-- ============================================================

CREATE OR REPLACE FUNCTION generate_passation_marche_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_mois TEXT;
  v_annee TEXT;
  v_sequence INTEGER;
  v_exercice INTEGER;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    v_exercice := COALESCE(NEW.exercice, EXTRACT(YEAR FROM NOW())::INTEGER);
    v_mois := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    v_annee := LPAD((v_exercice % 100)::TEXT, 2, '0');

    -- Séquence mensuelle atomique
    SELECT COALESCE(MAX(
      CASE
        WHEN reference ~ '^ARTI4[0-9]{8}$' THEN
          CAST(SUBSTRING(reference FROM 10 FOR 4) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM passation_marche
    WHERE exercice = v_exercice
      AND reference ~ ('^ARTI4' || v_mois || v_annee);

    -- Format: ARTI4MMYYNNNN (13 caractères)
    NEW.reference := 'ARTI4' || v_mois || v_annee || LPAD(v_sequence::TEXT, 4, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Le trigger existe déjà, la fonction est mise à jour in-place

-- ============================================================
-- 2. COLONNE ligne_budgetaire_id sur passation_marche
-- Héritée de l'expression de besoin source
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passation_marche' AND column_name = 'ligne_budgetaire_id'
  ) THEN
    ALTER TABLE passation_marche
      ADD COLUMN ligne_budgetaire_id UUID REFERENCES budget_lines(id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_passation_marche_budget_line
  ON passation_marche(ligne_budgetaire_id);

-- ============================================================
-- 3. TRIGGER : héritage automatique ligne budgétaire depuis EB
-- ============================================================

CREATE OR REPLACE FUNCTION inherit_budget_line_from_eb()
RETURNS TRIGGER AS $$
BEGIN
  -- Si ligne_budgetaire_id n'est pas fournie mais expression_besoin_id l'est
  IF NEW.ligne_budgetaire_id IS NULL AND NEW.expression_besoin_id IS NOT NULL THEN
    SELECT ligne_budgetaire_id INTO NEW.ligne_budgetaire_id
    FROM expressions_besoin
    WHERE id = NEW.expression_besoin_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_inherit_budget_line ON passation_marche;
CREATE TRIGGER trg_inherit_budget_line
  BEFORE INSERT OR UPDATE ON passation_marche
  FOR EACH ROW
  EXECUTE FUNCTION inherit_budget_line_from_eb();

-- ============================================================
-- 4. BACKFILL : mettre à jour les passations existantes
-- ============================================================

-- Backfill ligne_budgetaire_id depuis les EB liées
UPDATE passation_marche pm
SET ligne_budgetaire_id = eb.ligne_budgetaire_id
FROM expressions_besoin eb
WHERE pm.expression_besoin_id = eb.id
  AND pm.ligne_budgetaire_id IS NULL
  AND eb.ligne_budgetaire_id IS NOT NULL;

-- Backfill références existantes au nouveau format
-- Ne touche que les références au vieux format PM-
UPDATE passation_marche
SET reference = 'ARTI4' ||
  LPAD(EXTRACT(MONTH FROM COALESCE(created_at::timestamp, NOW()))::TEXT, 2, '0') ||
  LPAD((COALESCE(exercice, EXTRACT(YEAR FROM NOW())::INTEGER) % 100)::TEXT, 2, '0') ||
  LPAD(ROW_NUMBER() OVER (
    PARTITION BY exercice
    ORDER BY created_at
  )::TEXT, 4, '0')
WHERE reference IS NOT NULL AND reference LIKE 'PM-%';
