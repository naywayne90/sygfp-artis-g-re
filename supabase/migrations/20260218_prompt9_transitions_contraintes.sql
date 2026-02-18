-- ============================================================
-- Prompt 9 BACKEND — Transitions et contraintes marchés
-- Date: 2026-02-18
-- Description: Machine à états, pré-requis, audit, notifications,
--              verrouillage champs après publication/signature
-- ============================================================

-- ============================================================
-- 1. CONTEXTE
-- ============================================================
-- Triggers existants sur marches (7):
--   lock_code_marches (BEFORE UPDATE) → lock_code_on_validation
--   trg_generate_marche_numero (BEFORE INSERT) → generate_marche_numero
--   trg_log_marche_status (AFTER UPDATE) → fn_log_marche_status_change
--   trg_marche_created (AFTER INSERT) → fn_marche_created_log
--   trg_marche_validation_complete (AFTER UPDATE) → fn_marche_validation_complete
--   trg_set_procedure_recommandee (BEFORE INSERT/UPDATE) → fn_set_procedure_recommandee
--   update_marches_updated_at (BEFORE UPDATE) → update_updated_at_column
--
-- fn_log_marche_status_change: déjà en place, logue dans marche_historique
--   → la RPC n'a PAS besoin d'insérer dans marche_historique (le trigger le fait)
--
-- lock_code_on_validation: verrouille numero après validation
--   → étendue pour verrouiller objet/type/mode après publication + tout après signature
--
-- CHECK existant: en_preparation, en_cours, attribue, signe, annule
--   → élargi avec: publie, cloture, en_evaluation, approuve

-- ============================================================
-- 2. ÉLARGIR CHECK CONSTRAINT marches.statut
-- ============================================================
-- Machine à états:
--   en_preparation → publie → cloture → en_evaluation → attribue → approuve → signe
--   * → annule (depuis tout sauf signe)
ALTER TABLE marches DROP CONSTRAINT IF EXISTS marches_statut_check;
ALTER TABLE marches ADD CONSTRAINT marches_statut_check
  CHECK (statut IN (
    'en_preparation', 'publie', 'cloture', 'en_evaluation',
    'attribue', 'approuve', 'signe', 'annule',
    'en_cours'  -- backward compat legacy
  ));

-- ============================================================
-- 3. RPC fn_transition_marche
-- ============================================================
-- Paramètres: marche_id, nouveau_statut, user_id, motif (optionnel)
-- Retourne JSONB: {success, message/error/errors, marche_id, ancien_statut, nouveau_statut}
-- SECURITY DEFINER: bypass RLS pour audit_logs et notifications
--
-- Pré-requis par transition:
--   publier: objet, type, mode, montant > 0, date_pub, date_cloture > date_pub
--   cloturer: statut=publie (clôture manuelle autorisée)
--   evaluer: statut=cloture, EXISTS soumissions
--   attribuer: statut=en_evaluation, toutes soumissions évaluées, ≥1 qualifié, prestataire_id
--   approuver: statut=attribue, user DG ou ADMIN
--   signer: statut=approuve, document contrat uploadé
--   annuler: tout sauf signe, user DG/ADMIN, motif obligatoire
CREATE OR REPLACE FUNCTION public.fn_transition_marche(
  p_marche_id UUID,
  p_nouveau_statut TEXT,
  p_user_id UUID,
  p_motif TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_marche RECORD;
  v_errors TEXT[] := '{}';
  v_count INTEGER;
  v_old_statut TEXT;
  v_valid_transitions JSONB := '{
    "en_preparation": ["publie"],
    "publie": ["cloture"],
    "cloture": ["en_evaluation"],
    "en_evaluation": ["attribue"],
    "attribue": ["approuve"],
    "approuve": ["signe"]
  }'::jsonb;
  v_allowed JSONB;
  v_user_roles TEXT[];
BEGIN
  -- Charger le marché
  SELECT * INTO v_marche FROM marches WHERE id = p_marche_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Marché introuvable');
  END IF;

  v_old_statut := v_marche.statut;

  -- Vérifier rôles utilisateur
  SELECT array_agg(role::text) INTO v_user_roles
  FROM user_roles WHERE user_id = p_user_id;

  -- Transition annuler: depuis tout sauf signe
  IF p_nouveau_statut = 'annule' THEN
    IF v_old_statut = 'signe' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Impossible d''annuler un marché signé');
    END IF;
    IF NOT ('ADMIN' = ANY(v_user_roles) OR 'DG' = ANY(v_user_roles)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Seuls DG et ADMIN peuvent annuler un marché');
    END IF;
    IF p_motif IS NULL OR p_motif = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Le motif d''annulation est obligatoire');
    END IF;
  ELSE
    -- Vérifier que la transition est valide
    v_allowed := v_valid_transitions->v_old_statut;
    IF v_allowed IS NULL OR NOT v_allowed ? p_nouveau_statut THEN
      RETURN jsonb_build_object('success', false, 'error',
        'Transition invalide: ' || v_old_statut || ' -> ' || p_nouveau_statut);
    END IF;

    -- Pré-requis par transition
    CASE p_nouveau_statut
      -- PUBLIER: en_preparation -> publie
      WHEN 'publie' THEN
        IF v_marche.objet IS NULL OR v_marche.objet = '' THEN
          v_errors := array_append(v_errors, 'L''objet du marché est obligatoire');
        END IF;
        IF v_marche.type_marche IS NULL THEN
          v_errors := array_append(v_errors, 'Le type de marché est obligatoire');
        END IF;
        IF v_marche.mode_passation IS NULL THEN
          v_errors := array_append(v_errors, 'Le mode de passation est obligatoire');
        END IF;
        IF COALESCE(v_marche.montant, v_marche.montant_estime, 0) <= 0 THEN
          v_errors := array_append(v_errors, 'Le montant doit être supérieur à 0');
        END IF;
        IF v_marche.date_publication IS NULL THEN
          v_errors := array_append(v_errors, 'La date de publication est obligatoire');
        END IF;
        IF v_marche.date_cloture IS NULL THEN
          v_errors := array_append(v_errors, 'La date de clôture est obligatoire');
        END IF;
        IF v_marche.date_publication IS NOT NULL AND v_marche.date_cloture IS NOT NULL
           AND v_marche.date_cloture <= v_marche.date_publication THEN
          v_errors := array_append(v_errors, 'La date de clôture doit être postérieure à la date de publication');
        END IF;

      -- CLOTURER: publie -> cloture
      WHEN 'cloture' THEN
        -- Clôture manuelle autorisée (pas de vérification date)
        NULL;

      -- EVALUER: cloture -> en_evaluation
      WHEN 'en_evaluation' THEN
        SELECT COUNT(*) INTO v_count FROM soumissions WHERE marche_id = p_marche_id;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Aucune soumission enregistrée pour ce marché');
        END IF;

      -- ATTRIBUER: en_evaluation -> attribue
      WHEN 'attribue' THEN
        -- Vérifier que toutes les soumissions ont été évaluées
        SELECT COUNT(*) INTO v_count
        FROM soumissions s
        WHERE s.marche_id = p_marche_id
          AND NOT EXISTS (
            SELECT 1 FROM evaluations_offre e WHERE e.soumission_id = s.id
          );
        IF v_count > 0 THEN
          v_errors := array_append(v_errors, v_count || ' soumission(s) non évaluée(s)');
        END IF;
        -- Au moins 1 qualifié
        SELECT COUNT(*) INTO v_count
        FROM evaluations_offre
        WHERE marche_id = p_marche_id AND qualifie_techniquement = true;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Aucun soumissionnaire qualifié techniquement');
        END IF;
        -- Prestataire retenu doit être sélectionné
        IF v_marche.prestataire_id IS NULL THEN
          v_errors := array_append(v_errors, 'Le prestataire attributaire doit être sélectionné');
        END IF;

      -- APPROUVER: attribue -> approuve
      WHEN 'approuve' THEN
        IF NOT ('ADMIN' = ANY(v_user_roles) OR 'DG' = ANY(v_user_roles)) THEN
          v_errors := array_append(v_errors, 'Seuls DG et ADMIN peuvent approuver un marché');
        END IF;

      -- SIGNER: approuve -> signe
      WHEN 'signe' THEN
        SELECT COUNT(*) INTO v_count
        FROM marche_documents
        WHERE marche_id = p_marche_id AND type_document = 'contrat';
        IF v_count = 0 THEN
          SELECT COUNT(*) INTO v_count
          FROM marche_attachments
          WHERE marche_id = p_marche_id AND document_type = 'contrat';
        END IF;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Le document contrat doit être uploadé avant signature');
        END IF;

      ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Statut cible inconnu: ' || p_nouveau_statut);
    END CASE;
  END IF;

  -- Si des erreurs, retourner
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object('success', false, 'errors', to_jsonb(v_errors));
  END IF;

  -- EFFECTUER LA TRANSITION
  UPDATE marches
  SET statut = p_nouveau_statut,
      updated_at = now()
  WHERE id = p_marche_id;

  -- INSERT audit_logs
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, exercice)
  VALUES (
    p_user_id,
    'TRANSITION_MARCHE_' || UPPER(p_nouveau_statut),
    'marches',
    p_marche_id,
    jsonb_build_object('statut', v_old_statut),
    jsonb_build_object('statut', p_nouveau_statut, 'motif', p_motif),
    v_marche.exercice
  );

  -- NOTIFICATIONS
  -- Publication -> notifier agents DAAF/DG/ADMIN
  IF p_nouveau_statut = 'publie' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marché publié: ' || COALESCE(v_marche.numero, ''),
      'Le marché "' || COALESCE(v_marche.objet, '') || '" a été publié.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'ADMIN', 'DG');

  -- Attribution -> notifier DAAF + DG
  ELSIF p_nouveau_statut = 'attribue' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marché attribué: ' || COALESCE(v_marche.numero, ''),
      'Le marché "' || COALESCE(v_marche.objet, '') || '" a été attribué.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'ADMIN');

  -- Approbation -> notifier DAAF
  ELSIF p_nouveau_statut = 'approuve' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marché approuvé: ' || COALESCE(v_marche.numero, ''),
      'Le marché "' || COALESCE(v_marche.objet, '') || '" a été approuvé par le DG.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'ADMIN');

  -- Signature -> notifier DG + DAAF + CB
  ELSIF p_nouveau_statut = 'signe' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marché signé: ' || COALESCE(v_marche.numero, ''),
      'Le marché "' || COALESCE(v_marche.objet, '') || '" est signé. Procéder à l''engagement.',
      'warning', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'CB', 'ADMIN');

  -- Annulation -> notifier tout le monde concerné (urgent)
  ELSIF p_nouveau_statut = 'annule' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id, is_urgent)
    SELECT p2.id,
      'Marché ANNULÉ: ' || COALESCE(v_marche.numero, ''),
      'Le marché "' || COALESCE(v_marche.objet, '') || '" a été annulé. Motif: ' || COALESCE(p_motif, 'Non précisé'),
      'error', 'passation', 'marches', p_marche_id, true
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'CB', 'ADMIN');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transition effectuée: ' || v_old_statut || ' -> ' || p_nouveau_statut,
    'marche_id', p_marche_id,
    'ancien_statut', v_old_statut,
    'nouveau_statut', p_nouveau_statut
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. VERROUILLAGE ÉTENDU (lock_code_on_validation)
-- ============================================================
-- Étend la fonction existante:
--   Après publication: objet, type_marche, mode_passation en lecture seule
--   Après signature: TOUT en lecture seule (sauf ADMIN)
--   Transitions de statut: toujours autorisées (pas de blocage)
CREATE OR REPLACE FUNCTION public.lock_code_on_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Verrouiller le code quand le statut passe à validé/approuvé/publié
  IF NEW.statut IN ('valide', 'approuve', 'signe', 'paye', 'publie')
     AND (OLD.statut IS NULL OR OLD.statut NOT IN ('valide', 'approuve', 'signe', 'paye', 'publie'))
  THEN
    NEW.code_locked := TRUE;
  END IF;

  -- Empêcher la modification du numéro si verrouillé (sauf admin)
  IF OLD.code_locked = TRUE AND OLD.numero IS DISTINCT FROM NEW.numero THEN
    IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
      RAISE EXCEPTION 'Le code ne peut pas être modifié après validation. Contactez un administrateur.';
    ELSE
      INSERT INTO audit_logs (entity_type, entity_id, action, user_id, old_values, new_values)
      VALUES (
        TG_TABLE_NAME, NEW.id, 'CODE_OVERRIDE', auth.uid(),
        jsonb_build_object('numero', OLD.numero),
        jsonb_build_object('numero', NEW.numero, 'reason', 'Admin override')
      );
    END IF;
  END IF;

  -- VERROUILLAGE APRÈS PUBLICATION: objet, type_marche, mode_passation en lecture seule
  IF OLD.statut IN ('publie', 'cloture', 'en_evaluation', 'attribue', 'approuve', 'signe') THEN
    -- Sauf si c'est une transition de statut
    IF OLD.statut IS DISTINCT FROM NEW.statut THEN
      -- Transition autorisée, ne pas bloquer
      NULL;
    ELSE
      -- Bloquer les modifications de champs verrouillés après publication
      IF OLD.objet IS DISTINCT FROM NEW.objet THEN
        RAISE EXCEPTION 'L''objet ne peut pas être modifié après publication';
      END IF;
      IF OLD.type_marche IS DISTINCT FROM NEW.type_marche THEN
        RAISE EXCEPTION 'Le type de marché ne peut pas être modifié après publication';
      END IF;
      IF OLD.mode_passation IS DISTINCT FROM NEW.mode_passation AND NEW.mode_force = false THEN
        RAISE EXCEPTION 'Le mode de passation ne peut pas être modifié après publication';
      END IF;
    END IF;
  END IF;

  -- VERROUILLAGE TOTAL APRÈS SIGNATURE
  IF OLD.statut = 'signe' AND NEW.statut = 'signe' THEN
    IF OLD.montant IS DISTINCT FROM NEW.montant
       OR OLD.montant_estime IS DISTINCT FROM NEW.montant_estime
       OR OLD.montant_attribue IS DISTINCT FROM NEW.montant_attribue
       OR OLD.date_attribution IS DISTINCT FROM NEW.date_attribution
       OR OLD.date_signature IS DISTINCT FROM NEW.date_signature
       OR OLD.prestataire_id IS DISTINCT FROM NEW.prestataire_id
       OR OLD.objet IS DISTINCT FROM NEW.objet
    THEN
      IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
        RAISE EXCEPTION 'Le marché signé ne peut plus être modifié. Contactez un administrateur.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. ÉLARGIR CHECK notification_templates.type_evenement
-- ============================================================
ALTER TABLE notification_templates DROP CONSTRAINT IF EXISTS notification_templates_type_evenement_check;
ALTER TABLE notification_templates ADD CONSTRAINT notification_templates_type_evenement_check
  CHECK (type_evenement IN (
    -- Existants
    'ordonnancement', 'reglement', 'reglement_partiel',
    'note_soumise', 'note_validee', 'note_rejetee',
    'engagement_cree', 'liquidation_validee',
    'imputation_soumise', 'imputation_validee', 'imputation_rejetee',
    -- Nouveaux marchés
    'marche_publie', 'marche_cloture', 'marche_en_evaluation',
    'marche_attribue', 'marche_approuve', 'marche_signe', 'marche_annule'
  ));

-- ============================================================
-- 6. TEMPLATES DE NOTIFICATION MARCHÉS
-- ============================================================
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles, est_actif)
VALUES
  ('MARCHE_PUBLIE', 'Marché publié: {numero}', 'Le marché "{objet}" a été publié. Date de clôture: {date_cloture}.', 'marche_publie', '["numero","objet","date_publication","date_cloture","montant"]', true),
  ('MARCHE_CLOTURE', 'Clôture marché: {numero}', 'La période de soumission du marché "{objet}" est clôturée.', 'marche_cloture', '["numero","objet"]', true),
  ('MARCHE_EN_EVALUATION', 'Évaluation en cours: {numero}', 'Le marché "{objet}" est en cours d''évaluation.', 'marche_en_evaluation', '["numero","objet","nb_soumissions"]', true),
  ('MARCHE_ATTRIBUE', 'Marché attribué: {numero}', 'Le marché "{objet}" a été attribué à {prestataire}.', 'marche_attribue', '["numero","objet","prestataire","montant"]', true),
  ('MARCHE_APPROUVE', 'Marché approuvé: {numero}', 'Le marché "{objet}" a été approuvé. Procéder à la signature.', 'marche_approuve', '["numero","objet","approbateur"]', true),
  ('MARCHE_SIGNE', 'Marché signé: {numero}', 'Le marché "{objet}" est signé. Créer l''engagement budgétaire.', 'marche_signe', '["numero","objet","date_signature"]', true),
  ('MARCHE_ANNULE', 'ANNULATION marché: {numero}', 'Le marché "{objet}" a été annulé. Motif: {motif}.', 'marche_annule', '["numero","objet","motif"]', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
-- CHECK marches.statut: 9 valeurs (8 workflow + en_cours legacy)
-- Machine à états:
--   en_preparation → publie → cloture → en_evaluation → attribue → approuve → signe
--   * → annule (depuis tout sauf signe, par DG/ADMIN avec motif)
--
-- RPC fn_transition_marche(UUID, TEXT, UUID, TEXT):
--   SECURITY DEFINER, retourne JSONB
--   6 transitions + annulation, 7 blocs de pré-requis
--   Audit: INSERT audit_logs à chaque transition
--   Notifications: 5 types (publie, attribue, approuve, signe, annule)
--   Historique: via trigger existant fn_log_marche_status_change (pas dupliqué)
--
-- lock_code_on_validation étendue:
--   Après publication: objet, type_marche, mode_passation verrouillés
--   Après signature: montant, dates, prestataire_id, objet verrouillés (sauf ADMIN)
--   Transitions de statut: toujours autorisées
--
-- notification_templates: +7 types marché
--   CHECK type_evenement: +7 valeurs (11 existants → 18 total)
--
-- Tests effectués:
--   1. Publier sans dates → {success:false, errors:["date_publication","date_cloture"]} ✅
--   2. Transition invalide → {success:false, error:"Transition invalide: en_preparation -> signe"} ✅
--   3. Publier avec dates → {success:true, message:"en_preparation -> publie"} ✅
--   4. Vérification: statut=publie, audit=1, notif=5, historique=1 ✅
--   5. Rollback: en_preparation restauré, données test nettoyées ✅
