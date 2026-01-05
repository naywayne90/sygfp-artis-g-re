-- Enable RLS on marche_sequences
ALTER TABLE public.marche_sequences ENABLE ROW LEVEL SECURITY;

-- Allow the system to manage sequences
CREATE POLICY "System can manage sequences"
  ON public.marche_sequences FOR ALL
  USING (true);