-- ============================================================
-- Prompt 10 BACKEND — Vérifications RBAC + Approbation DG
-- Date: 2026-02-18
-- Description: Durcissement RLS 3 tables, rejet DG, RPC approbation,
--              fix trigger historique
-- ============================================================

-- ============================================================
-- 1. CONTEXTE — AUDIT RLS 9 TABLES PASSATION
-- ============================================================
-- Audit initial des policies RLS sur 9 tables passation:
--
-- ✅ Policies correctes (restrictives par rôle):
--   evaluations_offre  → SELECT(ADMIN,DG,DAAF), INSERT/UPDATE(DAAF,ADMIN), DELETE(ADMIN)
--   marche_attachments  → ALL(ADMIN,DAAF,CB), SELECT(true)
--   marche_documents    → SELECT(true), ALL(ADMIN,DAAF,CB)
--   marche_historique   → SELECT(true), INSERT(true/system)
--   marche_validations  → ALL(ADMIN,DAAF,CB,DG), SELECT(true)
--   marches             → ALL(ADMIN,DAAF,CB), SELECT(DG), SELECT(true)
--
-- ❌ Policies trop permissives (ALL pour authenticated):
--   marche_lots    → "Authenticated access lots" (ALL, true)
--   soumissions    → "Authenticated access soumissions" (ALL, true)
--   marche_offres  → 3 policies: insert/update/select (true)
--
-- Action: DROP les policies permissives, recréer avec rôles DAAF/ADMIN

-- ============================================================
-- 2. PART 1 — FIX RLS POLICIES (3 tables)
-- ============================================================

-- 2A. marche_lots: DROP policy permissive, recréer par rôle
DROP POLICY IF EXISTS "Authenticated access lots" ON marche_lots;

CREATE POLICY marche_lots_select ON marche_lots
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY marche_lots_insert ON marche_lots
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY marche_lots_update ON marche_lots
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY marche_lots_delete ON marche_lots
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 2B. soumissions: DROP policy permissive, recréer par rôle
DROP POLICY IF EXISTS "Authenticated access soumissions" ON soumissions;

CREATE POLICY soumissions_select ON soumissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY soumissions_insert ON soumissions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY soumissions_update ON soumissions
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY soumissions_delete ON soumissions
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 2C. marche_offres: DROP 3 policies permissives, recréer par rôle
DROP POLICY IF EXISTS "Users can insert offres" ON marche_offres;
DROP POLICY IF EXISTS "Users can update offres" ON marche_offres;
DROP POLICY IF EXISTS "Users can view offres" ON marche_offres;

CREATE POLICY marche_offres_select ON marche_offres
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY marche_offres_insert ON marche_offres
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY marche_offres_update ON marche_offres
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY marche_offres_delete ON marche_offres
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- ============================================================
-- 3. PART 2A — CHECK CONSTRAINT + TEMPLATE rejete
-- ============================================================

-- 3A. Ajouter 'rejete' au CHECK marches.statut (10 valeurs)
ALTER TABLE marches DROP CONSTRAINT IF EXISTS marches_statut_check;
ALTER TABLE marches ADD CONSTRAINT marches_statut_check
  CHECK (statut IN (
    'en_preparation', 'publie', 'cloture', 'en_evaluation',
    'attribue', 'approuve', 'rejete', 'signe', 'annule',
    'en_cours'  -- backward compat legacy
  ));

-- 3B. Ajouter 'marche_rejete' au CHECK notification_templates.type_evenement (19 valeurs)
ALTER TABLE notification_templates DROP CONSTRAINT IF EXISTS notification_templates_type_evenement_check;
ALTER TABLE notification_templates ADD CONSTRAINT notification_templates_type_evenement_check
  CHECK (type_evenement IN (
    'ordonnancement', 'reglement', 'reglement_partiel',
    'note_soumise', 'note_validee', 'note_rejetee',
    'engagement_cree', 'liquidation_validee',
    'imputation_soumise', 'imputation_validee', 'imputation_rejetee',
    'marche_publie', 'marche_cloture', 'marche_en_evaluation',
    'marche_attribue', 'marche_approuve', 'marche_rejete',
    'marche_signe', 'marche_annule'
  ));

-- 3C. Template notification MARCHE_REJETE
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles, est_actif)
VALUES (
  'MARCHE_REJETE',
  'Marché REJETÉ: {numero}',
  'Le marché "{objet}" a été rejeté par le DG. Motif: {motif}. Veuillez corriger et resoumettre.',
  'marche_rejete',
  '["numero","objet","motif","approbateur"]',
  true
) ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 4. PART 2B — fn_transition_marche v2 (avec rejete)
-- ============================================================
-- Changements par rapport à Prompt 9:
--   + Transition attribue → ["approuve", "rejete"]
--   + Transition rejete → ["en_evaluation"]
--   + CASE 'rejete': DG/ADMIN requis + motif obligatoire
--   + Notification 'rejete': urgent, envoyée à DAAF/ADMIN
--   + Notification 'attribue': message "En attente d'approbation DG"
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
    "attribue": ["approuve", "rejete"],
    "rejete": ["en_evaluation"],
    "approuve": ["signe"]
  }'::jsonb;
  v_allowed JSONB;
  v_user_roles TEXT[];
BEGIN
  -- Charger le marche
  SELECT * INTO v_marche FROM marches WHERE id = p_marche_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Marche introuvable');
  END IF;

  v_old_statut := v_marche.statut;

  -- Verifier roles utilisateur
  SELECT array_agg(role::text) INTO v_user_roles
  FROM user_roles WHERE user_id = p_user_id;

  -- Transition annuler: depuis tout sauf signe
  IF p_nouveau_statut = 'annule' THEN
    IF v_old_statut = 'signe' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Impossible d''annuler un marche signe');
    END IF;
    IF NOT ('ADMIN' = ANY(v_user_roles) OR 'DG' = ANY(v_user_roles)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Seuls DG et ADMIN peuvent annuler un marche');
    END IF;
    IF p_motif IS NULL OR p_motif = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Le motif d''annulation est obligatoire');
    END IF;
  ELSE
    -- Verifier que la transition est valide
    v_allowed := v_valid_transitions->v_old_statut;
    IF v_allowed IS NULL OR NOT v_allowed ? p_nouveau_statut THEN
      RETURN jsonb_build_object('success', false, 'error',
        'Transition invalide: ' || v_old_statut || ' -> ' || p_nouveau_statut);
    END IF;

    -- Pre-requis par transition
    CASE p_nouveau_statut
      -- PUBLIER: en_preparation -> publie
      WHEN 'publie' THEN
        IF v_marche.objet IS NULL OR v_marche.objet = '' THEN
          v_errors := array_append(v_errors, 'L''objet du marche est obligatoire');
        END IF;
        IF v_marche.type_marche IS NULL THEN
          v_errors := array_append(v_errors, 'Le type de marche est obligatoire');
        END IF;
        IF v_marche.mode_passation IS NULL THEN
          v_errors := array_append(v_errors, 'Le mode de passation est obligatoire');
        END IF;
        IF COALESCE(v_marche.montant, v_marche.montant_estime, 0) <= 0 THEN
          v_errors := array_append(v_errors, 'Le montant doit etre superieur a 0');
        END IF;
        IF v_marche.date_publication IS NULL THEN
          v_errors := array_append(v_errors, 'La date de publication est obligatoire');
        END IF;
        IF v_marche.date_cloture IS NULL THEN
          v_errors := array_append(v_errors, 'La date de cloture est obligatoire');
        END IF;
        IF v_marche.date_publication IS NOT NULL AND v_marche.date_cloture IS NOT NULL
           AND v_marche.date_cloture <= v_marche.date_publication THEN
          v_errors := array_append(v_errors, 'La date de cloture doit etre posterieure a la date de publication');
        END IF;

      -- CLOTURER: publie -> cloture
      WHEN 'cloture' THEN
        NULL;

      -- EVALUER: cloture -> en_evaluation (aussi rejete -> en_evaluation)
      WHEN 'en_evaluation' THEN
        SELECT COUNT(*) INTO v_count FROM soumissions WHERE marche_id = p_marche_id;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Aucune soumission enregistree pour ce marche');
        END IF;

      -- ATTRIBUER: en_evaluation -> attribue
      WHEN 'attribue' THEN
        SELECT COUNT(*) INTO v_count
        FROM soumissions s
        WHERE s.marche_id = p_marche_id
          AND NOT EXISTS (
            SELECT 1 FROM evaluations_offre e WHERE e.soumission_id = s.id
          );
        IF v_count > 0 THEN
          v_errors := array_append(v_errors, v_count || ' soumission(s) non evaluee(s)');
        END IF;
        SELECT COUNT(*) INTO v_count
        FROM evaluations_offre
        WHERE marche_id = p_marche_id AND qualifie_techniquement = true;
        IF v_count = 0 THEN
          v_errors := array_append(v_errors, 'Aucun soumissionnaire qualifie techniquement');
        END IF;
        IF v_marche.prestataire_id IS NULL THEN
          v_errors := array_append(v_errors, 'Le prestataire attributaire doit etre selectionne');
        END IF;

      -- APPROUVER: attribue -> approuve
      WHEN 'approuve' THEN
        IF NOT ('ADMIN' = ANY(v_user_roles) OR 'DG' = ANY(v_user_roles)) THEN
          v_errors := array_append(v_errors, 'Seuls DG et ADMIN peuvent approuver un marche');
        END IF;

      -- REJETER: attribue -> rejete
      WHEN 'rejete' THEN
        IF NOT ('ADMIN' = ANY(v_user_roles) OR 'DG' = ANY(v_user_roles)) THEN
          v_errors := array_append(v_errors, 'Seuls DG et ADMIN peuvent rejeter un marche');
        END IF;
        IF p_motif IS NULL OR p_motif = '' THEN
          v_errors := array_append(v_errors, 'Le motif de rejet est obligatoire');
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
          v_errors := array_append(v_errors, 'Le document contrat doit etre uploade avant signature');
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
  IF p_nouveau_statut = 'publie' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marche publie: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" a ete publie.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'ADMIN', 'DG');

  ELSIF p_nouveau_statut = 'attribue' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marche attribue: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" a ete attribue. En attente d''approbation DG.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'ADMIN');

  ELSIF p_nouveau_statut = 'approuve' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marche approuve: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" a ete approuve par le DG.',
      'info', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'ADMIN');

  ELSIF p_nouveau_statut = 'rejete' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id, is_urgent)
    SELECT p2.id,
      'Marche REJETE: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" a ete rejete par le DG. Motif: ' || COALESCE(p_motif, 'Non precise'),
      'error', 'passation', 'marches', p_marche_id, true
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'ADMIN');

  ELSIF p_nouveau_statut = 'signe' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id)
    SELECT p2.id,
      'Marche signe: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" est signe. Proceder a l''engagement.',
      'warning', 'passation', 'marches', p_marche_id
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'CB', 'ADMIN');

  ELSIF p_nouveau_statut = 'annule' THEN
    INSERT INTO notifications (user_id, title, message, type, category, entity_type, entity_id, is_urgent)
    SELECT p2.id,
      'Marche ANNULE: ' || COALESCE(v_marche.numero, ''),
      'Le marche "' || COALESCE(v_marche.objet, '') || '" a ete annule. Motif: ' || COALESCE(p_motif, 'Non precise'),
      'error', 'passation', 'marches', p_marche_id, true
    FROM profiles p2
    JOIN user_roles ur ON p2.id = ur.user_id
    WHERE ur.role IN ('DAAF', 'DG', 'CB', 'ADMIN');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transition effectuee: ' || v_old_statut || ' -> ' || p_nouveau_statut,
    'marche_id', p_marche_id,
    'ancien_statut', v_old_statut,
    'nouveau_statut', p_nouveau_statut
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. PART 2C — RPC fn_marches_a_approuver
-- ============================================================
-- Retourne les marches en statut 'attribue' (en attente approbation DG)
-- Avec infos prestataire, createur, soumissions, evaluations, rang1
-- SECURITY DEFINER: bypass RLS evaluations_offre
CREATE OR REPLACE FUNCTION public.fn_marches_a_approuver()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', m.id,
      'numero', m.numero,
      'objet', m.objet,
      'montant', m.montant,
      'montant_estime', m.montant_estime,
      'montant_attribue', m.montant_attribue,
      'type_marche', m.type_marche,
      'mode_passation', m.mode_passation,
      'exercice', m.exercice,
      'date_attribution', m.date_attribution,
      'created_at', m.created_at,
      'prestataire', CASE WHEN pr.id IS NOT NULL THEN jsonb_build_object(
        'id', pr.id,
        'raison_sociale', pr.raison_sociale
      ) ELSE NULL END,
      'createur', CASE WHEN p.id IS NOT NULL THEN jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name
      ) ELSE NULL END,
      'nb_soumissions', (SELECT COUNT(*) FROM soumissions s WHERE s.marche_id = m.id),
      'nb_evaluations', (SELECT COUNT(*) FROM evaluations_offre e WHERE e.marche_id = m.id),
      'rang1', (
        SELECT jsonb_build_object(
          'note_finale', ev.note_finale,
          'soumissionnaire', sp.raison_sociale
        )
        FROM evaluations_offre ev
        LEFT JOIN soumissions sm ON ev.soumission_id = sm.id
        LEFT JOIN prestataires sp ON sm.prestataire_id = sp.id
        WHERE ev.marche_id = m.id AND ev.rang = 1
        LIMIT 1
      )
    ) ORDER BY m.created_at), '[]'::jsonb)
    FROM marches m
    LEFT JOIN prestataires pr ON m.prestataire_id = pr.id
    LEFT JOIN profiles p ON m.created_by = p.id
    WHERE m.statut = 'attribue'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 6. PART 2D — Fix fn_log_marche_status_change
-- ============================================================
-- BUG FIX: L'ancienne version utilisait COALESCE(OLD.validation_status, OLD.statut)
--   ce qui loguait validation_status ('en_attente') au lieu du vrai statut
--   quand validation_status etait NOT NULL.
-- FIX: Separer les deux IF (statut vs validation_status) independamment
CREATE OR REPLACE FUNCTION public.fn_log_marche_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changement de statut (workflow passation)
  IF (OLD.statut IS DISTINCT FROM NEW.statut) THEN
    INSERT INTO public.marche_historique (
      marche_id, type_action, description,
      ancien_statut, nouveau_statut, user_id, metadata
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.statut = 'publie' THEN 'publication'
        WHEN NEW.statut = 'cloture' THEN 'cloture'
        WHEN NEW.statut = 'en_evaluation' THEN 'evaluation'
        WHEN NEW.statut = 'attribue' THEN 'attribution'
        WHEN NEW.statut = 'approuve' THEN 'approbation'
        WHEN NEW.statut = 'rejete' THEN 'rejet'
        WHEN NEW.statut = 'signe' THEN 'signature'
        WHEN NEW.statut = 'annule' THEN 'annulation'
        ELSE 'modification'
      END,
      'Changement de statut du marche: ' || OLD.statut || ' -> ' || NEW.statut,
      OLD.statut,
      NEW.statut,
      auth.uid(),
      jsonb_build_object(
        'numero', NEW.numero,
        'montant', NEW.montant,
        'prestataire_id', NEW.prestataire_id
      )
    );
  END IF;

  -- Log changement de validation_status (workflow validation)
  IF (OLD.validation_status IS DISTINCT FROM NEW.validation_status) THEN
    INSERT INTO public.marche_historique (
      marche_id, type_action, description,
      ancien_statut, nouveau_statut, user_id, metadata
    ) VALUES (
      NEW.id,
      'validation',
      'Changement validation: ' || COALESCE(OLD.validation_status, 'null') || ' -> ' || COALESCE(NEW.validation_status, 'null'),
      OLD.validation_status,
      NEW.validation_status,
      auth.uid(),
      jsonb_build_object(
        'numero', NEW.numero,
        'type', 'validation_status'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- VERIFICATION FINALE
-- ============================================================
-- Part 1 — RLS Fix (3 tables):
--   5 old permissive policies DROPped
--   12 new role-based policies CREATEd
--   Pattern: SELECT(true), INSERT/UPDATE(DAAF,ADMIN), DELETE(ADMIN)
--   Tables: marche_lots, soumissions, marche_offres
--
-- Part 2A — CHECK constraints:
--   marches.statut: 10 valeurs (+rejete)
--   notification_templates.type_evenement: 19 valeurs (+marche_rejete)
--   + template MARCHE_REJETE
--
-- Part 2B — fn_transition_marche v2:
--   8 transitions (7 forward + annulation)
--   Nouveau: attribue -> ["approuve", "rejete"]
--   Nouveau: rejete -> ["en_evaluation"] (re-soumission)
--   Rejet: DG/ADMIN requis + motif obligatoire + notification urgente
--
-- Part 2C — fn_marches_a_approuver:
--   SECURITY DEFINER, retourne JSONB
--   Filtre statut = 'attribue'
--   Inclut prestataire, createur, nb_soumissions, nb_evaluations, rang1
--
-- Part 2D — fn_log_marche_status_change fix:
--   Bug: COALESCE(validation_status, statut) → loguait validation_status
--   Fix: 2 IF independants pour statut et validation_status
--   8 types d'action workflow dans CASE statement
--
-- Tests effectues:
--   1. Rejet sans motif -> {success:false, errors:["motif obligatoire"]} ✅
--   2. Rejet avec motif -> {success:true, audit=1, notif=3} ✅
--   3. Rollback: statut=attribue restaure, donnees test nettoyees ✅
