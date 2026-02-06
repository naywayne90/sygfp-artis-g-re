-- Migration: Dashboard par Direction
-- Date: 2026-02-05
-- Description: Vue générique, RPC KPIs et alertes pour dashboards par direction

-- ============================================
-- 1. Vue générique dashboard par direction
-- ============================================
CREATE OR REPLACE VIEW v_dashboard_direction AS
SELECT
  d.id as direction_id,
  d.code as direction_code,
  d.nom as direction_nom,
  e.annee as exercice,

  -- Compteurs Notes SEF
  COUNT(DISTINCT CASE WHEN ns.statut = 'brouillon' THEN ns.id END) as sef_brouillon,
  COUNT(DISTINCT CASE WHEN ns.statut = 'soumis' THEN ns.id END) as sef_soumis,
  COUNT(DISTINCT CASE WHEN ns.statut = 'valide' THEN ns.id END) as sef_valide,
  COUNT(DISTINCT CASE WHEN ns.statut = 'rejete' THEN ns.id END) as sef_rejete,
  COUNT(DISTINCT ns.id) as sef_total,

  -- Compteurs Engagements
  COUNT(DISTINCT CASE WHEN eng.statut = 'brouillon' THEN eng.id END) as eng_brouillon,
  COUNT(DISTINCT CASE WHEN eng.statut IN ('soumis', 'en_cours', 'en_attente_visa_cb', 'en_attente_visa_daaf', 'en_attente_signature_dg') THEN eng.id END) as eng_en_cours,
  COUNT(DISTINCT CASE WHEN eng.statut = 'valide' THEN eng.id END) as eng_valide,
  COUNT(DISTINCT eng.id) as eng_total,

  -- Compteurs Liquidations
  COUNT(DISTINCT CASE WHEN liq.statut IN ('soumis', 'en_cours', 'en_attente_cb', 'en_attente_daaf', 'en_attente_dg') THEN liq.id END) as liq_en_cours,
  COUNT(DISTINCT CASE WHEN liq.statut = 'valide' THEN liq.id END) as liq_valide,
  COUNT(DISTINCT liq.id) as liq_total,

  -- Compteurs Ordonnancements
  COUNT(DISTINCT CASE WHEN ord.statut IN ('soumis', 'en_cours', 'en_attente_cb', 'en_attente_daaf', 'en_attente_dg') THEN ord.id END) as ordo_en_cours,
  COUNT(DISTINCT CASE WHEN ord.statut = 'valide' THEN ord.id END) as ordo_valide,
  COUNT(DISTINCT ord.id) as ordo_total,

  -- Montants
  COALESCE(SUM(DISTINCT eng.montant_ht), 0) as total_engagements,
  COALESCE(SUM(DISTINCT liq.montant_ttc), 0) as total_liquidations,
  COALESCE(SUM(DISTINCT ord.montant), 0) as total_ordonnancements

FROM directions d
CROSS JOIN exercices e
LEFT JOIN notes_sef ns ON ns.direction_id = d.id AND ns.exercice = e.annee
LEFT JOIN engagements eng ON eng.direction_id = d.id AND eng.exercice = e.annee
LEFT JOIN liquidations liq ON liq.engagement_id = eng.id
LEFT JOIN ordonnancements ord ON ord.liquidation_id = liq.id
WHERE d.actif = true
GROUP BY d.id, d.code, d.nom, e.annee;

-- Commentaire
COMMENT ON VIEW v_dashboard_direction IS 'Vue agrégée des KPIs par direction et exercice pour les dashboards';

-- ============================================
-- 2. RPC pour KPIs détaillés par direction
-- ============================================
CREATE OR REPLACE FUNCTION get_direction_kpis(
  p_direction_id UUID,
  p_exercice INTEGER
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_direction_code TEXT;
  v_direction_nom TEXT;
BEGIN
  -- Récupérer les infos de la direction
  SELECT code, nom INTO v_direction_code, v_direction_nom
  FROM directions WHERE id = p_direction_id;

  SELECT json_build_object(
    'direction_id', p_direction_id,
    'direction_code', v_direction_code,
    'direction_nom', v_direction_nom,
    'exercice', p_exercice,
    'notes_sef', json_build_object(
      'total', COUNT(DISTINCT ns.id),
      'brouillon', COUNT(DISTINCT CASE WHEN ns.statut = 'brouillon' THEN ns.id END),
      'soumis', COUNT(DISTINCT CASE WHEN ns.statut = 'soumis' THEN ns.id END),
      'valide', COUNT(DISTINCT CASE WHEN ns.statut = 'valide' THEN ns.id END),
      'rejete', COUNT(DISTINCT CASE WHEN ns.statut = 'rejete' THEN ns.id END)
    ),
    'engagements', json_build_object(
      'total', COUNT(DISTINCT eng.id),
      'montant_total', COALESCE(SUM(DISTINCT eng.montant_ht), 0),
      'en_cours', COUNT(DISTINCT CASE WHEN eng.statut IN ('soumis', 'en_cours', 'en_attente_visa_cb', 'en_attente_visa_daaf', 'en_attente_signature_dg') THEN eng.id END),
      'valide', COUNT(DISTINCT CASE WHEN eng.statut = 'valide' THEN eng.id END)
    ),
    'liquidations', json_build_object(
      'total', COUNT(DISTINCT liq.id),
      'montant_total', COALESCE(SUM(DISTINCT liq.montant_ttc), 0),
      'en_cours', COUNT(DISTINCT CASE WHEN liq.statut IN ('soumis', 'en_cours', 'en_attente_cb', 'en_attente_daaf', 'en_attente_dg') THEN liq.id END),
      'valide', COUNT(DISTINCT CASE WHEN liq.statut = 'valide' THEN liq.id END)
    ),
    'ordonnancements', json_build_object(
      'total', COUNT(DISTINCT ord.id),
      'montant_total', COALESCE(SUM(DISTINCT ord.montant), 0),
      'en_cours', COUNT(DISTINCT CASE WHEN ord.statut IN ('soumis', 'en_cours', 'en_attente_cb', 'en_attente_daaf', 'en_attente_dg') THEN ord.id END),
      'valide', COUNT(DISTINCT CASE WHEN ord.statut = 'valide' THEN ord.id END)
    ),
    'taux_execution', CASE
      WHEN COUNT(DISTINCT ns.id) > 0
      THEN ROUND((COUNT(DISTINCT CASE WHEN ord.statut = 'valide' THEN ord.id END)::DECIMAL / COUNT(DISTINCT ns.id)) * 100, 2)
      ELSE 0
    END,
    'budget', json_build_object(
      'dotation_initiale', COALESCE((
        SELECT SUM(sb.montant_initial)
        FROM structure_budgetaire sb
        WHERE sb.direction_id = p_direction_id AND sb.exercice = p_exercice
      ), 0),
      'credits_disponibles', COALESCE((
        SELECT SUM(sb.montant_disponible)
        FROM structure_budgetaire sb
        WHERE sb.direction_id = p_direction_id AND sb.exercice = p_exercice
      ), 0)
    )
  ) INTO result
  FROM notes_sef ns
  LEFT JOIN engagements eng ON eng.note_sef_id = ns.id
  LEFT JOIN liquidations liq ON liq.engagement_id = eng.id
  LEFT JOIN ordonnancements ord ON ord.liquidation_id = liq.id
  WHERE ns.direction_id = p_direction_id
    AND ns.exercice = p_exercice;

  -- Si aucun résultat, retourner une structure vide
  IF result IS NULL THEN
    result := json_build_object(
      'direction_id', p_direction_id,
      'direction_code', v_direction_code,
      'direction_nom', v_direction_nom,
      'exercice', p_exercice,
      'notes_sef', json_build_object('total', 0, 'brouillon', 0, 'soumis', 0, 'valide', 0, 'rejete', 0),
      'engagements', json_build_object('total', 0, 'montant_total', 0, 'en_cours', 0, 'valide', 0),
      'liquidations', json_build_object('total', 0, 'montant_total', 0, 'en_cours', 0, 'valide', 0),
      'ordonnancements', json_build_object('total', 0, 'montant_total', 0, 'en_cours', 0, 'valide', 0),
      'taux_execution', 0,
      'budget', json_build_object('dotation_initiale', 0, 'credits_disponibles', 0)
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION get_direction_kpis(UUID, INTEGER) IS 'Retourne les KPIs détaillés pour une direction et un exercice';

-- ============================================
-- 3. Vue alertes par direction
-- ============================================
CREATE OR REPLACE VIEW v_alertes_direction AS
-- Notes SEF en attente de validation
SELECT
  d.id as direction_id,
  d.code as direction_code,
  'sef_en_attente'::text as type_alerte,
  'warning'::text as niveau,
  COUNT(*)::integer as nombre,
  'Notes SEF en attente de validation'::text as message
FROM directions d
JOIN notes_sef ns ON ns.direction_id = d.id AND ns.statut = 'soumis'
WHERE d.actif = true
GROUP BY d.id, d.code
HAVING COUNT(*) > 0

UNION ALL

-- Engagements urgents (> 7 jours)
SELECT
  d.id as direction_id,
  d.code as direction_code,
  'engagement_urgent'::text as type_alerte,
  'danger'::text as niveau,
  COUNT(*)::integer as nombre,
  'Engagements urgents à traiter (> 7 jours)'::text as message
FROM directions d
JOIN engagements eng ON eng.direction_id = d.id
  AND eng.statut IN ('soumis', 'en_cours', 'en_attente_visa_cb', 'en_attente_visa_daaf')
  AND eng.created_at < NOW() - INTERVAL '7 days'
WHERE d.actif = true
GROUP BY d.id, d.code
HAVING COUNT(*) > 0

UNION ALL

-- Liquidations en attente
SELECT
  d.id as direction_id,
  d.code as direction_code,
  'liquidation_en_attente'::text as type_alerte,
  'info'::text as niveau,
  COUNT(*)::integer as nombre,
  'Liquidations en attente de validation'::text as message
FROM directions d
JOIN engagements eng ON eng.direction_id = d.id
JOIN liquidations liq ON liq.engagement_id = eng.id
  AND liq.statut IN ('soumis', 'en_cours', 'en_attente_cb')
WHERE d.actif = true
GROUP BY d.id, d.code
HAVING COUNT(*) > 0

UNION ALL

-- Ordonnancements en attente de signature
SELECT
  d.id as direction_id,
  d.code as direction_code,
  'ordo_en_attente_signature'::text as type_alerte,
  'warning'::text as niveau,
  COUNT(*)::integer as nombre,
  'Ordonnancements en attente de signature'::text as message
FROM directions d
JOIN engagements eng ON eng.direction_id = d.id
JOIN liquidations liq ON liq.engagement_id = eng.id
JOIN ordonnancements ord ON ord.liquidation_id = liq.id
  AND ord.statut IN ('en_attente_daaf', 'en_attente_dg')
WHERE d.actif = true
GROUP BY d.id, d.code
HAVING COUNT(*) > 0;

-- Commentaire
COMMENT ON VIEW v_alertes_direction IS 'Alertes et notifications par direction pour les dashboards';

-- ============================================
-- 4. RPC pour évolution mensuelle par direction
-- ============================================
CREATE OR REPLACE FUNCTION get_evolution_mensuelle_direction(
  p_direction_id UUID,
  p_exercice INTEGER
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'mois', m.mois,
      'mois_nom', TO_CHAR(DATE_TRUNC('month', MAKE_DATE(p_exercice, m.mois, 1)), 'Mon'),
      'engagements', COALESCE((
        SELECT SUM(eng.montant_ht)
        FROM engagements eng
        WHERE eng.direction_id = p_direction_id
          AND eng.exercice = p_exercice
          AND EXTRACT(MONTH FROM eng.created_at) = m.mois
      ), 0),
      'liquidations', COALESCE((
        SELECT SUM(liq.montant_ttc)
        FROM liquidations liq
        JOIN engagements eng ON eng.id = liq.engagement_id
        WHERE eng.direction_id = p_direction_id
          AND eng.exercice = p_exercice
          AND EXTRACT(MONTH FROM liq.created_at) = m.mois
      ), 0),
      'ordonnancements', COALESCE((
        SELECT SUM(ord.montant)
        FROM ordonnancements ord
        JOIN liquidations liq ON liq.id = ord.liquidation_id
        JOIN engagements eng ON eng.id = liq.engagement_id
        WHERE eng.direction_id = p_direction_id
          AND eng.exercice = p_exercice
          AND EXTRACT(MONTH FROM ord.created_at) = m.mois
      ), 0)
    ) ORDER BY m.mois
  ) INTO result
  FROM generate_series(1, 12) AS m(mois);

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION get_evolution_mensuelle_direction(UUID, INTEGER) IS 'Retourne l''évolution mensuelle des montants pour une direction';

-- ============================================
-- 5. RPC pour dossiers récents par direction
-- ============================================
CREATE OR REPLACE FUNCTION get_dossiers_recents_direction(
  p_direction_id UUID,
  p_exercice INTEGER,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      ns.id,
      ns.numero as numero_dossier,
      ns.objet,
      ns.statut,
      ns.montant_estime,
      ns.created_at,
      COALESCE(eng.numero, NULL) as numero_engagement,
      COALESCE(eng.statut, NULL) as statut_engagement,
      CASE
        WHEN ord.statut = 'valide' THEN 'ordonnance'
        WHEN liq.id IS NOT NULL THEN 'liquidation'
        WHEN eng.id IS NOT NULL THEN 'engagement'
        WHEN ns.statut = 'valide' THEN 'sef_valide'
        ELSE 'sef_' || ns.statut
      END as etape_actuelle
    FROM notes_sef ns
    LEFT JOIN engagements eng ON eng.note_sef_id = ns.id
    LEFT JOIN liquidations liq ON liq.engagement_id = eng.id
    LEFT JOIN ordonnancements ord ON ord.liquidation_id = liq.id
    WHERE ns.direction_id = p_direction_id
      AND ns.exercice = p_exercice
    ORDER BY ns.updated_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION get_dossiers_recents_direction(UUID, INTEGER, INTEGER) IS 'Retourne les dossiers récents pour une direction';

-- ============================================
-- 6. Grants pour accès API
-- ============================================
GRANT SELECT ON v_dashboard_direction TO authenticated;
GRANT SELECT ON v_alertes_direction TO authenticated;
GRANT EXECUTE ON FUNCTION get_direction_kpis(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_evolution_mensuelle_direction(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dossiers_recents_direction(UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================
-- 7. Index pour performances
-- ============================================
-- Index sur notes_sef pour filtrage direction/exercice
CREATE INDEX IF NOT EXISTS idx_notes_sef_direction_exercice
ON notes_sef(direction_id, exercice);

-- Index sur engagements pour filtrage direction/exercice
CREATE INDEX IF NOT EXISTS idx_engagements_direction_exercice
ON engagements(direction_id, exercice);

-- Index sur created_at pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_engagements_created_at
ON engagements(created_at);

CREATE INDEX IF NOT EXISTS idx_liquidations_created_at
ON liquidations(created_at);

CREATE INDEX IF NOT EXISTS idx_ordonnancements_created_at
ON ordonnancements(created_at);
