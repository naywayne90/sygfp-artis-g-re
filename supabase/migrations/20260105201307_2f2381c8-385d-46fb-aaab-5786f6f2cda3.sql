-- Add columns to expressions_besoin for linking to marche and dossier
ALTER TABLE public.expressions_besoin 
ADD COLUMN IF NOT EXISTS marche_id UUID REFERENCES public.marches(id),
ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES public.dossiers(id),
ADD COLUMN IF NOT EXISTS specifications TEXT,
ADD COLUMN IF NOT EXISTS calendrier_debut DATE,
ADD COLUMN IF NOT EXISTS calendrier_fin DATE,
ADD COLUMN IF NOT EXISTS numero_lot INTEGER,
ADD COLUMN IF NOT EXISTS intitule_lot TEXT,
ADD COLUMN IF NOT EXISTS exercice INTEGER DEFAULT EXTRACT(YEAR FROM now()),
ADD COLUMN IF NOT EXISTS current_validation_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_marche_id ON public.expressions_besoin(marche_id);
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_dossier_id ON public.expressions_besoin(dossier_id);
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_statut ON public.expressions_besoin(statut);

-- Create attachments table for expressions de besoin
CREATE TABLE IF NOT EXISTS public.expression_besoin_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expression_besoin_id UUID NOT NULL REFERENCES public.expressions_besoin(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequences table for expression besoin numbering
CREATE TABLE IF NOT EXISTS public.expression_besoin_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create validations tracking table
CREATE TABLE IF NOT EXISTS public.expression_besoin_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expression_besoin_id UUID NOT NULL REFERENCES public.expressions_besoin(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  comments TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expression_besoin_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expression_besoin_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expression_besoin_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "Allow read access to expression besoin attachments" 
ON public.expression_besoin_attachments FOR SELECT USING (true);

CREATE POLICY "Allow insert access to expression besoin attachments" 
ON public.expression_besoin_attachments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to expression besoin attachments" 
ON public.expression_besoin_attachments FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to expression besoin attachments" 
ON public.expression_besoin_attachments FOR DELETE USING (true);

-- RLS Policies for sequences
CREATE POLICY "Allow read access to expression besoin sequences" 
ON public.expression_besoin_sequences FOR SELECT USING (true);

CREATE POLICY "Allow insert access to expression besoin sequences" 
ON public.expression_besoin_sequences FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to expression besoin sequences" 
ON public.expression_besoin_sequences FOR UPDATE USING (true);

-- RLS Policies for validations
CREATE POLICY "Allow read access to expression besoin validations" 
ON public.expression_besoin_validations FOR SELECT USING (true);

CREATE POLICY "Allow insert access to expression besoin validations" 
ON public.expression_besoin_validations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to expression besoin validations" 
ON public.expression_besoin_validations FOR UPDATE USING (true);

-- Function to generate expression besoin number
CREATE OR REPLACE FUNCTION public.generate_expression_besoin_numero()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  next_num INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now());
  
  INSERT INTO public.expression_besoin_sequences (annee, dernier_numero)
  VALUES (current_year, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = expression_besoin_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO next_num;
  
  NEW.numero := 'EB-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-numbering
DROP TRIGGER IF EXISTS set_expression_besoin_numero ON public.expressions_besoin;
CREATE TRIGGER set_expression_besoin_numero
  BEFORE INSERT ON public.expressions_besoin
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION public.generate_expression_besoin_numero();