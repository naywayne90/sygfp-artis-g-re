-- ============================================================================
-- Prompt 6 Backend : AEF Workflow Enforcement (defense-in-depth)
-- Date: 2026-02-14
-- Description:
--   Ajoute une couche serveur pour enforcer la matrice de transitions AEF,
--   valider les champs requis, vérifier le budget, auditer les changements,
--   et améliorer les notifications.
-- ============================================================================

-- ============================================================================
-- PART 1 : Ajouter colonne validation_comment
-- ============================================================================

ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS validation_comment TEXT;

COMMENT ON COLUMN notes_dg.validation_comment IS 'Commentaire optionnel du DG lors de la validation';


-- ============================================================================
-- PART 2 : Supprimer 3 triggers conflictuels (fonctions conservées)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_prevent_final_note_modification ON notes_dg;
DROP TRIGGER IF EXISTS trg_check_validation_motif_dg ON notes_dg;
DROP TRIGGER IF EXISTS trg_check_aef_budget_on_submit ON notes_dg;


-- ============================================================================
-- PART 3 : Fonction enforce_aef_workflow() (BEFORE UPDATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_aef_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID;
  v_roles        TEXT[];
  v_is_creator   BOOLEAN := FALSE;
  v_old_statut   TEXT;
  v_new_statut   TEXT;
  v_transition_ok BOOLEAN := FALSE;
  v_role_ok      BOOLEAN := FALSE;
  v_budget_result RECORD;
BEGIN
  -- ----------------------------------------------------------------
  -- 0. Resolve caller
  -- ----------------------------------------------------------------
  v_uid := auth.uid();

  -- Service role (migrations, edge functions) bypass role checks
  IF v_uid IS NOT NULL THEN
    -- Collect all active roles for current user
    SELECT ARRAY_AGG(ur.role::TEXT)
    INTO v_roles
    FROM user_roles ur
    WHERE ur.user_id = v_uid
      AND ur.is_active = true;

    v_roles := COALESCE(v_roles, ARRAY[]::TEXT[]);
    v_is_creator := (OLD.created_by = v_uid);
  END IF;

  -- ----------------------------------------------------------------
  -- 1. Normalize backward-compat: 'valide' → 'a_imputer'
  -- ----------------------------------------------------------------
  v_old_statut := OLD.statut;
  v_new_statut := NEW.statut;

  IF v_new_statut = 'valide' THEN
    v_new_statut := 'a_imputer';
    NEW.statut := 'a_imputer';
  END IF;

  -- ----------------------------------------------------------------
  -- 2. Validate transition (matrice)
  -- ----------------------------------------------------------------
  CASE v_old_statut
    WHEN 'brouillon' THEN
      v_transition_ok := v_new_statut IN ('soumis');

    WHEN 'soumis' THEN
      v_transition_ok := v_new_statut IN ('a_imputer', 'a_valider', 'rejete', 'differe');

    WHEN 'a_valider' THEN
      v_transition_ok := v_new_statut IN ('a_imputer', 'rejete', 'differe');

    WHEN 'a_imputer' THEN
      v_transition_ok := v_new_statut IN ('impute');

    WHEN 'valide' THEN
      -- backward compat: valide → impute
      v_transition_ok := v_new_statut IN ('impute', 'a_imputer');

    WHEN 'differe' THEN
      v_transition_ok := v_new_statut IN ('soumis', 'a_valider');

    ELSE
      -- impute, rejete = final states → no transition allowed
      v_transition_ok := FALSE;
  END CASE;

  IF NOT v_transition_ok THEN
    RAISE EXCEPTION 'Transition AEF invalide: % → %', v_old_statut, v_new_statut;
  END IF;

  -- ----------------------------------------------------------------
  -- 3. Role-based authorization (skip for service role)
  -- ----------------------------------------------------------------
  IF v_uid IS NOT NULL THEN
    CASE
      -- brouillon → soumis : creator or ADMIN
      WHEN v_old_statut = 'brouillon' AND v_new_statut = 'soumis' THEN
        v_role_ok := v_is_creator OR 'ADMIN' = ANY(v_roles);

      -- soumis/a_valider → a_imputer/a_valider/rejete/differe : DG/DAAF/ADMIN
      WHEN v_old_statut IN ('soumis', 'a_valider')
           AND v_new_statut IN ('a_imputer', 'a_valider', 'rejete', 'differe') THEN
        v_role_ok := v_roles && ARRAY['DG', 'DAAF', 'ADMIN'];

      -- a_imputer/valide → impute : DAAF/CB/ADMIN
      WHEN v_new_statut = 'impute' THEN
        v_role_ok := v_roles && ARRAY['DAAF', 'CB', 'ADMIN'];

      -- differe → soumis/a_valider : creator or DG/DAAF/ADMIN
      WHEN v_old_statut = 'differe' AND v_new_statut IN ('soumis', 'a_valider') THEN
        v_role_ok := v_is_creator OR v_roles && ARRAY['DG', 'DAAF', 'ADMIN'];

      ELSE
        v_role_ok := FALSE;
    END CASE;

    IF NOT v_role_ok THEN
      RAISE EXCEPTION 'Droits insuffisants pour la transition AEF % → % (roles: %)',
        v_old_statut, v_new_statut, COALESCE(array_to_string(v_roles, ','), 'aucun');
    END IF;
  END IF;

  -- ----------------------------------------------------------------
  -- 4. Field validation per target status
  -- ----------------------------------------------------------------

  -- soumis: montant_estime > 0 obligatoire
  IF v_new_statut = 'soumis' THEN
    IF COALESCE(NEW.montant_estime, 0) <= 0 THEN
      RAISE EXCEPTION 'Le montant estimé doit être supérieur à 0 pour soumettre une Note AEF';
    END IF;
  END IF;

  -- rejete: rejection_reason obligatoire
  IF v_new_statut = 'rejete' THEN
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Le motif de rejet est obligatoire pour rejeter une Note AEF';
    END IF;
  END IF;

  -- differe: motif_differe obligatoire
  IF v_new_statut = 'differe' THEN
    IF NEW.motif_differe IS NULL OR TRIM(NEW.motif_differe) = '' THEN
      RAISE EXCEPTION 'Le motif de report est obligatoire pour différer une Note AEF';
    END IF;
  END IF;

  -- a_imputer: budget check via check_budget_availability()
  IF v_new_statut = 'a_imputer' AND NEW.budget_line_id IS NOT NULL THEN
    SELECT * INTO v_budget_result
    FROM check_budget_availability(NEW.budget_line_id, COALESCE(NEW.montant_estime, 0));

    IF v_budget_result IS NOT NULL AND NOT v_budget_result.is_available THEN
      -- Flag but don't block (depassement_budget)
      NEW.depassement_budget := TRUE;
      NEW.montant_depassement := COALESCE(NEW.montant_estime, 0) - v_budget_result.disponible;
      NEW.budget_disponible_soumission := v_budget_result.disponible;
    ELSE
      NEW.depassement_budget := FALSE;
      NEW.montant_depassement := NULL;
    END IF;
  END IF;

  -- impute: budget check (blocking)
  IF v_new_statut = 'impute' AND NEW.budget_line_id IS NOT NULL THEN
    SELECT * INTO v_budget_result
    FROM check_budget_availability(NEW.budget_line_id, COALESCE(NEW.montant_estime, 0));

    IF v_budget_result IS NOT NULL AND NOT v_budget_result.is_available THEN
      RAISE EXCEPTION 'Budget insuffisant pour imputer: % (disponible: %, requis: %)',
        v_budget_result.message,
        v_budget_result.disponible,
        COALESCE(NEW.montant_estime, 0);
    END IF;
  END IF;

  -- ----------------------------------------------------------------
  -- 5. Auto-fill audit fields
  -- ----------------------------------------------------------------

  -- submitted_by / submitted_at
  IF v_new_statut = 'soumis' THEN
    NEW.submitted_by := COALESCE(NEW.submitted_by, v_uid);
    NEW.submitted_at := COALESCE(NEW.submitted_at, NOW());
  END IF;

  -- validated_by / validated_at
  IF v_new_statut = 'a_imputer' AND v_old_statut IN ('soumis', 'a_valider') THEN
    NEW.validated_by := COALESCE(NEW.validated_by, v_uid);
    NEW.validated_at := COALESCE(NEW.validated_at, NOW());
  END IF;

  -- rejected_by / rejected_at
  IF v_new_statut = 'rejete' THEN
    NEW.rejected_by := COALESCE(NEW.rejected_by, v_uid);
    NEW.rejected_at := COALESCE(NEW.rejected_at, NOW());
  END IF;

  -- differe_by / date_differe
  IF v_new_statut = 'differe' THEN
    NEW.differe_by := COALESCE(NEW.differe_by, v_uid);
    NEW.date_differe := COALESCE(NEW.date_differe, NOW());
  END IF;

  -- imputed_by / imputed_at
  IF v_new_statut = 'impute' THEN
    NEW.imputed_by := COALESCE(NEW.imputed_by, v_uid);
    NEW.imputed_at := COALESCE(NEW.imputed_at, NOW());
  END IF;

  -- Clear differe fields on resume
  IF v_old_statut = 'differe' AND v_new_statut IN ('soumis', 'a_valider') THEN
    NEW.motif_differe := NULL;
    NEW.date_differe := NULL;
    NEW.deadline_correction := NULL;
    NEW.differe_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_aef_workflow() IS
  'Enforce AEF workflow transitions, role checks, field validation, and budget checks (defense-in-depth)';


-- ============================================================================
-- PART 4 : Trigger BEFORE UPDATE
-- ============================================================================

DROP TRIGGER IF EXISTS trg_enforce_aef_workflow ON notes_dg;

CREATE TRIGGER trg_enforce_aef_workflow
  BEFORE UPDATE ON notes_dg
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION enforce_aef_workflow();


-- ============================================================================
-- PART 5 : Trigger log_aef_workflow_to_audit_logs() (AFTER UPDATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_aef_workflow_to_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  -- Determine action label based on new status
  CASE NEW.statut
    WHEN 'soumis'    THEN v_action := 'AEF_SUBMIT';
    WHEN 'a_valider' THEN v_action := 'AEF_VALIDATE';
    WHEN 'a_imputer' THEN v_action := 'AEF_VALIDATE';
    WHEN 'rejete'    THEN v_action := 'AEF_REJECT';
    WHEN 'differe'   THEN v_action := 'AEF_DEFER';
    WHEN 'impute'    THEN v_action := 'AEF_IMPUTE';
    ELSE                   v_action := 'AEF_STATUS_CHANGE';
  END CASE;

  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    user_id,
    exercice
  ) VALUES (
    'note_aef',
    NEW.id::TEXT,
    v_action,
    jsonb_build_object(
      'statut', OLD.statut,
      'validated_by', OLD.validated_by,
      'rejected_by', OLD.rejected_by,
      'imputed_by', OLD.imputed_by,
      'differe_by', OLD.differe_by
    ),
    jsonb_build_object(
      'statut', NEW.statut,
      'validated_by', NEW.validated_by,
      'validated_at', NEW.validated_at,
      'rejected_by', NEW.rejected_by,
      'rejected_at', NEW.rejected_at,
      'rejection_reason', NEW.rejection_reason,
      'imputed_by', NEW.imputed_by,
      'imputed_at', NEW.imputed_at,
      'differe_by', NEW.differe_by,
      'motif_differe', NEW.motif_differe,
      'validation_comment', NEW.validation_comment,
      'budget_line_id', NEW.budget_line_id,
      'depassement_budget', NEW.depassement_budget
    ),
    auth.uid(),
    NEW.exercice
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_aef_workflow_to_audit_logs() IS
  'Logs every AEF status change into audit_logs for traceability';

DROP TRIGGER IF EXISTS trg_log_aef_workflow_audit ON notes_dg;

CREATE TRIGGER trg_log_aef_workflow_audit
  AFTER UPDATE ON notes_dg
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_aef_workflow_to_audit_logs();


-- ============================================================================
-- PART 6 : Notifications améliorées (CREATE OR REPLACE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_notes_aef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_titre    TEXT;
  v_message  TEXT;
  v_type     TEXT;
  v_numero   TEXT;
  v_rec      RECORD;
BEGIN
  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  v_numero := COALESCE(NEW.numero, 'N/A');

  CASE NEW.statut
    -- ---------------------------------------------------------------
    -- SOUMIS : notifier créateur + DG + DAAF
    -- ---------------------------------------------------------------
    WHEN 'soumis' THEN
      v_titre   := 'Note AEF soumise';
      v_type    := 'aef_soumise';

      -- Notify creator
      v_message := 'Votre note AEF ' || v_numero || ' a été soumise pour validation.';
      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'old_statut', OLD.statut, 'new_statut', NEW.statut)
      );

      -- Notify DG (direct + delegations + interims)
      v_message := 'La note AEF ' || v_numero || ' (' || COALESCE(NEW.objet, '') || ') est soumise et attend votre décision.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DG', 'notes')
      LOOP
        IF v_rec.user_id IS DISTINCT FROM NEW.created_by THEN
          PERFORM create_notification(
            v_rec.user_id, v_type, v_titre, v_message,
            'notes_dg', NEW.id,
            jsonb_build_object('category', 'workflow', 'action_required', true)
          );
        END IF;
      END LOOP;

      -- Notify DAAF
      v_message := 'La note AEF ' || v_numero || ' a été soumise pour validation.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DAAF', 'notes')
      LOOP
        IF v_rec.user_id IS DISTINCT FROM NEW.created_by THEN
          PERFORM create_notification(
            v_rec.user_id, v_type, v_titre, v_message,
            'notes_dg', NEW.id,
            jsonb_build_object('category', 'workflow')
          );
        END IF;
      END LOOP;

    -- ---------------------------------------------------------------
    -- A_IMPUTER : notifier créateur + DAAF (pour imputation)
    -- ---------------------------------------------------------------
    WHEN 'a_imputer' THEN
      v_titre := 'Note AEF validée - En attente d''imputation';
      v_type  := 'aef_a_imputer';

      -- Notify creator
      v_message := 'Votre note AEF ' || v_numero || ' a été validée et est en attente d''imputation budgétaire.';
      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'old_statut', OLD.statut, 'new_statut', NEW.statut)
      );

      -- Notify DAAF for imputation action
      v_message := 'La note AEF ' || v_numero || ' est validée et attend votre imputation budgétaire.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DAAF', 'notes')
      LOOP
        IF v_rec.user_id IS DISTINCT FROM NEW.created_by THEN
          PERFORM create_notification(
            v_rec.user_id, v_type, v_titre, v_message,
            'notes_dg', NEW.id,
            jsonb_build_object('category', 'workflow', 'action_required', true)
          );
        END IF;
      END LOOP;

    -- ---------------------------------------------------------------
    -- REJETE : notifier créateur avec motif
    -- ---------------------------------------------------------------
    WHEN 'rejete' THEN
      v_titre   := 'Note AEF rejetée';
      v_type    := 'aef_rejetee';
      v_message := 'Votre note AEF ' || v_numero || ' a été rejetée. Motif : '
                   || COALESCE(NEW.rejection_reason, 'Non spécifié');

      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'rejection_reason', NEW.rejection_reason)
      );

    -- ---------------------------------------------------------------
    -- DIFFERE : notifier créateur avec motif
    -- ---------------------------------------------------------------
    WHEN 'differe' THEN
      v_titre   := 'Note AEF différée';
      v_type    := 'aef_differee';
      v_message := 'Votre note AEF ' || v_numero || ' a été différée. Motif : '
                   || COALESCE(NEW.motif_differe, 'Non spécifié');

      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'motif_differe', NEW.motif_differe,
                           'deadline_correction', NEW.deadline_correction)
      );

    -- ---------------------------------------------------------------
    -- IMPUTE : notifier créateur
    -- ---------------------------------------------------------------
    WHEN 'impute' THEN
      v_titre   := 'Note AEF imputée';
      v_type    := 'aef_imputee';
      v_message := 'Votre note AEF ' || v_numero || ' a été imputée sur une ligne budgétaire.';

      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'budget_line_id', NEW.budget_line_id)
      );

    -- ---------------------------------------------------------------
    -- Default : notifier créateur
    -- ---------------------------------------------------------------
    ELSE
      v_titre   := 'Changement de statut AEF';
      v_type    := 'aef_statut_change';
      v_message := 'Votre note AEF ' || v_numero || ' est passée au statut : ' || NEW.statut;

      PERFORM create_notification(
        NEW.created_by, v_type, v_titre, v_message,
        'notes_dg', NEW.id,
        jsonb_build_object('category', 'workflow', 'old_statut', OLD.statut, 'new_statut', NEW.statut)
      );
  END CASE;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_on_notes_aef_status_change() IS
  'Notifie les acteurs concernés lors de chaque changement de statut AEF (créateur, DG, DAAF)';


-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.enforce_aef_workflow() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_aef_workflow_to_audit_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_notes_aef_status_change() TO authenticated;


-- ============================================================================
-- Summary of triggers on notes_dg after this migration:
--
-- BEFORE INSERT:
--   trg_notes_dg_arti_reference     → generate ARTI reference
--   trg_validate_note_aef_origin    → validate origin (FROM_SEF/DIRECT)
--
-- BEFORE UPDATE:
--   trg_enforce_aef_workflow         → NEW: full workflow enforcement
--   trg_validate_note_aef_origin    → validate origin
--
-- AFTER UPDATE:
--   trg_log_validation_notes_dg      → log to validation_history
--   trg_log_note_aef_status_change   → log to notes_aef_history
--   trg_log_aef_workflow_audit       → NEW: log to audit_logs
--   trigger_notify_notes_aef_status  → notifications (function upgraded)
--
-- REMOVED:
--   trigger_prevent_final_note_modification  → replaced by enforce_aef_workflow
--   trg_check_validation_motif_dg           → replaced by enforce_aef_workflow
--   trg_check_aef_budget_on_submit          → replaced by enforce_aef_workflow
-- ============================================================================
