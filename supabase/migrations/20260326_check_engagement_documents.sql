-- Fonction RPC pour vérifier la complétude des documents obligatoires d'un engagement
CREATE OR REPLACE FUNCTION check_engagement_documents_complete(p_engagement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_total_obligatoires INT;
  v_total_fournis INT;
  v_missing TEXT[];
BEGIN
  -- Compter les documents obligatoires fournis
  SELECT
    COUNT(*) FILTER (WHERE est_obligatoire = true),
    COUNT(*) FILTER (WHERE est_obligatoire = true AND est_fourni = true),
    ARRAY_AGG(type_document) FILTER (WHERE est_obligatoire = true AND (est_fourni IS NULL OR est_fourni = false))
  INTO v_total_obligatoires, v_total_fournis, v_missing
  FROM engagement_documents
  WHERE engagement_id = p_engagement_id;

  -- Si pas de documents configurés, considérer comme complet
  IF v_total_obligatoires = 0 OR v_total_obligatoires IS NULL THEN
    RETURN jsonb_build_object('complete', true, 'total', 0, 'fournis', 0, 'missing', '[]'::jsonb);
  END IF;

  RETURN jsonb_build_object(
    'complete', v_total_fournis >= v_total_obligatoires,
    'total', v_total_obligatoires,
    'fournis', v_total_fournis,
    'missing', COALESCE(to_jsonb(v_missing), '[]'::jsonb)
  );
END;
$$;
