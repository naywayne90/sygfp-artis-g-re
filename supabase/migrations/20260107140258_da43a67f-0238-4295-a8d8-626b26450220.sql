-- Table des secteurs d'activité (2 niveaux : PRINCIPAL / SECONDAIRE)
CREATE TABLE public.ref_secteurs_activite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau TEXT NOT NULL CHECK (niveau IN ('PRINCIPAL', 'SECONDAIRE')),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  parent_id UUID REFERENCES public.ref_secteurs_activite(id) ON DELETE RESTRICT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT unique_code_par_niveau UNIQUE (niveau, code),
  CONSTRAINT check_principal_no_parent CHECK (
    (niveau = 'PRINCIPAL' AND parent_id IS NULL) OR 
    (niveau = 'SECONDAIRE' AND parent_id IS NOT NULL)
  )
);

-- Index pour performance
CREATE INDEX idx_secteurs_parent ON public.ref_secteurs_activite(parent_id);
CREATE INDEX idx_secteurs_niveau_actif ON public.ref_secteurs_activite(niveau, actif);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_ref_secteurs
  BEFORE UPDATE ON public.ref_secteurs_activite
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.ref_secteurs_activite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture secteurs pour tous les utilisateurs authentifiés"
  ON public.ref_secteurs_activite FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Modification secteurs pour ADMIN"
  ON public.ref_secteurs_activite FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- Ajouter les colonnes secteur dans prestataires (sans supprimer l'ancien champ)
ALTER TABLE public.prestataires
  ADD COLUMN IF NOT EXISTS secteur_principal_id UUID REFERENCES public.ref_secteurs_activite(id),
  ADD COLUMN IF NOT EXISTS secteur_secondaire_id UUID REFERENCES public.ref_secteurs_activite(id);

CREATE INDEX idx_prestataires_secteur_principal ON public.prestataires(secteur_principal_id);
CREATE INDEX idx_prestataires_secteur_secondaire ON public.prestataires(secteur_secondaire_id);

-- Données de départ : 5 secteurs principaux
INSERT INTO public.ref_secteurs_activite (niveau, code, libelle) VALUES
  ('PRINCIPAL', 'INFO', 'Informatique & Télécommunications'),
  ('PRINCIPAL', 'BTP', 'Bâtiment & Travaux Publics'),
  ('PRINCIPAL', 'FOUR', 'Fournitures & Équipements'),
  ('PRINCIPAL', 'TRANS', 'Transport & Logistique'),
  ('PRINCIPAL', 'SERV', 'Services & Conseils');

-- Données : 10 secteurs secondaires (2 par principal)
INSERT INTO public.ref_secteurs_activite (niveau, code, libelle, parent_id) VALUES
  ('SECONDAIRE', 'INFO-DEV', 'Développement logiciel', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'INFO')),
  ('SECONDAIRE', 'INFO-MAT', 'Matériel informatique', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'INFO')),
  ('SECONDAIRE', 'BTP-GC', 'Génie civil', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'BTP')),
  ('SECONDAIRE', 'BTP-ELEC', 'Électricité & Plomberie', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'BTP')),
  ('SECONDAIRE', 'FOUR-BUR', 'Fournitures de bureau', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'FOUR')),
  ('SECONDAIRE', 'FOUR-TECH', 'Équipements techniques', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'FOUR')),
  ('SECONDAIRE', 'TRANS-ROUTE', 'Transport routier', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'TRANS')),
  ('SECONDAIRE', 'TRANS-LOG', 'Logistique & Entreposage', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'TRANS')),
  ('SECONDAIRE', 'SERV-CONS', 'Conseil & Audit', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'SERV')),
  ('SECONDAIRE', 'SERV-FORM', 'Formation & Renforcement', (SELECT id FROM public.ref_secteurs_activite WHERE code = 'SERV'));