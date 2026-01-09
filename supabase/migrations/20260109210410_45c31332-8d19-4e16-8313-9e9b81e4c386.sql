-- First, create an activité for Action 06 (which doesn't have any)
INSERT INTO public.activites (code, libelle, action_id, est_active) VALUES
('601', 'Activités liées au changement climatique', '88ddf402-7268-49ce-9b9a-0d0a92dec4ad', true)
ON CONFLICT (code) DO UPDATE SET 
  libelle = EXCLUDED.libelle,
  action_id = EXCLUDED.action_id,
  est_active = true;

-- Now insert the 13 Sous-Activités for ARTI 2026
-- Using first activité of each action group
INSERT INTO public.sous_activites (code, libelle, activite_id, est_active) VALUES
-- Action 01 → Activité 101
('01', '01 Analyse des données du transport intérieur et prise en compte efficiente des intérêts des usagers', 
  '46588333-5f24-474a-9f27-a1186e667eef', true),
('02', '02 Application des principes de bonne gouvernance', 
  '46588333-5f24-474a-9f27-a1186e667eef', true),

-- Action 02 → Activité 201
('03', '03 Audits indépendants des conventions de service public', 
  '35b1585b-020d-4e92-915e-557d5abfbfe6', true),
('04', '04 Base de données des entreprises du secteur', 
  '35b1585b-020d-4e92-915e-557d5abfbfe6', true),

-- Action 03 → Activité 301
('05', '05 Contrôle du processus de visite technique automobile', 
  'd316a07b-6ed3-4a7f-9345-200fa4bc499f', true),
('06', '06 Coordination dans les zones non couvertes par les autorités de mobilité', 
  'd316a07b-6ed3-4a7f-9345-200fa4bc499f', true),
('07', '07 Elaboration des règles dans les domaines non réglementés', 
  'd316a07b-6ed3-4a7f-9345-200fa4bc499f', true),

-- Action 04 → Activité 401
('08', '08 Encouragement à la collaboration des acteurs', 
  'dcb75fe4-2a09-4c63-9b69-57e58d598cf8', true),
('09', '09 Indicateurs et normes de qualité de service et de performance', 
  'dcb75fe4-2a09-4c63-9b69-57e58d598cf8', true),

-- Action 05 → Activité 501
('10', '10 Participation à l''élaboration de la réglementation', 
  '4ff3a916-0ba8-45c3-9c92-f5981619d9a4', true),
('11', '11 Participation aux accords et conventions internationaux', 
  '4ff3a916-0ba8-45c3-9c92-f5981619d9a4', true),
('12', '12 Veille à l''application de la réglementation', 
  '4ff3a916-0ba8-45c3-9c92-f5981619d9a4', true),

-- Action 06 → Activité 601 (newly created)
('13', '13 Fonctionnement de l''ARTI', 
  (SELECT id FROM activites WHERE code = '601'), true)

ON CONFLICT (code) DO UPDATE SET 
  libelle = EXCLUDED.libelle,
  activite_id = EXCLUDED.activite_id,
  est_active = true;