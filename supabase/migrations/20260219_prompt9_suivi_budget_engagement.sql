-- Prompt 9 Backend: Suivi engagements par ligne budgétaire
-- Crée une fonction RPC qui retourne le suivi consolidé engagements/budget

-- ============================================================================
-- RPC: get_suivi_engagements_par_ligne(p_exercice INT, p_direction_id UUID)
-- Retourne pour chaque ligne budgétaire active:
--   - code, label, dotation_actuelle, total_engage, disponible_net
--   - nb_engagements (validés), dernier_engagement (date)
--   - taux_engagement (%)
-- Ordonnée par taux d'engagement DESC
-- ============================================================================

CREATE OR REPLACE FUNCTION get_suivi_engagements_par_ligne(
  p_exercice INT DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL
)
RETURNS TABLE(
  budget_line_id UUID,
  code TEXT,
  label TEXT,
  dotation_actuelle NUMERIC,
  total_engage NUMERIC,
  disponible_net NUMERIC,
  taux_engagement NUMERIC,
  nb_engagements BIGINT,
  montant_total_engagements NUMERIC,
  dernier_engagement TIMESTAMPTZ,
  direction_code TEXT,
  direction_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS budget_line_id,
    v.code,
    v.label,
    COALESCE(v.dotation_actuelle, 0) AS dotation_actuelle,
    COALESCE(v.total_engage, 0) AS total_engage,
    COALESCE(v.disponible_net, 0) AS disponible_net,
    CASE
      WHEN COALESCE(v.dotation_actuelle, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(v.total_engage, 0) / v.dotation_actuelle * 100, 2)
    END AS taux_engagement,
    COALESCE(agg.nb_engagements, 0) AS nb_engagements,
    COALESCE(agg.montant_total, 0) AS montant_total_engagements,
    agg.dernier AS dernier_engagement,
    v.direction_code,
    v.direction_label
  FROM v_budget_disponibilite v
  LEFT JOIN LATERAL (
    SELECT
      COUNT(be.id) AS nb_engagements,
      SUM(be.montant) AS montant_total,
      MAX(be.created_at) AS dernier
    FROM budget_engagements be
    WHERE be.budget_line_id = v.id
      AND be.statut = 'valide'
  ) agg ON true
  WHERE (p_exercice IS NULL OR v.exercice = p_exercice)
    AND (p_direction_id IS NULL OR v.direction_id = p_direction_id)
  ORDER BY
    CASE
      WHEN COALESCE(v.dotation_actuelle, 0) = 0 THEN 0
      ELSE COALESCE(v.total_engage, 0) / v.dotation_actuelle
    END DESC,
    v.code ASC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_suivi_engagements_par_ligne TO authenticated;

-- ============================================================================
-- RPC: get_engagement_export_data(p_exercice INT, p_direction_id UUID, p_statut TEXT)
-- Retourne les données complètes pour export CSV/Excel des engagements
-- ============================================================================

CREATE OR REPLACE FUNCTION get_engagement_export_data(
  p_exercice INT DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_statut TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  numero TEXT,
  objet TEXT,
  montant NUMERIC,
  montant_ht NUMERIC,
  tva NUMERIC,
  fournisseur TEXT,
  date_engagement DATE,
  statut TEXT,
  workflow_status TEXT,
  type_engagement TEXT,
  exercice INT,
  budget_line_code TEXT,
  budget_line_label TEXT,
  direction_sigle TEXT,
  prestataire_nom TEXT,
  visa_saf_date TIMESTAMPTZ,
  visa_cb_date TIMESTAMPTZ,
  visa_daaf_date TIMESTAMPTZ,
  visa_dg_date TIMESTAMPTZ,
  visa_saf_user TEXT,
  visa_cb_user TEXT,
  visa_daaf_user TEXT,
  visa_dg_user TEXT,
  montant_degage NUMERIC,
  motif_degage TEXT,
  created_at TIMESTAMPTZ,
  created_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.id,
    be.numero,
    be.objet,
    be.montant,
    be.montant_ht,
    be.tva,
    be.fournisseur,
    be.date_engagement,
    be.statut,
    be.workflow_status,
    be.type_engagement,
    be.exercice,
    bl.code AS budget_line_code,
    bl.label AS budget_line_label,
    d.sigle AS direction_sigle,
    COALESCE(pr.raison_sociale, be.fournisseur) AS prestataire_nom,
    be.visa_saf_date,
    be.visa_cb_date,
    be.visa_daaf_date,
    be.visa_dg_date,
    p_saf.full_name AS visa_saf_user,
    p_cb.full_name AS visa_cb_user,
    p_daaf.full_name AS visa_daaf_user,
    p_dg.full_name AS visa_dg_user,
    COALESCE(be.montant_degage, 0) AS montant_degage,
    be.motif_degage,
    be.created_at,
    p_creator.full_name AS created_by_name
  FROM budget_engagements be
  LEFT JOIN budget_lines bl ON bl.id = be.budget_line_id
  LEFT JOIN directions d ON d.id = bl.direction_id
  LEFT JOIN prestataires pr ON pr.id = be.prestataire_id
  LEFT JOIN profiles p_saf ON p_saf.id = be.visa_saf_user_id
  LEFT JOIN profiles p_cb ON p_cb.id = be.visa_cb_user_id
  LEFT JOIN profiles p_daaf ON p_daaf.id = be.visa_daaf_user_id
  LEFT JOIN profiles p_dg ON p_dg.id = be.visa_dg_user_id
  LEFT JOIN profiles p_creator ON p_creator.id = be.created_by
  WHERE (p_exercice IS NULL OR be.exercice = p_exercice)
    AND (p_direction_id IS NULL OR bl.direction_id = p_direction_id)
    AND (p_statut IS NULL OR be.statut = p_statut)
  ORDER BY be.created_at DESC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_engagement_export_data TO authenticated;
