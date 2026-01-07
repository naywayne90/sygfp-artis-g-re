-- First drop existing constraint if any
ALTER TABLE public.prestataires DROP CONSTRAINT IF EXISTS prestataires_statut_check;

-- Add missing columns to prestataires (without constraint issues)
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS type_prestataire VARCHAR(30) DEFAULT 'fournisseur',
ADD COLUMN IF NOT EXISTS sigle VARCHAR(50),
ADD COLUMN IF NOT EXISTS nif VARCHAR(50),
ADD COLUMN IF NOT EXISTS ifu VARCHAR(50),
ADD COLUMN IF NOT EXISTS ville VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150),
ADD COLUMN IF NOT EXISTS contact_fonction VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_telephone VARCHAR(30),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150),
ADD COLUMN IF NOT EXISTS date_qualification TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS motif_suspension TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.profiles(id);

-- Create supplier_bank_accounts table
CREATE TABLE IF NOT EXISTS public.supplier_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.prestataires(id) ON DELETE CASCADE,
  banque VARCHAR(150) NOT NULL,
  code_banque VARCHAR(20),
  code_guichet VARCHAR(20),
  numero_compte VARCHAR(50) NOT NULL,
  cle_rib VARCHAR(10),
  iban VARCHAR(50),
  bic_swift VARCHAR(20),
  titulaire VARCHAR(200),
  est_principal BOOLEAN DEFAULT false,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create supplier_documents table
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.prestataires(id) ON DELETE CASCADE,
  type_document VARCHAR(50) NOT NULL,
  numero VARCHAR(100),
  date_delivrance DATE,
  date_expiration DATE,
  fichier_path TEXT,
  fichier_nom VARCHAR(255),
  statut VARCHAR(30) DEFAULT 'valide' CHECK (statut IN ('valide', 'a_renouveler', 'expire', 'manquant')),
  rappel_jours INTEGER DEFAULT 30,
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create required_document_types table
CREATE TABLE IF NOT EXISTS public.supplier_required_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(150) NOT NULL,
  description TEXT,
  est_obligatoire BOOLEAN DEFAULT true,
  a_date_expiration BOOLEAN DEFAULT true,
  rappel_jours_defaut INTEGER DEFAULT 30,
  ordre_affichage INTEGER DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default required document types
INSERT INTO public.supplier_required_documents (code, libelle, est_obligatoire, a_date_expiration, rappel_jours_defaut, ordre_affichage) VALUES
('RCCM', 'Registre de Commerce (RCCM)', true, false, 0, 1),
('NIF', 'Numéro d''Identification Fiscale (NIF)', true, false, 0, 2),
('IFU', 'Identifiant Fiscal Unique (IFU)', false, false, 0, 3),
('ATTESTATION_FISCALE', 'Attestation de Régularité Fiscale', true, true, 30, 4),
('CNPS', 'Attestation CNPS', true, true, 30, 5),
('RIB', 'Relevé d''Identité Bancaire', true, false, 0, 6),
('AGREMENT', 'Agrément / Autorisation d''exercice', false, true, 60, 7),
('ATTESTATION_TRAVAIL', 'Attestation de Bonne Exécution', false, false, 0, 8)
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier ON public.supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_expiration ON public.supplier_documents(date_expiration) WHERE date_expiration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_bank_accounts_supplier ON public.supplier_bank_accounts(supplier_id);

-- Function to update document statuses
CREATE OR REPLACE FUNCTION public.update_supplier_document_statuses()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  UPDATE public.supplier_documents 
  SET statut = 'expire', updated_at = now()
  WHERE date_expiration IS NOT NULL 
    AND date_expiration < CURRENT_DATE 
    AND statut != 'expire';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE public.supplier_documents 
  SET statut = 'a_renouveler', updated_at = now()
  WHERE date_expiration IS NOT NULL 
    AND date_expiration >= CURRENT_DATE 
    AND date_expiration <= CURRENT_DATE + (rappel_jours * INTERVAL '1 day')
    AND statut = 'valide';

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if supplier can be qualified
CREATE OR REPLACE FUNCTION public.can_qualify_supplier(p_supplier_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_missing TEXT[];
  v_expired TEXT[];
  v_req RECORD;
  v_doc RECORD;
BEGIN
  FOR v_req IN 
    SELECT code, libelle FROM public.supplier_required_documents 
    WHERE est_obligatoire = true AND est_actif = true
  LOOP
    SELECT * INTO v_doc 
    FROM public.supplier_documents 
    WHERE supplier_id = p_supplier_id AND type_document = v_req.code
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_doc IS NULL THEN
      v_missing := array_append(v_missing, v_req.libelle);
    ELSIF v_doc.statut = 'expire' THEN
      v_expired := array_append(v_expired, v_req.libelle);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'can_qualify', (array_length(v_missing, 1) IS NULL AND array_length(v_expired, 1) IS NULL),
    'missing_documents', COALESCE(v_missing, ARRAY[]::TEXT[]),
    'expired_documents', COALESCE(v_expired, ARRAY[]::TEXT[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.supplier_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_required_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view supplier bank accounts" ON public.supplier_bank_accounts;
CREATE POLICY "Users can view supplier bank accounts" ON public.supplier_bank_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage supplier bank accounts" ON public.supplier_bank_accounts;
CREATE POLICY "Authenticated users can manage supplier bank accounts" ON public.supplier_bank_accounts FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view supplier documents" ON public.supplier_documents;
CREATE POLICY "Users can view supplier documents" ON public.supplier_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage supplier documents" ON public.supplier_documents;
CREATE POLICY "Authenticated users can manage supplier documents" ON public.supplier_documents FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view required document types" ON public.supplier_required_documents;
CREATE POLICY "Users can view required document types" ON public.supplier_required_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage required document types" ON public.supplier_required_documents;
CREATE POLICY "Admins can manage required document types" ON public.supplier_required_documents FOR ALL USING (auth.uid() IS NOT NULL);

-- Triggers
CREATE OR REPLACE FUNCTION public.update_supplier_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_bank_accounts_updated_at ON public.supplier_bank_accounts;
CREATE TRIGGER update_supplier_bank_accounts_updated_at
  BEFORE UPDATE ON public.supplier_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_tables_updated_at();

DROP TRIGGER IF EXISTS update_supplier_documents_updated_at ON public.supplier_documents;
CREATE TRIGGER update_supplier_documents_updated_at
  BEFORE UPDATE ON public.supplier_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_tables_updated_at();