-- ============================================================================
-- Prompt 8 BACKEND: Degagement
-- 1. Colonnes: montant_degage, motif_degagement, date_degagement, degagement_user_id
-- 2. Contrainte: montant_degage <= montant ET >= 0
-- 3. Trigger: recalcul budget_lines via _recalculate_single_budget_line modifie
-- 4. Audit log: chaque degagement trace dans audit_logs + budget_history
-- Date: 2026-02-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Colonnes degagement sur budget_engagements
-- ============================================================================
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS montant_degage NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motif_degagement TEXT,
  ADD COLUMN IF NOT EXISTS date_degagement TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS degagement_user_id UUID REFERENCES profiles(id);

-- Index sur la FK degagement_user_id
CREATE INDEX IF NOT EXISTS idx_engagements_degagement_user
  ON budget_engagements(degagement_user_id)
  WHERE degagement_user_id IS NOT NULL;

-- ============================================================================
-- 2. Contrainte: montant_degage >= 0 ET montant_degage <= montant
-- ============================================================================
ALTER TABLE budget_engagements
  DROP CONSTRAINT IF EXISTS chk_montant_degage_range;
ALTER TABLE budget_engagements
  ADD CONSTRAINT chk_montant_degage_range
    CHECK (COALESCE(montant_degage, 0) >= 0 AND COALESCE(montant_degage, 0) <= montant);

-- ============================================================================
-- 3. Modifier _recalculate_single_budget_line pour prendre en compte montant_degage
--    total_engage = SUM(montant - COALESCE(montant_degage, 0)) au lieu de SUM(montant)
-- ============================================================================
CREATE OR REPLACE FUNCTION _recalculate_single_budget_line(p_budget_line_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_engage NUMERIC;
  v_total_liquide NUMERIC;
  v_total_ordonnance NUMERIC;
  v_total_paye NUMERIC;
  v_virements_recus NUMERIC;
  v_virements_emis NUMERIC;
  v_dotation_initiale NUMERIC;
  v_dotation_modifiee NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Total engage (engagements valides, NET DES DEGAGEMENTS)
  SELECT COALESCE(SUM(montant - COALESCE(montant_degage, 0)), 0) INTO v_total_engage
    FROM budget_engagements
    WHERE budget_line_id = p_budget_line_id AND statut = 'valide';

  -- Total liquide (liquidations validees, via engagement)
  SELECT COALESCE(SUM(bl.montant), 0) INTO v_total_liquide
    FROM budget_liquidations bl
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND bl.statut = 'valide';

  -- Total ordonnance (ordonnancements valides/signes)
  SELECT COALESCE(SUM(o.montant), 0) INTO v_total_ordonnance
    FROM ordonnancements o
    JOIN budget_liquidations bl ON bl.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND o.statut IN ('valide', 'signe');

  -- Total paye (reglements payes/valides/confirmes)
  SELECT COALESCE(SUM(r.montant), 0) INTO v_total_paye
    FROM reglements r
    JOIN ordonnancements o ON o.id = r.ordonnancement_id
    JOIN budget_liquidations bl ON bl.id = o.liquidation_id
    JOIN budget_engagements be ON be.id = bl.engagement_id
    WHERE be.budget_line_id = p_budget_line_id AND r.statut IN ('paye', 'valide', 'confirme');

  -- Virements recus
  SELECT COALESCE(SUM(amount), 0) INTO v_virements_recus
    FROM credit_transfers
    WHERE to_budget_line_id = p_budget_line_id AND status = 'execute';

  -- Virements emis
  SELECT COALESCE(SUM(amount), 0) INTO v_virements_emis
    FROM credit_transfers
    WHERE from_budget_line_id = p_budget_line_id AND status = 'execute';

  -- Get dotation_initiale
  SELECT dotation_initiale INTO v_dotation_initiale
    FROM budget_lines WHERE id = p_budget_line_id;

  -- Dotation modifiee = initiale + virements nets
  v_dotation_modifiee := COALESCE(v_dotation_initiale, 0) + v_virements_recus - v_virements_emis;

  -- Disponible = dotation modifiee - engage
  v_disponible := v_dotation_modifiee - v_total_engage;

  -- Update budget_lines
  UPDATE budget_lines SET
    total_engage = v_total_engage,
    total_liquide = v_total_liquide,
    total_ordonnance = v_total_ordonnance,
    total_paye = v_total_paye,
    dotation_modifiee = v_dotation_modifiee,
    disponible_calcule = v_disponible,
    updated_at = NOW()
  WHERE id = p_budget_line_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Modifier fn_update_engagement_rate pour prendre en compte montant_degage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_engagement_rate()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line RECORD;
  v_total_engage NUMERIC;
  v_taux_engagement NUMERIC;
  v_dotation_actuelle NUMERIC;
BEGIN
  -- Recalculer total_engage quand un engagement est valide, rejete ou annule
  IF (NEW.statut IN ('valide', 'rejete', 'annule'))
     AND (OLD.statut IS DISTINCT FROM NEW.statut)
  THEN
    -- Calculer le total engage valide sur la ligne (NET DES DEGAGEMENTS)
    SELECT COALESCE(SUM(montant - COALESCE(montant_degage, 0)), 0) INTO v_total_engage
    FROM public.budget_engagements
    WHERE budget_line_id = NEW.budget_line_id
      AND statut = 'valide'
      AND exercice = NEW.exercice;

    -- Recuperer la dotation de la ligne + virements
    SELECT
      COALESCE(bl.dotation_initiale, 0)
        + COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.to_budget_line_id = bl.id AND ct.status = 'execute'), 0)
        - COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.from_budget_line_id = bl.id AND ct.status = 'execute'), 0)
      AS dotation_actuelle
    INTO v_dotation_actuelle
    FROM public.budget_lines bl
    WHERE bl.id = NEW.budget_line_id;

    -- Calculer le taux
    IF v_dotation_actuelle > 0 THEN
      v_taux_engagement := (v_total_engage / v_dotation_actuelle) * 100;
    ELSE
      v_taux_engagement := 0;
    END IF;

    -- Mettre a jour la ligne budgetaire
    UPDATE public.budget_lines
    SET total_engage = v_total_engage,
        updated_at = now()
    WHERE id = NEW.budget_line_id;

    -- Actions specifiques a la validation
    IF NEW.statut = 'valide' THEN
      -- Mettre a jour le dossier si lie
      IF NEW.dossier_id IS NOT NULL THEN
        UPDATE public.dossiers
        SET etape_courante = 'engagement_valide',
            montant_engage = NEW.montant,
            updated_at = now()
        WHERE id = NEW.dossier_id;

        -- Mettre a jour l'etape dans dossier_etapes
        UPDATE public.dossier_etapes
        SET statut = 'valide',
            validated_at = now()
        WHERE dossier_id = NEW.dossier_id
          AND type_etape = 'engagement'
          AND ref_id = NEW.id;

        -- Creer l'entree pour l'etape Liquidation
        INSERT INTO public.dossier_etapes (
          dossier_id, type_etape, montant, statut
        ) VALUES (
          NEW.dossier_id, 'liquidation', NEW.montant, 'en_attente'
        ) ON CONFLICT DO NOTHING;
      END IF;

      -- Log dans budget_history
      INSERT INTO public.budget_history (
        budget_line_id, event_type, delta,
        ref_id, ref_code, commentaire, created_by
      ) VALUES (
        NEW.budget_line_id, 'engagement_valide', NEW.montant,
        NEW.id, NEW.numero, 'Engagement valide', NEW.created_by
      );

      -- Creer une tache workflow pour la liquidation
      INSERT INTO public.workflow_tasks (
        task_type, entity_type, entity_id,
        title, description, owner_role, status, priority, dossier_id
      ) VALUES (
        'liquidation', 'engagement', NEW.id,
        'Creer la liquidation pour ' || NEW.numero,
        'L''engagement a ete valide. Proceder a la liquidation apres service fait.',
        'SAF', 'pending', 'high', NEW.dossier_id
      );

      -- Generer une alerte si taux d'engagement > 80%
      IF v_taux_engagement >= 80 THEN
        INSERT INTO public.alerts (
          type, severity, title, description,
          module, entity_table, entity_id, owner_role
        ) VALUES (
          'budget_threshold',
          CASE WHEN v_taux_engagement >= 100 THEN 'critical' ELSE 'warning' END,
          'Taux d''engagement eleve',
          'La ligne ' || (SELECT code FROM public.budget_lines WHERE id = NEW.budget_line_id) ||
          ' a atteint ' || ROUND(v_taux_engagement, 1) || '% d''engagement.',
          'budget', 'budget_lines', NEW.budget_line_id, 'CB'
        );
      END IF;
    END IF;

    -- Actions specifiques au rejet/annulation (liberation de credits)
    IF NEW.statut IN ('rejete', 'annule') AND OLD.statut = 'valide' THEN
      -- Log la liberation dans budget_history
      INSERT INTO public.budget_history (
        budget_line_id, event_type, delta,
        ref_id, ref_code, commentaire, created_by
      ) VALUES (
        NEW.budget_line_id,
        CASE WHEN NEW.statut = 'rejete' THEN 'engagement_rejete' ELSE 'engagement_annule' END,
        -NEW.montant,
        NEW.id, NEW.numero,
        CASE WHEN NEW.statut = 'rejete' THEN 'Engagement rejete - credits liberes' ELSE 'Engagement annule - credits liberes' END,
        NEW.created_by
      );

      -- Mettre a jour le dossier si lie
      IF NEW.dossier_id IS NOT NULL THEN
        UPDATE public.dossiers
        SET montant_engage = GREATEST(0, COALESCE(montant_engage, 0) - NEW.montant),
            updated_at = now()
        WHERE id = NEW.dossier_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 5. Modifier fn_check_engagement_credits pour prendre en compte montant_degage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_check_engagement_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dotation NUMERIC;
  v_total_engage NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Controle uniquement lors du passage a 'valide'
  IF NEW.statut = 'valide' AND OLD.statut IS DISTINCT FROM 'valide' THEN

    -- Recuperer dotation actuelle
    SELECT COALESCE(bl.dotation_modifiee, bl.dotation_initiale)
    INTO v_dotation
    FROM budget_lines bl
    WHERE bl.id = NEW.budget_line_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ligne budgetaire % introuvable', NEW.budget_line_id;
    END IF;

    -- Calculer total engage valide HORS cet engagement (NET DES DEGAGEMENTS)
    SELECT COALESCE(SUM(montant - COALESCE(montant_degage, 0)), 0)
    INTO v_total_engage
    FROM budget_engagements
    WHERE budget_line_id = NEW.budget_line_id
      AND statut = 'valide'
      AND id != NEW.id;

    v_disponible := v_dotation - v_total_engage;

    -- Verifier credits suffisants
    IF v_disponible < NEW.montant THEN
      RAISE EXCEPTION 'Credits insuffisants: disponible = % FCFA, montant engagement = % FCFA (ligne %)',
        v_disponible, NEW.montant,
        (SELECT code FROM budget_lines WHERE id = NEW.budget_line_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. Trigger audit degagement
--    Trace chaque modification de montant_degage dans audit_logs + budget_history
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_audit_degagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta NUMERIC;
BEGIN
  -- Uniquement si montant_degage a change et le nouveau montant > 0
  IF COALESCE(NEW.montant_degage, 0) IS DISTINCT FROM COALESCE(OLD.montant_degage, 0)
     AND COALESCE(NEW.montant_degage, 0) > 0
  THEN
    v_delta := COALESCE(NEW.montant_degage, 0) - COALESCE(OLD.montant_degage, 0);

    -- Audit log
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id,
      old_values, new_values, exercice
    ) VALUES (
      NEW.degagement_user_id,
      'engagement_degagement',
      'budget_engagements',
      NEW.id,
      jsonb_build_object(
        'montant_degage', COALESCE(OLD.montant_degage, 0),
        'statut', OLD.statut
      ),
      jsonb_build_object(
        'montant_degage', NEW.montant_degage,
        'motif_degagement', NEW.motif_degagement,
        'numero', NEW.numero,
        'montant', NEW.montant,
        'budget_line_id', NEW.budget_line_id,
        'delta', v_delta
      ),
      NEW.exercice
    );

    -- Budget history
    INSERT INTO budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      NEW.budget_line_id,
      'degagement',
      -v_delta,  -- Negatif car c'est une liberation de credits
      NEW.id,
      NEW.numero,
      'Degagement de ' || v_delta || ' FCFA' ||
        CASE WHEN NEW.motif_degagement IS NOT NULL
          THEN ' - ' || NEW.motif_degagement
          ELSE ''
        END,
      NEW.degagement_user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_audit_degagement IS
  'AFTER UPDATE: trace chaque degagement dans audit_logs et budget_history.';

DROP TRIGGER IF EXISTS trg_audit_degagement ON budget_engagements;
CREATE TRIGGER trg_audit_degagement
  AFTER UPDATE ON budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_degagement();

-- ============================================================================
-- 7. Backfill: recalculer toutes les lignes actives avec la nouvelle formule
-- ============================================================================
DO $$
DECLARE
  v_line_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_line_id IN
    SELECT id FROM budget_lines WHERE is_active = true
  LOOP
    PERFORM _recalculate_single_budget_line(v_line_id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Backfill degagement: recalculated % budget lines', v_count;
END $$;

COMMIT;
