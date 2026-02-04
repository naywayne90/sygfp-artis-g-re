-- Migration: Ajout de la hiérarchie des superviseurs
-- À exécuter par TRESOR (DBA)

-- ============================================================================
-- AJOUT DE LA COLONNE SUPERVISOR_ID
-- ============================================================================

-- Ajouter la colonne supervisor_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'supervisor_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN supervisor_id UUID REFERENCES profiles(id);

    -- Créer un index pour les recherches hiérarchiques
    CREATE INDEX idx_profiles_supervisor_id ON profiles(supervisor_id);

    -- Commentaire
    COMMENT ON COLUMN profiles.supervisor_id IS 'ID du supérieur hiérarchique direct (N+1)';
  END IF;
END $$;

-- ============================================================================
-- FONCTION POUR RÉCUPÉRER L'ÉQUIPE COMPLÈTE (N-1, N-2, etc.)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_team_members(p_supervisor_id UUID, p_depth INT DEFAULT 1)
RETURNS TABLE (
  id UUID,
  nom TEXT,
  prenom TEXT,
  email TEXT,
  direction_id UUID,
  level INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_hierarchy AS (
    -- Niveau 1: collaborateurs directs
    SELECT
      p.id,
      p.last_name as nom,
      p.first_name as prenom,
      p.email,
      p.direction_id,
      1 as level
    FROM profiles p
    WHERE p.supervisor_id = p_supervisor_id

    UNION ALL

    -- Niveaux suivants (si profondeur > 1)
    SELECT
      p.id,
      p.last_name,
      p.first_name,
      p.email,
      p.direction_id,
      th.level + 1
    FROM profiles p
    INNER JOIN team_hierarchy th ON p.supervisor_id = th.id
    WHERE th.level < p_depth
  )
  SELECT * FROM team_hierarchy
  ORDER BY level, nom, prenom;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION POUR RÉCUPÉRER LES NOTES DE L'ÉQUIPE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_team_notes(
  p_supervisor_id UUID,
  p_depth INT DEFAULT 1,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  numero TEXT,
  reference_pivot TEXT,
  objet TEXT,
  statut TEXT,
  type_note TEXT,
  montant NUMERIC,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_nom TEXT,
  creator_prenom TEXT,
  creator_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.numero,
    n.reference_pivot,
    n.objet,
    n.statut,
    n.type_note,
    n.montant,
    n.created_at,
    n.created_by,
    p.last_name as creator_nom,
    p.first_name as creator_prenom,
    p.email as creator_email
  FROM notes_sef n
  INNER JOIN profiles p ON n.created_by = p.id
  WHERE n.created_by IN (
    SELECT tm.id FROM get_team_members(p_supervisor_id, p_depth) tm
  )
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_team_members(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_notes(UUID, INT, INT) TO authenticated;
