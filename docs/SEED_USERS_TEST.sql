-- =====================================================
-- GUIDE: Création d'utilisateurs test - Notes SEF / SYGFP
-- =====================================================
-- IMPORTANT: Les profils sont liés à auth.users par foreign key.
-- Il est impossible d'insérer directement dans profiles sans créer
-- d'abord l'utilisateur dans Supabase Auth.
--
-- MÉTHODES DE CRÉATION:
-- 
-- 1. Dashboard Supabase (recommandé pour les tests):
--    - Supabase Dashboard > Authentication > Users > Add user
--    - Renseigner email et password
--    - Le profil sera créé automatiquement par le trigger handle_new_user
--
-- 2. Edge Function create-user (pour création par API):
--    - POST /functions/v1/create-user
--    - Body: { email, password, first_name, last_name, role }
--
-- 3. Signup dans l'application (utilisateurs réels)
--
-- =====================================================
-- APRÈS CRÉATION - Mise à jour des profils (champs autorisés)
-- =====================================================
-- Le trigger check_profile_update autorise: first_name, last_name, full_name, avatar_url
-- Les champs direction_id, poste, is_active nécessitent le rôle ADMIN

-- Exemple de mise à jour pour un utilisateur existant:
/*
UPDATE public.profiles 
SET 
  first_name = 'Prénom',
  last_name = 'NOM',
  full_name = 'Prénom NOM',
  updated_at = now()
WHERE email = 'user@arti.ci';
*/

-- =====================================================
-- ATTRIBUTION DES RÔLES (après création users)
-- =====================================================
-- Exemples de rôles à attribuer:

/*
-- Attribuer le rôle DG à un utilisateur
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'DG', true FROM profiles WHERE email = 'dg@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Attribuer le rôle DAAF  
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'DAAF', true FROM profiles WHERE email = 'daaf@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- Attribuer le rôle ADMIN
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'ADMIN', true FROM profiles WHERE email = 'admin@arti.ci'
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- =====================================================
-- MISE À JOUR DIRECTION/POSTE (requiert ADMIN connecté)
-- =====================================================
-- Ces updates doivent être exécutés par un utilisateur ADMIN connecté
-- via l'interface ou une requête authentifiée:

/*
UPDATE public.profiles 
SET 
  direction_id = (SELECT id FROM directions WHERE sigle = 'DAAF' LIMIT 1),
  poste = 'Directeur Administratif et Financier'
WHERE email = 'daaf@arti.ci';
*/

-- =====================================================
-- LISTE DES UTILISATEURS TEST SUGGÉRÉS
-- =====================================================
-- À créer via Dashboard Supabase Auth:
--
-- | Email             | Nom            | Direction | Poste                    | Rôle  |
-- |-------------------|----------------|-----------|--------------------------|-------|
-- | dg@arti.ci        | Mamadou DIALLO | DG        | Directeur Général        | DG    |
-- | daaf@arti.ci      | Fatou KONE     | DAAF      | Directeur Admin/Financier| DAAF  |
-- | agent.daaf@arti.ci| Kouassi AMAN   | DAAF      | Agent Comptable          | -     |
-- | dsi@arti.ci       | Ibrahim TRAORE | DSI       | Directeur SI             | -     |
-- | dev@arti.ci       | Aminata COULIBALY| DSI     | Développeur              | -     |
-- | dcp@arti.ci       | Jean KOUAME    | DCP       | Directeur Communication  | -     |
-- | stats@arti.ci     | Paul BAMBA     | DSESP     | Statisticien             | -     |
-- | admin@arti.ci     | Admin SYSTEM   | -         | Administrateur           | ADMIN |
--
-- Password suggéré pour les tests: Test2026!

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Afficher les profils existants avec leurs rôles
SELECT 
  p.id,
  p.email,
  COALESCE(p.full_name, p.first_name || ' ' || p.last_name) as nom_complet,
  p.poste,
  d.sigle as direction,
  p.is_active,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles
FROM profiles p
LEFT JOIN directions d ON d.id = p.direction_id
LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
GROUP BY p.id, p.email, p.full_name, p.first_name, p.last_name, p.poste, d.sigle, p.is_active
ORDER BY p.email;
