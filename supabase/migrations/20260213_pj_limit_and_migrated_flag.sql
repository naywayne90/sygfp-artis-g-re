-- ============================================================================
-- MIGRATION: Limite 3 PJ par note + flag is_migrated
-- Date: 13/02/2026
-- ============================================================================
--
-- 1. Contrainte backend : max 3 pieces jointes par note SEF
-- 2. Marquer les notes migrées via is_migrated
-- 3. Synchroniser le compteur de references
-- ============================================================================

-- ============================================================================
-- 1. Fonction trigger : bloquer l'INSERT dans notes_sef_pieces si >= 3 PJ
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_max_pieces_per_note()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_max_pj CONSTANT INTEGER := 3;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notes_sef_pieces
  WHERE note_id = NEW.note_id;

  IF v_count >= v_max_pj THEN
    RAISE EXCEPTION 'Maximum % pieces jointes par note SEF atteint.', v_max_pj
      USING HINT = 'Supprimez une piece jointe existante avant d''en ajouter une nouvelle.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_max_pieces ON notes_sef_pieces;
CREATE TRIGGER trg_check_max_pieces
  BEFORE INSERT ON notes_sef_pieces
  FOR EACH ROW
  EXECUTE FUNCTION check_max_pieces_per_note();

COMMENT ON FUNCTION public.check_max_pieces_per_note IS
  'Exigence MBAYE : maximum 3 pieces jointes par note SEF (TDR, devis, etc.)';

-- ============================================================================
-- 2. S'assurer que is_migrated existe et est a jour
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes_sef'
      AND column_name = 'is_migrated'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN is_migrated BOOLEAN DEFAULT false;
  END IF;
END;
$$;

-- Marquer les notes MIG-* comme migrees
UPDATE public.notes_sef
SET is_migrated = true
WHERE numero LIKE 'MIG-%'
  AND (is_migrated IS NULL OR is_migrated = false);

-- Marquer les notes au format legacy (NNNN-YYYY-XX-XX)
UPDATE public.notes_sef
SET is_migrated = true
WHERE numero ~ '^\d{4}-\d{4}-'
  AND (is_migrated IS NULL OR is_migrated = false);

-- ============================================================================
-- 3. Synchroniser le compteur de references pour le mois courant
-- S'assure que le compteur reflete les notes ARTI existantes
-- ============================================================================
DO $$
DECLARE
  v_max_num INTEGER;
  v_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_prefix TEXT;
BEGIN
  -- Construire le prefixe ARTI00MMYY
  v_prefix := 'ARTI00'
    || LPAD(v_month::TEXT, 2, '0')
    || LPAD((v_year % 100)::TEXT, 2, '0');

  -- Trouver le max des 4 derniers chiffres pour ce prefixe
  SELECT MAX(CAST(RIGHT(numero, 4) AS INTEGER))
  INTO v_max_num
  FROM notes_sef
  WHERE numero LIKE v_prefix || '%'
    AND LENGTH(numero) = 14;

  -- Mettre a jour le compteur si necessaire
  IF v_max_num IS NOT NULL AND v_max_num > 0 THEN
    INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
    VALUES (0, v_month, v_year, v_max_num, now())
    ON CONFLICT (etape, mois, annee)
    DO UPDATE SET
      dernier_numero = GREATEST(arti_reference_counters.dernier_numero, v_max_num),
      updated_at = now();
  END IF;
END;
$$;
