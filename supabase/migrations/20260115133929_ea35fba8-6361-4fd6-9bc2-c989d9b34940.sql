-- =====================================================
-- Mise à jour du profil existant (champs autorisés)
-- =====================================================
-- Note: Les profils sont liés à auth.users par FK.
-- Pour ajouter des utilisateurs test, utiliser:
-- 1. Dashboard Supabase > Authentication > Users
-- 2. Edge function create-user

-- Mettre à jour le profil existant (first_name, last_name, full_name sont autorisés par check_profile_update)
UPDATE public.profiles 
SET 
  first_name = 'Ange',
  last_name = 'NIMBA',
  full_name = 'Ange NIMBA',
  updated_at = now()
WHERE email = 'ange.nimba@arti.ci';