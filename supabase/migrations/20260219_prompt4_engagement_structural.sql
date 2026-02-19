-- ============================================================================
-- Prompt 4: Corrections structurelles engagements
-- 1. type_engagement ('sur_marche' / 'hors_marche')
-- 2. Contrainte FK marché pour sur_marche
-- 3. Référence ARTI05MMYYNNNN (code étape 05)
-- ============================================================================

-- ============================================================================
-- 1. Ajout colonne type_engagement
-- ============================================================================
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS type_engagement TEXT DEFAULT 'hors_marche';

-- Contrainte de valeurs
DO $$ BEGIN
  ALTER TABLE budget_engagements
    ADD CONSTRAINT chk_type_engagement
    CHECK (type_engagement IN ('sur_marche', 'hors_marche'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. Backfill: engagements liés à un marché → sur_marche
-- ============================================================================
UPDATE budget_engagements
SET type_engagement = 'sur_marche'
WHERE (passation_marche_id IS NOT NULL OR marche_id IS NOT NULL)
  AND type_engagement = 'hors_marche';

-- ============================================================================
-- 3. Contrainte: sur_marche → passation_marche_id NOT NULL
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE budget_engagements
    ADD CONSTRAINT chk_sur_marche_requires_pm
    CHECK (type_engagement != 'sur_marche' OR passation_marche_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. Fixer le générateur de référence engagement → ARTI code 05
-- L'ancien generate_reference_engagement appelait generate_unified_reference(1)
-- Le nouveau appelle generate_arti_reference(5) = ARTI05MMYYNNNN
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

-- ============================================================================
-- 5. Mettre à jour le trigger pour accepter les deux formats (ancien + ARTI)
-- Si numero est déjà au format ARTI (14 chars) ou ENG-YYYY (legacy), on garde
-- Sinon on génère automatiquement
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_engagements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Garder le numero s'il est déjà au bon format ARTI (14 chars) ou legacy ENG-
  IF NEW.numero IS NOT NULL
     AND NEW.numero != ''
     AND (NEW.numero ~ '^ARTI[0-9]{10}$' OR NEW.numero ~ '^ARTI[0-9]{9}$' OR NEW.numero ~ '^ENG-')
  THEN
    RETURN NEW;
  END IF;

  -- Sinon générer
  NEW.numero := generate_reference_engagement(COALESCE(NEW.created_at, now()));
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_unified_ref_engagements ON public.budget_engagements;
CREATE TRIGGER trg_unified_ref_engagements
  BEFORE INSERT ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_engagements();

-- ============================================================================
-- 6. Index pour performance requêtes passation_marche signées
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_passation_marche_statut_exercice
  ON passation_marche(statut, exercice)
  WHERE statut IN ('approuve', 'signe');
