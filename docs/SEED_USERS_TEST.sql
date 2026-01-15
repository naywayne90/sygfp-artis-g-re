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
-- LISTE DES 10 UTILISATEURS TEST SUGGÉRÉS
-- =====================================================
-- Créez ces utilisateurs via le Dashboard Supabase Auth:
--
-- | #  | Email                | Prénom   | Nom      | Password  |
-- |----|----------------------|----------|----------|-----------|
-- | 1  | dg@arti.ci           | Mamadou  | DIALLO   | Test2026! |
-- | 2  | daaf@arti.ci         | Fatou    | KONE     | Test2026! |
-- | 3  | cb@arti.ci           | Kouassi  | AMAN     | Test2026! |
-- | 4  | dsi@arti.ci          | Ibrahim  | TRAORE   | Test2026! |
-- | 5  | dcp@arti.ci          | Jean     | KOUAME   | Test2026! |
-- | 6  | stats@arti.ci        | Paul     | BAMBA    | Test2026! |
-- | 7  | agent.daaf@arti.ci   | Aminata  | COULIBALY| Test2026! |
-- | 8  | agent.dsi@arti.ci    | Marcel   | KOUADIO  | Test2026! |
-- | 9  | agent.dcp@arti.ci    | Marie    | KONAN    | Test2026! |
-- | 10 | admin@arti.ci        | Admin    | SYSTEM   | Test2026! |
--
-- =====================================================
-- APRÈS CRÉATION: Mise à jour des profils
-- =====================================================
-- Exécutez ces scripts dans l'éditeur SQL Supabase après avoir créé les users:
-- https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf/sql/new

-- 1. Mise à jour des noms complets et postes
UPDATE public.profiles SET
  first_name = 'Mamadou',
  last_name = 'DIALLO',
  full_name = 'Mamadou DIALLO',
  poste = 'Directeur Général'
WHERE email = 'dg@arti.ci';

UPDATE public.profiles SET
  first_name = 'Fatou',
  last_name = 'KONE',
  full_name = 'Fatou KONE',
  poste = 'Directrice Administrative et Financière'
WHERE email = 'daaf@arti.ci';

UPDATE public.profiles SET
  first_name = 'Kouassi',
  last_name = 'AMAN',
  full_name = 'Kouassi AMAN',
  poste = 'Contrôleur Budgétaire'
WHERE email = 'cb@arti.ci';

UPDATE public.profiles SET
  first_name = 'Ibrahim',
  last_name = 'TRAORE',
  full_name = 'Ibrahim TRAORE',
  poste = 'Directeur des Systèmes d''Information'
WHERE email = 'dsi@arti.ci';

UPDATE public.profiles SET
  first_name = 'Jean',
  last_name = 'KOUAME',
  full_name = 'Jean KOUAME',
  poste = 'Directeur Communication et Partenariat'
WHERE email = 'dcp@arti.ci';

UPDATE public.profiles SET
  first_name = 'Paul',
  last_name = 'BAMBA',
  full_name = 'Paul BAMBA',
  poste = 'Chef Service Statistiques'
WHERE email = 'stats@arti.ci';

UPDATE public.profiles SET
  first_name = 'Aminata',
  last_name = 'COULIBALY',
  full_name = 'Aminata COULIBALY',
  poste = 'Agent Comptable DAAF'
WHERE email = 'agent.daaf@arti.ci';

UPDATE public.profiles SET
  first_name = 'Marcel',
  last_name = 'KOUADIO',
  full_name = 'Marcel KOUADIO',
  poste = 'Développeur DSI'
WHERE email = 'agent.dsi@arti.ci';

UPDATE public.profiles SET
  first_name = 'Marie',
  last_name = 'KONAN',
  full_name = 'Marie KONAN',
  poste = 'Chargée de Communication'
WHERE email = 'agent.dcp@arti.ci';

UPDATE public.profiles SET
  first_name = 'Admin',
  last_name = 'SYSTEM',
  full_name = 'Admin SYSTEM',
  poste = 'Administrateur Système'
WHERE email = 'admin@arti.ci';

-- =====================================================
-- 2. Attribution des directions (par un ADMIN)
-- =====================================================
-- Ces updates nécessitent d'être connecté en tant qu'ADMIN
-- ou via une migration avec privilèges élevés

-- DG -> Direction Générale
UPDATE public.profiles SET direction_id = (SELECT id FROM directions WHERE code = '01' LIMIT 1)
WHERE email = 'dg@arti.ci';

-- DAAF, CB, Agent DAAF -> Direction Administrative et Financière
UPDATE public.profiles SET direction_id = (SELECT id FROM directions WHERE code = '02' LIMIT 1)
WHERE email IN ('daaf@arti.ci', 'cb@arti.ci', 'agent.daaf@arti.ci');

-- DSI, Agent DSI -> Direction des Systèmes d'Information
UPDATE public.profiles SET direction_id = (SELECT id FROM directions WHERE code = '09' LIMIT 1)
WHERE email IN ('dsi@arti.ci', 'agent.dsi@arti.ci');

-- DCP, Agent DCP -> Direction Communication et Partenariat
UPDATE public.profiles SET direction_id = (SELECT id FROM directions WHERE code = '08' LIMIT 1)
WHERE email IN ('dcp@arti.ci', 'agent.dcp@arti.ci');

-- Stats -> Direction Statistiques
UPDATE public.profiles SET direction_id = (SELECT id FROM directions WHERE code = '04' LIMIT 1)
WHERE email = 'stats@arti.ci';

-- =====================================================
-- 3. Attribution des rôles
-- =====================================================

-- Rôle DG
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'DG', true FROM profiles WHERE email = 'dg@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Rôle DAAF  
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'DAAF', true FROM profiles WHERE email = 'daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Rôle CB (Contrôleur Budgétaire)
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'CB', true FROM profiles WHERE email = 'cb@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Rôle ADMIN
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'ADMIN', true FROM profiles WHERE email = 'admin@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Rôles DIRECTEUR pour les directeurs de service
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'DIRECTEUR', true FROM profiles WHERE email IN ('dsi@arti.ci', 'dcp@arti.ci')
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
GROUP BY p.id, p.email, p.full_name, p.first_name, p.last_name, p.poste, d.sigle, p.is_active
ORDER BY p.email;

-- =====================================================
-- RÉSULTAT ATTENDU:
-- =====================================================
-- | email              | nom_complet        | poste                    | direction | roles        |
-- |--------------------|--------------------|--------------------------|-----------|--------------|
-- | admin@arti.ci      | Admin SYSTEM       | Administrateur Système   | NULL      | {ADMIN}      |
-- | agent.daaf@arti.ci | Aminata COULIBALY  | Agent Comptable DAAF     | DAAF      | NULL         |
-- | agent.dcp@arti.ci  | Marie KONAN        | Chargée de Communication | DCP       | NULL         |
-- | agent.dsi@arti.ci  | Marcel KOUADIO     | Développeur DSI          | DSI       | NULL         |
-- | cb@arti.ci         | Kouassi AMAN       | Contrôleur Budgétaire    | DAAF      | {CB}         |
-- | daaf@arti.ci       | Fatou KONE         | Directrice Admin/Fin.    | DAAF      | {DAAF}       |
-- | dcp@arti.ci        | Jean KOUAME        | Directeur Communication  | DCP       | {DIRECTEUR}  |
-- | dg@arti.ci         | Mamadou DIALLO     | Directeur Général        | DG        | {DG}         |
-- | dsi@arti.ci        | Ibrahim TRAORE     | Directeur SI             | DSI       | {DIRECTEUR}  |
-- | stats@arti.ci      | Paul BAMBA         | Chef Service Statistiques| DSESP     | NULL         |
