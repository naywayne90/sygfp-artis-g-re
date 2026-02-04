-- Migration: Mise à jour des utilisateurs de test pour les tests E2E
-- Date: 2026-02-02
-- Description: Configure les rôles hiérarchiques et fonctionnels pour les tests

-- =====================================================
-- 1. Mise à jour du profil DG (dg@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'DG',
    profil_fonctionnel = 'Validateur',
    direction_id = '92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf',  -- Direction Générale
    direction_code = 'DG',
    poste = 'Directeur Général',
    updated_at = NOW()
WHERE email = 'dg@arti.ci';

-- =====================================================
-- 2. Mise à jour du profil DAAF (daaf@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'Directeur',
    profil_fonctionnel = 'Validateur',
    direction_id = '4ad86b02-8fa8-4b6e-abff-d9350fbe7928',  -- DAAF
    direction_code = 'DAAF',
    poste = 'Directeur Administratif et Financier',
    updated_at = NOW()
WHERE email = 'daaf@arti.ci';

-- =====================================================
-- 3. Mise à jour du profil Agent DSI (agent.dsi@arti.ci)
-- =====================================================
UPDATE profiles
SET
    role_hierarchique = 'Agent',
    profil_fonctionnel = 'Operationnel',
    direction_id = '6ecac2e4-876d-4197-a27f-cfb03c1cd457',  -- DSI
    direction_code = 'DSI',
    poste = 'Agent Informatique',
    updated_at = NOW()
WHERE email = 'agent.dsi@arti.ci';

-- =====================================================
-- 4. Créer un profil Admin si nécessaire
-- =====================================================
INSERT INTO profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    role_hierarchique,
    profil_fonctionnel,
    direction_id,
    direction_code,
    poste,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'admin@arti.ci',
    'Administrateur Système',
    'Admin',
    'Système',
    'DG',
    'Admin',
    '92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf',  -- Direction Générale
    'DG',
    'Administrateur Système',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@arti.ci'
);

-- =====================================================
-- 5. Vérification des mises à jour
-- =====================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM profiles
    WHERE email IN ('dg@arti.ci', 'daaf@arti.ci', 'agent.dsi@arti.ci')
    AND role_hierarchique IS NOT NULL
    AND profil_fonctionnel IS NOT NULL;

    IF v_count < 3 THEN
        RAISE WARNING 'Attention: Tous les profils de test ne sont pas correctement configurés';
    ELSE
        RAISE NOTICE 'OK: % profils de test configurés correctement', v_count;
    END IF;
END $$;

-- =====================================================
-- Récapitulatif des utilisateurs de test
-- =====================================================
-- | Email              | Rôle Hiérarchique | Profil Fonctionnel | Direction |
-- |--------------------|-------------------|--------------------| ----------|
-- | dg@arti.ci         | DG                | Validateur         | DG        |
-- | daaf@arti.ci       | Directeur         | Validateur         | DAAF      |
-- | agent.dsi@arti.ci  | Agent             | Operationnel       | DSI       |
-- | admin@arti.ci      | DG                | Admin              | DG        |
