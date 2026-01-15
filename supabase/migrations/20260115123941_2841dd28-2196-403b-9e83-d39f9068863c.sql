-- ============================================
-- Migration: Nouveau format référence pivot
-- Format: ARTI + step_code + MM + YY + NNNN
-- ============================================

-- 1. Supprimer l'ancienne table si elle existe avec un schéma incompatible
DROP TABLE IF EXISTS public.reference_sequences CASCADE;

-- 2. Créer la nouvelle table de séquences
CREATE TABLE public.reference_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_code TEXT NOT NULL,
  year_yy INTEGER NOT NULL CHECK (year_yy >= 0 AND year_yy <= 99),
  month_mm INTEGER NOT NULL CHECK (month_mm >= 1 AND month_mm <= 12),
  current_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reference_sequences_unique_key UNIQUE (step_code, year_yy, month_mm)
);

-- Index pour performance
CREATE INDEX idx_reference_sequences_lookup 
ON public.reference_sequences (step_code, year_yy, month_mm);

-- RLS
ALTER TABLE public.reference_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated read" ON public.reference_sequences
FOR SELECT TO authenticated USING (true);

-- Policy: insert/update via fonctions seulement (SECURITY DEFINER)
CREATE POLICY "Allow service insert" ON public.reference_sequences
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow service update" ON public.reference_sequences
FOR UPDATE TO authenticated USING (true);

-- 3. Fonction next_reference avec qualification complète
CREATE OR REPLACE FUNCTION public.next_reference(
  p_step_code TEXT,
  p_input_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_yy INTEGER;
  v_month_mm INTEGER;
  v_next_value INTEGER;
  v_reference TEXT;
BEGIN
  v_year_yy := EXTRACT(YEAR FROM p_input_date)::INTEGER % 100;
  v_month_mm := EXTRACT(MONTH FROM p_input_date)::INTEGER;

  INSERT INTO public.reference_sequences (step_code, year_yy, month_mm, current_value)
  VALUES (p_step_code, v_year_yy, v_month_mm, 1)
  ON CONFLICT ON CONSTRAINT reference_sequences_unique_key DO UPDATE
  SET 
    current_value = public.reference_sequences.current_value + 1,
    updated_at = now()
  RETURNING current_value INTO v_next_value;

  v_reference := 'ARTI' || 
                 p_step_code || 
                 LPAD(v_month_mm::TEXT, 2, '0') || 
                 LPAD(v_year_yy::TEXT, 2, '0') || 
                 LPAD(v_next_value::TEXT, 4, '0');

  RETURN v_reference;
END;
$$;

-- 4. Trigger function pour notes_sef
CREATE OR REPLACE FUNCTION public.generate_note_sef_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
BEGIN
  IF NEW.reference_pivot IS NULL THEN
    v_date := COALESCE(NEW.created_at::DATE, CURRENT_DATE);
    NEW.reference_pivot := public.next_reference('0', v_date);
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Remplacer le trigger existant
DROP TRIGGER IF EXISTS trigger_generate_note_sef_reference ON public.notes_sef;
DROP TRIGGER IF EXISTS generate_reference_pivot ON public.notes_sef;

CREATE TRIGGER trigger_generate_note_sef_reference
BEFORE INSERT ON public.notes_sef
FOR EACH ROW
EXECUTE FUNCTION public.generate_note_sef_reference();

-- 6. Commentaires
COMMENT ON TABLE public.reference_sequences IS 'Séquences pour génération de références uniques par (step_code, année, mois)';
COMMENT ON FUNCTION public.next_reference IS 'Génère la prochaine référence au format ARTI + step + MM + YY + NNNN';
COMMENT ON FUNCTION public.generate_note_sef_reference IS 'Trigger: génère automatiquement reference_pivot pour notes_sef';