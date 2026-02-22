-- ===========================================================================
-- Prompt 7 BACKEND : Visa DAAF/DG, impact budget (déjà géré), audit, notifications
-- Table : budget_liquidations
-- Date : 20 février 2026
-- ===========================================================================
-- Colonnes ajoutées : visa_daaf_user_id, visa_daaf_date, visa_daaf_commentaire,
--   visa_dg_user_id, visa_dg_date, visa_dg_commentaire, motif_rejet
-- Trigger ajouté : trg_audit_liquidation_visa (AFTER UPDATE OF statut)
-- Trigger ajouté : trg_notify_liquidation_workflow (AFTER UPDATE OF statut)
-- Impact budget : DÉJÀ géré par trg_recalc_elop_liquidations
--   → _recalculate_single_budget_line() calcule total_liquide
--     = SUM(budget_liquidations.montant) WHERE statut = 'valide'
-- ===========================================================================

-- ============================================================================
-- 1. Colonnes visa DAAF et DG sur budget_liquidations
--    Note : les colonnes validated_by, validated_at, rejected_by, rejected_at,
--    rejection_reason existent déjà (usage générique).
--    On ajoute des colonnes dédiées DAAF/DG pour traçabilité fine.
-- ============================================================================
ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS visa_daaf_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_daaf_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_daaf_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS visa_dg_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_dg_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_dg_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS motif_rejet TEXT;

COMMENT ON COLUMN budget_liquidations.visa_daaf_user_id IS 'UUID du DAAF ayant visé la liquidation';
COMMENT ON COLUMN budget_liquidations.visa_daaf_date IS 'Date du visa DAAF';
COMMENT ON COLUMN budget_liquidations.visa_daaf_commentaire IS 'Commentaire du DAAF lors du visa';
COMMENT ON COLUMN budget_liquidations.visa_dg_user_id IS 'UUID du DG ayant validé la liquidation';
COMMENT ON COLUMN budget_liquidations.visa_dg_date IS 'Date du visa DG';
COMMENT ON COLUMN budget_liquidations.visa_dg_commentaire IS 'Commentaire du DG lors de la validation';
COMMENT ON COLUMN budget_liquidations.motif_rejet IS 'Motif de rejet (complète rejection_reason existant)';

-- Index partiels sur les FK visa
CREATE INDEX IF NOT EXISTS idx_liquidations_visa_daaf
  ON budget_liquidations(visa_daaf_user_id)
  WHERE visa_daaf_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_liquidations_visa_dg
  ON budget_liquidations(visa_dg_user_id)
  WHERE visa_dg_user_id IS NOT NULL;


-- ============================================================================
-- 2. IMPACT BUDGET (P0)
--    ► DÉJÀ GÉRÉ par le trigger existant trg_recalc_elop_liquidations
--    qui appelle recalculate_budget_line_totals() → _recalculate_single_budget_line()
--
--    _recalculate_single_budget_line() fait :
--      SELECT COALESCE(SUM(bl.montant), 0) INTO v_total_liquide
--        FROM budget_liquidations bl
--        JOIN budget_engagements be ON be.id = bl.engagement_id
--        WHERE be.budget_line_id = p_budget_line_id AND bl.statut = 'valide';
--
--    Puis :
--      UPDATE budget_lines SET total_liquide = v_total_liquide ...
--
--    Ce trigger fire AFTER INSERT/UPDATE/DELETE sur budget_liquidations.
--    → Quand statut passe à 'valide', le recalcul se fait AUTOMATIQUEMENT.
--    → AUCUNE MODIFICATION nécessaire.
-- ============================================================================


-- ============================================================================
-- 3. Trigger audit log : chaque changement de statut → audit_logs
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_audit_liquidation_visa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  -- Uniquement sur changement de statut
  IF NEW.statut = OLD.statut THEN
    RETURN NEW;
  END IF;

  v_action := 'liquidation_' || NEW.statut;

  -- Déterminer l'utilisateur du visa selon le nouveau statut
  v_user_id := CASE
    WHEN NEW.statut = 'valide' AND NEW.visa_dg_user_id IS NOT NULL
      THEN NEW.visa_dg_user_id
    WHEN NEW.visa_daaf_user_id IS DISTINCT FROM OLD.visa_daaf_user_id
         AND NEW.visa_daaf_user_id IS NOT NULL
      THEN NEW.visa_daaf_user_id
    WHEN NEW.statut = 'rejete'
      THEN COALESCE(NEW.rejected_by, NEW.visa_dg_user_id, NEW.visa_daaf_user_id, auth.uid())
    WHEN NEW.statut = 'certifié_sf'
      THEN NEW.service_fait_certifie_par
    ELSE COALESCE(NEW.validated_by, auth.uid())
  END;

  -- Détails du changement
  v_details := jsonb_build_object(
    'old_statut', OLD.statut,
    'new_statut', NEW.statut,
    'numero', NEW.numero,
    'montant', NEW.montant,
    'net_a_payer', NEW.net_a_payer,
    'engagement_id', NEW.engagement_id
  );

  -- Ajouter motif_rejet si rejet
  IF NEW.statut = 'rejete' THEN
    v_details := v_details || jsonb_build_object(
      'motif_rejet', COALESCE(NEW.motif_rejet, NEW.rejection_reason)
    );
  END IF;

  -- Ajouter commentaires visa si présents
  IF NEW.visa_daaf_commentaire IS DISTINCT FROM OLD.visa_daaf_commentaire
     AND NEW.visa_daaf_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire_daaf', NEW.visa_daaf_commentaire);
  END IF;

  IF NEW.visa_dg_commentaire IS DISTINCT FROM OLD.visa_dg_commentaire
     AND NEW.visa_dg_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire_dg', NEW.visa_dg_commentaire);
  END IF;

  -- INSERT audit_logs
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    v_user_id,
    v_action,
    'budget_liquidations',
    NEW.id,
    jsonb_build_object('statut', OLD.statut),
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_audit_liquidation_visa IS
  'AFTER UPDATE: log chaque changement de statut liquidation dans audit_logs';

-- Supprimer ancien trigger de notification générique s'il existe
DROP TRIGGER IF EXISTS trigger_notify_liquidation_status ON budget_liquidations;

DROP TRIGGER IF EXISTS trg_audit_liquidation_visa ON budget_liquidations;
CREATE TRIGGER trg_audit_liquidation_visa
  AFTER UPDATE OF statut ON budget_liquidations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION fn_audit_liquidation_visa();


-- ============================================================================
-- 4. Trigger notifications workflow liquidation
--    4a. Certification SF → DAAF
--    4b. Validation finale (valide) → Créateur + Trésorerie
--    4c. Rejet → Créateur + Direction
--    4d. Si urgent ET validé → DMG + Directeurs (exigence TOURE)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_notify_liquidation_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_recipient RECORD;
  v_creator_id UUID;
  v_engagement_numero TEXT;
BEGIN
  -- Pas de changement de statut → rien
  IF NEW.statut = OLD.statut THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom du validateur
  SELECT COALESCE(full_name, first_name || ' ' || last_name, 'Utilisateur')
  INTO v_user_name
  FROM profiles
  WHERE id = COALESCE(
    NEW.validated_by,
    NEW.visa_dg_user_id,
    NEW.visa_daaf_user_id,
    NEW.service_fait_certifie_par,
    auth.uid()
  );

  v_creator_id := NEW.created_by;

  -- Récupérer le numéro d'engagement
  SELECT numero INTO v_engagement_numero
  FROM budget_engagements WHERE id = NEW.engagement_id;

  -- ==== 4a. certifié_sf → DAAF ====
  IF NEW.statut = 'certifié_sf' THEN
    FOR v_recipient IN
      SELECT p.id FROM profiles p
      WHERE p.role_hierarchique IN ('DAAF', 'DMG')
        AND p.id != COALESCE(NEW.service_fait_certifie_par, auth.uid())
    LOOP
      INSERT INTO notifications (
        user_id, type, title, message,
        entity_type, entity_id, category
      ) VALUES (
        v_recipient.id,
        'liquidation_certifiee_sf',
        'Service fait certifié — ' || NEW.numero,
        'La liquidation n° ' || NEW.numero
          || ' (engagement ' || COALESCE(v_engagement_numero, '?')
          || ') a été certifiée service fait. Montant: '
          || TO_CHAR(COALESCE(NEW.net_a_payer, NEW.montant), 'FM999 999 999')
          || ' FCFA',
        'budget_liquidations',
        NEW.id,
        'workflow'
      );
    END LOOP;
  END IF;

  -- ==== 4b. valide → Créateur + Trésorerie ====
  IF NEW.statut = 'valide' THEN
    -- Notifier le créateur
    IF v_creator_id IS NOT NULL
       AND v_creator_id != COALESCE(NEW.visa_dg_user_id, NEW.validated_by, auth.uid())
    THEN
      INSERT INTO notifications (
        user_id, type, title, message,
        entity_type, entity_id, category
      ) VALUES (
        v_creator_id,
        'liquidation_validee',
        'Liquidation validée — ' || NEW.numero,
        'Votre liquidation n° ' || NEW.numero
          || ' a été validée par ' || v_user_name
          || '. Net à payer: '
          || TO_CHAR(COALESCE(NEW.net_a_payer, NEW.montant), 'FM999 999 999')
          || ' FCFA',
        'budget_liquidations',
        NEW.id,
        'workflow'
      );
    END IF;

    -- Notifier Trésorerie
    FOR v_recipient IN
      SELECT p.id FROM profiles p
      WHERE p.role_hierarchique IN ('Tresorier', 'DMG')
        AND p.id != COALESCE(NEW.visa_dg_user_id, NEW.validated_by, auth.uid())
    LOOP
      INSERT INTO notifications (
        user_id, type, title, message,
        entity_type, entity_id, category
      ) VALUES (
        v_recipient.id,
        'liquidation_validee',
        'Liquidation validée — ' || NEW.numero,
        'La liquidation n° ' || NEW.numero
          || ' a été validée. Net à payer: '
          || TO_CHAR(COALESCE(NEW.net_a_payer, NEW.montant), 'FM999 999 999')
          || ' FCFA.'
          || CASE WHEN NEW.reglement_urgent THEN ' ⚡ URGENT' ELSE '' END,
        'budget_liquidations',
        NEW.id,
        'workflow'
      );
    END LOOP;

    -- ==== 4d. Si urgent ET validé → DMG + Directeurs (exigence TOURE) ====
    IF COALESCE(NEW.reglement_urgent, false) = true THEN
      FOR v_recipient IN
        SELECT p.id FROM profiles p
        WHERE p.role_hierarchique IN ('DMG', 'Directeur', 'DG')
          AND p.id != COALESCE(NEW.visa_dg_user_id, NEW.validated_by, auth.uid())
      LOOP
        INSERT INTO notifications (
          user_id, type, title, message,
          entity_type, entity_id, category, is_urgent
        ) VALUES (
          v_recipient.id,
          'liquidation_urgente_validee',
          'Liquidation urgente validée — ' || NEW.numero,
          'La liquidation urgente n° ' || NEW.numero
            || ' est validée. Net à payer: '
            || TO_CHAR(COALESCE(NEW.net_a_payer, NEW.montant), 'FM999 999 999')
            || ' FCFA. Motif urgence: '
            || COALESCE(NEW.reglement_urgent_motif, 'Non précisé'),
          'budget_liquidations',
          NEW.id,
          'workflow',
          true
        );
      END LOOP;
    END IF;
  END IF;

  -- ==== 4c. rejete → Créateur + Direction ====
  IF NEW.statut = 'rejete' THEN
    -- Notifier le créateur
    IF v_creator_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message,
        entity_type, entity_id, category
      ) VALUES (
        v_creator_id,
        'liquidation_rejetee',
        'Liquidation rejetée — ' || NEW.numero,
        'Votre liquidation n° ' || NEW.numero
          || ' a été rejetée par ' || v_user_name
          || '. Motif: '
          || COALESCE(NEW.motif_rejet, NEW.rejection_reason, 'Non précisé'),
        'budget_liquidations',
        NEW.id,
        'workflow'
      );
    END IF;

    -- Notifier la Direction + Trésorerie
    FOR v_recipient IN
      SELECT p.id FROM profiles p
      WHERE p.role_hierarchique IN ('Directeur', 'DMG', 'DAAF', 'Tresorier')
        AND p.id != COALESCE(NEW.rejected_by, auth.uid())
        AND p.id != v_creator_id
    LOOP
      INSERT INTO notifications (
        user_id, type, title, message,
        entity_type, entity_id, category
      ) VALUES (
        v_recipient.id,
        'liquidation_rejetee',
        'Liquidation rejetée — ' || NEW.numero,
        'La liquidation n° ' || NEW.numero
          || ' a été rejetée. Motif: '
          || COALESCE(NEW.motif_rejet, NEW.rejection_reason, 'Non précisé'),
        'budget_liquidations',
        NEW.id,
        'workflow'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_notify_liquidation_workflow IS
  'AFTER UPDATE: notifications workflow liquidation (SF→DAAF, valide→créateur+trésorerie, rejet→créateur+direction, urgent→DMG+directeurs)';

DROP TRIGGER IF EXISTS trg_notify_liquidation_workflow ON budget_liquidations;
CREATE TRIGGER trg_notify_liquidation_workflow
  AFTER UPDATE OF statut ON budget_liquidations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION fn_notify_liquidation_workflow();
