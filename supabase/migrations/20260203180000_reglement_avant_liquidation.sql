-- =====================================================
-- Migration : Flag Règlement Avant Liquidation
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Objectif : Permettre à la DMG de marquer les dossiers
-- nécessitant un règlement AVANT l'effectivité de la liquidation
-- =====================================================

-- =====================================================
-- MODIFICATION TABLE : budget_liquidations
-- Ajout des colonnes pour le flag d'urgence
-- =====================================================
ALTER TABLE budget_liquidations
ADD COLUMN IF NOT EXISTS reglement_urgent BOOLEAN DEFAULT false;

ALTER TABLE budget_liquidations
ADD COLUMN IF NOT EXISTS reglement_urgent_motif TEXT;

ALTER TABLE budget_liquidations
ADD COLUMN IF NOT EXISTS reglement_urgent_date TIMESTAMPTZ;

ALTER TABLE budget_liquidations
ADD COLUMN IF NOT EXISTS reglement_urgent_par UUID REFERENCES auth.users(id);

-- Index pour recherche rapide des liquidations urgentes
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_urgent
ON budget_liquidations(reglement_urgent, reglement_urgent_date DESC)
WHERE reglement_urgent = true;

-- =====================================================
-- VUE : v_liquidations_urgentes
-- Liste des liquidations marquées comme urgentes
-- =====================================================
CREATE OR REPLACE VIEW v_liquidations_urgentes AS
SELECT
  l.id,
  l.numero as reference,
  l.montant,
  TO_CHAR(l.montant, 'FM999 999 999 999') as montant_formate,
  l.date_liquidation,
  l.statut,
  l.reglement_urgent_motif as motif_urgence,
  l.reglement_urgent_date as date_marquage,
  l.reglement_urgent_par,
  -- Fournisseur depuis engagement
  COALESCE(e.fournisseur, 'Non spécifié') as fournisseur,
  -- Engagement lié
  e.numero as engagement_numero,
  e.objet as objet,
  -- Utilisateur qui a marqué
  COALESCE(pr.full_name, pr.first_name || ' ' || pr.last_name) as marque_par_nom,
  -- Calcul jours depuis marquage
  EXTRACT(DAY FROM (NOW() - l.reglement_urgent_date))::INTEGER as jours_depuis_marquage
FROM budget_liquidations l
LEFT JOIN budget_engagements e ON e.id = l.engagement_id
LEFT JOIN profiles pr ON pr.id = l.reglement_urgent_par
WHERE l.reglement_urgent = true
ORDER BY l.reglement_urgent_date DESC;

-- =====================================================
-- FONCTION : mark_liquidation_urgent
-- Marquer une liquidation comme nécessitant un règlement urgent
-- =====================================================
CREATE OR REPLACE FUNCTION mark_liquidation_urgent(
  p_liquidation_id UUID,
  p_motif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_user_role TEXT;
  v_user_profile TEXT;
BEGIN
  -- Vérifier les droits de l'utilisateur
  SELECT role_hierarchique, profil_fonctionnel INTO v_user_role, v_user_profile
  FROM profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('DG', 'DMG', 'DAAF', 'Directeur')
     AND v_user_profile NOT IN ('Admin', 'Validateur') THEN
    RAISE EXCEPTION 'Vous n''avez pas les droits pour marquer une liquidation comme urgente';
  END IF;

  -- Vérifier que le motif est fourni
  IF p_motif IS NULL OR TRIM(p_motif) = '' THEN
    RAISE EXCEPTION 'Un motif est requis pour marquer une liquidation comme urgente';
  END IF;

  -- Marquer la liquidation
  UPDATE budget_liquidations
  SET
    reglement_urgent = true,
    reglement_urgent_motif = p_motif,
    reglement_urgent_date = NOW(),
    reglement_urgent_par = auth.uid()
  WHERE id = p_liquidation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liquidation non trouvée';
  END IF;

  -- Créer une notification pour la trésorerie
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category, is_urgent)
  SELECT
    p.id,
    'liquidation_urgente',
    'Liquidation marquée urgente',
    'La liquidation ' || l.numero || ' a été marquée comme nécessitant un règlement urgent. Motif: ' || p_motif,
    'budget_liquidations',
    p_liquidation_id,
    'workflow',
    true
  FROM profiles p, budget_liquidations l
  WHERE l.id = p_liquidation_id
  AND p.role_hierarchique IN ('Tresorier', 'DMG')
  AND p.id != auth.uid();

  RETURN true;
END;
$func$;

-- =====================================================
-- FONCTION : unmark_liquidation_urgent
-- Retirer le marquage urgent d'une liquidation
-- =====================================================
CREATE OR REPLACE FUNCTION unmark_liquidation_urgent(p_liquidation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_user_role TEXT;
  v_user_profile TEXT;
BEGIN
  -- Vérifier les droits de l'utilisateur
  SELECT role_hierarchique, profil_fonctionnel INTO v_user_role, v_user_profile
  FROM profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('DG', 'DMG', 'DAAF', 'Directeur')
     AND v_user_profile NOT IN ('Admin', 'Validateur') THEN
    RAISE EXCEPTION 'Vous n''avez pas les droits pour modifier le statut urgent';
  END IF;

  -- Retirer le marquage
  UPDATE budget_liquidations
  SET
    reglement_urgent = false,
    reglement_urgent_motif = NULL,
    reglement_urgent_date = NULL,
    reglement_urgent_par = NULL
  WHERE id = p_liquidation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liquidation non trouvée';
  END IF;

  RETURN true;
END;
$func$;

-- =====================================================
-- FONCTION : get_urgent_liquidations_count
-- Compteur pour le dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_urgent_liquidations_count()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM budget_liquidations
    WHERE reglement_urgent = true
    AND statut NOT IN ('regle', 'annule')
  );
END;
$func$;

-- =====================================================
-- FONCTION : get_urgent_liquidations_stats
-- Statistiques détaillées pour le dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_urgent_liquidations_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'montant_total', COALESCE(SUM(montant), 0),
      'montant_total_formate', TO_CHAR(COALESCE(SUM(montant), 0), 'FM999 999 999 999'),
      'plus_ancien_jours', COALESCE(
        EXTRACT(DAY FROM (NOW() - MIN(reglement_urgent_date)))::INTEGER,
        0
      )
    )
    FROM budget_liquidations
    WHERE reglement_urgent = true
    AND statut NOT IN ('regle', 'annule')
  );
END;
$func$;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT ON v_liquidations_urgentes TO authenticated;
GRANT EXECUTE ON FUNCTION mark_liquidation_urgent TO authenticated;
GRANT EXECUTE ON FUNCTION unmark_liquidation_urgent TO authenticated;
GRANT EXECUTE ON FUNCTION get_urgent_liquidations_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_urgent_liquidations_stats TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN budget_liquidations.reglement_urgent IS 'Indique si un règlement urgent est requis avant effectivité liquidation';
COMMENT ON COLUMN budget_liquidations.reglement_urgent_motif IS 'Motif justifiant l''urgence du règlement';
COMMENT ON COLUMN budget_liquidations.reglement_urgent_date IS 'Date du marquage urgent';
COMMENT ON COLUMN budget_liquidations.reglement_urgent_par IS 'Utilisateur ayant marqué l''urgence';

COMMENT ON VIEW v_liquidations_urgentes IS 'Vue des liquidations nécessitant un règlement urgent';
COMMENT ON FUNCTION mark_liquidation_urgent IS 'Marque une liquidation comme nécessitant un règlement urgent';
COMMENT ON FUNCTION unmark_liquidation_urgent IS 'Retire le marquage urgent d''une liquidation';
COMMENT ON FUNCTION get_urgent_liquidations_count IS 'Retourne le nombre de liquidations urgentes en attente';
COMMENT ON FUNCTION get_urgent_liquidations_stats IS 'Retourne les statistiques des liquidations urgentes';
