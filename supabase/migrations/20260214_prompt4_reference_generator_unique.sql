-- ============================================================================
-- Prompt 4 Backend : Générateur référence ARTI02MMYYNNNN + UNIQUE + is_migrated
-- Date: 2026-02-14
-- Description:
--   1. Ajoute colonne is_migrated (flag données migrées)
--   2. Marque les données existantes (format IMP-*) comme migrées
--   3. Remplace generate_imputation_reference() : ARTI02MMYYNNNN
--      - Code étape 02 = Imputation (SEF=00, AEF=01)
--      - Compteur séquentiel par mois+année avec advisory lock (anti race condition)
--   4. Ajoute UNIQUE partiel sur reference WHERE reference IS NOT NULL
--   5. FK et indexes déjà existants (vérifiés par audit) : pas de changement
-- ============================================================================


-- ============================================================================
-- PART 1 : Colonne is_migrated
-- ============================================================================

ALTER TABLE public.imputations ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false;

-- Marquer toutes les données existantes avec l'ancien format comme migrées
UPDATE public.imputations SET is_migrated = true WHERE reference LIKE 'IMP-%';


-- ============================================================================
-- PART 2 : Nouveau générateur de référence
-- ============================================================================
-- Format : ARTI02MMYYNNNN
--   ARTI  = préfixe entreprise
--   02    = code étape Imputation (SEF=00, AEF=01, Imputation=02)
--   MM    = mois (01-12)
--   YY    = année sur 2 chiffres
--   NNNN  = compteur séquentiel par mois+année, paddé sur 4 chiffres
--
-- Utilise pg_advisory_xact_lock pour éviter les race conditions
-- (contrairement à l'ancien MAX() sans lock)

CREATE OR REPLACE FUNCTION generate_imputation_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_month TEXT;
  v_year TEXT;
  v_sequence INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Ne générer que si reference est NULL (comportement existant conservé)
  IF NEW.reference IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Extraire mois et année (2 chiffres) depuis created_at ou NOW()
  v_month := LPAD(EXTRACT(MONTH FROM COALESCE(NEW.created_at, NOW()))::TEXT, 2, '0');
  v_year  := LPAD((EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::INTEGER % 100)::TEXT, 2, '0');

  -- Advisory lock basé sur un hash unique : table OID + mois + année
  -- Empêche 2 transactions concurrentes de lire le même MAX
  v_lock_key := ('x' || md5('imputations_ref_' || v_month || v_year))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Compteur séquentiel pour ce mois+année
  -- On cherche les références au nouveau format ARTI02MMYY*
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(reference FROM 11 FOR 4)  -- positions 11-14 = NNNN dans ARTI02MMYYNNNN
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO v_sequence
  FROM public.imputations
  WHERE reference LIKE 'ARTI02' || v_month || v_year || '%';

  -- Construire la référence
  NEW.reference := 'ARTI02' || v_month || v_year || LPAD(v_sequence::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger existant (trg_generate_imputation_reference) utilise déjà
-- WHEN (NEW.reference IS NULL), pas besoin de le recréer.
-- Le CREATE OR REPLACE FUNCTION met à jour la fonction in-place.


-- ============================================================================
-- PART 3 : Contrainte UNIQUE partielle sur reference
-- ============================================================================
-- Empêche les doublons de référence (sauf NULL qui sont autorisés)

CREATE UNIQUE INDEX IF NOT EXISTS idx_imputations_reference_unique
  ON public.imputations(reference)
  WHERE reference IS NOT NULL;


-- ============================================================================
-- PART 4 : FK et indexes existants (audit confirmé - rien à faire)
-- ============================================================================
-- ✅ FK imputations_note_aef_id_fkey → notes_dg(id) ON DELETE CASCADE
-- ✅ FK imputations_budget_line_id_fkey → budget_lines(id)
-- ✅ Index idx_imputations_note_aef_id (unique)
-- ✅ Index idx_imputations_budget_line_id
-- ✅ UNIQUE constraint sur note_aef_id (1 imputation par note AEF)


-- ============================================================================
-- PART 5 : Rafraîchir les statistiques
-- ============================================================================
ANALYZE public.imputations;
