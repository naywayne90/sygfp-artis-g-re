-- =====================================================
-- ENRICHISSEMENT GOUVERNANCE : Permissions + Workflows
-- =====================================================

-- 1) Ajouter colonnes module et conditions_json à role_permissions
ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS module VARCHAR(50),
ADD COLUMN IF NOT EXISTS conditions_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Mettre à jour le module pour les permissions existantes
UPDATE public.role_permissions SET module = split_part(action_code, '.', 1) WHERE module IS NULL;

-- 2) Ajouter les rôles métier dans l'enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'BUDGET_PLANNER';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'BUDGET_VALIDATOR';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'EXPENSE_REQUESTER';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'EXPENSE_VALIDATOR';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'AUDITOR';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'DAF';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SDCT';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SAF';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SDPM';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'TRESORERIE';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'COMPTABILITE';

-- 3) Table des modules pour référence
CREATE TABLE IF NOT EXISTS public.ref_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(100) NOT NULL,
  description TEXT,
  ordre_affichage INTEGER DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.ref_modules (code, libelle, ordre_affichage) VALUES
  ('budget', 'Planification budgétaire', 1),
  ('note', 'Notes AEF/SEF', 2),
  ('engagement', 'Engagements', 3),
  ('liquidation', 'Liquidations', 4),
  ('ordonnancement', 'Ordonnancements', 5),
  ('reglement', 'Paiements', 6),
  ('virement', 'Virements de crédits', 7),
  ('prestataire', 'Prestataires', 8),
  ('contrat', 'Contrats', 9),
  ('marche', 'Marchés publics', 10),
  ('audit', 'Audit et contrôle', 11),
  ('admin', 'Administration', 12)
ON CONFLICT (code) DO NOTHING;

-- 4) Table des actions pour référence
CREATE TABLE IF NOT EXISTS public.ref_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(100) NOT NULL,
  description TEXT,
  est_actif BOOLEAN DEFAULT true
);

INSERT INTO public.ref_actions (code, libelle) VALUES
  ('view', 'Consulter'),
  ('create', 'Créer'),
  ('edit', 'Modifier'),
  ('delete', 'Supprimer'),
  ('submit', 'Soumettre'),
  ('validate', 'Valider'),
  ('reject', 'Rejeter'),
  ('defer', 'Différer'),
  ('execute', 'Exécuter'),
  ('pay', 'Payer'),
  ('export', 'Exporter'),
  ('override', 'Forcer/Passer outre'),
  ('certify', 'Certifier service fait')
ON CONFLICT (code) DO NOTHING;

-- 5) Permissions pour BUDGET_PLANNER (Planification Budget)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description) VALUES
  ('BUDGET_PLANNER', 'budget.view', 'budget', true, 'Consulter le budget'),
  ('BUDGET_PLANNER', 'budget.create', 'budget', true, 'Créer des lignes budgétaires'),
  ('BUDGET_PLANNER', 'budget.edit', 'budget', true, 'Modifier des lignes budgétaires'),
  ('BUDGET_PLANNER', 'budget.submit', 'budget', true, 'Soumettre pour validation'),
  ('BUDGET_PLANNER', 'budget.export', 'budget', true, 'Exporter le budget'),
  ('BUDGET_PLANNER', 'virement.view', 'virement', true, 'Consulter les virements'),
  ('BUDGET_PLANNER', 'virement.create', 'virement', true, 'Créer des virements'),
  ('BUDGET_PLANNER', 'virement.submit', 'virement', true, 'Soumettre virements')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 6) Permissions pour BUDGET_VALIDATOR (Validateur Budget)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description) VALUES
  ('BUDGET_VALIDATOR', 'budget.view', 'budget', true, 'Consulter le budget'),
  ('BUDGET_VALIDATOR', 'budget.validate', 'budget', true, 'Valider les lignes budgétaires'),
  ('BUDGET_VALIDATOR', 'budget.reject', 'budget', true, 'Rejeter les lignes budgétaires'),
  ('BUDGET_VALIDATOR', 'budget.export', 'budget', true, 'Exporter le budget'),
  ('BUDGET_VALIDATOR', 'virement.view', 'virement', true, 'Consulter les virements'),
  ('BUDGET_VALIDATOR', 'virement.validate', 'virement', true, 'Valider les virements'),
  ('BUDGET_VALIDATOR', 'virement.reject', 'virement', true, 'Rejeter les virements')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 7) Permissions pour EXPENSE_REQUESTER (Demandeur dépense)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description, conditions_json) VALUES
  ('EXPENSE_REQUESTER', 'note.view', 'note', true, 'Consulter les notes', '{"own_direction": true}'),
  ('EXPENSE_REQUESTER', 'note.create', 'note', true, 'Créer des notes', '{"own_direction": true}'),
  ('EXPENSE_REQUESTER', 'note.edit', 'note', true, 'Modifier ses notes', '{"own_items": true}'),
  ('EXPENSE_REQUESTER', 'note.submit', 'note', true, 'Soumettre ses notes', '{"own_items": true}'),
  ('EXPENSE_REQUESTER', 'engagement.view', 'engagement', true, 'Consulter les engagements', '{"own_direction": true}'),
  ('EXPENSE_REQUESTER', 'engagement.create', 'engagement', true, 'Créer des engagements', '{"own_direction": true}'),
  ('EXPENSE_REQUESTER', 'engagement.edit', 'engagement', true, 'Modifier ses engagements', '{"own_items": true}'),
  ('EXPENSE_REQUESTER', 'engagement.submit', 'engagement', true, 'Soumettre ses engagements', '{"own_items": true}'),
  ('EXPENSE_REQUESTER', 'liquidation.view', 'liquidation', true, 'Consulter les liquidations', '{"own_direction": true}'),
  ('EXPENSE_REQUESTER', 'liquidation.create', 'liquidation', true, 'Créer des liquidations', '{}')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 8) Permissions pour EXPENSE_VALIDATOR (Validateur dépense)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description, conditions_json) VALUES
  ('EXPENSE_VALIDATOR', 'note.view', 'note', true, 'Consulter les notes', '{}'),
  ('EXPENSE_VALIDATOR', 'note.validate', 'note', true, 'Valider les notes', '{"not_own_items": true}'),
  ('EXPENSE_VALIDATOR', 'note.reject', 'note', true, 'Rejeter les notes', '{"not_own_items": true}'),
  ('EXPENSE_VALIDATOR', 'note.defer', 'note', true, 'Différer les notes', '{}'),
  ('EXPENSE_VALIDATOR', 'engagement.view', 'engagement', true, 'Consulter les engagements', '{}'),
  ('EXPENSE_VALIDATOR', 'engagement.validate', 'engagement', true, 'Valider les engagements', '{"not_own_items": true}'),
  ('EXPENSE_VALIDATOR', 'engagement.reject', 'engagement', true, 'Rejeter les engagements', '{"not_own_items": true}'),
  ('EXPENSE_VALIDATOR', 'engagement.defer', 'engagement', true, 'Différer les engagements', '{}'),
  ('EXPENSE_VALIDATOR', 'liquidation.view', 'liquidation', true, 'Consulter les liquidations', '{}'),
  ('EXPENSE_VALIDATOR', 'liquidation.validate', 'liquidation', true, 'Valider les liquidations', '{"not_own_items": true}'),
  ('EXPENSE_VALIDATOR', 'liquidation.certify', 'liquidation', true, 'Certifier service fait', '{}'),
  ('EXPENSE_VALIDATOR', 'ordonnancement.view', 'ordonnancement', true, 'Consulter les ordonnancements', '{}'),
  ('EXPENSE_VALIDATOR', 'ordonnancement.validate', 'ordonnancement', true, 'Valider les ordonnancements', '{}')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 9) Permissions pour TRESORERIE (Trésorier)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description) VALUES
  ('TRESORERIE', 'ordonnancement.view', 'ordonnancement', true, 'Consulter les ordonnancements'),
  ('TRESORERIE', 'ordonnancement.validate', 'ordonnancement', true, 'Valider les ordonnancements'),
  ('TRESORERIE', 'reglement.view', 'reglement', true, 'Consulter les paiements'),
  ('TRESORERIE', 'reglement.create', 'reglement', true, 'Enregistrer les paiements'),
  ('TRESORERIE', 'reglement.pay', 'reglement', true, 'Exécuter les paiements'),
  ('TRESORERIE', 'reglement.export', 'reglement', true, 'Exporter les paiements'),
  ('TRESORERIE', 'liquidation.view', 'liquidation', true, 'Consulter les liquidations'),
  ('TRESORERIE', 'engagement.view', 'engagement', true, 'Consulter les engagements')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 10) Permissions pour AUDITOR (Audit/Contrôle)
INSERT INTO public.role_permissions (role_code, action_code, module, is_granted, description) VALUES
  ('AUDITOR', 'budget.view', 'budget', true, 'Consulter le budget'),
  ('AUDITOR', 'budget.export', 'budget', true, 'Exporter le budget'),
  ('AUDITOR', 'note.view', 'note', true, 'Consulter les notes'),
  ('AUDITOR', 'note.export', 'note', true, 'Exporter les notes'),
  ('AUDITOR', 'engagement.view', 'engagement', true, 'Consulter les engagements'),
  ('AUDITOR', 'engagement.export', 'engagement', true, 'Exporter les engagements'),
  ('AUDITOR', 'liquidation.view', 'liquidation', true, 'Consulter les liquidations'),
  ('AUDITOR', 'liquidation.export', 'liquidation', true, 'Exporter les liquidations'),
  ('AUDITOR', 'ordonnancement.view', 'ordonnancement', true, 'Consulter les ordonnancements'),
  ('AUDITOR', 'ordonnancement.export', 'ordonnancement', true, 'Exporter les ordonnancements'),
  ('AUDITOR', 'reglement.view', 'reglement', true, 'Consulter les paiements'),
  ('AUDITOR', 'reglement.export', 'reglement', true, 'Exporter les paiements'),
  ('AUDITOR', 'virement.view', 'virement', true, 'Consulter les virements'),
  ('AUDITOR', 'virement.export', 'virement', true, 'Exporter les virements'),
  ('AUDITOR', 'audit.view', 'audit', true, 'Consulter le journal d''audit'),
  ('AUDITOR', 'audit.export', 'audit', true, 'Exporter le journal d''audit')
ON CONFLICT (role_code, action_code) DO NOTHING;

-- 11) Fonction de vérification de séparation des tâches
CREATE OR REPLACE FUNCTION public.check_separation_of_duties(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_action VARCHAR,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_creator_id UUID;
  v_can_proceed BOOLEAN := true;
  v_reason TEXT := '';
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Récupérer le créateur de l'entité
  CASE p_entity_type
    WHEN 'note' THEN
      SELECT created_by INTO v_creator_id FROM notes_dg WHERE id = p_entity_id;
    WHEN 'engagement' THEN
      SELECT created_by INTO v_creator_id FROM budget_engagements WHERE id = p_entity_id;
    WHEN 'liquidation' THEN
      SELECT created_by INTO v_creator_id FROM budget_liquidations WHERE id = p_entity_id;
    WHEN 'ordonnancement' THEN
      SELECT created_by INTO v_creator_id FROM ordonnancements WHERE id = p_entity_id;
    WHEN 'virement' THEN
      SELECT requested_by INTO v_creator_id FROM credit_transfers WHERE id = p_entity_id;
    ELSE
      v_creator_id := NULL;
  END CASE;

  -- Règle de séparation : créateur ≠ valideur
  IF p_action IN ('validate', 'reject', 'execute', 'pay') AND v_creator_id = v_user_id THEN
    -- Vérifier si l'utilisateur est ADMIN (peut forcer avec justification)
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'ADMIN' AND is_active = true) THEN
      v_reason := 'admin_override_required';
    ELSE
      v_can_proceed := false;
      v_reason := 'creator_cannot_validate';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'can_proceed', v_can_proceed,
    'reason', v_reason,
    'creator_id', v_creator_id,
    'current_user_id', v_user_id
  );
END;
$$;

-- 12) Fonction améliorée pour vérifier les permissions avec conditions
CREATE OR REPLACE FUNCTION public.check_permission_with_conditions(
  p_user_id UUID,
  p_action_code VARCHAR,
  p_entity_id UUID DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_perm RECORD;
  v_user_direction UUID;
  v_entity_created_by UUID;
  v_granted BOOLEAN := false;
  v_via_delegation BOOLEAN := false;
  v_conditions JSONB;
  v_reason TEXT := 'no_permission';
BEGIN
  -- Récupérer la direction de l'utilisateur
  SELECT direction_id INTO v_user_direction FROM profiles WHERE id = p_user_id;
  
  -- Vérifier les permissions directes
  SELECT rp.* INTO v_perm
  FROM role_permissions rp
  JOIN user_roles ur ON ur.role::text = rp.role_code
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND rp.action_code = p_action_code
    AND rp.is_granted = true
  LIMIT 1;
  
  IF FOUND THEN
    v_granted := true;
    v_conditions := COALESCE(v_perm.conditions_json, '{}'::jsonb);
    
    -- Vérifier les conditions
    IF v_conditions ? 'own_direction' AND (v_conditions->>'own_direction')::boolean THEN
      IF p_direction_id IS NOT NULL AND p_direction_id != v_user_direction THEN
        v_granted := false;
        v_reason := 'direction_mismatch';
      END IF;
    END IF;
    
    IF v_granted THEN
      v_reason := 'granted';
    END IF;
  ELSE
    -- Vérifier via délégation
    IF EXISTS (
      SELECT 1 FROM delegations d
      JOIN user_roles ur ON ur.user_id = d.delegateur_id
      JOIN role_permissions rp ON ur.role::text = rp.role_code
      WHERE d.delegataire_id = p_user_id
        AND d.est_active = true
        AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
        AND rp.action_code = p_action_code
        AND rp.is_granted = true
    ) THEN
      v_granted := true;
      v_via_delegation := true;
      v_reason := 'granted_via_delegation';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'granted', v_granted,
    'via_delegation', v_via_delegation,
    'reason', v_reason
  );
END;
$$;

-- 13) Vue pour les tâches à traiter par rôle
CREATE OR REPLACE VIEW public.pending_tasks_by_role AS
SELECT 
  'note' as entity_type,
  n.id as entity_id,
  n.numero as entity_code,
  n.objet as title,
  n.statut as status,
  n.created_at,
  n.created_by,
  CASE 
    WHEN n.statut = 'soumis' THEN 'EXPENSE_VALIDATOR'
    WHEN n.statut = 'brouillon' THEN 'EXPENSE_REQUESTER'
    ELSE NULL
  END as target_role,
  n.exercice
FROM notes_dg n
WHERE n.statut IN ('soumis', 'en_attente', 'brouillon')

UNION ALL

SELECT 
  'engagement' as entity_type,
  e.id as entity_id,
  e.numero as entity_code,
  e.objet as title,
  e.statut as status,
  e.created_at,
  e.created_by,
  CASE 
    WHEN e.statut = 'soumis' THEN 'EXPENSE_VALIDATOR'
    WHEN e.statut = 'brouillon' THEN 'EXPENSE_REQUESTER'
    ELSE NULL
  END as target_role,
  e.exercice
FROM budget_engagements e
WHERE e.statut IN ('soumis', 'en_attente', 'brouillon')

UNION ALL

SELECT 
  'liquidation' as entity_type,
  l.id as entity_id,
  l.numero as entity_code,
  'Liquidation ' || l.numero as title,
  l.statut as status,
  l.created_at,
  l.created_by,
  CASE 
    WHEN l.statut = 'soumis' THEN 'EXPENSE_VALIDATOR'
    ELSE NULL
  END as target_role,
  l.exercice
FROM budget_liquidations l
WHERE l.statut IN ('soumis', 'en_attente')

UNION ALL

SELECT 
  'ordonnancement' as entity_type,
  o.id as entity_id,
  o.numero as entity_code,
  'Ordonnancement ' || o.numero as title,
  o.statut as status,
  o.created_at,
  o.created_by,
  CASE 
    WHEN o.statut = 'en_signature' THEN 'DG'
    WHEN o.statut = 'signe' THEN 'TRESORERIE'
    ELSE NULL
  END as target_role,
  o.exercice
FROM ordonnancements o
WHERE o.statut IN ('en_signature', 'signe', 'transmis')

UNION ALL

SELECT 
  'virement' as entity_type,
  v.id as entity_id,
  v.code as entity_code,
  v.motif as title,
  v.status as status,
  v.requested_at as created_at,
  v.requested_by as created_by,
  CASE 
    WHEN v.status = 'pending' THEN 'BUDGET_VALIDATOR'
    ELSE NULL
  END as target_role,
  v.exercice
FROM credit_transfers v
WHERE v.status = 'pending';

-- RLS sur ref_modules et ref_actions
ALTER TABLE public.ref_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ref_modules readable by authenticated" ON public.ref_modules;
CREATE POLICY "ref_modules readable by authenticated" ON public.ref_modules 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ref_actions readable by authenticated" ON public.ref_actions;
CREATE POLICY "ref_actions readable by authenticated" ON public.ref_actions 
FOR SELECT TO authenticated USING (true);