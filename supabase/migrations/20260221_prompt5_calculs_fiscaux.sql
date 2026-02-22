-- Prompt 5: Colonnes fiscales avancées pour budget_liquidations
-- BIC, BNC, pénalités détaillées, tva_applicable

ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS tva_applicable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS penalites_montant numeric DEFAULT null,
  ADD COLUMN IF NOT EXISTS penalites_nb_jours integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS penalites_taux_journalier numeric DEFAULT null;

-- Backfill: tva_applicable basé sur tva_montant existant
UPDATE budget_liquidations SET tva_applicable = true WHERE tva_montant > 0 AND tva_applicable IS NULL;
UPDATE budget_liquidations SET tva_applicable = false WHERE (tva_montant IS NULL OR tva_montant = 0) AND tva_applicable IS NULL;

-- Backfill: penalites_montant depuis penalites_retard legacy
UPDATE budget_liquidations SET penalites_montant = penalites_retard WHERE penalites_retard > 0 AND penalites_montant IS NULL;
