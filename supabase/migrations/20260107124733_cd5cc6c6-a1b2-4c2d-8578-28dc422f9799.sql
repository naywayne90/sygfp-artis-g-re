-- =====================================================
-- PHASE 1: Nettoyage et standardisation des permissions
-- =====================================================

-- Normaliser les catégories en minuscules
UPDATE permission_actions SET category = lower(category);

-- =====================================================
-- PHASE 2: Fonction SECURITY DEFINER pour permissions
-- =====================================================

-- Fonction pour vérifier si un utilisateur a une permission (avec délégations)
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid, 
  p_action_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Permissions directes via les rôles de l'utilisateur
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role::text = rp.role_code
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND rp.action_code = p_action_code
      AND rp.is_granted = true
  )
  OR EXISTS (
    -- Permissions héritées via délégation active
    SELECT 1 FROM delegations d
    JOIN user_roles ur ON ur.user_id = d.delegateur_id
    JOIN role_permissions rp ON ur.role::text = rp.role_code
    WHERE d.delegataire_id = p_user_id
      AND d.est_active = true
      AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
      AND rp.action_code = p_action_code
      AND rp.is_granted = true
  );
$$;

-- Fonction pour vérifier si un utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.user_has_role(
  p_user_id uuid, 
  p_role_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role::text = p_role_code
      AND is_active = true
  );
$$;

-- Fonction pour récupérer toutes les permissions d'un utilisateur (incluant délégations)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(action_code text, via_delegation boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Permissions directes
  SELECT DISTINCT rp.action_code, false as via_delegation
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role::text = rp.role_code
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND rp.is_granted = true
  
  UNION
  
  -- Permissions via délégation
  SELECT DISTINCT rp.action_code, true as via_delegation
  FROM delegations d
  JOIN user_roles ur ON ur.user_id = d.delegateur_id
  JOIN role_permissions rp ON ur.role::text = rp.role_code
  WHERE d.delegataire_id = p_user_id
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND rp.is_granted = true;
$$;

-- =====================================================
-- PHASE 3: Index pour les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup 
ON role_permissions(role_code, action_code, is_granted);

CREATE INDEX IF NOT EXISTS idx_delegations_active 
ON delegations(delegataire_id, est_active, date_debut, date_fin);

CREATE INDEX IF NOT EXISTS idx_user_roles_active 
ON user_roles(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_permission_actions_category 
ON permission_actions(category, is_active);

-- =====================================================
-- PHASE 4: Permissions par défaut pour les rôles standards
-- =====================================================

-- ADMIN: toutes les permissions
INSERT INTO role_permissions (role_code, action_code, is_granted)
SELECT 'ADMIN', code, true FROM permission_actions WHERE is_active = true
ON CONFLICT DO NOTHING;

-- DG: validation et signature
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('DG', 'budget_voir', true),
('DG', 'budget_valider', true),
('DG', 'engagement_voir', true),
('DG', 'engagement_valider', true),
('DG', 'liquidation_voir', true),
('DG', 'liquidation_valider', true),
('DG', 'ordonnancement_voir', true),
('DG', 'ordonnancement_signer', true),
('DG', 'reglement_voir', true),
('DG', 'export_data', true)
ON CONFLICT DO NOTHING;

-- DAAF: gestion budgétaire complète
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('DAAF', 'budget_voir', true),
('DAAF', 'budget_creer', true),
('DAAF', 'budget_modifier', true),
('DAAF', 'budget_valider', true),
('DAAF', 'engagement_voir', true),
('DAAF', 'engagement_creer', true),
('DAAF', 'engagement_valider', true),
('DAAF', 'liquidation_voir', true),
('DAAF', 'liquidation_creer', true),
('DAAF', 'liquidation_valider', true),
('DAAF', 'ordonnancement_voir', true),
('DAAF', 'ordonnancement_creer', true),
('DAAF', 'reglement_voir', true),
('DAAF', 'export_data', true)
ON CONFLICT DO NOTHING;

-- OPERATEUR: saisie
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('OPERATEUR', 'budget_voir', true),
('OPERATEUR', 'engagement_voir', true),
('OPERATEUR', 'engagement_creer', true),
('OPERATEUR', 'liquidation_voir', true),
('OPERATEUR', 'liquidation_creer', true),
('OPERATEUR', 'ordonnancement_voir', true),
('OPERATEUR', 'ordonnancement_creer', true),
('OPERATEUR', 'reglement_voir', true)
ON CONFLICT DO NOTHING;

-- LECTEUR: lecture seule
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('LECTEUR', 'budget_voir', true),
('LECTEUR', 'engagement_voir', true),
('LECTEUR', 'liquidation_voir', true),
('LECTEUR', 'ordonnancement_voir', true),
('LECTEUR', 'reglement_voir', true)
ON CONFLICT DO NOTHING;

-- TRESORERIE: paiements
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('TRESORERIE', 'reglement_voir', true),
('TRESORERIE', 'reglement_creer', true),
('TRESORERIE', 'ordonnancement_voir', true),
('TRESORERIE', 'liquidation_voir', true),
('TRESORERIE', 'export_data', true)
ON CONFLICT DO NOTHING;

-- APPRO: approvisionnement
INSERT INTO role_permissions (role_code, action_code, is_granted) VALUES
('APPRO', 'budget_voir', true),
('APPRO', 'engagement_voir', true),
('APPRO', 'engagement_creer', true)
ON CONFLICT DO NOTHING;