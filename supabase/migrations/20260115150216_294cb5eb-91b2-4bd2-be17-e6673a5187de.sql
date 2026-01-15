-- ============================================
-- Fonction RPC: Recherche Notes SEF étendue
-- Permet de rechercher sur direction (sigle/label) et demandeur (nom/prénom)
-- ============================================

CREATE OR REPLACE FUNCTION public.search_notes_sef(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'updated_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  numero TEXT,
  reference_pivot TEXT,
  exercice INTEGER,
  direction_id UUID,
  demandeur_id UUID,
  beneficiaire_id UUID,
  beneficiaire_interne_id UUID,
  objet TEXT,
  description TEXT,
  justification TEXT,
  date_souhaitee DATE,
  urgence TEXT,
  commentaire TEXT,
  statut TEXT,
  rejection_reason TEXT,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  differe_motif TEXT,
  differe_condition TEXT,
  differe_date_reprise DATE,
  differe_by UUID,
  differe_at TIMESTAMPTZ,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  dossier_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.numero,
    n.reference_pivot,
    n.exercice,
    n.direction_id,
    n.demandeur_id,
    n.beneficiaire_id,
    n.beneficiaire_interne_id,
    n.objet,
    n.description,
    n.justification,
    n.date_souhaitee,
    n.urgence,
    n.commentaire,
    n.statut,
    n.rejection_reason,
    n.rejected_by,
    n.rejected_at,
    n.differe_motif,
    n.differe_condition,
    n.differe_date_reprise,
    n.differe_by,
    n.differe_at,
    n.validated_by,
    n.validated_at,
    n.submitted_by,
    n.submitted_at,
    n.created_by,
    n.created_at,
    n.updated_at,
    n.dossier_id
  FROM notes_sef n
  LEFT JOIN directions d ON n.direction_id = d.id
  LEFT JOIN profiles p ON n.demandeur_id = p.id
  WHERE n.exercice = p_exercice
    -- Filtre de recherche étendu
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR n.reference_pivot ILIKE '%' || p_search || '%'
      OR n.numero ILIKE '%' || p_search || '%'
      OR n.objet ILIKE '%' || p_search || '%'
      OR d.label ILIKE '%' || p_search || '%'
      OR d.sigle ILIKE '%' || p_search || '%'
      OR p.first_name ILIKE '%' || p_search || '%'
      OR p.last_name ILIKE '%' || p_search || '%'
      OR (p.first_name || ' ' || p.last_name) ILIKE '%' || p_search || '%'
    )
    -- Filtre par statut
    AND (p_statut IS NULL OR n.statut = ANY(p_statut))
  ORDER BY
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'desc' THEN n.updated_at END DESC,
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'asc' THEN n.updated_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN n.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN n.created_at END ASC,
    CASE WHEN p_sort_by = 'date_souhaitee' AND p_sort_order = 'desc' THEN n.date_souhaitee END DESC,
    CASE WHEN p_sort_by = 'date_souhaitee' AND p_sort_order = 'asc' THEN n.date_souhaitee END ASC,
    n.updated_at DESC -- Default fallback
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- Fonction pour compter les résultats de recherche
CREATE OR REPLACE FUNCTION public.count_search_notes_sef(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM notes_sef n
  LEFT JOIN directions d ON n.direction_id = d.id
  LEFT JOIN profiles p ON n.demandeur_id = p.id
  WHERE n.exercice = p_exercice
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR n.reference_pivot ILIKE '%' || p_search || '%'
      OR n.numero ILIKE '%' || p_search || '%'
      OR n.objet ILIKE '%' || p_search || '%'
      OR d.label ILIKE '%' || p_search || '%'
      OR d.sigle ILIKE '%' || p_search || '%'
      OR p.first_name ILIKE '%' || p_search || '%'
      OR p.last_name ILIKE '%' || p_search || '%'
      OR (p.first_name || ' ' || p.last_name) ILIKE '%' || p_search || '%'
    )
    AND (p_statut IS NULL OR n.statut = ANY(p_statut));
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- Commentaires
COMMENT ON FUNCTION public.search_notes_sef IS 'Recherche paginée des Notes SEF avec filtre sur direction et demandeur';
COMMENT ON FUNCTION public.count_search_notes_sef IS 'Compte le total de résultats pour la recherche Notes SEF';