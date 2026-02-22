-- ===========================================================================
-- Prompt 6 BACKEND : Certification service fait, Urgence trigger, PJ check
-- Table : budget_liquidations, liquidation_attachments
-- Date : 20 février 2026
-- ===========================================================================
-- Colonnes existantes (certification) : service_fait, service_fait_date,
--   service_fait_certifie_par
-- Colonnes existantes (urgence) : reglement_urgent, reglement_urgent_motif,
--   reglement_urgent_date, reglement_urgent_par
-- Colonne ajoutée : service_fait_commentaire
-- Trigger ajouté : trg_liquidation_urgent_audit (AFTER UPDATE)
-- Contrainte ajoutée : chk_document_type sur liquidation_attachments
-- RPC modifiée : mark_liquidation_urgent (retrait INSERT notifications doublon)
-- ===========================================================================

-- ============================================================================
-- 1. Colonne certification manquante : service_fait_commentaire
--    Les autres colonnes existent déjà :
--      service_fait (BOOLEAN DEFAULT false) = service_fait_certifie du spec
--      service_fait_date (TIMESTAMPTZ)
--      service_fait_certifie_par (UUID FK profiles)
-- ============================================================================
ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS service_fait_commentaire TEXT;

COMMENT ON COLUMN budget_liquidations.service_fait_commentaire
  IS 'Commentaire optionnel lors de la certification du service fait';

-- ============================================================================
-- 2. CHECK constraint sur liquidation_attachments.document_type
--    Types PJ unifiés (frontend existant + spec Prompt 6) :
--      facture, facture_definitive, bon_livraison, pv_reception,
--      attestation_service_fait, decompte, autre
-- ============================================================================
ALTER TABLE liquidation_attachments
  DROP CONSTRAINT IF EXISTS chk_document_type;

ALTER TABLE liquidation_attachments
  ADD CONSTRAINT chk_document_type CHECK (
    document_type IN (
      'facture', 'facture_definitive',
      'bon_livraison', 'pv_reception',
      'attestation_service_fait', 'decompte',
      'autre'
    )
  );

-- ============================================================================
-- 3. Trigger : reglement_urgent passe à true → audit_logs + notifications
--    Se déclenche AFTER UPDATE pour voir les valeurs finales (motif, par, etc.)
--    La clause WHEN filtre : uniquement quand reglement_urgent change à true
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_on_liquidation_urgent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_recipient RECORD;
BEGIN
  -- Récupérer le nom de l'utilisateur qui a marqué urgent
  SELECT COALESCE(full_name, first_name || ' ' || last_name, 'Utilisateur')
  INTO v_user_name
  FROM profiles
  WHERE id = COALESCE(NEW.reglement_urgent_par, auth.uid());

  -- 1. INSERT audit_logs
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    COALESCE(NEW.reglement_urgent_par, auth.uid()),
    'LIQUIDATION_MARQUEE_URGENTE',
    'budget_liquidations',
    NEW.id,
    jsonb_build_object('reglement_urgent', COALESCE(OLD.reglement_urgent, false)),
    jsonb_build_object(
      'reglement_urgent', true,
      'motif', NEW.reglement_urgent_motif,
      'numero', NEW.numero,
      'par', v_user_name
    )
  );

  -- 2. INSERT notifications → Tresorier + DMG
  FOR v_recipient IN
    SELECT id FROM profiles
    WHERE role_hierarchique IN ('Tresorier', 'DMG')
      AND id != COALESCE(NEW.reglement_urgent_par, auth.uid())
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message,
      entity_type, entity_id, category, is_urgent
    ) VALUES (
      v_recipient.id,
      'liquidation_urgente',
      'Liquidation urgente — ' || NEW.numero,
      'La liquidation n° ' || NEW.numero
        || ' a été marquée urgente par ' || v_user_name
        || '. Motif : ' || COALESCE(NEW.reglement_urgent_motif, 'Non précisé'),
      'budget_liquidations',
      NEW.id,
      'workflow',
      true
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_liquidation_urgent_audit ON budget_liquidations;

CREATE TRIGGER trg_liquidation_urgent_audit
  AFTER UPDATE OF reglement_urgent
  ON budget_liquidations
  FOR EACH ROW
  WHEN (OLD.reglement_urgent IS DISTINCT FROM NEW.reglement_urgent
        AND NEW.reglement_urgent = true)
  EXECUTE FUNCTION fn_on_liquidation_urgent();

-- ============================================================================
-- 4. Mise à jour mark_liquidation_urgent : retrait INSERT notifications
--    (désormais géré par trg_liquidation_urgent_audit pour éviter doublons)
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_liquidation_urgent(
  p_liquidation_id UUID,
  p_motif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_user_role TEXT;
  v_user_profile TEXT;
BEGIN
  -- Vérifier les droits de l'utilisateur
  SELECT role_hierarchique, profil_fonctionnel INTO v_user_role, v_user_profile
  FROM profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('DG', 'DMG', 'DAAF', 'Directeur')
     AND v_user_profile NOT IN ('Admin', 'Validateur') THEN
    RAISE EXCEPTION 'Vous n''avez pas les droits pour marquer une liquidation comme urgente';
  END IF;

  -- Vérifier que le motif est fourni
  IF p_motif IS NULL OR TRIM(p_motif) = '' THEN
    RAISE EXCEPTION 'Un motif est requis pour marquer une liquidation comme urgente';
  END IF;

  -- Marquer la liquidation (le trigger trg_liquidation_urgent_audit
  -- s'occupera de l'audit_log + notifications)
  UPDATE budget_liquidations
  SET
    reglement_urgent = true,
    reglement_urgent_motif = p_motif,
    reglement_urgent_date = NOW(),
    reglement_urgent_par = auth.uid()
  WHERE id = p_liquidation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liquidation non trouvée';
  END IF;

  RETURN true;
END;
$func$;
