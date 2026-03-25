-- ============================================================
-- Fix: engagement_documents RLS trop restrictive
-- Avant: seuls Chef de Service DAAF/DMG pouvaient scanner
-- Apres: ADMIN, DG, DAAF, DAF, DMG, CB, OPERATEUR
-- ============================================================

DROP POLICY IF EXISTS "scanning_ed_insert_restricted" ON engagement_documents;
CREATE POLICY "scanning_ed_insert_restricted" ON engagement_documents FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'ADMIN'::app_role)
  OR has_role(auth.uid(), 'DG'::app_role)
  OR has_role(auth.uid(), 'DAAF'::app_role)
  OR has_role(auth.uid(), 'DAF'::app_role)
  OR has_role(auth.uid(), 'DMG'::app_role)
  OR has_role(auth.uid(), 'CB'::app_role)
  OR has_role(auth.uid(), 'OPERATEUR'::app_role)
);

DROP POLICY IF EXISTS "scanning_ed_update_restricted" ON engagement_documents;
CREATE POLICY "scanning_ed_update_restricted" ON engagement_documents FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'ADMIN'::app_role)
  OR has_role(auth.uid(), 'DG'::app_role)
  OR has_role(auth.uid(), 'DAAF'::app_role)
  OR has_role(auth.uid(), 'DAF'::app_role)
  OR has_role(auth.uid(), 'DMG'::app_role)
  OR has_role(auth.uid(), 'CB'::app_role)
  OR has_role(auth.uid(), 'OPERATEUR'::app_role)
);

DROP POLICY IF EXISTS "scanning_ed_delete_restricted" ON engagement_documents;
CREATE POLICY "scanning_ed_delete_restricted" ON engagement_documents FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'ADMIN'::app_role)
  OR has_role(auth.uid(), 'DG'::app_role)
  OR has_role(auth.uid(), 'DAAF'::app_role)
  OR has_role(auth.uid(), 'DAF'::app_role)
  OR has_role(auth.uid(), 'DMG'::app_role)
  OR has_role(auth.uid(), 'CB'::app_role)
);
