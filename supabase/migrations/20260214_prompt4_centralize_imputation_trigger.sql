-- ============================================================================
-- Prompt 4 (suite) : Centraliser le trigger de référence Imputation
-- Date: 2026-02-14
-- Description:
--   1. Supprime les anciens triggers (legacy IMP-YYYY-DIR-NNNN + unified no-op)
--   2. Crée un wrapper generate_reference_imp() appelant generate_arti_reference(2)
--   3. Crée un nouveau trigger BEFORE INSERT utilisant le générateur centralisé
--   4. Ajoute index composite exercice+statut+created_at
-- ============================================================================

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trg_generate_imputation_reference ON imputations;
DROP TRIGGER IF EXISTS trg_unified_ref_imputations ON imputations;

-- Wrapper pour appels directs (étape 02 = Imputation)
CREATE OR REPLACE FUNCTION public.generate_reference_imp(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_arti_reference(2, p_date);
END;
$$;

-- Fonction trigger : ARTI reference on INSERT
CREATE OR REPLACE FUNCTION public.trg_fn_imputation_arti_reference()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := generate_arti_reference(2, now());
  END IF;
  RETURN NEW;
END;
$$;

-- Nouveau trigger
CREATE TRIGGER trg_imputation_arti_reference
  BEFORE INSERT ON imputations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_imputation_arti_reference();

-- Index composite pour les requêtes de listing
CREATE INDEX IF NOT EXISTS idx_imputations_exercice_statut_created
  ON imputations(exercice, statut, created_at DESC);
