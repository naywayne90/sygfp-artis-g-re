-- Prompt 6 (suite): Unique indexes + data migration JSONB -> soumissionnaires_lot
-- Complément de 20260218_prompt6_soumissionnaires_lot.sql

-- 1. Unique indexes: un prestataire ne peut soumissionner qu'une fois par lot (ou globalement)
CREATE UNIQUE INDEX IF NOT EXISTS idx_soumissionnaires_unique_non_alloti
  ON soumissionnaires_lot(passation_marche_id, prestataire_id)
  WHERE lot_marche_id IS NULL AND prestataire_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_soumissionnaires_unique_alloti
  ON soumissionnaires_lot(passation_marche_id, prestataire_id, lot_marche_id)
  WHERE lot_marche_id IS NOT NULL AND prestataire_id IS NOT NULL;

-- 2. Data migration: JSONB prestataires_sollicites -> soumissionnaires_lot
-- Insère les prestataires existants depuis le champ JSONB vers la table relationnelle
INSERT INTO soumissionnaires_lot (passation_marche_id, prestataire_id, raison_sociale, offre_financiere, statut)
SELECT
  pm.id,
  (ps->>'prestataire_id')::uuid,
  COALESCE(ps->>'raison_sociale', ''),
  CASE WHEN ps->>'offre_montant' IS NOT NULL AND ps->>'offre_montant' != 'null'
    THEN (ps->>'offre_montant')::numeric(18,2)
    ELSE NULL
  END,
  CASE WHEN (ps->>'selectionne')::boolean = true THEN 'retenu' ELSE 'recu' END
FROM passation_marche pm,
  jsonb_array_elements(pm.prestataires_sollicites) AS ps
WHERE pm.prestataires_sollicites IS NOT NULL
  AND jsonb_array_length(pm.prestataires_sollicites) > 0
  AND ps->>'prestataire_id' IS NOT NULL
  AND ps->>'prestataire_id' != 'null'
ON CONFLICT DO NOTHING;
