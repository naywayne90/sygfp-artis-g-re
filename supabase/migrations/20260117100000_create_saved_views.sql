-- Create saved_views table for user search configurations
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_views_user_id ON public.saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_is_shared ON public.saved_views(is_shared);

-- Add RLS policies
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Users can see their own views and shared views
CREATE POLICY "Users can view own and shared views"
  ON public.saved_views
  FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

-- Users can insert their own views
CREATE POLICY "Users can insert own views"
  ON public.saved_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own views
CREATE POLICY "Users can update own views"
  ON public.saved_views
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own views
CREATE POLICY "Users can delete own views"
  ON public.saved_views
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_views_updated_at_trigger
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_views_updated_at();

-- Comment
COMMENT ON TABLE public.saved_views IS 'Stores user-defined search filters and views for dossier searches';
