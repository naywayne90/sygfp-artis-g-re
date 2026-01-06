-- Table des règlements (paiements)
CREATE TABLE IF NOT EXISTS public.reglements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  ordonnancement_id UUID NOT NULL REFERENCES public.ordonnancements(id) ON DELETE RESTRICT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement VARCHAR(50) NOT NULL, -- virement, cheque, especes, mobile_money
  reference_paiement VARCHAR(100), -- num chèque ou référence virement
  compte_bancaire_arti VARCHAR(100), -- compte ARTI utilisé
  banque_arti VARCHAR(100), -- banque ARTI
  montant NUMERIC NOT NULL CHECK (montant > 0),
  observation TEXT,
  statut VARCHAR(50) DEFAULT 'enregistre',
  exercice INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des pièces jointes des règlements
CREATE TABLE IF NOT EXISTS public.reglement_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reglement_id UUID NOT NULL REFERENCES public.reglements(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table de séquence pour numérotation automatique
CREATE TABLE IF NOT EXISTS public.reglement_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fonction pour générer le numéro de règlement automatiquement
CREATE OR REPLACE FUNCTION public.generate_reglement_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
  v_prefix VARCHAR(10) := 'REG';
BEGIN
  -- Extraire l'année de la date de paiement
  v_annee := EXTRACT(YEAR FROM NEW.date_paiement);
  
  -- Obtenir et incrémenter le compteur
  INSERT INTO public.reglement_sequences (annee, dernier_numero, updated_at)
  VALUES (v_annee, 1, now())
  ON CONFLICT (annee) 
  DO UPDATE SET dernier_numero = reglement_sequences.dernier_numero + 1, updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  -- Générer le numéro formaté
  NEW.numero := v_prefix || '-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour la génération automatique du numéro
DROP TRIGGER IF EXISTS trigger_generate_reglement_numero ON public.reglements;
CREATE TRIGGER trigger_generate_reglement_numero
  BEFORE INSERT ON public.reglements
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_reglement_numero();

-- Ajouter les colonnes manquantes à la table ordonnancements si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordonnancements' AND column_name = 'montant_paye') THEN
    ALTER TABLE public.ordonnancements ADD COLUMN montant_paye NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordonnancements' AND column_name = 'is_locked') THEN
    ALTER TABLE public.ordonnancements ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ajouter la colonne statut_global à la table dossiers si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dossiers' AND column_name = 'statut_paiement') THEN
    ALTER TABLE public.dossiers ADD COLUMN statut_paiement VARCHAR(50) DEFAULT 'non_paye';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.reglements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglement_sequences ENABLE ROW LEVEL SECURITY;

-- Policies for reglements
CREATE POLICY "Allow authenticated to read reglements" 
  ON public.reglements FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to insert reglements" 
  ON public.reglements FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to update reglements" 
  ON public.reglements FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to delete reglements" 
  ON public.reglements FOR DELETE 
  TO authenticated 
  USING (statut = 'brouillon');

-- Policies for reglement_attachments
CREATE POLICY "Allow authenticated to read reglement_attachments" 
  ON public.reglement_attachments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to insert reglement_attachments" 
  ON public.reglement_attachments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete reglement_attachments" 
  ON public.reglement_attachments FOR DELETE 
  TO authenticated 
  USING (true);

-- Policies for reglement_sequences
CREATE POLICY "Allow authenticated to read reglement_sequences" 
  ON public.reglement_sequences FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to manage reglement_sequences" 
  ON public.reglement_sequences FOR ALL 
  TO authenticated 
  USING (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_reglements_ordonnancement ON public.reglements(ordonnancement_id);
CREATE INDEX IF NOT EXISTS idx_reglements_exercice ON public.reglements(exercice);
CREATE INDEX IF NOT EXISTS idx_reglements_statut ON public.reglements(statut);
CREATE INDEX IF NOT EXISTS idx_reglement_attachments_reglement ON public.reglement_attachments(reglement_id);