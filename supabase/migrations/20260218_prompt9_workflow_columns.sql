-- Prompt 9: Colonnes workflow manquantes pour passation_marche
-- Les colonnes publie_at, cloture_at, etc. existent déjà
-- Ajout uniquement des colonnes manquantes

ALTER TABLE passation_marche
ADD COLUMN IF NOT EXISTS contrat_url TEXT,
ADD COLUMN IF NOT EXISTS motif_rejet_attribution TEXT;
