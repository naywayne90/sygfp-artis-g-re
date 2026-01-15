
-- =============================================================
-- PROMPT 3/10: Référence pivot ARTI01YYNNNN pour Notes SEF
-- Format: ARTI + 01 (code module) + YY (année) + NNNN (compteur)
-- Exemple: ARTI01260001 pour la 1ère note de 2026
-- =============================================================

-- 1. Créer la table reference_sequences (générique pour tous modules)
CREATE TABLE IF NOT EXISTS public.reference_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT NOT NULL,
  exercise_year INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT reference_sequences_unique UNIQUE (module_code, exercise_year)
);

-- RLS pour reference_sequences
ALTER TABLE public.reference_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: lecture pour tous authentifiés
DROP POLICY IF EXISTS "reference_sequences_select" ON public.reference_sequences;
CREATE POLICY "reference_sequences_select" ON public.reference_sequences
  FOR SELECT TO authenticated USING (true);

-- Policy: insert/update via trigger
DROP POLICY IF EXISTS "reference_sequences_all" ON public.reference_sequences;
CREATE POLICY "reference_sequences_all" ON public.reference_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Fonction next_reference_note_sef avec verrouillage transactionnel
CREATE OR REPLACE FUNCTION public.next_reference_note_sef(p_exercise_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero INTEGER;
  v_year_short TEXT;
  v_result TEXT;
BEGIN
  -- Format YY (2 derniers chiffres de l'année)
  v_year_short := RIGHT(p_exercise_year::TEXT, 2);
  
  -- Insérer ou mettre à jour la séquence avec verrouillage
  INSERT INTO public.reference_sequences (module_code, exercise_year, current_value, updated_at)
  VALUES ('01', p_exercise_year, 1, now())
  ON CONFLICT (module_code, exercise_year) 
  DO UPDATE SET 
    current_value = reference_sequences.current_value + 1,
    updated_at = now()
  RETURNING current_value INTO v_numero;
  
  -- Format final: ARTI + 01 + YY + NNNN (4 chiffres)
  v_result := 'ARTI01' || v_year_short || LPAD(v_numero::TEXT, 4, '0');
  
  RETURN v_result;
END;
$$;

-- 3. Fonction trigger pour notes_sef
CREATE OR REPLACE FUNCTION public.trigger_set_note_sef_reference_pivot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ne génère que si reference_pivot est NULL ou vide
  IF NEW.reference_pivot IS NULL OR TRIM(NEW.reference_pivot) = '' THEN
    NEW.reference_pivot := public.next_reference_note_sef(NEW.exercice);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Supprimer ancien trigger s'il existe puis recréer
DROP TRIGGER IF EXISTS set_note_sef_reference_pivot ON public.notes_sef;

CREATE TRIGGER set_note_sef_reference_pivot
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_sef_reference_pivot();

-- 5. Index pour performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_notes_sef_reference_pivot 
ON public.notes_sef (reference_pivot);

CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_statut 
ON public.notes_sef (exercice, statut);

-- 6. Commentaires pour documentation
COMMENT ON TABLE public.reference_sequences IS 
'Table de séquences génériques pour la génération de références. Module 01 = Notes SEF.';

COMMENT ON FUNCTION public.next_reference_note_sef(INTEGER) IS 
'Génère la prochaine référence pivot pour Note SEF au format ARTI01YYNNNN. Verrouillage transactionnel garanti.';
