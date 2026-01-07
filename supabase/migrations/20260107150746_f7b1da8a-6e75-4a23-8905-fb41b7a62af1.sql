-- A) Table module_documentation
CREATE TABLE IF NOT EXISTS public.module_documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key VARCHAR(100) NOT NULL UNIQUE,
  module_label VARCHAR(255),
  objectif TEXT,
  perimetre TEXT,
  tables_utilisees JSONB DEFAULT '[]'::jsonb,
  champs_cles JSONB DEFAULT '[]'::jsonb,
  statuts_workflow JSONB DEFAULT '[]'::jsonb,
  regles_metier TEXT,
  cas_limites TEXT,
  controles JSONB DEFAULT '[]'::jsonb,
  dependances JSONB DEFAULT '[]'::jsonb,
  version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.module_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage module documentation" ON public.module_documentation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel::text = 'admin')
  );

CREATE POLICY "All authenticated can view module documentation" ON public.module_documentation
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert default modules
INSERT INTO public.module_documentation (module_key, module_label, objectif, tables_utilisees, statuts_workflow) VALUES
('budget', 'Gestion Budgétaire', 'Planification et suivi des lignes budgétaires', '["budget_lines", "budget_versions", "credit_transfers"]', '["brouillon", "soumis", "validé", "rejeté"]'),
('engagement', 'Engagements', 'Création et validation des engagements budgétaires', '["budget_engagements", "budget_lines"]', '["brouillon", "soumis", "validé", "rejeté", "différé"]'),
('liquidation', 'Liquidations', 'Certification du service fait et liquidation', '["budget_liquidations", "budget_engagements"]', '["brouillon", "certifié", "validé", "rejeté"]'),
('ordonnancement', 'Ordonnancements', 'Émission des ordres de paiement', '["budget_ordonnancements", "budget_liquidations"]', '["brouillon", "signé", "validé", "rejeté"]'),
('reglement', 'Règlements', 'Exécution des paiements', '["budget_reglements", "budget_ordonnancements"]', '["en_attente", "payé", "annulé"]'),
('marche', 'Marchés Publics', 'Gestion des marchés et consultations', '["marches", "marche_lots", "marche_offres"]', '["brouillon", "lancé", "évaluation", "attribué", "clos"]'),
('prestataire', 'Prestataires', 'Référentiel des fournisseurs', '["prestataires"]', '["en_attente", "validé", "suspendu", "radié"]'),
('tresorerie', 'Trésorerie', 'Gestion des comptes et opérations', '["comptes_bancaires", "operations_tresorerie"]', '[]'),
('recette', 'Recettes', 'Déclaration et suivi des recettes', '["recettes"]', '["déclarée", "encaissée", "annulée"]'),
('alerte', 'Alertes Budgétaires', 'Système d''alertes multi-seuils', '["budg_alerts", "budg_alert_rules"]', '["active", "acquittée", "résolue"]')
ON CONFLICT (module_key) DO NOTHING;

-- C) Table RACI Matrix
CREATE TABLE IF NOT EXISTS public.raci_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processus VARCHAR(255) NOT NULL,
  processus_code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  role_responsible VARCHAR(100),
  role_accountable VARCHAR(100),
  roles_consulted JSONB DEFAULT '[]'::jsonb,
  roles_informed JSONB DEFAULT '[]'::jsonb,
  module_key VARCHAR(100),
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.raci_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage RACI" ON public.raci_matrix
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel::text = 'admin')
  );

CREATE POLICY "All authenticated can view RACI" ON public.raci_matrix
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert default RACI entries
INSERT INTO public.raci_matrix (processus, processus_code, module_key, role_responsible, role_accountable, roles_consulted, roles_informed, ordre) VALUES
('Validation prestataire', 'validation_prestataire', 'prestataire', 'SDPM', 'DAF', '["DG"]', '["Direction demandeur"]', 1),
('Création ligne budgétaire', 'creation_ligne_budget', 'budget', 'SDPM', 'DAF', '["Direction concernée"]', '["DG"]', 2),
('Validation virement de crédits', 'validation_virement', 'budget', 'AICB', 'DAF', '["SDPM"]', '["Directions source/cible"]', 3),
('Création engagement', 'creation_engagement', 'engagement', 'Direction', 'SDPM', '[]', '["DAF"]', 4),
('Validation engagement', 'validation_engagement', 'engagement', 'SDPM', 'DAF', '["AICB"]', '["Direction"]', 5),
('Certification service fait', 'certification_sf', 'liquidation', 'Direction', 'Direction', '[]', '["SDPM"]', 6),
('Validation liquidation', 'validation_liquidation', 'liquidation', 'SDPM', 'DAF', '[]', '["Direction"]', 7),
('Signature ordonnancement', 'signature_ordonnancement', 'ordonnancement', 'DAF', 'DG', '[]', '["SDPM", "Trésorerie"]', 8),
('Exécution règlement', 'execution_reglement', 'reglement', 'Trésorerie', 'DAF', '[]', '["Direction", "Prestataire"]', 9),
('Lancement marché', 'lancement_marche', 'marche', 'SDPM', 'DAF', '["Commission", "Direction"]', '["DG"]', 10),
('Attribution marché', 'attribution_marche', 'marche', 'Commission', 'DG', '["DAF", "SDPM"]', '["Soumissionnaires"]', 11),
('Déclenchement alerte budgétaire', 'declenchement_alerte', 'alerte', 'Système', 'SDPM', '[]', '["DAF", "Direction concernée"]', 12)
ON CONFLICT (processus_code) DO NOTHING;

-- D) Table checklist mise en production
CREATE TABLE IF NOT EXISTS public.production_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  check_key VARCHAR(100) NOT NULL,
  check_label VARCHAR(255) NOT NULL,
  check_category VARCHAR(100),
  is_checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMP WITH TIME ZONE,
  checked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exercice, check_key)
);

ALTER TABLE public.production_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist" ON public.production_checklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel::text = 'admin')
  );

CREATE POLICY "All authenticated can view checklist" ON public.production_checklist
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fonction pour initialiser checklist d'un exercice
CREATE OR REPLACE FUNCTION public.init_production_checklist(p_exercice INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO production_checklist (exercice, check_key, check_label, check_category, ordre)
  VALUES
    (p_exercice, 'exercice_ouvert', 'Exercice créé et ouvert', 'Exercice', 1),
    (p_exercice, 'directions_chargees', 'Directions/Services chargés', 'Référentiels', 2),
    (p_exercice, 'missions_chargees', 'Missions chargées', 'Référentiels', 3),
    (p_exercice, 'os_charges', 'Objectifs stratégiques chargés', 'Référentiels', 4),
    (p_exercice, 'actions_chargees', 'Actions chargées', 'Référentiels', 5),
    (p_exercice, 'nbe_charge', 'Nomenclature NBE chargée', 'Référentiels', 6),
    (p_exercice, 'nve_charge', 'Nomenclature NVE chargée', 'Référentiels', 7),
    (p_exercice, 'dotations_importees', 'Dotations budgétaires importées (>0)', 'Budget', 8),
    (p_exercice, 'lignes_valides', 'Lignes budgétaires validées', 'Budget', 9),
    (p_exercice, 'prestataires_valides', 'Prestataires principaux validés', 'Prestataires', 10),
    (p_exercice, 'roles_configures', 'Rôles et permissions configurés', 'Droits', 11),
    (p_exercice, 'utilisateurs_actifs', 'Utilisateurs créés et actifs', 'Droits', 12),
    (p_exercice, 'alertes_configurees', 'Règles d''alertes budgétaires configurées', 'Alertes', 13),
    (p_exercice, 'test_engagement', 'Test création engagement OK', 'Tests', 14),
    (p_exercice, 'test_liquidation', 'Test liquidation OK', 'Tests', 15),
    (p_exercice, 'test_ordonnancement', 'Test ordonnancement OK', 'Tests', 16),
    (p_exercice, 'test_reglement', 'Test règlement OK', 'Tests', 17),
    (p_exercice, 'backup_effectue', 'Sauvegarde initiale effectuée', 'Sécurité', 18)
  ON CONFLICT (exercice, check_key) DO NOTHING;
END;
$$;

-- Fonction pour obtenir les destinataires suggérés depuis RACI
CREATE OR REPLACE FUNCTION public.get_raci_informed_roles(p_processus_code VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'responsible', role_responsible,
      'accountable', role_accountable,
      'consulted', roles_consulted,
      'informed', roles_informed
    )
  INTO v_roles
  FROM raci_matrix
  WHERE processus_code = p_processus_code AND actif = true;
  
  RETURN COALESCE(v_roles, '{}'::jsonb);
END;
$$;