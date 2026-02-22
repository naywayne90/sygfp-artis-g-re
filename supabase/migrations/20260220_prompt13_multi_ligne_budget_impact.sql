-- ===========================================================================
-- Prompt 13 Backend : Impact budget par ligne pour engagements multi-lignes
-- Date : 20 février 2026
-- ===========================================================================
-- Problème : _recalculate_single_budget_line() et les 3 vues ELOP
-- agrègent uniquement budget_engagements.budget_line_id.
-- Pour les engagements multi-lignes (is_multi_ligne = true), l'impact
-- doit venir de engagement_lignes.budget_line_id individuellement.
-- ===========================================================================

-- ============================================================================
-- 1. Mettre à jour _recalculate_single_budget_line()
--    total_engage = single-line (parent) + multi-ligne (engagement_lignes)
-- ============================================================================

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
  -- Total engagé = single-line engagements + multi-ligne (via engagement_lignes)
  SELECT COALESCE(SUM(eng_montant), 0) INTO v_total_engage
  FROM (
    -- Engagements single-ligne : utilise budget_engagements.budget_line_id
    SELECT be.montant AS eng_montant
    FROM budget_engagements be
    WHERE be.budget_line_id = p_budget_line_id
      AND be.statut = 'valide'
      AND (be.is_multi_ligne = false OR be.is_multi_ligne IS NULL)
    UNION ALL
    -- Engagements multi-lignes : utilise engagement_lignes.budget_line_id
    SELECT el.montant AS eng_montant
    FROM engagement_lignes el
    JOIN budget_engagements be ON be.id = el.engagement_id
    WHERE el.budget_line_id = p_budget_line_id
      AND be.statut = 'valide'
      AND be.is_multi_ligne = true
  ) combined;

  -- Total liquidé (liquidations validées, via engagement)
  -- Pour les multi-lignes, la liquidation remonte toujours via engagement_id
  -- Le budget_line_id de la liquidation reste celui du parent engagement
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


-- ============================================================================
-- 2. Mettre à jour recalculate_budget_line_totals()
--    Pour budget_engagements multi-lignes : recalculer TOUTES les budget_lines
--    référencées dans engagement_lignes
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_budget_line_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line_id UUID;
  v_old_budget_line_id UUID;
  v_is_multi BOOLEAN;
  v_engagement_id UUID;
  v_el_line_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'budget_engagements' THEN
    v_budget_line_id := COALESCE(NEW.budget_line_id, OLD.budget_line_id);

    -- Vérifier si l'engagement est multi-ligne
    v_is_multi := COALESCE(
      CASE WHEN NEW IS NOT NULL THEN NEW.is_multi_ligne ELSE OLD.is_multi_ligne END,
      false
    );

    IF v_is_multi THEN
      -- Multi-ligne : recalculer toutes les budget_lines de engagement_lignes
      v_engagement_id := COALESCE(
        CASE WHEN NEW IS NOT NULL THEN NEW.id ELSE OLD.id END,
        NULL
      );
      IF v_engagement_id IS NOT NULL THEN
        FOR v_el_line_id IN
          SELECT DISTINCT el.budget_line_id
          FROM engagement_lignes el
          WHERE el.engagement_id = v_engagement_id
        LOOP
          PERFORM _recalculate_single_budget_line(v_el_line_id);
        END LOOP;
      END IF;
      -- Recalculer aussi la ligne parente (peut ne pas être dans engagement_lignes)
      IF v_budget_line_id IS NOT NULL THEN
        PERFORM _recalculate_single_budget_line(v_budget_line_id);
      END IF;

      IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END IF;

    -- Single-ligne : comportement standard (recalcule la ligne parente)

  ELSIF TG_TABLE_NAME = 'engagement_lignes' THEN
    -- Trigger sur engagement_lignes : recalculer la budget_line de la ligne
    v_budget_line_id := COALESCE(
      CASE WHEN NEW IS NOT NULL THEN NEW.budget_line_id ELSE NULL END,
      NULL
    );
    v_old_budget_line_id := CASE WHEN OLD IS NOT NULL THEN OLD.budget_line_id ELSE NULL END;

  ELSIF TG_TABLE_NAME = 'budget_liquidations' THEN
    IF NEW IS NOT NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_engagements be WHERE be.id = NEW.engagement_id;
    END IF;
    IF OLD IS NOT NULL AND v_budget_line_id IS NULL THEN
      SELECT be.budget_line_id INTO v_budget_line_id
        FROM budget_engagements be WHERE be.id = OLD.engagement_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'ordonnancements' THEN
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
    IF NEW IS NOT NULL THEN
      v_budget_line_id := NEW.to_budget_line_id;
      v_old_budget_line_id := NEW.from_budget_line_id;
    END IF;
    IF OLD IS NOT NULL THEN
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
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- Recalculate for the primary budget_line_id
  IF v_budget_line_id IS NOT NULL THEN
    PERFORM _recalculate_single_budget_line(v_budget_line_id);
  END IF;

  -- Recalculate for the secondary budget_line_id (credit_transfers from_line, or old engagement_lignes line)
  IF v_old_budget_line_id IS NOT NULL AND v_old_budget_line_id IS DISTINCT FROM v_budget_line_id THEN
    PERFORM _recalculate_single_budget_line(v_old_budget_line_id);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 3. Trigger sur engagement_lignes pour recalculer quand les lignes changent
-- ============================================================================

DROP TRIGGER IF EXISTS trg_recalc_elop_engagement_lignes ON engagement_lignes;
CREATE TRIGGER trg_recalc_elop_engagement_lignes
  AFTER INSERT OR UPDATE OR DELETE ON engagement_lignes
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();


-- ============================================================================
-- 4. Recreer les 3 vues ELOP avec le CTE corrigé
--    engagements_agg = single-line + multi-ligne via engagement_lignes
-- ============================================================================

-- -------------------------------------------------------
-- v_budget_disponibilite
-- -------------------------------------------------------
DROP VIEW IF EXISTS v_budget_disponibilite CASCADE;
CREATE VIEW v_budget_disponibilite AS
WITH engagements_agg AS (
  SELECT budget_line_id, SUM(eng_montant) AS total
  FROM (
    SELECT be.budget_line_id, be.montant AS eng_montant
    FROM budget_engagements be
    WHERE be.statut = 'valide'
      AND (be.is_multi_ligne = false OR be.is_multi_ligne IS NULL)
    UNION ALL
    SELECT el.budget_line_id, el.montant AS eng_montant
    FROM engagement_lignes el
    JOIN budget_engagements be ON be.id = el.engagement_id
    WHERE be.statut = 'valide' AND be.is_multi_ligne = true
  ) combined
  GROUP BY budget_line_id
),
virements_recus AS (
  SELECT to_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY to_budget_line_id
),
virements_emis AS (
  SELECT from_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY from_budget_line_id
)
SELECT
  bl.id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.direction_id,
  bl.os_id,
  bl.mission_id,
  bl.dotation_initiale,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0) AS dotation_actuelle,
  COALESCE(ea.total, 0) AS total_engage,
  COALESCE(bl.montant_reserve, 0) AS montant_reserve,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0)
    - COALESCE(ea.total, 0)
    - COALESCE(bl.montant_reserve, 0) AS disponible_net,
  d.code AS direction_code,
  d.label AS direction_label,
  os.code AS os_code,
  os.libelle AS os_libelle
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN objectifs_strategiques os ON os.id = bl.os_id
LEFT JOIN engagements_agg ea ON ea.budget_line_id = bl.id
LEFT JOIN virements_recus vr ON vr.budget_line_id = bl.id
LEFT JOIN virements_emis ve ON ve.budget_line_id = bl.id
WHERE bl.is_active = true;


-- -------------------------------------------------------
-- v_budget_disponibilite_complet
-- -------------------------------------------------------
DROP VIEW IF EXISTS v_budget_disponibilite_complet CASCADE;
CREATE VIEW v_budget_disponibilite_complet AS
WITH engagements_agg AS (
  SELECT budget_line_id, SUM(eng_montant) AS total
  FROM (
    SELECT be.budget_line_id, be.montant AS eng_montant
    FROM budget_engagements be
    WHERE be.statut = 'valide'
      AND (be.is_multi_ligne = false OR be.is_multi_ligne IS NULL)
    UNION ALL
    SELECT el.budget_line_id, el.montant AS eng_montant
    FROM engagement_lignes el
    JOIN budget_engagements be ON be.id = el.engagement_id
    WHERE be.statut = 'valide' AND be.is_multi_ligne = true
  ) combined
  GROUP BY budget_line_id
),
virements_recus AS (
  SELECT to_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY to_budget_line_id
),
virements_emis AS (
  SELECT from_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY from_budget_line_id
)
SELECT
  bl.id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.direction_id,
  d.code AS direction_code,
  d.label AS direction_label,
  bl.os_id,
  os.code AS os_code,
  os.libelle AS os_libelle,
  bl.mission_id,
  bl.nbe_id,
  bl.sysco_id,
  bl.dotation_initiale,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0) AS dotation_modifiee,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0) AS dotation_actuelle,
  COALESCE(ea.total, 0) AS total_engage,
  COALESCE(bl.montant_reserve, 0) AS montant_reserve,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0)
    - COALESCE(ea.total, 0) AS disponible_brut,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0)
    - COALESCE(ea.total, 0)
    - COALESCE(bl.montant_reserve, 0) AS disponible_net,
  bl.is_active,
  bl.statut
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN objectifs_strategiques os ON os.id = bl.os_id
LEFT JOIN engagements_agg ea ON ea.budget_line_id = bl.id
LEFT JOIN virements_recus vr ON vr.budget_line_id = bl.id
LEFT JOIN virements_emis ve ON ve.budget_line_id = bl.id
WHERE bl.is_active = true;


-- -------------------------------------------------------
-- v_alertes_financieres
-- -------------------------------------------------------
DROP VIEW IF EXISTS v_alertes_financieres;
CREATE VIEW v_alertes_financieres AS
WITH engagements_agg AS (
  SELECT budget_line_id, SUM(eng_montant) AS total
  FROM (
    SELECT be.budget_line_id, be.montant AS eng_montant
    FROM budget_engagements be
    WHERE be.statut = 'valide'
      AND (be.is_multi_ligne = false OR be.is_multi_ligne IS NULL)
    UNION ALL
    SELECT el.budget_line_id, el.montant AS eng_montant
    FROM engagement_lignes el
    JOIN budget_engagements be ON be.id = el.engagement_id
    WHERE be.statut = 'valide' AND be.is_multi_ligne = true
  ) combined
  GROUP BY budget_line_id
),
liquidations_agg AS (
  SELECT be.budget_line_id, SUM(bl2.montant) AS total
  FROM budget_liquidations bl2
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE bl2.statut = 'valide'
  GROUP BY be.budget_line_id
),
ordonnancements_agg AS (
  SELECT be.budget_line_id, SUM(o.montant) AS total
  FROM ordonnancements o
  JOIN budget_liquidations bl2 ON bl2.id = o.liquidation_id
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE o.statut IN ('valide', 'signe')
  GROUP BY be.budget_line_id
),
reglements_agg AS (
  SELECT be.budget_line_id, SUM(r.montant) AS total
  FROM reglements r
  JOIN ordonnancements o ON o.id = r.ordonnancement_id
  JOIN budget_liquidations bl2 ON bl2.id = o.liquidation_id
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE r.statut IN ('paye', 'valide', 'confirme')
  GROUP BY be.budget_line_id
),
virements_recus AS (
  SELECT to_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY to_budget_line_id
),
virements_emis AS (
  SELECT from_budget_line_id AS budget_line_id, SUM(amount) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY from_budget_line_id
)
SELECT
  bl.id AS budget_line_id,
  bl.code AS code_budgetaire,
  bl.label AS libelle,
  bl.exercice,
  d.code AS direction_code,
  d.label AS direction_label,
  bl.dotation_initiale,
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0) AS dotation_effective,
  COALESCE(ea.total, 0) AS total_engage,
  COALESCE(la.total, 0) AS total_liquide,
  COALESCE(oa.total, 0) AS total_ordonnance,
  COALESCE(ra.total, 0) AS total_paye,
  CASE
    WHEN COALESCE(ea.total, 0) > (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0))
      THEN 'DEPASSEMENT_ENGAGEMENT'
    WHEN COALESCE(ea.total, 0) > (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0)) * 0.9
      THEN 'SEUIL_ALERTE_90'
    WHEN COALESCE(ea.total, 0) > (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0)) * 0.8
      THEN 'SEUIL_ALERTE_80'
    ELSE NULL
  END AS type_alerte,
  CASE
    WHEN (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0)) > 0
      THEN ROUND(COALESCE(ea.total, 0) / (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0)) * 100, 2)
    ELSE 0
  END AS taux_consommation
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN engagements_agg ea ON ea.budget_line_id = bl.id
LEFT JOIN liquidations_agg la ON la.budget_line_id = bl.id
LEFT JOIN ordonnancements_agg oa ON oa.budget_line_id = bl.id
LEFT JOIN reglements_agg ra ON ra.budget_line_id = bl.id
LEFT JOIN virements_recus vr ON vr.budget_line_id = bl.id
LEFT JOIN virements_emis ve ON ve.budget_line_id = bl.id
WHERE bl.is_active = true
  AND (
    COALESCE(ea.total, 0) > (bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0)) * 0.8
  );


-- ============================================================================
-- 5. Grants sur les vues recréées
-- ============================================================================
GRANT SELECT ON v_budget_disponibilite TO authenticated, anon, service_role;
GRANT SELECT ON v_budget_disponibilite_complet TO authenticated, anon, service_role;
GRANT SELECT ON v_alertes_financieres TO authenticated, anon, service_role;


-- ============================================================================
-- 6. Backfill : recalculer toutes les budget_lines actives
-- ============================================================================
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
  RAISE NOTICE 'Backfill Prompt 13 complete: recalculated % budget lines', v_count;
END $$;
