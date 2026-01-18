-- ============================================
-- MIGRATION: Ajout colonnes pour rollback d'import budget
-- ============================================
-- Ajoute les colonnes nécessaires pour permettre l'annulation
-- des imports de lignes budgétaires
-- ============================================

-- Ajouter les colonnes d'annulation à budget_imports
ALTER TABLE public.budget_imports
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Mettre à jour le statut pour inclure 'annule'
-- Note: Le CHECK constraint n'existe peut-être pas, donc on le crée si nécessaire
DO $$
BEGIN
  -- Supprimer l'ancien constraint s'il existe
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'budget_imports_status_check'
  ) THEN
    ALTER TABLE public.budget_imports DROP CONSTRAINT budget_imports_status_check;
  END IF;

  -- Ajouter le nouveau constraint avec 'annule'
  ALTER TABLE public.budget_imports
  ADD CONSTRAINT budget_imports_status_check
  CHECK (status IN ('en_cours', 'termine', 'partiel', 'echec', 'annule'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Le constraint existe déjà
END $$;

-- Index pour recherche par statut
CREATE INDEX IF NOT EXISTS idx_budget_imports_status ON public.budget_imports(status);

-- Index pour recherche par user_id
CREATE INDEX IF NOT EXISTS idx_budget_imports_user ON public.budget_imports(user_id);

-- Commenter les colonnes
COMMENT ON COLUMN public.budget_imports.cancelled_at IS 'Date d''annulation de l''import (rollback)';
COMMENT ON COLUMN public.budget_imports.cancelled_by IS 'Utilisateur qui a annulé l''import';
COMMENT ON COLUMN public.budget_imports.user_id IS 'Utilisateur qui a effectué l''import';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
