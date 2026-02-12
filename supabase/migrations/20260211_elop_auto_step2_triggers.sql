-- ============================================================
-- ELOP Auto Step 2: Trigger function + triggers + backfill
-- ============================================================

-- -------------------------------------------------------
-- Function: recalculate_budget_line_totals()
-- Recalculates all ELOP totals for a given budget_line_id
-- from source tables (not incremental, avoids race conditions)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_budget_line_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line_id UUID;
  v_old_budget_line_id UUID;
  v_total_engage NUMERIC;
  v_total_liquide NUMERIC;
  v_total_ordonnance NUMERIC;
  v_total_paye NUMERIC;
  v_virements_recus NUMERIC;
  v_virements_emis NUMERIC;
  v_dotation_initiale NUMERIC;
  v_dotation_modifiee NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Determine which budget_line_id(s) to recalculate based on the trigger table

  IF TG_TABLE_NAME = 'budget_engagements' THEN
    -- Direct FK to budget_lines
    v_budget_line_id := COALESCE(NEW.budget_line_id, OLD.budget_line_id);

  ELSIF TG_TABLE_NAME = 'budget_liquidations' THEN
    -- Remonte via engagement_id -> budget_engagements.budget_line_id
    IF NEW IS NOT NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_engagements be WHERE be.id = NEW.engagement_id;
    END IF;
    IF OLD IS NOT NULL AND v_budget_line_id IS NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_engagements be WHERE be.id = OLD.engagement_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'ordonnancements' THEN
    -- Remonte via liquidation_id -> budget_liquidations.engagement_id -> budget_engagements.budget_line_id
    IF NEW IS NOT NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_liquidations bl
        JOIN budget_engagements be ON be.id = bl.engagement_id
        WHERE bl.id = NEW.liquidation_id;
    END IF;
    IF OLD IS NOT NULL AND v_budget_line_id IS NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_liquidations bl
        JOIN budget_engagements be ON be.id = bl.engagement_id
        WHERE bl.id = OLD.liquidation_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'reglements' THEN
    -- Remonte via ordonnancement_id -> ordonnancements.liquidation_id -> ...
    IF NEW IS NOT NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM ordonnancements o
        JOIN budget_liquidations bl ON bl.id = o.liquidation_id
        JOIN budget_engagements be ON be.id = bl.engagement_id
        WHERE o.id = NEW.ordonnancement_id;
    END IF;
    IF OLD IS NOT NULL AND v_budget_line_id IS NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM ordonnancements o
        JOIN budget_liquidations bl ON bl.id = o.liquidation_id
        JOIN budget_engagements be ON be.id = bl.engagement_id
        WHERE o.id = OLD.ordonnancement_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'credit_transfers' THEN
    -- Recalculate both from and to lines
    IF NEW IS NOT NULL THEN
      v_budget_line_id := NEW.to_budget_line_id;
      v_old_budget_line_id := NEW.from_budget_line_id;
    END IF;
    IF OLD IS NOT NULL THEN
      -- Also handle old values if they changed
      IF v_budget_line_id IS NULL THEN
        v_budget_line_id := OLD.to_budget_line_id;
      END IF;
      IF v_old_budget_line_id IS NULL THEN
        v_old_budget_line_id := OLD.from_budget_line_id;
      END IF;
    END IF;
  END IF;

  -- If we couldn't determine a budget_line_id, bail out
  IF v_budget_line_id IS NULL AND v_old_budget_line_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Recalculate for the primary budget_line_id
  IF v_budget_line_id IS NOT NULL THEN
    PERFORM _recalculate_single_budget_line(v_budget_line_id);
  END IF;

  -- Recalculate for the secondary budget_line_id (credit_transfers from_line)
  IF v_old_budget_line_id IS NOT NULL AND v_old_budget_line_id IS DISTINCT FROM v_budget_line_id THEN
    PERFORM _recalculate_single_budget_line(v_old_budget_line_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- Helper: _recalculate_single_budget_line(budget_line_id)
-- Does the actual recalculation for one budget line
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION _recalculate_single_budget_line(p_budget_line_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_engage NUMERIC;
  v_total_liquide NUMERIC;
  v_total_ordonnance NUMERIC;
  v_total_paye NUMERIC;
  v_virements_recus NUMERIC;
  v_virements_emis NUMERIC;
  v_dotation_initiale NUMERIC;
  v_dotation_modifiee NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Total engagé (engagements validés)
  SELECT COALESCE(SUM(montant), 0) INTO v_total_engage
    FROM budget_engagements
    WHERE budget_line_id = p_budget_line_id AND statut = 'valide';

  -- Total liquidé (liquidations validées, via engagement)
  SELECT COALESCE(SUM(bl.montant), 0) INTO v_total_liquide
    FROM budget_liquidations bl
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND bl.statut = 'valide';

  -- Total ordonnancé (ordonnancements validés/signés)
  SELECT COALESCE(SUM(o.montant), 0) INTO v_total_ordonnance
    FROM ordonnancements o
    JOIN budget_liquidations bl ON bl.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND o.statut IN ('valide', 'signe');

  -- Total payé (règlements payés/validés/confirmés)
  SELECT COALESCE(SUM(r.montant), 0) INTO v_total_paye
    FROM reglements r
    JOIN ordonnancements o ON o.id = r.ordonnancement_id
    JOIN budget_liquidations bl ON bl.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND r.statut IN ('paye', 'valide', 'confirme');

  -- Virements reçus
  SELECT COALESCE(SUM(amount), 0) INTO v_virements_recus
    FROM credit_transfers
    WHERE to_budget_line_id = p_budget_line_id AND status = 'execute';

  -- Virements émis
  SELECT COALESCE(SUM(amount), 0) INTO v_virements_emis
    FROM credit_transfers
    WHERE from_budget_line_id = p_budget_line_id AND status = 'execute';

  -- Get dotation_initiale
  SELECT dotation_initiale INTO v_dotation_initiale
    FROM budget_lines WHERE id = p_budget_line_id;

  -- Dotation modifiée = initiale + virements nets
  v_dotation_modifiee := COALESCE(v_dotation_initiale, 0) + v_virements_recus - v_virements_emis;

  -- Disponible = dotation modifiée - engagé
  v_disponible := v_dotation_modifiee - v_total_engage;

  -- Update budget_lines
  UPDATE budget_lines SET
    total_engage = v_total_engage,
    total_liquide = v_total_liquide,
    total_ordonnance = v_total_ordonnance,
    total_paye = v_total_paye,
    dotation_modifiee = v_dotation_modifiee,
    disponible_calcule = v_disponible,
    updated_at = NOW()
  WHERE id = p_budget_line_id;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- TRIGGERS
-- -------------------------------------------------------

-- Engagements
DROP TRIGGER IF EXISTS trg_recalc_elop_engagements ON budget_engagements;
CREATE TRIGGER trg_recalc_elop_engagements
  AFTER INSERT OR UPDATE OR DELETE ON budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();

-- Liquidations
DROP TRIGGER IF EXISTS trg_recalc_elop_liquidations ON budget_liquidations;
CREATE TRIGGER trg_recalc_elop_liquidations
  AFTER INSERT OR UPDATE OR DELETE ON budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();

-- Ordonnancements
DROP TRIGGER IF EXISTS trg_recalc_elop_ordonnancements ON ordonnancements;
CREATE TRIGGER trg_recalc_elop_ordonnancements
  AFTER INSERT OR UPDATE OR DELETE ON ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();

-- Règlements
DROP TRIGGER IF EXISTS trg_recalc_elop_reglements ON reglements;
CREATE TRIGGER trg_recalc_elop_reglements
  AFTER INSERT OR UPDATE OR DELETE ON reglements
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();

-- Credit transfers
DROP TRIGGER IF EXISTS trg_recalc_elop_credit_transfers ON credit_transfers;
CREATE TRIGGER trg_recalc_elop_credit_transfers
  AFTER INSERT OR UPDATE OR DELETE ON credit_transfers
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();


-- -------------------------------------------------------
-- BACKFILL: Recalculate all totals for active budget lines
-- -------------------------------------------------------
DO $$
DECLARE
  v_line_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_line_id IN
    SELECT id FROM budget_lines WHERE is_active = true
  LOOP
    PERFORM _recalculate_single_budget_line(v_line_id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Backfill complete: recalculated % budget lines', v_count;
END $$;
