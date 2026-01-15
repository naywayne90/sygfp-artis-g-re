-- Réactiver le trigger (car les profils ont été mis à jour avec succès)
ALTER TABLE profiles ENABLE TRIGGER check_profile_update_trigger;

-- =============================================
-- SUPPRESSION DES RÔLES INVITE ET ATTRIBUTION DES BONS RÔLES
-- =============================================
-- Utiliser les rôles existants dans l'enum app_role

DELETE FROM user_roles 
WHERE role = 'INVITE' 
AND user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'admin@arti.ci', 'dg@arti.ci', 'daaf@arti.ci', 'cb@arti.ci',
    'dsi@arti.ci', 'dcp@arti.ci', 'stats@arti.ci',
    'agent.daaf@arti.ci', 'agent.dsi@arti.ci', 'agent.dcp@arti.ci'
  )
);

-- Insérer les bons rôles avec l'enum correct
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'ADMIN'::app_role, true, now() FROM profiles WHERE email = 'admin@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'DG'::app_role, true, now() FROM profiles WHERE email = 'dg@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'DAAF'::app_role, true, now() FROM profiles WHERE email = 'daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'CB'::app_role, true, now() FROM profiles WHERE email = 'cb@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Pour les chefs de direction, utiliser SDMG (Chef de service technique)
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG'::app_role, true, now() FROM profiles WHERE email = 'dsi@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG'::app_role, true, now() FROM profiles WHERE email = 'dcp@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG'::app_role, true, now() FROM profiles WHERE email = 'stats@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Pour les agents, utiliser OPERATEUR
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR'::app_role, true, now() FROM profiles WHERE email = 'agent.daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR'::app_role, true, now() FROM profiles WHERE email = 'agent.dsi@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR'::app_role, true, now() FROM profiles WHERE email = 'agent.dcp@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;