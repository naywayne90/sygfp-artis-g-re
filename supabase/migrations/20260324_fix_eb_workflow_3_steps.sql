-- ============================================================================
-- Migration: Expression de Besoin - Workflow 3 etapes (CB → DAAF → DG)
-- Date: 2026-03-24
-- Context: Refactoring EB workflow from 2-step (CB+DG/DAAF) to 3-step:
--   1. CB verifie la couverture budgetaire : soumis → visa_cb
--   2. DAAF valide : visa_cb → visa_daaf
--   3. DG approuve : visa_daaf → valide
--
-- Changes:
--   1. Add 9 visa columns (visa_cb_*, visa_daaf_*, visa_dg_*)
--   2. Migrate legacy data (verifie → visa_cb)
--   3. Fix RLS policies (unaccented statuts, 3-step roles)
--   4. Update workflow trigger
--   5. Update notification trigger
--   6. Update stats view
--   7. Add index on statut
-- ============================================================================

BEGIN;

-- =============================================
-- 1. Add 9 visa columns
-- =============================================

ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_cb_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_cb_date TIMESTAMPTZ;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_cb_commentaire TEXT;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_daaf_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_daaf_date TIMESTAMPTZ;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_daaf_commentaire TEXT;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_dg_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_dg_date TIMESTAMPTZ;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS visa_dg_commentaire TEXT;

-- =============================================
-- 2. Migrate legacy data
-- =============================================

-- Convert 'verifie' to 'visa_cb' and copy verified_by/at to visa columns
UPDATE public.expressions_besoin
SET statut = 'visa_cb',
    visa_cb_user_id = verified_by,
    visa_cb_date = verified_at
WHERE statut = 'verifie';

-- Also handle accented variants
UPDATE public.expressions_besoin
SET statut = 'visa_cb',
    visa_cb_user_id = verified_by,
    visa_cb_date = verified_at
WHERE statut = 'vérifié';

-- Normalize accented statuts
UPDATE public.expressions_besoin SET statut = 'rejete' WHERE statut = 'rejeté';
UPDATE public.expressions_besoin SET statut = 'valide' WHERE statut = 'validé';

-- =============================================
-- 3. Fix RLS policies
-- =============================================

-- Drop all existing EB policies
DROP POLICY IF EXISTS "eb_select_own" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_select_direction" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_select_privileged" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_select_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_select_cb_soumis" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_insert_own_direction" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_insert_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "Users can create expressions de besoin" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_creator_draft" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_cb_soumis" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_dg_verifie" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_admin" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_update_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_delete_creator_draft" ON public.expressions_besoin;
DROP POLICY IF EXISTS "eb_delete_policy" ON public.expressions_besoin;
DROP POLICY IF EXISTS "Users can update their own drafts or DG can validate" ON public.expressions_besoin;
DROP POLICY IF EXISTS "Users can view their own or if DG/Admin/DAAF" ON public.expressions_besoin;
DROP POLICY IF EXISTS "Users can read expressions linked to accessible imputations" ON public.expressions_besoin;

-- SELECT: Createur voit ses propres EB
CREATE POLICY "eb_select_own"
  ON public.expressions_besoin FOR SELECT
  USING (created_by = auth.uid());

-- SELECT: Utilisateur voit les EB de sa direction
CREATE POLICY "eb_select_direction"
  ON public.expressions_besoin FOR SELECT
  USING (
    direction_id IS NOT NULL
    AND direction_id IN (
      SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- SELECT: CB/DG/DAAF/ADMIN voient TOUT
CREATE POLICY "eb_select_privileged"
  ON public.expressions_besoin FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

-- INSERT: Utilisateur insere uniquement dans sa direction (ou ADMIN)
CREATE POLICY "eb_insert_own_direction"
  ON public.expressions_besoin FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      has_role(auth.uid(), 'ADMIN'::app_role)
      OR direction_id IN (
        SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- UPDATE: Createur peut modifier si brouillon ou rejete
CREATE POLICY "eb_update_creator_draft"
  ON public.expressions_besoin FOR UPDATE
  USING (
    created_by = auth.uid()
    AND statut IN ('brouillon', 'rejete')
  );

-- UPDATE: CB peut modifier les EB soumis (verification → visa_cb)
CREATE POLICY "eb_update_cb_soumis"
  ON public.expressions_besoin FOR UPDATE
  USING (
    has_role(auth.uid(), 'CB'::app_role)
    AND statut = 'soumis'
  );

-- UPDATE: DAAF peut modifier les EB visa_cb (validation → visa_daaf)
CREATE POLICY "eb_update_daaf_visa_cb"
  ON public.expressions_besoin FOR UPDATE
  USING (
    has_role(auth.uid(), 'DAAF'::app_role)
    AND statut = 'visa_cb'
  );

-- UPDATE: DG peut modifier les EB visa_daaf (approbation → valide)
CREATE POLICY "eb_update_dg_visa_daaf"
  ON public.expressions_besoin FOR UPDATE
  USING (
    has_role(auth.uid(), 'DG'::app_role)
    AND statut = 'visa_daaf'
  );

-- UPDATE: ADMIN peut tout modifier
CREATE POLICY "eb_update_admin"
  ON public.expressions_besoin FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- DELETE: Createur peut supprimer si brouillon, ou ADMIN
CREATE POLICY "eb_delete_creator_or_admin"
  ON public.expressions_besoin FOR DELETE
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================
-- 4. Update workflow trigger (3 steps)
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
      RAISE EXCEPTION 'Seul le createur peut soumettre une expression de besoin';
    END IF;

    IF NEW.liste_articles IS NULL OR jsonb_array_length(NEW.liste_articles::jsonb) < 1 THEN
      RAISE EXCEPTION 'Au moins 1 article requis pour soumettre';
    END IF;

    IF NEW.imputation_id IS NULL THEN
      RAISE EXCEPTION 'Imputation obligatoire pour soumettre';
    END IF;

    SELECT statut INTO v_imp_statut
    FROM imputations WHERE id = NEW.imputation_id;

    IF v_imp_statut NOT IN ('valide', 'validé') THEN
      RAISE EXCEPTION 'Imputation liee doit etre validee (statut actuel: %)', v_imp_statut;
    END IF;

    -- Reset rejection fields if re-submitting after rejection
    IF OLD.statut = 'rejete' THEN
      NEW.rejected_by := NULL;
      NEW.rejected_at := NULL;
      NEW.rejection_reason := NULL;
    END IF;

  -- ===== soumis → visa_cb (CB) =====
  ELSIF NEW.statut = 'visa_cb' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut verifier une expression de besoin';
    END IF;
    NEW.verified_by := v_caller;
    NEW.verified_at := now();
    NEW.visa_cb_user_id := v_caller;
    NEW.visa_cb_date := now();

  -- ===== soumis → rejete (CB) =====
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut rejeter a cette etape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- ===== soumis → differe (CB) =====
  ELSIF NEW.statut = 'differe' AND OLD.statut = 'soumis' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'CB'::app_role) THEN
      RAISE EXCEPTION 'Seul le CB peut differer a cette etape';
    END IF;

  -- ===== visa_cb → visa_daaf (DAAF) =====
  ELSIF NEW.statut = 'visa_daaf' AND OLD.statut = 'visa_cb' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DAAF peut valider a cette etape';
    END IF;
    NEW.visa_daaf_user_id := v_caller;
    NEW.visa_daaf_date := now();

  -- ===== visa_cb → rejete (DAAF) =====
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'visa_cb' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DAAF'::app_role) THEN
      RAISE EXCEPTION 'Seul le DAAF peut rejeter a cette etape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- ===== visa_daaf → valide (DG) =====
  ELSIF NEW.statut = 'valide' AND OLD.statut = 'visa_daaf' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG peut approuver a cette etape';
    END IF;
    NEW.validated_by := v_caller;
    NEW.validated_at := now();
    NEW.visa_dg_user_id := v_caller;
    NEW.visa_dg_date := now();

  -- ===== visa_daaf → rejete (DG) =====
  ELSIF NEW.statut = 'rejete' AND OLD.statut = 'visa_daaf' THEN
    IF NOT v_is_admin AND NOT has_role(v_caller, 'DG'::app_role) THEN
      RAISE EXCEPTION 'Seul le DG peut rejeter a cette etape';
    END IF;
    IF NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Motif de rejet obligatoire';
    END IF;
    NEW.rejected_by := v_caller;
    NEW.rejected_at := now();

  -- ===== Toute autre transition = ERREUR =====
  ELSE
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Transition non autorisee: % → %', OLD.statut, NEW.statut;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- 5. Update notification trigger (3 steps)
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
      'Nouvelle EB a verifier',
      'L''expression de besoin ' || v_eb_label || ' a ete soumise pour verification budgetaire.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role = 'CB'::app_role AND ur.is_active = true;

  -- visa_cb → Notify DAAF + createur
  ELSIF NEW.statut = 'visa_cb' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_visa_cb',
      'EB verifiee par CB - en attente validation DAAF',
      'L''expression de besoin ' || v_eb_label || ' a ete verifiee par le CB et attend votre validation.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role = 'DAAF'::app_role AND ur.is_active = true;

    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_visa_cb',
      'Votre EB a ete verifiee par le CB',
      'Votre expression de besoin ' || v_eb_label || ' a ete verifiee par le CB. En attente de validation DAAF.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- visa_daaf → Notify DG + createur
  ELSIF NEW.statut = 'visa_daaf' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    SELECT ur.user_id, 'eb_visa_daaf',
      'EB validee par DAAF - en attente approbation DG',
      'L''expression de besoin ' || v_eb_label || ' a ete validee par le DAAF et attend votre approbation.',
      NEW.id, 'expression_besoin', 'workflow', false
    FROM user_roles ur WHERE ur.role = 'DG'::app_role AND ur.is_active = true;

    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_visa_daaf',
      'Votre EB a ete validee par le DAAF',
      'Votre expression de besoin ' || v_eb_label || ' a ete validee par le DAAF. En attente d''approbation DG.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- valide → Notify createur
  ELSIF NEW.statut = 'valide' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_validee',
      'EB approuvee par le DG',
      'Votre expression de besoin ' || v_eb_label || ' a ete approuvee par le DG. Pret pour passation de marche.',
      NEW.id, 'expression_besoin', 'workflow', false
    );

  -- rejete → Notify createur (urgent)
  ELSIF NEW.statut = 'rejete' THEN
    INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type, category, is_urgent)
    VALUES (
      NEW.created_by, 'eb_rejetee',
      'EB rejetee',
      'Votre expression de besoin ' || v_eb_label || ' a ete rejetee. Motif: ' || COALESCE(NEW.rejection_reason, 'Non specifie'),
      NEW.id, 'expression_besoin', 'workflow', true
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- 6. Update stats view (include visa_cb, visa_daaf)
-- =============================================

DROP VIEW IF EXISTS public.expression_besoin_stats;
CREATE OR REPLACE VIEW public.expression_besoin_stats AS
SELECT
  exercice,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillon,
  COUNT(*) FILTER (WHERE statut = 'soumis') AS soumis,
  COUNT(*) FILTER (WHERE statut = 'visa_cb') AS visa_cb,
  COUNT(*) FILTER (WHERE statut = 'visa_daaf') AS visa_daaf,
  COUNT(*) FILTER (WHERE statut = 'valide') AS valide,
  COUNT(*) FILTER (WHERE statut = 'rejete') AS rejete,
  COUNT(*) FILTER (WHERE statut = 'differe') AS differe,
  COUNT(*) FILTER (WHERE statut = 'satisfaite') AS satisfaite
FROM public.expressions_besoin
GROUP BY exercice;

-- =============================================
-- 7. Index on statut
-- =============================================

CREATE INDEX IF NOT EXISTS idx_expressions_besoin_statut ON public.expressions_besoin(statut);

ANALYZE public.expressions_besoin;

COMMIT;
