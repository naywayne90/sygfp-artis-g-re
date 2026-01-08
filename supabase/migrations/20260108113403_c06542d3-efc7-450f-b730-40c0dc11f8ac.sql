-- ============================================
-- PROMPT 1: Framework générique d'import Excel
-- ============================================

-- Table pour les jobs d'import (traçabilité)
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  module text NOT NULL DEFAULT 'budget_structure',
  exercice_id integer,
  filename text NOT NULL,
  storage_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'parsed', 'validated', 'importing', 'completed', 'failed', 'rolled_back')),
  stats jsonb DEFAULT '{"rows_total": 0, "rows_ok": 0, "rows_error": 0, "rows_warning": 0, "rows_new": 0, "rows_update": 0}'::jsonb,
  errors_count integer DEFAULT 0,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour les lignes brutes importées
CREATE TABLE IF NOT EXISTS public.import_rows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  sheet_name text,
  raw jsonb NOT NULL,
  normalized jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'error', 'warning', 'imported')),
  error_messages text[] DEFAULT '{}',
  target_id uuid,
  target_action text CHECK (target_action IN ('insert', 'update', 'skip')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_import_jobs_module ON public.import_jobs(module);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_exercice ON public.import_jobs(exercice_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_rows_job_id ON public.import_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON public.import_rows(status);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import_jobs (using profil_fonctionnel::text)
CREATE POLICY "Users can view their own import jobs"
  ON public.import_jobs FOR SELECT
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profil_fonctionnel::text IN ('admin', 'dg', 'daf')
  ));

CREATE POLICY "Users can create import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own import jobs"
  ON public.import_jobs FOR UPDATE
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profil_fonctionnel::text IN ('admin', 'dg', 'daf')
  ));

CREATE POLICY "Admins can delete import jobs"
  ON public.import_jobs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profil_fonctionnel::text IN ('admin', 'dg')
  ));

-- RLS Policies for import_rows
CREATE POLICY "Users can view rows of their jobs"
  ON public.import_rows FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.import_jobs j WHERE j.id = job_id AND (j.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profil_fonctionnel::text IN ('admin', 'dg', 'daf')
    ))
  ));

CREATE POLICY "Users can insert rows for their jobs"
  ON public.import_rows FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.import_jobs j WHERE j.id = job_id AND j.created_by = auth.uid()
  ));

CREATE POLICY "Users can update rows of their jobs"
  ON public.import_rows FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.import_jobs j WHERE j.id = job_id AND j.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete rows of their jobs"
  ON public.import_rows FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.import_jobs j WHERE j.id = job_id AND j.created_by = auth.uid()
  ));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_import_jobs_updated_at();

-- Create storage bucket for imports (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('imports', 'imports', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for imports bucket
CREATE POLICY "Users can upload to imports bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their imports from bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their imports from bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1]);