-- ================================================================
-- GÉNÉRATION RÉFÉRENCE PIVOT NOTES SEF
-- Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
-- Exemple: ARTI001260001 = Étape 0, Janvier 2026, Compteur 0001
-- ================================================================

-- 1. Table des compteurs de référence (générique, réutilisable)
CREATE TABLE IF NOT EXISTS public.reference_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etape text NOT NULL,           -- "0" pour SEF, "1" pour AEF, etc.
  mm text NOT NULL,              -- "01".."12"
  yy text NOT NULL,              -- "00".."99"  
  last_value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reference_counters_unique UNIQUE (etape, mm, yy),
  CONSTRAINT reference_counters_mm_check CHECK (mm ~ '^(0[1-9]|1[0-2])$'),
  CONSTRAINT reference_counters_yy_check CHECK (yy ~ '^[0-9]{2}$'),
  CONSTRAINT reference_counters_last_value_check CHECK (last_value >= 0 AND last_value <= 9999)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_reference_counters_lookup 
ON public.reference_counters(etape, mm, yy);

-- RLS
ALTER TABLE public.reference_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reference_counters_select" ON public.reference_counters
FOR SELECT USING (true);

CREATE POLICY "reference_counters_manage" ON public.reference_counters
FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. Fonction transactionnelle de génération de référence
-- Utilise INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING pour atomicité
CREATE OR REPLACE FUNCTION public.generate_reference(
  p_etape text,
  p_date_ref timestamptz DEFAULT now()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mm text;
  v_yy text;
  v_new_value integer;
  v_reference text;
BEGIN
  -- Extraire mois et année de la date de référence
  v_mm := to_char(p_date_ref, 'MM');
  v_yy := to_char(p_date_ref, 'YY');
  
  -- UPSERT atomique avec verrouillage implicite
  INSERT INTO public.reference_counters (etape, mm, yy, last_value, updated_at)
  VALUES (p_etape, v_mm, v_yy, 1, now())
  ON CONFLICT (etape, mm, yy) 
  DO UPDATE SET 
    last_value = reference_counters.last_value + 1,
    updated_at = now()
  RETURNING last_value INTO v_new_value;
  
  -- Vérifier que le compteur n'a pas dépassé 9999
  IF v_new_value > 9999 THEN
    RAISE EXCEPTION 'Compteur de référence épuisé pour etape=%, mm=%, yy=%', p_etape, v_mm, v_yy;
  END IF;
  
  -- Construire la référence: ARTI + etape(1) + mm(2) + yy(2) + nnnn(4)
  v_reference := 'ARTI' || p_etape || v_mm || v_yy || lpad(v_new_value::text, 4, '0');
  
  RETURN v_reference;
END;
$$;

-- 3. Fonction spécifique pour Notes SEF (étape = 0)
CREATE OR REPLACE FUNCTION public.generate_sef_reference(
  p_date_ref timestamptz DEFAULT now()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.generate_reference('0', p_date_ref);
END;
$$;

-- 4. Index unique sur reference_pivot (si pas déjà existant avec ce nom exact)
-- L'index notes_sef_reference_pivot_unique existe déjà, on le garde

-- 5. Trigger pour auto-générer la référence lors de la soumission
CREATE OR REPLACE FUNCTION public.auto_generate_sef_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer la référence uniquement si:
  -- 1. Le statut passe à 'soumis' (ou 'a_valider')
  -- 2. La référence n'existe pas encore
  IF (NEW.statut IN ('soumis', 'a_valider')) 
     AND (OLD.statut = 'brouillon' OR OLD.statut IS NULL)
     AND (NEW.reference_pivot IS NULL OR NEW.reference_pivot = '') THEN
    
    -- Générer la nouvelle référence
    NEW.reference_pivot := public.generate_sef_reference(COALESCE(NEW.submitted_at, now()));
    
    -- Log dans l'historique (sera fait par le trigger existant ou manuellement)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_auto_generate_sef_reference ON public.notes_sef;

-- Créer le trigger BEFORE UPDATE pour intercepter la soumission
CREATE TRIGGER trigger_auto_generate_sef_reference
BEFORE UPDATE ON public.notes_sef
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_sef_reference();

-- 6. Commentaires de documentation
COMMENT ON TABLE public.reference_counters IS 
'Compteurs séquentiels pour génération de références.
Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
Chaque combinaison (etape, mm, yy) a son propre compteur.
Exemple: etape=0, mm=01, yy=26 -> ARTI001260001, ARTI001260002, ...';

COMMENT ON FUNCTION public.generate_reference IS 
'Génère une référence unique atomique au format ARTI + ETAPE + MMYY + NNNN.
Utilise INSERT ON CONFLICT pour garantir l''unicité sous concurrence.
p_etape: "0" pour SEF, "1" pour AEF, etc.
p_date_ref: date de référence pour extraire MM et YY.';

COMMENT ON FUNCTION public.generate_sef_reference IS 
'Wrapper pour generate_reference avec etape="0" (Notes SEF).';

COMMENT ON FUNCTION public.auto_generate_sef_reference IS 
'Trigger qui génère automatiquement la référence pivot lors du passage brouillon -> soumis.';