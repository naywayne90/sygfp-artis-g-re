-- =====================================================
-- Migration : Dashboard DMG avec Alertes
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Objectif : Dashboard spécifique DMG avec alertes et métriques
-- =====================================================

-- =====================================================
-- TABLE : dmg_alert_config
-- Configuration des seuils d'alerte
-- =====================================================
CREATE TABLE IF NOT EXISTS dmg_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL UNIQUE,
  seuil_warning INTEGER NOT NULL,
  seuil_critical INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les seuils par défaut
INSERT INTO dmg_alert_config (alert_type, seuil_warning, seuil_critical, description) VALUES
  ('liquidation_urgente_heures', 24, 48, 'Heures max pour traiter une liquidation urgente'),
  ('engagement_attente_jours', 7, 14, 'Jours max pour liquider un engagement'),
  ('reglement_retard_jours', 3, 7, 'Jours de retard acceptable pour un règlement')
ON CONFLICT (alert_type) DO NOTHING;

-- =====================================================
-- VUE : v_dashboard_dmg
-- Métriques principales pour le dashboard DMG
-- =====================================================
CREATE OR REPLACE VIEW v_dashboard_dmg AS
WITH urgentes AS (
  SELECT COUNT(*) as count, COALESCE(SUM(montant), 0) as montant
  FROM budget_liquidations
  WHERE reglement_urgent = true
  AND statut NOT IN ('regle', 'annule')
),
en_attente AS (
  SELECT COUNT(*) as count, COALESCE(SUM(montant), 0) as montant
  FROM budget_liquidations
  WHERE statut IN ('en_attente', 'soumis', 'valide')
),
engagements_a_liquider AS (
  SELECT COUNT(*) as count, COALESCE(SUM(e.montant), 0) as montant
  FROM budget_engagements e
  WHERE e.statut = 'valide'
  AND NOT EXISTS (
    SELECT 1 FROM budget_liquidations l WHERE l.engagement_id = e.id
  )
),
top_fournisseurs AS (
  SELECT
    e.fournisseur,
    COUNT(*) as nb_engagements,
    SUM(e.montant) as montant_total
  FROM budget_engagements e
  WHERE e.statut = 'valide'
  AND NOT EXISTS (
    SELECT 1 FROM budget_liquidations l WHERE l.engagement_id = e.id AND l.statut = 'regle'
  )
  GROUP BY e.fournisseur
  ORDER BY montant_total DESC
  LIMIT 5
)
SELECT
  (SELECT count FROM urgentes) as liquidations_urgentes_count,
  (SELECT montant FROM urgentes) as liquidations_urgentes_montant,
  (SELECT count FROM en_attente) as liquidations_attente_count,
  (SELECT montant FROM en_attente) as liquidations_attente_montant,
  (SELECT count FROM engagements_a_liquider) as engagements_a_liquider_count,
  (SELECT montant FROM engagements_a_liquider) as engagements_a_liquider_montant,
  (SELECT jsonb_agg(jsonb_build_object(
    'fournisseur', fournisseur,
    'nb_engagements', nb_engagements,
    'montant_total', montant_total,
    'montant_formate', TO_CHAR(montant_total, 'FM999 999 999 999')
  )) FROM top_fournisseurs) as top_fournisseurs;

-- =====================================================
-- VUE : v_alertes_dmg
-- Alertes actives pour le dashboard DMG
-- =====================================================
CREATE OR REPLACE VIEW v_alertes_dmg AS
SELECT * FROM (
  WITH seuils AS (
    SELECT alert_type, seuil_warning, seuil_critical
    FROM dmg_alert_config WHERE is_active = true
  ),
  -- Liquidations urgentes non traitées > 24h
  alertes_urgentes AS (
    SELECT
      l.id as entity_id,
      'liquidation_urgente' as alert_type,
      l.numero as reference,
      COALESCE(e.fournisseur, 'Non spécifié') as fournisseur,
      l.montant,
      l.reglement_urgent_date as date_debut,
      EXTRACT(EPOCH FROM (NOW() - l.reglement_urgent_date))/3600 as heures_attente,
      CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - l.reglement_urgent_date))/3600 >=
             (SELECT seuil_critical FROM seuils WHERE alert_type = 'liquidation_urgente_heures')
        THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - l.reglement_urgent_date))/3600 >=
             (SELECT seuil_warning FROM seuils WHERE alert_type = 'liquidation_urgente_heures')
        THEN 'warning'
        ELSE 'info'
      END as severite,
      'Liquidation urgente en attente depuis ' ||
        ROUND(EXTRACT(EPOCH FROM (NOW() - l.reglement_urgent_date))/3600)::text || 'h' as message
    FROM budget_liquidations l
    LEFT JOIN budget_engagements e ON e.id = l.engagement_id
    WHERE l.reglement_urgent = true
    AND l.statut NOT IN ('regle', 'annule')
  ),
  -- Engagements en attente de liquidation > 7 jours
  alertes_engagements AS (
    SELECT
      e.id as entity_id,
      'engagement_attente' as alert_type,
      e.numero as reference,
      COALESCE(e.fournisseur, 'Non spécifié') as fournisseur,
      e.montant,
      e.date_engagement::timestamptz as date_debut,
      EXTRACT(DAY FROM (NOW() - e.date_engagement::timestamp)) as heures_attente,
      CASE
        WHEN EXTRACT(DAY FROM (NOW() - e.date_engagement::timestamp)) >=
             (SELECT seuil_critical FROM seuils WHERE alert_type = 'engagement_attente_jours')
        THEN 'critical'
        WHEN EXTRACT(DAY FROM (NOW() - e.date_engagement::timestamp)) >=
             (SELECT seuil_warning FROM seuils WHERE alert_type = 'engagement_attente_jours')
        THEN 'warning'
        ELSE 'info'
      END as severite,
      'Engagement en attente de liquidation depuis ' ||
        EXTRACT(DAY FROM (NOW() - e.date_engagement::timestamp))::text || ' jours' as message
    FROM budget_engagements e
    WHERE e.statut = 'valide'
    AND NOT EXISTS (SELECT 1 FROM budget_liquidations l WHERE l.engagement_id = e.id)
    AND EXTRACT(DAY FROM (NOW() - e.date_engagement::timestamp)) >=
        (SELECT seuil_warning FROM seuils WHERE alert_type = 'engagement_attente_jours')
  )
  SELECT * FROM alertes_urgentes WHERE severite IN ('warning', 'critical')
  UNION ALL
  SELECT * FROM alertes_engagements WHERE severite IN ('warning', 'critical')
) alertes
ORDER BY
  CASE severite WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
  heures_attente DESC;

-- =====================================================
-- FONCTION : get_dmg_dashboard_data
-- Retourne toutes les métriques du dashboard DMG en JSONB
-- =====================================================
CREATE OR REPLACE FUNCTION get_dmg_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
DECLARE
  v_result JSONB;
  v_kpis JSONB;
  v_alertes JSONB;
  v_evolution JSONB;
  v_top_fournisseurs JSONB;
BEGIN
  -- KPIs
  SELECT jsonb_build_object(
    'liquidations_urgentes', jsonb_build_object(
      'count', COALESCE(COUNT(*), 0),
      'montant', COALESCE(SUM(montant), 0),
      'montant_formate', TO_CHAR(COALESCE(SUM(montant), 0), 'FM999 999 999 999')
    )
  ) INTO v_kpis
  FROM budget_liquidations
  WHERE reglement_urgent = true AND statut NOT IN ('regle', 'annule');

  -- Ajouter liquidations en attente
  SELECT v_kpis || jsonb_build_object(
    'liquidations_attente', jsonb_build_object(
      'count', COALESCE(COUNT(*), 0),
      'montant', COALESCE(SUM(montant), 0),
      'montant_formate', TO_CHAR(COALESCE(SUM(montant), 0), 'FM999 999 999 999')
    )
  ) INTO v_kpis
  FROM budget_liquidations
  WHERE statut IN ('en_attente', 'soumis', 'valide');

  -- Ajouter engagements à liquider
  SELECT v_kpis || jsonb_build_object(
    'engagements_a_liquider', jsonb_build_object(
      'count', COALESCE(COUNT(*), 0),
      'montant', COALESCE(SUM(e.montant), 0),
      'montant_formate', TO_CHAR(COALESCE(SUM(e.montant), 0), 'FM999 999 999 999')
    )
  ) INTO v_kpis
  FROM budget_engagements e
  WHERE e.statut = 'valide'
  AND NOT EXISTS (SELECT 1 FROM budget_liquidations l WHERE l.engagement_id = e.id);

  -- Alertes actives
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'entity_id', entity_id,
    'type', alert_type,
    'reference', reference,
    'fournisseur', fournisseur,
    'montant', montant,
    'severite', severite,
    'message', message
  )), '[]'::jsonb) INTO v_alertes
  FROM v_alertes_dmg;

  -- Top 5 fournisseurs
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fournisseur', fournisseur,
    'nb_engagements', nb_engagements,
    'montant_total', montant_total,
    'montant_formate', TO_CHAR(montant_total, 'FM999 999 999 999')
  )), '[]'::jsonb) INTO v_top_fournisseurs
  FROM (
    SELECT
      e.fournisseur,
      COUNT(*) as nb_engagements,
      SUM(e.montant) as montant_total
    FROM budget_engagements e
    WHERE e.statut = 'valide'
    GROUP BY e.fournisseur
    ORDER BY montant_total DESC
    LIMIT 5
  ) sub;

  -- Évolution 30 jours (liquidations par jour)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', jour,
    'count', nb_liquidations,
    'montant', montant_jour
  ) ORDER BY jour), '[]'::jsonb) INTO v_evolution
  FROM (
    SELECT
      date_liquidation::date as jour,
      COUNT(*) as nb_liquidations,
      SUM(montant) as montant_jour
    FROM budget_liquidations
    WHERE date_liquidation >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date_liquidation::date
  ) sub;

  -- Assembler le résultat final
  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'alertes', v_alertes,
    'alertes_count', jsonb_array_length(v_alertes),
    'alertes_critical_count', (
      SELECT COUNT(*) FROM v_alertes_dmg WHERE severite = 'critical'
    ),
    'top_fournisseurs', v_top_fournisseurs,
    'evolution_30j', v_evolution,
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$func$;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT ON dmg_alert_config TO authenticated;
GRANT UPDATE ON dmg_alert_config TO authenticated;
GRANT SELECT ON v_dashboard_dmg TO authenticated;
GRANT SELECT ON v_alertes_dmg TO authenticated;
GRANT EXECUTE ON FUNCTION get_dmg_dashboard_data TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE dmg_alert_config IS 'Configuration des seuils d''alerte pour le dashboard DMG';
COMMENT ON VIEW v_dashboard_dmg IS 'Vue des métriques principales pour le dashboard DMG';
COMMENT ON VIEW v_alertes_dmg IS 'Vue des alertes actives pour le dashboard DMG';
COMMENT ON FUNCTION get_dmg_dashboard_data IS 'Retourne toutes les métriques du dashboard DMG en JSONB';
