-- =====================================================
-- Migration : Ajout filtrage direction au workflow
-- Date : 2026-02-07
-- But : Corriger le GAP critique de sécurité où un
--       DIRECTEUR peut valider des documents d'une
--       autre direction. Ajoute direction_id à wf_instances
--       et appelle check_data_permission dans advance_workflow.
-- =====================================================

-- 1. Ajouter direction_id à wf_instances pour tracker la direction de l'entité
ALTER TABLE public.wf_instances
ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES public.directions(id);

CREATE INDEX IF NOT EXISTS idx_wf_instances_direction ON public.wf_instances(direction_id);

-- 2. Mettre à jour start_workflow pour capturer direction_id depuis l'entité source
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
  v_direction_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Trouver le workflow actif
  SELECT id INTO v_workflow_id FROM wf_definitions
  WHERE entity_type = p_entity_type AND est_actif = true;

  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'Aucun workflow actif pour le type %', p_entity_type;
  END IF;

  -- Résoudre la direction_id de l'entité source
  -- Chaque type d'entité peut avoir direction_id directement ou via une relation
  IF p_entity_type = 'notes_sef' THEN
    SELECT direction_id INTO v_direction_id FROM notes_sef WHERE id = p_entity_id;
  ELSIF p_entity_type = 'budget_engagements' THEN
    SELECT bl.direction_id INTO v_direction_id
    FROM budget_engagements be
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE be.id = p_entity_id;
  ELSIF p_entity_type = 'budget_liquidations' THEN
    SELECT bl.direction_id INTO v_direction_id
    FROM budget_liquidations liq
    JOIN budget_engagements be ON be.id = liq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE liq.id = p_entity_id;
  ELSIF p_entity_type = 'ordonnancements' THEN
    SELECT bl.direction_id INTO v_direction_id
    FROM ordonnancements ord
    JOIN budget_liquidations liq ON liq.id = ord.liquidation_id
    JOIN budget_engagements be ON be.id = liq.engagement_id
    JOIN budget_lines bl ON bl.id = be.budget_line_id
    WHERE ord.id = p_entity_id;
  ELSIF p_entity_type = 'imputations' THEN
    SELECT direction_id INTO v_direction_id FROM imputations WHERE id = p_entity_id;
  END IF;
  -- Si la direction n'est pas trouvée, on laisse NULL (accès global autorisé)

  -- Créer ou réinitialiser l'instance
  INSERT INTO wf_instances (workflow_id, entity_type, entity_id, current_step_order, status, started_by, direction_id)
  VALUES (v_workflow_id, p_entity_type, p_entity_id, 1, 'en_cours', v_user_id, v_direction_id)
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    current_step_order = 1,
    status = 'en_cours',
    started_at = NOW(),
    completed_at = NULL,
    started_by = v_user_id,
    direction_id = v_direction_id
  RETURNING id INTO v_instance_id;

  -- Enregistrer le démarrage dans l'historique
  INSERT INTO wf_step_history (instance_id, step_order, step_label, action, user_id, user_name)
  SELECT v_instance_id, 0, 'Démarrage', 'valide', v_user_id, p.full_name
  FROM profiles p WHERE p.id = v_user_id;

  RETURN v_instance_id;
END;
$func$;

-- 3. Mettre à jour advance_workflow pour vérifier check_data_permission
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
  v_has_permission BOOLEAN;
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

  -- SECURITE: Vérifier que l'utilisateur a le droit d'agir sur cette direction
  -- Si l'instance a une direction_id, on vérifie via check_data_permission
  IF v_instance.direction_id IS NOT NULL THEN
    SELECT check_data_permission(v_user_id, p_entity_type, v_instance.direction_id, 'validate')
    INTO v_has_permission;

    IF NOT v_has_permission THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Vous n''avez pas les droits pour agir sur les documents de cette direction'
      );
    END IF;
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

-- 4. Mettre à jour get_workflow_status pour inclure direction_id dans la réponse
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
    'direction_id', v_instance.direction_id,
    'started_at', v_instance.started_at,
    'completed_at', v_instance.completed_at,
    'steps', COALESCE(v_all_steps, '[]'::jsonb),
    'history', COALESCE(v_history, '[]'::jsonb)
  );
END;
$func$;

-- 5. Backfill direction_id pour les wf_instances existantes
-- Notes SEF
UPDATE wf_instances wi
SET direction_id = ns.direction_id
FROM notes_sef ns
WHERE wi.entity_type = 'notes_sef'
  AND wi.entity_id = ns.id
  AND wi.direction_id IS NULL;

-- Engagements (via budget_lines)
UPDATE wf_instances wi
SET direction_id = bl.direction_id
FROM budget_engagements be
JOIN budget_lines bl ON bl.id = be.budget_line_id
WHERE wi.entity_type = 'budget_engagements'
  AND wi.entity_id = be.id
  AND wi.direction_id IS NULL;

-- Liquidations (via engagement -> budget_lines)
UPDATE wf_instances wi
SET direction_id = bl.direction_id
FROM budget_liquidations liq
JOIN budget_engagements be ON be.id = liq.engagement_id
JOIN budget_lines bl ON bl.id = be.budget_line_id
WHERE wi.entity_type = 'budget_liquidations'
  AND wi.entity_id = liq.id
  AND wi.direction_id IS NULL;

-- Ordonnancements (via liquidation -> engagement -> budget_lines)
UPDATE wf_instances wi
SET direction_id = bl.direction_id
FROM ordonnancements ord
JOIN budget_liquidations liq ON liq.id = ord.liquidation_id
JOIN budget_engagements be ON be.id = liq.engagement_id
JOIN budget_lines bl ON bl.id = be.budget_line_id
WHERE wi.entity_type = 'ordonnancements'
  AND wi.entity_id = ord.id
  AND wi.direction_id IS NULL;

-- 5. Commentaires
COMMENT ON COLUMN public.wf_instances.direction_id IS 'Direction de l''entité source, utilisée pour le contrôle d''accès par périmètre';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
