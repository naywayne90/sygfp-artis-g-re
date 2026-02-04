-- ============================================================
-- SCRIPT: Configuration des Utilisateurs de Test
-- ============================================================
-- À exécuter dans Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf/sql
-- ============================================================

BEGIN;

-- =====================================================
-- 1. Mise à jour du profil DG (dg@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'DG',
    profil_fonctionnel = 'Validateur',
    direction_id = '92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf',
    direction_code = 'DG',
    poste = 'Directeur Général',
    updated_at = NOW()
WHERE email = 'dg@arti.ci';

RAISE NOTICE 'DG mis à jour: %', (SELECT full_name FROM profiles WHERE email = 'dg@arti.ci');

-- =====================================================
-- 2. Mise à jour du profil DAAF (daaf@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'Directeur',
    profil_fonctionnel = 'Validateur',
    direction_id = '4ad86b02-8fa8-4b6e-abff-d9350fbe7928',
    direction_code = 'DAAF',
    poste = 'Directeur Administratif et Financier',
    updated_at = NOW()
WHERE email = 'daaf@arti.ci';

RAISE NOTICE 'DAAF mis à jour: %', (SELECT full_name FROM profiles WHERE email = 'daaf@arti.ci');

-- =====================================================
-- 3. Mise à jour du profil Agent DSI (agent.dsi@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'Agent',
    profil_fonctionnel = 'Operationnel',
    direction_id = '6ecac2e4-876d-4197-a27f-cfb03c1cd457',
    direction_code = 'DSI',
    poste = 'Agent Informatique',
    updated_at = NOW()
WHERE email = 'agent.dsi@arti.ci';

RAISE NOTICE 'Agent DSI mis à jour: %', (SELECT full_name FROM profiles WHERE email = 'agent.dsi@arti.ci');

-- =====================================================
-- 4. Vérification finale
-- =====================================================
SELECT
    email,
    full_name,
    role_hierarchique,
    profil_fonctionnel,
    direction_code,
    poste
FROM profiles
WHERE email IN ('dg@arti.ci', 'daaf@arti.ci', 'agent.dsi@arti.ci')
ORDER BY
    CASE role_hierarchique
        WHEN 'DG' THEN 1
        WHEN 'Directeur' THEN 2
        ELSE 3
    END;

COMMIT;

-- ============================================================
-- Résultat attendu:
-- ============================================================
-- | email              | role_hierarchique | profil_fonctionnel | direction_code |
-- |--------------------|-------------------|--------------------|----------------|
-- | dg@arti.ci         | DG                | Validateur         | DG             |
-- | daaf@arti.ci       | Directeur         | Validateur         | DAAF           |
-- | agent.dsi@arti.ci  | Agent             | Operationnel       | DSI            |
-- ============================================================
