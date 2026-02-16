-- ============================================================================
-- Migration Prompt 8: RLS granulaire, Indexes, Sécurité
-- Date: 2026-02-16
-- Context: Prompt 8 - RLS expressions_besoin + expression_besoin_lignes,
--          indexes manquants, vérification service_role_key
--
-- Changes:
--   1. RLS expressions_besoin: 8 policies granulaires (SELECT/INSERT/UPDATE/DELETE)
--   2. RLS expression_besoin_lignes: 4 policies héritant du parent
--   3. Indexes: exercice, numero, created_at DESC + ANALYZE
--   4. Sécurité: 0 service_role_key dans src/ (vérifié)
--
-- Column mapping vs user prompt:
--   exercice_id → exercice (integer, pas de _id)
--   reference → numero (colonne existante)
-- ============================================================================

BEGIN;

-- =============================================
-- POINT 1: RLS expressions_besoin
-- Drop + Recreate avec granularité par rôle
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "eb_select_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_select_cb_soumis" ON public.expressions_besoin;
DROP POLICY IF EXISTS "Users can create expressions de besoin" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_delete_policy" ON public.expressions_besoin;

-- SELECT: Créateur voit ses propres EB
CREATE POLICY "eb_select_own"
  ON public.expressions_besoin FOR SELECT
  USING (created_by = auth.uid());

-- SELECT: Utilisateur voit les EB de sa direction
CREATE POLICY "eb_select_direction"
  ON public.expressions_besoin FOR SELECT
  USING (
    direction_id IS NOT NULL
    AND direction_id IN (
      SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- SELECT: CB/DG/DAAF/ADMIN voient TOUT
CREATE POLICY "eb_select_privileged"
  ON public.expressions_besoin FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

-- INSERT: Utilisateur insère uniquement dans sa direction (ou ADMIN)
CREATE POLICY "eb_insert_own_direction"
  ON public.expressions_besoin FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      has_role(auth.uid(), 'ADMIN'::app_role)
      OR direction_id IN (
        SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- UPDATE: Créateur peut modifier si brouillon ou rejeté
CREATE POLICY "eb_update_creator_draft"
  ON public.expressions_besoin FOR UPDATE
  USING (
    created_by = auth.uid()
    AND statut IN ('brouillon', 'rejeté', 'rejete')
  );

-- UPDATE: CB peut modifier les EB soumis (vérification)
CREATE POLICY "eb_update_cb_soumis"
  ON public.expressions_besoin FOR UPDATE
  USING (
    has_role(auth.uid(), 'CB'::app_role)
    AND statut = 'soumis'
  );

-- UPDATE: DG/DAAF peuvent modifier les EB vérifiés (validation)
CREATE POLICY "eb_update_dg_verifie"
  ON public.expressions_besoin FOR UPDATE
  USING (
    (has_role(auth.uid(), 'DG'::app_role) OR has_role(auth.uid(), 'DAAF'::app_role))
    AND statut = 'vérifié'
  );

-- UPDATE: ADMIN peut tout modifier
CREATE POLICY "eb_update_admin"
  ON public.expressions_besoin FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- DELETE: Créateur peut supprimer si brouillon, ou ADMIN
CREATE POLICY "eb_delete_creator_draft"
  ON public.expressions_besoin FOR DELETE
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================
-- POINT 2: RLS expression_besoin_lignes
-- Hérite du parent expressions_besoin
-- =============================================

DROP POLICY IF EXISTS "ebl_select_policy" ON public.expression_besoin_lignes;
DROP POLICY IF EXISTS "ebl_insert_policy" ON public.expression_besoin_lignes;
DROP POLICY IF EXISTS "ebl_update_policy" ON public.expression_besoin_lignes;
DROP POLICY IF EXISTS "ebl_delete_policy" ON public.expression_besoin_lignes;

-- SELECT: Visible si l'EB parent est visible
CREATE POLICY "ebl_select_inherited"
  ON public.expression_besoin_lignes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND (
          eb.created_by = auth.uid()
          OR has_role(auth.uid(), 'ADMIN'::app_role)
          OR has_role(auth.uid(), 'DG'::app_role)
          OR has_role(auth.uid(), 'DAAF'::app_role)
          OR has_role(auth.uid(), 'CB'::app_role)
          OR (
            eb.direction_id IS NOT NULL
            AND eb.direction_id IN (
              SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
            )
          )
        )
    )
  );

-- INSERT: Si EB parent en brouillon/rejeté et user est creator/ADMIN
CREATE POLICY "ebl_insert_inherited"
  ON public.expression_besoin_lignes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND eb.statut IN ('brouillon', 'rejeté', 'rejete')
        AND (
          eb.created_by = auth.uid()
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

-- UPDATE: Si EB parent en brouillon/rejeté et user est creator/ADMIN
CREATE POLICY "ebl_update_inherited"
  ON public.expression_besoin_lignes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND eb.statut IN ('brouillon', 'rejeté', 'rejete')
        AND (
          eb.created_by = auth.uid()
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

-- DELETE: Si EB parent en brouillon/rejeté et user est creator/ADMIN
CREATE POLICY "ebl_delete_inherited"
  ON public.expression_besoin_lignes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND eb.statut IN ('brouillon', 'rejeté', 'rejete')
        AND (
          eb.created_by = auth.uid()
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

-- =============================================
-- POINT 3: Indexes manquants + ANALYZE
-- =============================================

-- exercice standalone
CREATE INDEX IF NOT EXISTS idx_eb_exercice ON public.expressions_besoin(exercice);

-- numero (la colonne s'appelle numero, pas reference)
CREATE INDEX IF NOT EXISTS idx_eb_numero ON public.expressions_besoin(numero);

-- created_at DESC (tri chronologique)
CREATE INDEX IF NOT EXISTS idx_eb_created_at_desc ON public.expressions_besoin(created_at DESC);

-- Indexes déjà existants (vérifiés par audit):
-- idx_expressions_besoin_statut (statut)
-- idx_expressions_besoin_direction_id (direction_id)
-- idx_expressions_besoin_imputation (imputation_id)
-- idx_eb_lignes_expression_besoin_id (expression_besoin_id)
-- idx_expressions_besoin_created_by (created_by)
-- idx_expressions_besoin_exercice_statut (exercice, statut) composite
-- idx_eb_lignes_designation (GIN tsvector)

ANALYZE public.expressions_besoin;
ANALYZE public.expression_besoin_lignes;

COMMIT;
