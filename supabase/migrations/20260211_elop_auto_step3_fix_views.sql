-- ============================================================
-- ELOP Auto Step 3: Fix 3 vulnerable views
-- ============================================================
-- These views previously read bl.total_engage etc. (always 0).
-- Now they calculate from source ELOP tables, like v_tableau_financier.
-- After Step 2 triggers + backfill, stored columns are also correct,
-- but we keep the FROM-source calculation as defense in depth.

-- -------------------------------------------------------
-- v_budget_disponibilite
-- -------------------------------------------------------
DROP VIEW IF EXISTS v_budget_disponibilite CASCADE;
CREATE VIEW v_budget_disponibilite AS
WITH engagements_agg AS (
  SELECT budget_line_id, SUM(montant) AS total
  FROM budget_engagements WHERE statut = 'valide'
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
  SELECT budget_line_id, SUM(montant) AS total
  FROM budget_engagements WHERE statut = 'valide'
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
  -- Dotation actuelle (= dotation_initiale + virements nets)
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0) AS dotation_actuelle,
  -- Engagements from source
  COALESCE(ea.total, 0) AS total_engage,
  -- Réservations
  COALESCE(bl.montant_reserve, 0) AS montant_reserve,
  -- Disponible brut
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0)
    - COALESCE(ea.total, 0) AS disponible_brut,
  -- Disponible net (après réservations)
  bl.dotation_initiale
    + COALESCE(vr.total, 0)
    - COALESCE(ve.total, 0)
    - COALESCE(ea.total, 0)
    - COALESCE(bl.montant_reserve, 0) AS disponible_net,
  -- Flags
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
  SELECT budget_line_id, SUM(montant) AS total
  FROM budget_engagements WHERE statut = 'valide'
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


-- -------------------------------------------------------
-- Grants
-- -------------------------------------------------------
GRANT SELECT ON v_budget_disponibilite TO authenticated, anon, service_role;
GRANT SELECT ON v_budget_disponibilite_complet TO authenticated, anon, service_role;
GRANT SELECT ON v_alertes_financieres TO authenticated, anon, service_role;
