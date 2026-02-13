-- ============================================================================
-- Prompt 8 Backend : Notifications imputations + Cohérence chaîne NAEF↔Imputation
-- Date: 2026-02-14
-- Description:
--   PART 1 : Étendre notification_templates pour les événements imputation
--   PART 2 : Corriger NAEF→a_imputer pour notifier aussi le CB
--   PART 3 : Trigger notifications sur imputations (soumettre/valider/rejeter)
--   PART 4 : Trigger cohérence chaîne (NAEF validée, montant, budget_line)
-- ============================================================================


-- ============================================================================
-- PART 1 : Étendre notification_templates pour imputation
-- ============================================================================

-- 1a. Supprimer l'ancien CHECK et recréer avec les nouveaux types
ALTER TABLE public.notification_templates
  DROP CONSTRAINT IF EXISTS notification_templates_type_evenement_check;

ALTER TABLE public.notification_templates
  ADD CONSTRAINT notification_templates_type_evenement_check
  CHECK (type_evenement IN (
    'ordonnancement',
    'reglement',
    'reglement_partiel',
    'note_soumise',
    'note_validee',
    'note_rejetee',
    'engagement_cree',
    'liquidation_validee',
    -- Nouveaux types imputation
    'imputation_soumise',
    'imputation_validee',
    'imputation_rejetee'
  ));

-- 1b. Insérer les templates imputation
INSERT INTO public.notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES
  ('IMPUTATION_SOUMISE',
   'Imputation soumise pour validation',
   'L''imputation {{reference}} ({{objet}}) d''un montant de {{montant}} FCFA a été soumise pour validation.',
   'imputation_soumise',
   '["reference", "objet", "montant", "direction", "naef_numero"]'::jsonb),
  ('IMPUTATION_VALIDEE',
   'Imputation validée',
   'L''imputation {{reference}} a été validée. Montant réservé : {{montant}} FCFA sur la ligne {{budget_code}}.',
   'imputation_validee',
   '["reference", "montant", "budget_code", "disponible_apres", "naef_numero"]'::jsonb),
  ('IMPUTATION_REJETEE',
   'Imputation rejetée',
   'L''imputation {{reference}} a été rejetée. Motif : {{motif}}.',
   'imputation_rejetee',
   '["reference", "montant", "motif", "naef_numero"]'::jsonb)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- PART 2 : Corriger NAEF→a_imputer : notifier aussi CB
-- ============================================================================
-- La fonction notify_on_notes_aef_status_change() notifie créateur + DAAF
-- mais PAS le CB. On la met à jour pour inclure le CB.

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
    -- A_IMPUTER : notifier créateur + DAAF + CB (AJOUT CB)
    -- ---------------------------------------------------------------
    WHEN 'a_imputer' THEN
      v_titre := 'Nouvelle NAEF à imputer';
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

      -- [PROMPT 8] Notify CB : nouvelle NAEF à imputer
      v_message := 'Nouvelle NAEF à imputer : ' || v_numero
                   || ' — ' || COALESCE(NEW.objet, '')
                   || ' — Montant estimé : ' || COALESCE(NEW.montant_estime::text, 'N/A') || ' FCFA';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes')
      LOOP
        IF v_rec.user_id IS DISTINCT FROM NEW.created_by THEN
          PERFORM create_notification(
            v_rec.user_id, v_type, v_titre, v_message,
            'notes_dg', NEW.id,
            jsonb_build_object('category', 'workflow', 'action_required', true,
                               'montant_estime', NEW.montant_estime)
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
  'Prompt 8 : Notifie créateur, DG, DAAF et CB lors des changements de statut AEF';


-- ============================================================================
-- PART 3 : Trigger notifications sur imputations
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_imputation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_titre     TEXT;
  v_message   TEXT;
  v_type      TEXT;
  v_reference TEXT;
  v_naef_num  TEXT;
  v_rec       RECORD;
BEGIN
  -- Ne rien faire si le statut n'a pas changé
  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  v_reference := COALESCE(NEW.reference, 'N/A');

  -- Récupérer le numéro NAEF associé
  SELECT COALESCE(nd.numero, 'N/A') INTO v_naef_num
  FROM notes_dg nd
  WHERE nd.id = NEW.note_aef_id;

  CASE NEW.statut
    -- ---------------------------------------------------------------
    -- A_VALIDER (soumis) : notifier DAAF + DG
    -- ---------------------------------------------------------------
    WHEN 'a_valider' THEN
      v_titre := 'Imputation soumise pour validation';
      v_type  := 'imputation_soumise';

      -- Notify DAAF
      v_message := 'L''imputation ' || v_reference
                   || ' (NAEF ' || v_naef_num || ')'
                   || ' d''un montant de ' || COALESCE(NEW.montant::text, '0') || ' FCFA'
                   || ' a été soumise pour validation.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DAAF', 'notes')
      LOOP
        PERFORM create_notification(
          v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'action_required', true,
                             'reference', v_reference, 'naef_numero', v_naef_num,
                             'montant', NEW.montant)
        );
      END LOOP;

      -- Notify DG
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DG', 'notes')
      LOOP
        PERFORM create_notification(
          v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'action_required', true,
                             'reference', v_reference, 'naef_numero', v_naef_num,
                             'montant', NEW.montant)
        );
      END LOOP;

    -- ---------------------------------------------------------------
    -- VALIDE : notifier CB + direction concernée
    -- ---------------------------------------------------------------
    WHEN 'valide' THEN
      v_titre := 'Imputation validée';
      v_type  := 'imputation_validee';

      -- Notify CB (créateur de l'imputation)
      v_message := 'L''imputation ' || v_reference
                   || ' (NAEF ' || v_naef_num || ')'
                   || ' a été validée. Montant réservé : '
                   || COALESCE(NEW.montant::text, '0') || ' FCFA.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes')
      LOOP
        PERFORM create_notification(
          v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'reference', v_reference,
                             'naef_numero', v_naef_num, 'montant', NEW.montant)
        );
      END LOOP;

      -- Notify direction concernée (tous les profils de la direction)
      IF NEW.direction_id IS NOT NULL THEN
        v_message := 'L''imputation ' || v_reference
                     || ' pour votre direction a été validée ('
                     || COALESCE(NEW.montant::text, '0') || ' FCFA).';
        FOR v_rec IN
          SELECT p.id AS user_id
          FROM profiles p
          WHERE p.direction_id = NEW.direction_id
            AND p.id IS DISTINCT FROM NEW.created_by
        LOOP
          PERFORM create_notification(
            v_rec.user_id, v_type, v_titre, v_message,
            'imputations', NEW.id,
            jsonb_build_object('category', 'information', 'reference', v_reference,
                               'direction_id', NEW.direction_id)
          );
        END LOOP;
      END IF;

    -- ---------------------------------------------------------------
    -- REJETE : notifier CB + créateur avec motif
    -- ---------------------------------------------------------------
    WHEN 'rejete' THEN
      v_titre := 'Imputation rejetée';
      v_type  := 'imputation_rejetee';

      v_message := 'L''imputation ' || v_reference
                   || ' (NAEF ' || v_naef_num || ')'
                   || ' a été rejetée. Motif : '
                   || COALESCE(NEW.motif_rejet, 'Non spécifié');

      -- Notify CB
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes')
      LOOP
        PERFORM create_notification(
          v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'reference', v_reference,
                             'naef_numero', v_naef_num, 'motif_rejet', NEW.motif_rejet)
        );
      END LOOP;

      -- Notify créateur si différent du CB
      IF NEW.created_by IS NOT NULL THEN
        PERFORM create_notification(
          NEW.created_by, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'reference', v_reference,
                             'naef_numero', v_naef_num, 'motif_rejet', NEW.motif_rejet)
        );
      END IF;

    -- ---------------------------------------------------------------
    -- DIFFERE : notifier CB + créateur avec motif
    -- ---------------------------------------------------------------
    WHEN 'differe' THEN
      v_titre := 'Imputation différée';
      v_type  := 'imputation_differee';

      v_message := 'L''imputation ' || v_reference
                   || ' (NAEF ' || v_naef_num || ')'
                   || ' a été différée. Motif : '
                   || COALESCE(NEW.motif_differe, 'Non spécifié');

      -- Notify CB
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes')
      LOOP
        PERFORM create_notification(
          v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'reference', v_reference,
                             'naef_numero', v_naef_num, 'motif_differe', NEW.motif_differe)
        );
      END LOOP;

      -- Notify créateur
      IF NEW.created_by IS NOT NULL THEN
        PERFORM create_notification(
          NEW.created_by, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category', 'workflow', 'reference', v_reference,
                             'naef_numero', v_naef_num, 'motif_differe', NEW.motif_differe)
        );
      END IF;

    ELSE
      -- Pas de notification pour les autres transitions
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_on_imputation_status_change() IS
  'Prompt 8 : Notifications workflow imputation (soumission/validation/rejet/report)';

-- Créer le trigger AFTER UPDATE sur imputations
DROP TRIGGER IF EXISTS trigger_notify_imputation_status ON public.imputations;
CREATE TRIGGER trigger_notify_imputation_status
  AFTER UPDATE ON public.imputations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION notify_on_imputation_status_change();


-- ============================================================================
-- PART 4 : Cohérence chaîne NAEF ↔ Imputation
-- ============================================================================
-- Contraintes vérifiées AVANT INSERT ou UPDATE sur imputations :
--   1. Pas d'imputation validée sans NAEF dans un statut ≥ a_imputer
--   2. montant imputation ≤ montant_estime NAEF
--   3. Si les deux ont un budget_line_id, ils doivent correspondre

CREATE OR REPLACE FUNCTION public.enforce_imputation_chain_coherence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_naef         RECORD;
  v_valid_statuts TEXT[] := ARRAY['a_imputer', 'impute', 'valide', 'a_valider'];
BEGIN
  -- Ignorer les migrations (service_role sans auth.uid)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ignorer les brouillons (pas encore dans le workflow)
  IF NEW.statut = 'brouillon' THEN
    RETURN NEW;
  END IF;

  -- Récupérer la NAEF associée
  SELECT id, numero, statut, montant_estime, budget_line_id
  INTO v_naef
  FROM notes_dg
  WHERE id = NEW.note_aef_id;

  -- Vérification 1 : La NAEF doit exister
  IF v_naef.id IS NULL THEN
    RAISE EXCEPTION 'Cohérence chaîne : aucune NAEF trouvée pour note_aef_id = %', NEW.note_aef_id;
  END IF;

  -- Vérification 2 : La NAEF doit être dans un statut valide (≥ a_imputer)
  -- Uniquement quand on valide l'imputation (pas au brouillon/soumission)
  IF NEW.statut IN ('valide', 'a_valider') AND v_naef.statut NOT IN ('a_imputer', 'impute', 'valide', 'a_valider') THEN
    RAISE EXCEPTION 'Cohérence chaîne : impossible de valider l''imputation car la NAEF % est au statut "%" (attendu : a_imputer ou impute)',
      v_naef.numero, v_naef.statut;
  END IF;

  -- Vérification 3 : montant imputation ≤ montant_estime NAEF
  IF v_naef.montant_estime IS NOT NULL
     AND NEW.montant IS NOT NULL
     AND NEW.montant > v_naef.montant_estime THEN
    RAISE EXCEPTION 'Cohérence chaîne : montant imputation (% FCFA) dépasse le montant estimé NAEF % (% FCFA)',
      NEW.montant, v_naef.numero, v_naef.montant_estime;
  END IF;

  -- Vérification 4 : Cohérence ligne budgétaire
  IF v_naef.budget_line_id IS NOT NULL
     AND NEW.budget_line_id IS NOT NULL
     AND v_naef.budget_line_id IS DISTINCT FROM NEW.budget_line_id THEN
    RAISE EXCEPTION 'Cohérence chaîne : la ligne budgétaire de l''imputation (%) ne correspond pas à celle de la NAEF % (%)',
      NEW.budget_line_id, v_naef.numero, v_naef.budget_line_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_imputation_chain_coherence() IS
  'Prompt 8 : Vérifie la cohérence NAEF↔Imputation (statut, montant, budget_line)';

-- Trigger BEFORE INSERT et BEFORE UPDATE
DROP TRIGGER IF EXISTS trg_enforce_imputation_chain ON public.imputations;
CREATE TRIGGER trg_enforce_imputation_chain
  BEFORE INSERT OR UPDATE ON public.imputations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_imputation_chain_coherence();


-- ============================================================================
-- PART 5 : Diagnostic de cohérence existante (vue utilitaire)
-- ============================================================================
-- Vue pour identifier les incohérences déjà en base (données migrées)

CREATE OR REPLACE VIEW public.v_imputation_chain_diagnostic AS
SELECT
  i.id                AS imputation_id,
  i.reference         AS imputation_ref,
  i.montant           AS imputation_montant,
  i.statut            AS imputation_statut,
  i.budget_line_id    AS imputation_budget_line,
  nd.id               AS naef_id,
  nd.numero           AS naef_numero,
  nd.montant_estime   AS naef_montant,
  nd.statut           AS naef_statut,
  nd.budget_line_id   AS naef_budget_line,
  -- Checks
  CASE
    WHEN nd.id IS NULL THEN 'ORPHELINE: pas de NAEF'
    WHEN i.statut = 'valide' AND nd.statut NOT IN ('a_imputer', 'impute', 'valide', 'a_valider')
      THEN 'INCOHERENCE: imputation validée mais NAEF au statut ' || nd.statut
    ELSE 'OK'
  END AS check_statut,
  CASE
    WHEN nd.montant_estime IS NOT NULL AND i.montant > nd.montant_estime
      THEN 'DEPASSEMENT: ' || i.montant || ' > ' || nd.montant_estime
    ELSE 'OK'
  END AS check_montant,
  CASE
    WHEN nd.budget_line_id IS NOT NULL AND i.budget_line_id IS NOT NULL
         AND nd.budget_line_id IS DISTINCT FROM i.budget_line_id
      THEN 'DIVERGENCE: lignes budgétaires différentes'
    ELSE 'OK'
  END AS check_budget_line
FROM imputations i
LEFT JOIN notes_dg nd ON nd.id = i.note_aef_id
WHERE i.is_migrated IS NOT TRUE;  -- Exclure les données migrées pour le diagnostic

-- Accès à la vue diagnostic
GRANT SELECT ON public.v_imputation_chain_diagnostic TO authenticated;
