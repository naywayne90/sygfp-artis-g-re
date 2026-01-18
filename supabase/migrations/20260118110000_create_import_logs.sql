-- =====================================================
-- Migration: Création table import_logs pour tracer les imports
-- Date: 2026-01-18
-- =====================================================

-- Table pour tracer tous les imports (budget, référentiels, etc.)
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type d'import
  import_type text NOT NULL CHECK (import_type IN ('budget', 'directions', 'prestataires', 'structure_programmatique', 'plan_comptable', 'other')),

  -- Utilisateur et exercice
  user_id uuid REFERENCES auth.users(id),
  exercice integer,

  -- Fichier source
  file_name text NOT NULL,
  file_path text, -- Chemin dans le storage
  file_url text,  -- URL signée
  file_size integer,

  -- Résultat de l'import
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'partial', 'failed')),
  total_rows integer DEFAULT 0,
  imported_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  skipped_rows integer DEFAULT 0,

  -- Détails des erreurs
  errors jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,

  -- Résumé
  summary jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Import logs viewable by authenticated users"
  ON public.import_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Import logs insertable by authenticated users"
  ON public.import_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Import logs updatable by owner"
  ON public.import_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_import_logs_type ON public.import_logs(import_type);
CREATE INDEX idx_import_logs_exercice ON public.import_logs(exercice);
CREATE INDEX idx_import_logs_user ON public.import_logs(user_id);
CREATE INDEX idx_import_logs_status ON public.import_logs(status);
CREATE INDEX idx_import_logs_created ON public.import_logs(created_at DESC);

-- Commentaire
COMMENT ON TABLE public.import_logs IS 'Journal des imports de données (budget, référentiels, etc.)';
