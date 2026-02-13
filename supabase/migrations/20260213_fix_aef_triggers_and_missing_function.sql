-- =============================================================================
-- Migration: Fix AEF triggers and create missing function
-- =============================================================================
-- Date: 2026-02-13
--
-- FIXES APPLIED:
-- 1. Create get_users_who_can_act_as_role() - was missing from DB
--    (defined in 20260213_fix_notifications_delegations.sql but not applied)
-- 2. Fix log_aef_workflow_to_audit_logs() - remove ::TEXT cast on entity_id
--    (NEW.id is UUID, audit_logs.entity_id is UUID, cast caused error 42804)
-- =============================================================================

-- =============================================
-- FIX 1: Create get_users_who_can_act_as_role function
-- Returns ALL user_ids who can act in a given role
-- (direct role + active delegation + active interim)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_users_who_can_act_as_role(
  p_role TEXT,
  p_scope TEXT DEFAULT NULL
)
RETURNS TABLE(user_id UUID)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY

  -- 1. Role direct
  SELECT ur.user_id
  FROM user_roles ur
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true

  UNION

  -- 2. Delegation active
  SELECT d.delegataire_id AS user_id
  FROM delegations d
  JOIN user_roles ur ON ur.user_id = d.delegateur_id
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND (p_scope IS NULL OR p_scope = ANY(d.perimetre))

  UNION

  -- 3. Interim actif
  SELECT i.interimaire_id AS user_id
  FROM interims i
  JOIN user_roles ur ON ur.user_id = i.titulaire_id
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true
    AND i.est_actif = true
    AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_who_can_act_as_role TO authenticated;

-- =============================================
-- FIX 2: Fix log_aef_workflow_to_audit_logs - remove ::TEXT cast
-- The entity_id column in audit_logs is UUID, NEW.id is UUID
-- Using ::TEXT causes error 42804 (type mismatch)
-- =============================================
CREATE OR REPLACE FUNCTION public.log_aef_workflow_to_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  CASE NEW.statut
    WHEN 'soumis'    THEN v_action := 'AEF_SUBMIT';
    WHEN 'a_valider' THEN v_action := 'AEF_VALIDATE';
    WHEN 'a_imputer' THEN v_action := 'AEF_VALIDATE';
    WHEN 'rejete'    THEN v_action := 'AEF_REJECT';
    WHEN 'differe'   THEN v_action := 'AEF_DEFER';
    WHEN 'impute'    THEN v_action := 'AEF_IMPUTE';
    ELSE                   v_action := 'AEF_STATUS_CHANGE';
  END CASE;

  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    user_id,
    exercice
  ) VALUES (
    'note_aef',
    NEW.id,  -- UUID directly, no ::TEXT cast
    v_action,
    jsonb_build_object(
      'statut', OLD.statut,
      'validated_by', OLD.validated_by,
      'rejected_by', OLD.rejected_by,
      'imputed_by', OLD.imputed_by,
      'differe_by', OLD.differe_by
    ),
    jsonb_build_object(
      'statut', NEW.statut,
      'validated_by', NEW.validated_by,
      'validated_at', NEW.validated_at,
      'rejected_by', NEW.rejected_by,
      'rejected_at', NEW.rejected_at,
      'rejection_reason', NEW.rejection_reason,
      'imputed_by', NEW.imputed_by,
      'imputed_at', NEW.imputed_at,
      'differe_by', NEW.differe_by,
      'motif_differe', NEW.motif_differe,
      'validation_comment', NEW.validation_comment,
      'budget_line_id', NEW.budget_line_id,
      'depassement_budget', NEW.depassement_budget
    ),
    auth.uid(),
    NEW.exercice
  );

  RETURN NEW;
END;
$$;
