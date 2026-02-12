-- =============================================
-- Gap 2 + Gap 3 : Fonction unifiee de verification de permission de validation
-- Combine : role direct + delegation + interim
-- =============================================

-- Fonction RPC unifiee : check_validation_permission
-- Verifie si un utilisateur peut valider pour un module donne, en considerant :
-- 1. Role direct dans user_roles
-- 2. Delegation active avec le bon perimetre
-- 3. Interim actif d'un titulaire qui a le role requis
CREATE OR REPLACE FUNCTION public.check_validation_permission(
  p_user_id UUID,
  p_module TEXT,        -- 'notes_sef', 'engagements', 'liquidations', 'ordonnancements'
  p_required_role TEXT  -- 'DG', 'SAF', 'CB', 'DAF', etc.
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  validation_mode TEXT,       -- 'direct', 'delegation', 'interim'
  on_behalf_of_id UUID,
  on_behalf_of_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_has_direct_role BOOLEAN := false;
  v_delegation_delegateur_id UUID;
  v_delegation_delegateur_name TEXT;
  v_interim_titulaire_id UUID;
  v_interim_titulaire_name TEXT;
  v_delegation_scope TEXT;
BEGIN
  -- Mapper le module vers le scope de delegation
  CASE p_module
    WHEN 'notes_sef' THEN v_delegation_scope := 'notes';
    WHEN 'engagements' THEN v_delegation_scope := 'engagements';
    WHEN 'liquidations' THEN v_delegation_scope := 'liquidations';
    WHEN 'ordonnancements' THEN v_delegation_scope := 'ordonnancements';
    ELSE v_delegation_scope := p_module;
  END CASE;

  -- 1. Verifier si l'utilisateur est ADMIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = 'ADMIN'
      AND ur.is_active = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'direct'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- 2. Verifier le role direct
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = p_required_role::app_role
      AND ur.is_active = true
  ) INTO v_has_direct_role;

  IF v_has_direct_role THEN
    RETURN QUERY SELECT true, 'direct'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- 3. Verifier la delegation active
  -- Un delegateur avec le role requis a delegue a cet utilisateur
  -- et le perimetre inclut le module demande
  SELECT d.delegateur_id, p.full_name
  INTO v_delegation_delegateur_id, v_delegation_delegateur_name
  FROM delegations d
  JOIN user_roles ur ON ur.user_id = d.delegateur_id
  JOIN profiles p ON p.id = d.delegateur_id
  WHERE d.delegataire_id = p_user_id
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND v_delegation_scope = ANY(d.perimetre)
    AND ur.role = p_required_role
    AND ur.is_active = true
  LIMIT 1;

  IF v_delegation_delegateur_id IS NOT NULL THEN
    RETURN QUERY SELECT true, 'delegation'::TEXT, v_delegation_delegateur_id, v_delegation_delegateur_name;
    RETURN;
  END IF;

  -- 4. Verifier l'interim actif
  -- L'utilisateur est interimaire d'un titulaire qui a le role requis
  SELECT i.titulaire_id, p.full_name
  INTO v_interim_titulaire_id, v_interim_titulaire_name
  FROM interims i
  JOIN user_roles ur ON ur.user_id = i.titulaire_id
  JOIN profiles p ON p.id = i.titulaire_id
  WHERE i.interimaire_id = p_user_id
    AND i.est_actif = true
    AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin
    AND ur.role = p_required_role
    AND ur.is_active = true
  LIMIT 1;

  IF v_interim_titulaire_id IS NOT NULL THEN
    RETURN QUERY SELECT true, 'interim'::TEXT, v_interim_titulaire_id, v_interim_titulaire_name;
    RETURN;
  END IF;

  -- Aucune permission trouvee
  RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT;
END;
$$;

-- Index pour ameliorer les performances des lookups
CREATE INDEX IF NOT EXISTS idx_interims_interimaire_actif
  ON interims(interimaire_id)
  WHERE est_actif = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active
  ON user_roles(user_id, role)
  WHERE is_active = true;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_validation_permission TO authenticated;

-- Comment
COMMENT ON FUNCTION public.check_validation_permission IS
  'Verifie si un utilisateur peut valider un module (notes_sef, engagements, liquidations, ordonnancements) via role direct, delegation ou interim. Retourne le mode de validation et l''identite du mandant.';
