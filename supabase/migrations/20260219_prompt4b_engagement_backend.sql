-- ============================================================================
-- Prompt 4b: Enrichissement backend budget_engagements
-- Combine: migration structurelle (non déployée) + nouvelles exigences
-- Date: 2026-02-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. Fix legacy row avec montant = 0 (empêche CHECK montant > 0)
-- ============================================================================
UPDATE budget_engagements SET montant = 0.01
WHERE id = '89bb8cab-f158-253f-c6f0-773bafff8c04' AND montant = 0;

-- ============================================================================
-- 1. Colonne type_engagement
-- ============================================================================
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS type_engagement TEXT DEFAULT 'hors_marche';

DO $$ BEGIN
  ALTER TABLE budget_engagements
    ADD CONSTRAINT chk_type_engagement
    CHECK (type_engagement IN ('sur_marche', 'hors_marche'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: engagements liés à un marché → sur_marche
UPDATE budget_engagements
SET type_engagement = 'sur_marche'
WHERE (passation_marche_id IS NOT NULL OR marche_id IS NOT NULL)
  AND type_engagement = 'hors_marche';

-- ============================================================================
-- 2. Colonne prestataire_id → FK prestataires
-- ============================================================================
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS prestataire_id UUID REFERENCES prestataires(id);

-- ============================================================================
-- 3. CHECK montant > 0
-- NOTE: ALTER COLUMN montant TYPE NUMERIC(15,2) omis car la vue
-- documents_index dépend de cette colonne. Le type NUMERIC sans précision
-- est suffisant ; la précision est appliquée côté application.
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE budget_engagements
    ADD CONSTRAINT chk_montant_positive CHECK (montant > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. Contrainte: sur_marche → marche_id OU passation_marche_id NOT NULL
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE budget_engagements
    ADD CONSTRAINT chk_sur_marche_requires_marche
    CHECK (
      type_engagement IS NULL
      OR type_engagement != 'sur_marche'
      OR marche_id IS NOT NULL
      OR passation_marche_id IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. Statut CHECK: ajouter brouillon, soumis, differe au workflow
-- ============================================================================
ALTER TABLE budget_engagements DROP CONSTRAINT IF EXISTS budget_engagements_statut_check;
ALTER TABLE budget_engagements ADD CONSTRAINT budget_engagements_statut_check
  CHECK (statut IN ('brouillon', 'en_attente', 'soumis', 'valide', 'rejete', 'differe', 'liquide'));

-- ============================================================================
-- 6. Index standardisés + nettoyage doublons
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_engagements_marche ON budget_engagements(marche_id);
CREATE INDEX IF NOT EXISTS idx_engagements_budget ON budget_engagements(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_engagements_statut ON budget_engagements(statut);
CREATE INDEX IF NOT EXISTS idx_engagements_prestataire ON budget_engagements(prestataire_id);

-- Supprimer les index doublons (même colonne, nom différent)
DROP INDEX IF EXISTS idx_budget_engagements_line;
DROP INDEX IF EXISTS idx_budget_engagements_budget_line;
DROP INDEX IF EXISTS idx_budget_engagements_statut;

-- Index passation marché signés
CREATE INDEX IF NOT EXISTS idx_passation_marche_statut_exercice
  ON passation_marche(statut, exercice)
  WHERE statut IN ('approuve', 'signe');

-- ============================================================================
-- 7. Référence ARTI05MMYYNNNN (code étape 05)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_reference_engagement(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN generate_arti_reference(5, p_date);
END;
$$;

COMMENT ON FUNCTION public.generate_reference_engagement IS
  'Génère une référence engagement au format ARTI05MMYYNNNN (code étape 05)';

-- Trigger unifié: garde les formats legacy (ENG-, MIG-ENG-), génère ARTI pour les nouveaux
CREATE OR REPLACE FUNCTION public.trg_unified_ref_engagements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NOT NULL
     AND NEW.numero != ''
     AND (NEW.numero ~ '^ARTI[0-9]{9,10}$' OR NEW.numero ~ '^ENG-' OR NEW.numero ~ '^MIG-ENG-')
  THEN
    RETURN NEW;
  END IF;
  NEW.numero := generate_reference_engagement(COALESCE(NEW.created_at, now()));
  RETURN NEW;
END;
$$;

-- Remplacer l'ancien trigger par le nouveau
DROP TRIGGER IF EXISTS generate_engagement_numero_trigger ON public.budget_engagements;
DROP TRIGGER IF EXISTS trg_unified_ref_engagements ON public.budget_engagements;
CREATE TRIGGER trg_unified_ref_engagements
  BEFORE INSERT ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_engagements();

COMMIT;
