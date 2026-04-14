-- =============================================================================
-- P1 — Robustesse et intégrité du module Règlement (2026-04-07)
-- =============================================================================
-- Objectifs :
--   1. Empêcher tout surpaiement au niveau DB (trigger BEFORE + verrou ligne)
--   2. Synchroniser automatiquement ordonnancements.montant_paye / is_locked
--      (élimine la maintenance manuelle dans useReglements — race condition)
--   3. Trail d'audit immuable de TOUTES les mutations reglements
--      (snapshot OLD/NEW, écrit uniquement par trigger SECURITY DEFINER)
--
-- Conformité : RGCP, OHADA, IPSAS, UEMOA
--   - La séparation Ordonnateur/Comptable (règle d'or) exige que :
--       * le comptable public (Trésorier) ne puisse JAMAIS payer au-delà du
--         montant ordonnancé (principe d'exactitude comptable)
--       * toute opération de trésorerie soit traçable de façon non-répudiable
-- =============================================================================

-- =============================================================================
-- 1. TRIGGER ANTI-SURPAIEMENT (P1.1)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_reglement_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ord_montant    numeric;
  v_sum_existing   numeric;
  v_new_total      numeric;
BEGIN
  -- Un règlement rejeté n'impacte pas le cumul — on laisse passer.
  IF COALESCE(NEW.statut, 'soumis') = 'rejete' THEN
    RETURN NEW;
  END IF;

  -- Verrou sur la ligne ordonnancement pour sérialiser les INSERT concurrents
  -- (deux trésoriers qui tentent simultanément de payer le même ordonnancement).
  SELECT montant
    INTO v_ord_montant
    FROM public.ordonnancements
   WHERE id = NEW.ordonnancement_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordonnancement % introuvable', NEW.ordonnancement_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Cumul des règlements non rejetés hors la ligne en cours (cas UPDATE)
  SELECT COALESCE(SUM(montant), 0)
    INTO v_sum_existing
    FROM public.reglements
   WHERE ordonnancement_id = NEW.ordonnancement_id
     AND statut <> 'rejete'
     AND (TG_OP = 'INSERT' OR id <> NEW.id);

  v_new_total := v_sum_existing + NEW.montant;

  IF v_new_total > v_ord_montant THEN
    RAISE EXCEPTION
      'Surpaiement interdit : ordonnancement=% FCFA, déjà réglé=% FCFA, tentative=+% FCFA (total=% FCFA)',
      v_ord_montant, v_sum_existing, NEW.montant, v_new_total
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_reglement_integrity() IS
  'P1.1 — Trigger BEFORE INSERT/UPDATE : empêche tout surpaiement d''un ordonnancement. Verrou FOR UPDATE pour sérialiser.';

DROP TRIGGER IF EXISTS enforce_reglement_integrity_trg ON public.reglements;

CREATE TRIGGER enforce_reglement_integrity_trg
  BEFORE INSERT OR UPDATE OF montant, statut, ordonnancement_id
  ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_reglement_integrity();

-- =============================================================================
-- 2. TRIGGER AUTO-SYNC montant_paye / is_locked (P1.2)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_ordonnancement_montant_paye()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_new_ord_id  uuid;
  v_old_ord_id  uuid;
  v_total       numeric;
BEGIN
  v_new_ord_id := CASE WHEN TG_OP <> 'DELETE' THEN NEW.ordonnancement_id END;
  v_old_ord_id := CASE WHEN TG_OP <> 'INSERT' THEN OLD.ordonnancement_id END;

  -- Recalcule pour le nouvel ordonnancement
  IF v_new_ord_id IS NOT NULL THEN
    SELECT COALESCE(SUM(montant), 0)
      INTO v_total
      FROM public.reglements
     WHERE ordonnancement_id = v_new_ord_id
       AND statut <> 'rejete';

    UPDATE public.ordonnancements
       SET montant_paye = v_total,
           is_locked    = (v_total > 0),
           updated_at   = now()
     WHERE id = v_new_ord_id;
  END IF;

  -- Si UPDATE avec changement d'ordonnancement_id, recalcule aussi l'ancien
  IF v_old_ord_id IS NOT NULL AND v_old_ord_id IS DISTINCT FROM v_new_ord_id THEN
    SELECT COALESCE(SUM(montant), 0)
      INTO v_total
      FROM public.reglements
     WHERE ordonnancement_id = v_old_ord_id
       AND statut <> 'rejete';

    UPDATE public.ordonnancements
       SET montant_paye = v_total,
           is_locked    = (v_total > 0),
           updated_at   = now()
     WHERE id = v_old_ord_id;
  END IF;

  RETURN NULL; -- AFTER trigger, valeur ignorée
END;
$$;

COMMENT ON FUNCTION public.sync_ordonnancement_montant_paye() IS
  'P1.2 — Trigger AFTER INSERT/UPDATE/DELETE : recalcule atomiquement ordonnancements.montant_paye + is_locked. Remplace la maintenance manuelle dans useReglements.';

DROP TRIGGER IF EXISTS sync_ordonnancement_montant_paye_trg ON public.reglements;

CREATE TRIGGER sync_ordonnancement_montant_paye_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ordonnancement_montant_paye();

-- =============================================================================
-- 3. AUDIT TRAIL IMMUABLE (P1.3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reglements_audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reglement_id uuid        NOT NULL,
  action       text        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data     jsonb,
  new_data     jsonb,
  changed_by   uuid        REFERENCES auth.users(id),
  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reglements_audit_log_reglement
  ON public.reglements_audit_log (reglement_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_reglements_audit_log_changed_at
  ON public.reglements_audit_log (changed_at DESC);

COMMENT ON TABLE public.reglements_audit_log IS
  'P1.3 — Trail d''audit immuable des mutations sur reglements. Écrit exclusivement par trigger SECURITY DEFINER. Aucune policy INSERT/UPDATE/DELETE ⇒ lecture seule pour les users.';

-- RLS : lecture pour ADMIN, AUDITOR, TRESORERIE, DG, DAAF — aucune écriture autorisée
ALTER TABLE public.reglements_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reglements_audit_select ON public.reglements_audit_log;
CREATE POLICY reglements_audit_select
  ON public.reglements_audit_log
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'AUDITOR'::app_role)
    OR has_role(auth.uid(), 'TRESORERIE'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

-- Pas de policy INSERT/UPDATE/DELETE ⇒ seul le trigger SECURITY DEFINER peut écrire.

-- Fonction de log
CREATE OR REPLACE FUNCTION public.log_reglement_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reglements_audit_log (
    reglement_id,
    action,
    old_data,
    new_data,
    changed_by
  )
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.log_reglement_audit() IS
  'P1.3 — Snapshot OLD/NEW de chaque mutation reglements dans reglements_audit_log. SECURITY DEFINER pour bypasser la RLS d''insertion.';

DROP TRIGGER IF EXISTS reglements_audit_trg ON public.reglements;

CREATE TRIGGER reglements_audit_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_reglement_audit();

-- =============================================================================
-- Vérifications post-migration :
--
--   -- 1. Triggers installés
--   SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.reglements'::regclass
--     AND tgname IN (
--       'enforce_reglement_integrity_trg',
--       'sync_ordonnancement_montant_paye_trg',
--       'reglements_audit_trg'
--     );
--   -- → 3 lignes
--
--   -- 2. Table audit créée
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name = 'reglements_audit_log';
--   -- → 1 ligne
--
--   -- 3. RLS strictement SELECT sur audit_log
--   SELECT policyname, cmd FROM pg_policies
--   WHERE tablename = 'reglements_audit_log';
--   -- → 1 ligne (SELECT uniquement)
-- =============================================================================
