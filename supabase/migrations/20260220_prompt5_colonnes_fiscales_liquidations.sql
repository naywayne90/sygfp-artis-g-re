-- ===========================================================================
-- Prompt 5 BACKEND : Colonnes fiscales sur budget_liquidations
-- Date : 20 février 2026
-- ===========================================================================
-- Colonnes existantes : montant, montant_ht, tva_taux, tva_montant,
--   airsi_taux, airsi_montant, retenue_source_taux, retenue_source_montant,
--   net_a_payer, regime_fiscal
-- Colonnes ajoutées : tva_applicable, retenue_bic, retenue_bnc, penalites
-- Trigger : fn_calc_liquidation_fiscals (BEFORE INSERT/UPDATE)
-- Contrainte : net_a_payer >= 0
-- ===========================================================================

-- ============================================================================
-- 1. Ajouter les colonnes manquantes
-- ============================================================================
ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS tva_applicable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS retenue_bic NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retenue_bnc NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalites NUMERIC DEFAULT 0;

-- ============================================================================
-- 2. Backfill legacy : montant_ht = montant pour les lignes migrées
--    (4355 lignes ont montant_ht=0, dont 1561 avec montant > 0)
--    On met tva_applicable = false pour ces lignes legacy (TVA non trackée)
--    et on recalcule net_a_payer = montant - retenues existantes
-- ============================================================================
UPDATE budget_liquidations
SET
  montant_ht = montant,
  tva_applicable = false,
  tva_taux = 0,
  tva_montant = 0,
  net_a_payer = GREATEST(
    montant
    - COALESCE(airsi_montant, 0)
    - COALESCE(retenue_source_montant, 0),
    0
  )
WHERE montant_ht = 0 AND montant > 0;

-- ============================================================================
-- 3. montant_ht NOT NULL (aucun NULL existant, sûr)
-- ============================================================================
ALTER TABLE budget_liquidations ALTER COLUMN montant_ht SET NOT NULL;

-- ============================================================================
-- 4. Trigger de calcul automatique des montants fiscaux
--    NOTE : PostgreSQL ne permet pas de convertir une colonne existante
--    en GENERATED ALWAYS AS. On utilise un trigger BEFORE INSERT OR UPDATE.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calc_liquidation_fiscals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. TVA : montant TVA calculé depuis montant_ht × taux
  NEW.tva_montant := CASE
    WHEN COALESCE(NEW.tva_applicable, true)
    THEN ROUND(NEW.montant_ht * COALESCE(NEW.tva_taux, 18) / 100, 2)
    ELSE 0
  END;

  -- 2. Montant TTC = HT + TVA
  NEW.montant := NEW.montant_ht + NEW.tva_montant;

  -- 3. Retenues calculées depuis les taux (si taux renseigné)
  NEW.airsi_montant := ROUND(
    NEW.montant * COALESCE(NEW.airsi_taux, 0) / 100, 2
  );
  NEW.retenue_source_montant := ROUND(
    NEW.montant * COALESCE(NEW.retenue_source_taux, 0) / 100, 2
  );

  -- 4. Net à payer = TTC - toutes retenues
  NEW.net_a_payer := NEW.montant
    - COALESCE(NEW.airsi_montant, 0)
    - COALESCE(NEW.retenue_source_montant, 0)
    - COALESCE(NEW.retenue_bic, 0)
    - COALESCE(NEW.retenue_bnc, 0)
    - COALESCE(NEW.penalites, 0);

  RETURN NEW;
END;
$$;

-- Trigger sur les colonnes "input" uniquement (pas les colonnes calculées)
DROP TRIGGER IF EXISTS trg_calc_liquidation_fiscals ON budget_liquidations;

CREATE TRIGGER trg_calc_liquidation_fiscals
  BEFORE INSERT OR UPDATE OF
    montant_ht, tva_applicable, tva_taux,
    airsi_taux, retenue_source_taux,
    retenue_bic, retenue_bnc, penalites
  ON budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION fn_calc_liquidation_fiscals();

-- ============================================================================
-- 5. Contrainte : net à payer ne peut pas être négatif
-- ============================================================================
ALTER TABLE budget_liquidations
  DROP CONSTRAINT IF EXISTS chk_net_a_payer_non_negatif;

ALTER TABLE budget_liquidations
  ADD CONSTRAINT chk_net_a_payer_non_negatif CHECK (net_a_payer >= 0);
