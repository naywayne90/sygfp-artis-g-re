-- Migration: Ajouter DAAF à la policy UPDATE des notes_sef
-- La DAAF doit pouvoir modifier les notes soumises (pour validation/décision)
-- Actuellement seuls Admin, DG, et créateur peuvent modifier
-- Utilise user_roles avec app_role (schéma réel de la base)

-- Remplacer la policy notes_sef_update_authorized existante
DROP POLICY IF EXISTS "notes_sef_update_authorized" ON public.notes_sef;

CREATE POLICY "notes_sef_update_authorized" ON public.notes_sef
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Créateur peut modifier sa note
      created_by = auth.uid()
      -- Admin ou DG : accès total
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['ADMIN'::app_role, 'DG'::app_role])
      )
      -- DAAF : peut modifier les notes soumises ou à valider
      OR (
        statut IN ('soumis', 'a_valider')
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'DAAF'::app_role
        )
      )
    )
  );
