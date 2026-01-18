-- ============================================
-- MIGRATION: Système de versioning des lignes budgétaires
-- ============================================
-- Ajoute un système de versions complètes pour les lignes budgétaires
-- permettant de:
-- - Conserver des snapshots complets (pas juste par champ)
-- - Restaurer une version précédente
-- - Voir le diff entre versions
-- - Gérer le statut actif/inactif au lieu de supprimer
-- ============================================

-- 1. Table des versions de lignes budgétaires
CREATE TABLE IF NOT EXISTS public.budget_line_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,

  -- Snapshot complet des valeurs
  snapshot JSONB NOT NULL,

  -- Valeurs avant/après pour diff facile
  old_values JSONB,
  new_values JSONB,

  -- Métadonnées
  change_type VARCHAR(50) NOT NULL DEFAULT 'modification' CHECK (change_type IN (
    'creation', 'modification', 'status_change', 'restoration', 'deactivation', 'reactivation'
  )),
  change_reason TEXT,
  change_summary TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Contrainte d'unicité
  CONSTRAINT unique_version_per_line UNIQUE (budget_line_id, version_number)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_blv_budget_line ON public.budget_line_versions(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_blv_created_at ON public.budget_line_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blv_change_type ON public.budget_line_versions(change_type);

-- RLS
ALTER TABLE public.budget_line_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view budget line versions" ON public.budget_line_versions
  FOR SELECT USING (true);

CREATE POLICY "Authorized roles can create versions" ON public.budget_line_versions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'ADMIN') OR
    public.has_role(auth.uid(), 'DAAF') OR
    public.has_role(auth.uid(), 'CB') OR
    public.has_role(auth.uid(), 'DIRECTEUR')
  );

-- 2. Ajouter colonnes à budget_lines pour gestion statut
ALTER TABLE public.budget_lines
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id);

-- Index pour lignes actives
CREATE INDEX IF NOT EXISTS idx_budget_lines_active ON public.budget_lines(is_active) WHERE is_active = true;

-- 3. Fonction pour créer une nouvelle version
CREATE OR REPLACE FUNCTION create_budget_line_version(
  p_budget_line_id UUID,
  p_old_values JSONB,
  p_new_values JSONB,
  p_change_type VARCHAR(50) DEFAULT 'modification',
  p_change_reason TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS public.budget_line_versions AS $$
DECLARE
  v_version_number INTEGER;
  v_snapshot JSONB;
  v_result public.budget_line_versions;
  v_change_summary TEXT;
BEGIN
  -- Calculer le prochain numéro de version
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.budget_line_versions
  WHERE budget_line_id = p_budget_line_id;

  -- Créer le snapshot (valeurs actuelles de la ligne)
  SELECT jsonb_build_object(
    'code', code,
    'label', label,
    'level', level,
    'dotation_initiale', dotation_initiale,
    'source_financement', source_financement,
    'direction_id', direction_id,
    'os_id', os_id,
    'mission_id', mission_id,
    'action_id', action_id,
    'activite_id', activite_id,
    'statut', statut,
    'commentaire', commentaire
  )
  INTO v_snapshot
  FROM public.budget_lines
  WHERE id = p_budget_line_id;

  -- Générer un résumé des changements
  v_change_summary := '';
  IF p_new_values IS NOT NULL THEN
    IF p_new_values ? 'dotation_initiale' THEN
      v_change_summary := v_change_summary || 'Dotation: ' ||
        COALESCE((p_old_values->>'dotation_initiale')::text, 'N/A') || ' → ' ||
        (p_new_values->>'dotation_initiale')::text || '. ';
    END IF;
    IF p_new_values ? 'label' THEN
      v_change_summary := v_change_summary || 'Libellé modifié. ';
    END IF;
    IF p_new_values ? 'statut' THEN
      v_change_summary := v_change_summary || 'Statut: ' ||
        COALESCE((p_old_values->>'statut')::text, 'N/A') || ' → ' ||
        (p_new_values->>'statut')::text || '. ';
    END IF;
  END IF;

  -- Insérer la version
  INSERT INTO public.budget_line_versions (
    budget_line_id,
    version_number,
    snapshot,
    old_values,
    new_values,
    change_type,
    change_reason,
    change_summary,
    created_by
  ) VALUES (
    p_budget_line_id,
    v_version_number,
    v_snapshot,
    p_old_values,
    p_new_values,
    p_change_type,
    p_change_reason,
    NULLIF(TRIM(v_change_summary), ''),
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING * INTO v_result;

  -- Mettre à jour la version courante sur la ligne
  UPDATE public.budget_lines
  SET
    current_version = v_version_number,
    last_modified_at = NOW(),
    last_modified_by = COALESCE(p_user_id, auth.uid())
  WHERE id = p_budget_line_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour restaurer une version
CREATE OR REPLACE FUNCTION restore_budget_line_version(
  p_version_id UUID,
  p_reason TEXT DEFAULT 'Restauration manuelle'
) RETURNS public.budget_lines AS $$
DECLARE
  v_version public.budget_line_versions;
  v_line public.budget_lines;
  v_old_values JSONB;
BEGIN
  -- Récupérer la version à restaurer
  SELECT * INTO v_version
  FROM public.budget_line_versions
  WHERE id = p_version_id;

  IF v_version IS NULL THEN
    RAISE EXCEPTION 'Version non trouvée: %', p_version_id;
  END IF;

  -- Récupérer les valeurs actuelles pour l'historique
  SELECT jsonb_build_object(
    'code', code,
    'label', label,
    'level', level,
    'dotation_initiale', dotation_initiale,
    'source_financement', source_financement,
    'direction_id', direction_id,
    'os_id', os_id,
    'mission_id', mission_id,
    'action_id', action_id,
    'activite_id', activite_id,
    'statut', statut,
    'commentaire', commentaire
  )
  INTO v_old_values
  FROM public.budget_lines
  WHERE id = v_version.budget_line_id;

  -- Restaurer les valeurs depuis le snapshot
  UPDATE public.budget_lines
  SET
    label = COALESCE(v_version.snapshot->>'label', label),
    dotation_initiale = COALESCE((v_version.snapshot->>'dotation_initiale')::numeric, dotation_initiale),
    source_financement = COALESCE(v_version.snapshot->>'source_financement', source_financement),
    commentaire = v_version.snapshot->>'commentaire',
    last_modified_at = NOW(),
    last_modified_by = auth.uid()
  WHERE id = v_version.budget_line_id
  RETURNING * INTO v_line;

  -- Créer une nouvelle version pour tracer la restauration
  PERFORM create_budget_line_version(
    v_version.budget_line_id,
    v_old_values,
    v_version.snapshot,
    'restoration',
    p_reason || ' (restauration vers version ' || v_version.version_number || ')',
    auth.uid()
  );

  RETURN v_line;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour désactiver une ligne (au lieu de supprimer)
CREATE OR REPLACE FUNCTION deactivate_budget_line(
  p_budget_line_id UUID,
  p_reason TEXT
) RETURNS public.budget_lines AS $$
DECLARE
  v_line public.budget_lines;
  v_old_values JSONB;
BEGIN
  -- Vérifier qu'il n'y a pas d'engagements
  IF EXISTS (
    SELECT 1 FROM public.budget_engagements
    WHERE budget_line_id = p_budget_line_id
    AND statut NOT IN ('annule', 'rejete')
  ) THEN
    RAISE EXCEPTION 'Impossible de désactiver: des engagements sont liés à cette ligne';
  END IF;

  -- Récupérer les valeurs actuelles
  SELECT jsonb_build_object('is_active', is_active, 'statut', statut)
  INTO v_old_values
  FROM public.budget_lines
  WHERE id = p_budget_line_id;

  -- Désactiver
  UPDATE public.budget_lines
  SET
    is_active = false,
    deactivated_at = NOW(),
    deactivated_by = auth.uid(),
    deactivation_reason = p_reason,
    last_modified_at = NOW(),
    last_modified_by = auth.uid()
  WHERE id = p_budget_line_id
  RETURNING * INTO v_line;

  -- Créer une version
  PERFORM create_budget_line_version(
    p_budget_line_id,
    v_old_values,
    jsonb_build_object('is_active', false),
    'deactivation',
    p_reason,
    auth.uid()
  );

  RETURN v_line;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour réactiver une ligne
CREATE OR REPLACE FUNCTION reactivate_budget_line(
  p_budget_line_id UUID,
  p_reason TEXT DEFAULT 'Réactivation manuelle'
) RETURNS public.budget_lines AS $$
DECLARE
  v_line public.budget_lines;
  v_old_values JSONB;
BEGIN
  -- Récupérer les valeurs actuelles
  SELECT jsonb_build_object('is_active', is_active)
  INTO v_old_values
  FROM public.budget_lines
  WHERE id = p_budget_line_id;

  -- Réactiver
  UPDATE public.budget_lines
  SET
    is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL,
    deactivation_reason = NULL,
    last_modified_at = NOW(),
    last_modified_by = auth.uid()
  WHERE id = p_budget_line_id
  RETURNING * INTO v_line;

  -- Créer une version
  PERFORM create_budget_line_version(
    p_budget_line_id,
    v_old_values,
    jsonb_build_object('is_active', true),
    'reactivation',
    p_reason,
    auth.uid()
  );

  RETURN v_line;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Vue pour l'historique complet avec infos utilisateur
CREATE OR REPLACE VIEW v_budget_line_versions_with_user AS
SELECT
  blv.*,
  p.full_name as created_by_name,
  p.email as created_by_email,
  bl.code as budget_line_code,
  bl.label as budget_line_label
FROM public.budget_line_versions blv
LEFT JOIN public.profiles p ON p.id = blv.created_by
LEFT JOIN public.budget_lines bl ON bl.id = blv.budget_line_id
ORDER BY blv.created_at DESC;

-- Commenter les objets
COMMENT ON TABLE public.budget_line_versions IS 'Historique des versions des lignes budgétaires avec snapshots complets';
COMMENT ON FUNCTION create_budget_line_version IS 'Crée une nouvelle version d''une ligne budgétaire';
COMMENT ON FUNCTION restore_budget_line_version IS 'Restaure une ligne budgétaire vers une version précédente';
COMMENT ON FUNCTION deactivate_budget_line IS 'Désactive une ligne budgétaire (soft delete)';
COMMENT ON FUNCTION reactivate_budget_line IS 'Réactive une ligne budgétaire désactivée';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
