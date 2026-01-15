-- Fonction de recherche paginée pour notes_dg (AEF)
CREATE OR REPLACE FUNCTION search_notes_aef(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_urgence TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'updated_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE(id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id
  FROM notes_dg n
  LEFT JOIN directions d ON n.direction_id = d.id
  WHERE n.exercice = p_exercice
    -- Filtre recherche textuelle sur référence, objet, direction, montant
    AND (p_search IS NULL OR (
      n.numero ILIKE '%' || p_search || '%' OR
      n.reference_pivot ILIKE '%' || p_search || '%' OR
      n.objet ILIKE '%' || p_search || '%' OR
      d.label ILIKE '%' || p_search || '%' OR
      d.sigle ILIKE '%' || p_search || '%' OR
      CAST(n.montant_estime AS TEXT) ILIKE '%' || p_search || '%'
    ))
    -- Filtre statut
    AND (p_statut IS NULL OR n.statut = ANY(p_statut))
    -- Filtre direction
    AND (p_direction_id IS NULL OR n.direction_id = p_direction_id)
    -- Filtre urgence
    AND (p_urgence IS NULL OR n.priorite = p_urgence)
    -- Filtre dates
    AND (p_date_from IS NULL OR n.created_at >= p_date_from)
    AND (p_date_to IS NULL OR n.created_at <= p_date_to)
  ORDER BY 
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'desc' THEN n.updated_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'asc' THEN n.updated_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN n.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN n.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'montant_estime' AND p_sort_order = 'desc' THEN n.montant_estime END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'montant_estime' AND p_sort_order = 'asc' THEN n.montant_estime END ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de comptage pour notes_dg (AEF)
CREATE OR REPLACE FUNCTION count_search_notes_aef(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_urgence TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notes_dg n
    LEFT JOIN directions d ON n.direction_id = d.id
    WHERE n.exercice = p_exercice
      AND (p_search IS NULL OR (
        n.numero ILIKE '%' || p_search || '%' OR
        n.reference_pivot ILIKE '%' || p_search || '%' OR
        n.objet ILIKE '%' || p_search || '%' OR
        d.label ILIKE '%' || p_search || '%' OR
        d.sigle ILIKE '%' || p_search || '%' OR
        CAST(n.montant_estime AS TEXT) ILIKE '%' || p_search || '%'
      ))
      AND (p_statut IS NULL OR n.statut = ANY(p_statut))
      AND (p_direction_id IS NULL OR n.direction_id = p_direction_id)
      AND (p_urgence IS NULL OR n.priorite = p_urgence)
      AND (p_date_from IS NULL OR n.created_at >= p_date_from)
      AND (p_date_to IS NULL OR n.created_at <= p_date_to)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Améliorer la fonction SEF avec filtres direction/urgence/dates
CREATE OR REPLACE FUNCTION search_notes_sef_v2(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_urgence TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'updated_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE(id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id
  FROM notes_sef n
  LEFT JOIN directions d ON n.direction_id = d.id
  LEFT JOIN profiles p ON n.demandeur_id = p.id
  WHERE n.exercice = p_exercice
    AND (p_search IS NULL OR (
      n.numero ILIKE '%' || p_search || '%' OR
      n.reference_pivot ILIKE '%' || p_search || '%' OR
      n.objet ILIKE '%' || p_search || '%' OR
      d.label ILIKE '%' || p_search || '%' OR
      d.sigle ILIKE '%' || p_search || '%' OR
      p.first_name ILIKE '%' || p_search || '%' OR
      p.last_name ILIKE '%' || p_search || '%' OR
      CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || p_search || '%'
    ))
    AND (p_statut IS NULL OR n.statut = ANY(p_statut))
    AND (p_direction_id IS NULL OR n.direction_id = p_direction_id)
    AND (p_urgence IS NULL OR n.urgence = p_urgence)
    AND (p_date_from IS NULL OR n.created_at >= p_date_from)
    AND (p_date_to IS NULL OR n.created_at <= p_date_to)
  ORDER BY 
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'desc' THEN n.updated_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'asc' THEN n.updated_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN n.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN n.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'date_souhaitee' AND p_sort_order = 'desc' THEN n.date_souhaitee END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'date_souhaitee' AND p_sort_order = 'asc' THEN n.date_souhaitee END ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comptage SEF v2
CREATE OR REPLACE FUNCTION count_search_notes_sef_v2(
  p_exercice INTEGER,
  p_search TEXT DEFAULT NULL,
  p_statut TEXT[] DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_urgence TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notes_sef n
    LEFT JOIN directions d ON n.direction_id = d.id
    LEFT JOIN profiles p ON n.demandeur_id = p.id
    WHERE n.exercice = p_exercice
      AND (p_search IS NULL OR (
        n.numero ILIKE '%' || p_search || '%' OR
        n.reference_pivot ILIKE '%' || p_search || '%' OR
        n.objet ILIKE '%' || p_search || '%' OR
        d.label ILIKE '%' || p_search || '%' OR
        d.sigle ILIKE '%' || p_search || '%' OR
        p.first_name ILIKE '%' || p_search || '%' OR
        p.last_name ILIKE '%' || p_search || '%' OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || p_search || '%'
      ))
      AND (p_statut IS NULL OR n.statut = ANY(p_statut))
      AND (p_direction_id IS NULL OR n.direction_id = p_direction_id)
      AND (p_urgence IS NULL OR n.urgence = p_urgence)
      AND (p_date_from IS NULL OR n.created_at >= p_date_from)
      AND (p_date_to IS NULL OR n.created_at <= p_date_to)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;