-- =============================================================================
-- Migration: Prompt 4 Backend - Schema fixes for notes_dg
-- =============================================================================
-- Date: 2026-02-13
-- Auteur: BACKEND agent
--
-- DIAGNOSTIC PREALABLE:
-- - note_sef_id (UUID, FK -> notes_sef) : colonne + FK EXISTAIENT DEJA
-- - budget_line_id (UUID, FK -> budget_lines) : colonne + FK + index EXISTAIENT DEJA
-- - generate_arti_reference() : fonction EXISTAIT DEJA
--   Format: ARTI + LPAD(etape,2,'0') + MM + YY + LPAD(counter,4,'0')
--   Utilise arti_reference_counters avec UPSERT
--
-- ACTIONS:
-- 1. Remplacer l'index non-unique sur note_sef_id par un UNIQUE partial index
-- 2. (budget_line_id deja complet - rien a faire)
-- 3. (generate_arti_reference deja complet - rien a faire)
-- 4. Ajouter colonne is_migrated + marquer les anciennes notes
--
-- NOTE: Le trigger prevent_final_note_modification() doit etre desactive
-- temporairement pour permettre l'UPDATE des notes en statut final.
-- AUCUNE COLONNE SUPPRIMEE.
-- =============================================================================

-- =====================================================================
-- TASK 1: Unique partial index sur note_sef_id
-- =====================================================================
-- L'ancien index idx_notes_dg_note_sef_id etait non-unique
DROP INDEX IF EXISTS idx_notes_dg_note_sef_id;
DROP INDEX IF EXISTS idx_notes_dg_note_sef;
CREATE UNIQUE INDEX idx_notes_dg_note_sef ON notes_dg(note_sef_id) WHERE note_sef_id IS NOT NULL;

-- =====================================================================
-- TASK 4: Colonne is_migrated + marquage des anciennes notes
-- =====================================================================
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false;

-- Desactiver temporairement le trigger de protection des notes finales
ALTER TABLE notes_dg DISABLE TRIGGER trigger_prevent_final_note_modification;

-- Marquer les notes avec une reference_pivot non-ARTI comme migrees
UPDATE notes_dg
SET is_migrated = true
WHERE reference_pivot IS NOT NULL
  AND reference_pivot NOT LIKE 'ARTI01%';

-- Marquer les notes sans reference_pivot mais avec un numero comme migrees
UPDATE notes_dg
SET is_migrated = true
WHERE reference_pivot IS NULL
  AND numero IS NOT NULL
  AND is_migrated = false;

-- Reactiver le trigger
ALTER TABLE notes_dg ENABLE TRIGGER trigger_prevent_final_note_modification;
