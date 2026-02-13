-- =============================================================================
-- Migration: Fix RLS UPDATE policy on notes_dg - add WITH CHECK
-- =============================================================================
-- Date: 2026-02-13
--
-- PROBLÈME:
-- La policy notes_dg_update_policy n'a PAS de WITH CHECK.
-- PostgreSQL utilise alors le USING pour vérifier aussi la NOUVELLE ligne.
-- Quand le DG valide (soumis → a_imputer), le nouveau statut 'a_imputer'
-- n'est PAS dans ('soumis', 'a_valider', 'differe') → RLS BLOQUE.
-- Même problème pour DG rejetant (soumis → rejete).
--
-- SOLUTION:
-- Ajouter WITH CHECK (true) pour que les updates autorisées par USING
-- puissent écrire n'importe quel statut de destination.
-- La logique métier (machine à états) est gérée côté application.
-- =============================================================================

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "notes_dg_update_policy" ON public.notes_dg;

-- Recréer avec WITH CHECK
CREATE POLICY "notes_dg_update_policy" ON public.notes_dg
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'differe'))
    OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'a_valider', 'differe'))
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('valide', 'a_imputer'))
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut IN ('valide', 'a_imputer'))
  )
  WITH CHECK (true);
