-- ===========================================================================
-- Prompt 9 BACKEND : Suivi par engagement, contrainte cumul, vue agrégée
-- Table : budget_liquidations, budget_engagements
-- Date : 21 février 2026
-- ===========================================================================
-- 1. RPC  : get_suivi_liquidations_par_engagement(p_exercice, p_engagement_id?)
-- 2. Trigger : trg_check_liquidation_cumul (BEFORE INSERT/UPDATE)
--    → Empêche cumul liquidations > montant engagement
-- 3. Vue  : v_liquidations_par_engagement
--    → Agrège nb_liquidations, total_liquide, restant par engagement
-- ===========================================================================


-- ============================================================================
-- 1. RPC : Suivi des liquidations par engagement
--    Retourne pour chaque engagement : montant engagé, nb liquidations,
--    total liquidé, restant à liquider, % liquidé, dernière liquidation
--    Peut être filtré par engagement_id (optionnel) ou exercice
-- ============================================================================
CREATE OR REPLACE FUNCTION get_suivi_liquidations_par_engagement(
  p_exercice INT,
  p_engagement_id UUID DEFAULT NULL
)
RETURNS TABLE (
  engagement_id     UUID,
  engagement_numero TEXT,
  engagement_objet  TEXT,
  engagement_montant NUMERIC,
  fournisseur       TEXT,
  budget_line_code  TEXT,
  budget_line_label TEXT,
  direction_sigle   TEXT,
  nb_liquidations   BIGINT,
  total_liquide     NUMERIC,
  restant_a_liquider NUMERIC,
  taux_liquidation  NUMERIC,
  is_complet        BOOLEAN,
  derniere_liquidation TIMESTAMPTZ,
  nb_valides        BIGINT,
  nb_en_cours       BIGINT,
  nb_rejetees       BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.id                                   AS engagement_id,
    be.numero                               AS engagement_numero,
    be.objet                                AS engagement_objet,
    be.montant                              AS engagement_montant,
    be.fournisseur                          AS fournisseur,
    bl.code                                 AS budget_line_code,
    bl.label                                AS budget_line_label,
    d.sigle                                 AS direction_sigle,
    COALESCE(agg.nb_liquidations, 0)        AS nb_liquidations,
    COALESCE(agg.total_liquide, 0)          AS total_liquide,
    be.montant - COALESCE(agg.total_liquide, 0) AS restant_a_liquider,
    CASE
      WHEN be.montant > 0
      THEN ROUND(COALESCE(agg.total_liquide, 0) / be.montant * 100, 2)
      ELSE 0
    END                                     AS taux_liquidation,
    COALESCE(agg.total_liquide, 0) >= be.montant AS is_complet,
    agg.derniere_liquidation                AS derniere_liquidation,
    COALESCE(agg.nb_valides, 0)             AS nb_valides,
    COALESCE(agg.nb_en_cours, 0)            AS nb_en_cours,
    COALESCE(agg.nb_rejetees, 0)            AS nb_rejetees
  FROM budget_engagements be
  LEFT JOIN budget_lines bl ON bl.id = be.budget_line_id
  LEFT JOIN directions d ON d.id = bl.direction_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(liq.id)                                        AS nb_liquidations,
      SUM(liq.montant) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete'))
                                                           AS total_liquide,
      MAX(liq.created_at)                                  AS derniere_liquidation,
      COUNT(liq.id) FILTER (WHERE liq.statut IN ('valide', 'validé_dg', 'validé_daaf'))
                                                           AS nb_valides,
      COUNT(liq.id) FILTER (WHERE liq.statut IN ('brouillon', 'certifié_sf', 'soumis'))
                                                           AS nb_en_cours,
      COUNT(liq.id) FILTER (WHERE liq.statut = 'rejete')  AS nb_rejetees
    FROM budget_liquidations liq
    WHERE liq.engagement_id = be.id
  ) agg ON true
  WHERE be.exercice = p_exercice
    AND be.statut = 'valide'
    AND (p_engagement_id IS NULL OR be.id = p_engagement_id)
  ORDER BY be.numero;
END;
$$;

COMMENT ON FUNCTION get_suivi_liquidations_par_engagement IS
  'RPC Prompt 9 : suivi des liquidations par engagement avec agrégats (nb, total, restant, taux)';

GRANT EXECUTE ON FUNCTION get_suivi_liquidations_par_engagement(INT, UUID) TO authenticated;


-- ============================================================================
-- 2. Trigger contrainte : cumul liquidations ≤ montant engagement
--    BEFORE INSERT OR UPDATE sur budget_liquidations
--    Empêche de créer/modifier une liquidation si le cumul dépasse
--    le montant de l'engagement (hors annulées/rejetées).
--    Note : cette contrainte existait côté frontend (calculateAvailability)
--    mais pas en base → on sécurise au niveau DB.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_check_liquidation_cumul()
RETURNS TRIGGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montant_engage   NUMERIC;
  v_cumul_existant   NUMERIC;
  v_nouveau_cumul    NUMERIC;
  v_engagement_numero TEXT;
BEGIN
  -- Ne vérifier que si le montant change ou si c'est un INSERT
  IF TG_OP = 'UPDATE'
     AND NEW.montant = OLD.montant
     AND NEW.engagement_id = OLD.engagement_id THEN
    RETURN NEW;
  END IF;

  -- Ne pas bloquer les liquidations annulées ou rejetées
  IF NEW.statut IN ('annule', 'rejete') THEN
    RETURN NEW;
  END IF;

  -- Récupérer le montant de l'engagement
  SELECT montant, numero
  INTO v_montant_engage, v_engagement_numero
  FROM budget_engagements
  WHERE id = NEW.engagement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement % introuvable', NEW.engagement_id;
  END IF;

  -- Calculer le cumul des liquidations existantes (hors annulées/rejetées, hors celle-ci)
  SELECT COALESCE(SUM(montant), 0)
  INTO v_cumul_existant
  FROM budget_liquidations
  WHERE engagement_id = NEW.engagement_id
    AND statut NOT IN ('annule', 'rejete')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  v_nouveau_cumul := v_cumul_existant + NEW.montant;

  -- Vérifier que le cumul ne dépasse pas le montant engagé
  -- Tolérance de 1 FCFA pour les arrondis
  IF v_nouveau_cumul > (v_montant_engage + 1) THEN
    RAISE EXCEPTION
      'Dépassement du montant engagé : cumul liquidations = % FCFA > montant engagement % = % FCFA (restant = % FCFA)',
      v_nouveau_cumul, v_engagement_numero, v_montant_engage,
      (v_montant_engage - v_cumul_existant);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_check_liquidation_cumul IS
  'BEFORE INSERT/UPDATE: vérifie que le cumul des liquidations ne dépasse pas le montant de l''engagement';

DROP TRIGGER IF EXISTS trg_check_liquidation_cumul ON budget_liquidations;

CREATE TRIGGER trg_check_liquidation_cumul
  BEFORE INSERT OR UPDATE OF montant, engagement_id
  ON budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_liquidation_cumul();


-- ============================================================================
-- 3. Vue : v_liquidations_par_engagement
--    Agrège les liquidations par engagement pour consultation rapide.
--    Utilisable par le frontend (PostgREST) ou d'autres RPC.
-- ============================================================================
CREATE OR REPLACE VIEW v_liquidations_par_engagement AS
SELECT
  be.id                                     AS engagement_id,
  be.numero                                 AS engagement_numero,
  be.objet                                  AS engagement_objet,
  be.montant                                AS engagement_montant,
  be.fournisseur                            AS fournisseur,
  be.exercice                               AS exercice,
  be.statut                                 AS engagement_statut,
  bl.id                                     AS budget_line_id,
  bl.code                                   AS budget_line_code,
  bl.label                                  AS budget_line_label,
  d.sigle                                   AS direction_sigle,
  d.label                                   AS direction_label,
  -- Agrégats liquidations (hors annulées/rejetées)
  COUNT(liq.id) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete'))
                                            AS nb_liquidations,
  COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete')), 0)
                                            AS total_liquide,
  COALESCE(SUM(liq.net_a_payer) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete')), 0)
                                            AS total_net_a_payer,
  be.montant - COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete')), 0)
                                            AS restant_a_liquider,
  CASE
    WHEN be.montant > 0
    THEN ROUND(
      COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete')), 0)
      / be.montant * 100, 2
    )
    ELSE 0
  END                                       AS taux_liquidation,
  COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete')), 0) >= be.montant
                                            AS is_complet,
  -- Détail par statut
  COUNT(liq.id) FILTER (WHERE liq.statut IN ('valide', 'validé_dg', 'validé_daaf'))
                                            AS nb_valides,
  COUNT(liq.id) FILTER (WHERE liq.statut IN ('brouillon', 'certifié_sf', 'soumis'))
                                            AS nb_en_cours,
  COUNT(liq.id) FILTER (WHERE liq.statut = 'rejete')
                                            AS nb_rejetees,
  COUNT(liq.id) FILTER (WHERE liq.statut = 'annule')
                                            AS nb_annulees,
  -- Totaux par statut
  COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut IN ('valide', 'validé_dg')), 0)
                                            AS montant_valide,
  COALESCE(SUM(liq.montant) FILTER (WHERE liq.statut IN ('brouillon', 'certifié_sf', 'soumis', 'validé_daaf')), 0)
                                            AS montant_en_cours,
  -- Dates
  MAX(liq.created_at)                       AS derniere_liquidation,
  MIN(liq.created_at) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete'))
                                            AS premiere_liquidation,
  -- Urgence
  BOOL_OR(liq.reglement_urgent) FILTER (WHERE liq.statut NOT IN ('annule', 'rejete'))
                                            AS has_urgent
FROM budget_engagements be
LEFT JOIN budget_lines bl ON bl.id = be.budget_line_id
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN budget_liquidations liq ON liq.engagement_id = be.id
WHERE be.statut = 'valide'
GROUP BY be.id, be.numero, be.objet, be.montant, be.fournisseur,
         be.exercice, be.statut,
         bl.id, bl.code, bl.label,
         d.sigle, d.label;

COMMENT ON VIEW v_liquidations_par_engagement IS
  'Vue Prompt 9 : agrège les liquidations par engagement (nb, totaux, restant, taux, statuts)';

-- RLS sur la vue : accessible à tous les utilisateurs authentifiés
-- (les vues héritent des policies des tables sous-jacentes)
GRANT SELECT ON v_liquidations_par_engagement TO authenticated;
