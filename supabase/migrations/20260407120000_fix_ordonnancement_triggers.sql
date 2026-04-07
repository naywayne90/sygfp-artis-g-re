-- =============================================================================
-- Phase B1 — Nettoyage des triggers de numérotation des ordonnancements
-- =============================================================================
-- Audit 2026-04-07 (plan concurrent-giggling-pearl.md) :
-- 3 triggers BEFORE INSERT cohabitent sur public.ordonnancements pour la
-- numérotation, dont un SANS condition WHEN qui avance la séquence partagée
-- ordonnancement_sequences à chaque INSERT (même quand un numéro est déjà
-- fourni), créant des trous massifs dans la numérotation.
--
-- État constaté :
--  1. generate_ordonnancement_numero_trigger  — BEFORE INSERT, pas de WHEN,
--     appelle generate_ordonnancement_numero() (format ORD-YYYY-NNNN)
--  2. set_ordonnancement_numero               — BEFORE INSERT, WHEN (numero null),
--     appelle generate_mandat_numero() (format MANDAT-YYYY-NNNNNN)
--  3. trigger_generate_ordonnancement_numero  — BEFORE INSERT, WHEN (numero null),
--     appelle generate_ordonnancement_numero() (format ORD-YYYY-NNNN)
--
-- Conséquence observée en base : 3362 lignes, dernier numéro = ORD-2026-6119
-- → ~2757 numéros "perdus" dans la séquence à cause du trigger sans WHEN.
--
-- Décision :
--  - Les 3362 ordonnancements existants sont au format ORD-YYYY-NNNN (cohérent
--    avec l'historique métier). Basculer au format MANDAT- casserait la
--    cohérence visuelle et fonctionnelle.
--  - On conserve donc UNIQUEMENT le trigger #3 (trigger_generate_ordonnancement_numero)
--    qui produit le format historique avec la bonne condition WHEN.
--  - On drop le #1 (doublon sans WHEN, source du bug) et le #2 (format différent).
--
-- Non-régression :
--  - Les numéros existants ne sont pas touchés (aucun UPDATE).
--  - Le format des nouveaux ordonnancements reste ORD-YYYY-NNNN (identique).
--  - La séquence ordonnancement_sequences.dernier_numero continue à partir de
--    sa valeur courante (pas de reset).
--
-- Rollback : recréer les 2 triggers droppés avec leurs CREATE TRIGGER d'origine
-- (préservés dans les migrations 20260106060853 et 20260106170508).
-- =============================================================================

BEGIN;

-- Drop des 2 triggers redondants / problématiques
DROP TRIGGER IF EXISTS generate_ordonnancement_numero_trigger ON public.ordonnancements;
DROP TRIGGER IF EXISTS set_ordonnancement_numero              ON public.ordonnancements;

-- Documentation du trigger restant
COMMENT ON TRIGGER trigger_generate_ordonnancement_numero ON public.ordonnancements IS
  'Unique trigger actif de numérotation des ordonnancements (format ORD-YYYY-NNNN). '
  'Nettoyé le 2026-04-07 — drop de generate_ordonnancement_numero_trigger (sans WHEN, '
  'qui créait des trous dans la séquence) et set_ordonnancement_numero (format MANDAT- '
  'incompatible avec les 3362 ordonnancements existants).';

-- La fonction generate_mandat_numero() et les triggers droppés ne sont plus
-- référencés mais on conserve la fonction côté DB pour un éventuel rollback.
-- (pas de DROP FUNCTION — la fonction reste inutilisée et documentée comme telle)
COMMENT ON FUNCTION public.generate_mandat_numero() IS
  'DEPRECATED (2026-04-07) — fonction laissée en place pour rollback uniquement. '
  'Format MANDAT-YYYY-NNNNNN non utilisé : les ordonnancements sont numérotés '
  'ORD-YYYY-NNNN via generate_ordonnancement_numero().';

COMMIT;

-- =============================================================================
-- Vérifications post-migration (à exécuter manuellement après apply) :
--
-- -- 1. Il ne doit rester qu'un seul trigger BEFORE INSERT de numérotation :
-- SELECT tgname, pg_get_triggerdef(oid) AS def
-- FROM pg_trigger
-- WHERE tgrelid = 'public.ordonnancements'::regclass
--   AND NOT tgisinternal
--   AND tgtype & 2 = 2  -- BEFORE
--   AND tgtype & 4 = 4  -- INSERT
-- ORDER BY tgname;
-- -- → Doit retourner uniquement trigger_generate_ordonnancement_numero
--
-- -- 2. Tester un INSERT pour valider le format :
-- BEGIN;
-- INSERT INTO public.ordonnancements (exercice, statut, montant)
-- VALUES (2026, 'soumis', 1) RETURNING numero;
-- -- → Doit retourner un numéro au format ORD-2026-NNNN
-- ROLLBACK;
-- =============================================================================
