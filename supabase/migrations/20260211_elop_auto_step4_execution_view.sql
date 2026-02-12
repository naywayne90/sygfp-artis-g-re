-- ============================================================
-- ELOP Auto Step 4: v_budget_lines_execution view
-- ============================================================
-- Single-query view that returns budget_lines with:
-- - Calculated ELOP totals from source tables
-- - Reference data (direction, OS, mission, etc.) as flat columns
-- - Virements and dotation actuelle
-- Used by useBudgetLines hook to replace N+1 queries.

DROP VIEW IF EXISTS v_budget_lines_execution;

CREATE VIEW v_budget_lines_execution AS
WITH engagements_agg AS (
  SELECT budget_line_id, COALESCE(SUM(montant), 0) AS total
  FROM budget_engagements WHERE statut = 'valide'
  GROUP BY budget_line_id
),
liquidations_agg AS (
  SELECT be.budget_line_id, COALESCE(SUM(bl2.montant), 0) AS total
  FROM budget_liquidations bl2
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE bl2.statut = 'valide'
  GROUP BY be.budget_line_id
),
ordonnancements_agg AS (
  SELECT be.budget_line_id, COALESCE(SUM(o.montant), 0) AS total
  FROM ordonnancements o
  JOIN budget_liquidations bl2 ON bl2.id = o.liquidation_id
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE o.statut IN ('valide', 'signe')
  GROUP BY be.budget_line_id
),
reglements_agg AS (
  SELECT be.budget_line_id, COALESCE(SUM(r.montant), 0) AS total
  FROM reglements r
  JOIN ordonnancements o ON o.id = r.ordonnancement_id
  JOIN budget_liquidations bl2 ON bl2.id = o.liquidation_id
  JOIN budget_engagements be ON be.id = bl2.engagement_id
  WHERE r.statut IN ('paye', 'valide', 'confirme')
  GROUP BY be.budget_line_id
),
virements_recus AS (
  SELECT to_budget_line_id AS budget_line_id, COALESCE(SUM(amount), 0) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY to_budget_line_id
),
virements_emis AS (
  SELECT from_budget_line_id AS budget_line_id, COALESCE(SUM(amount), 0) AS total
  FROM credit_transfers WHERE status = 'execute'
  GROUP BY from_budget_line_id
)
SELECT
  -- All budget_lines columns
  bl.id,
  bl.code,
  bl.label,
  bl.level,
  bl.exercice,
  bl.dotation_initiale,
  bl.direction_id,
  bl.os_id,
  bl.mission_id,
  bl.action_id,
  bl.activite_id,
  bl.sous_activite_id,
  bl.nbe_id,
  bl.nve_id,
  bl.sysco_id,
  bl.source_financement,
  bl.commentaire,
  bl.statut,
  bl.statut_execution,
  bl.date_ouverture,
  bl.date_cloture,
  bl.numero_ligne,
  bl.code_budgetaire,
  bl.code_budgetaire_v2,
  bl.code_version,
  bl.seq_code,
  bl.montant_reserve,
  bl.is_active,
  bl.parent_id,
  bl.created_at,
  bl.updated_at,

  -- Calculated ELOP totals
  COALESCE(ea.total, 0) AS calc_total_engage,
  COALESCE(la.total, 0) AS calc_total_liquide,
  COALESCE(oa.total, 0) AS calc_total_ordonnance,
  COALESCE(ra.total, 0) AS calc_total_paye,

  -- Virements
  COALESCE(vr.total, 0) AS calc_virements_recus,
  COALESCE(ve.total, 0) AS calc_virements_emis,

  -- Dotation actuelle (initiale + virements nets)
  bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0) AS calc_dotation_actuelle,

  -- Disponible (dotation actuelle - engagé)
  bl.dotation_initiale + COALESCE(vr.total, 0) - COALESCE(ve.total, 0) - COALESCE(ea.total, 0) AS calc_disponible,

  -- Reference: direction
  dir.code AS dir_code,
  dir.label AS dir_label,

  -- Reference: objectif stratégique
  os.code AS os_code,
  os.libelle AS os_libelle,

  -- Reference: mission
  m.code AS mission_code,
  m.libelle AS mission_libelle,

  -- Reference: action
  a.code AS action_code,
  a.libelle AS action_libelle,

  -- Reference: activité
  act.code AS activite_code,
  act.libelle AS activite_libelle,

  -- Reference: sous-activité
  sa.code AS sous_activite_code,
  sa.libelle AS sous_activite_libelle,

  -- Reference: NBE
  nbe.code AS nbe_code,
  nbe.libelle AS nbe_libelle,

  -- Reference: SYSCO
  sysco.code AS sysco_code,
  sysco.libelle AS sysco_libelle,

  -- Reference: NVE
  nve.code_nve AS nve_code_nve,
  nve.libelle AS nve_libelle

FROM budget_lines bl

-- ELOP aggregations
LEFT JOIN engagements_agg ea ON ea.budget_line_id = bl.id
LEFT JOIN liquidations_agg la ON la.budget_line_id = bl.id
LEFT JOIN ordonnancements_agg oa ON oa.budget_line_id = bl.id
LEFT JOIN reglements_agg ra ON ra.budget_line_id = bl.id
LEFT JOIN virements_recus vr ON vr.budget_line_id = bl.id
LEFT JOIN virements_emis ve ON ve.budget_line_id = bl.id

-- Reference data
LEFT JOIN directions dir ON dir.id = bl.direction_id
LEFT JOIN objectifs_strategiques os ON os.id = bl.os_id
LEFT JOIN missions m ON m.id = bl.mission_id
LEFT JOIN actions a ON a.id = bl.action_id
LEFT JOIN activites act ON act.id = bl.activite_id
LEFT JOIN sous_activites sa ON sa.id = bl.sous_activite_id
LEFT JOIN nomenclature_nbe nbe ON nbe.id = bl.nbe_id
LEFT JOIN plan_comptable_sysco sysco ON sysco.id = bl.sysco_id
LEFT JOIN ref_nve nve ON nve.id = bl.nve_id;

-- Grants
GRANT SELECT ON v_budget_lines_execution TO authenticated, anon, service_role;
