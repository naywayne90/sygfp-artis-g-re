-- =============================================================================
-- P0.2 — Séparation Ordonnateur / Comptable (RGCP, OHADA, IPSAS)
-- =============================================================================
-- Principe de comptabilité publique : "L'ordonnateur prescrit, le comptable
-- paie". Personne ne peut être à la fois ordonnateur et comptable. C'est la
-- règle d'or qui prévient la fraude (un seul homme ne peut pas à la fois
-- décider et exécuter le décaissement).
--
-- Avant cette migration :
--   - INSERT : USING (true)              ← N'IMPORTE QUI authentifié
--   - UPDATE : USING (true)              ← N'IMPORTE QUI authentifié
--   - SELECT : USING (true)              ← N'IMPORTE QUI authentifié
--   - DELETE : USING (statut='soumis')   ← N'IMPORTE QUI authentifié
--
-- Après :
--   - INSERT/UPDATE : TRESORERIE + ADMIN UNIQUEMENT (le comptable public)
--   - SELECT        : tous les rôles consultatifs (large pour reporting)
--   - DELETE        : ADMIN UNIQUEMENT (suppression = piste d'audit cassée)
--
-- Les ordonnateurs (DG, DAAF) conservent un droit de LECTURE pour pilotage
-- et reporting, mais ne peuvent plus créer ni modifier un règlement.
-- =============================================================================

BEGIN;

-- Drop des policies trop permissives existantes
DROP POLICY IF EXISTS "Allow authenticated to read reglements"   ON public.reglements;
DROP POLICY IF EXISTS "Allow authenticated to insert reglements" ON public.reglements;
DROP POLICY IF EXISTS "Allow authenticated to update reglements" ON public.reglements;
DROP POLICY IF EXISTS "Allow authenticated to delete reglements" ON public.reglements;

-- =============================================================================
-- SELECT — large (consultation autorisée pour pilotage et audit)
-- =============================================================================
CREATE POLICY "reglements_select_authorized_roles"
  ON public.reglements
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'TRESORERIE'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
    OR has_role(auth.uid(), 'AUDITOR'::app_role)
    OR has_role(auth.uid(), 'COMPTABILITE'::app_role)
    OR has_role(auth.uid(), 'OPERATEUR'::app_role)
    OR has_role(auth.uid(), 'SAF'::app_role)
  );

-- =============================================================================
-- INSERT — strict : seul le COMPTABLE PUBLIC (Trésorier) ou l'admin
-- C'est ICI que la règle de séparation ordonnateur/comptable est appliquée.
-- =============================================================================
CREATE POLICY "reglements_insert_tresorerie_only"
  ON public.reglements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'TRESORERIE'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================================================
-- UPDATE — strict : seul le COMPTABLE PUBLIC (Trésorier) ou l'admin
-- =============================================================================
CREATE POLICY "reglements_update_tresorerie_only"
  ON public.reglements
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'TRESORERIE'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'TRESORERIE'::app_role)
    OR has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- =============================================================================
-- DELETE — ADMIN uniquement (un règlement payé ne doit JAMAIS être supprimé,
-- la piste d'audit doit être préservée). Le rejet/annulation se fait via
-- statut='rejete', pas via DELETE.
-- =============================================================================
CREATE POLICY "reglements_delete_admin_only"
  ON public.reglements
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

COMMIT;

-- =============================================================================
-- Vérification post-migration :
--   SELECT policyname, cmd, roles FROM pg_policies
--   WHERE schemaname='public' AND tablename='reglements';
--
--   → Doit retourner exactement 4 policies (1 SELECT + 1 INSERT + 1 UPDATE + 1 DELETE)
-- =============================================================================
