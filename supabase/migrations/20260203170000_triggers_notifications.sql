-- =====================================================
-- Migration : Triggers pour Notifications Automatiques
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Objectif : Déclencher notifications automatiques lors des
-- changements de statut (ordonnancement, règlement)
-- =====================================================

-- =====================================================
-- FONCTION HELPER : get_depense_summary
-- Retourne toutes les informations nécessaires pour une notification
-- =====================================================
CREATE OR REPLACE FUNCTION get_depense_summary(p_ordonnancement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
DECLARE
  v_result JSONB;
  v_montant_regle NUMERIC;
  v_montant_restant NUMERIC;
BEGIN
  -- Calculer le montant déjà réglé
  SELECT COALESCE(SUM(r.montant), 0) INTO v_montant_regle
  FROM reglements r
  WHERE r.ordonnancement_id = p_ordonnancement_id
  AND r.statut = 'effectue';

  -- Récupérer les informations de la dépense
  SELECT jsonb_build_object(
    'reference', o.numero,
    'objet', COALESCE(l.objet, e.objet, 'Non spécifié'),
    'fournisseur', COALESCE(f.raison_sociale, f.nom, p.raison_sociale, p.nom, 'Non spécifié'),
    'montant_net', o.montant,
    'montant_formate', TO_CHAR(o.montant, 'FM999 999 999'),
    'montant_deja_regle', v_montant_regle,
    'montant_deja_regle_formate', TO_CHAR(v_montant_regle, 'FM999 999 999'),
    'montant_restant', o.montant - v_montant_regle,
    'montant_restant_formate', TO_CHAR(o.montant - v_montant_regle, 'FM999 999 999'),
    'date_ordonnancement', TO_CHAR(o.date_ordonnancement, 'DD/MM/YYYY'),
    'direction', COALESCE(d.nom, d.code, 'Non spécifiée'),
    'exercice', o.exercice_id::text,
    'ordonnancement_id', o.id
  ) INTO v_result
  FROM ordonnancements o
  LEFT JOIN liquidations l ON l.id = o.liquidation_id
  LEFT JOIN engagements e ON e.id = l.engagement_id
  LEFT JOIN fournisseurs f ON f.id = o.fournisseur_id
  LEFT JOIN prestataires p ON p.id = e.prestataire_id
  LEFT JOIN directions d ON d.id = o.direction_id
  WHERE o.id = p_ordonnancement_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$func$;

-- =====================================================
-- FONCTION HELPER : get_reglement_summary
-- Retourne les informations d'un règlement spécifique
-- =====================================================
CREATE OR REPLACE FUNCTION get_reglement_summary(p_reglement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
DECLARE
  v_result JSONB;
  v_depense_summary JSONB;
  v_ordonnancement_id UUID;
BEGIN
  -- Récupérer l'ordonnancement_id
  SELECT ordonnancement_id INTO v_ordonnancement_id
  FROM reglements WHERE id = p_reglement_id;

  -- Récupérer le résumé de la dépense
  v_depense_summary := get_depense_summary(v_ordonnancement_id);

  -- Ajouter les informations spécifiques au règlement
  SELECT v_depense_summary || jsonb_build_object(
    'reglement_id', r.id,
    'reglement_numero', r.numero,
    'montant_reglement', r.montant,
    'montant_reglement_formate', TO_CHAR(r.montant, 'FM999 999 999'),
    'mode_paiement', COALESCE(r.mode_paiement, 'Non spécifié'),
    'date_reglement', TO_CHAR(r.date_reglement, 'DD/MM/YYYY'),
    'banque', COALESCE(r.banque, 'Non spécifiée'),
    'numero_cheque', r.numero_cheque
  ) INTO v_result
  FROM reglements r
  WHERE r.id = p_reglement_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$func$;

-- =====================================================
-- TRIGGER FUNCTION : Notification à l'ordonnancement
-- Déclenché quand un ordonnancement passe au statut 'signe'
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_notify_ordonnancement_signe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_variables JSONB;
  v_count INTEGER;
BEGIN
  -- Vérifier si le statut passe à 'signe'
  IF NEW.statut = 'signe' AND (OLD.statut IS NULL OR OLD.statut != 'signe') THEN
    -- Récupérer les variables pour la notification
    v_variables := get_depense_summary(NEW.id);

    -- Envoyer les notifications en masse
    v_count := send_bulk_notifications(
      'ordonnancement',
      'ordonnancements',
      NEW.id,
      v_variables
    );

    RAISE NOTICE 'Notifications ordonnancement envoyées: % destinataires', v_count;
  END IF;

  RETURN NEW;
END;
$func$;

-- Créer le trigger sur ordonnancements
DROP TRIGGER IF EXISTS trigger_ordonnancement_signe_notify ON ordonnancements;
CREATE TRIGGER trigger_ordonnancement_signe_notify
AFTER UPDATE OF statut ON ordonnancements
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_ordonnancement_signe();

-- =====================================================
-- TRIGGER FUNCTION : Notification au règlement
-- Déclenché à l'insertion d'un règlement effectué
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_notify_reglement_effectue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_variables JSONB;
  v_type_evenement TEXT;
  v_count INTEGER;
  v_montant_restant NUMERIC;
BEGIN
  -- Vérifier si le règlement est effectué
  IF NEW.statut = 'effectue' THEN
    -- Récupérer les variables pour la notification
    v_variables := get_reglement_summary(NEW.id);

    -- Calculer le montant restant après ce règlement
    v_montant_restant := (v_variables->>'montant_restant')::NUMERIC - NEW.montant;

    -- Mettre à jour les variables avec le nouveau montant restant
    v_variables := v_variables || jsonb_build_object(
      'montant_restant_apres', v_montant_restant,
      'montant_restant_apres_formate', TO_CHAR(v_montant_restant, 'FM999 999 999'),
      'reste_a_payer', TO_CHAR(v_montant_restant, 'FM999 999 999'),
      'montant_regle', TO_CHAR(NEW.montant, 'FM999 999 999'),
      'montant_total', v_variables->>'montant_formate'
    );

    -- Déterminer le type de notification (total ou partiel)
    IF v_montant_restant <= 0 THEN
      v_type_evenement := 'reglement';
    ELSE
      v_type_evenement := 'reglement_partiel';
    END IF;

    -- Envoyer les notifications en masse
    v_count := send_bulk_notifications(
      v_type_evenement,
      'reglements',
      NEW.id,
      v_variables
    );

    RAISE NOTICE 'Notifications règlement (%) envoyées: % destinataires', v_type_evenement, v_count;
  END IF;

  RETURN NEW;
END;
$func$;

-- Créer le trigger sur reglements (INSERT et UPDATE)
DROP TRIGGER IF EXISTS trigger_reglement_effectue_notify ON reglements;
CREATE TRIGGER trigger_reglement_effectue_notify
AFTER INSERT OR UPDATE OF statut ON reglements
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_reglement_effectue();

-- =====================================================
-- TRIGGER FUNCTION : Mise à jour du statut ordonnancement
-- Met à jour le statut de l'ordonnancement quand entièrement réglé
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_update_ordonnancement_statut()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_montant_ordonnancement NUMERIC;
  v_total_regle NUMERIC;
BEGIN
  IF NEW.statut = 'effectue' AND NEW.ordonnancement_id IS NOT NULL THEN
    -- Récupérer le montant de l'ordonnancement
    SELECT montant INTO v_montant_ordonnancement
    FROM ordonnancements WHERE id = NEW.ordonnancement_id;

    -- Calculer le total réglé
    SELECT COALESCE(SUM(montant), 0) INTO v_total_regle
    FROM reglements
    WHERE ordonnancement_id = NEW.ordonnancement_id
    AND statut = 'effectue';

    -- Si entièrement réglé, mettre à jour le statut
    IF v_total_regle >= v_montant_ordonnancement THEN
      UPDATE ordonnancements
      SET statut = 'regle',
          updated_at = NOW()
      WHERE id = NEW.ordonnancement_id
      AND statut != 'regle';
    END IF;
  END IF;

  RETURN NEW;
END;
$func$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_reglement_update_ordonnancement ON reglements;
CREATE TRIGGER trigger_reglement_update_ordonnancement
AFTER INSERT OR UPDATE OF statut, montant ON reglements
FOR EACH ROW
EXECUTE FUNCTION trigger_update_ordonnancement_statut();

-- =====================================================
-- FONCTION : Notifier manuellement (pour tests/admin)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_ordonnancement_manually(p_ordonnancement_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_variables JSONB;
  v_count INTEGER;
BEGIN
  v_variables := get_depense_summary(p_ordonnancement_id);

  v_count := send_bulk_notifications(
    'ordonnancement',
    'ordonnancements',
    p_ordonnancement_id,
    v_variables
  );

  RETURN v_count;
END;
$func$;

CREATE OR REPLACE FUNCTION notify_reglement_manually(p_reglement_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_variables JSONB;
  v_type_evenement TEXT;
  v_count INTEGER;
  v_montant_restant NUMERIC;
BEGIN
  v_variables := get_reglement_summary(p_reglement_id);

  v_montant_restant := (v_variables->>'montant_restant')::NUMERIC;

  IF v_montant_restant <= 0 THEN
    v_type_evenement := 'reglement';
  ELSE
    v_type_evenement := 'reglement_partiel';
  END IF;

  v_count := send_bulk_notifications(
    v_type_evenement,
    'reglements',
    p_reglement_id,
    v_variables
  );

  RETURN v_count;
END;
$func$;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_depense_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_reglement_summary TO authenticated;
GRANT EXECUTE ON FUNCTION notify_ordonnancement_manually TO authenticated;
GRANT EXECUTE ON FUNCTION notify_reglement_manually TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_depense_summary IS 'Retourne le résumé complet d''une dépense (ordonnancement) pour les notifications';
COMMENT ON FUNCTION get_reglement_summary IS 'Retourne le résumé d''un règlement incluant les infos de la dépense';
COMMENT ON FUNCTION trigger_notify_ordonnancement_signe IS 'Trigger: envoie notifications quand ordonnancement passe à signé';
COMMENT ON FUNCTION trigger_notify_reglement_effectue IS 'Trigger: envoie notifications quand règlement effectué (total ou partiel)';
COMMENT ON FUNCTION trigger_update_ordonnancement_statut IS 'Trigger: met à jour statut ordonnancement quand entièrement réglé';
COMMENT ON FUNCTION notify_ordonnancement_manually IS 'Permet d''envoyer manuellement une notification d''ordonnancement';
COMMENT ON FUNCTION notify_reglement_manually IS 'Permet d''envoyer manuellement une notification de règlement';
