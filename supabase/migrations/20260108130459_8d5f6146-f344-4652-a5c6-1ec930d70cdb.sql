-- CHARGEMENT COMPLET ARTI - Référentiels et données

-- 1. OBJECTIFS STRATEGIQUES (5)
INSERT INTO public.objectifs_strategiques (code, libelle, annee_debut, annee_fin, est_actif) VALUES
  ('11', 'Construire la structure fonctionnelle et de pilotage de l''autorité', 2026, 2030, true),
  ('12', 'Construire les outils de collectes et de production de données statistiques', 2026, 2030, true),
  ('13', 'Renforcer le contrôle et la Régulation des acteurs du transport', 2026, 2030, true),
  ('14', 'Faire mieux appliquer le cadre régulateur actuel', 2026, 2030, true),
  ('15', 'Utiliser efficacement les pouvoirs dévolus au régulateur', 2026, 2030, true)
ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, est_actif = true;

-- 2. MISSIONS (5)
INSERT INTO public.missions (code, libelle, est_active) VALUES
  ('M11', 'Mission Structure fonctionnelle', true),
  ('M12', 'Mission Données statistiques', true),
  ('M13', 'Mission Contrôle régulation', true),
  ('M14', 'Mission Cadre réglementaire', true),
  ('M15', 'Mission Pouvoirs régulateur', true)
ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, est_active = true;

-- 3. DIRECTIONS (16)
INSERT INTO public.directions (code, label, sigle, est_active) VALUES
  ('01', 'Direction Générale de l''ARTI', 'DG', true),
  ('02', 'Direction des Affaires Administratives et financières', 'DAAF', true),
  ('03', 'Service des Moyens Généraux', 'SDMG', true),
  ('04', 'Direction des Statistiques et de la Prospective', 'DSESP', true),
  ('05', 'Direction de la Gestion Prévisionnelle de l''Emploi', 'DGPECRP', true),
  ('06', 'Direction du Contrôle et de la Surveillance', 'DCSTI', true),
  ('07', 'Direction des Recours et des Normes', 'DRRN', true),
  ('08', 'Direction de la Communication', 'DCP', true),
  ('09', 'Direction des Systèmes d''Information', 'DSI', true),
  ('10', 'Contrôleur Budgétaire', 'CB', true),
  ('11', 'Agent Comptable', 'AC', true),
  ('12', 'Chargé de mission du DG', 'CM', true),
  ('13', 'Direction du Patrimoine', 'DP', true),
  ('14', 'Direction Centrale des Zones', 'DCZ', true),
  ('15', 'Direction de la Qualité', 'DQ', true),
  ('16', 'Autres Services', 'AS', true)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sigle = EXCLUDED.sigle, est_active = true;

-- 4. NBE (41)
INSERT INTO public.nomenclature_nbe (code, libelle, niveau, est_active) VALUES
  ('211200', 'Brevets et Logiciels', 'detail', true),
  ('231200', 'Bâtiments Administratifs', 'detail', true),
  ('232100', 'Installations et Agencements', 'detail', true),
  ('242100', 'Mobilier Bureau', 'detail', true),
  ('242200', 'Matériel Informatique', 'detail', true),
  ('243100', 'Transport Administratif', 'detail', true),
  ('244100', 'Mobilier Logement', 'detail', true),
  ('244200', 'Matériel Audiovisuel', 'detail', true),
  ('602100', 'Eau', 'detail', true),
  ('602200', 'Électricité', 'detail', true),
  ('604100', 'Fournitures bureau', 'detail', true),
  ('605100', 'Carburants', 'detail', true),
  ('606100', 'Documentation', 'detail', true),
  ('612100', 'Location bâtiments', 'detail', true),
  ('613100', 'Entretien bâtiments', 'detail', true),
  ('613200', 'Entretien matériels', 'detail', true),
  ('613300', 'Entretien véhicules', 'detail', true),
  ('614100', 'Assurance bâtiments', 'detail', true),
  ('614200', 'Assurance véhicules', 'detail', true),
  ('614300', 'Assurance RC', 'detail', true),
  ('615100', 'Études et recherches', 'detail', true),
  ('615200', 'Séminaires et conférences', 'detail', true),
  ('616100', 'Frais postaux', 'detail', true),
  ('616200', 'Télécommunications', 'detail', true),
  ('617100', 'Publicité', 'detail', true),
  ('617200', 'Relations publiques', 'detail', true),
  ('618100', 'Missions intérieures', 'detail', true),
  ('618200', 'Missions extérieures', 'detail', true),
  ('618300', 'Réceptions', 'detail', true),
  ('619100', 'Honoraires', 'detail', true),
  ('619200', 'Contentieux', 'detail', true),
  ('621100', 'Salaires permanents', 'detail', true),
  ('621200', 'Indemnités', 'detail', true),
  ('621300', 'Primes', 'detail', true),
  ('624100', 'Charges sociales', 'detail', true),
  ('624200', 'Cotisations retraite', 'detail', true),
  ('631100', 'Impôts fonciers', 'detail', true),
  ('633100', 'Taxes diverses', 'detail', true),
  ('651100', 'Bourses études', 'detail', true),
  ('671100', 'Charges exceptionnelles', 'detail', true),
  ('671700', 'Intérêts emprunts', 'detail', true)
ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, est_active = true;

-- 5. ACTIONS (6)
INSERT INTO public.actions (code, libelle, os_id, mission_id, est_active)
SELECT a.code, a.libelle, os.id, m.id, true
FROM (VALUES
  ('01', 'Améliorer les performances opérationnelles de l''ARTI', '11', 'M11'),
  ('02', 'Disposer d''outils fiables de collecte de données', '12', 'M12'),
  ('03', 'Mettre en œuvre la régulation du transport intérieur', '13', 'M13'),
  ('04', 'Approfondir la régulation par la donnée', '14', 'M14'),
  ('05', 'Vision transversale des marchés de transport', '15', 'M15'),
  ('06', 'Lutter contre le changement climatique', '15', 'M15')
) AS a(code, libelle, os_code, mission_code)
JOIN public.objectifs_strategiques os ON os.code = a.os_code
JOIN public.missions m ON m.code = a.mission_code
ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, est_active = true;

-- 6. ACTIVITES (46)
INSERT INTO public.activites (code, libelle, action_id, est_active)
SELECT act.code, act.libelle, a.id, true
FROM (VALUES
  ('101', 'Remboursement prêt BHCI', '01'), ('102', 'Fonctionnement courant DAAF', '01'),
  ('103', 'Gestion ressources humaines', '01'), ('104', 'Gestion financière comptable', '01'),
  ('105', 'Gestion patrimoine', '01'), ('106', 'Formation personnel', '01'),
  ('107', 'Charges personnel', '01'), ('108', 'Charges sociales', '01'),
  ('109', 'Maintenance équipements', '01'), ('110', 'Fournitures consommables', '01'),
  ('111', 'Services externalisés', '01'), ('112', 'Investissements DAAF', '01'),
  ('201', 'Études statistiques', '02'), ('202', 'Collecte données', '02'),
  ('203', 'Analyse prospective', '02'), ('204', 'Publications rapports', '02'),
  ('205', 'Veille stratégique', '02'), ('206', 'Bases de données', '02'),
  ('301', 'Contrôle routier', '03'), ('302', 'Surveillance transport', '03'),
  ('303', 'Inspection véhicules', '03'), ('304', 'Contrôle titres', '03'),
  ('305', 'Sanctions pénalités', '03'), ('306', 'Fonctionnement DCSTI', '03'),
  ('401', 'Traitement recours', '04'), ('402', 'Contentieux', '04'),
  ('403', 'Élaboration normes', '04'), ('404', 'Veille réglementaire', '04'),
  ('501', 'Infrastructure SI', '05'), ('502', 'Développement logiciel', '05'),
  ('503', 'Maintenance applicative', '05'), ('504', 'Sécurité informatique', '05'),
  ('505', 'Support utilisateurs', '05'), ('506', 'Projets SI', '05'),
  ('601', 'Coordination zones', '03'), ('602', 'Antennes régionales', '03'),
  ('701', 'Système qualité', '05'), ('702', 'Audit interne', '05'),
  ('801', 'Pilotage stratégique', '01'), ('802', 'Relations institutionnelles', '01'),
  ('901', 'Communication institutionnelle', '01'), ('902', 'Relations presse', '01'),
  ('903', 'Partenariats', '01'), ('1001', 'Gestion prévisionnelle emplois', '01'),
  ('1002', 'Gestion carrières', '01'), ('1003', 'Recrutement', '01')
) AS act(code, libelle, action_code)
JOIN public.actions a ON a.code = act.action_code
ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, est_active = true;