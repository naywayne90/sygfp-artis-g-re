-- ============================================================================
-- SYGFP - Seed de données de démonstration
-- Migration: 20260119100000_seed_demo_data.sql
-- Approche: ADDITIF UNIQUEMENT - Ne supprime aucune donnée existante
-- ============================================================================

-- 1. Exercice de démo 2026 (si n'existe pas)
INSERT INTO exercices_budgetaires (annee, libelle, statut, date_debut, date_fin)
SELECT 2026, 'Exercice 2026 - Démo', 'ouvert', '2026-01-01', '2026-12-31'
WHERE NOT EXISTS (SELECT 1 FROM exercices_budgetaires WHERE annee = 2026);

-- 2. Objectif stratégique de démo
INSERT INTO objectifs_strategiques (code, libelle, description, exercice)
SELECT 'OS-DEMO-01', 'Objectif Stratégique Démonstration', 'Objectif pour tests de non-régression', 2026
WHERE NOT EXISTS (SELECT 1 FROM objectifs_strategiques WHERE code = 'OS-DEMO-01');

-- 3. Mission de démo
INSERT INTO missions (code, libelle, objectif_id, exercice)
SELECT 'M-DEMO-01', 'Mission Démonstration',
       (SELECT id FROM objectifs_strategiques WHERE code = 'OS-DEMO-01' LIMIT 1),
       2026
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'M-DEMO-01')
  AND EXISTS (SELECT 1 FROM objectifs_strategiques WHERE code = 'OS-DEMO-01');

-- 4. Action de démo
INSERT INTO actions (code, libelle, mission_id, exercice)
SELECT 'A-DEMO-01', 'Action Démonstration',
       (SELECT id FROM missions WHERE code = 'M-DEMO-01' LIMIT 1),
       2026
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'A-DEMO-01')
  AND EXISTS (SELECT 1 FROM missions WHERE code = 'M-DEMO-01');

-- 5. Activité de démo (avec direction_id)
INSERT INTO activites (code, libelle, action_id, direction_id, exercice)
SELECT 'ACT-DEMO-01', 'Activité Démonstration Tests',
       (SELECT id FROM actions WHERE code = 'A-DEMO-01' LIMIT 1),
       (SELECT id FROM directions LIMIT 1),
       2026
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = 'ACT-DEMO-01')
  AND EXISTS (SELECT 1 FROM actions WHERE code = 'A-DEMO-01')
  AND EXISTS (SELECT 1 FROM directions);

-- 6. Sous-activité de démo
INSERT INTO sous_activites (code, libelle, activite_id, exercice)
SELECT 'SA-DEMO-01', 'Sous-Activité Démonstration',
       (SELECT id FROM activites WHERE code = 'ACT-DEMO-01' LIMIT 1),
       2026
WHERE NOT EXISTS (SELECT 1 FROM sous_activites WHERE code = 'SA-DEMO-01')
  AND EXISTS (SELECT 1 FROM activites WHERE code = 'ACT-DEMO-01');

-- 7. Source de financement de démo
INSERT INTO sources_financement (code, libelle, description, exercice_id)
SELECT 'SF-DEMO', 'Source Budget État (Démo)', 'Source de financement pour tests',
       (SELECT id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM sources_financement WHERE code = 'SF-DEMO')
  AND EXISTS (SELECT 1 FROM exercices_budgetaires WHERE annee = 2026);

-- 8. Ligne budgétaire de démo avec dotation suffisante
INSERT INTO lignes_budget (
  code,
  libelle,
  activite_id,
  source_financement_id,
  exercice_id,
  dotation_initiale,
  dotation_modifiee,
  engage,
  liquide,
  ordonnance,
  disponible
)
SELECT
  'LB-DEMO-2026-001',
  'Ligne Budgétaire Démonstration',
  (SELECT id FROM activites WHERE code = 'ACT-DEMO-01' LIMIT 1),
  (SELECT id FROM sources_financement WHERE code = 'SF-DEMO' LIMIT 1),
  (SELECT id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1),
  100000000, -- 100 millions FCFA
  100000000,
  0,
  0,
  0,
  100000000
WHERE NOT EXISTS (SELECT 1 FROM lignes_budget WHERE code = 'LB-DEMO-2026-001')
  AND EXISTS (SELECT 1 FROM activites WHERE code = 'ACT-DEMO-01')
  AND EXISTS (SELECT 1 FROM sources_financement WHERE code = 'SF-DEMO')
  AND EXISTS (SELECT 1 FROM exercices_budgetaires WHERE annee = 2026);

-- 9. Tiers / Bénéficiaire de démo
INSERT INTO tiers (
  code,
  raison_sociale,
  nif,
  adresse,
  telephone,
  email,
  type_tiers,
  statut
)
SELECT
  'TIERS-DEMO-001',
  'Fournisseur Démonstration SARL',
  'NIF-DEMO-12345',
  '123 Avenue de Test, Libreville',
  '+241 01 23 45 67',
  'contact@demo-fournisseur.test',
  'fournisseur',
  'actif'
WHERE NOT EXISTS (SELECT 1 FROM tiers WHERE code = 'TIERS-DEMO-001');

-- 10. Compte bancaire de démo
INSERT INTO comptes_bancaires (
  code,
  libelle,
  numero_compte,
  banque,
  agence,
  rib,
  type_compte,
  solde_initial,
  solde_actuel,
  exercice_id,
  statut
)
SELECT
  'CB-DEMO-001',
  'Compte Trésor Démo',
  '001-DEMO-00001234567',
  'BGFI Bank',
  'Libreville Centre',
  'GA001 00001 00001234567 89',
  'tresor',
  500000000,
  500000000,
  (SELECT id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1),
  'actif'
WHERE NOT EXISTS (SELECT 1 FROM comptes_bancaires WHERE code = 'CB-DEMO-001')
  AND EXISTS (SELECT 1 FROM exercices_budgetaires WHERE annee = 2026);

-- ============================================================================
-- FIN DU SEED DE DONNÉES DE DÉMONSTRATION
-- ============================================================================

-- Note: Les utilisateurs de démo doivent être créés via l'Edge Function create-user
-- car Supabase Auth requiert un processus spécifique pour la création d'utilisateurs.
--
-- Utilisateurs suggérés pour le test:
-- - agent_demo@sygfp.demo (Agent)
-- - gestionnaire_demo@sygfp.demo (Gestionnaire)
-- - validateur_demo@sygfp.demo (Validateur)
-- - daaf_demo@sygfp.demo (DAAF)
-- - dg_demo@sygfp.demo (DG)
-- - admin_demo@sygfp.demo (Admin)
