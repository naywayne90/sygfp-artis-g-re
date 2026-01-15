-- Désactiver le trigger pour mettre à jour les profils
ALTER TABLE profiles DISABLE TRIGGER check_profile_update_trigger;

-- Mise à jour des profils
UPDATE profiles SET
  first_name = 'Admin',
  last_name = 'SYSTEM',
  full_name = 'Admin SYSTEM',
  poste = 'Administrateur Système',
  direction_id = '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
  is_active = true,
  updated_at = now()
WHERE email = 'admin@arti.ci';

UPDATE profiles SET
  first_name = 'Directeur',
  last_name = 'GENERAL',
  full_name = 'Directeur GENERAL',
  poste = 'Directeur Général',
  direction_id = '82ad9d62-6d77-49c8-ae40-42ecda883988',
  is_active = true,
  updated_at = now()
WHERE email = 'dg@arti.ci';

UPDATE profiles SET
  first_name = 'Chef',
  last_name = 'DAAF',
  full_name = 'Chef DAAF',
  poste = 'Directeur Administratif et Financier',
  direction_id = '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
  is_active = true,
  updated_at = now()
WHERE email = 'daaf@arti.ci';

UPDATE profiles SET
  first_name = 'Contrôleur',
  last_name = 'BUDGETAIRE',
  full_name = 'Contrôleur BUDGETAIRE',
  poste = 'Contrôleur Budgétaire',
  direction_id = '40c2f5ab-6df9-4244-9fc7-8259daa3396e',
  is_active = true,
  updated_at = now()
WHERE email = 'cb@arti.ci';

UPDATE profiles SET
  first_name = 'Chef',
  last_name = 'DSI',
  full_name = 'Chef DSI',
  poste = 'Directeur des Systèmes d''Information',
  direction_id = '972a439a-bee5-4d52-83c0-a930d4a66063',
  is_active = true,
  updated_at = now()
WHERE email = 'dsi@arti.ci';

UPDATE profiles SET
  first_name = 'Chef',
  last_name = 'DCP',
  full_name = 'Chef DCP',
  poste = 'Directeur Communication et Partenariat',
  direction_id = 'f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112',
  is_active = true,
  updated_at = now()
WHERE email = 'dcp@arti.ci';

UPDATE profiles SET
  first_name = 'Chef',
  last_name = 'STATS',
  full_name = 'Chef STATS',
  poste = 'Directeur Statistiques et Études',
  direction_id = '95707c43-9401-43e0-9c7b-82e4c109581b',
  is_active = true,
  updated_at = now()
WHERE email = 'stats@arti.ci';

UPDATE profiles SET
  first_name = 'Agent',
  last_name = 'DAAF',
  full_name = 'Agent DAAF',
  poste = 'Agent Financier',
  direction_id = '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
  is_active = true,
  updated_at = now()
WHERE email = 'agent.daaf@arti.ci';

UPDATE profiles SET
  first_name = 'Agent',
  last_name = 'DSI',
  full_name = 'Agent DSI',
  poste = 'Agent Informatique',
  direction_id = '972a439a-bee5-4d52-83c0-a930d4a66063',
  is_active = true,
  updated_at = now()
WHERE email = 'agent.dsi@arti.ci';

UPDATE profiles SET
  first_name = 'Agent',
  last_name = 'DCP',
  full_name = 'Agent DCP',
  poste = 'Agent Communication',
  direction_id = 'f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112',
  is_active = true,
  updated_at = now()
WHERE email = 'agent.dcp@arti.ci';

-- Réactiver le trigger
ALTER TABLE profiles ENABLE TRIGGER check_profile_update_trigger;