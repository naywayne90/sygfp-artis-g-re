
-- ============================================================
-- SYSTÈME DE GÉNÉRATION DE RÉFÉRENCE ARTI UNIQUE ET ROBUSTE
-- Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4) = 13 chars
-- Ex: ARTI0012600001 (SEF, janvier 2026, premier doc)
-- ============================================================

-- 1. Table de compteurs atomiques par (etape, mois, année)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arti_reference_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etape INTEGER NOT NULL CHECK (etape >= 0 AND etape <= 9),
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2020 AND annee <= 2099),
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(etape, mois, annee)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_arti_counters_lookup 
ON arti_reference_counters(etape, mois, annee);

-- RLS
ALTER TABLE arti_reference_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arti_counters_select" ON arti_reference_counters;
CREATE POLICY "arti_counters_select" ON arti_reference_counters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "arti_counters_insert" ON arti_reference_counters;
CREATE POLICY "arti_counters_insert" ON arti_reference_counters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "arti_counters_update" ON arti_reference_counters;
CREATE POLICY "arti_counters_update" ON arti_reference_counters
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 2. Fonction centrale de génération de référence ARTI
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_arti_reference(
  p_etape INTEGER,
  p_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mois INTEGER;
  v_annee INTEGER;
  v_annee_court TEXT;
  v_mois_text TEXT;
  v_counter INTEGER;
  v_reference TEXT;
BEGIN
  -- Extraire mois et année de la date
  v_mois := EXTRACT(MONTH FROM p_date)::INTEGER;
  v_annee := EXTRACT(YEAR FROM p_date)::INTEGER;
  v_annee_court := LPAD((v_annee % 100)::TEXT, 2, '0');
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');
  
  -- Incrément atomique avec UPSERT (safe concurrence)
  INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, v_mois, v_annee, 1, now())
  ON CONFLICT (etape, mois, annee)
  DO UPDATE SET 
    dernier_numero = arti_reference_counters.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_counter;
  
  -- Construire la référence: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
  v_reference := 'ARTI' || p_etape::TEXT || v_mois_text || v_annee_court || LPAD(v_counter::TEXT, 4, '0');
  
  RETURN v_reference;
END;
$$;

-- 3. Fonction pour parser une référence ARTI existante
-- ============================================================
CREATE OR REPLACE FUNCTION public.parse_arti_reference(
  p_reference TEXT
)
RETURNS TABLE(
  etape INTEGER,
  mois INTEGER,
  annee INTEGER,
  numero INTEGER,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Vérifier format: ARTI + 1 + 2 + 2 + 4 = 13 caractères
  IF p_reference IS NULL OR LENGTH(p_reference) != 13 OR NOT p_reference ~ '^ARTI[0-9]{9}$' THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, FALSE;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT
    SUBSTRING(p_reference FROM 5 FOR 1)::INTEGER AS etape,
    SUBSTRING(p_reference FROM 6 FOR 2)::INTEGER AS mois,
    (2000 + SUBSTRING(p_reference FROM 8 FOR 2)::INTEGER)::INTEGER AS annee,
    SUBSTRING(p_reference FROM 10 FOR 4)::INTEGER AS numero,
    TRUE AS is_valid;
END;
$$;

-- 4. Trigger pour notes_sef (etape = 0)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_set_note_sef_arti_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference TEXT;
BEGIN
  -- Générer référence ARTI uniquement si numero est null ou vide
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_reference := generate_arti_reference(0, COALESCE(NEW.created_at, now()));
    NEW.numero := v_reference;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notes_sef_set_numero ON notes_sef;

-- Créer nouveau trigger
CREATE TRIGGER trg_notes_sef_set_arti_reference
  BEFORE INSERT ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_note_sef_arti_reference();

-- 5. Trigger pour notes_dg/AEF (etape = 1)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_set_note_aef_arti_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference TEXT;
BEGIN
  -- Générer référence ARTI uniquement si numero est null ou vide
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_reference := generate_arti_reference(1, COALESCE(NEW.created_at, now()));
    NEW.numero := v_reference;
    NEW.reference_pivot := v_reference;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notes_dg_set_numero ON notes_dg;

-- Créer nouveau trigger
CREATE TRIGGER trg_notes_dg_set_arti_reference
  BEFORE INSERT ON notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_note_aef_arti_reference();

-- 6. Index unique sur les références pour éviter doublons
-- ============================================================
-- Index unique sur notes_sef.numero
DROP INDEX IF EXISTS idx_notes_sef_numero_unique;
CREATE UNIQUE INDEX idx_notes_sef_numero_unique 
ON notes_sef(numero) 
WHERE numero IS NOT NULL AND numero != '';

-- Index unique sur notes_dg.numero
DROP INDEX IF EXISTS idx_notes_dg_numero_unique;
CREATE UNIQUE INDEX idx_notes_dg_numero_unique 
ON notes_dg(numero) 
WHERE numero IS NOT NULL AND numero != '';

-- 7. Contrainte de validation: pas de statut "valide" sans référence
-- ============================================================
-- Fonction de validation pour notes_sef
CREATE OR REPLACE FUNCTION public.check_sef_reference_before_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on passe en statut nécessitant une référence
  IF NEW.statut IN ('a_valider', 'valide', 'validee') AND (NEW.numero IS NULL OR NEW.numero = '') THEN
    RAISE EXCEPTION 'Une référence ARTI est obligatoire avant de passer au statut %', NEW.statut;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_sef_reference ON notes_sef;
CREATE TRIGGER trg_check_sef_reference
  BEFORE UPDATE ON notes_sef
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_sef_reference_before_validation();

-- Fonction de validation pour notes_dg (AEF)
CREATE OR REPLACE FUNCTION public.check_aef_reference_before_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on passe en statut nécessitant une référence
  IF NEW.statut IN ('a_valider', 'valide', 'validee', 'a_imputer') AND (NEW.numero IS NULL OR NEW.numero = '') THEN
    RAISE EXCEPTION 'Une référence ARTI est obligatoire avant de passer au statut %', NEW.statut;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_aef_reference ON notes_dg;
CREATE TRIGGER trg_check_aef_reference
  BEFORE UPDATE ON notes_dg
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION check_aef_reference_before_validation();

-- 8. Fonction de backfill pour références manquantes
-- ============================================================
CREATE OR REPLACE FUNCTION public.backfill_arti_references()
RETURNS TABLE(
  table_name TEXT,
  records_updated INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sef_count INTEGER := 0;
  v_aef_count INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Backfill notes_sef
  FOR v_rec IN 
    SELECT id, created_at 
    FROM notes_sef 
    WHERE numero IS NULL OR numero = '' OR numero !~ '^ARTI[0-9]{9}$'
    ORDER BY created_at
  LOOP
    UPDATE notes_sef 
    SET numero = generate_arti_reference(0, v_rec.created_at)
    WHERE id = v_rec.id;
    v_sef_count := v_sef_count + 1;
  END LOOP;
  
  -- Backfill notes_dg (AEF)
  FOR v_rec IN 
    SELECT id, created_at 
    FROM notes_dg 
    WHERE numero IS NULL OR numero = '' OR numero !~ '^ARTI[0-9]{9}$'
    ORDER BY created_at
  LOOP
    UPDATE notes_dg 
    SET 
      numero = generate_arti_reference(1, v_rec.created_at),
      reference_pivot = generate_arti_reference(1, v_rec.created_at)
    WHERE id = v_rec.id;
    v_aef_count := v_aef_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT 'notes_sef'::TEXT, v_sef_count;
  RETURN QUERY SELECT 'notes_dg'::TEXT, v_aef_count;
END;
$$;

-- 9. Fonction RPC pour synchroniser compteur après import
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_arti_counter_from_import(
  p_etape INTEGER,
  p_mois INTEGER,
  p_annee INTEGER,
  p_max_numero INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, p_mois, p_annee, p_max_numero, now())
  ON CONFLICT (etape, mois, annee)
  DO UPDATE SET 
    dernier_numero = GREATEST(arti_reference_counters.dernier_numero, p_max_numero),
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- 10. Commentaires pour documentation
-- ============================================================
COMMENT ON TABLE arti_reference_counters IS 'Compteurs atomiques pour génération de références ARTI par étape/mois/année';
COMMENT ON FUNCTION generate_arti_reference IS 'Génère une référence unique au format ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)';
COMMENT ON FUNCTION parse_arti_reference IS 'Parse une référence ARTI pour extraire ses composants';
COMMENT ON FUNCTION backfill_arti_references IS 'Remplit les références manquantes pour les notes existantes';
COMMENT ON FUNCTION sync_arti_counter_from_import IS 'Synchronise le compteur après un import pour éviter les doublons';
