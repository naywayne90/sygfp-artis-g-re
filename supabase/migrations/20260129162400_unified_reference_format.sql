-- ============================================================================
-- MIGRATION: Systeme unifie de generation de references ARTI
-- Date: 29/01/2026
-- Auteur: TRESOR (Agent Backend SYGFP)
-- ============================================================================
--
-- FORMAT DE REFERENCE: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4) = 13 caracteres
-- Exemple: ARTI001260001 = Note SEF, janvier 2026, premiere note
--
-- MAPPING DES ETAPES:
--   0 = Note SEF (Accord de principe)
--   1 = Engagement budgetaire
--   2 = Liquidation
--   3 = Ordonnancement
--   4 = Reglement
--   5 = Note AEF (Autorisation d'Execution Financiere)
--   6 = Imputation budgetaire
--
-- IMPORTANT: Ne casse pas les references existantes
-- Les references avec ancien format restent valides
-- ============================================================================

-- 1. S'assurer que la table de compteurs existe avec la bonne structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.unified_reference_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etape INTEGER NOT NULL CHECK (etape >= 0 AND etape <= 9),
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2020 AND annee <= 2099),
  dernier_numero INTEGER NOT NULL DEFAULT 0 CHECK (dernier_numero >= 0 AND dernier_numero <= 9999),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unified_ref_counters_unique UNIQUE(etape, mois, annee)
);

-- Index pour performance des lookups
CREATE INDEX IF NOT EXISTS idx_unified_ref_counters_lookup
ON public.unified_reference_counters(etape, mois, annee);

-- RLS
ALTER TABLE public.unified_reference_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unified_ref_counters_select" ON public.unified_reference_counters;
CREATE POLICY "unified_ref_counters_select" ON public.unified_reference_counters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "unified_ref_counters_insert" ON public.unified_reference_counters;
CREATE POLICY "unified_ref_counters_insert" ON public.unified_reference_counters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "unified_ref_counters_update" ON public.unified_reference_counters;
CREATE POLICY "unified_ref_counters_update" ON public.unified_reference_counters
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 2. Fonction centrale de generation de reference ARTI unifiee
-- ============================================================================
-- Utilise UPSERT atomique pour garantir l'unicite sous concurrence
--
-- Parametres:
--   p_etape: Code de l'etape (0-9)
--   p_date: Date de reference pour extraire mois/annee (defaut: maintenant)
--
-- Retourne: Reference au format ARTI + ETAPE + MM + YY + NNNN
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_unified_reference(
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
  -- Validation de l'etape
  IF p_etape < 0 OR p_etape > 9 THEN
    RAISE EXCEPTION 'Code etape invalide: %. Doit etre entre 0 et 9.', p_etape;
  END IF;

  -- Extraire mois et annee de la date
  v_mois := EXTRACT(MONTH FROM p_date)::INTEGER;
  v_annee := EXTRACT(YEAR FROM p_date)::INTEGER;
  v_annee_court := LPAD((v_annee % 100)::TEXT, 2, '0');
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');

  -- Increment atomique avec UPSERT (safe en concurrence)
  INSERT INTO unified_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, v_mois, v_annee, 1, now())
  ON CONFLICT (etape, mois, annee)
  DO UPDATE SET
    dernier_numero = unified_reference_counters.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_counter;

  -- Verifier que le compteur n'a pas depasse 9999
  IF v_counter > 9999 THEN
    RAISE EXCEPTION 'Compteur de reference epuise pour etape=%, mois=%, annee=%', p_etape, v_mois, v_annee;
  END IF;

  -- Construire la reference: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
  v_reference := 'ARTI' || p_etape::TEXT || v_mois_text || v_annee_court || LPAD(v_counter::TEXT, 4, '0');

  RETURN v_reference;
END;
$$;

-- 3. Fonctions wrapper par type d'entite (pour clarte et facilite d'utilisation)
-- ============================================================================

-- 3.1 Note SEF (etape = 0)
CREATE OR REPLACE FUNCTION public.generate_reference_sef(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(0, p_date);
END;
$$;

-- 3.2 Engagement (etape = 1)
CREATE OR REPLACE FUNCTION public.generate_reference_engagement(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(1, p_date);
END;
$$;

-- 3.3 Liquidation (etape = 2)
CREATE OR REPLACE FUNCTION public.generate_reference_liquidation(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(2, p_date);
END;
$$;

-- 3.4 Ordonnancement (etape = 3)
CREATE OR REPLACE FUNCTION public.generate_reference_ordonnancement(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(3, p_date);
END;
$$;

-- 3.5 Reglement (etape = 4)
CREATE OR REPLACE FUNCTION public.generate_reference_reglement(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(4, p_date);
END;
$$;

-- 3.6 Note AEF (etape = 5)
CREATE OR REPLACE FUNCTION public.generate_reference_aef(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(5, p_date);
END;
$$;

-- 3.7 Imputation (etape = 6)
CREATE OR REPLACE FUNCTION public.generate_reference_imputation(p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN generate_unified_reference(6, p_date);
END;
$$;

-- 4. Fonction pour parser une reference ARTI
-- ============================================================================
CREATE OR REPLACE FUNCTION public.parse_unified_reference(p_reference TEXT)
RETURNS TABLE(
  etape INTEGER,
  mois INTEGER,
  annee INTEGER,
  numero INTEGER,
  etape_libelle TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_etape INTEGER;
BEGIN
  -- Verifier format: ARTI + 1 + 2 + 2 + 4 = 13 caracteres
  IF p_reference IS NULL OR LENGTH(p_reference) != 13 OR NOT p_reference ~ '^ARTI[0-9]{9}$' THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::TEXT, FALSE;
    RETURN;
  END IF;

  v_etape := SUBSTRING(p_reference FROM 5 FOR 1)::INTEGER;

  RETURN QUERY SELECT
    v_etape AS etape,
    SUBSTRING(p_reference FROM 6 FOR 2)::INTEGER AS mois,
    (2000 + SUBSTRING(p_reference FROM 8 FOR 2)::INTEGER)::INTEGER AS annee,
    SUBSTRING(p_reference FROM 10 FOR 4)::INTEGER AS numero,
    CASE v_etape
      WHEN 0 THEN 'Note SEF'
      WHEN 1 THEN 'Engagement'
      WHEN 2 THEN 'Liquidation'
      WHEN 3 THEN 'Ordonnancement'
      WHEN 4 THEN 'Reglement'
      WHEN 5 THEN 'Note AEF'
      WHEN 6 THEN 'Imputation'
      ELSE 'Inconnu'
    END AS etape_libelle,
    TRUE AS is_valid;
END;
$$;

-- 5. TRIGGERS pour generation automatique des references
-- ============================================================================

-- 5.1 Trigger pour Notes SEF (etape = 0)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_notes_sef()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero est null ou vide
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_reference_sef(COALESCE(NEW.created_at, now()));
  END IF;

  -- Propager vers reference_pivot si vide
  IF NEW.reference_pivot IS NULL OR NEW.reference_pivot = '' THEN
    NEW.reference_pivot := NEW.numero;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_notes_sef ON public.notes_sef;
CREATE TRIGGER trg_unified_ref_notes_sef
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_notes_sef();

-- 5.2 Trigger pour Notes AEF/DG (etape = 5)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_notes_dg()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero est null ou vide
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_reference_aef(COALESCE(NEW.created_at, now()));
    -- Propager vers reference_pivot
    NEW.reference_pivot := NEW.numero;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_notes_dg ON public.notes_dg;
CREATE TRIGGER trg_unified_ref_notes_dg
  BEFORE INSERT ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_notes_dg();

-- 5.3 Trigger pour Engagements (etape = 1)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_engagements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero n'est pas au format ARTI
  IF NEW.numero IS NULL OR NEW.numero = '' OR NEW.numero !~ '^ARTI[0-9]{9}$' THEN
    NEW.numero := generate_reference_engagement(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_engagements ON public.budget_engagements;
CREATE TRIGGER trg_unified_ref_engagements
  BEFORE INSERT ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_engagements();

-- 5.4 Trigger pour Liquidations (etape = 2)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_liquidations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero n'est pas au format ARTI
  IF NEW.numero IS NULL OR NEW.numero = '' OR NEW.numero !~ '^ARTI[0-9]{9}$' THEN
    NEW.numero := generate_reference_liquidation(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_liquidations ON public.budget_liquidations;
CREATE TRIGGER trg_unified_ref_liquidations
  BEFORE INSERT ON public.budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_liquidations();

-- 5.5 Trigger pour Ordonnancements (etape = 3)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_ordonnancements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero n'est pas au format ARTI
  IF NEW.numero IS NULL OR NEW.numero = '' OR NEW.numero !~ '^ARTI[0-9]{9}$' THEN
    NEW.numero := generate_reference_ordonnancement(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_ordonnancements ON public.ordonnancements;
CREATE TRIGGER trg_unified_ref_ordonnancements
  BEFORE INSERT ON public.ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_ordonnancements();

-- 5.6 Trigger pour Reglements (etape = 4)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_reglements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero n'est pas au format ARTI
  IF NEW.numero IS NULL OR NEW.numero = '' OR NEW.numero !~ '^ARTI[0-9]{9}$' THEN
    NEW.numero := generate_reference_reglement(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_reglements ON public.reglements;
CREATE TRIGGER trg_unified_ref_reglements
  BEFORE INSERT ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_reglements();

-- 5.7 Trigger pour Imputations (etape = 6)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_unified_ref_imputations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generer reference uniquement si numero n'est pas au format ARTI
  IF NEW.numero IS NULL OR NEW.numero = '' OR NEW.numero !~ '^ARTI[0-9]{9}$' THEN
    NEW.numero := generate_reference_imputation(COALESCE(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unified_ref_imputations ON public.imputations;
CREATE TRIGGER trg_unified_ref_imputations
  BEFORE INSERT ON public.imputations
  FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_imputations();

-- 6. Fonction de synchronisation des compteurs (apres import ou migration)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_unified_ref_counter(
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
  INSERT INTO unified_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, p_mois, p_annee, p_max_numero, now())
  ON CONFLICT (etape, mois, annee)
  DO UPDATE SET
    dernier_numero = GREATEST(unified_reference_counters.dernier_numero, p_max_numero),
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- 7. Vue pour visualiser l'etat des compteurs
-- ============================================================================
CREATE OR REPLACE VIEW public.v_reference_counters_status AS
SELECT
  etape,
  CASE etape
    WHEN 0 THEN 'Note SEF'
    WHEN 1 THEN 'Engagement'
    WHEN 2 THEN 'Liquidation'
    WHEN 3 THEN 'Ordonnancement'
    WHEN 4 THEN 'Reglement'
    WHEN 5 THEN 'Note AEF'
    WHEN 6 THEN 'Imputation'
    ELSE 'Inconnu'
  END AS etape_libelle,
  mois,
  annee,
  dernier_numero,
  'ARTI' || etape::TEXT || LPAD(mois::TEXT, 2, '0') || LPAD((annee % 100)::TEXT, 2, '0') || LPAD(dernier_numero::TEXT, 4, '0') AS derniere_reference,
  updated_at
FROM unified_reference_counters
ORDER BY annee DESC, mois DESC, etape;

-- 8. Migration des anciennes references (optionnel, a executer manuellement)
-- ============================================================================
-- Cette fonction migre les anciens compteurs vers le nouveau systeme
CREATE OR REPLACE FUNCTION public.migrate_old_reference_counters()
RETURNS TABLE(source_table TEXT, records_migrated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Migrer depuis arti_reference_counters (si existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'arti_reference_counters' AND table_schema = 'public') THEN
    FOR v_rec IN SELECT etape, mois, annee, dernier_numero FROM arti_reference_counters
    LOOP
      INSERT INTO unified_reference_counters (etape, mois, annee, dernier_numero, updated_at)
      VALUES (v_rec.etape, v_rec.mois, v_rec.annee, v_rec.dernier_numero, now())
      ON CONFLICT (etape, mois, annee)
      DO UPDATE SET
        dernier_numero = GREATEST(unified_reference_counters.dernier_numero, v_rec.dernier_numero),
        updated_at = now();
      v_count := v_count + 1;
    END LOOP;
    RETURN QUERY SELECT 'arti_reference_counters'::TEXT, v_count;
  END IF;

  -- Migrer depuis reference_counters (si existe et format compatible)
  v_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reference_counters' AND table_schema = 'public') THEN
    FOR v_rec IN SELECT etape::INTEGER, mm::INTEGER AS mois, (2000 + yy::INTEGER) AS annee, last_value AS dernier_numero
                 FROM reference_counters
                 WHERE etape ~ '^[0-9]$'
    LOOP
      INSERT INTO unified_reference_counters (etape, mois, annee, dernier_numero, updated_at)
      VALUES (v_rec.etape, v_rec.mois, v_rec.annee, v_rec.dernier_numero, now())
      ON CONFLICT (etape, mois, annee)
      DO UPDATE SET
        dernier_numero = GREATEST(unified_reference_counters.dernier_numero, v_rec.dernier_numero),
        updated_at = now();
      v_count := v_count + 1;
    END LOOP;
    RETURN QUERY SELECT 'reference_counters'::TEXT, v_count;
  END IF;

  RETURN;
END;
$$;

-- 9. Commentaires de documentation
-- ============================================================================
COMMENT ON TABLE public.unified_reference_counters IS
'Compteurs atomiques pour generation de references ARTI unifiees.
Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4) = 13 caracteres
Etapes: 0=SEF, 1=Engagement, 2=Liquidation, 3=Ordonnancement, 4=Reglement, 5=AEF, 6=Imputation';

COMMENT ON FUNCTION public.generate_unified_reference IS
'Genere une reference unique atomique au format ARTI + ETAPE + MMYY + NNNN.
Utilise INSERT ON CONFLICT pour garantir l''unicite sous concurrence.
p_etape: 0=SEF, 1=Engagement, 2=Liquidation, 3=Ordonnancement, 4=Reglement, 5=AEF, 6=Imputation
p_date: date de reference pour extraire MM et YY (defaut: maintenant)';

COMMENT ON FUNCTION public.parse_unified_reference IS
'Parse une reference ARTI pour extraire ses composants (etape, mois, annee, numero, libelle).';

COMMENT ON FUNCTION public.sync_unified_ref_counter IS
'Synchronise le compteur apres un import pour eviter les doublons.';

COMMENT ON FUNCTION public.migrate_old_reference_counters IS
'Migre les anciens compteurs (arti_reference_counters, reference_counters) vers le nouveau systeme unifie.';

COMMENT ON VIEW public.v_reference_counters_status IS
'Vue pour visualiser l''etat des compteurs de reference par etape/mois/annee.';

-- 10. Executer la migration des anciens compteurs
-- ============================================================================
SELECT * FROM migrate_old_reference_counters();
