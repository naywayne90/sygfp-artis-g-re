-- Migration : Renommer SDMG → DMG
-- La Sous-Direction des Moyens Généraux (SDMG) est devenue
-- la Direction des Moyens Généraux (DMG) avec un Directeur
-- Applied: 24/03/2026

-- 1. Renommer la valeur dans l'enum app_role
ALTER TYPE public.app_role RENAME VALUE 'SDMG' TO 'DMG';

-- 2. Mettre à jour la direction dans la table directions
UPDATE public.directions
SET sigle = 'DMG',
    label = 'Direction des Moyens Généraux'
WHERE sigle = 'SDMG';

-- 3. Mettre à jour validation_hierarchy si références SDMG
UPDATE public.validation_hierarchy SET role = 'DMG' WHERE role = 'SDMG';
