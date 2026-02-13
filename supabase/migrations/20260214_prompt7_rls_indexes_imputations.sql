-- ============================================================================
-- Prompt 7 Backend : RLS imputations (refonte) + Index performance + Sécurité
-- Date: 2026-02-14
-- Description:
--   1. Supprime toutes les policies existantes sur imputations
--   2. Recrée 4 policies cohérentes avec le workflow Imputation
--      CB: SELECT/INSERT/UPDATE tout | DAAF/DG/ADMIN: SELECT/UPDATE tout
--      DIRECTEUR/AGENT: SELECT sa direction | DELETE: CB si brouillon
--   3. Nettoie les index partiels obsolètes (WHERE statut='active')
--   4. Crée les index manquants pour la performance
-- ============================================================================


-- ============================================================================
-- PART 1 : DROP toutes les policies existantes sur imputations
-- ============================================================================

-- Policies de Prompt 3 (20260214_prompt3_fix_imputations_rls.sql)
DROP POLICY IF EXISTS "imputations_select_policy" ON public.imputations;
DROP POLICY IF EXISTS "imputations_insert_policy" ON public.imputations;
DROP POLICY IF EXISTS "imputations_update_policy" ON public.imputations;
DROP POLICY IF EXISTS "imputations_delete_policy" ON public.imputations;

-- Toute ancienne policy résiduelle (sécurité)
DROP POLICY IF EXISTS "imputations_select_all" ON public.imputations;
DROP POLICY IF EXISTS "imputations_insert_authorized" ON public.imputations;
DROP POLICY IF EXISTS "imputations_update_authorized" ON public.imputations;
DROP POLICY IF EXISTS "imputations_delete_admin" ON public.imputations;
DROP POLICY IF EXISTS "Lecture imputations authentifiés" ON public.imputations;
DROP POLICY IF EXISTS "Création imputations authentifiés" ON public.imputations;
DROP POLICY IF EXISTS "Mise à jour imputations" ON public.imputations;
DROP POLICY IF EXISTS "Suppression imputations créateur" ON public.imputations;
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
-- CB, DAAF, DG, ADMIN : tout voir
-- DIRECTEUR, AGENT : voir les imputations de leur direction (hors brouillon)
-- Créateur : voir ses propres imputations (pour le workflow brouillon)

CREATE POLICY "imputations_select_policy" ON public.imputations
  FOR SELECT TO authenticated
  USING (
    -- CB : accès total (opérateur imputation)
    has_role(auth.uid(), 'CB'::app_role)
    -- ADMIN : accès total (maintenance)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    -- DG : accès total (pilotage)
    OR has_role(auth.uid(), 'DG'::app_role)
    -- DAAF : accès total (gestion budgétaire)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    -- Créateur voit ses propres imputations (brouillons inclus)
    OR created_by = auth.uid()
    -- DIRECTEUR, AGENT, autres : imputations de leur direction (hors brouillon)
    OR (
      direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
      AND statut <> 'brouillon'
    )
  );


-- ============================================================================
-- PART 3 : INSERT policy
-- ============================================================================
-- CB : seul rôle opérationnel à créer des imputations
-- ADMIN : accès maintenance

CREATE POLICY "imputations_insert_policy" ON public.imputations
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );


-- ============================================================================
-- PART 4 : UPDATE policy
-- ============================================================================
-- CB : tout modifier (opérateur principal)
-- DAAF, DG : tout modifier (validation/rejet/report)
-- ADMIN : tout modifier (maintenance)
-- WITH CHECK (true) : la destination est validée par le trigger/RPC

CREATE POLICY "imputations_update_policy" ON public.imputations
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  )
  WITH CHECK (true);


-- ============================================================================
-- PART 5 : DELETE policy
-- ============================================================================
-- CB : supprimer les brouillons uniquement
-- ADMIN : tout supprimer (maintenance)

CREATE POLICY "imputations_delete_policy" ON public.imputations
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut = 'brouillon')
  );


-- ============================================================================
-- PART 6 : Nettoyage index partiels obsolètes
-- ============================================================================
-- Les index WHERE statut = 'active' sont obsolètes (workflow = brouillon/a_valider/valide/rejete/differe)

DROP INDEX IF EXISTS idx_imputations_os_id;
DROP INDEX IF EXISTS idx_imputations_dossier_ref;


-- ============================================================================
-- PART 7 : Index performance
-- ============================================================================
-- Index déjà existants (pas recréés) :
--   idx_imputations_note_aef_id      ON imputations(note_aef_id) — UNIQUE
--   idx_imputations_budget_line_id   ON imputations(budget_line_id)
--   idx_imputations_exercice_statut  ON imputations(exercice, statut)
--   idx_imputations_exercice_statut_created ON imputations(exercice, statut, created_at DESC)
--   idx_imputations_reference_unique ON imputations(reference) WHERE reference IS NOT NULL

-- Index simples (IF NOT EXISTS = safe si déjà présent)
CREATE INDEX IF NOT EXISTS idx_imputations_statut ON public.imputations(statut);
CREATE INDEX IF NOT EXISTS idx_imputations_direction_id ON public.imputations(direction_id);
CREATE INDEX IF NOT EXISTS idx_imputations_exercice ON public.imputations(exercice);
CREATE INDEX IF NOT EXISTS idx_imputations_reference ON public.imputations(reference);
CREATE INDEX IF NOT EXISTS idx_imputations_budget_line_id ON public.imputations(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_imputations_created_at_desc ON public.imputations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imputations_created_by ON public.imputations(created_by);

-- Index pour la RLS (sous-requête direction_id fréquente)
CREATE INDEX IF NOT EXISTS idx_profiles_direction_id ON public.profiles(id, direction_id);

-- Rafraîchir les statistiques
ANALYZE public.imputations;
