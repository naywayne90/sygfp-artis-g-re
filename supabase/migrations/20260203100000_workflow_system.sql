-- =====================================================
-- Migration : Système de Workflow Multi-niveaux
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Prompt : 18
-- =====================================================
--
-- CIRCUITS DE VALIDATION :
-- 1. NOTE SEF : Agent → Supérieur hiérarchique → DG
-- 2. IMPUTATION : DAF (BGT) → SDPM (Passation) → SDCT (Comptable)
-- 3. ENGAGEMENT : CB → DGPEC (si Personnel) OU DAF (si B&S) → DG
-- 4. LIQUIDATION : CB → DGPEC/DAF → DG → SDCT
-- 5. ORDONNANCEMENT : DAF → DG
-- 6. RÈGLEMENT : Trésorier
-- =====================================================
-- NOTE: Tables créées avec préfixe wf_ pour éviter conflits
-- avec les tables workflow_* existantes
-- =====================================================

-- Table des définitions de workflow
CREATE TABLE IF NOT EXISTS public.wf_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des étapes de workflow
CREATE TABLE IF NOT EXISTS public.wf_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.wf_definitions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role_required TEXT NOT NULL,
  role_alternatif TEXT,
  direction_required TEXT,
  label TEXT NOT NULL,
  description TEXT,
  est_optionnel BOOLEAN DEFAULT false,
  delai_max_heures INTEGER DEFAULT 48,
  condition_type TEXT,
  condition_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

-- Table des instances de workflow (une par entité)
CREATE TABLE IF NOT EXISTS public.wf_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.wf_definitions(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_step_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'complete', 'rejete', 'annule', 'differe')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  started_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  UNIQUE(entity_type, entity_id)
);

-- Table historique des actions sur les étapes
CREATE TABLE IF NOT EXISTS public.wf_step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.wf_instances(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_label TEXT,
  action TEXT NOT NULL CHECK (action IN ('valide', 'differe', 'rejete', 'annule', 'skip')),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  user_role TEXT,
  motif TEXT,
  condition_reprise TEXT,
  date_reprise TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_wf_definitions_type ON public.wf_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_wf_definitions_actif ON public.wf_definitions(est_actif) WHERE est_actif = true;

CREATE INDEX IF NOT EXISTS idx_wf_steps_workflow ON public.wf_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_steps_order ON public.wf_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_wf_steps_role ON public.wf_steps(role_required);

CREATE INDEX IF NOT EXISTS idx_wf_instances_entity ON public.wf_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wf_instances_status ON public.wf_instances(status);
CREATE INDEX IF NOT EXISTS idx_wf_instances_workflow ON public.wf_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_instances_current ON public.wf_instances(status, current_step_order) WHERE status = 'en_cours';

CREATE INDEX IF NOT EXISTS idx_wf_history_instance ON public.wf_step_history(instance_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_user ON public.wf_step_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_date ON public.wf_step_history(created_at DESC);

-- Insérer les workflows par défaut
INSERT INTO public.wf_definitions (entity_type, nom, description) VALUES
  ('notes_sef', 'Validation Note SEF', 'Circuit de validation des notes d''expression de besoin'),
  ('imputations', 'Validation Imputation', 'Circuit de validation des imputations budgétaires'),
  ('budget_engagements', 'Validation Engagement', 'Circuit de validation des engagements'),
  ('budget_liquidations', 'Validation Liquidation', 'Circuit de validation des liquidations'),
  ('ordonnancements', 'Validation Ordonnancement', 'Circuit de validation des ordonnancements'),
  ('reglements', 'Validation Règlement', 'Circuit de validation des règlements')
ON CONFLICT (entity_type) DO NOTHING;

-- Fonction pour insérer les étapes de workflow
CREATE OR REPLACE FUNCTION public.setup_wf_steps()
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  v_wf_notes_sef UUID;
  v_wf_imputations UUID;
  v_wf_engagements UUID;
  v_wf_liquidations UUID;
  v_wf_ordonnancements UUID;
  v_wf_reglements UUID;
BEGIN
  -- Récupérer les IDs des workflows
  SELECT id INTO v_wf_notes_sef FROM wf_definitions WHERE entity_type = 'notes_sef';
  SELECT id INTO v_wf_imputations FROM wf_definitions WHERE entity_type = 'imputations';
  SELECT id INTO v_wf_engagements FROM wf_definitions WHERE entity_type = 'budget_engagements';
  SELECT id INTO v_wf_liquidations FROM wf_definitions WHERE entity_type = 'budget_liquidations';
  SELECT id INTO v_wf_ordonnancements FROM wf_definitions WHERE entity_type = 'ordonnancements';
  SELECT id INTO v_wf_reglements FROM wf_definitions WHERE entity_type = 'reglements';

  -- Étapes Notes SEF: Agent → Directeur → DG
  IF v_wf_notes_sef IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, label, description, delai_max_heures)
    VALUES
      (v_wf_notes_sef, 1, 'AGENT', 'Création', 'Création de la note par l''agent', 24),
      (v_wf_notes_sef, 2, 'DIRECTEUR', 'Validation Directeur', 'Validation par le supérieur hiérarchique', 48),
      (v_wf_notes_sef, 3, 'DG', 'Validation DG', 'Validation finale par le Directeur Général', 72)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;

  -- Étapes Imputations: DAF (BGT) → SDPM → SDCT
  IF v_wf_imputations IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, direction_required, label, description, delai_max_heures)
    VALUES
      (v_wf_imputations, 1, 'DIRECTEUR', 'DAF', 'Validation Budget', 'Validation par la Direction Administrative et Financière', 48),
      (v_wf_imputations, 2, 'SOUS_DIRECTEUR', 'SDPM', 'Validation Passation', 'Validation par le Sous-Directeur Passation des Marchés', 48),
      (v_wf_imputations, 3, 'SOUS_DIRECTEUR', 'SDCT', 'Validation Comptable', 'Validation par le Sous-Directeur Comptabilité et Trésorerie', 48)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;

  -- Étapes Engagements: CB → DGPEC/DAF (selon type) → DG
  IF v_wf_engagements IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, role_alternatif, label, description, delai_max_heures, condition_type, condition_value)
    VALUES
      (v_wf_engagements, 1, 'CONTROLEUR', NULL, 'Contrôle Budgétaire', 'Contrôle par le Contrôleur Budgétaire', 24, NULL, NULL),
      (v_wf_engagements, 2, 'DIRECTEUR', 'DAF', 'Validation Direction', 'Validation DGPEC (Personnel) ou DAF (Biens & Services)', 48, 'type_depense', 'personnel|transfert'),
      (v_wf_engagements, 3, 'DG', NULL, 'Validation DG', 'Validation finale par le Directeur Général', 72, NULL, NULL)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;

  -- Étapes Liquidations: CB → DGPEC/DAF → DG → SDCT
  IF v_wf_liquidations IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, label, description, delai_max_heures)
    VALUES
      (v_wf_liquidations, 1, 'CONTROLEUR', 'Contrôle Budgétaire', 'Contrôle par le Contrôleur Budgétaire', 24),
      (v_wf_liquidations, 2, 'DIRECTEUR', 'Validation Direction', 'Validation par la Direction concernée', 48),
      (v_wf_liquidations, 3, 'DG', 'Validation DG', 'Validation par le Directeur Général', 72),
      (v_wf_liquidations, 4, 'SOUS_DIRECTEUR', 'Validation Comptable', 'Validation finale par SDCT', 48)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;

  -- Étapes Ordonnancements: DAF → DG
  IF v_wf_ordonnancements IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, direction_required, label, description, delai_max_heures)
    VALUES
      (v_wf_ordonnancements, 1, 'DIRECTEUR', 'DAF', 'Validation DAF', 'Validation par la Direction Administrative et Financière', 48),
      (v_wf_ordonnancements, 2, 'DG', NULL, 'Validation DG', 'Validation finale par le Directeur Général', 72)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;

  -- Étapes Règlements: Trésorier
  IF v_wf_reglements IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, label, description, delai_max_heures)
    VALUES
      (v_wf_reglements, 1, 'TRESORIER', 'Paiement', 'Exécution du paiement par le Trésorier', 48)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;
END;
$func$;

-- Exécuter la fonction pour insérer les étapes
SELECT setup_wf_steps();

-- Fonction : Démarrer un workflow pour une entité
CREATE OR REPLACE FUNCTION public.start_workflow(p_entity_type TEXT, p_entity_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_workflow_id UUID;
  v_instance_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Trouver le workflow actif
  SELECT id INTO v_workflow_id FROM wf_definitions
  WHERE entity_type = p_entity_type AND est_actif = true;

  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'Aucun workflow actif pour le type %', p_entity_type;
  END IF;

  -- Créer ou réinitialiser l'instance
  INSERT INTO wf_instances (workflow_id, entity_type, entity_id, current_step_order, status, started_by)
  VALUES (v_workflow_id, p_entity_type, p_entity_id, 1, 'en_cours', v_user_id)
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    current_step_order = 1,
    status = 'en_cours',
    started_at = NOW(),
    completed_at = NULL,
    started_by = v_user_id
  RETURNING id INTO v_instance_id;

  -- Enregistrer le démarrage dans l'historique
  INSERT INTO wf_step_history (instance_id, step_order, step_label, action, user_id, user_name)
  SELECT v_instance_id, 0, 'Démarrage', 'valide', v_user_id, p.full_name
  FROM profiles p WHERE p.id = v_user_id;

  RETURN v_instance_id;
END;
$func$;

-- Fonction : Obtenir le statut complet du workflow
CREATE OR REPLACE FUNCTION public.get_workflow_status(p_entity_type TEXT, p_entity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_instance wf_instances;
  v_current_step wf_steps;
  v_all_steps JSONB;
  v_history JSONB;
  v_total_steps INTEGER;
  v_workflow_name TEXT;
BEGIN
  -- Récupérer l'instance
  SELECT * INTO v_instance FROM wf_instances
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

  IF v_instance.id IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'message', 'Workflow non démarré');
  END IF;

  -- Récupérer le nom du workflow
  SELECT nom INTO v_workflow_name FROM wf_definitions WHERE id = v_instance.workflow_id;

  -- Récupérer l'étape courante
  SELECT * INTO v_current_step FROM wf_steps
  WHERE workflow_id = v_instance.workflow_id AND step_order = v_instance.current_step_order;

  -- Compter le total d'étapes
  SELECT COUNT(*) INTO v_total_steps FROM wf_steps WHERE workflow_id = v_instance.workflow_id;

  -- Récupérer toutes les étapes avec statut
  SELECT jsonb_agg(
    jsonb_build_object(
      'step_order', s.step_order,
      'label', s.label,
      'description', s.description,
      'role_required', s.role_required,
      'role_alternatif', s.role_alternatif,
      'direction_required', s.direction_required,
      'est_optionnel', s.est_optionnel,
      'delai_max_heures', s.delai_max_heures,
      'is_current', s.step_order = v_instance.current_step_order,
      'is_completed', s.step_order < v_instance.current_step_order,
      'is_pending', s.step_order > v_instance.current_step_order
    ) ORDER BY s.step_order
  ) INTO v_all_steps
  FROM wf_steps s WHERE s.workflow_id = v_instance.workflow_id;

  -- Récupérer l'historique
  SELECT jsonb_agg(
    jsonb_build_object(
      'step_order', h.step_order,
      'step_label', h.step_label,
      'action', h.action,
      'user_id', h.user_id,
      'user_name', h.user_name,
      'user_role', h.user_role,
      'motif', h.motif,
      'condition_reprise', h.condition_reprise,
      'date_reprise', h.date_reprise,
      'created_at', h.created_at
    ) ORDER BY h.created_at
  ) INTO v_history
  FROM wf_step_history h WHERE h.instance_id = v_instance.id;

  RETURN jsonb_build_object(
    'exists', true,
    'instance_id', v_instance.id,
    'workflow_name', v_workflow_name,
    'status', v_instance.status,
    'current_step', v_instance.current_step_order,
    'total_steps', v_total_steps,
    'progress_percent', ROUND((v_instance.current_step_order - 1)::NUMERIC / NULLIF(v_total_steps, 0) * 100, 0),
    'current_step_label', v_current_step.label,
    'current_role_required', v_current_step.role_required,
    'current_direction_required', v_current_step.direction_required,
    'started_at', v_instance.started_at,
    'completed_at', v_instance.completed_at,
    'steps', COALESCE(v_all_steps, '[]'::jsonb),
    'history', COALESCE(v_history, '[]'::jsonb)
  );
END;
$func$;

-- Fonction : Avancer, différer ou rejeter le workflow
CREATE OR REPLACE FUNCTION public.advance_workflow(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_motif TEXT DEFAULT NULL,
  p_condition_reprise TEXT DEFAULT NULL,
  p_date_reprise TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_instance wf_instances;
  v_current_step wf_steps;
  v_max_step INTEGER;
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  v_user_id := auth.uid();

  -- Récupérer les infos utilisateur
  SELECT full_name, profil_fonctionnel INTO v_user_name, v_user_role
  FROM profiles WHERE id = v_user_id;

  -- Vérifier l'action
  IF p_action NOT IN ('valide', 'differe', 'rejete', 'annule') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Action invalide. Utilisez: valide, differe, rejete, annule');
  END IF;

  -- Récupérer l'instance
  SELECT * INTO v_instance FROM wf_instances
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

  IF v_instance.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workflow non trouvé pour cette entité');
  END IF;

  IF v_instance.status NOT IN ('en_cours', 'differe') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce workflow n''est plus en cours (statut: ' || v_instance.status || ')');
  END IF;

  -- Récupérer l'étape courante
  SELECT * INTO v_current_step FROM wf_steps
  WHERE workflow_id = v_instance.workflow_id AND step_order = v_instance.current_step_order;

  -- Enregistrer dans l'historique
  INSERT INTO wf_step_history (
    instance_id, step_order, step_label, action,
    user_id, user_name, user_role,
    motif, condition_reprise, date_reprise
  )
  VALUES (
    v_instance.id, v_instance.current_step_order, v_current_step.label, p_action,
    v_user_id, v_user_name, v_user_role,
    p_motif, p_condition_reprise, p_date_reprise
  );

  -- Traiter selon l'action
  IF p_action = 'valide' THEN
    -- Obtenir le nombre max d'étapes
    SELECT MAX(step_order) INTO v_max_step FROM wf_steps WHERE workflow_id = v_instance.workflow_id;

    IF v_instance.current_step_order >= v_max_step THEN
      -- Workflow terminé
      UPDATE wf_instances
      SET status = 'complete', completed_at = NOW()
      WHERE id = v_instance.id;

      RETURN jsonb_build_object(
        'success', true,
        'action', 'valide',
        'workflow_complete', true,
        'message', 'Workflow terminé avec succès'
      );
    ELSE
      -- Passer à l'étape suivante
      UPDATE wf_instances
      SET current_step_order = current_step_order + 1, status = 'en_cours'
      WHERE id = v_instance.id;

      RETURN jsonb_build_object(
        'success', true,
        'action', 'valide',
        'workflow_complete', false,
        'new_step', v_instance.current_step_order + 1,
        'message', 'Étape validée, passage à l''étape suivante'
      );
    END IF;

  ELSIF p_action = 'rejete' THEN
    IF p_motif IS NULL OR TRIM(p_motif) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Le motif est obligatoire pour un rejet');
    END IF;

    UPDATE wf_instances
    SET status = 'rejete', completed_at = NOW()
    WHERE id = v_instance.id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'rejete',
      'motif', p_motif,
      'message', 'Workflow rejeté'
    );

  ELSIF p_action = 'differe' THEN
    IF p_motif IS NULL OR TRIM(p_motif) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Le motif est obligatoire pour un différé');
    END IF;

    UPDATE wf_instances
    SET status = 'differe'
    WHERE id = v_instance.id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'differe',
      'motif', p_motif,
      'condition_reprise', p_condition_reprise,
      'date_reprise', p_date_reprise,
      'message', 'Workflow mis en attente'
    );

  ELSIF p_action = 'annule' THEN
    UPDATE wf_instances
    SET status = 'annule', completed_at = NOW()
    WHERE id = v_instance.id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'annule',
      'motif', p_motif,
      'message', 'Workflow annulé'
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Action non traitée');
END;
$func$;

-- Fonction : Reprendre un workflow différé
CREATE OR REPLACE FUNCTION public.resume_workflow(p_entity_type TEXT, p_entity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_instance wf_instances;
  v_user_id UUID;
  v_user_name TEXT;
BEGIN
  v_user_id := auth.uid();
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;

  SELECT * INTO v_instance FROM wf_instances
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

  IF v_instance.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workflow non trouvé');
  END IF;

  IF v_instance.status != 'differe' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce workflow n''est pas en statut différé');
  END IF;

  -- Reprendre le workflow
  UPDATE wf_instances SET status = 'en_cours' WHERE id = v_instance.id;

  -- Enregistrer dans l'historique
  INSERT INTO wf_step_history (instance_id, step_order, step_label, action, user_id, user_name, motif)
  VALUES (v_instance.id, v_instance.current_step_order, 'Reprise', 'valide', v_user_id, v_user_name, 'Reprise du workflow différé');

  RETURN jsonb_build_object('success', true, 'message', 'Workflow repris');
END;
$func$;

-- Fonction : Obtenir les workflows en attente pour un utilisateur
CREATE OR REPLACE FUNCTION public.get_pending_workflows(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  workflow_name TEXT,
  current_step INTEGER,
  total_steps INTEGER,
  current_step_label TEXT,
  role_required TEXT,
  started_at TIMESTAMPTZ,
  days_pending INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    wi.entity_type,
    wi.entity_id,
    wd.nom AS workflow_name,
    wi.current_step_order AS current_step,
    (SELECT COUNT(*)::INTEGER FROM wf_steps WHERE workflow_id = wi.workflow_id) AS total_steps,
    ws.label AS current_step_label,
    ws.role_required,
    wi.started_at,
    EXTRACT(DAY FROM (NOW() - wi.started_at))::INTEGER AS days_pending
  FROM wf_instances wi
  JOIN wf_definitions wd ON wd.id = wi.workflow_id
  JOIN wf_steps ws ON ws.workflow_id = wi.workflow_id AND ws.step_order = wi.current_step_order
  WHERE wi.status = 'en_cours'
  ORDER BY wi.started_at DESC;
END;
$func$;

-- RLS Policies
ALTER TABLE public.wf_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_step_history ENABLE ROW LEVEL SECURITY;

-- Policies pour wf_definitions
DROP POLICY IF EXISTS "wf_definitions_read" ON public.wf_definitions;
CREATE POLICY "wf_definitions_read" ON public.wf_definitions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_definitions_admin" ON public.wf_definitions;
CREATE POLICY "wf_definitions_admin" ON public.wf_definitions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

-- Policies pour wf_steps
DROP POLICY IF EXISTS "wf_steps_read" ON public.wf_steps;
CREATE POLICY "wf_steps_read" ON public.wf_steps
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_steps_admin" ON public.wf_steps;
CREATE POLICY "wf_steps_admin" ON public.wf_steps
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.profil_fonctionnel = 'Admin'));

-- Policies pour wf_instances
DROP POLICY IF EXISTS "wf_instances_read" ON public.wf_instances;
CREATE POLICY "wf_instances_read" ON public.wf_instances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_instances_write" ON public.wf_instances;
CREATE POLICY "wf_instances_write" ON public.wf_instances
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Policies pour wf_step_history
DROP POLICY IF EXISTS "wf_history_read" ON public.wf_step_history;
CREATE POLICY "wf_history_read" ON public.wf_step_history
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_history_write" ON public.wf_step_history;
CREATE POLICY "wf_history_write" ON public.wf_step_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Grants pour les fonctions
GRANT EXECUTE ON FUNCTION public.start_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workflow_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_workflows TO authenticated;

-- Commentaires de documentation
COMMENT ON TABLE public.wf_definitions IS 'Définitions des workflows par type d''entité (notes_sef, engagements, liquidations, etc.)';
COMMENT ON TABLE public.wf_steps IS 'Étapes de chaque workflow avec rôles et délais requis';
COMMENT ON TABLE public.wf_instances IS 'Instance de workflow active pour chaque entité';
COMMENT ON TABLE public.wf_step_history IS 'Historique complet des actions sur chaque étape du workflow';

COMMENT ON FUNCTION public.start_workflow IS 'Démarre un nouveau workflow pour une entité donnée';
COMMENT ON FUNCTION public.get_workflow_status IS 'Retourne le statut complet du workflow avec étapes et historique';
COMMENT ON FUNCTION public.advance_workflow IS 'Valide, diffère ou rejette l''étape courante du workflow';
COMMENT ON FUNCTION public.resume_workflow IS 'Reprend un workflow qui était en statut différé';
COMMENT ON FUNCTION public.get_pending_workflows IS 'Liste tous les workflows en attente de traitement';
