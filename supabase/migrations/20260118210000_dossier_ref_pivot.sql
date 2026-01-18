-- ============================================================
-- MIGRATION: RÉFÉRENCE PIVOT DOSSIER IMMUABLE
-- Prompt 05/25 - Génération dossier_ref sans collision
-- Format: ARTI + MM(2) + YY(2) + NNNNNN(6) = 14 chars
-- Ex: ARTI0126000001 (janvier 2026, premier dossier)
-- ============================================================

-- ============================================================
-- 1. TABLE DE COMPTEURS POUR DOSSIER_REF (par mois+année)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dossier_ref_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2020 AND annee <= 2099),
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mois, annee)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_dossier_ref_counters_lookup
ON dossier_ref_counters(mois, annee);

-- RLS
ALTER TABLE dossier_ref_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dossier_ref_counters_select" ON dossier_ref_counters;
CREATE POLICY "dossier_ref_counters_select" ON dossier_ref_counters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "dossier_ref_counters_all" ON dossier_ref_counters;
CREATE POLICY "dossier_ref_counters_all" ON dossier_ref_counters
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. FONCTION CENTRALE DE GÉNÉRATION DOSSIER_REF
-- Utilise INSERT ... ON CONFLICT pour atomicité (pas de collision)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_dossier_ref(
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

  -- Incrément atomique avec UPSERT (garantit zéro collision)
  -- Utilise un advisory lock pour garantir la séquentialité stricte
  PERFORM pg_advisory_xact_lock(
    hashtext('dossier_ref_counter'),
    (v_mois * 10000 + v_annee)::INTEGER
  );

  INSERT INTO dossier_ref_counters (mois, annee, dernier_numero, updated_at)
  VALUES (v_mois, v_annee, 1, now())
  ON CONFLICT (mois, annee)
  DO UPDATE SET
    dernier_numero = dossier_ref_counters.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_counter;

  -- Construire la référence: ARTI + MM(2) + YY(2) + NNNNNN(6)
  -- Format final: 14 caractères (ex: ARTI0126000001)
  v_reference := 'ARTI' || v_mois_text || v_annee_court || LPAD(v_counter::TEXT, 6, '0');

  RETURN v_reference;
END;
$$;

-- ============================================================
-- 3. FONCTION RPC POUR APPEL DEPUIS LE FRONTEND
-- Retourne une nouvelle référence unique immédiatement
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_dossier_ref()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN generate_dossier_ref(now());
END;
$$;

-- ============================================================
-- 4. FONCTION POUR PARSER UNE RÉFÉRENCE DOSSIER
-- ============================================================
CREATE OR REPLACE FUNCTION public.parse_dossier_ref(
  p_reference TEXT
)
RETURNS TABLE(
  mois INTEGER,
  annee INTEGER,
  numero INTEGER,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Vérifier format: ARTI + 2 + 2 + 6 = 14 caractères
  IF p_reference IS NULL OR LENGTH(p_reference) != 14 OR NOT p_reference ~ '^ARTI[0-9]{10}$' THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, FALSE;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    SUBSTRING(p_reference FROM 5 FOR 2)::INTEGER AS mois,
    (2000 + SUBSTRING(p_reference FROM 7 FOR 2)::INTEGER)::INTEGER AS annee,
    SUBSTRING(p_reference FROM 9 FOR 6)::INTEGER AS numero,
    TRUE AS is_valid;
END;
$$;

-- ============================================================
-- 5. AJOUTER COLONNE dossier_ref À notes_sef SI NÉCESSAIRE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notes_sef'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_notes_sef_dossier_ref ON notes_sef(dossier_ref);
    CREATE UNIQUE INDEX idx_notes_sef_dossier_ref_unique
      ON notes_sef(dossier_ref)
      WHERE dossier_ref IS NOT NULL AND dossier_ref != '';
  END IF;
END $$;

-- ============================================================
-- 6. TRIGGER POUR GÉNÉRER dossier_ref À LA CRÉATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_set_dossier_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer dossier_ref uniquement si null
  IF NEW.dossier_ref IS NULL OR NEW.dossier_ref = '' THEN
    NEW.dossier_ref := generate_dossier_ref(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur notes_sef
DROP TRIGGER IF EXISTS trg_notes_sef_set_dossier_ref ON notes_sef;
CREATE TRIGGER trg_notes_sef_set_dossier_ref
  BEFORE INSERT ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_dossier_ref();

-- ============================================================
-- 7. AJOUTER dossier_ref AUX AUTRES TABLES DE LA CHAÎNE
-- ============================================================

-- notes_dg (AEF)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notes_dg'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.notes_dg ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_notes_dg_dossier_ref ON notes_dg(dossier_ref);
  END IF;
END $$;

-- imputations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'imputations'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.imputations ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_imputations_dossier_ref ON imputations(dossier_ref);
  END IF;
END $$;

-- budget_engagements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'budget_engagements'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.budget_engagements ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_engagements_dossier_ref ON budget_engagements(dossier_ref);
  END IF;
END $$;

-- budget_liquidations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'budget_liquidations'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.budget_liquidations ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_liquidations_dossier_ref ON budget_liquidations(dossier_ref);
  END IF;
END $$;

-- ordonnancements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ordonnancements'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.ordonnancements ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_ordonnancements_dossier_ref ON ordonnancements(dossier_ref);
  END IF;
END $$;

-- reglements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'reglements'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.reglements ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_reglements_dossier_ref ON reglements(dossier_ref);
  END IF;
END $$;

-- marches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'marches'
    AND column_name = 'dossier_ref'
  ) THEN
    ALTER TABLE public.marches ADD COLUMN dossier_ref TEXT;
    CREATE INDEX idx_marches_dossier_ref ON marches(dossier_ref);
  END IF;
END $$;

-- ============================================================
-- 8. FONCTION DE BACKFILL POUR NOTES_SEF EXISTANTES
-- ============================================================
CREATE OR REPLACE FUNCTION public.backfill_dossier_refs()
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
  v_rec RECORD;
BEGIN
  -- Backfill notes_sef sans dossier_ref
  FOR v_rec IN
    SELECT id, created_at
    FROM notes_sef
    WHERE dossier_ref IS NULL OR dossier_ref = ''
    ORDER BY created_at
  LOOP
    UPDATE notes_sef
    SET dossier_ref = generate_dossier_ref(v_rec.created_at)
    WHERE id = v_rec.id;
    v_sef_count := v_sef_count + 1;
  END LOOP;

  RETURN QUERY SELECT 'notes_sef'::TEXT, v_sef_count;
END;
$$;

-- ============================================================
-- 9. FONCTION POUR SYNCHRONISER LE COMPTEUR APRÈS IMPORT
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_dossier_ref_counter(
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
  INSERT INTO dossier_ref_counters (mois, annee, dernier_numero, updated_at)
  VALUES (p_mois, p_annee, p_max_numero, now())
  ON CONFLICT (mois, annee)
  DO UPDATE SET
    dernier_numero = GREATEST(dossier_ref_counters.dernier_numero, p_max_numero),
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 10. COMMENTAIRES
-- ============================================================
COMMENT ON TABLE dossier_ref_counters IS 'Compteurs atomiques pour génération de références dossier ARTI par mois/année';
COMMENT ON FUNCTION generate_dossier_ref IS 'Génère une référence unique au format ARTI + MM(2) + YY(2) + NNNNNN(6) - 14 caractères';
COMMENT ON FUNCTION get_next_dossier_ref IS 'Fonction RPC pour obtenir la prochaine référence dossier depuis le frontend';
COMMENT ON FUNCTION parse_dossier_ref IS 'Parse une référence dossier pour extraire ses composants';
COMMENT ON FUNCTION backfill_dossier_refs IS 'Remplit les dossier_ref manquantes pour les notes existantes';
