-- Create marche_validations table for workflow tracking
CREATE TABLE IF NOT EXISTS public.marche_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id uuid NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  role text NOT NULL,
  status text DEFAULT 'en_attente',
  comments text,
  validated_at timestamp with time zone,
  validated_by uuid REFERENCES public.profiles(id),
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create marche_attachments table for documents
CREATE TABLE IF NOT EXISTS public.marche_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id uuid NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  is_required boolean DEFAULT false,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sequence for marche numbering
CREATE TABLE IF NOT EXISTS public.marche_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee integer NOT NULL,
  dernier_numero integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(annee)
);

-- Enable RLS on new tables
ALTER TABLE public.marche_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for marche_validations
CREATE POLICY "Everyone can view marche validations"
  ON public.marche_validations FOR SELECT
  USING (true);

CREATE POLICY "Authorized roles can manage marche validations"
  ON public.marche_validations FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role)
  );

-- RLS policies for marche_attachments
CREATE POLICY "Everyone can view marche attachments"
  ON public.marche_attachments FOR SELECT
  USING (true);

CREATE POLICY "Authorized roles can manage marche attachments"
  ON public.marche_attachments FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role)
  );

-- Create function to generate marche number
CREATE OR REPLACE FUNCTION public.generate_marche_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee integer;
  v_numero integer;
BEGIN
  v_annee := EXTRACT(year FROM CURRENT_DATE);
  
  INSERT INTO public.marche_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = marche_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'MKT-' || v_annee || '-' || LPAD(v_numero::text, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trg_generate_marche_numero ON public.marches;
CREATE TRIGGER trg_generate_marche_numero
  BEFORE INSERT ON public.marches
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION public.generate_marche_numero();