-- Migration: Ajouter DAAF à la policy UPDATE des notes_sef
-- La DAAF doit pouvoir modifier les notes soumises (pour validation/décision)
-- Actuellement seuls Admin, DG, et créateur (brouillon) peuvent modifier

-- Remplacer la policy notes_sef_update existante
DROP POLICY IF EXISTS "notes_sef_update" ON public.notes_sef;

CREATE POLICY "notes_sef_update" ON public.notes_sef
  FOR UPDATE TO authenticated USING (
    -- Admin : accès total
    public.is_admin()
    -- DG : accès total
    OR public.is_dg()
    -- DAAF : peut modifier les notes soumises (validation workflow)
    OR (public.is_daaf() AND statut IN ('soumis', 'a_valider'))
    -- Créateur : peut modifier ses brouillons uniquement
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

COMMENT ON POLICY "notes_sef_update" ON public.notes_sef IS
  'Admin/DG: tout modifier. DAAF: modifier les notes soumises/à valider. Créateur: modifier ses brouillons.';
