-- Migration des engagements budgétaires
-- Source: Budget (ancien SYGFP)
-- Destination: budget_engagements (nouveau SYGFP)


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2aeb15e8-dd4d-402b-b473-a84a414e4833', 'ARTI101250001', 'RSglement de la facture pour la consommation Orange Internet pour la période du 01/01 au 31/01/2025 au siSge de l''ARTIà', 235028, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-01-17T08:01:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4ff803fd-a967-41ad-bbe3-00eb0fc9d1ba', 'ARTI101250017', 'DEPOT DE COURRIER DE REMERCIEMENTS', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-19T18:11:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ccf315e8-1178-41e9-b64e-645bae6653c3', 'ARTI101250016', 'Demande de paiement du loyer bureau régional de l''ARTI sis à Bouake pour le 1er trimestre janvieré févrieré mars 2025à', 750000, 'SEYDOU OUATTARA (LOYER)_BKE', 'valide', '2025-01-19T18:12:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9defe48f-200b-4d61-a08f-97fda8ebbcf7', 'ARTI101250015', 'Demande de paiement de la facture d''assurance Automobile pour l''année 2025 de l''ARTIà', 12943650, 'ASSURE PLUS', 'valide', '2025-01-19T18:12:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('baf558c1-c1d9-4cbb-8963-316446b7ba80', 'ARTI101250010', 'TRANSMISSION DE DOCUMENTS ADMINITRATIFS AU BUREAU REGIONAL DE BOUAKE', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-19T18:13:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('29db62cc-e8e5-4bdb-a733-d05fee522cfb', 'ARTI101250019', 'DEMANDE D''AUGMENTATION DU DEBIT INTERNET ORANGE FIBREé DE L''ARTI A 1 GO', 145000, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-01-20T07:51:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc8ce50f-f9c9-4948-8597-cdb5fb3c1e1f', 'ARTI101250013', 'Demande d''acquisition des Assiettes creusesé Assiettes à dessert et des Verres à Eauà', 394050, 'SOCIETE ORCA DECO', 'valide', '2025-01-20T07:51:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31131ffb-2a57-42dd-8d1f-eccba402d399', 'ARTI101250012', 'Révision des 30000 kms du véhicule FORD EXPLORER immatriculé 1415 LJ 01', 455669, 'AFRICAUTO', 'valide', '2025-01-20T07:52:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b438d86-4c02-4691-b827-d2ba62a7ae2a', 'ARTI101250008', 'Renouvellement antivirus Check Point Harmony Endpoint Advanced pour l''année 2025', 2121515, 'NOVASYS', 'valide', '2025-01-20T07:53:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5288c64e-f19d-4b63-93ba-6ce93f35a9f5', 'ARTI101250007', 'Renouvellement de licence pour sécurité de l''architecture réseau de l''ARTIé 2025', 1890500, 'FLOPYTECH', 'valide', '2025-01-20T07:53:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3c461d82-ef61-4397-801c-53d3579ac432', 'ARTI101250009', 'DEMANDE DE DATA MOOV PREPAYEE POUR COUVERTURE INTERNETé BUREAU DIRECTEUR GENERAL ARTI', 25000, 'SODITEL', 'valide', '2025-01-20T07:54:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c3bfe180-52e7-4b36-9677-1216825fb4e3', 'ARTI101250003', 'Demande de paiement de la facture d''Assurance Multirisque Professionnelle de l''ARTIà', 6405700, 'ASSURE PLUS', 'valide', '2025-01-20T07:55:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf6ceac9-5445-42a5-84fe-f5c915560569', 'ARTI101250002', 'Demande de paiement de la facture d''Assurance Responsabilité Civile du Personnel de l''ARTIà', 498075, 'ASSURE PLUS', 'valide', '2025-01-20T07:55:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7e0ef8ab-cef4-4a8f-866b-81fd0fd17fba', 'ARTI101250011', 'Achat de batterie du véhicule NISSAN PATROL 6767 KR 01', 225000, 'GROUPE FSA', 'valide', '2025-01-20T07:55:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ef3a2ed-6369-43ff-abed-7836eb7245ee', 'ARTI101250014', 'Achat de batterie de véhicule SUZUKI VITARA 2923 LP 01', 115000, 'ETS JEHOVAH-JIREH SARL', 'valide', '2025-01-20T07:56:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d668c8a8-cca0-4a91-b584-2b49ea8ccd97', 'ARTI101250004', 'PARTICIPATION AUX ATELIERS DE RESTITUTION ET DE VALIDATION DES RAPPORTS PUDé RPUé EES', 120000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-20T07:57:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4cf28bf4-822f-4ecc-8a39-353ac442151e', 'ARTI101250006', 'DEPOT DE COURRIER DE REMERCIEMENTS', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-20T07:58:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e2d231ce-00fd-4cd4-9576-97424100f76a', 'ARTI101250005', 'Demande de renouvellement d''un plugin WordPress ôElementor Proô pour site web de l''ARTI', 20860, 'COMEUP', 'valide', '2025-01-20T07:58:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0c7ab9b6-b96d-431c-9bb6-627530b580ee', 'ARTI101250022', 'REGULARISATION INDEMNITES MENSUELLE EPHP GENDARMERIE NATIONALE POUR LE MOIS DE JANVIER 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-01-21T23:31:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d785bfc0-d957-435a-8084-ff3ba8f6561e', 'ARTI101250021', 'PAIEMENT PRIME DE STAGE MOIS DE JANVIER 2025', 400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-21T23:31:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('54c5a6f2-64d8-4ecf-ad91-0bb250885def', 'ARTI101250020', 'Demande de dépannage d''électricité au siSge de l''ARTI', 65000, 'GLOBAL BUILDING & SERVICES', 'valide', '2025-01-21T23:31:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c9cd0c61-028c-43d7-aa6d-aedce23d9303', 'ARTI101250018', 'ACQUISITION DE POINTS D''ACCES WIFI POUR SITE ARTI ABIDJAN', 1593000, 'VIPNET', 'valide', '2025-01-21T23:32:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('55640ed8-7dcb-4481-b386-ba83a30cbc1e', 'ARTI101250025', 'HONORAIRES DES MEDECINS POUR LE MOIS DE JANVIER 2025', 1250000, 'MEDECINE DU TRAVAIL', 'valide', '2025-01-23T20:22:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('74f4f885-4c6f-4d0c-baa0-09f5f3b7412c', 'ARTI101250024', 'SITUATION ASSURANCE MALADIE', 40190000, 'ASSURE PLUS', 'valide', '2025-01-23T20:23:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a363ac69-d1aa-4fea-a956-d2ac98da1300', 'ARTI101250023', 'DEMANDE DE RENOUVELLEMENT DE LA LIGNE INTERNET SPECIALISEEé DEDIEE DE L''ARTI', 4148000, '', 'valide', '2025-01-23T20:24:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('91bfa1a0-eeae-4095-a3b5-c1f3c9221c24', 'ARTI101250038', 'RSglement mensuel de la facture KADIA ENTREPRISES pour le mois de janvier 2025à', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-01-24T20:08:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d1377cd9-a97a-4955-ba8f-a248a4d28216', 'ARTI101250037', 'Note de frais - Réception à la Maison Palmier', 137000, 'LA MAISON PALMIER', 'valide', '2025-01-24T20:08:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d87a71bd-d495-49bb-9772-f5b6b1c13d1b', 'ARTI101250036', 'Demande d''autorisation d''achats pour la pause-café de la séance de travail avec des Operateurs VTC au siSge de l''ARTI le 22 janvier 2025', 28600, '', 'valide', '2025-01-24T20:09:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('527ba20b-20e4-474c-927d-0cf02f8e378a', 'ARTI101250035', 'Demande de rSglement du siSge de l''ARTI pour le mois de janvieré févrieré mars 2025 (KABOD IMMOBILIER)à', 15000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-01-24T20:09:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a5e6686a-c7fd-43b9-8af8-f504aea04da9', 'ARTI101250034', 'Rechargement carburant du groupe électrogSne du 16/01/2025 au siSge de L''ARTI', 57200, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-01-24T20:09:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ddeec444-11d8-4e91-a1e1-0e984c438d71', 'ARTI101250033', 'Prise en charge d''un agent du MinistSre des Transports pour le MastSre Spécialisé Transport et Aménagement Urbain de l''INPHB 2025-2026', 4331000, 'INP HB', 'valide', '2025-01-24T20:10:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1836204c-a3bc-4da9-b956-0e5e999653c1', 'ARTI101250081', 'Demande d''achat de bons-valeurs de carburant', 3000000, 'PETRO IVOIRE', 'valide', '2025-01-24T20:10:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('59ee80d1-f4d0-4001-b15c-0f16c095af55', 'ARTI101250080', 'PAIEMENT DES RETENUS A LA SOURCE SUR HONORAIRES VERSES AUX MEDECINS POUR LE MOIS DE JANVIER 2025', 125675, 'DGI', 'valide', '2025-01-24T20:10:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('659ec3dd-7149-4ff5-bcff-5acb16a8b2d0', 'ARTI101250031', 'DECLARATION DES ITS POUR LE MOIS DE JANVIER 2025', 14315842, 'DGI', 'valide', '2025-01-24T20:12:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f50d0377-b9ea-4333-b1f8-0444a09296d9', 'ARTI101250029', 'TAXE A LA FORMATION PROFESSIONNELLE CONTINUE FDFP DU MOIS DE JANVIER 2025', 388481, 'DGI', 'valide', '2025-01-24T20:13:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ab25b7cd-6507-4e4c-8bc3-0daac7b05c8f', 'ARTI101250026', 'PAIEMENT DES COTISATIONS CNPS DU MOIS DE JANVIER 2025', 8373605, 'CNPS', 'valide', '2025-01-24T20:13:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('78bdf3d8-8a6e-48de-badb-462b94a4c798', 'ARTI101250027', 'PAIEMENT DES COTISATIONS CMU DU MOIS DE JANVIER 2025', 43000, 'CNPS', 'valide', '2025-01-24T20:14:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6b19b914-cee4-4853-8256-7fcd01d4747c', 'ARTI101250028', 'TAXE D''APPRENTISSAGE MOIS DE JANVIER 2025', 258989, 'DGI', 'valide', '2025-01-24T20:14:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c2e0a1cc-540f-47d2-b0a6-59af9b976be2', 'ARTI101250030', 'AUTORISATION DE PAIEMENT DU SALAIRE ET APPOINTEMENT DU MOIS DE JANVIER 2025', 47070615, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-24T20:15:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2f27b1b2-b3a7-4adf-997a-ffe4aed00243', 'ARTI101250032', 'PAIEMENT DES RETENUS A LA SOURCE SUR HONORAIRES VERSES AUX MEDECINS POUR LE MOIS DE JANVIER 2025', 125675, 'DGI', 'valide', '2025-01-24T20:15:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e0e72d54-cf11-45d0-adf2-b98f19413d10', 'ARTI101250041', 'RENCONTRE AVEC L''EQUIPE DU BUREAU REGIONAL DE YAMOUSSOUKRO', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-27T10:50:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e01db8a7-5424-4c0d-8657-f05b523aa16c', 'ARTI101250040', 'RENCONTRE AVEC L''EQUIPE DU BUREAU REGIONAL DE YAMOUSSOUKRO', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-27T10:50:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3104d9fd-ba59-49d2-92cf-27572850d190', 'ARTI101250039', 'RENCONTRE AVEC L''EQUIPE DU BUREAU REGIONAL DE YAMOUSSOUKRO', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-01-27T10:51:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a52d1360-3610-440a-abf1-9e2aedf4a17f', 'ARTI101250049', 'Rechargement cartes péages HKB ARTI mois de févier', 210000, 'SOCOPRIM SA', 'valide', '2025-02-03T09:03:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('948b9977-77ed-4905-a252-a51f41ae3ed2', 'ARTI101250048', 'Rechargement cartes péages FER mois de février 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-02-03T09:04:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d9270fad-7e86-404e-b652-e0c0620fd952', 'ARTI101250046', 'RSglement de la facture de canal horizon pour le mois de janvier 2025', 85000, 'CANAL + HORIZON', 'valide', '2025-02-03T09:05:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('590ae4cb-1488-477f-86aa-cf6ec102cf26', 'ARTI101250045', 'Demande de rSglement de Fleur de jonquille pour le mois de janvier 2025à', 80000, 'FLEUR DE JONQUILLE', 'valide', '2025-02-03T09:05:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b64c690-b191-42bd-bcf1-d1976fc66830', 'ARTI101250044', 'Traitement des bureaux du siSge de l''ARTI contre les nuisibles', 588000, 'AGROSPHYSSARL', 'valide', '2025-02-03T11:52:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7d5b61c4-717f-4ba8-a930-52f13eec7d19', 'ARTI101250042', 'ACQUISITION DE MULTIPRISES POUR AMENAGEMENT DE BUREAUX ARTI', 45000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-02-03T11:52:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e0cbd38-6052-4d94-80d8-364dff3cf38b', 'ARTI101250043', 'DEMANDE REPARATION DU MODULE TACTILE LA GRANDE IMPRIMANTE CANON IR C5560i', 415000, 'GOLD SOLUTION SARL', 'valide', '2025-02-03T11:53:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ed0f6555-0544-48d3-9079-a5cc8fbb4600', 'ARTI102250008', 'Diffusion du communiqué VTC dans le journal fraternité matin', 1123848, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', 'valide', '2025-02-12T14:12:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5e679ef3-5ce8-427b-9b72-48e2f20282ba', 'ARTI102250006', 'Protection des logos de l''ARTI et de la newsletter r LE REGULATEUR _', 800000, 'OFFICE IVOIRIEN DE LA PROPRIETE INTELLECTUELLE', 'valide', '2025-02-12T14:14:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8c0cf93-56f8-40c0-b164-da2e888f5b81', 'ARTI102250005', 'Achat de billets d''avion mission DG en France et aux Etats Unis', 11333900, 'PERSONNEL DE L''ARTI', 'valide', '2025-02-12T14:15:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7cf7bcec-719c-4bf0-8c0f-cd4fe228893d', 'ARTI102250002', 'Demande de paiement de la facture de la restauration pour le mois Janvier 2025 (T&P EVENTS)', 7067610, 'T & P EVENT', 'valide', '2025-02-12T14:15:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7af4acc1-23c7-4f74-80fe-9770ba539dbf', 'ARTI101250047', 'Location de deux véhicules de type 4x4 pour une mission', 900003, 'EUROPCAR', 'valide', '2025-02-12T14:16:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f7aec93b-8161-4231-b688-c65af8832fb4', 'ARTI102250003', 'RETENUE A LA SOURCE DE 12% SUR LE PAIEMENT DES LOYERS  POUR LE COMPTE DE SEYDOU OUATTARA PROPRIETAIRE DU LOCAL ABRITANT LE SIEGE D''ARTI BOUAKE AU TITRE DU TRIMESTRE 2025à', 102273, 'SEYDOU OUATTARA (LOYER)_BKE', 'valide', '2025-02-12T14:17:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0fc8a9a9-8a82-4207-9f6a-f9bce90ae70d', 'ARTI102250007', 'Renouvellement de l''adhésion de l''ARTI à l''AFUR (Forum Africain des Régulateurs des Services Publics) pour l''année 2025à', 4521139, 'AFUR', 'valide', '2025-02-12T14:19:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c2025407-c607-46f1-b043-329609015abd', 'ARTI102250004', 'RENCONTRE SUR LA MISE EN OEUVRE DU PROJET BOURSE DE FRET AVEC GENETEC ET LA BANQUE MONDIALE', 6000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-02-12T14:21:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f41b0169-13dd-4ebb-ae5f-b35565f6b267', 'ARTI102250001', 'Demande de paiement de la facture de la restauration pour le mois Février 2025 (T&P EVENTS)', 6434010, 'T & P EVENT', 'valide', '2025-02-12T14:22:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3be19385-8c8e-4bf5-aa1a-776f207a1b60', 'ARTI102250009', 'Participation en qualité de sponsor au ô89:17ô événement commémoratif CAN2023/Match Côte d''Ivoire vs Mali', 10000000, 'COMEN INTERNATIONAL', 'valide', '2025-02-12T16:38:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff35e36a-2f16-4fd6-b10c-d98c7e0d424d', 'ARTI102250011', 'Achat de bouteilles de champagne en vue de confection de présents de début d''année', 845200, 'L''OENOPHILE', 'valide', '2025-03-21T15:02:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4482ddb9-3946-45b4-87ea-5afa6253ffcc', 'ARTI102250010', 'Diffusion du communiqué VTC dans le journal Abidjanànet', 363000, '', 'valide', '2025-03-21T15:03:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ee9181f-285a-49a5-836f-726d9d2925b2', 'ARTI103250004', 'PRELEVEMENT A LA SOURCE DE 2% SUR LES PAIEMENTS FAITS AUX PRESTATAIRES AU TITRE DE JANVIER 2025', 51290, 'DGI', 'valide', '2025-03-22T05:13:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ba37ecdd-d65f-491c-8ab9-18d10e13d9a2', 'ARTI103250001', 'MAINTENANCE DU SYSTOME D''INFORMATION ET DE GESTION DE L''ARTI', 5000000, 'ISC', 'valide', '2025-03-22T05:13:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ddbb125-0cff-4418-94b3-48e1e8174ba7', 'ARTI103250003', 'Confection de badges pour les nouveaux agents', 118000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-03-22T05:14:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64dc0046-7f62-4ea1-a819-06400d3a0cff', 'ARTI103250002', 'Acquisition de carnet r piSces de caisse _ de l''ARTI', 200000, 'CORRECT PRINT', 'valide', '2025-03-22T05:15:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0eb68d26-83eb-484b-b507-0df0f6906541', 'ARTI103250012', 'Demande d''achat des fournitures pour la cantine au siSge de l''ARTIà', 64800, '', 'valide', '2025-03-25T10:05:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8d82b26e-d818-4497-a274-5b5a3a261844', 'ARTI103250011', 'Formation sur le thSme: harmonisation des cadres de régulationé une réponse aux enjeux de l''économie mondiale', 3242250, 'STARS GROUP CONSULTING', 'valide', '2025-03-25T10:07:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2f469676-9a52-467f-80f7-dc9bf7e5271a', 'ARTI103250010', 'Participation de l''ARTI au 89 :17à', 200600, 'HOODA GRAPHIQUE', 'valide', '2025-03-25T10:09:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4d4f53fe-f002-4c4a-81ec-3058e75d754d', 'ARTI103250009', 'FRAIS BANCAIRES DU MOIS DE JANVIER 2025', 257500, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-03-25T10:09:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30fb1170-d4af-4098-a73b-7993228ae24b', 'ARTI103250008', 'Don de panier Ramadan partenaires ARTI', 1600000, 'IMPULS''COM', 'valide', '2025-03-25T10:10:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5056d35e-fa5f-49d9-97c3-fd9f7f59f9ed', 'ARTI103250007', 'Panier careme 2025', 1680000, 'GEGCI SARL', 'valide', '2025-03-25T10:12:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0a0c27c-19e3-4ccb-b696-a187953ab420', 'ARTI103250006', 'Hébergement de Monsieur DETROZ à Abidjan lors de la mission de formation des utilisateurs des engins Glutton de Tafireé Badikahaé Dimbokro et Yamoussoukro', 160000, 'HOTELLERIE LA LICORNE', 'brouillon', '2025-03-25T10:13:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('be6459e8-582f-4226-b9a0-6eaceb5cbaad', 'ARTI103250005', 'Location d''un véhicule avec chauffeur pour la mission de Monsieur Olivier DETROZé relative au projet GLUTTON de l''ARTI', 710923, 'EUROPCAR', 'valide', '2025-03-25T10:13:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('47bec83a-70a5-43b5-9050-3a6d0bff2bf9', 'ARTI103250013', 'Acquisition d''une imprimante multifonction', 315000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-03-26T04:50:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('636555ff-bf30-455d-a7fd-3811099551f2', 'ARTI104250105', 'TAXE A LA FORMATION PROFESSIONNELLE CONTINUE FDFP DU MOIS DE FEVRIER 2025', 414485, 'DGI', 'valide', '2025-04-09T05:34:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ba3b397-a67f-430d-ba27-36da3d3333e1', 'ARTI104250105', 'TAXE A LA FORMATION PROFESSIONNELLE CONTINUE FDFP DU MOIS DE FEVRIER 2025', 414485, 'DGI', 'valide', '2025-04-09T05:35:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d317cd57-52e3-4bdf-877d-49e37c6190cb', 'ARTI104250104', 'AUTORISATION DE PAIEMENT DU SALAIRE ET APPOINTEMENT DU MOIS DE FEVRIER 2025', 49848015, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:37:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3a7da48c-3101-4669-a342-c62e9521c0d3', 'ARTI104250103', 'PAIEMENT PRIME DE STAGE MOIS DE FEVRIER 2025', 400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:38:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1f7bbd6c-c9ef-4b9e-bf20-fbaaa67a7c38', 'ARTI104250102', 'HONORAIRES DES MEDECINS POUR LE MOIS DE FEVRIER 2025', 1250000, 'MEDECINE DU TRAVAIL', 'valide', '2025-04-09T05:39:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('82ac4c76-60f7-4401-90f3-d8750bb04780', 'ARTI104250101', 'PAIEMENT DES COTISATIONS CMU DU MOIS DE FEVRIER 2025', 45000, 'CNPS', 'valide', '2025-04-09T05:39:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fa21b7fc-f627-48e4-8f2a-84f47fad71c5', 'ARTI104250100', 'PAIEMENT DES COTISATIONS CNPS DU MOIS DE FEVRIER 2025', 9012317, 'CNPS', 'valide', '2025-04-09T05:40:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6026206f-5d3a-4a27-8b6b-df91282198c6', 'ARTI104250099', 'Situation des honoraires des médecins du mois de mars 2025', 1250000, 'MEDECINE DU TRAVAIL', 'valide', '2025-04-09T05:41:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5cd54551-b8e2-45b8-8d01-ad63f4079f51', 'ARTI104250098', 'Situation des indemnités des stagiaires du mois de mars 2025', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:42:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0f280a5b-218e-403c-ac27-427daf1c8a6d', 'ARTI104250097', 'Situation des honoraires des gendarmes du mois de mars 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-04-09T05:43:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a74dd361-b678-4dfa-a338-50d63132cfe8', 'ARTI104250096', 'Frais de transport des participants à la formation à Bouaké des utilisateurs et techniciens des engins GLUTTON H2O venant de Yamoussoukroé Dimbokro et Tafiré', 54000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T05:44:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff1e4070-cf0f-4395-990e-dbfedb381e0d', 'ARTI104250095', 'Entretien du systSme réseau canal et réparation de télévision au siSge de l''ARTI', 165000, 'HORIZON TECHNOLOGIES', 'brouillon', '2025-04-09T05:45:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ed976cb-08cf-4cf7-940b-c8e28e26baa0', 'ARTI104250094', 'Rechargement cartes péages FER mois d''avril 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-04-09T05:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('77ee101d-b164-4bc1-ae5b-2e7e4f19fab4', 'ARTI104250093', 'Régularisation - Frais de transport pour la mission relative à la vérification au contrôle du conteneur des machines Glutton', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:47:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('937da7db-c42b-4fe4-9ddc-683086623462', 'ARTI104250092', 'Régularisation - Frais de transport pour la participation à la formation des experts formateurs sur les outils IPCC & LEAP à Grand-Bassam', 65000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:48:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('253dde24-1138-4e43-a279-c9d4f9ab2985', 'ARTI104250091', 'DEMANDE DE CONFECTION DE BADGES PROFESSIONNELS POUR AGENTS ARTI', 75000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-04-09T05:49:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2fbe81de-c517-4572-9e9e-8679deb1293d', 'ARTI104250090', 'Fourniture de cartouches d''encres', 6876000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T05:50:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('062b7b97-9b35-4f9d-899e-449c483fa3d1', 'ARTI104250089', 'Rechargement canal horizon pour le mois de février 2025', 95000, 'CANAL + HORIZON', 'valide', '2025-04-09T05:51:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6b805619-fd93-4afc-85d6-03e851558f5d', 'ARTI104250088', 'Rechargement canal horizon pour le mois de mars 2025', 95000, 'CANAL + HORIZON', 'valide', '2025-04-09T05:52:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('67210d12-8285-4647-b453-6ed926f2c2c4', 'ARTI104250087', 'ACHAT DE SEAU DE GALET MULTIFONCTION POUR L''ENTRETIEN DE LA PISCINE DU SIEGE DE L''ARTI (FEVRIER ET MARS 2025)', 40000, 'H2O PISCINE', 'valide', '2025-04-09T05:52:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1b4eb554-71ee-435a-b62d-a6ae2068ee68', 'ARTI104250086', 'Achat de batterie du véhicule SUZUKI VITARA AA-897-FS-01', 69012, 'SOCIDA', 'valide', '2025-04-09T05:53:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e91ab59c-25f6-42c6-bd35-35bdce060e8b', 'ARTI104250085', 'Frais de transport de Monsieur DIABAGATE Mohamed pour la mission relative au séminaire FLYING WHALES', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:54:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d015e4ce-754e-4f99-82b4-af1eccf4052c', 'ARTI104250084', 'Création de carte péage HKB ARTI pour Madame BIDIA Epse ZADI Annick HélSne', 15000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-09T05:55:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9eb1d518-fd88-4cee-bff8-23985757de13', 'ARTI104250083', 'Frais de transport pour la participation à la commémoration nationale de la Journée Internationale de la Femme', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:56:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('132b029b-efec-401a-8337-057dedb4a88d', 'ARTI104250082', 'Frais de transport de Monsieur BOKOUA Sébastien pour la mission relative au séminaire FLYING WHALES', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T05:57:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2e28914f-2a1e-4f42-b1fa-34bf5b1cc887', 'ARTI104250081', 'Demande de duplicata de la carte carburant TOTAL 357014', 3640, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T05:59:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c06cb7d6-a33f-4062-bd19-7da78b565e67', 'ARTI104250080', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois d''avril 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T05:59:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5bb1f5e-7c93-4ab0-a2b7-36ae472531ef', 'ARTI104250079', 'Restauration du personnel de l''ARTI pour le mois d''avril 2025 (T&P EVENTS)', 7357350, 'T & P EVENT', 'valide', '2025-04-09T06:00:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17f52db9-e0bb-49b3-a5f7-53a4f52847a5', 'ARTI104250078', 'RSglement des frais de transport (courses) du personnel pour la semaine du 06 au 10 janvier 2025à', 44960, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:02:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('777abd66-baaf-4a5d-a538-3142d2ade6af', 'ARTI104250077', 'RSglement des frais de transport (courses) du personnel pour la semaine du 13 au 17 janvier 2025à', 28500, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:02:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc06db0e-881b-4762-bae5-5bd0d867efd2', 'ARTI104250076', 'RSglement des frais de transport (courses) du personnel pour la semaine du 02 au 03 janvier 2025à', 7000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:03:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2dfd4e50-ca5c-4e4f-8d4f-aa46fea9e8f0', 'ARTI104250075', 'RSglement des frais de transport (courses) du personnel pour la semaine du 27 au 31 janvier 2025à', 36100, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:04:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('760918c3-f5db-4ac6-bf0f-32facf878839', 'ARTI104250074', 'Création de carte péage HKB ARTI pour Madame BENDEY-DIBY Karen', 15000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-09T06:05:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e57e47a-a77c-489d-8f55-f9ff521dc0ed', 'ARTI104250073', 'RSglement des frais de ramassage des gravas au siSge de l''ARTIà', 15000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:05:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2d910776-3380-4a63-8065-603cf16237d2', 'ARTI104250072', 'RSglement des frais de transport (courses) du personnel pour la semaine du 20 au 24 janvier 2025à', 36100, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:06:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('025201dc-89e5-4c86-b35b-5d83dc3c8e92', 'ARTI104250070', 'Rechargement cartes péages HKB ARTI mois de mars 2025', 210000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-09T06:09:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52cd34ad-0457-4624-a5c6-81da175ae12a', 'ARTI104250069', 'RSglement des frais de transport (courses) du personnel pour la semaine du 17 au 21 février 2025', 32000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:10:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c7409f78-d563-4aa5-a159-235f6edded3b', 'ARTI104250068', 'RSglement des frais de transport (courses) du personnel pour la semaine du 24 au 28 février 2025', 41700, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:11:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('28fd8b23-066d-4032-b4af-02a4ed930c80', 'ARTI104250067', 'Frais de transport pour la visite du siSge de l''ARTI', 22000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T06:12:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8fdd3516-f8f8-421c-8534-42530507870d', 'ARTI104250066', 'Nettoyage des véhicules de pools pour le mois de mars 2025', 19000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-04-09T06:13:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f65dbfc2-b28b-4e9e-95bb-5cabf37d8f03', 'ARTI104250065', 'Restauration du personnel de l''ARTI pour le mois de mars 2025 (T&P EVENTS)', 7007000, 'T & P EVENT', 'valide', '2025-04-09T06:13:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('967730dc-0bbf-4876-bbad-b08a3716a555', 'ARTI104250064', 'Rechargement des bonbonnes d''eau pour le mois de février 2025', 72000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-04-09T06:14:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58aed67a-4fc5-4eb6-9454-869c71f3fbe2', 'ARTI104250063', 'Complément restauration des stagiaires pour le mois de mars 2025 (T&P EVENTS)', 700700, 'T & P EVENT', 'valide', '2025-04-09T06:15:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c00ca442-fe99-484b-8f5e-c78b1fc93584', 'ARTI104250062', 'Régularisation - Frais de transport pour la participation à la remise officielle d''aspirateurs urbains', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T06:16:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8fbf4d27-a0a6-4848-bebe-331ac18ee41e', 'ARTI104250061', 'Régularisation - Frais de transport de Monsieur GBAMELE Siméon pour la participation à la remise officielle d''aspirateurs urbains', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T06:17:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1013c914-926d-4a62-bc72-5ae84c41ac14', 'ARTI104250060', 'Régularisation - Frais de transport de Monsieur SAMBARE Zakaria pour la participation à la remise officielle d''aspirateurs urbains', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T06:18:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('769108b1-27b9-4924-a3ec-6a4e2ee6adf1', 'ARTI104250059', 'Régularisation - Frais de transport de Madame KOUAME Yah Gabrielle pour la participation à la remise officielle d''aspirateurs urbains', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T06:18:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44d7d9cc-3e61-448b-85a9-77052fb90467', 'ARTI104250058', 'Complément restauration des stagiaires pour le mois d''avril 2025 (T&P EVENTS)', 735735, 'T & P EVENT', 'valide', '2025-04-09T06:19:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('11f78b7b-d148-4ffd-aa9f-6a31e022aa8d', 'ARTI104250055', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de mars 2025', 235000, 'H2O PISCINE', 'valide', '2025-04-09T06:21:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('63d07c81-6ba8-46e4-8f94-1c8d64d54c50', 'ARTI104250056', 'Demande d''achat de la carte de stationnement pour janvier 2025 du véhicule pick-up 4327 KS 01', 12000, 'DISTRICT AUTONOME D''ABIDJAN', 'valide', '2025-04-09T06:23:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2ef62c01-0667-4b96-b88d-f21b44721dc1', 'ARTI104250057', 'Rechargement cartes péages FER mois de mars 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-04-09T06:24:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4d079ccd-8fa7-48a1-951f-dd54d3137c70', 'ARTI104250054', 'RSglement mensuel de la facture du mois de mars 2025 pour la sécurité privée des locaux de l''ARTI', 2001280, 'SIGASECURITE', 'valide', '2025-04-09T06:25:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9ca6d6c3-1d6a-456f-8218-c4fd2f27356e', 'ARTI104250053', 'RSglement mensuel de la facture du mois de mars 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-04-09T06:25:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('153aeae1-af17-4aa5-8680-3784624c1d07', 'ARTI104250052', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de mars 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:26:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dcb4df36-c38f-4861-80a4-43fe883c71da', 'ARTI104250051', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de février 2025', 208308, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5719aaab-5e33-45ff-8f1c-b311e6f329f6', 'ARTI104250050', 'RSglement de la facture Orange CI pour la consommation mobile du mois de février 2025', 651150, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:28:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7e8d4b31-25e8-4fa4-abb8-570c8f3f0b4b', 'ARTI104250049', 'Entretien général des extincteurs de l''ARTI pour le premier semestre 2025', 261889, 'INTELECT PROTECTION', 'valide', '2025-04-09T06:29:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c10b595-3639-402b-a1cc-8f773fdc8874', 'ARTI104250048', 'Acquisition d''ordinateurs portables pour l''ARTI', 1725000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:30:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7e734e7f-94df-4932-8ffc-5d10e067abee', 'ARTI104250046', 'Confection de badges pour les nouveaux agents', 118000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-04-09T06:32:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('90c1238e-c5d2-4a94-b126-86c2eed6f58d', 'ARTI104250047', 'RSglement des frais de ramassage d''ordures pour le mois de mars 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-04-09T06:33:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f03b8ec2-612d-4b7d-aea2-65d6b8980584', 'ARTI104250045', 'Frais de réparation et de dépannage de menuiserie alu', 431200, 'ALUMINIUM METALLERIE CONSTRUCTION', 'valide', '2025-04-09T06:33:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31abaaf6-34f4-4a11-b4f2-2f1810df8533', 'ARTI104250044', 'ACHAT DE SEAU DE GALET MULTIFONCTION POUR L''ENTRETIEN DE LA PISCINE DU SIEGE DE L''ARTI (AVRIL ET MAI 2025)', 40000, 'H2O PISCINE', 'valide', '2025-04-09T06:34:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fc7841a6-d4e9-4a41-ab26-7245367bb898', 'ARTI104250042', 'Proposition de confection de cachets pour l''ARTI', 83000, 'YESHI SERVICES', 'brouillon', '2025-04-09T06:35:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c3489914-0a50-4c6a-a45f-9726f4eb7442', 'ARTI104250041', 'Révision du véhicule SUZIKI VITARA immatriculé 2924 LP 01', 125889, 'CFAO MOTORS', 'valide', '2025-04-09T06:36:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c6cc27df-31e1-4e8b-8b64-842a6684f2e6', 'ARTI104250043', 'Régularisation - Ordre de Rechargement Carburant janvier 2025', 3325000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T06:37:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8808bcce-041a-486d-8793-8728192c97b3', 'ARTI104250040', 'Fourniture de multiprises et connecteur', 87000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:38:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('174cd68f-b208-47cc-b823-26ff29e721a7', 'ARTI104250039', 'Ordre de Rechargement des cartes de carburant du mois de février 2025', 3500000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T06:38:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a24a7bf3-2507-4fe0-8d89-014b69573917', 'ARTI104250038', 'Demande d''achat de bons-valeurs de carburant', 5000000, 'PETRO IVOIRE', 'valide', '2025-04-09T06:39:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f1ba867b-f84f-4924-bd94-5461fc2bd380', 'ARTI104250037', 'RSglement de la facture Orange CI pour la consommation mobile du mois de janvier 2025', 651150, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:40:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('984e1647-29d7-4ca2-be92-c51c73316efb', 'ARTI104250036', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de janvier 2025', 207872, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:41:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7fca6a36-1b22-4d07-ae96-ad5dfc2c4351', 'ARTI104250035', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de février 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T06:42:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7ad9500c-ff36-4274-98f1-16bf5f6be6cc', 'ARTI104250034', 'Acquisition d''une imprimante multifonction', 315000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:43:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d5fc4d95-eb36-4710-b118-b48267ef0c0d', 'ARTI104250033', 'Acquisition d''ordinateur laptop et d''imprimantes', 1255000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:43:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('88b735f2-6f6b-4fad-a5e7-834a7b666893', 'ARTI104250032', 'Fourniture de cartouches d''encres pour la Direction Générale', 405000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:44:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6773e098-4b9a-4d59-a731-9859509e410c', 'ARTI104250031', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de février 2025', 235000, 'H2O PISCINE', 'valide', '2025-04-09T06:45:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9c86cbac-bb55-4a31-9855-090368581ffe', 'ARTI104250029', 'Demande de rSglement de la facture SODECI Bouaké pour la période du mois de janvier 2025', 11499, 'SODECI', 'valide', '2025-04-09T06:46:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6bf3b10b-0307-4eb2-8e7d-598cdc9f8e2b', 'ARTI104250030', 'Acquisition de souris USB pour l''ARTI', 15000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T06:47:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51c1ba87-069a-470c-8ec8-085e269ef216', 'ARTI104250028', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de février 2025', 327467, 'MI3E', 'valide', '2025-04-09T06:48:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9241c74-082a-4a9f-bfc0-2a11686f27ba', 'ARTI104250025', 'Ordre de Rechargement des cartes de carburant du mois de mars 2025', 3575000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T06:49:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8d311bb0-fa8f-48cf-8264-fead612f7a01', 'ARTI104250027', 'FRAIS BANCAIRES DU MOIS DE MARS 2025', 283500, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-04-09T06:49:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98b60e0f-9d9d-496d-af3c-ff4e964a5b5b', 'ARTI104250026', 'Achat de compositions florales pour le siSge de l''ARTI - janvier 2025', 482500, 'Floréal', 'valide', '2025-04-09T06:50:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('156fb38d-01da-45d0-b38e-e507f3a161df', 'ARTI104250024', 'Remplacement de la baie coulissante du hall de l''ARTI', 882000, 'ALUMINIUM METALLERIE CONSTRUCTION', 'valide', '2025-04-09T06:51:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d3e662ee-bcba-4b77-afe7-8aa881effcce', 'ARTI104250022', 'Demande de révision du véhicule Volkswagen VIRTUS immatriculé AA-581-FY 01', 188660, 'ATC COMAFRIQUE', 'valide', '2025-04-09T06:54:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('82779a01-de4f-4f6b-8fad-8d6b165b6f52', 'ARTI104250021', 'RSglement mensuel de la facture du mois de janvier 2025 pour la sécurité privée des locaux de l''ARTI', 2001280, 'SIGASECURITE', 'valide', '2025-04-09T06:54:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d90c890c-f700-4b81-9d0c-d7a4d812d144', 'ARTI104250023', 'RSglement des frais de ramassage d''ordures pour le mois de février 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-04-09T06:55:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8d8a7dbb-8ab8-4d34-a7b8-74773395c833', 'ARTI104250020', 'RSglement mensuel de la facture du mois de mars 2025 pour la sécurité privée des locaux de l''ARTI', 2001280, 'SIGASECURITE', 'valide', '2025-04-09T06:55:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ea49cce-6886-48ec-a739-30be8fbeaa09', 'ARTI104250019', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de mars 2025', 327467, 'MI3E', 'valide', '2025-04-09T06:56:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0938e9fe-ee81-4cfc-9e04-d51d9e524921', 'ARTI104250018', 'Achat de carburant pour le véhicule de pool', 15000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T06:57:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('705255e5-3299-4c41-8ec1-c43fee3e5ffd', 'ARTI104250017', 'Demande de révision du véhicule Suzuki VITARA AA-897-FS -01', 89100, 'SOCIDA', 'valide', '2025-04-09T06:58:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e33cb33b-0397-4e45-bbf4-180fce9743af', 'ARTI104250016', 'Demande de rSglement de la facture CIE du Bureau Régional de Bouaké pour la période de novembre à janvier 2025', 139885, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-04-09T06:58:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2a263df8-6168-4d95-9ffa-e8a210e83767', 'ARTI104250015', 'Demande de paiement de la facture CIE (tension no 137) du compteur no 1 au siSge de l''ARTI pour la période du 04/12/2024 au 04/02/2025', 1183375, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-04-09T06:59:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('292183a1-cf81-493e-bc7d-01702b07a298', 'ARTI104250014', 'Achat de produit Nivea pour l''entretien de fauteuils visiteurs dans les bureaux des Directeurs de l''ARTI', 2900, '', 'valide', '2025-04-09T07:00:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4f4a5d4b-cb78-4574-8e99-542c1810aaf9', 'ARTI104250013', 'Demande d''achat de bons-valeurs de carburant', 5000000, 'PETRO IVOIRE', 'valide', '2025-04-09T07:00:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6b8024e-91e4-4d47-92c7-2cabef6355f5', 'ARTI104250012', 'Demande de paiement de la facture CIE (tension no 138) du compteur no 2 au siSge de l''ARTI pour la période du 04/12/2024 au 04/02/2025', 2080240, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-04-09T07:01:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('08fdff18-d697-4a08-87f3-fbd118bafb49', 'ARTI104250010', 'Achat de ramettes de papier pour l''ARTI', 108560, 'AU PARCHEMIN', 'valide', '2025-04-09T07:01:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3fc5a1e3-1dbc-47d2-afbf-abe3bd5c84a6', 'ARTI104250011', 'RSglement des frais de ramassage d''ordures pour le mois d''avril 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-04-09T07:02:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc344198-9cb3-46ef-a080-5a06af6e4629', 'ARTI104250009', 'Travaux de rénovation  de la peinture de la faØade et de deux bureaux au siSge de l''ARTI', 132000, 'LEAD NOOVA GROUP SARL', 'valide', '2025-04-09T07:03:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a90236f7-8913-49a5-8078-153c8814cb34', 'ARTI104250008', 'Achat d''un billet d''avion pour le Président du Conseil de Régulation pour sa participation au Séminaire International de Formation sur le thSme r Harmonisation des cadres de régulation : une réponse aux enjeux de l''économie mondiale _ qui se déroulera à Du', 3883000, 'EMIRATES AIRLINES', 'valide', '2025-04-09T07:04:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('816815d7-9257-45e7-bad7-1d9348da23b3', 'ARTI104250007', 'Frais de montage et d''installation des machines Glutton H2O Perfect à Yamoussoukro et de Dimbokro', 100000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-04-09T07:05:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('77c2590b-ea14-4073-8dd6-fa6606f358df', 'ARTI104250006', 'Frais de transport des machines Glutton à Yamoussoukroé Dimbokro et au SiSge de l''ARTI', 750000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-04-09T07:05:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('814b831d-bfb0-4201-8957-4fbdf9cd1ac4', 'ARTI104250005', 'Achat d''un billet d''avion pour la mission de formation de Monsieur TOURE SOULEYMANEé Membre du Conseil de Régulationé en France dans le cadre de la Certification des Administrateurs des Entreprises Responsables', 1698500, 'AIR France', 'valide', '2025-04-09T07:06:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1700d816-0fe3-4c2d-af1f-09a1a6733347', 'ARTI104250004', 'Achat d''un billet d''avion pour la mission de formation de Monsieur CONE Diomané Membre du Conseil de Régulationé en France dans le cadre de la Certification des Administrateurs des Entreprises Responsables', 1698500, 'AIR France', 'valide', '2025-04-09T07:07:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('85373d4f-54ee-4e10-9f25-8f6f3a72d1a5', 'ARTI104250003', 'Achat d''un billet d''avion pour la mission de formation de Madame KOFFI OURA épouse AKA Stéphanieé Cheffe de Cabinet du Ministre des Transportsé en France dans le cadre de la Certification des Administrateurs des Entreprises Responsables', 1698500, 'AIR France', 'valide', '2025-04-09T07:07:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('96d6d20e-1a34-4f12-9a34-c7a17fc28a7e', 'ARTI104250002', 'LA REGULARISATION DES IMPOTS SUR TRAITEMENTS ET SALAIRES 2023 (ITS REGUL 2023)', 12183031, 'DGI', 'valide', '2025-04-09T07:08:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('445c4d14-5632-4a10-844c-be0041566eab', 'ARTI104250001', 'LA REGULARISATION ANNUELLE DU FDFP POUR L''EXERCICE 2023', 1427284, 'DGI', 'valide', '2025-04-09T07:09:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2d533d2e-6127-4907-aba9-be0c1f2378c6', 'ARTI104250071', 'Ordre de création de cartes de carburant', 30250, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-09T08:02:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('18809270-2c11-4058-b0e1-e95f971052ec', 'ARTI104250124', 'Frais de transport de Monsieur SAMBARE Zakaria pour la participation à la commémoration nationale de la Journée Internationale de la Femme', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:22:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3d2294a9-8e0e-469c-8291-43d16e912e92', 'ARTI104250123', 'Prise en charge de l''assurance automobile pour le véhicule Volkswagen Virtus 18272WWCI', 486650, 'ASSURE PLUS', 'valide', '2025-04-09T17:22:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf001b4a-5d20-4726-b77a-7e6f42539a3a', 'ARTI104250122', 'Situation du personnel mis à disposition du mois de février 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-04-09T17:23:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0fed336a-12b7-479b-b00f-e6f2a8440944', 'ARTI104250121', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de mars 2025', 419029, 'DGI', 'valide', '2025-04-09T17:24:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6ed7b818-b14c-48f7-a6e2-df2847029e84', 'ARTI104250125', 'Acquisition de mobilier de bureau', 522976, 'SPIRAL OFFICE & HOME', 'valide', '2025-04-09T17:26:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2862374e-5dbd-4e08-b812-ff54e4020913', 'ARTI104250120', 'TAXE D''APPRENTISSAGE DU MOIS DE FEVRIER 2025', 276322, 'DGI', 'valide', '2025-04-09T17:27:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('207dae81-ba5a-4c85-98bd-3f8882a4553a', 'ARTI104250119', 'Situation Cotisation CMU du mois de mars 2025', 47000, 'CNPS', 'valide', '2025-04-09T17:28:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('81adebf7-cae1-4192-8ddc-7c4f111016e6', 'ARTI104250118', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de mars 2025', 279354, 'DGI', 'valide', '2025-04-09T17:28:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b437fa6c-8bc8-4239-91cb-95071036f8c6', 'ARTI104250117', 'RENCONTRE AVEC GENETEC DANS LE CADRE DES PROJETS OTC ET BOURSE DE FRET', 2800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:30:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('94ff0338-254b-46ea-8ff2-462f9b904f55', 'ARTI104250126', 'Création de cartes péage HKB ARTI pour Mesdames BIDIA Epse ZADI et KASSI', 30000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-09T17:31:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b239a30b-6dc6-4f0e-9e1e-7158384ffcd8', 'ARTI104250116', 'Frais de mission pour la formation a Duba<', 770000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:32:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6db6927a-849d-4a83-975e-c53bf5ad8f98', 'ARTI104250115', 'Demande de paiement des frais de séjour pour la participation aux Journées Nationales de la Communication et du Marketing', 195000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:35:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a119f11-f963-4e82-89bc-c17b5ac37eb2', 'ARTI104250114', 'Frais de per diem de Monsieur KACOU Albéric', 3500000, 'CHEN GROUP', 'valide', '2025-04-09T17:36:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5c65557f-b93b-488e-928e-26886f72ba3a', 'ARTI104250113', 'Les frais de perdiem pour la formation sur l''harmonisation des cadres de régulation : une réponse aux enjeux de l''économie mondialeà', 2400000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-04-09T17:38:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('15b1cd8a-85a2-46ba-b856-ef0c0a24f5a3', 'ARTI104250127', 'Organisation logistique présentation officielle de la politique éthique de l''ARTI', 6246000, 'ESPACE YEMAD', 'valide', '2025-04-09T17:39:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('36876a26-5e8f-4aed-9a88-f22c0dcc919a', 'ARTI104250112', 'Régularisation des retenues sur les paiements de loyer du siSge ARTI BOUAK? du 30/01/2021 au 31/12/2024', 1363637, 'DGI', 'valide', '2025-04-09T17:39:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5945d58b-c9e3-4ca0-ba91-cdde59c8cf8e', 'ARTI104250128', '', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:40:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6866bec-0906-4622-9cbb-af5a5100ffc1', 'ARTI104250111', 'Note relative aux frais de transport administratif (taxi) du 31/03/2025 au 04/04/2025', 12500, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T17:40:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('72956151-73ff-4107-87c1-a6b671179ec7', 'ARTI104250110', 'Régularisation du paiement de la retenue à la source sur les indemnités EPHP versées aux gendarmes - Novembre et Décembre 2024', 48649, 'DGI', 'valide', '2025-04-09T17:41:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('657f0a23-03b2-42d3-a7b7-49a27d09d76b', 'ARTI104250109', 'Demande d''achat de bons-valeurs de carburant', 5000000, 'PETRO IVOIRE', 'valide', '2025-04-09T17:41:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d66651f-3694-496a-8948-c44f3f940b39', 'ARTI104250108', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de mars 2025', 208220, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T17:42:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49e05423-3fb0-4ae6-ba0b-6a86465eaaac', 'ARTI104250107', 'RSglement de la facture Orange CI pour la consommation mobile du mois de mars 2025', 776769, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T17:43:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c45f5e6d-4397-4b9b-9afd-8c267d7bcef6', 'ARTI104250106', 'Participation aux Journées Nationales de la Communication et du Marketing', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T17:44:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a969bc73-1020-435c-89f2-9cd6acf84b2f', 'ARTI104250157', 'FRAIS BANCAIRES DU MOIS DE F?VRIER 2025', 350399, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-04-09T20:33:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a11b7b7a-ab75-473e-9e0d-74b18fa7cc85', 'ARTI104250156', 'Frais de transport  administratif du 03 au 07 février 2025', 5000, 'FRAIS DE TRANSPORT', 'valide', '2025-04-09T20:34:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c74210d-3c6a-4cef-a1be-4efd84a123ff', 'ARTI104250155', 'HONORAIRES POUR LE COMMISSARIAT AUX COMPTES 2023', 17756640, 'PRICEWATERHOUSECOOPERS', 'valide', '2025-04-09T20:35:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aa4b0ebf-f069-4f96-87f0-6718fa490bfe', 'ARTI104250154', 'Signature de la Convention de Services avec le Cabinet International ADVISORS relative à la question de mobilité électrique en Côte d''Ivoireà', 22140000, 'INTERNATIONAL ADVISOR', 'valide', '2025-04-09T20:36:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc2d386c-bf80-443a-8fab-568fa98219c2', 'ARTI104250153', 'DEMANDE DE REGLEMENT ACOMPTE DU CABINET HELIOS INTERNATIONAL', 10000000, 'HELIOS INTERNATIONAL', 'valide', '2025-04-09T20:37:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e6e7ffd-bb08-4e7d-8e14-8e8d917e219e', 'ARTI104250152', 'ONORAIRES POUR LE COMMISSARIAT AUX COMPTES 2023', 17900000, 'AFRIC CONSULTING & AUDIT', 'valide', '2025-04-09T20:38:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('37c1a15e-07b5-435f-a733-69a32bcc1654', 'ARTI104250158', 'PRELEVEMENT A LA SOURCE DE 12% SUR LOYERS DU SIEGE ARTI BOUAKE 1ER TRIMESTRE 2025à', 102273, 'DGI', 'valide', '2025-04-09T20:39:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e0398f4-af32-4505-9a4c-d53d63d0d1d4', 'ARTI104250151', 'Elaboration de la politique éthique de l''ARTI', 10000000, '', 'valide', '2025-04-09T20:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f33aedd0-2f50-46bd-b132-d8b55021bbd2', 'ARTI104250150', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE JANVIER 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-04-09T20:41:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5f927ad8-bc9f-4654-95d6-440ea88d0189', 'ARTI104250149', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE F?VRIER 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-04-09T20:42:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f54aefd0-0fa8-44c0-ace8-b78624f9da3d', 'ARTI104250148', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE MARS 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-04-09T20:43:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('141533b3-02e8-4ccd-b474-233bb8505ced', 'ARTI104250147', 'REMBOURSEMENT DE FRAIS DE MISSION BOURSE DE FRET ET BANQUE MONDIALE DU 19 F?VRIER AU 06 MARS 2025', 1945488, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T20:43:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('592d1fa8-be73-430a-a8c0-a9f07a13a4f3', 'ARTI104250159', 'Frais de détentioné transport et immobilisation des machines GLUTTON', 3883054, 'TOP IMPEX SARL', 'valide', '2025-04-09T20:44:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6864b1e4-a06a-457f-8c06-88940de6cf29', 'ARTI104250146', 'ACHAT DE BILLET AIR FRANCE No0572334209607', 439393, 'AIR France', 'valide', '2025-04-09T20:46:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d2d8dfd4-b3dc-4a1d-88c5-9f17afc0edb9', 'ARTI104250146', 'ACHAT DE BILLET AIR FRANCE No0572334209607', 439393, 'AIR France', 'valide', '2025-04-09T20:46:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('07b4c9be-3703-4986-aded-fe134271945b', 'ARTI104250145', 'RETENUE A LA SOURCE DE 12% SUR LE PAIEMENT DES LOYERS  POUR LE COMPTE DE SEYDOU OUATTARA PROPRIETAIRE DU LOCAL ABRITANT LE SIEGE D''ARTI BOUAKE AU TITRE DU TRIMESTRE 2025à', 102273, 'DGI', 'valide', '2025-04-09T20:47:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f010542-8ad4-46ef-a6d6-0f4a06e4356e', 'ARTI104250144', 'PRELEVEMENT A LA SOURCE DE 2% SUR LES PAIEMENTS  FAITS AUX PRESTATAIRES AU TITRE DE FEVRIER 2025', 1066554, 'DGI', 'valide', '2025-04-09T20:47:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff1816b9-524e-4a55-9568-1867ef7cd85b', 'ARTI104250143', 'MISE A DISPOSITION DE VEHICULE AVEC CHAUFFEUR & TRANSFERTS AEROPORT POUR LA MISSION A GENETEC(PARIS)', 3148594, 'EMMA CAB', 'valide', '2025-04-09T20:48:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0cb68624-64a1-433d-a109-fcfc4b97d821', 'ARTI104250142', 'Acquisition de deux (02) imprimantes pour l''ARTI', 491525, 'LIBRAIRIE DE FRANCE GROUPE', 'valide', '2025-04-09T20:49:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a37b0e1f-b738-427f-ae21-67fc74975242', 'ARTI104250141', 'PRELEVEMENT A LA SOURCE DE 2% SUR LES PAIEMENTS FAITS AUX PRESTATAIRES AU TITRE DE MARS 2025(PPSSI', 676394, 'DGI', 'valide', '2025-04-09T20:49:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98cef08b-65ab-4546-82c5-a28d291c92a5', 'ARTI104250140', 'Per diem des participants à la formation à Bouaké des utilisateurs et techniciens des engins GLUTTON H2O venant de Yamoussoukroé Dimbokro et Tafiré', 600000, 'Acteurs externes de l''ARTI', 'valide', '2025-04-09T20:50:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe90532f-3ab8-4c7b-b4e0-a68c831a5521', 'ARTI104250139', 'Mission du Directeur Général à Dimbokro dans le cadre de la commémoration de la Journée Internationale de la Femme (JIF) 2025', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T20:52:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f248fd1c-2151-4ff2-86c5-9331ce14d766', 'ARTI104250138', 'ACQUISITION DE DEUX(2) IMPRIMANTES POUR AMENAGEMENT DE BUREAUX A L''ARTI', 630000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T20:53:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5a3aefb4-5cf0-4ad2-a81c-7f1f8f7bfd72', 'ARTI104250160', 'ACQUISITION D''UN LAPTOP DANS LE CADRE DE L''AMENAGEMENT DE BUREAUX A L''ARTI', 625000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-09T20:54:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('94296077-ab32-4678-b67b-4dc19000a041', 'ARTI104250137', 'Réservation d''une chambre d''hôtel à la Maison Palmier du 12 au 13 mars 2025', 157000, 'LA MAISON PALMIER', 'valide', '2025-04-09T20:55:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('22312606-cb82-4abb-a021-539e2ca00dba', 'ARTI104250136', 'Location d''un véhicule avec chauffeur pour la mission de Monsieur Olivier DETROZ relative au projet GLUTTON de l''ARTI', 710923, 'EUROPCAR', 'valide', '2025-04-09T20:55:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4ab750d4-7a1c-4789-957c-5c58e46a70b1', 'ARTI104250135', 'Location de véhicule pour le déplacement des consultants GLUTTON à Abidjan du 07 au 14 avril 2025', 900000, 'EUROPCAR', 'valide', '2025-04-09T20:56:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c2d1fa7-4e57-429a-b30d-f32a78e750c2', 'ARTI104250134', 'Proposition de confection de cachets pour l''ARTI', 83500, 'YESHI SERVICES', 'valide', '2025-04-09T20:58:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('83acb34e-d545-4229-8621-4d2a7c47d8c6', 'ARTI104250161', 'DEMANDE D''ACHAT DE BOX WIFI PRAPAYEES ET DE DATA MOOV INTERNETé POUR BUREAUX ARTI', 98000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-04-09T20:58:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de0ce483-4f1f-4d84-b438-29e49f85ef60', 'ARTI104250133', 'Note de régularisation - Organisation de l''atelier de travail du Groupe de Travail (GT 1) du Comité Technique (CT 21)', 4975000, 'ESPACE YEMAD', 'valide', '2025-04-09T21:00:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2f3a419b-a991-4d97-b197-c82c64616973', 'ARTI104250132', 'Note de régularisation - Organisation de l''atelier de travail du Comité Technique (CT55)', 5812500, 'ESPACE YEMAD', 'valide', '2025-04-09T21:01:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('962172e2-2e57-4eb9-83a7-ec96c2d86b56', 'ARTI104250162', 'DEMANDE D''AUGMENTATION DU DEBIT INTERNET ORANGE FIBREé DE L''ARTI A 1 GO', 100000, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-04-09T21:02:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('19ec0da5-2fb9-4fa7-9164-50785a7327fa', 'ARTI104250131', 'Prise en charge de l''assurance automobile pour le véhicule MAZDA CX60 immatriculé 13480WWCI', 1110680, 'ASSURE PLUS', 'valide', '2025-04-09T21:03:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d392039-b8a2-44e9-94de-9188f84ff533', 'ARTI104250130', 'Régularisation - Frais de transport de Madame KOUAME pour la participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du Transport à Brofodoumé', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T21:04:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ca74d1cc-6e9c-4abb-a4e4-cdd28af400d9', 'ARTI104250129', 'Régularisation - Frais de transport de Monsieur VOMOUAN pour la participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du Transport à Brofodoumé', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-09T21:05:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51e3dd2a-a737-4992-9a2a-23e496536941', 'ARTI104250170', 'Renouvellement antivirus Check Point Harmony Endpoint Advanced pour l''année 2025', 2121515, 'NOVASYS', 'valide', '2025-04-10T06:57:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bb35ab71-4ede-4f1a-b890-573ebc752421', 'ARTI104250169', 'DEMANDE DE RENOUVELLEMENT DES LICENCES OFFICE 365 BUSINESS PREMIUM POUR 2025', 12578010, 'NOVASYS', 'valide', '2025-04-10T06:59:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6bd9535c-ba8d-4331-90e4-d1393976c09d', 'ARTI104250168', 'DEMANDE D''ACQUISITION DE LICENCES MICROSOFT PROJECT POUR L''ANNEE 2025', 1068986, 'NOVASYS', 'valide', '2025-04-10T07:01:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f679aad2-4c8e-4c85-93a9-11bd302916a1', 'ARTI104250167', 'DEMANDE DE RENOUVELLEMENT DES LICENCES MICROSOFT POWER BI POUR L''ANNEE 2025', 495157, 'NOVASYS', 'valide', '2025-04-10T07:02:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb17c6cd-d301-4ea4-9e7f-dacd2eb86421', 'ARTI104250166', 'DEMANDE DE RENOUVELLEMENTé DES RECHARGEMENTS POUR LES BOX WIFI PREPAYEES MOOV DE L''ARTIé POUR AVRIL 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-04-10T07:03:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d9d35d99-b18f-4c8c-bf51-eb03f6a5aacd', 'ARTI104250165', 'DEMANDE REPARATION DU MODULE TACTILE DE LA GRANDE IMPRIMANTE CANON IR C5560i', 415000, 'GOLD SOLUTION SARL', 'valide', '2025-04-10T07:05:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f9d884d8-41f0-4c06-8d37-d8e1dbe13124', 'ARTI104250164', 'DEMANDE DE CONFECTION D''UN BADGE PROFESSIONNEL POUR LA NOUVELLE DRRN DE L''ARTI', 29500, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-04-10T07:06:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f8158bfc-0b7d-4547-b0a7-e43ce6f3e6f0', 'ARTI104250163', 'DEMANDE DE CONFECTION DE BADGES PROFESSIONNELS POUR AGENTS ARTI', 100000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-04-10T07:06:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('881fd3f9-f045-4652-b0d5-cb531d20dc87', 'ARTI104250216', 'Achats de fournitures alimentaires pour l''ARTI', 362800, '', 'valide', '2025-04-11T13:07:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a2b3d0ae-d41f-4205-a4b0-4ad98392b00b', 'ARTI104250215', 'Fourniture de connecteurs et chargeur', 72000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-11T13:08:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d16c201b-20a0-420a-b3c8-4329431c2e56', 'ARTI104250214', 'Acquisition de téléphones portables pour le personnel de l''ARTI', 4441000, 'CKZ ELVEHTPRO', 'valide', '2025-04-11T13:09:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b2c2f9c-4479-4306-97a8-9e689d006e20', 'ARTI104250213', 'Demande de remplacement de deux (02) pneus pour le véhicule immatriculé 2923 LP 01', 193000, 'PETRO IVOIRE', 'valide', '2025-04-11T13:10:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('90baab52-4dfe-43a3-9c47-68bde7b7a3b0', 'ARTI104250212', 'Achat d''ampoules électriques', 8000, 'BATIVOIREàCO', 'valide', '2025-04-11T13:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1816795d-4f96-4757-a9eb-1896ad184eb3', 'ARTI104250211', 'Achat de piles électriques pour les télécommandes des gŸches électriques de l''ARTI', 10000, '', 'valide', '2025-04-11T13:11:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('041d5208-219e-4198-9745-7e5d57a649cc', 'ARTI104250210', 'Travaux de plomberie au siSge de l''ARTI', 172937, 'BEE BUILDING', 'valide', '2025-04-11T13:12:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b14e128f-3d16-455d-bc64-308d582c95b9', 'ARTI104250209', 'Maintenance et réparation d''ordinateur et d''imprimante', 244200, 'LIBRAIRIE DIEPKILE', 'valide', '2025-04-11T13:12:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c7507648-b138-4540-baa8-5bd955c7300c', 'ARTI104250207', 'Confection du bulletin d''information r LE REGULATEUR _ du mois de mars 2025', 531000, 'WINCOM', 'valide', '2025-04-11T13:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5890a4e-a56b-4e24-96d9-4389e6619528', 'ARTI104250206', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON- Le RASSEMBLEMENT', 50000, 'LE RASSEMBLEMENT', 'valide', '2025-04-11T13:16:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7247a9a1-7cb5-49b7-b7f6-72db07380525', 'ARTI104250205', 'Impression de carte de voux Ramadan -Car^me', 118000, 'WINCOM', 'valide', '2025-04-11T13:17:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c5ddd91c-8406-4276-a0f9-e7040b085b30', 'ARTI104250204', 'NOTE EXPLICATIVE POUR LE PAIEMENT DE VISA CAMEROUNAIS', 360000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:18:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7de7700c-3149-4757-8472-b5e7af83c5e0', 'ARTI104250203', 'Demande de paiement des frais de visa SHENGEN de Monsieur TOURE Souleymane', 84000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:18:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('24d2b90b-47fd-4cc9-8edb-6164ad5e11c1', 'ARTI104250202', 'Note explicative pour l''achat de billets d''avion', 734900, 'AIR COTE D''IVOIRE', 'valide', '2025-04-11T13:19:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('176469c8-2a7b-43df-b5b5-ded21957b006', 'ARTI104250201', 'Publication de la Célébration de la journée internationale des droits de la femme à l''ARTI le 10 mars 2025- LE MATIN', 25000, 'LE MATIN', 'valide', '2025-04-11T13:20:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aaefb5aa-44fa-4996-98a3-a68a9ac08fa6', 'ARTI104250200', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON-LE MATIN', 25000, 'LE MATIN', 'valide', '2025-04-11T13:21:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65122228-a2b5-470f-b776-587e1968b2e6', 'ARTI104250199', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON-AIP', 25000, 'AIP', 'valide', '2025-04-11T13:22:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30d9bf95-2a1e-4d45-b974-5b5c04d99ef1', 'ARTI104250198', 'Situation Cotisation CNPS du mois de mars 2025', 9129616, 'CNPS', 'valide', '2025-04-11T13:23:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de49ff31-34b5-451d-9c16-ca784c463307', 'ARTI104250197', 'Demande de formation sur le SystSme Comptable et Fiscal des Entités à But Non Lucratif (SYCEBNL)', 3185000, 'AFCCI', 'valide', '2025-04-11T13:24:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4fcba08b-f42e-44bc-8a61-c40bbc69ad3b', 'ARTI104250196', 'Participation aux journées Nationales de la Communication et du Marketing', 1770000, 'COMUNIQUE', 'valide', '2025-04-11T13:25:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('adab82ae-d232-4511-8db5-ec5b6a92f15a', 'ARTI104250195', 'FORMATION SUR L''HARMONISATION DES CADRES DE REGULATION : UNE REPONSE AUX ENJEUX DE L''ECONOMIE MONDIALE', 3246987, 'STARS GROUP CONSULTING', 'valide', '2025-04-11T13:28:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5cf0b528-cf7e-402e-999b-fdb02d94f3e1', 'ARTI104250194', 'Situation du salaire et appointement du mois de mars 2025', 50046185, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:30:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f8d51768-bdb6-4cbf-a297-ab419f872c4e', 'ARTI104250193', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON-Acturoutes', 25000, 'ACTUROUTES - INSIDE', 'valide', '2025-04-11T13:31:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('11be1c32-1886-42c2-91c2-90e69dbd3be6', 'ARTI104250192', 'Formation sur l''harmonisation des cadres de régulation : une réponse aux enjeux de l''économie mondiale', 3182047, 'STARS GROUP CONSULTING', 'valide', '2025-04-11T13:32:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('22783859-4e22-4074-8edf-7b9e3d3a94b5', 'ARTI104250191', 'Formation sur ?laboration et mise en ouvre d''un plan de communication pour l''ARTI (Regulation)', 2401000, 'AFCCI', 'valide', '2025-04-11T13:33:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('402a2b81-d2ef-44e7-a209-2d834bce23a6', 'ARTI104250190', 'Frais de contrôle SECUREL des installations électriques de l''ARTI', 1200000, 'LABORATOIRE DU BATIMENT ET DES TRAVAUX PUBLIQUES', 'valide', '2025-04-11T13:34:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9bb9cc82-fc29-463e-ae50-eb146f7b710a', 'ARTI104250189', 'Achat de paillasson PVC 60', 5990, '', 'valide', '2025-04-11T13:34:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de6fd6d3-e3dc-402f-b4ba-d6d818223bea', 'ARTI104250189', 'Achat de paillasson PVC 60', 5990, '', 'brouillon', '2025-04-11T13:35:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9971614f-60a8-41df-8d4f-99da07cbc47c', 'ARTI104250188', 'Don de panier Ramadan partenaires ARTI', 320000, 'EVIS MULTI SERVICES EVENT', 'valide', '2025-04-11T13:36:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fbf04084-0550-430a-8da7-5ac66defe193', 'ARTI104250187', 'Entretien du systSme réseau canal et réparation de télévision au siSge de l''ARTI', 165000, 'HORIZON TECHNOLOGIES', 'valide', '2025-04-11T13:38:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a1f8aca0-9ad8-4801-8067-504b6bb2b9bc', 'ARTI104250186', 'Remplacement du systSme de motorisation du portail du garage principal de l''ARTI', 2277990, 'AUTOMASYS', 'valide', '2025-04-11T13:40:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b4d9c895-00d8-4b35-bca6-ff1e11b59e14', 'ARTI104250185', 'Publication de la Célébration de la journée internationale des droits de la femme à l''ARTI le 10 mars 2025-Abidjanànet', 242000, '', 'valide', '2025-04-11T13:41:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9413716-f3da-47b3-9ca9-4fcb4002429c', 'ARTI104250184', 'AUTORISATION DE PAIEMENT ASSURANCE VOYAGE', 402684, 'ASSURE PLUS', 'valide', '2025-04-11T13:43:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de84b299-e3a7-4c15-8816-3397c0babaec', 'ARTI104250183', 'Impôt sur traitement des Salaires (ITS) du mois de février 2025', 15258488, 'DGI', 'valide', '2025-04-11T13:43:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('410b6886-350a-4996-9793-5f20a975fb97', 'ARTI104250182', 'Couverture médiatique cérémonie de lancement de la mise en oeuvre du programme de performance organisationnelle de l''ARTI par Abidjanànet', 363000, '', 'valide', '2025-04-11T13:44:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3c6c0013-ed61-493b-89eb-45b49f854b20', 'ARTI104250181', 'Diffusion du communiqué VTC dans le journal Abidjanànet', 363000, '', 'valide', '2025-04-11T13:45:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('118a7716-8eb9-4a1b-a76d-85f2c7f78138', 'ARTI104250180', 'AUTORISATION DE PAIEMENT ASSURANCE VOYAGE', 268456, 'ASSURE PLUS', 'valide', '2025-04-11T13:47:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5ea10dd7-2f31-4a7c-bef6-e826bcfbdd09', 'ARTI104250217', 'Régularisation - Frais de transport pour la mission relative à la réception des machines à Yaou', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:48:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('216bd783-33b8-4488-975b-fa644b05567a', 'ARTI104250179', 'DECLARATION DES ITS POUR LE MOIS DE MARS 2025', 15362078, 'DGI', 'valide', '2025-04-11T13:49:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4e713b42-17e1-4332-9667-931eacbd8397', 'ARTI104250178', 'Couverture médiatique de la cérémonie de remise dengins GLUTTON-Fraternité-Matin', 50000, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', 'valide', '2025-04-11T13:49:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f25197f9-e9f9-4fde-9572-cd723d25a922', 'ARTI104250177', 'Acquisition de paniers VIP', 400000, 'JAKARA SERVICES', 'valide', '2025-04-11T13:50:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b57d2f9-aef4-4439-bd04-832019942f43', 'ARTI104250176', 'Publication de Célébration de la journée internationale des droits de la femme à l''ARTI le 10 mrs-2025- Fraternité-Matin', 50000, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', 'valide', '2025-04-11T13:51:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2e83d915-f757-4960-89fa-3a1ff1fbed02', 'ARTI104250175', 'Demande d''achat des fournitures pour la cantine au siSge de l''ARTIà', 64800, '', 'valide', '2025-04-11T13:52:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('edd0f252-306e-4b37-9030-74c38cebc842', 'ARTI104250174', 'Participation aux Journées Nationales de la Communication et du Marketing', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:52:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5333d9d2-01fc-4398-8411-a6f2dfecd153', 'ARTI104250173', 'Célébration de la journée internationale des droits de la femme', 693000, 'AUTHENTICRH', 'valide', '2025-04-11T13:53:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('acb06723-c836-44d2-b18a-8cdf6ae662ec', 'ARTI104250218', 'Frais de transport pour la mission relative à la réception des machines Glutton à Yaou', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:54:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c663c717-e118-4519-90cc-5ee2cf5f9a3c', 'ARTI104250172', 'RSglement de la facture de T&P EVENT pour la tenue de la 1ére session du Conseil de Régulation pour l''année 2025', 230300, 'T & P EVENT', 'valide', '2025-04-11T13:54:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d0dc32c8-a6ad-43f5-8eb4-88a3746ac107', 'ARTI104250171', 'Rechargement des bonbonnes d''eau pour le mois de mars 2025', 78000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-04-11T13:55:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de94d034-405d-4e7f-8c01-b1933f680a7e', 'ARTI104250219', 'Frais de transport de Monsieur BOKOUA Sébastien pour la participation à la réunion d''échanges sur l''étude de l''aménagement urbain dans le cadre de l''agenda 2063', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-11T13:56:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a907fe83-99f2-4e60-8dc6-e0eabadb6ae5', 'ARTI104250237', 'Achat de capsules de café pour la Direction Générale', 12600, '', 'valide', '2025-04-12T05:09:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('14fc3545-fe6c-4d0d-82c0-a8fa9fe227c3', 'ARTI104250236', 'Restauration offerte par l''ARTI lors de la formation à Bouaké des utilisateurs et techniciens des engins GLUTTON H2O venant de Yamoussoukroé Dimbokro et Tafiré', 108000, 'BLACK AND WHITE', 'valide', '2025-04-12T05:09:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a679cdbb-901d-40eb-ab4f-5138e074b94e', 'ARTI104250235', 'Situation Impôt retenu à la source du mois d''avril 2025', 337836, 'DGI', 'valide', '2025-04-12T05:11:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e98298ef-a89a-47b3-b551-01ddb0543264', 'ARTI104250234', 'Situation Cotisation CMU du mois d''avril 2025', 47000, 'CNPS', 'valide', '2025-04-12T05:12:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d80fc5f5-ed4c-4e73-8d49-6faff330f50f', 'ARTI104250233', 'Situation Cotisation CNPS du mois d''avril 2025', 9377234, 'CNPS', 'valide', '2025-04-12T05:13:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('282ccc71-f2c9-463a-b36b-21b06465b5c2', 'ARTI104250232', 'DECLARATION DES ITS POUR LE MOIS D''AVRIL 2025', 15996757, 'DGI', 'valide', '2025-04-12T05:15:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd69a212-00dd-4a56-bb61-9dba90584cb3', 'ARTI104250231', 'TAXE D''APPRENTISSAGE DU MOIS D''AVRIL 2025', 288152, 'DGI', 'valide', '2025-04-12T05:16:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('814b9a13-a129-46b2-ba0a-86f8b73543f1', 'ARTI104250230', 'Situation des honoraires des médecins du mois d''avril 2025', 1250000, 'MEDECINE DU TRAVAIL', 'valide', '2025-04-12T05:17:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c07c88d0-4799-4792-a079-d4303c8dc547', 'ARTI104250229', 'Situation des indemnités des stagiaires du mois d''avril 2025', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-12T05:18:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f881893-a490-4944-a534-1c97e80d61fe', 'ARTI104250228', 'Situation des honoraires des gendarmes du mois d''avril 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-04-12T05:18:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d778a09f-5a87-4188-963b-ca7a9a6181e8', 'ARTI104250227', 'Situation du salaire et appointement du mois d''avril 2025', 51214695, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-12T05:19:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e4c60be9-a2ea-444b-ae5f-bd72f8a6705a', 'ARTI104250226', 'TAXE A LA FORMATION PROFESSIONNELLE CONTINUE FDFP DU MOIS D''AVRIL 2025', 432228, 'DGI', 'valide', '2025-04-12T05:20:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a855e8a1-99e1-48e9-9867-40827906315d', 'ARTI104250225', 'SITUATION DU PERSONNEL DETACHE (DRRN)', 2466670, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-12T05:21:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc6a1e10-684e-44db-9a63-16a5faaa3276', 'ARTI104250224', 'Restauration du personnel pour le pour le mois de juin 2025', 6751612, 'T & P EVENT', 'valide', '2025-04-12T05:21:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c81b3e61-8080-47ff-a2fc-3aa791046560', 'ARTI104250223', 'Restauration du personnel de l''ARTI pour le mois de mai 2025', 7252000, 'T & P EVENT', 'valide', '2025-04-12T05:22:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d1da9929-94c8-49f2-bf24-a50b503190f5', 'ARTI104250222', 'Révision du véhicule HYUNDAI immatriculé 615KP 01', 279420, 'GROUPE FSA', 'valide', '2025-04-12T05:24:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('822b6b99-4ffe-4307-93b6-d58b5c0bff9d', 'ARTI104250221', 'Révision du véhicule MITSUBISHI immatriculé 17KB 01', 186100, 'GARAGE PGA', 'valide', '2025-04-12T05:24:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30a59594-d2f9-4553-a694-2f427d9318c3', 'ARTI104250220', 'Frais de transport de Madame BENDEY-DIBY Karen pour la participation aux journées nationales de la communication et du marketing', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-12T05:25:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9a8ad7b-378e-4d18-885d-d2c4690a723b', 'ARTI104250249', 'Demande de rSglement des frais d''entretien général du 1er trimestre de tous les climatiseurs de l''ARTI', 686000, 'AB SERVICE', 'valide', '2025-04-14T20:51:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c16f0239-3b97-41b0-b2fd-ddc97833e43d', 'ARTI104250247', 'Fourniture et pose de film de porte', 350507, 'HARVEST', 'valide', '2025-04-14T20:53:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe6c7053-3830-46a5-aa5d-4409845eacb9', 'ARTI104250246', 'Frais de dépôt de courriers', 16000, 'CODITRANS', 'valide', '2025-04-14T20:55:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1525036d-b243-429f-8e35-c69fb3f9d567', 'ARTI104250245', 'Frais d''édition de l''Extrait Topographique du siSge de l''ARTI', 30000, 'DIRECTION DU CADASTRE', 'valide', '2025-04-14T20:55:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('62b85157-b3e6-4dd9-85d7-34e1265548c7', 'ARTI104250244', 'Acquisition d''une poubelle pour l''ARTI', 60025, 'Roi des Draps & Vaisselles', 'valide', '2025-04-14T20:56:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ba77afbe-a3a0-4f28-a726-39be0ddf03d0', 'ARTI104250242', 'Hébergement du Président du Conseil de Régulation pour sa participation au Séminaire International de Formation sur le thSme r Harmonisation des cadres de régulation : une réponse aux enjeux de l''économie mondiale _ qui se déroulera à Duba< du 19 au 26 avr', 297900, 'HYATT REGENCY', 'valide', '2025-04-14T20:57:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f05c4bbf-de96-4561-b5cc-f9134c84e284', 'ARTI104250243', 'Préparation de la demande de visas SHENGEN pour la mission GENETEC du 18 au 22 février 2025', 336000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-14T20:58:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30af8314-e15e-4104-a3bc-1fd0eb92c85e', 'ARTI104250240', 'Lot 2 - Confection de gadgets de communication pour l''ARTI', 2389500, 'WINCOM GROUP', 'valide', '2025-04-14T20:59:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f98272f0-fe1d-428a-9ae3-73f807db2cfc', 'ARTI104250239', 'Lot 1 - Confection de gadgets de communication pour l''ARTI', 660800, 'WINCOM GROUP', 'valide', '2025-04-14T21:03:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bf5f336d-c07e-43a8-a690-2d51cf698ffa', 'ARTI104250238', 'Restauration lors de la réception des experts GLUTTON en visite auprSs de l''ARTIà', 480200, 'T & P EVENT', 'valide', '2025-04-14T21:04:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3fb4edab-7785-45b0-9bb5-42e54745d65f', 'ARTI104250241', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS D''AVRIL 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-04-14T21:04:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('af1f59a2-6c5e-45c4-b487-3bfae6f22f97', 'ARTI104250252', 'Honneur vous transmettreé Monsieur le Directeur Généralé la note relative à l''acquisition d''une imprimante pour l''Autorité de Régulation du Transport Intérieur (ARTI)à En effeté dans le cadre de l''équipement du bureau de la Directrice des Recoursé de la Ré', 371700, 'OAZIS', 'valide', '2025-04-16T22:43:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b333e9c9-1fdd-4ee3-b3e0-f09854bba4dd', 'ARTI104250251', 'Complément téléphones portables pour le personnel de l''ARTI', 1094000, 'CKZ ELVEHTPRO', 'valide', '2025-04-16T22:43:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('36ede01a-c944-475f-a342-9ee435ea771b', 'ARTI104250250', 'Participation à la conférence africaine du financement du transport 2025', 686000, 'DELIOZ', 'valide', '2025-04-16T22:44:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('322b51af-6d19-443a-a616-29fa243a5333', 'ARTI104250248', 'DEMANDE D''ACQUISITION DE DEUX (2) NVR POUR LES MONITEURS DES CAMERAS DE L''ARTI', 646800, 'HORIZON TECHNOLOGIES', 'valide', '2025-04-16T22:45:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('13cdfa99-571e-451c-86e3-0b792a31e878', 'ARTI104250260', 'Acquisition de petit matériel informatique de l''ARTI', 215000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-17T13:49:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('10a3d491-ec7c-4ffa-89ee-a7e4757f77f5', 'ARTI104250259', 'Rechargement des cartes péages FER pour le mois de mai 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-04-17T13:50:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2150ad24-dff0-4974-9c93-6c6920f1d673', 'ARTI104250258', 'Rechargement cartes péages HKB ARTI mois de mai 2025', 235000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-17T13:51:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('819df168-3924-42b5-9762-8111423e87fb', 'ARTI104250257', 'Rechargement canal horizon pour le mois de mai 2025', 100000, 'CANAL + HORIZON', 'valide', '2025-04-17T13:51:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e115ee45-740d-4be0-9be5-b8092665b839', 'ARTI104250256', 'frais de transport (courses) du personnel pour la semaine du 03 au 07 mars 2025à', 30500, 'FRAIS DE TRANSPORT', 'valide', '2025-04-17T13:52:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6d92bfe1-5761-4779-9555-ed3739721e0c', 'ARTI104250255', 'Ordre de Rechargement des cartes de carburant du mois de mai 2025', 4160000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-04-17T13:52:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('90978723-0347-4f04-bef8-5f2d755a5791', 'ARTI104250254', 'Achat de compositions florales pour le mois de mars 2025', 320000, 'Floréal', 'valide', '2025-04-17T13:53:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ad1a013-a175-4950-9361-91fd9b2b3569', 'ARTI104250253', 'Achat de masques de protection respiratoire pour l''ARTIà', 16000, '', 'valide', '2025-04-17T13:54:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('df83ee3c-a87f-47ed-896d-bb7e85d723e3', 'ARTI104250274', 'Acquisition d''un véhicule de Direction pour l''ARTI', 35500000, 'TRACTAFRIC MOTORS COTE D''IVOIRE', 'valide', '2025-04-17T19:43:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('99845632-a21c-4419-a045-179947784425', 'ARTI104250273', 'Acquisition d''une nouvelle télévision pour la guérite de l''ARTI', 80000, 'SOCIAM SUCC 12', 'valide', '2025-04-17T19:44:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('617a5d8b-ad85-4c8f-8eab-7c45da49f070', 'ARTI104250272', 'Remplacement du canon de la porte d''accSs du local technique de l''ARTI', 16000, 'PRESTIGE SERRURERIE', 'valide', '2025-04-17T19:44:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bb65debf-40c3-4de5-8b39-1194835f7c41', 'ARTI104250271', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de mai 2025', 327467, 'MI3E', 'valide', '2025-04-17T19:45:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ac7b82b-59c7-4cd7-af2d-fd79ede4f281', 'ARTI104250270', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de mai 2025', 230300, 'H2O PISCINE', 'valide', '2025-04-17T19:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5b4c0c5-1024-42f9-8714-28264e9fc766', 'ARTI104250269', 'RSglement des frais de ramassage d''ordures pour le mois de mai 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-04-17T19:46:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('74687259-722e-47a2-853b-c9c2c8d7d860', 'ARTI104250268', 'Sécurité privée des locaux de l''ARTI pour le mois de mai', 2001280, 'SIGASECURITE', 'valide', '2025-04-17T19:47:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c79c98e8-4bff-4e1f-add2-d1d3ec1960da', 'ARTI104250267', 'RSglement mensuel de la facture du mois de mai 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-04-17T19:47:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('991f7e48-e0ae-4ff4-9547-5b3955c046a4', 'ARTI104250266', 'Nettoyage des véhicules de pools pour le mois de mai 2025', 20000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-04-17T19:48:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4172c277-2180-4d0d-b318-e003c38b00af', 'ARTI104250265', 'Entretien et nettoyage des serviettes et nappes de l''ARTI', 33320, 'ECO-CLAIR SARL', 'valide', '2025-04-17T19:48:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b0210c6-eba9-486f-ba67-56488ed58c99', 'ARTI104250264', 'Remplacement des disques de frein avant et de la plaquette de frein avant du véhicule SUZUKI VITARA immatriculé 2923 LP 01', 195000, 'POINT S', 'valide', '2025-04-17T19:49:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d4147ff1-6ece-4a7e-9854-e3562bc0a11b', 'ARTI104250263', 'Demande de remplacement de deux (02) pneus pour le véhicule SUZUKI VITARA 2920 LP01', 208001, 'SOCIDA', 'valide', '2025-04-17T19:50:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('92d8f8d6-9e7d-42ab-a4cd-1a81fee8fb9b', 'ARTI104250262', 'Demande de remplacement de deux (02) pneus pour le véhicule immatriculé 2921 LP 01', 216625, 'CACOMIAF', 'valide', '2025-04-17T19:51:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9e574de3-ec3f-470c-81c7-b868e5cab400', 'ARTI104250261', 'Demande de remplacement de quatre (04) pneus pour le véhicule immatriculé 2921 LP 01', 405625, 'CACOMIAF', 'valide', '2025-04-17T19:51:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44ddc95f-a927-41cc-8903-6a7274051715', 'ARTI104250279', 'Frais de transport (courses) du personnel pour la semaine du 10 au 14 février 2025à', 29200, 'FRAIS DE TRANSPORT', 'valide', '2025-04-21T21:17:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d032f076-b9b8-4ebe-9470-0421a4bdd41d', 'ARTI104250278', 'Rechargement cartes péages HKB ARTI mois d''avril 2025', 220000, 'SOCOPRIM SA (HKB)', 'valide', '2025-04-21T21:17:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('12474823-83d0-4f46-9275-1494569f36a7', 'ARTI104250277', 'Frais de transport (courses) du personnel pour la semaine du 10 au 14 mars 2025', 39500, 'FRAIS DE TRANSPORT', 'valide', '2025-04-21T21:18:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a702b669-8be4-4e07-aef1-85fc35e1a2e1', 'ARTI104250276', 'Frais de transport (courses) du personnel pour la semaine du 17 au 21 mars 2025', 34400, 'FRAIS DE TRANSPORT', 'valide', '2025-04-21T21:18:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d4bae60a-d0c9-4b81-a778-2d22c43c61c3', 'ARTI104250275', 'Demande de paiement de la facture CIE (tension no 140) du compteur no 2 au siSge de l''ARTI pour la période du 04/02/2025 au 04/04/2025', 1131180, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-04-21T21:19:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5566971c-69d7-4662-bda8-70697638f167', 'ARTI104250281', 'Acquisition d''une nouvelle télévision pour le réfectoire de l''ARTI', 110000, 'LEDIA', 'brouillon', '2025-04-22T16:44:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3af76e37-9917-4099-a8f6-14573ea67c14', 'ARTI104250280', 'Rénovation de la peinture de la galerie couverte 2', 256545, 'LEDIA', 'valide', '2025-04-22T16:45:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('90de0b5c-914d-44cb-89b7-91c016b8b0e7', 'ARTI104250282', 'ACHAT DE COUVERTS DE RESTAURATION POUR L''ARTI', 519250, 'SOCIETE ORCA DECO', 'valide', '2025-04-24T08:27:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c043af2d-69f6-4357-854c-03582cc23ac9', 'ARTI104250287', 'FRAIS DE TRANSPORT ADMINISITRATIF(TAXI)', 32600, 'FRAIS DE TRANSPORT', 'valide', '2025-04-28T06:39:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58d4e15a-3e76-4005-8d47-853fa5a4a11e', 'ARTI104250286', 'DEMANDE DE RENOUVELLEMENTé DES RECHARGEMENTS POUR LES BOX WIFI PREPAYEES MOOV DE L''ARTIé POUR MAI 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-04-28T06:40:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ebbfaf4b-9ca1-42d6-92b2-d95f4c65d97d', 'ARTI104250285', 'Modification et installation d''auvents à l''ARTI', 1770000, 'ATLANTIS SMART SOLUTIONS', 'valide', '2025-04-28T06:41:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5972387d-ac0a-45f4-a725-7b3e0cdb98cf', 'ARTI104250284', 'Achat de couverts de restauration pour l''ARTI', 530292, 'HORECA WORLD SARL', 'valide', '2025-04-28T06:41:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f53cf2b4-c00e-4c1f-82e5-089c9efdb3dc', 'ARTI104250283', 'Acquisition d''ordinateurs portables', 930000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-04-28T06:43:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('20f2ac14-179a-4fa2-ae3f-19fa54b1b7c1', 'ARTI104250304', 'Hébergement de Monsieur DETROZ à Abidjan lors de la mission de formation des utilisateurs des engins Glutton de Tafireé Badikahaé Dimbokro et Yamoussoukro', 160000, 'HOTELLERIE LA LICORNE', 'valide', '2025-04-30T06:20:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9595be10-5760-49cb-9e10-476a3c85364d', 'ARTI104250303', 'Hébergement de Monsieur DETROZ à Bouaké lors de la mission de formation des utilisateurs des engins Glutton de Tafireé Badikahaé Dimbokro et Yamoussoukro', 150000, 'HOTEL DE L''ART', 'valide', '2025-04-30T06:25:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49d50db9-02c4-4b3f-aefb-afbcf48a6cf6', 'ARTI104250302', 'Hébergement des consultants GLUTTON lors de lelur mission auprSs de l''ARTI du 07 au 14 avril 2025', 700000, 'GSB HOME', 'valide', '2025-04-30T06:27:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4613cbec-aafa-45bc-aeb6-68328b36ac2a', 'ARTI104250301', 'Hébergement de Monsieur DETROZ à Assinie lors de la mission de formation des utilisateurs des engins Glutton de Tafireé Badikahaé Dimbokro et Yamoussoukro', 540000, 'NAHICO HOTEL', 'valide', '2025-04-30T06:28:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('26266f8b-f247-4201-aabe-02783e317552', 'ARTI104250300', 'Frais d''hébergement supplémentaires relatifs au séjour de Monsieur DETROZ à Assinie au cours de sa mission de formation en Côte d''Ivoire', 653500, 'NAHICO HOTEL', 'valide', '2025-04-30T06:29:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff4296b8-76f3-437e-b422-425abfbb992e', 'ARTI104250299', 'Acquisition d''une nouvelle télévision pour le réfectoire de l''ARTI', 110000, 'SOCIAM SUCC 12', 'valide', '2025-04-30T06:29:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d2f64870-a601-4d4b-93e3-4f0b577b2943', 'ARTI104250298', 'Confection de cachets pour le Service médical de l''ARTI', 9000, 'YESHI SERVICES', 'valide', '2025-04-30T06:30:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6f4446db-1160-4099-9040-6f2745834d26', 'ARTI104250297', 'FRAIS DE TRANSPORT ADMINISTRATIF(TAXI)', 29500, 'FRAIS DE TRANSPORT', 'valide', '2025-04-30T06:31:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ee0d75c9-40b1-4fa7-af1c-e929c14d1ac3', 'ARTI104250296', 'Frais de transport pour la participation à la Cérémonie d''inauguration de l''hôtel de ville de Bouaké', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T06:33:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9ec53594-683b-4121-a332-b78a89cdcd7e', 'ARTI104250295', 'Demande de paiement de la facture CIE du compteur no 1 au siSge de l''ARTI pour la période du 04/02/2025 au 04/04/2025', 1306565, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-04-30T06:35:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70ef0775-a92d-45da-93d8-f989030fa6c3', 'ARTI104250294', 'Loyer du siSge de l''ARTI pour les mois d''avril et de mai 2025', 10000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-04-30T06:37:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('06eb5ad5-6a12-4a6c-b64a-25800e27e5a2', 'ARTI104250293', 'Loyer du bureau régional de l''ARTI sis à Bouaké pour le deuxiSme trimestre de 2025 (avril - mai - juin)', 750000, 'SEYDOU OUATTARA (LOYER)_BKE', 'valide', '2025-04-30T06:37:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e15e4ff6-f95c-4bd2-8496-435ec6ae11ed', 'ARTI104250292', 'RSglement mensuel de la facture du mois d''avril 2025 pour la sécurité privée des locaux de l''ARTI', 2001280, 'SIGASECURITE', 'valide', '2025-04-30T06:38:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('23061b06-e9b8-45f3-9a21-ad404009c755', 'ARTI104250292', 'RSglement mensuel de la facture du mois d''avril 2025 pour la sécurité privée des locaux de l''ARTI', 2001280, 'SIGASECURITE', 'brouillon', '2025-04-30T06:38:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f3fba67-8c09-4e4a-a8eb-c725a61b2a50', 'ARTI104250290', 'Remplacement de la batterie du véhicule HYUNDAI I 10', 47250, 'CACOMIAF', 'valide', '2025-04-30T06:40:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bb559912-f4e3-43d1-a92e-9f5666f89269', 'ARTI104250289', 'Restauration du personnel de l''ARTI pour le mois de mars 2025 (T&P EVENTS)', 7007000, 'T & P EVENT', 'valide', '2025-04-30T06:41:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52ada96c-1a67-4514-80c8-e002c0872368', 'ARTI104250291', 'RSglement mensuel de la facture du mois de février 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-04-30T06:41:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf8f1304-6ab6-44f3-82cd-1fa9c838a0d6', 'ARTI104250288', 'Achat de compositions florales pour le siSge de l''ARTI - février 2025', 320000, 'Floréal', 'valide', '2025-04-30T06:42:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2b9abc6e-8e48-4185-a024-88b211597d84', 'ARTI104250327', 'Demande de visite technique du véhicule SUZUKI VITARA immatriculé AA-897-FS 01', 65100, 'MAYELIA AUTOMOTIVE', 'valide', '2025-04-30T22:03:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d796d9b6-a845-4c28-846d-640f3bd87834', 'ARTI104250326', 'Acquisition de mobilier de bureau pour la Directrice de la Qualité au siSge de l''ARTI', 2345274, 'SPIRAL OFFICE & HOME', 'valide', '2025-04-30T22:04:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('00e0ac29-3eaa-4981-b7fb-23cbd1a0b157', 'ARTI104250326', 'Acquisition de mobilier de bureau pour la Directrice de la Qualité au siSge de l''ARTI', 2345274, 'SPIRAL OFFICE & HOME', 'valide', '2025-04-30T22:05:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0c789879-bc72-4123-b55e-7a4d8db6b771', 'ARTI104250325', 'Confection d''étagSres pour la salle des stocks de l''ARTI', 1035000, 'AFRICA VIRTUAL GROUP', 'valide', '2025-04-30T22:07:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('79d24ff7-94fa-4d13-96f8-21c3535045cf', 'ARTI104250324', 'Demande de visite technique du véhicule VOLKSWAGEN VIRTUS immatriculé AA-581-FY 01', 65100, 'MAYELIA AUTOMOTIVE', 'valide', '2025-04-30T22:12:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bb36d36e-059c-412b-bac9-870f10bd6aa7', 'ARTI104250323', 'Demande de visite technique du véhicule VOLKSWAGEN VIRTUS immatriculé AA-746-FX 01', 65100, 'SGS', 'valide', '2025-04-30T22:13:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('60a358dc-f463-4c92-b3a6-75ab2a940a38', 'ARTI104250322', 'FRAIS DE TRANSPORT ADMINISTRATIF (taxi) DU 21 AU 25 AVRIL 2025', 53300, 'FRAIS DE TRANSPORT', 'valide', '2025-04-30T22:14:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('76179c25-3109-4f5b-b8d9-384bb2c2e3a8', 'ARTI104250321', 'Participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du transport (Sécurité routiSre)', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:14:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2f198bde-27b0-43a5-b99b-7608f4c50c23', 'ARTI104250320', 'Participation à la Remise officielle d''aspirateurs urbains', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:16:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fc5651e5-e0a2-4bcd-ae04-e5dac05eee70', 'ARTI104250319', 'Participation à la Remise officielle d''aspirateurs urbains', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:16:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4b1045eb-1a9b-45ab-93b4-f170ddbafe00', 'ARTI104250318', 'Participation à la Remise officielle d''aspirateurs urbains', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:18:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64ab672d-1022-4b54-9c32-2169da6d6eb9', 'ARTI104250317', 'Participation à la Remise officielle d''aspirateurs urbains', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:18:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('79a56cba-7b13-43e5-b15a-f3adc4b8c87d', 'ARTI104250316', 'Participation à la Remise officielle d''aspirateurs urbains', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:19:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6216059-4339-4d86-ac9e-d76c643c0795', 'ARTI104250315', 'Participation à la commémoration nationale de la journée internationale de la femme 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-04-30T22:20:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b45bc403-3c4c-4c0f-8f4d-61f7feeb4c8a', 'ARTI104250314', 'Autorisation de paiement assurance voyage', 134230, 'ASSURE PLUS', 'valide', '2025-04-30T22:20:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f6a152e3-c2d8-4916-85a9-a3740f746a13', 'ARTI104250313', 'Formation sur l''élaboration de l''annexe fiscale 2025', 2401000, 'AFCCI', 'valide', '2025-04-30T22:21:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0b7fc364-f10e-4acf-8d09-a8d0b5aeed4a', 'ARTI104250312', 'Séance photo du personnel', 225400, 'SLK Studios', 'valide', '2025-04-30T22:22:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b420139-8042-45e4-9b6d-31abbc44fe91', 'ARTI104250311', 'Demande d''achat de bons-valeurs de carburant', 5000000, 'PETRO IVOIRE', 'valide', '2025-04-30T22:22:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb1e3a2d-a989-496d-a7f4-14214343239d', 'ARTI104250310', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de janvier 2025', 235000, 'H2O PISCINE', 'valide', '2025-04-30T22:23:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2d43fbb-79a3-4ee4-ad21-0c916d6997ab', 'ARTI104250309', 'Rechargement des bonbonnes d''eau pour le mois de janvier 2025', 90000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-04-30T22:24:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4021243f-68ab-4e8e-a934-c18f9804edc7', 'ARTI104250308', 'Nettoyage des véhicules de pools pour le mois de janvier 2025', 14000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-04-30T22:24:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('041e708a-11a9-48fa-9556-32a653ed3712', 'ARTI104250307', 'RSglement des frais de ramassage d''ordures pour le mois de janvier 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-04-30T22:25:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49e3129e-25a6-46c9-8556-537f036e56bd', 'ARTI104250306', 'Nettoyage des véhicules de pools pour le mois de février 2025', 14000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-04-30T22:25:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('deac7ae5-029b-4eac-850f-177354e879c8', 'ARTI104250305', 'Achat de compositions florales pour le mois de février 2025', 175000, 'FLEUR DE JONQUILLE', 'valide', '2025-04-30T22:26:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1873136b-b3ee-4d16-9f37-0be74f0845f6', 'ARTI105250004', 'Acquisition de stabilisateur pour la guérite du siSge de l''ARTI', 30000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-05-04T18:10:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('af534379-abe6-4794-b16a-e21d8de25a37', 'ARTI105250004', 'Acquisition de stabilisateur pour la guérite du siSge de l''ARTI', 30000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'brouillon', '2025-05-04T18:11:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7c353aba-5144-452d-a649-37950b8f889e', 'ARTI105250003', 'RETENUE RIBNC FEVRIER 2025', 166216, 'DGI', 'valide', '2025-05-04T18:11:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bafe1bd2-6a5c-4ba8-8d27-0beffdb1a991', 'ARTI105250002', 'RETENUE RIBNC MARS 2025', 133783, 'DGI', 'valide', '2025-05-04T18:12:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb0c7c2b-5f2c-45d0-ab39-00cdf53dbdad', 'ARTI105250001', 'Demande de rSglement de la facture SODECI siSge pour la période de novembre 2024 à janvier 2025', 233598, 'SODECI', 'valide', '2025-05-04T18:13:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bd37cfce-e91f-4d01-81c7-755de2de39ff', 'ARTI105250008', 'Frais de transport de Monsieur SAMBARE Zakaria pour la rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-05T10:34:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eccbdd04-560b-499b-ba3f-514def519f31', 'ARTI105250007', 'RETENUE PPSSI (2%)', 745710, 'DGI', 'valide', '2025-05-05T10:34:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0d6e704-4316-498e-bb64-d53ca02ef50a', 'ARTI105250006', 'FRAIS DE TRANSPORT ADMINISTRATIF (taxi) DU 28 AU 02 MAI 2025', 15200, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-05T10:35:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('38501b38-6226-46c9-9762-60dbacdce314', 'ARTI105250009', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de mai 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-05-05T10:36:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('59ac2e05-0b08-4227-9386-203019759e65', 'ARTI105250005', 'FRAIS BANCAIRES DU MOIS D''AVRIL 2025', 273000, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-05-05T10:36:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6fbad890-2265-4664-ac45-834015862949', 'ARTI105250011', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois d''avril 2025', 210659, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-05-05T10:43:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0116af6e-fda7-432d-a82e-b166ad172114', 'ARTI105250010', 'RSglement de la facture Orange CI pour la consommation mobile du mois d''avril 2025', 784457, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-05-05T10:44:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2196043b-3ff7-4269-a9a6-0102aaf52959', 'ARTI105250013', 'Frais de transport de Monsieur VOMOUAN Téké Jean Philippe pour le dépôt de courriers de remerciement', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-05T12:20:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ad31c397-82d6-428b-bab6-bf4c36b99eba', 'ARTI105250012', 'Frais de transport de Monsieur GBAMELE Siméon pour la rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-05T12:21:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('094ab1b6-8c99-4433-9032-e5e461d4a04e', 'ARTI105250012', 'Frais de transport de Monsieur GBAMELE Siméon pour la rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 50000, 'PERSONNEL DE L''ARTI', 'brouillon', '2025-05-05T12:21:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fbcd0aa6-342c-4d16-858e-36fad3f188c0', 'ARTI105250037', 'REGULARISATION - Diffusion d''article dans le journal Fraternité-Matin', 25000, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', 'valide', '2025-05-09T06:42:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('03ab5a69-4313-468f-ba2c-6174a290314e', 'ARTI105250036', 'Rechargement canal horizon pour le mois d''avril 2025', 100000, 'CANAL + HORIZON', 'valide', '2025-05-09T06:43:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0188af18-8270-4632-9349-6126dd4f9e2f', 'ARTI105250035', 'Régularisation - Réparation du véhicule SUZUKI VITARA immatriculé 2922 LP 01', 252335, 'SOCIDA', 'valide', '2025-05-09T06:44:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f58e86ed-bdb7-4732-a9a8-7dc3bb5ae621', 'ARTI105250034', 'Jetons de présence de la premiSre  réunion du Conseil de Régulation de l''ARTI au titre de l''année 2025é le 02 avrilà', 3500000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-05-09T06:44:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('daaf98fe-9006-40c3-aa31-eb4d92036bdd', 'ARTI105250033', 'Frais de transport de Monsieur DIABAGATE Aboubacar Sidick pour la participation aux ateliers de restitution et de validation des rapports des PUDé RPUé EES', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:45:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6e050df-ec83-42ae-a581-8891744ad44f', 'ARTI105250032', 'Prise en charge des émoluments et frais du Commissaire de Justice sollicité pour la rédaction du procSs-verbal de constat de cambriolage du siSge de l''ARTI', 250000, 'ETUDE DE MAITRE KOUAME NGUESSAN CHARLES', 'valide', '2025-05-09T06:46:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('334fd405-7499-42a3-9323-f56957b456d1', 'ARTI105250031', 'Loyer du siSge de l''ARTI pour le mois de juin 2025', 5000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-05-09T06:47:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f133f95-6bc4-4b2e-bf97-2f99a2b2d58b', 'ARTI105250030', 'Nettoyage des véhicules de pools pour le mois d''avril 2025', 22000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-05-09T06:47:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('07573e3d-4881-48aa-a443-d76479ed2155', 'ARTI105250029', 'Prise en compte du solde de la facture relative à la remise en état du véhicule immatriculé 2925 LP 01', 888126, 'SOCIDA', 'valide', '2025-05-09T06:48:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c13c3f3e-e606-4412-afdc-200905cdf51b', 'ARTI105250028', 'Rechargement du carburant du groupe électrogSne du siSge de l''ARTI', 80000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-05-09T06:48:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('25ab072f-8d34-4fbb-8f7d-08d3169ee1b8', 'ARTI105250027', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois d''avril 2025', 235000, 'H2O PISCINE', 'valide', '2025-05-09T06:49:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('72f246dd-db2e-4f69-8095-c0c3d9e9eec8', 'ARTI105250026', 'ACHAT DE SEAU DE GALET MULTIFONCTION POUR L''ENTRETIEN DE LA PISCINE DU SIEGE DE L''ARTI (JUIN ET JUILLET 2025)', 40000, 'H2O PISCINE', 'valide', '2025-05-09T06:49:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5fa73dc7-ac80-466a-b857-0ab1b9f87c30', 'ARTI105250025', 'Frais de transport de Monsieur GBAMELE Siméon pour la transmission de documents administratifs au Bureau Régional de Bouaké', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:50:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f6a2ff0d-c396-45ad-b3da-f10837a1aa7b', 'ARTI105250024', 'Frais de transport du Directeur Général pour la rencontre avec l''équipe du Bureau Régional de Yamoussoukro', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:51:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c24d3782-ae4a-4c70-b107-49a06bd8822e', 'ARTI105250023', 'Demande de rSglement des frais de péages pour la mission du 18 au 20 février 2025 à Bouaké', 8000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:51:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('02afe304-23d5-44ab-a196-c0859f512206', 'ARTI105250022', 'Achat de compositions florales pour le mois de mars 2025 (FLEUR DE JONQUILLE)', 80000, 'FLEUR DE JONQUILLE', 'valide', '2025-05-09T06:52:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8c488ff6-7332-49c5-982a-bd0f217619fd', 'ARTI105250021', 'Rechargement des bonbonnes d''eau pour le mois d''avril 2025', 82000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-05-09T06:53:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3472a4eb-0140-4483-b152-068339b235ed', 'ARTI105250020', 'Achat de compositions florales pour le mois d''avril 2025 (FLEUR DE JONQUILLE)', 20000, 'FLEUR DE JONQUILLE', 'valide', '2025-05-09T06:53:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eab598c0-5dcf-4369-aef4-fb2edb2f9286', 'ARTI105250019', 'Frais de transport de Monsieur KOUAKOU-KAN Jean-Marc pour la participation à la remise officielle d''aspirateurs urbains', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:54:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e9a161f-ab71-4191-80f4-7e54701ddc65', 'ARTI105250018', 'Régularisation - Frais de transport de Monsieur KAMAGATE Bakagnan pour la participation à la remise officielle d''aspirateurs urbains', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:54:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f661b48e-79a3-4c39-a7fd-ffedcabd0a40', 'ARTI105250017', 'Frais de transport de Monsieur KOFFI Léon pour la participation à la remise officielle d''aspirateurs urbains', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:55:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a2578b6e-5be7-4cc7-8d15-a6f5ed79273d', 'ARTI105250016', 'Dépannage des climatiseurs de l''ARTI', 47040, 'AB SERVICE', 'valide', '2025-05-09T06:56:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c72c0ac2-788f-42dc-b731-97c3ffa7b439', 'ARTI105250015', 'Frais de transport de Monsieur KOUADIO Konan Edmond pour le dépôt de courriers de remerciement', 80000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-09T06:56:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('be41df5c-88b4-4c00-a3ce-d0f118c7e835', 'ARTI105250014', 'Rechargement des bonbonnes d''eau pour le mois d''avril 2025', 82000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-05-09T06:57:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f9fbdeae-508d-442e-bb61-86999d4a3910', 'ARTI105250045', 'Paiement de l''Indemnité de fin de mandat du Président du Conseil de Régulation', 34720543, 'DIRIGEANTS SOCIAUX', 'valide', '2025-05-11T11:58:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bcaa63bf-49a9-4e43-8325-e1e31f755217', 'ARTI105250044', 'Paiement de l''Indemnité de fin de mandat du Directeur Général', 52080814, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-11T11:59:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('66e6ca61-5502-4ea6-abc8-444f63681d3f', 'ARTI105250043', 'Régularisation - Demande d''autorisation pour l''achat du billet d''avion de Monsieur GNAGNE Mel Patrick Serge dans le cadre de sa formation à Duba<', 605500, 'EMIRATES AIRLINES', 'valide', '2025-05-11T12:00:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c929e721-9e82-4690-829f-d2296461701e', 'ARTI105250042', 'Couverture Médiatique de la cérémonie de remise d''engins GLUTTON-Abidjanànet-YAMOUSSOUKRO', 242000, '', 'valide', '2025-05-11T12:02:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9c6d7221-5d2e-4c6b-88bc-3cefeaf460d3', 'ARTI105250041', 'Diffusion d''article dans le journal fraternité Matin', 242000, 'SOCIETE NOUVELLE DE PRESSE ET D''EDITION DE COTE DIVOIRE', 'valide', '2025-05-11T12:03:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4dbc8e8d-0c70-4975-94ca-08eb317a9e53', 'ARTI105250040', 'Frais de transport pour la représentation du Directeur Général de l''ARTI à une cérémonie à Divo', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-11T12:04:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd773db9-f1b6-4dba-95c2-10659e290ef8', 'ARTI105250039', 'Réprésentation du DG à une cérémonie', 300000, 'GENDARMERIE NATIONALE', 'valide', '2025-05-11T12:06:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d33ed1ce-008c-455d-8d32-e7a07114cc90', 'ARTI105250038', 'Régularisation - Ordre de Rechargement des cartes de carburant du mois d''avril 2025', 3760000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-05-11T12:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d7a9d470-893b-475e-8acc-bfda4330f45a', 'ARTI105250051', 'NOTE DE REGULARISATION DES FRAIS D''ACHAT DE CREDIT DE COMMUNICATION DANS LE CADRE DES ACTIVITES DE L''ARTI DE JANVIER AU 06 AVRIL 2025', 22450, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-05-12T11:40:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('975fbfb5-f7fc-48df-8b38-b0c312ed5a96', 'ARTI105250050', 'Note de régularisation- Révision des 30000 kms du véhicule SUZIKI VITARA immatriculé 2922 LP 01', 89100, 'SOCIDA', 'valide', '2025-05-12T11:41:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d0aee1b-e97f-4e6c-bde6-d3d2d57ae4f4', 'ARTI105250049', 'NOTE DE REGULARISATION DE DEMANDE DE REGLEMENT DE LA FACTURE DU PRESTATAIRE KYNUX', 177000, 'KYNUX TECHNOLOGIES SARL', 'valide', '2025-05-12T11:41:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bede7791-b5ba-4c51-b04f-9ac3ecb42785', 'ARTI105250048', 'Situation Cotisation CMU du mois de mai 2025', 47000, 'CNPS', 'valide', '2025-05-12T11:42:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44eae8a7-060b-4815-a212-720f76b3ba16', 'ARTI105250052', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de mai 2025', 289818, 'DGI', 'valide', '2025-05-12T11:43:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('828ba7db-56c8-4360-bde6-f1b52c22f14d', 'ARTI105250047', 'DECLARATION DES ITS POUR LE MOIS DE MAI 2025', 16078412, 'DGI', 'valide', '2025-05-12T11:43:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('97297852-4071-4318-b6e9-81d1eaeba2cc', 'ARTI105250046', 'Situation des honoraires des médecins du mois de mai 2025', 1300000, 'MEDECINE DU TRAVAIL', 'valide', '2025-05-12T11:44:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('29191ee4-b4f3-43d9-adf6-9677e524f366', 'ARTI105250060', 'Formation sur le thSme : certification des administrateurs des entreprises responsables', 46000000, 'CHEN GROUP', 'valide', '2025-05-12T16:04:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('df600f7b-719b-4187-a3d8-f4d9edb1601a', 'ARTI105250059', 'Situation Cotisation CNPS du mois de mai 2025', 9495458, 'CNPS', 'valide', '2025-05-12T16:04:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('88d178b5-31ca-4844-bfd1-94027d3041f5', 'ARTI105250058', 'Situation Impôt retenu à la source du mois de mai 2025', 337836, 'DGI', 'valide', '2025-05-12T16:06:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e41a0ad1-c08d-4e51-8af0-d8707115172f', 'ARTI105250057', 'Situation des indemnités des stagiaires du mois de mai 2025', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T16:07:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4e8c1da8-11b9-412b-9b99-f90ddcff6bb3', 'ARTI105250056', 'Situation du Personnel Detache (DRRN) du mois de mai 2025', 2000000, 'MAGISTRAT ARTI', 'valide', '2025-05-12T16:07:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7b4b39f0-27a2-4552-a025-c744cb6d88d0', 'ARTI105250055', 'Situation des honoraires des gendarmes du mois de mai 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-05-12T16:08:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ec7013cd-9996-4858-a27e-747565792d9a', 'ARTI105250054', 'Situation du salaire et appointement du mois de mai 2025', 51531250, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T16:08:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('25492543-52a3-443c-abd1-543d7e487027', 'ARTI105250053', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de mai 2025', 434728, 'DGI', 'valide', '2025-05-12T16:09:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c6b0e684-51cf-4a3c-bbca-aec7d0690bc1', 'ARTI105250074', 'VISITE SUR LE SITE D''ENTREPOSAGE DES MACHINES GLUTTON', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:31:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bbb3c2e6-79d2-4503-ac3d-5201c76e1c92', 'ARTI105250073', 'VISITE SUR LE SITE D''ENTREPOSAGE DES MACHINES GLUTTON', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:32:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dc1f0029-ac3f-4d4d-a406-52b52baca5c1', 'ARTI105250072', 'Demande d''achat de billet d''avion / Projet de suivi et de contrôle de l''exploitation de la bourse de fret à GENETEC Paris (France)', 2473500, 'AIR France', 'valide', '2025-05-12T19:33:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1844c422-5a5d-4373-93eb-32e5b38e5217', 'ARTI105250071', 'REMBOURSEMENT DE FRAIS D''HEBERGEMENT ET RECEPTION POUR LA MISSION DU DG DU 04 AU 11 AVRIL 2025', 4430925, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:34:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('468ec261-fa19-4ca2-9cbe-35bce3e0d48c', 'ARTI105250070', 'REMBOURSEMENT DES FRAIS D''HEBERGEMENT ET DE RESTAURATION MISSION DU 04 AU 11 AVRIL 2025', 1630924, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:39:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2f2e584-7773-4b1d-8583-fe8a5415e478', 'ARTI105250069', 'Mission technique d''immersion au siSge GENETEC Paris dans le cadre du projet de suivi et de contrôle de la Bourse de Fret', 600000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:40:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7d1dbe78-7074-4669-8f8a-84fe5c910920', 'ARTI105250068', 'Mission technique d''immersion au siSge GENETEC Paris dans le cadre du projet de suivi et de contrôle de l''exploitation de la Bourse de Fret', 480000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:41:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9082e35f-10cb-411c-899f-843d7fa2e89d', 'ARTI105250067', 'Mission technique d''immersion au siSge GENETEC Paris dans le cadre du projet de suivi et de contrôle de l''exploitation de la Bourse de Fret', 600000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:42:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a8bb35b-128c-4d19-a224-cdad9bc6d4c9', 'ARTI105250066', 'Mission technique d''immersion au siSge GENETEC Paris dans le cadre du projet de suivi et de contrôle de l''exploitation de la Bourse de Fre', 800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-12T19:43:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('759d1513-819c-47ac-9b96-7031e5039041', 'ARTI105250065', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de juin 2025', 235000, 'H2O PISCINE', 'valide', '2025-05-12T19:43:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b046e8a5-caf9-48b3-a50a-99eee1d84b53', 'ARTI105250064', 'Rechargement des cartes péages FER pour le mois de juin 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-05-12T19:44:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb16cb83-bb8d-41cf-8429-769c1f535ec8', 'ARTI105250063', 'Rechargement cartes péages HKB ARTI pour le mois de juin 2025', 235000, 'SOCOPRIM SA (HKB)', 'valide', '2025-05-12T19:45:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a28435c-a66f-4b72-8868-4dd76cd56886', 'ARTI105250062', 'Rechargement canal horizon pour le mois de juin 2025', 100000, 'CANAL + HORIZON', 'valide', '2025-05-12T19:46:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('efc46013-23dd-4f46-9199-ef05df052861', 'ARTI105250061', 'Ordre de Rechargement des cartes de carburant du mois de juin 2025', 3875000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-05-12T19:46:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7adde845-0e79-4bb8-ae65-6bcf6afadb49', 'ARTI105250075', 'Achats de divers articles pour la Direction générale de l''ARTI', 85100, '', 'valide', '2025-05-13T10:14:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('220ee13f-fa32-4490-809a-76d358ddc633', 'ARTI105250076', 'RSglement des frais de ramassage d''ordures pour le mois de juin 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-05-13T10:14:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e6f9bd16-caa2-4692-bdcd-a0b3f09d120e', 'ARTI105250077', 'RSglement mensuel de la facture du mois de juin 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-05-13T10:18:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ccba36f-3598-43fd-843e-fcfd91205379', 'ARTI105250109', 'Demande d''autorisation de paiement des frais de renouvellement des instances de représentation du personnel', 50000, 'Acteurs externes de l''ARTI', 'valide', '2025-05-13T18:42:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9f7b83f5-3f2c-47ca-9351-3de9d6b0717e', 'ARTI105250108', 'Régularisation - Frais de transport de Madame KOUAME Yah Gabrielle pour la participation aux journées nationales de la communication et du marketing', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:43:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b278804f-e780-4c04-828b-dcb00a89c2dd', 'ARTI105250107', 'DEMANDE DE CONFECTION D''UN STOCK DE SEPT (7) BADGES COMPLEMENTAIRES AUX TROIS (3) BADGES PROFESSIONNELSé INITIALEMENT COMMANDES', 295000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-05-13T18:44:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7b25739f-3ebd-43c2-9290-f6d517c1dcdf', 'ARTI105250106', 'Participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du transport (Sécurité routiSre)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:45:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5c8b308-bd7e-4998-bb42-06b3d1dcac97', 'ARTI105250105', 'Participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du transport (Sécurité routiSre)', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:47:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2524488-0895-4d05-b5f3-2a3abc070fd6', 'ARTI105250104', 'Frais de transport de Monsieur BOKOUA Ziogba Sébastien pour la participation à l''atelier de mobilisation des parties prenantes relatif à l''élaboration d''une note conceptuelle pour l''intégration des véhicules électriques', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:48:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f40fd72f-8970-4dae-99d9-12908f6312e2', 'ARTI105250103', 'INVITATION AU SEMINAIRE FLYING WHALES', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:49:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7f62a69e-dd60-4994-8fdc-b3da1a95ffce', 'ARTI105250102', 'Frais d''hôtel pour les journées nationales de la communicationé du marketing', 810000, 'SONAPIE', 'valide', '2025-05-13T18:50:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44200b64-1855-4e8e-a6cd-e94c59ed8f4f', 'ARTI105250101', 'Participation à l''opération de sensibilisation sur l''application des textes relatifs au secteur du transport (Sécurité routiSre)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:51:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c8d85d0a-a53a-402f-9304-5c3139d49c8f', 'ARTI105250078', 'Sécurité privée des locaux de l''ARTI pour le mois de juin', 2001280, 'SIGASECURITE', 'valide', '2025-05-13T18:52:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('018a59ea-c3f5-4320-97c6-d375a720792c', 'ARTI105250100', 'Régularisation - Demande d''autorisation pour l''achat de chemises pour Monsieur le Président du Conseil de Régulation', 70000, 'DOOWELL', 'valide', '2025-05-13T18:53:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2d8d9751-a931-45b4-94af-de6caec39712', 'ARTI105250099', 'Formation en Management de la Qualité', 8700000, 'CENTRE AFRICAIN DE MANAGEMENT ET DE PERFECTIONNEMENT DES CADRES', 'valide', '2025-05-13T18:55:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f29912fa-9767-4ae1-8864-0dfc0eb454b4', 'ARTI105250079', 'RENFORCEMENT DE CAPACIT?S SUR LA GESTION D''UN SYSTOME INT?GR? DE MOBILIT? URBAINE', 4400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T18:55:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7468578f-597a-4424-be5c-c2b9c5c2259d', 'ARTI105250098', 'Panier Car^me 2025', 1680000, 'GEGCI SARL', 'valide', '2025-05-13T18:56:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a79a38b1-d94a-451c-8975-e3fcb1093a3e', 'ARTI105250097', 'Acquisition de paniers VIP pour le compte du Conseil de Régulation', 800000, 'MY INBOX', 'valide', '2025-05-13T18:57:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7f829e78-8e8c-4c76-8c23-6333e95115b4', 'ARTI105250096', 'Régularisation - Acquisition de paniers VIP', 900000, 'JAKARA SERVICES', 'valide', '2025-05-13T18:58:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f438aeb6-3806-4e71-bb1b-9674a24db104', 'ARTI105250095', 'Acquisition de paniers VIP à l''attention de hautes autorités à l''occasion des périodes du Ramadan et du Car^me 2025à', 1225000, 'FLEUR''ATITUD', 'valide', '2025-05-13T18:59:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('99d9e079-c2a7-4898-be14-d266f505cd83', 'ARTI105250094', 'Achat d''un billet d''avion pour la mission de formation de Monsieur le Directeur Général de l''ARTIé en France dans le cadre de la Certification des Administrateurs des Entreprises Responsables', 4976000, 'AIR France', 'valide', '2025-05-13T19:00:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3bee087e-e923-493f-95b5-5b3c2e5102a6', 'ARTI105250093', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de janvier 2025', 327467, 'MI3E', 'valide', '2025-05-13T19:10:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('356f7064-a717-4f89-9b62-7c1b047216e1', 'ARTI105250092', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois d''avril 2025', 327467, 'MI3E', 'valide', '2025-05-13T19:11:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ceb24383-8e7b-48cb-bf9d-e940de141a7f', 'ARTI105250091', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de juin 2025', 327467, 'MI3E', 'valide', '2025-05-13T19:12:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e1eac4a-6efc-431c-95cc-14e676dcb60a', 'ARTI105250090', '', 5065900, 'AIR France', 'valide', '2025-05-13T19:12:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c39ead36-9171-4127-9246-d54305703f01', 'ARTI105250089', 'Achat d''un billet d''avion pour la mission du Directeur Général auprSs du Cabinet C5P à Paris en France', 5066000, 'AIR France', 'valide', '2025-05-13T19:13:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e085e4ad-4a43-4412-a9fb-0abad27f3c21', 'ARTI105250088', 'Achat d''un billet d''avion pour la mission du Président du Conseil de Régulation auprSs du Cabinet C5P à Paris en France', 2573800, 'AIR France', 'valide', '2025-05-13T19:14:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cb4be3bc-5a23-41a1-b0a7-dc578f2172c9', 'ARTI105250087', 'Achat de billet du Directeur Général pour sa mission auprSs de C5P du 23 au 28 mai 2025', 5066000, 'AIR France', 'valide', '2025-05-13T19:15:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc8cc599-9c43-4d02-b81d-2490d4d768df', 'ARTI105250086', 'RENCONTRE DANS LE CADRE DU PROJET DE DEVELOPPEMENT FERROVIAIRE AVEC LE CABINET C5P', 4800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:15:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb7a50f2-92bd-451f-8e73-900e715a7d85', 'ARTI105250085', 'RENCONTRE DANS LE CADRE DU PROJET DE D?VELOPPEMENT FERROVIAIRE AVEC LE CABINET C5P', 2000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:17:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7b42dab2-d8b9-4463-bf07-27c32931acc5', 'ARTI105250085', 'RENCONTRE DANS LE CADRE DU PROJET DE D?VELOPPEMENT FERROVIAIRE AVEC LE CABINET C5P', 2000000, 'PERSONNEL DE L''ARTI', 'brouillon', '2025-05-13T19:18:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ad196da2-e0a5-4101-a478-0c445dbe5a14', 'ARTI105250084', 'Frais de transport de Monsieur BOKOUA Ziogba Sébastien pour la formation des opérateurs et techniciens des engins d''entretien des voiries', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:20:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b303238f-70c0-477c-ba80-ea771e3917a8', 'ARTI105250083', 'FORMATION DES OPERATEURS ET TECHNICIENS DES ENGINS D''ENTRETIEN DES VOIRIES', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:21:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f19aad0f-a44e-4693-97bc-a22e0eec042f', 'ARTI105250082', 'FORMATION DES OPERATEURS ET TECHNICIENS DES ENGINS D''ENTRETIEN DES VOIRIES', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:22:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2bf9b56b-644f-4d3a-8a82-ec1d3396f986', 'ARTI105250081', 'PARTICIPATION A LA RECEPTION DES MACHINES A YAOU', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-13T19:23:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('56532cc7-891d-450e-9168-4c589fa88c3b', 'ARTI105250080', 'REGULARISATION: RENCONTRE DE TRAVAIL DANS LE CADRE DE LA PREPARATION DE LA CEREMONIE DES CINQ ANS DE L''ARTI', 252000, 'NAMA RESTAURANT', 'valide', '2025-05-13T19:23:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('374edf56-bf9b-49c3-8c28-93566d59e263', 'ARTI105250129', 'Hébergement du Président du Conseil de Régulation pour sa participation au Séminaire International de Formation sur le thSme r Harmonisation des cadres de régulation : une réponse aux enjeux de l''économie mondiale _ qui se déroulera à Duba< du 20 au 26 avr', 1784400, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:34:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c00f24f-f90b-4b1f-b924-1e38ea79ea97', 'ARTI105250128', 'Participation à la 21Sme conférence annuelle de l''African Forum for Utility Regulators (AFUR)', 600000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:35:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1fd6fe7d-818b-4830-bef7-4991dece70d3', 'ARTI105250127', 'Participation à la 21Sme conférence annuelle de l''African Forum for Utility Regulators (AFUR)', 480000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:36:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a1667785-8473-4e72-a19a-4dfd8f0c652d', 'ARTI105250126', 'FRAIS DE DEDOUANEMENT DEFINITIFS DES MACHINES GLUTTON', 9167351, 'TOP IMPEX SARL', 'valide', '2025-05-14T16:37:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9eddb3c0-f090-411a-9d72-3606c456dca0', 'ARTI105250125', 'Participation à la commémoration nationale de la journée internationale de la femme 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:38:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('91dd45c3-8d30-4234-8ab3-58cd3776c0f7', 'ARTI105250124', 'REPRESENTATION DU DIRECTEUR GENERAL A UN CEREMONIE', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:39:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8d62cc93-b2a3-4006-839e-4f40a0bc1917', 'ARTI105250123', 'REPRESENTATION DU DIRECTEUR GENERAL A UNE CEREMONIE', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:41:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0b6fc1a1-7b54-4b8c-8a20-861be1173a4d', 'ARTI105250122', 'Participation de l''ARTI au Salon de l''équipement de l''équipement automobile et Award de la sécurité routiSre', 1000000, 'GROUPE DE PRESSE EDITION & PRODUCTION', 'valide', '2025-05-14T16:42:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9cdc2b70-ff57-462a-94ff-61d6afd1fe46', 'ARTI105250121', 'Achat de boissons dans le cadre de la réception des experts GLUTTON en visite auprSs de l''ARTI', 2330000, 'L''OENOPHILE', 'valide', '2025-05-14T16:43:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64671b97-fa37-4082-8a1a-c248b8a0856b', 'ARTI105250120', 'Participation de l''ARTI au QITAA 2025', 5000000, 'UNIVERSITE NORD SUD', 'valide', '2025-05-14T16:44:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5e149aee-de97-4398-8c53-77b7a7e03fef', 'ARTI105250119', 'Organisation de la cérémonie de remise des engins GLUTTON à la mairie de Dimbokro (T&P EVENT)', 2237340, 'T & P EVENT', 'valide', '2025-05-14T16:44:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('94539967-8085-4354-b421-8834ff5cea54', 'ARTI105250118', 'Participation à l''atelier de mobilisation des parties prenantes relatif à l''élaboration d''une note conceptuelle pour l''intégration des véhicules électriques', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:46:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d94cf44-0d94-41f7-be56-13d23257f95c', 'ARTI105250117', 'Frais de transport du Responsable du Bureau Régional de Yamoussoukro pour la participation à l''atelier de sensibilisation sur la mobilité électrique dans le département de Korhogo', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:47:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('74f7899a-753e-4f58-ac94-c54aa8eac081', 'ARTI105250116', 'PARTICIPATION ú L''ATELIER DE SENSIBILISATION SUR LA MOBILIT? ?LECTRIQUE DANS LE D?PARTEMENT DE KORHOGO', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:48:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a125f37a-695c-4485-a677-06fa1b5ef72d', 'ARTI105250115', 'Participation au séminaire de formation des Experts Formateurs sur les Outils IPCC et LEAP et sur la collecte de données', 120000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:49:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('91867170-abf0-4ce6-a324-40e04a4c5806', 'ARTI105250114', 'Paiement pour modification du billet de Monsieur le Président pour sa mission auprSs de C5P', 229600, 'AIR France', 'valide', '2025-05-14T16:50:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2661a306-0d8f-41c3-957f-bc9415436a5e', 'ARTI105250114', 'Paiement pour modification du billet de Monsieur le Président pour sa mission auprSs de C5P', 229600, 'AIR France', 'brouillon', '2025-05-14T16:50:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f79bc6a6-c22e-4688-ace7-d794ed457262', 'ARTI105250113', 'NOTE DE REGULARISATION DES FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI', 32356, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:50:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fa826986-424e-47f7-8b0e-09e73a1b9c3f', 'ARTI105250112', 'Organisation de la cérémonie de remise des engins GLUTTON à la mairie de Yamoussoukro (T&P EVENT)', 3283980, 'T & P EVENT', 'valide', '2025-05-14T16:51:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('007af83f-3c39-45f7-97b6-920b1e7c9ca9', 'ARTI105250111', 'Remboursement de fais d''hébergement du Directeur Général lors de sa mission aux Etats-Unis', 4138875, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:52:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d869db43-c620-46ee-985e-abf85d726582', 'ARTI105250110', 'NOTE DE REGULARISATION-FRAIS D''HEBERGEMENT MISSION DG A PARIS ET WASHINGTON', 5000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-14T16:53:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('92d617b9-59f8-4147-82e0-141324011cbf', 'ARTI105250130', 'PARTICIPATION A LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES', 3200000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-05-16T09:24:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('faf73e43-bec0-45e5-983e-c88a4d2ab5c1', 'ARTI105250134', 'Note de remplacement du dossier no ARTI004250210 avec pour objet : Travaux de plomberie au siSge de l''ARTI', 164542, 'BEE BUILDING', 'valide', '2025-05-16T14:33:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0e8ee21-6342-46c0-9363-6ce4f2583905', 'ARTI105250134', 'Note de remplacement du dossier no ARTI004250210 avec pour objet : Travaux de plomberie au siSge de l''ARTI', 164542, 'BEE BUILDING', 'brouillon', '2025-05-16T14:33:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e378399c-9905-4cab-b6b5-df1735737137', 'ARTI105250133', 'PARTICIPATION ú LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES', 1800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-16T14:34:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6857e5f3-995d-4170-a8a3-9946892618ac', 'ARTI105250132', 'Demande de révision du véhicule SUZUKI VITARA immatriculé 2925 LP 01', 89100, 'SOCIDA', 'valide', '2025-05-16T14:36:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('09195e17-d227-4257-bfe1-73a2b88c6efd', 'ARTI105250135', 'Paiement des frais de visa pour la Corée du Sud - Chef de service des Statistiques / Projet : KSP Côte d''Ivoire - Mission de renforcement des capacités dans la régulation et la gestion du systSme intégré pour une mobilité urbaine durable', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-16T14:37:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b340b0b-7cc8-4716-9351-28440aea8223', 'ARTI105250131', 'Demande de rSglement des frais d''entretien général de tous les climatiseurs de l''ARTI pour le 2Sme trimestre de l''année 2025', 686000, 'AB SERVICE', 'valide', '2025-05-16T14:38:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b4215bbd-4c49-4b62-a39f-54881c7da42e', 'ARTI105250136', 'Regul/Formation de la Coordonnatrice Pool des Dirigeants Sociaux au Master 2 en Management de la Qualitéé Sécuritéé Environnement - Année académique 2025-2026 (CAMPC)', 2900000, 'CENTRE AFRICAIN DE MANAGEMENT ET DE PERFECTIONNEMENT DES CADRES', 'valide', '2025-05-16T14:55:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a9d0034d-86bb-4219-8bb7-3cc2cd29c6c8', 'ARTI105250138', 'PARTICIPATION ú LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES', 1575000, 'Acteurs externes de l''ARTI', 'valide', '2025-05-16T16:30:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c103ae14-7ac5-4792-9e05-f65c27683332', 'ARTI105250137', 'RSglement des frais de ramassage d''ordures pour le mois de juin 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-05-16T16:30:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9664c892-64d2-428e-a06b-8f7661701f2e', 'ARTI105250141', 'PARTICIPATION ú LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES', 2800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-05-20T11:55:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1fba5914-6f6d-498e-86bd-b3f44846408e', 'ARTI105250140', 'Regul/Formation de la Directrice de la Qualité au Master 2 en Management de la Qualitéé Sécuritéé Environnement - Année académique 2025-2026 (CAMPC)', 2900000, 'CENTRE AFRICAIN DE MANAGEMENT ET DE PERFECTIONNEMENT DES CADRES', 'valide', '2025-05-20T11:56:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8888b4c2-db47-4d99-8067-5d3d62f26b60', 'ARTI105250139', 'PARTICIPATION ú LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES/MISSION AUPROS DES PARTENAIRES C5P', 7600000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T11:57:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ac9581d-ee0f-4b33-8238-9fa2d6269785', 'ARTI105250142', 'Demande de révision du véhicule VOLKSWAGEN VIRTUS immatriculé AA-571-FZ- 01', 126623, 'ATC COMAFRIQUE', 'valide', '2025-05-20T12:17:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f1096516-2fe0-4724-8985-e63f8c122462', 'ARTI105250149', 'RENFORCEMENT DE CAPACIT?S SUR LA GESTION D''UN SYSTOME INT?GR? DE MOBILIT? URBAINE', 1040000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:49:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ae0fb10-79d0-4dc4-87d5-24507399d0cc', 'ARTI105250148', 'REMISE DE DONS ENGINS GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:50:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('792fd645-8c8a-4f6f-af6a-b68f2122a613', 'ARTI105250147', 'REMISE DE DONS ENGINS GLUTTON', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:50:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d174982a-9cbc-4260-9a8c-bc29949ed98b', 'ARTI105250146', 'REMISE DE DONS ENGINS GLUTTON', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:51:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('87c3e7d5-cb1b-4c19-9102-c93ff0727bd0', 'ARTI105250145', 'REMISE DE DONS ENGINS GLUTTON', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:51:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5c903016-dd4c-45f7-a969-f90c04d6dd16', 'ARTI105250144', 'REMISE DE DONS ENGINS GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-20T13:52:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d444dfe5-e270-4618-b3b4-5b8201ba2f0a', 'ARTI105250143', 'Demande de révision du véhicule SUZUKI VITARA immatriculé 2923 LP 01', 85500, 'PETRO IVOIRE', 'valide', '2025-05-20T13:52:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7f7e52cb-1787-499f-88df-d2c6d2c036bb', 'ARTI105250153', 'Demande d''Autorisation de collaboration avec TRILOGY EVENTS & COM', 45217600, 'TRILOGY EVENTS & COM', 'valide', '2025-05-20T17:10:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bea520c5-51dc-428f-8cfa-9a992e5f00b3', 'ARTI105250152', 'Frais de montage et d''installation des machines Glutton H2O Perfect à Tafire et Badikaha', 100000, 'Acteurs externes de l''ARTI', 'valide', '2025-05-20T17:12:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6be42de8-f112-434e-a487-6d8f4613b222', 'ARTI105250151', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON à TAFIRE et BADIKAHA - AIP', 50000, 'AIP', 'valide', '2025-05-20T17:14:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7ae4b873-a1d7-4afd-9c2b-5f9cd6991940', 'ARTI105250150', 'Location de véhicule pour la mission de l''ARTI à TAFIRE et BADIKAHA', 236975, 'EUROPCAR', 'valide', '2025-05-20T17:15:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a05e62c-d96e-4648-a04b-26db82f3aca7', 'ARTI105250155', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON à TAFIRE et BADIKAHA - Abidjanànet', 242000, '', 'valide', '2025-05-20T17:57:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('35134375-8508-4858-a0c9-d4adf9e73210', 'ARTI105250154', '00035-2025/CM/KJA', 850000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-05-20T17:58:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6d006acb-93eb-4c2e-8dfc-a72ddff49b9c', 'ARTI105250156', 'Couverture médiatique de la cérémonie de remise d''engins GLUTTON à TAFIRE et BADIKAHA - Acturoutes', 25000, 'PRESSES', 'valide', '2025-05-20T18:05:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98d76453-27d0-4bae-8918-47258fae6742', 'ARTI105250168', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:23:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c0a0df64-7f4c-4f44-b75c-43db35fc90e5', 'ARTI105250167', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:24:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('af90e91f-465d-4f24-8ae7-405e1193379e', 'ARTI105250166', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:25:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2fa72a00-3b14-418c-bb3b-81227c339a8d', 'ARTI105250165', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:26:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a586de33-cca4-4bca-93e0-908b81580986', 'ARTI105250164', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:27:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6d400500-efa0-47a5-a3e2-9d602daf75be', 'ARTI105250163', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:27:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3da97acd-3144-4ba3-86ff-07312e63d0ab', 'ARTI105250162', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:28:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c6df328a-68ed-4728-b15a-70f1dc8daaaf', 'ARTI105250161', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:29:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e253911f-872f-4a2c-80a7-6561b0aa5c1a', 'ARTI105250160', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:29:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a5a3b20a-3edf-4554-a8a2-c1dfb927ba3e', 'ARTI105250159', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:30:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('85431057-5d29-44e3-b947-047146c8ad04', 'ARTI105250158', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:30:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('11ae4fea-3d38-4227-9df7-c4103b76e0ff', 'ARTI105250157', 'VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALIT?S', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-05-21T18:31:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5c886ca-e523-4dbc-a3ed-461e110fccc6', 'ARTI105250169', 'Impression de cartes de visite', 265500, 'HOODA GRAPHIQUE', 'valide', '2025-05-22T10:52:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5cbac5b3-9cbb-41ad-8ee7-66ab424ca5fd', 'ARTI105250171', 'Régularisation - Couverture médiatique de la cérémonie de remise d''engins GLUTTON à TAFIRE et BADIKAHA - AIP', 50000, 'PRESSES', 'valide', '2025-05-26T15:24:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('61bc491c-db52-4a7b-9c78-ea8033d1c191', 'ARTI105250170', 'Achat d''un billet d''avion pour la mission du Directeur Général dans le cadre de la mission en France et en Corée du Sud du 05 au 13 juin 2025', 6440300, 'IDEAL VOYAGE', 'valide', '2025-05-26T15:25:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b0647fc2-afe0-40ec-96b9-6fc75dcd36e0', 'ARTI105250174', 'Note en remplacement de la note 00035-2025/CM/ KJA - location de véhicule pour la mission de l''ARTI à TAFIRE et BADIKAHA', 355461, 'EUROPCAR', 'valide', '2025-05-27T19:08:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('78f8d84f-0252-45ab-9b25-9207a5fdaa4f', 'ARTI105250173', 'ALLOCATION AUX MEMEBRES DU CONSEIL DE L''AUTORITE DE REGULATION DU TRANSPORT INTERIEUR(ARTI)', 21000000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-05-27T19:09:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3530c44a-b318-4534-a44a-845470abedcd', 'ARTI105250172', 'DEMANDE DE RENOUVELLEMENTé DES RECHARGEMENTS DES BOX WIFI PREPAYEES MOOV DE L''ARTIé POUR JUIN 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-05-27T19:10:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c9164b26-bbad-41a9-983a-1aff014bf7fa', 'ARTI105250177', 'Régularisation - Couverture médiatique de la cérémonie de remise d''engins GLUTTON à BADIKAHA - Abidjanànet', 242000, 'W MEDIA', 'valide', '2025-05-28T05:03:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ce681467-0112-4b85-9edd-6ce8882a5e13', 'ARTI105250176', 'Régularisation - Couverture médiatique de la cérémonie de remise d''engins GLUTTON à TAFIRE - Abidjanànet', 242000, 'AIP', 'valide', '2025-05-28T05:04:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d16019b2-32f8-43d2-ae58-73e709a1ad3c', 'ARTI105250175', 'Loyer du siSge de l''ARTI pour le mois d''ao-t 2025', 5000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-05-28T05:04:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ee68fb0a-dd5d-4039-a039-2738f252d3dc', 'ARTI105250179', 'Achat d''un billet d''avion pour la France dans le cadre de la mission du Directeur Général en Corée du Sud', 5612500, 'AIR France', 'valide', '2025-05-29T04:10:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bea74d84-b47d-44ed-8794-83cc11c75711', 'ARTI105250178', 'Loyer du siSge de l''ARTI pour le mois de juillet 2025', 5000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-05-29T04:11:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8fa7e365-5772-4635-8980-e6a2d33ac523', 'ARTI106250002', 'NOTE REMPLACEMENT DE LA NOTE ARTI105250079 - RENFORCEMENT DE CAPACIT?S SUR LA GESTION D''UN SYSTOME INT?GR? DE MOBILIT? URBAINE', 6400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-02T12:30:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d2b64fcf-f5c6-4d05-8afa-8270fb174413', 'ARTI106250001', 'Achat d''un billet d''avion pour la France dans le cadre de la mission du Directeur Général en Corée du Sud', 5215600, 'AIR France', 'valide', '2025-06-02T12:31:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8659b685-00dd-43d7-85e9-3b3cb350df81', 'ARTI106250004', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de juin 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-06-03T18:51:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f906ac98-dfc0-4f3f-9944-d8b492b0c12e', 'ARTI106250003', 'RSglement de la facture Orange CI pour la consommation mobile du mois de mai 2025', 769076, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-06-03T18:52:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('63bbc875-adae-40ec-bea6-ede9f563900c', 'ARTI106250005', 'Demande de rSglement de la facture CIE du Bureau Régional de Bouaké pour la période de mars à mai 2025', 110805, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-06-03T18:53:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a5e4fa3-dd31-489b-a675-e14f5a2ea3f1', 'ARTI106250009', 'REGULARISATION / Demande d''Autorisation de collaboration avec TRILOGY EVENTS & COM', 44568600, 'TRILOGY EVENTS & COM', 'valide', '2025-06-06T08:48:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70cacbef-681b-4062-ae5f-d58b85072867', 'ARTI106250008', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de mai 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-06-06T08:48:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('95aa2d36-5c99-4c5f-9a2e-be4d4615df1e', 'ARTI106250007', 'FRAIS DE MISSION COMPLEMENTAIRE A LA VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALITES DU 10 JUIN 2025 AU 16 JUIN 2025 - DGPECRP', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-06T08:49:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('59a48865-df07-417e-98ae-14e485190f56', 'ARTI106250006', 'FRAIS DE MISSION COMPLEMENTAIRE A LA VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALITES DU 10 JUIN 2025 AU 16 JUIN 2025 - DRRN', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-06T08:51:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('641c9aa3-a801-4f20-aa8e-6fdeedc8224a', 'ARTI106250010', 'FRAIS DE MISSION COMPLEMENTAIRE A LA VISITE DE PROSPECTION ET DE SENSIBILISATION DANS LES LOCALITES DU 10 JUIN 2025 AU 16 JUIN 2025 - DRRN', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-10T16:32:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('def1feb7-9cef-4d38-bdfe-d70c6f619054', 'ARTI106250017', 'Modification/Célébration de la f^te des MSres 2025', 589960, 'SLK Studios', 'valide', '2025-06-12T23:19:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e2b2346a-aec0-40b5-b066-828d5aea1d04', 'ARTI106250016', 'Mise à disposition d''un chauffeur externe dans le cadre de la mission de prospection sur l''axe Bédiala - Bouaké - Bouaflé', 175000, 'Acteurs externes de l''ARTI', 'valide', '2025-06-12T23:20:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('abe31896-311c-4797-8032-808fd7738375', 'ARTI106250015', 'FICHE DE MISSION COMPLEMENTAIRE A LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES DU 25 JUIN 2025 AU 05 JUILLET 2025', 1200000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-06-12T23:22:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e574aa4e-413e-4a88-b4f2-b726ca1dc4e9', 'ARTI106250014', 'FICHE DE MISSION COMPLEMENTAIRE A LA FORMATION DE CERTIFICATION DES ADMINISTRATEURS DES ENTREPRISES RESPONSABLES DU 25 JUIN 2025 AU 05 JUILLET 2025', 675000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-06-12T23:23:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bb2056c1-d1b7-4909-8436-b8e3aba1f6a5', 'ARTI106250013', 'Paiement des frais de visa coréen pour le Directeur Général', 120000, 'IDEAL VOYAGE', 'valide', '2025-06-12T23:24:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('950d3daf-1331-4cc8-9501-38d6b51119c0', 'ARTI106250012', 'Formation sur la gestion des moyens généraux dans une entité publique', 2793000, 'AFCCI', 'valide', '2025-06-12T23:26:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a426881e-f993-47eb-91e1-7b9aad107bcf', 'ARTI106250011', 'Participation à une formation sur la comptabilité des matiSres : maOtrise opérationnelle et optimisation des flux', 3038000, 'AFCCI', 'valide', '2025-06-12T23:27:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d92cb572-ae13-4b06-ba4b-11270e451cb4', 'ARTI106250042', 'PARTICIPATION ú L''ATELIER DE RESTITUTION ET DE LA VALIDATION DES RAPPORTS D''?VALUATION ENVIRONNEMENTALE STRAT?GIQUE (EES) ET DES PROGRAMMES D''INVESTISSEMENT PRIORITAIRES (PIP) DU 16 JUIN AU 20 JUIN 2025 ú GRAND-BASSAM', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-19T07:52:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21736a46-447e-4a7f-92e9-959fecc2dd75', 'ARTI106250041', 'Entretien général des extincteurs de l''ARTI pour le deuxiSme semestre 2025', 261889, 'INTELECT PROTECTION', 'valide', '2025-06-19T07:53:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('77c3cb5d-0ee3-4369-9276-4674acb7b42e', 'ARTI106250040', 'Sécurité privée des locaux de l''ARTI pour le mois de juillet', 2001280, 'SIGASECURITE', 'valide', '2025-06-19T07:54:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4f8bf687-5066-4fa8-b4de-011916ca9db4', 'ARTI106250039', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de juillet 2025', 327467, 'MI3E', 'valide', '2025-06-19T07:55:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49cb5754-e325-4e6c-8dea-e4b8cc8865a2', 'ARTI106250031', 'Situation du salaire et appointement du mois de juin 2025', 52113295, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-19T07:56:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58709b20-abd8-414b-97c8-483cba42b79c', 'ARTI106250028', 'Situation des honoraires des médecins du mois de juin 2025', 1180000, 'MEDECINE DU TRAVAIL', 'valide', '2025-06-19T07:58:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7270d0dc-233d-4dea-b0b6-f9dd5c2211c0', 'ARTI106250027', 'Situation des indemnités des stagiaires du mois de juin 2025', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-19T08:00:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e103dcdc-aa22-4eb4-963c-33fddfb5d143', 'ARTI106250035', 'Rechargement des cartes péages FER pour le mois de juillet 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-06-19T08:01:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('421d6a7f-75cc-40fa-829e-854d787e6cb8', 'ARTI106250029', 'Situation du Personnel Detache (DRRN) du mois de juin 2025', 2000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-19T08:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30920bb7-04ad-4922-b2fe-ddd02be06641', 'ARTI106250038', 'Demande de rSglement de la facture SODECI siSge pour la période de février à avril 2025', 159704, 'SODECI', 'valide', '2025-06-19T08:05:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a51c1191-6476-4603-abe1-8366de0261ee', 'ARTI106250044', 'Confection du bulletin d''information r LE REGULATEUR _ du mois de juin 2025', 814200, 'GCIS CONCEPT SARL', 'valide', '2025-06-19T09:05:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ecd0b95-ffa6-4a96-8109-391501f952f2', 'ARTI106250043', 'Loyer du bureau régional de l''ARTI sis à Bouaké pour le troisiSme trimestre de 2025 (juillet - ao-t - septembre)', 750000, 'SEYDOU OUATTARA (LOYER)_BKE', 'valide', '2025-06-19T09:06:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e6ab2c6a-ca6b-4803-b9a5-517c28fe6316', 'ARTI106250037', 'RSglement mensuel de la facture du mois de juillet 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-06-19T09:08:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c7d23c96-4be1-484c-a134-7d45a98f6f22', 'ARTI106250036', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de juillet 2025', 235000, 'H2O PISCINE', 'valide', '2025-06-19T09:09:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('047414b1-2fd4-4213-a9c0-9ce6b4b699df', 'ARTI106250034', 'Rechargement cartes péages HKB ARTI pour le mois de juillet 2025', 250000, 'SOCOPRIM SA (HKB)', 'valide', '2025-06-19T09:10:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a972c017-6f06-4693-879e-36b8afdbbb98', 'ARTI106250033', 'Rechargement canal horizon pour le mois de juillet 2025', 90000, 'CANAL + HORIZON', 'valide', '2025-06-19T09:11:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a2657032-7094-4cc2-a780-b655c75f124b', 'ARTI106250032', 'Ordre de Rechargement des cartes de carburant du mois de juillet 2025', 3975000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-06-19T09:13:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('60f8b9c5-ad21-4e11-b1fd-861fd57dfe30', 'ARTI106250030', 'Situation des honoraires des gendarmes du mois de juin 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-06-19T09:13:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b4609dc-c6f1-408f-916f-a4d14917dae1', 'ARTI106250026', 'Situation Impôt retenu à la source du mois de juin 2025', 290270, 'DGI', 'valide', '2025-06-19T09:15:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c3536c60-165e-4086-a03d-50c439147bc8', 'ARTI106250025', 'DECLARATION DES ITS POUR LE MOIS DE JUIN 2025', 16338385, 'DGI', 'valide', '2025-06-19T09:16:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ffa54b04-6f46-4a38-8821-3c4014f10f41', 'ARTI106250024', 'Situation Cotisation CNPS du mois de juin 2025', 9501935, 'CNPS', 'valide', '2025-06-19T09:16:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ee498623-7400-4f4c-8034-c0c82a40e6ec', 'ARTI106250023', 'Situation Cotisation CMU du mois de juin 2025', 47000, 'CNPS', 'valide', '2025-06-19T09:17:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('208b4e26-41ff-4cb4-90a3-62a00764647d', 'ARTI106250022', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de juin 2025', 293395, 'DGI', 'valide', '2025-06-19T09:18:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a66dfa7-4c7f-41df-a805-8acc6d12b095', 'ARTI106250021', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FDFP) du mois de juin 2025', 440093, 'DGI', 'valide', '2025-06-19T09:19:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c952d2ca-f637-455b-82ef-0ea341d14ba7', 'ARTI106250020', 'PRELEVEMENT A LA SOURCE DE 2% SUR LES PAIEMENTS FAITS AUX PRESTATAIRES DU SECTEUR INFORMEL AU TITRE DU MOIS DE MAI 2025 (PPSSI mai 2025))', 560319, 'DGI', 'valide', '2025-06-19T09:20:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ccd1e177-8af7-4d9e-a09b-2e4687abf7e3', 'ARTI106250019', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE JUIN 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-06-19T09:21:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('992b4542-d4ce-4943-bf5e-726654ad64f9', 'ARTI106250018', 'REGULARISATION-INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE MAI 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-06-19T09:21:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('709258df-4b69-43c1-ba3b-ba604824cdb2', 'ARTI106250051', 'Demande de paiement de la DISA 2024', 2536375, 'CNPS', 'valide', '2025-06-20T09:19:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('162a0d69-492a-4286-8238-0a2f3e7a96ad', 'ARTI106250050', 'Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r Gestion des moyens généraux dans une entité publique _ à l''Espace YEMAD du 4 au 6 juin 2025', 5453700, 'ESPACE YEMAD', 'valide', '2025-06-20T09:20:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('269fe137-89c8-42b2-afd7-e728cf02c785', 'ARTI106250049', 'Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r Elaboration et mise en ouvre d''un plan de communication _ à l''Espace YEMAD du 19 au 21 mars 2025', 5453700, 'ESPACE YEMAD', 'valide', '2025-06-20T09:21:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('86111da0-ccb7-4202-9fde-604c1fc99ed4', 'ARTI106250048', 'Demande de paiement de la facture CIE (tension no 141) du compteur no 2 au siSge de l''ARTI pour la période du 04/04/2025 au 04/06/2025', 580675, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-06-20T09:22:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c401bbb-2b17-4a3e-bc56-4a98e1e806cd', 'ARTI106250047', 'Demande de paiement de la facture CIE (tension no 142) du compteur no 1 au siSge de l''ARTI pour la période du 04/04/2025 au 04/06/2025', 1008625, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-06-20T09:23:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fbd1fa80-064d-4488-9b1c-813bca2fb3e4', 'ARTI106250046', 'Réparation de l''étanchéité de la nouvelle galerie couverte au siSge de l''ARTI', 98000, 'ETS OUVRIER DIARRA & FONGBE', 'valide', '2025-06-20T09:24:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ba1399ef-83da-428d-bc1d-908cfc664760', 'ARTI106250045', 'Participation de trois agents de l''ARTI aux Journées Nationales des Ressources Humaines à Yamoussoukro', 1770000, 'JNRH', 'valide', '2025-06-20T09:26:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5f30956-004e-48e3-a91b-81751b28cc6c', 'ARTI106250055', 'Instruction de Monsieur le Directeur Général concernant le remboursement des dépenses engagées durant la mission de remise des machines Glutton H2O à Tafiré et Badikaha', 330000, 'Acteurs externes de l''ARTI', 'valide', '2025-06-23T05:29:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('91159f58-5537-4723-935f-ce2a889e40cd', 'ARTI106250054', 'Rechargement des bonbonnes d''eau pour le mois de mai 2025', 106000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-06-23T05:30:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fd5a194b-bb2c-406d-9c08-cc1123a82eb2', 'ARTI106250053', 'Participation à une formation en audit et contrôle budgétaire - France', 968193, 'CABINET IFACI', 'valide', '2025-06-23T05:32:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('97116f02-d11a-4eb7-bdd1-d86844e91605', 'ARTI106250052', 'FRAIS BANCAIRES DU MOIS DE MAI 2025', 273000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-23T05:32:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49d6dcc5-0bc4-4a8c-ad09-f73f54dc0e00', 'ARTI106250074', 'Acquisition de téléphones portables pour le personnel de l''ARTI', 614000, 'JIREH SERVICES', 'valide', '2025-06-23T18:56:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0c818dc2-f350-4357-b44a-98efcc79c9b1', 'ARTI106250073', 'Remplacement des installations sanitaires (WC de deux bureaux) au siSge de l''ARTIà', 345940, 'AMS', 'valide', '2025-06-23T18:57:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2d0fea0-a8b3-4047-af72-2c6d697f0910', 'ARTI106250072', 'Désinsectisation du siSge de l''ARTI', 637000, 'AGROSPHYSSARL', 'valide', '2025-06-23T18:58:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('04bcb513-436c-4312-a81a-0fff3a6ae22d', 'ARTI106250071', 'Réparation de mobiliers de bureaux', 25004, 'SPIRAL OFFICE & HOME', 'valide', '2025-06-23T18:59:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('173b3a67-84aa-41d0-8eaa-630176c2c5be', 'ARTI106250070', 'Traitement de l''humidité du Service médical de l''ARTI', 1063300, 'HUMIDIT'' EXPERT', 'valide', '2025-06-23T19:00:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6b4bb438-7ab1-4452-8b96-95a1ba139600', 'ARTI106250069', 'Frais de transport du Responsable du Bureau Régional du District Autonome de Yamoussoukro pour la participation à l''atelier de restitution et de validation des rapports d''évaluation environnementale stratégique et des programmes d''investissements prioritai', 65000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-23T19:01:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('805c9ad1-c49a-44c8-a100-c7e7e664274e', 'ARTI106250068', 'Remplacement de climatiseur dans un bureau de la DRRN', 275200, 'AB SERVICE', 'valide', '2025-06-23T19:02:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ea6bf374-8cb9-4bad-a817-bc39cefecb65', 'ARTI106250067', 'REGULARISATION-FRAIS DE TRANSPORT ADMINISTRATIF(TAXI) DU 03 mai 2025 AU 31 mai 2025', 132575, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-23T19:04:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc85e64b-24be-468c-863b-c66ac1545983', 'ARTI106250066', 'Acquisition de destructeurs de papiers pour l''ARTI', 795000, 'LIBRAIRIE DE FRANCE GROUPE', 'valide', '2025-06-23T19:05:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f4229bb8-0f88-49a8-b6f0-e173678e16ac', 'ARTI106250065', 'Régularisation - Acquisition d''une armoire haute pour le bureau de la Directrice de la Qualité', 545632, 'SPIRAL OFFICE & HOME', 'valide', '2025-06-23T19:06:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3d5d05fe-75d2-4a02-b0e4-05f0f532cf0e', 'ARTI106250064', 'Demande d''achat de consommables de restauration pour la cantine du siSge de l''ARTIà', 33100, '', 'valide', '2025-06-23T19:07:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ecb07b9-eab5-41dc-adaf-eacdcb0a21b4', 'ARTI106250063', 'Acquisition de fournitures de bureaux pour l''ARTI', 519259, 'PAPIGRAPH CI', 'valide', '2025-06-23T19:08:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('69f50e33-ea8f-4623-9992-8a584ce53939', 'ARTI106250062', 'Réparation de la grande imprimante CANON IR C5560i du siSge de l''ARTIà', 627200, 'GOLD SOLUTION SARL', 'valide', '2025-06-23T19:10:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('929a7b46-0e83-4503-843a-be0f8fe921ca', 'ARTI106250061', 'Réparation du véhicule SUZUKI VITARA immatriculé AA-897-FS 01', 248686, 'SOCIDA', 'valide', '2025-06-23T19:11:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3fd58d43-ad7f-41f4-8e88-37f8af124ef4', 'ARTI106250060', 'Acquisition de consommables informatiques (cartouches d''encre) pour l''ARTIà', 800000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-06-23T19:11:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('95aaeee8-81f1-4a0e-896b-6994c90ad6ee', 'ARTI106250059', 'Remplacement des balais essuie glaces du véhicule SUZUKI VITARA immatriculé 2921 LP 01', 84018, 'SOCIDA', 'valide', '2025-06-23T19:13:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('10d134a7-64fd-4884-ac9d-b1946289bdbd', 'ARTI106250058', 'Demande de visite technique du véhicule HYUNDAI I10 immatriculé 615 KP 01', 48700, 'MAYELIA AUTOMOTIVE', 'valide', '2025-06-23T19:14:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5704cfa5-40a5-4929-bbcc-24ee5ba085bd', 'ARTI106250057', 'Achat de compositions florales pour le mois de mai 2025 (FLEUR DE JONQUILLE)', 70000, 'FLEUR DE JONQUILLE', 'valide', '2025-06-23T19:15:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17f7a4e6-0e1f-445a-b0aa-f5e473e05cd4', 'ARTI106250056', 'Achat de compositions florales pour le mois de mai 2025 (FLOREAL)', 400000, 'Floréal', 'valide', '2025-06-23T19:16:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6913e38a-a5bd-45fd-96dd-bcf15e054eab', 'ARTI106250077', 'Acquisition de gadgets de communication de l''ARTI (HOODA GRAPHIC IMPRIMERIE)', 1150500, 'HOODA GRAPHIQUE', 'valide', '2025-06-24T09:36:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dcd9669c-19e4-457b-ad14-faefbc0f2ae4', 'ARTI106250076', 'Fourniture et pose de signalétique interne au siSge de l''ARTI (LOT 1 : signalétique alphabétique)', 1217170, '2BPUB', 'valide', '2025-06-24T09:37:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('85798f3f-07a7-456f-a3cc-03185469182c', 'ARTI106250075', 'Fourniture et pose de signalétique interne au siSge de l''ARTI (LOT 2 : signalétique alphanumérique)', 549880, '2BPUB', 'valide', '2025-06-24T09:38:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ac239c7f-1cbc-4475-b3e9-347559d1b2d0', 'ARTI106250078', 'Acquisition de gadgets de communication de l''ARTI (B COM)', 646800, 'B COM SARL', 'valide', '2025-06-24T14:30:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8881ff22-cea4-4de8-9b1d-2255e131e5f5', 'ARTI106250095', 'S?MINAIRE DE VALIDATION DU DOCUMENT DE PROGRAMMATION PLURIANNUELLE DES D?PENSES (DPPD) ET DES PROJETS ANNUELS DE PERFORMANCE (PAP) DU 22 JUIN AU 27 JUIN 2025', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:36:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ece42f7-0d3e-4e50-ac8c-ad556e2f042a', 'ARTI106250094', 'Frais de transport de l''Auditeur Interne et Contrôleur Budgétaire pour la participation au séminaire de validation du Document de Programmation Pluriannuelle des Dépenses (DPPD) et des Projets Annuels de Performances (PAP)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:46:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0f11c0a8-f7c4-4077-bf3d-cf10feeaa9c2', 'ARTI106250093', 'Frais de transport du Chargé d''Etudes Sénior à la Direction Généraleé pour la participation au séminaire de validation du Document de Programmation Pluriannuelle des Dépenses (DPPD) et des Projets Annuels de Performances (PAP)à', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:47:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ab93d247-ac5a-4199-891c-e3204a4fe6bb', 'ARTI106250092', 'S?MINAIRE DE VALIDATION DU DOCUMENT DE PROGRAMMATION PLURIANNUELLE DES D?PENSES (DPPD) ET DES PROJETS ANNUELS DE PERFORMANCE (PAP) DU 23 JUIN AU 27 JUIN 2025', 80000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:49:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6f2b1fc8-f952-4fb4-9c90-d92da465dcad', 'ARTI106250091', 'Demande de renouvellement de la licence ADOBE pour l''année 2025', 1399000, 'BOLLESTORE PLUS', 'valide', '2025-06-25T15:52:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('26b67039-6273-481b-9627-f9dc942de2cc', 'ARTI106250090', 'Demande d''achat de bons-valeurs de carburant', 2000000, 'PETRO IVOIRE', 'valide', '2025-06-25T15:53:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3990d6e4-6631-46c0-be2a-a6c39ed2255d', 'ARTI106250089', 'Frais d''hôtel pour les journées des Ressources Humaines', 735000, 'SONAPIE', 'valide', '2025-06-25T15:54:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e0a45405-c4fa-43e9-9dba-0b5edf633c34', 'ARTI106250088', 'PARTICIPATION AUX JOURNEES NATIONALES DES RESSOURCES HUMAINES', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:56:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('26864096-3e37-437c-b8ef-b6b1438a92d1', 'ARTI106250087', 'PARTICIPATION AUX JOURNEES NATIONALES DES RESSOURCES HUMAINES', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T15:57:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd3f53a9-f7b5-4dae-b1af-2a58941c546d', 'ARTI106250086', 'PARTICIPATION AUX JOURNEES NATIONALES DES RESSOURCES HUMAINES', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T16:00:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9bee5e13-5996-414c-8766-aa178fefe29d', 'ARTI106250085', 'PARTICIPATION AUX JOURNEES NATIONALES DES RESSOURCES HUMAINES', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T16:01:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3cc7762b-1ac1-4b51-b2e6-3358ef115730', 'ARTI106250084', 'Achats de divers articles pour la Direction générale de l''ARTI', 229600, '', 'valide', '2025-06-25T16:02:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('410118ff-d00b-455f-a7cc-9105cf6757f1', 'ARTI106250083', 'Remplacement des serrures de portes des deux salles d''eau du rez-de-chaussée du siSge de l''ARTI', 35280, 'DIVINE DECOR', 'valide', '2025-06-25T16:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ce6f481a-a00a-41d6-a095-7fc5b6da979b', 'ARTI106250082', 'RETENUE A LA SOURCE DE 12% SUR LE PAIEMENT DES LOYERS  POUR LE COMPTE DU BAIILEUR DU LOCAL ABRITANT LE SIEGE D''ARTI BOUAKE AU TITRE DU 3S TRIMESTRE 2025à', 102273, 'DGI', 'valide', '2025-06-25T16:05:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4ade1ecf-384a-4de5-a9f9-64f39049a80c', 'ARTI106250081', 'Demande de rSglement de la facture SODECI Bouaké pour le mois de mai 2025', 6603, 'SODECI', 'valide', '2025-06-25T16:06:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('55c4efb5-22b8-4023-988e-f1bcd7f510a4', 'ARTI106250080', 'Remplacement de la note 116-03-2025 ARTI/DAAF/SDMG/EJJ avec pour objet : Modification et installation d''auvents à l''ARTI', 1500000, 'ATLANTIS SMART SOLUTIONS', 'valide', '2025-06-25T16:08:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a939051-9b48-4f52-8866-18e8adf5c064', 'ARTI106250079', 'Régularisation - Demande de révision du véhicule NISSAN PATROL immatriculé 6767 KR 01', 861809, 'ATC COMAFRIQUE', 'valide', '2025-06-25T16:08:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1aed97a3-7dbf-41fe-bd73-c30aecd0613f', 'ARTI106250097', 'PARTICIPATION A UNE FORMATION EN AUDIT ET CONTROLE BUDGETAIRE', 450000, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-25T17:42:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a1eb9dce-ab8d-46c4-b225-631834e7f5f8', 'ARTI106250096', 'Régularisation - Demande de renouvellement de la licence O2SWITCH pour l''année 2025', 125760, 'o2switch', 'valide', '2025-06-25T17:44:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('10cdba94-0ab2-431c-9eff-a1fcaa661ed8', 'ARTI106250108', 'Demande de renouvellement Des licences DSU SAGE COMPTABILITE & PAIE ARTI pour l''année 2025', 2839635, 'PMS INFORMATIQUE', 'valide', '2025-06-27T09:38:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('846605f8-ddc6-4f31-9f0d-79307b846bdc', 'ARTI106250107', 'Confection de gadgets de communication pour la participation de l''ARTI à l''enqu^te de satisfaction', 3245000, 'OTHENTIC GROUP', 'valide', '2025-06-27T14:30:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e94f142e-a30a-44e8-80cf-1a56e054a3d2', 'ARTI106250106', 'Acquisition d''ordinateurs portables pour l''ARTI', 6785000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-06-27T14:32:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('96a5feb9-2913-4928-a3c0-84da89ffd1e3', 'ARTI106250105', 'Acquisition de gadgets de communication de l''ARTI (2B PUB)', 13693900, '2BPUB', 'valide', '2025-06-27T14:33:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('13c9224e-53c3-4084-8208-5a7ef04cbb53', 'ARTI106250104', 'RSglement des frais d''expédition de courriers dans les villes de Yamoussoukroé Dimbokro et Tafiré', 28000, 'CODITRANS', 'valide', '2025-06-27T14:35:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49c8e14e-ac6e-4eb0-9176-555500c39530', 'ARTI106250103', 'REGULARISATION- FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI DU 01 MAI AU 31 MAI 2025', 6100, 'PERSONNEL DE L''ARTI', 'valide', '2025-06-27T14:36:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('67421046-a1cf-47b4-aca0-4b4e4978f3fa', 'ARTI106250102', 'RSglement des frais d''expédition de courrier à la Sous-Préfecture de BADIKAHA', 5000, 'LA POSTE DE COTE DIVOIRE', 'valide', '2025-06-27T14:37:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f782cb3-0dde-483e-9294-1800229c9e19', 'ARTI106250111', 'Demande de réparation du bain marie de la cantine du siSge de l''ARTI', 271400, 'HORECA WORLD SARL', 'valide', '2025-06-27T20:31:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('71f41ed1-fd7e-4bbf-82d6-df787804fea5', 'ARTI106250110', 'Demande de rSglement de la facture SODECI Bouaké pour la période de février à avril 2025', 18483, 'SODECI', 'valide', '2025-06-27T20:32:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('83eece1a-2af6-4f1f-946c-ba3848ca5924', 'ARTI106250109', 'Achat de produits pharmaceutiques pour le service médical de l''ARTI', 241490, 'PHARMACIE AURORE', 'valide', '2025-06-27T20:33:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e7ac658-de6f-4a59-a799-692587218b6a', 'ARTI106250101', 'Restauration du personnel de l''ARTI pour le mois d''ao-t 2025', 6889400, 'T & P EVENT', 'valide', '2025-06-27T20:34:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('776fe6fc-3091-4bcb-acdf-3e593e8de707', 'ARTI106250100', 'Restauration du personnel pour le pour le mois de juillet 2025', 8339800, 'T & P EVENT', 'valide', '2025-06-27T20:35:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6d1a3a4c-0700-451c-aa9d-0b289a95ea43', 'ARTI106250099', 'Organisation de la célébration des cinq (05) ans d''existence de l''ARTI', 47315640, 'OCEANE INTERNATIONAL', 'valide', '2025-06-27T20:37:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a18e1f6e-e686-45ca-a07b-82abdc9b0aa9', 'ARTI106250098', 'Demande de rechargement des box wifi prépayées MOOV AFRICA de l''ARTI pour le mois de juillet 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-06-27T20:38:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('afae772d-81f7-41d4-a68e-57da4c0a6285', 'ARTI106250118', 'Acquisition de consommables médicaux pour l''infirmerie de l''ARTI', 64700, 'SOCOCE 2 PLATEAUX LATRILLE', 'valide', '2025-06-28T17:38:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98dc9410-7514-422e-a991-396a787d3787', 'ARTI106250117', 'Acquisition d''imprimés médicaux pour l''infirmerie de l''ARTI', 23010, 'RIA', 'valide', '2025-06-28T17:39:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a65be34-943b-405e-9107-2a89850acc50', 'ARTI106250116', 'Demande de remplacement de deux (02) pneus pour le véhicule HYUNDAI immatriculé 615 KP 01', 164126, 'CACOMIAF', 'valide', '2025-06-28T17:40:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('24605ba4-742f-498a-adac-57d3e804a5bd', 'ARTI106250115', 'Demande de remplacement des deux (02) pneus arriSre du véhicule immatriculé 2923 LP 01', 193000, 'PETRO IVOIRE', 'valide', '2025-06-28T17:41:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d8fc1a39-a7bb-49a2-8011-9fefcb2b89a8', 'ARTI106250114', 'Régularisation - Diagnostic de l''étanchéité du Service médical de l''ARTI', 60000, 'HUMIDIT'' EXPERT', 'valide', '2025-06-28T17:42:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f1f96a7c-4aeb-4d80-9d00-013758b81088', 'ARTI106250113', 'Régularisation - Réalisation des travaux de réparation de l''étanchéité du siSge de l''ARTI', 70000, 'BERNABE CÔTE D''IVOIRE', 'valide', '2025-06-28T17:43:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ba0f3bc5-14ce-4969-b6e1-3f0ad99e7356', 'ARTI106250112', 'Note complémentaire du dossier no ARTI004250264 pour la prise en compte de la dépense relative aux balais essuie glaces du véhicule immatriculé 2923 LP 01', 45000, 'PETRO IVOIRE', 'valide', '2025-06-28T17:44:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7d1d2bb5-c228-49bc-b6d0-f509e82bf26f', 'ARTI106250132', 'Acquisition de Test de Diagnostic Rapides de Paludisme pour l''infirmerie de l''ARTI', 30000, 'LES PALMIERS MULTITISERVICES', 'valide', '2025-06-30T18:54:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0d1c9c9d-702b-421b-90ed-ef63235096c9', 'ARTI106250131', 'Régularisation - Frais de transport du Responsable du Bureau Régional du District Autonome de Yamoussoukro pour la participation à la remise de dons d''engins glutton', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-01T09:52:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('812cd582-63ae-45e8-b441-3ec598cfd916', 'ARTI106250130', 'Régularisation - Frais de transport du Sous-Directeur des Affaires juridiques et des Recours pour une visite de prospection et de sensibilisation dans des localités', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-01T09:54:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('610a47b3-176a-4fb9-837f-65b671957c87', 'ARTI106250129', 'Demande d''acquisition d''articles pour la cantine de l''ARTI', 24000, 'SOCOPRIX', 'valide', '2025-07-01T09:55:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3b199142-201b-49e2-8634-8c4ccf58368d', 'ARTI106250128', 'Nettoyage des véhicules de pools pour le mois de mai 2025', 8000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-07-01T09:56:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ad59ed6d-2cc3-448e-9cb8-a9a4db893ffd', 'ARTI106250127', 'Régularisation - Frais de transport du Sous-Directeur de la Surveillance et des Enqu^tes pour la visite de prospection et de sensibilisation dans des localités', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-01T09:58:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('737aebc0-1c76-44e7-990b-4effd52fde1d', 'ARTI107250003', 'Régularisation - Travaux d''électricité au siSge de l''ARTI', 61000, 'AQUABAT', 'valide', '2025-07-02T09:07:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6b623500-211f-46bc-b3a8-86184d15bb55', 'ARTI106250126', 'Régularisation - Travaux d''électricité au siSge de l''ARTI', 250000, 'AQUABAT', 'valide', '2025-07-02T09:09:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f255f64b-610a-4bcd-b6d1-a9e8925bd33c', 'ARTI107250002', 'RSglement mensuel de la facture du mois d''ao-t 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-07-02T09:10:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f2ae7bb-38f0-4534-b01c-5325a8fbde0f', 'ARTI107250004', 'PRELEVEMENT A LA SOURCE DE 2% SUR LES PAIEMENTS FAITS AUX PRESTATAIRES DE SERVICES AU TITRE DU MOIS DE JUIN 2025(PPSSI)', 101469, 'DGI', 'valide', '2025-07-02T09:12:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4bd52661-630a-4b45-a237-c209d9daac84', 'ARTI107250001', 'Rechargement des bonbonnes d''eau pour le mois de juin 2025', 72000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-07-02T09:13:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c10e7d97-a1d2-4da2-b87d-4ab5f8960360', 'ARTI106250125', 'Régularisation - Frais de transport pour la participation à la remise de dons d''engins glutton', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-02T09:15:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('73594c9c-cb24-4d07-9f5f-74287b752b72', 'ARTI106250124', 'Régularisation - Demande d''achat de pots de fleurs et de bonbons dans le cadre de la cérémonie du QITAA 2025', 11550, '', 'valide', '2025-07-02T09:16:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a461c94e-49ff-4785-be91-7324b02e4813', 'ARTI106250123', 'Achat de compositions florales pour le mois d''avril 2025 (FLOREAL)', 320000, 'Floréal', 'valide', '2025-07-02T09:18:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('87a9b6ff-1321-4029-8e73-51bb86db1207', 'ARTI106250122', 'Régularisation - Demande de revisite technique du véhicule VOLKSWAGEN VIRTUS immatriculé AA-581-FY 01', 12950, 'MAYELIA AUTOMOTIVE', 'valide', '2025-07-02T09:19:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7df79ed6-3ec2-4b7b-8834-38cc005b3289', 'ARTI106250121', 'Pré-visite du véhicule VOLKSWAGEN VIRTUS immatriculé AA-581-FY-01', 25000, 'CAM-SERVICES', 'valide', '2025-07-02T09:20:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('144ff369-1ee4-4cad-b26c-7dbc945a6bac', 'ARTI106250120', 'Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r Comprendre l''annexe fiscale 2025 _ à l''Espace YEMAD du 24 au 25 mars 2025', 3934700, 'ESPACE YEMAD', 'valide', '2025-07-02T09:20:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2a9fbb0e-5264-4b8f-be75-d65f6ac442e8', 'ARTI106250119', 'Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r SystSme comptable et fiscal des entités à but non lucratif (SYCEBNL) _ à l''Espace YEMAD du 7 au 9 avril 2025', 5902050, 'ESPACE YEMAD', 'valide', '2025-07-02T09:21:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2bc72588-46bd-40e8-ab9d-34d5c3499ccd', 'ARTI107250008', 'Modification des billets de Monsieur CONE Diomané Membre du Conseil de Régulation de l''ARTI et de Madame AKA Stéphanieé Cheffe de Mission du Ministre des Transports pour participation à la formation CAER en France', 526400, 'AIR France', 'valide', '2025-07-05T10:03:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6658197-d938-4dc1-b621-e18aad36ee76', 'ARTI107250007', 'Remplacement du canon de la porte d''accSs du Bureau Régional de Bouaké', 14337, 'FOURNISSEURS DIVERS', 'valide', '2025-07-05T10:07:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1441f8a1-39ce-4cb1-86b8-ed7d4317b9d1', 'ARTI107250006', 'Demande de confection de clés pour bureau et salle d''eau', 34300, 'O''CONFECTION', 'valide', '2025-07-05T10:08:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('57fe0a76-8b17-43ed-b002-02cf0c655ac8', 'ARTI107250005', 'Demande de revisite technique du véhicule HYUNDAI I10 immatriculé 615 KP 01', 13700, 'MAYELIA AUTOMOTIVE', 'valide', '2025-07-05T10:11:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7deed1d2-7320-432b-afaf-b34633ba973b', 'ARTI107250016', 'FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI DU 01 JUIN AU 30 JUIN 2025', 19950, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-07T09:59:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1c5afc7d-c6c7-4c66-ac6c-9e5050dfee4b', 'ARTI107250015', 'FRAIS DE TRANSPORT ADMINISTRATIF(TAXI) DU 01 JUIN 2025 AU 30 JUIN 2025', 48200, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-07T10:00:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e1d77990-5e36-4c1b-9fb4-a7d298148bca', 'ARTI107250014', 'FRAIS D''ACHAT DE CREDIT DE COMMUNICATION DANS LE CADRE DES ACTIVITES DE L''ARTI DU 1er JUIN 2025 AU 30 JUIN 2025', 5000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-07T10:01:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc6448f7-f1ef-4ba3-9369-6c115a591506', 'ARTI107250013', 'RSglement de la facture Orange CI pour la consommation mobile du mois de juin 2025', 769076, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-07-07T10:04:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc75a11d-aef4-4397-8221-98a556a4513c', 'ARTI107250012', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de juillet 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-07-07T10:05:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9e14c5aa-23b8-433e-8fe6-cdb1dfba7b2d', 'ARTI107250011', 'FRAIS BANCAIRE DU MOIS DE JUIN 2025', 273000, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-07-07T10:07:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('af6515de-7b22-4672-af35-53fb30f975c4', 'ARTI107250010', 'Demande d''achat de bons-valeurs de carburant', 3000000, 'PETRO IVOIRE', 'valide', '2025-07-07T10:08:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('810dc91b-01be-466e-b586-068f15fb2ac0', 'ARTI107250009', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de juin 2025', 208482, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-07-07T10:09:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30083824-ed53-4003-9e39-e957db0126cd', 'ARTI107250018', 'Evaluation du dispositif de sécurité de l''ARTI', 6500000, 'KEDJ SECURITE', 'valide', '2025-07-08T06:24:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6a07beaf-2c5a-4868-9795-22152164fb12', 'ARTI107250017', 'Acquisition d''un fauteuil ergonomique', 450000, 'POLYMED', 'valide', '2025-07-08T06:25:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('602140a4-0827-4b0c-82db-d6741c367536', 'ARTI107250022', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-08T17:11:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b37e77a-01d0-44a0-bef9-c07838b6a454', 'ARTI107250021', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-08T17:12:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('15decbe1-29bf-4f23-abed-653a233475d5', 'ARTI107250020', 'Frais de transport de la Directrice de la Gestion Prévisionnelle de l''Emploié des Compétences et des Relations Publiques (DGPECRP) pour la journée Nationale des Ressources Humaines', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-08T17:13:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb6fc5bc-4683-4877-b51a-3572d530eb5e', 'ARTI107250019', 'Remboursement de frais de réception payés par Monsieur le Directeur Général de l''ARTI en France dans le cadre de la mission de Certification des Administrateurs des Entreprises Responsables à ESSEC Paris du 21 juin 2025 au 10 juillet 2025à', 3868638, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-08T17:14:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('505e0d3a-7533-4379-8756-80304a72a11d', 'ARTI107250031', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-10T23:25:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8fcd4354-c20f-477c-8031-8b79311ada0c', 'ARTI107250025', 'Acquisition de support de communication pour la campagne de sensibilisation phase 1_ LOT 3 (2BPUB)', 1752300, '2BPUB', 'valide', '2025-07-10T23:26:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9dbd5b7c-584b-494e-8e05-82e38abcab7d', 'ARTI107250024', 'Acquisition de casques de motos pour la phase 1 de la campagne de sensibilisation 2025', 1250000, 'GROUP IVOIRE MOTO-SARL', 'valide', '2025-07-10T23:29:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a0ad648d-d98f-4783-971e-36356f765d40', 'ARTI107250023', 'Acquisition de support de communication pour la campagne de sensibilisation phase 1 _ LOT 4 (BCOM)', 85750, 'B COM SARL', 'valide', '2025-07-10T23:30:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('28948758-c347-4295-87b8-895953a8ea11', 'ARTI107250026', 'Acquisition de support de communication pour la campagne de sensibilisation phase 1 _ LOT 2 (2BPUB)', 2731700, '2BPUB', 'valide', '2025-07-10T23:32:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fc7a9b00-5e3e-4c0d-a098-565e161cbb73', 'ARTI107250027', 'Acquisition de support de communication pour la campagne de sensibilisation phase 1_ LOT 1 (HOODA)', 927480, 'HOODA GRAPHIQUE', 'valide', '2025-07-10T23:33:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f001dd86-5d54-4344-95f3-c2b12243d3e4', 'ARTI107250028', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-10T23:36:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9dc32b8-0f85-478b-b4fe-4b75de805a1f', 'ARTI107250035', 'Acquisition de Tests de Diagnostics Rapide de la dengue pour le service médical de l''ARTI', 140000, 'LES PALMIERS MULTITISERVICES', 'valide', '2025-07-11T07:56:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('998f9c78-f4b0-4f41-a077-42c1cb28c452', 'ARTI107250034', 'Demande d''achat de trois draps plats', 36650, 'FOURNISSEURS DIVERS', 'valide', '2025-07-11T07:58:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ca53a7d5-c961-4d4e-8416-01cf67563a31', 'ARTI107250033', 'Acquisition d''une licence supplémentaire du progiciel SAGE Paie', 152664, 'PMS INFORMATIQUE', 'valide', '2025-07-11T08:02:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65aafe02-51dc-4995-abb5-3908f677af30', 'ARTI107250032', 'Achat de compositions florales pour le mois de juin 2025 (FLOREAL)', 320000, 'Floréal', 'valide', '2025-07-11T08:06:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('534ad279-c0f4-4f79-964b-bf205be2cbeb', 'ARTI107250030', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-11T08:07:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5e61d477-9fa3-48e3-9f3a-8c1d6fc7c3a0', 'ARTI107250029', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 250000, 'Acteurs externes de l''ARTI', 'valide', '2025-07-11T08:12:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('512d8b36-4bed-444c-bd7a-7dfd254f1dfc', 'ARTI107250044', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de juillet 2025', 452009, 'DGI', 'valide', '2025-07-11T19:11:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5677c7f-2eb6-493d-8a78-ea7da6c5c390', 'ARTI107250043', 'ACQUISITIONS DE MACHINES ET  KITS MUNICIPALITE ASPIRATEURS GLUTTON H2O PERFECT', 32505720, 'GLUTTON', 'valide', '2025-07-11T19:12:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('75489e12-de2e-4961-b74a-27ff44694db1', 'ARTI107250042', 'Frais de transport du Responsable du Bureau Régional de Yamoussoukro pour la réalisation de la phase 1 des ateliers de sensibilisation et de formation des acteurs du transport intérieur', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-11T19:14:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('32f85702-75cb-414a-8717-ca2bf1003cff', 'ARTI107250041', 'Location d''une camionnette pour la phase 1 de la campagne de sensibilisation 2025', 588000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-07-11T19:15:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64aa3721-4444-472d-b0fa-a2d6d7c80895', 'ARTI107250040', 'Location d''un véhicule de transport de personnes pour la phase 1 de la campagne de sensibilisation 2025 (Tafiré - Fronan)', 775000, 'EUROPCAR', 'valide', '2025-07-11T19:16:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a2a919ab-e24d-43cd-b93f-f47033faa89b', 'ARTI107250039', 'Location d''un véhicule de transport de personnes pour la phase 1 de la campagne de sensibilisation 2025 (KORHOGO et SINEMATIALI)', 1075000, 'EUROPCAR', 'valide', '2025-07-11T19:17:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('476b79d3-ea19-4643-9dd9-ad03c2044082', 'ARTI107250038', 'RSglement de la facture du maitre d''ouvre pour le projet de réhabilitation et d''aménagement du bureau régional de l''ARTI à Yamoussoukro', 3670000, 'CABINET ARCHI-SYSTEM', 'valide', '2025-07-11T19:18:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('052c71ce-dc9e-4dd7-9083-ae32808c0478', 'ARTI107250037', 'Acquisition d''un objectif pour l''appareil photo de l''ARTI', 380000, 'INTEGRAL TRANSIT ET TRANSPORT LOGISTIQUE', 'valide', '2025-07-11T19:20:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('131bc8cf-45f5-458b-9a06-6feab4098afc', 'ARTI107250036', 'Dépannage de climatiseurs', 105056, 'AB SERVICE', 'valide', '2025-07-11T19:21:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6984f265-04f3-481b-814d-164adaa8fb5e', 'ARTI107250055', 'Exécution du mandat de conseil stratégique entre l''ARTI et C5P AFRIQUE', 5000000, 'SOCIETE C5P AFRIQUE', 'valide', '2025-07-14T13:28:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17e3fef2-3748-44a9-a999-9145e3b3d045', 'ARTI107250054', 'ACHAT DE SEAU DE GALET MULTIFONCTION POUR L''ENTRETIEN DE LA PISCINE DU SIEGE DE L''ARTI (AOUT ET SEPTEMBRE 2025)', 40000, 'H2O PISCINE', 'valide', '2025-07-14T13:29:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7bc762f2-87d6-41fe-a43b-161296535556', 'ARTI107250053', 'Situation des honoraires des gendarmes du mois de juillet 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-07-14T13:30:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5f9036c-da5f-45e3-9caf-2154d81c0426', 'ARTI107250052', 'Demande de rSglements des forfaits des interprStes et MaOtre de Cérémonie des ateliers de formation et de sensibilisation des acteurs du Transport Intérieur _phase 1 de l''année 2025', 400000, 'Acteurs externes de l''ARTI', 'valide', '2025-07-14T13:31:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31f9b7c7-1d90-4179-86fd-29f259f902ce', 'ARTI107250050', 'Production et diffusion du spot agenda sur la Radio Côte d''Ivoire des ateliers de sensibilisations 2025 - phase 1', 100000, 'PRESSES', 'valide', '2025-07-14T13:32:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe78b975-069a-447d-892b-76cefe4ae2b1', 'ARTI107250049', 'Situation de l''Impôt sur les Salaires (IS) du mois de juillet 2025', 16725455, 'DGI', 'valide', '2025-07-14T13:36:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ad24128c-02e0-4ed6-bd6c-ee7195bc9805', 'ARTI107250046', 'Situation Cotisation CNPS du mois de juillet 2025', 9904458, 'CNPS', 'valide', '2025-07-14T13:37:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5897e12e-8f72-4eb3-b6e6-1347d65d1e5e', 'ARTI107250045', 'Situation du salaire et appointement du mois de juillet 2025', 53520765, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-14T13:38:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8c61cdf7-2de9-4847-8ca0-0b37ea8643c1', 'ARTI107250048', 'RSglement des frais de dépannage de la batterie du véhicule HYUNDAI immatriculé 615 KB 01 (véhicule de pools)', 2000, 'FOURNISSEURS DIVERS', 'valide', '2025-07-14T13:39:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('24051a75-4eca-42bb-99fc-88c55e0008a4', 'ARTI107250051', 'Relais presse des ateliers de sensibilisations 2025 - phase 1', 130000, 'PRESSES', 'valide', '2025-07-14T13:40:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8c08d17d-19f2-48f5-afc6-910aeb398223', 'ARTI107250047', 'Situation Cotisation CMU du mois de juillet 2025', 48000, 'CNPS', 'valide', '2025-07-14T13:41:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('efb82c15-5f95-4e2e-ac85-7c8078aca67c', 'ARTI107250070', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de juillet 2025', 301340, 'DGI', 'valide', '2025-07-15T18:23:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0471ceb9-3619-40b1-b28e-702513f68fb0', 'ARTI107250069', 'Location de véhicule pour la mission de l''ARTI à SAN PEDRO dans le cadre de la mission de prospection qui se déroulera du 17 au 19 juillet 2025', 536891, 'EUROPCAR', 'valide', '2025-07-15T18:24:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('edc11e5a-3f29-40c1-98d4-6f050e23949e', 'ARTI107250068', 'Situation des indemnités des stagiaires du mois de juillet 2025', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-15T18:25:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('521d0b11-83cc-4bf2-8ee5-8d9f9b660bad', 'ARTI107250067', 'Situation de la retenue à la source du mois de juillet 2025', 278919, 'DGI', 'valide', '2025-07-15T18:26:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a4df8590-ea26-4c97-9dc3-6d3e2e264063', 'ARTI107250066', 'Situation des indemnités des stagiaires du mois de juillet 2025', 2000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-15T18:27:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef6b2f28-0856-4e28-84bc-19e9f52bf440', 'ARTI107250065', 'Acquisition d''une armoire haute pour le bureau de l''Assistante du Président du Conseil de Régulation de l''ARTI', 354000, 'PAPIGRAPH CI', 'valide', '2025-07-15T18:30:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc28b547-ae0e-4e4b-8e81-352ec9224ac3', 'ARTI107250064', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE JUILLET 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-07-15T18:36:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8a2645a-70e8-4b77-80f9-2bfa0c4824f9', 'ARTI107250063', 'Note de régularisation - Demande d''entretien de trois imprimantes', 45000, 'LIBRAIRIE DE FRANCE GROUPE', 'valide', '2025-07-15T18:46:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3a3924f1-08db-4d72-a273-2a82a91eed6e', 'ARTI107250062', 'Réservation d''hôtel pour mission  du Directeur Général à Yamoussoukro et Bouaké', 2380000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-15T18:49:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('74355ec0-7447-4e32-adbe-90153d78049b', 'ARTI107250061', 'Note de régularisation:  Mise à disposition de véhicule avec chauffeur & transferts aéroport pour la mission relative au projet bouse de Fret avec GENETEC et la Banque Mondiale à', 6297200, 'EMMA CAB', 'valide', '2025-07-15T18:50:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b60a060e-a178-4513-9115-86df65d1e1fe', 'ARTI107250060', 'Sécurité privée des locaux de l''ARTI pour le mois d''ao-t', 2001280, 'SIGASECURITE', 'valide', '2025-07-15T18:52:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ea4d5d41-fadf-4827-bd7d-42e642a14319', 'ARTI107250059', 'RSglement mensuel de la facture du mois d''ao-t 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-07-15T18:54:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2b565295-8b0b-4036-9b77-c710c5bcb237', 'ARTI107250080', 'TOURN?E-VISITE ET S?ANCE DE TRAVAIL AVEC LES BUREAUX DE L''ARTI YAMOUSSOUKRO ET BOUAK? DU 31 JUILLET 2025 AU 07 AOˆT 2025', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-16T17:04:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7972333-0576-42e0-bc0c-d11f0751435e', 'ARTI107250081', 'Demande de paiement de l''abonnement du nom de domaine de l''ARTI sur VENAME pour l''année 2025', 10000, 'VENAME (DOMAINE ARTI CI)', 'valide', '2025-07-16T17:05:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('146d50cd-9c85-4673-8419-d5097e8fba64', 'ARTI107250077', 'MISSION AUPROS DE GENETEC RELATIVE AU D?VELOPPEMENT DU PROJET FERROVIAIRE', 2800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-16T17:06:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8dc37ba2-ddb8-4e1f-b3d0-fe5a959410fd', 'ARTI107250078', 'Note de régularisation : Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission de renforcement  de capacité sur la gestion d''un systSme intégré de mobilité urbaineà', 3148600, 'EMMA CAB', 'valide', '2025-07-16T17:07:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c142e455-284e-457b-9b8d-fd12019ac081', 'ARTI107250082', 'Remplacement de la note no 398-07-2025 ARTI/DAAF/SDMG/EJJ - Confection de stylos et porte-clés pour l''enqu^te de satisfaction', 3245000, 'OTHENTIC GROUP', 'valide', '2025-07-16T17:08:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3031a46d-0886-44c0-8305-f171a5339061', 'ARTI107250079', 'TOURN?E-VISITE ET S?ANCE DE TRAVAIL AVEC LES BUREAUX DE L''ARTI YAMOUSSOUKRO ET BOUAK? DU 31 JUILLET 2025 AU 07 AOˆT 2025', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-16T17:10:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('09609dbb-4441-4121-b17c-d126254d5959', 'ARTI107250076', 'Note de régularisation : Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre du projet de développement ferroviaire avec le cabinet C5P', 2361500, 'EMMA CAB', 'valide', '2025-07-16T17:12:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f92f972b-9faa-4f8c-82c3-c01c2cf66859', 'ARTI107250075', 'Ordre de Rechargement des cartes de carburant du mois d''ao-t 2025', 3900000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-07-16T17:13:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('78eb1142-a0e4-4ddd-9132-7c5b739b16e0', 'ARTI107250072', 'TOURN?E-VISITE ET S?ANCE DE TRAVAIL AVEC LES BUREAUX DE L''ARTI YAMOUSSOUKRO ET BOUAK? DU 31 JUILLET 2025 AU 07 AOˆT 2025', 525000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-16T17:15:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e35a93f6-f8b7-4ceb-bab0-ed6e5243bb6b', 'ARTI107250071', 'TOURN?E-VISITE ET S?ANCE DE TRAVAIL AVEC LES BUREAUX DE L''ARTI YAMOUSSOUKRO ET BOUAK? DU 31 JUILLET 2025 AU 07 AOˆT 2025', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-16T17:16:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('102777a4-4981-43ba-aae7-00069110fb5f', 'ARTI107250058', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois d''ao-t 2025', 327467, 'MI3E', 'valide', '2025-07-16T17:17:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('16025627-fd11-4585-b8df-b6499248eb70', 'ARTI107250084', 'Rechargement des cartes péages FER pour le mois d''ao-t 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-07-16T17:18:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('10827787-bc90-4e36-9ca9-96f02fdee45a', 'ARTI107250056', 'Demande de rechargement des box wifi prépayées MOOV AFRICA de l''ARTI pour le mois d''ao-t 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-07-16T17:19:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aa0f2e80-5aa5-41c6-9e6e-7293906a55cc', 'ARTI107250083', 'Rechargement canal horizon pour le mois d''ao-t 2025', 100000, 'CANAL + HORIZON', 'valide', '2025-07-16T17:20:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2e6b180c-317c-4823-92e3-22cf7637e136', 'ARTI107250057', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois d''ao-t 2025', 235000, 'H2O PISCINE', 'valide', '2025-07-16T17:22:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('22a20fe7-6606-46db-801c-a64122803869', 'ARTI107250074', 'RSglement des frais de ramassage d''ordures pour le mois de juillet 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-07-16T17:23:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('250db07a-e5a7-4873-a901-dc1505279653', 'ARTI107250073', 'RSglement des frais de ramassage d''ordures pour le mois d''ao-t 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-07-16T17:24:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd461fcb-f26f-45ac-b1dd-5dc40fd9edf6', 'ARTI107250097', 'Renforcement du systSme de sécurité de l''ARTI', 39953639, 'DATACONNECT AFRICA', 'valide', '2025-07-18T04:48:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1f3287d2-ed9a-4352-8dd0-fb692b286b63', 'ARTI107250096', 'Perdiem pour la phase 1 de la campagne de formation et de sensibilisation 2025', 1200000, 'Acteurs externes de l''ARTI', 'valide', '2025-07-18T04:52:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('495d4bf0-fffc-429c-9956-07034b5c1bef', 'ARTI107250095', 'Atelier de sensibilisation et de formation des acteurs du transport Intérieur 2025 Phase 1', 250000, 'Acteurs externes de l''ARTI', 'valide', '2025-07-18T04:53:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2ab769ef-407c-422f-97ec-4eb31f9b762f', 'ARTI107250094', 'Mission de Mà BOKOUA à Abidjan dans le cadre de la phase 1 des ateliers de sensibilisation et de formation des acteurs du transport', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T04:55:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('81549f05-a93d-4da3-9064-dbd79e8ea626', 'ARTI107250093', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T04:57:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0c870186-42f5-4514-b0c7-071313650312', 'ARTI107250092', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T04:58:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b4bc69bd-6e4b-4f9f-b964-f6005caaecc6', 'ARTI107250091', 'Frais de transport du Chargé de Mission de la Direction Générale pour la mission de prospection de l''ARTI à SAN PEDRO', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:00:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('117f5a69-b612-4a11-a999-3e6501ddf1f3', 'ARTI107250090', 'Frais de transport du Directeur Général pour la mission de prospection de l''ARTI à SAN PEDRO', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:02:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bdc5bff9-03cd-4dd1-a868-7cc4fab5af3c', 'ARTI107250089', 'Frais de transport du Conducteur no 1 du Directeur Général pour la mission de prospection de l''ARTI à SAN PEDRO', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:04:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2893d40b-4e20-432f-959b-182dcbbee35d', 'ARTI107250088', 'Frais de transport du Conducteur no 2 du Directeur Général pour la mission de prospection de l''ARTI à SAN PEDRO', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:06:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0b499be3-bc17-49b0-a287-f7b3b6ad68b8', 'ARTI107250087', 'Régularisation - Frais de transport du Sous-Directeur des Affaires Juridiques et des Recours pour la mission de Prospection et de sensibilisation à BOUAFLE', 65000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:07:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('919bcfea-8e0e-4968-bb3d-cc6f112309cf', 'ARTI107250086', 'Note de régularisation - Frais de transport du Sous-Directeur des affaires Juridiques et des Recours pour la mission de Prospection et de sensibilisation dans les localités de BEDIALA et BOUAKE', 85000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-18T05:09:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5513b1e3-0e41-4fff-9401-91e101e765fd', 'ARTI107250085', 'Note complémentaire pour le rechargement des bouquets canal horizon du mois de juillet 2025', 10000, 'CANAL + HORIZON', 'valide', '2025-07-18T05:11:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0095d9a0-c2ac-41dd-9259-4058ed3bb33e', 'ARTI107250100', 'Atelier  de formation et de sensibilisation des acteurs du transport intérieur 2025 phase 1', 200000, 'Acteurs externes de l''ARTI', 'valide', '2025-07-18T09:10:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('56694cb7-0430-41b4-983c-ae3561ab2024', 'ARTI107250099', 'Régularisation_ achat de carburant pour l''alimentation du groupe électrogSne du siSge de l''ARTI', 80000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-07-18T09:13:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('469fb564-0e0e-43a0-881c-3aeca13cf222', 'ARTI107250098', 'Location d''un mini car pour l''enqu^te de satisfaction', 300000, 'SOTRATOURISME', 'valide', '2025-07-18T09:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3f459509-c0b9-4ac5-b1c2-8c725feef038', 'ARTI107250117', 'Production et diffusion du spot agenda des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio YOPOUGON', 115000, 'PRESSES', 'valide', '2025-07-21T12:54:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('35fcac12-33d7-482a-ac76-d3f990ee17ab', 'ARTI107250116', 'Production et diffusion du spot agenda des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio SONGON FM', 120000, 'PRESSES', 'valide', '2025-07-21T12:55:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e6d4f44d-69e6-46fa-8fa7-5328ffe8817e', 'ARTI107250115', 'Production et diffusion du spot agenda des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio COCODY', 150000, 'PRESSES', 'valide', '2025-07-21T12:58:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('487a9bcc-f914-4c8a-9641-bdc3892ae825', 'ARTI107250114', 'Demande d''achat de peinture pour la rénovation de la peinture du garage interne et du bureau de la DGPECRP', 256297, 'MAUVILAC INDUSTRIES AFRICA', 'valide', '2025-07-21T13:00:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e03e3eae-5652-46dd-8713-941272a607b0', 'ARTI107250113', 'Achat de matériaux pour la réalisation des travaux d''étanchéité du siSge de l''ARTI', 256297, 'MAUVILAC INDUSTRIES AFRICA', 'valide', '2025-07-21T13:02:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f96b81f5-11cc-4f56-9241-8f868b9501cb', 'ARTI107250112', 'Achat de gaz et rSglement des frais de main-d''ouvre pour la réalisation des travaux d''étanchéité du siSge de l''ARTI', 210700, 'ETS OUVRIER DIARRA & FONGBE', 'valide', '2025-07-21T13:03:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7454ae18-fa84-4f58-b378-c9318de147f4', 'ARTI107250111', 'Demande d''acquisition d''une boOte à outil pour le siSge de l''ARTI', 69001, 'BERNABE CÔTE D''IVOIRE', 'valide', '2025-07-21T13:04:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65c44047-9129-43d8-a4f8-ea58c5303abb', 'ARTI107250107', 'Mission auprSs du cabinet C5P relative au projet de développement ferroviaire', 2800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-07-21T13:05:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('09bdad9d-e49b-4986-8be6-eaaa497b36a3', 'ARTI107250110', 'TOURN?E-VISITE ET S?ANCE DE TRAVAIL AVEC LES BUREAUX DE L''ARTI YAMOUSSOUKRO ET BOUAK? DU 31 JUILLET 2025 AU 07 AOˆT 2025', 875000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-21T13:06:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fff760fe-d045-4d16-921f-5c65d53cfe0a', 'ARTI107250108', 'Hébergement du Président du Conseil de Régulation lors de sa mission en France auprSs du Cabinet C5P dans le cadre du projet de développement ferroviaire de l''ARTI', 1957048, 'RESIDENCE HOTELIERE O''LORD', 'valide', '2025-07-21T13:07:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bee1f966-bb62-427e-8895-54547e52d5d6', 'ARTI107250109', 'Note de régularisation : Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la participation à la formation de certification des administrateurs des entreprises responsablesà', 3542200, 'EMMA CAB', 'valide', '2025-07-21T13:08:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('60e1adcf-b083-49f7-9684-b4516a3e141a', 'ARTI107250104', 'Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission auprSs de GENETEC relative au développement du projet ferroviaireà', 348594, 'EMMA CAB', 'valide', '2025-07-21T13:09:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('030c0345-9563-49f8-8a8c-c4638dd0fdba', 'ARTI107250103', 'Note de régularisation: Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission auprSs de GENETEC relative au développement du projet ferroviaireà', 7438500, 'EMMA CAB', 'valide', '2025-07-21T13:11:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5a5d1075-049c-4ca8-b23e-ec8318b1a2f7', 'ARTI107250101', 'Paiement de la situation cotisante de l''ARTI à l''IPS-CNAM', 487000, 'CNPS', 'valide', '2025-07-21T13:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('48db5655-21ad-4c08-b514-dcdda4dfe7ac', 'ARTI107250102', 'Demande de révision du véhicule VOLKSWAGEN POLO immatriculé AA-755-HB-01', 133288, 'ATC COMAFRIQUE', 'valide', '2025-07-21T13:13:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6bc4a743-32fa-4277-9f0f-0f1c31158665', 'ARTI107250105', 'Acquisition de fournitures de bureaux pour l''ARTI', 237500, 'YESHI SERVICES', 'valide', '2025-07-21T13:14:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ecbf3933-ba51-46fc-b71b-c12d9d5bb97d', 'ARTI107250106', 'Note complémentaire pour la prise en compte de la TVA facturée par la LIBRAIRIE DE FRANCE GROUPE', 88475, 'LIBRAIRIE DE FRANCE GROUPE', 'valide', '2025-07-21T13:15:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9875e094-9ef4-4cb3-bac6-c9fd67ee0894', 'ARTI107250119', 'Acquisition de dix (10) power bank pour les enqu^tes de satisfaction des usagers du transport intérieuré la vidéo-verbalisation et l''audit à blanc des opérateurs du VTC - Phase 1', 100000, 'TRANSTELECOM OEOS', 'valide', '2025-07-21T13:49:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ba9ca97-c0b0-4762-ad17-6593e92c55e8', 'ARTI107250118', 'Acquisition de quarante (40) chasubles pour les enqu^tes de satisfaction des usagers du transport intérieuré la vidéo-verbalisation et l''audit à blanc des opérateurs du VTC - Phase 1', 156800, 'GROUP CARRE VERT', 'valide', '2025-07-21T13:50:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('93690863-47f8-427f-bee3-d5cb17677ed0', 'ARTI107250122', 'RSglement des frais d''expédition de courrier à la Sous-Préfecture de BADIKAHA', 5000, 'LA POSTE DE COTE DIVOIRE', 'valide', '2025-07-21T16:31:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('28b860fe-609b-4a46-9989-5b2abb1d796e', 'ARTI107250121', 'Remplacement de la note no 439-07-2025 ARTI/DAAF/SDMG/EJJ - Acquisition de tablettes pour les enqu^tes de satisfaction des usagers du transport intérieuré la vidéo-verbalisation et l''audit à blanc des opérateurs du VTC - Phase 1', 2700000, 'TRANSTELECOM OEOS', 'valide', '2025-07-21T16:32:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d452a9a1-33e9-4945-b528-1f702c7e0ef2', 'ARTI107250120', 'Remplacement de la note no 389-07-2025 /ARTI/DAAF/SDMG/EJJ - Acquisition de Tests de Diagnostics Rapide de la dengue pour le service médical de l''ARTI', 80000, 'TECHNOLOGIE MEDICALE', 'valide', '2025-07-21T16:34:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('11b6bc67-14f3-4f4e-981f-b0751b6359ee', 'ARTI107250125', 'Acquisition de trois (03) véhicules SUV', 66000000, 'TLCI SARLU', 'valide', '2025-07-22T05:50:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f6438f01-bd08-4eed-aed3-f3df313e9825', 'ARTI107250124', 'Acquisition d''un véhicule de Direction pour l''ARTI', 40000000, 'CFAO MOBILITY', 'valide', '2025-07-22T05:50:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fea96ccf-8709-4434-abcb-f6b1e87c924d', 'ARTI107250123', 'RAPPORT FINAL DE L''ATELIER DE FORMATION ET DE SENSIBILISATION DES ACTEURS DU TRANSPORT INTERIEUR', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-22T05:51:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5e2a0ed-c7a0-473f-824e-2cd28322c376', 'ARTI107250134', 'Location d''un véhicule avec chauffeur pour la mission préparatoire de l''ARTI à Yamoussoukro et Bouaké', 537496, 'EUROPCAR', 'valide', '2025-07-23T15:43:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('468d5ba3-084d-4877-ae3f-3c417551f5c8', 'ARTI107250133', 'Régularisation - Frais de transport de pour la phase 1 de la campagne de sensibilisation 2025 (KORHOGO et SINEMATIALI)', 155400, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-23T15:44:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21ccfa82-2bd2-4368-bea6-db6d50d02fb1', 'ARTI107250132', 'Constat de malfaØons de travaux de construction de bureaux et de galerie couverte', 176400, 'MAITRE KOUAME N''GUESSAN CHARLES', 'valide', '2025-07-23T15:45:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e07d627-cc25-4d56-8259-8876738c9048', 'ARTI107250131', 'Constat de troubles de voisinage causés par la présence d''arbres dans la cour voisine au siSge de l''ARTI', 180000, 'MAITRE KOUAME N''GUESSAN CHARLES', 'valide', '2025-07-23T15:46:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f33b5a37-6582-48d1-a122-12b3c9fb2053', 'ARTI107250130', 'Participation au RAMES 2025', 500000, 'RAMES2025', 'valide', '2025-07-23T15:47:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cd7e862e-f103-46df-b5d2-b25d84fa6807', 'ARTI107250129', 'Demande d''acquisition d''accessoires de protection de tablettes numériques', 180000, 'AB SOPE NABY', 'valide', '2025-07-23T15:49:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('33794c05-8019-4972-b853-fe3ed9a5c86f', 'ARTI107250128', 'Demande d''autorisation pour la production de brochure de présentation ARTI à', 590000, 'HOODA GRAPHIQUE', 'valide', '2025-07-23T15:50:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('607d6fc6-9401-4b3c-a442-c3fc3b93ed72', 'ARTI107250126', 'Demande de rSglement de la facture SODECI Bouaké pour le mois de juin 2025', 7704, 'SODECI', 'valide', '2025-07-23T15:56:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('323363ff-bbb9-4874-b4f4-31dfcd895318', 'ARTI107250143', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T12:54:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('580b3dad-9748-44a1-b6f9-85d74b9dc0de', 'ARTI107250136', 'Demande de visite technique du véhicule NISSAN PATROL immatriculé 6767 KR 01', 206000, 'SICTA/ SGS', 'valide', '2025-07-24T12:55:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('73b16a08-2616-4295-aa00-b8b9afc53465', 'ARTI107250135', '466-07-2025 ARTI/DAAF/SDMG/EJJ', 112100, 'SGS', 'valide', '2025-07-24T12:56:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4eaa9eb3-005b-4dfd-9fa3-d0be8696ed0c', 'ARTI107250145', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:01:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b4fd5c75-8b91-4cab-9c85-e5cf41a8349e', 'ARTI107250146', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétairesà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:02:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e06b6629-da61-4296-802f-5579a3c722f6', 'ARTI107250144', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:04:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dc5bd40e-4bfb-4584-ad34-8109378c1ec1', 'ARTI107250142', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 9 : Gestions des contratsé conventionsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:05:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3fa664fc-dfbe-45e9-b2e2-d71402cefd23', 'ARTI107250141', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétaires', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:07:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fdcf1137-0054-4ced-b2cc-809478d3c4f4', 'ARTI107250140', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:08:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aa7776f0-f07b-4654-ad18-15538c226ef9', 'ARTI107250139', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:10:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c0b1b7ac-a8b1-4f43-aeb7-d3619ebd895d', 'ARTI107250138', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:11:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('019d8309-d7aa-4deb-b8c5-37094e381abc', 'ARTI107250137', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 9 : Gestions des contratsé conventionsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-24T13:12:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bdca476e-b155-46f0-b86c-f09f5a8e54da', 'ARTI107250168', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 9000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:40:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ce073e64-60d4-466c-a1ba-60adef1cfefe', 'ARTI107250167', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:42:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21a06914-d86e-434e-9bc1-13c3f41ccef4', 'ARTI107250166', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 2500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:44:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c18d4224-37d8-42c0-9afe-3092f455a890', 'ARTI107250164', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 2500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:48:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e01fed6d-0e84-4e3b-9e1f-9e02c52e3dcb', 'ARTI107250162', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 2500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:50:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('253745e3-d28e-4349-b414-aa4ba7785cfc', 'ARTI107250161', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétairesà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:51:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb176864-d4bc-4c84-8b2b-d1e4a3a03cc3', 'ARTI107250160', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:54:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5d0cddfc-8c38-49d2-92d4-61bc94c61dad', 'ARTI107250159', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:56:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9443ea95-d3dc-4a64-86c8-bc1b18d99411', 'ARTI107250158', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:57:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6160a1ce-a851-4dc6-a6ea-11fd7cb05f82', 'ARTI107250157', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 9 : Gestions des contratsé conventions', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T15:59:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('27dcee52-7e13-4fcc-9930-9327d7d1194a', 'ARTI107250156', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétaires', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:00:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf975c6c-0ac7-40d4-9ad5-21886c9f9f47', 'ARTI107250155', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:01:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9c6376c-6a40-41c1-958d-5824e937dd39', 'ARTI107250154', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:03:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9770b1d1-df62-4002-8248-1a78a8cfc2ae', 'ARTI107250153', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:04:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e2efd65c-f493-4ff7-b647-6fdffa85b59f', 'ARTI107250152', 'REGULARISATION-PROJET DIGITALISATION 2025-DCZ sur le Développement du Module 9 : Gestions des contratsé conventionsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:05:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('919dc7c1-a352-4943-b4ff-2751a6443999', 'ARTI107250151', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétairesà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:07:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2b29cdb-3cd9-4fa8-8bb7-42607a5b4b23', 'ARTI107250150', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:08:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6bbb31a6-a1e6-4246-97a9-f6761997112a', 'ARTI107250149', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:09:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b38cefc4-259d-418f-8802-382ea3f75498', 'ARTI107250148', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:11:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f011e166-f9ab-4e71-8079-d5d1c28c4e5d', 'ARTI107250147', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 9 : Gestions des contratsé conventions', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-25T16:12:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a595025d-af98-4868-a93a-fa5abd6736fe', 'ARTI107250181', 'Travaux de dépannage de deux salles d''eaux au siSge de l''ARTI', 14700, 'AFRICA MAINTENANCE SOLUTION', 'valide', '2025-07-27T08:26:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d40487de-57b3-404b-85ac-349ea3c8a26b', 'ARTI107250180', 'Demande d''achat de briquets allume gaz', 23900, 'SOCI?T? DES DEUX PLATEAUX', 'valide', '2025-07-27T08:27:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0aa74e21-4ded-497a-a913-2055f78ef6a9', 'ARTI107250179', 'Demande d''achat d''une fontaine à bonbonne d''eau au siSge de l''ARTI', 68900, 'SOCI?T? DES DEUX PLATEAUX', 'valide', '2025-07-27T08:28:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf27b9cd-23d2-48f2-b12e-96bc0d262ea5', 'ARTI107250178', 'Entretien et nettoyage des pochettes et draps de l''ARTI', 11650, 'ECO-CLAIR SARL', 'valide', '2025-07-27T08:30:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30197f15-5999-493e-a82f-38ac5b5429b6', 'ARTI107250177', 'Remplacement de la batterie du véhicule FORD EXPLORER immatriculé 1415 LJ 01', 220618, 'AFRICAUTO', 'valide', '2025-07-27T08:32:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d1210f97-f124-4d47-9226-b2dc45683cff', 'ARTI107250176', 'RSglement de frais de main-d''ouvre et de petit matériel pour la rénovation de la peinture du garageé de la faØade extérieure et du bureau de la DGPECRP du siSge de l''ARTI', 507640, 'LEDIA', 'valide', '2025-07-27T08:33:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('553463fa-a93e-45a3-ade3-194d8d608309', 'ARTI107250175', 'Réparation de la menuiserie alu au siSge de l''ARTI', 343000, 'ALUMINIUM METALLERIE CONSTRUCTION', 'valide', '2025-07-27T08:35:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('df8b0efc-34b3-449d-8206-fddaa64ba6c2', 'ARTI107250174', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 9 : Gestions des contratsé conventionsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:36:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5ba33dc2-b9df-4f5f-868d-3e1c2b2943af', 'ARTI107250173', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:37:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d7734059-69f4-48cc-8a8e-54d894fb78e9', 'ARTI107250172', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:39:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f7436fd6-8e28-4419-91ad-12b917826a85', 'ARTI107250171', 'REGULARISATION-PROJET DIGITALISATION 2025-DGPEC-RP sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:41:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('823a3340-ef39-4469-b593-52da8434cc50', 'ARTI107250170', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:42:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc53ae7a-77cb-4367-bcf4-a00bb731b4fa', 'ARTI107250169', 'REGULARISATION-PROJET DIGITALISATION 2025-DSESP sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-27T08:44:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e05ecae8-431a-4ac1-8939-dcdb8bc699e3', 'ARTI107250205', 'REGULARISATION-PROJET DIGITALISATION 2025-DSI sur le Développement du Module 3 : Gestion des états d''approvisionnement bancaire et planification des notifications budgétaires', 10000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T04:44:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ddbb8f06-1c88-4aba-a276-5c0cbdd30f71', 'ARTI107250204', 'Participation aux RAMes 2025', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-29T07:24:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5b9301b-8dcc-471e-9cda-0773957f2228', 'ARTI107250203', 'Régularisation - Frais de transport pour la phase 1 de la campagne de sensibilisation 2025 (FRONAN et TAFIR?)', 250800, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-29T07:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('95d7b9af-d4ed-4f52-9521-1a77326bf60b', 'ARTI107250202', 'Régularisation - Demande d''acquisition de boOtiers de chargeurs des tablettes numériques', 180000, 'BRIC A BRAC', 'valide', '2025-07-29T07:30:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ec67f6b9-ebeb-4d78-a421-1d6efaddf99c', 'ARTI107250201', 'Remplacement de la note no 262-05-2025/ARTI/DAAF/SDMG/EJJ - Acquisition de téléphones portables pour le personnel de l''ARTI', 615000, 'TRANSTELECOM OEOS', 'valide', '2025-07-29T07:31:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ce2c8604-832f-470c-aad6-be9d8bb79f1e', 'ARTI107250200', 'RAPPORT FINAL DE L''ATELIER DE FORMATION ET DE SENSIBILISATION DES ACTEURS DU TRANSPORT INTERIEUR', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-29T07:33:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef0a9bc0-71cb-4c67-a08c-0566cc75a6a8', 'ARTI107250199', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétairesà', 11000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:34:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2bf4987d-55fe-4199-86ea-0cabded67441', 'ARTI107250198', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 6000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:36:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a89489ff-289d-4428-8ffb-30abf3fac205', 'ARTI107250197', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 6: Gestion des imputations budgétaires', 7500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:38:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('111fb20f-14b1-4d82-a528-b673c70b7933', 'ARTI107250196', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 3 : Gestion des états d''approvisionnement bancaire et planification des notifications budgétaires', 15000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dac9f1da-bcc7-4f04-8531-861d2b6c22d2', 'ARTI107250195', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 6500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:43:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7d9f92f0-7a4c-44b8-95ae-2d149215857a', 'ARTI107250194', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 12500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T07:47:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98b36a22-dd1b-4688-af6d-b6272fc82961', 'ARTI107250193', 'REGULARISATION-PROJET DIGITALISATION 2025-DAAF sur le Développement du Module 9 : Gestions des contratsé conventionsà', 6500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:47:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('60d6b971-b7fc-456b-9d55-bbc795c0f7aa', 'ARTI107250192', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:48:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ba3293d7-c32b-44a2-9076-f965a8afbbfb', 'ARTI107250191', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:51:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21f4bf23-85c8-42eb-acee-8883a56f62a9', 'ARTI107250190', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétaires', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:52:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('05327014-cdcd-4167-9595-c7ef93a55271', 'ARTI107250189', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 7 : Recherche des dossiers dans les processus de gestionà', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:54:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5daaadf1-8570-4364-9c7a-125743f725ec', 'ARTI107250182', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 6: Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:55:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51a1e7c3-f9a2-45a7-84ac-9fdb14d4823b', 'ARTI107250188', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 2500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:56:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('777e0b67-5e1b-4a29-8968-0c1ae2b0ebb7', 'ARTI107250187', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:58:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('26ee3fd3-acb8-48ca-9b5b-71ce4c99f8cd', 'ARTI107250186', 'REGULARISATION-PROJET DIGITALISATION 2025-DRRN sur le Développement du Module 9 : Gestions des contratsé conventionsà', 6500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T15:59:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3554b26a-8674-4054-980f-e815a7162994', 'ARTI107250185', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 2 : Gestion des états d''exécution-imputation budgétaire', 2500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T16:01:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('85924d13-3ba3-461b-bc7d-95526ce06592', 'ARTI107250184', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T16:02:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8dddd348-3291-4849-8a5a-b3aa1b4c9554', 'ARTI107250183', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur le Développement du Module 4 : Gestion des réaménagements budgétaires et planification des notifications budgétaires', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-07-29T16:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('06d7f61b-effb-4d95-876f-7d84c0c0ea3f', 'ARTI107250207', 'Location de deux véhicules avec chauffeur pour la tournée du Directeur Général à Yamoussoukro et Bouaké', 375000, 'EUROPCAR', 'valide', '2025-07-30T09:33:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('218e8c39-9f0b-4851-8aca-1fa93d59c448', 'ARTI107250206', 'Location de deux véhicules avec chauffeur pour la tournée du Directeur Général à Yamoussoukro et Bouaké', 375000, 'EUROPCAR', 'valide', '2025-07-30T09:34:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a3d2a2c-5283-44aa-a789-4aa52999991c', 'ARTI107250208', 'Demande d''achat de bons-valeurs de carburant', 4000000, 'PETRO IVOIRE', 'valide', '2025-07-30T09:53:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2b9fe3a0-c4c5-40d3-9464-7f07f95a19fe', 'ARTI107250209', 'Demande d''achat de divers articles pour la Direction Générale', 43300, '', 'valide', '2025-07-30T09:55:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0194a2b9-e9e4-423a-b62b-7a68a8a5b402', 'ARTI107250210', 'Rev^tement des locaux du siSge de l''ARTI en alucobond (lot 1)', 8445677, 'JUST HUSS SARL', 'valide', '2025-07-30T09:57:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e6225f6-4903-49ff-8a6a-abbefeab8a1d', 'ARTI107250212', 'Frais de transport du Conducteur no 1 du Directeur Général pour la séance de travail avec les Bureaux Régionaux de l''ARTI à Yamoussoukro et Bouaké', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-30T11:12:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('961230d9-cc97-431c-8ffe-24da223f2a5f', 'ARTI107250213', 'Frais de transport du Directeur Général pour la séance de travail avec les Bureaux Régionaux de l''ARTI à Yamoussoukro et Bouaké', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-30T11:15:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d5a4401e-2a01-4217-8d98-3ed7455fea5a', 'ARTI107250211', 'Frais de transport du Conducteur no 2 du Directeur Général pour la séance de travail avec les Bureaux Régionaux de l''ARTI à Yamoussoukro et Bouaké', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-07-30T11:17:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('82c1521f-ee53-40b2-9482-def7d292952d', 'ARTI108250007', 'Séance de travail dans le bureau régional de Bouaké', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-01T12:16:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9aabc6b8-8736-4f48-9e9e-9b52e383f12c', 'ARTI108250005', 'Demande paiement des droits du Sous-Directeur des Etudes et de la Prospectiveà', 12907045, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-01T12:18:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5f47752-efdc-4b80-9e34-1dc1d5ec8558', 'ARTI108250009', 'Confection de cachets tampons pour l''ARTI', 34300, 'YESHI SERVICES', 'valide', '2025-08-02T23:08:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a1d2d47-8b36-44e4-9b0a-5a075a0b52e4', 'ARTI108250008', 'COURSES ADMINISTRATIVES ú LA PR?FECTURE D''AGBOVILLE', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:09:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b2a4ed26-60b7-4e3d-ad5a-c1c137379d57', 'ARTI108250006', 'FRAIS DE TRANSPORT ADMINISTRATIF(TAXI) DU 01 JUIllET 2025 AU 31 JUILLET 2025', 229900, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:11:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9087131d-81c5-47da-8c43-51b3cffd6715', 'ARTI108250004', 'REMBOURSEMENT DES FRAIS DE RECEPTION MISSION AUPROS DE GENETEC RELATIVE AU D?VELOPPEMENT DU PROJET FERROVIAIRE DU 23 AU 30 JUILLET 2025', 2877308, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:12:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9dfc9d71-c1fb-4912-b432-3801b0d93601', 'ARTI108250003', 'Frais de transport du Chargé de Mission de la Direction Générale pour la séance de travail avec les Bureaux Régionaux de l''ARTI à Yamoussoukro et Bouaké', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:13:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6b18ef89-c91d-4974-9ddd-bd666018cbd2', 'ARTI108250002', 'Séance de travail dans le bureau régional de Bouaké', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:15:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cda1ab3a-4b7a-426a-bc45-7e6049bd7f15', 'ARTI108250001', 'Acquisition d''un fauteuil Directeur pour la Directrice des Recoursé de la Réglementation et des Normes', 486160, 'SPIRAL OFFICE & HOME', 'valide', '2025-08-02T23:16:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('99bca1d3-bb1f-45f8-9c19-58bc5dedc70d', 'ARTI107250226', 'Demande de raccordement HTAS d''une puissance de 100 KW au siSge de l''ARTIà', 7124701, 'GPE', 'valide', '2025-08-02T23:17:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1a751819-cadd-458c-8c46-fcb633758fac', 'ARTI107250227', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 5 : Gestion des notes et expressions des besoinsà', 2000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-08-02T23:19:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('af33999a-d224-44bd-93ac-1dd397faf775', 'ARTI107250225', 'MISSION DE PROSPECTION DE L''ARTI ú SAN PEDRO DU 17 JUILLET 2025 AU 19 JUILLET 2025', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:20:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c23e266-9cfa-475a-adf7-670e27b39cdc', 'ARTI107250224', 'MISSION DE PROSPECTION DE L''ARTI ú SAN PEDRO DU 17 JUILLET 2025 AU 19 JUILLET 2025', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:22:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c032eae-aa99-4ef3-884c-a623f4b219a1', 'ARTI107250223', 'MISSION DE PROSPECTION DE L''ARTI ú SAN PEDRO DU 17 JUILLET 2025 AU 19 JUILLET 2025', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:23:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb5a318a-cebe-4534-85e7-b12c76ae4081', 'ARTI107250222', 'MISSION DE PROSPECTION DE L''ARTI ú SAN PEDRO DU 17 JUILLET 2025 AU 19 JUILLET 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:24:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('92fadf89-701d-423c-91f8-48256351dd58', 'ARTI107250221', 'MISSION DE PROSPECTION DE L''ARTI ú SAN PEDRO DU 17 JUILLET 2025 AU 19 JUILLET 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-02T23:26:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b1894a01-febd-4aef-934d-01464396b2ea', 'ARTI107250220', 'Formation animée par le Cabinet AFCCI sur le thSme r Gestion des Risques Cyber et Conformité _', 3371200, 'AFCCI', 'valide', '2025-08-02T23:27:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6b70745-ce77-475c-a09d-89b643695fb1', 'ARTI107250219', 'Demande de production de supports sécurisés', 7080000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-08-02T23:29:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e94369ed-c242-45f3-9b11-55b818e7fd68', 'ARTI107250218', 'Note de régularisation (remplacement du dossier no ARTI004250133) - Organisation de l''atelier de travail du Groupe de Travail (GT 1) du Comité Technique (CT 21)', 5218500, 'ESPACE YEMAD', 'valide', '2025-08-02T23:30:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('449b0275-8b27-4c37-9831-42a5e79e9017', 'ARTI107250217', 'Demande d''impression de Newsletter spéciale anniversaire de l''ARTI', 814200, 'ENTREPRISE GCIS', 'valide', '2025-08-02T23:31:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d7217446-cc48-4db1-84dd-5a6c7dbdc606', 'ARTI107250216', 'Réalisation de la Newsletter spéciale anniversaire de l''ARTI', 2500000, 'AGENCE RCG', 'valide', '2025-08-02T23:33:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31461633-4f19-438c-b7d1-7aa94844aac7', 'ARTI107250215', 'Réalisation de spot vidéo de présentation de l''ARTI', 1534000, 'DMA INTERTAINMENT', 'valide', '2025-08-02T23:34:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc470f09-fdf0-4f4f-bba0-e48b1405a74b', 'ARTI107250214', 'Cocktail pour la phase 1 de la campagne de sensibilisation des acteurs du transport intérieur', 1960000, 'COMPLEXE HOTELIER TAPIS ROUGE LA FONTAINE', 'valide', '2025-08-02T23:35:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2cd49e92-6bcd-480e-81d9-60e9a5eab74e', 'ARTI108250013', '480-08-2025 ARTI/DAAF/SDMG/EJJ', 96375, '', 'valide', '2025-08-05T05:09:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('453dc9d6-d956-442c-90db-3f43a350c939', 'ARTI108250011', 'Demande de rSglement de la facture CIE du Bureau Régional de Bouaké pour la période de mai à juillet 2025', 80700, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-08-05T05:10:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('11baa761-34bd-4d74-b9c3-2cb6239a5c2b', 'ARTI108250010', 'Dépannage du climatiseur de la salle informatique de l''ARTI', 24500, 'AB SERVICE', 'valide', '2025-08-05T05:12:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('edbe2c1f-a4ca-4933-8c52-607bd5f8b798', 'ARTI108250012', 'Sponsorisation des réseaux sociaux de l''ARTI', 200000, 'SPONSORING RESEAUX SOCIAUX ARTI', 'valide', '2025-08-05T05:13:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d8de71ff-76e1-4682-a1a1-7a9306b44596', 'ARTI108250014', 'FRAIS BANCAIRE DU MOIS DE JUILLET 2025', 549879, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-08-05T09:05:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d170981-4111-4b6d-a37a-8c3babc71a7b', 'ARTI108250017', 'RSglement de la facture Orange CI pour la consommation mobile du mois de juillet 2025', 1144751, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-08-05T09:56:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65260786-3389-40b7-87b9-727d565ba7e3', 'ARTI108250016', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois d''ao-t 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-08-05T09:59:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('04261abe-aa19-448e-aabd-814e4eb223f3', 'ARTI108250015', 'Jetons de présence de la deuxiSme réunion du Conseil de Régulation de l''ARTI au titre de l''année 2025é le 14 aoutà', 3500000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-08-05T10:00:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d33fe61c-482c-4f2a-b011-c32cb5729c9d', 'ARTI108250028', 'Régularisation - Demande d''achat de carburant pour le groupe électrogSne de l''ARTI', 56000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-08-07T21:46:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5a7b0f2-0996-4bf6-b734-cb0a05b5fcfd', 'ARTI108250026', 'Remplacement de canon de serrure pour caisson mobile', 17700, 'SPIRAL OFFICE & HOME', 'valide', '2025-08-07T21:47:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fade045d-f214-473b-b032-663c339255dd', 'ARTI108250018', 'REGULARISATION-PROJET DIGITALISATION 2025-DCSTI sur le Développement du Module 1 : Gestion de l''exécution budgétaires des projetsé des directions et du cadre de performance', 3000000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-08-07T21:48:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6f262eda-49bc-46ac-b4b8-aae1eac50a3c', 'ARTI108250022', '5Sme anniversaire de l''ARTI - Demande de lavage automobile pour cadeau tombola', 30000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-08-07T21:50:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65bc63a3-5dde-4699-8b46-28957ea29abf', 'ARTI108250027', 'Reprise de la note rejetée no 400-07-2025 ARTI/DAAF/SDMG/EJJ - Location logistique pour la phase 1 de la campagne de sensibilisation 2025', 880000, 'FOURNISSEURS DIVERS', 'valide', '2025-08-07T21:52:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9159762f-7c8e-4d2f-b420-78743542f40e', 'ARTI108250025', '5Sme anniversaire de l''ARTI - Demande de réservation de chambre pour cadeau tombola', 180000, 'D''KHAN RESORT', 'valide', '2025-08-07T21:54:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e7a2db7-ecbe-4baf-ade1-a000b9badfcf', 'ARTI108250024', '5Sme anniversaire de l''ARTI - Demande d''achat d''un siSge auto enfant pour cadeau tombola', 145000, 'CHICCO', 'valide', '2025-08-07T21:55:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d0ccd431-a38c-40ec-946f-eb227ec342c1', 'ARTI108250021', '5Sme anniversaire de l''ARTI - Demande de prise en charge d''une visite technique pour cadeau tombola', 65100, 'SGS', 'valide', '2025-08-07T21:57:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('67e2fe02-a92f-4164-a70f-42c4ae9c0e94', 'ARTI108250020', 'Déjeuner d''affaires de la Direction Générale de l''ARTI avec des magistrats à la CASA Ekwa', 285000, 'CASA Ekwa', 'valide', '2025-08-07T21:59:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a91ce7c-bd91-41b0-8203-b80ca21ee1b5', 'ARTI108250023', '5Sme anniversaire de l''ARTI - Demande d''achat d''un kit de premiers secours pour cadeau tombola', 51450, 'MR BRICOLAGE', 'valide', '2025-08-07T22:01:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a9fb169-f294-4829-a10a-d0804e8135dd', 'ARTI108250019', 'Rechargement des bonbonnes d''eau pour le mois de juillet 2025', 80000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-08-07T22:02:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e646fdaa-8007-4d2b-b0ec-c8e6b1b11ca9', 'ARTI108250031', 'Frais d''établissement du certificat de localisation du siSge de l''ARTI', 350000, 'CABINET DE GEOMETRE EXPERT CISSE ADAMA', 'valide', '2025-08-08T18:18:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9f3a6194-4c8a-49a2-bab6-5ee4036b651d', 'ARTI108250029', 'Demande d''achat de masques de protection respiratoire (cache-nez)', 25000, 'FOURNISSEURS DIVERS', 'valide', '2025-08-08T18:21:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7d3896a4-e9af-45d6-9ceb-119f7c46688a', 'ARTI108250042', 'Régularisation de la couverture médiatique des enqu^tes de satisfaction par la radio Treichville -Phase 1', 40000, 'PRESSES', 'valide', '2025-08-13T13:35:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21f0e720-e049-48cb-be31-71bcb424b482', 'ARTI108250041', 'Remplacement de la note no 450-07-2025 /ARTI/DAAF/SDMG/EJJ - Achat de gaz et rSglement des frais de main-d''ouvre pour la réalisation des travaux d''étanchéité du siSge de l''ARTI', 210700, 'ETS OUVRIER DIARRA & FONGBE', 'valide', '2025-08-13T13:37:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1c3f82f2-2a58-4983-a525-6098880ca2ea', 'ARTI108250040', 'Remplacement de la note no 451-07-2025 /ARTI/DAAF/SDMG/EJJ - Achat de matériaux pour la réalisation des travaux d''étanchéité du siSge de l''ARTI', 404118, 'BERNABE CÔTE D''IVOIRE', 'valide', '2025-08-13T13:39:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70b72104-db09-44a7-a7d2-01a29be563f3', 'ARTI108250039', 'Demande de remplacement d''un (01) pneu avant du véhicule VOLKSWAGEN VIRTUS immatriculé AA-571-FZ-01', 94564, 'CACOMIAF', 'valide', '2025-08-13T13:41:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('680b25d3-4b7d-4673-88b3-0428822638e5', 'ARTI108250038', 'Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de juillet 2025', 415918, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-08-13T13:45:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5345c5d1-f0aa-43b4-8925-53ff8d7fc0c0', 'ARTI108250036', 'Déclaration CMU 2020', 101000, 'CNPS', 'valide', '2025-08-13T13:47:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('97851085-bd2c-49af-9fcc-3b8364c0a98f', 'ARTI108250037', 'Régularisation du solde de tout compte de l''ex-Sous-directeur des ?tudes et de la Prospective - Montant omis lors de la liquidation', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-13T13:49:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2274c687-6ad5-4725-80df-cecc1c007748', 'ARTI108250035', 'Déclaration CMU 2021', 252000, 'CNPS', 'valide', '2025-08-13T13:51:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d1b1485c-a70c-4994-9794-63dc4766be1b', 'ARTI108250033', 'Achat de compositions florales pour le mois de juillet 2025 (FLEUR DE JONQUILLE)', 60000, 'FLEUR DE JONQUILLE', 'valide', '2025-08-13T13:52:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aa5594e9-d528-43db-b24b-3c59202fc47c', 'ARTI108250034', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFETAIRES POUR LE MOIS DE JUILLET 2025 ( PPSSI)', 1157594, 'DGI', 'valide', '2025-08-13T13:54:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4cdd62a0-5064-41ae-9290-f55d0301bd85', 'ARTI108250032', 'Achat de fournitures alimentaires pour la tenue du Conseil de Régulation du 14 ao-t 2025', 88675, '', 'valide', '2025-08-13T13:56:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('000ccb79-dfd5-4ec3-a788-2f23e2ebb735', 'ARTI108250049', 'Acquisition d''une table pour la cantine du siSge de l''ARTI', 129675, 'SOCIETE ORCA DECO', 'valide', '2025-08-18T08:10:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a5b01ff3-4142-4da5-9bb2-3d6a7f0e2ffd', 'ARTI108250048', 'Achat d''un billet d''avion dans le cadre de la mission du Directeur Général en France du 22 au 31 ao-t 2025', 5066000, 'AIR France', 'valide', '2025-08-18T08:17:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('274c4519-67f2-4d95-a178-e5bea8af0675', 'ARTI108250046', 'Acquisition de lampes de tables pour les bureaux du siSge de l''ARTI', 102375, 'SOCIETE ORCA DECO', 'valide', '2025-08-18T08:19:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d0389a5b-5721-4d32-9ec8-538b72253053', 'ARTI108250047', 'REGULARISATION  FRAIS D''ACHAT DE CREDIT DE COMMUNICATION DANS LE CADRE DES ACTIVITES DE L''ARTI DU 1er AU 31 JUILLET 2025', 15000, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-08-18T08:22:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e3803cf8-5cf8-4410-a2e1-5a346e83973c', 'ARTI108250045', 'Subvention des tenues du personnel féminin de l''ARTI pour la célébration des 5 ans de l''ARTI', 900000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-18T08:24:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('07dd9153-997c-40a3-afdc-215203251e43', 'ARTI108250044', 'Demande de révision du véhicule SUZUKI VITARA immatriculé AA-897-FS- 01', 89100, 'SOCIDA', 'valide', '2025-08-18T08:25:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44c7eef3-7cd5-4fd5-a859-29a0441b1cdc', 'ARTI108250043', 'Pré visite du véhicule NISSAN PATROL immatriculé 6767 KR 01', 35000, 'GROUPE FSA', 'valide', '2025-08-18T08:27:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('966136f0-ed7a-4a59-b185-a304d9bfcc57', 'ARTI108250053', 'REGULARISATION DES FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI -JUILLET 2025', 22680, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-18T14:55:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3803a817-e085-49d2-9890-37b4dcfb959e', 'ARTI108250052', 'Achat de piles de télécommande de type AAA', 24000, 'SOCIETE ORCA DECO', 'valide', '2025-08-18T14:56:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('54677a4d-b6ea-4121-b9ac-4e862f304598', 'ARTI108250051', 'FORMATION RELATIVE AUX SUPERVISEURS POUR L''ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-18T14:58:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6b88f56-714e-459b-99dc-0e2ccabc102d', 'ARTI108250050', 'FORMATION RELATIVE AUX SUPERVISEURS POUR L''ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-18T14:59:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e704a5ab-0f40-4e7e-82c3-fbad701b2ae5', 'ARTI108250055', 'Aménagement extérieur du siSge de l''ARTI', 9448260, '2MTRADING', 'valide', '2025-08-18T21:59:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('61358695-2cb1-4a49-91ec-c42488031e8d', 'ARTI108250054', 'Frais de retrait et d''authentification du ProcSs-Verbal (PV) de constat de l''accident du véhicule FORD EXPLORER immatriculé 3945 LJ 01', 15000, 'TRACTAFRIC MOTORS COTE D''IVOIRE', 'valide', '2025-08-18T22:01:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e62a8c5-58d6-452d-b916-d4991be521b5', 'ARTI108250063', 'Réparation du véhicule MITSUBISHI immatriculé 17 KB 01', 205000, 'CAM-SERVICES', 'valide', '2025-08-19T22:26:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('78c6a00b-f63d-4867-9572-4335e1dc8c4a', 'ARTI108250062', 'Frais de transport du Responsable du Bureau Régional de Yamoussoukro relatifs à la formation des superviseurs pour l''enqu^te de satisfaction des usagers du Transport Intérieur', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-19T22:27:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('019da2e7-8b8a-446d-bacc-b48bf9d5f0b3', 'ARTI108250061', 'Frais de transport du Chef de Service de la Surveillance du Transport Intérieur relatifs à la formation des superviseurs pour l''enqu^te de satisfaction des usagers du Transport Intérieur', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-19T22:29:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b1c9b5a0-1859-4eb1-8a97-ba1f0e18a72b', 'ARTI108250058', 'Demande d''achat de bons-valeurs de carburant', 3000000, 'PETRO IVOIRE', 'valide', '2025-08-19T22:31:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('86904e56-8da4-4a65-a432-1169a4caf3f1', 'ARTI108250056', 'Achat de compositions florales pour le mois de juillet 2025 (FLOREAL)', 600000, 'Floréal', 'valide', '2025-08-19T22:33:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cb9e8a0c-8ab9-42eb-b8d1-c2e5a9c9ae0d', 'ARTI108250057', 'Demande de visite technique du véhicule FORD RANGER immatriculé 4327 KS 01', 112100, 'SGS', 'valide', '2025-08-19T22:35:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('995e9e31-2296-4b72-9ad0-773e637d8af6', 'ARTI108250060', '5Sme anniversaire de l''ARTI - Demande d''achat d''un kit de confort pour longs trajets pour cadeau tombola', 12000, 'JUMIA CIV', 'valide', '2025-08-19T22:37:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('763f851e-4382-49db-98d5-b8d2ad2c80a2', 'ARTI108250059', 'Remplacement de la note rejetée no 318-06-2025 ARTI/DAAF/SDMG/EJJ - Réparation du véhicule SUZUKI VITARA immatriculé AA-897-FS 01', 169249, 'SOCIDA', 'valide', '2025-08-19T22:38:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0e9aff54-b902-4a15-af22-964bfcad23bc', 'ARTI108250078', 'Situation des honoraires des médecins du mois d''ao-t 2025', 1540000, 'MEDECINE DU TRAVAIL', 'valide', '2025-08-20T15:17:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c80b1820-881f-4bcc-91d0-eaae471f8e83', 'ARTI108250077', 'PremiSre vague d''impression sur les enveloppes pour la célébration des cinq (05) ans de l''ARTI', 47200, 'HOODA GRAPHIQUE', 'valide', '2025-08-20T15:21:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('54a7e31e-3714-48d9-a358-1ecf463c6af8', 'ARTI108250079', 'Dépôt de courriers', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T15:23:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('42e482e3-1189-42d1-9305-12ff5c1d7b99', 'ARTI108250080', 'Dépôt de courriers', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T15:24:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc673898-7a1a-4ed4-9a67-30cd7c43407a', 'ARTI108250081', 'Demande de révision du véhicule Volkswagen VIRTUS immatriculé AA-746-FX- 01', 204843, 'ATC COMAFRIQUE', 'valide', '2025-08-20T15:26:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d3134b5c-d37d-4eaa-abab-ba663146ae09', 'ARTI108250074', 'REGULARISATION DE LA NOTE DE FRAIS SUR LA CONVENTION DE PRET POUR L''ACQUISITION DU SIEGE SOCIAL DE L''ARTIà', 45866000, 'ETUDE DE MAITRE COULIBALY YOH KHADIDIA NOURA', 'valide', '2025-08-20T15:27:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b86d75d0-db71-4390-b06f-3f660b5711b7', 'ARTI108250076', 'Achat de trois (03) paquets d''enveloppes pour la célébration des cinq (05) ans de l''ARTI', 13275, 'PAPIGRAPH CI', 'valide', '2025-08-20T15:29:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('896671d1-a5a1-4c7a-8a55-27ff9b287069', 'ARTI108250075', 'Achat d''un (01) paquet d''enveloppes pour la célébration des cinq (05) ans de l''ARTI', 7257, '', 'valide', '2025-08-20T15:30:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5e3d934-2469-4367-9b46-1db5bcadc8cf', 'ARTI108250073', 'Situation des indemnités des stagiaires du mois d''ao-t 2025', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T15:32:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('35acc124-87a1-4d49-b9b8-86ae5cc6a7f4', 'ARTI108250072', 'Situation des honoraires des gendarmes du mois d''ao-t 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-08-20T15:34:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d27305fb-ab56-47d7-9337-454a881e2e4c', 'ARTI108250071', 'Situation Cotisation CMU du mois d''ao-t 2025', 50000, 'CNPS', 'valide', '2025-08-20T15:35:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e933749-b2d3-44a5-a378-e8eba9bb7bc1', 'ARTI108250070', 'Situation Cotisation CNPS du mois d''ao-t 2025', 10606584, 'CNPS', 'valide', '2025-08-20T15:40:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('968fa05c-8cff-4a98-995e-8edd0825cfcd', 'ARTI108250082', 'Demande de révision du véhicule VOLKSWAGEN VIRTUS immatriculé AA-494-QY-01', 159343, 'ATC COMAFRIQUE', 'valide', '2025-08-20T15:44:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a5f76670-2cc1-4952-bbd9-7aa8ccf4f554', 'ARTI108250069', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois d''ao-t 2025', 511213, 'DGI', 'valide', '2025-08-20T15:51:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a6444ef-84ed-4bcc-9fd2-f61c736c2c2e', 'ARTI108250083', 'Demande de rSglement de la facture SODECI Bouaké pour le mois de juillet 2025', 5183, 'SODECI', 'valide', '2025-08-20T15:52:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8f5db4be-ac41-4218-8c19-2b601c0abd5a', 'ARTI108250068', 'Situation de l''Impôt sur les Salaires (IS) du mois d''ao-t 2025', 19402831, 'DGI', 'valide', '2025-08-20T15:54:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('46d3ae28-dc10-409f-ad9b-804175b16766', 'ARTI108250067', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois d''ao-t 2025', 340807, 'DGI', 'valide', '2025-08-20T15:57:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c6f1dcff-cb38-4720-bccb-6ee740a3c3a7', 'ARTI108250084', 'Frais de transport du Responsable du Bureau Régional du District Autonome de Yamoussoukro pour la transmission de courriers dans les localités de l''intérieur', 80000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T15:58:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8116b29-8605-4ebf-ae6f-e6f68469b1c1', 'ARTI108250064', 'Situation des indemnités de la DRRN du mois d''ao-t 2025', 2000000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T16:00:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('98cac7f1-7ba4-4890-b81e-2cf6a21238ae', 'ARTI108250066', 'Situation impôt retenu à la source du mois d''ao-t 2025', 319459, 'DGI', 'valide', '2025-08-20T16:02:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ec78193-6ca9-485d-8d27-3057a5bd7dc1', 'ARTI108250065', 'Situation du salaire et appointement du mois d''ao-t 2025', 67656075, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-20T16:04:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('36eeacf1-a20d-428c-b76c-e26c08054945', 'ARTI108250086', 'Expédition de courriers dans la ville de Yamoussoukro', 3000, 'LA POSTE DE COTE DIVOIRE', 'valide', '2025-08-21T02:18:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a9e3398-62a5-4dc1-a53c-d7992f7a47fb', 'ARTI108250085', 'Location de véhicule pour la transmission de courrier dans les villes d''Abengourou et de Bondoukou', 235200, 'CI2T & COMPAGNY', 'valide', '2025-08-21T02:20:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e11194a2-8461-4055-a118-4426469e9048', 'ARTI108250103', 'Frais de transport du Directeur du SystSme d''Information pour la participation à des obsSques', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:34:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('69949fce-4907-4745-b791-1a68d6fafc46', 'ARTI108250104', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:35:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f9de3bae-b0ff-44ac-b9a8-e1bb50440530', 'ARTI108250102', 'Frais de transport du Sous-Directeur des Affaires Juridiques et des Recours pour la participation à des obsSques', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:36:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2abc79bc-2c61-4bd2-9f07-ebb2258d109d', 'ARTI108250101', 'Frais de transport du Chef de Service de la Surveillance du Transport Intérieur pour la participation à des obsSques', 35000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:39:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f657d030-ceb9-48a9-ae6a-34b2ba4af9ba', 'ARTI108250100', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 140000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:41:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5059270-0613-4a89-b8ae-9236fb1ed0db', 'ARTI108250099', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:42:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2bc83786-d508-4786-a873-2eed97dbf6c2', 'ARTI108250098', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:44:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('168ff072-d564-44e5-9676-766e3d59648e', 'ARTI108250097', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T09:50:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f722e6ef-830a-4d78-af4b-be8a0d7180d6', 'ARTI108250105', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T10:00:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('48a609ce-2155-4c0b-b3df-227c66767d19', 'ARTI108250106', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-22T10:03:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('87c7e466-e1cb-4cbe-b755-83c058d12507', 'ARTI108250109', 'Représentation_ARTI_Tiébissou', 775000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:41:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('25b7810e-e1ca-4ec6-8e2f-871fe7b1cdbb', 'ARTI108250108', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:42:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('88e97893-3701-4e00-976d-01f326c611a2', 'ARTI108250107', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 140000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:44:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e1fc4b53-cdac-41c0-bea0-4ae7ef7870bf', 'ARTI108250087', 'Demande de paiement de la facture CIE (tension no 144) du siSge de l''ARTI pour la période du 04/06/2025 au 04/08/2025', 1366980, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-08-23T08:45:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a6d8c33-4441-4cb3-b926-0978b7403abe', 'ARTI108250096', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:50:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a2e97fd2-cf06-4f88-934b-29baf16d63c3', 'ARTI108250095', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 350000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:51:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b28eb68-dc2e-4ac0-91b5-0ae37e9e42a3', 'ARTI108250094', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:52:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ed498122-e7d5-4e2f-977a-e6ad29ab29f3', 'ARTI108250093', 'ENQUOTE DE SATISFACTION DES USAGERS DU TRANSPORT INT?RIEUR PHASE 2', 525000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-23T08:54:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1eb7b186-4875-40eb-b989-18421a7d4a20', 'ARTI108250092', 'Acquisition de gadgets de communication VIP pour la célébration du cinquiSme (5Sme) anniversaire de l''ARTI _ LOT 1 (2BPUB)', 11564000, '2BPUB', 'valide', '2025-08-23T08:56:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70e0a720-16ab-4470-a404-35340fdd96be', 'ARTI108250091', 'Acquisition de gadgets de communication VIP pour la célébration du cinquiSme (5Sme) anniversaire de l''ARTI _ LOT 4 : Bloc Note VIP (BCOM)', 2352000, 'B COM SARL', 'valide', '2025-08-23T09:06:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f73626a5-e8b1-4e08-bd02-9e382a510687', 'ARTI108250090', 'Acquisition de gadgets de communication VIP pour la célébration du cinquiSme (5Sme) anniversaire de l''ARTI _ LOT 3 : Portes- cartes VIP (WINCOM)', 1652000, 'WINCOM GROUP', 'valide', '2025-08-23T09:09:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58b0dc13-66ba-4dac-9cb7-c1f533e0f1dc', 'ARTI108250089', 'Proposition de modernisation technologique de la DSI par l''Intelligence Artificielle', 3384000, 'CURSOR-CLAUD MAX-NEON AI', 'valide', '2025-08-23T09:10:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('24e038c3-3f7c-42e9-b38a-288fc173971f', 'ARTI108250088', 'Reprise de la note rejetée no 505-08-2025 ARTI/DAAF/SDMG/EJJ - Demande de paiement de la facture Orange CI pour la consommation réseau fixe du mois de juillet 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-08-23T09:12:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9ba00a80-71c7-44ae-b56e-55b07b211602', 'ARTI108250122', 'Acquisition de deux (02) tables de bureaux triangles', 3517344, 'SPIRAL OFFICE & HOME', 'valide', '2025-08-25T17:36:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1009d8e7-0ea4-4d24-a252-cb9a51f93df0', 'ARTI108250121', 'Expédition de courriers de remerciements à l''intérieur du pays', 15000, 'LA POSTE DE COTE DIVOIRE', 'valide', '2025-08-25T17:37:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3c48b7d4-46f4-4a41-acab-4da4777892e3', 'ARTI108250120', 'Remplacement de la note rejetée No 257-05-2025 ARTI/DAAF/SDMG/EJJ Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r SystSme comptable et fiscal des entités à but non lucratif (SYCEBNL)', 5902050, 'ESPACE YEMAD', 'valide', '2025-08-25T17:38:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d196e61d-ffe1-4c25-832c-3a9a23981480', 'ARTI108250119', 'Entretien et nettoyage des pochettes et chasubles de l''ARTI', 63900, 'ECO-CLAIR SARL', 'valide', '2025-08-25T17:40:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a3b58b2-cf2d-4e9e-b4b6-83ea146d1037', 'ARTI108250118', 'Régularisation-Situation des honoraires des médecins du mois de juillet 2025', 1040000, 'MEDECINE DU TRAVAIL', 'valide', '2025-08-25T17:41:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8110c3e0-608c-4679-9bc8-790dce243552', 'ARTI108250117', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio AWALESSE (GAGNOA FM)', 90000, 'PRESSES RADIO', 'valide', '2025-08-25T17:42:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a6af737b-ed19-4ffe-b56e-d2a5984f45bf', 'ARTI108250116', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio Communale de Yamoussoukro (La Voix des Lacs)', 115000, 'PRESSES', 'valide', '2025-08-25T17:47:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f00583fd-0c78-4c0d-930e-1024f63c45a8', 'ARTI108250111', 'Acquisition de combinés téléphoniques', 370000, 'HORIZON TECHNOLOGIES', 'valide', '2025-08-25T17:49:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('00ea1f83-ac25-4901-ad71-2502c5f071cc', 'ARTI108250110', 'Acquisition de connecteurs HDMI', 120000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-08-25T17:51:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('da15c15d-a157-4c88-9880-b4e4f74ceb85', 'ARTI108250112', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio Agnia FM (ABENGOUROU)', 160000, 'PRESSES', 'valide', '2025-08-25T17:54:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f3cc93fe-b7cd-48af-9907-f744fbc6f7b3', 'ARTI108250113', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio Zanzan (BONDOUKOU)', 100000, 'PRESSES', 'valide', '2025-08-25T17:57:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('47eaab68-6d14-47e5-93aa-054a443b398b', 'ARTI108250115', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la RADIO SUD BANDAMA (DIVO)', 100000, 'PRESSES', 'valide', '2025-08-25T17:58:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('feec221f-9761-4b64-a839-19501022e9e2', 'ARTI108250114', 'Production et diffusion du spot agenda de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur sur la Radio Saphir (BOUAKE)', 110000, 'PRESSES', 'valide', '2025-08-25T18:00:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c8650e50-165d-477a-9ba3-b5c9cff5b1fa', 'ARTI108250123', 'Decoration', 198940, 'MOFVAK SERVICES', 'valide', '2025-08-25T18:03:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4855916a-ccce-4d1e-a068-45ad1ac24025', 'ARTI108250129', 'Achat et impression sur les enveloppes pour la célébration des cinq (05) ans de l''ARTI', 231280, 'HOODA GRAPHIQUE', 'valide', '2025-08-26T18:19:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('555b36f6-1598-4122-b284-39a42fb1928b', 'ARTI108250128', 'Remplacement de la note rejetée No 260-05-2025 ARTI/DAAF/SDMG/EJJ Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r Comprendre l''annexe fiscale 2025 _ à l''Espace YEMAD du 24 au 26 mars', 5902050, 'ESPACE YEMAD', 'valide', '2025-08-26T18:21:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('71a492f8-5b54-4b78-9d9e-af95dc9ab003', 'ARTI108250127', 'Acquisition de gadgets de communication pour la phase 2 de l''enqu^te de satisfaction - LOT 1 (2B PUB)', 1568928, '2BPUB', 'valide', '2025-08-26T18:23:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('817b487e-1cd4-433f-b246-7c70a61a4c92', 'ARTI108250126', 'Acquisition de gadgets de communication pour la phase 2 de l''enqu^te de satisfaction - LOT 2 (GROUP CARR? VERT)', 5328750, 'GROUP CARRE VERT', 'valide', '2025-08-26T18:26:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6ad3fac0-62f3-423e-9113-a33c00db22e3', 'ARTI108250125', 'Acquisition de gadgets de communication pour la phase 2 de l''enqu^te de satisfaction - LOT 3 (HOODA GRAPHICS)', 348690, 'HOODA GRAPHIQUE', 'valide', '2025-08-26T18:28:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4bb8f8a6-038f-4d8e-a644-5d886bec77cb', 'ARTI108250124', 'Acquisition de chasubles pour la phase 2 de l''enqu^te de satisfaction', 58800, 'GROUP CARRE VERT', 'valide', '2025-08-26T18:31:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d72c5d0b-f721-41de-801d-21850e1bddb7', 'ARTI108250134', 'Acquisition de brochures de présentation pour la phase 2 de l''enqu^te de satisfaction - (HOODA GRAPHICS)', 1026600, 'HOODA GRAPHIQUE', 'valide', '2025-08-27T05:37:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0ce3854f-f395-462a-8352-eb525d839786', 'ARTI108250133', 'REGULARISATION-PROJET DIGITALISATION 2025-DQ sur Module 6 : Gestion des imputations budgétaires', 1500000, 'GROUPEMENT CYPHER GLOBAL-ISC-DEVIN', 'valide', '2025-08-27T05:39:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3529ea68-3b05-4f4d-bfdb-87c2bd5ddda9', 'ARTI108250132', 'Impression sur les box VIP pour la célébration des cinq (05) ans de l''ARTI (2BPUB)', 354000, '2BPUB', 'valide', '2025-08-27T05:40:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('79dfb92f-5234-44cc-ad60-c888fc0707a5', 'ARTI108250131', 'Frais de transport du Sous-Directeur des Affaires Juridiques et des Recours pour l''enqu^te de satisfaction des usagers du Transport Intérieur à BONDOUKOU', 120000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-27T05:41:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a2ffb3a-5e73-4244-b980-db387e9a768f', 'ARTI108250130', 'Frais de transport d''un Chargé d''Etudes Sénior pour l''enqu^te de satisfaction des usagers du Transport Intérieur à DIVO', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-27T05:43:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c75aa481-9646-48f4-84d3-d827dae3c80a', 'ARTI108250156', 'Frais de transport du Chef de Service de la Surveillance du Transport Intérieur pour l''enqu^te de satisfaction des usagers du Transport Intérieur à BOUAKE', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-28T10:12:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('445c2159-5da2-48aa-a5ec-22f8e730c1e8', 'ARTI108250166', 'Location d''un véhicule pick-up avec chauffeur pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 236975, 'EMMA CAB', 'valide', '2025-08-28T13:31:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a764076c-dcc3-49be-9095-8adc1ea5ab09', 'ARTI108250165', 'Prise en charge de l''assurance automobile pour le véhicule TOYOTA FORTUNER immatriculé 49764WWCI01', 455600, 'ASSURE PLUS', 'valide', '2025-08-28T13:32:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('303dab86-3ffe-43a0-9f2c-715badeead23', 'ARTI108250164', 'Frais de réception à l''hôtel La Maison Palmier à l''occasion de la 2Sme session du Conseil de Régulation de l''ARTI', 568000, 'LA MAISON PALMIER', 'valide', '2025-08-28T13:34:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f7547fc1-3527-4192-b77a-d2f140da8567', 'ARTI108250163', 'Achat de compositions florales pour le mois de juin 2025 (FLEUR DE JONQUILLE)', 20000, 'FLEUR DE JONQUILLE', 'valide', '2025-08-28T13:35:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('789dd6ac-d74a-49b3-81ca-52a0984b4406', 'ARTI108250162', 'Reprise de la note rejetée no 570-08-2025 ARTI/DAAF/SDMG/EJJ Achat et impression sur les enveloppes pour la célébration des cinq (05) ans de l''ARTI', 165200, 'HOODA GRAPHIQUE', 'valide', '2025-08-28T13:37:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a0ab6296-b313-4a35-b6e2-09b797585f52', 'ARTI108250167', 'Prise en charge de l''assurance automobile pour le véhicule TOYOTA COROLLA CROSS immatriculé 52132WWCI', 270210, 'ASSURE PLUS', 'valide', '2025-08-28T13:54:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e9c81291-7d4e-42a7-93bc-eaa8e538251d', 'ARTI108250168', 'Location d''un véhicule pick-up JAC T9 avec chauffeur dans le cadre de la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 250000, 'EMMA CAB', 'valide', '2025-08-28T13:56:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ee4b823f-db83-4186-a61a-91f8e6abf6a0', 'ARTI108250169', 'Location d''un véhicule de type SUV avec chauffeur pour la deuxiSme phase de l''enqu^te de satisfaction des usagers du transport intérieur', 125000, 'EMMA CAB', 'valide', '2025-08-28T13:59:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('96649c39-bfb3-4609-a20f-73d9a92e447d', 'ARTI108250171', 'Note d''honoraires de notaire au titre de l''assistance juridique apportée à l''ARTI Dans le cadre du projet d''acquisition du siSge du siSge socialà', 5000000, 'ETUDE DE Me MANGOUA CHARLOTTE YOLANDE', 'valide', '2025-08-28T16:13:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('74b864d3-5db3-4d49-9806-95bf57ef50cc', 'ARTI108250170', 'Réparation du plafond de la galerie couverte du siSge de l''ARTI', 247940, 'LAWASS SERVICE & ASSOCIES', 'valide', '2025-08-28T23:44:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('781def7f-31e0-4fc4-9f16-c5e6e4328236', 'ARTI108250161', 'Reprise de la note no 558-08-2025 /ARTI/DAAF/SDMG/EJJ - Acquisition d''une (01) table de bureau triangle', 1758672, 'SPIRAL OFFICE & HOME', 'valide', '2025-08-28T23:46:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a708b658-40f2-40b5-8ffe-c37ee2056d7c', 'ARTI108250160', 'Achat et installation d''équipements au siSge de l''ARTI', 74480, 'HORIZON TECHNOLOGIES', 'valide', '2025-08-28T23:48:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('867f4e9e-1061-43b9-8f84-295c49ab13cc', 'ARTI108250159', 'RSglement de perdiem des enqu^teurs d''Abidjan pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 480000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-28T23:49:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef791368-f1f4-405e-9f7e-c48e44eec2af', 'ARTI108250158', 'RSglement de perdiem des enqu^teurs locaux pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 1800000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-28T23:51:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8107469e-9093-4746-87e5-e6471ee0160d', 'ARTI108250157', 'Frais de transport du Responsable du Bureau Régional de Yamoussoukro pour l''enqu^te de satisfaction des usagers du Transport Intérieur à YAMOUSSOUKRO', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-28T23:53:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe3ceeab-ebb0-4b9d-a330-9dcd9f9e1b94', 'ARTI108250155', 'Frais de transport du Directeur du Contrôle et de la Surveillance du Transport Intérieur pour l''enqu^te de satisfaction des usagers du Transport Intérieur à l''intérieur', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-28T23:54:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6243bd3e-63e4-47d9-b3ba-423734e3a457', 'ARTI108250154', 'Frais de transport des enqu^teurs pour la deuxiSme phase de l''enqu^te de satisfaction des usagers du transport intérieur', 210000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-28T23:56:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31ffc42a-0ea2-483f-bd79-2dddab285b1a', 'ARTI108250153', 'Frais de communication des superviseurs pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 60000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-28T23:58:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52951008-250d-4db0-aac4-4343cb062c88', 'ARTI108250152', 'Frais de communication des enqu^teurs pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 180000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-28T23:59:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4e10a22c-24f2-4da9-bd82-803d6641a65c', 'ARTI108250151', 'Frais de communication du coordonnateur pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 10000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:01:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b8fd0209-90dc-4e7a-9529-f9134266d591', 'ARTI108250141', 'Location d''un véhicule avec chauffeur pour la mission du Directeur Général à Yamoussoukro', 125000, 'EMMA CAB', 'valide', '2025-08-29T00:02:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7f38b24-53fc-4c2f-a42b-7482c2016263', 'ARTI108250149', 'Location de véhicule pour la participation de l''ARTI aux obsSques de la mSre de l''Auditeur Interne et Contrôleur Budgétaireà', 300000, 'CAR DEPOT', 'valide', '2025-08-29T00:04:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('89a4725a-ac1a-494d-8a5c-431d34756ed2', 'ARTI108250139', 'Acquisition de gadgets de communication grand public pour la célébration du cinquiSme Anniversaire de l''ARTI _ LOT 2 : (HOODA GRAPHICS)', 467280, 'HOODA GRAPHIQUE', 'valide', '2025-08-29T00:05:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c8f0fda3-c10a-43ac-b9e0-e8b3e92834c7', 'ARTI108250140', 'Location d''un véhicule pick-up avec chauffeur pour la mission du Directeur Général à Yamoussoukro', 250000, 'EMMA CAB', 'valide', '2025-08-29T00:07:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b5444448-fdea-4cd2-bd85-a345939efcd3', 'ARTI108250138', 'Acquisition de gadgets de communication grand public pour la célébration du cinquiSme Anniversaire de l''ARTI _ LOT 1 (2BPUB)', 4000200, '2BPUB', 'valide', '2025-08-29T00:08:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0c0cbe4b-c9a3-4ee1-8a75-a584cc5fa5ec', 'ARTI108250136', 'Frais de transport d''un Chargé d''Etudes Sénior pour l''enqu^te de satisfaction des usagers du Transport Intérieur à Abengourou', 80000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-29T00:10:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c1d4058-8fa6-4b7a-98b8-8f42963d177f', 'ARTI108250135', 'Acquisition de gadgets de communication grand public pour la célébration du cinquiSme Anniversaire de l''ARTI _ LOT 3 : (BCOM)', 1029000, 'B COM SARL', 'valide', '2025-08-29T00:11:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('13ca4de7-3f64-4d69-8ea6-fa3a75a47e45', 'ARTI108250142', 'Forfait carburant des superviseurs pour l''enqu^te de satisfaction des usagers du Transport Intérieur', 200000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:13:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a4d37748-74b3-4eec-8128-da2b29150c76', 'ARTI108250137', 'Frais de transport du Sous-Directeur de la Passation des Marchés pour l''enqu^te de satisfaction des usagers du Transport Intérieur à GAGNOA', 95000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-29T00:14:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b854229d-cd4b-4293-aa45-fe91d1168386', 'ARTI108250143', 'Frais de restauration des enqu^teurs non locaux pour la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur', 180000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:16:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ea3b9090-8de3-463e-b3ea-30c541c00cd6', 'ARTI108250150', 'Frais de logement des enqu^teurs non locaux pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 630000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:20:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('55da97d2-1b0f-4617-83bd-21ff3d191c23', 'ARTI108250148', 'Frais de déplacement des enqu^teurs pour la phase 2 de l''enqu^te de satisfaction des usagers du transport intérieur', 84000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:23:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1f027ed9-a703-4b33-a781-3f80a06dc75b', 'ARTI108250147', 'Frais de restauration (déjeuner) des enqu^teurs et superviseurs pour la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur', 440000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:25:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e551f048-8291-4703-a96e-bd86df065648', 'ARTI108250146', 'Pause-café pour la formation des agents enqu^teurs de la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur', 300000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:27:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8987506a-ef39-410f-826f-9f6bd73a186e', 'ARTI108250145', 'Forfait carburant du Coordonnateur pour l''enqu^te de satisfaction des usagers du Transport Intérieur', 50000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:29:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('56b031b7-2b85-457f-8064-be485870b5c9', 'ARTI108250144', 'Frais de restauration des superviseurs résidents de Yamoussoukro et Bouaké pour la phase 2 des enqu^tes de satisfaction des usagers du transport intérieur', 80000, 'Acteurs externes de l''ARTI', 'valide', '2025-08-29T00:31:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9ad87501-bd33-48fa-bbfa-1e4b55c34984', 'ARTI108250174', 'SEANCE DE TRAVAIL AVEC LE PERSONNEL DU BUREAU ARTI DE YAMOUSOUKRO', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-29T09:11:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9325529f-ebc8-4ec8-bddc-5b549cde0638', 'ARTI108250173', 'SEANCE DE TRAVAIL AVEC LE PERSONNEL DU BUREAU ARTI DE YAMOUSOUKRO', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-29T09:12:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('00e399af-e0ee-4903-9c45-96eb33f8820c', 'ARTI108250172', 'SEANCE DE TRAVAIL AVEC LE PERSONNEL DU BUREAU ARTI DE YAMOUSOUKRO', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-08-29T09:14:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('936fbb94-5ffc-47e9-bed8-4993baf179ff', 'ARTI108250179', 'Demande de rechargement des box wifi prépayées MOOV AFRICA de l''ARTI pour le mois de septembre 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-08-31T23:01:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('310647e0-8516-418f-a536-68acebf2b48e', 'ARTI108250178', 'RSglement mensuel de la facture du mois de septembre 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-08-31T23:02:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b240e55-4fba-41d2-8baa-1386fe6d25cf', 'ARTI108250177', 'Sécurité privée des locaux de l''ARTI pour le mois de septembre', 2001280, 'SIGASECURITE', 'valide', '2025-08-31T23:03:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('00bf176a-614a-40a6-9a67-feeae37dcb42', 'ARTI108250176', 'Ordre de Rechargement des cartes de carburant du mois de septembre 2025', 4200000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-08-31T23:05:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dfca7959-e424-40a7-a3de-ed659b142714', 'ARTI108250175', 'Obtention d''un code import pour l''année 2025 dans le cadre de la procédure de dédouanement des deux (02) machines Glutton', 170000, 'MINISTERE DU COMMERCE', 'valide', '2025-08-31T23:06:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17f7fb1a-f3cd-4545-b8bc-48a1f5319c48', 'ARTI109250003', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de septembre 2025', 235000, 'H2O PISCINE', 'valide', '2025-09-01T11:13:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b08b86bd-801c-40f6-9b44-d7348bf77807', 'ARTI109250002', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de septembre 2025', 327467, 'MI3E', 'valide', '2025-09-01T11:15:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('45a9efc6-2536-4f46-8429-4127c7ef1773', 'ARTI109250001', 'RSglement des frais de ramassage d''ordures pour le mois de septembre 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-09-01T11:17:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9e5ea6d1-9ec0-4e86-a124-57972f96a88f', 'ARTI109250010', 'Réparation d''une porte en grille et le remplacement de la niche de la piscine au siSge de l''ARTIà', 189140, 'FERRONNERIE BOKA', 'valide', '2025-09-03T08:19:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('998f43e2-68a0-43ac-9065-4d6e2cb66f3b', 'ARTI109250009', 'Rechargement des cartes péages FER pour le mois de septembre 2025', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-09-03T08:20:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9c773d68-5467-486d-9da8-7e211f777206', 'ARTI109250008', 'Rechargement canal horizon pour le mois de septembre 2025', 100000, 'CANAL + HORIZON', 'valide', '2025-09-03T08:22:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e2de129-b7a0-4aa7-9783-868c2ba3fe44', 'ARTI109250007', 'Achat des piSces de caisse et des bon de commande', 254800, 'CORRECT PRINT', 'valide', '2025-09-03T08:31:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c76d14d-5541-4d61-94a7-fd1b7fd8bef3', 'ARTI109250006', 'Demande d''obtention de tampons-cachets pour le Médecin du travail et tampons-cachets de la Sous-Directrice des Moyens Généraux', 19600, 'YESHI SERVICES', 'valide', '2025-09-03T08:35:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70d23c9a-e13a-4433-bcf3-7e59f45528f6', 'ARTI109250004', 'Constitution de la bibliothSque documentaire de la DRRN', 254500, 'CNDJ', 'valide', '2025-09-03T08:42:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5c98c08b-1339-48f0-a8f0-dd4382803de2', 'ARTI109250005', 'Désinsectisation et de démoustication des locaux du siSge de l''ARTI', 637000, 'AGROSPHYSSARL', 'valide', '2025-09-03T08:43:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('650cf3bc-f188-4a45-a584-dce3a86b33a3', 'ARTI109250020', 'Acquisition de fiche de mutation du véhicule SUZUKI VITARA immatriculé 2920 LP 01', 125000, 'CGI', 'valide', '2025-09-08T10:05:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('09547b48-d0a3-437b-b414-d34d6d814660', 'ARTI109250019', 'Acquisition de fiche de mutation du véhicule SUZUKI VITARA immatriculé 2921 LP 01', 12500, 'CGI', 'valide', '2025-09-08T10:11:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7947895b-de42-488f-ab2c-468c07ff7f16', 'ARTI109250018', 'Acquisition de fiche de mutation du véhicule SUZUKI VITARA immatriculé 2923 LP 01', 12500, 'CGI', 'valide', '2025-09-08T10:13:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('60135045-0c6a-43e1-8a13-fb226cd5eb72', 'ARTI109250017', 'Acquisition de fiche de mutation du véhicule SUZUKI VITARA immatriculé 2924 LP 01', 12500, 'CGI', 'valide', '2025-09-08T10:15:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d8c692fc-4a8e-4942-a7c0-810ba705be55', 'ARTI109250016', 'Mission Yamoussoukro-Bouake: visite et séance de travail avec les équipes des bureaux régionaux du 04 septembre au 06 septembre 2025à', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T10:20:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ac1ea783-0eb9-4aaf-ab7f-d1da9b57fcae', 'ARTI109250015', 'Frais de transport de Monsieur GBAMALE Siméon pour la mission du Directeur Général à Yamoussoukro et Bouaké du 04 au 06 Septembreà', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T10:32:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7b46d767-2d0a-4d54-aa47-579e608bcf65', 'ARTI109250014', 'Réparation et Installation des robinets dans certains bureaux et celui de Directeur Général au siSge de l''ARTIà', 275000, 'AMS', 'valide', '2025-09-08T10:35:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58d78939-67d2-40dd-8ba8-a55c9dbc2ec7', 'ARTI109250013', 'Demande de remplacement de la batterie du véhicule NISSAN PATROL 6767 KR 01à', 133848, 'SPRIINT TECH', 'valide', '2025-09-08T10:37:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3bd82daa-673b-4dbb-9f74-f0efcfc1d2d0', 'ARTI109250012', 'RSglement des frais de carburant pour la représentation Apangokro (Tiebissou)', 73000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T10:38:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70a94084-0478-4e94-833d-cfe00c3d3d44', 'ARTI109250011', 'Location d''un véhicule pick-up HYUNDAI SANTA FE sans chauffeur dans le cadre de la mission de visite et séance de travail de Monsieur le Directeur Général à Yamoussoukro et Bouaké', 375000, 'EMMA CAB', 'valide', '2025-09-08T10:40:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bfcc48ee-bfb9-4dba-821f-2777f52ab378', 'ARTI109250027', 'Demande de rSglement de la facture de l''entreprise GENIAL pour la fourniture de bonbonnes d''eau pour le mois d''aout 2025à', 94000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-09-08T21:32:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0f236eeb-b01e-4165-b500-83ea7efd13e8', 'ARTI109250026', 'Reprise de la note no500-08-2025/ARTI/DAAF/SDMG/EJJ - Acquisition de gadgets de communication VIP pour la célébration du cinquiSme (5Sme) anniversaire de l''ARTI _ LOT 2 : Plaquettes (HOODA GRAPHICS)', 177000, 'HOODA GRAPHIQUE', 'valide', '2025-09-08T21:33:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('862e2951-31b6-4501-a06d-29aff5de525c', 'ARTI109250024', 'RSglement de la facture Orange CI pour la consommation mobile du mois d''aout 2025à', 489473, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-09-08T21:37:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('78e95d62-deda-4bc1-a93f-4624ff2236d7', 'ARTI109250021', 'Frais de transport de Monsieur  Le Directeur Généralé pour la mission à Yamoussoukro et Bouaké du 04 au 06 Septembre', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T21:39:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('22a3019f-e545-4f3e-b672-9972f8b9e991', 'ARTI109250022', 'Mission Yamoussoukro-Bouake: visite et séance de travail avec les équipes des bureaux régionaux du 04 septembre au 06 septembre 2025à', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T21:40:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c278dc9-2cf4-45c8-b8e0-6242a433b8f9', 'ARTI109250023', 'Mission Yamoussoukro-Bouake: visite et séance de travail avec les équipes des bureaux régionaux', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-08T21:42:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e329ec24-1f44-49dd-ae8c-6e50b8c0e072', 'ARTI109250025', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de Septembre 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-09-08T21:43:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ecb94b0d-461e-48d6-8f1f-7eb15996f32c', 'ARTI109250034', 'Demande d''autorisation pour la régularisation de la patente transport du véhicule Ford Ranger DC BVA immatriculé 4327 KS 01', 144000, 'DGI', 'valide', '2025-09-09T07:41:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd757cb8-1895-4329-b501-2accd4bfb575', 'ARTI109250033', 'Enqu^te de satisfaction des usagers du transport intérieur phase 2', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-09T07:42:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0e951d1-1a6a-46e8-b68c-7abe358aec42', 'ARTI109250032', 'Enqu^te de satisfaction des usagers du transport intérieur phase 2', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-09T07:44:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6cff4fe5-bbb7-4b76-aefe-39e8ff161199', 'ARTI109250031', 'Enqu^te de satisfaction des usagers du transport intérieur phase 2', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-09T07:45:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('657a368d-1ab1-442c-b2b1-66d914cf8e16', 'ARTI109250030', 'Enqu^te de satisfaction des usagers du transport intérieur phase 2', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-09T07:47:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7f808c9e-73ae-442b-a17e-5d125ad26eb5', 'ARTI109250029', 'Mission Yamoussoukro-Bouake: visite et séance de travail avec les équipes des bureaux régionaux', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-09T07:49:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d4f58589-4646-43cb-b1a7-aaf62aa7deb5', 'ARTI109250028', 'Demande de rSglement de la facture Orange CI pour la consommation réseau Fixe du mois d''Ao-t 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-09-09T07:51:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('043a12a5-420e-444c-8bd3-dc6ae6aef839', 'ARTI109250039', 'formation de la DRRN portant sur le thSme : r Réévaluation de plans stratégiques et restructuration d''entreprise : collaboration entre Conseils d''Administration et Directions Générales _à', 600000, 'SOCIETE D''AVOCATS BILE-AKAéBRIZOUA-BI & ASSOCIES', 'valide', '2025-09-10T15:06:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2ff3d516-c19e-4c61-8f3f-d58c9fafe3a2', 'ARTI109250038', 'Régularisation - Frais de communication des superviseurs pour la phase 1 de l''enqu^te de satisfaction des usagers du transport intérieur', 50000, 'Acteurs externes de l''ARTI', 'valide', '2025-09-10T15:08:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb1f4cf1-74f2-4c7f-b8bc-a1a12c55b0f0', 'ARTI109250044', 'Demande d''autorisation pour le paiement des prestations complémentaires de Trilogy Event pour les 5ans de l''ARTI', 12135340, 'TRILOGY EVENTS & COM', 'valide', '2025-09-11T04:29:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7e351814-b3d2-4e6f-9271-fc27ef31043e', 'ARTI109250043', 'Demande d''achat de cartouches d''encre pour le siSge de l''ARTI', 5694000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-09-11T04:30:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('717e5333-9e7f-41ea-a109-5261ef51d5d8', 'ARTI109250042', 'Demande d''autorisation d''impression des diplômes de reconnaissance de 13 employés pour les 5ans de l''ARTI', 82600, 'HOODA GRAPHIQUE', 'valide', '2025-09-11T04:32:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('996df528-6e12-40cc-be70-cdbcb91694d2', 'ARTI109250041', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFAITAIRES POUR LE MOIS D''AOUT 2025 ( PPSSI)à', 225195, 'DGI', 'valide', '2025-09-11T04:33:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d5842cbf-8ba3-44d4-adb0-bc136b3cd688', 'ARTI109250040', 'Formation sur le thSme r Les techniques et méthodes d''enqu^te et d''investigation _ du 15 au 17 septembre 2025', 3332000, 'AFCCI', 'valide', '2025-09-11T04:35:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('89840efa-cc5a-434e-8cd1-e8b0435590b6', 'ARTI109250037', 'RSglement de perdiem des enqu^teurs pour la phase 1 de l''enqu^te de satisfaction des usagers du transport intérieur', 1500000, 'Acteurs externes de l''ARTI', 'valide', '2025-09-11T04:37:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b9d92ce8-bbde-4668-a29b-dffe055cc1f1', 'ARTI109250036', 'FRAIS BANCAIRES DU MOIS D''AOUT 2025à', 288750, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-09-11T04:38:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e2f072b-e32f-4122-a11d-278bb473c9d4', 'ARTI109250035', 'REGULARISATION FRAIS D''ACHAT DE CREDIT DE COMMUNICATION DANS LE CADRE DES ACTIVITES DE L''ARTI POUR LE  MOIS D''AOUT  2025à', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-11T04:39:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d6662a1e-b6bd-47ed-91c9-a39c6f02ddbd', 'ARTI109250051', 'Régularisation - Frais de déplacement des enqu^teurs pour la phase 1 de l''enqu^te de satisfaction des usagers du transport intérieur', 160000, 'Acteurs externes de l''ARTI', 'valide', '2025-09-11T07:39:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b8277983-cc53-4ac0-b3b4-082005b4bddc', 'ARTI109250050', 'Régularisation - Frais de restauration des superviseurs pour la phase 1 des enqu^tes de satisfaction des usagers du transport intérieur', 400000, 'Acteurs externes de l''ARTI', 'valide', '2025-09-11T07:41:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3bc713f8-e76e-4289-82ff-c93737d5e3b1', 'ARTI109250049', 'Participation à la célébration des 5 ans de l''ARTI du 12 septembre au 13 septembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-11T07:43:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('32752f85-dc1b-4ab5-b1e1-4222edae2bcb', 'ARTI109250048', 'Régularisation - Frais de communication des enqu^teurs pour la phase 1 de l''enqu^te de satisfaction des usagers du transport intérieur', 125000, 'Acteurs externes de l''ARTI', 'valide', '2025-09-11T07:44:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('281a85f4-6b78-4e8f-bc19-07a186c16d07', 'ARTI109250047', 'Participation à la célébration des 5 ans de l''ARTI du 12 septembre au 13 septembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-11T07:46:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0db62e5a-089b-48a0-9601-116de5a3c8bb', 'ARTI109250046', 'Participation à la célébration des 5 ans de l''ARTI du 12 septembre au 13 septembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-11T07:47:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e76a4764-6132-4822-ae58-12419d0587fd', 'ARTI109250045', 'Pré visite du véhicule FORD EXPLORER immatriculé 1415 LJ 01', 105000, 'CAM-SERVICES', 'valide', '2025-09-11T07:48:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('90fffe8f-88e6-4d65-bbbb-3be2e50cfe89', 'ARTI109250054', 'Demande d''achat de bouteilles de vin pour les festivités des 05 ans de L''ARTI', 3727670, 'SODIREP', 'valide', '2025-09-15T12:44:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eab3ff3b-76c6-44b2-a4ab-ac41f3fd185b', 'ARTI109250053', 'Demande de rSglement de la facture de CASA EKWA relative au déjeuner d''affaire dans le cas du lancement des 05 ans de l''ARTI', 558000, 'CASA Ekwa', 'valide', '2025-09-15T12:50:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d5b07270-4b6d-4451-88f8-e7da2e67c5d7', 'ARTI109250052', 'Demande d''autorisation pour la production de gadgets cadeaux destinés aux VIP et au CODIR pour les 5ans de l''ARTI', 2009000, 'IICI', 'valide', '2025-09-15T12:52:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('789b6700-618c-4177-bd76-cc64c21df9df', 'ARTI109250055', 'Pose de sanitaires pour les toilettes du rez-de chaussée du siSge de l''ARTIà', 233400, 'AMS', 'valide', '2025-09-15T13:00:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7313cc1d-94d1-45aa-bc31-9b50b2ad2fd7', 'ARTI109250056', 'Demande de rSglement facture SODECI Bouaké - Ao-t 2025', 4348, 'SODECI', 'valide', '2025-09-15T22:11:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('460fda13-b836-4e86-830c-d3b1fca541c2', 'ARTI109250068', 'Situation Cotisation CNPS du mois de septembre 2025', 10658735, 'CNPS', 'valide', '2025-09-17T07:12:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1c09f51e-b549-4836-b095-3e518884faab', 'ARTI109250067', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de septembre 2025', 322392, 'DGI', 'valide', '2025-09-17T07:13:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64d0e0ad-1b6a-4360-92cc-2f4f5b8d5e84', 'ARTI109250066', 'Situation des honoraires des gendarmes du mois de septembre 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-09-17T07:15:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d7d04dc-4f5d-4dc2-9c64-014a7006d389', 'ARTI109250065', 'Situation impôt retenu à la source du mois de septembre 2025', 300000, 'DGI', 'valide', '2025-09-17T07:16:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4d9048f8-4e4a-47ba-b9ad-9e8a80e424c5', 'ARTI109250064', 'Situation des indemnités des stagiaires du mois de septembre 2025', 124000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-17T07:18:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49341743-da37-4105-9c15-aeec75bbaeb7', 'ARTI109250063', 'Situation des indemnités de la DRRN du mois de septembre 2025', 1624837, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-17T07:20:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ba03f39-ec36-48a7-8cc0-d97a860966d0', 'ARTI109250058', 'Demande d''achat de bons-valeurs de carburant', 4200000, 'PETRO IVOIRE', 'valide', '2025-09-17T07:21:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('680ddb87-15e2-4f8b-b967-3f5b1727053c', 'ARTI109250062', 'Situation du salaire et appointement du mois de septembre 2025', 57354585, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-17T07:23:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ca2250f-7b79-4f0f-991d-fbcb4c495a2f', 'ARTI109250061', 'Demande de rSglement relatif à l''achat de cartouches d''encre pour le bureau régional de l''ARTI à BOUAKE', 420000, 'SODIMA SARL', 'valide', '2025-09-17T07:24:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0328f756-e981-4182-ae7c-0d7206422df6', 'ARTI109250060', 'Demande de révision du véhicule Suzuki Vitara immatriculé 2921 LP 01', 219000, 'SOCIDA', 'valide', '2025-09-17T07:26:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c7e3f5ba-a306-4969-bd75-5c27b959a270', 'ARTI109250059', 'Frais de restauration du personnel de l''ARTI pour le mois d''octobre 2025', 8491600, 'T & P EVENT', 'valide', '2025-09-17T07:28:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3c3ecc56-adfd-4803-b0a3-77dfe35fd72f', 'ARTI109250057', 'Demande de révision du véhicule FORD RANGER immatriculé 4327 KS 01', 754214, 'AFRICAUTO', 'valide', '2025-09-17T07:30:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('83c0b3ef-4834-4dea-9e0c-c4f48a078143', 'ARTI109250078', 'INITIATION ú LA L?GISTIQUE', 2665600, 'AFCCI', 'valide', '2025-09-17T15:01:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff0f72b0-b303-446a-b3c8-9f7d3de230f0', 'ARTI109250077', 'Acquisition de Newsletter spéciale anniversaire des 05 ans de l''ARTI', 3492800, 'GCIS CONCEPT SARL', 'valide', '2025-09-17T15:03:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('65bdeabe-7cd6-41ba-9e5d-a8552caa51f6', 'ARTI109250076', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS D''AOUT 2025à', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-09-17T15:04:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ca54fc07-7857-4501-a7a5-3a7533f6aa4d', 'ARTI109250069', 'Régularisation-Situation des honoraires des médecins du mois de septembre 2025', 1300000, 'MEDECINE DU TRAVAIL', 'valide', '2025-09-17T15:05:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('429769f0-1acb-4f0d-aa96-96e657c30637', 'ARTI109250075', 'RSglement a l''achat de divers articles pour la Direction Généraleà', 92500, '', 'valide', '2025-09-17T15:19:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cdeb71ab-1007-4de4-9282-5321e3e879fc', 'ARTI109250074', 'Demande de visite technique du véhicule FORD EXPLORER immatriculé 1415 LJ 01', 112100, 'SGS', 'valide', '2025-09-17T15:20:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51c533ba-54ad-40fc-a93a-8c0ce50d8690', 'ARTI109250073', 'Installation de la fen^tre du magasin du bas au siSge de l''ARTIà', 417600, 'ALUMINIUM METALLERIE CONSTRUCTION', 'valide', '2025-09-17T15:23:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('46c81a76-d010-457e-b9cf-8f12668e78dd', 'ARTI109250072', 'Situation Cotisation CMU du mois de septembre 2025', 51000, 'CNPS', 'valide', '2025-09-17T15:31:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a274ffd-bb17-4df2-b534-a6347632fc01', 'ARTI109250071', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de septembre 2025', 483586, 'DGI', 'valide', '2025-09-17T15:32:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4dfc11f8-41e6-4bcd-bb0a-6b86906dd04d', 'ARTI109250070', 'Situation de l''Impôt sur les Salaires (IS) du mois de septembre 2025', 17921989, 'DGI', 'valide', '2025-09-17T15:34:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1761a30e-daf4-44de-b871-cfd650b8ae77', 'ARTI109250089', 'Reprise de la note rejetée no 563-08-2025 ARTI/DAAF/SDMG/EJJ Acquisition de gadgets de communication grand public pour la célébration du cinquiSme Anniversaire de l''ARTI _ LOT 3 : (BCOM)˜', 294000, 'B COM SARL', 'valide', '2025-09-19T09:11:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7c89dc7-f06a-45ac-8dc6-c6c94187c8af', 'ARTI109250088', 'RSglement de la facture loyer Bouaké pour le 4 -Sme trimestre 2025', 750000, 'SEYDOU OUATTARA (LOYER)_BKE', 'valide', '2025-09-19T09:13:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58cc7e4a-c1f0-4287-89b3-155418cf3a9d', 'ARTI109250087', 'Participation aux 5 ans de l''ARTI', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-19T09:15:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('898c6254-9de0-4349-b9d5-85b1ef2fac7a', 'ARTI109250086', 'Achat de cartons de rangement pour le transfert des gadgets et cadeaux du 5 Sme anniversaire de l''ARTI˜', 62500, 'YESHI SERVICES', 'valide', '2025-09-19T09:17:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('daa04042-2b96-4d61-9944-a1baf5ecd08f', 'ARTI109250085', 'Frais de transport de Monsieur BOKOUA Ziogba Sébastiené pour sa participation à la célébration des 05 ans de l''ARTI', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-19T09:20:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b60b81c-f47a-49e6-a5d6-15ae128f4345', 'ARTI109250090', 'Acquisition d''un véhicule automobile', 134000000, 'ATC COMAFRIQUE', 'valide', '2025-09-19T09:23:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2777970a-d647-4aeb-9520-2bfefc524fca', 'ARTI109250092', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE SEPTEMBRE 2025à', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-09-19T09:24:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a4bf75cf-f841-499b-8869-3f603d2be403', 'ARTI109250091', 'Régularisation du rechargement d''une carte carburantà', 100000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-09-19T09:27:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8625f545-38ff-4f0f-9874-716e35980c86', 'ARTI109250093', 'REALISATION DE L''ETUDE DE FAISABILITE DU PROJET MISE EN PLACE D''UNE BASE DE DONNEES G?OSPATIALES POUR LES ACTIVITES DE REGULATIONS DE L''AUTORITE DE REGULATION DU TRANSPORT INT?RIEUR (ARTI)à', 48784400, 'CONCEPT CONSULTING', 'valide', '2025-09-19T09:29:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b9e90a66-6731-4e39-8629-5ccb67ae7a10', 'ARTI109250081', 'Achat d''un billet d''avion dans le cadre de la mission du Directeur Général en France et aux Etats-Unis du 15 au 30 septembre 2025', 10588100, 'AIR France', 'valide', '2025-09-19T09:30:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4bdba078-4795-4cf4-acdb-5408645b80fe', 'ARTI109250080', 'Frais de restauration du personnel de l''ARTI pour le mois de septembre 2025', 7753200, 'T & P EVENT', 'valide', '2025-09-19T09:32:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f7f372d8-8279-4098-8199-0613503a96b9', 'ARTI109250094', 'Demande d''achat de deux cartes carburant au siSge de l''ARTI', 10250, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-09-19T09:34:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2d22212e-6ef1-49ba-81a0-0a1ba932f495', 'ARTI109250082', 'Participation aux 5 ans de l''ARTI', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-19T09:36:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b9983e9a-a69d-40f4-89ab-ec1df4e1e77f', 'ARTI109250084', 'Frais de transport de Monsieur DIABAGATE Mohammed pour sa participation à la célébration des 05 ans de l''ARTI', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-19T09:38:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf95d0a4-0bb6-4176-80e5-acb153e6a49b', 'ARTI109250083', 'Participation aux 5 ans de l''ARTI', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-19T09:40:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('621e9ba5-3856-46c2-98a2-0dfa19e0d24c', 'ARTI109250095', 'Demande d''achat de deux siSges ergonomiques', 247800, 'AU PARCHEMIN', 'valide', '2025-09-20T04:29:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe67c25a-31f1-49ed-b5d4-cd2fc76de37e', 'ARTI109250079', 'REALISATION DE L''ETUDE DE FAISABILITE DU PROJET MISE EN PLACE D''UN SYSTEME INTEGRE D''ENTRETIEN DES VOIRIES BITUMEES URBAINES PAR L''AUTORITE DE REGULATION DU TRANSPORT INT?RIEUR (ARTI)à', 59015600, 'CONCEPT CONSULTING', 'valide', '2025-09-20T04:30:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51bdf997-84a0-4fb9-8351-e5563b13f0a7', 'ARTI109250097', 'Location d''un véhicule pick-up JAC T9 avec chauffeur dans le cadre de la mission de visite et séance de travail de Monsieur le Directeur Général à Yamoussoukro et Bouaké', 375000, 'EMMA CAB', 'valide', '2025-09-23T11:06:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('62acb770-90e9-4ac1-96d2-0805287b7ad7', 'ARTI109250096', 'Location d''un véhicule pick-up JAC T9 avec chauffeur dans le cadre de la mission de visite du Directeur Général à Dimbokro relative au suivi des dons Glutton à la commune', 250000, 'EMMA CAB', 'valide', '2025-09-23T11:08:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('56957076-5a60-4bd0-84e1-7dad67bb2a5d', 'ARTI109250099', 'Achat d''un billet d''avion dans le cadre de la mission du Directeur Général à Korhogo du vendredi 03 au dimanche 05 octobre 2025', 232300, 'AIR COTE D''IVOIRE', 'valide', '2025-09-23T11:20:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b6acb841-3555-4a81-b9a4-6d93c21bf7d7', 'ARTI109250098', 'Demande de rSglement de la facture relative au loyer de Septembre 2025 du siSge de l''ARTI', 5000000, 'KABOD SIGNATURE IMMOBILIER', 'valide', '2025-09-23T11:21:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('572fab82-3fdc-4996-bc84-6f69fed56933', 'ARTI109250102', 'Demande pour le remplacement de la niche de la piscine et la réparation d''une porte en grille', 189140, 'H2O PISCINE', 'valide', '2025-09-23T18:51:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bf16eed7-ac1b-4322-ae79-5e7cad4f1de2', 'ARTI109250101', 'Demande de rSglement des frais de dédouanement définitifs des deux (02) machines GLUTTON destinées à la ville de Korhogo à', 2690545, 'TOP IMPEX SARL', 'valide', '2025-09-23T18:52:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c1e2fd10-4f25-4c16-82c2-acd9f0efa549', 'ARTI109250100', 'Demande d''achat des fournitures pour la cantine au siSge de l''ARTIà', 56600, '', 'valide', '2025-09-23T18:54:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b75513ce-b1ab-41ca-ab9a-87c36857cb8e', 'ARTI109250103', 'Reprise de la note rejetée no 490-08-2025 ARTI/DAAF/SDMG/EJJ (Dossier no ARTI208250024) Demandant rSglement de la facture relative à l''achat d''un siSge automobile pour la tombola des 05 ans de l''ARTI', 115000, 'MY BABY BOUTIQUE SARL', 'valide', '2025-09-24T12:34:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('285d064b-5649-41b1-9c0c-96fe538f6c36', 'ARTI109250104', 'Achat d''un billet d''avion pour Monsieur KOFFI Léon dans le cadre de la mission du Directeur Général à Korhogo du vendredi 03 au dimanche 05 octobre 2025', 145800, 'AIR COTE D''IVOIRE', 'valide', '2025-09-26T11:18:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d057c13e-4324-453a-9b39-397db7bf167c', 'ARTI109250112', 'Demande de relevé topographique pour la prise des mesures de la servitude du terrain de l''ARTI à Bouaké', 392000, 'CGE KOUROUKAN', 'valide', '2025-09-27T03:55:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b14cedc9-e8fb-4396-9d4e-c3a0f217d135', 'ARTI109250111', 'Rencontre pour partage d''expérience/Bourse de Fret', 3200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-27T03:57:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('87066bf9-b2bc-420c-bcb8-c8a5dddccfdc', 'ARTI109250110', 'Demande location de camion pour le transfert des machines Gultton du siSge de l''ARTI à Korhogo', 686000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-09-27T03:58:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('82ea1527-b590-4f8e-b0e8-4efc6ff72b54', 'ARTI109250109', 'Location d''un véhicule SUV Ford Everest sans chauffeur pour la mission de l''ARTI à Korhogo du 02 au 05 octobre 2025', 600038, 'EMMA CAB', 'valide', '2025-09-27T04:00:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3de8996e-e844-4ac6-b21a-25f76772fbce', 'ARTI109250108', 'Location d''un véhicule SUV Hyundai Santa Fe avec chauffeur pour la mission du Directeur Général à Korhogo du 03 au 05 octobre 2025', 386890, 'EMMA CAB', 'valide', '2025-09-27T04:01:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('45f624ee-f953-4904-aa94-96809e08f26a', 'ARTI109250106', 'Mise à disposition de véhicule avec chauffeur et transferts à l''aéroport - Mission du Directeur Général en France (22 au 30 ao-t 2025)', 3542168, 'EMMA CAB', 'valide', '2025-09-27T04:02:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17de87ea-f1a7-4f7e-a7a1-ed5e9a45dad0', 'ARTI109250107', 'Pause-café du comité sectoriel pour l''élaboration et la relecture des textes applicables au secteurs du Transport Intérieurà', 89850, '', 'valide', '2025-09-27T04:03:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b371c62d-09b6-446c-a6ef-3445e6adc300', 'ARTI109250105', 'Achat de carburant pour l''alimentation du groupe électrogSne du siSge de l''ARTIà', 54000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-09-27T04:04:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('41f862cc-3e4f-42de-8f4b-dc839783c8d6', 'ARTI109250115', 'Complément prime de stage', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-09-27T19:31:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b474f6c8-e780-4012-95bb-7117a64d3f5d', 'ARTI109250114', 'Rechargement des cartes de carburant du mois de Octobre 2025', 3900000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-09-27T19:32:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('56554a68-dd76-4b30-bab1-ce63f06fb487', 'ARTI109250113', 'Demande de rSglement facture CIE Bouaké pour la période du 04 Juillet à 09 Septembre 2025', 77555, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-09-27T19:33:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5317a7f-d1a7-44ae-a82a-1e8e10d11dbc', 'ARTI110250010', 'Location de salle et la restauration dans le cadre de l''élaboration de la norme qualité CT 21à', 12740000, 'ESPACE YEMAD', 'valide', '2025-10-01T22:11:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2c576b8c-38a1-4155-8e58-a0605ae36faa', 'ARTI110250008', 'Location d''un véhicule JAC T9 sans chauffeur pour la mission de l''ARTI du 1er au 30 octobre 2025', 3120570, 'EMMA CAB', 'valide', '2025-10-01T22:12:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c1e0d11c-fd43-4894-ab20-903945b93419', 'ARTI110250007', 'Demande de reglement de la facture relative à la location de la logistique et de la décoration de l''atelier de sensibilisation sur le cancer du sein (octobre rose) 2025', 1328680, 'IK EVENT''S RESSOURCES', 'valide', '2025-10-01T22:13:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('33482412-5226-419f-ab99-ac66ced78bb1', 'ARTI110250005', 'Au rSglement de la facture de mammographie des femmes de l''ARTI- octobre rose 2025', 400000, 'CIRAD', 'valide', '2025-10-01T22:14:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a94858d5-f0d6-48b3-80f2-4479aa8a88b9', 'ARTI110250003', 'Acquisition de gadgets de communication grand public pour la célébration De l'' r Octobre Rose _ 2025_ LOT 2 : (2BPUB)', 283200, '2BPUB', 'valide', '2025-10-01T22:16:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cb184ff5-974b-4072-be3a-2ff57e595fd3', 'ARTI110250006', 'Demande de rSglement de la facture liée à la captation photo de l''atelier de sensibilisation sur le cancer du sein - Octobre rose 2025', 274400, 'SLK Studios', 'valide', '2025-10-01T22:17:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4ebb42f0-496d-401b-a2b9-5b1bcb69a9c7', 'ARTI110250004', 'Acquisition de chasubles pour la mission de Korhogo du 02 Octobre 2025', 49000, 'GROUP CARRE VERT', 'valide', '2025-10-01T22:19:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('37d513e6-d116-4481-9221-7819bca2aa2f', 'ARTI109250116', 'Frais de transport de monsieur DIABAGATE pour la mission sur Korhogoà', 80000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-01T22:20:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5f3694a2-2f5a-43c7-aba5-3cfdaa766f14', 'ARTI110250001', 'Acquisition de rubans rose pour la célébration De l''r Octobre Rose _ 2025', 10500, 'GROUP CARRE VERT', 'valide', '2025-10-01T22:22:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0e1462c-c763-48a0-a08e-41c4102b4a47', 'ARTI109250117', 'Frais de transport de Monsieur BOKOUA pour la mission sur Korhogoà', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-01T22:23:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8f9af53a-3b89-449b-b0e2-d32400317ea0', 'ARTI110250009', 'Demande d''autorisation pour la location de salle et restauration - Rencontre avec les acteurs des régions d''intervention', 3430000, 'ESPACE YEMAD', 'valide', '2025-10-01T22:25:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a8dc6ea-4fe0-41ac-87b1-e1376b202fc1', 'ARTI110250002', 'Location de salle et à la restauration dans le cadre du projet de mise en ouvre du SystSme de Management de la Qualité (SMQ) conformément à la norme ISO 9001?:2015', 15190000, 'ESPACE YEMAD', 'valide', '2025-10-01T22:26:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('041ad49a-498c-455b-a42a-029df48ead7c', 'ARTI110250014', 'Demande de révision du véhicule FORD RANGER immatriculé 4327 KS 01', 754214, 'CFAO MOBILITY', 'valide', '2025-10-05T07:57:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ea1b1cd7-f698-4492-a853-688a6da41d02', 'ARTI110250013', 'Etablissement de carte de visite pour la Direction Générale', 118000, 'HOODA GRAPHIQUE', 'valide', '2025-10-05T08:00:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b589bd34-3315-4979-9697-ccc28c887646', 'ARTI110250012', 'Prise en charge de l''hébergement de Mlle Bérénice KOUAMEé dans le cadre de la remise des machines GLUTTON à la mairie de Korhogoà', 105000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-05T08:02:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('de013cf3-7062-4112-a151-81637872580c', 'ARTI110250011', 'Demande d''achat de bons-valeurs de carburant_ Octobre 2025', 4200000, 'PETRO IVOIRE', 'valide', '2025-10-05T08:03:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('34b1d238-8fdc-4b74-9b13-148f16dc9b1f', 'ARTI110250023', 'Adhésion de trois nouveaux collaborateurs à l''assurance santé', 600000, 'ASSURE PLUS', 'valide', '2025-10-08T07:23:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0d505a8c-f4ef-4d32-97e3-5da673662545', 'ARTI110250022', 'REGULARISATION-Atelier de validation du cadre politique de réinstallation (CPR)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-08T07:25:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d19be585-c849-4b93-ab14-d9e7a8f0e351', 'ARTI110250021', 'Demande de révision du véhicule Suzuki Vitara immatriculé 2924 LP 01', 77381, 'CFAO MOBILITY', 'valide', '2025-10-08T07:26:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('15537a15-95d5-452a-a72f-a2e235341cda', 'ARTI110250020', 'Demande de révision du véhicule VOLKSWAGEN VP immatriculé AA-746-FX01', 213802, 'ATC COMAFRIQUE', 'valide', '2025-10-08T07:27:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7451277f-2545-43cf-b01a-dc438498d495', 'ARTI110250019', 'Demande de révision du véhicule Volkswagen VP immatriculé AA-581-FY01', 368471, 'ATC COMAFRIQUE', 'valide', '2025-10-08T07:29:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d8f72084-4c6c-4bf7-ae38-e45d41ae2cca', 'ARTI110250018', 'PRELEVEMENT A LA SOURCE DE 12% SUR LOYERS DU SIEGE ARTI BOUAKE 4S TRIMESTRE 2025', 102273, 'DGI', 'valide', '2025-10-08T07:32:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bd1bd00e-0675-4f49-8436-cb5035214806', 'ARTI110250017', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois d''Octobre 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-10-08T07:35:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1a6cdd81-6100-4f16-bd2b-73a8deea962b', 'ARTI110250016', 'Autorisation d''effectuer les dépenses relatives aux boissons et accessoires pour le cocktail de fin de la célébration de l''Octobre rose 2025', 38225, '', 'valide', '2025-10-08T07:37:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f51f463d-d481-4052-b9dd-c607679d5018', 'ARTI110250063', 'Autorisation pour l''établissement d''un Bon de Commande - production et fourniture de gadgets pour le lancement et mise en ouvre SMQ-Norme ISO 9001à', 6409200, 'FOTOGRAPHIC EVENT', 'valide', '2025-10-13T21:08:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dd058afc-b985-4e40-953d-0f74407da5d7', 'ARTI110250062', 'Etablissement d''un Bon de Commande - Production et fourniture de supports de communication (Phase 2 de l''Enqu^te de Satisfaction - Axe Gagnoa)à', 5616380, 'SUCCES IMPRIM GROUPE', 'valide', '2025-10-13T21:09:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f2c16fdb-def8-4f83-a6ab-bdcaedfa4adf', 'ARTI110250061', 'RSglement de la facture de GENIAL pour le mois de septembre 2025à', 80000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-10-13T21:10:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b145032a-9489-4ff8-ab65-2b625b94e90f', 'ARTI110250060', 'REGULARISATION-Mission auprSs du cabinet C5P relative au projet de développement ferroviaire', 2800000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:12:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ebfcc47-7d73-4f25-9707-69d08daef82f', 'ARTI110250059', 'REGULARISATION-Mission auprSs du cabinet C5P relative au projet de développement ferroviaire', 2400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:13:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4d7405cb-01c5-4192-83dd-b328101fa794', 'ARTI110250058', 'Demande d''achat de deux (02) cartouches d''encre pour imprimante HP 207', 116000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-10-13T21:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f9f7bdce-2c9a-47cf-ae06-344db5f2c21b', 'ARTI110250057', 'Demande d''achat de ramettes pour le siSge de l''ARTI', 312500, 'YESHI SERVICES', 'valide', '2025-10-13T21:15:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c370ee2c-a5ba-4407-beeb-6f8f2c7d9a2b', 'ARTI110250056', 'Mission de monsieur GBAMELE Siméon sur Bouaké-Yamoussoukro-Dimbokro pour le suivi et évaluation sur l''utilisation des engins GLUTTONà', 1200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:16:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bd8412ed-2993-4bd7-b7f1-a795e8ec899f', 'ARTI110250055', 'REGULARISATION-Rencontre sur la mise en ouvre du projet BOURSE DE FRET', 3200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:17:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f4ff9cf2-e0b3-46ce-a74e-ed93f6a1a496', 'ARTI110250054', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFAITAIRES POUR LE MOIS SEPTEMBRE  2025 ( PPSSI)à', 380966, 'DGI', 'valide', '2025-10-13T21:18:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c7e5320-9e2f-439f-86ef-b0f2e9c7e548', 'ARTI110250053', 'REGULARISATION-Visite utilisation GLUTTON', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:21:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8265608e-91f3-4501-921a-56231947acc4', 'ARTI110250052', 'REGULARISATION-Visite utilisation GLUTTON', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:22:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef541026-a939-441e-b664-2deb7b47b1a5', 'ARTI110250051', 'RSglement de la facture de ramassage d''ordure pour le mois de septembre 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-10-13T21:23:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('161587a7-5fd8-4414-bcfa-44933ce6c6db', 'ARTI110250050', 'Remise de deux (02) engins GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:24:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('94a0d982-8163-49cd-a978-fc0a8df1f6f8', 'ARTI110250049', 'Remise de deux (02) engins GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:25:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9fe4d918-9f2a-4f25-91d4-7c17aa289284', 'ARTI110250048', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 2', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:26:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8bfb417-f2bf-4bc9-b934-4ca10e1c156b', 'ARTI110250046', 'Demande de rSglement de la facture de location de véhicule pour le ramassage des débris de travaux au siSge de l''ARTIà', 70000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-10-13T21:27:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a53e0dc4-1b36-420d-bddf-ac86d3e5446c', 'ARTI110250047', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 2', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:28:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('02d433c4-2566-49f5-867b-bc69daf9dbe2', 'ARTI110250045', 'Entretien des tapis de la Direction Générale au siSgeà', 109927, 'KADIA ENTREPRISES', 'valide', '2025-10-13T21:29:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ac6d631d-3e87-479c-aa0b-0176b069cc0a', 'ARTI110250044', '687-10-2025  ARTI/DAAF/SDMG/GD', 15000, 'SOCOPRIM SA (HKB)', 'valide', '2025-10-13T21:30:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('578224df-e29d-40be-b07d-2012ab64063f', 'ARTI110250043', 'Création d''une carte HKB au siSge de l''ARTIà', 15000, 'SOCOPRIM SA (HKB)', 'valide', '2025-10-13T21:31:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('257fe7ee-49dc-444b-948d-7526b9788117', 'ARTI110250042', 'Soutien financier à la fondation Gon Coulibaly', 500000, 'Acteurs externes de l''ARTI', 'valide', '2025-10-13T21:32:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8bd77f10-820c-4593-8fe7-8354aeeb3b4c', 'ARTI110250041', 'Location de véhicules de type 4x4 dans le cadre de la phase 2 de l''Enqu^te de satisfaction des usagers du transport intérieur sur les axes Abengourou-Bondoukou et Gagnoa', 3920000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-13T21:33:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e92d2c2-431f-4137-8f0d-7a7cb7c19624', 'ARTI110250040', 'Rechargement des cartes péage FER pour le mois de d''octobre 2025à', 70000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-10-13T21:34:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0e295983-831e-40d4-8c20-e82909a834b9', 'ARTI110250039', 'Demande de rSglement de la facture Orange CI pour la consommation de téléphones mobiles du mois de Septembre 2025', 1160446, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-10-13T21:35:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('931568b2-736b-4999-9fe1-0a062aa8ad2c', 'ARTI110250038', 'Demande de rSglement de la facture Orange Fixes du mois de Septembre 2025', 207697, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-10-13T21:36:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('50de60be-dd26-4006-b88f-2fdf002ea78b', 'ARTI110250037', 'Demande de visite technique du véhicule Volkswagen VP immatriculé AA-755-HB 01', 65100, 'SGS', 'valide', '2025-10-13T21:37:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('064180e9-a88c-4960-b1d6-c99d04d4f6f4', 'ARTI110250036', 'RSglement de la facture de fleur de JONQUILLE pour le mois d''aout 2025', 60000, 'FLEUR DE JONQUILLE', 'valide', '2025-10-13T21:38:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('57375ce5-4301-490f-9a85-6ede96df30be', 'ARTI110250035', 'Acquisition d''un clavier et souris CS700˜marque HP pour le Président du Conseil de Régulation', 16000, 'JUMIA CIV', 'valide', '2025-10-13T21:39:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('50c6fed2-b66c-402c-bbf7-d5876ae6ee07', 'ARTI110250034', '689-10-2025  ARTI/DAAF/SDMG/GD', 170000, 'CAM-SERVICES', 'valide', '2025-10-13T21:40:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('99b322f4-efb6-42a7-8c85-50b1de8d84b4', 'ARTI110250033', 'REMISE DE DEUX (02) ENGINS GLUTTON', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:42:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5e3684db-3657-4e96-82ce-431a6fbd82ff', 'ARTI110250032', 'REMISE DE DEUX (02) ENGINS GLUTTON', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:43:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('063e2808-4b9f-4361-b549-7bff858ece5c', 'ARTI110250031', 'REMISE DE DEUX (02) ENGINS GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:44:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('101c0d16-2e78-4e80-884c-1f4c0ec59d09', 'ARTI110250030', 'REMISE DE DEUX (02) ENGINS GLUTTON', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:45:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a5f09d8-e9a9-4b16-ab6e-24e177e872b3', 'ARTI110250029', 'REMISE DE DEUX (02) ENGINS GLUTTON', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:46:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb8db27d-9029-4d83-99ef-119ad5512341', 'ARTI110250028', 'REMISE DE DEUX (02) ENGINS GLUTTON', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:47:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('36314946-7c40-47a5-9f40-72ec2abf19ac', 'ARTI110250027', 'REMISE DE DEUX (02) ENGINS GLUTTON', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:48:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6646ea6f-a2ad-423f-9c04-12da6aeb7752', 'ARTI110250026', 'REMISE DE DEUX (02) ENGINS GLUTTON', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-13T21:49:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7452d0ef-5508-4da4-9f9a-5672e6fc13f6', 'ARTI110250025', 'Rechargement de Canal Horizon pour le mois d''octobre 2025à', 100000, 'CANAL + HORIZON', 'valide', '2025-10-13T21:50:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ce2fe122-d9fb-4bd7-a067-0e22236344a8', 'ARTI110250024', 'Achat de billet d''avion du Directeur du Contrôle et de la Surveillance Intérieuré pour la remise des machines GLUTTON à Korhogoà', 178400, 'AIR COTE D''IVOIRE', 'valide', '2025-10-13T21:50:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('59a0dcf6-9e37-4b65-a953-766de6294cf4', 'ARTI110250083', 'Mission de monsieur ZAMBARE Zakaria sur Bouaké-Yamoussoukro-Dimbokro pour le suivi et évaluation sur l''utilisation des engins GLUTTONà', 1200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:50:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e8a620a0-8bdc-46a9-ae5f-677605471c0a', 'ARTI110250082', 'Mission de SAMBARE Zakaria sur Badikaha-Tafire-Korhogo pour le suivi et ?valuation sur l''utilisation des engins GLUTTONà', 1050000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:51:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7ffc626-375a-4d8d-9e78-b19c7f150b59', 'ARTI110250081', 'Mission de monsieur GBAMELE Siméon sur Badikaha-Tafire-Korhogo pour le suivi et ?valuation sur l''utilisation des engins GLUTTONà', 1050000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:52:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b56cd84-6e50-43f0-b375-68b6876c75a2', 'ARTI110250080', 'Situation des honoraires des gendarmes du mois d''octobre 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-10-14T21:53:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('66adacb8-4874-4add-a939-4d640cf2f59e', 'ARTI110250079', 'Situation des honoraires des médecins du mois d''octobre 2025', 1300000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:54:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('68570e6d-ba41-49f2-acbd-9844587953c0', 'ARTI110250078', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS D''OCTOBRE 2025à', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-10-14T21:55:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4ce3ca4f-c6b1-4801-8038-96637154ebd6', 'ARTI110250077', 'Projet d''acquisition du siSge social de l''Autorité de Régulation du Transport Intérieur (ARTI)', 2300000000, 'ETUDE DE Me MANGOUA CHARLOTTE YOLANDE', 'valide', '2025-10-14T21:56:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4d5ddd56-6b1c-4d3e-ac46-a2f00fd07f6e', 'ARTI110250076', 'Mission de monsieur BOKOUA sur Bouaké pour l''atelier de validation du cadre Politique de réinstallation (CPR)à', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:57:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4084b995-df77-4c44-89ab-79a9cb9c12a4', 'ARTI110250075', 'Situation impôt retenu à la source du mois d''octobre 2025', 300000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:58:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6834ed5a-8a9e-4f4f-a0cc-d49f0825d9b2', 'ARTI110250074', 'RSglement de la facture SODECI Bouaké pour le mois de septembre 2025', 7020, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T21:58:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3a89b4c1-3312-446c-9f22-0401654b6ad0', 'ARTI110250073', 'Demande de révision du véhicule MITSUBISHI MONTERO immatriculé 17 KB 01à', 295000, 'GARAGE PGA', 'valide', '2025-10-14T21:59:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21f342ed-fbad-41ab-9fa5-90e02c23178e', 'ARTI110250072', 'RSglement de la facture de fleur de JONQUILLE pour le mois de septembre 2025à', 80000, 'FLEUR DE JONQUILLE', 'valide', '2025-10-14T22:00:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eea561be-f4b6-4d8d-99b8-9958482d16a3', 'ARTI110250071', 'Demande de rSglement des frais d''entretien général de tous les climatiseurs de l''ARTI pour le 3 -Sme trimestre de l''année 2025à', 686000, 'AB SERVICE', 'valide', '2025-10-14T22:01:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1d56f2fd-4c51-401b-9a2b-5557a5e920b0', 'ARTI110250070', 'Situation Cotisation CMU du mois d''octobre 2025', 51000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:03:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('72bdb147-613a-4255-b5b1-b61c84339849', 'ARTI110250069', 'Situation Cotisation CNPS du mois d''octobre 2025', 10592265, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:04:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c45e953f-27d0-473f-82e3-f928a11a8459', 'ARTI110250068', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois d''octobre 2025', 480738, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:05:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dfd7f6ee-95a4-4eb4-ad5c-6bd459154655', 'ARTI110250067', 'Situation de l''Impôt sur les Salaires (IS) du mois d''octobre 2025', 17786886, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:06:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('959c0bfd-b3b9-4097-b371-913cc56e3c94', 'ARTI110250066', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois d''octobre 2025', 320494, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:06:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a47f6af2-bd53-42fd-a9d4-a8376f93c3ac', 'ARTI110250065', 'Situation des indemnités des stagiaires du mois d''octobre 2025', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:07:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6780c2bf-225f-4ac8-811a-af7699aa7bd0', 'ARTI110250064', 'Situation du salaire et appointement du mois d''octobre 2025', 57684585, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-14T22:08:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc3b4862-47ed-4283-8422-d338b9e3c1e3', 'ARTI110250084', 'Demande de révision du véhicule NISSAN PATROL immatriculé 6767 KR 01', 525750, 'ATC COMAFRIQUE', 'valide', '2025-10-15T05:44:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5897da43-8e37-46cf-a06c-86e7249ba708', 'ARTI110250085', 'Expédition de courriers pour invitation à l''atelier de sensibilisation et de formation des acteurs du transport intérieur', 53100, 'CODITRANS', 'valide', '2025-10-15T10:44:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3d61587f-3e5d-4252-9277-ebe7b32eca3d', 'ARTI110250114', 'Autorisation d''effectuer les dépenses relatives à l''achat de viennoiseries pour le cocktail de fin de la célébration de l''Octobre rose 2025', 308000, 'CATHY DELICE', 'valide', '2025-10-19T23:08:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a5a9a10-d728-4768-9104-6b99039ad7e7', 'ARTI110250113', 'Etablissement d''un Bon de Commande - Production et fourniture de supports de communication (Phase 1 de l''Enqu^te de Satisfaction - Axe Treichville)à', 1816763, 'FOTOGRAPHIC EVENT', 'valide', '2025-10-19T23:10:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('709b5285-9760-4027-8939-cfd54a63673f', 'ARTI110250112', 'Demande de paiement de la facture CIE (Compteur 1) du siSge de l''ARTI pour la période du 04/08/2025 au 04/10/2025', 1124720, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-10-19T23:10:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2b96de4a-2096-4acb-bed2-6586c30c3abe', 'ARTI110250111', 'Prise en charge de l''assurance automobile pour le véhicule NISSAN PATROL 27823WWCI01 pour la période du 17 Octobre au 31 Décembre 2025à', 1003410, 'ASSURE PLUS', 'valide', '2025-10-19T23:11:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bf2a52db-3907-47b2-a1f8-8cd24f42144c', 'ARTI110250110', 'Demande de paiement de la facture d''assurance Automobile de la NISSAN PATROL 27823WWCI01 pour l''année 2026à', 5127985, 'ASSURE PLUS', 'valide', '2025-10-19T23:12:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('351d8825-f0f3-4d69-961a-9cf73e65fd61', 'ARTI110250109', 'Demande de paiement de la facture CIE (Compteur 2) du siSge de l''ARTI pour la période du 04/08/2025 au 04/10/2025à', 1346065, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-10-19T23:12:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a310c2e-7597-4ea7-a0d3-44f820546fa1', 'ARTI110250108', 'Mission du Directeur Général sur Badikaha-Tafire-Korhogo pour le suivi et évaluation sur l''utilisation des engins GLUTTONà', 1050000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:13:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('43d9ce48-d413-4f19-b4da-09fe8b1f6afe', 'ARTI110250107', 'Mission du Directeur Général sur Bouaké-Yamoussoukro-Dimbokro pour le suivi et évaluation sur l''utilisation des engins GLUTTONà', 1200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:14:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('72bb372c-a967-422a-a362-f2fbb7adf761', 'ARTI110250106', 'Commande de fournitures de bureau et de documents de travail dans le cadre de l''élaboration de la norme qualité CT 21à', 7730000, 'YESHI SERVICES', 'valide', '2025-10-19T23:15:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e8664254-bdee-4449-830a-a871dd13c426', 'ARTI110250105', 'Demande de rSglement du cachet de l''intervention de l''auteure - octobre rose 2025', 250000, 'Acteurs externes de l''ARTI', 'valide', '2025-10-19T23:16:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d61e70a3-ba4e-49d4-a4e3-9d0ad578bcf4', 'ARTI110250104', 'Demande de rSglement du cachet du médecin consultant - octobre rose 2025', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-10-19T23:17:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ebb2703f-aa61-4a74-b379-024e432087ba', 'ARTI110250103', 'REGULARISATION-Visite utilisation GLUTTON', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:18:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('061b44c9-e51d-4094-9cad-5e3070573aa3', 'ARTI110250102', 'Remise de deux (02) engins GLUTTON', 600000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:19:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4208a8ad-36c2-4040-b7a3-2eee8a279248', 'ARTI110250101', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 1', 1050000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:19:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c6e65189-d7ee-4f19-abb0-2afa0d0b8775', 'ARTI110250100', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 1', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:20:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8f5988af-efc8-4d0a-8d61-75aa74fdebba', 'ARTI110250099', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 1', 175000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:21:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a89368c-e4db-43c6-b5da-466f0c05f34f', 'ARTI110250098', 'Suivi et évaluation sur l''utilisation des engins GLUTTON : Phase 2', 900000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:22:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9810ced9-5d0a-4754-afc9-cc38d64e39df', 'ARTI110250097', 'Demande d''obtention de Tampons-cachets pour le Sous-Directeur du Développement des Ressources Humaines et le Sous-Directeur de la Passation des Marchésà', 19600, 'YESHI SERVICES', 'valide', '2025-10-19T23:24:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ea3b277-de00-4c20-a1c6-01777b1d45cc', 'ARTI110250096', 'REGULARISATION DES FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI -DANS LE MOIS D''AOUT 2025', 17005, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:26:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('19a1dc6b-654f-4ccc-9c94-5de50e609819', 'ARTI110250095', 'REGULARISATION DES FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI -DANS LE MOIS DE SEPTEMBRE 2025à', 12380, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:27:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4f6c261e-9c21-46a5-906f-d3dfb777a990', 'ARTI110250094', 'Demande de paiement de la facture d''Assurance Multirisque Professionnelle de l''ARTI pour la période du 26 Ao-t au 31 Décembre 2025à', 115520, 'ASSURE PLUS', 'valide', '2025-10-19T23:28:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b1a01fde-3717-4cc0-be72-4fffe5d11eca', 'ARTI110250093', 'REGULARISATION DES FRAIS DE TRANSPORT ADMINISTRATIFS (TAXI) DU MOIS D''AOUT 2025à', 126350, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:29:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('217dba7b-095c-4eed-8c32-858f64ac559c', 'ARTI110250092', 'Régularisation des frais de nettoyage des véhicules de pools pour le mois d''aout 2025à', 6000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-10-19T23:30:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d0af796a-1cf5-4aef-9fbf-cd6e570e689f', 'ARTI110250091', 'REGULARISATION FRAIS D''ACHAT DE CREDIT DE COMMUNICATION DANS LE CADRE DES ACTIVITES DE L''ARTI POUR LE MOIS DE SEPTEMBRE 2025à', 300000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-19T23:31:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a701aaa6-7ae9-4295-8221-aa3ee3ec8a1f', 'ARTI110250128', 'Demande d''achat d''ouvrages pour un don au personnel féminin de l''ARTI dans le cadre de la célébration de Octobre rose 2025', 100000, 'FONDATION AGIR CONTRE LE CANCERS', 'valide', '2025-10-21T05:40:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6cf45dec-36aa-48db-8cba-440e704e1eac', 'ARTI110250127', 'Demande de paiement de la facture du petit déjeuner organisé dans le cadre des 5ans de l''ARTI', 300000, 'TRILOGY EVENTS & COM', 'valide', '2025-10-21T05:41:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a2da1b8-0fea-4116-9234-5897fd0711a4', 'ARTI110250126', 'Demande de rSglement de la facture d''impression des Etiquettes vynil pour les˜Machines GLUTTONà˜', 233640, 'HOODA GRAPHIQUE', 'valide', '2025-10-21T05:42:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('73db6d94-2ebb-437b-b05a-700d0ff72216', 'ARTI110250125', 'Situation des indemnités de la DRRN du mois d''octobre 2025', 1624837, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-21T05:45:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1cbc7d19-642d-461c-b698-1111c273a775', 'ARTI110250124', 'Demande d''acquisition de nouveaux badges d''accSs au siSge de l''ARTI', 2950000, 'IVOIRE CARTES SYSTEMES', 'valide', '2025-10-21T05:46:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('afa62867-5d7a-446a-94e1-4abac3500fe5', 'ARTI110250123', 'Achat de deux (02) plaques signalétiques supplémentaires pour le siSge de l''ARTIà', 33040, '2BPUB', 'valide', '2025-10-21T05:48:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a0b35347-0437-4216-a986-12b08377f0e6', 'ARTI110250122', 'Rechargement des cartes de carburant du mois de Novembre 2025', 4425000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-10-21T05:50:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb74e1e2-844a-495d-84cb-a69970282865', 'ARTI110250121', 'Régularisation de la mise à disposition de fonds en vue de la constitution d''un dépôt à terme (DAT) dans le cadre de l''acquisition du siSge social de l''ARTI', 250000000, 'COMPTE COURANT BHCI', 'valide', '2025-10-21T05:51:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b575a0d3-1cc6-4978-b32d-17c5c97f2c7c', 'ARTI110250120', 'Acquisition de trois (03) véhicules automobiles de type ISUZU Mu-X', 108000000, 'SOCIDA', 'valide', '2025-10-21T05:52:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7c51e144-a9f6-4bbe-a5fb-e95786db1d07', 'ARTI110250119', 'Achat de fournitures alimentaires pour la tenue du Conseil de Régulation du 30 Octobre 2025', 86050, '', 'valide', '2025-10-21T05:52:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3abba95f-2d79-4793-b37c-a4f031f082ef', 'ARTI110250118', 'Autorisation pour l''établissement d''un Bon de Commande pour la confection et la fourniture de supports de communication (Phase 2 de l''Enqu^te de Satisfaction - Axe YAMOUSSOUKRO)à', 8000000, 'SUCCES IMPRIM GROUPE', 'valide', '2025-10-21T05:55:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('86a3c7f0-8f08-41cd-a4de-c75ed2796ede', 'ARTI110250117', 'Acquisition de gadgets de communication pour l''atelier de sensibilisation sur la norme NI505˜:2025 (Lot 1- 2BPUB)', 39825, '2BPUB', 'valide', '2025-10-21T05:56:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1bf5b1dc-97f5-4725-9412-7e1eb70698ea', 'ARTI110250116', 'Soutien financier à l''association cour à cour', 500000, 'Acteurs externes de l''ARTI', 'valide', '2025-10-21T05:57:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('097a25cb-3c0f-4ac3-9ef2-56f31f5fe9f0', 'ARTI110250115', 'Demande d''impression du code de conduite de l''ARTI', 195000, 'HOODA GRAPHIQUE', 'valide', '2025-10-21T05:58:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c04d0942-63f1-44b2-b3e6-146831a48f9d', 'ARTI110250090', 'REGULARISATION DES FRAIS DE TRANSPORT ADMINISTRATIFS (TAXI) DU MOIS DE SEPTEMBRE 2025à', 188450, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-21T05:59:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('33e7a741-aaf2-46cb-8b1f-ad189db2a7b1', 'ARTI110250089', 'Régularisation des frais de nettoyage des véhicules de pools pour le mois de septembre 2025à', 15500, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-10-21T06:00:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0626b4b9-19f4-48a6-a680-c7855b16cf48', 'ARTI110250088', 'Demande de réapprovisionnement de fournitures de bureau', 496662, 'PAPIGRAPH CI', 'valide', '2025-10-21T06:01:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0899f699-e1c1-45a6-93cb-25acf675480e', 'ARTI110250087', 'Demande d''achat de cartouches d''encre pour imprimante HP 207_ phase 2', 1044000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-10-21T06:02:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('54619b03-0a94-4c02-87e5-a6dccf5518b6', 'ARTI110250086', 'Demande de paiement de la facture relative à la livraison de compositions florales pour le mois de Septembre 2025 (FLOREAL)', 193000, 'Floréal', 'valide', '2025-10-21T06:03:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7826f8cb-8bac-4659-9998-67c839e3ef9b', 'ARTI110250138', 'Frais de réfection de la peinture de la salle de conférence', 80360, 'LEDIA', 'valide', '2025-10-22T12:04:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc944f5e-cf7c-458a-abf6-dd4bac3a2988', 'ARTI110250137', 'Achat d''un téléphone portable pour la Direction Générale de l''ARTI (1)à', 870466, 'APPLE RETAIL FRANCE', 'valide', '2025-10-22T12:13:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3cf97a9f-ed1c-472d-a498-d6f7961c417d', 'ARTI110250136', 'Achat d''un téléphone portable pour la Direction Générale de l''ARTI (2)à', 1034209, 'APPLE RETAIL FRANCE', 'valide', '2025-10-22T12:14:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c4f99a4e-7b86-4144-bb4d-7ed5504e919b', 'ARTI110250135', 'Pose de film XS carbone complet sur la NISSAN PATROL 27823WWCI01', 220000, 'PRO GLASS CI', 'valide', '2025-10-22T12:18:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef43fc05-9bfc-4713-9432-aa4ab53bb820', 'ARTI110250134', 'Demande de paiement des prestations supplémentaires de Trilogy Event pour les 5ans de l''ARTI', 2317500, 'TRILOGY EVENTS & COM', 'valide', '2025-10-22T12:20:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b50467a-152f-451f-8b9f-f7c112112b39', 'ARTI110250133', 'Transport pour le démantSlement du site ayant abrité la cérémonie commémorative des cinq (05) ans de l''ARTI', 2695000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-22T12:22:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e31b8c29-2279-4cc0-9e86-b4d64808a7ae', 'ARTI110250132', 'Demande de paiement de la facture du déjeuner d''affaire du 07 Octobre 2025', 565000, 'CASA Ekwa', 'valide', '2025-10-22T12:30:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52bedb58-bbcf-4c2e-8944-a45a3cc86e14', 'ARTI110250131', 'Regularisation / Note explicative relative à la formation en communication de crise et gestion des médias', 2401000, 'AFCCI', 'valide', '2025-10-22T12:33:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d976733-c845-4dca-be85-5007b27b6aea', 'ARTI110250130', 'Acquisition de fiche de mutation du véhicule FORD EXPLORER immatriculé 1415 LJ01à', 12500, 'CGI', 'valide', '2025-10-22T12:35:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e3ea42eb-55d7-42a0-a00a-1d853438e8bc', 'ARTI110250143', 'Acquisition de gadgets de communication pour l''atelier de sensibilisation sur la norme NI505˜:2025 (Lot 2- HOODA GRAPHICS)', 566400, 'HOODA GRAPHIQUE', 'valide', '2025-10-22T23:32:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('610fddf0-c8c3-45d3-904b-155089a7c2a2', 'ARTI110250142', 'Frais de couverture médiatique de l''atelier de sensibilisation sur la norme NI505˜:2025', 532000, 'PRESSES RADIO', 'valide', '2025-10-22T23:32:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e879749-f647-4e4c-833f-dcfd90807662', 'ARTI110250141', 'Autorisation pour l''établissement d''un Bon de Commande pour la confection et la fourniture de supports de communication (Phase 2 de l''Enqu^te de Satisfaction - Axe BOUAKE)à', 8000000, 'SUCCES IMPRIM GROUPE', 'valide', '2025-10-22T23:34:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a307c8e1-900c-40e4-968e-05a91f48420a', 'ARTI110250140', 'Autorisation pour l''établissement d''un Bon de Commande pour la confection et la fourniture de supports de communication (Phase 2 de l''Enqu^te de Satisfaction - Axe DIVO)à', 6500000, 'SUCCES IMPRIM GROUPE', 'valide', '2025-10-22T23:41:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dcb860f7-8631-4878-aab3-ebc12a3cfd78', 'ARTI110250129', 'FRAIS DE TRANSPORT ADMINISTRATIF(TAXI) DU 1er AU 17 OCTOBRE 2025', 68000, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-22T23:42:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('654e3d3d-c761-430d-b937-1a75af693194', 'ARTI110250145', 'Demande d''achat de divers articles pour la Direction Généraleà', 130350, '', 'valide', '2025-10-23T10:53:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e8c7c249-1797-4944-b1c8-8f602c953661', 'ARTI110250144', 'Acquisition de deux (02) souris USB pour le siege de l''ARTIà', 17000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-10-23T10:55:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('278a5185-ceea-4940-914a-cc85ec9aa136', 'ARTI110250162', 'Location d''un groupe électrogSne dans le cadre de la cérémonie marquant les cinq (05) ans de l''Autorité de Régulation du Transport Intéreiur( ARTI)', 3430000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:05:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3d9b8e5a-1bae-4346-b578-cd6411b16170', 'ARTI110250161', 'Demande d''achat de bon cadeau pour les enfants du personnel de l''ARTI dans le cadre des f^tes d''année 2025', 1590000, 'PRIZY', 'valide', '2025-10-24T15:06:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f4fde971-9f13-4a74-8f5b-3baf2a82a7d8', 'ARTI110250160', 'Location de véhicules de prestige pour les invités de marque dans le cadre de la cérémonie commémorative des cinq (05) ans de l''ARTI', 4410000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:07:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f94545fc-014e-4ada-b7f7-96744d8828a3', 'ARTI110250159', 'Location de véhicules de type 4x4 dans le cadre de la phase 2 de l''Enqu^te de satisfaction des usagers du transport intérieur sur l''axe Bouake', 4410000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:08:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b3098e04-3092-4646-b616-855a5453293f', 'ARTI110250158', '', 8330000, 'ESPACE YEMAD', 'valide', '2025-10-24T15:09:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6d0d8a6f-c9b3-495c-a46a-8bd41bd4a1fb', 'ARTI110250157', 'Nettoyage et démantSlement du site ayant abrité la cérémonie commémorative des cinq (05) ans de l''ARTI', 4410000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:11:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fd21bf97-d1a4-4bfc-869c-0b158a6ef51a', 'ARTI110250156', 'Diner de travail de la Direction Générale de l''ARTI dans le cadre de la préparation de la 3S session du Conseil de Régulation', 437500, 'CARA CENTER', 'valide', '2025-10-24T15:12:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('84ffeff4-930e-4cdf-8d17-d6732e44164c', 'ARTI110250155', 'Etablissement d''un Bon de Commande - Production et fourniture de gadgets et tee-shirts pour (Phase 1 de l''Enqu^te de Satisfaction - Axe Yopougon)à', 13849556, 'FOTOGRAPHIC EVENT', 'valide', '2025-10-24T15:13:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('363ce5b6-ad5d-40b8-acbd-9e8870c50bea', 'ARTI110250154', 'Etablissement d''un Bon de Commande - Production et fourniture de supports de communication (Phase 1 de l''Enqu^te de Satisfaction - Axe Cocody)à', 11291756, 'FOTOGRAPHIC EVENT', 'valide', '2025-10-24T15:14:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5eb57cb3-a087-4ba6-965e-e95f15efead4', 'ARTI110250153', 'Location de salleé la-mise à disposition de la logistique et le service de la restauration pour l''organisation d''ateliers et session de formation dans le cadre du projet de mise en ouvre du SystSme de Management de la Qualité (SMQ) conformément à la norme', 17885000, 'ESPACE YEMAD', 'valide', '2025-10-24T15:16:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7455ea67-4964-40f8-933b-b5511e2a8565', 'ARTI110250152', 'Location de véhicules de type 4x4 dans le cadre de la phase 2 de l''Enqu^te de satisfaction des usagers du transport intérieur sur l''axe Divo', 2450000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:17:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5b3fb52a-8849-41d0-a30e-25915fa78727', 'ARTI110250151', 'Location de véhicules de type 4x4 dans le cadre de la phase 2 de l''Enqu^te de satisfaction des usagers du transport intérieur sur l''axe Yamoussoukro', 4410000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-10-24T15:18:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7012fa7-9416-43f2-a0ef-29d4b969d901', 'ARTI110250163', 'Sécurité privée des locaux de l''ARTI pour le mois d''Octobre 2025', 2001280, 'SIGASECURITE', 'valide', '2025-10-24T15:20:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a632cdb0-3bc6-4878-9571-0e40b359db92', 'ARTI110250150', 'Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission du Président du Conseil de Régulation du 13 au 19 septembre 2025', 2755019, 'EMMA CAB', 'valide', '2025-10-24T15:21:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d88ec29c-9504-45bd-b7e7-c9a4dae8a295', 'ARTI110250149', 'REGULARISATION Hébergement du Président du Conseil de Régulation lors de sa mission en France auprSs du Cabinet C5P dans le cadre du projet de développement ferroviaire de l''ARTIà', 758614, 'RESIDENCE HOTELIERE O''LORD', 'valide', '2025-10-24T15:21:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d12c5623-be27-45b1-b452-144e5087b7c8', 'ARTI110250148', 'Déjeuner dans le cadre d''une rencontre professionnelle de la Direction Générale de l''ARTI', 338500, 'LE MECHOUI', 'valide', '2025-10-24T15:22:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a67abbd3-64c2-4f75-a91c-f86d8491fead', 'ARTI110250164', 'Création d''une carte péage FER pour la Direction Générale de l''ARTIà', 10000, 'FONS D''ENTRETIEN ROUTIER', 'valide', '2025-10-24T15:23:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fe1fa9e8-132c-4e85-a3c6-f35740a469e6', 'ARTI110250147', 'Régularisation-Couverture médiatique octobre rose', 110000, 'PRESSES RADIO', 'valide', '2025-10-24T15:24:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb50aa91-b04f-45ed-ad4b-76a67faec6ae', 'ARTI110250165', 'Création d''une carte péage HKB pour la Direction Générale de l''ARTIà', 15000, 'SOCOPRIM SA (HKB)', 'valide', '2025-10-24T15:25:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c27a26c5-9502-4a55-991d-d2fe5d42c7e3', 'ARTI110250166', 'Demande de˜rSglement de la facture d''accompagnement de l''ARTI à la réalisation de son systSme de management de la qualité (SMQ) selon les exigences de la norme ISO 9001 (2015)˜', 4800000, 'CODINORM', 'valide', '2025-10-24T15:27:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('770dc5d3-368f-4e66-9c6b-b8cb5f7bce61', 'ARTI110250146', 'Location d''une salle équipée dans le cadre de l''atelier de sensibilisation sur la norme ISO 9001 (2015)', 805000, 'PALM CLUB HOTEL', 'valide', '2025-10-24T15:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e746639-6e9d-433b-a6dc-d18a26013a6b', 'ARTI110250171', 'Acquisition de gadgets de communication grand public pour la célébration De l'' r˜Octobre Rose˜_ 2025_ LOT 1 : (HOODA GRAPHICS)', 188800, 'HOODA GRAPHIQUE', 'valide', '2025-10-25T06:36:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3b9d9762-356e-418e-884f-6fd0a7708c3f', 'ARTI110250170', 'Regularisation / Note explicative relative à la formation sur la conduite d''enqu^te de satisfaction', 2744000, 'AFCCI', 'valide', '2025-10-25T06:37:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1d502e00-1ccf-4d19-a467-1b1ca7e1a9b7', 'ARTI110250169', 'Frais de restauration du personnel de l''ARTI pour le mois de Décembre 2025', 8122400, 'T & P EVENT', 'valide', '2025-10-25T06:38:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c2971cfc-f292-4e10-957c-40efd452e7d2', 'ARTI110250168', 'Frais de restauration du personnel de l''ARTI pour le mois de Novembre 2025', 7384000, 'T & P EVENT', 'valide', '2025-10-25T06:39:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e4920d6-ceab-4237-ac51-f032b7456b5c', 'ARTI110250167', 'REGULARISATION REMBOURSEMENT DES FRAIS DE RECEPTION MISSION AUPROS DU CABINET C5P RELATIVE AU PROJET DE DEVELOPPEMENT FERROVIAIRE DU 15 AU 30 SEPTEMBRE 2025à', 2836976, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-25T06:40:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('92c32228-f868-46fd-8ab9-faa16e4d7ef9', 'ARTI110250173', 'Organisation de la formation des agents de l''ARTI avec le cabinet Afrique Formation Conseil Côte d''Ivoire sur le thSme r Conduite de l''enqu^te de satisfaction _ à l''Espace YEMAD du 7 au 9 octobre 2025à', 7433100, 'ESPACE YEMAD', 'valide', '2025-10-27T21:39:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b11de0f6-c9bb-4f05-a197-070c08b2f619', 'ARTI110250172', 'Paiement du solde des honoraires du notaireé MaOtre MANGOUA Charlotte-Yolandeé dans le cadre du projet d''acquisition du siSge ARTI', 124411250, 'ETUDE DE Me MANGOUA CHARLOTTE YOLANDE', 'valide', '2025-10-27T21:40:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('45d8654c-f066-4202-85e6-74e5aca161a4', 'ARTI110250182', 'RSglement˜de la facture de pressing pour l''entretien˜des pochettes et chasublesà˜', 92200, 'ECO-CLAIR SARL', 'valide', '2025-10-28T06:56:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f656324a-cc45-4cad-a4cf-cb2e155e254b', 'ARTI110250181', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de Octobre 2025', 235000, 'H2O PISCINE', 'valide', '2025-10-28T06:56:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('14983bf5-66cb-41d8-9f0b-e01ae0330af6', 'ARTI110250180', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de Novembre 2025', 235000, 'H2O PISCINE', 'valide', '2025-10-28T06:57:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('235e409d-bff2-43d6-8d6e-68079897be68', 'ARTI110250179', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois d''Octobre 2025', 327467, 'MI3E', 'valide', '2025-10-28T06:58:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c43d63f7-600d-45ac-89c6-d5c01c5213ec', 'ARTI110250178', 'RSglement mensuel de la facture du mois de Novembre 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-10-28T06:59:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3566695f-427e-4621-ae79-3b005903ac60', 'ARTI110250177', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de Novembre 2025', 327467, 'MI3E', 'valide', '2025-10-28T07:00:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6c47b5a9-4c3f-4540-b1ab-c00598f7b3aa', 'ARTI110250176', 'Entretien général des groupes électrogSnes de l''ARTI pour le mois de Decembre 2025', 327467, 'MI3E', 'valide', '2025-10-28T07:01:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('80447224-3b10-473d-9dc2-8c920cd0798d', 'ARTI110250175', 'RSglement mensuel de la facture du mois de Décembre 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-10-28T07:01:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e621347c-5c03-4dae-afe1-9140ad909b82', 'ARTI110250174', 'RSglement mensuel de la facture du mois de Octobre 2025 pour l''entretien des locaux de l''ARTI', 1381800, 'KADIA ENTREPRISES', 'valide', '2025-10-28T07:02:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8254e99c-3c2c-433d-a718-0c9c8e287bce', 'ARTI110250187', 'Location de salleé la-mise à disposition de la logistique et le service de la restauration pour l''organisation d''ateliers et session de formation dans le cadre du projet de mise en ouvre du SystSme de Management de la Qualité (SMQ) conformément à la norme', 14543200, 'ESPACE YEMAD', 'valide', '2025-10-28T22:49:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3ebb35f4-b341-4045-9fde-1d9a17b9df86', 'ARTI110250186', 'Location de salle à l''Espace YEMAD pour la séance de travail relative à la mise en conformité de l''ARTI en matiSre de protection des données à caractSre personnel', 6840000, 'ESPACE YEMAD', 'valide', '2025-10-28T22:51:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('235000e6-69b5-4f0e-8835-6e1287c30b98', 'ARTI110250185', 'Location de Pick Up TOYOTA pour la phase 2 de l''enqu^te de satisfaction', 156800, 'CI2T & COMPAGNY', 'valide', '2025-10-28T22:51:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f198b37a-2ff3-43a8-ba3c-96cff5e13f28', 'ARTI110250184', 'RSglement de la facture de location d''un véhicule de type SUV HAVAL pour la phase 2 de l''enqu^te de satisfaction', 721280, 'CI2T & COMPAGNY', 'valide', '2025-10-28T22:52:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b59d7f75-ffb8-4b3d-a182-398db77c9567', 'ARTI110250183', 'Jetons de présence de la troisiSme réunion du Conseil de Régulation de l''ARTI au titre de l''année 2025é le 06 novembre à', 3500000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-10-28T22:56:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b9f566a7-f3cb-465a-bc69-dcc66fbbb6aa', 'ARTI110250190', 'Sécurité privée des locaux de l''ARTI pour le mois d''Octobre 2025', 2001280, 'SIGASECURITE', 'valide', '2025-10-29T10:12:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4a3e6172-a74b-4037-b213-db7c3d96a198', 'ARTI110250189', 'Demande d''achat de bons-valeurs de carburant_ Novembre 2025', 4000000, 'PETRO IVOIRE', 'valide', '2025-10-29T10:14:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f448b1b7-28ae-4eff-8d2a-63e68ce3ebc1', 'ARTI110250188', 'Demande de réparation sur la NISSAN PATROL immatriculée 6767 KR 01', 884135, 'ATC COMAFRIQUE', 'valide', '2025-10-29T10:15:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d6fe9752-fe28-4ede-bded-223e42f6eaa2', 'ARTI110250198', 'Régularisation_ Demande d''autorisation pour les travaux de maintenance et d''entretien du serveur principal et accessoires du siSge de l''ARTI', 3626000, 'International Software Corporation', 'valide', '2025-10-30T09:02:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a6ede159-469d-4e17-82da-31b9d6dd5b3d', 'ARTI110250197', 'Régularisation de l''achat de carburant pour la HYUNDAI I10 immatriculé 615 KP 01 du 07 Octobre 2025', 20000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-10-30T09:04:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b9994eca-7fdf-4bb2-92b3-b15cb6b7b192', 'ARTI110250196', 'FRAIS DE TRANSPORT ADMINISTRATIF(TAXI) DU 20 AU 24 OCTOBRE 2025', 42500, 'PERSONNEL DE L''ARTI', 'valide', '2025-10-30T09:06:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f790c453-e30c-4fa8-93dc-b252bab0b1a3', 'ARTI110250195', 'Demande de rSglement de facture liée à l''intervention sur le climatiseur de la salle informatique', 24500, 'AB SERVICE', 'valide', '2025-10-30T09:08:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f6d625b6-35ce-4b23-9c8b-8e8cfacafb30', 'ARTI110250194', 'Demande de rechargement des BOX WIFI prépayées MOOV AFRICA de l''ARTI pour le mois de Novembre 2025', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-10-30T09:09:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f7b7422b-36bd-40e0-84db-9b2d20bdd3bc', 'ARTI110250199', 'Régularisation de la facture liée à la pré visite du véhicule FORD RANGER immatriculé 4327 KS 01', 35000, 'GROUPE FSA', 'valide', '2025-10-30T09:11:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('da5fdaed-8c4b-47f9-93d0-88e4aaadc1ca', 'ARTI110250193', 'Régularisation de l''achat de carburant pour la HYUNDAI I10 immatriculé 615 KP 01 du 13 Octobre 2025', 20000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-10-30T09:13:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8f7aa59a-bb1b-4517-be20-7dc6e535e247', 'ARTI110250192', 'Régularisation de l''achat de carburant pour la HYUNDAI I10 immatriculé 615 KP 01 du 03 Octobre 2025', 10000, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-10-30T09:15:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f8633891-dc9d-405f-8fa5-54301bff76d4', 'ARTI110250191', 'Régularisation des frais bancaires prélevés à la source par la Banque de l''Habitat de Côte d''Ivoire (BHCI) dans le cadre du déblocage du pr^t pour l''acquisition du siSge social de l''ARTIà', 30800000, 'COMPTE COURANT BHCI', 'valide', '2025-10-30T09:17:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a69eba49-cf74-451f-84a0-cfa9188f4da2', 'ARTI110250200', 'Régularisation_Location de salle et la-mise à disposition de la logistique dans le cadre de la cérémonie de présentation des voux de Nouvel An 2025', 8330000, 'ESPACE YEMAD', 'valide', '2025-10-31T07:44:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ffffd538-2e1d-4667-b7bd-7553614f3817', 'ARTI110250205', 'Régularisation_ Demande d''autorisation pour la production du bulletin d''information no003 - Mars 2025 du Régulateur', 8967000, 'FOTOGRAPHIC EVENT', 'valide', '2025-10-31T12:38:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e44c3ca1-47c8-4e92-8bee-1b07259ab0d0', 'ARTI110250204', 'Location d''un camion pour la phase 2 de la campagne de sensibilisation du 12 au 14 Novembre 2025', 588000, 'OUEDRAOGO SEYDOU SERVICE', 'valide', '2025-10-31T12:38:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aaffa54d-8eef-4c45-8918-1ef1ec5dbadf', 'ARTI110250201', 'Demande de remplacement des quatre (04) pneus avant du véhicule FORD EXPLORER immatriculé 1415 LJ 01', 1484254, 'CACOMIAF', 'valide', '2025-10-31T12:39:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8967e7a8-4ba6-47c9-9ad8-709dc88529f6', 'ARTI110250202', 'Régularisation de l''acquisition de documents juridiques supplémentaires pour la constitution d''une bibliothSque de la DRRN', 33000, 'CNDJ', 'valide', '2025-10-31T12:41:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d3133f19-d2b9-47b3-b981-b9ff9ca14456', 'ARTI110250203', 'Prise en charge de l''assurance Auto du nouveau véhicule TOYOTA CROSS  54982WWCI01 pour la période du 15 Octobre au 31 Décembre 2025à', 206145, 'ASSURE PLUS', 'valide', '2025-10-31T12:42:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('20a15ca3-41ae-4baa-aa07-643032422f1d', 'ARTI110250207', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFAITAIRES POUR LE MOIS D''OCTOBRE 2025 ( PPSSI)à', 380966, 'DGI', 'valide', '2025-11-01T20:18:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8a7a162-4769-459f-b1dc-1ce2c1ab2e1f', 'ARTI110250206', 'Régularisation de l''acquisition de documents juridiques complémentaires et souscription à des abonnements pour la constitution d''une bibliothSque', 317000, 'CNDJ', 'valide', '2025-11-01T20:20:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6167f883-a422-4684-bfed-ef8bf09c5e92', 'ARTI111250003', 'Régularisation_Demande d''autorisation pour la production et la fourniture de gadgets et tee-shirts dans le cadre de la mission de sensibilisation des acteurs du transport intérieur', 6899400, 'SUCCES IMPRIM GROUPE', 'valide', '2025-11-03T08:09:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52845e8d-20e1-4ae0-b16d-83d1e388012c', 'ARTI111250002', 'Demande d''acquisition du bulletin d''information de l''ARTI pour le mois d''Octobre 2025', 1548750, 'GCIS CONCEPT SARL', 'valide', '2025-11-03T08:10:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5fe3209-061b-4bd6-b7c9-48fa6b6c86c1', 'ARTI111250001', 'Captation photo professionnelle du personnel entrant de l''ARTI', 127400, 'SLK Studios', 'valide', '2025-11-03T08:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('36ae01ee-a314-4b83-a5a6-258faf11ecb6', 'ARTI111250004', 'Couverture médiatique des ateliers de formation et sensibilisation des acteurs du transport intérieur Phase 2 _ AIP', 80000, 'PRESSES RADIO', 'valide', '2025-11-03T12:16:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1c35da84-6f29-4a8d-ac09-f575ec64b835', 'ARTI111250005', 'Couverture médiatique des ateliers de formation et sensibilisation des acteurs du transport intérieur Phase 2 _ Radio Bédiala', 160000, 'PRESSES RADIO', 'valide', '2025-11-03T12:17:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b02a31fd-de29-41c6-adbd-578813f14e16', 'ARTI111250006', 'Couverture médiatique des ateliers de formation et sensibilisation des acteurs du transport intérieur Phase 2 _ RTI', 180000, 'PRESSES RADIO', 'valide', '2025-11-03T12:19:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('02a832da-1e02-43a6-a468-bf844cc657a4', 'ARTI111250007', 'Achat de casques motos pour la phase 2 de l''atelier de sensibilisation et formation des acteurs du transport intérieur', 1000000, 'GROUP IVOIRE MOTO-SARL', 'valide', '2025-11-04T04:40:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58438b8f-38e8-4eda-bc62-44e40b12d034', 'ARTI111250023', 'FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI -DANS LE MOIS D''OCTOBRE 2025à', 6430, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:20:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('21d6fd21-59f3-4bbc-ba42-1df60723e0c8', 'ARTI111250022', 'Demande de rSglement de la facture Orange CI pour la consommation de téléphones mobiles du mois d''Octobre 2025', 958779, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-11-04T20:21:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f0d67404-b269-4bd3-a93e-79fd989f0dfa', 'ARTI111250021', 'FRAIS BANCAIRES DU MOIS D''OCTOBRE 2025à', 372252, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-11-04T20:23:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb16302e-fc17-4150-9c2f-cca997151485', 'ARTI111250020', 'FRAIS DE NETTOYAGE DES VEHICULES DE POOLS POUR LE MOIS D''OCTOBRE 2025à', 8500, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:23:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0d13f0d4-789f-4b85-8fc0-3c0c8d50c42d', 'ARTI111250019', 'Frais de transport de Monsieur BOKOUA pour sa mission liée à la phase 2 de l''atelier de sensibilisation et formation du 10 au 13 Novembre 2025à', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:24:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c24999f-b439-4fc4-b267-db7c52d712bc', 'ARTI111250018', 'Demande de révision du véhicule˜NISSAN SUNNY immatriculé˜AA-092-TJ-01˜', 85693, 'ATC COMAFRIQUE', 'valide', '2025-11-04T20:25:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a84f5143-6d5a-4934-9bd8-b12dcfd5b98b', 'ARTI111250017', 'Reprise˜de la note rejetée (782-11-2025˜ ARTI/DAAF/SDMG/GD) relative à˜Achat de quatre (04) poteaux d''incendie˜', 4794340, 'COCITAM', 'valide', '2025-11-04T20:26:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fadcada2-caed-467d-8422-d15553970ab4', 'ARTI111250016', 'Achat de trois (03) distributeurs d''eau pour le siSge de l''ARTI', 206700, 'CLUB SOCOCE', 'valide', '2025-11-04T20:27:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6718873c-e5eb-4a70-bff0-cdec65ef22bd', 'ARTI111250015', 'Demande de réparation sur la VIRTUS TOPLINE immatriculé 494 QY 01', 32398, 'ATC COMAFRIQUE', 'valide', '2025-11-04T20:28:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('30b850ba-b766-46e2-9b6c-94470db3c6c2', 'ARTI111250014', 'Demande de réparation sur la HYUNDAI I10 immatriculé 615 KP 01', 390000, 'GARAGE PGA', 'valide', '2025-11-04T20:29:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('94cd8ecc-3d58-4445-9caa-0731613a706b', 'ARTI111250013', 'RSglement de la facture de fleur de JONQUILLE pour le mois de septembre 2025à', 60000, 'FLEUR DE JONQUILLE', 'valide', '2025-11-04T20:30:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4708ea8d-2e89-431a-a43a-0826538c45b7', 'ARTI111250012', 'RSglement de la facture de GENIAL pour le mois d''Octobre 2025à', 96000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-11-04T20:31:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d6e842aa-df62-44d6-9dbd-7c4188f11893', 'ARTI111250011', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 125000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:32:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cd822a37-99fc-4ed2-9fb6-306d2b4fb732', 'ARTI111250010', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:33:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('80715fc3-5f1e-44e6-b77b-e1d766c05700', 'ARTI111250009', 'Frais de transport de Monsieur VOMOUAN pour sa mission à Bouaflé et Bédiala du 10 au 15 Novembre 2025à', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-04T20:34:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ad5bddd-f2c3-4fc8-ab04-f7f85baf200c', 'ARTI111250008', 'Demande de rSglement de la facture Orange CI pour la consommation réseau internet du mois de Novembre 2025', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-11-04T20:35:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1b993950-9ee5-423a-b354-45ab649dab7b', 'ARTI111250029', 'Régularisation_ Demande d''autorisation pour la restauration dans le cadre de la cérémonie de présentation des voux de Nouvel an 2025', 9500000, 'T & P EVENT', 'valide', '2025-11-06T09:41:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('674df511-95e9-4741-9e47-37d3aed1a431', 'ARTI111250028', 'Régularisation : Demande d''autorisation pour les travaux de terrassement et d''aménagement du site avant la construction du local ARTI de Bouaké', 11857510, 'BATISS CONSTRUCTION', 'valide', '2025-11-06T09:42:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e879dd2-72ff-4d2e-828d-cb395e2835b5', 'ARTI111250027', 'Régularisation : Demande d''autorisation pour la location de salle et la logistique dans le cadre de la séance de sensibilisation des acteurs du transport intérieur', 2597000, 'FOTOGRAPHIC EVENT', 'valide', '2025-11-06T09:45:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d290c4f0-7c9c-4471-8795-fbb7ae8ae41b', 'ARTI111250034', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 250000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-06T17:28:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('530249c9-6d98-4ad7-8710-f61e8bc1bc30', 'ARTI111250033', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 250000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-06T17:29:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a51bb22d-bed5-470a-a7b9-894fdc3ce5be', 'ARTI111250035', 'Demande de rSglement de la facture Orange Fixes du mois d''Octobre 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-11-06T17:31:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cd6b2a3c-a655-435d-8b6f-dab343cf3185', 'ARTI111250031', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 250000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-06T17:33:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e65d332f-dd71-4dfc-9ec1-3e7f7a0e15ad', 'ARTI111250043', 'Location de salle pour la phase 2 de l''atelier de sensibilisation et formation des acteurs du transport intérieur à Bouaflé', 50000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T08:00:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('082465f9-38bb-4da2-aae0-f28f249df5e5', 'ARTI111250042', 'Cachets des interprStes dans le cadre de la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T08:02:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cea85990-afed-4268-a14f-b51ad35d8ec9', 'ARTI111250041', 'Cachets des maitres de cérémonie dans le cadre de la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T08:03:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8e5bf225-1a49-46a4-8607-fe599f8ecb81', 'ARTI111250040', 'Cachet du griot dans le cadre de la phase 2 de sensibilisation et formation des acteurs du transport intérieur à Bédialaà', 50000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T08:05:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49ba1e60-2fa2-4f00-b430-a1a1d57fbe69', 'ARTI111250050', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-07T11:29:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e8cbb3a4-b216-4b27-848c-f7c30e2d0ab1', 'ARTI111250049', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T11:30:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d298df23-e459-463d-828b-81bc451ed15d', 'ARTI111250048', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-07T11:31:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1e12f372-2559-4e98-9545-ec2308ddca20', 'ARTI111250047', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 75000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-07T11:32:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fc0f42d5-175b-41c3-998d-04cf5c196f23', 'ARTI111250046', 'Mission de sensibilisation et de formation des acteurs du transport intérieur', 60000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-07T11:35:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ca1ac834-31b3-4fb7-9bbc-1e9cf3480445', 'ARTI111250045', 'Création de deux (02) spots publicitaires pour les ateliers de formation et sensibilisation des acteurs du transport intérieur Phase 2 _ RTI', 100000, 'PRESSES RADIO', 'valide', '2025-11-07T11:35:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fced4be1-43f1-4dd5-9bb9-a73b7016bd02', 'ARTI111250044', 'Rechargement de la carte péage HKB No 9384010200683000080 pour le mois de Novembre 2025à', 20000, 'SOCOPRIM SA (HKB)', 'valide', '2025-11-07T23:43:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('017bbe88-e44f-4e21-b825-4b9a71ef96d2', 'ARTI111250039', 'Location de Sonorisations pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T23:45:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('835cc29a-f8b2-4e6b-aac7-cb5d2d0291dc', 'ARTI111250038', 'Location de groupes électrogSnes pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T23:46:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d3bc0319-7795-4ec4-bd7f-e2c7b0136cda', 'ARTI111250037', 'Location de chaises et tréteaux à nappes pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T23:47:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1d926b32-7872-40c7-aa8a-26ced71e7789', 'ARTI111250036', 'Location de bŸches pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 60000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-07T23:48:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('83c7521d-04a0-4399-9d82-a958065ce65b', 'ARTI111250032', 'Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission du Directeur Général du 13 au 23 novembre 2025à', 4329316, 'EMMA CAB', 'valide', '2025-11-07T23:50:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9497cd67-9ac7-4598-8e46-e3e8613b2bf0', 'ARTI111250030', 'Achat d''un billet d''avion dans le cadre de la mission du Directeur Général en France et en Belgique du 13 au 23 Novembre 2025', 5131600, 'AIR France', 'valide', '2025-11-07T23:51:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8b60462e-3a8c-4f2d-aa34-58b14f42ee92', 'ARTI111250026', 'Acquisition de gadgets de communication pour la phase 2 de l''atelier de sensibilisation et formation des acteurs du transport intérieur _ Lot 1 HOODA', 407100, 'HOODA GRAPHIQUE', 'valide', '2025-11-07T23:52:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('736eb28b-94c3-4a9e-8c5b-35a7e8fc7199', 'ARTI111250025', 'Acquisition de gadgets de communication pour la phase 2 de l''atelier de sensibilisation et formation des acteurs du transport intérieur _ Lot 2  2BPUB', 1203600, '2BPUB', 'valide', '2025-11-07T23:52:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('be0b85d1-f80e-4271-bc1c-d859a407972d', 'ARTI111250024', 'Acquisition de gadgets de communication pour la phase 2 de l''atelier de sensibilisation et formation des acteurs du transport intérieur _ Lot 3  BCOM', 421400, 'B COM SARL', 'valide', '2025-11-07T23:54:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('99f03880-6c96-449b-a69c-ab2faf2dfacd', 'ARTI111250055', 'Régularisation_ Demande d''autorisation pour l''assistance et l''accompagnement dans le cadre de l''audit du dispositif de vidéo-verbalisation', 21000000, 'INTERNATIONAL ADVISOR', 'valide', '2025-11-11T05:50:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4c4eb624-63e3-477c-a870-446250ca53b5', 'ARTI111250054', 'RSglement des frais de ramassage d''ordures pour le mois d''Octobre 2025', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-11-11T05:52:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e380a56-53bf-4b8d-b771-84840c7d4d27', 'ARTI111250053', 'Demande de réparation sur cinq (05) imprimantes du siSge de l''ARTI', 206000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-11-11T05:57:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ab5a2234-db43-4ddc-8da6-a03b978dc925', 'ARTI111250052', 'Demande d''achat d''un chargeur d''ordinateur pour le bureau régional de Bouaké', 15000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-11-11T06:01:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('819809c0-5f0b-498f-9229-98019757e9eb', 'ARTI111250051', 'Demande d''achat de deux (02) disques durs externes pour le siSge de l''ARTI', 50000, 'MASTER TECHNOLOGIE INFORMATIQUE', 'valide', '2025-11-11T06:03:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc7faf47-6a66-4601-bb37-a8a6165ccd76', 'ARTI111250084', 'Paiement du solde de tout compte de Mademoiselle SOHOUKOUYA Marina', 3723630, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T15:58:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ef27fed8-8b5f-4341-99f4-e5234ca2deaf', 'ARTI111250083', 'Sécurité privée des locaux de l''ARTI pour le mois de Decembre 2025', 2001280, 'SIGASECURITE', 'valide', '2025-11-17T16:01:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('41af3c4d-791d-407f-88d9-e789394f1918', 'ARTI111250082', 'Sécurité privée des locaux de l''ARTI pour le mois de Novembre 2025', 2001280, 'SIGASECURITE', 'valide', '2025-11-17T16:03:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f3ddc275-924b-4fe5-92f1-c5488515b2a8', 'ARTI111250081', 'Régularisation : Demande d''autorisation pour la location de véhicule de type 4x4 dans le cadre de la mission de sensibilisation des acteurs du transport intérieur', 3920000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-11-17T16:05:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('81d03b51-dd17-4c7d-baf3-025490c8d095', 'ARTI111250080', 'Perdiem des chefs de villages pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-17T16:08:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7736e599-eb4c-49af-b533-91993618825e', 'ARTI111250056', 'Location d''un véhicule JAC T9 avec chauffeur pour la mission du Directeur Général du 1er au 10 novembre 2025', 965180, 'EMMA CAB', 'valide', '2025-11-17T16:11:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6e61b120-327a-4c10-9c1b-882b9c6b6358', 'ARTI111250057', 'Prise en charge de l''assurance Auto du nouveau véhicule ISUZU MuX immatriculé 21381WWCI01 pour la période du 10 Novembre au 31 Décembre 2025à', 200525, 'ASSURE PLUS', 'valide', '2025-11-17T16:13:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8570fd9e-1e02-4742-b2a2-bbf7400189cc', 'ARTI111250060', 'Réprise de la note rejetéexReprise de la note rejetée (765-10-2025  ARTI/DAAF/SDMG/GD) relative au rechargement de Canal Horizon pour le mois de Novembre 2025à relative au recharge de l''abonnement CANAL + de Novembre 2025', 70000, 'CANAL + HORIZON', 'valide', '2025-11-17T16:15:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('58637ebc-a8b8-4b2f-8da0-e10454a4f73e', 'ARTI111250058', 'Formation des gestionnaires de programme CST', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:17:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('47c24188-4497-49a4-ac88-fdc722a120bd', 'ARTI111250059', 'Frais de transport de Monsieur TOURE pour sa mission à Grand-Bassam du 11 au 13 Novembre 2025à', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:19:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('55cf68e5-8ca9-4655-a899-4df09c902195', 'ARTI111250061', 'Frais de transport de Mme KOUAKOU pour la prospection sur les lieux de l''atelier de validation du SystSme de Management de la Qualité de l''ARTIà', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:22:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('247cd81d-5143-496f-9e8b-bb1cd21863da', 'ARTI111250062', 'Participation à Africa Investment', 400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:24:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bd35cd34-c801-4ab7-9ce6-8004939f6d89', 'ARTI111250065', 'Mission de prospection', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:27:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c5e594f3-98e8-4d6f-83bb-df2545d6d8b0', 'ARTI111250064', 'Mission de prospection', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:29:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9808fde3-8920-4311-8a2e-34f2fce7df2f', 'ARTI111250063', 'Mission de prospection', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-17T16:31:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('faefeb9c-e985-46eb-a405-bf2242db487e', 'ARTI111250066', 'RSglement de la facture de redevance de LA POSTE pour l''année 2025˜', 115100, 'LA POSTE DE COTE DIVOIRE', 'valide', '2025-11-17T16:33:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('75932fad-a2cf-4a1b-8fa7-71c6ab47215d', 'ARTI111250069', 'Régularisation: Demande d''autorisation pour l''acquisition de fournitures de bureau et de consommables pour le fonctionnement de l''ARTI', 2440000, 'YESHI SERVICES', 'valide', '2025-11-17T16:46:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ae211db6-fb9d-4504-b1f6-557fb417351c', 'ARTI111250079', 'Perdiem des forces de l''ordre pour la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 150000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-17T16:48:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('aab7e044-0aa3-4f8d-963d-0e5b02c3a837', 'ARTI111250076', 'Régularisation_ Demande d''autorisation pour la production et la fourniture de gadgets pour les opérations de communication et de sensibilisation au titre du 1er trimestre 2025', 12446000, 'FOTOGRAPHIC EVENT', 'valide', '2025-11-17T16:50:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('44ec8787-86be-47e9-93d1-4bb5e56a5bc7', 'ARTI111250078', 'Perdiem des comités d''organisation de la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 450000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-17T16:52:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2e43ff0e-5396-40ca-905e-a5f9d34d42ce', 'ARTI111250077', 'Frais de cocktails dans le cadre de la phase 2 de sensibilisation et formation des acteurs du transport intérieurà', 1000000, 'Acteurs externes de l''ARTI', 'valide', '2025-11-17T16:54:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fb1ed2e6-47e1-4944-adcf-eaf7de8af053', 'ARTI111250075', 'Régularisation_ Demande d''autorisation pour l''achat de casques pour motos et tricycles dans le cadre des opérations de sensibilisation des usagers du transport intérieur - Phase 1é région de la Marahoue', 15000000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-11-17T17:09:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3c480922-184d-4557-ac5b-93eeab7983ea', 'ARTI111250074', 'Régularisation_ Demande d''autorisation pour l''achat de casques pour motos et tricycles dans le cadre des opérations de sensibilisation des usagers du transport intérieur - Phase 1é région du Haut-Sassandra', 15000000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-11-17T17:11:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ce33371-289b-4f7b-b329-311abe2d39fe', 'ARTI111250073', 'Régularisation_ Demande d''autorisation pour l''achat de casques pour motos et tricycles dans le cadre des opérations de sensibilisation des usagers du transport intérieur - Phase 1é région du GbekS', 15000000, 'ENGINE SYSTEM MOTORS', 'valide', '2025-11-17T17:16:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2cc759d8-0af7-4a45-8a8c-c48a36399064', 'ARTI111250072', 'Régularisation_ Demande d''autorisation pour les travaux d''entretien du dispositif et d''installation électrique du siSge de l''ARTI', 13377000, 'BATISS CONSTRUCTION', 'valide', '2025-11-17T17:18:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6ea62627-ad11-4519-aeb3-b232ac3642d6', 'ARTI111250071', 'Regularisation_demande d''autorisation pour l''acquisition de fournitures de bureau et de consommables dans le cadre du fonctionnement de l''arti', 7720000, 'YESHI SERVICES', 'valide', '2025-11-17T17:20:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('db0451aa-9045-43ba-a5b5-79d02feb8431', 'ARTI111250070', 'Régularisation_ Demande d''autorisation pour l''acquisition de fournitures de bureau et de consommables pour le fonctionnement de l''ARTI', 11210000, 'YESHI SERVICES', 'valide', '2025-11-17T17:22:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('15a037f7-db4d-402e-830b-17158d3e131f', 'ARTI111250068', 'Régularisation_ Demande d''autorisation pour l''entretien et la maintenance des portesé y compris les portes électroniquesé et des fen^tres du siSge de l''ARTI', 5997600, 'BATISS CONSTRUCTION', 'valide', '2025-11-17T17:24:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ea567ca4-c1fb-4b49-8eb6-024318c5c84e', 'ARTI111250067', 'Régularisation_ Demande d''autorisation pour le nettoyage et le polissage des marbres du siSge de l''ARTI', 5997600, 'BATISS CONSTRUCTION', 'valide', '2025-11-17T17:26:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7e188b53-2849-4280-bb63-91e25081c949', 'ARTI111250087', 'PAIEMENT ASSURANCE VOYAGE', 39110, 'ASSURE PLUS', 'valide', '2025-11-19T04:08:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e933974-3810-4eac-8c46-51237e6147a8', 'ARTI111250086', 'Location d''un espace pour l''atelier de validation du systSme de management de la qualité (SMQ) de l''ARTIà', 1856435, 'MKOA HOTEL JACQUEVILLE', 'valide', '2025-11-19T04:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17b2c63a-ca84-4993-bcac-99362875c477', 'ARTI111250085', 'Demande de révision du véhicule SUZUKI VITARA immatriculé 2922 LP 01˜', 219500, 'SOCIDA', 'valide', '2025-11-19T04:15:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('31d79a41-c21c-460a-823b-30c3d88dac8c', 'ARTI111250095', 'Rencontre avec GLUTTON SA dans le cadre du projet PIP', 4400000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-20T11:07:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c2fa0f49-5da9-4bba-a144-70563b2219bd', 'ARTI111250094', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de novembre 2025', 482518, 'DGI', 'valide', '2025-11-20T11:09:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a0d7b1e1-6419-4538-8d0a-57c3f67f8e22', 'ARTI111250088', 'Situation du salaire et appointement du mois de novembre 2025', 57558820, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-20T11:11:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('42a09440-c590-4367-9ff2-0028d8abf377', 'ARTI111250089', 'Situation des indemnités des stagiaires du mois de novembre 2025', 300000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-20T11:13:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('441a4077-9554-4a4c-a5d1-385f869808c3', 'ARTI111250093', 'Situation de l''Impôt sur les Salaires (ITS) du mois de novembre 2025', 17875012, 'DGI', 'valide', '2025-11-20T11:17:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1b052ffe-8d9a-4520-816a-397791e22400', 'ARTI111250092', 'Situation de la retenue à la source du mois de novembre 2025', 300000, 'DGI', 'valide', '2025-11-20T11:19:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('54ba5ce9-57a6-46fc-a7d7-cbc550345701', 'ARTI111250091', 'Situation Cotisation CMU du mois de novembre 2025', 51000, 'CNPS', 'valide', '2025-11-20T11:21:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('71a66892-79d3-4b79-af1d-721cf6e73537', 'ARTI111250090', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de novembre 2025', 321678, 'DGI', 'valide', '2025-11-20T12:00:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('df0cd554-1653-410a-a564-c0a00a10022f', 'ARTI111250096', 'Frais de prestation de CODINORM à l''atelier de sensibilisation sur la norme NI505˜:2025', 800000, 'CODINORM', 'valide', '2025-11-20T13:55:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2ebc65c5-503c-44e0-abab-a4ea3200b6d3', 'ARTI111250098', 'RSglement de la facture liée à la réparation d''une toilette du siSge de l''ARTI', 19600, 'AFRICA MAINTENANCE SOLUTION', 'valide', '2025-11-20T13:57:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5767f5c0-f2ea-464f-bae3-a8bcaaaa64dd', 'ARTI111250097', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFAITAIRES POUR LE MOIS DE NOVEMBRE 2025 ( PPSSI)à', 1203163, 'DGI', 'valide', '2025-11-20T14:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d7f0838-9c8a-4367-bce6-7f09ea78ea72', 'ARTI111250102', 'Situation Cotisation CNPS du mois de novembre 2025', 10633783, 'CNPS', 'valide', '2025-11-20T22:55:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('183f1be4-e844-4082-8f9b-5fa7e5e204a9', 'ARTI111250101', 'Situation des honoraires des gendarmes du mois de novembre 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-11-20T22:57:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ebfc38e5-3b3e-471c-aa79-b51b9855048e', 'ARTI111250100', 'Situation des honoraires des médecins du mois de novembre 2025', 1300000, 'MEDECINE DU TRAVAIL', 'valide', '2025-11-20T22:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5a4edbf-b442-44bc-b3fd-aa538e3e66df', 'ARTI111250099', 'Situation des indemnités de la DRRN du mois de novembre 2025', 1624837, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-20T23:01:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2c551329-42d8-42bc-8164-e56e49b92723', 'ARTI111250110', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE NOVEMBRE 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-11-21T19:30:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c8c2ffa1-099d-41b8-bc7a-8ec29616f1f9', 'ARTI111250109', 'Demande de paiement Honoraire Affaire SOHOUKOUYA', 101000, 'MAITRE KOUAME N''GUESSAN CHARLES', 'valide', '2025-11-21T19:32:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('66ebba6c-a394-42f2-b291-7c6fb1774bf8', 'ARTI111250107', 'Achat d''un billet d''avion dans le cadre de la mission du charge d''Etudes Senior en Rabat (MAROC) du 25 au 29 novembre 2025', 623400, 'ROYAL AIR MAROC', 'valide', '2025-11-21T19:34:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('375d4065-4122-4dc6-b7e4-719cadbfce42', 'ARTI111250108', 'Mission du chef de Service Recherche et Développement sur San-Pédro pour le suivi des recommandations de l''audit diagnostique des centres de visite technique automobileà', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-21T19:37:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cf1d59f6-d2d9-4e2c-86f1-eb14f843c168', 'ARTI111250103', 'Suivi des recommandations de l''audit diagnostique des centres de visite technique automobile', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-21T19:39:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('624a045f-9e85-458f-8d20-773199427cd6', 'ARTI111250104', 'Suivi des recommandations de l''audit diagnostique des centres de visite technique automobile', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-21T19:43:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('523a31cf-6dec-4c95-9a38-772e9b3da348', 'ARTI111250105', 'Suivi des recommandations de l''audit diagnostique des centres de visite technique automobile', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-21T19:45:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f142e0a1-66f7-4be9-9b20-f4c3cc1b4f77', 'ARTI111250106', 'Rechargement des cartes de carburant du mois de Décembre 2025à', 4371750, 'TOTAL ENERGIE  CÔTE D''IVOIRE', 'valide', '2025-11-21T19:47:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1f1765ee-c0a1-4aa9-8b7f-ec52b0d507a8', 'ARTI111250126', 'Régularisation / Demande de rSglement de la facture d''expédition d''un courrier à Dimbokro', 4720, 'CODITRANS', 'valide', '2025-11-25T13:16:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ed7fc8e6-4163-4262-81fd-db81e593b45b', 'ARTI111250125', 'Mission de la Directrice des Recoursé de la Réglementation et des Normes sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025à', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:21:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5f643348-804a-48b6-b1c3-bdc3009f81b4', 'ARTI111250124', 'Mission du Sous-Directeur de la Passation des Marches sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025à', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:24:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9e3264b3-d06b-47b6-9358-148fbbdb07da', 'ARTI111250123', 'Mission du Chef de Service de la Réglementation sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025à', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:26:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('96a780f3-8b36-46c4-8ff8-a578c14d1137', 'ARTI111250122', 'Mission de la Directrice de la Gestion Prévisionnelle de l''emploié des Compétences et des Relations Publiques sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025à', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:29:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('37fcd017-918b-4c9e-8255-eb15308f7079', 'ARTI111250121', 'Mission du Sous-Directeur de la Comptabilité et de Trésorerie sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:32:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('fea6e6d7-5349-4023-9e42-3a90111136ac', 'ARTI111250120', 'Mission du Chef de Service Recherche et Développement sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025à', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:34:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9b1843e9-d610-4713-8c06-a3cbf952af9c', 'ARTI111250119', 'Mission de la Coordinatrice du Pool des Dirigeants Sociaux sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:36:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0caaff05-a7e9-45ac-8aec-afa5aebf646d', 'ARTI111250118', 'Mission du Directeur des Statistiques étudesé de la Stratégieé et de la Prospective sur Jacqueville pour l''Atelier de validation du SMQ du 28 au 28 novembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:40:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1124dc1c-23fe-4152-b160-a1b01a60dc96', 'ARTI111250117', 'Mission du Directeur des Affaires Administratives et FinanciSres sur Jacqueville pour l''Atelier de validation du SMQ du 28 au 28 novembre 2025à', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:42:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('25c8ca08-4007-403f-9924-ab1545527e20', 'ARTI111250116', 'RSglement de la facture SODECI Bouaké pour le mois d''Octobre 2025', 6572, 'SODECI', 'valide', '2025-11-25T13:44:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e0936eec-5543-4098-90a5-c585bb059b7b', 'ARTI111250115', 'Mission de l''Auditeur Interne et Contrôle Budgétaire sur Jacqueville pour l''Atelier de validation du SMQ du 28 au 28 novembre 2025à', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:51:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('63dc0ced-3d97-42b3-8b65-a0bea42be8c0', 'ARTI111250114', 'Mission de la Directrice de la Qualité sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:54:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dc50fe40-2ff8-47e1-bc58-4a09014f4974', 'ARTI111250113', 'Frais de transport du chauffeur des Moyens Généraux sur Jacqueville pour l''atelier de validation du SMQ', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T13:56:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('713e1984-e26e-4773-9011-a3100102b608', 'ARTI111250112', 'Mission de la Sous-Directrice des Relation Publiques et de la Communication sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T15:18:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c977e36d-9ca2-4b42-8e2d-d035cb2e2104', 'ARTI111250111', 'Mission du Sous-Directeur de la Passation des Marches sur Jacqueville pour l''Atelier de validation du SMQ du 27 au 28 novembre 2025', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-25T15:21:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cc8b24ee-4a71-418b-ac45-9f949453af87', 'ARTI111250132', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:41:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ff6a76f3-0a3c-4c87-a0da-8c5cbf1c0db0', 'ARTI111250127', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 40000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:43:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('01d46247-392c-48fa-ac6c-57da318129a5', 'ARTI111250128', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 30000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:45:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4380033f-e443-4af1-aef1-b12f0b603bcb', 'ARTI111250129', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:47:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6f3ac2af-15e8-4d1b-8a8a-23725051d04c', 'ARTI111250130', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:50:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3e00ca8b-0ea0-474a-b8a0-88fa0fe86124', 'ARTI111250136', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:53:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('efdd079c-719a-46f7-a0ac-052801861ba6', 'ARTI111250137', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:55:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('122a1a5c-d038-4a2c-accd-5c75634dbeae', 'ARTI111250131', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T13:58:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e5e7bcbe-e863-4619-bd97-d45157757b3a', 'ARTI111250135', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T14:00:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f483db4d-9d97-452d-810b-f9f27f151b98', 'ARTI111250133', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T14:02:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8a7c0aa3-d1f0-464d-9cff-aeb1148c73b1', 'ARTI111250134', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T14:04:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ac13224-7d84-4241-91a2-3e73e3821401', 'ARTI111250138', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 25000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T15:16:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e2d9d190-3671-491d-9f60-05a72731436b', 'ARTI111250141', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T15:53:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8ee9f24d-c85f-44c7-a0c6-ded532322924', 'ARTI111250140', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T15:56:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a8e6f542-12f4-4009-a226-947d1303b345', 'ARTI111250139', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T15:59:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dc0c2364-a0e2-4d8c-bf22-30d3ddb54ca4', 'ARTI111250147', 'RSglement de la facture CIE Bouaké pour le mois de novembreà', 80450, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-11-26T20:33:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d8cd9f95-a5ea-41cc-9a66-7699183e83e2', 'ARTI111250142', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T20:35:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ebecd826-6c77-4199-9523-23c41c0065bc', 'ARTI111250146', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T20:39:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d4dd4208-b235-458e-bcce-2a5fdcddb724', 'ARTI111250145', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T20:40:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b655f081-d313-4dab-8bd2-41547efa6f68', 'ARTI111250144', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T20:42:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('757a04c4-ce11-43c7-bd5b-43f904432b47', 'ARTI111250143', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-11-26T20:45:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('51460e1b-433c-464f-ae5b-e8854c824997', 'ARTI111250148', 'RSglement de la facture SODECI Bouaké pour le mois de novembre', 4448, 'SODECI', 'valide', '2025-11-27T18:52:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4309107f-d0c7-4427-a97f-59e2c0fe6578', 'ARTI111250149', 'Atelier de validation du SystSme de management de la qualité(SMQ)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-01T10:25:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('564cdfba-d680-4b9e-9844-2b054e67d317', 'ARTI112250005', 'Invitation à un Atelier de validation de rapport (MCLU)', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-02T23:08:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cb566378-8f65-42a7-a9f6-3880b30797a1', 'ARTI112250004', 'Invitation à un Atelier de validation de rapport (MCLU)', 10000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-02T23:10:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49a94698-61ed-4596-bc80-097465d57377', 'ARTI112250001', 'Frais de transport retour du chauffeur pour la mission d''Atelier de validation de rapport (MCLU) a Grand-Bassam', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-02T23:12:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('180bac2c-5049-4214-99f3-4d32ece6a557', 'ARTI112250003', 'Invitation à un Atelier de validation de rapport (MCLU)', 20000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-02T23:14:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('be288a79-8cd0-4d36-bb72-388731b05e23', 'ARTI112250002', 'Frais de transport aller du chauffeur pour Atelier de validation de rapport (MCLU) a Grand-Bassam', 15000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-02T23:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b70bf6e0-8b1e-4333-967e-a9b469e727aa', 'ARTI112250013', 'Entretien et nettoyage des serviettes et nappes de l''ARTIà', 29300, 'ECO-CLAIR SARL', 'valide', '2025-12-03T08:23:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d2c89c6c-1c77-4902-af32-c53aea25b758', 'ARTI112250012', 'FRAIS DE TRANSFERT D''ARGENT ENGAGES DANS LE CADRE DES ACTIVITES DE L''ARTI -DANS LE MOIS DE NOVEMBRE 2025à', 4850, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-03T08:26:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('12bbd262-c940-4595-83d2-e0c15e1815b3', 'ARTI112250011', 'ACHAT DE SEAU DE GALET MULTIFONCTION POUR L''ENTRETIEN DE LA PISCINE DU SIEGE DE L''ARTI (DECEMBRE 2025 ET JANVIER 2026)', 40000, 'H2O PISCINE', 'valide', '2025-12-03T08:30:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('831da700-fc91-4a64-a904-37b6af256671', 'ARTI112250010', 'Demande d''achat de masques de protection respiratoire (cache-nez)', 12500, 'PHARMACIE  SAINTE CECILE DES VALLONS', 'valide', '2025-12-03T08:32:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ca1af109-3598-403b-a3b0-490a373d4352', 'ARTI112250009', 'Demande d''achat de produits d''hygiSne pour la cantine du siSge de l''ARTI_ Décembre 2025à', 50900, '', 'valide', '2025-12-03T08:34:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('64290da7-ef5a-4ccf-9462-bf513ae14ed2', 'ARTI112250007', 'Demande d''achat de produits divers pour la Direction Générale_ Lot 2˜:  BULLESà', 104000, 'BULLES', 'valide', '2025-12-03T08:38:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e968d0b7-95dd-4ad8-8ffb-399862d13353', 'ARTI112250006', 'Demande d''achat de produits divers pour la Direction Générale_ Lot 3˜:  BERNABEà', 8000, 'BERNABE CÔTE D''IVOIRE (Investissement)', 'valide', '2025-12-03T08:40:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('baad7e99-b5f5-4727-8a37-69119ccfe3a8', 'ARTI112250017', 'Demande d''impression d''étiquette dans le cadre de l''organisation de l''atelier de sensibilisation sur le norme NI505:2025', 29500, 'HOODA GRAPHIQUE', 'valide', '2025-12-03T10:54:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1bfe8457-10d5-4bb5-a67a-1e4de47107c5', 'ARTI112250026', 'Achat de fleur pour la 4éme session du Conseil de Régulation prévu pour le 11 décembre 2025à', 10000, 'FLEUR DE JONQUILLE', 'valide', '2025-12-07T21:21:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('05c87f42-7c0d-437c-a713-25e87eb115fc', 'ARTI112250024', 'Demande de rechargement des box wifi prépayées MOOV AFRICA de l''ARTI pour le mois de décembre 2025à', 96000, 'MOOV AFRICA COTE D''IVOIRE', 'valide', '2025-12-07T21:23:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d7019427-dd9c-44ab-870f-2f7264ad3ade', 'ARTI112250023', 'Jetons de présence de la quatriSme réunion du Conseil de Régulation de l''ARTI au titre de l''année 2025é le 11 décembre à', 3500000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-12-07T21:25:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1aba2faf-9c42-4d4b-bb10-a76c33dc0a3d', 'ARTI112250021', 'Demande d''achat de fournitures de bureau pour le siSge de l''ARTI _Lot 1 YESHI', 70000, 'YESHI SERVICES', 'valide', '2025-12-07T21:27:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f4004570-1c15-455b-9046-ee800f9080d6', 'ARTI112250019', 'Rechargement de canal horizon pour le mois de décembre 2025à', 70000, 'CANAL + HORIZON', 'valide', '2025-12-07T21:28:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('67c80553-a822-45ec-9068-2472bd86907d', 'ARTI112250025', 'Devis de la pause-café du Conseil de Régulation pour la 4 -Sme session de l''année 2025', 23950, '', 'valide', '2025-12-07T21:31:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e647e614-c974-440e-8705-708d65aca008', 'ARTI112250022', 'RSglement des frais de ramassages d''ordures pour le mois de décembre 2025à', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-12-07T21:33:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5c9f3dad-fad0-4a11-be8f-c85b70955e16', 'ARTI112250018', 'FRAIS BANCAIRES PR?LEV?S ú LA SOURCE PAR LA BANQUE DE L''HABITAT DE CÔTE D''IVOIRE (BHCI) DANS LE CADRE DU D?BLOCAGE DU PROT POUR L''ACQUISITION DU SIOGE SOCIAL DE L''ARTI POUR LE MOIS DE NOVEMBRE 2025', 142650, 'BHCI', 'valide', '2025-12-07T21:35:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('451a4a72-3f72-4826-afc6-a3534343225b', 'ARTI112250016', 'Régularisation dossier rejeté noARTI110250153 -Location de salleé la-mise à disposition de la logistique et le service de la restauration pour l''organisation d''ateliers et session de formation dans le cadre du projet de mise en ouvre du SystSme de Manageme', 6860000, 'ESPACE YEMAD', 'valide', '2025-12-07T21:37:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70b896eb-6738-4922-98fb-8a38b168dfc6', 'ARTI112250015', 'Régularisation dossier rejeté noARTI110250153 -Location de salleé la-mise à disposition de la logistique et le service de la restauration pour l''organisation d''ateliers et session de formation dans le cadre du projet de mise en ouvre du SystSme de Manageme', 4900000, 'ESPACE YEMAD', 'valide', '2025-12-07T21:39:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('09c848a0-6bfa-4ee9-bf51-4fd4fba3f95f', 'ARTI112250014', 'Régularisation dossier rejeté noARTI110250153 -Location de salleé la-mise à disposition de la logistique et le service de la restauration pour l''organisation d''ateliers et session de formation dans le cadre du projet de mise en ouvre du SystSme de Manageme', 6125000, 'ESPACE YEMAD', 'valide', '2025-12-07T21:41:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a0a731e0-2fe7-41a6-b863-798d3e2b40cd', 'ARTI112250020', 'RSglement de la facture Génial pour le mois de novembre 2025à', 86000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-12-07T21:43:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('874af591-9709-4dd0-bfb8-91014e45efdb', 'ARTI112250008', 'Demande d''achat de produits divers pour la Direction Générale_ Lot1: PROSUMAà', 124800, '', 'valide', '2025-12-07T21:46:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3df83f11-1aad-4556-b418-b92fcad1b79b', 'ARTI112250029', 'RSglement de facture orange CI pour la consommation Fixe du mois de novembre 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-12-08T07:07:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('482970af-2461-4840-a633-209b0fd006b6', 'ARTI112250027', 'Demande de˜visite technique˜du véhicule˜SUZUKI VITARA˜immatriculé 2922 LP 01˜', 65100, 'SGS', 'valide', '2025-12-08T07:09:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f17eefce-5c58-4495-87b6-79ca227402c4', 'ARTI112250028', 'Pré visite du véhicule˜SUZUKI VITARA immatriculé 2922 LP 01˜', 149400, 'CAM-SERVICES', 'valide', '2025-12-08T07:10:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4cd90be3-6984-4064-8333-b637fac9ed15', 'ARTI112250034', 'Demande d''achat des piSces de caisse _Décembre 2025', 78400, 'CORRECT PRINT', 'valide', '2025-12-08T08:55:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('52f3f554-4e67-4758-aa73-b9ac4548f343', 'ARTI112250033', 'RSglement des frais de ramassages d''ordures pour le mois de novembre 2025à', 6000, 'GAOUSSOU RAMASSAGE DES ORDURES', 'valide', '2025-12-08T08:57:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0597a9bc-8708-449c-b769-3f6455b12b44', 'ARTI112250032', 'Demande de remboursement des frais engagés par le Chargé d''?tudes Senior lors de sa mission à Rabat  (Maroc)', 31000, 'ROYAL AIR MAROC', 'valide', '2025-12-08T08:59:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5e98459-49e6-4896-b4fe-354d83a4793d', 'ARTI112250035', 'RSglement de la facture FLEUR DE JONQUILLE pour le mois de novembre 2025à', 40000, 'FLEUR DE JONQUILLE', 'valide', '2025-12-08T09:01:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3622ac43-c454-4427-ac31-628bca73ddcd', 'ARTI112250031', 'Acquisition d''imprimés médicaux pour l''infirmerie de l''ARTI _Décembre 2025', 17995, 'RIA', 'valide', '2025-12-08T09:03:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('17056ef9-bd8d-4402-b22b-e5807e5fbc21', 'ARTI112250030', 'RSglement de facture orange CI pour la consommation Internet du mois de décembre 2025à', 250027, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-12-08T09:06:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('06a1866b-512d-4552-af5d-a6d5c7818d59', 'ARTI112250037', 'RSglement de facture orange CI pour la consommation mobile du mois de novembre 2025', 963905, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-12-08T15:58:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2458714f-17cb-4184-97f5-909ede8ee4f6', 'ARTI112250036', 'RSglement de la facture Génial pour le mois de décembre 2025à', 96000, 'GENERAL IVOIRIENNE ALIMENTAIRE', 'valide', '2025-12-08T16:00:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9f7143dc-b2e8-4194-9dc2-df8f63c12add', 'ARTI112250038', 'RSglement de la facture FLEUR DE JONQUILLE pour le mois de décembre 2025', 60000, 'FLEUR DE JONQUILLE', 'valide', '2025-12-08T20:26:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('db1675d7-fdd2-4108-9abe-b8d150f09d12', 'ARTI112250039', 'LAVAGE DES VEHICULES DE POOL POUR LE MOIS DE NOVEMBRE 2025', 6000, 'ENTRETIEN DE VEHICULE(LAVAGE)', 'valide', '2025-12-09T20:32:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a404fd6f-ef93-4678-af36-addf4b171cb2', 'ARTI112250040', 'Demande d''achat de bons-valeurs de carburant_ Décembre 2025', 1500000, 'PETRO IVOIRE', 'valide', '2025-12-09T21:16:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9d948322-04e4-48ad-a724-9382ec98f435', 'ARTI112250044', 'Demande d''autorisation pour l''insertion de la note relative à la réalisation de la newsletter du mois d''octobre dans le systSme SYGFP', 2450000, 'AGENCE RCG', 'valide', '2025-12-10T11:29:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d558b5b6-9033-49ab-b0ae-52e19bbfe331', 'ARTI112250043', 'Demande de décaissement pour l''obtention du récépissé de déclaration liée à la fourniture de services de télécommunications', 300000, 'ARTCI', 'valide', '2025-12-10T11:32:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a3336ecd-203b-48c8-80f6-86bfe90e1b7b', 'ARTI112250049', 'Situation impôt retenu à la source du mois de décembre 2025', 321037, 'DGI', 'valide', '2025-12-10T14:26:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b96ddf32-cf71-4545-ad30-c35fb52f6084', 'ARTI112250048', 'Situation des honoraires des gendarmes du mois de décembre 2025', 400000, 'GENDARMERIE NATIONALE', 'valide', '2025-12-10T14:28:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('87bdc765-103e-4403-9cc3-e4189cf4aea9', 'ARTI112250046', 'Situation Cotisation CMU du mois de décembre 2025', 51000, 'CNPS', 'valide', '2025-12-10T14:30:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bc749e3a-82b3-41e0-8fd1-8a57d287ac8b', 'ARTI112250041', 'Réalisation des Newsletters ARTI de décembre 2025', 2450000, 'AGENCE RCG', 'valide', '2025-12-10T14:32:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a6ea1b05-2491-4eb7-8ec2-2632381516b5', 'ARTI112250042', 'Demande de location d''une salle équipée pour l''atelier de validation des manuels de procédures des Directions de l''ARTI _17 Décembre 2025', 1422050, 'RESIDENCE LIMANIYA', 'valide', '2025-12-10T14:34:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('2bf2ee4a-abd1-4506-889c-106366ca442e', 'ARTI112250047', 'Demande de paiement de la facture CIE (Compteur 2) du siSge de l''ARTI pour la période du 04/10/2025 au 04/12/2025', 1157455, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-12-10T14:36:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb541bc7-2fa2-48b9-a365-d7620e866948', 'ARTI112250045', 'Situation Cotisation de la Taxe à la Formation Professionnelle Continue (FPC) du mois de décembre 2025', 602975, 'DGI', 'valide', '2025-12-10T14:38:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a2c8d2f-cd42-4db1-8aae-cc2cf89f3f85', 'ARTI112250051', 'Salaire du mois de décembre 20205', 57166095, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-10T16:42:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c8c77c4f-e554-418f-af35-d9cee0a6f5c2', 'ARTI112250050', 'Situation Cotisation de la Taxe d''Apprentissage (TA) du mois de décembre 2025', 401980, 'DGI', 'valide', '2025-12-10T16:44:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d2d1e25b-2e78-43de-9b89-702146e22316', 'ARTI112250052', 'RSglement de la facture SODECI Bouaké pour le mois de Décembre 2025', 4448, 'SODECI', 'valide', '2025-12-11T05:41:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('07fb56f3-af32-445e-aa98-9e7d92ea3c4a', 'ARTI112250056', 'Reprise de la note rejetée No732-10-2025 ARTI/DAAF/SDMG/GD relative au frais de couverture médiatique de l''atelier de sensibilisation sur la norme NI505˜:2025', 60000, 'PRESSES RADIO', 'valide', '2025-12-11T05:43:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1f55576a-c103-4d3a-b593-8bfe79b68097', 'ARTI112250055', 'Situation des indemnités des stagiaires du mois de decembre 2025', 200000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-11T05:45:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0240bcc4-42cc-4763-b2ce-abb307e68d25', 'ARTI112250054', 'Demande de paiement de la facture CIE (Compteur 1) du siSge de l''ARTI pour la période du 04/10/2025 au 04/12/2025', 1176310, 'COMPAGNIE IVOIRIENNE D''ELECTRICITE', 'valide', '2025-12-11T05:47:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7a5667cd-2713-4eaa-8bbe-e039acd06450', 'ARTI112250053', 'Entretien de la piscine et de l''espace vert (H2O PISCINE) pour le mois de Décembre 2025', 235000, 'H2O PISCINE', 'valide', '2025-12-11T05:50:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6ed73b9d-fd87-481c-b7c7-a7a9c9bcf393', 'ARTI112250063', 'Demande de révision générale du véhicule MITSUBISHI immatriculé 17 KB 01', 547000, 'GARAGE RTA', 'valide', '2025-12-11T20:33:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e14bf178-b390-48ba-8d8d-64445d013a7b', 'ARTI112250062', 'Situation des honoraires des médecins du mois de decembre 2025', 1300000, 'MEDECINE DU TRAVAIL', 'valide', '2025-12-11T20:36:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('134b7194-3fe6-4367-aefd-285508ea11d6', 'ARTI112250061', 'Situation des indemnités de la DRRN du mois de décembre 2025', 1884295, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-11T20:38:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0a0b2780-1c61-4aab-91ae-29a4324f377a', 'ARTI112250060', 'Situation de l''Impôt sur les Salaires (IS) du mois de décembre 2025', 23360752, 'DGI', 'valide', '2025-12-11T20:40:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9ffd2745-f5e3-473e-a882-51d6c1ab058d', 'ARTI112250059', 'Situation Cotisation CNPS du mois de décembre 2025', 12367778, 'CNPS', 'valide', '2025-12-11T20:42:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('08bf7f71-6d5a-4f56-a072-1223e0eebfb1', 'ARTI112250058', 'RSglement de facture orange CI pour la consommation Fixe du mois de Décembre 2025', 207436, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-12-11T20:44:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7c947f8e-02bb-4de7-b904-d0070e809cf5', 'ARTI112250057', 'RSglement de facture orange CI pour la consommation mobile du mois de Décembre 2025', 963905, 'ORANGE CÔTE D''IVOIRE', 'valide', '2025-12-11T20:47:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('49e9b1b4-ea2f-4651-9737-fc5a3e7c15b6', 'ARTI112250064', 'INDEMNITE DE FONCTION DU PRESIDENT DU CONSEIL DE REGULATION DE L''ARTI POUR LE MOIS DE D?CEMBRE 2025', 4800000, 'DIRIGEANTS SOCIAUX', 'valide', '2025-12-12T15:11:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('4f87f3ab-8c6e-4d05-8adb-5748104e58e6', 'ARTI112250065', 'Paiement de la gratification au titre de l''année 2025', 11058438, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-15T15:47:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d6b9045d-7aa0-410b-9db2-6335362eebc6', 'ARTI112250066', 'Devis pour l''élaboration du dossier technique pour l''obtention de l''Autorisation d''occupation du Domaine Public Site de Bouakéà', 245000, 'CGE KOUROUKAN', 'valide', '2025-12-15T15:49:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('dbae6d91-19ce-420d-9d01-56cba91e2f88', 'ARTI112250071', 'Atelier de validation des manuelles de procédure', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-17T15:36:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('70e492d5-0bf6-414b-abf7-a4ddc08c7277', 'ARTI112250070', 'Atelier de validation des manuelles de procédure', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-17T15:38:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5d9586fb-7caf-486b-8464-081efd12023f', 'ARTI112250069', 'Mission du Responsable du bureau Régional du District Autonome de Yamoussoukro sur Abidjan pour l''Atelier de Validation des manuelles de Procédure du 16 au 18 décembre 2025', 50000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-17T15:40:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('f5c9630c-e090-431c-9b97-614c979c44f2', 'ARTI112250068', 'Mission du Chef de service Surveillance du Transport Intérieur pour l''Atelier Validation du 16 au 18 décembre 2025', 70000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-17T15:43:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3bf749fb-8618-4da1-bcbc-343d3bf96354', 'ARTI112250067', 'Atelier de validation des manuelles de procédure', 100000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-17T15:45:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7dda16a5-e516-4f1b-8a94-56d5380124bd', 'ARTI112250074', 'Régularisation_ demande de remboursement du complément du reliquat des frais de réception - Mission auprSs du cabinet C5P (France)à', 433719, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-18T13:00:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('258d4dc9-9819-4740-a8f7-1649440a243d', 'ARTI112250073', 'Frais de délivrance de l''autorisation d''occupation du domaine Public pour le site de Bouaké', 196980, 'CGE KOUROUKAN', 'valide', '2025-12-18T13:06:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c1932ee8-393d-45aa-84f2-7a593f9951a2', 'ARTI112250072', 'Devis pour la réparation du moteur de la piscine au siSge de l''ARTIà', 94600, 'H2O PISCINE', 'valide', '2025-12-19T11:12:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('c51d8c2e-4a93-44bd-896b-dbb1eb6f9c6b', 'ARTI112250076', 'Régularisation_ demande de remboursement du reliquat des frais de réception - Mission France et Belgique rencontre avec la société GLUTTON relative au projet PIP', 1361787, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-24T10:07:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('138198ad-cb6a-4ec2-8b72-5a16e3d236b6', 'ARTI112250075', 'Régularisation _frais de déplacement relatifs aux travaux de validation des procédures de l''ARTI à la résidence LIMANIYA dans le cadre de la certification ISO 9001', 150000, 'PERSONNEL DE L''ARTI', 'valide', '2025-12-24T10:09:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('cd08b2f3-2524-470a-a2b8-a323c5c419be', 'ARTI112250077', 'Demande de la révision du véhicule FORD RANGER immatriculé 4327 KS 01', 420021, 'TRACTAFRIC MOTORS COTE D''IVOIRE', 'valide', '2025-12-30T09:58:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('55fd8587-274a-439c-8933-ba7175138b7b', 'ARTI112250089', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI -Application de gestion des congés', 10084200, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:19:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9a55e007-e8b4-4522-aee7-ff85d95ecae5', 'ARTI112250088', 'FRAIS BANCAIRES PR?LEV?S ú LA SOURCE PAR LA BANQUE DE L''HABITAT DE CÔTE D''IVOIRE (BHCI) POUR LE MOIS DE DECEMBRE 2025 2025', 142650, 'BHCI', 'valide', '2025-12-31T18:20:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1b3e7406-4c42-422a-b4d9-e2b7dcdf1dd0', 'ARTI112250078', 'FRAIS BANCAIRES DU MOIS DE D?CEMBRE 2025à', 372252, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2025-12-31T18:23:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('0d2866b2-962d-4ca4-88d6-e19a71e6d5e1', 'ARTI112250087', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI - Application de Gestion des Missions', 10084200, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:27:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('9306501e-96fb-4a59-8e23-8d90043c5f29', 'ARTI112250086', 'Régularisation_ Demande d''autorisation pour la réalisation les travaux de peinture des locaux et bureaux du siSge de l''ARTI', 9187500, 'BATISS CONSTRUCTION', 'valide', '2025-12-31T18:29:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1ff7ed20-7a06-4e19-adf2-0b6b7ae615dd', 'ARTI112250081', 'Demande d''autorisation pour la location de salle et restauration - Projet de mise en ouvre de la procédure de saisine à', 7840000, 'ESPACE YEMAD', 'valide', '2025-12-31T18:31:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a7916ae5-e2e4-4c4a-82a9-f6970b0d7436', 'ARTI112250082', 'Mise à disposition de véhicule avec chauffeur et transferts aéroport dans le cadre de la mission du Directeur Général en France et aux Etats Unis du 15 au 30 septembre 2025', 6297187, 'EMMA CAB', 'valide', '2025-12-31T18:33:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('1c213300-3fc2-49bf-8742-659802660db3', 'ARTI112250085', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI - Application de Gestion du PARC AUTOMOBILE', 15126300, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:34:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d6fefdde-b2fd-4189-8fa3-e27f28b44742', 'ARTI112250083', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI - Application de Gestion des FOURNISSEURS', 10084200, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:36:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('29594682-c6dc-4de9-afa0-91d6bf359bd5', 'ARTI112250084', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI - Application de Gestion des IMMOBILISATIONS', 10084200, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:38:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('06ac5122-ece2-455c-b59b-8eb06ea84aff', 'ARTI112250080', 'Régularisation_Demande d''autorisation pour la réalisation des travaux d''étanchéité de la salle serveur et du centre médical de l''ARTI', 8877820, 'BATISS CONSTRUCTION', 'valide', '2025-12-31T18:40:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('a41ded07-f8a6-42fe-a2a2-297402786f4a', 'ARTI112250079', 'Régularisation Demande d''autorisation pour l''assistance et l''accompagnement à l''enqu^te de satisfaction des usagers du transport intérieur', 19698000, 'INTERNATIONAL ADVISOR', 'valide', '2025-12-31T18:42:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('eb1928a4-c97f-4dbb-96a2-0dbeb6e9d7b3', 'ARTI112250091', 'Sécurité privée des locaux de l''ARTI pour le mois de Février 2025', 2001280, 'SIGASECURITE', 'valide', '2025-12-31T19:40:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('daae7717-ccda-49f3-9453-5173af209e90', 'ARTI112250090', 'REGULARISATION_demande d''autorisation pour le remboursement de la premiSre trimestrialité (septembreé octobre et novembre 2025) de l''emprunt contracté auprSs de la Banque de l''Habitat de Côte d''Ivoire (BHCI) dans le cadre de l''acquisition du bŸtiment abrit', 142909714, 'BHCI', 'valide', '2025-12-31T19:42:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('abf69de0-57ad-4f7f-8c0f-6c1d173d0807', 'ARTI101260002', 'PRELEVEMENT DES RETENUES A LA SOURCE DES REGIMES FORFAITAIRES POUR LE MOIS DE D?CEMBRE 2025 ( PPSSI)à', 1203163, 'DGI', 'valide', '2026-01-06T20:42:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('bda30095-6aad-4cd1-a48e-beb814ad938f', 'ARTI101260001', 'REGULARISATION FRAIS BANCAIRE DU MOIS DE NOVEMBRE 2025', 372252, 'BANQUE DES DEPOTS DU TRESOR PUBLIQUE', 'valide', '2026-01-06T20:44:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('8c1087bc-506a-46fb-9191-2fc52a79389a', 'ARTI101260003', 'Notification du mandat du Cabinet Concept Consulting pour l''étude de faisabilité SOTRA à Bondoukou', 94000000, 'CONCEPT CONSULTING', 'valide', '2026-01-07T08:51:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('08606fa3-b8a2-423e-9468-3c1b88ec324e', 'ARTI101260019', 'Régularisation_ location de véhicules pour l''opération de sensibilisation sur l''axe Bédiala', 8820000, 'ENGINE SYSTEM MOTORS', 'valide', '2026-01-08T21:17:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b7654c9f-a496-4d65-b5e8-976e5021ce43', 'ARTI101260018', 'Régularisation : Demande d''autorisation pour l''émission d''un bon de commande relatif aux frais d''assistance technique pour la mise en conformité des systSmes d''information de l''ARTI dans le cadre du SYGFP', 45423000, 'INTERNATIONAL ADVISOR', 'valide', '2026-01-08T21:20:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('7dff6296-d57e-492d-91cb-fdfc359722a7', 'ARTI101260017', 'Régularisation_ location de véhicules pour l''opération de sensibilisation sur l''axe BOUAFLE', 3920000, 'ENGINE SYSTEM MOTORS', 'valide', '2026-01-08T21:22:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('289c4957-bbad-4a21-9e70-78c197dc1304', 'ARTI101260016', 'Régularisation_ location de véhicules pour l''opération de sensibilisation sur l''axe BOUAKE', 3920000, 'ENGINE SYSTEM MOTORS', 'valide', '2026-01-08T21:24:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('b8055238-f8c3-4ec5-afd7-c6fa843c118d', 'ARTI101260015', 'Régularisation : Demande d''autorisation pour l''émission d''un Bon de Commande au profit du prestataire INTERNATIONAL ADVISORS dans le cadre du projet Collector VTC', 26460000, 'INTERNATIONAL ADVISOR', 'valide', '2026-01-08T21:27:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5f5a9d31-ebb6-4b55-9ca5-5a548c3e489b', 'ARTI101260014', 'Régularisation : Demande d''autorisation pour l''achat de casques pour motos et tricycles dans le cadre des opérations de sensibilisation des usagers du transport intérieur - Phase 1é région du HAMBOL', 15000000, 'ENGINE SYSTEM MOTORS', 'valide', '2026-01-08T21:29:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ec9ec7e8-958b-448b-bbaf-39a5376c3b37', 'ARTI101260013', 'Régularisation : Demande d''autorisation pour l''achat de casques pour motos et tricycles dans le cadre des opérations de sensibilisation des usagers du transport intérieur - Phase 1é région du PORO', 15000000, 'ENGINE SYSTEM MOTORS', 'valide', '2026-01-08T21:31:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('6647382e-db11-4702-a77f-71c94d42e996', 'ARTI101260012', 'Régularisation_ Demande d''autorisation pour l''acquisition de fournitures de bureau et de consommables pour le fonctionnement de l''ARTI', 7750000, 'YESHI SERVICES', 'valide', '2026-01-08T21:33:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('218291a6-80ac-4412-8837-2a7368398f41', 'ARTI101260011', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe FRONAN', 14259000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:35:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('e381556d-8742-465a-9f07-3b808d1b490b', 'ARTI101260010', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe TAFIRE', 14651000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:37:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('d1570f89-e04f-43e4-958e-4a27d682c4e5', 'ARTI101260009', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe SINEMATIALI', 14455000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:39:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('81adb3f9-f0b1-4341-8f18-765eda617c59', 'ARTI101260008', 'Régularisation : Demande d''autorisation pour l''émission d''un Bon de Commande au profit du prestataire Batiss Construction relatif aux travaux d''entretien et de réparation des faØades en Alucobond du siSge de l''ARTI', 14975000, 'BATISS CONSTRUCTION', 'valide', '2026-01-08T21:42:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('73b1031b-40de-4775-a294-7fc8b6243a7b', 'ARTI101260007', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe BOUAFLE', 14445000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:43:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('873a862e-bdd8-4587-8762-3fca9e10e1e1', 'ARTI101260006', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe KORHOGO', 14945000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:45:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('3128f4e0-2c6e-4279-a122-e022f54866e2', 'ARTI101260005', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe BEDIALA', 14945000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:47:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('675438a1-0709-49ad-b144-d39a2021c136', 'ARTI101260004', 'Régularisation_ Demande d''autorisation pour la location et la logistique relatives à la séance de sensibilisation des acteurs du transport intérieur - Phase 1é axe BOUAKE', 14259000, 'FOTOGRAPHIC EVENT', 'valide', '2026-01-08T21:49:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('ffd171a5-8546-441d-a3b1-6f1dc9d8103b', 'ARTI101260021', 'Note de régularisation sur l''étude de faisabilité du projet mise en place d''un systSme intSgre d''entretien des voiries bitumes urbaines par l''autorité de régulation du transport intérieur (Arti)à', 39143000, 'CONCEPT CONSULTING', 'valide', '2026-01-13T07:30:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('5a5ab196-e95e-4e58-8583-bdda1e39656d', 'ARTI101260020', 'Note de régularisation sur la réalisation de l''étude de faisabilité du projet mise en place d''une base de données géospatiales pour les activités de régulations de l''Autorité de Régulation du Transport Intérieur (ARTI)à', 37335000, 'CONCEPT CONSULTING', 'valide', '2026-01-13T07:32:57')
ON CONFLICT (reference) DO NOTHING;
