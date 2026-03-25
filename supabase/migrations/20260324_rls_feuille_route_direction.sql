-- ===========================================================================
-- RLS direction-scoped : Feuille de Route (plans_travail, taches, tache_livrables)
-- Date : 24/03/2026
-- Problème : visibilité non restreinte par direction pour les rôles opérationnels
-- Solution : ADMIN/DG/AUDITOR/CB/DAAF/CHARGE_MISSION voient tout,
--            les autres voient uniquement leur direction
-- ===========================================================================

-- ===========================
-- 1. plans_travail
-- ===========================

-- Drop existing policies
DROP POLICY IF EXISTS "plans_travail_select" ON plans_travail;
DROP POLICY IF EXISTS "plans_travail_insert" ON plans_travail;
DROP POLICY IF EXISTS "plans_travail_update" ON plans_travail;
DROP POLICY IF EXISTS "plans_travail_delete" ON plans_travail;

-- SELECT: rôles globaux voient tout, autres voient leur direction
CREATE POLICY "plans_travail_select"
  ON plans_travail
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR is_cb()
    OR has_role(auth.uid(), 'AUDITOR'::app_role)
    OR has_role(auth.uid(), 'CHARGE_MISSION'::app_role)
    OR direction_id = get_user_direction_id()
    OR created_by = auth.uid()
  );

-- INSERT: rôles globaux ou direction correspondante
CREATE POLICY "plans_travail_insert"
  ON plans_travail
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR direction_id = get_user_direction_id()
  );

-- UPDATE: créateur (brouillon) ou rôles globaux ou même direction
CREATE POLICY "plans_travail_update"
  ON plans_travail
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR created_by = auth.uid()
    OR direction_id = get_user_direction_id()
  );

-- DELETE: ADMIN uniquement
CREATE POLICY "plans_travail_delete"
  ON plans_travail
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ===========================
-- 2. taches (join via plan_travail_id → plans_travail.direction_id)
-- ===========================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view taches" ON taches;
DROP POLICY IF EXISTS "Admins can manage taches" ON taches;
DROP POLICY IF EXISTS "taches_select" ON taches;
DROP POLICY IF EXISTS "taches_insert" ON taches;
DROP POLICY IF EXISTS "taches_update" ON taches;
DROP POLICY IF EXISTS "taches_delete" ON taches;

-- SELECT: rôles globaux voient tout, autres voient leur direction via plan_travail
CREATE POLICY "taches_select"
  ON taches
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR is_cb()
    OR has_role(auth.uid(), 'AUDITOR'::app_role)
    OR has_role(auth.uid(), 'CHARGE_MISSION'::app_role)
    OR plan_travail_id IN (
      SELECT pt.id FROM plans_travail pt
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- INSERT: rôles globaux ou plan dans sa direction
CREATE POLICY "taches_insert"
  ON taches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR plan_travail_id IN (
      SELECT pt.id FROM plans_travail pt
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- UPDATE: rôles globaux ou plan dans sa direction
CREATE POLICY "taches_update"
  ON taches
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR plan_travail_id IN (
      SELECT pt.id FROM plans_travail pt
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- DELETE: ADMIN uniquement
CREATE POLICY "taches_delete"
  ON taches
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ===========================
-- 3. tache_livrables (join via tache_id → taches.plan_travail_id → plans_travail.direction_id)
-- ===========================

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_manage_livrables" ON tache_livrables;
DROP POLICY IF EXISTS "tache_livrables_select" ON tache_livrables;
DROP POLICY IF EXISTS "tache_livrables_insert" ON tache_livrables;
DROP POLICY IF EXISTS "tache_livrables_update" ON tache_livrables;
DROP POLICY IF EXISTS "tache_livrables_delete" ON tache_livrables;

-- SELECT: rôles globaux voient tout, autres voient leur direction via tache → plan_travail
CREATE POLICY "tache_livrables_select"
  ON tache_livrables
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR is_cb()
    OR has_role(auth.uid(), 'AUDITOR'::app_role)
    OR has_role(auth.uid(), 'CHARGE_MISSION'::app_role)
    OR tache_id IN (
      SELECT t.id FROM taches t
      JOIN plans_travail pt ON pt.id = t.plan_travail_id
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- INSERT: rôles globaux ou livrable dans sa direction
CREATE POLICY "tache_livrables_insert"
  ON tache_livrables
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR tache_id IN (
      SELECT t.id FROM taches t
      JOIN plans_travail pt ON pt.id = t.plan_travail_id
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- UPDATE: rôles globaux ou livrable dans sa direction
CREATE POLICY "tache_livrables_update"
  ON tache_livrables
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR tache_id IN (
      SELECT t.id FROM taches t
      JOIN plans_travail pt ON pt.id = t.plan_travail_id
      WHERE pt.direction_id = get_user_direction_id()
    )
  );

-- DELETE: ADMIN uniquement
CREATE POLICY "tache_livrables_delete"
  ON tache_livrables
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ===========================
-- 4. Index de performance pour les sous-requêtes RLS
-- ===========================
CREATE INDEX IF NOT EXISTS idx_plans_travail_direction ON plans_travail(direction_id);
CREATE INDEX IF NOT EXISTS idx_taches_plan_travail ON taches(plan_travail_id);
CREATE INDEX IF NOT EXISTS idx_tache_livrables_tache ON tache_livrables(tache_id);
CREATE INDEX IF NOT EXISTS idx_profiles_direction ON profiles(direction_id);
