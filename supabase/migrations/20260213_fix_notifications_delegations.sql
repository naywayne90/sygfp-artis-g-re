-- =============================================
-- Gap 4 : Notifications ignorent delegations et interims
--
-- Probleme : Quand une Note SEF est soumise, seuls les DG directs
-- sont notifies. Les delegataires et interimaires sont ignores.
-- De plus, 2 triggers (A: notify_on_notes_sef_status_change +
-- B: trigger_notify_note_sef_soumise) creent des doublons.
--
-- Solution :
-- A. Creer get_users_who_can_act_as_role() (direct + delegation + interim)
-- B. Mettre a jour notify_role() pour utiliser cette fonction
-- C. Mettre a jour notify_on_notes_sef_status_change() pour delegations
-- D. Supprimer le trigger doublon notify_note_sef_soumise
-- =============================================

-- =============================================
-- A. Fonction : get_users_who_can_act_as_role
-- Retourne TOUS les user_id pouvant agir dans un role
-- (role direct + delegation active + interim actif)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_users_who_can_act_as_role(
  p_role TEXT,
  p_scope TEXT DEFAULT NULL  -- ex: 'notes', 'engagements', etc.
)
RETURNS TABLE(user_id UUID)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY

  -- 1. Role direct
  SELECT ur.user_id
  FROM user_roles ur
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true

  UNION

  -- 2. Delegation active : le delegateur a le role, le delegataire recoit la notif
  SELECT d.delegataire_id AS user_id
  FROM delegations d
  JOIN user_roles ur ON ur.user_id = d.delegateur_id
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND (p_scope IS NULL OR p_scope = ANY(d.perimetre))

  UNION

  -- 3. Interim actif : le titulaire a le role, l'interimaire recoit la notif
  SELECT i.interimaire_id AS user_id
  FROM interims i
  JOIN user_roles ur ON ur.user_id = i.titulaire_id
  WHERE ur.role = p_role::app_role
    AND ur.is_active = true
    AND i.est_actif = true
    AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin;
END;
$$;

COMMENT ON FUNCTION public.get_users_who_can_act_as_role IS
  'Retourne tous les utilisateurs pouvant agir dans un role donne: role direct, delegation active (avec scope optionnel), et interim actif.';

GRANT EXECUTE ON FUNCTION public.get_users_who_can_act_as_role TO authenticated;

-- =============================================
-- B. Mettre a jour notify_role() pour utiliser get_users_who_can_act_as_role
-- Cela corrige d'un coup TOUS les triggers qui appellent notify_role():
-- - Notes AEF -> Directeur
-- - Engagements -> CB
-- - Ordonnancements -> DG
-- - Feuilles de route -> DG + DAAF
-- - Taches bloquees -> Directeur
-- =============================================
CREATE OR REPLACE FUNCTION notify_role(
  p_role TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_scope TEXT;
BEGIN
  -- Deduire le scope depuis entity_type pour les delegations
  CASE p_entity_type
    WHEN 'notes_sef' THEN v_scope := 'notes';
    WHEN 'notes_dg' THEN v_scope := 'notes';
    WHEN 'budget_engagements' THEN v_scope := 'engagements';
    WHEN 'ordonnancements' THEN v_scope := 'ordonnancements';
    WHEN 'roadmap_submission' THEN v_scope := NULL; -- Pas de filtrage par scope
    WHEN 'task_execution' THEN v_scope := NULL;
    ELSE v_scope := NULL;
  END CASE;

  -- Inserer une notification pour chaque utilisateur pouvant agir dans le role
  -- (direct + delegation + interim, deduplique par UNION)
  FOR v_user_id IN
    SELECT u.user_id FROM get_users_who_can_act_as_role(p_role, v_scope) u
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message, entity_type, entity_id, is_urgent, priority
    ) VALUES (
      v_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id,
      p_is_urgent, CASE WHEN p_is_urgent THEN 'high' ELSE 'normal' END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- C. Mettre a jour notify_on_notes_sef_status_change()
-- Pour 'soumis': utiliser get_users_who_can_act_as_role au lieu de profiles.role_hierarchique
-- Pour 'valide/rejete/differe': enrichir avec le mode de validation
-- =============================================
CREATE OR REPLACE FUNCTION notify_on_notes_sef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_titre TEXT;
  v_message TEXT;
  v_type TEXT;
  v_ref TEXT;
  v_validator_name TEXT;
  v_mode_label TEXT;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    v_ref := COALESCE(NEW.reference_pivot, NEW.numero, 'brouillon');

    -- Recuperer le nom du validateur si applicable (valide/rejete/differe)
    IF NEW.statut IN ('valide', 'rejete', 'differe') THEN
      SELECT p.full_name INTO v_validator_name
      FROM profiles p
      WHERE p.id = auth.uid();

      -- Mode de validation lisible
      CASE NEW.validation_mode
        WHEN 'delegation' THEN
          v_mode_label := ' (par delegation)';
        WHEN 'interim' THEN
          v_mode_label := ' (par interim)';
        ELSE
          v_mode_label := '';
      END CASE;
    END IF;

    CASE NEW.statut
      WHEN 'soumis' THEN
        v_titre := 'Note soumise';
        v_message := 'Votre note ' || v_ref || ' a ete soumise pour validation.';
        v_type := 'note_soumise';
      WHEN 'valide' THEN
        v_titre := 'Note validee';
        v_message := 'Votre note ' || v_ref || ' a ete validee par '
          || COALESCE(v_validator_name, 'un validateur') || v_mode_label || '.';
        v_type := 'note_validee';
      WHEN 'rejete' THEN
        v_titre := 'Note rejetee';
        v_message := 'Votre note ' || v_ref || ' a ete rejetee par '
          || COALESCE(v_validator_name, 'un validateur') || v_mode_label
          || '. Motif: ' || COALESCE(NEW.motif_rejet, 'Non specifie');
        v_type := 'note_rejetee';
      WHEN 'differe' THEN
        v_titre := 'Note differee';
        v_message := 'Votre note ' || v_ref || ' a ete differee par '
          || COALESCE(v_validator_name, 'un validateur') || v_mode_label || '.';
        v_type := 'note_differee';
      ELSE
        v_titre := 'Changement de statut';
        v_message := 'Votre note ' || v_ref || ' est passee au statut: ' || NEW.statut;
        v_type := 'statut_change';
    END CASE;

    -- Notifier le createur
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (NEW.created_by, v_type, v_titre, v_message, 'notes_sef', NEW.id, 'workflow');

    -- Si soumis, notifier DG + delegataires + interimaires (sans doublons grace a UNION)
    IF NEW.statut = 'soumis' THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
      SELECT u.user_id,
             'note_a_valider',
             'Nouvelle note a valider',
             'La note ' || v_ref || ' est en attente de validation.',
             'notes_sef',
             NEW.id,
             'workflow'
      FROM get_users_who_can_act_as_role('DG', 'notes') u
      WHERE u.user_id != NEW.created_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

-- =============================================
-- D. Supprimer le trigger doublon (migration 20260119110000)
-- Le trigger notify_note_sef_soumise fait doublon avec trigger_notify_notes_sef_status
-- car les deux se declenchent sur UPDATE de statut sur notes_sef.
-- On garde trigger_notify_notes_sef_status (plus complet, gere tous les statuts).
-- =============================================
DROP TRIGGER IF EXISTS notify_note_sef_soumise ON notes_sef;

-- On garde la fonction trigger_notify_note_sef_soumise() au cas ou d'autres references
-- existent, mais le trigger est supprime donc elle ne s'executera plus.

-- =============================================
-- Verification : le trigger restant est bien en place
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_notify_notes_sef_status'
      AND tgrelid = 'notes_sef'::regclass
  ) THEN
    CREATE TRIGGER trigger_notify_notes_sef_status
    AFTER UPDATE OF statut ON notes_sef
    FOR EACH ROW EXECUTE FUNCTION notify_on_notes_sef_status_change();
  END IF;
END;
$$;

-- =============================================
-- Index de performance pour les lookups delegation/interim
-- =============================================
CREATE INDEX IF NOT EXISTS idx_delegations_active_dates
  ON delegations(delegataire_id, est_active, date_debut, date_fin)
  WHERE est_active = true;

CREATE INDEX IF NOT EXISTS idx_interims_active_dates
  ON interims(interimaire_id, est_actif, date_debut, date_fin)
  WHERE est_actif = true;
