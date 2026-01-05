
-- Table principale des dossiers
CREATE TABLE public.dossiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  exercice INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  direction_id UUID REFERENCES public.directions(id),
  objet TEXT NOT NULL,
  demandeur_id UUID REFERENCES public.profiles(id),
  montant_estime NUMERIC DEFAULT 0,
  montant_engage NUMERIC DEFAULT 0,
  montant_liquide NUMERIC DEFAULT 0,
  montant_ordonnance NUMERIC DEFAULT 0,
  statut_global TEXT DEFAULT 'en_cours' CHECK (statut_global IN ('en_cours', 'termine', 'annule', 'suspendu')),
  etape_courante TEXT DEFAULT 'note',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des étapes du dossier (timeline)
CREATE TABLE public.dossier_etapes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  type_etape TEXT NOT NULL CHECK (type_etape IN ('note', 'expression_besoin', 'marche', 'engagement', 'liquidation', 'ordonnancement', 'reglement')),
  entity_id UUID,
  statut TEXT DEFAULT 'en_attente',
  montant NUMERIC DEFAULT 0,
  commentaire TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table GED pour les documents du dossier
CREATE TABLE public.dossier_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  etape_id UUID REFERENCES public.dossier_etapes(id),
  type_document TEXT NOT NULL,
  categorie TEXT DEFAULT 'autre' CHECK (categorie IN ('proforma', 'bon_commande', 'contrat', 'pv_reception', 'facture', 'attestation', 'autre')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour la séquence de numérotation par mois/année
CREATE TABLE public.dossier_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(annee, mois)
);

-- Fonction pour générer le numéro de dossier automatiquement
CREATE OR REPLACE FUNCTION public.generate_dossier_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_mois INTEGER;
  v_annee_court TEXT;
  v_mois_text TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
BEGIN
  -- Extraire mois et année actuels
  v_annee := EXTRACT(year FROM CURRENT_DATE);
  v_mois := EXTRACT(month FROM CURRENT_DATE);
  v_annee_court := RIGHT(v_annee::TEXT, 2);
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');
  
  -- Obtenir ou créer la séquence pour ce mois/année
  INSERT INTO public.dossier_sequences (annee, mois, dernier_numero)
  VALUES (v_annee, v_mois, 0)
  ON CONFLICT (annee, mois) DO NOTHING;
  
  -- Incrémenter et obtenir le numéro séquentiel
  UPDATE public.dossier_sequences
  SET dernier_numero = dernier_numero + 1, updated_at = now()
  WHERE annee = v_annee AND mois = v_mois
  RETURNING dernier_numero INTO v_sequence;
  
  -- Générer le numéro au format ARTI + MM + YY + NNNNNN
  v_numero := 'ARTI' || v_mois_text || v_annee_court || LPAD(v_sequence::TEXT, 6, '0');
  
  NEW.numero := v_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour auto-générer le numéro
CREATE TRIGGER trigger_generate_dossier_numero
  BEFORE INSERT ON public.dossiers
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_dossier_numero();

-- Trigger pour updated_at
CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON public.dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_dossiers_numero ON public.dossiers(numero);
CREATE INDEX idx_dossiers_exercice ON public.dossiers(exercice);
CREATE INDEX idx_dossiers_direction ON public.dossiers(direction_id);
CREATE INDEX idx_dossiers_statut ON public.dossiers(statut_global);
CREATE INDEX idx_dossier_etapes_dossier ON public.dossier_etapes(dossier_id);
CREATE INDEX idx_dossier_documents_dossier ON public.dossier_documents(dossier_id);

-- RLS
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_etapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_sequences ENABLE ROW LEVEL SECURITY;

-- Policies pour dossiers
CREATE POLICY "Users can view dossiers from their direction or if authorized"
  ON public.dossiers FOR SELECT
  USING (
    direction_id IN (SELECT direction_id FROM profiles WHERE id = auth.uid())
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

CREATE POLICY "Authorized roles can manage dossiers"
  ON public.dossiers FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR created_by = auth.uid()
  );

-- Policies pour étapes
CREATE POLICY "Everyone can view dossier etapes"
  ON public.dossier_etapes FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage dossier etapes"
  ON public.dossier_etapes FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

-- Policies pour documents
CREATE POLICY "Everyone can view dossier documents"
  ON public.dossier_documents FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage dossier documents"
  ON public.dossier_documents FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR uploaded_by = auth.uid()
  );

-- Policies pour séquences (admin seulement)
CREATE POLICY "Only system can manage sequences"
  ON public.dossier_sequences FOR ALL
  USING (true);
