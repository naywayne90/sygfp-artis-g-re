-- =============================================================================
-- Prompt 9 : QR Code EB + Notification differe + coherence
-- =============================================================================
-- 1) Ajouter 'pdf_expression_besoin' au CHECK type_document de documents_generes
-- 2) Mettre a jour fn_notify_eb_transition() pour le cas 'differe'
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ajouter pdf_expression_besoin au CHECK constraint
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE documents_generes DROP CONSTRAINT IF EXISTS documents_generes_type_document_check;

ALTER TABLE documents_generes ADD CONSTRAINT documents_generes_type_document_check
  CHECK (type_document IN (
    'pdf_note_sef', 'pdf_note_aef', 'pdf_engagement', 'pdf_liquidation',
    'pdf_ordonnancement', 'pdf_reglement', 'pdf_contrat', 'pdf_marche',
    'pdf_recette', 'pdf_bordereau', 'pdf_rapport',
    'pdf_expression_besoin',
    'excel_export', 'csv_export', 'zip_archive'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Mettre a jour fn_notify_eb_transition() — ajouter cas 'differe'
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_notify_eb_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_eb_label TEXT;
BEGIN
  IF NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  v_eb_label := COALESCE(NEW.numero, 'EB') || ' - ' || COALESCE(NEW.objet, '');

  -- soumis : Notify CB
  IF NEW.statut = 'soumis' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_soumise',
      'Nouvelle EB a verifier',
      'L''expression de besoin ' || v_eb_label || ' a ete soumise pour verification budgetaire.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role = 'CB'::app_role AND ur.is_active = true;

  -- verifie : Notify DG + DAAF + createur
  ELSIF NEW.statut = 'verifie' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_verifiee',
      'EB verifiee - en attente validation',
      'L''expression de besoin ' || v_eb_label || ' a ete verifiee par le CB et attend votre validation.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role IN ('DG'::app_role, 'DAAF'::app_role) AND ur.is_active = true;

    -- Notifier le createur
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
      VALUES (
        NEW.created_by, 'eb_verifiee',
        'Votre EB a ete verifiee',
        'Votre expression de besoin ' || v_eb_label || ' a ete verifiee par le CB. En attente de validation DG/DAAF.',
        NEW.id, 'expression_besoin', 'workflow', false
      );
    END IF;

  -- valide : Notify createur
  ELSIF NEW.statut = 'valide' THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
      VALUES (
        NEW.created_by, 'eb_validee',
        'EB validee',
        'Votre expression de besoin ' || v_eb_label || ' a ete validee. Pret pour passation de marche.',
        NEW.id, 'expression_besoin', 'workflow', false
      );
    END IF;

  -- rejete : Notify createur (urgent)
  ELSIF NEW.statut = 'rejete' THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
      VALUES (
        NEW.created_by, 'eb_rejetee',
        'EB rejetee',
        'Votre expression de besoin ' || v_eb_label || ' a ete rejetee. Motif: ' || COALESCE(NEW.rejection_reason, 'Non specifie'),
        NEW.id, 'expression_besoin', 'workflow', true
      );
    END IF;

  -- differe : Notify createur avec motif + deadline
  ELSIF NEW.statut = 'differe' THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
      VALUES (
        NEW.created_by, 'eb_differee',
        'EB differee',
        'Votre expression de besoin ' || v_eb_label || ' a ete differee. Motif: '
          || COALESCE(NEW.motif_differe, 'Non specifie')
          || CASE
               WHEN NEW.deadline_correction IS NOT NULL
               THEN '. Date de reprise prevue: ' || to_char(NEW.deadline_correction::date, 'DD/MM/YYYY')
               ELSE ''
             END,
        NEW.id, 'expression_besoin', 'workflow', true
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Le trigger existe deja, on le recree pour s'assurer qu'il pointe vers la nouvelle version
DROP TRIGGER IF EXISTS trg_eb_notify_transition ON public.expressions_besoin;
CREATE TRIGGER trg_eb_notify_transition
  AFTER UPDATE ON public.expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_eb_transition();

COMMIT;
