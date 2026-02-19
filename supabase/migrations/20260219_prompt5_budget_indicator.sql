-- ============================================================================
-- Prompt 5: RPC get_budget_indicator
-- Retourne dotation, engagé, disponible, taux de consommation
-- pour une ligne budgétaire donnée.
-- Deux versions : fast (colonnes physiques) et complète (via vue avec virements)
-- Date: 2026-02-19
-- ============================================================================

-- ============================================================================
-- 1. Version FAST : colonnes physiques budget_lines (< 1ms, PK index)
--    dotation = COALESCE(dotation_modifiee, dotation_initiale)
--    engage   = total_engage (mis à jour par trigger)
--    disponible = dotation - engage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_budget_indicator(p_budget_line_id UUID)
RETURNS TABLE (
  dotation NUMERIC,
  engage NUMERIC,
  disponible NUMERIC,
  taux_consommation NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(bl.dotation_modifiee, bl.dotation_initiale) AS dotation,
    COALESCE(bl.total_engage, 0) AS engage,
    COALESCE(bl.dotation_modifiee, bl.dotation_initiale) - COALESCE(bl.total_engage, 0) AS disponible,
    CASE
      WHEN COALESCE(bl.dotation_modifiee, bl.dotation_initiale) > 0
      THEN ROUND(COALESCE(bl.total_engage, 0) / COALESCE(bl.dotation_modifiee, bl.dotation_initiale) * 100, 2)
      ELSE 0
    END AS taux_consommation
  FROM budget_lines bl
  WHERE bl.id = p_budget_line_id;
$$;

COMMENT ON FUNCTION public.get_budget_indicator IS
  'Indicateur budget rapide: dotation, engagé, disponible, taux de consommation (%). Utilise les colonnes physiques budget_lines pour performance < 1ms.';

-- ============================================================================
-- 2. Version COMPLÈTE : via vue v_budget_disponibilite_complet
--    Prend en compte les virements de crédits (reçus - émis)
--    Plus lent mais plus précis pour affichage détaillé
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_budget_indicator_complet(p_budget_line_id UUID)
RETURNS TABLE (
  dotation_initiale NUMERIC,
  dotation_actuelle NUMERIC,
  engage NUMERIC,
  disponible_brut NUMERIC,
  disponible_net NUMERIC,
  montant_reserve NUMERIC,
  taux_consommation NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.dotation_initiale,
    v.dotation_actuelle,
    v.total_engage AS engage,
    v.disponible_brut,
    v.disponible_net,
    v.montant_reserve,
    CASE
      WHEN v.dotation_actuelle > 0
      THEN ROUND(v.total_engage / v.dotation_actuelle * 100, 2)
      ELSE 0
    END AS taux_consommation
  FROM v_budget_disponibilite_complet v
  WHERE v.id = p_budget_line_id;
$$;

COMMENT ON FUNCTION public.get_budget_indicator_complet IS
  'Indicateur budget complet: inclut virements de crédits, réservations, disponible brut/net. Via vue v_budget_disponibilite_complet.';

-- ============================================================================
-- 3. GRANT : accessible aux utilisateurs authentifiés
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_budget_indicator(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_budget_indicator_complet(UUID) TO authenticated;
