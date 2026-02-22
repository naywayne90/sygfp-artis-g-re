-- ============================================================
-- Prompt 10 Liquidation : RLS granulaires + indexes performance
-- Replique le pattern certifie du module Engagement
-- ============================================================

-- 1a. DROP anciennes policies
DROP POLICY IF EXISTS "liquidations_select" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidations_insert" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidations_update" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidation_select_agent_direction" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidation_insert_authenticated" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidation_update_workflow" ON budget_liquidations;

-- 1b. SELECT — Agent voit sa direction, CB/DAAF/DAF/DG/ADMIN voient tout
CREATE POLICY "liquidation_select_agent_direction"
  ON budget_liquidations FOR SELECT TO authenticated
  USING (
    (
      NOT (
        has_role(auth.uid(), 'CB'::app_role)
        OR has_role(auth.uid(), 'DAAF'::app_role)
        OR has_role(auth.uid(), 'DAF'::app_role)
        OR has_role(auth.uid(), 'DG'::app_role)
        OR has_role(auth.uid(), 'ADMIN'::app_role)
      )
      AND engagement_id IN (
        SELECT be.id FROM budget_engagements be
        JOIN budget_lines bl ON bl.id = be.budget_line_id
        WHERE bl.direction_id = get_user_direction_id(auth.uid())
      )
    )
    OR has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR created_by = auth.uid()
  );

-- 1c. INSERT — tout authentifie
CREATE POLICY "liquidation_insert_authenticated"
  ON budget_liquidations FOR INSERT TO authenticated
  WITH CHECK (true);

-- 1d. UPDATE — workflow (createur brouillon + validateurs)
CREATE POLICY "liquidation_update_workflow"
  ON budget_liquidations FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR has_role(auth.uid(), 'SAF'::app_role)
    OR has_role(auth.uid(), 'OPERATEUR'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 1e. Indexes performance (7 indexes, pattern Engagement)
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_exercice ON budget_liquidations (exercice);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_statut ON budget_liquidations (statut);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_exercice_statut ON budget_liquidations (exercice, statut);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_engagement_id ON budget_liquidations (engagement_id);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_created_at_desc ON budget_liquidations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_created_by ON budget_liquidations (created_by);
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_exercice_created_at ON budget_liquidations (exercice, created_at DESC);
ANALYZE budget_liquidations;
