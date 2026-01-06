-- =============================================
-- TABLES TRÉSORERIE
-- =============================================

-- Comptes bancaires
CREATE TABLE IF NOT EXISTS public.comptes_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  banque VARCHAR(255),
  numero_compte VARCHAR(50),
  iban VARCHAR(50),
  bic VARCHAR(20),
  solde_initial NUMERIC(18,2) DEFAULT 0,
  solde_actuel NUMERIC(18,2) DEFAULT 0,
  devise VARCHAR(3) DEFAULT 'XOF',
  type_compte VARCHAR(50) DEFAULT 'courant',
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Séquences opérations trésorerie
CREATE TABLE IF NOT EXISTS public.operation_tresorerie_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Opérations de trésorerie
CREATE TABLE IF NOT EXISTS public.operations_tresorerie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50),
  compte_id UUID NOT NULL REFERENCES public.comptes_bancaires(id),
  type_operation VARCHAR(20) NOT NULL CHECK (type_operation IN ('entree', 'sortie', 'virement')),
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_valeur DATE,
  montant NUMERIC(18,2) NOT NULL,
  solde_avant NUMERIC(18,2),
  solde_apres NUMERIC(18,2),
  libelle VARCHAR(500) NOT NULL,
  reference_externe VARCHAR(100),
  reglement_id UUID REFERENCES public.reglements(id),
  recette_id UUID,
  compte_destination_id UUID REFERENCES public.comptes_bancaires(id),
  rapproche BOOLEAN DEFAULT false,
  date_rapprochement DATE,
  exercice INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Trigger auto-numérotation opérations
CREATE OR REPLACE FUNCTION public.generate_operation_tresorerie_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NEW.date_operation);
  
  INSERT INTO public.operation_tresorerie_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = operation_tresorerie_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'OPT-' || v_annee || '-' || LPAD(v_numero::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_generate_operation_tresorerie_numero
BEFORE INSERT ON public.operations_tresorerie
FOR EACH ROW WHEN (NEW.numero IS NULL)
EXECUTE FUNCTION public.generate_operation_tresorerie_numero();

-- Trigger mise à jour solde compte
CREATE OR REPLACE FUNCTION public.update_compte_solde()
RETURNS TRIGGER AS $$
BEGIN
  -- Stocker le solde avant
  SELECT solde_actuel INTO NEW.solde_avant FROM public.comptes_bancaires WHERE id = NEW.compte_id;
  
  -- Calculer le nouveau solde
  IF NEW.type_operation = 'entree' THEN
    NEW.solde_apres := COALESCE(NEW.solde_avant, 0) + NEW.montant;
    UPDATE public.comptes_bancaires SET solde_actuel = NEW.solde_apres, updated_at = now() WHERE id = NEW.compte_id;
  ELSIF NEW.type_operation = 'sortie' THEN
    NEW.solde_apres := COALESCE(NEW.solde_avant, 0) - NEW.montant;
    UPDATE public.comptes_bancaires SET solde_actuel = NEW.solde_apres, updated_at = now() WHERE id = NEW.compte_id;
  ELSIF NEW.type_operation = 'virement' THEN
    -- Débiter le compte source
    NEW.solde_apres := COALESCE(NEW.solde_avant, 0) - NEW.montant;
    UPDATE public.comptes_bancaires SET solde_actuel = NEW.solde_apres, updated_at = now() WHERE id = NEW.compte_id;
    -- Créditer le compte destination
    UPDATE public.comptes_bancaires SET solde_actuel = solde_actuel + NEW.montant, updated_at = now() WHERE id = NEW.compte_destination_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_compte_solde
BEFORE INSERT ON public.operations_tresorerie
FOR EACH ROW
EXECUTE FUNCTION public.update_compte_solde();

-- =============================================
-- TABLES RECETTES
-- =============================================

-- Séquences recettes
CREATE TABLE IF NOT EXISTS public.recette_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recettes
CREATE TABLE IF NOT EXISTS public.recettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50),
  date_recette DATE NOT NULL DEFAULT CURRENT_DATE,
  origine VARCHAR(255) NOT NULL,
  categorie VARCHAR(100),
  description TEXT,
  montant NUMERIC(18,2) NOT NULL,
  compte_id UUID REFERENCES public.comptes_bancaires(id),
  reference_justificatif VARCHAR(255),
  statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'validee', 'encaissee', 'annulee')),
  date_encaissement DATE,
  encaisse_par UUID REFERENCES public.profiles(id),
  exercice INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Trigger auto-numérotation recettes
CREATE OR REPLACE FUNCTION public.generate_recette_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NEW.date_recette);
  
  INSERT INTO public.recette_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = recette_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'RCT-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_generate_recette_numero
BEFORE INSERT ON public.recettes
FOR EACH ROW WHEN (NEW.numero IS NULL)
EXECUTE FUNCTION public.generate_recette_numero();

-- Pièces jointes recettes
CREATE TABLE IF NOT EXISTS public.recette_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recette_id UUID NOT NULL REFERENCES public.recettes(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- =============================================
-- TABLE NOTIFICATIONS (si pas existante)
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  entity_numero VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Préférences notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.comptes_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recette_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Comptes bancaires - accès pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can view comptes_bancaires" ON public.comptes_bancaires
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comptes_bancaires" ON public.comptes_bancaires
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update comptes_bancaires" ON public.comptes_bancaires
  FOR UPDATE TO authenticated USING (true);

-- Opérations trésorerie
CREATE POLICY "Authenticated users can view operations_tresorerie" ON public.operations_tresorerie
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert operations_tresorerie" ON public.operations_tresorerie
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update operations_tresorerie" ON public.operations_tresorerie
  FOR UPDATE TO authenticated USING (true);

-- Recettes
CREATE POLICY "Authenticated users can view recettes" ON public.recettes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recettes" ON public.recettes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update recettes" ON public.recettes
  FOR UPDATE TO authenticated USING (true);

-- Recette attachments
CREATE POLICY "Authenticated users can view recette_attachments" ON public.recette_attachments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recette_attachments" ON public.recette_attachments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications - utilisateur voit ses propres notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Préférences notifications
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- =============================================
-- STORAGE BUCKET pour recettes
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recette-attachments', 'recette-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload recette attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recette-attachments');

CREATE POLICY "Authenticated users can view recette attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recette-attachments');

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_operations_tresorerie_compte ON public.operations_tresorerie(compte_id);
CREATE INDEX IF NOT EXISTS idx_operations_tresorerie_exercice ON public.operations_tresorerie(exercice);
CREATE INDEX IF NOT EXISTS idx_recettes_exercice ON public.recettes(exercice);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);