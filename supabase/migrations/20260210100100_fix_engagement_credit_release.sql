-- =====================================================
-- MIGRATION: Liberer les credits quand un engagement est rejete ou annule
-- =====================================================
-- Le trigger fn_update_engagement_rate ne gerait que le cas
-- statut -> 'valide'. Il faut aussi gerer:
-- - rejete: recalculer total_engage (exclure l'engagement rejete)
-- - annule: recalculer total_engage (exclure l'engagement annule)
-- =====================================================

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
    -- Calculer le total engage valide sur la ligne
    SELECT COALESCE(SUM(montant), 0) INTO v_total_engage
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

-- Recreate the trigger (same definition, updated function)
DROP TRIGGER IF EXISTS trg_update_engagement_rate ON public.budget_engagements;
CREATE TRIGGER trg_update_engagement_rate
AFTER UPDATE ON public.budget_engagements
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_engagement_rate();

COMMENT ON FUNCTION public.fn_update_engagement_rate IS
  'Met a jour total_engage sur budget_lines lors de la validation, rejet ou annulation d''un engagement. Libere les credits en cas de rejet/annulation.';
