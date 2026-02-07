-- ============================================================
-- P7: Vue/RPC pour le tableau financier par direction
-- Migration: 20260207_p7_tableau_financier.sql
-- ============================================================
-- Schema reel:
--   budget_lines: direction_id, exercice (integer), dotation_initiale, dotation_modifiee
--   budget_engagements: budget_line_id, exercice (integer), montant (column name)
--   budget_liquidations: engagement_id, exercice (integer), montant
--   ordonnancements: liquidation_id, exercice (integer), montant
--   directions: id, code, label, est_active
-- ============================================================

CREATE OR REPLACE FUNCTION get_tableau_financier(
  p_exercice INTEGER DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL
)
RETURNS TABLE (
  direction_id UUID,
  direction_code TEXT,
  direction_label TEXT,
  budget_initial NUMERIC,
  budget_modifie NUMERIC,
  total_engagements NUMERIC,
  total_liquidations NUMERIC,
  total_ordonnancements NUMERIC,
  total_reglements NUMERIC,
  taux_engagement NUMERIC,
  taux_liquidation NUMERIC,
  taux_ordonnancement NUMERIC,
  nb_dossiers_en_cours INTEGER,
  nb_dossiers_bloques INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH dir_budgets AS (
    -- Budget par direction: somme des dotations des lignes budgetaires
    SELECT
      d.id AS dir_id,
      d.code AS dir_code,
      d.label AS dir_label,
      COALESCE(SUM(bl.dotation_initiale), 0) AS budget_init,
      COALESCE(SUM(
        CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END
      ), 0) AS budget_mod
    FROM directions d
    LEFT JOIN budget_lines bl ON bl.direction_id = d.id
      AND (p_exercice IS NULL OR bl.exercice = p_exercice)
    WHERE d.est_active = true
      AND (p_direction_id IS NULL OR d.id = p_direction_id)
    GROUP BY d.id, d.code, d.label
  ),
  dir_engagements AS (
    -- Engagements par direction via budget_lines.direction_id
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(be.montant), 0) AS total_eng
    FROM budget_engagements be
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (p_exercice IS NULL OR be.exercice = p_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_liquidations AS (
    -- Liquidations par direction via engagement -> budget_line
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(bliq.montant), 0) AS total_liq
    FROM budget_liquidations bliq
    JOIN budget_engagements be ON be.id = bliq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (p_exercice IS NULL OR bliq.exercice = p_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_ordos AS (
    -- Ordonnancements par direction via liquidation -> engagement -> budget_line
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(o.montant), 0) AS total_ordo
    FROM ordonnancements o
    JOIN budget_liquidations bliq ON bliq.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bliq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (p_exercice IS NULL OR o.exercice = p_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_dossiers AS (
    -- Compteur de dossiers en cours et bloques (engagements non termines)
    SELECT
      bl.direction_id AS dir_id,
      COUNT(*) FILTER (WHERE be.workflow_status = 'en_cours')::INTEGER AS nb_en_cours,
      COUNT(*) FILTER (WHERE be.workflow_status = 'differe')::INTEGER AS nb_bloques
    FROM budget_engagements be
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (p_exercice IS NULL OR be.exercice = p_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  )
  SELECT
    db.dir_id,
    db.dir_code,
    db.dir_label,
    db.budget_init,
    db.budget_mod,
    COALESCE(de.total_eng, 0),
    COALESCE(dl.total_liq, 0),
    COALESCE(dor.total_ordo, 0),
    0::NUMERIC AS total_regl, -- Reglements pas encore lies par direction
    CASE WHEN db.budget_init > 0
      THEN ROUND(COALESCE(de.total_eng, 0) / db.budget_init * 100, 2)
      ELSE 0
    END,
    CASE WHEN COALESCE(de.total_eng, 0) > 0
      THEN ROUND(COALESCE(dl.total_liq, 0) / de.total_eng * 100, 2)
      ELSE 0
    END,
    CASE WHEN COALESCE(dl.total_liq, 0) > 0
      THEN ROUND(COALESCE(dor.total_ordo, 0) / dl.total_liq * 100, 2)
      ELSE 0
    END,
    COALESCE(dd.nb_en_cours, 0),
    COALESCE(dd.nb_bloques, 0)
  FROM dir_budgets db
  LEFT JOIN dir_engagements de ON de.dir_id = db.dir_id
  LEFT JOIN dir_liquidations dl ON dl.dir_id = db.dir_id
  LEFT JOIN dir_ordos dor ON dor.dir_id = db.dir_id
  LEFT JOIN dir_dossiers dd ON dd.dir_id = db.dir_id
  ORDER BY db.dir_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
