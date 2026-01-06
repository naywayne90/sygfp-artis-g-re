-- Add prestataire RIB columns if missing
ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS rib_banque VARCHAR(100),
ADD COLUMN IF NOT EXISTS rib_numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS rib_cle VARCHAR(10);

-- Add compte_id to reglements for linking to real bank accounts
ALTER TABLE reglements
ADD COLUMN IF NOT EXISTS compte_id UUID REFERENCES comptes_bancaires(id);

-- Create ordonnancement_signatures table for tracking signatures
CREATE TABLE IF NOT EXISTS ordonnancement_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordonnancement_id UUID NOT NULL REFERENCES ordonnancements(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'DAAF', 'DG'
    required BOOLEAN DEFAULT true,
    signed_by UUID REFERENCES profiles(id),
    signed_at TIMESTAMPTZ,
    signature_ip VARCHAR(50),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ordonnancement_signatures ENABLE ROW LEVEL SECURITY;

-- Policies for ordonnancement_signatures
CREATE POLICY "ordonnancement_signatures_select" ON ordonnancement_signatures
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ordonnancement_signatures_insert" ON ordonnancement_signatures
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ordonnancement_signatures_update" ON ordonnancement_signatures
FOR UPDATE TO authenticated USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ord_signatures_ord_id ON ordonnancement_signatures(ordonnancement_id);
CREATE INDEX IF NOT EXISTS idx_reglements_compte_id ON reglements(compte_id);

-- Add function to generate MANDAT number format
CREATE OR REPLACE FUNCTION public.generate_mandat_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- Format: MANDAT-2026-000001
  NEW.numero := 'MANDAT-' || v_annee || '-' || LPAD(v_sequence::TEXT, 6, '0');
  
  RETURN NEW;
END;
$function$;

-- Replace existing trigger with new format
DROP TRIGGER IF EXISTS set_ordonnancement_numero ON ordonnancements;
CREATE TRIGGER set_ordonnancement_numero
    BEFORE INSERT ON ordonnancements
    FOR EACH ROW
    WHEN (NEW.numero IS NULL OR NEW.numero = '')
    EXECUTE FUNCTION generate_mandat_numero();