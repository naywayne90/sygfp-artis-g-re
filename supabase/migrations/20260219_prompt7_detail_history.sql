-- ============================================================================
-- Prompt 7: Requêtes détail + historique mouvements
-- 1. RPC get_budget_line_movements: historique engagements sur une ligne
-- 2. GRANT sur FKs pour PostgREST joins (valideurs visa)
-- Date: 2026-02-19
-- ============================================================================

-- ============================================================================
-- 1. RPC: Historique mouvements sur une ligne budgétaire
--    Retourne tous les engagements d'une ligne, avec nom du créateur
--    Utilisé par: onglet Budget > Historique des mouvements
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_budget_line_movements(
  p_budget_line_id UUID,
  p_exercice INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  numero TEXT,
  objet TEXT,
  montant NUMERIC,
  fournisseur TEXT,
  statut TEXT,
  type_engagement TEXT,
  date_engagement DATE,
  created_at TIMESTAMPTZ,
  created_by_name TEXT,
  visa_saf_date TIMESTAMPTZ,
  visa_cb_date TIMESTAMPTZ,
  visa_daaf_date TIMESTAMPTZ,
  visa_dg_date TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    be.id,
    be.numero,
    be.objet,
    be.montant,
    be.fournisseur,
    be.statut,
    be.type_engagement,
    be.date_engagement,
    be.created_at,
    p.full_name AS created_by_name,
    be.visa_saf_date,
    be.visa_cb_date,
    be.visa_daaf_date,
    be.visa_dg_date
  FROM budget_engagements be
  LEFT JOIN profiles p ON p.id = be.created_by
  WHERE be.budget_line_id = p_budget_line_id
    AND (p_exercice IS NULL OR be.exercice = p_exercice)
  ORDER BY be.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_budget_line_movements IS
  'Historique de tous les engagements sur une ligne budgétaire avec dates de visa. Tri par date décroissante.';

GRANT EXECUTE ON FUNCTION public.get_budget_line_movements(UUID, INT) TO authenticated;
