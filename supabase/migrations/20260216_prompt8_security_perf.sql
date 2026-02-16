-- ============================================================================
-- Migration Prompt 8: RLS audit_logs EB + Indexes performance
-- Date: 2026-02-16
-- Context: Prompt 8 - Exports, Sécurité, Performance
--
-- Changes:
--   1. RLS audit_logs: policy SELECT pour logs EB accessible par authenticated
--   2. Index partiel audit_logs pour historique articles EB
--   3. Index composite expressions_besoin (exercice, created_at DESC)
-- ============================================================================

BEGIN;

-- =============================================
-- POINT 1: RLS audit_logs — Élargir SELECT pour logs EB
-- Policy existante: authenticated_can_view_own_audit_logs → user_id = auth.uid()
-- Problème: DG/DAAF ne voient pas l'historique articles EB d'autres users
-- Solution: Ajouter policy pour logs EB de l'exercice courant
-- =============================================

DROP POLICY IF EXISTS "audit_logs_select_eb_accessible" ON public.audit_logs;

CREATE POLICY "audit_logs_select_eb_accessible"
  ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    entity_type = 'expression_besoin'
    AND entity_id IN (
      SELECT id FROM expressions_besoin
      WHERE exercice = EXTRACT(YEAR FROM CURRENT_DATE)::int
    )
  );

-- =============================================
-- POINT 2: Indexes performance
-- =============================================

-- Index partiel pour requête audit historique articles
CREATE INDEX IF NOT EXISTS idx_audit_logs_eb_articles
  ON public.audit_logs(entity_type, entity_id, action)
  WHERE entity_type = 'expression_besoin' AND action = 'update_articles';

-- Index composite pour pagination par exercice + date
-- (idx_eb_exercice et idx_eb_created_at_desc existent séparément mais le composite est plus efficace)
CREATE INDEX IF NOT EXISTS idx_eb_exercice_created
  ON public.expressions_besoin(exercice, created_at DESC);

-- Note: idx_expressions_besoin_exercice_statut existe déjà (vérifié par audit)

-- ANALYZE pour mettre à jour les statistiques
ANALYZE public.audit_logs;
ANALYZE public.expressions_besoin;

COMMIT;
