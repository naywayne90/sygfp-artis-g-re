-- Ajout colonnes expose, avis, recommandations manquantes dans notes_sef
-- Ces colonnes étaient prévues mais la migration n'avait pas été appliquée
-- Applied: 24/03/2026

ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS expose TEXT,
ADD COLUMN IF NOT EXISTS avis TEXT,
ADD COLUMN IF NOT EXISTS recommandations TEXT;

NOTIFY pgrst, 'reload schema';
