-- ============================================================
-- MIGRATION: Unification codification ARTI pour LIQ, ORD, REG
-- Date: 2026-04-13
-- Description: Remplace les anciens triggers de numérotation
--   (LIQ-YYYY-NNNN, ORD-YYYY-NNNN, REG-YYYY-NNNN) par le
--   format ARTI unifié (14 caractères) pour les 3 modules :
--   - Liquidation  (étape 6) : ARTI06MMYYNNNN
--   - Ordonnancement (étape 7) : ARTI07MMYYNNNN
--   - Règlement   (étape 8) : ARTI08MMYYNNNN
--
--   Les données existantes sont CONSERVÉES telles quelles.
--   Seuls les NOUVEAUX enregistrements reçoivent le format ARTI.
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : LIQUIDATIONS (étape 6)
-- ============================================================

-- 1a. Créer la fonction trigger ARTI pour liquidations
CREATE OR REPLACE FUNCTION trg_fn_liquidation_arti_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
BEGIN
  -- Ne générer que si le numéro est null ou vide
  -- Les données migrées (LIQ-YYYY-NNNN) gardent leur numéro
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_ref := generate_arti_reference(6, COALESCE(NEW.created_at, now()));
    NEW.numero := v_ref;
  END IF;
  RETURN NEW;
END;
$$;

-- 1b. Supprimer les 2 anciens triggers dupliqués sur budget_liquidations
DROP TRIGGER IF EXISTS generate_liquidation_numero_trigger ON budget_liquidations;
DROP TRIGGER IF EXISTS trigger_generate_liquidation_numero ON budget_liquidations;
DROP TRIGGER IF EXISTS trg_unified_ref_liquidations ON budget_liquidations;
DROP TRIGGER IF EXISTS trg_liquidation_arti_ref ON budget_liquidations;

-- 1c. Créer le nouveau trigger ARTI (étape 6)
CREATE TRIGGER trg_liquidation_arti_ref
  BEFORE INSERT ON budget_liquidations
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION trg_fn_liquidation_arti_reference();

-- ============================================================
-- ÉTAPE 2 : ORDONNANCEMENTS (étape 7)
-- ============================================================

-- 2a. Créer la fonction trigger ARTI pour ordonnancements
CREATE OR REPLACE FUNCTION trg_fn_ordonnancement_arti_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_ref := generate_arti_reference(7, COALESCE(NEW.created_at, now()));
    NEW.numero := v_ref;
  END IF;
  RETURN NEW;
END;
$$;

-- 2b. Supprimer les anciens triggers sur ordonnancements
DROP TRIGGER IF EXISTS trigger_generate_ordonnancement_numero ON ordonnancements;
DROP TRIGGER IF EXISTS generate_ordonnancement_numero_trigger ON ordonnancements;
DROP TRIGGER IF EXISTS set_ordonnancement_numero ON ordonnancements;
DROP TRIGGER IF EXISTS trg_unified_ref_ordonnancements ON ordonnancements;
DROP TRIGGER IF EXISTS trg_ordonnancement_arti_ref ON ordonnancements;

-- 2c. Créer le nouveau trigger ARTI (étape 7)
CREATE TRIGGER trg_ordonnancement_arti_ref
  BEFORE INSERT ON ordonnancements
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION trg_fn_ordonnancement_arti_reference();

-- ============================================================
-- ÉTAPE 3 : RÈGLEMENTS (étape 8)
-- ============================================================

-- 3a. Créer la fonction trigger corrigée (étape 8, pas 4)
CREATE OR REPLACE FUNCTION trg_fn_reglement_arti_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    -- CORRECTION: étape 8 (REG) au lieu de 4 (PM) qui était erroné
    v_ref := generate_arti_reference(8, COALESCE(NEW.created_at, now()));
    NEW.numero := v_ref;
  END IF;
  RETURN NEW;
END;
$$;

-- 3b. Supprimer les anciens triggers sur reglements
DROP TRIGGER IF EXISTS trigger_generate_reglement_numero ON reglements;
DROP TRIGGER IF EXISTS trg_unified_ref_reglements ON reglements;
DROP TRIGGER IF EXISTS trg_reglement_arti_ref ON reglements;

-- 3c. Créer le nouveau trigger ARTI (étape 8)
CREATE TRIGGER trg_reglement_arti_ref
  BEFORE INSERT ON reglements
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION trg_fn_reglement_arti_reference();

-- ============================================================
-- ÉTAPE 4 : INDEX pour recherche par format ARTI
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_numero_arti ON budget_liquidations(numero) WHERE numero LIKE 'ARTI%';
CREATE INDEX IF NOT EXISTS idx_ordonnancements_numero_arti ON ordonnancements(numero) WHERE numero LIKE 'ARTI%';
CREATE INDEX IF NOT EXISTS idx_reglements_numero_arti ON reglements(numero) WHERE numero LIKE 'ARTI%';

-- ============================================================
-- ÉTAPE 5 : DOCUMENTATION
-- ============================================================
COMMENT ON FUNCTION generate_arti_reference IS
'Génère une référence ARTI au format 14 caractères : ARTI + étape(2) + mois(2) + année(2) + séquence(4).
Codes d''étape : 0=SEF, 1=AEF, 2=IMP, 3=EB, 4=PM, 5=ENG, 6=LIQ, 7=ORD, 8=REG, 9=VIR.
Compteur mensuel atomique via table arti_reference_counters.';
