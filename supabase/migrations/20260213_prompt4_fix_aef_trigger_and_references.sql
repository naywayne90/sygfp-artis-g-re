-- =============================================================================
-- Migration: Prompt 4 - Nettoyage triggers notes_dg + reference ARTI01MMYYNNNN
-- =============================================================================
-- Date: 2026-02-13
--
-- PROBLEME:
-- Plusieurs triggers BEFORE INSERT conflictuels sur notes_dg:
--   1. trg_set_note_aef_numero      -> generate_note_aef_numero()  -> "AEF-YYYY-NNNNNN"
--   2. trg_notes_dg_set_numero      -> generate_note_aef_reference() -> "ARTI1MMYYNNNN" (13 chars)
--   3. trg_notes_dg_set_arti_reference -> set_arti_reference_aef() -> "ARTI01MMYYNNNN" (14 chars)
--   4. trg_unified_ref_notes_dg     -> generate_reference_aef()    -> old unified format
-- Resultat: les notes ont "NOTE-YYYY-NNNN" au lieu de "ARTI01MMYYNNNN"
--
-- SOLUTION:
-- 1. Supprimer TOUS les triggers de generation de reference sur notes_dg
-- 2. Creer UN SEUL trigger utilisant generate_arti_reference(1) -> ARTI01MMYYNNNN
-- 3. Corriger les 7 notes existantes avec le nouveau format
-- 4. Synchroniser le compteur arti_reference_counters pour etape=1
--
-- AUCUNE COLONNE SUPPRIMEE. AUCUNE TABLE SUPPRIMEE.
-- =============================================================================

-- =====================================================================
-- PARTIE 1: Suppression de TOUS les triggers de reference sur notes_dg
-- =====================================================================

-- Trigger 1: format "AEF-YYYY-NNNNNN" (migration 20260106)
DROP TRIGGER IF EXISTS trg_set_note_aef_numero ON public.notes_dg;

-- Trigger 2: format "ARTI1MMYYNNNN" 13 chars (migration 20260115163121)
DROP TRIGGER IF EXISTS trg_notes_dg_set_numero ON public.notes_dg;

-- Trigger 3: format "ARTI01MMYYNNNN" 14 chars (migration 20260115175210)
DROP TRIGGER IF EXISTS trg_notes_dg_set_arti_reference ON public.notes_dg;

-- Trigger 4: format unifie ancien (migration 20260129)
DROP TRIGGER IF EXISTS trg_unified_ref_notes_dg ON public.notes_dg;

-- Nettoyage: autres triggers possibles
DROP TRIGGER IF EXISTS trg_check_aef_reference ON public.notes_dg;

-- =====================================================================
-- PARTIE 2: Creation du trigger UNIQUE pour ARTI01MMYYNNNN
-- =====================================================================

CREATE OR REPLACE FUNCTION public.trg_notes_dg_generate_arti_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference TEXT;
BEGIN
  -- Generer le numero ARTI01MMYYNNNN seulement si absent ou ancien format
  IF NEW.numero IS NULL
     OR NEW.numero = ''
     OR NEW.numero !~ '^ARTI[0-9]{10}$'
  THEN
    v_reference := generate_arti_reference(1, COALESCE(NEW.created_at, now()));
    NEW.numero := v_reference;
  END IF;

  -- reference_pivot: garder si deja defini (herite de SEF), sinon = numero
  IF NEW.reference_pivot IS NULL OR NEW.reference_pivot = '' THEN
    NEW.reference_pivot := NEW.numero;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_notes_dg_generate_arti_ref() IS
'Trigger BEFORE INSERT sur notes_dg: genere le numero au format ARTI01MMYYNNNN.
Si reference_pivot est deja defini (herite de la Note SEF), il est preserve.
Sinon, reference_pivot = numero.';

-- Creer le trigger unique
CREATE TRIGGER trg_notes_dg_arti_reference
  BEFORE INSERT ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notes_dg_generate_arti_ref();

-- =====================================================================
-- PARTIE 3: Corriger les notes existantes (7 notes)
-- =====================================================================

-- Desactiver temporairement le trigger de protection des notes finales
-- (certaines notes sont en statut "soumis", "impute", "differe")
ALTER TABLE notes_dg DISABLE TRIGGER trigger_prevent_final_note_modification;

-- Notes de decembre 2025 (5 notes) -> ARTI01 12 25 NNNN
-- Ordre chronologique: NOTE-2025-0001 a NOTE-2025-0005
UPDATE notes_dg SET numero = 'ARTI01122500' || LPAD(
  CASE id
    WHEN '3fd0fdbe-e8da-46c6-92bf-fa355f80cb75' THEN '01'  -- NOTE-2025-0001
    WHEN 'a5b4b8e5-0f87-4238-9d4a-9f05441c80d3' THEN '02'  -- NOTE-2025-0002
    WHEN '213b5d22-8129-4a50-8ebb-8b370a995fa7' THEN '03'  -- NOTE-2025-0003
    WHEN 'fec71e0a-a13c-489c-b820-201ed68cab48' THEN '04'  -- NOTE-2025-0004
    WHEN '9d86dd92-3fe5-46af-a075-f7b3ece2af62' THEN '05'  -- NOTE-2025-0005
  END, 2, '0')
WHERE id IN (
  '3fd0fdbe-e8da-46c6-92bf-fa355f80cb75',
  'a5b4b8e5-0f87-4238-9d4a-9f05441c80d3',
  '213b5d22-8129-4a50-8ebb-8b370a995fa7',
  'fec71e0a-a13c-489c-b820-201ed68cab48',
  '9d86dd92-3fe5-46af-a075-f7b3ece2af62'
);

-- Notes de janvier 2026 (2 notes) -> ARTI01 01 26 NNNN
UPDATE notes_dg SET numero = 'ARTI01012600' || LPAD(
  CASE id
    WHEN 'bde7f71f-e1c8-42cf-a665-44d0ef29f554' THEN '01'  -- NOTE-2026-0001
    WHEN '46f027e0-4c01-45f0-8715-ee3915e89a09' THEN '02'  -- NOTE-2026-0002
  END, 2, '0')
WHERE id IN (
  'bde7f71f-e1c8-42cf-a665-44d0ef29f554',
  '46f027e0-4c01-45f0-8715-ee3915e89a09'
);

-- Mettre a jour reference_pivot pour les notes DIRECT qui n'en ont pas
-- (les FROM_SEF gardent leur reference_pivot heritee de la SEF)
UPDATE notes_dg
SET reference_pivot = numero
WHERE reference_pivot IS NULL
  AND numero LIKE 'ARTI01%';

-- Reactiver le trigger de protection
ALTER TABLE notes_dg ENABLE TRIGGER trigger_prevent_final_note_modification;

-- =====================================================================
-- PARTIE 4: Synchroniser le compteur arti_reference_counters
-- =====================================================================

-- Decembre 2025: 5 notes AEF
INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
VALUES (1, 12, 2025, 5, now())
ON CONFLICT (etape, mois, annee)
DO UPDATE SET dernier_numero = GREATEST(arti_reference_counters.dernier_numero, 5), updated_at = now();

-- Janvier 2026: 2 notes AEF
INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
VALUES (1, 1, 2026, 2, now())
ON CONFLICT (etape, mois, annee)
DO UPDATE SET dernier_numero = GREATEST(arti_reference_counters.dernier_numero, 2), updated_at = now();

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- Apres cette migration:
-- SELECT id, numero, reference_pivot, origin FROM notes_dg ORDER BY created_at;
-- Toutes les notes doivent avoir numero LIKE 'ARTI01%'
-- Les FROM_SEF gardent leur reference_pivot d'origine (ARTI00...)
-- Les DIRECT ont reference_pivot = numero (ARTI01...)
