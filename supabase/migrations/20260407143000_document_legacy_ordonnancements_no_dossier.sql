-- =============================================================================
-- Phase C1 — Constat : backfill ordonnancements.dossier_id IMPOSSIBLE
-- =============================================================================
-- Audit 2026-04-07 (plan concurrent-giggling-pearl.md, suite phase B)
--
-- État de la base au 2026-04-07 :
--   - public.dossiers          :   17 lignes (dossiers de la nouvelle chaîne)
--   - public.budget_engagements: 5670 lignes (dont 3363 ord. associées)
--   - public.budget_engagements WHERE dossier_id IS NOT NULL : 0
--   - public.budget_liquidations: 3301 (avec engagement_id) sur 3363 ord.
--   - public.ordonnancements   : 3363 lignes, 100 % avec dossier_id NULL
--
-- Conclusion :
--   La table `dossiers` correspond à la NOUVELLE chaîne de dépense (SEF →
--   AEF → Imputation → EB → PM → Engagement). Les 3363 ordonnancements
--   migrés depuis SQL Server proviennent d'un workflow legacy qui ne
--   modélisait pas la notion de "dossier" : il n'y a donc AUCUNE source
--   pour récupérer dossier_id sur les engagements/liquidations/ordonnancements
--   anciens.
--
-- Décision :
--   - Le backfill prévu en C1 du plan est ABANDONNÉ (impossible).
--   - Les ordonnancements legacy resteront avec dossier_id IS NULL.
--   - L'UI gère déjà ce cas (chain navigation et dashboards inspectent
--     dossier_id ?? pour fallback).
--   - Les NOUVEAUX ordonnancements créés via le formulaire (depuis avril
--     2026) auront naturellement leur dossier_id alimenté car ils passent
--     par les liquidations issues des engagements de la nouvelle chaîne.
--
-- Cette migration ne fait QUE poser un commentaire sur la colonne pour
-- expliciter le constat à toute personne qui inspecterait la table plus tard.
-- =============================================================================

BEGIN;

COMMENT ON COLUMN public.ordonnancements.dossier_id IS
  'NULL pour les 3363 ordonnancements migrés depuis SQL Server (legacy, '
  'pas de notion de dossier en amont). Alimenté pour les ordonnancements '
  'créés via le formulaire après 2026-04-07 quand la liquidation source '
  'provient de la nouvelle chaîne SEF→...→Engagement→Liquidation.';

COMMIT;

-- =============================================================================
-- Vérification (post-apply) :
--
-- SELECT
--   COUNT(*) FILTER (WHERE dossier_id IS NOT NULL) AS avec_dossier,
--   COUNT(*) FILTER (WHERE dossier_id IS NULL)     AS sans_dossier,
--   COUNT(*)                                       AS total
-- FROM public.ordonnancements;
-- → avec_dossier va augmenter au rythme des nouveaux ordonnancements créés.
-- =============================================================================
