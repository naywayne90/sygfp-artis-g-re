-- ================================================================
-- Fonctions pour générer les numéros automatiques
-- ================================================================

-- Fonction pour générer le numéro AEF
CREATE OR REPLACE FUNCTION public.generate_note_aef_numero(p_exercice INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero INTEGER;
  v_result TEXT;
BEGIN
  INSERT INTO public.notes_aef_sequences (annee, dernier_numero, updated_at)
  VALUES (p_exercice, 1, now())
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = notes_aef_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  v_result := 'AEF-' || p_exercice::TEXT || '-' || LPAD(v_numero::TEXT, 6, '0');
  RETURN v_result;
END;
$$;

-- Fonction pour générer le numéro SEF
CREATE OR REPLACE FUNCTION public.generate_note_sef_numero(p_exercice INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero INTEGER;
  v_result TEXT;
BEGIN
  INSERT INTO public.notes_sef_sequences (annee, dernier_numero, updated_at)
  VALUES (p_exercice, 1, now())
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = notes_sef_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  v_result := 'SEF-' || p_exercice::TEXT || '-' || LPAD(v_numero::TEXT, 6, '0');
  RETURN v_result;
END;
$$;

-- Fonction pour générer le numéro d'imputation
CREATE OR REPLACE FUNCTION public.generate_imputation_numero(p_exercice INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero INTEGER;
  v_result TEXT;
BEGIN
  INSERT INTO public.imputation_sequences (annee, dernier_numero, updated_at)
  VALUES (p_exercice, 1, now())
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = imputation_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  v_result := 'IMP-' || p_exercice::TEXT || '-' || LPAD(v_numero::TEXT, 6, '0');
  RETURN v_result;
END;
$$;

-- ================================================================
-- Triggers pour numérotation automatique à la création
-- ================================================================

-- Trigger pour notes_dg (AEF)
CREATE OR REPLACE FUNCTION public.trigger_set_note_aef_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.generate_note_aef_numero(COALESCE(NEW.exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_note_aef_numero ON public.notes_dg;
CREATE TRIGGER trg_set_note_aef_numero
  BEFORE INSERT ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_aef_numero();

-- Trigger pour notes_sef
CREATE OR REPLACE FUNCTION public.trigger_set_note_sef_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.generate_note_sef_numero(COALESCE(NEW.exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_note_sef_numero ON public.notes_sef;
CREATE TRIGGER trg_set_note_sef_numero
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_sef_numero();