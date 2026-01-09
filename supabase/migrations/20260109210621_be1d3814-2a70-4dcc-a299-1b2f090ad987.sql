-- Create the natures_depense table
CREATE TABLE IF NOT EXISTS public.natures_depense (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.natures_depense ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Allow read access for authenticated users" 
ON public.natures_depense 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for write access (admin only in production, but open for now)
CREATE POLICY "Allow write access for authenticated users" 
ON public.natures_depense 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Insert the 4 Natures de Dépense for ARTI 2026
INSERT INTO public.natures_depense (code, libelle, est_active) VALUES
('1', '1 Personnels', true),
('2', '2 Biens et services', true),
('3', '3 Transferts', true),
('4', '4 Investissements', true)
ON CONFLICT (code) DO UPDATE SET 
  libelle = EXCLUDED.libelle,
  est_active = true;