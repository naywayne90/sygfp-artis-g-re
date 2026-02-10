-- =====================================================
-- MIGRATION: Ajouter triggers MAJ total_liquide et total_ordonnance
-- =====================================================
-- BUG: Les colonnes total_liquide et total_ordonnance sur budget_lines
-- ne sont jamais mises a jour, rendant les KPIs d'execution a zero.
--
-- Correction:
-- 1. Trigger sur budget_liquidations: MAJ total_liquide a la validation
-- 2. Trigger sur ordonnancements: MAJ total_ordonnance a la validation
-- 3. Les deux triggers gerent aussi le rejet/annulation (liberation)
-- Note: total_paye est deja gere par update_budget_and_close_dossier_on_reglement
-- =====================================================

-- =====================================================
-- 1. TRIGGER: MAJ total_liquide sur budget_lines
--    Se declenche quand une liquidation passe a valide/rejete/annule
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_update_total_liquide()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line_id UUID;
  v_total_liquide NUMERIC;
BEGIN
  -- Recalculer seulement quand le statut change vers valide, rejete ou annule
  IF (NEW.statut IN ('valide', 'rejete', 'annule'))
     AND (OLD.statut IS DISTINCT FROM NEW.statut)
  THEN
    -- Trouver la ligne budgetaire via l'engagement
    SELECT be.budget_line_id INTO v_budget_line_id
    FROM public.budget_engagements be
    WHERE be.id = NEW.engagement_id;

    IF v_budget_line_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Recalculer le total liquide (somme des liquidations validees)
    SELECT COALESCE(SUM(bl_liq.montant), 0) INTO v_total_liquide
    FROM public.budget_liquidations bl_liq
      JOIN public.budget_engagements be ON bl_liq.engagement_id = be.id
    WHERE be.budget_line_id = v_budget_line_id
      AND bl_liq.statut = 'valide'
      AND be.exercice = NEW.exercice;

    -- Mettre a jour budget_lines.total_liquide
    UPDATE public.budget_lines
    SET total_liquide = v_total_liquide,
        updated_at = now()
    WHERE id = v_budget_line_id;

    -- Log dans budget_history
    INSERT INTO public.budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      v_budget_line_id,
      CASE
        WHEN NEW.statut = 'valide' THEN 'liquidation_validee'
        WHEN NEW.statut = 'rejete' THEN 'liquidation_rejetee'
        ELSE 'liquidation_annulee'
      END,
      CASE
        WHEN NEW.statut = 'valide' THEN NEW.montant
        ELSE -NEW.montant
      END,
      NEW.id, NEW.numero,
      CASE
        WHEN NEW.statut = 'valide' THEN 'Liquidation validee'
        WHEN NEW.statut = 'rejete' THEN 'Liquidation rejetee - credits liberes'
        ELSE 'Liquidation annulee - credits liberes'
      END,
      NEW.validated_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_total_liquide ON public.budget_liquidations;
CREATE TRIGGER trg_update_total_liquide
AFTER UPDATE ON public.budget_liquidations
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_total_liquide();

COMMENT ON FUNCTION public.fn_update_total_liquide IS
  'Met a jour budget_lines.total_liquide lors de la validation/rejet/annulation d''une liquidation.';

-- =====================================================
-- 2. TRIGGER: MAJ total_ordonnance sur budget_lines
--    Se declenche quand un ordonnancement passe a valide/rejete/annule
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_update_total_ordonnance()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line_id UUID;
  v_total_ordonnance NUMERIC;
BEGIN
  -- Recalculer seulement quand le statut change vers valide, rejete ou annule
  IF (NEW.statut IN ('valide', 'rejete', 'annule'))
     AND (OLD.statut IS DISTINCT FROM NEW.statut)
  THEN
    -- Trouver la ligne budgetaire via liquidation -> engagement
    SELECT be.budget_line_id INTO v_budget_line_id
    FROM public.budget_engagements be
      JOIN public.budget_liquidations bl_liq ON bl_liq.engagement_id = be.id
    WHERE bl_liq.id = NEW.liquidation_id;

    IF v_budget_line_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Recalculer le total ordonnance (somme des ordonnancements valides)
    SELECT COALESCE(SUM(o.montant), 0) INTO v_total_ordonnance
    FROM public.ordonnancements o
      JOIN public.budget_liquidations bl_liq ON o.liquidation_id = bl_liq.id
      JOIN public.budget_engagements be ON bl_liq.engagement_id = be.id
    WHERE be.budget_line_id = v_budget_line_id
      AND o.statut = 'valide'
      AND o.exercice = NEW.exercice;

    -- Mettre a jour budget_lines.total_ordonnance
    UPDATE public.budget_lines
    SET total_ordonnance = v_total_ordonnance,
        updated_at = now()
    WHERE id = v_budget_line_id;

    -- Log dans budget_history
    INSERT INTO public.budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      v_budget_line_id,
      CASE
        WHEN NEW.statut = 'valide' THEN 'ordonnancement_valide'
        WHEN NEW.statut = 'rejete' THEN 'ordonnancement_rejete'
        ELSE 'ordonnancement_annule'
      END,
      CASE
        WHEN NEW.statut = 'valide' THEN NEW.montant
        ELSE -NEW.montant
      END,
      NEW.id, NEW.numero,
      CASE
        WHEN NEW.statut = 'valide' THEN 'Ordonnancement valide'
        WHEN NEW.statut = 'rejete' THEN 'Ordonnancement rejete - credits liberes'
        ELSE 'Ordonnancement annule - credits liberes'
      END,
      NEW.created_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_total_ordonnance ON public.ordonnancements;
CREATE TRIGGER trg_update_total_ordonnance
AFTER UPDATE ON public.ordonnancements
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_total_ordonnance();

COMMENT ON FUNCTION public.fn_update_total_ordonnance IS
  'Met a jour budget_lines.total_ordonnance lors de la validation/rejet/annulation d''un ordonnancement.';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
