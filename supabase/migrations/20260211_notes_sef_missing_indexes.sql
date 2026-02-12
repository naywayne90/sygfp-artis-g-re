-- ================================================================
-- Migration: Indexes manquants sur notes_sef
-- Date: 2026-02-11
-- Description: Ajout des index sur urgence et created_at
-- pour améliorer les performances des requêtes filtrées
-- ================================================================

-- Index sur urgence (utilisé dans les filtres avancés)
CREATE INDEX IF NOT EXISTS idx_notes_sef_urgence
  ON public.notes_sef (urgence);

-- Index sur created_at (utilisé pour le tri par défaut)
CREATE INDEX IF NOT EXISTS idx_notes_sef_created_at
  ON public.notes_sef (created_at DESC);

-- Index composite exercice + created_at (tri paginé par exercice)
CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_created_at
  ON public.notes_sef (exercice, created_at DESC);

-- Index composite exercice + updated_at (tri par défaut de la liste)
CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_updated_at
  ON public.notes_sef (exercice, updated_at DESC);
