-- =====================================================
-- Migration : Vues et fonctions Dashboard
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- =====================================================

-- Vue : KPIs principaux
CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM notes_sef WHERE statut = 'soumis' AND is_deleted = false) as notes_a_valider,
  (SELECT COUNT(*) FROM notes_sef WHERE statut = 'valide' AND is_deleted = false
   AND EXTRACT(MONTH FROM validated_at) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM validated_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as notes_validees_mois,
  (SELECT COALESCE(SUM(montant_estime), 0) FROM notes_sef WHERE statut = 'valide' AND is_deleted = false
   AND EXTRACT(MONTH FROM validated_at) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM validated_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as montant_valide_mois,
  (SELECT COUNT(*) FROM notes_sef WHERE statut = 'differe' AND is_deleted = false) as notes_differees,
  (SELECT COUNT(*) FROM notes_sef WHERE exercice = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AND is_deleted = false) as total_notes_annee;

-- Vue : Dossiers urgents (en attente > 48h)
CREATE OR REPLACE VIEW v_dossiers_urgents AS
SELECT
  ns.id,
  ns.numero as reference,
  ns.objet,
  d.sigle as direction_sigle,
  d.label as direction_label,
  ns.statut,
  ns.type_depense,
  ns.montant_estime,
  ns.created_at,
  ns.submitted_at,
  EXTRACT(EPOCH FROM (NOW() - COALESCE(ns.submitted_at, ns.created_at))) / 3600 as heures_attente,
  COALESCE(p.first_name || ' ' || p.last_name, 'Inconnu') as createur
FROM notes_sef ns
LEFT JOIN profiles p ON ns.created_by = p.id
LEFT JOIN directions d ON ns.direction_id = d.id
WHERE ns.statut IN ('soumis', 'a_valider')
AND ns.is_deleted = false
AND (NOW() - COALESCE(ns.submitted_at, ns.created_at)) > INTERVAL '48 hours'
ORDER BY heures_attente DESC
LIMIT 20;

-- Vue : Répartition par direction
CREATE OR REPLACE VIEW v_stats_par_direction AS
SELECT
  d.id as direction_id,
  COALESCE(d.sigle, d.label) as direction,
  d.label as direction_label,
  COUNT(*) as total_notes,
  COUNT(*) FILTER (WHERE ns.statut = 'valide') as validees,
  COUNT(*) FILTER (WHERE ns.statut IN ('soumis', 'a_valider')) as en_attente,
  COUNT(*) FILTER (WHERE ns.statut = 'rejete') as rejetees,
  COUNT(*) FILTER (WHERE ns.statut = 'differe') as differees,
  COALESCE(SUM(ns.montant_estime) FILTER (WHERE ns.statut = 'valide'), 0) as montant_valide
FROM notes_sef ns
JOIN directions d ON ns.direction_id = d.id
WHERE ns.exercice = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
AND ns.is_deleted = false
GROUP BY d.id, d.sigle, d.label
ORDER BY montant_valide DESC;

-- Vue : Statistiques par type de dépense
CREATE OR REPLACE VIEW v_stats_par_type_depense AS
SELECT
  type_depense,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'valide') as validees,
  COALESCE(SUM(montant_estime) FILTER (WHERE statut = 'valide'), 0) as montant_valide
FROM notes_sef
WHERE exercice = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
AND is_deleted = false
AND type_depense IS NOT NULL
GROUP BY type_depense
ORDER BY montant_valide DESC;

-- Vue : Activité récente
CREATE OR REPLACE VIEW v_activite_recente AS
SELECT
  ns.id,
  ns.numero as reference,
  ns.objet,
  ns.statut,
  ns.montant_estime,
  ns.updated_at,
  COALESCE(d.sigle, d.label) as direction,
  COALESCE(p.first_name || ' ' || p.last_name, 'Système') as dernier_acteur,
  CASE
    WHEN ns.validated_at IS NOT NULL AND ns.validated_at = ns.updated_at THEN 'validation'
    WHEN ns.rejected_at IS NOT NULL AND ns.rejected_at = ns.updated_at THEN 'rejet'
    WHEN ns.differe_at IS NOT NULL AND ns.differe_at = ns.updated_at THEN 'report'
    WHEN ns.submitted_at IS NOT NULL AND ns.submitted_at = ns.updated_at THEN 'soumission'
    ELSE 'modification'
  END as derniere_action
FROM notes_sef ns
LEFT JOIN directions d ON ns.direction_id = d.id
LEFT JOIN profiles p ON COALESCE(ns.validated_by, ns.rejected_by, ns.differe_by, ns.submitted_by, ns.created_by) = p.id
WHERE ns.is_deleted = false
ORDER BY ns.updated_at DESC
LIMIT 50;

-- Fonction : Données complètes du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(p_exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_kpis JSONB;
  v_urgents JSONB;
  v_par_direction JSONB;
  v_repartition_statuts JSONB;
  v_par_type_depense JSONB;
BEGIN
  -- KPIs
  SELECT jsonb_build_object(
    'notes_a_valider', (SELECT COUNT(*) FROM notes_sef WHERE statut IN ('soumis', 'a_valider') AND is_deleted = false AND exercice = p_exercice),
    'notes_validees_mois', (SELECT COUNT(*) FROM notes_sef WHERE statut = 'valide' AND is_deleted = false
      AND EXTRACT(YEAR FROM validated_at) = p_exercice
      AND EXTRACT(MONTH FROM validated_at) = EXTRACT(MONTH FROM CURRENT_DATE)),
    'montant_valide_mois', (SELECT COALESCE(SUM(montant_estime), 0) FROM notes_sef WHERE statut = 'valide' AND is_deleted = false
      AND EXTRACT(YEAR FROM validated_at) = p_exercice
      AND EXTRACT(MONTH FROM validated_at) = EXTRACT(MONTH FROM CURRENT_DATE)),
    'notes_differees', (SELECT COUNT(*) FROM notes_sef WHERE statut = 'differe' AND is_deleted = false AND exercice = p_exercice),
    'notes_rejetees', (SELECT COUNT(*) FROM notes_sef WHERE statut = 'rejete' AND is_deleted = false AND exercice = p_exercice),
    'total_notes_exercice', (SELECT COUNT(*) FROM notes_sef WHERE exercice = p_exercice AND is_deleted = false),
    'montant_total_valide', (SELECT COALESCE(SUM(montant_estime), 0) FROM notes_sef WHERE statut = 'valide' AND is_deleted = false AND exercice = p_exercice)
  ) INTO v_kpis;

  -- Dossiers urgents (en attente > 48h) - using subquery to avoid ORDER BY issue
  SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb) INTO v_urgents
  FROM (
    SELECT
      ns.id,
      ns.numero as reference,
      ns.objet,
      COALESCE(d.sigle, d.label) as direction,
      ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(ns.submitted_at, ns.created_at))) / 3600) as heures_attente,
      COALESCE(p.first_name || ' ' || p.last_name, 'Inconnu') as createur,
      ns.montant_estime as montant
    FROM notes_sef ns
    LEFT JOIN profiles p ON ns.created_by = p.id
    LEFT JOIN directions d ON ns.direction_id = d.id
    WHERE ns.statut IN ('soumis', 'a_valider')
    AND ns.is_deleted = false
    AND ns.exercice = p_exercice
    AND (NOW() - COALESCE(ns.submitted_at, ns.created_at)) > INTERVAL '48 hours'
    ORDER BY (NOW() - COALESCE(ns.submitted_at, ns.created_at)) DESC
    LIMIT 10
  ) u;

  -- Stats par direction - using subquery
  SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_par_direction
  FROM (
    SELECT
      d.id as direction_id,
      COALESCE(d.sigle, d.label) as direction,
      d.label as direction_label,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ns.statut = 'valide') as validees,
      COUNT(*) FILTER (WHERE ns.statut IN ('soumis', 'a_valider')) as en_attente,
      COUNT(*) FILTER (WHERE ns.statut = 'rejete') as rejetees,
      COALESCE(SUM(ns.montant_estime) FILTER (WHERE ns.statut = 'valide'), 0) as montant_valide
    FROM notes_sef ns
    JOIN directions d ON ns.direction_id = d.id
    WHERE ns.exercice = p_exercice AND ns.is_deleted = false
    GROUP BY d.id, d.sigle, d.label
    ORDER BY COALESCE(SUM(ns.montant_estime) FILTER (WHERE ns.statut = 'valide'), 0) DESC
  ) s;

  -- Répartition par statut
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'statut', statut,
    'count', count,
    'montant', montant
  )), '[]'::jsonb) INTO v_repartition_statuts
  FROM (
    SELECT statut, COUNT(*) as count, COALESCE(SUM(montant_estime), 0) as montant
    FROM notes_sef
    WHERE exercice = p_exercice AND is_deleted = false
    GROUP BY statut
    ORDER BY count DESC
  ) s;

  -- Par type de dépense
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', type_depense,
    'count', count,
    'montant', montant
  )), '[]'::jsonb) INTO v_par_type_depense
  FROM (
    SELECT type_depense, COUNT(*) as count, COALESCE(SUM(montant_estime), 0) as montant
    FROM notes_sef
    WHERE exercice = p_exercice AND is_deleted = false AND type_depense IS NOT NULL
    GROUP BY type_depense
    ORDER BY montant DESC
  ) t;

  RETURN jsonb_build_object(
    'kpis', v_kpis,
    'dossiers_urgents', v_urgents,
    'stats_direction', v_par_direction,
    'repartition_statuts', v_repartition_statuts,
    'par_type_depense', v_par_type_depense,
    'exercice', p_exercice,
    'generated_at', NOW()
  );
END;
$$;

-- Fonction : Evolution mensuelle
CREATE OR REPLACE FUNCTION get_evolution_mensuelle(p_exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'mois', mois,
      'mois_label', mois_label,
      'total', total,
      'valides', valides,
      'rejetes', rejetes,
      'montant_valide', montant_valide,
      'montant_total', montant_total
    ) ORDER BY mois), '[]'::jsonb)
    FROM (
      SELECT
        EXTRACT(MONTH FROM created_at)::INTEGER as mois,
        TO_CHAR(date_trunc('month', created_at), 'Mon') as mois_label,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'valide') as valides,
        COUNT(*) FILTER (WHERE statut = 'rejete') as rejetes,
        COALESCE(SUM(montant_estime) FILTER (WHERE statut = 'valide'), 0) as montant_valide,
        COALESCE(SUM(montant_estime), 0) as montant_total
      FROM notes_sef
      WHERE exercice = p_exercice AND is_deleted = false
      GROUP BY EXTRACT(MONTH FROM created_at), date_trunc('month', created_at)
    ) m
  );
END;
$$;

-- Fonction : Statistiques par utilisateur (pour admin)
CREATE OR REPLACE FUNCTION get_stats_utilisateurs(p_exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'user_id', user_id,
      'nom_complet', nom_complet,
      'notes_creees', notes_creees,
      'notes_validees', notes_validees,
      'montant_valide', montant_valide
    ) ORDER BY montant_valide DESC), '[]'::jsonb)
    FROM (
      SELECT
        p.id as user_id,
        COALESCE(p.first_name || ' ' || p.last_name, 'Inconnu') as nom_complet,
        COUNT(*) FILTER (WHERE ns.created_by = p.id) as notes_creees,
        COUNT(*) FILTER (WHERE ns.validated_by = p.id) as notes_validees,
        COALESCE(SUM(ns.montant_estime) FILTER (WHERE ns.validated_by = p.id AND ns.statut = 'valide'), 0) as montant_valide
      FROM profiles p
      LEFT JOIN notes_sef ns ON (ns.created_by = p.id OR ns.validated_by = p.id)
        AND ns.exercice = p_exercice AND ns.is_deleted = false
      GROUP BY p.id, p.first_name, p.last_name
      HAVING COUNT(*) FILTER (WHERE ns.created_by = p.id) > 0 OR COUNT(*) FILTER (WHERE ns.validated_by = p.id) > 0
    ) u
    LIMIT 50
  );
END;
$$;

-- Fonction : Délai moyen de traitement
CREATE OR REPLACE FUNCTION get_delai_moyen_traitement(p_exercice INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN jsonb_build_object(
    'delai_moyen_validation_heures', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (validated_at - submitted_at)) / 3600)::numeric, 1)
      FROM notes_sef
      WHERE statut = 'valide'
      AND exercice = p_exercice
      AND is_deleted = false
      AND validated_at IS NOT NULL
      AND submitted_at IS NOT NULL
    ),
    'delai_moyen_soumission_heures', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (submitted_at - created_at)) / 3600)::numeric, 1)
      FROM notes_sef
      WHERE submitted_at IS NOT NULL
      AND exercice = p_exercice
      AND is_deleted = false
    ),
    'notes_traitees_24h', (
      SELECT COUNT(*)
      FROM notes_sef
      WHERE statut = 'valide'
      AND exercice = p_exercice
      AND is_deleted = false
      AND validated_at IS NOT NULL
      AND submitted_at IS NOT NULL
      AND EXTRACT(EPOCH FROM (validated_at - submitted_at)) / 3600 <= 24
    ),
    'notes_traitees_48h', (
      SELECT COUNT(*)
      FROM notes_sef
      WHERE statut = 'valide'
      AND exercice = p_exercice
      AND is_deleted = false
      AND validated_at IS NOT NULL
      AND submitted_at IS NOT NULL
      AND EXTRACT(EPOCH FROM (validated_at - submitted_at)) / 3600 <= 48
    ),
    'total_validees', (
      SELECT COUNT(*)
      FROM notes_sef
      WHERE statut = 'valide'
      AND exercice = p_exercice
      AND is_deleted = false
    )
  );
END;
$$;

-- Grant permissions
GRANT SELECT ON v_dashboard_kpis TO authenticated;
GRANT SELECT ON v_dossiers_urgents TO authenticated;
GRANT SELECT ON v_stats_par_direction TO authenticated;
GRANT SELECT ON v_stats_par_type_depense TO authenticated;
GRANT SELECT ON v_activite_recente TO authenticated;

GRANT EXECUTE ON FUNCTION get_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_evolution_mensuelle TO authenticated;
GRANT EXECUTE ON FUNCTION get_stats_utilisateurs TO authenticated;
GRANT EXECUTE ON FUNCTION get_delai_moyen_traitement TO authenticated;

-- Comments
COMMENT ON VIEW v_dashboard_kpis IS 'KPIs principaux du dashboard - notes à valider, validées, montants';
COMMENT ON VIEW v_dossiers_urgents IS 'Dossiers en attente depuis plus de 48h';
COMMENT ON VIEW v_stats_par_direction IS 'Statistiques des notes par direction';
COMMENT ON VIEW v_stats_par_type_depense IS 'Statistiques par type de dépense';
COMMENT ON VIEW v_activite_recente IS 'Dernières activités sur les notes';
COMMENT ON FUNCTION get_dashboard_data IS 'Retourne toutes les données du dashboard en un seul appel';
COMMENT ON FUNCTION get_evolution_mensuelle IS 'Retourne l''évolution mensuelle des notes pour l''exercice';
COMMENT ON FUNCTION get_stats_utilisateurs IS 'Statistiques d''activité par utilisateur (admin)';
COMMENT ON FUNCTION get_delai_moyen_traitement IS 'Délais moyens de traitement des notes';
