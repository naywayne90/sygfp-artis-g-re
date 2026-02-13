-- ============================================================================
-- Prompt 7 : Index composites, Sécurité vue anon, RPC count_notes_aef_by_statut
-- Date: 2026-02-14
-- Description:
--   1A. Index composites manquants sur notes_dg
--   1B. Révoquer accès anon à v_notes_aef_detail
--   1C. RPC count_notes_aef_by_statut (remplace getCounts N+1)
-- ============================================================================

-- ============================================================================
-- 1A. Index composites sur notes_dg
-- ============================================================================
-- idx_notes_dg_exercice_statut existe déjà (migration précédente)
-- Ajout des composites manquants

CREATE INDEX IF NOT EXISTS idx_notes_dg_exercice_created_by
  ON public.notes_dg(exercice, created_by);

CREATE INDEX IF NOT EXISTS idx_notes_dg_exercice_direction_statut
  ON public.notes_dg(exercice, direction_id, statut);


-- ============================================================================
-- 1B. Sécurité : révoquer accès anon à la vue v_notes_aef_detail
-- ============================================================================

REVOKE SELECT ON public.v_notes_aef_detail FROM anon;


-- ============================================================================
-- 1C. RPC count_notes_aef_by_statut
-- ============================================================================
-- SECURITY INVOKER : respecte RLS (un agent ne compte que ses notes visibles)
-- STABLE : pas de side-effects, optimisable par le planner
-- Retourne jsonb avec les 8 compteurs en 1 seul scan

CREATE OR REPLACE FUNCTION public.count_notes_aef_by_statut(p_exercice integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'total',      COUNT(*),
    'brouillon',  COUNT(*) FILTER (WHERE statut = 'brouillon'),
    'soumis',     COUNT(*) FILTER (WHERE statut = 'soumis'),
    'a_valider',  COUNT(*) FILTER (WHERE statut = 'a_valider'),
    'a_imputer',  COUNT(*) FILTER (WHERE statut = 'a_imputer'),
    'impute',     COUNT(*) FILTER (WHERE statut = 'impute'),
    'differe',    COUNT(*) FILTER (WHERE statut = 'differe'),
    'rejete',     COUNT(*) FILTER (WHERE statut = 'rejete')
  )
  FROM public.notes_dg
  WHERE exercice = p_exercice;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.count_notes_aef_by_statut(integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.count_notes_aef_by_statut(integer) FROM anon;

-- Refresh statistics
ANALYZE public.notes_dg;
