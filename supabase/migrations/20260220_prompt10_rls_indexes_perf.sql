-- ===========================================================================
-- Prompt 10 : Sécurité (RLS) + Performance (index) + VACUUM
-- Table : budget_engagements
-- Date : 20 février 2026
-- ===========================================================================

-- 1. Activer RLS (idempotent)
ALTER TABLE budget_engagements ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes policies (idempotent)
DROP POLICY IF EXISTS "engagement_select_agent_direction" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_select_cb_daaf_dg" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_select_admin" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_select" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_insert_authenticated" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_insert" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_update_workflow" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_update_admin" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_update" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_delete_admin" ON budget_engagements;
DROP POLICY IF EXISTS "engagement_delete" ON budget_engagements;
-- Anciennes policies socle
DROP POLICY IF EXISTS "engagements_select" ON budget_engagements;
DROP POLICY IF EXISTS "engagements_insert" ON budget_engagements;
DROP POLICY IF EXISTS "engagements_update" ON budget_engagements;
DROP POLICY IF EXISTS "engagements_delete" ON budget_engagements;
-- Legacy policies (noms descriptifs anglais)
DROP POLICY IF EXISTS "Authorized roles can manage engagements" ON budget_engagements;
DROP POLICY IF EXISTS "DG can read all engagements" ON budget_engagements;
DROP POLICY IF EXISTS "Everyone can view engagements" ON budget_engagements;

-- ===========================================================================
-- 3. SELECT — rôles définis par le Prompt 10
-- AGENT : voit uniquement sa direction (via budget_line_id → budget_lines.direction_id)
-- CB / DAAF / DG / ADMIN : voient tout
-- Créateur : voit toujours les siens
-- ===========================================================================
CREATE POLICY "engagement_select"
  ON budget_engagements
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR is_cb()
    OR created_by = auth.uid()
    OR budget_line_id IN (
      SELECT bl.id FROM budget_lines bl
      WHERE bl.direction_id = get_user_direction_id()
    )
  );

-- ===========================================================================
-- 4. INSERT — tout utilisateur authentifié peut créer un engagement
-- (le trigger de référence auto-génère le numéro)
-- ===========================================================================
CREATE POLICY "engagement_insert"
  ON budget_engagements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===========================================================================
-- 5. UPDATE — granulaire par rôle
-- Créateur  : peut modifier tant que statut = 'brouillon'
-- SAF       : visa SAF (workflow étape 1)
-- CB        : visa CB (workflow étape 2)
-- DAAF      : visa DAAF + dégagement (workflow étape 3)
-- DG        : validation finale (workflow étape 4)
-- ADMIN     : tout
-- Les transitions de workflow sont validées par le trigger fn_validate_engagement_workflow
-- ===========================================================================
CREATE POLICY "engagement_update"
  ON budget_engagements
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR is_dg()
    OR is_daaf()
    OR is_cb()
    OR has_role(auth.uid(), 'SAF'::app_role)
    OR has_role(auth.uid(), 'OPERATEUR'::app_role)
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ===========================================================================
-- 6. DELETE — ADMIN uniquement
-- ===========================================================================
CREATE POLICY "engagement_delete"
  ON budget_engagements
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ===========================================================================
-- 7. Index supplémentaires (IF NOT EXISTS pour idempotence)
-- Note : direction_id n'existe PAS sur budget_engagements
--        (la direction est déduite via budget_line_id → budget_lines.direction_id)
--        exercice est INTEGER (pas exercice_id UUID)
-- ===========================================================================

-- Index principal sur la FK budget_line (utilisé par le JOIN RLS)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_budget_line_id
  ON budget_engagements (budget_line_id);

-- Index exercice (filtrage par année budgétaire)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice
  ON budget_engagements (exercice);

-- Index created_at DESC (tri chronologique, export, pagination)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_created_at_desc
  ON budget_engagements (created_at DESC);

-- Index statut (filtrage par état workflow)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_statut
  ON budget_engagements (statut);

-- Index composite exercice + statut (requête la plus fréquente)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice_statut
  ON budget_engagements (exercice, statut);

-- Index created_by (RLS "créateur voit les siens")
CREATE INDEX IF NOT EXISTS idx_budget_engagements_created_by
  ON budget_engagements (created_by);

-- Index composite exercice + created_at (liste paginée par exercice)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice_created_at
  ON budget_engagements (exercice, created_at DESC);

-- ===========================================================================
-- 8. VACUUM ANALYZE — met à jour les statistiques du planificateur
-- et récupère l'espace des lignes mortes
-- ===========================================================================
VACUUM ANALYZE budget_engagements;
