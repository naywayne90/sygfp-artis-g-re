-- ============================================================================
-- MIGRATION: Correction du generateur de references ARTI
-- Date: 11/02/2026
-- ============================================================================
--
-- CHANGEMENTS:
-- 1. Format passe de 13 chars (ARTI + X(1) + MM + YY + NNNN)
--    a 14 chars (ARTI + XX(2) + MM + YY + NNNN)
-- 2. Reference generee a la SOUMISSION (pas a la creation)
--    => Suppression des triggers BEFORE INSERT sur notes_sef
-- 3. Ajout colonne is_migrated pour distinguer les notes migrées
-- 4. Synchronisation des compteurs avec les references existantes
--
-- COMPATIBILITE:
-- - Les 13-char refs existantes restent inchangees
-- - Le parser gere les deux formats (13 et 14 chars)
-- - Aucune suppression de note, colonne, ou route
-- ============================================================================

-- ============================================================================
-- PARTIE A : Correction du generateur
-- ============================================================================

-- 1. Supprimer TOUS les triggers BEFORE INSERT sur notes_sef
-- Les references seront generees a la soumission via RPC
-- ============================================================================
-- Triggers originaux (format unifie)
DROP TRIGGER IF EXISTS trg_notes_sef_set_arti_reference ON public.notes_sef;
DROP TRIGGER IF EXISTS trg_unified_ref_notes_sef ON public.notes_sef;
-- Triggers generant 'numero' au format SEF-YYYY-NNNNNN
DROP TRIGGER IF EXISTS trg_set_note_sef_numero ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_note_sef_numero ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_generate_note_sef_numero ON public.notes_sef;
-- Triggers generant 'reference_pivot' au format ancien
DROP TRIGGER IF EXISTS tr_generate_note_sef_reference_pivot ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_note_sef_reference_pivot ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_generate_note_sef_reference ON public.notes_sef;

-- 2. Mettre a jour generate_arti_reference avec code etape 2 chiffres
-- Nouveau format: ARTI + XX(2) + MM(2) + YY(2) + NNNN(4) = 14 chars
-- Exemple: ARTI0002260001 = SEF, fevrier 2026, premier document
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_arti_reference(
  p_etape INTEGER,
  p_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mois INTEGER;
  v_annee INTEGER;
  v_annee_court TEXT;
  v_mois_text TEXT;
  v_counter INTEGER;
  v_reference TEXT;
BEGIN
  -- Validation de l'etape (0-99)
  IF p_etape < 0 OR p_etape > 99 THEN
    RAISE EXCEPTION 'Code etape invalide: %. Doit etre entre 0 et 99.', p_etape;
  END IF;

  -- Extraire mois et annee de la date
  v_mois := EXTRACT(MONTH FROM p_date)::INTEGER;
  v_annee := EXTRACT(YEAR FROM p_date)::INTEGER;
  v_annee_court := LPAD((v_annee % 100)::TEXT, 2, '0');
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');

  -- Increment atomique avec UPSERT (safe en concurrence)
  INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, v_mois, v_annee, 1, now())
  ON CONFLICT (etape, mois, annee)
  DO UPDATE SET
    dernier_numero = arti_reference_counters.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_counter;

  -- Verifier que le compteur n'a pas depasse 9999
  IF v_counter > 9999 THEN
    RAISE EXCEPTION 'Compteur de reference epuise pour etape=%, mois=%, annee=%', p_etape, v_mois, v_annee;
  END IF;

  -- Construire la reference: ARTI + XX(2) + MM(2) + YY(2) + NNNN(4) = 14 chars
  v_reference := 'ARTI'
    || LPAD(p_etape::TEXT, 2, '0')
    || v_mois_text
    || v_annee_court
    || LPAD(v_counter::TEXT, 4, '0');

  RETURN v_reference;
END;
$$;

-- 3. Fonction RPC pour soumettre une note SEF avec generation atomique de reference
-- ============================================================================
-- Appelee depuis le frontend au moment de la soumission
-- Genere la reference ET met a jour le statut dans une seule transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_note_sef_with_reference(p_note_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference TEXT;
  v_note RECORD;
BEGIN
  -- Verifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifie';
  END IF;

  -- Verrouiller la note pour eviter les soumissions concurrentes
  SELECT * INTO v_note FROM notes_sef WHERE id = p_note_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note SEF introuvable: %', p_note_id;
  END IF;

  -- Verifier le statut (seuls les brouillons peuvent etre soumis)
  IF v_note.statut != 'brouillon' THEN
    RAISE EXCEPTION 'Seules les notes en brouillon peuvent etre soumises. Statut actuel: %', v_note.statut;
  END IF;

  -- Generer la reference si pas deja definie au nouveau format (14 chars)
  IF v_note.numero IS NULL
     OR v_note.numero = ''
     OR NOT v_note.numero ~ '^ARTI[0-9]{10}$'
  THEN
    v_reference := generate_arti_reference(0, now());
  ELSE
    -- Garder la reference existante si deja au nouveau format
    v_reference := v_note.numero;
  END IF;

  -- Mise a jour atomique: reference + statut + metadonnees
  UPDATE notes_sef
  SET
    numero = v_reference,
    reference_pivot = v_reference,
    statut = 'soumis',
    submitted_at = now(),
    submitted_by = auth.uid()
  WHERE id = p_note_id;

  RETURN v_reference;
END;
$$;

COMMENT ON FUNCTION public.submit_note_sef_with_reference IS
'Soumet une note SEF en brouillon: genere la reference ARTI atomiquement et met a jour le statut.
Appelee via RPC depuis le frontend. Retourne la reference generee.';

-- 4. Mettre a jour parse_arti_reference pour gerer les deux formats
-- ============================================================================
CREATE OR REPLACE FUNCTION public.parse_arti_reference(p_reference TEXT)
RETURNS TABLE(
  etape INTEGER,
  mois INTEGER,
  annee INTEGER,
  numero INTEGER,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Nouveau format 14 chars: ARTI + XX(2) + MM(2) + YY(2) + NNNN(4)
  IF p_reference IS NOT NULL
     AND LENGTH(p_reference) = 14
     AND p_reference ~ '^ARTI[0-9]{10}$'
  THEN
    RETURN QUERY SELECT
      SUBSTRING(p_reference FROM 5 FOR 2)::INTEGER AS etape,
      SUBSTRING(p_reference FROM 7 FOR 2)::INTEGER AS mois,
      (2000 + SUBSTRING(p_reference FROM 9 FOR 2)::INTEGER)::INTEGER AS annee,
      SUBSTRING(p_reference FROM 11 FOR 4)::INTEGER AS numero,
      TRUE AS is_valid;
    RETURN;
  END IF;

  -- Legacy format 13 chars: ARTI + X(1) + MM(2) + YY(2) + NNNN(4)
  IF p_reference IS NOT NULL
     AND LENGTH(p_reference) = 13
     AND p_reference ~ '^ARTI[0-9]{9}$'
  THEN
    RETURN QUERY SELECT
      SUBSTRING(p_reference FROM 5 FOR 1)::INTEGER AS etape,
      SUBSTRING(p_reference FROM 6 FOR 2)::INTEGER AS mois,
      (2000 + SUBSTRING(p_reference FROM 8 FOR 2)::INTEGER)::INTEGER AS annee,
      SUBSTRING(p_reference FROM 10 FOR 4)::INTEGER AS numero,
      TRUE AS is_valid;
    RETURN;
  END IF;

  -- Format invalide
  RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, FALSE;
END;
$$;

-- ============================================================================
-- PARTIE B : Nettoyage des donnees
-- ============================================================================

-- 5. Ajouter la colonne is_migrated (si elle n'existe pas)
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

-- 6. Marquer les notes migrées depuis SQL Server (MIG-*)
-- ============================================================================
UPDATE public.notes_sef
SET is_migrated = true
WHERE numero LIKE 'MIG-%'
  AND (is_migrated IS NULL OR is_migrated = false);

-- 7. Marquer les notes avec ancien format (NNNN-YYYY-XX-XX)
-- ============================================================================
UPDATE public.notes_sef
SET is_migrated = true
WHERE numero ~ '^\d{4}-\d{4}-'
  AND (is_migrated IS NULL OR is_migrated = false);

-- 8. Synchroniser le compteur pour fevrier 2026
-- (2 notes ARTI existantes: ARTI002260001, ARTI002260002)
-- ============================================================================
SELECT sync_arti_counter_from_import(0, 2, 2026, 2);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.generate_arti_reference IS
'Genere une reference unique au format ARTI + XX(2) + MM(2) + YY(2) + NNNN(4) = 14 chars.
XX = code etape (00=SEF, 01=AEF, 02=Imputation, etc.)
Utilise INSERT ON CONFLICT pour garantir l''unicite sous concurrence.';

COMMENT ON FUNCTION public.parse_arti_reference IS
'Parse une reference ARTI. Gere les deux formats:
- Nouveau (14 chars): ARTI + XX(2) + MM(2) + YY(2) + NNNN(4)
- Legacy (13 chars): ARTI + X(1) + MM(2) + YY(2) + NNNN(4)';
