-- Create exports storage bucket for temporary files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports', 
  'exports', 
  false, 
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for exports bucket
CREATE POLICY "Users can read their own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can insert their own exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Table for tracking export jobs
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('excel', 'csv', 'pdf', 'zip')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  filters JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  error_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own export jobs"
ON public.export_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create export jobs"
ON public.export_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs"
ON public.export_jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Index for cleanup job
CREATE INDEX idx_export_jobs_expires ON public.export_jobs(expires_at) WHERE status = 'completed';

-- Function to log exports to audit
CREATE OR REPLACE FUNCTION public.log_export_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      NEW.user_id,
      'export',
      NEW.entity_type,
      NEW.entity_id::text,
      jsonb_build_object(
        'type', NEW.type,
        'file_name', NEW.file_name,
        'filters', NEW.filters
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_export_audit
  AFTER INSERT OR UPDATE ON public.export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_export_audit();