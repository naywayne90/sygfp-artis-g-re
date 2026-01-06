-- Add workflow columns to budget_liquidations
ALTER TABLE budget_liquidations 
ADD COLUMN IF NOT EXISTS reference_facture TEXT,
ADD COLUMN IF NOT EXISTS observation TEXT,
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'en_attente',
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Create liquidation validations table for workflow tracking
CREATE TABLE IF NOT EXISTS liquidation_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidation_id UUID NOT NULL REFERENCES budget_liquidations(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'en_attente',
  comments TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sequence table for liquidation numbering
CREATE TABLE IF NOT EXISTS liquidation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(annee)
);

-- Enable RLS
ALTER TABLE liquidation_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidation_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies for liquidation_validations
CREATE POLICY "liquidation_validations_select" ON liquidation_validations FOR SELECT USING (true);
CREATE POLICY "liquidation_validations_insert" ON liquidation_validations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "liquidation_validations_update" ON liquidation_validations FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS policies for liquidation_sequences
CREATE POLICY "liquidation_sequences_select" ON liquidation_sequences FOR SELECT USING (true);
CREATE POLICY "liquidation_sequences_insert" ON liquidation_sequences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "liquidation_sequences_update" ON liquidation_sequences FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Function to generate liquidation number
CREATE OR REPLACE FUNCTION generate_liquidation_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO liquidation_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = liquidation_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'LIQ-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-numbering
DROP TRIGGER IF EXISTS trigger_generate_liquidation_numero ON budget_liquidations;
CREATE TRIGGER trigger_generate_liquidation_numero
  BEFORE INSERT ON budget_liquidations
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_liquidation_numero();