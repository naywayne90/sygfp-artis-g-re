-- ============================================================================
-- Migration Prompt 9: Notifications complètes + Cohérence chaîne
-- Date: 2026-02-16
-- Context: Prompt 9 - 5 scénarios notification, cohérence imputation/montant
--
-- Changes:
--   1. notify_on_imputation_status_change: message direction "créez l'EB" + creator
--   2. fn_notify_eb_transition: ajout direction agents sur validé + "Prêt passation"
--   3. fn_enforce_eb_workflow: check montant_estime <= montant imputation
--
-- Audit pré-déploiement:
--   - 3019 EB legacy (SQL Server) validées sans imputation (non modifiables)
--   - 189 EB 2026+ validées sans imputation (avant trigger workflow)
--   - 0 EB avec montant > imputation montant
--   - trigger_notify_imputation_status existe déjà sur imputations
--   - trg_eb_notify_transition existe déjà sur expressions_besoin
--   - trg_eb_workflow_enforce existe déjà sur expressions_besoin
-- ============================================================================

-- =============================================
-- POINT 1: Notifications imputation validée
-- Améliore message direction + ajoute créateur
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_on_imputation_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
  v_reference TEXT;
  v_naef_num TEXT;
  v_rec RECORD;
BEGIN
  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  v_reference := COALESCE(NEW.reference, 'N/A');
  SELECT COALESCE(nd.numero, 'N/A') INTO v_naef_num
  FROM notes_dg nd WHERE nd.id = NEW.note_aef_id;

  CASE NEW.statut
    WHEN 'a_valider' THEN
      v_titre := 'Imputation soumise pour validation';
      v_type := 'imputation_soumise';
      v_message := 'L''imputation ' || v_reference || ' (NAEF ' || v_naef_num || ')'
        || ' d''un montant de ' || COALESCE(NEW.montant::text, '0') || ' FCFA'
        || ' a été soumise pour validation.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DAAF', 'notes') LOOP
        PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','action_required',true,
            'reference',v_reference,'naef_numero',v_naef_num,'montant',NEW.montant));
      END LOOP;
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('DG', 'notes') LOOP
        PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','action_required',true,
            'reference',v_reference,'naef_numero',v_naef_num,'montant',NEW.montant));
      END LOOP;

    WHEN 'valide' THEN
      v_titre := 'Imputation validée';
      v_type := 'imputation_validee';
      -- Notify CB
      v_message := 'L''imputation ' || v_reference || ' (NAEF ' || v_naef_num || ')'
        || ' a été validée. Montant réservé : ' || COALESCE(NEW.montant::text, '0') || ' FCFA.';
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes') LOOP
        PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','reference',v_reference,
            'naef_numero',v_naef_num,'montant',NEW.montant));
      END LOOP;
      -- Notify direction agents: "créez l'expression de besoin"
      IF NEW.direction_id IS NOT NULL THEN
        v_message := 'Imputation ' || v_reference || ' validée ('
          || COALESCE(NEW.montant::text, '0')
          || ' FCFA). Vous pouvez créer l''expression de besoin.';
        FOR v_rec IN SELECT p.id AS user_id FROM profiles p
          WHERE p.direction_id = NEW.direction_id
            AND p.id IS DISTINCT FROM NEW.created_by LOOP
          PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
            'imputations', NEW.id,
            jsonb_build_object('category','workflow','action_required',true,
              'reference',v_reference,'direction_id',NEW.direction_id));
        END LOOP;
      END IF;
      -- Notify creator: "Créez l'expression de besoin"
      IF NEW.created_by IS NOT NULL THEN
        v_message := 'Votre imputation ' || v_reference || ' (NAEF ' || v_naef_num
          || ') a été validée. Montant réservé : '
          || COALESCE(NEW.montant::text, '0')
          || ' FCFA. Créez l''expression de besoin.';
        PERFORM create_notification(NEW.created_by, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','action_required',true,
            'reference',v_reference,'naef_numero',v_naef_num,'montant',NEW.montant));
      END IF;

    WHEN 'rejete' THEN
      v_titre := 'Imputation rejetée';
      v_type := 'imputation_rejetee';
      v_message := 'L''imputation ' || v_reference || ' (NAEF ' || v_naef_num || ')'
        || ' a été rejetée. Motif : ' || COALESCE(NEW.motif_rejet, 'Non spécifié');
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes') LOOP
        PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','reference',v_reference,
            'naef_numero',v_naef_num,'motif_rejet',NEW.motif_rejet));
      END LOOP;
      IF NEW.created_by IS NOT NULL THEN
        PERFORM create_notification(NEW.created_by, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','reference',v_reference,
            'naef_numero',v_naef_num,'motif_rejet',NEW.motif_rejet));
      END IF;

    WHEN 'differe' THEN
      v_titre := 'Imputation différée';
      v_type := 'imputation_differee';
      v_message := 'L''imputation ' || v_reference || ' (NAEF ' || v_naef_num || ')'
        || ' a été différée. Motif : ' || COALESCE(NEW.motif_differe, 'Non spécifié');
      FOR v_rec IN SELECT user_id FROM get_users_who_can_act_as_role('CB', 'notes') LOOP
        PERFORM create_notification(v_rec.user_id, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','reference',v_reference,
            'naef_numero',v_naef_num,'motif_differe',NEW.motif_differe));
      END LOOP;
      IF NEW.created_by IS NOT NULL THEN
        PERFORM create_notification(NEW.created_by, v_type, v_titre, v_message,
          'imputations', NEW.id,
          jsonb_build_object('category','workflow','reference',v_reference,
            'naef_numero',v_naef_num,'motif_differe',NEW.motif_differe));
      END IF;

    ELSE NULL;
  END CASE;

  RETURN NEW;
END;
$fn$;

-- =============================================
-- POINT 2: Notifications EB complètes
-- Ajout direction agents sur validé
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_notify_eb_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_eb_label TEXT;
  v_rec RECORD;
BEGIN
  IF NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  v_eb_label := COALESCE(NEW.numero, 'EB') || ' - ' || COALESCE(NEW.objet, '');

  -- soumis -> notifier CB
  IF NEW.statut = 'soumis' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_soumise',
      'Nouvelle EB à vérifier',
      'L''expression de besoin ' || v_eb_label || ' a été soumise pour vérification budgétaire.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur
    WHERE ur.role = 'CB'::app_role AND ur.is_active = true;

  -- vérifié -> notifier DG/DAAF + créateur
  ELSIF NEW.statut = 'verifie' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_verifiee',
      'EB vérifiée - en attente validation',
      'L''expression de besoin ' || v_eb_label || ' a été vérifiée par le CB et attend votre validation.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur
    WHERE ur.role IN ('DG'::app_role, 'DAAF'::app_role) AND ur.is_active = true;

    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_verifiee',
      'Votre EB a été vérifiée',
      'Votre expression de besoin ' || v_eb_label || ' a été vérifiée par le CB. En attente de validation DG/DAAF.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- validé -> notifier créateur + direction + "Prêt pour passation"
  ELSIF NEW.statut = 'valide' THEN
    -- Notifier le créateur
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_validee',
      'EB validée - Prêt pour passation',
      'Votre expression de besoin ' || v_eb_label || ' a été validée. Prêt pour passation de marché.',
      NEW.id, 'expression_besoin', 'workflow', false
    );
    -- Notifier les agents de la direction
    IF NEW.direction_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
      SELECT p.id, 'eb_validee',
        'EB validée pour votre direction',
        'L''expression de besoin ' || v_eb_label || ' de votre direction a été validée. Prêt pour passation de marché.',
        NEW.id, 'expression_besoin', 'information', false
      FROM profiles p
      WHERE p.direction_id = NEW.direction_id
        AND p.id IS DISTINCT FROM NEW.created_by;
    END IF;

  -- rejeté -> notifier créateur + motif
  ELSIF NEW.statut = 'rejete' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_rejetee',
      'EB rejetée',
      'Votre expression de besoin ' || v_eb_label || ' a été rejetée. Motif: ' || COALESCE(NEW.rejection_reason, 'Non spécifié'),
      NEW.id, 'expression_besoin', 'workflow', true
    );
  END IF;

  RETURN NEW;
END;
$fn$;

-- =============================================
-- POINT 3: Cohérence chaîne en base
-- Montant articles <= montant imputation
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_enforce_eb_workflow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_imp_statut TEXT;
  v_imp_montant NUMERIC;
BEGIN
  IF NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  v_is_admin := has_role(v_caller, 'ADMIN'::app_role);

  -- brouillon/rejeté -> soumis
  IF NEW.statut = 'soumis' AND OLD.statut IN ('brouillon', 'rejete') THEN
    IF NOT v_is_admin AND v_caller != OLD.created_by THEN
      RAISE EXCEPTION 'Seul le créateur peut soumettre une expression de besoin';
    END IF;
    IF NEW.liste_articles IS NULL OR jsonb_array_length(NEW.liste_articles::jsonb) < 1 THEN
      RAISE EXCEPTION 'Au moins 1 article requis pour soumettre';
    END IF;
    IF NEW.imputation_id IS NULL THEN
      RAISE EXCEPTION 'Imputation obligatoire pour soumettre';
    END IF;
    SELECT statut, montant INTO v_imp_statut, v_imp_montant
    FROM imputations WHERE id = NEW.imputation_id;
    IF v_imp_statut NOT IN ('valide', 'validé') THEN
      RAISE EXCEPTION 'Imputation liée doit être validée (statut actuel: %)', v_imp_statut;
    END IF;
    -- Cohérence: montant articles <= montant imputation
    IF v_imp_montant IS NOT NULL AND NEW.montant_estime > v_imp_montant THEN
      RAISE EXCEPTION 'Le montant estimé (% FCFA) dépasse le montant de l''imputation (% FCFA)',
        NEW.montant_estime, v_imp_montant;
    END IF;
    IF OLD.statut = 'rejete' THEN
      NEW.rejected_by := NULL;
      NEW.rejected_at := NULL;
      NEW.rejection_reason := NULL;
    END IF;

  -- soumis -> vérifié (CB)
  ELSIF NEW.statut = 'verifie' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut vérifier une expression de besoin';
    END IF;
    NEW.verified_by := v_caller;
    NEW.verified_at := now();

  -- soumis -> rejeté (CB)
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut rejeter à cette étape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- soumis -> différé (CB)
  ELSIF NEW.statut = 'differe' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut différer à cette étape';
    END IF;

  -- vérifié -> validé (DG/DAAF)
  ELSIF NEW.statut = 'valide' AND OLD.statut = 'verifie' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG ou DAAF peut valider';
    END IF;
    NEW.validated_by := v_caller;
    NEW.validated_at := now();

  -- vérifié -> rejeté (DG/DAAF)
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'verifie' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG ou DAAF peut rejeter à cette étape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  ELSE
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Transition non autorisée: % -> %', OLD.statut, NEW.statut;
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;
