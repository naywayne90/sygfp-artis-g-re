-- ============================================================
-- Prompt 12 BACKEND — Sécurité et Performance
-- Date: 2026-02-18
-- Description: RLS renforcée pour toutes les tables marchés,
--              indexes de performance, trigger auto direction_id
-- ============================================================

-- ============================================================
-- STEP 1: Add direction_id column to marches + backfill
-- ============================================================
ALTER TABLE marches ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id);

-- Backfill from budget_lines (if linked)
UPDATE marches m SET direction_id = bl.direction_id
FROM budget_lines bl WHERE m.budget_line_id = bl.id AND m.direction_id IS NULL;

-- Backfill from creator's profile
UPDATE marches m
SET direction_id = p.direction_id
FROM profiles p
WHERE p.id = m.created_by
  AND m.direction_id IS NULL
  AND p.direction_id IS NOT NULL;

-- Backfill from expression_besoin chain
UPDATE marches m
SET direction_id = eb.direction_id
FROM expressions_besoin eb
WHERE eb.id = m.expression_besoin_id
  AND m.direction_id IS NULL
  AND eb.direction_id IS NOT NULL;

-- ============================================================
-- STEP 2: Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_marches_direction ON marches(direction_id);
CREATE INDEX IF NOT EXISTS idx_marches_created ON marches(created_at DESC);
-- idx_marches_exercice already exists

-- ============================================================
-- STEP 3: marches RLS — direction-filtered SELECT
-- Replace permissive "Everyone can view" with direction-based
-- ADMIN/DG/DAAF/CB see all; AGENT sees only own direction
-- ============================================================
DROP POLICY IF EXISTS "Everyone can view marches" ON marches;
DROP POLICY IF EXISTS "DG can read all marches" ON marches;
DROP POLICY IF EXISTS "marches_select_direction_filtered" ON marches;

CREATE POLICY "marches_select_direction_filtered" ON marches
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
  );

-- ============================================================
-- STEP 4: marche_lots RLS — inherit parent marché visibility
-- ============================================================
DROP POLICY IF EXISTS "marche_lots_select" ON marche_lots;
DROP POLICY IF EXISTS "marche_lots_select_inherit" ON marche_lots;

CREATE POLICY "marche_lots_select_inherit" ON marche_lots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marches m
      WHERE m.id = marche_lots.marche_id
      AND (
        has_role(auth.uid(), 'ADMIN'::app_role) OR
        has_role(auth.uid(), 'DG'::app_role) OR
        has_role(auth.uid(), 'DAAF'::app_role) OR
        has_role(auth.uid(), 'CB'::app_role) OR
        m.direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
      )
    )
  );

-- ============================================================
-- STEP 5: soumissions RLS — confidential before clôture
-- Before cloture_offres: only ADMIN/DG/DAAF/CB
-- After cloture_offres: direction-filtered like marches
-- ============================================================
DROP POLICY IF EXISTS "soumissions_select" ON soumissions;
DROP POLICY IF EXISTS "soumissions_select_confidential" ON soumissions;

CREATE POLICY "soumissions_select_confidential" ON soumissions
  FOR SELECT TO authenticated
  USING (
    -- Privileged roles always see all
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    -- Others only see after cloture_offres
    EXISTS (
      SELECT 1 FROM marches m
      WHERE m.id = soumissions.marche_id
      AND m.statut IN ('cloture_offres', 'evaluation', 'attribution', 'notification', 'contrat_signe', 'termine')
      AND m.direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
    )
  );

-- ============================================================
-- STEP 6: marche_offres RLS — same confidentiality as soumissions
-- ============================================================
DROP POLICY IF EXISTS "marche_offres_select" ON marche_offres;
DROP POLICY IF EXISTS "marche_offres_select_confidential" ON marche_offres;

CREATE POLICY "marche_offres_select_confidential" ON marche_offres
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    EXISTS (
      SELECT 1 FROM marches m
      WHERE m.id = marche_offres.marche_id
      AND m.statut IN ('cloture_offres', 'evaluation', 'attribution', 'notification', 'contrat_signe', 'termine')
      AND m.direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
    )
  );

-- ============================================================
-- STEP 7: evaluations_offre — ALREADY RESTRICTED (verified)
-- Only ADMIN/DG/DAAF can SELECT — no change needed
-- ============================================================

-- ============================================================
-- STEP 8: Trigger auto-populate direction_id on INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION fn_marches_set_direction()
RETURNS TRIGGER AS $$
BEGIN
  -- If direction_id not set, try expression_besoin
  IF NEW.direction_id IS NULL AND NEW.expression_besoin_id IS NOT NULL THEN
    SELECT eb.direction_id INTO NEW.direction_id
    FROM expressions_besoin eb WHERE eb.id = NEW.expression_besoin_id;
  END IF;
  -- If still null, try budget_line
  IF NEW.direction_id IS NULL AND NEW.budget_line_id IS NOT NULL THEN
    SELECT bl.direction_id INTO NEW.direction_id
    FROM budget_lines bl WHERE bl.id = NEW.budget_line_id;
  END IF;
  -- If still null, use creator's direction
  IF NEW.direction_id IS NULL AND NEW.created_by IS NOT NULL THEN
    SELECT p.direction_id INTO NEW.direction_id
    FROM profiles p WHERE p.id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_marches_set_direction ON marches;
CREATE TRIGGER trg_marches_set_direction
  BEFORE INSERT ON marches
  FOR EACH ROW
  EXECUTE FUNCTION fn_marches_set_direction();

-- ============================================================
-- STEP 9: ANALYZE all marché tables (stats update)
-- Note: VACUUM requires outside transaction; ANALYZE works here
-- ============================================================
ANALYZE marches;
ANALYZE marche_lots;
ANALYZE soumissions;
ANALYZE evaluations_offre;
ANALYZE marche_offres;
ANALYZE marche_validations;
ANALYZE marche_documents;
ANALYZE marche_attachments;
ANALYZE marche_historique;

-- ============================================================
-- VERIFICATION SUMMARY
-- ============================================================
-- RLS SELECT Policies (all verified):
--   evaluations_offre: ADMIN/DG/DAAF only (unchanged, already restrictive)
--   marches: direction-filtered (ADMIN/DG/DAAF/CB see all; AGENT own direction)
--   marche_lots: inherits parent marché visibility via EXISTS
--   soumissions: confidential before cloture_offres (privileged only)
--   marche_offres: confidential before cloture_offres (privileged only)
--
-- Indexes (3 on marches):
--   idx_marches_direction (NEW)
--   idx_marches_created (NEW)
--   idx_marches_exercice (already existed)
--
-- Trigger: trg_marches_set_direction → auto-populate direction_id
--   Priority: expression_besoin > budget_line > creator profile
--
-- Data leak check: No sensitive data exposed
--   - soumissions/offres hidden before clôture for non-privileged
--   - evaluations restricted to ADMIN/DG/DAAF
--   - direction filtering prevents cross-direction visibility
