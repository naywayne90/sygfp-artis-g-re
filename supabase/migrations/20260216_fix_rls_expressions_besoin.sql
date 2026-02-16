-- ============================================================================
-- Migration: Fix RLS policies on expressions_besoin + sub-tables
-- Date: 2026-02-16
-- Context: Prompt 3 - Backend security hardening
--
-- Problems fixed:
--   1. expressions_besoin: Missing DELETE policy (deleteExpression silently fails)
--   2. expressions_besoin: Imputation-linked SELECT leaks 3146 orphaned records
--   3. expressions_besoin: UPDATE missing CB/DAAF roles for workflow
--   4. expression_besoin_validations: Wide-open policies (qual=true)
--   5. expression_besoin_attachments: Wide-open policies (qual=true)
--   6. expression_besoin_sequences: Wide-open policies (qual=true)
-- ============================================================================

BEGIN;

-- =============================================
-- 1. FIX expressions_besoin policies
-- =============================================

-- 1a. Drop the leaky imputation-linked SELECT policy
DROP POLICY IF EXISTS "Users can read expressions linked to accessible imputations"
  ON public.expressions_besoin;

-- 1b. Drop and recreate the SELECT policy with CB included
DROP POLICY IF EXISTS "Users can view their own or if DG/Admin/DAAF"
  ON public.expressions_besoin;

CREATE POLICY "eb_select_policy"
  ON public.expressions_besoin
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    -- Direction-based: users in the same direction can see EB
    OR (
      direction_id IS NOT NULL
      AND direction_id IN (
        SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- 1c. Drop and recreate UPDATE policy with CB + DAAF
DROP POLICY IF EXISTS "Users can update their own drafts or DG can validate"
  ON public.expressions_besoin;

CREATE POLICY "eb_update_policy"
  ON public.expressions_besoin
  FOR UPDATE
  USING (
    -- Creator can update their own drafts
    (created_by = auth.uid() AND statut IN ('brouillon', 'rejeté'))
    -- CB can verify (statut = soumis)
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut = 'soumis')
    -- DAAF can defer/manage
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('soumis', 'vérifié'))
    -- DG can validate/reject
    OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'vérifié'))
    -- Admin can do anything
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 1d. Add missing DELETE policy (only creator on brouillon + admin)
DROP POLICY IF EXISTS "eb_delete_policy"
  ON public.expressions_besoin;

CREATE POLICY "eb_delete_policy"
  ON public.expressions_besoin
  FOR DELETE
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 1e. Keep INSERT policy (it's fine as is)
-- "Users can create expressions de besoin" => auth.uid() IS NOT NULL

-- =============================================
-- 2. FIX expression_besoin_validations policies
-- =============================================

-- Drop wide-open policies
DROP POLICY IF EXISTS "Allow read access to expression besoin validations"
  ON public.expression_besoin_validations;
DROP POLICY IF EXISTS "Allow insert access to expression besoin validations"
  ON public.expression_besoin_validations;
DROP POLICY IF EXISTS "Allow update access to expression besoin validations"
  ON public.expression_besoin_validations;

-- SELECT: Anyone authenticated can read validations (needed for workflow display)
CREATE POLICY "ebv_select_policy"
  ON public.expression_besoin_validations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Only validators (CB, DG, DAAF, ADMIN) + direction hierarchy
CREATE POLICY "ebv_insert_policy"
  ON public.expression_besoin_validations
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    -- Direction hierarchy validators (chef de service, directeur)
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role_hierarchique IN ('Directeur', 'Chef de Service', 'DG')
    )
  );

-- UPDATE: Same as insert (validators can update their own validation entries)
CREATE POLICY "ebv_update_policy"
  ON public.expression_besoin_validations
  FOR UPDATE
  USING (
    validated_by = auth.uid()
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================
-- 3. FIX expression_besoin_attachments policies
-- =============================================

-- Drop wide-open policies
DROP POLICY IF EXISTS "Allow read access to expression besoin attachments"
  ON public.expression_besoin_attachments;
DROP POLICY IF EXISTS "Allow insert access to expression besoin attachments"
  ON public.expression_besoin_attachments;
DROP POLICY IF EXISTS "Allow update access to expression besoin attachments"
  ON public.expression_besoin_attachments;
DROP POLICY IF EXISTS "Allow delete access to expression besoin attachments"
  ON public.expression_besoin_attachments;

-- SELECT: Anyone authenticated can read attachments (needed for display)
CREATE POLICY "eba_select_policy"
  ON public.expression_besoin_attachments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can add attachments
CREATE POLICY "eba_insert_policy"
  ON public.expression_besoin_attachments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only the uploader or admin
CREATE POLICY "eba_update_policy"
  ON public.expression_besoin_attachments
  FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- DELETE: Only the uploader or admin
CREATE POLICY "eba_delete_policy"
  ON public.expression_besoin_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================
-- 4. FIX expression_besoin_sequences policies
-- =============================================

-- Drop wide-open policies
DROP POLICY IF EXISTS "Allow read access to expression besoin sequences"
  ON public.expression_besoin_sequences;
DROP POLICY IF EXISTS "Allow insert access to expression besoin sequences"
  ON public.expression_besoin_sequences;
DROP POLICY IF EXISTS "Allow update access to expression besoin sequences"
  ON public.expression_besoin_sequences;
DROP POLICY IF EXISTS "Authenticated users can view expression_besoin_sequences"
  ON public.expression_besoin_sequences;

-- SELECT: Authenticated users (triggers use SECURITY DEFINER, bypass RLS)
CREATE POLICY "ebs_select_policy"
  ON public.expression_besoin_sequences
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users
CREATE POLICY "ebs_insert_policy"
  ON public.expression_besoin_sequences
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated users
CREATE POLICY "ebs_update_policy"
  ON public.expression_besoin_sequences
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

COMMIT;
