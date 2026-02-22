-- Prompt 5: Ajout colonnes fiscales BIC/BNC/Pénalités de retard
-- Permet les retenues fiscales individuelles avec toggles dans le formulaire

ALTER TABLE budget_liquidations
  ADD COLUMN IF NOT EXISTS retenue_bic_taux numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retenue_bic_montant numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retenue_bnc_taux numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retenue_bnc_montant numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalites_retard numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_retenues numeric DEFAULT 0;

-- Backfill: copier retenue_source vers retenue_bic pour les anciens enregistrements
UPDATE budget_liquidations
SET retenue_bic_taux = COALESCE(retenue_source_taux, 0),
    retenue_bic_montant = COALESCE(retenue_source_montant, 0),
    total_retenues = COALESCE(airsi_montant, 0) + COALESCE(retenue_source_montant, 0)
WHERE retenue_source_montant > 0 OR retenue_source_taux > 0;
