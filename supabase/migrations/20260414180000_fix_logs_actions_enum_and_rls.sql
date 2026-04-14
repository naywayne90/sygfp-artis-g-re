-- ============================================================
-- FIX : logs_actions — enum incomplet + RLS inapplicable
-- ============================================================
-- Contexte : le dashboard DG (useDashboardByRole) interrogeait
-- logs_actions avec action IN (VALIDATE, APPROVE, SIGN, REJECT,
-- DEFER, CANCEL) et renvoyait 400 puis 403.
--
-- Causes :
--   1. La valeur 'SIGN' était utilisée par 3 hooks (ordonnancement,
--      audit, workflowEngine) mais absente de l'enum log_action_type.
--   2. La policy logs_select_admin faisait un EXISTS sur auth.users
--      que le rôle `authenticated` n'a pas le droit d'interroger
--      (42501 → 403 PostgREST).
-- ============================================================

-- ── 1) Ajouter 'SIGN' à l'enum log_action_type ────────────────
ALTER TYPE public.log_action_type ADD VALUE IF NOT EXISTS 'SIGN';

-- ── 2) Réécrire la policy SELECT sans accès à auth.users ──────
-- On lit l'email depuis les claims JWT via auth.jwt(), évitant
-- toute dépendance au schema auth côté rôle authenticated.
DROP POLICY IF EXISTS logs_select_admin ON public.logs_actions;

CREATE POLICY logs_select_admin
  ON public.logs_actions
  FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() ->> 'email')::text = ANY (ARRAY['admin@arti.ci','dg@arti.ci']))
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['ADMIN'::app_role, 'DG'::app_role])
        AND ur.is_active = true
    )
  );
