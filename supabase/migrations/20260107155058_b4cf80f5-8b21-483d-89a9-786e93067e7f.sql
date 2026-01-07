
-- Table des variables standardisées pour les liens lambda
CREATE TABLE IF NOT EXISTS public.ref_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_variable VARCHAR(100) UNIQUE NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  type_variable VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (type_variable IN ('string', 'number', 'date', 'datetime', 'boolean', 'enum', 'fk', 'uuid', 'jsonb')),
  obligatoire BOOLEAN DEFAULT FALSE,
  exemple TEXT,
  module_source VARCHAR(100),
  module_cible VARCHAR(100),
  tables_concernees JSONB DEFAULT '[]'::jsonb,
  source_of_truth VARCHAR(50) DEFAULT 'source' CHECK (source_of_truth IN ('source', 'cible', 'manuel')),
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des liens lambda entre entités
CREATE TABLE IF NOT EXISTS public.lambda_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice INTEGER,
  source_table VARCHAR(100) NOT NULL,
  source_id UUID NOT NULL,
  cible_table VARCHAR(100) NOT NULL,
  cible_id UUID,
  type_lien VARCHAR(20) NOT NULL DEFAULT 'auto' CHECK (type_lien IN ('auto', 'manuel')),
  mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut_sync VARCHAR(20) NOT NULL DEFAULT 'a_sync' CHECK (statut_sync IN ('ok', 'a_sync', 'erreur', 'desactive')),
  erreur_detail TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  commentaire TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des types de liens avec feature flags
CREATE TABLE IF NOT EXISTS public.lambda_link_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  source_table VARCHAR(100) NOT NULL,
  cible_table VARCHAR(100) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  default_mapping JSONB DEFAULT '{}'::jsonb,
  actif BOOLEAN DEFAULT FALSE,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_lambda_links_source ON public.lambda_links(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_lambda_links_cible ON public.lambda_links(cible_table, cible_id);
CREATE INDEX IF NOT EXISTS idx_lambda_links_statut ON public.lambda_links(statut_sync);
CREATE INDEX IF NOT EXISTS idx_lambda_links_exercice ON public.lambda_links(exercice);

-- RLS pour ref_variables
ALTER TABLE public.ref_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_variables_read" ON public.ref_variables FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_variables_admin_write" ON public.ref_variables FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'DG'));

-- RLS pour lambda_links
ALTER TABLE public.lambda_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lambda_links_read" ON public.lambda_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "lambda_links_write" ON public.lambda_links FOR ALL TO authenticated USING (true);

-- RLS pour lambda_link_types
ALTER TABLE public.lambda_link_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lambda_link_types_read" ON public.lambda_link_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "lambda_link_types_admin_write" ON public.lambda_link_types FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'DG'));

-- Insérer les variables cœur
INSERT INTO public.ref_variables (code_variable, libelle, type_variable, obligatoire, module_source, tables_concernees, source_of_truth) VALUES
  ('exercice_id', 'Exercice budgétaire', 'number', true, 'Budget', '["budget_lines", "budget_engagements", "budget_liquidations", "ordonnancements", "reglements"]'::jsonb, 'source'),
  ('code_budgetaire', 'Code de la ligne budgétaire', 'string', true, 'Budget', '["budget_lines"]'::jsonb, 'source'),
  ('libelle', 'Libellé / Objet', 'string', true, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations", "ordonnancements"]'::jsonb, 'source'),
  ('direction_id', 'Direction concernée', 'fk', false, 'Admin', '["budget_lines", "dossiers", "demandes_achat"]'::jsonb, 'source'),
  ('budget_line_id', 'Ligne budgétaire', 'fk', true, 'Budget', '["budget_engagements", "notes_dg"]'::jsonb, 'source'),
  ('prestataire_id', 'Prestataire / Fournisseur', 'fk', false, 'Prestataire', '["budget_engagements", "contrats", "marches"]'::jsonb, 'source'),
  ('montant', 'Montant TTC', 'number', true, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations", "ordonnancements", "reglements"]'::jsonb, 'source'),
  ('montant_ht', 'Montant HT', 'number', false, 'Global', '["budget_engagements", "budget_liquidations"]'::jsonb, 'source'),
  ('statut', 'Statut du document', 'enum', true, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations", "ordonnancements", "reglements"]'::jsonb, 'cible'),
  ('date_creation', 'Date de création', 'datetime', true, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations"]'::jsonb, 'source'),
  ('date_validation', 'Date de validation', 'datetime', false, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations"]'::jsonb, 'cible'),
  ('numero', 'Numéro du document', 'string', true, 'Global', '["notes_dg", "budget_engagements", "budget_liquidations", "ordonnancements", "reglements"]'::jsonb, 'cible'),
  ('marche_id', 'Marché associé', 'fk', false, 'Marché', '["budget_engagements", "contrats"]'::jsonb, 'source'),
  ('engagement_id', 'Engagement associé', 'fk', true, 'Engagement', '["budget_liquidations"]'::jsonb, 'source'),
  ('liquidation_id', 'Liquidation associée', 'fk', true, 'Liquidation', '["ordonnancements"]'::jsonb, 'source'),
  ('ordonnancement_id', 'Ordonnancement associé', 'fk', true, 'Ordonnancement', '["reglements"]'::jsonb, 'source')
ON CONFLICT (code_variable) DO NOTHING;

-- Insérer les types de liens avec feature flags
INSERT INTO public.lambda_link_types (code, source_table, cible_table, libelle, description, default_mapping, actif, ordre) VALUES
  ('note_to_engagement', 'notes_dg', 'budget_engagements', 'Note → Engagement', 'Pré-remplir un engagement à partir d''une note validée', 
   '{"objet": "objet", "montant": "montant", "budget_line_id": "budget_line_id", "exercice": "exercice", "marche_id": "marche_id"}'::jsonb, true, 1),
  ('engagement_to_liquidation', 'budget_engagements', 'budget_liquidations', 'Engagement → Liquidation', 'Pré-remplir une liquidation à partir d''un engagement',
   '{"montant": "montant", "engagement_id": "id", "exercice": "exercice", "montant_ht": "montant_ht"}'::jsonb, true, 2),
  ('liquidation_to_ordonnancement', 'budget_liquidations', 'ordonnancements', 'Liquidation → Ordonnancement', 'Pré-remplir un ordonnancement à partir d''une liquidation',
   '{"montant": "net_a_payer", "liquidation_id": "id", "exercice": "exercice"}'::jsonb, false, 3),
  ('ordonnancement_to_reglement', 'ordonnancements', 'reglements', 'Ordonnancement → Règlement', 'Pré-remplir un règlement à partir d''un ordonnancement',
   '{"montant": "montant", "ordonnancement_id": "id", "exercice": "exercice"}'::jsonb, false, 4),
  ('marche_to_engagement', 'marches', 'budget_engagements', 'Marché → Engagement', 'Pré-remplir un engagement à partir d''un marché attribué',
   '{"objet": "objet", "montant": "montant_estime", "marche_id": "id", "exercice": "exercice"}'::jsonb, false, 5),
  ('expression_to_engagement', 'expressions_besoin', 'budget_engagements', 'Expression → Engagement', 'Pré-remplir un engagement à partir d''une expression de besoin validée',
   '{"objet": "objet", "montant": "montant_estime", "expression_besoin_id": "id", "exercice": "exercice", "marche_id": "marche_id"}'::jsonb, true, 6)
ON CONFLICT (code) DO UPDATE SET 
  default_mapping = EXCLUDED.default_mapping,
  libelle = EXCLUDED.libelle;

-- Fonction pour créer un lien lambda
CREATE OR REPLACE FUNCTION public.create_lambda_link(
  p_source_table TEXT,
  p_source_id UUID,
  p_cible_table TEXT,
  p_cible_id UUID DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL,
  p_mapping JSONB DEFAULT '{}'::jsonb,
  p_type_lien TEXT DEFAULT 'auto'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_link_type RECORD;
BEGIN
  -- Vérifier si le type de lien est actif
  SELECT * INTO v_link_type 
  FROM lambda_link_types 
  WHERE source_table = p_source_table AND cible_table = p_cible_table AND actif = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Type de lien % -> % non actif ou inexistant', p_source_table, p_cible_table;
    RETURN NULL;
  END IF;
  
  -- Fusionner le mapping par défaut avec le mapping fourni
  INSERT INTO lambda_links (
    exercice, source_table, source_id, cible_table, cible_id, 
    type_lien, mapping_json, statut_sync, created_by
  ) VALUES (
    COALESCE(p_exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    p_source_table, p_source_id, p_cible_table, p_cible_id,
    p_type_lien, 
    v_link_type.default_mapping || p_mapping,
    CASE WHEN p_cible_id IS NOT NULL THEN 'ok' ELSE 'a_sync' END,
    auth.uid()
  )
  RETURNING id INTO v_link_id;
  
  -- Log audit
  INSERT INTO audit_logs (entity_type, entity_id, action, user_id, new_values)
  VALUES ('lambda_link', v_link_id, 'CREATE_LINK', auth.uid(), 
    jsonb_build_object('source', p_source_table || ':' || p_source_id, 'cible', p_cible_table));
  
  RETURN v_link_id;
END;
$$;

-- Fonction pour synchroniser un lien
CREATE OR REPLACE FUNCTION public.sync_lambda_link(p_link_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link RECORD;
  v_source_exists BOOLEAN;
  v_cible_exists BOOLEAN;
BEGIN
  SELECT * INTO v_link FROM lambda_links WHERE id = p_link_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si la source existe encore
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', v_link.source_table)
    INTO v_source_exists USING v_link.source_id;
  
  IF NOT v_source_exists THEN
    UPDATE lambda_links SET 
      statut_sync = 'erreur', 
      erreur_detail = 'Source inexistante (ID: ' || v_link.source_id || ')',
      updated_at = now()
    WHERE id = p_link_id;
    RETURN FALSE;
  END IF;
  
  -- Vérifier si la cible existe (si définie)
  IF v_link.cible_id IS NOT NULL THEN
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', v_link.cible_table)
      INTO v_cible_exists USING v_link.cible_id;
    
    IF NOT v_cible_exists THEN
      UPDATE lambda_links SET 
        statut_sync = 'erreur', 
        erreur_detail = 'Cible inexistante (ID: ' || v_link.cible_id || ')',
        updated_at = now()
      WHERE id = p_link_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Tout est OK
  UPDATE lambda_links SET 
    statut_sync = 'ok', 
    erreur_detail = NULL,
    last_sync_at = now(),
    sync_count = sync_count + 1,
    updated_at = now()
  WHERE id = p_link_id;
  
  -- Log audit
  INSERT INTO audit_logs (entity_type, entity_id, action, user_id, new_values)
  VALUES ('lambda_link', p_link_id, 'SYNC_LINK', auth.uid(), jsonb_build_object('statut', 'ok'));
  
  RETURN TRUE;
END;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER set_ref_variables_updated_at
  BEFORE UPDATE ON public.ref_variables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_lambda_links_updated_at
  BEFORE UPDATE ON public.lambda_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_lambda_link_types_updated_at
  BEFORE UPDATE ON public.lambda_link_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
