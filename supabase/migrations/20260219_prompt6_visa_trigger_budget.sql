-- ============================================================================
-- Prompt 6: Colonnes visa + trigger contrôle crédits + audit log
-- Date: 2026-02-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Colonnes visa sur budget_engagements
-- ============================================================================
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS visa_saf_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_saf_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_saf_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS visa_cb_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_cb_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_cb_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS visa_daaf_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_daaf_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_daaf_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS visa_dg_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visa_dg_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visa_dg_commentaire TEXT,
  ADD COLUMN IF NOT EXISTS motif_rejet TEXT;

-- Index sur les FK visa (pour jointures profils)
CREATE INDEX IF NOT EXISTS idx_engagements_visa_saf ON budget_engagements(visa_saf_user_id) WHERE visa_saf_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engagements_visa_cb ON budget_engagements(visa_cb_user_id) WHERE visa_cb_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engagements_visa_daaf ON budget_engagements(visa_daaf_user_id) WHERE visa_daaf_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engagements_visa_dg ON budget_engagements(visa_dg_user_id) WHERE visa_dg_user_id IS NOT NULL;

-- ============================================================================
-- 2. Mise à jour CHECK statut : ajouter visa_saf, visa_cb, visa_daaf
-- ============================================================================
ALTER TABLE budget_engagements DROP CONSTRAINT IF EXISTS budget_engagements_statut_check;
ALTER TABLE budget_engagements ADD CONSTRAINT budget_engagements_statut_check
  CHECK (statut IN (
    'brouillon', 'en_attente', 'soumis',
    'visa_saf', 'visa_cb', 'visa_daaf',
    'valide', 'rejete', 'differe', 'liquide'
  ));

-- ============================================================================
-- 3. BEFORE UPDATE : contrôle crédits insuffisants + workflow statut
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
  -- Contrôle uniquement lors du passage à 'valide'
  IF NEW.statut = 'valide' AND OLD.statut IS DISTINCT FROM 'valide' THEN

    -- Récupérer dotation actuelle
    SELECT COALESCE(bl.dotation_modifiee, bl.dotation_initiale)
    INTO v_dotation
    FROM budget_lines bl
    WHERE bl.id = NEW.budget_line_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ligne budgétaire % introuvable', NEW.budget_line_id;
    END IF;

    -- Calculer total engagé validé HORS cet engagement
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total_engage
    FROM budget_engagements
    WHERE budget_line_id = NEW.budget_line_id
      AND statut = 'valide'
      AND id != NEW.id;

    v_disponible := v_dotation - v_total_engage;

    -- Vérifier crédits suffisants
    IF v_disponible < NEW.montant THEN
      RAISE EXCEPTION 'Crédits insuffisants: disponible = % FCFA, montant engagement = % FCFA (ligne %)',
        v_disponible, NEW.montant,
        (SELECT code FROM budget_lines WHERE id = NEW.budget_line_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_check_engagement_credits IS
  'BEFORE UPDATE: vérifie crédits disponibles avant validation engagement. RAISE EXCEPTION si insuffisant.';

-- Trigger BEFORE UPDATE, priorité haute (avant les AFTER triggers)
DROP TRIGGER IF EXISTS trg_check_engagement_credits ON budget_engagements;
CREATE TRIGGER trg_check_engagement_credits
  BEFORE UPDATE ON budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_engagement_credits();

-- ============================================================================
-- 4. Fonction de validation workflow statut
--    brouillon → soumis → visa_saf → visa_cb → visa_daaf → valide
--    Tout statut → rejete (avec motif_rejet obligatoire)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_validate_engagement_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transitions JSONB := '{
    "brouillon": ["soumis", "rejete"],
    "en_attente": ["soumis", "rejete"],
    "soumis": ["visa_saf", "rejete"],
    "visa_saf": ["visa_cb", "rejete"],
    "visa_cb": ["visa_daaf", "rejete"],
    "visa_daaf": ["valide", "rejete"],
    "valide": ["liquide"],
    "rejete": ["brouillon"],
    "differe": ["soumis", "rejete"]
  }'::jsonb;
  v_allowed JSONB;
BEGIN
  -- Pas de changement de statut → rien à vérifier
  IF NEW.statut = OLD.statut THEN
    RETURN NEW;
  END IF;

  -- Récupérer transitions autorisées
  v_allowed := v_transitions -> OLD.statut;

  -- Vérifier la transition
  IF v_allowed IS NULL OR NOT v_allowed ? NEW.statut THEN
    RAISE EXCEPTION 'Transition de statut interdite: % → %', OLD.statut, NEW.statut;
  END IF;

  -- Rejet → motif_rejet obligatoire
  IF NEW.statut = 'rejete' AND (NEW.motif_rejet IS NULL OR trim(NEW.motif_rejet) = '') THEN
    RAISE EXCEPTION 'motif_rejet obligatoire pour un rejet';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_validate_engagement_workflow IS
  'BEFORE UPDATE: valide les transitions de statut selon le workflow visa (brouillon→soumis→visa_saf→visa_cb→visa_daaf→valide).';

DROP TRIGGER IF EXISTS trg_validate_engagement_workflow ON budget_engagements;
CREATE TRIGGER trg_validate_engagement_workflow
  BEFORE UPDATE ON budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_engagement_workflow();

-- ============================================================================
-- 5. Audit log pour chaque changement de visa/statut
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_audit_engagement_visa()
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

  v_action := 'engagement_' || NEW.statut;

  -- Déterminer l'utilisateur du visa selon le nouveau statut
  v_user_id := CASE NEW.statut
    WHEN 'visa_saf' THEN NEW.visa_saf_user_id
    WHEN 'visa_cb' THEN NEW.visa_cb_user_id
    WHEN 'visa_daaf' THEN NEW.visa_daaf_user_id
    WHEN 'valide' THEN NEW.visa_dg_user_id
    WHEN 'rejete' THEN COALESCE(
      NEW.visa_dg_user_id, NEW.visa_daaf_user_id,
      NEW.visa_cb_user_id, NEW.visa_saf_user_id
    )
    ELSE NULL
  END;

  -- Détails du changement
  v_details := jsonb_build_object(
    'old_statut', OLD.statut,
    'new_statut', NEW.statut,
    'numero', NEW.numero,
    'montant', NEW.montant,
    'budget_line_id', NEW.budget_line_id
  );

  -- Ajouter motif_rejet si présent
  IF NEW.statut = 'rejete' THEN
    v_details := v_details || jsonb_build_object('motif_rejet', NEW.motif_rejet);
  END IF;

  -- Ajouter commentaire du visa courant
  IF NEW.statut = 'visa_saf' AND NEW.visa_saf_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire', NEW.visa_saf_commentaire);
  ELSIF NEW.statut = 'visa_cb' AND NEW.visa_cb_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire', NEW.visa_cb_commentaire);
  ELSIF NEW.statut = 'visa_daaf' AND NEW.visa_daaf_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire', NEW.visa_daaf_commentaire);
  ELSIF NEW.statut = 'valide' AND NEW.visa_dg_commentaire IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('commentaire', NEW.visa_dg_commentaire);
  END IF;

  -- Insérer dans audit_logs
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values, exercice
  ) VALUES (
    v_user_id,
    v_action,
    'budget_engagements',
    NEW.id,
    jsonb_build_object('statut', OLD.statut),
    v_details,
    NEW.exercice
  );

  -- Insérer aussi dans engagement_validations (table existante)
  IF NEW.statut IN ('visa_saf', 'visa_cb', 'visa_daaf', 'valide', 'rejete') THEN
    INSERT INTO engagement_validations (
      engagement_id, step_order, role, validated_by, validated_at,
      status, comments
    ) VALUES (
      NEW.id,
      CASE NEW.statut
        WHEN 'visa_saf' THEN 1
        WHEN 'visa_cb' THEN 2
        WHEN 'visa_daaf' THEN 3
        WHEN 'valide' THEN 4
        WHEN 'rejete' THEN 99
      END,
      CASE NEW.statut
        WHEN 'visa_saf' THEN 'SAF'
        WHEN 'visa_cb' THEN 'CB'
        WHEN 'visa_daaf' THEN 'DAAF'
        WHEN 'valide' THEN 'DG'
        WHEN 'rejete' THEN 'REJET'
      END,
      v_user_id,
      now(),
      CASE WHEN NEW.statut = 'rejete' THEN 'rejected' ELSE 'approved' END,
      CASE NEW.statut
        WHEN 'visa_saf' THEN NEW.visa_saf_commentaire
        WHEN 'visa_cb' THEN NEW.visa_cb_commentaire
        WHEN 'visa_daaf' THEN NEW.visa_daaf_commentaire
        WHEN 'valide' THEN NEW.visa_dg_commentaire
        WHEN 'rejete' THEN NEW.motif_rejet
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_audit_engagement_visa IS
  'AFTER UPDATE: log chaque visa dans audit_logs + engagement_validations.';

DROP TRIGGER IF EXISTS trg_audit_engagement_visa ON budget_engagements;
CREATE TRIGGER trg_audit_engagement_visa
  AFTER UPDATE ON budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_engagement_visa();

-- ============================================================================
-- 6. Mise à jour disponible_calcule via recalculate (déjà géré)
--    fn_update_engagement_rate() met à jour budget_lines.total_engage
--    recalculate_budget_line_totals() recalcule disponible_calcule
--    → PAS DE DUPLICATION, on ne touche pas ces fonctions existantes
-- ============================================================================

COMMIT;
