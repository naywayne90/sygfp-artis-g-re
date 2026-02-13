-- ============================================================================
-- Prompt 3 Backend : Nettoyage + refonte RLS imputations
-- Date: 2026-02-14
-- Description:
--   1. Supprime TOUTES les policies conflictuelles (3 couches héritées)
--   2. Recrée 4 policies propres et cohérentes avec le workflow
--   3. Corrige la faille : INSERT/UPDATE étaient ouverts à tous les auth
-- ============================================================================


-- ============================================================================
-- PART 1 : DROP toutes les policies existantes sur imputations
-- ============================================================================

-- Couche 1: migration 20260116103921 (policies avec has_role)
DROP POLICY IF EXISTS "imputations_select_all" ON public.imputations;
DROP POLICY IF EXISTS "imputations_insert_authorized" ON public.imputations;
DROP POLICY IF EXISTS "imputations_update_authorized" ON public.imputations;
DROP POLICY IF EXISTS "imputations_delete_admin" ON public.imputations;

-- Couche 2: migration 20260116184125 (policies "authentifiés" trop permissives)
DROP POLICY IF EXISTS "Lecture imputations authentifiés" ON public.imputations;
DROP POLICY IF EXISTS "Création imputations authentifiés" ON public.imputations;
DROP POLICY IF EXISTS "Mise à jour imputations" ON public.imputations;
DROP POLICY IF EXISTS "Suppression imputations créateur" ON public.imputations;

-- Couche 3: migration 20260118200000 (policies avec fonctions inexistantes)
DROP POLICY IF EXISTS "imputations_select" ON public.imputations;
DROP POLICY IF EXISTS "imputations_insert" ON public.imputations;
DROP POLICY IF EXISTS "imputations_update" ON public.imputations;
DROP POLICY IF EXISTS "imputations_delete" ON public.imputations;

-- S'assurer que RLS est activé et forcé
ALTER TABLE public.imputations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imputations FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- PART 2 : SELECT policy
-- ============================================================================
-- ADMIN, DG, DAAF, CB : tout voir (pilotage, contrôle budgétaire)
-- Créateur : voir ses propres imputations
-- Autres : voir les imputations de leur direction (hors brouillon)

CREATE POLICY "imputations_select_policy" ON public.imputations
  FOR SELECT TO authenticated
  USING (
    -- Créateur voit toujours ses propres imputations
    created_by = auth.uid()
    -- ADMIN : accès total
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    -- DG : accès total (pilotage)
    OR has_role(auth.uid(), 'DG'::app_role)
    -- DAAF : accès total (gestion budgétaire)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    -- CB : accès total (contrôle budgétaire)
    OR has_role(auth.uid(), 'CB'::app_role)
    -- Autres : imputations de leur direction (hors brouillon)
    OR (
      direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
      AND statut <> 'brouillon'
    )
  );


-- ============================================================================
-- PART 3 : INSERT policy
-- ============================================================================
-- L'imputation est un acte budgétaire contrôlé.
-- Seuls ADMIN, DAAF et CB peuvent créer des imputations.

CREATE POLICY "imputations_insert_policy" ON public.imputations
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );


-- ============================================================================
-- PART 4 : UPDATE policy
-- ============================================================================
-- ADMIN : tout modifier
-- DAAF/CB : modifier pour validation/rejet/imputation
-- Créateur : modifier ses brouillons uniquement
-- WITH CHECK (true) : la destination est validée côté trigger/application

CREATE POLICY "imputations_update_policy" ON public.imputations
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  )
  WITH CHECK (true);


-- ============================================================================
-- PART 5 : DELETE policy
-- ============================================================================
-- ADMIN : tout supprimer (maintenance)
-- Créateur : supprimer ses brouillons uniquement

CREATE POLICY "imputations_delete_policy" ON public.imputations
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );


-- ============================================================================
-- PART 6 : Vérification
-- ============================================================================
-- Rafraîchir les statistiques
ANALYZE public.imputations;
