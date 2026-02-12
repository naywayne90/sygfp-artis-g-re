-- =============================================================================
-- Migration: Fix RLS policies notes_dg pour workflow AEF complet
-- =============================================================================
-- Date: 2026-02-12
-- Auteur: BACKEND agent
--
-- DIAGNOSTIC:
-- 1. Policies existantes (migration 20260115163121):
--    - notes_dg_select_policy, notes_dg_update_policy,
--      notes_dg_insert_policy, notes_dg_delete_policy (utilisent has_role())
--
-- 2. DAAF/CB ne pouvaient PAS voir les notes en statut 'a_imputer', 'soumis', 'a_valider'
--    -> notes_dg_select_policy ne couvrait que 'valide' et 'impute'
--
-- 3. DAAF/CB ne pouvaient PAS imputer (UPDATE 'a_imputer' -> 'impute')
--    -> notes_dg_update_policy couvrait DAAF uniquement pour statut = 'valide'
--    -> Le workflow AEF utilise statut 'a_imputer' (pas seulement 'valide')
--
-- 4. Direction: ne voyait que 'valide', manquait 'a_imputer' et 'impute'
--
-- CORRECTIONS:
-- - Supprimer les anciennes policies et les recreer avec couverture complete
-- - SELECT: DAAF/CB voient soumis, a_valider, valide, a_imputer, impute
-- - SELECT: Direction voit valide, a_imputer, impute
-- - UPDATE: DAAF/CB peuvent modifier quand statut IN (valide, a_imputer)
--
-- FONCTIONS UTILISEES: has_role(auth.uid(), 'ROLE'::app_role)
-- AUCUNE COLONNE SUPPRIMEE.
-- =============================================================================

-- =====================================================================
-- ETAPE 1: Supprimer TOUTES les policies existantes sur notes_dg
-- =====================================================================

-- Policies actuelles (migration 20260115163121)
DROP POLICY IF EXISTS "notes_dg_select_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_insert_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_update_policy" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_delete_policy" ON public.notes_dg;

-- Policies RBAC socle (migration 20260118200000) - si elles existent
DROP POLICY IF EXISTS "notes_dg_select" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_insert" ON public.notes_dg;
DROP POLICY IF EXISTS "notes_dg_update" ON public.notes_dg;

-- =====================================================================
-- ETAPE 2: S'assurer que RLS est active
-- =====================================================================

ALTER TABLE public.notes_dg ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- ETAPE 3: Creer les policies corrigees (workflow AEF complet)
-- =====================================================================

-- --- SELECT: Qui peut VOIR les notes AEF ---
-- Admin/DG: tout
-- DAAF/CB: notes soumis, a_valider, valide, a_imputer, impute (workflow complet)
-- Createur: ses propres notes (tous statuts)
-- Meme direction: notes valide, a_imputer, impute
CREATE POLICY "notes_dg_select_policy" ON public.notes_dg
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR (
      has_role(auth.uid(), 'DAAF'::app_role)
      AND statut IN ('soumis', 'a_valider', 'valide', 'a_imputer', 'impute')
    )
    OR (
      has_role(auth.uid(), 'CB'::app_role)
      AND statut IN ('soumis', 'a_valider', 'valide', 'a_imputer', 'impute')
    )
    OR (
      direction_id IN (SELECT profiles.direction_id FROM profiles WHERE profiles.id = auth.uid())
      AND statut IN ('valide', 'a_imputer', 'impute')
    )
  );

-- --- INSERT: Qui peut CREER des notes AEF ---
-- Utilisateur authentifie actif, created_by = self
CREATE POLICY "notes_dg_insert_policy" ON public.notes_dg
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_active = true)
  );

-- --- UPDATE: Qui peut MODIFIER des notes AEF ---
-- Admin: tout
-- DG: valider/rejeter/differer les soumis et a_valider
-- DAAF: imputer les notes valide et a_imputer
-- CB: imputer les notes valide et a_imputer
-- Createur: modifier brouillons et notes differees (pour correction)
CREATE POLICY "notes_dg_update_policy" ON public.notes_dg
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'differe'))
    OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'a_valider', 'differe'))
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('valide', 'a_imputer'))
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut IN ('valide', 'a_imputer'))
  );

-- --- DELETE: Qui peut SUPPRIMER des notes AEF ---
-- Admin: tout
-- Createur: uniquement brouillons
CREATE POLICY "notes_dg_delete_policy" ON public.notes_dg
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );
