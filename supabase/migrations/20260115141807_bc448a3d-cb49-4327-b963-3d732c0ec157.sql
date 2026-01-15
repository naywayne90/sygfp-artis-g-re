-- Désactiver temporairement le trigger pour permettre la mise à jour admin
ALTER TABLE profiles DISABLE TRIGGER check_profile_update_trigger;

-- Assigner une direction au profil orphelin (ange.nimba@arti.ci)
UPDATE profiles 
SET direction_id = (SELECT id FROM directions WHERE code = '01' LIMIT 1)
WHERE email = 'ange.nimba@arti.ci' AND direction_id IS NULL;

-- Réactiver le trigger
ALTER TABLE profiles ENABLE TRIGGER check_profile_update_trigger;