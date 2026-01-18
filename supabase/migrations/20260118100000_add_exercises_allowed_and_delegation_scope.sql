-- =====================================================
-- Migration: Ajouter exercises_allowed + améliorer délégations
-- Date: 2026-01-18
-- Description:
--   1. Ajouter colonne exercises_allowed sur profiles
--   2. Améliorer la fonction get_user_permissions pour vérifier le périmètre
--   3. Ajouter fonction can_validate_sef_with_delegation
-- =====================================================

-- 1. Ajouter exercises_allowed sur profiles (tableau d'exercices autorisés)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS exercises_allowed INTEGER[] DEFAULT NULL;

COMMENT ON COLUMN public.profiles.exercises_allowed IS
  'Liste des exercices budgétaires autorisés pour cet utilisateur. NULL = tous les exercices.';

-- 2. Améliorer la fonction get_user_permissions pour inclure le périmètre
CREATE OR REPLACE FUNCTION public.get_user_permissions_with_scope(
  p_user_id uuid,
  p_scope text DEFAULT NULL
)
RETURNS TABLE(action_code text, via_delegation boolean, delegation_scope text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Permissions directes (pas de scope)
  SELECT DISTINCT
    rp.action_code,
    false as via_delegation,
    NULL::text[] as delegation_scope
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role::text = rp.role_code
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND rp.is_granted = true

  UNION

  -- Permissions via délégation (avec scope)
  SELECT DISTINCT
    rp.action_code,
    true as via_delegation,
    d.perimetre as delegation_scope
  FROM delegations d
  JOIN user_roles ur ON ur.user_id = d.delegateur_id
  JOIN role_permissions rp ON ur.role::text = rp.role_code
  WHERE d.delegataire_id = p_user_id
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND ur.is_active = true
    AND rp.is_granted = true
    AND (p_scope IS NULL OR p_scope = ANY(d.perimetre));
$$;

-- 3. Fonction pour vérifier si un utilisateur peut valider des Notes SEF
--    (inclut la vérification de délégation avec périmètre "notes")
CREATE OR REPLACE FUNCTION public.can_validate_notes_sef(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_dg boolean := false;
  v_is_admin boolean := false;
  v_has_delegation boolean := false;
BEGIN
  -- Vérifier si l'utilisateur est Admin
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role IN ('ADMIN', 'admin')
      AND is_active = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Vérifier si l'utilisateur est DG directement
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = 'DG'
      AND is_active = true
  ) INTO v_is_dg;

  IF v_is_dg THEN
    RETURN true;
  END IF;

  -- Vérifier si l'utilisateur a une délégation active du DG avec périmètre "notes"
  SELECT EXISTS(
    SELECT 1 FROM delegations d
    JOIN user_roles ur ON ur.user_id = d.delegateur_id
    WHERE d.delegataire_id = p_user_id
      AND d.est_active = true
      AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
      AND 'notes' = ANY(d.perimetre)
      AND ur.role = 'DG'
      AND ur.is_active = true
  ) INTO v_has_delegation;

  RETURN v_has_delegation;
END;
$$;

-- 4. Fonction pour obtenir les exercices autorisés d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_allowed_exercises(p_user_id uuid)
RETURNS INTEGER[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(exercises_allowed, ARRAY(
    SELECT annee FROM exercices_budgetaires WHERE est_actif = true ORDER BY annee DESC
  ))
  FROM profiles
  WHERE id = p_user_id;
$$;

-- 5. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delegations_delegataire_active
  ON delegations(delegataire_id)
  WHERE est_active = true;

CREATE INDEX IF NOT EXISTS idx_delegations_dates
  ON delegations(date_debut, date_fin);

CREATE INDEX IF NOT EXISTS idx_profiles_exercises_allowed
  ON profiles USING GIN(exercises_allowed);

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_permissions_with_scope TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_validate_notes_sef TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_allowed_exercises TO authenticated;
