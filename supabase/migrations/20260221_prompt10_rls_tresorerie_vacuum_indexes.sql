-- ===========================================================================
-- Prompt 10 BACKEND : RLS + TRESORERIE, indexes complémentaires, VACUUM
-- Table : budget_liquidations
-- Date : 21 février 2026
-- ===========================================================================
-- 1. RLS : Agent = sa direction, DAAF/DG/CB/TRESORERIE = tout
-- 2. Indexes complémentaires (vérification exhaustive)
-- 3. VACUUM ANALYZE budget_liquidations
-- 4. Impact budget = trigger UNIQUEMENT (nettoyage commentaire)
-- ===========================================================================


-- ============================================================================
-- 1. RLS : Mise à jour des policies pour inclure TRESORERIE
--    Ancienne version (20260220) : CB / DAAF / DAF / DG / ADMIN
--    Nouvelle version : + TRESORERIE (rôle Trésorier = accès total)
-- ============================================================================

-- 1a. DROP anciennes policies
DROP POLICY IF EXISTS "liquidation_select_agent_direction" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidation_insert_authenticated" ON budget_liquidations;
DROP POLICY IF EXISTS "liquidation_update_workflow" ON budget_liquidations;

-- 1b. SELECT — Agent voit sa direction, DAAF/DG/CB/TRESORERIE/ADMIN voient tout
CREATE POLICY "liquidation_select_agent_direction"
  ON budget_liquidations FOR SELECT TO authenticated
  USING (
    -- Rôles à visibilité totale
    has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'TRESORERIE'::app_role)
    -- Créateur voit ses propres liquidations
    OR created_by = auth.uid()
    -- Agent voit uniquement celles de sa direction
    OR engagement_id IN (
      SELECT be.id FROM budget_engagements be
      JOIN budget_lines bl ON bl.id = be.budget_line_id
      WHERE bl.direction_id = get_user_direction_id(auth.uid())
    )
  );

-- 1c. INSERT — tout authentifié
CREATE POLICY "liquidation_insert_authenticated"
  ON budget_liquidations FOR INSERT TO authenticated
  WITH CHECK (true);

-- 1d. UPDATE — workflow (créateur brouillon + validateurs + TRESORERIE)
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
    OR has_role(auth.uid(), 'TRESORERIE'::app_role)
  );


-- ============================================================================
-- 2. Indexes complémentaires
--    Les indexes principaux existent déjà (migration 20260220) :
--      idx_budget_liquidations_exercice
--      idx_budget_liquidations_statut
--      idx_budget_liquidations_exercice_statut
--      idx_budget_liquidations_engagement_id
--      idx_budget_liquidations_created_at_desc
--      idx_budget_liquidations_created_by
--      idx_budget_liquidations_exercice_created_at
--    Plus (autres migrations) :
--      idx_budget_liquidations_budget_line_id
--      idx_budget_liquidations_urgent (partial)
--      idx_liquidations_visa_daaf (partial)
--      idx_liquidations_visa_dg (partial)
--
--    On ajoute seulement les manquants utiles :
-- ============================================================================

-- Index composite statut + exercice + engagement_id (requêtes suivi fréquentes)
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_statut_exercice_eng
  ON budget_liquidations (statut, exercice, engagement_id);

-- Index pour la RLS : accélère le sous-select engagement → direction
-- (budget_engagements.budget_line_id est déjà indexé, mais on rajoute
--  un index couvrant pour la requête spécifique de la policy RLS)
CREATE INDEX IF NOT EXISTS idx_budget_engagements_id_budget_line
  ON budget_engagements (id, budget_line_id);


-- ============================================================================
-- 3. ANALYZE budget_liquidations
--    Update statistics pour l'optimiseur de requêtes
--    Note : VACUUM ne peut pas s'exécuter dans une transaction (exécuté manuellement)
-- ============================================================================
ANALYZE budget_liquidations;


-- ============================================================================
-- 4. RAPPEL : Impact budget = trigger UNIQUEMENT
--    Le trigger trg_recalc_elop_liquidations (migration 20260211) appelle
--    recalculate_budget_line_totals() → _recalculate_single_budget_line()
--    qui recalcule automatiquement total_liquide sur budget_lines
--    lors de tout INSERT/UPDATE/DELETE sur budget_liquidations.
--
--    ► Les mises à jour manuelles de budget_lines.total_liquide depuis
--      le frontend (ValidationDgForm, useLiquidations validateMutation)
--      ont été SUPPRIMÉES pour éviter les doubles comptages.
--    ► Seul le trigger backend fait foi.
-- ============================================================================
