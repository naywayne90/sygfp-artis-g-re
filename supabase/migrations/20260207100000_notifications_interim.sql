-- =====================================================
-- Migration : Notifications prenant en compte les intérims
-- Date : 2026-02-07
-- Objectif : Modifier get_notification_recipients pour inclure
-- les intérimaires actifs dans les destinataires
-- =====================================================

-- Remplacer la fonction get_notification_recipients pour inclure les intérimaires
CREATE OR REPLACE FUNCTION get_notification_recipients(p_type_evenement TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  canal TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as user_id,
    COALESCE(p.full_name, p.first_name || ' ' || p.last_name) as full_name,
    p.email,
    COALESCE(np.canal, 'in_app') as canal
  FROM notification_recipients nr
  JOIN profiles p ON (
    p.role_hierarchique = nr.role_hierarchique
    OR p.direction_id = nr.direction_id
    OR p.id = nr.user_id
  )
  LEFT JOIN notification_preferences np ON np.user_id = p.id AND np.type_evenement = p_type_evenement
  WHERE nr.type_evenement = p_type_evenement
  AND nr.est_actif = true
  AND p.is_active = true
  AND COALESCE(np.canal, 'in_app') != 'disabled'

  UNION

  -- Inclure les intérimaires actifs des titulaires ciblés
  SELECT DISTINCT
    pi.id as user_id,
    COALESCE(pi.full_name, pi.first_name || ' ' || pi.last_name) as full_name,
    pi.email,
    COALESCE(npi.canal, 'in_app') as canal
  FROM notification_recipients nr
  JOIN profiles pt ON (
    pt.role_hierarchique = nr.role_hierarchique
    OR pt.direction_id = nr.direction_id
    OR pt.id = nr.user_id
  )
  JOIN interims i ON i.titulaire_id = pt.id
    AND i.est_actif = true
    AND CURRENT_DATE BETWEEN i.date_debut AND i.date_fin
  JOIN profiles pi ON pi.id = i.interimaire_id
  LEFT JOIN notification_preferences npi ON npi.user_id = pi.id AND npi.type_evenement = p_type_evenement
  WHERE nr.type_evenement = p_type_evenement
  AND nr.est_actif = true
  AND pt.is_active = true
  AND pi.is_active = true
  AND COALESCE(npi.canal, 'in_app') != 'disabled';
END;
$func$;

COMMENT ON FUNCTION get_notification_recipients IS 'Retourne les utilisateurs à notifier pour un type d''événement, incluant les intérimaires actifs';
