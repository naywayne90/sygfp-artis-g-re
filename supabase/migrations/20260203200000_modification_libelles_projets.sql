-- =====================================================
-- PROMPT 41 : Modification libellés projets
-- Date: 2026-02-03
-- Objectif: Permettre la modification des libellés dans la hiérarchie budgétaire
-- avec traçabilité complète
-- =====================================================

-- =====================================================
-- TABLE : historique_libelles
-- Historique de toutes les modifications de libellés
-- =====================================================
CREATE TABLE IF NOT EXISTS historique_libelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_source TEXT NOT NULL,
  entity_id UUID NOT NULL,
  ancien_libelle TEXT,
  nouveau_libelle TEXT NOT NULL,
  modifie_par UUID REFERENCES auth.users(id),
  modifie_at TIMESTAMPTZ DEFAULT NOW(),
  motif TEXT,
  CONSTRAINT valid_table_source CHECK (
    table_source IN ('objectifs_strategiques', 'missions', 'actions', 'activites', 'budget_lines')
  )
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_historique_libelles_entity
ON historique_libelles(table_source, entity_id);

CREATE INDEX IF NOT EXISTS idx_historique_libelles_date
ON historique_libelles(modifie_at DESC);

-- =====================================================
-- AJOUT COLONNES AUX TABLES DE LA HIÉRARCHIE
-- =====================================================

-- 1. Table objectifs_strategiques
ALTER TABLE objectifs_strategiques
ADD COLUMN IF NOT EXISTS libelle_modifie TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- 2. Table missions
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS libelle_modifie TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- 3. Table actions
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS libelle_modifie TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- 4. Table activites
ALTER TABLE activites
ADD COLUMN IF NOT EXISTS libelle_modifie TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- 5. Table budget_lines (pour les lignes budgétaires)
ALTER TABLE budget_lines
ADD COLUMN IF NOT EXISTS libelle_modifie TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- =====================================================
-- FONCTION 1 : update_libelle_budget
-- Met à jour le libellé d'une entité et enregistre l'historique
-- =====================================================
CREATE OR REPLACE FUNCTION update_libelle_budget(
  p_table TEXT,
  p_id UUID,
  p_nouveau_libelle TEXT,
  p_motif TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ancien_libelle TEXT;
  v_result JSONB;
BEGIN
  -- Valider la table
  IF p_table NOT IN ('objectifs_strategiques', 'missions', 'actions', 'activites', 'budget_lines') THEN
    RAISE EXCEPTION 'Table non autorisée: %', p_table;
  END IF;

  -- Récupérer l'ancien libellé
  EXECUTE format('SELECT libelle FROM %I WHERE id = $1', p_table)
  INTO v_ancien_libelle
  USING p_id;

  IF v_ancien_libelle IS NULL THEN
    RAISE EXCEPTION 'Entité non trouvée: % dans %', p_id, p_table;
  END IF;

  -- Mettre à jour le libellé modifié
  EXECUTE format(
    'UPDATE %I SET libelle_modifie = $1, date_modification = NOW() WHERE id = $2',
    p_table
  )
  USING p_nouveau_libelle, p_id;

  -- Enregistrer dans l'historique
  INSERT INTO historique_libelles (
    table_source,
    entity_id,
    ancien_libelle,
    nouveau_libelle,
    modifie_par,
    motif
  ) VALUES (
    p_table,
    p_id,
    COALESCE(v_ancien_libelle, ''),
    p_nouveau_libelle,
    auth.uid(),
    p_motif
  );

  -- Retourner le résultat
  v_result := jsonb_build_object(
    'success', true,
    'table', p_table,
    'id', p_id,
    'ancien_libelle', v_ancien_libelle,
    'nouveau_libelle', p_nouveau_libelle,
    'date_modification', NOW()
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- FONCTION 2 : get_libelle_effectif
-- Retourne le libellé effectif (modifié ou original)
-- =====================================================
CREATE OR REPLACE FUNCTION get_libelle_effectif(
  p_table TEXT,
  p_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_libelle TEXT;
  v_libelle_modifie TEXT;
BEGIN
  -- Valider la table
  IF p_table NOT IN ('objectifs_strategiques', 'missions', 'actions', 'activites', 'budget_lines') THEN
    RAISE EXCEPTION 'Table non autorisée: %', p_table;
  END IF;

  -- Récupérer les deux libellés
  EXECUTE format(
    'SELECT libelle, libelle_modifie FROM %I WHERE id = $1',
    p_table
  )
  INTO v_libelle, v_libelle_modifie
  USING p_id;

  -- Retourner le libellé modifié s'il existe, sinon l'original
  RETURN COALESCE(v_libelle_modifie, v_libelle);
END;
$$;

-- =====================================================
-- FONCTION 3 : get_historique_libelle
-- Retourne l'historique des modifications d'un libellé
-- =====================================================
CREATE OR REPLACE FUNCTION get_historique_libelle(
  p_table TEXT,
  p_id UUID
)
RETURNS TABLE (
  id UUID,
  ancien_libelle TEXT,
  nouveau_libelle TEXT,
  modifie_par UUID,
  modifie_par_nom TEXT,
  modifie_at TIMESTAMPTZ,
  motif TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Valider la table
  IF p_table NOT IN ('objectifs_strategiques', 'missions', 'actions', 'activites', 'budget_lines') THEN
    RAISE EXCEPTION 'Table non autorisée: %', p_table;
  END IF;

  RETURN QUERY
  SELECT
    h.id,
    h.ancien_libelle,
    h.nouveau_libelle,
    h.modifie_par,
    COALESCE(p.nom || ' ' || p.prenom, 'Utilisateur inconnu') AS modifie_par_nom,
    h.modifie_at,
    h.motif
  FROM historique_libelles h
  LEFT JOIN profiles p ON p.id = h.modifie_par
  WHERE h.table_source = p_table
    AND h.entity_id = p_id
  ORDER BY h.modifie_at DESC;
END;
$$;

-- =====================================================
-- FONCTION 4 : revert_libelle
-- Annule la modification d'un libellé (retour à l'original)
-- =====================================================
CREATE OR REPLACE FUNCTION revert_libelle(
  p_table TEXT,
  p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_libelle_actuel TEXT;
  v_result JSONB;
BEGIN
  -- Valider la table
  IF p_table NOT IN ('objectifs_strategiques', 'missions', 'actions', 'activites', 'budget_lines') THEN
    RAISE EXCEPTION 'Table non autorisée: %', p_table;
  END IF;

  -- Récupérer le libellé modifié actuel
  EXECUTE format('SELECT libelle_modifie FROM %I WHERE id = $1', p_table)
  INTO v_libelle_actuel
  USING p_id;

  IF v_libelle_actuel IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Aucune modification à annuler'
    );
  END IF;

  -- Remettre à null
  EXECUTE format(
    'UPDATE %I SET libelle_modifie = NULL, date_modification = NULL WHERE id = $1',
    p_table
  )
  USING p_id;

  -- Enregistrer dans l'historique
  INSERT INTO historique_libelles (
    table_source,
    entity_id,
    ancien_libelle,
    nouveau_libelle,
    modifie_par,
    motif
  ) VALUES (
    p_table,
    p_id,
    v_libelle_actuel,
    '[REVERT - Retour au libellé original]',
    auth.uid(),
    'Annulation de la modification'
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Libellé restauré au libellé original',
    'ancien_libelle_modifie', v_libelle_actuel
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- RLS POLICIES pour historique_libelles
-- =====================================================
ALTER TABLE historique_libelles ENABLE ROW LEVEL SECURITY;

-- Policy de lecture : tout le monde peut lire
CREATE POLICY "Lecture historique libelles pour tous"
ON historique_libelles FOR SELECT
TO authenticated
USING (true);

-- Policy d'insertion : via fonction SECURITY DEFINER
CREATE POLICY "Insertion historique via fonction"
ON historique_libelles FOR INSERT
TO authenticated
WITH CHECK (modifie_par = auth.uid());

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE historique_libelles IS 'Historique de toutes les modifications de libellés dans la hiérarchie budgétaire';
COMMENT ON FUNCTION update_libelle_budget IS 'Met à jour le libellé modifié d''une entité et enregistre l''historique';
COMMENT ON FUNCTION get_libelle_effectif IS 'Retourne le libellé effectif (modifié si existe, sinon original)';
COMMENT ON FUNCTION get_historique_libelle IS 'Retourne l''historique complet des modifications d''un libellé';
COMMENT ON FUNCTION revert_libelle IS 'Annule la modification d''un libellé et restaure l''original';
