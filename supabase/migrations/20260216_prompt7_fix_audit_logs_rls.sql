-- ============================================================================
-- Migration Prompt 7: Fix audit_logs RLS for non-ADMIN users
-- Date: 2026-02-16
-- Context: The fn_audit_eb_lignes trigger inserts into audit_logs on every
--   expression_besoin_lignes change. The existing INSERT policy only allows
--   ADMIN role, causing RLS violations when DG/DAAF/other users create EBs.
--
-- Fix: Add broad INSERT policy for all authenticated users (audit logs
--   should be appendable by anyone) and a SELECT policy for users to
--   view their own audit entries.
-- ============================================================================

-- Allow all authenticated users to insert audit log entries
-- (triggered by SECURITY DEFINER functions and direct inserts)
CREATE POLICY "authenticated_can_insert_audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to view their own audit log entries
CREATE POLICY "authenticated_can_view_own_audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
