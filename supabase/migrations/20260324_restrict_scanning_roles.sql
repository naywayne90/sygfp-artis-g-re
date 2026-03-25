-- ============================================================
-- Chantier 1 : Restreindre le scanning aux Chef de Service DAAF/DMG
-- ============================================================
-- L'ancienne policy "Authorized roles can manage engagement documents"
-- (FOR ALL) autorisait INSERT/UPDATE/DELETE pour ADMIN, DAAF, CB, SAF.
-- On la remplace par des policies plus fines :
--   - SELECT : tous les authentifiés (déjà en place)
--   - INSERT/UPDATE : ADMIN ou Chef de Service DAAF/DMG uniquement
--   - DELETE : ADMIN ou Chef de Service DAAF/DMG uniquement

-- 1. Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Authorized roles can manage engagement documents" ON engagement_documents;

-- 2. INSERT : seuls ADMIN ou Chef de Service DAAF/DMG
CREATE POLICY "scanning_ed_insert_restricted" ON engagement_documents
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN directions d ON d.id = p.direction_id
      WHERE p.id = auth.uid()
        AND p.role_hierarchique = 'Chef de Service'
        AND d.code IN ('DAAF', 'DMG')
    )
  );

-- 3. UPDATE : seuls ADMIN ou Chef de Service DAAF/DMG
CREATE POLICY "scanning_ed_update_restricted" ON engagement_documents
  FOR UPDATE USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN directions d ON d.id = p.direction_id
      WHERE p.id = auth.uid()
        AND p.role_hierarchique = 'Chef de Service'
        AND d.code IN ('DAAF', 'DMG')
    )
  );

-- 4. DELETE : seuls ADMIN ou Chef de Service DAAF/DMG
CREATE POLICY "scanning_ed_delete_restricted" ON engagement_documents
  FOR DELETE USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN directions d ON d.id = p.direction_id
      WHERE p.id = auth.uid()
        AND p.role_hierarchique = 'Chef de Service'
        AND d.code IN ('DAAF', 'DMG')
    )
  );
