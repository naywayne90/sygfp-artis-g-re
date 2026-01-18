-- ============================================
-- MIGRATION: Table des origines de fonds (Funding Sources)
-- ============================================
-- Centralise les sources de financement pour:
-- - Notification budgétaire
-- - Lignes budgétaires
-- - Dépenses (Notes SEF, Engagements, etc.)
-- ============================================

-- 1. Créer la table funding_sources
CREATE TABLE IF NOT EXISTS public.funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'autre' CHECK (type IN (
    'etat', 'partenaire', 'recette', 'emprunt', 'don', 'autre'
  )),
  description TEXT,
  est_actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,

  -- Métadonnées pour mapping des anciennes valeurs texte
  legacy_codes TEXT[] DEFAULT '{}',

  -- Désactivation
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_funding_sources_actif ON public.funding_sources(est_actif);
CREATE INDEX IF NOT EXISTS idx_funding_sources_type ON public.funding_sources(type);
CREATE INDEX IF NOT EXISTS idx_funding_sources_code ON public.funding_sources(code);

-- 3. RLS
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view funding sources" ON public.funding_sources
  FOR SELECT USING (true);

CREATE POLICY "Admin and DAAF can manage funding sources" ON public.funding_sources
  FOR ALL USING (
    public.has_role(auth.uid(), 'ADMIN') OR
    public.has_role(auth.uid(), 'DAAF')
  );

-- 4. Insérer les valeurs par défaut (correspondant aux options existantes)
INSERT INTO public.funding_sources (code, libelle, type, ordre, legacy_codes) VALUES
  ('ETAT', 'Budget État', 'etat', 1, ARRAY['budget_etat', 'Budget État', 'BUDGET_ETAT']),
  ('RP', 'Ressources Propres', 'recette', 2, ARRAY['ressources_propres', 'Ressources Propres', 'RESSOURCES_PROPRES']),
  ('PTF', 'Partenaires Techniques et Financiers', 'partenaire', 3, ARRAY['partenaires', 'PTF', 'PARTENAIRES']),
  ('EMPRUNT', 'Emprunts', 'emprunt', 4, ARRAY['emprunts', 'Emprunts', 'EMPRUNTS']),
  ('DON', 'Dons et Subventions', 'don', 5, ARRAY['dons', 'Dons et Subventions', 'DONS'])
ON CONFLICT (code) DO NOTHING;

-- 5. Vue des sources actives (pour les sélecteurs)
CREATE OR REPLACE VIEW v_funding_sources_actives AS
SELECT
  id,
  code,
  libelle,
  type,
  description,
  ordre
FROM public.funding_sources
WHERE est_actif = true
ORDER BY ordre, libelle;

-- 6. Fonction pour mapper les anciennes valeurs texte vers les nouvelles
CREATE OR REPLACE FUNCTION get_funding_source_id(p_legacy_value TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Chercher par correspondance exacte du code
  SELECT id INTO v_id
  FROM public.funding_sources
  WHERE code = p_legacy_value;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Chercher dans les codes legacy
  SELECT id INTO v_id
  FROM public.funding_sources
  WHERE p_legacy_value = ANY(legacy_codes);

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Chercher par correspondance partielle du libellé (insensible à la casse)
  SELECT id INTO v_id
  FROM public.funding_sources
  WHERE LOWER(libelle) LIKE LOWER('%' || p_legacy_value || '%')
  LIMIT 1;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Fonction pour obtenir le libellé d'une source (avec fallback sur la valeur texte)
CREATE OR REPLACE FUNCTION get_funding_source_label(p_value TEXT)
RETURNS TEXT AS $$
DECLARE
  v_label TEXT;
BEGIN
  -- Chercher dans la table
  SELECT libelle INTO v_label
  FROM public.funding_sources
  WHERE code = p_value OR p_value = ANY(legacy_codes);

  -- Si trouvé, retourner le libellé officiel
  IF v_label IS NOT NULL THEN
    RETURN v_label;
  END IF;

  -- Sinon retourner la valeur originale
  RETURN p_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Fonction pour désactiver une source
CREATE OR REPLACE FUNCTION deactivate_funding_source(
  p_source_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS public.funding_sources AS $$
DECLARE
  v_source public.funding_sources;
BEGIN
  UPDATE public.funding_sources
  SET
    est_actif = false,
    deactivated_at = NOW(),
    deactivated_by = auth.uid(),
    deactivation_reason = COALESCE(p_reason, 'Désactivation manuelle'),
    updated_at = NOW()
  WHERE id = p_source_id
  RETURNING * INTO v_source;

  IF v_source IS NULL THEN
    RAISE EXCEPTION 'Source de financement non trouvée: %', p_source_id;
  END IF;

  RETURN v_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour réactiver une source
CREATE OR REPLACE FUNCTION reactivate_funding_source(
  p_source_id UUID
) RETURNS public.funding_sources AS $$
DECLARE
  v_source public.funding_sources;
BEGIN
  UPDATE public.funding_sources
  SET
    est_actif = true,
    deactivated_at = NULL,
    deactivated_by = NULL,
    deactivation_reason = NULL,
    updated_at = NOW()
  WHERE id = p_source_id
  RETURNING * INTO v_source;

  IF v_source IS NULL THEN
    RAISE EXCEPTION 'Source de financement non trouvée: %', p_source_id;
  END IF;

  RETURN v_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_funding_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_funding_sources_updated ON public.funding_sources;
CREATE TRIGGER trigger_funding_sources_updated
  BEFORE UPDATE ON public.funding_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_sources_timestamp();

-- Commenter les objets
COMMENT ON TABLE public.funding_sources IS 'Table de référence des origines/sources de financement';
COMMENT ON FUNCTION get_funding_source_id IS 'Retourne l''ID d''une source à partir de son code ou valeur legacy';
COMMENT ON FUNCTION get_funding_source_label IS 'Retourne le libellé officiel d''une source avec fallback';
COMMENT ON FUNCTION deactivate_funding_source IS 'Désactive une source de financement (soft-delete)';
COMMENT ON FUNCTION reactivate_funding_source IS 'Réactive une source de financement';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
