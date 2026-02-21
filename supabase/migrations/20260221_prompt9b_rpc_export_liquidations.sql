-- ===========================================================================
-- Prompt 9b BACKEND : RPC export liquidations dénormalisée
-- Table : budget_liquidations + JOINs engagement, budget_line, direction, profiles
-- Date : 21 février 2026
-- ===========================================================================
-- Retourne une vue aplatie (flat) de toutes les liquidations avec :
--   • Données engagement (numéro, objet, fournisseur)
--   • Ligne budgétaire (code, label) + Direction (sigle)
--   • Calculs (montant, HT, TVA, retenues, net_a_payer)
--   • Service fait (date, certifié par)
--   • Visas DAAF/DG (qui + quand)
--   • Urgence (motif)
--   • Filtres : exercice, statut, direction_id, date_debut, date_fin
-- ===========================================================================

CREATE OR REPLACE FUNCTION rpc_export_liquidations(
  p_exercice        INT,
  p_statut          TEXT    DEFAULT NULL,
  p_direction_id    UUID    DEFAULT NULL,
  p_date_debut      DATE    DEFAULT NULL,
  p_date_fin        DATE    DEFAULT NULL
)
RETURNS TABLE (
  -- Liquidation
  numero               TEXT,
  date_liquidation     DATE,
  montant              NUMERIC,
  montant_ht           NUMERIC,
  tva_taux             NUMERIC,
  tva_montant          NUMERIC,
  airsi_taux           NUMERIC,
  airsi_montant        NUMERIC,
  retenue_source_taux  NUMERIC,
  retenue_source_montant NUMERIC,
  retenue_bic_taux     NUMERIC,
  retenue_bic_montant  NUMERIC,
  retenue_bnc_taux     NUMERIC,
  retenue_bnc_montant  NUMERIC,
  penalites_montant    NUMERIC,
  penalites_nb_jours   INT,
  total_retenues       NUMERIC,
  net_a_payer          NUMERIC,
  regime_fiscal        TEXT,
  reference_facture    TEXT,
  statut               TEXT,
  reglement_urgent     BOOLEAN,
  reglement_urgent_motif TEXT,
  -- Service fait
  service_fait         BOOLEAN,
  service_fait_date    DATE,
  sf_certifie_par      TEXT,
  -- Engagement
  engagement_numero    TEXT,
  engagement_objet     TEXT,
  fournisseur          TEXT,
  engagement_montant   NUMERIC,
  -- Budget
  budget_line_code     TEXT,
  budget_line_label    TEXT,
  direction_sigle      TEXT,
  direction_label      TEXT,
  -- Workflow
  created_at           TIMESTAMPTZ,
  submitted_at         TIMESTAMPTZ,
  createur             TEXT,
  visa_daaf_par        TEXT,
  visa_daaf_date       TIMESTAMPTZ,
  visa_daaf_commentaire TEXT,
  visa_dg_par          TEXT,
  visa_dg_date         TIMESTAMPTZ,
  visa_dg_commentaire  TEXT,
  validated_at         TIMESTAMPTZ,
  motif_rejet          TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Liquidation
    l.numero,
    l.date_liquidation,
    l.montant,
    l.montant_ht,
    l.tva_taux,
    l.tva_montant,
    l.airsi_taux,
    l.airsi_montant,
    l.retenue_source_taux,
    l.retenue_source_montant,
    l.retenue_bic_taux,
    l.retenue_bic_montant,
    l.retenue_bnc_taux,
    l.retenue_bnc_montant,
    l.penalites_montant,
    l.penalites_nb_jours::INT,
    l.total_retenues,
    l.net_a_payer,
    l.regime_fiscal,
    l.reference_facture,
    l.statut,
    COALESCE(l.reglement_urgent, false),
    l.reglement_urgent_motif,
    -- Service fait
    COALESCE(l.service_fait, false),
    l.service_fait_date,
    p_sf.full_name                     AS sf_certifie_par,
    -- Engagement
    be.numero                          AS engagement_numero,
    be.objet                           AS engagement_objet,
    be.fournisseur,
    be.montant                         AS engagement_montant,
    -- Budget
    bl.code                            AS budget_line_code,
    bl.label                           AS budget_line_label,
    d.sigle                            AS direction_sigle,
    d.label                            AS direction_label,
    -- Workflow
    l.created_at,
    l.submitted_at,
    p_creator.full_name                AS createur,
    p_daaf.full_name                   AS visa_daaf_par,
    l.visa_daaf_date,
    l.visa_daaf_commentaire,
    p_dg.full_name                     AS visa_dg_par,
    l.visa_dg_date,
    l.visa_dg_commentaire,
    l.validated_at,
    COALESCE(l.motif_rejet, l.rejection_reason) AS motif_rejet
  FROM budget_liquidations l
  LEFT JOIN budget_engagements be ON be.id = l.engagement_id
  LEFT JOIN budget_lines bl ON bl.id = be.budget_line_id
  LEFT JOIN directions d ON d.id = bl.direction_id
  LEFT JOIN profiles p_creator ON p_creator.id = l.created_by
  LEFT JOIN profiles p_sf ON p_sf.id = l.service_fait_certifie_par
  LEFT JOIN profiles p_daaf ON p_daaf.id = l.visa_daaf_user_id
  LEFT JOIN profiles p_dg ON p_dg.id = l.visa_dg_user_id
  WHERE l.exercice = p_exercice
    AND (p_statut IS NULL OR l.statut = p_statut)
    AND (p_direction_id IS NULL OR d.id = p_direction_id)
    AND (p_date_debut IS NULL OR l.date_liquidation >= p_date_debut)
    AND (p_date_fin IS NULL OR l.date_liquidation <= p_date_fin)
  ORDER BY l.numero;
$$;

COMMENT ON FUNCTION rpc_export_liquidations IS
  'RPC Prompt 9b : export dénormalisé des liquidations (tous champs + JOINs engagement, budget, profiles, visas)';

GRANT EXECUTE ON FUNCTION rpc_export_liquidations(INT, TEXT, UUID, DATE, DATE) TO authenticated;
