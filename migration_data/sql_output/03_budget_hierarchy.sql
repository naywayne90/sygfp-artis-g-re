-- Migration de la hiérarchie budgétaire
-- Mission -> missions
-- Action -> actions
-- Activite -> activites

-- Table de mapping pour les anciens IDs
CREATE TABLE IF NOT EXISTS migration_mapping (
  table_source TEXT,
  ancien_id TEXT,
  nouveau_id UUID
);

-- === MISSIONS ===

INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '1de9fae1-839c-4515-b721-8a3485a0d812', 'MIS150062', 'PARTICIPATION AUX ATELIERS DE RESTITUTIONS ET DE VALIDATION DES RAPPORTS DES PUDé RPUé EES', 'Honneur vous adressez Monsieur le Directeur Général la présente note relative à la participation de Monsieur DIABAGATE Aboubacar Sidick aux ateliers de restitutions et de validation des rapports des PUDé RPUé EESà La mission se déroulera du 05 au 11 janvie', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150062');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150062', '1de9fae1-839c-4515-b721-8a3485a0d812');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '75c1b146-fcbe-4acd-baeb-cd0e63a84104', 'MIS150063', 'DEPOT DE COURRIERS DE REMERCIEMENT', 'Honneur vous transmettre Monsieur le Directeur Général la présente note relative au dépôt de courrier de remerciement dans les villes de Djékanoué  Bocandaé Toumodié Dimbokroé Kokoumboà La mission est assurée par Monsieur KOUADIO Edmond à Elle se déroulera', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150063');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150063', '75c1b146-fcbe-4acd-baeb-cd0e63a84104');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '83055094-c402-443b-bd1c-48d979fd9854', 'MIS150064', 'Rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 'Honneur vous adresser Monsieur le Directeur Généralà la présente note relative à la rencontre avec l''équipe du Bureau Régional de Yamoussoukroà La mission se tiendra du 25 au 26 janvier 2025à', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150064');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150064', '83055094-c402-443b-bd1c-48d979fd9854');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '5f4d3aba-53a3-4bd7-8f5c-1cebecd0322c', 'MIS150065', 'Rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 'Honneur vous transmettre Monsieur le Directeur Général la présente note relative à la rencontre avec l''équipe du Bureau Régional de Yamoussoukroà La mission se déroulera du 25 au 26 janvier 2025à La mission sera effectuée par Monsieur Sambaré Zakariaà', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150065');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150065', '5f4d3aba-53a3-4bd7-8f5c-1cebecd0322c');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '2168c888-f580-4c8f-969e-02a56fa777ae', 'MIS150066', 'Rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 'Honneur vous adresser la présente note relative à Monsieur le Directeur Général de l''ARTI dans le cadre de la rencontre avec l''équipe du Bureau  Régional de Yamoussoukroà La mission se déroulera du 25 au 26 janvier 2025à', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150066');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150066', '2168c888-f580-4c8f-969e-02a56fa777ae');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '008fbd1c-b97a-43ef-a1a4-632882bc0467', 'MIS150067', 'Transmission de documents administratifs au  Bureau Régional de Bouaké', 'Honneur vous transmettre Monsieur le Directeur Général la présente note relative à la transmission de documents administratifs au  Bureau Régional de Bouakéà La mission se déroulera le 16 janvier 2025 et sera effectuée par Monsieur GBAMELE SIMEONà', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150067');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150067', '008fbd1c-b97a-43ef-a1a4-632882bc0467');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '2fcaa179-8468-4ee4-abff-ba160aac4ad3', 'MIS150068', 'Dépôt de courrier de remerciements à Djékanoué Toumodié Kokoumboé Dimbokroé Bocandaà', 'Honneur vous transmettre Monsieur le Directeur Général la présente note relative au dépôt de courrier de remerciements dans les villes de Djékanoué Toumodié Tokoumboé Dimbokro et Bocandaà La mission se tiendra du 09 au 10 janvier 2025 par Monsieur DIOMANDE', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150068');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150068', '2fcaa179-8468-4ee4-abff-ba160aac4ad3');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '1a9f064b-826a-4248-8ac2-1dcf795bd5a1', 'MIS150069', 'Rencontre sur la mise en ouvre du  Projet Bourse de Fret avec GENETEC  Et la Banque Mondiale', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la rencontre sur la mise en ouvre du  Projet Bourse de Fret avec GENETEC  Et la Banque Mondialeà', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150069');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150069', '1a9f064b-826a-4248-8ac2-1dcf795bd5a1');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '64e86548-7671-4880-8b82-6790978ba0bb', 'MISLa mission s'effectuera du 19 au 06 mars 2025 . Paris et Washington. Pour la', '2025-02-19', '2025-03-06', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MISLa mission s'effectuera du 19 au 06 mars 2025 . Paris et Washington. Pour la');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', 'La mission s'effectuera du 19 au 06 mars 2025 . Paris et Washington. Pour la', '64e86548-7671-4880-8b82-6790978ba0bb');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '84c7f59c-cb48-4529-91e3-a253ab084ced', 'MIS150070', 'Mission technique d''immersion au siSge de GENETEC  Paris projet de suivi et de contrôle de  l''exploitation de Ia Bourse de Fret', 'Honneur vous transmettre Monsieur le Directeur Général la présente note relative à la mission technique d''immersion au siSge de GENETEC  Paris dans le cadre du projet de suivi et de contrôle de  l''exploitation de Ia Bourse de Fretà La mission se déroulera', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150070');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150070', '84c7f59c-cb48-4529-91e3-a253ab084ced');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '0e2ccc43-74cc-4032-8a14-f1c82f9ef102', 'MIS150071', 'Participation à la 21éme conférence annuelle de  l''African Forum for Utility Regulators (AFUR)', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la Participation de  Madame KASSI  MARIE PAULE  à la 21éme conférence annuelle de  l''African Forum for Utility Regulators (AFUR) QUI SE TIENDRA DU 02 AU 08 MARS 2025 à  Kribi (', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150071');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150071', '0e2ccc43-74cc-4032-8a14-f1c82f9ef102');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'd7aeb7c8-082c-4904-8051-1b00a55b28e1', 'MIS150072', 'Participation à la 21éme conférence annuelle de  l''African Forum for Utility Regulators (AFUR)', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la Participation de  Monsieur GNAGNE Mel Patrick Serges  à la 21éme conférence annuelle de l''African Forum for Utility Regulators (AFUR) QUI SE TIENDRA DU 02 AU 08 MARS 2025 à', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150072');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150072', 'd7aeb7c8-082c-4904-8051-1b00a55b28e1');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'e82b7969-641a-4311-ad0f-559579c366c4', 'MIS150073', 'Invitation au séminaire FLYING WHALES', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur DIABAGATE Mohamed (Chef de Service Surveillance du Transport', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150073');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150073', 'e82b7969-641a-4311-ad0f-559579c366c4');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'afe8cc8b-32a6-4b01-9671-286f7f10fbb1', 'MISInt,rieur) au s,minaire FLYING WHALES qui se tiendra . Abidjan (plateau) du 13 au 14', '2025-02-13', '2025-02-14', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MISInt,rieur) au s,minaire FLYING WHALES qui se tiendra . Abidjan (plateau) du 13 au 14');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', 'Int,rieur) au s,minaire FLYING WHALES qui se tiendra . Abidjan (plateau) du 13 au 14', 'afe8cc8b-32a6-4b01-9671-286f7f10fbb1');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'dced8c62-5efb-48f2-999d-e2b5bb08d6dd', 'MIS150074', 'Invitation au séminaire FLYING WHALES', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur BOKOUA Ziogba Sébastien (Responsable du Bureau Régional du District', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150074');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150074', 'dced8c62-5efb-48f2-999d-e2b5bb08d6dd');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'af9823df-9262-4f9f-94f2-3902d1657977', 'MISR,gion du GbSkS) au s,mi', '2025-02-13', '2025-02-14', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MISR,gion du GbSkS) au s,mi');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', 'R,gion du GbSkS) au s,mi', 'af9823df-9262-4f9f-94f2-3902d1657977');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'ba828fbc-d6e7-4d15-bc7a-c8eb5f448c48', 'MIS150075', 'Mission technique d''immersion au siSge de  GENETEC Paris  projet de suivi  et de contrôle de l''exploitation de Ia Bourse de  Fret', 'Honneur vous adresser la présente note relative à Mission technique d''immersion au siSge de  GENETEC Paris  dans le cadre du projet de suivi  et de contrôle de l''exploitation de Ia Bourse de  Fret qui se tiendra du 18 au 22 février 2025 à PARIS (France) av', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150075');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150075', 'ba828fbc-d6e7-4d15-bc7a-c8eb5f448c48');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'cea91bf3-e787-4473-9b10-14fd62acddd5', 'MIS150076', 'Mission technique d''immersion au siSge de GENETEC  Paris projet de suivi et de contrôle de  l''exploitation de la Bourse de Fretà', 'Honneur vous transmettre la présente note relative à la mission technique d''immersion au siSge de GENETEC  Paris dans le cadre du projet de suivi et de contrôle de  l''exploitation de la Bourse de Fretà la mission se tiendra du 18 au 22 février à Paris (Fra', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150076');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150076', 'cea91bf3-e787-4473-9b10-14fd62acddd5');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '366a5a48-6b43-4942-80c3-bdec30f7ffa2', 'MIS150077', 'Formation des Opérateurs et Techniciens des  engins d''entretien des voiries', 'Honneur vous transmettre la présente note relative à la Formation des Opérateurs et Techniciens des  engins d''entretien des voiriesà La mission se déroulera du 18 au 21 février 2025 et est assurée par monsieur DIABAGATE Aboubacar Sidick ( Chef de service e', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150077');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150077', '366a5a48-6b43-4942-80c3-bdec30f7ffa2');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'fa0d6368-97ca-4b4d-b702-52e3ccf6bcb2', 'MIS150078', 'Formation des Opérateurs et Techniciens des  engins d''entretien des voiries', 'Honneur vous transmettre la présente note relative à la Formation des Opérateurs et Techniciens des engins d''entretien des voiriesà La mission se déroulera du 19 au 21 février 2025 et est assurée par Monsieur BOKOUA ZIOGBA SEBASTIEN ( CResponsable du Burea', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150078');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150078', 'fa0d6368-97ca-4b4d-b702-52e3ccf6bcb2');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '13b09ee4-42dd-4519-a548-f63b5d7c0c49', 'MIS150079', 'PARTICIPATION AUX ATELIERS DE RESTITUTION ET DE VALIDATION DES RAPPORTS DES PUDéRPUéEES', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur DIABAGATE Aboubacar Sedick a l''atelier de restitution  de validation des rapports PUDéRPUéEESà L''atelier se déroulera du 05 au 11 janvier 2025à', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150079');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150079', '13b09ee4-42dd-4519-a548-f63b5d7c0c49');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'bbc95df9-7c6a-40d7-a3f3-9d2a72b18f9c', 'MIS150080', 'DEPOT DE COURRIER DE REMERCIEMENT', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative au dépôt de courrier de remerciement par Monsieur DIOMANDE Adama du 09 au 10 janvier 2025à', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150080');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150080', 'bbc95df9-7c6a-40d7-a3f3-9d2a72b18f9c');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '0c24bb64-42ef-4582-b238-18c92724b859', 'MIS150081', 'PARTICIPATION A L''ATRELIER DE MOBILISATION DES PARTIES PRENANTES RELATIF A L''ELABORATION D''UNE NOTE CONCEPTUELLEPOUR L''INTEGRATION DE VEHICULE ELECTRIQUE', 'Honneur vous adresser Monsieur  le Directeur Général la présente note relative à la participation de Monsieur BOKOUA Ziogba Sébastien à l''Atelier de mobilisation des parties prenantes relatif à l''élaboration d''une note conceptuelle pour l''intégration des v', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150081');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150081', '0c24bb64-42ef-4582-b238-18c92724b859');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '8eebcb89-671e-490d-9703-03ef86e52ace', 'MIS150082', 'PARTICIPATION AU SEMINAIRE DE FORMATION DES EXPERTS FORMATEURS SUR LES OUTILS IPCC & LEAP ET SUR LA COLLECTE DE DONNEESà', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur BOKOUAé au séminaire de formation des Experts Formateurs sur les Outils IPCC & LEAP et sur la collecte de donnéesà la mission se déroulera du 02 au', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150082');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150082', '8eebcb89-671e-490d-9703-03ef86e52ace');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'c1661484-3566-42ba-b62e-aa5943b29a40', 'MIS150083', 'PARTICIPATION A L''ELABORATION DE SENSIBILISATION SUR L''APPLICATION DES TEXTES RELATIFS AU SECTEUR DU TRANSPORT (SECURITE ROUTIERE)', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur VOMOUAN Téké Jean Philippe (Sous-Directeur des Affaires Juridiques et des Recours) à l''opération de Sensibilisation sur l''application des textes re', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150083');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150083', 'c1661484-3566-42ba-b62e-aa5943b29a40');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '695106a2-f7b0-4837-9f51-243479149231', 'MIS150084', 'PARTICIPATION A L''ELABORATION DE SENSIBILISATION SUR L''APPLICATION DES TEXTES RELATIFS AU SECTEUR DU TRANSPORT (SECURITE ROUTIERE)', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Madame AFFANOU Lisette (Chef de service de la Communication) à l''opération de Sensibilisation sur l''application des textes relatifs au secteur du transport', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150084');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150084', '695106a2-f7b0-4837-9f51-243479149231');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '5b84442f-1e51-4ea6-8426-b3ffa1bd8267', 'MIS150085', 'PARTICIPATION A L''ELABORATION DE SENSIBILISATION SUR L''APPLICATION DES TEXTES RELATIFS AU SECTEUR DU TRANSPORT (SECURITE ROUTIERE)', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Madame KOUAME Yah Gabrielle  ( Sous Directrice des Relations Publiques et de la Communication) à l''opération de Sensibilisation sur l''application des textes', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150085');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150085', '5b84442f-1e51-4ea6-8426-b3ffa1bd8267');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '26ee6521-a723-4f85-b933-b79d9e6b14f1', 'MIS150086', 'PARTICIPATION A LA COMMEMORATION NATIONALE DE LA JOURNEE INTERNATIONALE DE LA FEMME 2025à', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur le Directeur Général  à la commémoration nationale de la journée Internationale de la femme 2025à la mission se déroulera à Dimbokro du 07 au 09 ma', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150086');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150086', '26ee6521-a723-4f85-b933-b79d9e6b14f1');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '56213cc0-0a1e-446a-87a1-3e23a0558243', 'MIS150087', 'PARTICIPATION A LA COMMEMORATION NATIONALE DE LA JOURNEE INTERNATIONALE DE LA FEMME 2025à', 'Honneur vous adresser Monsieur le Directeur Général la présente note relative à la participation de Monsieur SAMBARE  Zakaria et de Monsieur GBAMELE Siméon ( chauffeur) à la commémoration nationale de la journée Internationale de la femme 2025à la mission', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150087');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150087', '56213cc0-0a1e-446a-87a1-3e23a0558243');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT 'fcaa5800-8077-4ee4-80d8-770b282399dc', 'MIS150088', 'PARTICIPATION A LA FORMATION SUR L''HARMONISATION DES CADRES DE REGULATION: UNE REPONSE AUX ENJEUX DE L''ECONOMIE MONDIALEà', 'Honneur vous adresser Monsieur le Directeur Généralé la présente note relative à la participation de Monsieur KACOU ALBERIC( Président du Conseil de Régulation) à la formation sur l''harmonisation des cadres de régulationà La formation se déroulera à DUBAI', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150088');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150088', 'fcaa5800-8077-4ee4-80d8-770b282399dc');


INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '2c9d3892-d841-45c1-be2d-e023fa2dca4e', 'MIS150089', 'PARTICIPATION A LA REMISE OFFICIELLE D''ASPIRATEURS URBAINS', 'Honneur vous transmettre la présente note relative à la remise officielle d''aspirateurs urbains par Monsieur le Directeur Général de l''ARTI suivi par sa délégation composée de : Monsieur KAMAGATE BAKAGNAN( Directeur du Contrôle et de la Surveillance du Tra', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS150089');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '150089', '2c9d3892-d841-45c1-be2d-e023fa2dca4e');


-- === ACTIONS ===

INSERT INTO actions (id, code, libelle, actif)
SELECT '93921b41-8ab0-46e7-b87f-adc280ba8ad2', 'ACT000', 'Améliorer les performances opérationnelles de l''ARTIà', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', '93921b41-8ab0-46e7-b87f-adc280ba8ad2');


INSERT INTO actions (id, code, libelle, actif)
SELECT 'c672554c-18e0-460e-8226-8141b8149231', 'ACT000', 'Disposer doutils fiables de collectes et danalyse de données', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', 'c672554c-18e0-460e-8226-8141b8149231');


INSERT INTO actions (id, code, libelle, actif)
SELECT '9a312ec3-5244-4f08-bc2f-490d2ec203c8', 'ACT000', 'Mettre en ouvre la régulation des activités du secteur du transport intérieur confiée par la loi (LOTI)', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', '9a312ec3-5244-4f08-bc2f-490d2ec203c8');


INSERT INTO actions (id, code, libelle, actif)
SELECT '71b59daa-0a75-45ab-b589-f7f8782668fe', 'ACT000', 'Approfondir la régulation par la donnée comme nouvelle modalité de régulation', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', '71b59daa-0a75-45ab-b589-f7f8782668fe');


INSERT INTO actions (id, code, libelle, actif)
SELECT '733b690a-a662-4477-aea7-5aca8abf8d23', 'ACT000', 'Acquérir une vision transversale des différents marchés de transport et lutter contre les rentes de monopoleà', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', '733b690a-a662-4477-aea7-5aca8abf8d23');


INSERT INTO actions (id, code, libelle, actif)
SELECT '3ea10e11-0bee-4816-b654-25c57b80f832', 'ACT000', 'Lutter contre les problématiques liées au changement climatique (sans ^tre au cour des missions de l''ARTIé ils constituent une problématique qui s''imposeé dont elle doit tenir compte)', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT000');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', 'None', '3ea10e11-0bee-4816-b654-25c57b80f832');


-- === ACTIVITES ===

INSERT INTO activites (id, code, libelle, actif)
SELECT '07d4561f-5121-4049-a190-a8d969522731', '101', '101 : Projet acquisition du siSge social', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '101');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '1', '07d4561f-5121-4049-a190-a8d969522731');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'b0178a25-3a7c-4524-8e8e-3124d028e885', '104', '104 : Construction du SiSge de Bouaké', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '104');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '2', 'b0178a25-3a7c-4524-8e8e-3124d028e885');


INSERT INTO activites (id, code, libelle, actif)
SELECT '25d075d7-9de0-43ab-9df3-9ec139063d70', '105', '105 : Constitution DAT BHCI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '105');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '3', '25d075d7-9de0-43ab-9df3-9ec139063d70');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'a4cf22bc-0b29-42e8-bed7-a03ef51a508e', '103', '103 : Exécution du budget et du Plan de Passation des marchés', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '103');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '4', 'a4cf22bc-0b29-42e8-bed7-a03ef51a508e');


INSERT INTO activites (id, code, libelle, actif)
SELECT '5ff9fcc7-06d7-4de4-9f59-ff3306577317', '102', '102 : Gestion des contrats de dépenses courantes de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '102');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '5', '5ff9fcc7-06d7-4de4-9f59-ff3306577317');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2ed7353a-c785-4140-8860-1a97ff9e1326', '401', '401 : Mise en ouvre des recommandations de l''audit diagnostic des opérateurs de visite technique', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '401');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '6', '2ed7353a-c785-4140-8860-1a97ff9e1326');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd1380e15-5117-4ec1-9f8b-b3121f9a4a95', '301', '301 : Mise en ouvre des recommandations de l''audit diagnostic des opérateurs de visite technique', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '301');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '7', 'd1380e15-5117-4ec1-9f8b-b3121f9a4a95');


INSERT INTO activites (id, code, libelle, actif)
SELECT '948d4d79-3434-4480-a9fd-5d5b378466d2', '301', '301 : Analyse de l''application du décret no2021-860 et no2021-861 relatifs aux VTC en Côte d''Ivoire', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '301');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '8', '948d4d79-3434-4480-a9fd-5d5b378466d2');


INSERT INTO activites (id, code, libelle, actif)
SELECT '7b722aa5-8512-4985-850f-6c0c66cd342d', '402', '402 : Réalisation de l''Audit de la Vidéo verbalisation (Projet AVV)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '402');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '9', '7b722aa5-8512-4985-850f-6c0c66cd342d');


INSERT INTO activites (id, code, libelle, actif)
SELECT '8187fc29-3fcb-4e41-9943-0de4a8ff07a0', '106', '106 : Sensibilisation aux textes réglementaires du transport intérieur', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '106');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '10', '8187fc29-3fcb-4e41-9943-0de4a8ff07a0');


INSERT INTO activites (id, code, libelle, actif)
SELECT '255e85e9-b54b-4fbc-8157-ef228372325e', '107', '107 : Mise en place de cadres de concertation avec les transporteurs du District Autonome de Yamoussoukro', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '107');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '11', '255e85e9-b54b-4fbc-8157-ef228372325e');


INSERT INTO activites (id, code, libelle, actif)
SELECT '73aa6e2e-3873-4d43-b7ab-87e574ea365a', '108', '108 : Organisation et Coordination des différents modes de Transport intérieur (Projet AOMU)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '108');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '12', '73aa6e2e-3873-4d43-b7ab-87e574ea365a');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'cd345692-f1ed-43b0-9b11-c0b586c368d1', '109', '109 : Construction de l''image de marque de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '109');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '13', 'cd345692-f1ed-43b0-9b11-c0b586c368d1');


INSERT INTO activites (id, code, libelle, actif)
SELECT '0fcba93c-3b2f-4a05-8896-c3bd8fd388a3', '110', '110 : ?laboration et mise en ouvre du plan de recrutement (EPR)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '110');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '14', '0fcba93c-3b2f-4a05-8896-c3bd8fd388a3');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd8ad27ed-b6b8-4332-a185-c378bccc2f56', '111', '111 : Formation du personnel (Projet Formation 2025)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '111');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '16', 'd8ad27ed-b6b8-4332-a185-c378bccc2f56');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'b512db73-971e-4600-8356-b6b75f34d4ce', '112', '112 : Mise en place d''outils fonctionnels de communication(Projet COM)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '112');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '17', 'b512db73-971e-4600-8356-b6b75f34d4ce');


INSERT INTO activites (id, code, libelle, actif)
SELECT '872868b7-bd1f-4d98-ab92-3cfc8b1b93a2', '113', '113 : ?laboration des outils de la GPEC(Projet Digitalisation GPEC)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '113');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '18', '872868b7-bd1f-4d98-ab92-3cfc8b1b93a2');


INSERT INTO activites (id, code, libelle, actif)
SELECT '3eb577ca-bf29-41d6-977d-56bacb00c9fd', '114', '114 : Suivi et Evaluation des activités', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '114');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '19', '3eb577ca-bf29-41d6-977d-56bacb00c9fd');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd6fb26da-9100-4394-b4a1-18d8fea3c39d', '115', '115 : Renforcement du sentiment d''appartenance du personnel', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '115');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '20', 'd6fb26da-9100-4394-b4a1-18d8fea3c39d');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'b3dccf90-6149-40c7-a4fc-f25a216da7ef', '201', '201 : Mise en place d''une base de données électroniques des textes du secteur des transports (Projet TBC)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '201');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '21', 'b3dccf90-6149-40c7-a4fc-f25a216da7ef');


INSERT INTO activites (id, code, libelle, actif)
SELECT '6ca178ea-c3c4-4e53-98df-4b2d1cd24874', '302', '302 : Tenue des Sessions du Conseil de Régulation', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '302');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '22', '6ca178ea-c3c4-4e53-98df-4b2d1cd24874');


INSERT INTO activites (id, code, libelle, actif)
SELECT '465704c3-5eb5-46c9-9e8a-19c9d4532125', '501', '501 : Projet de texte réglementant les véhicules électriques (Projet Electro Car)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '501');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '23', '465704c3-5eb5-46c9-9e8a-19c9d4532125');


INSERT INTO activites (id, code, libelle, actif)
SELECT '8254cdaa-eeca-49e6-af45-1d111f2e67c6', '303', '303 : Mise en conformité de l''ARTI en matiSre de protection des données à caractSre personnel (en relation avec l''ARTCI)-Projet RGBD-ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '303');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '24', '8254cdaa-eeca-49e6-af45-1d111f2e67c6');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'f7ece6c7-5d07-4c20-b0ec-d9288838548a', '502', '502 : ?laboration de Normes de référence et de la qualité de service dans le secteur du Transport Intérieur (Projet CT 21)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '502');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '25', 'f7ece6c7-5d07-4c20-b0ec-d9288838548a');


INSERT INTO activites (id, code, libelle, actif)
SELECT '499fa473-0ee0-4488-ba54-d03c56193c73', '116', '116 : Création et usage de la signature électronique au sein de l''ARTI en collaboration avec l''ARTCI (projet E-signature)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '116');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '26', '499fa473-0ee0-4488-ba54-d03c56193c73');


INSERT INTO activites (id, code, libelle, actif)
SELECT '7e4b1652-3a67-437e-a1d2-4f6c370b3bae', '403', '403 : Ateliers de sensibilisation et de formation dans les localités de Songoné Daboué Dimbokroé Toumodié Bocandaé Djekanou et Kokumbo (Projet Campagne de Sensibilisation 2025)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '403');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '27', '7e4b1652-3a67-437e-a1d2-4f6c370b3bae');


INSERT INTO activites (id, code, libelle, actif)
SELECT '1eed661a-519a-4378-bd61-7ef2b0aa5b8e', '503', '503 : Mise en place de procédure de saisine et d''auto-saisine de l''ARTI (Projet Saisine)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '503');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '28', '1eed661a-519a-4378-bd61-7ef2b0aa5b8e');


INSERT INTO activites (id, code, libelle, actif)
SELECT '4cec1f61-0dec-4122-b1da-1e25fb6b2a4f', '202', '202 : Mise en place d''une base de données numérique commune des opérateurs de visite technique (Projet Digitalisation transport)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '202');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '29', '4cec1f61-0dec-4122-b1da-1e25fb6b2a4f');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2d69d6c9-0af8-47f2-a128-ae110e2be8e3', '202', '202 : Mise en ouvre du programme de performance organisationnelle de l''ARTI (SystSme de Management de la Qualité (SMQ) en vue de la certification à la norme ISO 9001 (Projet SMQ)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '202');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '30', '2d69d6c9-0af8-47f2-a128-ae110e2be8e3');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'f55c5dba-c7e6-4aef-89c9-4d78fb7d605c', '504', '504 : Mise en ouvre du programme de performance organisationnelle de l''ARTI (SystSme de Management de la Qualité (SMQ) en vue de la certification à la norme ISO 9001 (Projet SMQ)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '504');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '31', 'f55c5dba-c7e6-4aef-89c9-4d78fb7d605c');


INSERT INTO activites (id, code, libelle, actif)
SELECT '940c8d21-ccb2-40cc-a805-a16289fa597e', '505', '505 : Projet de texte portant réglementation des appareils portatifs de rechargement des batteries et des bandes réfléchissantes apposées à l''arriSre et à l''intérieur des véhicules poids lourds (Pro', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '505');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '32', '940c8d21-ccb2-40cc-a805-a16289fa597e');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'ce07a00c-96f2-4f4c-903b-0fedcffaa652', '203', '203 : Collecte des données liée à l''activité des VTC et la livraison des colis (Projet COLLECTOR VTC)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '203');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '33', 'ce07a00c-96f2-4f4c-903b-0fedcffaa652');


INSERT INTO activites (id, code, libelle, actif)
SELECT '66cd15bb-e759-4943-8339-c5b10d7c29b1', '117', '117 : Elaboration des rapports d''activités et des indicateurs de performances trimestriels de l''ARTI (Rapports trimestriels de l''ARTI)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '117');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '34', '66cd15bb-e759-4943-8339-c5b10d7c29b1');


INSERT INTO activites (id, code, libelle, actif)
SELECT '338f9c3f-b42e-469b-b376-8c3d4aa8b939', '118', '118 : Elaboration des tableaux de bord de toutes les Directions de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '118');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '35', '338f9c3f-b42e-469b-b376-8c3d4aa8b939');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2a4537f6-d20e-4e73-98d0-ea8780af9974', '204', '204 : Mise en place d''un SystSme d''Information Géographique (SIG) intégré pour l''optimisation des missions de régulation (Projet SIG-ARTI)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '204');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '36', '2a4537f6-d20e-4e73-98d0-ea8780af9974');


INSERT INTO activites (id, code, libelle, actif)
SELECT '5102e2e6-d95c-4690-85a9-04f1c662a42c', '205', '205 : Mise en place de base de données d''études stratégiques et prospectives', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '205');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '37', '5102e2e6-d95c-4690-85a9-04f1c662a42c');


INSERT INTO activites (id, code, libelle, actif)
SELECT '85bbfce0-6396-4c00-adc1-7725a4e86e78', '304', '304 : Etude de la tarification des segments du transport intérieur en Côte d''Ivoire(Projet Tarification)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '304');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '38', '85bbfce0-6396-4c00-adc1-7725a4e86e78');


INSERT INTO activites (id, code, libelle, actif)
SELECT '203ab5c0-7ae3-40aa-84f1-96aa50459291', '305', '305 : Projet Bourse de Fret en Côte d''ivoire', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '305');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '39', '203ab5c0-7ae3-40aa-84f1-96aa50459291');


INSERT INTO activites (id, code, libelle, actif)
SELECT '3b91ea22-7f86-4502-ae64-5b0bfdc97a5b', '306', '306 : Audit des paramStres de sécurité routiSre : cas de la ville de Yamoussoukro', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '306');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '40', '3b91ea22-7f86-4502-ae64-5b0bfdc97a5b');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2467f4aa-16f5-4ad3-98d2-664991092a93', '206', '206 : Mise en place d''un systSme de tracking des autocars et autres automobiles du genre de transport interurbain de personnes et de marchandises (Projet Tracking)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '206');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '41', '2467f4aa-16f5-4ad3-98d2-664991092a93');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'c0cb11fd-331d-4c9e-940e-2b43fade491d', '307', '307 : Etude de faisabilité du projet suivi de la mobilitéé des infrastructures de transport et de la sécurité routiSre à l''aide des systSmes d''information géographique (SIG)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '307');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '42', 'c0cb11fd-331d-4c9e-940e-2b43fade491d');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd2773e8b-088a-4382-8b47-c93874981dfd', '207', '207 : Faire une publication chaque trimestre à partir des données statistiques disponibles sur le secteur des transports', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '207');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '43', 'd2773e8b-088a-4382-8b47-c93874981dfd');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'c6c66896-8a7b-450b-99e7-02d48fa6610a', '208', '208 : Analyse semestrielle des données des accidents de la circulation dans le Grand Abidjan en collaboration avec l''OSER', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '208');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '44', 'c6c66896-8a7b-450b-99e7-02d48fa6610a');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'f648b5f3-2e7e-4512-800e-f0b0bbaaeb5c', '308', '308 : Etude d''impact environnemental des installations et des modes de transports en Côte d''Ivoire', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '308');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '45', 'f648b5f3-2e7e-4512-800e-f0b0bbaaeb5c');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'e55f62b3-2359-4c14-8fe1-d688ce1476ae', '309', '309 : Diagnostic du secteur Ferroviaire en Côte d''Ivoire:Réglementation et Opportunités d''Investissements', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '309');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '46', 'e55f62b3-2359-4c14-8fe1-d688ce1476ae');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'a24fafff-8c96-44a4-9374-5b4d73f28a01', '310', '310 : Recensement Général et Cartographie des transporteurs interurbains de personnes (Projet Recensement transport interurbain)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '310');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '47', 'a24fafff-8c96-44a4-9374-5b4d73f28a01');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'bb3f4b78-b543-46d8-8acc-d2f75ed9ad6d', '209', '209 : Enqu^tes de terrain sur les nouveaux modes de transport en cours d''implantation en Côte d''Ivoire (Projets Nouveaux Modes de Transport CI)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '209');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '48', 'bb3f4b78-b543-46d8-8acc-d2f75ed9ad6d');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'c5b0af96-dae4-495a-ab5c-4aa35a75bb8a', '210', '210 : Datacenter et interconnexion des bases de données', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '210');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '49', 'c5b0af96-dae4-495a-ab5c-4aa35a75bb8a');


INSERT INTO activites (id, code, libelle, actif)
SELECT '88f8544b-b4d1-49de-8b94-7324e4c5ab85', '119', '119 : Administration du site web de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '119');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '50', '88f8544b-b4d1-49de-8b94-7324e4c5ab85');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'b140ff11-1103-4b2e-be5a-75117b3c7674', '211', '211 : Infrastructure de sauvegarde de données', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '211');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '51', 'b140ff11-1103-4b2e-be5a-75117b3c7674');


INSERT INTO activites (id, code, libelle, actif)
SELECT '77ecd6a8-09c9-44f4-917c-07d9c04fcad1', '120', '120 : Amélioration et renforcement de la connectivité Internet', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '120');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '52', '77ecd6a8-09c9-44f4-917c-07d9c04fcad1');


INSERT INTO activites (id, code, libelle, actif)
SELECT '3c8a0606-c1b7-462d-8f93-549ffd0a4f92', '212', '212 : Modernisation et sécurisation de l''infrastructure informatique', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '212');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '53', '3c8a0606-c1b7-462d-8f93-549ffd0a4f92');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'dfcd56e1-11be-4713-886b-95ba236560e1', '401', '401 : Mise en ouvre des recommandations de l''audit diagnostic des opérateurs de visite technique', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '401');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '54', 'dfcd56e1-11be-4713-886b-95ba236560e1');


INSERT INTO activites (id, code, libelle, actif)
SELECT '20f5bad6-62e3-405c-8e1d-25d34348b664', '121', '121 : Dettes - Impôts sur salaires part patronale', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '121');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '55', '20f5bad6-62e3-405c-8e1d-25d34348b664');


INSERT INTO activites (id, code, libelle, actif)
SELECT '09cd31dd-5301-408c-996c-7bde4628691f', '122', '122 : Dettes - Autres impôtsé taxes et droits directs', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '122');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '56', '09cd31dd-5301-408c-996c-7bde4628691f');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'c0302743-cf13-4d96-99c1-d603b01a63ff', '123', '123 : Dettes - Cotisations CNPS des agents contractuels et décisionnaires', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '123');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '57', 'c0302743-cf13-4d96-99c1-d603b01a63ff');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'f5bc1ad9-3266-4748-803a-ec609687cb6e', '124', '124 : Dettes - Autres achats de petits matériels et fournitures techniques', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '124');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '58', 'f5bc1ad9-3266-4748-803a-ec609687cb6e');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2c3e2570-9cd6-4c05-b313-2e3e3505abff', '125', '125 : Dettes - Entretien des installations électriquesé climatiseursé sanitaires et plomberies', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '125');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '59', '2c3e2570-9cd6-4c05-b313-2e3e3505abff');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd61bd062-d374-4fab-8884-80e9c851f494', '126', '126 : Dettes - Rémunérations de prestations extérieures', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '126');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '60', 'd61bd062-d374-4fab-8884-80e9c851f494');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'd274ed98-069c-4213-be38-9320e668fb95', '127', '127 : Dettes - Honoraires et frais annexes', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '127');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '61', 'd274ed98-069c-4213-be38-9320e668fb95');


INSERT INTO activites (id, code, libelle, actif)
SELECT '59e07455-e198-41f3-9e0f-5e1cc4b3a84b', '128', '128 : Dettes - Prestation des organismes de formation résidents', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '128');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '62', '59e07455-e198-41f3-9e0f-5e1cc4b3a84b');


INSERT INTO activites (id, code, libelle, actif)
SELECT '72038b8f-2ea7-4c96-bf6a-3873641e9ed1', '129', '129 : Apurement du Passif', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '129');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '63', '72038b8f-2ea7-4c96-bf6a-3873641e9ed1');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'e7b2f8f2-dcb4-47dc-96be-c23ad17fb797', '130', '130 : Dettes - BŸtiments administratifs à usage de bureau', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '130');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '64', 'e7b2f8f2-dcb4-47dc-96be-c23ad17fb797');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'ecc3a180-7955-4273-a11e-42f6e6f10cfc', '131', '131 : Fonctionnement', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '131');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '65', 'ecc3a180-7955-4273-a11e-42f6e6f10cfc');


INSERT INTO activites (id, code, libelle, actif)
SELECT '24f57302-4a7e-4c54-bdc2-b9faeb753ebc', '213', '213 : Enquete de satisfaction des population et des usagers et des acteurs du transport', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '213');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '66', '24f57302-4a7e-4c54-bdc2-b9faeb753ebc');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'dc203555-8a72-4cdf-854d-8bfc6ea752a7', '132', '132 : Organisation de la cérémonie des 5 ans de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '132');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '67', 'dc203555-8a72-4cdf-854d-8bfc6ea752a7');


INSERT INTO activites (id, code, libelle, actif)
SELECT '4d67e9c6-28fa-4ed7-941e-bf0ef8394057', '141', '141 : Projet de construction du siSge de San-Pédro', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '141');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '68', '4d67e9c6-28fa-4ed7-941e-bf0ef8394057');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'fd7b798c-1a16-4d97-9ebc-7b640bcd6dbd', '133', '133 : Mise en place d''outils fonctionnels de communication (Numéro vert)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '133');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '69', 'fd7b798c-1a16-4d97-9ebc-7b640bcd6dbd');


INSERT INTO activites (id, code, libelle, actif)
SELECT '2f762e7c-6b68-4c66-8011-57e3232ae971', '134', '134 : Fonctionnement du service médical au sein de l''ARTI (OSM)', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '134');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '70', '2f762e7c-6b68-4c66-8011-57e3232ae971');


INSERT INTO activites (id, code, libelle, actif)
SELECT 'a7dff4f1-947a-4df1-937f-4383e4242822', '506', '506 : Mise en place de la démarche éthique de l''ARTI', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '506');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '71', 'a7dff4f1-947a-4df1-937f-4383e4242822');
