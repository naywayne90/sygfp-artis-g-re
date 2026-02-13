-- ============================================================================
-- Prompt 7 Backend : RLS notes_dg (cleanup + refonte) + Indexes performance
-- Date: 2026-02-14
-- Description:
--   1. Supprime toutes les policies existantes sur notes_dg
--   2. Recrée 4 policies propres et cohérentes avec le workflow AEF
--   3. Ajoute les index manquants pour la performance
-- ============================================================================

-- ============================================================================
-- PART 1 : DROP toutes les policies existantes
-- ============================================================================

-- Policies de 20260212_fix_notes_dg_rls_aef_workflow.sql
DROP POLICY IF EXISTS "notes_dg_select_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_insert_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_update_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_delete_policy" ON public.notes_dg;

-- Policies héritées de 20260118200000_rls_rbac_socle.sql (si encore présentes)
DROP POLICY IF EXISTS "notes_dg_select" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_insert" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_update" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_delete" ON public.notes_dg;

-- Policies héritées de 20260115152814 (si encore présentes)
DROP POLICY IF EXISTS "notes_dg_select_all" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_insert_own" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_update_own" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_delete_own" ON public.notes_dg;

-- S'assurer que RLS est activé
ALTER TABLE public.notes_dg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_dg FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- PART 2 : SELECT policy
-- ============================================================================
-- ADMIN, DG, DAAF : tout voir
-- CB : tout voir (contrôle budgétaire)
-- AGENT / DIRECTEUR / autres : voir leur direction
-- Créateur : toujours voir ses propres notes

CREATE POLICY "notes_dg_select_policy" ON public.notes_dg
  FOR SELECT TO authenticated
  USING (
    -- Créateur voit toujours ses propres notes
    created_by = auth.uid()
    -- ADMIN, DG, DAAF : accès total
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    -- CB : accès total (contrôle budgétaire)
    OR has_role(auth.uid(), 'CB'::app_role)
    -- AGENT, DIRECTEUR, autres : notes de leur direction (hors brouillon)
    OR (
      direction_id = (SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid())
      AND statut <> 'brouillon'
    )
  );


-- ============================================================================
-- PART 3 : INSERT policy
-- ============================================================================
-- Tout utilisateur authentifié actif peut créer

CREATE POLICY "notes_dg_insert_policy" ON public.notes_dg
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_active = true)
  );


-- ============================================================================
-- PART 4 : UPDATE policy
-- ============================================================================
-- ADMIN : tout
-- Créateur : brouillon et différé (pour re-soumettre)
-- DG : soumis, a_valider, différé (valider, rejeter, différer)
-- DAAF : soumis, a_valider, a_imputer (valider, imputer)
-- CB : a_imputer (imputer)
-- WITH CHECK (true) : la destination est validée par le trigger enforce_aef_workflow

CREATE POLICY "notes_dg_update_policy" ON public.notes_dg
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'differe'))
    OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'a_valider', 'differe'))
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('soumis', 'a_valider', 'valide', 'a_imputer'))
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut IN ('valide', 'a_imputer'))
  )
  WITH CHECK (true);


-- ============================================================================
-- PART 5 : DELETE policy
-- ============================================================================
-- Créateur : brouillon uniquement
-- ADMIN : tout (maintenance)

CREATE POLICY "notes_dg_delete_policy" ON public.notes_dg
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );


-- ============================================================================
-- PART 6 : Index performance
-- ============================================================================
-- Index déjà existants (pas recréés) :
--   idx_notes_dg_statut         ON notes_dg(statut)
--   idx_notes_dg_exercice       ON notes_dg(exercice)
--   idx_notes_dg_direction_id   ON notes_dg(direction_id)
--   idx_notes_dg_note_sef_id    ON notes_dg(note_sef_id)
--   idx_notes_dg_origin         ON notes_dg(origin)
--   idx_notes_dg_dossier_id     ON notes_dg(dossier_id)
--   idx_notes_dg_validated_at   ON notes_dg(validated_at)

-- Nouveaux index
CREATE INDEX IF NOT EXISTS idx_notes_dg_numero ON public.notes_dg(numero);
CREATE INDEX IF NOT EXISTS idx_notes_dg_reference_pivot ON public.notes_dg(reference_pivot);
CREATE INDEX IF NOT EXISTS idx_notes_dg_budget_line ON public.notes_dg(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_created_at ON public.notes_dg(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_dg_created_by ON public.notes_dg(created_by);

-- Composite index pour la query la plus fréquente (liste filtrée)
CREATE INDEX IF NOT EXISTS idx_notes_dg_exercice_statut ON public.notes_dg(exercice, statut);

-- Rafraîchir les statistiques
ANALYZE public.notes_dg;
