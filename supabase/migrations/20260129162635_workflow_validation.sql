-- ============================================================================
-- MIGRATION: Workflow de validation avec historisation
-- Date: 29/01/2026
-- Auteur: TRESOR (Agent Backend SYGFP)
-- ============================================================================
--
-- STATUTS POSSIBLES: brouillon, soumis, a_valider, valide, differe, rejete, impute
--
-- WORKFLOW:
--   brouillon → soumis → a_valider → valide/differe/rejete
--   differe → soumis (apres correction)
--   valide → impute (pour notes AEF)
--
-- CONTRAINTES:
--   - Differe: motif_differe obligatoire, date_reprise optionnelle, condition_reprise optionnelle
--   - Rejete: rejection_reason obligatoire
--   - Toutes les validations sont historisees automatiquement
-- ============================================================================

-- 1. Ajouter les colonnes manquantes a notes_dg (AEF)
-- ============================================================================
-- notes_sef a deja: differe_condition, differe_date_reprise
-- notes_dg a: date_differe, motif_differe mais pas les autres

ALTER TABLE public.notes_dg
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.notes_dg
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.notes_dg
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

-- 2. Ajouter les colonnes aux tables de la chaine de depense
-- ============================================================================

-- 2.1 budget_engagements
ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id);

-- 2.2 budget_liquidations (a deja la plupart)
ALTER TABLE public.budget_liquidations
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.budget_liquidations
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.budget_liquidations
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

-- 2.3 ordonnancements (a deja la plupart)
ALTER TABLE public.ordonnancements
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.ordonnancements
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.ordonnancements
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

-- 2.4 reglements
ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS differe_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS motif_differe TEXT;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id);

-- 2.5 imputations
ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS differe_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMPTZ;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS motif_differe TEXT;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS differe_condition TEXT;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS differe_date_reprise TIMESTAMPTZ;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE public.imputations
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id);

-- 3. Creer la table d'historique des validations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification de l'entite
  entity_type TEXT NOT NULL,                -- notes_sef, notes_dg, budget_engagements, etc.
  entity_id UUID NOT NULL,                  -- ID de l'entite
  entity_numero TEXT,                       -- Numero/reference de l'entite

  -- Changement de statut
  ancien_statut TEXT,                       -- Statut precedent (null si creation)
  nouveau_statut TEXT NOT NULL,             -- Nouveau statut

  -- Action effectuee
  action TEXT NOT NULL CHECK (action IN ('creation', 'soumission', 'validation', 'report', 'rejet', 'imputation', 'correction', 'annulation')),

  -- Motifs (selon l'action)
  motif TEXT,                               -- Motif du report ou rejet
  condition_reprise TEXT,                   -- Condition pour reprise (report)
  date_reprise TIMESTAMPTZ,                 -- Date prevue de reprise (report)

  -- Utilisateur et horodatage
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,                           -- Nom complet de l'utilisateur (denormalise)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contexte supplementaire
  exercice INTEGER,
  direction_id UUID REFERENCES public.directions(id),
  ip_address TEXT,
  metadata JSONB                            -- Donnees supplementaires si necessaire
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_validation_history_entity
ON public.validation_history(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_validation_history_user
ON public.validation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_validation_history_date
ON public.validation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_history_action
ON public.validation_history(action);

CREATE INDEX IF NOT EXISTS idx_validation_history_exercice
ON public.validation_history(exercice);

-- 4. Activer RLS sur validation_history
-- ============================================================================
ALTER TABLE public.validation_history ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifies peuvent voir l'historique
DROP POLICY IF EXISTS "validation_history_select" ON public.validation_history;
CREATE POLICY "validation_history_select" ON public.validation_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Insertion: uniquement via triggers (service role) ou utilisateurs authentifies
DROP POLICY IF EXISTS "validation_history_insert" ON public.validation_history;
CREATE POLICY "validation_history_insert" ON public.validation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Pas de mise a jour ni suppression (historique immutable)
-- On ne cree pas de policy UPDATE ou DELETE

-- 5. Fonction generique pour logger les changements de validation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_validation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_motif TEXT;
  v_condition TEXT;
  v_date_reprise TIMESTAMPTZ;
  v_user_id UUID;
  v_user_name TEXT;
  v_exercice INTEGER;
  v_direction_id UUID;
  v_numero TEXT;
BEGIN
  -- Ne rien faire si le statut n'a pas change
  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  -- Determiner l'action basee sur le nouveau statut
  v_action := CASE NEW.statut
    WHEN 'brouillon' THEN 'creation'
    WHEN 'soumis' THEN 'soumission'
    WHEN 'a_valider' THEN 'soumission'
    WHEN 'valide' THEN 'validation'
    WHEN 'validee' THEN 'validation'
    WHEN 'differe' THEN 'report'
    WHEN 'rejete' THEN 'rejet'
    WHEN 'impute' THEN 'imputation'
    WHEN 'imputee' THEN 'imputation'
    WHEN 'annule' THEN 'annulation'
    ELSE 'correction'
  END;

  -- Recuperer le motif selon l'action
  v_motif := CASE
    WHEN NEW.statut IN ('differe') THEN COALESCE(NEW.differe_motif, NEW.motif_differe)
    WHEN NEW.statut IN ('rejete') THEN COALESCE(NEW.rejection_reason, NEW.motif_rejet)
    ELSE NULL
  END;

  -- Recuperer la condition et date de reprise pour les reports
  IF NEW.statut = 'differe' THEN
    v_condition := NEW.differe_condition;
    v_date_reprise := NEW.differe_date_reprise;
  END IF;

  -- Determiner l'utilisateur qui a fait l'action
  v_user_id := CASE NEW.statut
    WHEN 'soumis' THEN COALESCE(NEW.submitted_by, NEW.created_by)
    WHEN 'a_valider' THEN COALESCE(NEW.submitted_by, NEW.created_by)
    WHEN 'valide' THEN NEW.validated_by
    WHEN 'validee' THEN NEW.validated_by
    WHEN 'differe' THEN NEW.differe_by
    WHEN 'rejete' THEN COALESCE(NEW.rejected_by, NEW.validated_by)
    WHEN 'impute' THEN COALESCE(NEW.imputed_by, NEW.validated_by)
    WHEN 'imputee' THEN COALESCE(NEW.imputed_by, NEW.validated_by)
    ELSE auth.uid()
  END;

  -- Recuperer le nom de l'utilisateur
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;

  -- Recuperer l'exercice et la direction (selon la table)
  v_exercice := NEW.exercice;
  v_direction_id := NEW.direction_id;
  v_numero := NEW.numero;

  -- Inserer dans l'historique
  INSERT INTO validation_history (
    entity_type,
    entity_id,
    entity_numero,
    ancien_statut,
    nouveau_statut,
    action,
    motif,
    condition_reprise,
    date_reprise,
    user_id,
    user_name,
    exercice,
    direction_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    v_numero,
    OLD.statut,
    NEW.statut,
    v_action,
    v_motif,
    v_condition,
    v_date_reprise,
    v_user_id,
    v_user_name,
    v_exercice,
    v_direction_id,
    now()
  );

  RETURN NEW;
END;
$$;

-- 6. Creer les triggers sur chaque table
-- ============================================================================

-- 6.1 Trigger sur notes_sef
DROP TRIGGER IF EXISTS trg_log_validation_notes_sef ON public.notes_sef;
CREATE TRIGGER trg_log_validation_notes_sef
  AFTER UPDATE ON public.notes_sef
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.2 Trigger sur notes_dg
DROP TRIGGER IF EXISTS trg_log_validation_notes_dg ON public.notes_dg;
CREATE TRIGGER trg_log_validation_notes_dg
  AFTER UPDATE ON public.notes_dg
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.3 Trigger sur budget_engagements
DROP TRIGGER IF EXISTS trg_log_validation_engagements ON public.budget_engagements;
CREATE TRIGGER trg_log_validation_engagements
  AFTER UPDATE ON public.budget_engagements
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.4 Trigger sur budget_liquidations
DROP TRIGGER IF EXISTS trg_log_validation_liquidations ON public.budget_liquidations;
CREATE TRIGGER trg_log_validation_liquidations
  AFTER UPDATE ON public.budget_liquidations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.5 Trigger sur ordonnancements
DROP TRIGGER IF EXISTS trg_log_validation_ordonnancements ON public.ordonnancements;
CREATE TRIGGER trg_log_validation_ordonnancements
  AFTER UPDATE ON public.ordonnancements
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.6 Trigger sur reglements
DROP TRIGGER IF EXISTS trg_log_validation_reglements ON public.reglements;
CREATE TRIGGER trg_log_validation_reglements
  AFTER UPDATE ON public.reglements
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 6.7 Trigger sur imputations
DROP TRIGGER IF EXISTS trg_log_validation_imputations ON public.imputations;
CREATE TRIGGER trg_log_validation_imputations
  AFTER UPDATE ON public.imputations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION log_validation_change();

-- 7. Fonction de validation avec controles
-- ============================================================================
-- Verifie que les motifs sont fournis lors des reports/rejets

CREATE OR REPLACE FUNCTION public.check_validation_motif()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on passe en differe, le motif est obligatoire
  IF NEW.statut = 'differe' THEN
    IF COALESCE(NEW.differe_motif, NEW.motif_differe, '') = '' THEN
      RAISE EXCEPTION 'Le motif de report est obligatoire pour passer au statut "differe"';
    END IF;
    -- S'assurer que differe_by et differe_at sont remplis
    IF NEW.differe_by IS NULL THEN
      NEW.differe_by := auth.uid();
    END IF;
    IF NEW.differe_at IS NULL THEN
      NEW.differe_at := now();
    END IF;
  END IF;

  -- Si on passe en rejete, le motif est obligatoire
  IF NEW.statut = 'rejete' THEN
    IF COALESCE(NEW.rejection_reason, NEW.motif_rejet, '') = '' THEN
      RAISE EXCEPTION 'Le motif de rejet est obligatoire pour passer au statut "rejete"';
    END IF;
    -- S'assurer que rejected_by et rejected_at sont remplis
    IF NEW.rejected_by IS NULL THEN
      NEW.rejected_by := auth.uid();
    END IF;
    IF NEW.rejected_at IS NULL THEN
      NEW.rejected_at := now();
    END IF;
  END IF;

  -- Si on passe en valide/validee, s'assurer que validated_by et validated_at sont remplis
  IF NEW.statut IN ('valide', 'validee') THEN
    IF NEW.validated_by IS NULL THEN
      NEW.validated_by := auth.uid();
    END IF;
    IF NEW.validated_at IS NULL THEN
      NEW.validated_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 7.1 Appliquer le controle sur notes_sef
DROP TRIGGER IF EXISTS trg_check_validation_motif_sef ON public.notes_sef;
CREATE TRIGGER trg_check_validation_motif_sef
  BEFORE UPDATE ON public.notes_sef
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_validation_motif();

-- 7.2 Appliquer le controle sur notes_dg
DROP TRIGGER IF EXISTS trg_check_validation_motif_dg ON public.notes_dg;
CREATE TRIGGER trg_check_validation_motif_dg
  BEFORE UPDATE ON public.notes_dg
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_validation_motif();

-- 7.3 Appliquer le controle sur budget_engagements
DROP TRIGGER IF EXISTS trg_check_validation_motif_eng ON public.budget_engagements;
CREATE TRIGGER trg_check_validation_motif_eng
  BEFORE UPDATE ON public.budget_engagements
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_validation_motif();

-- 7.4 Appliquer le controle sur budget_liquidations
DROP TRIGGER IF EXISTS trg_check_validation_motif_liq ON public.budget_liquidations;
CREATE TRIGGER trg_check_validation_motif_liq
  BEFORE UPDATE ON public.budget_liquidations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_validation_motif();

-- 7.5 Appliquer le controle sur ordonnancements
DROP TRIGGER IF EXISTS trg_check_validation_motif_ord ON public.ordonnancements;
CREATE TRIGGER trg_check_validation_motif_ord
  BEFORE UPDATE ON public.ordonnancements
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_validation_motif();

-- 8. Index sur les colonnes de statut et validation
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notes_sef_statut ON public.notes_sef(statut);
CREATE INDEX IF NOT EXISTS idx_notes_sef_validated_at ON public.notes_sef(validated_at);

CREATE INDEX IF NOT EXISTS idx_notes_dg_statut ON public.notes_dg(statut);
CREATE INDEX IF NOT EXISTS idx_notes_dg_validated_at ON public.notes_dg(validated_at);

CREATE INDEX IF NOT EXISTS idx_engagements_statut ON public.budget_engagements(statut);
CREATE INDEX IF NOT EXISTS idx_engagements_validated_at ON public.budget_engagements(validated_at);

CREATE INDEX IF NOT EXISTS idx_liquidations_statut ON public.budget_liquidations(statut);
CREATE INDEX IF NOT EXISTS idx_liquidations_validated_at ON public.budget_liquidations(validated_at);

CREATE INDEX IF NOT EXISTS idx_ordonnancements_statut ON public.ordonnancements(statut);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_validated_at ON public.ordonnancements(validated_at);

CREATE INDEX IF NOT EXISTS idx_reglements_statut ON public.reglements(statut);
CREATE INDEX IF NOT EXISTS idx_reglements_validated_at ON public.reglements(validated_at);

-- 9. Vue pour consulter l'historique de validation d'une entite
-- ============================================================================
CREATE OR REPLACE VIEW public.v_validation_timeline AS
SELECT
  vh.id,
  vh.entity_type,
  vh.entity_id,
  vh.entity_numero,
  vh.ancien_statut,
  vh.nouveau_statut,
  vh.action,
  CASE vh.action
    WHEN 'creation' THEN 'Creation'
    WHEN 'soumission' THEN 'Soumission'
    WHEN 'validation' THEN 'Validation'
    WHEN 'report' THEN 'Report'
    WHEN 'rejet' THEN 'Rejet'
    WHEN 'imputation' THEN 'Imputation'
    WHEN 'correction' THEN 'Correction'
    WHEN 'annulation' THEN 'Annulation'
    ELSE vh.action
  END AS action_libelle,
  vh.motif,
  vh.condition_reprise,
  vh.date_reprise,
  vh.user_id,
  vh.user_name,
  vh.exercice,
  vh.direction_id,
  d.label AS direction_label,
  vh.created_at,
  -- Calcul du delai depuis l'action precedente
  vh.created_at - LAG(vh.created_at) OVER (
    PARTITION BY vh.entity_type, vh.entity_id
    ORDER BY vh.created_at
  ) AS delai_depuis_precedent
FROM validation_history vh
LEFT JOIN directions d ON d.id = vh.direction_id
ORDER BY vh.created_at DESC;

-- 10. Fonction RPC pour obtenir l'historique d'une entite
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_entity_validation_history(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE(
  id UUID,
  ancien_statut TEXT,
  nouveau_statut TEXT,
  action TEXT,
  action_libelle TEXT,
  motif TEXT,
  condition_reprise TEXT,
  date_reprise TIMESTAMPTZ,
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMPTZ,
  delai_heures NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vh.id,
    vh.ancien_statut,
    vh.nouveau_statut,
    vh.action,
    CASE vh.action
      WHEN 'creation' THEN 'Creation'
      WHEN 'soumission' THEN 'Soumission'
      WHEN 'validation' THEN 'Validation'
      WHEN 'report' THEN 'Report'
      WHEN 'rejet' THEN 'Rejet'
      WHEN 'imputation' THEN 'Imputation'
      WHEN 'correction' THEN 'Correction'
      WHEN 'annulation' THEN 'Annulation'
      ELSE vh.action
    END::TEXT AS action_libelle,
    vh.motif,
    vh.condition_reprise,
    vh.date_reprise,
    vh.user_id,
    vh.user_name,
    vh.created_at,
    ROUND(EXTRACT(EPOCH FROM (
      vh.created_at - LAG(vh.created_at) OVER (ORDER BY vh.created_at)
    )) / 3600, 2) AS delai_heures
  FROM validation_history vh
  WHERE vh.entity_type = p_entity_type
    AND vh.entity_id = p_entity_id
  ORDER BY vh.created_at ASC;
END;
$$;

-- 11. Commentaires de documentation
-- ============================================================================
COMMENT ON TABLE public.validation_history IS
'Historique immutable de toutes les validations/reports/rejets sur les entites de la chaine de depense.
Chaque changement de statut est automatiquement enregistre via trigger.';

COMMENT ON FUNCTION public.log_validation_change IS
'Trigger function qui enregistre automatiquement les changements de statut dans validation_history.
Capture le motif, la condition de reprise, et les informations utilisateur.';

COMMENT ON FUNCTION public.check_validation_motif IS
'Trigger function qui verifie que les motifs obligatoires sont fournis lors des reports/rejets.
Remplit automatiquement les colonnes validated_by, rejected_by, differe_by si manquantes.';

COMMENT ON FUNCTION public.get_entity_validation_history IS
'Retourne l''historique complet des validations pour une entite donnee, avec calcul des delais.';

COMMENT ON VIEW public.v_validation_timeline IS
'Vue pour consulter l''historique de validation avec les libelles d''actions et les delais.';
