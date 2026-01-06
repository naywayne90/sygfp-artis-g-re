
-- Ajouter les colonnes manquantes pour le workflow complet
ALTER TABLE public.ordonnancements 
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'brouillon',
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS date_differe TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS differe_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS deadline_correction TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS date_prevue_paiement DATE,
ADD COLUMN IF NOT EXISTS observation TEXT,
ADD COLUMN IF NOT EXISTS montant_paye NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Table des validations d'ordonnancement (si n'existe pas)
CREATE TABLE IF NOT EXISTS public.ordonnancement_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordonnancement_id UUID NOT NULL REFERENCES public.ordonnancements(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  comments TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des pièces jointes d'ordonnancement (si n'existe pas)
CREATE TABLE IF NOT EXISTS public.ordonnancement_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordonnancement_id UUID NOT NULL REFERENCES public.ordonnancements(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Séquence pour numérotation automatique (si n'existe pas)
CREATE TABLE IF NOT EXISTS public.ordonnancement_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fonction de génération du numéro d'ordonnancement
CREATE OR REPLACE FUNCTION public.generate_ordonnancement_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_sequence INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO public.ordonnancement_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = ordonnancement_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_sequence;
  
  NEW.numero := 'ORD-' || v_annee || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_generate_ordonnancement_numero ON public.ordonnancements;
CREATE TRIGGER trigger_generate_ordonnancement_numero
  BEFORE INSERT ON public.ordonnancements
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_ordonnancement_numero();

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ordonnancements_liquidation ON public.ordonnancements(liquidation_id);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_exercice ON public.ordonnancements(exercice);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_statut ON public.ordonnancements(statut);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_workflow ON public.ordonnancements(workflow_status);
CREATE INDEX IF NOT EXISTS idx_ordonnancement_validations_ordonnancement ON public.ordonnancement_validations(ordonnancement_id);

-- Enable RLS
ALTER TABLE public.ordonnancement_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordonnancement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordonnancement_sequences ENABLE ROW LEVEL SECURITY;

-- Policies pour validations
DROP POLICY IF EXISTS "Authenticated users can view ordonnancement_validations" ON public.ordonnancement_validations;
CREATE POLICY "Authenticated users can view ordonnancement_validations" 
  ON public.ordonnancement_validations FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert ordonnancement_validations" ON public.ordonnancement_validations;
CREATE POLICY "Authenticated users can insert ordonnancement_validations" 
  ON public.ordonnancement_validations FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update ordonnancement_validations" ON public.ordonnancement_validations;
CREATE POLICY "Authenticated users can update ordonnancement_validations" 
  ON public.ordonnancement_validations FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Policies pour attachments
DROP POLICY IF EXISTS "Authenticated users can view ordonnancement_attachments" ON public.ordonnancement_attachments;
CREATE POLICY "Authenticated users can view ordonnancement_attachments" 
  ON public.ordonnancement_attachments FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert ordonnancement_attachments" ON public.ordonnancement_attachments;
CREATE POLICY "Authenticated users can insert ordonnancement_attachments" 
  ON public.ordonnancement_attachments FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete ordonnancement_attachments" ON public.ordonnancement_attachments;
CREATE POLICY "Authenticated users can delete ordonnancement_attachments" 
  ON public.ordonnancement_attachments FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Policies pour sequences
DROP POLICY IF EXISTS "Authenticated users can manage ordonnancement_sequences" ON public.ordonnancement_sequences;
CREATE POLICY "Authenticated users can manage ordonnancement_sequences" 
  ON public.ordonnancement_sequences FOR ALL 
  USING (auth.role() = 'authenticated');
