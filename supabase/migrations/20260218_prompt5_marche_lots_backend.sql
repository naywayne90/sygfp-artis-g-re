-- ============================================================
-- Prompt 5 BACKEND — Table marche_lots (renforcement)
-- Date: 2026-02-18
-- Description: CHECK, triggers, recalcul montant marché parent
-- ============================================================

-- ============================================================
-- 1. TABLE EXISTANTE marche_lots (12 colonnes)
-- ============================================================
-- La table existait déjà avec la structure complète:
--   id (uuid PK), marche_id (uuid FK NOT NULL), numero_lot (int NOT NULL),
--   intitule (varchar NOT NULL), description (text), montant_estime (numeric),
--   montant_attribue (numeric), statut (varchar), attributaire_id (uuid FK),
--   date_attribution (date), created_at (timestamptz), updated_at (timestamptz)
--
-- Existant:
--   RLS: activé ✅
--   Policy: "Authenticated access lots" (ALL, authenticated) — permissif
--   Index: idx_marche_lots_marche + UNIQUE(marche_id, numero_lot)
--   Triggers: AUCUN ⚠️
--   Données: 0 lots (16 marchés n'ont aucun lot)

-- ============================================================
-- 2. CHECK CONSTRAINT sur statut
-- ============================================================
ALTER TABLE marche_lots DROP CONSTRAINT IF EXISTS marche_lots_statut_check;
ALTER TABLE marche_lots ADD CONSTRAINT marche_lots_statut_check
  CHECK (statut IN ('ouvert','cloture','evalue','attribue','annule'));

-- ============================================================
-- 3. TRIGGER updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_marche_lots_updated_at ON marche_lots;
CREATE TRIGGER update_marche_lots_updated_at
  BEFORE UPDATE ON marche_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. TRIGGER recalcul montant_estime du marché parent
-- ============================================================
-- Quand on INSERT/UPDATE/DELETE un lot, le montant_estime du marché
-- parent est recalculé comme la somme des montant_estime des lots
CREATE OR REPLACE FUNCTION public.fn_recalc_marche_montant_from_lots()
RETURNS TRIGGER AS $$
DECLARE
  v_marche_id UUID;
  v_total NUMERIC;
BEGIN
  v_marche_id := COALESCE(NEW.marche_id, OLD.marche_id);

  SELECT COALESCE(SUM(montant_estime), 0) INTO v_total
  FROM marche_lots WHERE marche_id = v_marche_id;

  UPDATE marches SET montant_estime = v_total, updated_at = now()
  WHERE id = v_marche_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_recalc_marche_montant ON marche_lots;
CREATE TRIGGER trg_recalc_marche_montant
  AFTER INSERT OR UPDATE OF montant_estime OR DELETE ON marche_lots
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalc_marche_montant_from_lots();

-- ============================================================
-- 5. VÉRIFICATION — marchés existants avec lots
-- ============================================================
-- 0/16 marchés ont des lots (table marche_lots est vide)
-- La policy RLS existante est permissive (ALL pour authenticated)
-- mais suffisante pour le moment — à affiner si besoin
--
-- Résumé des changements:
--   +1 CHECK constraint: statut IN (ouvert, cloture, evalue, attribue, annule)
--   +1 trigger: update_marche_lots_updated_at (auto updated_at)
--   +1 trigger: trg_recalc_marche_montant (somme lots → marché parent)
--   +1 fonction: fn_recalc_marche_montant_from_lots()
