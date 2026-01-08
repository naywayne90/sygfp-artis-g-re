-- Table des compteurs de séquence
CREATE TABLE IF NOT EXISTS public.sequence_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  doc_type TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'direction')),
  direction_code TEXT,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix_override TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT sequence_counters_unique UNIQUE (exercice, doc_type, scope, direction_code)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sequence_counters_lookup 
ON public.sequence_counters (exercice, doc_type, scope, direction_code);

-- Enable RLS
ALTER TABLE public.sequence_counters ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read sequence_counters"
ON public.sequence_counters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sequence_counters"
ON public.sequence_counters FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sequence_counters"
ON public.sequence_counters FOR UPDATE
TO authenticated
USING (true);

-- Fonction atomique pour obtenir le prochain numéro de séquence
CREATE OR REPLACE FUNCTION public.get_next_sequence(
  p_doc_type TEXT,
  p_exercice INTEGER,
  p_direction_code TEXT DEFAULT NULL,
  p_scope TEXT DEFAULT 'global'
)
RETURNS TABLE (
  prefix TEXT,
  year INTEGER,
  number_raw INTEGER,
  number_padded TEXT,
  full_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number INTEGER;
  v_prefix TEXT;
  v_effective_direction TEXT;
BEGIN
  -- Normaliser le scope et direction
  v_effective_direction := CASE 
    WHEN p_scope = 'direction' AND p_direction_code IS NOT NULL THEN p_direction_code
    ELSE NULL
  END;
  
  -- Préfixe par défaut basé sur doc_type
  v_prefix := UPPER(p_doc_type);
  
  -- Insertion ou mise à jour atomique avec verrouillage
  INSERT INTO public.sequence_counters (exercice, doc_type, scope, direction_code, last_number)
  VALUES (p_exercice, p_doc_type, p_scope, v_effective_direction, 1)
  ON CONFLICT (exercice, doc_type, scope, direction_code)
  DO UPDATE SET 
    last_number = sequence_counters.last_number + 1,
    updated_at = now()
  RETURNING sequence_counters.last_number, COALESCE(sequence_counters.prefix_override, v_prefix)
  INTO v_next_number, v_prefix;
  
  RETURN QUERY SELECT
    v_prefix,
    p_exercice,
    v_next_number,
    LPAD(v_next_number::TEXT, 4, '0'),
    v_prefix || '-' || p_exercice::TEXT || '-' || LPAD(v_next_number::TEXT, 4, '0');
END;
$$;

-- Fonction pour mettre à jour le compteur si import avec numéro plus grand
CREATE OR REPLACE FUNCTION public.sync_sequence_counter(
  p_doc_type TEXT,
  p_exercice INTEGER,
  p_imported_number INTEGER,
  p_direction_code TEXT DEFAULT NULL,
  p_scope TEXT DEFAULT 'global'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_direction TEXT;
BEGIN
  v_effective_direction := CASE 
    WHEN p_scope = 'direction' AND p_direction_code IS NOT NULL THEN p_direction_code
    ELSE NULL
  END;
  
  -- Mettre à jour seulement si le numéro importé est plus grand
  INSERT INTO public.sequence_counters (exercice, doc_type, scope, direction_code, last_number)
  VALUES (p_exercice, p_doc_type, p_scope, v_effective_direction, p_imported_number)
  ON CONFLICT (exercice, doc_type, scope, direction_code)
  DO UPDATE SET 
    last_number = GREATEST(sequence_counters.last_number, p_imported_number),
    updated_at = now()
  WHERE sequence_counters.last_number < p_imported_number;
  
  RETURN TRUE;
END;
$$;

-- Fonction pour parser un code existant et extraire le numéro
CREATE OR REPLACE FUNCTION public.parse_sequence_code(p_code TEXT)
RETURNS TABLE (
  prefix TEXT,
  year INTEGER,
  number_raw INTEGER
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_parts TEXT[];
BEGIN
  -- Format attendu: PREFIX-YYYY-NNNN
  v_parts := string_to_array(p_code, '-');
  
  IF array_length(v_parts, 1) >= 3 THEN
    RETURN QUERY SELECT
      v_parts[1],
      v_parts[2]::INTEGER,
      v_parts[3]::INTEGER;
  ELSE
    RETURN QUERY SELECT NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
END;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_sequence_counters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sequence_counters_updated_at ON public.sequence_counters;
CREATE TRIGGER trigger_sequence_counters_updated_at
  BEFORE UPDATE ON public.sequence_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sequence_counters_updated_at();