-- ============================================
-- PROMPT 4: Système de codification avancé (FIX)
-- ============================================

-- 1) Table des variables de codification (si pas déjà créée)
CREATE TABLE IF NOT EXISTS public.codif_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  source_table TEXT,
  source_field TEXT,
  format_type TEXT NOT NULL DEFAULT 'string',
  pad_length INT DEFAULT 0,
  pad_char TEXT DEFAULT '0',
  pad_side TEXT DEFAULT 'left',
  default_value TEXT,
  transform TEXT,
  is_system BOOLEAN DEFAULT false,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index (ignore if exists)
CREATE INDEX IF NOT EXISTS idx_codif_variables_key ON public.codif_variables(key);

-- 2) RLS pour codif_variables
ALTER TABLE public.codif_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Lecture publique des variables de codification" ON public.codif_variables;
DROP POLICY IF EXISTS "Modification par admin/DAF" ON public.codif_variables;

CREATE POLICY "Lecture publique des variables de codification"
ON public.codif_variables FOR SELECT
USING (true);

CREATE POLICY "Modification par Admin"
ON public.codif_variables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND profil_fonctionnel = 'Admin'
  )
);

-- 3) Trigger pour updated_at (si fonction existe)
DROP TRIGGER IF EXISTS update_codif_variables_updated_at ON public.codif_variables;
CREATE TRIGGER update_codif_variables_updated_at
BEFORE UPDATE ON public.codif_variables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Insérer les variables système de base
INSERT INTO public.codif_variables (key, label, description, source_table, source_field, format_type, pad_length, pad_side, is_system) VALUES
('OS', 'Objectif Stratégique', 'Code de l''objectif stratégique', 'objectifs_strategiques', 'code', 'string', 2, 'left', true),
('MISSION', 'Mission', 'Code de la mission', 'missions', 'code', 'string', 2, 'left', true),
('ACTION', 'Action', 'Code de l''action', 'actions', 'code', 'string', 3, 'left', true),
('ACTIVITE', 'Activité', 'Code de l''activité', 'activites', 'code', 'string', 3, 'left', true),
('SOUS_ACTIVITE', 'Sous-Activité', 'Code de la sous-activité', 'sous_activites', 'code', 'string', 3, 'left', true),
('TACHE', 'Tâche', 'Code de la tâche', 'taches', 'code', 'string', 4, 'left', true),
('DIRECTION', 'Direction', 'Code de la direction', 'directions', 'code', 'string', 4, 'left', true),
('NBE', 'Nature Économique (NBE)', 'Code de la nomenclature NBE', 'nomenclature_nbe', 'code', 'string', 6, 'left', true),
('SYSCO', 'Compte SYSCO', 'Code du compte SYSCO', 'plan_comptable_sysco', 'code', 'string', 6, 'left', true),
('EXERCICE', 'Exercice', 'Année de l''exercice budgétaire', NULL, NULL, 'int', 4, 'left', true),
('ANNEE', 'Année', 'Année courante', NULL, NULL, 'int', 4, 'left', true),
('MOIS', 'Mois', 'Mois courant (01-12)', NULL, NULL, 'int', 2, 'left', true),
('SEQ', 'Séquence', 'Numéro séquentiel auto-incrémenté', NULL, NULL, 'int', 4, 'left', true),
('SEQ6', 'Séquence 6 digits', 'Numéro séquentiel 6 chiffres', NULL, NULL, 'int', 6, 'left', true),
('SOURCE_FIN', 'Source de Financement', 'Code source de financement', NULL, NULL, 'string', 2, 'left', true),
('TYPE_DEPENSE', 'Type de Dépense', 'Nature de la dépense', NULL, NULL, 'string', 2, 'left', true)
ON CONFLICT (key) DO NOTHING;

-- 5) Ajouter colonnes pattern à ref_codification_rules
ALTER TABLE public.ref_codification_rules 
ADD COLUMN IF NOT EXISTS pattern JSONB,
ADD COLUMN IF NOT EXISTS example_input JSONB,
ADD COLUMN IF NOT EXISTS example_output TEXT,
ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- 6) Mettre à jour la règle budget_structure avec un pattern
UPDATE public.ref_codification_rules
SET pattern = '[
  {"var_key": "OS", "length": 2, "required": true},
  {"var_key": "ACTIVITE", "length": 3, "required": true},
  {"var_key": "SOUS_ACTIVITE", "length": 3, "required": true},
  {"var_key": "NBE", "length": 6, "required": true},
  {"var_key": "EXERCICE", "length": 4, "required": true}
]'::jsonb,
module = 'budget_structure',
example_input = '{"OS": "01", "ACTIVITE": "101", "SOUS_ACTIVITE": "001", "NBE": "621100", "EXERCICE": "2026"}'::jsonb,
example_output = '0110100162110002026',
notes = 'Code imputation ARTI format 19 caractères'
WHERE objet = 'ligne_budgetaire' OR code_type = 'LIGNE_BUDGETAIRE';

-- 7) Fonction pour générer un code à partir d'un pattern
CREATE OR REPLACE FUNCTION public.generate_code_from_pattern(
  p_rule_id UUID,
  p_values JSONB,
  p_exercice INT DEFAULT NULL
)
RETURNS TABLE(
  code TEXT,
  is_valid BOOLEAN,
  warnings TEXT[]
) AS $$
DECLARE
  v_rule RECORD;
  v_pattern JSONB;
  v_segment JSONB;
  v_var RECORD;
  v_code TEXT := '';
  v_value TEXT;
  v_warnings TEXT[] := '{}';
  v_is_valid BOOLEAN := true;
BEGIN
  SELECT * INTO v_rule FROM public.ref_codification_rules WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, false, ARRAY['Règle non trouvée']::TEXT[];
    RETURN;
  END IF;
  
  v_pattern := COALESCE(v_rule.pattern, '[]'::jsonb);
  
  FOR v_segment IN SELECT * FROM jsonb_array_elements(v_pattern)
  LOOP
    SELECT * INTO v_var FROM public.codif_variables 
    WHERE key = v_segment->>'var_key' AND est_active = true;
    
    v_value := p_values->>v_segment->>'var_key';
    
    IF v_value IS NULL OR v_value = '' THEN
      IF v_segment->>'var_key' = 'EXERCICE' THEN
        v_value := COALESCE(p_exercice, EXTRACT(YEAR FROM CURRENT_DATE))::TEXT;
      ELSIF v_segment->>'var_key' = 'ANNEE' THEN
        v_value := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
      ELSIF v_segment->>'var_key' = 'MOIS' THEN
        v_value := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
      ELSIF (v_segment->>'required')::boolean = true THEN
        v_warnings := array_append(v_warnings, 'Segment manquant: ' || v_segment->>'var_key');
        v_is_valid := false;
        v_value := REPEAT('0', COALESCE((v_segment->>'length')::int, COALESCE(v_var.pad_length, 2)));
      ELSE
        v_value := COALESCE(v_var.default_value, '');
      END IF;
    END IF;
    
    IF v_var.id IS NOT NULL AND v_var.pad_length > 0 THEN
      IF v_var.pad_side = 'left' THEN
        v_value := LPAD(v_value, v_var.pad_length, COALESCE(v_var.pad_char, '0'));
      ELSE
        v_value := RPAD(v_value, v_var.pad_length, COALESCE(v_var.pad_char, '0'));
      END IF;
    ELSIF (v_segment->>'length')::int > 0 THEN
      v_value := LPAD(v_value, (v_segment->>'length')::int, '0');
    END IF;
    
    v_code := v_code || v_value;
    
    IF v_segment->>'separator_after' IS NOT NULL AND v_segment->>'separator_after' != '' THEN
      v_code := v_code || (v_segment->>'separator_after');
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_code, v_is_valid, v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8) Fonction pour tester un pattern
CREATE OR REPLACE FUNCTION public.test_codification_pattern(
  p_pattern JSONB,
  p_values JSONB,
  p_exercice INT DEFAULT NULL
)
RETURNS TABLE(
  code TEXT,
  is_valid BOOLEAN,
  segments JSONB
) AS $$
DECLARE
  v_segment JSONB;
  v_var RECORD;
  v_code TEXT := '';
  v_value TEXT;
  v_is_valid BOOLEAN := true;
  v_segments JSONB := '[]'::jsonb;
  v_segment_result JSONB;
BEGIN
  FOR v_segment IN SELECT * FROM jsonb_array_elements(p_pattern)
  LOOP
    SELECT * INTO v_var FROM public.codif_variables 
    WHERE key = v_segment->>'var_key' AND est_active = true;
    
    v_value := p_values->>v_segment->>'var_key';
    
    IF v_value IS NULL OR v_value = '' THEN
      IF v_segment->>'var_key' = 'EXERCICE' THEN
        v_value := COALESCE(p_exercice, EXTRACT(YEAR FROM CURRENT_DATE))::TEXT;
      ELSIF v_segment->>'var_key' = 'ANNEE' THEN
        v_value := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
      ELSIF v_segment->>'var_key' = 'MOIS' THEN
        v_value := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
      ELSIF (v_segment->>'required')::boolean = true THEN
        v_is_valid := false;
        v_value := '';
      END IF;
    END IF;
    
    IF v_var.id IS NOT NULL AND v_var.pad_length > 0 THEN
      v_value := LPAD(v_value, v_var.pad_length, COALESCE(v_var.pad_char, '0'));
    ELSIF (v_segment->>'length')::int > 0 AND v_value != '' THEN
      v_value := LPAD(v_value, (v_segment->>'length')::int, '0');
    END IF;
    
    v_segment_result := jsonb_build_object(
      'var_key', v_segment->>'var_key',
      'input', p_values->>v_segment->>'var_key',
      'output', v_value,
      'length', length(v_value),
      'required', COALESCE((v_segment->>'required')::boolean, false),
      'valid', v_value != '' OR NOT COALESCE((v_segment->>'required')::boolean, false)
    );
    
    v_segments := v_segments || v_segment_result;
    v_code := v_code || v_value;
    
    IF v_segment->>'separator_after' IS NOT NULL THEN
      v_code := v_code || (v_segment->>'separator_after');
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_code, v_is_valid, v_segments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;