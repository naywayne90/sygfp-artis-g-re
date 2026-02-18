-- ============================================================
-- Prompt 9 — Passation de marché: workflow 7 étapes
-- Date: 2026-02-19
-- Table: passation_marche (0 lignes en prod)
-- Workflow: brouillon → publié → clôturé → en_évaluation → attribué → approuvé → signé
-- ============================================================

-- ============================================================
-- 1. NOUVELLES COLONNES
-- ============================================================
-- Dates planifiées
ALTER TABLE passation_marche
  ADD COLUMN IF NOT EXISTS date_publication DATE,
  ADD COLUMN IF NOT EXISTS date_cloture DATE;

-- Timestamps + acteurs par étape
ALTER TABLE passation_marche
  ADD COLUMN IF NOT EXISTS publie_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publie_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS cloture_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cloture_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS evaluation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evaluation_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS attribue_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribue_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approuve_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approuve_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS signe_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signe_by UUID REFERENCES auth.users(id);

-- ============================================================
-- 2. CHECK CONSTRAINT (inclut legacy)
-- ============================================================
ALTER TABLE passation_marche DROP CONSTRAINT IF EXISTS passation_marche_statut_check;
ALTER TABLE passation_marche ADD CONSTRAINT passation_marche_statut_check
  CHECK (statut IN (
    'brouillon','publie','cloture','en_evaluation','attribue','approuve','signe',
    'soumis','en_analyse','valide','rejete','differe'
  ));

-- ============================================================
-- 3. RPC check_passation_transition(p_id, p_new_statut) → JSONB {ok, errors[]}
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_passation_transition(
  p_id UUID,
  p_new_statut TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_pm RECORD;
  v_errors TEXT[] := '{}';
  v_count INTEGER;
  v_valid_from TEXT;
BEGIN
  -- Charger la passation
  SELECT * INTO v_pm FROM passation_marche WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'errors', ARRAY['Passation introuvable']);
  END IF;

  -- Vérifier le statut source attendu
  CASE p_new_statut
    WHEN 'publie' THEN v_valid_from := 'brouillon';
    WHEN 'cloture' THEN v_valid_from := 'publie';
    WHEN 'en_evaluation' THEN v_valid_from := 'cloture';
    WHEN 'attribue' THEN v_valid_from := 'en_evaluation';
    WHEN 'approuve' THEN v_valid_from := 'attribue';
    WHEN 'signe' THEN v_valid_from := 'approuve';
    ELSE
      RETURN jsonb_build_object('ok', false, 'errors', ARRAY['Statut cible inconnu: ' || p_new_statut]);
  END CASE;

  IF v_pm.statut <> v_valid_from THEN
    v_errors := array_append(v_errors,
      'Transition invalide: le statut actuel est "' || v_pm.statut || '", attendu "' || v_valid_from || '"');
    RETURN jsonb_build_object('ok', false, 'errors', to_jsonb(v_errors));
  END IF;

  -- Prérequis par transition
  CASE p_new_statut
    -- brouillon → publié
    WHEN 'publie' THEN
      IF v_pm.expression_besoin_id IS NULL THEN
        v_errors := array_append(v_errors, 'Expression de besoin liée obligatoire');
      END IF;
      IF v_pm.mode_passation IS NULL OR v_pm.mode_passation = '' THEN
        v_errors := array_append(v_errors, 'Mode de passation obligatoire');
      END IF;
      IF v_pm.date_publication IS NULL THEN
        v_errors := array_append(v_errors, 'Date de publication obligatoire');
      END IF;
      IF v_pm.date_cloture IS NULL THEN
        v_errors := array_append(v_errors, 'Date de clôture obligatoire');
      END IF;
      IF v_pm.date_publication IS NOT NULL AND v_pm.date_cloture IS NOT NULL
         AND v_pm.date_cloture <= v_pm.date_publication THEN
        v_errors := array_append(v_errors, 'La date de clôture doit être postérieure à la date de publication');
      END IF;
      -- Si alloti, au moins 1 lot
      IF v_pm.allotissement = true THEN
        SELECT COUNT(*) INTO v_count FROM lots_marche WHERE passation_marche_id = p_id;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Au moins 1 lot requis pour un marché alloti');
        END IF;
      END IF;

    -- publié → clôturé
    WHEN 'cloture' THEN
      -- Clôture manuelle autorisée, pas de prérequis supplémentaire
      NULL;

    -- clôturé → en_évaluation
    WHEN 'en_evaluation' THEN
      SELECT COUNT(*) INTO v_count FROM soumissionnaires_lot WHERE passation_marche_id = p_id;
      IF v_count = 0 THEN
        v_errors := array_append(v_errors, 'Au moins 1 soumissionnaire requis');
      END IF;

    -- en_évaluation → attribué
    WHEN 'attribue' THEN
      -- Tous doivent avoir une note_finale (évalués)
      SELECT COUNT(*) INTO v_count
      FROM soumissionnaires_lot
      WHERE passation_marche_id = p_id
        AND note_finale IS NULL
        AND statut <> 'elimine';
      IF v_count > 0 THEN
        v_errors := array_append(v_errors, v_count || ' soumissionnaire(s) non évalué(s)');
      END IF;
      -- Au moins 1 qualifié
      SELECT COUNT(*) INTO v_count
      FROM soumissionnaires_lot
      WHERE passation_marche_id = p_id
        AND qualifie_technique = true;
      IF v_count = 0 THEN
        v_errors := array_append(v_errors, 'Aucun soumissionnaire qualifié');
      END IF;

    -- attribué → approuvé
    WHEN 'approuve' THEN
      -- Pas de prérequis technique (vérifié côté client: rôle DG)
      NULL;

    -- approuvé → signé
    WHEN 'signe' THEN
      IF v_pm.contrat_url IS NULL OR v_pm.contrat_url = '' THEN
        v_errors := array_append(v_errors, 'URL du contrat signé obligatoire');
      END IF;
  END CASE;

  -- Résultat
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'errors', to_jsonb(v_errors));
  END IF;

  RETURN jsonb_build_object('ok', true, 'errors', '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. TRIGGER: notify_passation_status_change
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_passation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne déclencher que sur changement de statut
  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, exercice)
  VALUES (
    auth.uid(),
    'TRANSITION_PASSATION_' || UPPER(NEW.statut),
    'passation_marche',
    NEW.id,
    jsonb_build_object('statut', OLD.statut),
    jsonb_build_object('statut', NEW.statut),
    NEW.exercice
  );

  -- Notification au créateur
  IF NEW.created_by IS NOT NULL THEN
    PERFORM create_notification(
      NEW.created_by,
      'Passation ' || COALESCE(NEW.reference, '') || ' → ' || NEW.statut,
      'La passation "' || COALESCE(NEW.reference, '') || '" est passée au statut: ' || NEW.statut,
      'info'
    );
  END IF;

  -- Notification DG pour approbation
  IF NEW.statut = 'attribue' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p.id,
      'Approbation requise: ' || COALESCE(NEW.reference, ''),
      'Le marché "' || COALESCE(NEW.reference, '') || '" est attribué et attend votre approbation.',
      'warning', 'passation', 'passation_marche', NEW.id
    FROM profiles p
    JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role IN ('DG', 'ADMIN');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_passation_status_change ON passation_marche;
CREATE TRIGGER trg_passation_status_change
  AFTER UPDATE OF statut ON passation_marche
  FOR EACH ROW
  EXECUTE FUNCTION notify_passation_status_change();

-- ============================================================
-- 5. TRIGGER: lock_passation_fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_passation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Si transition de statut, toujours autoriser
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  -- Après publication: verrouiller mode_passation, type_procedure, expression_besoin_id, date_publication
  IF OLD.statut IN ('publie','cloture','en_evaluation','attribue','approuve','signe') THEN
    IF OLD.mode_passation IS DISTINCT FROM NEW.mode_passation THEN
      RAISE EXCEPTION 'Mode de passation verrouillé après publication';
    END IF;
    IF OLD.type_procedure IS DISTINCT FROM NEW.type_procedure THEN
      RAISE EXCEPTION 'Type de procédure verrouillé après publication';
    END IF;
    IF OLD.expression_besoin_id IS DISTINCT FROM NEW.expression_besoin_id THEN
      RAISE EXCEPTION 'Expression de besoin verrouillée après publication';
    END IF;
    IF OLD.date_publication IS DISTINCT FROM NEW.date_publication THEN
      RAISE EXCEPTION 'Date de publication verrouillée après publication';
    END IF;
  END IF;

  -- Statut signé: bloquer toute modification
  IF OLD.statut = 'signe' THEN
    RAISE EXCEPTION 'Passation signée: aucune modification autorisée';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_lock_passation_fields ON passation_marche;
CREATE TRIGGER trg_lock_passation_fields
  BEFORE UPDATE ON passation_marche
  FOR EACH ROW
  EXECUTE FUNCTION lock_passation_fields();
