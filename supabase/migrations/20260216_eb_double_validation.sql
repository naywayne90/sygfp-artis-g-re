-- ============================================================================
-- Migration: Double Validation Expressions de Besoin (CB + DG/DAAF)
-- Date: 2026-02-16
-- Context: Prompt 6 - Remplace la validation 3-niveaux hiérarchique par:
--   1. CB vérifie la couverture budgétaire : soumis → verifie
--   2. DG/DAAF valide : verifie → valide
--
-- Convention: statuts SANS accents (verifie, valide, rejete, differe)
-- ============================================================================

BEGIN;

-- =============================================
-- 1. Colonnes de vérification et rejet
-- =============================================

ALTER TABLE public.expressions_besoin
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Nettoyage éventuel de données avec accents (sécurité)
UPDATE public.expressions_besoin SET statut = 'rejete'  WHERE statut = 'rejeté';
UPDATE public.expressions_besoin SET statut = 'valide'  WHERE statut = 'validé';
UPDATE public.expressions_besoin SET statut = 'verifie' WHERE statut = 'vérifié';

-- =============================================
-- 2. RLS Policies
-- =============================================

-- UPDATE: CB peut modifier soumis, DG/DAAF peuvent modifier soumis+verifie
DROP POLICY IF EXISTS "eb_update_policy" ON public.expressions_besoin;
CREATE POLICY "eb_update_policy" ON public.expressions_besoin FOR UPDATE USING (
  (created_by = auth.uid() AND statut IN ('brouillon', 'rejete'))
  OR (has_role(auth.uid(), 'CB'::app_role) AND statut IN ('soumis'))
  OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('soumis', 'verifie'))
  OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'verifie'))
  OR has_role(auth.uid(), 'ADMIN'::app_role)
);

-- SELECT: CB peut voir les EB soumises (pour l'onglet "À vérifier")
DROP POLICY IF EXISTS "eb_select_cb_soumis" ON public.expressions_besoin;
CREATE POLICY "eb_select_cb_soumis" ON public.expressions_besoin FOR SELECT USING (
  has_role(auth.uid(), 'CB'::app_role)
);

-- =============================================
-- 3. Workflow enforcement (BEFORE UPDATE)
--    Transitions autorisées:
--    brouillon/rejete → soumis (créateur)
--    soumis → verifie (CB)
--    soumis → rejete (CB, motif obligatoire)
--    soumis → differe (CB)
--    verifie → valide (DG/DAAF)
--    verifie → rejete (DG/DAAF, motif obligatoire)
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_enforce_eb_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_imp_statut TEXT;
BEGIN
  -- Skip if statut hasn't changed
  IF NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  v_is_admin := has_role(v_caller, 'ADMIN'::app_role);

  -- ===== brouillon/rejete → soumis =====
  IF NEW.statut = 'soumis' AND OLD.statut IN ('brouillon', 'rejete') THEN
    IF NOT v_is_admin AND v_caller != OLD.created_by THEN
      RAISE EXCEPTION 'Seul le créateur peut soumettre une expression de besoin';
    END IF;

    -- Vérifier articles (stockés en JSON dans liste_articles)
    IF NEW.liste_articles IS NULL OR jsonb_array_length(NEW.liste_articles::jsonb) < 1 THEN
      RAISE EXCEPTION 'Au moins 1 article requis pour soumettre';
    END IF;

    IF NEW.imputation_id IS NULL THEN
      RAISE EXCEPTION 'Imputation obligatoire pour soumettre';
    END IF;

    SELECT statut INTO v_imp_statut
    FROM imputations WHERE id = NEW.imputation_id;

    IF v_imp_statut NOT IN ('valide', 'validé') THEN
      RAISE EXCEPTION 'Imputation liée doit être validée (statut actuel: %)', v_imp_statut;
    END IF;

    -- Reset rejection fields if re-submitting after rejection
    IF OLD.statut = 'rejete' THEN
      NEW.rejected_by := NULL;
      NEW.rejected_at := NULL;
      NEW.rejection_reason := NULL;
    END IF;

  -- ===== soumis → verifie (CB) =====
  ELSIF NEW.statut = 'verifie' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut vérifier une expression de besoin';
    END IF;
    NEW.verified_by := v_caller;
    NEW.verified_at := now();

  -- ===== soumis → rejete (CB) =====
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut rejeter à cette étape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- ===== soumis → differe (CB) =====
  ELSIF NEW.statut = 'differe' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut différer à cette étape';
    END IF;

  -- ===== verifie → valide (DG/DAAF) =====
  ELSIF NEW.statut = 'valide' AND OLD.statut = 'verifie' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG ou DAAF peut valider';
    END IF;
    NEW.validated_by := v_caller;
    NEW.validated_at := now();

  -- ===== verifie → rejete (DG/DAAF) =====
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'verifie' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG ou DAAF peut rejeter à cette étape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- ===== Toute autre transition = ERREUR =====
  ELSE
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Transition non autorisée: % → %', OLD.statut, NEW.statut;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_eb_workflow_enforce ON public.expressions_besoin;
CREATE TRIGGER trg_eb_workflow_enforce
  BEFORE UPDATE ON public.expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_eb_workflow();

-- =============================================
-- 4. Notification trigger (AFTER UPDATE)
-- =============================================

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

  -- soumis → Notify CB
  IF NEW.statut = 'soumis' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_soumise',
      'Nouvelle EB à vérifier',
      'L''expression de besoin ' || v_eb_label || ' a été soumise pour vérification budgétaire.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role = 'CB'::app_role AND ur.is_active = true;

  -- verifie → Notify DG + DAAF + créateur
  ELSIF NEW.statut = 'verifie' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_verifiee',
      'EB vérifiée - en attente validation',
      'L''expression de besoin ' || v_eb_label || ' a été vérifiée par le CB et attend votre validation.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role IN ('DG'::app_role, 'DAAF'::app_role) AND ur.is_active = true;

    -- Notifier le créateur
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_verifiee',
      'Votre EB a été vérifiée',
      'Votre expression de besoin ' || v_eb_label || ' a été vérifiée par le CB. En attente de validation DG/DAAF.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- valide → Notify créateur
  ELSIF NEW.statut = 'valide' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_validee',
      'EB validée',
      'Votre expression de besoin ' || v_eb_label || ' a été validée. Prêt pour passation de marché.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- rejete → Notify créateur (urgent)
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
$$;

DROP TRIGGER IF EXISTS trg_eb_notify_transition ON public.expressions_besoin;
CREATE TRIGGER trg_eb_notify_transition
  AFTER UPDATE ON public.expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_eb_transition();

-- =============================================
-- 5. Audit trigger (non-accented statuts)
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_audit_expression_besoin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_values, exercice)
    VALUES (
      auth.uid(), 'expression_besoin', NEW.id, 'create',
      jsonb_build_object(
        'numero', NEW.numero, 'objet', NEW.objet,
        'statut', NEW.statut, 'montant_estime', NEW.montant_estime,
        'direction_id', NEW.direction_id
      ), NEW.exercice
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.statut IS DISTINCT FROM OLD.statut
       OR NEW.montant_estime IS DISTINCT FROM OLD.montant_estime
       OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
       OR NEW.numero IS DISTINCT FROM OLD.numero THEN
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, exercice)
      VALUES (
        auth.uid(), 'expression_besoin', NEW.id,
        CASE
          WHEN NEW.statut = 'soumis' AND OLD.statut IN ('brouillon', 'rejete') THEN 'submit'
          WHEN NEW.statut = 'verifie' THEN 'verify'
          WHEN NEW.statut = 'valide' THEN 'validate'
          WHEN NEW.statut = 'rejete' THEN 'reject'
          ELSE 'update'
        END,
        jsonb_build_object(
          'statut', OLD.statut, 'montant_estime', OLD.montant_estime,
          'validated_by', OLD.validated_by, 'verified_by', OLD.verified_by,
          'rejected_by', OLD.rejected_by
        ),
        jsonb_build_object(
          'statut', NEW.statut, 'montant_estime', NEW.montant_estime,
          'validated_by', NEW.validated_by, 'verified_by', NEW.verified_by,
          'rejected_by', NEW.rejected_by, 'rejection_reason', NEW.rejection_reason,
          'numero', NEW.numero
        ), NEW.exercice
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, exercice)
    VALUES (
      auth.uid(), 'expression_besoin', OLD.id, 'delete',
      jsonb_build_object(
        'numero', OLD.numero, 'objet', OLD.objet,
        'statut', OLD.statut, 'montant_estime', OLD.montant_estime
      ), OLD.exercice
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- =============================================
-- 6. Vue stats (inclut compteur verifie)
-- =============================================

DROP VIEW IF EXISTS public.expression_besoin_stats;
CREATE OR REPLACE VIEW public.expression_besoin_stats AS
SELECT
  exercice,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillon,
  COUNT(*) FILTER (WHERE statut = 'soumis') AS soumis,
  COUNT(*) FILTER (WHERE statut = 'verifie') AS verifie,
  COUNT(*) FILTER (WHERE statut = 'valide') AS valide,
  COUNT(*) FILTER (WHERE statut = 'rejete') AS rejete,
  COUNT(*) FILTER (WHERE statut = 'differe') AS differe,
  COUNT(*) FILTER (WHERE statut = 'satisfaite') AS satisfaite
FROM public.expressions_besoin
GROUP BY exercice;

COMMIT;
