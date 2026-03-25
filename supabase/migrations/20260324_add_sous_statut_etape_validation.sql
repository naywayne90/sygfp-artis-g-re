-- ============================================================
-- Migration Phase 1 : Ajout des colonnes sous_statut et etape_validation
-- aux 10 tables de la chaine de depense.
--
-- Contexte: Reforme des statuts SYGFP - preparation.
-- Ces colonnes sont NULLABLE et sans contrainte pour l'instant.
-- Aucune donnee existante n'est modifiee.
-- ============================================================

BEGIN;

-- 1. notes_sef
ALTER TABLE notes_sef
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN notes_sef.sous_statut IS 'Sous-statut metier quand statut=termine (ex: valide_final)';
COMMENT ON COLUMN notes_sef.etape_validation IS 'Etape courante de validation multi-etapes (1=SAF, 2=CB, 3=DAAF, 4=DG)';

-- 2. notes_dg (Notes AEF)
ALTER TABLE notes_dg
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN notes_dg.sous_statut IS 'Sous-statut metier quand statut=termine (ex: impute, a_imputer)';
COMMENT ON COLUMN notes_dg.etape_validation IS 'Etape courante de validation multi-etapes';

-- 3. imputations
ALTER TABLE imputations
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN imputations.sous_statut IS 'Sous-statut metier quand statut=termine (ex: impute)';
COMMENT ON COLUMN imputations.etape_validation IS 'Etape courante de validation multi-etapes';

-- 4. expressions_besoin
ALTER TABLE expressions_besoin
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN expressions_besoin.sous_statut IS 'Sous-statut metier quand statut=termine (ex: approuve)';
COMMENT ON COLUMN expressions_besoin.etape_validation IS 'Etape courante de validation multi-etapes';

-- 5. passation_marche
ALTER TABLE passation_marche
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN passation_marche.sous_statut IS 'Sous-statut metier / phase passation (ex: attribue, signe)';
COMMENT ON COLUMN passation_marche.etape_validation IS 'Etape courante de validation multi-etapes';

-- 6. marches
ALTER TABLE marches
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN marches.sous_statut IS 'Sous-statut metier / phase marche (ex: attribue, signe)';
COMMENT ON COLUMN marches.etape_validation IS 'Etape courante de validation multi-etapes';

-- 7. budget_engagements
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN budget_engagements.sous_statut IS 'Sous-statut metier quand statut=termine (ex: engage)';
COMMENT ON COLUMN budget_engagements.etape_validation IS 'Etape courante de validation: 1=SAF, 2=CB, 3=DAAF, 4=DG';

-- 8. budget_liquidations
ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN budget_liquidations.sous_statut IS 'Sous-statut metier quand statut=termine (ex: liquide)';
COMMENT ON COLUMN budget_liquidations.etape_validation IS 'Etape courante de validation: 1=DAAF, 2=DG';

-- 9. ordonnancements
ALTER TABLE ordonnancements
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN ordonnancements.sous_statut IS 'Sous-statut metier quand statut=termine (ex: signe)';
COMMENT ON COLUMN ordonnancements.etape_validation IS 'Etape courante de validation/signature: 1=SAF, 2=CB, 3=DAF, 4=DG';

-- 10. reglements
ALTER TABLE reglements
  ADD COLUMN IF NOT EXISTS sous_statut TEXT,
  ADD COLUMN IF NOT EXISTS etape_validation INTEGER;

COMMENT ON COLUMN reglements.sous_statut IS 'Sous-statut metier quand statut=termine (ex: paye)';
COMMENT ON COLUMN reglements.etape_validation IS 'Etape courante de validation';

COMMIT;
