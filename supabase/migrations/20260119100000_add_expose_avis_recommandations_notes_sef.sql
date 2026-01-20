-- Migration: Ajout des champs expose, avis, recommandations aux notes_sef
-- Date: 2026-01-19
-- Description: Ajoute 3 champs optionnels pour le contenu détaillé des notes SEF
-- ADDITIF UNIQUEMENT - Aucun rename, aucune suppression

-- Ajout des colonnes (NULL autorisé, pas de valeur par défaut bloquante)
ALTER TABLE notes_sef
ADD COLUMN IF NOT EXISTS expose TEXT,
ADD COLUMN IF NOT EXISTS avis TEXT,
ADD COLUMN IF NOT EXISTS recommandations TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN notes_sef.expose IS 'Exposé détaillé de la situation/contexte de la demande';
COMMENT ON COLUMN notes_sef.avis IS 'Avis technique ou fonctionnel sur la demande';
COMMENT ON COLUMN notes_sef.recommandations IS 'Recommandations pour le traitement de la demande';

-- Index optionnel pour recherche full-text (si nécessaire plus tard)
-- CREATE INDEX IF NOT EXISTS idx_notes_sef_expose_gin ON notes_sef USING gin(to_tsvector('french', COALESCE(expose, '')));
-- CREATE INDEX IF NOT EXISTS idx_notes_sef_avis_gin ON notes_sef USING gin(to_tsvector('french', COALESCE(avis, '')));
-- CREATE INDEX IF NOT EXISTS idx_notes_sef_recommandations_gin ON notes_sef USING gin(to_tsvector('french', COALESCE(recommandations, '')));
