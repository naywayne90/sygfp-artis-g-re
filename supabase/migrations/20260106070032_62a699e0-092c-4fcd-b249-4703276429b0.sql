
-- Ajouter colonnes manquantes à notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS urgence VARCHAR(20) DEFAULT 'normale';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_envoye BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS date_email TIMESTAMPTZ;

-- Préférences de notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type_notification VARCHAR(50) NOT NULL,
  in_app BOOLEAN DEFAULT TRUE,
  email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, type_notification)
);

-- =============================================
-- MODULE 8: CONTRACTUALISATION ETENDUE
-- =============================================

-- Table des lots de marché
CREATE TABLE IF NOT EXISTS public.marche_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id UUID NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  numero_lot INTEGER NOT NULL,
  intitule VARCHAR(300) NOT NULL,
  description TEXT,
  montant_estime NUMERIC(18,2),
  montant_attribue NUMERIC(18,2),
  attributaire_id UUID REFERENCES public.prestataires(id),
  statut VARCHAR(30) DEFAULT 'ouvert',
  date_attribution DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marche_id, numero_lot)
);

-- Table des soumissions
CREATE TABLE IF NOT EXISTS public.soumissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.marche_lots(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES public.prestataires(id),
  date_soumission TIMESTAMPTZ NOT NULL DEFAULT now(),
  montant_offre NUMERIC(18,2) NOT NULL,
  delai_execution INTEGER,
  note_technique NUMERIC(5,2),
  note_financiere NUMERIC(5,2),
  note_globale NUMERIC(5,2),
  classement INTEGER,
  statut VARCHAR(30) DEFAULT 'recue',
  motif_rejet TEXT,
  observations TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des contrats
CREATE TABLE IF NOT EXISTS public.contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL,
  marche_id UUID REFERENCES public.marches(id),
  lot_id UUID REFERENCES public.marche_lots(id),
  prestataire_id UUID NOT NULL REFERENCES public.prestataires(id),
  type_contrat VARCHAR(50) NOT NULL,
  objet TEXT NOT NULL,
  montant_initial NUMERIC(18,2) NOT NULL,
  montant_actuel NUMERIC(18,2),
  date_signature DATE,
  date_notification DATE,
  date_debut DATE,
  date_fin DATE,
  delai_execution INTEGER,
  statut VARCHAR(30) DEFAULT 'brouillon',
  dossier_id UUID REFERENCES public.dossiers(id),
  engagement_id UUID REFERENCES public.budget_engagements(id),
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des avenants
CREATE TABLE IF NOT EXISTS public.avenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrat_id UUID NOT NULL REFERENCES public.contrats(id) ON DELETE CASCADE,
  numero_avenant INTEGER NOT NULL,
  objet TEXT NOT NULL,
  type_avenant VARCHAR(50) NOT NULL,
  montant_modification NUMERIC(18,2),
  nouveau_montant NUMERIC(18,2),
  nouveau_delai INTEGER,
  nouvelle_date_fin DATE,
  date_signature DATE,
  statut VARCHAR(30) DEFAULT 'brouillon',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contrat_id, numero_avenant)
);

-- Pièces jointes contrats
CREATE TABLE IF NOT EXISTS public.contrat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrat_id UUID NOT NULL REFERENCES public.contrats(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Séquence contrats
CREATE TABLE IF NOT EXISTS public.contrat_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger auto-numérotation contrats
CREATE OR REPLACE FUNCTION public.generate_contrat_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO public.contrat_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = contrat_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'CTR-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_contrat_numero ON public.contrats;
CREATE TRIGGER trg_generate_contrat_numero
BEFORE INSERT ON public.contrats
FOR EACH ROW
WHEN (NEW.numero IS NULL OR NEW.numero = '')
EXECUTE FUNCTION public.generate_contrat_numero();

-- RLS
ALTER TABLE public.marche_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soumissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Authenticated access lots" ON public.marche_lots;
CREATE POLICY "Authenticated access lots" ON public.marche_lots FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated access soumissions" ON public.soumissions;
CREATE POLICY "Authenticated access soumissions" ON public.soumissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated access contrats" ON public.contrats;
CREATE POLICY "Authenticated access contrats" ON public.contrats FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated access avenants" ON public.avenants;
CREATE POLICY "Authenticated access avenants" ON public.avenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated access contrat_attachments" ON public.contrat_attachments;
CREATE POLICY "Authenticated access contrat_attachments" ON public.contrat_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "User preferences access" ON public.notification_preferences;
CREATE POLICY "User preferences access" ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Storage bucket pour contrats
INSERT INTO storage.buckets (id, name, public) VALUES ('contrat-attachments', 'contrat-attachments', false) ON CONFLICT DO NOTHING;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_contrats_exercice ON public.contrats(exercice);
CREATE INDEX IF NOT EXISTS idx_contrats_prestataire ON public.contrats(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_marche_lots_marche ON public.marche_lots(marche_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_lot ON public.soumissions(lot_id);
