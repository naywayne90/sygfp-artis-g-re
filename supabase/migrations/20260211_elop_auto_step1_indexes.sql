-- ============================================================
-- ELOP Auto Step 1: Performance indexes for ELOP aggregation
-- ============================================================
-- These partial indexes speed up the SUM queries used by triggers
-- and the v_budget_lines_execution view.

-- Engagements validés par ligne budgétaire
CREATE INDEX IF NOT EXISTS idx_be_line_statut_valide
  ON budget_engagements(budget_line_id) WHERE statut = 'valide';

-- Liquidations validées par engagement
CREATE INDEX IF NOT EXISTS idx_bl_engagement_statut_valide
  ON budget_liquidations(engagement_id) WHERE statut = 'valide';

-- Ordonnancements validés/signés par liquidation
CREATE INDEX IF NOT EXISTS idx_ord_liquidation_statut
  ON ordonnancements(liquidation_id) WHERE statut IN ('valide', 'signe');

-- Règlements payés par ordonnancement
CREATE INDEX IF NOT EXISTS idx_reg_ordonnancement_statut
  ON reglements(ordonnancement_id) WHERE statut IN ('paye', 'valide', 'confirme');

-- Virements exécutés (destination)
CREATE INDEX IF NOT EXISTS idx_ct_to_line_execute
  ON credit_transfers(to_budget_line_id) WHERE status = 'execute';

-- Virements exécutés (source)
CREATE INDEX IF NOT EXISTS idx_ct_from_line_execute
  ON credit_transfers(from_budget_line_id) WHERE status = 'execute';
