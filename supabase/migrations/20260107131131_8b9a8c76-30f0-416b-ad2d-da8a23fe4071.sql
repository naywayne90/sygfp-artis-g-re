-- =============================================
-- Module Référentiels & Modélisation - Tables
-- =============================================

-- 1) Table data_dictionary (Dictionnaire des variables)
CREATE TABLE IF NOT EXISTS public.data_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  table_name text NOT NULL,
  field_name text NOT NULL,
  label_fr text NOT NULL,
  description text,
  type_donnee text NOT NULL DEFAULT 'text',
  obligatoire boolean DEFAULT false,
  regles_validation text,
  exemple text,
  source text,
  version text DEFAULT '1.0',
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(table_name, field_name)
);

ALTER TABLE public.data_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique data_dictionary" ON public.data_dictionary
  FOR SELECT USING (true);

CREATE POLICY "Modification admin data_dictionary" ON public.data_dictionary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('ADMIN', 'DG')
      AND ur.is_active = true
    )
  );

-- 2) Table ref_codification_rules (Règles de codification)
CREATE TABLE IF NOT EXISTS public.ref_codification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_type text NOT NULL,
  format text NOT NULL,
  separateur text DEFAULT '-',
  ordre_composants jsonb DEFAULT '[]'::jsonb,
  longueur_seq integer DEFAULT 4,
  prefixe text,
  exemple text,
  description text,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(code_type)
);

ALTER TABLE public.ref_codification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique ref_codification_rules" ON public.ref_codification_rules
  FOR SELECT USING (true);

CREATE POLICY "Modification admin ref_codification_rules" ON public.ref_codification_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('ADMIN', 'DG')
      AND ur.is_active = true
    )
  );

-- 3) Table system_variables_connexion (Variables système)
CREATE TABLE IF NOT EXISTS public.system_variables_connexion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value_masked text,
  description text,
  environnement text DEFAULT 'PROD' CHECK (environnement IN ('DEV', 'TEST', 'PROD')),
  actif boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_variables_connexion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture admin system_variables_connexion" ON public.system_variables_connexion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Modification admin system_variables_connexion" ON public.system_variables_connexion
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'
      AND ur.is_active = true
    )
  );

-- 4) Table module_registry (Registre des modules)
CREATE TABLE IF NOT EXISTS public.module_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  module_name text NOT NULL,
  description text,
  tables_concernees jsonb DEFAULT '[]'::jsonb,
  variables_entree jsonb DEFAULT '[]'::jsonb,
  variables_sortie jsonb DEFAULT '[]'::jsonb,
  dependances jsonb DEFAULT '[]'::jsonb,
  owner_role text,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.module_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique module_registry" ON public.module_registry
  FOR SELECT USING (true);

CREATE POLICY "Modification admin module_registry" ON public.module_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('ADMIN', 'DG')
      AND ur.is_active = true
    )
  );

-- =============================================
-- Données initiales
-- =============================================

-- 5 exemples dans data_dictionary
INSERT INTO public.data_dictionary (module, table_name, field_name, label_fr, description, type_donnee, obligatoire, exemple, source) VALUES
('Budget', 'budget_lines', 'exercice', 'Exercice budgétaire', 'Année de l''exercice budgétaire concerné', 'integer', true, '2025', 'Paramétrage système'),
('Budget', 'budget_lines', 'code', 'Code ligne budgétaire', 'Code unique identifiant la ligne dans la structure', 'text', true, 'OS01-ACT001-SA01', 'Nomenclature budgétaire'),
('Engagement', 'budget_engagements', 'montant', 'Montant engagé', 'Montant TTC de l''engagement', 'numeric', true, '1500000', 'Saisie utilisateur'),
('Dossier', 'dossiers', 'numero', 'Numéro de dossier', 'Référence unique du dossier de dépense', 'text', true, 'DOS-2025-01-0001', 'Génération automatique'),
('Prestataire', 'prestataires', 'nif', 'NIF', 'Numéro d''Identification Fiscale du prestataire', 'text', true, '123456789', 'Déclaration prestataire')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- 2 règles de codification exemples
INSERT INTO public.ref_codification_rules (code_type, format, separateur, ordre_composants, longueur_seq, prefixe, exemple, description) VALUES
('DOSSIER', '{prefixe}{sep}{annee}{sep}{mois}{sep}{seq}', '-', '["prefixe", "annee", "mois", "sequence"]', 4, 'DOS', 'DOS-2025-01-0001', 'Format de numérotation des dossiers de dépense'),
('ENGAGEMENT', '{prefixe}{sep}{annee}{sep}{seq}', '-', '["prefixe", "annee", "sequence"]', 5, 'ENG', 'ENG-2025-00001', 'Format de numérotation des engagements budgétaires')
ON CONFLICT (code_type) DO NOTHING;

-- Registre des modules SYGFP
INSERT INTO public.module_registry (module_key, module_name, description, tables_concernees, variables_entree, variables_sortie, owner_role) VALUES
('BUDGET', 'Structure Budgétaire', 'Gestion de la structure et des lignes budgétaires', '["budget_lines", "budget_versions", "budget_imports"]', '["exercice_id", "direction_id"]', '["ligne_budgetaire_id", "disponible_calcule"]', 'DAAF'),
('ENGAGEMENT', 'Engagements', 'Gestion des engagements de dépense', '["budget_engagements", "engagement_validations", "engagement_attachments"]', '["ligne_budgetaire_id", "note_id", "marche_id"]', '["engagement_id", "montant_engage"]', 'DAAF'),
('LIQUIDATION', 'Liquidations', 'Constatation du service fait et liquidation', '["budget_liquidations"]', '["engagement_id"]', '["liquidation_id", "net_a_payer"]', 'DAAF'),
('ORDONNANCEMENT', 'Ordonnancements', 'Émission des mandats de paiement', '["ordonnancements"]', '["liquidation_id"]', '["ordonnancement_id", "mandat_numero"]', 'DAAF'),
('REGLEMENT', 'Règlements', 'Paiement effectif des mandats', '["reglements"]', '["ordonnancement_id", "compte_bancaire_id"]', '["reglement_id", "date_paiement"]', 'TRESORERIE'),
('MARCHE', 'Marchés Publics', 'Gestion des appels d''offres et marchés', '["marches", "marche_lots", "marche_offres"]', '["direction_id", "prestataire_id"]', '["marche_id", "lot_id"]', 'APPRO'),
('DOSSIER', 'Dossiers de Dépense', 'Suivi transversal des dossiers', '["dossiers", "dossier_etapes", "dossier_documents"]', '["exercice_id", "direction_id", "beneficiaire_id"]', '["dossier_id", "etape_courante"]', 'DAAF')
ON CONFLICT (module_key) DO NOTHING;

-- Variables système de connexion (exemples masqués)
INSERT INTO public.system_variables_connexion (key, value_masked, description, environnement) VALUES
('SUPABASE_URL', '****', 'URL de l''instance Supabase', 'PROD'),
('SUPABASE_ANON_KEY', '****', 'Clé publique Supabase', 'PROD'),
('SMTP_HOST', '****', 'Serveur SMTP pour les emails', 'PROD')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Trigger pour updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_data_dictionary_updated_at ON data_dictionary;
CREATE TRIGGER update_data_dictionary_updated_at
  BEFORE UPDATE ON data_dictionary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ref_codification_rules_updated_at ON ref_codification_rules;
CREATE TRIGGER update_ref_codification_rules_updated_at
  BEFORE UPDATE ON ref_codification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_registry_updated_at ON module_registry;
CREATE TRIGGER update_module_registry_updated_at
  BEFORE UPDATE ON module_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();