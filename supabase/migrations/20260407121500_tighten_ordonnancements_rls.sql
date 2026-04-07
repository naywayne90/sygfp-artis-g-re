-- =============================================================================
-- Phase B2 — Tightening de la policy RLS SELECT sur public.ordonnancements
-- =============================================================================
-- Audit 2026-04-07 (plan concurrent-giggling-pearl.md) :
-- La policy "Everyone can view ordonnancements" utilisait USING (true), ce qui
-- accordait le droit SELECT à TOUS (y compris le rôle anon non-authentifié).
--
-- Analyse des usages pour dimensionner le tightening :
--  - generate-report : utilise SERVICE_ROLE_KEY → bypass RLS, non impacté
--  - generate-export : utilise SERVICE_ROLE_KEY → bypass RLS, non impacté
--  - process-reglement : utilise le client anon AVEC le JWT utilisateur
--    forwardé → l'utilisateur doit être authenticated de toute façon
--  - Frontend React : toutes les requêtes passent par le client Supabase
--    authentifié via le JWT Supabase Auth
--
-- Conclusion : aucun usage légitime du rôle anon pour lire ordonnancements.
--
-- Décision — tightening minimal et sûr :
--   USING (true) → USING (auth.uid() IS NOT NULL)
--
-- Impact zéro sur les modules certifiés (Passation/Engagement/Liquidation) :
-- ils ne dépendent pas de lectures anon sur ordonnancements. Les 3 autres
-- policies SELECT/ALL par rôle restent inchangées en complément permissif :
--   - "Authorized roles can manage ordonnancements" (ALL, ADMIN/DAAF/DG)
--   - "DG can read all ordonnancements" (SELECT, DG)
--
-- Un tightening plus strict (par liste de rôles autorisés — CB, TRESORERIE,
-- AUDITEUR, AC, SAF, DAF, etc.) est possible mais nécessite un audit exhaustif
-- rôle-par-rôle des pages qui affichent des ordonnancements (chain nav, suivi
-- DG, dashboards multi-rôles). À planifier dans une itération ultérieure.
--
-- Rollback : recréer la policy d'origine avec USING (true).
-- =============================================================================

BEGIN;

-- Drop de la policy permissive actuelle
DROP POLICY IF EXISTS "Everyone can view ordonnancements" ON public.ordonnancements;

-- Remplacement par une policy authenticated-only
CREATE POLICY "Authenticated users can view ordonnancements"
  ON public.ordonnancements
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Authenticated users can view ordonnancements" ON public.ordonnancements IS
  'Tightening appliqué le 2026-04-07 — remplace l''ancienne policy "Everyone can view ordonnancements" '
  'qui utilisait USING (true). Bloque désormais les accès anonymes. '
  'Les policies "Authorized roles can manage ordonnancements" (ALL) et '
  '"DG can read all ordonnancements" (SELECT) restent en place pour les autres commandes.';

COMMIT;

-- =============================================================================
-- Vérifications post-migration (à exécuter manuellement après apply) :
--
-- -- 1. Lister les policies SELECT restantes
-- SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polrelid = 'public.ordonnancements'::regclass
--   AND polcmd IN ('r', '*')
-- ORDER BY polname;
-- -- → Doit retourner 3 policies dont "Authenticated users can view ordonnancements"
--
-- -- 2. Tester en tant qu'utilisateur authentifié (via supabase.auth.getUser)
-- --    que la lecture fonctionne toujours pour tous les rôles de rbac-config.ts
-- --    qui ont ordonnancements dans leurs accessRules.
-- =============================================================================
