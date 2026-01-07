-- Add new columns to budget_lines for V2 code generation
ALTER TABLE public.budget_lines 
  ADD COLUMN IF NOT EXISTS code_budgetaire_v2 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS code_version VARCHAR(5) DEFAULT 'V1',
  ADD COLUMN IF NOT EXISTS seq_code INTEGER DEFAULT 0;

-- Create index for uniqueness check
CREATE INDEX IF NOT EXISTS idx_budget_lines_code_budgetaire_v2 ON public.budget_lines(code_budgetaire_v2);

-- Insert the BUDGETAIRE codification rule
INSERT INTO public.ref_codification_rules (
  code_type, 
  format, 
  separateur, 
  ordre_composants, 
  longueur_seq, 
  prefixe, 
  exemple, 
  actif
) VALUES (
  'BUDGETAIRE',
  '{ANNEE}{SEP}{DIRECTION}{SEP}{MISSION}{SEP}{ACTION}{SEP}{ACTIVITE}{SEP}{NVE}{SEP}{SEQ}',
  '-',
  '["ANNEE", "DIRECTION", "MISSION", "ACTION", "ACTIVITE", "NVE", "SEQ"]'::jsonb,
  4,
  '',
  '2026-DSI-M01-A02-AC03-NVE615-0007',
  true
) ON CONFLICT DO NOTHING;

-- Table for sequence counters per exercice+direction
CREATE TABLE IF NOT EXISTS public.budget_code_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  direction_id UUID REFERENCES public.directions(id),
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercice, direction_id)
);

-- Enable RLS
ALTER TABLE public.budget_code_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "budget_code_sequences_read_all" ON public.budget_code_sequences 
  FOR SELECT USING (true);

CREATE POLICY "budget_code_sequences_admin_write" ON public.budget_code_sequences 
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Function to get next sequence number for budget code
CREATE OR REPLACE FUNCTION public.get_next_budget_code_seq(
  p_exercice INTEGER,
  p_direction_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO public.budget_code_sequences (exercice, direction_id, dernier_numero)
  VALUES (p_exercice, p_direction_id, 1)
  ON CONFLICT (exercice, direction_id) 
  DO UPDATE SET 
    dernier_numero = budget_code_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_seq;
  
  RETURN v_seq;
END;
$function$;

-- Function to generate budget code V2
CREATE OR REPLACE FUNCTION public.generate_budget_code_v2(
  p_exercice INTEGER,
  p_direction_code TEXT,
  p_mission_code TEXT,
  p_action_code TEXT,
  p_activite_code TEXT,
  p_nve_code TEXT,
  p_direction_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_rule RECORD;
  v_code TEXT := '';
  v_sep TEXT;
  v_seq INTEGER;
  v_components JSONB;
  v_component TEXT;
  v_seq_padded TEXT;
BEGIN
  -- Get active codification rule
  SELECT * INTO v_rule 
  FROM public.ref_codification_rules 
  WHERE code_type = 'BUDGETAIRE' AND actif = true 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Default format if no rule exists
    v_sep := '-';
    v_seq := public.get_next_budget_code_seq(p_exercice, p_direction_id);
    v_seq_padded := LPAD(v_seq::TEXT, 4, '0');
    RETURN p_exercice::TEXT || v_sep || 
           COALESCE(NULLIF(p_direction_code, ''), 'DIR') || v_sep ||
           COALESCE(NULLIF(p_mission_code, ''), 'M00') || v_sep ||
           COALESCE(NULLIF(p_action_code, ''), 'A00') || v_sep ||
           COALESCE(NULLIF(p_activite_code, ''), 'AC00') || v_sep ||
           COALESCE(NULLIF(p_nve_code, ''), 'NVE000') || v_sep ||
           v_seq_padded;
  END IF;
  
  v_sep := COALESCE(v_rule.separateur, '-');
  v_components := COALESCE(v_rule.ordre_composants, '["ANNEE", "DIRECTION", "MISSION", "ACTION", "ACTIVITE", "NVE", "SEQ"]'::jsonb);
  
  -- Get sequence number
  v_seq := public.get_next_budget_code_seq(p_exercice, p_direction_id);
  v_seq_padded := LPAD(v_seq::TEXT, COALESCE(v_rule.longueur_seq, 4), '0');
  
  -- Build code based on component order
  FOR i IN 0..jsonb_array_length(v_components) - 1 LOOP
    v_component := v_components->>i;
    
    IF v_code != '' AND v_component != 'SEQ' THEN
      v_code := v_code || v_sep;
    ELSIF v_code != '' AND v_component = 'SEQ' THEN
      v_code := v_code || v_sep;
    END IF;
    
    CASE v_component
      WHEN 'ANNEE' THEN
        v_code := v_code || p_exercice::TEXT;
      WHEN 'DIRECTION' THEN
        v_code := v_code || COALESCE(NULLIF(UPPER(LEFT(p_direction_code, 5)), ''), 'DIR');
      WHEN 'MISSION' THEN
        v_code := v_code || COALESCE(NULLIF(UPPER(p_mission_code), ''), 'M00');
      WHEN 'ACTION' THEN
        v_code := v_code || COALESCE(NULLIF(UPPER(p_action_code), ''), 'A00');
      WHEN 'ACTIVITE' THEN
        v_code := v_code || COALESCE(NULLIF(UPPER(p_activite_code), ''), 'AC00');
      WHEN 'NVE' THEN
        v_code := v_code || COALESCE(NULLIF(p_nve_code, ''), 'NVE000');
      WHEN 'SEQ' THEN
        v_code := v_code || v_seq_padded;
      ELSE
        -- Unknown component, skip
        NULL;
    END CASE;
  END LOOP;
  
  RETURN v_code;
END;
$function$;

-- Function to regenerate V2 codes for selected lines
CREATE OR REPLACE FUNCTION public.regenerate_budget_codes_v2(p_line_ids UUID[])
RETURNS TABLE(line_id UUID, old_code TEXT, new_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_line RECORD;
  v_new_code TEXT;
  v_direction_code TEXT;
  v_mission_code TEXT;
  v_action_code TEXT;
  v_activite_code TEXT;
  v_nve_code TEXT;
BEGIN
  FOR v_line IN 
    SELECT bl.*, 
           d.code as dir_code,
           m.code as mis_code,
           a.code as act_code,
           ac.code as activ_code,
           n.code_nve
    FROM public.budget_lines bl
    LEFT JOIN public.directions d ON d.id = bl.direction_id
    LEFT JOIN public.missions m ON m.id = bl.mission_id
    LEFT JOIN public.actions a ON a.id = bl.action_id
    LEFT JOIN public.activites ac ON ac.id = bl.activite_id
    LEFT JOIN public.ref_nve n ON n.id = bl.nve_id
    WHERE bl.id = ANY(p_line_ids)
      AND (bl.code_version IS NULL OR bl.code_version = 'V2' OR bl.code_budgetaire_v2 IS NULL)
  LOOP
    v_new_code := public.generate_budget_code_v2(
      v_line.exercice,
      COALESCE(v_line.dir_code, ''),
      COALESCE(v_line.mis_code, ''),
      COALESCE(v_line.act_code, ''),
      COALESCE(v_line.activ_code, ''),
      COALESCE(v_line.code_nve, ''),
      v_line.direction_id
    );
    
    -- Update the line
    UPDATE public.budget_lines
    SET code_budgetaire_v2 = v_new_code,
        code_version = 'V2',
        seq_code = (SELECT dernier_numero FROM public.budget_code_sequences 
                    WHERE exercice = v_line.exercice 
                    AND direction_id = v_line.direction_id)
    WHERE id = v_line.id;
    
    -- Log to audit
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, new_values)
    VALUES (
      'budget_line',
      v_line.id,
      'REGENERATE_CODE_V2',
      jsonb_build_object('code_budgetaire_v2', v_line.code_budgetaire_v2),
      jsonb_build_object('code_budgetaire_v2', v_new_code)
    );
    
    -- Return result
    line_id := v_line.id;
    old_code := v_line.code_budgetaire_v2;
    new_code := v_new_code;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$function$;