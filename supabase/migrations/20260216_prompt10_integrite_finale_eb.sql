-- ============================================================
-- Prompt 10 BACKEND — Intégrité finale expressions_besoin
-- Date: 2026-02-16
-- Description: Rapport d'audit d'intégrité (lecture seule)
--   Aucune modification DDL/DML - rapport uniquement
-- ============================================================

-- ============================================================
-- 1. TOTAL EXPRESSIONS_BESOIN
-- ============================================================
-- Résultat: 3146

-- ============================================================
-- 2. DISTRIBUTION PAR STATUT
-- ============================================================
-- | statut    | count |
-- |-----------|-------|
-- | brouillon |    76 |
-- | rejete    |    51 |
-- | valide    | 3 019 |
-- TOTAL = 3 146 ✅ cohérent avec point 1

-- ============================================================
-- 3. EXPRESSIONS VALIDÉES SANS validated_by
-- ============================================================
-- Résultat: 3 019
-- ATTENDU: toutes les EB legacy (SQL Server) n'ont pas validated_by
-- Le champ validated_by a été ajouté au Prompt 6 (migration 20260215)
-- Les nouvelles EB passant par le workflow auront validated_by renseigné
-- → NORMAL, pas d'action requise

-- ============================================================
-- 4. EXPRESSIONS SANS ARTICLES
-- ============================================================
-- 4a. EB avec liste_articles vide: 3 146 (100% - legacy SQL Server)
-- 4b. EB avec lignes dans expression_besoin_lignes: 0
-- 4c. Total lignes expression_besoin_lignes: 0
-- EXPLICATION: la table expression_besoin_lignes a été créée au Prompt 4
--   Les EB legacy utilisaient le champ JSONB liste_articles (toujours vide)
--   Les nouvelles EB utiliseront expression_besoin_lignes via le formulaire
-- → NORMAL pour les données legacy

-- ============================================================
-- 5. INTÉGRITÉ MONTANT (total articles ≠ montant_total)
-- ============================================================
-- Résultat: 0 incohérence ✅
-- Le trigger fn_enforce_eb_workflow vérifie montant_estime ≤ montant imputation

-- ============================================================
-- 6. FK ORPHELINS
-- ============================================================
-- 6a. direction_id orphelin:   0 ✅
-- 6b. imputation_id orphelin:  0 ✅
-- 6c. created_by orphelin:     0 ✅
-- 6d. lignes orphelines:       0 ✅

-- ============================================================
-- 7. ANALYZE (VACUUM impossible dans transaction SQL Editor)
-- ============================================================
-- ANALYZE expressions_besoin; → OK
-- ANALYZE expression_besoin_lignes; → OK

-- ============================================================
-- 8. TRANSITION → MODULE PASSATION DE MARCHÉ
-- ============================================================

-- 8a. Table marches EXISTS: OUI
-- 8b. Table procedures EXISTS: NON (pas de table séparée)
-- 8c. Tables marché existantes (10):
--   - marches (table principale)
--   - passation_marche
--   - marche_sequences
--   - marche_validations
--   - marche_attachments
--   - marche_lots
--   - marche_offres
--   - marche_historique
--   - marche_documents
--   - v_marches_stats (vue)

-- 8d. Lien EB → Marché:
--   - expressions_besoin.marche_id (FK vers marches.id)
--   - expressions_besoin.type_procedure (texte, mode de passation)

-- 8e. Schéma table marches (47 colonnes, visibles 1-15):
--   | # | Colonne                    | Type          |
--   |---|----------------------------|---------------|
--   | 1 | id                         | uuid NOT NULL |
--   | 2 | numero                     | text          |
--   | 3 | note_id                    | uuid          |
--   | 4 | objet                      | text NOT NULL |
--   | 5 | montant                    | numeric NOT NULL |
--   | 6 | mode_passation             | text NOT NULL |
--   | 7 | mode_force                 | boolean       |
--   | 8 | justification_derogation   | text          |
--   | 9 | autorisation_path          | text          |
--   |10 | prestataire_id             | uuid          |
--   |11 | statut                     | text          |
--   |12 | date_lancement             | date          |
--   |13 | date_attribution           | date          |
--   |14 | date_signature             | date          |
--   |15 | created_by                 | uuid          |
--   ... (+ 32 autres colonnes, total 47)

-- 8f. Total marchés: 16
-- 8g. Distribution statuts marchés:
--   | statut          | count |
--   |-----------------|-------|
--   | en_preparation  |    15 |
--   | attribue        |     1 |

-- 8h. EB liées à un marché: 0 (aucune EB n'a encore de marche_id)
-- 8i. Passation de marché: 0 (table passation_marche vide)

-- ============================================================
-- RÉSUMÉ PROMPT 10
-- ============================================================
-- ✅ 1. Total EB: 3 146
-- ✅ 2. Statuts cohérents: brouillon(76) + rejete(51) + valide(3019) = 3146
-- ⚠️ 3. 3019 validées sans validated_by → legacy attendu
-- ⚠️ 4. 3146 sans articles → legacy attendu (expression_besoin_lignes = Prompt 4)
-- ✅ 5. 0 incohérence montant
-- ✅ 6. 0 FK orphelin
-- ✅ 7. ANALYZE exécuté
-- ✅ 8. TRANSITION: 16 marchés existants, 10 tables marché prêtes
--        Lien EB→Marché via marche_id + type_procedure
--        Aucune EB encore liée (flux à implémenter)
