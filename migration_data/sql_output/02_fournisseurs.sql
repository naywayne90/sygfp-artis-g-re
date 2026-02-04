-- Migration des fournisseurs
-- Note: Dans le nouveau SYGFP, les fournisseurs sont stockés comme texte dans les engagements
-- Ce fichier crée une table de référence temporaire

CREATE TABLE IF NOT EXISTS migration_fournisseurs (
  id SERIAL PRIMARY KEY,
  ancien_id INTEGER,
  raison_sociale TEXT,
  sigle TEXT,
  adresse TEXT,
  compte_bancaire TEXT,
  banque TEXT
);


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (1, 'ADJA QUINCAILLERIE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (2, 'AFRIC CONSULTING & AUDIT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (3, 'AFRICA CAPITAL MARKETS CORPORATION (ACMC)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (4, 'AFRICA O''CLOCK', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (5, 'AFUR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (6, 'TRACTAFRIC MOTORS COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (8, 'AIR COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (9, 'AIR France', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (10, 'AMS CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (11, 'ANAIS CONSTRUCTION FACTURE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (12, 'ANOYA SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (13, 'ANTHONYé FOFANA & ASSOCIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (14, 'ASSURE PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (15, 'ATC COMAFRIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (16, 'AUTO - CLASS MASTER', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (17, 'AUTOMOTIVE VEHICLES & LOGISTICS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (18, 'BAT CLEAN DECO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (19, 'BBS SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (20, 'BERNABE CÔTE D''IVOIRE (Investissement)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (21, 'BERNABE CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (22, 'BOIRE DAOUDA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (23, 'BULLES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (24, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (25, 'CANAL + HORIZON', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (26, 'CCBI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (27, 'SOCIETE DE DISTRIBUTION ALIMENTAIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (28, 'CFAO MOTORS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (29, 'CLASSIC AUTO DESIGN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (30, 'CLUB SOCOCE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (31, 'COMPLEXE GBEKE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (32, 'CONNEXION PHOTOGRAPHY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (33, 'CORRECT PRINT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (34, 'CORLAY COTE D''IVOIRE SA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (35, 'CORRECT PRINT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (36, 'COTISATION UITP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (37, 'DES GATEAUX ET DU PAIN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (38, 'DIVERS FOURNISSEURS D''INVESTISSEMENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (39, 'DLP ALU', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (40, 'EGIB SECURITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (41, 'EMMA CAB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (42, 'EMMA CAB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (43, 'ETRACON SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (44, 'ETS AIDA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (45, 'ETS ETACOM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (46, 'EUROPCAR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (47, 'EXFI CONSULTING FIRM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (48, 'FAVà UITP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (49, 'FAWAZ RADWAN ôSUPER AUTOô', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (50, 'FONS D''ENTRETIEN ROUTIER', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (51, 'FLEUR DE JONQUILLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (52, 'FLEUR''ATITUD', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (53, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (54, 'G4S', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (55, 'GALERIES PEYRISSAC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (56, 'DES GATEAUX ET DU PAIN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (57, 'GENERAL IVOIRIENNE ALIMENTAIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (58, 'GROUPE FSA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (59, 'HàEàC BUSINESS SCHOOL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60, 'HORIZON TECHNOLOGIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (61, 'HOTEL LE COLLECTIONNEUR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (62, 'HOTEL TIAMA ABIDJAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (63, 'HUGSON CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (64, 'IK EVENT''S RESSOURCES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (65, 'INP HB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (66, 'INTELECT PROTECTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (67, 'IVOIRE CARTES SYSTEMES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (68, 'IVOIRE QUINCAILLERIE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (69, 'JAKARA SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70, 'JUST HUSS SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (71, 'KABOD SIGNATURE IMMOBILIER', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (72, 'KADIA ENTREPRISES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (73, 'KARLSRUHER MESSE - UND KONGRESS GMBH', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (74, 'KONE HASSAN IDRISS (LOYER)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (75, 'LA BOUQUINETTE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (76, 'COMPTOIR  DISTRIBUTION ELECTRIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (77, 'LA POSTE DE COTE DIVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (78, 'LA POSTE DE COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (79, 'LASS BOUTIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (80, 'LEADER PRICE COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (81, 'LIBRAIRIE DE FRANCE GROUPE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (82, 'LIBRAIRIE LA BOUQUINETTE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (83, 'MASTER TECHNOLOGIE INFORMATIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (84, 'MASTER TECHNOLOGIE INFORMATIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (85, 'MEDIASOFT LAFAYETTE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (86, 'MESSE KARLSRUHE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (87, 'MI3E', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (88, 'NASCO PIECE AUTO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (89, 'NOEMA CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90, 'NOVASYS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (91, 'O''CONFECTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (92, 'OIM TRAVEL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (93, 'ORANGE CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (94, 'ORANGE CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (95, 'ORANGE CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (96, 'PAPIGRAPH CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (97, 'PAPILUX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (98, 'PETRO IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (99, 'PHENICIA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100, 'PHENICIA IMPORT EXPORT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (101, 'PIVOT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (102, 'PMS INFORMATIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (103, 'POLYCLINIQUE INTERNATIONALE HOTEL DIEU', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (104, 'PRICEWATERHOUSECOOPERS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (106, 'PULLMAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (107, 'QUICAILLERIE GENERALE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (108, 'QUICAILLERIE TITAREX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (109, 'RD&V', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110, 'RENAISSANCE HOTEL  ARC DE TRIOMPHE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (111, 'rgs sarl  & cnps /regroupement de service', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (112, 'PULLMAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (113, 'SERVICE AQUATIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (114, 'SEYDOU OUATTARA (LOYER)_BKE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (115, 'SGS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (116, 'SHALOM CLEAN SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (117, 'SIA GANDELA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (118, 'SICTA/ SGS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (119, 'SIGASECURITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120, 'SIGASECURITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (121, 'SILBAT SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (122, 'SILUE LACINA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (124, 'SKY BIRD (OUATTARA & ASSOCIES)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (125, 'SOCIDA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (126, 'HYPERMARCHES-SUPERMARCHES CLUB SOCCE CENTRE COMMERCIAL CLUB SOCOE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (127, 'SICI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (128, 'SOCIETE ORCA DECO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (129, 'SOCIETE POUR LES INNOVATIONS CREATRICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (130, 'SOCOCE 2 PLATEAUX LATRILLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (131, 'SOCOPRIX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (132, 'SODECI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (133, 'SOFITEL HOTEL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (134, 'SOGELUX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (135, 'SOM AUTOMOBILE IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (136, 'SPIRAL OFFICE & HOME', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (137, 'TOP PISCINE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (138, 'TOTAL ENERGIE  CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (139, 'TRAITEUR ET PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (141, 'BATIVOIREàCO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (142, 'VIPNET', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (144, 'YAHAYA ISSIAKA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (145, 'YAM SERVICES PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (146, 'YESHI SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (147, 'YOUBA QUINCAILLERIE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (148, 'SANLAM COTE DIVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (149, 'L''OENOPHILE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (150, 'QUINCAILLERIE GENERALE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (151, 'AB SERVICE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (152, 'STà SAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (153, 'TPCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (154, 'UNION INTERNATIONALE DES TRANSPORTS PUBLICS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (155, '2BPUB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (156, 'DREAM EVENTS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (157, 'CABINET ARCHI-SYSTEM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (158, 'HELIOS INTERNATIONAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (159, 'FLEUR DE JONQUILLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160, 'ONE STOP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (161, 'TOTAL ENERGIE  CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (162, 'CNPS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (163, 'TOTAL ENERGIE  CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (164, 'TOTAL ENERGIE  CÔTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (165, 'ECO-CLAIR SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (166, 'SABRAMAB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (167, 'LEVITIC COMPAGNIE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (168, 'CYPHER GLOBAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (169, 'FRANCK & LEOPOLD IVOIRE SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170, 'BARAKIEL ENTREPRISE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (171, 'PERSONNEL DE L''ARTI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (172, 'H2O PISCINE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (173, 'HOODA GRAPHIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (174, 'RESIDENCE LIMANIYA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (175, 'DISTRICT AUTONOME D''ABIDJAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (176, 'HOTELLERIE LA LICORNE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (177, 'MY SOLUTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (178, 'DGI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (179, 'HOTEL DE L''ART', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180, 'SOLIUM IT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (181, 'HAUTEUR D''ESPRIT RIGUEUR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (182, 'CHAMBRE DE COMMERCE ET D''INDUSTRIE DE COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (183, 'FLOPYTECH', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (184, 'Floréal', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (185, 'DIRIGEANTS SOCIAUX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (186, 'FOTOGRAPHIC EVENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (187, 'CYPHER GLOBAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (188, 'CYPHER GLOBAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (189, 'EXSOL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190, 'ENGINE SYSTEM MOTORS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (191, 'SABRAMAB ENTREPRISE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (192, 'ASMA&CO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (193, 'BERAK''ART', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (194, 'CASA CONCEPT INTERNATIONAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (195, 'LCE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (196, 'SOCOPRIM SA (HKB)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (197, 'AUTHENTICRH', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (198, 'CACOMIAF', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (199, 'T & P EVENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200, 'FOURNISSEURS DIVERS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (201, 'ASBAT-CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (202, 'CAM-SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (203, 'ESPACE YEMAD', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (204, 'GEGCI SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (205, 'MAUVILAC INDUSTRIES AFRICA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (206, 'MOOV AFRICA COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (207, 'CHEN GROUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (208, 'COMEUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (209, 'JAKARA SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (210, 'ALUMINIUM METALLERIE CONSTRUCTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (211, 'ATLANTIS SMART SOLUTIONS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (212, 'POLYMED', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (213, 'GENDARMERIE NATIONALE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (214, 'RIA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (215, 'CODINORM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (216, 'TRAORE DRISSA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (217, 'ETUDE DE MAITRE ORE  GROGUHE SANDRINE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (218, 'ETUDE DE MAITRE ORE  GROGUHE SANDRINE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (219, 'GLOBAL ALU CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220, 'ALLUMINIUM METALLERIE CONSTRUCTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (221, 'HORIZON TECHNOLOGIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (222, 'SOCIETE INQ', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (223, 'o2switch', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (224, 'MEDECINE DU TRAVAIL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (225, 'PHARMACIE  SAINTE CECILE DES VALLONS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (226, 'HOLY PHARM SERVICES SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (227, 'SOGELUX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (228, 'AB SERVICE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (229, 'No1 TECHNIQUE AUTO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (10223, 'UNIVERSITE NORD SUD', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (10224, 'GE GLOBAL- ELEC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (20223, 'GLUTTON', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (30223, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (40223, 'AFRICAUTO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (40224, 'CENTRE MEDICAL INTERNATIONAL LA GOSPA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (50224, 'AYOUBEL AFRIKA SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (50225, 'MINISTERE DES TRANSPORTS DIRECTION REGIONALE DES LAGUNES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (50226, 'Acteurs externes de l''ARTI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60224, 'MCN OUTLET', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60225, 'VALEUR MONDE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60226, 'LA MAISON PALMIER', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60227, 'LABORATOIRE DU BATIMENT ET DES TRAVAUX PUBLIQUES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60228, 'AU PARCHEMIN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60229, 'MCS INSTITUT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (60230, 'KYNUX TECHNOLOGIES SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70224, 'DIRECTION GENERALE DES TRANSPORTS TERRESTRES ET DE LA CIRCULATION ( DGTTC)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70225, 'OTHENTIC GROUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70226, 'CONCEPT CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70227, 'PLOMBIER BAMBA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70228, 'BATISS CONSTRUCTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (70229, 'CENTRE HOSPITALIER ET UNIVERSITAIRE DE TREICHVILLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (80225, 'GAOUSSOU RAMASSAGE DES ORDURES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (80226, 'BERAK''ART', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (80227, 'TEB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90225, 'VISUEL CONCEPT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90226, 'AGENCY CAMYDIA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90227, 'FIESTA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90228, 'L''OCEAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90229, 'W MEDIA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90230, 'ARTIS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90231, 'ARTIS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (90232, 'ARTIS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100225, 'BUROTIC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100226, 'ECCàCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100227, 'SONAPIE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100228, 'GOLD SOLUTION SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100229, 'GOLD SOLUTION SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100230, 'International Software Corporation', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100231, 'GARAGE PGA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100232, 'PEINTRE SIMIA ABOUBACAR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100233, 'SIKA GROUP ACHITECTURE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100234, 'AS PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100235, 'ATC COMAFRIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100236, 'OLA ENERGY CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100237, 'TURKISH AIRLINES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100238, 'INTERNATIONAL ADVISOR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100239, 'KENYA AIRWAYS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100240, 'ASBAT-CI SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100241, 'AQUABAT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100242, 'RAMAFE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100243, 'SLK Studios', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100244, 'PERFECT ORGANIZ SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100245, 'RESTAURANT BANIAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100246, 'CGE KOUROUKAN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100247, 'ETIC BTP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100248, 'PEINTRE ISSA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100249, 'UBA COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100250, 'IK EVENT'' S RESSOURCES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100251, 'EXCELSIOR CONSULANTS CONSEILS ET AUDITEURS ASSOCIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (100252, 'MUCAB-MT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110250, 'SEDS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110251, 'ETS OUVRIER  & FONGBE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110252, 'TOP IMPEX SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110253, 'NOVASYS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110254, 'SPIRAL OFFICE & HOME', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (110255, 'POLYMED', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120252, 'DKYI SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120253, '2BPUB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120254, 'CLASS C PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120255, 'CLASS C PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (120256, 'CLASS C PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (130254, 'GROUP IVOIRE MOTO-SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (140254, 'ETABLISSEMENT SN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (140255, 'RESIDENCE HOTELIERE O''LORD', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (150254, 'MK AUTO CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (150255, 'LEAD NOOVA GROUP SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (150256, 'SUPER ELECTRONIC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160255, 'MAYELIA AUTOMOTIVE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160256, 'COMEUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160257, 'ETS JEHOVAH-JIREH SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160258, 'VIPNET', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160259, 'GLOBAL BUILDING & SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160260, 'TEB', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160261, 'PERSONNEL DE L''ARTI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160262, 'BHCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160263, 'ENTRETIEN DE VEHICULE(LAVAGE)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160264, 'MEDIASOFT LAFAYETTE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160265, 'AGROSPHYSSARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160266, 'OFFICE IVOIRIEN DE LA PROPRIETE INTELLECTUELLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160267, 'INTELIGENCE MULTIMEDIA SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160268, 'PRESSES RADIO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160269, 'COMEN INTERNATIONAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160270, 'IMPULS''COM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (160271, 'STARS GROUP CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170270, 'OUEDRAOGO SEYDOU SERVICE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170271, 'EMIRATES AIRLINES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170272, 'OTOMASYS sarl', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170273, 'EVIS MULTI SERVICES EVENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170274, 'AFCCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170275, 'NEANT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170276, 'COMUNIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170277, 'PRESSES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170278, 'LE MATIN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170279, 'WINCOM GROUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170280, 'LE RASSEMBLEMENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170281, 'FNAC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170282, 'LIBRAIRIE DIEPKILE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170283, 'BEE BUILDING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170284, 'CODITRANS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170285, 'GSB HOME', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170286, 'CKZ ELVEHTPRO', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170287, 'OAZIZ TECHNOLOGY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170288, 'AB SERVICE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170289, 'MY INBOX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170290, 'BLACK AND WHITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (170291, 'HYATT REGENCY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180272, 'NAHICO HOTEL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180273, 'DIRECTION DU CADASTRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180274, 'HARVEST  PIME Pvt Ltd', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180275, 'DELIOZ CONSULTING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180276, 'CENTRE AFRICAIN DE MANAGEMENT ET DE PERFECTIONNEMENT DES CADRES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180277, 'PETRO IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180278, 'PRESTIGE SERRURERIE COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180279, 'SOCIAM SUCC 12', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180280, 'LEDIA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180281, 'HORECA WORLD SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180282, 'ATLANTIS SMART SOLUTIONS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180283, 'AFRICA VIRTUAL GROUP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180284, 'ETUDE DE MAITRE KOUAME NGUESSAN CHARLES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180285, 'MAGISTRAT ARTI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180286, 'NAMA RESTAURANT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180287, 'DOOWELL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180288, 'OàSà EDITION & PRODUCTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180289, 'TRILOGY EVENTS & COM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (180290, 'ACTU ROUTE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190289, 'IDEAL VOYAGE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190290, 'GCIS CONCEPT SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190291, 'EXPERTISE LOCALE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190292, 'IFACI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190293, 'JIREH SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190294, 'AMS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190295, 'HUMIDIT'' EXPERT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190296, 'B COM SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190297, 'DIVINE DECOR', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190298, 'BOLLESTORE PLUS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190299, 'OCEANE INTERNATIONAL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (190300, 'LES PALMIERS MULTITISERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200290, 'KEDJ SECURITE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200291, 'INTEGRAL TRANSIT ET TRANSPORT LOGISTIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200292, 'SOCIETE C5P AFRIQUE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200293, 'LIBRAIRIE DE FRANCE GROUPE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200294, 'DATACONNECT AFRICA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (200295, 'PAPIGRAPH CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (210290, 'VENAME (DOMAINE ARTI CI)', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220290, 'SOTRATOURISME', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220291, 'LA MAISON DES TELEPHONES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220292, 'TRANSTELECOM OEOS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220293, 'GROUP CARRE VERT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220294, 'TECHNOLOGIE MEDICALE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220295, 'CFAO MOBILITY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (220296, 'TAURUS LOGISTICS COTE D''IVOIRE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230292, 'MAITRE KOUAME N''GUESSAN CHARLES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230293, 'IB SOPE NABY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230294, 'WV REELCOM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230295, 'GPE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230296, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230297, 'SOCI?T? DES DEUX PLATEAUX', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230298, 'AFRICA MAINTENANCE SOLUTION', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230299, 'BRIC A BRAC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230300, 'COMPLEXE HOTELIER TAPIS ROUGE LA FONTAINE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230301, 'DMA INTERTAINMENT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230302, 'AGENCE RCG', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (230303, 'ENTREPRISE GCIS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240292, 'SPONSORING RESEAUX SOCIAUX ARTI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240293, 'CASA Ekwa', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240294, 'MR BRICOLAGE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240295, 'MY BABY BOUTIQUE SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240296, 'D''KHAN RESORT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240297, 'CARA CENTER', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (240298, 'CABINET DE GEOMETRE EXPERT CISSE ADAMA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (250292, '2MTRADING', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260292, 'JUMIA CIV', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260293, 'ETUDE DE MAITRE COULIBALY YOH KHADIDIA NOURA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260294, 'CI2T & COMPAGNY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260295, 'CURSOR-CLAUD MAX-NEON AI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260296, 'TRIBUNAL DE GRAND BASSAM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260297, 'CAR DEPOT', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260298, 'MOFVAK SERVICES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260299, 'ENTREPRISE LAGAZE FONGBE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260300, 'LAWASS SERVICE & ASSOCIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260301, 'ETUDE DE Me MANGOUA CHARLOTTE YOLANDE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260302, 'MINISTERE DU COMMERCE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260303, 'CNDJ', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260304, 'FERRONNERIE BOKA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260305, 'SPRIINT TECH', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260306, 'CGI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260307, 'SOCIETE D''AVOCATS BILE-AKAéBRIZOUA-BI & ASSOCIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260308, 'IICI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260309, 'SODIREP', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260310, 'SODIMA SARL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260311, 'COMPTE COURANT BHCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260312, 'CIRAD', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260313, 'CATHY DELICE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260314, 'FONDATION AGIR CONTRE LE CANCERS', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260315, 'LAWAS SERVICE & ASSOCIES', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260316, 'PRIZY', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260317, 'SUCCES IMPRIM GROUPE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (260318, 'EULIS HOTEL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270316, 'HOTEL LA ROSE BLANCHE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270317, 'APPLE RETAIL FRANCE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270318, 'PRO GLASS CI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270319, 'PALM CLUB HOTEL', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270320, 'CODINORM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (270321, 'LE MECHOUI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (280317, 'COCITAM', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (280318, 'MKOA HOTEL JACQUEVILLE', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (280319, 'ROYAL AIR MAROC', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (280320, 'ARTCI', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (280321, 'GARAGE RTA', '', '', '', '');


INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES (290320, 'MEER', '', '', '', '');
