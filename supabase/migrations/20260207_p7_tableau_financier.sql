-- ============================================================
-- P7: Tableau financier - RPC, vues et alertes
-- Migration: 20260207_p7_tableau_financier.sql
-- ============================================================
-- Schema reel:
--   budget_lines: direction_id, exercice (integer), dotation_initiale, dotation_modifiee, label,
--     total_engage, total_liquide, total_ordonnance, total_paye
--   budget_engagements: budget_line_id, exercice (integer), montant
--   budget_liquidations: engagement_id, exercice (integer), montant, net_a_payer,
--     reglement_urgent, reglement_urgent_motif, reglement_urgent_date, reglement_urgent_par
--   ordonnancements: liquidation_id, exercice (integer), montant, montant_paye
--   directions: id, code, label, est_active
-- ============================================================

-- ============================================================
-- RPC: Donnees du tableau financier par direction et exercice
-- ============================================================
CREATE OR REPLACE FUNCTION get_tableau_financier(
  p_exercice_id UUID DEFAULT NULL,
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
DECLARE
  v_exercice INTEGER;
BEGIN
  -- Look up the year from exercice UUID
  IF p_exercice_id IS NOT NULL THEN
    SELECT annee INTO v_exercice FROM exercices_budgetaires WHERE id = p_exercice_id;
  END IF;

  RETURN QUERY
  WITH dir_budgets AS (
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
      AND (v_exercice IS NULL OR bl.exercice = v_exercice)
    WHERE d.est_active = true
      AND (p_direction_id IS NULL OR d.id = p_direction_id)
    GROUP BY d.id, d.code, d.label
  ),
  dir_engagements AS (
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(be.montant), 0) AS total_eng
    FROM budget_engagements be
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (v_exercice IS NULL OR be.exercice = v_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_liquidations AS (
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(bliq.montant), 0) AS total_liq
    FROM budget_liquidations bliq
    JOIN budget_engagements be ON be.id = bliq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (v_exercice IS NULL OR bliq.exercice = v_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_ordos AS (
    SELECT
      bl.direction_id AS dir_id,
      COALESCE(SUM(o.montant), 0) AS total_ordo
    FROM ordonnancements o
    JOIN budget_liquidations bliq ON bliq.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bliq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (v_exercice IS NULL OR o.exercice = v_exercice)
      AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    GROUP BY bl.direction_id
  ),
  dir_dossiers AS (
    SELECT
      bl.direction_id AS dir_id,
      COUNT(*) FILTER (WHERE be.workflow_status = 'en_cours')::INTEGER AS nb_en_cours,
      COUNT(*) FILTER (WHERE be.workflow_status = 'differe')::INTEGER AS nb_bloques
    FROM budget_engagements be
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE (v_exercice IS NULL OR be.exercice = v_exercice)
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
    0::NUMERIC AS total_regl,
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

-- ============================================================
-- Vue: v_tableau_financier (vue pour le dashboard financier)
-- ============================================================
DROP VIEW IF EXISTS v_tableau_financier;
CREATE VIEW v_tableau_financier AS
WITH budgets AS (
  SELECT
    d.id AS direction_id,
    d.code AS direction_code,
    d.label AS direction_label,
    bl.exercice,
    COALESCE(SUM(bl.dotation_initiale), 0) AS budget_initial,
    COALESCE(SUM(
      CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END
    ), 0) AS budget_modifie
  FROM directions d
  LEFT JOIN budget_lines bl ON bl.direction_id = d.id
  WHERE d.est_active = true
  GROUP BY d.id, d.code, d.label, bl.exercice
),
engagements AS (
  SELECT
    bl.direction_id,
    be.exercice,
    COALESCE(SUM(be.montant), 0) AS total_engagements
  FROM budget_engagements be
  JOIN budget_lines bl ON bl.id = be.budget_line_id
  GROUP BY bl.direction_id, be.exercice
),
liquidations AS (
  SELECT
    bl.direction_id,
    bliq.exercice,
    COALESCE(SUM(bliq.montant), 0) AS total_liquidations
  FROM budget_liquidations bliq
  JOIN budget_engagements be ON be.id = bliq.engagement_id
  JOIN budget_lines bl ON bl.id = be.budget_line_id
  GROUP BY bl.direction_id, bliq.exercice
),
ordos AS (
  SELECT
    bl.direction_id,
    o.exercice,
    COALESCE(SUM(o.montant), 0) AS total_ordonnancements,
    COALESCE(SUM(o.montant_paye), 0) AS total_reglements
  FROM ordonnancements o
  JOIN budget_liquidations bliq ON bliq.id = o.liquidation_id
  JOIN budget_engagements be ON be.id = bliq.engagement_id
  JOIN budget_lines bl ON bl.id = be.budget_line_id
  GROUP BY bl.direction_id, o.exercice
)
SELECT
  b.direction_id,
  b.direction_code,
  b.direction_label,
  b.exercice,
  b.budget_initial,
  b.budget_modifie,
  COALESCE(e.total_engagements, 0) AS total_engagements,
  COALESCE(l.total_liquidations, 0) AS total_liquidations,
  COALESCE(ord.total_ordonnancements, 0) AS total_ordonnancements,
  COALESCE(ord.total_reglements, 0) AS total_reglements,
  CASE WHEN b.budget_initial > 0
    THEN ROUND(COALESCE(e.total_engagements, 0) / b.budget_initial * 100, 2)
    ELSE 0
  END AS taux_engagement,
  CASE WHEN COALESCE(e.total_engagements, 0) > 0
    THEN ROUND(COALESCE(l.total_liquidations, 0) / e.total_engagements * 100, 2)
    ELSE 0
  END AS taux_liquidation,
  CASE WHEN COALESCE(l.total_liquidations, 0) > 0
    THEN ROUND(COALESCE(ord.total_ordonnancements, 0) / l.total_liquidations * 100, 2)
    ELSE 0
  END AS taux_ordonnancement
FROM budgets b
LEFT JOIN engagements e ON e.direction_id = b.direction_id AND e.exercice = b.exercice
LEFT JOIN liquidations l ON l.direction_id = b.direction_id AND l.exercice = b.exercice
LEFT JOIN ordos ord ON ord.direction_id = b.direction_id AND ord.exercice = b.exercice;

-- ============================================================
-- Vue: v_alertes_financieres (depassements et seuils d'alerte)
-- ============================================================
DROP VIEW IF EXISTS v_alertes_financieres;
CREATE VIEW v_alertes_financieres AS
SELECT
  bl.id AS budget_line_id,
  bl.code AS code_budgetaire,
  bl.label AS libelle,
  bl.exercice,
  d.code AS direction_code,
  d.label AS direction_label,
  bl.dotation_initiale,
  CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END AS dotation_effective,
  COALESCE(bl.total_engage, 0) AS total_engage,
  COALESCE(bl.total_liquide, 0) AS total_liquide,
  COALESCE(bl.total_ordonnance, 0) AS total_ordonnance,
  COALESCE(bl.total_paye, 0) AS total_paye,
  CASE
    WHEN COALESCE(bl.total_engage, 0) > (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END)
      THEN 'DEPASSEMENT_ENGAGEMENT'
    WHEN COALESCE(bl.total_engage, 0) > (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END) * 0.9
      THEN 'SEUIL_ALERTE_90'
    WHEN COALESCE(bl.total_engage, 0) > (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END) * 0.8
      THEN 'SEUIL_ALERTE_80'
    ELSE NULL
  END AS type_alerte,
  CASE
    WHEN (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END) > 0
      THEN ROUND(COALESCE(bl.total_engage, 0) / (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END) * 100, 2)
    ELSE 0
  END AS taux_consommation
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
WHERE bl.is_active = true
  AND (
    COALESCE(bl.total_engage, 0) > (CASE WHEN bl.dotation_modifiee > 0 THEN bl.dotation_modifiee ELSE bl.dotation_initiale END) * 0.8
  );

-- ============================================================
-- RPC: Valider un reglement urgent
-- ============================================================
CREATE OR REPLACE FUNCTION validate_urgent_reglement(
  p_liquidation_id UUID,
  p_motif TEXT
)
RETURNS VOID AS $$
DECLARE
  v_liq RECORD;
BEGIN
  -- Verifier que la liquidation existe
  SELECT * INTO v_liq FROM budget_liquidations WHERE id = p_liquidation_id;
  IF v_liq IS NULL THEN
    RAISE EXCEPTION 'Liquidation % introuvable', p_liquidation_id;
  END IF;

  -- Marquer comme reglement urgent
  UPDATE budget_liquidations
  SET reglement_urgent = true,
      reglement_urgent_motif = p_motif,
      reglement_urgent_date = now(),
      reglement_urgent_par = auth.uid()
  WHERE id = p_liquidation_id;

  -- Creer une notification pour les validateurs
  PERFORM create_notification(
    p.id,
    'warning',
    'Reglement urgent demande',
    format('La liquidation %s a ete marquee comme urgente. Motif: %s',
      v_liq.numero, p_motif),
    'liquidation',
    p_liquidation_id
  )
  FROM profiles p
  WHERE p.profil_fonctionnel IN ('Validateur', 'Admin', 'ADMIN')
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
