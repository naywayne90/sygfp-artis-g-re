-- =============================================
-- MODULE APPROVISIONNEMENT - TABLES
-- =============================================

-- Table des articles (référentiel)
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  unite VARCHAR(50) NOT NULL DEFAULT 'unité',
  categorie VARCHAR(100),
  seuil_mini INTEGER DEFAULT 0,
  stock_actuel INTEGER DEFAULT 0,
  prix_unitaire_moyen NUMERIC(15,2) DEFAULT 0,
  emplacement VARCHAR(100),
  est_actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Table des demandes d'achat
CREATE TABLE public.demandes_achat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
  objet TEXT NOT NULL,
  justification TEXT,
  urgence VARCHAR(20) DEFAULT 'normale',
  statut VARCHAR(50) DEFAULT 'brouillon',
  dossier_id UUID REFERENCES public.dossiers(id),
  engagement_id UUID REFERENCES public.budget_engagements(id),
  direction_id UUID REFERENCES public.directions(id),
  montant_estime NUMERIC(15,2),
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.profiles(id)
);

-- Table des lignes de demande d'achat
CREATE TABLE public.demande_achat_lignes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_achat(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id),
  designation TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  unite VARCHAR(50) DEFAULT 'unité',
  prix_unitaire_estime NUMERIC(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des réceptions
CREATE TABLE public.receptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_reception DATE NOT NULL DEFAULT CURRENT_DATE,
  demande_id UUID REFERENCES public.demandes_achat(id),
  fournisseur VARCHAR(255),
  numero_bl VARCHAR(100),
  numero_facture VARCHAR(100),
  observations TEXT,
  statut VARCHAR(50) DEFAULT 'brouillon',
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.profiles(id)
);

-- Table des lignes de réception
CREATE TABLE public.reception_lignes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reception_id UUID NOT NULL REFERENCES public.receptions(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id),
  quantite_commandee INTEGER DEFAULT 0,
  quantite_recue INTEGER NOT NULL,
  quantite_acceptee INTEGER,
  ecart INTEGER GENERATED ALWAYS AS (quantite_recue - COALESCE(quantite_commandee, quantite_recue)) STORED,
  motif_ecart TEXT,
  prix_unitaire NUMERIC(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des pièces jointes réception
CREATE TABLE public.reception_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reception_id UUID NOT NULL REFERENCES public.receptions(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- Table des mouvements de stock
CREATE TABLE public.mouvements_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_mouvement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  type_mouvement VARCHAR(20) NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'transfert', 'ajustement')),
  article_id UUID NOT NULL REFERENCES public.articles(id),
  quantite INTEGER NOT NULL,
  stock_avant INTEGER NOT NULL,
  stock_apres INTEGER NOT NULL,
  motif TEXT NOT NULL,
  reference_document VARCHAR(100),
  reception_id UUID REFERENCES public.receptions(id),
  demande_id UUID REFERENCES public.demandes_achat(id),
  destination VARCHAR(255),
  beneficiaire VARCHAR(255),
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Table des inventaires
CREATE TABLE public.inventaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_inventaire DATE NOT NULL DEFAULT CURRENT_DATE,
  libelle VARCHAR(255) NOT NULL,
  observations TEXT,
  statut VARCHAR(50) DEFAULT 'brouillon',
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  cloture_at TIMESTAMP WITH TIME ZONE,
  cloture_by UUID REFERENCES public.profiles(id)
);

-- Table des lignes d'inventaire
CREATE TABLE public.inventaire_lignes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventaire_id UUID NOT NULL REFERENCES public.inventaires(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id),
  stock_theorique INTEGER NOT NULL,
  stock_physique INTEGER,
  ecart INTEGER GENERATED ALWAYS AS (COALESCE(stock_physique, 0) - stock_theorique) STORED,
  justification TEXT,
  ajustement_effectue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Séquences pour numérotation auto
CREATE TABLE public.demande_achat_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.reception_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.mouvement_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.inventaire_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- FONCTIONS DE GENERATION DE NUMEROS
-- =============================================

CREATE OR REPLACE FUNCTION generate_demande_achat_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO demande_achat_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = demande_achat_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'DA-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION generate_reception_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO reception_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = reception_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'REC-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION generate_mouvement_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO mouvement_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = mouvement_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'MVT-' || v_annee || '-' || LPAD(v_numero::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION generate_inventaire_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO inventaire_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE SET 
    dernier_numero = inventaire_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  NEW.numero := 'INV-' || v_annee || '-' || LPAD(v_numero::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers de numérotation
CREATE TRIGGER trg_generate_demande_achat_numero
  BEFORE INSERT ON demandes_achat
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_demande_achat_numero();

CREATE TRIGGER trg_generate_reception_numero
  BEFORE INSERT ON receptions
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_reception_numero();

CREATE TRIGGER trg_generate_mouvement_numero
  BEFORE INSERT ON mouvements_stock
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_mouvement_numero();

CREATE TRIGGER trg_generate_inventaire_numero
  BEFORE INSERT ON inventaires
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_inventaire_numero();

-- =============================================
-- FONCTION MISE A JOUR STOCK
-- =============================================

CREATE OR REPLACE FUNCTION update_article_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles SET 
      stock_actuel = NEW.stock_apres,
      updated_at = now()
    WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_article_stock
  AFTER INSERT ON mouvements_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_article_stock();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_achat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demande_achat_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaire_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demande_achat_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvement_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaire_sequences ENABLE ROW LEVEL SECURITY;

-- Policies pour articles
CREATE POLICY "articles_select" ON public.articles FOR SELECT USING (true);
CREATE POLICY "articles_insert" ON public.articles FOR INSERT WITH CHECK (true);
CREATE POLICY "articles_update" ON public.articles FOR UPDATE USING (true);
CREATE POLICY "articles_delete" ON public.articles FOR DELETE USING (true);

-- Policies pour demandes_achat
CREATE POLICY "demandes_achat_select" ON public.demandes_achat FOR SELECT USING (true);
CREATE POLICY "demandes_achat_insert" ON public.demandes_achat FOR INSERT WITH CHECK (true);
CREATE POLICY "demandes_achat_update" ON public.demandes_achat FOR UPDATE USING (true);
CREATE POLICY "demandes_achat_delete" ON public.demandes_achat FOR DELETE USING (true);

-- Policies pour demande_achat_lignes
CREATE POLICY "demande_achat_lignes_select" ON public.demande_achat_lignes FOR SELECT USING (true);
CREATE POLICY "demande_achat_lignes_insert" ON public.demande_achat_lignes FOR INSERT WITH CHECK (true);
CREATE POLICY "demande_achat_lignes_update" ON public.demande_achat_lignes FOR UPDATE USING (true);
CREATE POLICY "demande_achat_lignes_delete" ON public.demande_achat_lignes FOR DELETE USING (true);

-- Policies pour receptions
CREATE POLICY "receptions_select" ON public.receptions FOR SELECT USING (true);
CREATE POLICY "receptions_insert" ON public.receptions FOR INSERT WITH CHECK (true);
CREATE POLICY "receptions_update" ON public.receptions FOR UPDATE USING (true);
CREATE POLICY "receptions_delete" ON public.receptions FOR DELETE USING (true);

-- Policies pour reception_lignes
CREATE POLICY "reception_lignes_select" ON public.reception_lignes FOR SELECT USING (true);
CREATE POLICY "reception_lignes_insert" ON public.reception_lignes FOR INSERT WITH CHECK (true);
CREATE POLICY "reception_lignes_update" ON public.reception_lignes FOR UPDATE USING (true);
CREATE POLICY "reception_lignes_delete" ON public.reception_lignes FOR DELETE USING (true);

-- Policies pour reception_attachments
CREATE POLICY "reception_attachments_select" ON public.reception_attachments FOR SELECT USING (true);
CREATE POLICY "reception_attachments_insert" ON public.reception_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "reception_attachments_delete" ON public.reception_attachments FOR DELETE USING (true);

-- Policies pour mouvements_stock
CREATE POLICY "mouvements_stock_select" ON public.mouvements_stock FOR SELECT USING (true);
CREATE POLICY "mouvements_stock_insert" ON public.mouvements_stock FOR INSERT WITH CHECK (true);

-- Policies pour inventaires
CREATE POLICY "inventaires_select" ON public.inventaires FOR SELECT USING (true);
CREATE POLICY "inventaires_insert" ON public.inventaires FOR INSERT WITH CHECK (true);
CREATE POLICY "inventaires_update" ON public.inventaires FOR UPDATE USING (true);
CREATE POLICY "inventaires_delete" ON public.inventaires FOR DELETE USING (true);

-- Policies pour inventaire_lignes
CREATE POLICY "inventaire_lignes_select" ON public.inventaire_lignes FOR SELECT USING (true);
CREATE POLICY "inventaire_lignes_insert" ON public.inventaire_lignes FOR INSERT WITH CHECK (true);
CREATE POLICY "inventaire_lignes_update" ON public.inventaire_lignes FOR UPDATE USING (true);
CREATE POLICY "inventaire_lignes_delete" ON public.inventaire_lignes FOR DELETE USING (true);

-- Policies pour séquences
CREATE POLICY "demande_achat_sequences_all" ON public.demande_achat_sequences FOR ALL USING (true);
CREATE POLICY "reception_sequences_all" ON public.reception_sequences FOR ALL USING (true);
CREATE POLICY "mouvement_sequences_all" ON public.mouvement_sequences FOR ALL USING (true);
CREATE POLICY "inventaire_sequences_all" ON public.inventaire_sequences FOR ALL USING (true);

-- Index pour performances
CREATE INDEX idx_articles_code ON public.articles(code);
CREATE INDEX idx_articles_categorie ON public.articles(categorie);
CREATE INDEX idx_demandes_achat_exercice ON public.demandes_achat(exercice);
CREATE INDEX idx_demandes_achat_statut ON public.demandes_achat(statut);
CREATE INDEX idx_receptions_exercice ON public.receptions(exercice);
CREATE INDEX idx_mouvements_stock_article ON public.mouvements_stock(article_id);
CREATE INDEX idx_mouvements_stock_type ON public.mouvements_stock(type_mouvement);
CREATE INDEX idx_mouvements_stock_date ON public.mouvements_stock(date_mouvement);
CREATE INDEX idx_inventaires_exercice ON public.inventaires(exercice);