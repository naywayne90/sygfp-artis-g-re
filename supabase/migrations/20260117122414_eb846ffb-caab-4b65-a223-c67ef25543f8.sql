-- ============================================================
-- SYSTÈME DE TRANSITIONS DE WORKFLOW OFFICIEL
-- ============================================================

-- 1. Table des statuts de workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gray',
  bg_color TEXT DEFAULT 'bg-gray-100',
  is_terminal BOOLEAN DEFAULT false,
  is_pending BOOLEAN DEFAULT false,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les statuts officiels
INSERT INTO workflow_statuses (code, label, description, color, bg_color, is_terminal, is_pending, ordre) VALUES
  -- Phases initiales
  ('brouillon', 'Brouillon', 'En cours de saisie', 'gray', 'bg-gray-100', false, false, 0),
  ('soumis', 'Soumis', 'Soumis pour validation', 'blue', 'bg-blue-100', false, true, 10),
  ('en_attente', 'En attente', 'En attente d''action', 'yellow', 'bg-yellow-100', false, true, 15),
  ('en_cours', 'En cours', 'Traitement en cours', 'orange', 'bg-orange-100', false, false, 20),
  
  -- Phases décision
  ('a_valider', 'À valider', 'En attente de validation DG', 'purple', 'bg-purple-100', false, true, 25),
  ('a_valider_dg', 'À valider DG', 'En attente validation DG', 'purple', 'bg-purple-100', false, true, 26),
  ('valide', 'Validé', 'Validé/Approuvé', 'green', 'bg-green-100', false, false, 30),
  ('rejete', 'Rejeté', 'Rejeté', 'red', 'bg-red-100', true, false, 35),
  ('differe', 'Différé', 'Reporté à une date ultérieure', 'purple', 'bg-purple-100', false, false, 40),
  ('retourne', 'Retourné', 'Renvoyé pour correction', 'orange', 'bg-orange-100', false, false, 42),
  
  -- Phases spécifiques
  ('a_imputer', 'À imputer', 'En attente d''imputation', 'indigo', 'bg-indigo-100', false, true, 50),
  ('impute', 'Imputé', 'Imputation réalisée', 'green', 'bg-green-100', false, false, 55),
  ('attribue', 'Attribué', 'Marché attribué', 'green', 'bg-green-100', false, false, 60),
  ('infructueux', 'Infructueux', 'Marché infructueux', 'orange', 'bg-orange-100', true, false, 65),
  
  -- Phases ordonnancement
  ('en_signature', 'En signature', 'En cours de signature', 'purple', 'bg-purple-100', false, true, 70),
  ('vise', 'Visé', 'Visé par le CB', 'blue', 'bg-blue-100', false, false, 75),
  ('a_signer', 'À signer', 'En attente signature DG', 'purple', 'bg-purple-100', false, true, 80),
  ('signe', 'Signé', 'Signé par DG', 'green', 'bg-green-100', false, false, 85),
  
  -- Phases règlement
  ('en_attente_reglement', 'En attente règlement', 'En attente paiement trésorerie', 'yellow', 'bg-yellow-100', false, true, 90),
  ('regle_partiel', 'Réglé partiellement', 'Paiement partiel effectué', 'orange', 'bg-orange-100', false, false, 92),
  ('regle_total', 'Réglé totalement', 'Paiement complet', 'green', 'bg-green-100', true, false, 95),
  ('paye', 'Payé', 'Paiement effectué', 'green', 'bg-green-200', true, false, 96),
  ('refuse', 'Refusé', 'Paiement refusé', 'red', 'bg-red-100', true, false, 97),
  
  -- Phases terminales
  ('clos', 'Clôturé', 'Terminé normalement', 'gray', 'bg-gray-200', true, false, 100),
  ('annule', 'Annulé', 'Annulé', 'red', 'bg-red-200', true, false, 105)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  bg_color = EXCLUDED.bg_color,
  is_terminal = EXCLUDED.is_terminal,
  is_pending = EXCLUDED.is_pending,
  ordre = EXCLUDED.ordre;

-- 2. Table des transitions autorisées
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  action_code TEXT NOT NULL,
  action_label TEXT NOT NULL,
  required_roles TEXT[] NOT NULL DEFAULT '{}',
  requires_motif BOOLEAN DEFAULT false,
  requires_montant BOOLEAN DEFAULT false,
  requires_budget_check BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, from_status, to_status)
);

-- Transitions pour notes_sef
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif) VALUES
  ('notes_sef', 'brouillon', 'soumis', 'SUBMIT', 'Soumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false),
  ('notes_sef', 'soumis', 'a_valider_dg', 'FORWARD_DG', 'Transmettre au DG', ARRAY['DAAF', 'ADMIN'], false),
  ('notes_sef', 'a_valider_dg', 'valide', 'VALIDATE', 'Valider', ARRAY['DG', 'ADMIN'], false),
  ('notes_sef', 'soumis', 'valide', 'VALIDATE', 'Valider', ARRAY['DG', 'ADMIN'], false),
  ('notes_sef', 'a_valider_dg', 'rejete', 'REJECT', 'Rejeter', ARRAY['DG', 'ADMIN'], true),
  ('notes_sef', 'soumis', 'rejete', 'REJECT', 'Rejeter', ARRAY['DG', 'DAAF', 'ADMIN'], true),
  ('notes_sef', 'a_valider_dg', 'differe', 'DEFER', 'Différer', ARRAY['DG', 'ADMIN'], true),
  ('notes_sef', 'soumis', 'differe', 'DEFER', 'Différer', ARRAY['DG', 'DAAF', 'ADMIN'], true),
  ('notes_sef', 'differe', 'soumis', 'RESUBMIT', 'Resoumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false),
  ('notes_sef', 'rejete', 'brouillon', 'REVISE', 'Réviser', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif;

-- Transitions pour notes_dg (AEF)
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif, requires_budget_check) VALUES
  ('notes_dg', 'brouillon', 'soumis', 'SUBMIT', 'Soumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false, false),
  ('notes_dg', 'soumis', 'valide', 'VALIDATE', 'Valider', ARRAY['DG', 'ADMIN'], false, false),
  ('notes_dg', 'soumis', 'rejete', 'REJECT', 'Rejeter', ARRAY['DG', 'ADMIN'], true, false),
  ('notes_dg', 'soumis', 'differe', 'DEFER', 'Différer', ARRAY['DG', 'ADMIN'], true, false),
  ('notes_dg', 'differe', 'soumis', 'RESUBMIT', 'Resoumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false, false),
  ('notes_dg', 'valide', 'a_imputer', 'MARK_FOR_IMPUTATION', 'Marquer pour imputation', ARRAY['DAAF', 'ADMIN'], false, true),
  ('notes_dg', 'a_imputer', 'impute', 'IMPUTE', 'Imputer', ARRAY['DAAF', 'ADMIN'], false, true)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif,
  requires_budget_check = EXCLUDED.requires_budget_check;

-- Transitions pour expressions_besoin
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif) VALUES
  ('expressions_besoin', 'brouillon', 'soumis', 'SUBMIT', 'Soumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false),
  ('expressions_besoin', 'soumis', 'valide', 'VALIDATE', 'Valider', ARRAY['SDPM', 'DAAF', 'ADMIN'], false),
  ('expressions_besoin', 'soumis', 'rejete', 'REJECT', 'Rejeter', ARRAY['SDPM', 'DAAF', 'ADMIN'], true),
  ('expressions_besoin', 'soumis', 'differe', 'DEFER', 'Différer', ARRAY['SDPM', 'DAAF', 'ADMIN'], true),
  ('expressions_besoin', 'differe', 'soumis', 'RESUBMIT', 'Resoumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif;

-- Transitions pour budget_engagements
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif, requires_budget_check) VALUES
  ('budget_engagements', 'brouillon', 'soumis', 'SUBMIT', 'Soumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false, true),
  ('budget_engagements', 'soumis', 'valide', 'VALIDATE', 'Valider', ARRAY['CB', 'DAAF', 'ADMIN'], false, true),
  ('budget_engagements', 'soumis', 'rejete', 'REJECT', 'Rejeter', ARRAY['CB', 'DAAF', 'ADMIN'], true, false),
  ('budget_engagements', 'soumis', 'differe', 'DEFER', 'Différer', ARRAY['CB', 'DAAF', 'ADMIN'], true, false),
  ('budget_engagements', 'differe', 'soumis', 'RESUBMIT', 'Resoumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false, false)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif,
  requires_budget_check = EXCLUDED.requires_budget_check;

-- Transitions pour budget_liquidations
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif) VALUES
  ('budget_liquidations', 'brouillon', 'soumis', 'SUBMIT', 'Soumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false),
  ('budget_liquidations', 'soumis', 'valide', 'VALIDATE', 'Valider', ARRAY['CB', 'DAAF', 'ADMIN'], false),
  ('budget_liquidations', 'soumis', 'rejete', 'REJECT', 'Rejeter', ARRAY['CB', 'DAAF', 'ADMIN'], true),
  ('budget_liquidations', 'soumis', 'differe', 'DEFER', 'Différer', ARRAY['CB', 'DAAF', 'ADMIN'], true),
  ('budget_liquidations', 'differe', 'soumis', 'RESUBMIT', 'Resoumettre', ARRAY['AGENT', 'DIRECTOR', 'ADMIN'], false)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif;

-- Transitions pour ordonnancements
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif) VALUES
  ('ordonnancements', 'en_attente', 'vise', 'VISA', 'Viser', ARRAY['CB', 'ADMIN'], false),
  ('ordonnancements', 'en_attente', 'rejete', 'REJECT', 'Rejeter', ARRAY['CB', 'ADMIN'], true),
  ('ordonnancements', 'vise', 'en_signature', 'SEND_FOR_SIGNATURE', 'Envoyer pour signature', ARRAY['DAAF', 'ADMIN'], false),
  ('ordonnancements', 'en_signature', 'signe', 'SIGN', 'Signer', ARRAY['DG', 'ADMIN'], false),
  ('ordonnancements', 'en_signature', 'rejete', 'REJECT', 'Rejeter', ARRAY['DG', 'ADMIN'], true)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif;

-- Transitions pour reglements
INSERT INTO workflow_transitions (module, from_status, to_status, action_code, action_label, required_roles, requires_motif) VALUES
  ('reglements', 'en_attente', 'en_cours', 'START_PAYMENT', 'Initier paiement', ARRAY['TRESORIER', 'ADMIN'], false),
  ('reglements', 'en_cours', 'paye', 'COMPLETE_PAYMENT', 'Confirmer paiement', ARRAY['TRESORIER', 'ADMIN'], false),
  ('reglements', 'en_cours', 'refuse', 'REFUSE_PAYMENT', 'Refuser paiement', ARRAY['TRESORIER', 'ADMIN'], true)
ON CONFLICT (module, from_status, to_status) DO UPDATE SET
  action_code = EXCLUDED.action_code,
  action_label = EXCLUDED.action_label,
  required_roles = EXCLUDED.required_roles,
  requires_motif = EXCLUDED.requires_motif;

-- 3. Table d'historique des transitions (journal d'audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_transition_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_code TEXT,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  action_code TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  motif TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_wth_module_entity ON workflow_transition_history(module, entity_id);
CREATE INDEX IF NOT EXISTS idx_wth_performed_at ON workflow_transition_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_wth_performed_by ON workflow_transition_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_wth_exercice ON workflow_transition_history(exercice);

-- RLS
ALTER TABLE workflow_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transition_history ENABLE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "workflow_statuses_select" ON workflow_statuses;
CREATE POLICY "workflow_statuses_select" ON workflow_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "workflow_transitions_select" ON workflow_transitions;
CREATE POLICY "workflow_transitions_select" ON workflow_transitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "workflow_transitions_manage" ON workflow_transitions;
CREATE POLICY "workflow_transitions_manage" ON workflow_transitions FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "workflow_history_insert" ON workflow_transition_history;
CREATE POLICY "workflow_history_insert" ON workflow_transition_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "workflow_history_select" ON workflow_transition_history;
CREATE POLICY "workflow_history_select" ON workflow_transition_history FOR SELECT USING (true);

-- 4. Fonction de vérification de transition autorisée
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_transition(
  p_module TEXT,
  p_from_status TEXT,
  p_to_status TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  allowed BOOLEAN,
  action_code TEXT,
  action_label TEXT,
  requires_motif BOOLEAN,
  requires_budget_check BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transition RECORD;
  v_user_roles TEXT[];
BEGIN
  -- Récupérer les rôles de l'utilisateur
  SELECT ARRAY_AGG(ur.role::text)
  INTO v_user_roles
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND ur.revoked_at IS NULL;

  -- Chercher la transition
  SELECT t.* INTO v_transition
  FROM workflow_transitions t
  WHERE t.module = p_module
    AND t.from_status = p_from_status
    AND t.to_status = p_to_status
    AND t.is_active = true;

  IF v_transition IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, false, false, 
      'Transition non autorisée: ' || p_from_status || ' → ' || p_to_status;
    RETURN;
  END IF;

  -- Vérifier les rôles
  IF NOT (v_user_roles && v_transition.required_roles) THEN
    RETURN QUERY SELECT false, v_transition.action_code, v_transition.action_label, 
      v_transition.requires_motif, v_transition.requires_budget_check,
      'Rôles insuffisants. Requis: ' || array_to_string(v_transition.required_roles, ', ');
    RETURN;
  END IF;

  -- Transition autorisée
  RETURN QUERY SELECT true, v_transition.action_code, v_transition.action_label,
    v_transition.requires_motif, v_transition.requires_budget_check,
    'Transition autorisée';
END;
$$;

-- 5. Fonction de transition avec log
-- ============================================================
CREATE OR REPLACE FUNCTION public.execute_transition(
  p_module TEXT,
  p_entity_id UUID,
  p_entity_code TEXT,
  p_from_status TEXT,
  p_to_status TEXT,
  p_motif TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
  success BOOLEAN,
  action_code TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Vérifier la transition
  SELECT * INTO v_check
  FROM can_transition(p_module, p_from_status, p_to_status, v_user_id)
  LIMIT 1;

  IF NOT v_check.allowed THEN
    RETURN QUERY SELECT false, NULL::TEXT, v_check.reason;
    RETURN;
  END IF;

  -- Vérifier motif obligatoire
  IF v_check.requires_motif AND (p_motif IS NULL OR TRIM(p_motif) = '') THEN
    RETURN QUERY SELECT false, v_check.action_code, 'Le motif est obligatoire pour cette action';
    RETURN;
  END IF;

  -- Logger la transition
  INSERT INTO workflow_transition_history (
    module,
    entity_id,
    entity_code,
    from_status,
    to_status,
    action_code,
    performed_by,
    motif,
    metadata
  ) VALUES (
    p_module,
    p_entity_id,
    p_entity_code,
    p_from_status,
    p_to_status,
    v_check.action_code,
    v_user_id,
    p_motif,
    p_metadata
  );

  -- Retourner succès
  RETURN QUERY SELECT true, v_check.action_code, 'Transition effectuée: ' || v_check.action_label;
END;
$$;

-- 6. Fonction pour obtenir les transitions disponibles
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_transitions(
  p_module TEXT,
  p_current_status TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  to_status TEXT,
  action_code TEXT,
  action_label TEXT,
  requires_motif BOOLEAN,
  requires_budget_check BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_roles TEXT[];
BEGIN
  -- Récupérer les rôles de l'utilisateur
  SELECT ARRAY_AGG(ur.role::text)
  INTO v_user_roles
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND ur.revoked_at IS NULL;

  RETURN QUERY
  SELECT t.to_status, t.action_code, t.action_label, t.requires_motif, t.requires_budget_check
  FROM workflow_transitions t
  WHERE t.module = p_module
    AND t.from_status = p_current_status
    AND t.is_active = true
    AND (v_user_roles && t.required_roles);
END;
$$;

-- 7. Fonction pour l'historique d'une entité
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_entity_transition_history(
  p_module TEXT,
  p_entity_id UUID
)
RETURNS TABLE(
  id UUID,
  from_status TEXT,
  to_status TEXT,
  action_code TEXT,
  performed_by UUID,
  performer_name TEXT,
  performed_at TIMESTAMPTZ,
  motif TEXT,
  metadata JSONB
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    h.id,
    h.from_status,
    h.to_status,
    h.action_code,
    h.performed_by,
    p.full_name as performer_name,
    h.performed_at,
    h.motif,
    h.metadata
  FROM workflow_transition_history h
  LEFT JOIN profiles p ON p.id = h.performed_by
  WHERE h.module = p_module
    AND h.entity_id = p_entity_id
  ORDER BY h.performed_at DESC;
$$;

-- Commentaires
COMMENT ON TABLE workflow_statuses IS 'Référentiel des statuts de workflow';
COMMENT ON TABLE workflow_transitions IS 'Matrice des transitions autorisées par module';
COMMENT ON TABLE workflow_transition_history IS 'Journal complet des transitions effectuées';
COMMENT ON FUNCTION can_transition IS 'Vérifie si une transition est autorisée pour l''utilisateur';
COMMENT ON FUNCTION execute_transition IS 'Exécute et logue une transition';
COMMENT ON FUNCTION get_available_transitions IS 'Retourne les transitions possibles depuis un statut';
COMMENT ON FUNCTION get_entity_transition_history IS 'Retourne l''historique des transitions d''une entité';