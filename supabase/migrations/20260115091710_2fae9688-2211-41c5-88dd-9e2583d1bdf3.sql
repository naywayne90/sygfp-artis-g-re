
-- ============================================================
-- PROMPT 3/10: Numérotation automatique "reference_pivot" ARTI0126xxxx
-- Format: ARTI + MM + AA + 6 digits compteur (ex: ARTI0126000001)
-- Compteur réinitialisé par exercice/année
-- ============================================================

-- 1) Supprimer d'abord la contrainte existante (pour recréer l'index)
ALTER TABLE public.notes_sef DROP CONSTRAINT IF EXISTS notes_sef_reference_pivot_unique;

-- 2) Créer la fonction de génération de reference_pivot
-- Format: ARTI + MOIS (2 digits) + ANNEE (2 digits courts) + COMPTEUR (6 digits)
CREATE OR REPLACE FUNCTION public.generate_note_sef_reference_pivot(p_exercice INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_annee INTEGER;
  v_mois INTEGER;
  v_annee_court TEXT;
  v_mois_text TEXT;
  v_numero INTEGER;
  v_result TEXT;
BEGIN
  -- Utiliser l'exercice fourni ou l'année courante
  v_annee := COALESCE(p_exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_mois := EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Format court de l'année (ex: 2026 -> 26)
  v_annee_court := RIGHT(v_annee::TEXT, 2);
  -- Mois sur 2 chiffres
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');
  
  -- Utiliser la table notes_sef_sequences pour atomicité
  -- Le compteur est par année (exercice), pas par mois
  INSERT INTO public.notes_sef_sequences (annee, dernier_numero, updated_at)
  VALUES (v_annee, 1, now())
  ON CONFLICT (annee) 
  DO UPDATE SET 
    dernier_numero = notes_sef_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;
  
  -- Construire la référence: ARTI + MM + AA + 6 digits
  v_result := 'ARTI' || v_mois_text || v_annee_court || LPAD(v_numero::TEXT, 6, '0');
  
  RETURN v_result;
END;
$$;

-- 3) Créer le trigger pour générer automatiquement reference_pivot
CREATE OR REPLACE FUNCTION public.trigger_set_note_sef_reference_pivot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Générer reference_pivot si non fourni
  IF NEW.reference_pivot IS NULL OR NEW.reference_pivot = '' THEN
    NEW.reference_pivot := public.generate_note_sef_reference_pivot(NEW.exercice);
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Supprimer les anciens triggers s'ils existent et créer le nouveau
DROP TRIGGER IF EXISTS tr_generate_note_sef_reference ON public.notes_sef;
DROP TRIGGER IF EXISTS tr_generate_note_sef_reference_pivot ON public.notes_sef;

CREATE TRIGGER tr_generate_note_sef_reference_pivot
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_sef_reference_pivot();

-- 5) Backfill: générer reference_pivot pour les notes existantes sans référence
DO $$
DECLARE
  r RECORD;
  v_new_ref TEXT;
BEGIN
  FOR r IN 
    SELECT id, exercice 
    FROM public.notes_sef 
    WHERE reference_pivot IS NULL OR reference_pivot = ''
    ORDER BY created_at ASC
  LOOP
    v_new_ref := public.generate_note_sef_reference_pivot(r.exercice);
    UPDATE public.notes_sef SET reference_pivot = v_new_ref WHERE id = r.id;
  END LOOP;
END;
$$;

-- 6) Recréer l'index unique sur reference_pivot
DROP INDEX IF EXISTS public.notes_sef_reference_pivot_unique;
CREATE UNIQUE INDEX notes_sef_reference_pivot_unique 
  ON public.notes_sef (reference_pivot) 
  WHERE reference_pivot IS NOT NULL;

-- 7) Documentation
COMMENT ON FUNCTION public.generate_note_sef_reference_pivot(INTEGER) IS 
'Génère une référence pivot unique pour les Notes SEF au format ARTIMMAAxxxxxx. 
Le compteur est atomique (via notes_sef_sequences) et réinitialisé par exercice. 
Format: ARTI + MM (mois courant) + AA (année courte) + 6 digits compteur.
Exemple: ARTI0126000001 = Janvier 2026, 1ère note.';
