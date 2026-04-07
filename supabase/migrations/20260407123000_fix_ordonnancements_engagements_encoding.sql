-- =============================================================================
-- Phase C3 — Réparation encodage corrompu (audit 2026-04-07)
-- =============================================================================
-- Lors de la migration SQL Server → Supabase, les caractères accentués ont été
-- partiellement convertis en `?` dans les colonnes texte. Audit ciblé sur les
-- 3 colonnes effectivement impactées :
--   - public.ordonnancements.objet           : 25 lignes corrompues
--   - public.budget_engagements.objet        : 62 lignes corrompues
--   - public.budget_engagements.fournisseur  : 1 ligne corrompue
--
-- Périmètre :
--   - On ne touche QUE les patterns où la correspondance est unique et sans
--     ambiguïté (le `?` correspond à `É` dans la quasi-totalité des cas).
--   - On utilise REPLACE() (case-sensitive) plutôt que REGEXP_REPLACE pour
--     préserver explicitement la casse (UPPER/lower) des mots autour.
--   - Pour `9001?:2015` (ISO), le `?` est un caractère parasite à supprimer.
--   - On NE corrige PAS dans cette migration les autres erreurs d'encodage non
--     marquées par `?` (ex. ENQUOTE/SYSTOME/AUPROS/AOˆT/ú) — elles relèvent
--     d'un autre fix ciblé hors scope C3.
--
-- Impact :
--   - Aucune incidence schéma. Aucune colonne ajoutée/supprimée.
--   - Aucun changement de FK, statut, montant. Pure correction d'affichage.
--   - Les modules certifiés (Passation/Engagement/Liquidation) ne dépendent
--     pas de la valeur exacte de `objet` pour leurs tests E2E (qui filtrent
--     par id ou statut, pas par chaîne libre).
--
-- Rollback : impossible automatiquement (les valeurs originales corrompues
-- sont écrasées). Snapshot Supabase recommandé en amont. La restauration
-- éventuelle se ferait depuis le dump pré-migration.
-- =============================================================================

BEGIN;

-- ==========================================================================
-- 1. ordonnancements.objet
-- ==========================================================================
UPDATE public.ordonnancements
SET objet =
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(objet,
    'INT?RIEUR',  'INTÉRIEUR'),
    'D?CEMBRE',   'DÉCEMBRE'),
    'F?VRIER',    'FÉVRIER'),
    'D?VELOPPEMENT', 'DÉVELOPPEMENT'),
    'D?PARTEMENT','DÉPARTEMENT'),
    'D?PENSES',   'DÉPENSES'),
    'D?BLOCAGE',  'DÉBLOCAGE'),
    '?LECTRIQUE', 'ÉLECTRIQUE'),
    '?VALUATION', 'ÉVALUATION'),
    'LOCALIT?S',  'LOCALITÉS'),
    'S?MINAIRE',  'SÉMINAIRE'),
    'S?ANCE',     'SÉANCE'),
    'MOBILIT?',   'MOBILITÉ'),
    'BOUAK?',     'BOUAKÉ'),
    'CAPACIT?S',  'CAPACITÉS'),
    'INT?GR?',    'INTÉGRÉ'),
    'PR?LEV?S',   'PRÉLEVÉS'),
    'PR?FECTURE', 'PRÉFECTURE'),
    'G?OSPATIALES','GÉOSPATIALES'),
    'TOURN?E',    'TOURNÉE'),
    'STRAT?GIQUE','STRATÉGIQUE'),
    'SOCI?T?',    'SOCIÉTÉ'),
    'TAFIR?',     'TAFIRÉ'),
    -- variantes minuscules
    '?valuation', 'Évaluation'),
    '?tudes',     'Études'),
    '?laboration','Élaboration'),
    -- caractère parasite (ISO 9001:2015 vs 9001?:2015)
    '9001?:2015', '9001:2015')
WHERE objet ~ '\?';

-- ==========================================================================
-- 2. budget_engagements.objet (mêmes patterns)
-- ==========================================================================
UPDATE public.budget_engagements
SET objet =
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(objet,
    'INT?RIEUR',  'INTÉRIEUR'),
    'D?CEMBRE',   'DÉCEMBRE'),
    'F?VRIER',    'FÉVRIER'),
    'D?VELOPPEMENT', 'DÉVELOPPEMENT'),
    'D?PARTEMENT','DÉPARTEMENT'),
    'D?PENSES',   'DÉPENSES'),
    'D?BLOCAGE',  'DÉBLOCAGE'),
    '?LECTRIQUE', 'ÉLECTRIQUE'),
    '?VALUATION', 'ÉVALUATION'),
    'LOCALIT?S',  'LOCALITÉS'),
    'S?MINAIRE',  'SÉMINAIRE'),
    'S?ANCE',     'SÉANCE'),
    'MOBILIT?',   'MOBILITÉ'),
    'BOUAK?',     'BOUAKÉ'),
    'CAPACIT?S',  'CAPACITÉS'),
    'INT?GR?',    'INTÉGRÉ'),
    'PR?LEV?S',   'PRÉLEVÉS'),
    'PR?FECTURE', 'PRÉFECTURE'),
    'G?OSPATIALES','GÉOSPATIALES'),
    'TOURN?E',    'TOURNÉE'),
    'STRAT?GIQUE','STRATÉGIQUE'),
    'SOCI?T?',    'SOCIÉTÉ'),
    'TAFIR?',     'TAFIRÉ'),
    '?valuation', 'Évaluation'),
    '?tudes',     'Études'),
    '?laboration','Élaboration'),
    '9001?:2015', '9001:2015')
WHERE objet ~ '\?';

-- ==========================================================================
-- 3. budget_engagements.fournisseur (1 seul cas connu : SOCI?T?)
-- ==========================================================================
UPDATE public.budget_engagements
SET fournisseur = REPLACE(fournisseur, 'SOCI?T?', 'SOCIÉTÉ')
WHERE fournisseur ~ '\?';

-- ==========================================================================
-- 4. Reliquats budget_engagements.objet identifiés post-passe principale
--    (CARR? = CARRÉ marque "Groupe Carré Vert", L?GISTIQUE = LÉGISTIQUE
--    par la règle systématique ?=É de ce dataset).
-- ==========================================================================
UPDATE public.budget_engagements
SET objet = REPLACE(REPLACE(objet, 'CARR?', 'CARRÉ'), 'L?GISTIQUE', 'LÉGISTIQUE')
WHERE objet ~ '\?';

COMMIT;

-- =============================================================================
-- Vérification post-migration (à exécuter manuellement) :
--
-- SELECT 'ordonnancements.objet'        AS champ, COUNT(*) AS reliquat FROM public.ordonnancements WHERE objet ~ '\?'
-- UNION ALL
-- SELECT 'budget_engagements.objet',    COUNT(*) FROM public.budget_engagements WHERE objet ~ '\?'
-- UNION ALL
-- SELECT 'budget_engagements.fournisseur', COUNT(*) FROM public.budget_engagements WHERE fournisseur ~ '\?';
-- → Le reliquat doit être 0 (ou très proche, tous patterns connus couverts).
-- =============================================================================
