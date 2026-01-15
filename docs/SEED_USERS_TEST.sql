-- =====================================================
-- GUIDE: Création d'utilisateurs test - Notes SEF / SYGFP
-- =====================================================
-- IMPORTANT: Les profils sont liés à auth.users par foreign key.
-- Il est impossible d'insérer directement dans profiles sans créer
-- d'abord l'utilisateur dans Supabase Auth.
--
-- =====================================================
-- MÉTHODE 1: Dashboard Supabase (RECOMMANDÉ)
-- =====================================================
-- 
-- 1. Aller sur: https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf/auth/users
-- 2. Cliquer "Add user" > "Create new user"
-- 3. Renseigner email + password
-- 4. ✅ Cocher "Auto-confirm user"
-- 5. Le profil sera créé automatiquement par le trigger handle_new_user
--
-- =====================================================
-- MÉTHODE 2: Edge Function create-user (API)
-- =====================================================
-- POST /functions/v1/create-user
-- Body: { 
--   "email": "user@arti.ci", 
--   "password": "Test2026!", 
--   "first_name": "Prénom", 
--   "last_name": "NOM",
--   "role": "OPERATIONNEL"
-- }
--
-- =====================================================
-- UTILISATEURS TEST CONFIGURÉS (ÉTAT ACTUEL)
-- =====================================================
-- Ces utilisateurs ont été créés et configurés dans la base:
--
-- | #  | Email                | Nom complet           | Poste                           | Direction | Rôle      | Password   |
-- |----|----------------------|-----------------------|---------------------------------|-----------|-----------|------------|
-- | 1  | ange.nimba@arti.ci   | Ange NIMBA            | Chief Technology Officer        | DG        | ADMIN,DG  | (existant) |
-- | 2  | admin@arti.ci        | Admin SYSTEM          | Administrateur Système          | DAAF      | ADMIN     | Test1234!  |
-- | 3  | dg@arti.ci           | Directeur GENERAL     | Directeur Général               | DG        | DG        | Test1234!  |
-- | 4  | daaf@arti.ci         | Chef DAAF             | Dir. Administratif et Financier | DAAF      | DAAF      | Test1234!  |
-- | 5  | cb@arti.ci           | Contrôleur BUDGETAIRE | Contrôleur Budgétaire           | CB        | CB        | Test1234!  |
-- | 6  | dsi@arti.ci          | Chef DSI              | Dir. Systèmes d'Information     | DSI       | SDMG      | Test1234!  |
-- | 7  | dcp@arti.ci          | Chef DCP              | Dir. Communication Partenariat  | DCP       | SDMG      | Test1234!  |
-- | 8  | stats@arti.ci        | Chef STATS            | Dir. Statistiques et Études     | STATS     | SDMG      | Test1234!  |
-- | 9  | agent.daaf@arti.ci   | Agent DAAF            | Agent Financier                 | DAAF      | OPERATEUR | Test1234!  |
-- | 10 | agent.dsi@arti.ci    | Agent DSI             | Agent Informatique              | DSI       | OPERATEUR | Test1234!  |
-- | 11 | agent.dcp@arti.ci    | Agent DCP             | Agent Communication             | DCP       | OPERATEUR | Test1234!  |
--
-- =====================================================
-- SCÉNARIOS DE TEST - Workflow Notes SEF
-- =====================================================
--
-- | Scénario                  | Se connecter avec    |
-- |---------------------------|----------------------|
-- | Créer une note SEF        | agent.daaf@arti.ci   |
-- | Valider une note (DG)     | dg@arti.ci           |
-- | Viser une note (DAAF)     | daaf@arti.ci         |
-- | Contrôle budgétaire       | cb@arti.ci           |
-- | Administration système    | admin@arti.ci        |
--
-- =====================================================
-- SCRIPT DE CRÉATION (si recréation nécessaire)
-- =====================================================
-- Si vous devez recréer les utilisateurs, suivez ces étapes:
--
-- ÉTAPE 1: Créer les users dans Supabase Auth Dashboard
-- (voir MÉTHODE 1 ci-dessus)
--
-- ÉTAPE 2: Exécuter ce script pour configurer les profils
-- (nécessite privilèges admin ou désactivation temporaire du trigger)

-- Désactiver le trigger de protection (si nécessaire)
-- ALTER TABLE profiles DISABLE TRIGGER check_profile_update_trigger;

-- Mise à jour des profils
UPDATE public.profiles SET
  first_name = 'Admin',
  last_name = 'SYSTEM',
  full_name = 'Admin SYSTEM',
  poste = 'Administrateur Système',
  direction_id = (SELECT id FROM directions WHERE code = '02' LIMIT 1),
  is_active = true
WHERE email = 'admin@arti.ci';

UPDATE public.profiles SET
  first_name = 'Directeur',
  last_name = 'GENERAL',
  full_name = 'Directeur GENERAL',
  poste = 'Directeur Général',
  direction_id = (SELECT id FROM directions WHERE code = '01' LIMIT 1),
  is_active = true
WHERE email = 'dg@arti.ci';

UPDATE public.profiles SET
  first_name = 'Chef',
  last_name = 'DAAF',
  full_name = 'Chef DAAF',
  poste = 'Directeur Administratif et Financier',
  direction_id = (SELECT id FROM directions WHERE code = '02' LIMIT 1),
  is_active = true
WHERE email = 'daaf@arti.ci';

UPDATE public.profiles SET
  first_name = 'Contrôleur',
  last_name = 'BUDGETAIRE',
  full_name = 'Contrôleur BUDGETAIRE',
  poste = 'Contrôleur Budgétaire',
  direction_id = (SELECT id FROM directions WHERE code = '03' LIMIT 1),
  is_active = true
WHERE email = 'cb@arti.ci';

UPDATE public.profiles SET
  first_name = 'Chef',
  last_name = 'DSI',
  full_name = 'Chef DSI',
  poste = 'Directeur des Systèmes d''Information',
  direction_id = (SELECT id FROM directions WHERE code = '09' LIMIT 1),
  is_active = true
WHERE email = 'dsi@arti.ci';

UPDATE public.profiles SET
  first_name = 'Chef',
  last_name = 'DCP',
  full_name = 'Chef DCP',
  poste = 'Directeur Communication et Partenariat',
  direction_id = (SELECT id FROM directions WHERE code = '08' LIMIT 1),
  is_active = true
WHERE email = 'dcp@arti.ci';

UPDATE public.profiles SET
  first_name = 'Chef',
  last_name = 'STATS',
  full_name = 'Chef STATS',
  poste = 'Directeur Statistiques et Études',
  direction_id = (SELECT id FROM directions WHERE code = '04' LIMIT 1),
  is_active = true
WHERE email = 'stats@arti.ci';

UPDATE public.profiles SET
  first_name = 'Agent',
  last_name = 'DAAF',
  full_name = 'Agent DAAF',
  poste = 'Agent Financier',
  direction_id = (SELECT id FROM directions WHERE code = '02' LIMIT 1),
  is_active = true
WHERE email = 'agent.daaf@arti.ci';

UPDATE public.profiles SET
  first_name = 'Agent',
  last_name = 'DSI',
  full_name = 'Agent DSI',
  poste = 'Agent Informatique',
  direction_id = (SELECT id FROM directions WHERE code = '09' LIMIT 1),
  is_active = true
WHERE email = 'agent.dsi@arti.ci';

UPDATE public.profiles SET
  first_name = 'Agent',
  last_name = 'DCP',
  full_name = 'Agent DCP',
  poste = 'Agent Communication',
  direction_id = (SELECT id FROM directions WHERE code = '08' LIMIT 1),
  is_active = true
WHERE email = 'agent.dcp@arti.ci';

-- Réactiver le trigger
-- ALTER TABLE profiles ENABLE TRIGGER check_profile_update_trigger;

-- =====================================================
-- ATTRIBUTION DES RÔLES
-- =====================================================

-- Supprimer les rôles INVITE existants
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

-- Insérer les bons rôles
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'ADMIN', true, now() FROM profiles WHERE email = 'admin@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'DG', true, now() FROM profiles WHERE email = 'dg@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'DAAF', true, now() FROM profiles WHERE email = 'daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'CB', true, now() FROM profiles WHERE email = 'cb@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG', true, now() FROM profiles WHERE email = 'dsi@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG', true, now() FROM profiles WHERE email = 'dcp@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'SDMG', true, now() FROM profiles WHERE email = 'stats@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR', true, now() FROM profiles WHERE email = 'agent.daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR', true, now() FROM profiles WHERE email = 'agent.dsi@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'OPERATEUR', true, now() FROM profiles WHERE email = 'agent.dcp@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
-- Exécutez cette requête pour vérifier la configuration:

SELECT 
  p.email,
  COALESCE(p.full_name, p.first_name || ' ' || p.last_name) as nom_complet,
  p.poste,
  d.sigle as direction,
  p.is_active,
  array_agg(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles
FROM profiles p
LEFT JOIN directions d ON d.id = p.direction_id
LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
WHERE p.email LIKE '%@arti.ci'
GROUP BY p.id, p.email, p.full_name, p.first_name, p.last_name, p.poste, d.sigle, p.is_active
ORDER BY p.email;
