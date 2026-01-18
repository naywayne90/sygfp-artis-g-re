-- ============================================
-- MIGRATION: RBAC Enforcement Consolidé
-- ============================================
-- Renforce le système RBAC avec:
-- - Matrice permissions par route/action
-- - Contrôle par donnée (direction_id)
-- - Mapping automatique pour comptes existants
-- ============================================

-- 1. Table des permissions système
CREATE TABLE IF NOT EXISTS public.system_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general', -- route, action, data, module
  resource VARCHAR(100), -- route path ou entité
  action VARCHAR(50), -- create, read, update, delete, validate, export, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table matrice rôle-permission (étendue)
CREATE TABLE IF NOT EXISTS public.role_permission_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code VARCHAR(50) NOT NULL, -- ADMIN, CB, DAAF, DG, TRESORERIE, DIRECTEUR, OPERATEUR, AUDITEUR
  permission_id UUID REFERENCES public.system_permissions(id) ON DELETE CASCADE,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}', -- Conditions additionnelles (direction_id, etc.)
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_role_permission UNIQUE (role_code, permission_id)
);

-- 3. Table profils utilisateur enrichie (vue matérialisée des droits)
CREATE TABLE IF NOT EXISTS public.user_effective_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'role', -- role, delegation, direct
  source_detail TEXT, -- Détail de la source (nom du rôle, délégation, etc.)
  direction_scope UUID[], -- Directions autorisées (null = toutes)
  exercice_scope UUID[], -- Exercices autorisés (null = tous)
  expires_at TIMESTAMPTZ, -- Pour les délégations temporaires
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission_code, source)
);

-- 4. Vue consolidée des droits utilisateur
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  p.direction_id,
  p.role_hierarchique,
  p.profil_fonctionnel,
  p.is_active,
  COALESCE(
    array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL AND ur.is_active),
    ARRAY[]::varchar[]
  ) as active_roles,
  COALESCE(
    array_agg(DISTINCT uep.permission_code) FILTER (WHERE uep.permission_code IS NOT NULL),
    ARRAY[]::varchar[]
  ) as effective_permissions,
  -- Délégations actives
  COALESCE(
    array_agg(DISTINCT d.perimetre) FILTER (WHERE d.est_active AND d.date_debut <= CURRENT_DATE AND d.date_fin >= CURRENT_DATE),
    ARRAY[]::varchar[]
  ) as delegations_actives
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.user_effective_permissions uep ON uep.user_id = p.id AND (uep.expires_at IS NULL OR uep.expires_at > NOW())
LEFT JOIN public.delegations d ON d.delegataire_id = p.id
GROUP BY p.id, p.email, p.full_name, p.direction_id, p.role_hierarchique, p.profil_fonctionnel, p.is_active;

-- 5. Permissions système de base
INSERT INTO public.system_permissions (code, label, category, resource, action) VALUES
-- Routes principales
('route.dashboard', 'Accès tableau de bord', 'route', '/', 'read'),
('route.recherche', 'Accès recherche', 'route', '/recherche', 'read'),
('route.notes_sef', 'Accès Notes SEF', 'route', '/notes-sef', 'read'),
('route.notes_sef.create', 'Créer Note SEF', 'route', '/notes-sef', 'create'),
('route.notes_sef.validate', 'Valider Note SEF', 'route', '/notes-sef', 'validate'),
('route.notes_aef', 'Accès Notes AEF', 'route', '/notes-aef', 'read'),
('route.notes_aef.create', 'Créer Note AEF', 'route', '/notes-aef', 'create'),
('route.notes_aef.validate', 'Valider Note AEF', 'route', '/notes-aef', 'validate'),
('route.imputation', 'Accès Imputation', 'route', '/execution/imputation', 'read'),
('route.imputation.create', 'Créer Imputation', 'route', '/execution/imputation', 'create'),
('route.engagements', 'Accès Engagements', 'route', '/engagements', 'read'),
('route.engagements.create', 'Créer Engagement', 'route', '/engagements', 'create'),
('route.engagements.validate', 'Valider Engagement', 'route', '/engagements', 'validate'),
('route.liquidations', 'Accès Liquidations', 'route', '/liquidations', 'read'),
('route.liquidations.create', 'Créer Liquidation', 'route', '/liquidations', 'create'),
('route.liquidations.validate', 'Valider Liquidation', 'route', '/liquidations', 'validate'),
('route.ordonnancements', 'Accès Ordonnancements', 'route', '/ordonnancements', 'read'),
('route.ordonnancements.sign', 'Signer Ordonnancement', 'route', '/ordonnancements', 'sign'),
('route.reglements', 'Accès Règlements', 'route', '/reglements', 'read'),
('route.reglements.execute', 'Exécuter Règlement', 'route', '/reglements', 'execute'),
('route.marches', 'Accès Marchés', 'route', '/marches', 'read'),
('route.marches.create', 'Créer Marché', 'route', '/marches', 'create'),
('route.budget', 'Accès Budget', 'route', '/planification/budget', 'read'),
('route.budget.modify', 'Modifier Budget', 'route', '/planification/budget', 'update'),
('route.virements', 'Accès Virements', 'route', '/planification/virements', 'read'),
('route.virements.approve', 'Approuver Virement', 'route', '/planification/virements', 'validate'),
('route.tresorerie', 'Accès Trésorerie', 'route', '/tresorerie', 'read'),
('route.etats', 'Accès États/Rapports', 'route', '/etats-execution', 'read'),
('route.etats.export', 'Exporter États', 'route', '/etats-execution', 'export'),
-- Administration
('route.admin', 'Accès Administration', 'route', '/admin', 'read'),
('route.admin.users', 'Gérer Utilisateurs', 'route', '/admin/utilisateurs', 'manage'),
('route.admin.roles', 'Gérer Rôles', 'route', '/admin/roles', 'manage'),
('route.admin.exercices', 'Gérer Exercices', 'route', '/admin/exercices', 'manage'),
('route.admin.parametres', 'Gérer Paramètres', 'route', '/admin/parametres', 'manage'),
('route.admin.audit', 'Voir Journal Audit', 'route', '/admin/journal-audit', 'read'),
-- Actions transversales
('action.export.excel', 'Export Excel', 'action', '*', 'export_excel'),
('action.export.pdf', 'Export PDF', 'action', '*', 'export_pdf'),
('action.export.csv', 'Export CSV', 'action', '*', 'export_csv'),
('action.print', 'Impression', 'action', '*', 'print')
ON CONFLICT (code) DO NOTHING;

-- 6. Matrice rôle-permission par défaut
-- ADMIN: Tous les droits
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'ADMIN', id FROM public.system_permissions
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- DG: Vision globale + validations finales
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'DG', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef', 'route.notes_sef.validate',
  'route.notes_aef', 'route.notes_aef.validate',
  'route.engagements', 'route.liquidations',
  'route.ordonnancements', 'route.ordonnancements.sign',
  'route.reglements', 'route.marches',
  'route.budget', 'route.virements',
  'route.etats', 'route.etats.export',
  'route.admin.audit',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- CB (Contrôleur Budgétaire): Budget + Engagements
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'CB', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef', 'route.notes_aef',
  'route.imputation', 'route.imputation.create',
  'route.engagements', 'route.engagements.create', 'route.engagements.validate',
  'route.liquidations',
  'route.budget', 'route.budget.modify',
  'route.virements', 'route.virements.approve',
  'route.etats', 'route.etats.export',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- DAAF: Finances + Liquidations
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'DAAF', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef', 'route.notes_aef',
  'route.imputation',
  'route.engagements', 'route.engagements.create',
  'route.liquidations', 'route.liquidations.create', 'route.liquidations.validate',
  'route.ordonnancements',
  'route.budget',
  'route.etats', 'route.etats.export',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- TRESORERIE: Règlements + Trésorerie
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'TRESORERIE', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.ordonnancements',
  'route.reglements', 'route.reglements.execute',
  'route.tresorerie',
  'route.etats', 'route.etats.export',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- DIRECTEUR: Sa direction + Validation AEF
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'DIRECTEUR', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef',
  'route.notes_aef', 'route.notes_aef.create', 'route.notes_aef.validate',
  'route.imputation',
  'route.engagements',
  'route.liquidations',
  'route.etats',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- OPERATEUR: Saisie uniquement
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'OPERATEUR', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef', 'route.notes_sef.create',
  'route.notes_aef', 'route.notes_aef.create',
  'route.engagements',
  'route.liquidations'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- AUDITEUR: Lecture seule partout
INSERT INTO public.role_permission_matrix (role_code, permission_id)
SELECT 'AUDITEUR', id FROM public.system_permissions
WHERE code IN (
  'route.dashboard', 'route.recherche',
  'route.notes_sef', 'route.notes_aef',
  'route.imputation',
  'route.engagements', 'route.liquidations',
  'route.ordonnancements', 'route.reglements',
  'route.marches', 'route.budget', 'route.virements',
  'route.tresorerie', 'route.etats', 'route.etats.export',
  'route.admin.audit',
  'action.export.excel', 'action.export.pdf', 'action.export.csv', 'action.print'
)
ON CONFLICT (role_code, permission_id) DO NOTHING;

-- 7. Fonction de vérification permission route
CREATE OR REPLACE FUNCTION check_route_permission(
  p_user_id UUID,
  p_route TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Admin bypass
  IF v_profile.profil_fonctionnel = 'ADMIN' OR v_profile.profil_fonctionnel = 'Admin' THEN
    RETURN true;
  END IF;

  -- Vérifier via la matrice
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permission_matrix rpm
    JOIN public.system_permissions sp ON sp.id = rpm.permission_id
    WHERE rpm.role_code = v_profile.profil_fonctionnel
    AND rpm.is_granted = true
    AND (
      sp.resource = p_route
      OR sp.resource = '*'
      OR p_route LIKE sp.resource || '%'
    )
  ) INTO v_has_permission;

  -- Vérifier aussi via user_roles
  IF NOT v_has_permission THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permission_matrix rpm ON rpm.role_code = ur.role
      JOIN public.system_permissions sp ON sp.id = rpm.permission_id
      WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND rpm.is_granted = true
      AND (
        sp.resource = p_route
        OR sp.resource = '*'
        OR p_route LIKE sp.resource || '%'
      )
    ) INTO v_has_permission;
  END IF;

  RETURN v_has_permission;
END;
$$;

-- 8. Fonction de vérification permission avec scope direction
CREATE OR REPLACE FUNCTION check_data_permission(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_direction_id UUID,
  p_action TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_visibility TEXT;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Admin/DG/Auditeur: accès global
  IF v_profile.profil_fonctionnel IN ('ADMIN', 'Admin', 'DG', 'AUDITEUR') THEN
    RETURN true;
  END IF;

  -- CB/DAAF/TRESORERIE: accès global sur certaines entités
  IF v_profile.profil_fonctionnel = 'CB' AND p_entity_type IN ('engagement', 'imputation', 'budget') THEN
    RETURN true;
  END IF;

  IF v_profile.profil_fonctionnel = 'DAAF' AND p_entity_type IN ('engagement', 'liquidation') THEN
    RETURN true;
  END IF;

  IF v_profile.profil_fonctionnel = 'TRESORERIE' AND p_entity_type IN ('reglement', 'tresorerie') THEN
    RETURN true;
  END IF;

  -- Directeur: sa direction uniquement
  IF v_profile.profil_fonctionnel = 'DIRECTEUR' THEN
    RETURN v_profile.direction_id = p_entity_direction_id;
  END IF;

  -- Autres: leur propre direction
  RETURN v_profile.direction_id = p_entity_direction_id;
END;
$$;

-- 9. Fonction pour récupérer les permissions effectives d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_effective_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_code VARCHAR,
  source TEXT,
  can_create BOOLEAN,
  can_read BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN,
  can_validate BOOLEAN,
  can_export BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Récupérer le profil
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Retourner les permissions
  RETURN QUERY
  SELECT
    sp.code as permission_code,
    'role:' || rpm.role_code as source,
    sp.action = 'create' as can_create,
    sp.action = 'read' OR sp.action IS NULL as can_read,
    sp.action = 'update' as can_update,
    sp.action = 'delete' as can_delete,
    sp.action IN ('validate', 'sign') as can_validate,
    sp.action IN ('export', 'export_excel', 'export_pdf', 'export_csv') as can_export
  FROM public.system_permissions sp
  JOIN public.role_permission_matrix rpm ON rpm.permission_id = sp.id
  WHERE rpm.role_code = v_profile.profil_fonctionnel
  AND rpm.is_granted = true

  UNION

  SELECT
    sp.code as permission_code,
    'user_role:' || ur.role as source,
    sp.action = 'create' as can_create,
    sp.action = 'read' OR sp.action IS NULL as can_read,
    sp.action = 'update' as can_update,
    sp.action = 'delete' as can_delete,
    sp.action IN ('validate', 'sign') as can_validate,
    sp.action IN ('export', 'export_excel', 'export_pdf', 'export_csv') as can_export
  FROM public.system_permissions sp
  JOIN public.role_permission_matrix rpm ON rpm.permission_id = sp.id
  JOIN public.user_roles ur ON ur.role = rpm.role_code
  WHERE ur.user_id = p_user_id
  AND ur.is_active = true
  AND rpm.is_granted = true;
END;
$$;

-- 10. Mapping automatique pour comptes existants sans profil_fonctionnel
UPDATE public.profiles
SET profil_fonctionnel = 'OPERATEUR'
WHERE profil_fonctionnel IS NULL OR profil_fonctionnel = '';

-- 11. Normaliser les valeurs de profil_fonctionnel
UPDATE public.profiles
SET profil_fonctionnel = 'ADMIN'
WHERE profil_fonctionnel IN ('Admin', 'admin', 'ADMINISTRATOR');

UPDATE public.profiles
SET profil_fonctionnel = 'DG'
WHERE profil_fonctionnel IN ('Dg', 'dg', 'DirecteurGeneral');

UPDATE public.profiles
SET profil_fonctionnel = 'CB'
WHERE profil_fonctionnel IN ('Cb', 'cb', 'ControleurBudgetaire');

UPDATE public.profiles
SET profil_fonctionnel = 'DAAF'
WHERE profil_fonctionnel IN ('Daaf', 'daaf');

-- 12. Index pour performances
CREATE INDEX IF NOT EXISTS idx_role_permission_matrix_role ON public.role_permission_matrix(role_code);
CREATE INDEX IF NOT EXISTS idx_system_permissions_resource ON public.system_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_effective_permissions_user ON public.user_effective_permissions(user_id);

-- 13. RLS sur les nouvelles tables
ALTER TABLE public.system_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permission_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_effective_permissions ENABLE ROW LEVEL SECURITY;

-- Lecture publique des permissions système
CREATE POLICY "Everyone can view system permissions" ON public.system_permissions
  FOR SELECT USING (true);

-- Admin uniquement peut modifier
CREATE POLICY "Admins can manage system permissions" ON public.system_permissions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can view role permissions" ON public.role_permission_matrix
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage role permissions" ON public.role_permission_matrix
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own effective permissions" ON public.user_effective_permissions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can manage effective permissions" ON public.user_effective_permissions
  FOR ALL USING (public.is_admin());

-- 14. Commentaires
COMMENT ON TABLE public.system_permissions IS 'Permissions système par route et action';
COMMENT ON TABLE public.role_permission_matrix IS 'Matrice de mapping rôle-permission';
COMMENT ON TABLE public.user_effective_permissions IS 'Permissions effectives par utilisateur (calculées)';
COMMENT ON FUNCTION check_route_permission IS 'Vérifie si un utilisateur peut accéder à une route';
COMMENT ON FUNCTION check_data_permission IS 'Vérifie si un utilisateur peut accéder à une donnée selon sa direction';
COMMENT ON FUNCTION get_user_effective_permissions IS 'Retourne toutes les permissions effectives d un utilisateur';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
