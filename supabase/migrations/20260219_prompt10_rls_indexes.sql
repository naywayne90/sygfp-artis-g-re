-- ===========================================================================
-- Prompt 10 : Sécurité (RLS) et Performance (index)
-- Table : budget_engagements
-- ===========================================================================

-- 1. Activer RLS (idempotent)
ALTER TABLE budget_engagements ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent (idempotent)
DROP POLICY IF EXISTS "engagement_select_agent_direction" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_select_cb_daaf_dg" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_select_admin" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_insert_authenticated" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_update_workflow" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_update_admin" ON budget_engagements;

-- 3. SELECT policies
-- 3a. Agent / Opérateur : voit uniquement sa direction
CREATE POLICY "engagement_select_agent_direction"
  ON budget_engagements
  FOR SELECT
  TO authenticated
  USING (
    -- Agents without CB/DAAF/DG/ADMIN roles see only their direction's engagements
    (
      NOT (
        has_role(auth.uid(), 'CB'::app_role)
        OR has_role(auth.uid(), 'DAAF'::app_role)
        OR has_role(auth.uid(), 'DAF'::app_role)
        OR has_role(auth.uid(), 'DG'::app_role)
        OR has_role(auth.uid(), 'ADMIN'::app_role)
      )
      AND budget_line_id IN (
        SELECT bl.id FROM budget_lines bl
        WHERE bl.direction_id = get_user_direction_id(auth.uid())
      )
    )
    -- CB, DAAF, DAF, DG, ADMIN see all
    OR has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    -- Creator always sees their own engagements
    OR created_by = auth.uid()
  );

-- 3b. INSERT — authenticated users with create permission
CREATE POLICY "engagement_insert_authenticated"
  ON budget_engagements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3c. UPDATE — workflow transitions (validated via trigger)
CREATE POLICY "engagement_update_workflow"
  ON budget_engagements
  FOR UPDATE
  TO authenticated
  USING (
    -- Creator can update their brouillon
    (created_by = auth.uid() AND statut = 'brouillon')
    -- Validators can update during workflow
    OR has_role(auth.uid(), 'SAF'::app_role)
    OR has_role(auth.uid(), 'OPERATEUR'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 4. Performance indexes (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice
  ON budget_engagements (exercice);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_statut
  ON budget_engagements (statut);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice_statut
  ON budget_engagements (exercice, statut);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_budget_line_id
  ON budget_engagements (budget_line_id);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_created_at_desc
  ON budget_engagements (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_created_by
  ON budget_engagements (created_by);

CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice_created_at
  ON budget_engagements (exercice, created_at DESC);

-- 5. ANALYZE pour mettre à jour les statistiques du planificateur
ANALYZE budget_engagements;
