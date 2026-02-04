-- =====================================================
-- Migration : Système de Workflow Configurable
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Description : Tables et fonctions pour configuration
--               dynamique des workflows depuis l'application
-- =====================================================

-- =====================================================
-- PARTIE 1 : Tables de configuration dynamique
-- =====================================================

-- Table des rôles configurables dans les workflows
CREATE TABLE IF NOT EXISTS public.wf_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  niveau_hierarchique INTEGER DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des actions possibles dans les workflows
CREATE TABLE IF NOT EXISTS public.wf_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'gray',
  require_motif BOOLEAN DEFAULT false,
  require_date_reprise BOOLEAN DEFAULT false,
  is_terminal BOOLEAN DEFAULT false,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des services/directions configurables
CREATE TABLE IF NOT EXISTS public.wf_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.wf_services(id),
  responsable_role_code TEXT,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison : actions disponibles par étape
CREATE TABLE IF NOT EXISTS public.wf_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.wf_steps(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.wf_actions(id) ON DELETE CASCADE,
  est_actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  UNIQUE(step_id, action_id)
);

-- Table de liaison : rôles autorisés par étape (avec permissions fines)
CREATE TABLE IF NOT EXISTS public.wf_step_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.wf_steps(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  service_code TEXT,
  can_view BOOLEAN DEFAULT true,
  can_act BOOLEAN DEFAULT true,
  can_delegate BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  est_actif BOOLEAN DEFAULT true,
  UNIQUE(step_id, role_code, service_code)
);

-- Table des conditions pour étapes conditionnelles
CREATE TABLE IF NOT EXISTS public.wf_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.wf_steps(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'IS NULL', 'IS NOT NULL')),
  field_value TEXT,
  logic_group INTEGER DEFAULT 0,
  logic_operator TEXT DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR')),
  est_actif BOOLEAN DEFAULT true
);

-- =====================================================
-- PARTIE 2 : Données par défaut
-- =====================================================

-- Rôles par défaut
INSERT INTO public.wf_roles (code, label, description, niveau_hierarchique) VALUES
  ('DG', 'Directeur Général', 'Direction Générale', 100),
  ('DGA', 'Directeur Général Adjoint', 'Direction Générale Adjointe', 90),
  ('DIRECTEUR', 'Directeur', 'Directeur de Direction', 80),
  ('SOUS_DIRECTEUR', 'Sous-Directeur', 'Sous-Directeur', 70),
  ('CHEF_SERVICE', 'Chef de Service', 'Chef de Service', 60),
  ('CONTROLEUR', 'Contrôleur Budgétaire', 'Contrôleur Budgétaire', 55),
  ('TRESORIER', 'Trésorier', 'Trésorier ou Agent Comptable', 55),
  ('AGENT', 'Agent', 'Agent opérationnel', 10),
  ('VALIDATEUR', 'Validateur', 'Rôle de validation générique', 50),
  ('AUDITEUR', 'Auditeur', 'Auditeur - Lecture seule', 5)
ON CONFLICT (code) DO NOTHING;

-- Actions par défaut
INSERT INTO public.wf_actions (code, label, description, icon, color, require_motif, require_date_reprise, is_terminal) VALUES
  ('valide', 'Valider', 'Valider et passer à l''étape suivante', 'CheckCircle', 'green', false, false, false),
  ('rejete', 'Rejeter', 'Rejeter définitivement', 'XCircle', 'red', true, false, true),
  ('differe', 'Différer', 'Mettre en attente avec condition de reprise', 'Clock', 'orange', true, true, false),
  ('annule', 'Annuler', 'Annuler le workflow', 'Ban', 'gray', false, false, true),
  ('retourne', 'Retourner', 'Retourner à l''étape précédente', 'ArrowLeft', 'blue', true, false, false),
  ('delegue', 'Déléguer', 'Déléguer à un autre utilisateur', 'UserPlus', 'purple', false, false, false),
  ('commente', 'Commenter', 'Ajouter un commentaire sans action', 'MessageSquare', 'gray', true, false, false),
  ('demande_info', 'Demander info', 'Demander des informations complémentaires', 'HelpCircle', 'yellow', true, false, false)
ON CONFLICT (code) DO NOTHING;

-- Services par défaut
INSERT INTO public.wf_services (code, label, description, responsable_role_code) VALUES
  ('DG', 'Direction Générale', 'Direction Générale de l''ARTI', 'DG'),
  ('DAF', 'Direction Administrative et Financière', 'Gestion administrative et financière', 'DIRECTEUR'),
  ('DGPEC', 'Direction Gestion Personnel et Carrières', 'Gestion du personnel', 'DIRECTEUR'),
  ('DT', 'Direction Technique', 'Direction des opérations techniques', 'DIRECTEUR'),
  ('SDPM', 'Sous-Direction Passation des Marchés', 'Passation des marchés publics', 'SOUS_DIRECTEUR'),
  ('SDCT', 'Sous-Direction Comptabilité et Trésorerie', 'Comptabilité et trésorerie', 'SOUS_DIRECTEUR'),
  ('SRH', 'Service Ressources Humaines', 'Gestion RH', 'CHEF_SERVICE'),
  ('SCOM', 'Service Communication', 'Communication institutionnelle', 'CHEF_SERVICE'),
  ('CB', 'Contrôle Budgétaire', 'Cellule de contrôle budgétaire', 'CONTROLEUR'),
  ('TRESORERIE', 'Trésorerie', 'Service de trésorerie', 'TRESORIER')
ON CONFLICT (code) DO NOTHING;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_wf_roles_code ON public.wf_roles(code);
CREATE INDEX IF NOT EXISTS idx_wf_roles_actif ON public.wf_roles(est_actif) WHERE est_actif = true;
CREATE INDEX IF NOT EXISTS idx_wf_actions_code ON public.wf_actions(code);
CREATE INDEX IF NOT EXISTS idx_wf_services_code ON public.wf_services(code);
CREATE INDEX IF NOT EXISTS idx_wf_step_actions_step ON public.wf_step_actions(step_id);
CREATE INDEX IF NOT EXISTS idx_wf_step_permissions_step ON public.wf_step_permissions(step_id);
CREATE INDEX IF NOT EXISTS idx_wf_step_permissions_role ON public.wf_step_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_wf_conditions_step ON public.wf_conditions(step_id);

-- =====================================================
-- PARTIE 3 : Fonctions d'administration CRUD
-- =====================================================

-- Fonction : Créer/Modifier un workflow
CREATE OR REPLACE FUNCTION public.wf_admin_upsert_workflow(
  p_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_nom TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_est_actif BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE wf_definitions SET
      entity_type = COALESCE(p_entity_type, entity_type),
      nom = COALESCE(p_nom, nom),
      description = COALESCE(p_description, description),
      est_actif = COALESCE(p_est_actif, est_actif),
      updated_at = NOW()
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO wf_definitions (entity_type, nom, description, est_actif)
    VALUES (p_entity_type, p_nom, p_description, p_est_actif)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- Fonction : Créer/Modifier une étape
CREATE OR REPLACE FUNCTION public.wf_admin_upsert_step(
  p_id UUID DEFAULT NULL,
  p_workflow_id UUID DEFAULT NULL,
  p_step_order INTEGER DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_role_required TEXT DEFAULT NULL,
  p_role_alternatif TEXT DEFAULT NULL,
  p_direction_required TEXT DEFAULT NULL,
  p_est_optionnel BOOLEAN DEFAULT false,
  p_delai_max_heures INTEGER DEFAULT 48
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE wf_steps SET
      workflow_id = COALESCE(p_workflow_id, workflow_id),
      step_order = COALESCE(p_step_order, step_order),
      label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      role_required = COALESCE(p_role_required, role_required),
      role_alternatif = p_role_alternatif,
      direction_required = p_direction_required,
      est_optionnel = COALESCE(p_est_optionnel, est_optionnel),
      delai_max_heures = COALESCE(p_delai_max_heures, delai_max_heures)
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO wf_steps (workflow_id, step_order, label, description, role_required, role_alternatif, direction_required, est_optionnel, delai_max_heures)
    VALUES (p_workflow_id, p_step_order, p_label, p_description, p_role_required, p_role_alternatif, p_direction_required, p_est_optionnel, p_delai_max_heures)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- Fonction : Supprimer une étape (avec réorganisation)
CREATE OR REPLACE FUNCTION public.wf_admin_delete_step(p_step_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workflow_id UUID;
  v_step_order INTEGER;
BEGIN
  SELECT workflow_id, step_order INTO v_workflow_id, v_step_order
  FROM wf_steps WHERE id = p_step_id;

  IF v_workflow_id IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM wf_steps WHERE id = p_step_id;

  UPDATE wf_steps SET step_order = step_order - 1
  WHERE workflow_id = v_workflow_id AND step_order > v_step_order;

  RETURN true;
END;
$$;

-- Fonction : Réordonner les étapes
CREATE OR REPLACE FUNCTION public.wf_admin_reorder_steps(p_workflow_id UUID, p_step_ids UUID[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idx INTEGER;
BEGIN
  FOR v_idx IN 1..array_length(p_step_ids, 1) LOOP
    UPDATE wf_steps SET step_order = v_idx
    WHERE id = p_step_ids[v_idx] AND workflow_id = p_workflow_id;
  END LOOP;
  RETURN true;
END;
$$;

-- CRUD Rôles
CREATE OR REPLACE FUNCTION public.wf_admin_upsert_role(
  p_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_niveau_hierarchique INTEGER DEFAULT 0,
  p_est_actif BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE wf_roles SET
      code = COALESCE(p_code, code), label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      niveau_hierarchique = COALESCE(p_niveau_hierarchique, niveau_hierarchique),
      est_actif = COALESCE(p_est_actif, est_actif), updated_at = NOW()
    WHERE id = p_id RETURNING id INTO v_id;
  ELSE
    INSERT INTO wf_roles (code, label, description, niveau_hierarchique, est_actif)
    VALUES (p_code, p_label, p_description, p_niveau_hierarchique, p_est_actif)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- CRUD Services
CREATE OR REPLACE FUNCTION public.wf_admin_upsert_service(
  p_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_responsable_role_code TEXT DEFAULT NULL,
  p_est_actif BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE wf_services SET
      code = COALESCE(p_code, code), label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      parent_id = p_parent_id, responsable_role_code = p_responsable_role_code,
      est_actif = COALESCE(p_est_actif, est_actif), updated_at = NOW()
    WHERE id = p_id RETURNING id INTO v_id;
  ELSE
    INSERT INTO wf_services (code, label, description, parent_id, responsable_role_code, est_actif)
    VALUES (p_code, p_label, p_description, p_parent_id, p_responsable_role_code, p_est_actif)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- CRUD Actions
CREATE OR REPLACE FUNCTION public.wf_admin_upsert_action(
  p_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_color TEXT DEFAULT 'gray',
  p_require_motif BOOLEAN DEFAULT false,
  p_require_date_reprise BOOLEAN DEFAULT false,
  p_is_terminal BOOLEAN DEFAULT false,
  p_est_actif BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE wf_actions SET
      code = COALESCE(p_code, code), label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      icon = COALESCE(p_icon, icon), color = COALESCE(p_color, color),
      require_motif = COALESCE(p_require_motif, require_motif),
      require_date_reprise = COALESCE(p_require_date_reprise, require_date_reprise),
      is_terminal = COALESCE(p_is_terminal, is_terminal),
      est_actif = COALESCE(p_est_actif, est_actif)
    WHERE id = p_id RETURNING id INTO v_id;
  ELSE
    INSERT INTO wf_actions (code, label, description, icon, color, require_motif, require_date_reprise, is_terminal, est_actif)
    VALUES (p_code, p_label, p_description, p_icon, p_color, p_require_motif, p_require_date_reprise, p_is_terminal, p_est_actif)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- Gérer les permissions d'étape
CREATE OR REPLACE FUNCTION public.wf_admin_set_step_permission(
  p_step_id UUID,
  p_role_code TEXT,
  p_service_code TEXT DEFAULT NULL,
  p_can_view BOOLEAN DEFAULT true,
  p_can_act BOOLEAN DEFAULT true,
  p_can_delegate BOOLEAN DEFAULT false,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO wf_step_permissions (step_id, role_code, service_code, can_view, can_act, can_delegate, is_primary)
  VALUES (p_step_id, p_role_code, p_service_code, p_can_view, p_can_act, p_can_delegate, p_is_primary)
  ON CONFLICT (step_id, role_code, service_code) DO UPDATE SET
    can_view = p_can_view, can_act = p_can_act, can_delegate = p_can_delegate, is_primary = p_is_primary
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Gérer les actions d'étape
CREATE OR REPLACE FUNCTION public.wf_admin_set_step_actions(p_step_id UUID, p_action_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_action_id UUID; v_idx INTEGER;
BEGIN
  DELETE FROM wf_step_actions WHERE step_id = p_step_id;
  FOR v_idx IN 1..array_length(p_action_codes, 1) LOOP
    SELECT id INTO v_action_id FROM wf_actions WHERE code = p_action_codes[v_idx];
    IF v_action_id IS NOT NULL THEN
      INSERT INTO wf_step_actions (step_id, action_id, ordre) VALUES (p_step_id, v_action_id, v_idx);
    END IF;
  END LOOP;
  RETURN true;
END;
$$;

-- =====================================================
-- PARTIE 4 : Fonction get_workflow_config
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_workflow_config(p_entity_type TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_workflows JSONB;
  v_roles JSONB;
  v_services JSONB;
  v_actions JSONB;
BEGIN
  -- Récupérer tous les workflows avec leurs étapes
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', w.id, 'entity_type', w.entity_type, 'nom', w.nom,
      'description', w.description, 'est_actif', w.est_actif,
      'steps', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', s.id, 'step_order', s.step_order, 'label', s.label,
            'description', s.description, 'role_required', s.role_required,
            'role_alternatif', s.role_alternatif, 'direction_required', s.direction_required,
            'est_optionnel', s.est_optionnel, 'delai_max_heures', s.delai_max_heures,
            'permissions', (
              SELECT COALESCE(jsonb_agg(
                jsonb_build_object('role_code', p.role_code, 'service_code', p.service_code,
                  'can_view', p.can_view, 'can_act', p.can_act, 'can_delegate', p.can_delegate, 'is_primary', p.is_primary)
              ), '[]') FROM wf_step_permissions p WHERE p.step_id = s.id AND p.est_actif = true
            ),
            'actions', (
              SELECT COALESCE(jsonb_agg(
                jsonb_build_object('code', a.code, 'label', a.label, 'icon', a.icon, 'color', a.color,
                  'require_motif', a.require_motif, 'is_terminal', a.is_terminal)
                ORDER BY sa.ordre
              ), '[]') FROM wf_step_actions sa JOIN wf_actions a ON a.id = sa.action_id WHERE sa.step_id = s.id AND sa.est_actif = true
            )
          ) ORDER BY s.step_order
        ), '[]') FROM wf_steps s WHERE s.workflow_id = w.id
      )
    )
  ) INTO v_workflows
  FROM wf_definitions w
  WHERE (p_entity_type IS NULL OR w.entity_type = p_entity_type);

  -- Récupérer tous les rôles
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'code', code, 'label', label, 'description', description,
    'niveau_hierarchique', niveau_hierarchique, 'est_actif', est_actif
  ) ORDER BY niveau_hierarchique DESC) INTO v_roles FROM wf_roles;

  -- Récupérer tous les services
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'code', code, 'label', label, 'description', description,
    'parent_id', parent_id, 'responsable_role_code', responsable_role_code, 'est_actif', est_actif
  ) ORDER BY label) INTO v_services FROM wf_services;

  -- Récupérer toutes les actions
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'code', code, 'label', label, 'description', description,
    'icon', icon, 'color', color, 'require_motif', require_motif,
    'require_date_reprise', require_date_reprise, 'is_terminal', is_terminal, 'est_actif', est_actif
  ) ORDER BY label) INTO v_actions FROM wf_actions;

  RETURN jsonb_build_object(
    'workflows', COALESCE(v_workflows, '[]'),
    'roles', COALESCE(v_roles, '[]'),
    'services', COALESCE(v_services, '[]'),
    'actions', COALESCE(v_actions, '[]')
  );
END;
$$;

-- =====================================================
-- PARTIE 5 : RLS et Grants
-- =====================================================

-- RLS pour les nouvelles tables
ALTER TABLE public.wf_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_step_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_step_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_conditions ENABLE ROW LEVEL SECURITY;

-- Policies lecture pour tous
DROP POLICY IF EXISTS "wf_roles_read" ON public.wf_roles;
CREATE POLICY "wf_roles_read" ON public.wf_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_actions_read" ON public.wf_actions;
CREATE POLICY "wf_actions_read" ON public.wf_actions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_services_read" ON public.wf_services;
CREATE POLICY "wf_services_read" ON public.wf_services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_step_actions_read" ON public.wf_step_actions;
CREATE POLICY "wf_step_actions_read" ON public.wf_step_actions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_step_permissions_read" ON public.wf_step_permissions;
CREATE POLICY "wf_step_permissions_read" ON public.wf_step_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_conditions_read" ON public.wf_conditions;
CREATE POLICY "wf_conditions_read" ON public.wf_conditions FOR SELECT TO authenticated USING (true);

-- Policies admin pour modification
DROP POLICY IF EXISTS "wf_roles_admin" ON public.wf_roles;
CREATE POLICY "wf_roles_admin" ON public.wf_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

DROP POLICY IF EXISTS "wf_actions_admin" ON public.wf_actions;
CREATE POLICY "wf_actions_admin" ON public.wf_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

DROP POLICY IF EXISTS "wf_services_admin" ON public.wf_services;
CREATE POLICY "wf_services_admin" ON public.wf_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

DROP POLICY IF EXISTS "wf_step_actions_admin" ON public.wf_step_actions;
CREATE POLICY "wf_step_actions_admin" ON public.wf_step_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

DROP POLICY IF EXISTS "wf_step_permissions_admin" ON public.wf_step_permissions;
CREATE POLICY "wf_step_permissions_admin" ON public.wf_step_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

DROP POLICY IF EXISTS "wf_conditions_admin" ON public.wf_conditions;
CREATE POLICY "wf_conditions_admin" ON public.wf_conditions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

-- Grants
GRANT EXECUTE ON FUNCTION public.wf_admin_upsert_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_upsert_step TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_delete_step TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_reorder_steps TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_upsert_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_upsert_service TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_upsert_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_set_step_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.wf_admin_set_step_actions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workflow_config TO authenticated;

-- Commentaires
COMMENT ON TABLE public.wf_roles IS 'Rôles configurables pour les workflows';
COMMENT ON TABLE public.wf_actions IS 'Actions possibles dans les workflows (valider, rejeter, etc.)';
COMMENT ON TABLE public.wf_services IS 'Services et directions de l''organisation';
COMMENT ON TABLE public.wf_step_actions IS 'Actions disponibles par étape de workflow';
COMMENT ON TABLE public.wf_step_permissions IS 'Permissions fines par étape de workflow';
COMMENT ON TABLE public.wf_conditions IS 'Conditions pour étapes conditionnelles';
COMMENT ON FUNCTION public.get_workflow_config IS 'Retourne toute la configuration des workflows';
