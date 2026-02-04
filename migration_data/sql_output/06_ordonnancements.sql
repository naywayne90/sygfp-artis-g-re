-- Migration des ordonnancements
-- Source: Ordonnancement (ancien SYGFP)
-- Destination: budget_ordonnancements (nouveau SYGFP)


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('92b64ea2-5bac-4276-8e91-4bc5bf473e3e', 'ORD-330606', 0, 'valide', '2025-02-03T14:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3b7dd386-0710-4779-afdf-4e24a020a553', 'ORD-330607', 0, 'valide', '2025-02-03T15:12:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5892970b-2c6c-4e1c-bb3b-7e0379d8c48d', 'ORD-330608', 0, 'valide', '2025-02-12T16:54:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d863deca-bf4c-4d28-92ba-745e83464142', 'ORD-330609', 0, 'valide', '2025-02-12T16:58:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40861bce-b694-4f4d-8014-700a8eea343a', 'ORD-330610', 0, 'valide', '2025-02-12T16:59:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf80e0c3-0375-4439-84e0-f30735364fbb', 'ORD-330611', 0, 'valide', '2025-02-12T17:02:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6c738e7f-9923-4188-aadf-f0ba0a07f8e2', 'ORD-330612', 0, 'valide', '2025-02-12T17:03:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40992dfc-3e2c-43b6-baff-fd37e285f55a', 'ORD-330613', 0, 'valide', '2025-02-12T17:05:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0c143079-b369-4c44-a168-b7cb165f600c', 'ORD-330614', 0, 'valide', '2025-02-12T17:08:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f1eb420d-7586-4491-b910-85db41a0908c', 'ORD-330615', 0, 'valide', '2025-02-12T17:10:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9f1f0860-f905-47b1-b648-02487576e949', 'ORD-330616', 0, 'valide', '2025-02-12T17:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('62a4a8d3-e56d-4b21-a2e4-b915bb29d18a', 'ORD-330617', 0, 'brouillon', '2025-02-12T17:13:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b4dbaa05-4fcd-4822-8111-fb3dbb764969', 'ORD-330618', 0, 'valide', '2025-02-12T17:13:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c8cecbc8-f4f6-4d25-8e84-4fdc0a1fb310', 'ORD-330619', 0, 'valide', '2025-02-12T17:14:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0e9f9387-9e76-4fde-9bb9-8d770d612983', 'ORD-330620', 0, 'valide', '2025-02-12T17:16:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dcc3ce97-ab87-4ca2-bfe6-76c4910aa9b7', 'ORD-330621', 0, 'valide', '2025-02-12T17:17:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08c40036-0955-425d-9685-cab1a022b22a', 'ORD-330622', 0, 'valide', '2025-02-12T17:18:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a05d55e8-3570-47ac-9c8d-1e60d20d2937', 'ORD-330623', 0, 'valide', '2025-03-09T12:50:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bef88fae-3a9b-455e-9da8-a2f6789eacdb', 'ORD-330624', 0, 'valide', '2025-03-09T12:51:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6173750b-3de0-45bc-97e8-8be3ebfb272d', 'ORD-340623', 0, 'valide', '2025-04-03T10:15:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('47cf2761-90b9-47bb-b837-2598c32c4d62', 'ORD-340624', 0, 'valide', '2025-04-03T10:16:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d13d52f4-9fcf-405f-a1e4-3c1066248c47', 'ORD-340625', 0, 'valide', '2025-04-03T10:17:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c916c108-afd4-403a-8fc3-f046420ac692', 'ORD-340626', 0, 'valide', '2025-04-03T10:18:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eb0d7338-bf94-40f6-a43b-1ea135e494bf', 'ORD-340627', 0, 'valide', '2025-04-03T10:21:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4a39ac6c-a2e8-4fd5-bd6a-669750356dc1', 'ORD-340628', 0, 'valide', '2025-04-03T10:22:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7a389b1e-0e8e-4504-aa76-3c5e49a09d6f', 'ORD-340629', 0, 'valide', '2025-04-03T10:26:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f768173-50ce-4ce8-9ebf-61900ffd6488', 'ORD-340630', 0, 'valide', '2025-04-03T10:29:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('db1a671a-fbf8-4bc1-bef0-79a20f8a9a78', 'ORD-340631', 0, 'brouillon', '2025-04-03T10:30:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b27b68a8-5b2f-451e-a4db-990d56a879b2', 'ORD-340632', 0, 'brouillon', '2025-04-03T10:32:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e112c897-3e26-4dc7-80ac-d72fedfa63be', 'ORD-340633', 0, 'brouillon', '2025-04-03T10:34:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('44e60301-ab58-42fb-bb77-8c785d66a585', 'ORD-340634', 0, 'valide', '2025-04-03T10:36:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b4545d9-d791-457f-b197-13933c8f69a3', 'ORD-340635', 0, 'brouillon', '2025-04-03T10:37:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7bf5dd49-a931-43e2-9230-2675d40cf353', 'ORD-340636', 0, 'valide', '2025-04-03T10:38:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a222f8e-f0de-4b57-b5c0-1194a5e24131', 'ORD-340637', 0, 'valide', '2025-04-03T10:48:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('982dbcca-267f-4bab-b916-4789150c1a8c', 'ORD-340638', 0, 'valide', '2025-04-03T10:52:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5cae38cf-5315-4330-983b-11f3fc6070a9', 'ORD-340639', 0, 'valide', '2025-04-03T15:52:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c52b7b3b-23f4-4276-8329-4d77a501bd05', 'ORD-340640', 0, 'valide', '2025-04-04T09:24:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40b03e58-6365-420f-8c3d-64a9a2d1af75', 'ORD-340641', 0, 'valide', '2025-04-04T09:27:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f87b0401-af76-48fe-8c2a-3fd35b09c741', 'ORD-340642', 0, 'valide', '2025-04-04T09:28:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('25e4ceb0-e234-4389-92ed-5167b5a7d231', 'ORD-340643', 0, 'valide', '2025-04-09T09:45:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('df7f2385-275e-484b-bf06-a1098bfdd992', 'ORD-340644', 0, 'valide', '2025-04-09T09:53:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a3471b0f-f86b-4d68-b532-72165262f261', 'ORD-340645', 0, 'valide', '2025-04-09T09:56:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bc3e454e-eefa-4c2a-8e39-c654144cff2e', 'ORD-340646', 0, 'valide', '2025-04-09T10:01:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ae4d2758-403e-4ca8-86f0-9ecedd8c034c', 'ORD-340647', 0, 'valide', '2025-04-09T11:42:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f92362c0-bd23-4206-b436-5251dba8a72e', 'ORD-340648', 0, 'brouillon', '2025-04-09T18:50:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('771401dc-87f9-472f-814b-b2959d57e24a', 'ORD-340649', 0, 'valide', '2025-04-09T18:51:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('93a804a7-f6ed-4f18-8de6-e59c91b4a6d2', 'ORD-340650', 0, 'valide', '2025-04-10T15:50:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5822fb92-6999-41ae-8e0b-297393e5b638', 'ORD-340651', 0, 'valide', '2025-04-10T15:52:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bf59edb7-a146-408f-acbf-dd37af673659', 'ORD-340652', 0, 'valide', '2025-04-10T15:52:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('10ba0976-03bd-4c2e-bcc8-f692ea3c091b', 'ORD-340653', 0, 'brouillon', '2025-04-10T15:58:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('879d324e-b63c-4bbb-875a-4fd9bd6c2d72', 'ORD-340654', 0, 'valide', '2025-04-10T15:59:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b49632ee-eee5-45fb-b642-3387af5f72f4', 'ORD-340655', 0, 'valide', '2025-04-10T16:00:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d2248cdc-b35e-4f7d-bbb2-d2ea52d04b14', 'ORD-350643', 0, 'valide', '2025-04-14T23:05:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('811f2cc4-ee98-4919-ae32-0cb8fb637a02', 'ORD-350644', 0, 'valide', '2025-04-14T23:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d9cf0450-eae1-4609-bd38-6b7672436a6b', 'ORD-350645', 0, 'valide', '2025-04-14T23:15:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16b0615f-79ea-48a9-b799-5c0c3d73f0d6', 'ORD-350646', 0, 'valide', '2025-04-14T23:17:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4d80beb5-fb6d-4e31-86b0-2545cf28671c', 'ORD-350647', 0, 'valide', '2025-04-14T23:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ea574310-d76e-4f81-af6d-c7792000a4a2', 'ORD-350648', 0, 'valide', '2025-04-14T23:20:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b1fb952-7a39-474c-b0fb-e997ca0aa35e', 'ORD-350649', 0, 'valide', '2025-04-14T23:23:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7245ca4b-e23c-4a7d-b6b2-897a7c095879', 'ORD-350650', 0, 'valide', '2025-04-14T23:24:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28a1e67d-1193-436c-a9b8-4e1db6132c72', 'ORD-350651', 0, 'valide', '2025-04-14T23:27:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('787a6981-61e9-4a6c-9db3-b59b3c337612', 'ORD-350652', 0, 'valide', '2025-04-15T08:21:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71a62075-858e-4e28-bc2e-5e3a35cdcaa4', 'ORD-350653', 0, 'valide', '2025-04-18T09:16:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00511239-b564-4ecb-99c1-380dd59ee142', 'ORD-350654', 0, 'valide', '2025-04-18T09:17:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b1ec9571-85c2-4706-9361-92ead126f8f5', 'ORD-350655', 0, 'valide', '2025-04-22T15:35:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('88406a64-1492-4309-ba45-995df0bdc916', 'ORD-350656', 0, 'valide', '2025-04-22T15:36:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66bb685a-e92c-4247-b42b-f0a1523bf61d', 'ORD-350657', 0, 'valide', '2025-04-22T15:40:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('24f21b2b-4eac-403b-97e0-99ffeb89ee61', 'ORD-350658', 0, 'valide', '2025-04-24T10:07:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('99ed2e0f-e979-4d2b-9035-007c8592618b', 'ORD-350659', 0, 'valide', '2025-04-24T10:07:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0d048676-9c08-4483-9503-0765f13d7713', 'ORD-350660', 0, 'valide', '2025-04-24T10:11:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a0495fdb-1424-41f4-8df6-1268431d4b26', 'ORD-350661', 0, 'valide', '2025-04-24T10:11:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d22daae2-4806-4257-a8f0-10302f5a22c6', 'ORD-350662', 0, 'valide', '2025-04-24T10:14:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('44b21274-b05a-4e54-8852-1f2beab83d01', 'ORD-350663', 0, 'valide', '2025-04-24T10:15:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aae68c0e-091d-4ab9-89d7-e7b0f1fb7180', 'ORD-350664', 0, 'valide', '2025-04-24T10:16:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eda5a307-2a78-4ab5-bc5a-6aaab759d2c8', 'ORD-350665', 0, 'valide', '2025-04-24T10:18:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('31409ce3-bab6-462f-a5ec-eee73e71dc9f', 'ORD-350666', 0, 'valide', '2025-04-24T10:18:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('411ddfe5-bfd4-4c64-8d5e-d265cebcaed0', 'ORD-350667', 0, 'valide', '2025-04-24T10:19:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('52323c88-692a-4b38-ab50-b6f2bba9a823', 'ORD-350668', 0, 'valide', '2025-04-24T10:20:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71471bbd-5313-4bd1-a928-91e2777d5d8d', 'ORD-350669', 0, 'valide', '2025-04-24T10:21:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9bddf0b6-3e58-4f68-ad2a-0dd5bffa73aa', 'ORD-350670', 0, 'valide', '2025-04-24T10:22:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d504e621-c5ec-4b64-bc13-c792cb86ce47', 'ORD-350671', 0, 'valide', '2025-04-24T10:23:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6115d983-e202-417a-a91e-b3ccb8f69a3e', 'ORD-350672', 0, 'valide', '2025-04-24T10:26:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('74f52ad3-97d7-4046-8007-7cf1998d6d16', 'ORD-350673', 0, 'valide', '2025-04-24T10:27:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('521c0567-9a81-4b8e-a787-4ee9bf6a834e', 'ORD-350674', 0, 'valide', '2025-04-24T10:29:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a5a8b7c5-e234-4d70-b587-4431bb01af7d', 'ORD-350675', 0, 'valide', '2025-04-24T10:29:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dea818a8-989f-40f0-ac53-e7e76153f419', 'ORD-350676', 0, 'valide', '2025-04-24T10:30:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3927a3fe-1253-4841-b129-4370d64452b6', 'ORD-350677', 0, 'valide', '2025-04-24T10:30:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6f8590f2-cc29-4b25-bd86-f602b77b15be', 'ORD-350678', 0, 'valide', '2025-04-24T10:31:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('435fac5a-5f07-4458-9b16-56d5166abd97', 'ORD-350679', 0, 'valide', '2025-04-24T10:32:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2e3c8cbe-24ef-4627-b9b1-6df8e5226866', 'ORD-350680', 0, 'valide', '2025-04-28T07:26:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e8004a72-746e-442b-9a57-85a9922ec98b', 'ORD-350681', 0, 'valide', '2025-04-28T07:27:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8aed36a1-e38b-439b-8401-bd81bca6aa27', 'ORD-350682', 0, 'valide', '2025-04-28T07:28:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb020d96-a809-4a45-8b48-672445e432eb', 'ORD-350683', 0, 'valide', '2025-04-28T07:28:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d78c5fa4-102f-4795-908f-a1f1b34678d8', 'ORD-350684', 0, 'valide', '2025-04-28T07:30:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f6cc48c2-f29f-43d3-8fd7-3e8bc4e286fe', 'ORD-350685', 0, 'valide', '2025-04-28T07:30:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4c45167c-2845-4c21-b91e-de1dd75a3f4d', 'ORD-350686', 0, 'valide', '2025-04-28T07:45:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d6e08b75-88bf-4e5d-bf22-85b8f8b1f706', 'ORD-350687', 0, 'valide', '2025-04-28T07:46:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('269bca4c-1453-494b-8346-3c45f32b4842', 'ORD-350688', 0, 'valide', '2025-04-28T07:47:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8fe3c8d2-bd68-4777-aa0c-d497884c35a8', 'ORD-350689', 0, 'valide', '2025-04-28T07:50:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('10051870-1c06-4924-aff6-0733bf855218', 'ORD-350690', 0, 'valide', '2025-04-28T07:51:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a1f4ab1f-25ee-42f4-a7fb-f7acdfda7483', 'ORD-350691', 0, 'valide', '2025-04-28T07:59:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('daa99ba5-43f1-4a45-80b5-37647a0e03e8', 'ORD-350692', 0, 'valide', '2025-04-28T08:02:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf542ab2-854a-4b48-b0c7-b3ca9ff395eb', 'ORD-350693', 0, 'valide', '2025-04-28T08:03:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4c7e50d5-8137-4ccb-bd2e-cd53dccc3135', 'ORD-350694', 0, 'valide', '2025-04-28T08:04:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f5447389-ba2a-405f-b30b-a35d1342d9e9', 'ORD-350695', 0, 'valide', '2025-04-28T08:05:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3da61f74-87fa-4e30-8461-505a99378e62', 'ORD-350696', 0, 'valide', '2025-04-28T08:06:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fb443279-06db-4061-a7f1-d15f28b4607c', 'ORD-350697', 0, 'valide', '2025-04-28T08:07:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0fb561ad-7b3a-4c71-8d1d-83bd68d1afd0', 'ORD-350698', 0, 'valide', '2025-04-28T08:07:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('79561161-70eb-41a0-ad8f-32826eef8611', 'ORD-350699', 0, 'valide', '2025-04-28T08:08:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('46840923-b2c3-40aa-a164-f49c4b6ada76', 'ORD-350700', 0, 'valide', '2025-04-28T08:09:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b7ca9e6a-0f2f-452a-ab97-b26a990729df', 'ORD-350701', 0, 'valide', '2025-04-28T08:10:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b4fd853-a2a0-429e-be3f-54adc9e4f3d9', 'ORD-350702', 0, 'valide', '2025-04-28T08:12:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7f039067-0a7e-49fb-8507-2903de27b8e8', 'ORD-350703', 0, 'valide', '2025-04-28T08:13:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5d3b3235-71e1-4c97-99aa-e180e91f2f0a', 'ORD-350704', 0, 'valide', '2025-04-28T08:14:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85ec3cee-6f27-436b-9720-50876bc2b308', 'ORD-350705', 0, 'valide', '2025-04-28T08:15:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('919e293d-f711-4e06-8a5d-4319035a2f2c', 'ORD-350706', 0, 'valide', '2025-04-28T08:16:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('468e4538-b19a-4d46-9c6e-e2202b07c516', 'ORD-350707', 0, 'valide', '2025-04-28T08:18:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b59fcf52-e1e7-4691-b964-d6d503faefc7', 'ORD-350708', 0, 'valide', '2025-04-28T08:19:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('129b6c7a-a13f-4463-9954-4a6020350562', 'ORD-350709', 0, 'valide', '2025-04-28T08:20:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('76d8e2d3-67b3-44a7-bc64-234682f7ef96', 'ORD-350710', 0, 'valide', '2025-04-28T08:22:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ecb282de-a649-49d1-95b8-0aab637494c8', 'ORD-350711', 0, 'valide', '2025-04-28T08:25:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('588efe16-701c-457f-b47f-178c73d4b3c5', 'ORD-350712', 0, 'valide', '2025-04-28T08:26:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e5217fb5-742b-4087-9498-c7bbcf778f71', 'ORD-350713', 0, 'valide', '2025-04-28T08:51:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0be4ebad-d3f5-46e3-987c-0f43d52dd615', 'ORD-350714', 0, 'valide', '2025-04-28T08:53:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5239bb08-0a93-4aa9-b87b-43efa22aaf23', 'ORD-350715', 0, 'valide', '2025-04-28T08:56:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2a2a64c-315c-4da3-9967-f796d5861c93', 'ORD-350716', 0, 'valide', '2025-04-28T11:02:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7a71245e-137b-4cb3-a785-85d86890d3e0', 'ORD-350717', 0, 'valide', '2025-04-28T11:05:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('13c9c4eb-5112-4a14-b17a-8a8f64da1bfa', 'ORD-350718', 0, 'valide', '2025-04-28T11:06:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a868df04-b7ee-4f17-ac62-eae49fb9719d', 'ORD-350719', 0, 'valide', '2025-04-28T11:09:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a7bdb0c9-2743-4da5-8d1d-6ffe89129a9a', 'ORD-350720', 0, 'valide', '2025-04-28T11:10:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e2d23bdb-b40d-43f7-aff4-14726fed99a7', 'ORD-350721', 0, 'valide', '2025-04-28T11:11:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('56c41faa-bc78-44a5-ae92-2cfa7529e628', 'ORD-350722', 0, 'valide', '2025-04-30T11:47:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c49c5a15-fd02-4742-9d9f-06346f3c50c3', 'ORD-350723', 0, 'valide', '2025-04-30T11:59:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d3f5aca0-d421-4dc1-b066-3aed97e44e82', 'ORD-350724', 0, 'valide', '2025-04-30T12:01:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7137744c-0a09-4aab-bfe7-974886ec0eae', 'ORD-350725', 0, 'valide', '2025-04-30T12:59:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('82849c2d-79dc-486e-b9ab-c7890fa85465', 'ORD-350726', 0, 'valide', '2025-05-02T09:03:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dba6a3fc-5904-43cb-b5a6-0829faf5f0e0', 'ORD-350727', 0, 'valide', '2025-05-02T09:03:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('874a5fc2-be23-4f4b-a7bc-b10be188c036', 'ORD-350728', 0, 'valide', '2025-05-02T09:05:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('14771217-1ebf-451a-9ad7-98960689afe9', 'ORD-350729', 0, 'valide', '2025-05-02T09:05:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9065a023-9c96-4bb7-b393-70c71ee2319e', 'ORD-350730', 0, 'valide', '2025-05-02T09:06:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('23b70ffa-c089-48e3-9553-e3dd3644d88e', 'ORD-350731', 0, 'valide', '2025-05-02T09:07:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a70ecddb-053c-407e-b1ed-71d2a0aa49fb', 'ORD-350732', 0, 'valide', '2025-05-02T09:10:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('936ebdb2-6e98-49f7-9d27-c86318485563', 'ORD-350733', 0, 'valide', '2025-05-02T09:11:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a9642ee6-a1c0-4297-8bc2-435fe9a6f62c', 'ORD-350734', 0, 'valide', '2025-05-02T19:49:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2fe05924-96d5-4468-ba60-860fa9c10576', 'ORD-350735', 0, 'valide', '2025-05-02T19:57:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('addfe8f1-8775-42f5-b487-a362506f11e4', 'ORD-350736', 0, 'valide', '2025-05-02T20:02:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b0998e7b-bcf6-464c-a0f0-bb73c52eaba2', 'ORD-350737', 0, 'valide', '2025-05-02T20:03:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c765e7c4-97d3-466f-93c6-0169ab5845b3', 'ORD-350738', 0, 'valide', '2025-05-02T20:04:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f9e47757-ad4b-476c-8fdd-7b06cdc68f0f', 'ORD-350739', 0, 'valide', '2025-05-02T20:05:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c2ff9ba9-06ba-481c-a1da-6b7e1c78e842', 'ORD-350740', 0, 'valide', '2025-05-02T20:06:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('977eb6f4-c37e-4def-924d-305127bdf1eb', 'ORD-350741', 0, 'valide', '2025-05-02T20:13:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c9ed36e-79b0-4210-917c-5993c65ffe08', 'ORD-350742', 0, 'valide', '2025-05-02T20:36:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1ea835a1-ae18-41fd-9b32-b01e9026b7b0', 'ORD-350743', 0, 'valide', '2025-05-02T20:38:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b0fc191-0cef-4cc4-9292-6db35cccd52d', 'ORD-350744', 0, 'valide', '2025-05-02T20:40:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('502dfbeb-db12-4684-bf5a-d2560d3ef997', 'ORD-350745', 0, 'valide', '2025-05-02T20:52:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b209a47-e487-4a41-bc70-ac109d084f83', 'ORD-350746', 0, 'valide', '2025-05-02T21:06:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85ce5170-0f1d-4a49-9d94-f9d9336ef220', 'ORD-350747', 0, 'valide', '2025-05-02T21:06:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1e78a14d-b39f-45b0-a6b6-326acaa7b0d6', 'ORD-350748', 0, 'valide', '2025-05-03T22:09:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3c01b7a8-ff56-4799-b98c-69157e723170', 'ORD-350749', 0, 'valide', '2025-05-03T22:10:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('862f5975-a941-444e-9989-1d4457fe2afa', 'ORD-350750', 0, 'valide', '2025-05-03T22:11:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9299d6d1-7e84-4ae1-89b4-7a273d627f95', 'ORD-350751', 0, 'valide', '2025-05-03T22:14:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e735c487-73c7-49f2-9a93-e85320676f14', 'ORD-350752', 0, 'valide', '2025-05-03T22:20:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('01076775-d282-47ac-858e-e152d37230ea', 'ORD-350753', 0, 'valide', '2025-05-03T22:24:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('503789bd-e987-4669-8a30-0170e42e3f26', 'ORD-350754', 0, 'valide', '2025-05-03T22:25:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4a7d7d06-8af3-4180-9af4-84a0e326880d', 'ORD-350755', 0, 'valide', '2025-05-03T22:26:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66d24a13-ab99-4448-86e7-0c9767d4e308', 'ORD-350756', 0, 'valide', '2025-05-03T22:36:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('43c372bd-eef9-47bd-82ab-b0751a6bbb6b', 'ORD-350757', 0, 'valide', '2025-05-04T19:56:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('160d5c97-6cee-4f63-9270-ecdf077f4da9', 'ORD-350758', 0, 'valide', '2025-05-04T19:58:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('55e23c9c-2ee6-4379-bdb0-0ea83fc01df2', 'ORD-350759', 0, 'valide', '2025-05-04T19:59:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('50c2102c-72a5-4166-89d6-924ed7778198', 'ORD-350760', 0, 'valide', '2025-05-04T20:09:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('137fc35a-52b0-477b-af22-6796fcb039e9', 'ORD-350761', 0, 'valide', '2025-05-04T20:24:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2d249de2-0a6f-4529-99b8-9c7ae779ddee', 'ORD-350762', 0, 'valide', '2025-05-04T20:26:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7bbcdae0-9d2f-414d-9713-46c89a928761', 'ORD-350763', 0, 'valide', '2025-05-04T20:44:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('adf7aec2-7ac2-4c77-98ee-9c5c007cd6ed', 'ORD-350764', 0, 'valide', '2025-05-04T20:49:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('55f220ce-27f0-4df9-8d56-1a3ee83bed11', 'ORD-350765', 0, 'valide', '2025-05-04T20:51:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('524300d8-bcff-4711-9693-7a554b70b5e0', 'ORD-350766', 0, 'valide', '2025-05-04T20:53:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('44a86001-8061-488e-b510-b7b031dd9a68', 'ORD-350767', 0, 'valide', '2025-05-04T20:55:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dd916bb0-d3a4-4db0-93b3-501435a84796', 'ORD-350768', 0, 'valide', '2025-05-05T08:13:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9fcf1df6-cbfd-4d03-a4c5-2585751e7e24', 'ORD-350769', 0, 'valide', '2025-05-05T08:13:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6066e6bc-0508-4ed2-8ce5-ff0959708666', 'ORD-350770', 0, 'valide', '2025-05-05T08:14:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c35c3e1-6ced-4fe6-b73f-2e8b25ece404', 'ORD-350771', 0, 'valide', '2025-05-05T08:15:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8381806c-bded-41a4-bed8-5bf566f6dea7', 'ORD-350772', 0, 'valide', '2025-05-05T08:17:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e6dba6fb-de89-4be8-b375-ff9f85865ac1', 'ORD-350773', 0, 'valide', '2025-05-05T08:18:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85945a77-2900-4321-8383-536db141ce93', 'ORD-350774', 0, 'valide', '2025-05-05T08:41:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6168cb28-d6be-4bd5-91e2-72abbb747496', 'ORD-350775', 0, 'valide', '2025-05-05T08:42:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('910612c0-73b2-4fe2-81aa-b45f49865ed5', 'ORD-350776', 0, 'valide', '2025-05-05T08:56:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('400a35e5-f545-402f-905a-1c89f008ea19', 'ORD-350777', 0, 'valide', '2025-05-05T08:58:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dc87449c-c805-4efc-8901-41e1dfdce1b8', 'ORD-350778', 0, 'valide', '2025-05-05T08:59:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d3b7a304-f774-469a-be7f-2efdc1d59dea', 'ORD-350779', 0, 'valide', '2025-05-05T09:00:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec9ce161-158c-485d-8501-015a6cbf9638', 'ORD-350780', 0, 'valide', '2025-05-05T09:01:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bec28285-f1e3-4ebb-a8f8-7e0547e54e6f', 'ORD-350781', 0, 'valide', '2025-05-05T09:02:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8fff4e21-b47b-4a54-9d07-468a462c1870', 'ORD-350782', 0, 'valide', '2025-05-05T09:04:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78ba9c81-2687-402a-9bcf-a33bab1e44ce', 'ORD-350783', 0, 'valide', '2025-05-05T09:05:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('669598d0-8be2-4b0d-b22b-0a23df572ee5', 'ORD-350784', 0, 'valide', '2025-05-05T09:07:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fcc5030c-42a1-4a87-a15a-5e0b34f92f46', 'ORD-350785', 0, 'valide', '2025-05-05T09:09:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5dc30e41-5aad-4199-a46f-47d32a029941', 'ORD-350786', 0, 'valide', '2025-05-05T09:09:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9c39072c-f195-4dac-b014-96faa8ebe8fd', 'ORD-350787', 0, 'valide', '2025-05-05T09:11:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85e54dcb-6303-454a-aedf-c4c3e5dd5a68', 'ORD-350788', 0, 'valide', '2025-05-05T09:11:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('04a40173-2682-47ef-8d20-8a18b1298605', 'ORD-350789', 0, 'valide', '2025-05-05T09:13:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f6cd89e-75aa-41ab-bbc3-5c6490d0e384', 'ORD-350790', 0, 'valide', '2025-05-05T09:15:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('af51bc76-6eec-4ff5-ac14-b52cb52a22aa', 'ORD-350791', 0, 'valide', '2025-05-05T09:18:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b1b3253-0c06-4bba-a0b7-ce3d491a812b', 'ORD-350792', 0, 'valide', '2025-05-05T09:18:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('739ced61-f21d-47ad-9147-30bed34b48d0', 'ORD-350793', 0, 'valide', '2025-05-05T09:55:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ff061e7e-4d14-4e07-b553-ab73546fc032', 'ORD-350794', 0, 'valide', '2025-05-05T10:00:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6c7d5c3c-9054-4402-a506-8192fc23a51a', 'ORD-350795', 0, 'valide', '2025-05-05T10:07:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b9a638da-b9a4-4951-801c-27ed1d3e33b7', 'ORD-350796', 0, 'valide', '2025-05-05T11:02:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f80001e7-f9be-44ef-9e87-a591bc48e82c', 'ORD-350797', 0, 'valide', '2025-05-05T11:03:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('018a1757-c20f-4860-a199-eb6ccb2b9b6f', 'ORD-350798', 0, 'valide', '2025-05-05T11:05:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5fd4d1ff-f5f5-4858-a763-becbd3b0c7fc', 'ORD-350799', 0, 'valide', '2025-05-05T15:59:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dfd18940-3357-47c0-8aff-9700c24c0f38', 'ORD-350800', 0, 'valide', '2025-05-08T11:39:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7143c6ad-3aee-4237-9c70-f2324690a62d', 'ORD-350801', 0, 'valide', '2025-05-08T11:39:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3dbdfd62-ff64-4fa2-819a-80d608ccf243', 'ORD-350802', 0, 'valide', '2025-05-08T11:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f649e45a-0b69-4b54-a263-ac5ed23dde96', 'ORD-350803', 0, 'valide', '2025-05-08T11:45:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ab566d4e-02f9-4e07-8911-1966dbe6bc77', 'ORD-350804', 0, 'valide', '2025-05-08T11:46:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2a5dc9b9-bbcc-4b65-813a-df66182728d9', 'ORD-350805', 0, 'valide', '2025-05-08T11:47:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c6123b1-dc76-4dd8-bf60-41bb54a8d1df', 'ORD-350806', 0, 'valide', '2025-05-11T22:50:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0b15e2a8-e228-4ad2-811e-6793a47c1912', 'ORD-350807', 0, 'valide', '2025-05-11T22:51:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5b578b37-4b8e-4384-93c7-94f8b892c349', 'ORD-350808', 0, 'valide', '2025-05-12T07:54:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f8d56b9b-4d9f-4355-a251-f5c32d7dd334', 'ORD-350809', 0, 'valide', '2025-05-12T07:55:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9ae73d50-0e35-49e6-af0f-c73c32e42330', 'ORD-350810', 0, 'valide', '2025-05-12T07:57:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('75d40ea5-fa43-447c-8ebd-c228aa5fc2f2', 'ORD-350811', 0, 'valide', '2025-05-12T07:57:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a87c3860-2bde-444b-91f0-abeea38d7059', 'ORD-350812', 0, 'valide', '2025-05-12T07:58:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1312bbc5-04a5-41b2-8c49-0c6ec1e94fc7', 'ORD-350813', 0, 'valide', '2025-05-12T08:00:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9f019400-444e-48d8-9837-2c55fc356be5', 'ORD-350814', 0, 'valide', '2025-05-12T08:01:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7afa401-0c30-4c00-a746-6511edde0fb7', 'ORD-350815', 0, 'valide', '2025-05-12T08:07:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fbced27c-aca2-42b2-a3d8-b66a5ab98daa', 'ORD-350816', 0, 'valide', '2025-05-12T08:08:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('47d4695f-2ebb-4b88-81d2-939af9c4ca80', 'ORD-350817', 0, 'valide', '2025-05-12T08:09:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e5a977a0-a70e-4b7e-a2ce-2bd2b8f6c7f5', 'ORD-350818', 0, 'valide', '2025-05-12T08:10:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('feae3a38-40aa-47a0-b14c-eec86c040978', 'ORD-350819', 0, 'valide', '2025-05-12T08:10:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0e374a16-e191-4776-b2b0-9a50d70c10fa', 'ORD-350820', 0, 'valide', '2025-05-12T08:11:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('742f0677-74f4-4f57-a95f-1429e831efe6', 'ORD-350821', 0, 'valide', '2025-05-13T07:38:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('683c05a7-3d6f-446e-a989-ba537905b58c', 'ORD-350822', 0, 'valide', '2025-05-13T14:13:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6fad964f-0636-4b72-be04-c7346aa6c4e8', 'ORD-350823', 0, 'valide', '2025-05-13T19:01:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5cdaaebb-e15a-4a0d-bc3c-dbd02715aa7c', 'ORD-350824', 0, 'valide', '2025-05-13T19:02:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8469d2b0-2ad6-4c31-9cb6-099e089603ca', 'ORD-350825', 0, 'valide', '2025-05-13T19:05:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b14ee25d-b3c5-4f6d-9bf5-41caf7cdde3c', 'ORD-350826', 0, 'valide', '2025-05-13T20:25:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8651398e-45b6-4f81-be2d-f725e7055bea', 'ORD-350827', 0, 'valide', '2025-05-13T20:29:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb92f362-d751-4724-84db-8199cfa00161', 'ORD-350828', 0, 'valide', '2025-05-13T20:34:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3f00c22f-1024-480a-9797-421fd42939a4', 'ORD-350829', 0, 'valide', '2025-05-13T20:35:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a6074610-9397-473b-8b5c-9b17332c304c', 'ORD-350830', 0, 'valide', '2025-05-13T20:40:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f3b059f0-3d39-4579-9b7d-1bd966b3e0e9', 'ORD-350831', 0, 'valide', '2025-05-14T07:19:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('35474bbe-d656-4f3f-b38e-3227cfd1c6ab', 'ORD-350832', 0, 'valide', '2025-05-14T07:20:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('984ac907-c563-4b58-ba80-e7c77d09fe9e', 'ORD-350833', 0, 'valide', '2025-05-14T07:22:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('da60d360-77c5-4973-b680-0e5592dc8547', 'ORD-350834', 0, 'valide', '2025-05-14T08:47:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('778ea0a6-8707-40a3-94db-fbfd4fc068f9', 'ORD-350835', 0, 'valide', '2025-05-14T08:49:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2403fbb8-d9c6-4f89-bbfe-650ebdbf3734', 'ORD-350836', 0, 'valide', '2025-05-14T08:53:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('546a2947-d75c-40f4-a558-57625de10532', 'ORD-350837', 0, 'valide', '2025-05-14T08:56:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('595b23f0-0752-4ebf-935a-b1a09017b73d', 'ORD-350838', 0, 'valide', '2025-05-14T10:44:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('84de8cc5-4d95-494e-868d-a9cbd01d157a', 'ORD-350839', 0, 'valide', '2025-05-14T17:31:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('93249958-8a1c-4c42-ac5d-e76b335d2ef6', 'ORD-350840', 0, 'valide', '2025-05-14T17:32:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8ab21100-e05e-4c51-986d-9136b304c25d', 'ORD-350841', 0, 'valide', '2025-05-14T17:35:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1a9e92fe-630b-4768-860e-29203227d803', 'ORD-350842', 0, 'valide', '2025-05-14T17:45:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b55e327-6f2f-4b96-b48f-5eb02d9612bc', 'ORD-350843', 0, 'valide', '2025-05-14T18:29:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ddd7192d-6af0-417c-b6e8-883742475c84', 'ORD-350844', 0, 'valide', '2025-05-14T18:33:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('757bc09f-9941-45bb-9637-5b8493f0ea94', 'ORD-350845', 0, 'valide', '2025-05-14T18:34:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('258e123c-0405-4a69-b998-49c7f9ccc6c1', 'ORD-350846', 0, 'valide', '2025-05-14T18:35:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6dfa2ce5-8030-4d70-9119-3cb45d7a8b84', 'ORD-350847', 0, 'valide', '2025-05-14T18:36:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b4b0857-ca42-4f8f-8a8e-c65ce925f009', 'ORD-350848', 0, 'valide', '2025-05-14T19:09:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b443b16b-4d3d-429c-9d68-4512804f5692', 'ORD-350849', 0, 'valide', '2025-05-14T19:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58dcae81-29ac-444e-a717-bbe53d2ffc3d', 'ORD-350850', 0, 'valide', '2025-05-14T20:25:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a76f4492-86f9-400c-bbcd-b071bd31ac03', 'ORD-350851', 0, 'valide', '2025-05-14T20:31:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cef60e83-e7ff-490e-ad24-4c03ffdab793', 'ORD-350852', 0, 'valide', '2025-05-15T08:17:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1c4f712e-1f36-48af-b018-f1f213932965', 'ORD-350853', 0, 'valide', '2025-05-15T08:19:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aef600ca-0f8f-40b2-b312-be78ddead090', 'ORD-350854', 0, 'valide', '2025-05-15T08:20:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fea8d4b2-e70d-4968-9860-f98fc2d46b07', 'ORD-350855', 0, 'valide', '2025-05-15T08:21:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e2894de-a013-4662-bd79-167599d096be', 'ORD-350856', 0, 'valide', '2025-05-15T08:22:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('92713ab6-90ae-4c43-8497-3af580f73447', 'ORD-350857', 0, 'valide', '2025-05-15T14:41:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('da599528-937f-4642-8d8f-fb60a4eb90c0', 'ORD-350858', 0, 'valide', '2025-05-15T14:43:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85d9e5f3-b939-4331-9075-c742c9bf249c', 'ORD-350859', 0, 'valide', '2025-05-15T15:18:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4672633f-34ac-4322-9ccd-f62f16f96d21', 'ORD-350860', 0, 'valide', '2025-05-15T15:19:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1ff616c-65d4-4441-9be0-8b3acf5ce473', 'ORD-350861', 0, 'valide', '2025-05-15T15:20:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7491c6a6-5200-4f69-8a9a-4b6ce6f66edf', 'ORD-350862', 0, 'valide', '2025-05-15T15:26:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e0953cb9-979d-4ca6-9230-810555d9b2a6', 'ORD-350863', 0, 'valide', '2025-05-15T15:27:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('86e693a4-f308-4352-8768-8cfbc25bf1d5', 'ORD-350864', 0, 'valide', '2025-05-15T15:28:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('466e9142-a9ea-477c-86ad-b2b05fd9f1b5', 'ORD-350865', 0, 'valide', '2025-05-15T15:30:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('65c9c228-3a4e-4819-a4b1-de6797d0f6c3', 'ORD-350866', 0, 'valide', '2025-05-15T15:32:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('198f1158-f2c9-468f-96fe-898faa1374a3', 'ORD-350867', 0, 'valide', '2025-05-15T15:33:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('91395697-3924-4cbb-bf44-6d384aafc838', 'ORD-350868', 0, 'valide', '2025-05-15T15:35:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fc6bbe43-5704-47fe-a49c-9e9940f0a507', 'ORD-350869', 0, 'valide', '2025-05-15T15:42:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7ce37c42-4509-4c02-b5b8-ac344085df96', 'ORD-350870', 0, 'valide', '2025-05-15T15:44:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('287a8c31-469e-4b57-86d8-3d605a2b110f', 'ORD-350871', 0, 'valide', '2025-05-15T15:47:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6144be49-878a-4153-80ff-8762f729d9af', 'ORD-350872', 0, 'valide', '2025-05-15T15:50:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3e6e9f72-8cee-4eab-b6da-b4712b5f410a', 'ORD-350873', 0, 'valide', '2025-05-15T15:53:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('09dec973-3294-42bd-8124-67bd13b7c81e', 'ORD-350874', 0, 'valide', '2025-05-15T15:54:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3bca28b9-9246-4691-9411-ebec1848c80c', 'ORD-350875', 0, 'valide', '2025-05-15T15:55:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dbbae3e1-12f5-43e0-90c6-e762c6e2be40', 'ORD-350876', 0, 'valide', '2025-05-15T15:56:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b862e4e4-d8e4-416d-86b5-9f69038f4136', 'ORD-350877', 0, 'valide', '2025-05-15T18:35:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('33fd6d49-299f-4d94-8006-1473997188bb', 'ORD-350878', 0, 'valide', '2025-05-16T10:11:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2a1974a-3e7b-4e8b-8012-cf7b84383982', 'ORD-350879', 0, 'valide', '2025-05-16T10:13:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('35f54541-2c22-4946-addf-e26f65c734fd', 'ORD-350880', 0, 'valide', '2025-05-16T10:15:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b3e81696-d177-4abe-8590-3a8aa1e2e762', 'ORD-350881', 0, 'valide', '2025-05-16T10:19:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a24c5ff-3550-4de5-acae-bdf50d57582f', 'ORD-350882', 0, 'valide', '2025-05-16T10:21:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('682f3b58-1e7c-4d0c-ae91-08dfe8b37dd5', 'ORD-350883', 0, 'valide', '2025-05-16T10:22:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bffe920b-c413-4ee8-be61-6d12c449bff2', 'ORD-350884', 0, 'valide', '2025-05-16T10:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0a102727-e7ef-4dd7-9d52-61a7a6f7733d', 'ORD-350885', 0, 'valide', '2025-05-16T10:54:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3ee09fd9-465e-4726-baee-23472e6c9247', 'ORD-350886', 0, 'valide', '2025-05-16T10:56:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a72ebdc-4d5e-4222-bc82-27ce16b988f9', 'ORD-350887', 0, 'valide', '2025-05-16T10:58:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('afdbc577-2282-4610-b6cc-a97acaa8a1cb', 'ORD-350888', 0, 'valide', '2025-05-16T10:58:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b8d62d5-6d75-4fd6-a48b-eedb42b066e1', 'ORD-350889', 0, 'valide', '2025-05-16T11:00:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ef3ef75b-fd0a-4c06-9c8f-3c3b6ca72895', 'ORD-350890', 0, 'valide', '2025-05-16T11:02:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fefd05c5-441d-4bc8-a8bf-091b7d704290', 'ORD-350891', 0, 'valide', '2025-05-16T11:03:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37013e05-72b3-4567-a3f6-b9e6f36ba83c', 'ORD-350892', 0, 'valide', '2025-05-16T11:04:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('784ef53b-6fb6-41df-8968-fad5346c19d1', 'ORD-350893', 0, 'valide', '2025-05-16T11:10:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb7c09a9-20b5-4c75-bc20-6c10c9333e62', 'ORD-350894', 0, 'valide', '2025-05-16T12:23:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f84e08cb-ec19-4f36-9052-bd9fe252d8ab', 'ORD-350895', 0, 'valide', '2025-05-16T12:25:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('402ceef8-ba93-4f7f-aea9-6920e565f04a', 'ORD-350896', 0, 'valide', '2025-05-16T14:58:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9f3cb402-db4f-4303-a892-eac6f1f09083', 'ORD-350897', 0, 'valide', '2025-05-16T14:59:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5772db8b-2f53-4f17-9ceb-831c3e30b62d', 'ORD-350898', 0, 'valide', '2025-05-16T15:00:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fa407d3d-ae05-4e6c-8899-5a3210a0f921', 'ORD-350899', 0, 'valide', '2025-05-16T15:01:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('04ea43b7-7eb3-43f2-85ca-9eb0ee10e92a', 'ORD-350900', 0, 'valide', '2025-05-16T15:02:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8a8cf5a1-eb31-47d5-adb6-516c69ec3b59', 'ORD-350901', 0, 'valide', '2025-05-16T15:02:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2a414abf-cea6-403d-a257-8cdec7703b59', 'ORD-350902', 0, 'valide', '2025-05-16T15:03:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b5fbcca1-2c6d-4ad2-be01-9390ac09093d', 'ORD-350903', 0, 'valide', '2025-05-16T17:06:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fad0638e-10ed-4309-96d9-a532210fbad1', 'ORD-350904', 0, 'valide', '2025-05-16T17:09:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('01ff829c-b6bc-4f5e-bbe1-26217d02a074', 'ORD-350905', 0, 'valide', '2025-05-17T17:42:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9563064d-81f9-4aee-aef0-70fc03173f09', 'ORD-350906', 0, 'valide', '2025-05-17T17:49:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fcccfd5a-12d6-4f09-afe8-14d4b7f7a510', 'ORD-350907', 0, 'valide', '2025-05-17T17:51:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('29bf260d-8308-4ff3-a94c-b612f0f50d57', 'ORD-350908', 0, 'valide', '2025-05-17T17:56:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e9fb588a-5905-413d-aa9e-89d03a40b3cc', 'ORD-350909', 0, 'valide', '2025-05-17T17:57:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1c99015e-0ab4-4567-a50d-e10498423e16', 'ORD-350910', 0, 'valide', '2025-05-17T17:58:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2eff9913-31e1-4994-af00-b08b7eee507b', 'ORD-350911', 0, 'valide', '2025-05-18T08:19:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('51650741-4847-476b-b2d4-77d1771089b1', 'ORD-350912', 0, 'valide', '2025-05-18T08:21:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8a94c23c-a501-4081-b11f-1a7da932f328', 'ORD-350913', 0, 'valide', '2025-05-18T08:23:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aaf577a8-d5a4-45aa-9e59-4e631268f8f0', 'ORD-350914', 0, 'valide', '2025-05-18T08:34:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ed735ecf-8121-4a1e-8d40-fa93a57a76c3', 'ORD-350915', 0, 'valide', '2025-05-18T08:37:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bf5fc255-d36e-4268-ac97-0c177f70a256', 'ORD-350916', 0, 'valide', '2025-05-18T08:39:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cea577b9-8b5f-41d5-b708-425306493de4', 'ORD-350917', 0, 'valide', '2025-05-18T08:42:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cd8c50f1-cdea-42b1-a75e-bd9faca433b4', 'ORD-350918', 0, 'valide', '2025-05-18T11:04:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7583c90a-49e3-4dd3-a7c8-fed85e6757dd', 'ORD-350919', 0, 'valide', '2025-05-18T11:04:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a5a4098d-13a6-423a-a058-fdac40e6d2ed', 'ORD-350920', 0, 'valide', '2025-05-18T11:07:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('157c046a-931e-4996-8278-576351fcb91c', 'ORD-350921', 0, 'valide', '2025-05-18T11:09:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e03f6aa8-38d8-4af4-8d31-95d546b8d4f8', 'ORD-350922', 0, 'valide', '2025-05-18T11:12:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('70df61b9-c0ca-4f68-b87b-6fae91ad084c', 'ORD-350923', 0, 'valide', '2025-05-18T11:14:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5a98677b-a059-4e17-96b5-f8cb82219891', 'ORD-350924', 0, 'valide', '2025-05-18T11:15:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('77ac84d2-d546-4ef7-9f88-14d945086d6e', 'ORD-350925', 0, 'valide', '2025-05-18T11:17:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5984a2a7-55ca-4bcf-90db-ad1bbc27a672', 'ORD-350926', 0, 'valide', '2025-05-18T11:20:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6bb9f3ce-dfb5-451d-ba14-91febdeb351d', 'ORD-350927', 0, 'valide', '2025-05-18T19:13:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c4b7bef-118d-43ea-a7f6-6c986d54034e', 'ORD-350928', 0, 'valide', '2025-05-18T19:16:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7863f4b-a3d0-4d58-a621-6003cfac500d', 'ORD-350929', 0, 'valide', '2025-05-18T19:20:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1a7fd10-841e-41c5-b62c-a7603389725d', 'ORD-350930', 0, 'valide', '2025-05-18T19:32:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9d2edb4e-6e52-4d90-98b1-de3cb3a8fd70', 'ORD-350931', 0, 'valide', '2025-05-18T19:34:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ac8d6875-e389-4505-84e0-e2330bef5d72', 'ORD-350932', 0, 'valide', '2025-05-20T08:28:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40537582-9f92-4536-956d-9d013baf4ad4', 'ORD-350933', 0, 'valide', '2025-05-20T08:34:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0c83c210-7aa6-4ec6-813b-3b1afd91054a', 'ORD-350934', 0, 'valide', '2025-05-20T08:35:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4335e1f0-b920-4d48-898d-400153d26881', 'ORD-350935', 0, 'valide', '2025-05-20T08:37:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f3330cce-6ffb-413a-b44e-fd980dd0025a', 'ORD-350936', 0, 'valide', '2025-05-20T08:41:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('650b6ea7-77a3-440d-a1e5-647e297852c1', 'ORD-350937', 0, 'valide', '2025-05-20T08:50:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6e84c906-93ab-4d0b-8937-a4efcde55cab', 'ORD-350938', 0, 'valide', '2025-05-20T15:33:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ca3d4d63-6a91-4278-aa7c-6f9c90d80854', 'ORD-350939', 0, 'valide', '2025-05-21T09:27:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c983d143-9d15-4b4a-af52-c4b0c8856645', 'ORD-350940', 0, 'valide', '2025-05-21T12:06:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0bca1224-c757-45bb-b23a-866babd8e9a7', 'ORD-350941', 0, 'valide', '2025-05-21T12:07:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c9c6acbc-b38a-4f09-93a2-f1fa90ea9590', 'ORD-350942', 0, 'valide', '2025-05-21T12:09:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('89f66312-90bf-45fd-a311-d17b108297c2', 'ORD-350943', 0, 'valide', '2025-05-21T22:59:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('03870171-6dcf-4091-95df-e3218c770d37', 'ORD-350944', 0, 'valide', '2025-05-21T23:01:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e12dcf3f-4a39-4630-8f1f-2618641265bf', 'ORD-350945', 0, 'valide', '2025-05-21T23:02:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('63cf7c22-a1b4-443f-bebb-d2c86efa5797', 'ORD-350946', 0, 'valide', '2025-05-21T23:05:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f59f7ee9-59b5-4526-bf6e-d34b1cff1dc4', 'ORD-350947', 0, 'valide', '2025-05-21T23:06:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3a364624-f5fa-4ee2-b9d4-becde84d3430', 'ORD-350948', 0, 'valide', '2025-05-21T23:07:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('686f5cb0-21d4-4bed-b5a6-7da08838551d', 'ORD-350949', 0, 'valide', '2025-05-21T23:10:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a88a085e-c5f1-42fa-a181-2a6f81771833', 'ORD-350950', 0, 'valide', '2025-05-21T23:11:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d228c485-c6db-400f-b292-6ec0a360ad46', 'ORD-350951', 0, 'valide', '2025-05-21T23:15:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('70ac6342-9b61-432f-9816-416212d637eb', 'ORD-350952', 0, 'valide', '2025-05-21T23:16:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f04a0b7b-ba5c-4fb9-8407-42b25bb22d43', 'ORD-350953', 0, 'valide', '2025-05-21T23:18:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4930191e-f81f-4ff0-8394-622717a9b597', 'ORD-350954', 0, 'valide', '2025-05-21T23:19:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bcaeff47-4373-4230-bb04-3771cbb1fefa', 'ORD-350955', 0, 'valide', '2025-05-21T23:21:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64e428f1-5ee3-4964-aeda-ec2bfe845424', 'ORD-350956', 0, 'valide', '2025-05-21T23:23:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40a4560c-84ac-48de-82eb-e61d073452a7', 'ORD-350957', 0, 'valide', '2025-05-21T23:24:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c92810e7-86ab-437c-a58f-5d4e8937e278', 'ORD-350958', 0, 'valide', '2025-05-21T23:26:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bbaded17-0a88-49a9-b8bc-a915d57693e4', 'ORD-350959', 0, 'valide', '2025-05-21T23:27:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('80790e77-4143-4295-8590-6e38a7ddae0e', 'ORD-350960', 0, 'valide', '2025-05-21T23:28:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dff49953-64df-45b6-818a-437fd02a8d4b', 'ORD-350961', 0, 'valide', '2025-05-21T23:30:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5463ca93-1efe-4bca-952d-b67216a7b98f', 'ORD-350962', 0, 'valide', '2025-05-21T23:33:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d8499883-096b-43ad-b775-8a40feeb5981', 'ORD-350963', 0, 'valide', '2025-05-21T23:34:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4fd20852-9c8c-4f35-a09b-e54a76b87ddc', 'ORD-350964', 0, 'valide', '2025-05-21T23:36:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('33dac447-3fe7-44d2-ad56-1c2999572376', 'ORD-350965', 0, 'valide', '2025-05-21T23:40:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5efb19c4-5b61-4459-81bb-2cb26374c453', 'ORD-350966', 0, 'valide', '2025-05-21T23:41:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5dcbe278-2a0e-4a29-b2c8-21914d0bd0fb', 'ORD-350967', 0, 'valide', '2025-05-21T23:43:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6ae0996d-87c2-4072-a545-86e6b43c84a5', 'ORD-350968', 0, 'valide', '2025-05-21T23:44:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('39d7ba9f-2bee-4ed3-a2aa-e1c60a35f4b3', 'ORD-350969', 0, 'valide', '2025-05-22T06:41:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1016364d-d69a-493b-a116-d56119056b39', 'ORD-350970', 0, 'valide', '2025-05-22T06:45:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('07f599f5-f960-4350-a065-437d16adc2ad', 'ORD-350971', 0, 'valide', '2025-05-22T06:50:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f532d1e7-5358-42e1-977a-5d1cd5fd48fe', 'ORD-350972', 0, 'valide', '2025-05-22T06:54:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c80c83a7-d435-4d0c-991e-6a6eedb3aa79', 'ORD-350973', 0, 'valide', '2025-05-22T06:56:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9db4ba2f-9aec-4b74-8a09-8e8fc7c89c85', 'ORD-350974', 0, 'valide', '2025-05-22T06:59:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0174aed5-43e7-40b0-874d-4a4f5ff549c0', 'ORD-350975', 0, 'valide', '2025-05-22T07:03:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ade10586-8af6-44ba-9433-291631e80228', 'ORD-350976', 0, 'valide', '2025-05-22T07:04:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('70b3ddb5-1111-48bd-a478-a01f416d3815', 'ORD-350977', 0, 'valide', '2025-05-22T07:05:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('975cc957-c0d8-41ad-9fd4-8ba536ae4778', 'ORD-350978', 0, 'valide', '2025-05-22T07:06:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bae81d7c-c668-4d5c-bc32-50b804314d04', 'ORD-350979', 0, 'valide', '2025-05-22T07:06:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d30fbd5e-6fc7-4d4c-8cb9-40ebd51efaff', 'ORD-350980', 0, 'valide', '2025-05-22T07:07:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2348a897-0f1e-4bc6-85dc-09ffc75a3587', 'ORD-360878', 0, 'valide', '2025-05-23T07:47:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c61e95ee-5a7e-4eb8-bc9c-950aa7b8ab29', 'ORD-360879', 0, 'valide', '2025-05-23T07:47:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('529af2f7-6a52-4347-a388-49720afb2b35', 'ORD-360880', 0, 'valide', '2025-05-23T07:48:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9dc41111-46b5-48af-9407-d8b1700e9814', 'ORD-360881', 0, 'valide', '2025-05-23T07:48:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f73bfcf4-fb51-4739-82e2-99d80132a054', 'ORD-360882', 0, 'valide', '2025-05-23T07:49:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('45bccd78-739c-4134-bc84-d5d53b17ce64', 'ORD-360883', 0, 'valide', '2025-05-23T07:50:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d2bea333-d598-445d-8517-c2efe1cc4b42', 'ORD-360884', 0, 'valide', '2025-05-23T07:51:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5a9c4091-a7af-44a5-9264-df42a0629c26', 'ORD-360885', 0, 'valide', '2025-05-23T07:51:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eacd657f-5b20-4b50-ac1d-be72e259d533', 'ORD-360886', 0, 'valide', '2025-05-23T07:52:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e494aeac-3320-4dc9-9125-bc85b4bcc1c3', 'ORD-360887', 0, 'valide', '2025-05-23T07:54:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a25ed9d7-4940-4d20-9112-8bf12a81ea3a', 'ORD-360888', 0, 'valide', '2025-05-23T07:54:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('15491a45-f279-4b25-a0ac-ea198f4d148a', 'ORD-360889', 0, 'valide', '2025-05-23T07:55:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('72bf56ba-c79f-4750-8e4d-f3afe028f535', 'ORD-360890', 0, 'valide', '2025-05-23T07:56:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('be919106-f5f7-4415-9b5a-c35b89a95b5c', 'ORD-360891', 0, 'valide', '2025-05-23T07:57:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('45d3560a-50a5-4ffb-a68a-38fd9393c756', 'ORD-360892', 0, 'valide', '2025-05-23T07:57:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d2f32fad-dcee-4983-8be6-19a09f07fe09', 'ORD-360893', 0, 'valide', '2025-05-23T07:58:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2563f069-5fc2-4862-92bb-5a92111179e2', 'ORD-360894', 0, 'valide', '2025-05-23T07:59:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4b99add8-f942-4a9c-9752-c7854e6b0fd4', 'ORD-360895', 0, 'valide', '2025-05-23T08:00:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('893af983-a7e0-42c9-a55f-6632d8d234cf', 'ORD-360896', 0, 'valide', '2025-05-23T08:01:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('003fc334-7df0-43e7-a7e6-248ea65d9408', 'ORD-360897', 0, 'valide', '2025-05-23T08:02:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c9bacbfc-4480-41da-93ec-569acbbd9663', 'ORD-360898', 0, 'valide', '2025-05-25T14:51:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e40ffad2-0580-4ec0-9c9c-6c5da5f830b1', 'ORD-360899', 0, 'valide', '2025-05-25T14:52:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4de296b2-197c-46f6-9272-0011fd4252f9', 'ORD-360900', 0, 'valide', '2025-05-25T14:53:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('60489a34-7722-4c87-8c8c-cae4ab6302ef', 'ORD-360901', 0, 'valide', '2025-05-25T14:54:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8922cd8d-d8f8-4ce0-a29f-dac8a5e5082d', 'ORD-360902', 0, 'valide', '2025-05-25T14:55:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f53803c2-6097-4683-b369-5e8b10c0ead3', 'ORD-360903', 0, 'valide', '2025-05-25T14:56:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('86ff69c3-1a1d-4325-9269-50bbf80f9968', 'ORD-360904', 0, 'valide', '2025-05-25T14:58:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a76fb70c-e449-40e3-9a61-9672f7f9c55b', 'ORD-360905', 0, 'valide', '2025-05-25T15:00:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('436dd822-22d3-40d9-9540-216890b1636d', 'ORD-360906', 0, 'valide', '2025-05-25T22:05:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dc3239dd-a1ee-47cf-b0af-a20303f7ed2d', 'ORD-360907', 0, 'valide', '2025-05-25T22:06:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3802a48d-b40e-42fc-8196-676efbf1d191', 'ORD-360908', 0, 'valide', '2025-05-25T22:11:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3bed2db9-661e-4518-8d42-79e3a1a716cd', 'ORD-360909', 0, 'valide', '2025-05-25T22:13:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e36afe15-2dd7-4624-9773-ddd15a278253', 'ORD-360910', 0, 'valide', '2025-05-25T22:14:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec01680b-ea4d-49ca-9791-e6f30f8885b8', 'ORD-360911', 0, 'valide', '2025-05-25T22:14:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('09db63c1-d552-4ddf-945b-ccfea3644f54', 'ORD-360912', 0, 'valide', '2025-05-26T17:22:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ab8676d2-482b-4a55-afd8-604dd5b999a1', 'ORD-360913', 0, 'valide', '2025-05-26T17:47:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a386318f-56df-43c4-91b2-7d9417d4ca6e', 'ORD-360914', 0, 'valide', '2025-05-26T18:09:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bfe97485-0e2c-4188-b807-6259c39f9178', 'ORD-360915', 0, 'valide', '2025-05-26T18:12:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('67d2a599-3fd7-4423-84f9-0b4fd29a9e6f', 'ORD-360916', 0, 'valide', '2025-05-26T18:35:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('808b9c88-efca-40a5-ab9b-a80e2d5204e1', 'ORD-360917', 0, 'valide', '2025-05-27T12:57:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37d5486e-fafe-4bf6-9aab-e9900c62378c', 'ORD-360918', 0, 'valide', '2025-05-27T13:01:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c25cc4d9-2c33-4523-8436-a4fbf7e7fa22', 'ORD-360919', 0, 'valide', '2025-05-27T13:03:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('89fdda57-adef-45f7-8c30-45a8995b4bdc', 'ORD-360920', 0, 'valide', '2025-05-27T13:03:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('35622c45-3736-4ef2-bede-dc3d9f646675', 'ORD-360921', 0, 'valide', '2025-05-27T13:05:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e863937a-4678-449c-b074-c7901dc6cc26', 'ORD-360922', 0, 'valide', '2025-05-27T13:06:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28829cc6-ca89-4688-882a-5a6d693eba8d', 'ORD-370913', 0, 'valide', '2025-05-29T18:59:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b62d9fbb-896d-4e88-84b8-2bf09674a6dc', 'ORD-370914', 0, 'valide', '2025-05-29T19:00:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e98bc004-a960-41ed-85c0-22085825923c', 'ORD-370915', 0, 'valide', '2025-05-29T19:02:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0bdad93f-ee13-4f18-8e83-ef3ff5116cb6', 'ORD-370916', 0, 'valide', '2025-05-29T19:04:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('165dfe09-1161-485d-9568-ebd22df37c86', 'ORD-370917', 0, 'valide', '2025-05-29T21:10:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec881e99-2449-46c9-9540-8bfe2ae80fd4', 'ORD-370918', 0, 'valide', '2025-05-30T06:58:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('430c0efd-af02-46e0-b595-90e058d443f6', 'ORD-370919', 0, 'valide', '2025-05-30T07:48:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2d0b3f45-34d5-4285-b6b5-82670368cb8b', 'ORD-370920', 0, 'valide', '2025-05-30T07:48:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a604b773-1ce1-436b-a44c-13b0e7eeb6c4', 'ORD-370921', 0, 'valide', '2025-05-30T07:51:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('43ff61d8-dff8-49f4-a5f1-a99f4ffad9cd', 'ORD-370922', 0, 'valide', '2025-05-30T07:52:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('72f40a70-711b-401e-a682-df65073b657c', 'ORD-370923', 0, 'valide', '2025-05-30T07:53:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bce725ba-84e5-487a-a815-28f297e15c7a', 'ORD-370924', 0, 'valide', '2025-05-30T07:54:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('194d8bfd-120c-4885-9815-76913b3378a8', 'ORD-370925', 0, 'valide', '2025-05-30T07:56:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('188eed9c-f148-44ea-a675-77603f9c9cbc', 'ORD-370926', 0, 'valide', '2025-05-30T07:57:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('30dac5eb-585d-40db-9d7e-b7dc22e04ea1', 'ORD-370927', 0, 'valide', '2025-05-30T22:21:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4f2300e6-96d4-4e96-b5c6-c7c9aabc79fc', 'ORD-370928', 0, 'valide', '2025-05-30T22:22:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c77d9e36-addc-4e79-bc7a-ad4a29ee86e5', 'ORD-370929', 0, 'valide', '2025-05-30T22:26:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec1da14e-f614-444f-8c5b-b561392e053f', 'ORD-370930', 0, 'valide', '2025-05-30T22:30:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7312052a-8d33-4841-ac80-eac9b2bb5026', 'ORD-370931', 0, 'valide', '2025-05-30T22:33:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dc1f145c-3ef2-49fd-abb3-0b696fca95ff', 'ORD-370932', 0, 'valide', '2025-06-01T20:03:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ee940c44-900f-4dc5-b483-fea371c4d160', 'ORD-370933', 0, 'brouillon', '2025-06-01T20:06:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85a245d8-0565-4201-a3d7-aa07683c6ecd', 'ORD-370934', 0, 'brouillon', '2025-06-01T20:06:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c2c803bd-5005-457a-850a-bce93fc8519d', 'ORD-370935', 0, 'valide', '2025-06-01T20:06:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5ccb14f5-f0a3-41da-8667-9ec480dfbef3', 'ORD-370936', 0, 'valide', '2025-06-01T20:07:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6fb109b7-2678-4243-819d-40b57d5ac0f4', 'ORD-370937', 0, 'valide', '2025-06-01T20:09:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1e9469aa-0d33-4ca4-8052-229ddc1d8bc9', 'ORD-370938', 0, 'brouillon', '2025-06-01T20:10:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59250f12-8eb9-4455-899e-64bc3a82ddfa', 'ORD-370939', 0, 'valide', '2025-06-01T20:11:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78fe1cde-af65-4e49-bd1b-246579a949cc', 'ORD-370940', 0, 'valide', '2025-06-01T20:17:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0e2ec0ab-95be-46c9-b679-9b43ac9e16e8', 'ORD-370941', 0, 'valide', '2025-06-01T20:17:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('68c124ed-d601-47d8-a6b3-a5d1f428486c', 'ORD-370942', 0, 'valide', '2025-06-01T20:18:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2c84e8e4-365c-4de6-8b47-5646018a9aea', 'ORD-370943', 0, 'valide', '2025-06-01T20:20:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('82d933c5-4055-4273-8cef-2ca0042d8359', 'ORD-370944', 0, 'valide', '2025-06-02T07:32:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0f92150e-932c-44f4-9df7-0efbe5d9ce06', 'ORD-370945', 0, 'valide', '2025-06-02T07:33:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4e1ef882-5c8e-4d44-b824-26760f556361', 'ORD-380913', 0, 'valide', '2025-06-02T16:05:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28472610-f8e8-4a47-af9b-28791940fd43', 'ORD-380914', 0, 'valide', '2025-06-02T16:05:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c832bd08-ae10-4057-ad8f-201cedff3aa6', 'ORD-380915', 0, 'valide', '2025-06-03T09:10:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('44c0396c-9b80-47cc-ba50-5c41efbb5515', 'ORD-380916', 0, 'valide', '2025-06-03T09:11:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1538231c-d964-4d28-8ef6-a3628f209a31', 'ORD-380917', 0, 'valide', '2025-06-03T09:12:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('578bec49-7065-4acf-9ee6-2f0825e303e6', 'ORD-380918', 0, 'valide', '2025-06-03T09:13:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fe57470c-182c-42a7-a984-a66f35254785', 'ORD-390913', 0, 'valide', '2025-06-03T21:23:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d45a499c-f134-4a08-9c0f-5f0848a091cb', 'ORD-390914', 0, 'valide', '2025-06-03T21:24:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0b751a3-3dff-4102-9bbd-198cfffb6469', 'ORD-390915', 0, 'valide', '2025-06-03T21:34:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e43f2201-ddc7-4564-84fc-52a57be2f3f2', 'ORD-390916', 0, 'valide', '2025-06-03T21:35:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b52a4d09-5b0b-4fb8-b79a-917d2c51d045', 'ORD-390917', 0, 'valide', '2025-06-03T21:36:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71be81ff-4807-4513-bf95-0a613d0b7cba', 'ORD-390918', 0, 'valide', '2025-06-03T21:37:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e72cbb2d-18ba-413e-9db0-349544a27048', 'ORD-390919', 0, 'valide', '2025-06-03T23:20:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b1632dd-cf34-4fb8-8506-437c161265bb', 'ORD-390920', 0, 'valide', '2025-06-03T23:22:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('41621691-f7de-47a5-9158-dc2334277c2a', 'ORD-390921', 0, 'valide', '2025-06-04T17:39:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8e5c28bc-1c2a-4831-87d8-fce909395836', 'ORD-400913', 0, 'valide', '2025-06-05T15:53:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9e9d17a5-20b8-44c2-a41c-a688caf156a6', 'ORD-400914', 0, 'valide', '2025-06-05T15:54:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f0561cde-3405-4ac3-90fd-f0b0f5380070', 'ORD-410913', 0, 'valide', '2025-06-07T13:32:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('34d152f4-1f1e-47e3-85f5-6dadfcf87046', 'ORD-410914', 0, 'valide', '2025-06-07T13:33:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3fb4b204-47ab-41cc-bbad-89b5ac3918b8', 'ORD-410915', 0, 'valide', '2025-06-07T13:34:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('26bb8478-db40-48fa-a518-f03a59b1dee2', 'ORD-410916', 0, 'valide', '2025-06-07T13:34:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1fe1f4e1-1760-44a7-bda1-13b3fdcbbcd6', 'ORD-410917', 0, 'valide', '2025-06-07T13:35:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ab2ba611-4b0f-4d4c-8987-e77e9ad07bcf', 'ORD-410918', 0, 'valide', '2025-06-07T13:36:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e4edf7a-118e-4b59-83d0-d066284b9ae6', 'ORD-410919', 0, 'valide', '2025-06-07T13:39:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96c7f12c-f3e2-4289-8e5b-3523f3d15ed1', 'ORD-410920', 0, 'valide', '2025-06-07T13:42:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c3719730-19fd-43dd-be2c-5ad1954eb5ce', 'ORD-410921', 0, 'valide', '2025-06-07T13:43:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8f382a3f-f8b7-481a-ae25-354f61767313', 'ORD-410922', 0, 'valide', '2025-06-07T15:36:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9d7fc090-2524-4f33-b775-8a7bea12605d', 'ORD-410923', 0, 'valide', '2025-06-07T15:38:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d51ffb0d-95c1-4d84-92b7-0bd4abf9504a', 'ORD-410924', 0, 'valide', '2025-06-07T16:17:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c6737d9a-c4b7-46e9-a774-c71303bf809c', 'ORD-410925', 0, 'valide', '2025-06-07T16:19:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('82e42a92-52e4-40e4-9903-ebfd3c754fc4', 'ORD-410926', 0, 'valide', '2025-06-07T16:20:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('31ee118b-4c6e-4456-b59d-3b08c46834af', 'ORD-410927', 0, 'valide', '2025-06-07T16:22:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('659bc82f-fe24-4d36-a556-c10849a34526', 'ORD-410928', 0, 'valide', '2025-06-07T16:23:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2184d913-f90d-4cdc-86bf-0e4a8e0f634e', 'ORD-410929', 0, 'valide', '2025-06-08T20:57:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e622b2c6-10d0-4601-9a48-f71116c6e280', 'ORD-410930', 0, 'valide', '2025-06-08T20:58:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6183a0b1-209f-4f9e-b428-b43474640ce9', 'ORD-410931', 0, 'valide', '2025-06-10T18:02:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('39359716-44f7-4f1a-979f-b7d727f7fcf3', 'ORD-410932', 0, 'valide', '2025-06-10T22:34:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37380175-6441-4b3e-bc86-ebbee2e927be', 'ORD-410933', 0, 'valide', '2025-06-12T16:02:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c055067b-546e-4d2c-81d1-a6a4074bded9', 'ORD-410934', 0, 'valide', '2025-06-12T16:03:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('465e5ced-af09-48a9-8821-959e24c7ba5f', 'ORD-410935', 0, 'valide', '2025-06-12T16:10:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2f52e18-c174-4a02-99e4-9982f0cca9b3', 'ORD-410936', 0, 'valide', '2025-06-12T16:26:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('04cce04c-c318-409c-b9a1-ff4205fc0d48', 'ORD-410937', 0, 'valide', '2025-06-12T16:36:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b4d9fbf-820a-4879-ac94-d032d22b1147', 'ORD-410938', 0, 'valide', '2025-06-12T16:38:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('311602c7-59b1-48ff-9a26-c96bde867cee', 'ORD-410939', 0, 'valide', '2025-06-12T16:39:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4123cf5f-dad3-45d3-b12b-a73a278d1320', 'ORD-410940', 0, 'valide', '2025-06-12T16:40:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c016bd5-a926-4559-8b89-9d18ebcd27d7', 'ORD-410941', 0, 'valide', '2025-06-12T16:40:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7c8e86fd-ecbc-463f-84b2-29965d0abb5d', 'ORD-410942', 0, 'valide', '2025-06-13T07:59:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a66404b6-b8ed-4819-9dc3-70909fbe1bef', 'ORD-410943', 0, 'valide', '2025-06-13T08:04:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a44a0da-90a6-464e-8b92-ef0a3ff6ba3b', 'ORD-410944', 0, 'valide', '2025-06-13T08:05:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e12e2248-6b10-403e-ab97-6057940e430e', 'ORD-410945', 0, 'valide', '2025-06-13T08:13:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16e43531-cd53-4674-84be-a656903facae', 'ORD-410946', 0, 'valide', '2025-06-13T08:29:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f302c4c3-77f7-4a6a-a693-3e645a2ce1e9', 'ORD-410947', 0, 'valide', '2025-06-13T08:32:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3e20579a-6fe1-4813-ad88-95e5e3e331d0', 'ORD-410948', 0, 'valide', '2025-06-13T08:33:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('79f6ee4e-a465-4b5a-9735-1692a9828854', 'ORD-410949', 0, 'valide', '2025-06-15T12:58:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('df281b24-5ab7-43d0-90b3-7517e760c994', 'ORD-410950', 0, 'valide', '2025-06-15T12:59:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('36c1dbfa-cc36-4c78-8c4a-8d7badc51ed3', 'ORD-410951', 0, 'valide', '2025-06-15T16:07:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aeba95c7-4cb5-4295-98c0-c0ce83577798', 'ORD-410952', 0, 'valide', '2025-06-15T16:09:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9eda935c-0d1d-43a0-bd22-677b659e76fc', 'ORD-410953', 0, 'valide', '2025-06-15T16:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fa9b2ffa-fbbb-474c-aa44-b126c325dd7e', 'ORD-410954', 0, 'valide', '2025-06-15T16:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('693cec8a-f4e6-4a57-bf76-f87ea8cf1580', 'ORD-410955', 0, 'valide', '2025-06-15T16:13:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('60793622-26ad-4846-9bff-3ba63693bf05', 'ORD-410956', 0, 'valide', '2025-06-15T16:17:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('acddae5c-8865-4c6d-bce0-4dcd42b8b464', 'ORD-410957', 0, 'valide', '2025-06-15T16:18:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b96b43f-2781-4e54-ad7f-da7590b2ab68', 'ORD-410958', 0, 'valide', '2025-06-15T16:20:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3517f643-c47b-4de6-9ecc-6f3820731a3d', 'ORD-410959', 0, 'valide', '2025-06-15T16:21:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6558d4f1-ec98-402e-b9fa-8646a9dd6bab', 'ORD-410960', 0, 'valide', '2025-06-15T18:34:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('632473fa-64fa-4886-a0bf-e721ec4fd9e5', 'ORD-410961', 0, 'valide', '2025-06-15T18:36:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('69b24a63-9d84-447e-8e01-66f741635b0d', 'ORD-410962', 0, 'valide', '2025-06-15T18:37:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a1f4b95-1f3c-4fc2-99f9-6392dba73dce', 'ORD-410963', 0, 'valide', '2025-06-16T12:09:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9bf0f555-2854-4756-ba41-afd1e3fed6ef', 'ORD-410964', 0, 'valide', '2025-06-16T17:01:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('22431512-c9f4-45f6-bfef-b378d3189fc7', 'ORD-410965', 0, 'valide', '2025-06-17T10:06:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2fe6f836-42ee-40e0-9fde-d4ae2665e33d', 'ORD-410966', 0, 'valide', '2025-06-17T16:55:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c73f7b80-237a-4b55-875a-cb91e73f44b9', 'ORD-410967', 0, 'valide', '2025-06-17T16:58:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2f48c27a-1cfd-4914-a7fd-66c33f23b68e', 'ORD-410968', 0, 'valide', '2025-06-17T17:04:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37c46da3-f38f-4173-8d31-8b221a3540a6', 'ORD-410969', 0, 'valide', '2025-06-18T07:33:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5b2b9f80-45a4-480a-ac41-b6f0b55b324f', 'ORD-410970', 0, 'valide', '2025-06-18T08:09:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fef2ae75-dba9-4bde-8284-da4d67d946cb', 'ORD-410971', 0, 'valide', '2025-06-18T08:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('976b0506-a5fd-42d8-9599-8983fc532028', 'ORD-410972', 0, 'valide', '2025-06-18T14:21:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c5eaeac9-c78f-49cb-96d1-d810ec8db1cf', 'ORD-410973', 0, 'valide', '2025-06-19T08:04:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('81c0bcf2-024b-457a-8881-6ca51843d4d2', 'ORD-410974', 0, 'valide', '2025-06-19T14:41:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9c871866-2b5b-4b61-950e-a5b9888964e1', 'ORD-410975', 0, 'valide', '2025-06-20T08:21:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59bf1ad1-fce5-46af-a7c5-1d49092736bf', 'ORD-410976', 0, 'valide', '2025-06-21T20:06:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e65f0bb4-f5ad-4045-bc67-457fdde529d0', 'ORD-410977', 0, 'valide', '2025-06-21T20:06:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('773c2067-f486-4707-8101-929f32a22bd4', 'ORD-410978', 0, 'valide', '2025-06-21T20:06:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1955045f-34b9-41b1-b022-778d617c21c9', 'ORD-410979', 0, 'valide', '2025-06-21T20:06:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('48d41fb8-715b-4693-9e66-0fb8d074b83d', 'ORD-410980', 0, 'valide', '2025-06-21T20:08:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7f339ccb-2e18-463c-ab29-03a604634f17', 'ORD-410981', 0, 'valide', '2025-06-21T20:09:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ba0eea26-de2f-4e47-a07f-811fe7d1ef16', 'ORD-410982', 0, 'valide', '2025-06-21T20:11:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('487f45e2-1daa-4cec-9b7b-37ed18e15556', 'ORD-410983', 0, 'valide', '2025-06-22T22:34:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('438d4b14-4254-4a7f-a494-1ef0b8ffe1e6', 'ORD-410984', 0, 'valide', '2025-06-22T22:41:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb0d04aa-cfbe-4155-a865-cd875c408047', 'ORD-410985', 0, 'valide', '2025-06-22T22:45:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ee99068a-4baa-451d-8562-7f2cbc82e8fa', 'ORD-410986', 0, 'valide', '2025-06-22T22:46:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('80bfca96-6b04-4aa8-970a-9caacb23588e', 'ORD-410987', 0, 'valide', '2025-06-23T16:44:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f0a9b38-6446-4c1e-8534-4cb5a25ce2de', 'ORD-410988', 0, 'valide', '2025-06-23T16:44:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('32310df1-8650-4a0d-ad4f-953ac982f302', 'ORD-410989', 0, 'valide', '2025-06-23T16:46:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('295416a1-2dc7-43df-909f-80967a2a3d1c', 'ORD-410990', 0, 'valide', '2025-06-23T16:50:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0761a166-bbf8-4939-b16b-c88811bbf0f2', 'ORD-410991', 0, 'valide', '2025-06-23T22:58:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('393efc74-2360-4e47-82d6-4fec3f838783', 'ORD-410992', 0, 'valide', '2025-06-23T22:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('69e76d2c-a57a-4835-a70a-9e8851824e29', 'ORD-410993', 0, 'valide', '2025-06-23T23:00:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8d8a3e4d-c0be-45d1-8e2a-1ea3ef19d023', 'ORD-410994', 0, 'valide', '2025-06-23T23:01:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('edafaaa5-873b-407a-8315-a2d9bcdeac35', 'ORD-410995', 0, 'valide', '2025-06-24T15:06:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('87438948-74c7-4652-ad39-7857a618fa8c', 'ORD-410996', 0, 'valide', '2025-06-24T15:09:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f4c73b23-7f17-4cbf-a8e2-620fd8eb2d8c', 'ORD-410997', 0, 'valide', '2025-06-25T08:08:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e04c969f-3339-44f5-9f4f-9d410f8dd680', 'ORD-410998', 0, 'valide', '2025-06-25T08:09:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e51f9c7f-3f93-421d-ba6d-8ec71e56fbe6', 'ORD-410999', 0, 'valide', '2025-06-25T13:43:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c240eeae-a419-41a7-a3fc-54401c6b3a02', 'ORD-411000', 0, 'valide', '2025-06-25T16:59:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('17d8b182-5378-4327-8563-9229beab4d06', 'ORD-411001', 0, 'valide', '2025-06-25T17:02:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('65e95b56-b4f9-4c24-938b-f303d1c76ed2', 'ORD-411002', 0, 'valide', '2025-06-26T08:14:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78aefaa1-0abe-490f-9e47-aecae270763b', 'ORD-411003', 0, 'valide', '2025-06-26T08:15:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('377af684-291f-4768-b2b0-36dbe6b0a8d6', 'ORD-411004', 0, 'valide', '2025-06-26T08:16:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e71919e9-7d0d-4118-b10c-b9163a0a85dd', 'ORD-411005', 0, 'valide', '2025-06-26T08:18:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b37bc7e-aa59-4a61-9dca-7f0192842227', 'ORD-411006', 0, 'valide', '2025-06-27T08:50:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bdf64a5d-edc0-4513-a44a-ab60d033bb8d', 'ORD-411007', 0, 'valide', '2025-06-27T10:09:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('661afda7-a4db-4676-8427-f64521ad0938', 'ORD-411008', 0, 'valide', '2025-06-27T11:06:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('01239fc2-f333-4773-a2d6-dff632928d46', 'ORD-411009', 0, 'valide', '2025-06-27T11:07:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('55ff43a3-6151-443c-997d-4ddb2c9ec6d3', 'ORD-411010', 0, 'valide', '2025-06-27T11:07:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7411bf3e-a9e7-4461-9b61-afc5866f0be5', 'ORD-411011', 0, 'valide', '2025-06-27T11:08:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('579558c3-e4a1-4a13-9d4d-f8af39c8d830', 'ORD-411012', 0, 'valide', '2025-06-27T12:39:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bb6494dd-4fef-4096-9d49-58ec65f56d46', 'ORD-411013', 0, 'valide', '2025-06-27T12:40:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('754d05b8-9655-443e-8dea-867ca0a3d664', 'ORD-411014', 0, 'valide', '2025-06-27T12:41:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a0f890e9-9dcc-49ef-9a09-f6f2845a7ac0', 'ORD-411015', 0, 'valide', '2025-06-27T12:42:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('305dd47a-b60b-4dc0-8b02-2d9218b98b55', 'ORD-411016', 0, 'valide', '2025-06-27T15:03:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c8830bdc-28a6-42cd-81df-6346649192b6', 'ORD-411017', 0, 'valide', '2025-06-27T17:52:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f29fbd1a-8095-4d58-b16a-69852c8afcdd', 'ORD-411018', 0, 'valide', '2025-06-27T17:53:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c9295ce-2707-4be7-9665-0d14c2d46ca5', 'ORD-411019', 0, 'valide', '2025-06-27T17:54:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8186a008-5333-44fd-8d15-7c09c9344034', 'ORD-411020', 0, 'valide', '2025-06-28T11:41:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3c6b13bd-c1da-4769-ad53-f5adf0a6f77c', 'ORD-411021', 0, 'valide', '2025-06-28T11:41:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b0bfd6be-9ede-46dc-a077-5a1f0a108300', 'ORD-411022', 0, 'valide', '2025-06-28T11:42:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c05f505a-c847-45b6-a27c-c9833e94b8ba', 'ORD-411023', 0, 'valide', '2025-06-28T11:43:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aad0bd43-4c53-4cf0-aede-e21e9cfa597e', 'ORD-411024', 0, 'valide', '2025-06-28T11:44:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('881b3fd1-39b1-46d7-9d4b-331693ac4fa1', 'ORD-411025', 0, 'valide', '2025-06-29T22:21:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0f4bf80-2ba5-40f5-ac59-1e5b698b93b7', 'ORD-411026', 0, 'valide', '2025-06-29T22:21:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('940e7e27-c9c3-45a9-95b5-bf1bd1d38146', 'ORD-420966', 0, 'valide', '2025-07-01T08:48:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a61ab29f-f9d0-4530-af8a-e8b14341c404', 'ORD-420967', 0, 'valide', '2025-07-01T08:53:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2295570b-487c-4c3c-8cd4-2373057e599a', 'ORD-420968', 0, 'valide', '2025-07-01T08:54:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('882e7327-b33c-4433-95b6-65eb0876639d', 'ORD-420969', 0, 'valide', '2025-07-01T09:00:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('53b301a2-bf84-4e83-b36e-bb40f5176946', 'ORD-420970', 0, 'valide', '2025-07-01T09:02:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8565dfe2-d811-41aa-a914-9e81ee7a9184', 'ORD-420971', 0, 'valide', '2025-07-01T09:04:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ffc2b1b7-c8aa-4b8c-8853-7fe5278394df', 'ORD-420972', 0, 'valide', '2025-07-01T09:05:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c3c5c650-4bab-452d-9329-fa8d43e525cb', 'ORD-420973', 0, 'valide', '2025-07-01T09:24:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1ade95c3-18f6-44e6-98b0-7e561431d0e1', 'ORD-420974', 0, 'valide', '2025-07-01T09:25:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('06a9a6c2-6d30-49b9-adf2-cc5fd3b45289', 'ORD-420975', 0, 'valide', '2025-07-01T09:31:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('33256707-8593-4c18-9876-e962dfd3dee6', 'ORD-420976', 0, 'valide', '2025-07-01T18:10:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('271d1eba-3197-46a2-a1fb-362808aaf893', 'ORD-420977', 0, 'valide', '2025-07-01T18:11:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('77029cb5-751a-47d2-a264-4150dbb10c3d', 'ORD-420978', 0, 'valide', '2025-07-01T18:13:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5faaf1c8-4dd4-499f-8892-d989248d40da', 'ORD-420979', 0, 'valide', '2025-07-01T18:15:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('26ecabf2-f4d4-473b-9898-35f4a849afef', 'ORD-420980', 0, 'valide', '2025-07-02T12:13:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59b813cf-ce60-43ba-8d35-033b305be347', 'ORD-420981', 0, 'valide', '2025-07-02T12:13:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5519b168-fc18-41a2-b42d-3fe5e1f9f5a4', 'ORD-420982', 0, 'valide', '2025-07-02T12:16:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8993ed06-37a7-4d1a-b13e-a0b4291a796c', 'ORD-420983', 0, 'valide', '2025-07-02T12:17:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2fb65c89-2cfa-4354-9d13-36f8e501e8a8', 'ORD-420984', 0, 'valide', '2025-07-02T18:45:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6816c8f9-5411-4030-9855-9b7aa85db765', 'ORD-420985', 0, 'valide', '2025-07-02T18:46:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a0cbad8-cca3-4714-9e09-58b9d6af315b', 'ORD-420986', 0, 'valide', '2025-07-02T18:46:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0baeb95-4ac6-4b9f-b918-d7e822747cad', 'ORD-420987', 0, 'valide', '2025-07-02T18:47:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c72a15af-b6f0-4453-879b-c59f9ca33bb0', 'ORD-420988', 0, 'valide', '2025-07-02T18:48:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2e893327-a6c2-4991-8d25-4558d9298aea', 'ORD-420989', 0, 'valide', '2025-07-02T18:48:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('057c3681-b8d1-4b21-b0cd-6ee3dda96ab0', 'ORD-430976', 0, 'valide', '2025-07-04T11:28:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fd9dd4c8-633c-4bcf-ab30-29b079c22dfa', 'ORD-430977', 0, 'valide', '2025-07-05T20:15:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('67e7a3e8-b7ea-4f7a-952b-fe18bc42451f', 'ORD-430978', 0, 'valide', '2025-07-05T20:17:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d5e59f7a-ec60-4746-bf2a-84532dae6320', 'ORD-430979', 0, 'valide', '2025-07-05T20:18:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b6676278-d9ae-4213-b802-68992290bd7a', 'ORD-430980', 0, 'valide', '2025-07-05T20:30:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37c0ff74-a641-41a7-a860-f4f55c5378f0', 'ORD-430981', 0, 'valide', '2025-07-05T20:32:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d3836c37-81ce-4b36-9672-2cf5dd7cfb90', 'ORD-430982', 0, 'valide', '2025-07-05T20:34:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f0bf02cf-79ad-4716-8807-9e4627818f76', 'ORD-430983', 0, 'valide', '2025-07-05T20:36:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bb25984b-714e-4b2a-ae60-72211b2b6c97', 'ORD-430984', 0, 'valide', '2025-07-05T21:27:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40b37734-284a-4091-9e9a-776179986bdf', 'ORD-430985', 0, 'valide', '2025-07-06T22:22:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9b47bdfc-9d83-4a66-93fa-c8af2b42ccca', 'ORD-430986', 0, 'valide', '2025-07-06T22:23:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aacb63b4-e5a2-4024-ad08-8eed599b837a', 'ORD-430987', 0, 'valide', '2025-07-06T22:24:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64712d0f-8ebb-4369-a9cc-93f5dbe06c11', 'ORD-430988', 0, 'valide', '2025-07-06T22:31:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b7b11efd-9d60-401e-876e-14b918342dbc', 'ORD-430989', 0, 'valide', '2025-07-06T22:32:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('62923f2b-de17-4c15-bbf5-1ac4f9adcb3d', 'ORD-430990', 0, 'valide', '2025-07-06T22:33:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7cd08f5f-6fa5-410d-b8d1-bbd3a9642d2c', 'ORD-430991', 0, 'valide', '2025-07-06T22:34:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cd1eb88e-699d-4b50-807b-8cec8b3a75af', 'ORD-430992', 0, 'valide', '2025-07-06T22:44:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b44e67f3-d510-4fb5-aea3-59c0fd782ebf', 'ORD-430993', 0, 'valide', '2025-07-08T14:38:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('536d426b-a029-4137-8e65-6cded8cc75ad', 'ORD-430994', 0, 'valide', '2025-07-08T14:39:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5ad1453c-6430-46a3-bd69-50aad3ec1d7e', 'ORD-430995', 0, 'valide', '2025-07-08T14:39:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59029719-7101-45d7-9ade-5a56c4e7e77f', 'ORD-430996', 0, 'valide', '2025-07-08T14:40:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec950f29-abfb-44d5-b042-f396704efb36', 'ORD-430997', 0, 'valide', '2025-07-08T14:41:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6dee75b7-c936-4b56-800a-a2ef4e872774', 'ORD-430998', 0, 'valide', '2025-07-08T14:41:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f264121b-be57-4bf2-9fe4-15eef8afe13e', 'ORD-430999', 0, 'valide', '2025-07-08T14:42:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('adf197cc-ccdc-4453-b6c8-551fda958ba5', 'ORD-431000', 0, 'valide', '2025-07-08T14:47:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('665f54b9-2374-4cf7-babf-a06920c16b93', 'ORD-431001', 0, 'valide', '2025-07-08T14:47:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b68cd7b5-6534-4cc8-b674-7804643aa17d', 'ORD-431002', 0, 'valide', '2025-07-09T08:48:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9fba37d1-06e1-46f4-afd7-614eaec4032e', 'ORD-431003', 0, 'valide', '2025-07-09T08:53:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('011ffba2-284f-430b-a4f5-3fa5e4926f53', 'ORD-431004', 0, 'valide', '2025-07-10T02:16:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bdbb2f8a-8ae5-4a95-b1a8-ab7fb40b4bef', 'ORD-431005', 0, 'valide', '2025-07-10T02:17:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('caa3df3e-2926-4f79-be8e-2438aeb41550', 'ORD-431006', 0, 'valide', '2025-07-10T02:18:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96fd58c9-583f-47ba-8c3e-73c192a437b6', 'ORD-431007', 0, 'valide', '2025-07-10T16:31:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('347b70fc-d264-488d-a4f3-b92fb922c141', 'ORD-431008', 0, 'valide', '2025-07-10T16:32:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58b2690c-089c-40f3-a660-a466c34d8a88', 'ORD-431009', 0, 'valide', '2025-07-10T16:32:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2ed0d76a-2dba-4631-9235-0463b661e440', 'ORD-431010', 0, 'valide', '2025-07-10T16:33:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('097cb2f1-c7d8-438d-9fe6-4be00120e327', 'ORD-431011', 0, 'valide', '2025-07-10T16:34:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9188b0b1-0ea3-460d-94fc-3b43d104672a', 'ORD-431012', 0, 'valide', '2025-07-10T16:35:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b8cdacd-7b5f-4214-bfee-3a2bb2430611', 'ORD-431013', 0, 'valide', '2025-07-10T16:36:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7257aeeb-a37e-4fc6-ad47-70c0db8db67c', 'ORD-431014', 0, 'valide', '2025-07-10T19:36:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71dc6f06-89ca-4da3-baa0-b913ff96ddc7', 'ORD-431015', 0, 'valide', '2025-07-10T19:37:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ba7346f4-b639-44e4-bfd4-eb12a99039a9', 'ORD-431016', 0, 'valide', '2025-07-10T19:38:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ec6f94a7-6afd-4cab-a65f-d498a32eb0bb', 'ORD-431017', 0, 'valide', '2025-07-11T08:34:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('75780fa5-a6a3-4a6f-ae7d-4dd564a584e3', 'ORD-431018', 0, 'valide', '2025-07-14T14:24:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('10a2d45d-4de3-49ff-91a1-747a40a73f81', 'ORD-431019', 0, 'valide', '2025-07-14T14:25:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('503de0df-116e-4016-91ce-de27232e39a5', 'ORD-431020', 0, 'valide', '2025-07-14T14:26:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('06fcd3e7-800c-49fe-918f-90601f72704c', 'ORD-431021', 0, 'valide', '2025-07-14T14:27:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('22de73aa-13c4-4d24-98ce-07b1494b49e8', 'ORD-431022', 0, 'valide', '2025-07-14T14:28:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b902628-f7dd-47d8-a74c-8cf9b3413510', 'ORD-440977', 0, 'valide', '2025-07-16T10:10:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16973134-48c2-48c7-a75d-b3fb1454393d', 'ORD-440978', 0, 'valide', '2025-07-16T15:24:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a77e3338-a50a-4f93-a3a2-49e941c35eca', 'ORD-450977', 0, 'valide', '2025-07-18T09:17:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9b43a278-1326-4a3f-8af4-f256d61e7d2b', 'ORD-450978', 0, 'valide', '2025-07-18T09:18:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e06e973a-adba-475c-9c21-e5c184df2e40', 'ORD-450979', 0, 'valide', '2025-07-18T16:37:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bf994042-8135-44c9-aff9-b7f39091b8a0', 'ORD-450980', 0, 'valide', '2025-07-19T10:36:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dcc15327-05c7-4819-8294-9f77e54237af', 'ORD-450981', 0, 'valide', '2025-07-19T10:37:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ed7c69df-c784-4bb6-848d-8a7034b43b79', 'ORD-450982', 0, 'valide', '2025-07-19T10:38:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e3bdb62a-7e25-483e-a09a-730fc5e03807', 'ORD-450983', 0, 'valide', '2025-07-20T20:16:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('db040c64-6324-4e09-a0e4-0aaf5f3d148b', 'ORD-450984', 0, 'valide', '2025-07-22T21:14:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('561236e8-7acf-4e01-baf2-9027abb10c48', 'ORD-460979', 0, 'valide', '2025-07-23T08:12:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7776126d-9b45-4626-94d1-6a65e36ba5ed', 'ORD-460980', 0, 'valide', '2025-07-23T08:13:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0e2d6b72-6a56-4cee-9797-4740870bd98b', 'ORD-460981', 0, 'valide', '2025-07-23T08:14:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f1cee0d5-2339-4e5b-ac50-f6f537525800', 'ORD-460982', 0, 'valide', '2025-07-23T08:15:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8259f7a0-6f87-477f-9ec3-22eb63bf3566', 'ORD-460983', 0, 'valide', '2025-07-23T08:16:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c492a5ff-de6d-4385-98e4-99a1f4b2643d', 'ORD-460984', 0, 'valide', '2025-07-23T08:16:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('29f000b0-3d93-4578-bc6f-378478f163e4', 'ORD-460985', 0, 'valide', '2025-07-23T09:59:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9395a23f-142c-49de-8d5b-e60b33681e4c', 'ORD-460986', 0, 'valide', '2025-07-23T10:00:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bf086e5d-866b-4b37-997d-f1d1cd1ed01b', 'ORD-460987', 0, 'valide', '2025-07-23T10:01:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7f015b9-a5fc-436d-84e4-3df9c917160d', 'ORD-460988', 0, 'valide', '2025-07-23T10:02:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('76f12804-02f6-4c17-9ab1-ad36576d860e', 'ORD-460989', 0, 'valide', '2025-07-25T09:01:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0e9b226e-f054-428e-8d71-11da1b55bb09', 'ORD-460990', 0, 'valide', '2025-07-25T09:02:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b4c52eb-0066-4213-99eb-76739520602c', 'ORD-460991', 0, 'valide', '2025-07-25T09:03:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a52db172-5483-4c48-8415-911f346ad928', 'ORD-460992', 0, 'valide', '2025-07-25T09:04:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0da19808-bbfd-4f7b-bb8d-8bf2182045f3', 'ORD-460993', 0, 'valide', '2025-07-25T09:05:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a4407b6a-4587-4431-a0b3-63008109749a', 'ORD-460994', 0, 'brouillon', '2025-07-28T22:08:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e0dc2fa0-7f9a-4ca2-a3be-61bed37d0ed6', 'ORD-460995', 0, 'valide', '2025-07-28T22:10:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00228263-a782-4078-993c-50a01c66000e', 'ORD-460996', 0, 'valide', '2025-07-28T22:11:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7934a95d-0a07-4052-b8d2-14cc1d0006cb', 'ORD-460997', 0, 'valide', '2025-07-28T22:13:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ed27fa9b-c954-441d-b878-05c5265a917b', 'ORD-460998', 0, 'valide', '2025-07-28T22:20:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('754bf9b3-1115-4069-8958-c726acb0d38d', 'ORD-460999', 0, 'valide', '2025-07-28T22:22:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('864939dd-955d-4bfe-87f1-374ce1da6d3b', 'ORD-461000', 0, 'valide', '2025-07-28T22:24:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58716185-c442-46c5-bf73-d78373f705e6', 'ORD-461001', 0, 'valide', '2025-07-28T22:25:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c7a703dc-7884-475e-bf61-dba9aa619bf2', 'ORD-461002', 0, 'valide', '2025-07-28T22:29:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f195b90-dbe6-4622-bf2e-6c030e87166f', 'ORD-461003', 0, 'valide', '2025-07-28T22:30:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1e1c95d2-f1e2-4fd1-bd46-35d129dd9eb7', 'ORD-461004', 0, 'valide', '2025-07-28T22:31:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('809daeae-b75a-4dd1-a130-f3c8d0b7d32d', 'ORD-461005', 0, 'valide', '2025-07-28T22:33:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('80d21113-226c-40b1-ac80-5d84b916b9ad', 'ORD-461006', 0, 'valide', '2025-07-28T22:37:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('448919c9-1ab6-4467-8d7c-07d54b903511', 'ORD-461007', 0, 'valide', '2025-07-28T22:38:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8e38623-6df0-4c17-bc88-e545a5abd23c', 'ORD-461008', 0, 'valide', '2025-07-28T22:39:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7ae679b1-00db-49ca-b7f8-a3f24e1d8d9d', 'ORD-461009', 0, 'valide', '2025-07-28T22:40:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aaec9614-9138-483a-8349-a9223968300d', 'ORD-461010', 0, 'valide', '2025-07-28T22:43:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a3316e0e-3eb3-41ee-8fec-294aeb824bc1', 'ORD-461011', 0, 'valide', '2025-07-28T22:43:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2fe34b12-f161-40a5-8313-4190a9c94b4f', 'ORD-461012', 0, 'valide', '2025-07-28T22:46:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b63b4634-6de9-403b-a3ee-b946ad84d931', 'ORD-461013', 0, 'valide', '2025-07-28T22:48:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7cb74508-1265-4bbd-9738-862064532cd2', 'ORD-461014', 0, 'valide', '2025-07-28T23:19:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('43d22edd-7877-4329-ba8e-aa28e8a07d1b', 'ORD-461015', 0, 'valide', '2025-07-28T23:21:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('75fdcd71-db14-4ab8-82e5-198dba64851c', 'ORD-461016', 0, 'valide', '2025-07-28T23:22:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1390166f-2cca-46f8-b51a-04f520cf420d', 'ORD-461017', 0, 'valide', '2025-07-28T23:26:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9b84c5b9-ea45-43b7-9f1b-45bf2650878d', 'ORD-461018', 0, 'valide', '2025-07-28T23:28:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4660b3bf-5bab-4f47-b0b2-69025eb78ab1', 'ORD-461019', 0, 'valide', '2025-07-30T09:15:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fefe338e-f9cb-4665-b9a7-ddc60051631c', 'ORD-461020', 0, 'valide', '2025-07-30T09:16:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('334c1dbf-8db6-4706-a503-9a2797a02424', 'ORD-461021', 0, 'valide', '2025-07-30T09:17:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e9120959-a2a6-47a8-b0e1-808e4d351004', 'ORD-461022', 0, 'valide', '2025-07-30T09:22:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('95bbe219-fd0e-4d40-9cec-5a3704220f32', 'ORD-461023', 0, 'valide', '2025-07-30T09:23:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7f2ee75d-f01e-4f4a-a0c2-b1ac0b66f28a', 'ORD-461024', 0, 'valide', '2025-07-30T09:24:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9cbd53c1-2e97-4dfe-8985-603758e43578', 'ORD-461025', 0, 'valide', '2025-07-30T09:39:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a34a0da-cb04-4abc-98af-91b3b8f4e94b', 'ORD-461026', 0, 'valide', '2025-07-30T09:40:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4e4f864b-ce4f-4ae3-87b9-bc8c5b10058e', 'ORD-461027', 0, 'valide', '2025-07-30T09:41:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('527f783a-be10-49dd-9fc1-49c02f7a18c6', 'ORD-461028', 0, 'valide', '2025-07-30T09:44:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('019fad47-8570-434f-ac29-1a86f0e94f12', 'ORD-461029', 0, 'valide', '2025-07-30T09:45:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00f3d9f3-94dc-40a5-8f4b-3674130e2b63', 'ORD-461030', 0, 'valide', '2025-07-30T10:00:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('24934585-a07a-44e5-bd89-16510a11252f', 'ORD-461031', 0, 'valide', '2025-07-30T10:53:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('19910ab4-22ef-4c9f-9972-f0705052ad07', 'ORD-461032', 0, 'valide', '2025-07-30T18:56:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fdec275e-b7f3-4018-80bb-1ab7043ac27c', 'ORD-461033', 0, 'valide', '2025-07-30T18:56:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('82a12d65-f022-4a53-8e2a-3826eace109c', 'ORD-461034', 0, 'valide', '2025-07-30T18:57:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0033109a-eac6-4026-a27f-fd14668c2420', 'ORD-470985', 0, 'valide', '2025-08-03T21:51:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f6cb6a83-2ccb-408d-9f5b-5d3bacc21177', 'ORD-470986', 0, 'valide', '2025-08-03T22:23:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cc7463dc-fb57-4aaf-a360-186a91153cda', 'ORD-470987', 0, 'valide', '2025-08-03T22:24:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85d0cd59-d9b8-44e3-8b24-008824979d82', 'ORD-470988', 0, 'valide', '2025-08-03T22:26:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('23c453ea-1186-42b1-8515-fc81e7a407e8', 'ORD-470989', 0, 'valide', '2025-08-03T22:27:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c79d8ae-7954-4c4f-b15d-bfbdbd64092e', 'ORD-470990', 0, 'valide', '2025-08-03T22:29:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f2521e9c-83ad-4371-8783-3e4f6c7b37b3', 'ORD-470991', 0, 'valide', '2025-08-03T22:30:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c0ed2360-11de-4205-9fa0-3640839c639d', 'ORD-470992', 0, 'valide', '2025-08-03T23:40:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3f1e7a93-1872-4c29-a823-9e1837d29280', 'ORD-470993', 0, 'valide', '2025-08-03T23:42:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('63b22deb-29b5-4179-9d68-d83cb8cc34ee', 'ORD-470994', 0, 'valide', '2025-08-03T23:43:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8151a231-378f-406c-aac5-e39ebd210174', 'ORD-470995', 0, 'valide', '2025-08-05T07:31:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3b927c82-0b91-4871-b89b-59fd809479b3', 'ORD-470996', 0, 'valide', '2025-08-05T07:33:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78436d75-0906-406a-9aca-bae519c09995', 'ORD-470997', 0, 'valide', '2025-08-05T07:34:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6c190505-e248-423c-aa3d-c6725e2e6e47', 'ORD-470998', 0, 'valide', '2025-08-07T18:52:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e83ccc09-7f32-4649-9664-21bb551cd6eb', 'ORD-470999', 0, 'valide', '2025-08-07T20:20:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c7528b2e-6323-4668-8508-e81e8261351c', 'ORD-471000', 0, 'valide', '2025-08-07T20:21:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1422b261-cc28-4111-ab13-e4106c293bfb', 'ORD-471001', 0, 'valide', '2025-08-07T20:22:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4ef1aa06-5785-4c02-a093-3f37600769e4', 'ORD-471002', 0, 'valide', '2025-08-07T20:27:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8ecbb1eb-e3e2-45ce-bb9f-32678ad5bcd8', 'ORD-471003', 0, 'valide', '2025-08-07T20:45:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c0f7d6b4-1dde-44fc-9453-2e9b3672e8ec', 'ORD-471004', 0, 'valide', '2025-08-07T20:54:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f8f6dae8-711f-4f5a-8c6c-565278aa7595', 'ORD-471005', 0, 'valide', '2025-08-07T20:55:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a4feb252-eb21-4e47-bd70-d4c1e94309d4', 'ORD-471006', 0, 'valide', '2025-08-07T20:57:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('98b11507-001f-415f-8f8f-7743477cc816', 'ORD-471007', 0, 'valide', '2025-08-07T21:43:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d8bf1f88-6b83-4bae-9868-f10c481aaa7d', 'ORD-471008', 0, 'valide', '2025-08-07T21:46:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a3ffc091-749d-4102-a720-47ef804d8975', 'ORD-471009', 0, 'valide', '2025-08-12T07:31:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f2dc471-0e68-4673-95bf-705334fb8485', 'ORD-471010', 0, 'valide', '2025-08-12T07:42:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6641e5d5-8d1d-458c-8190-f9d271a7928a', 'ORD-471011', 0, 'valide', '2025-08-12T18:12:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ed611a1d-d708-4293-b3a6-41b54e5cea5b', 'ORD-471012', 0, 'valide', '2025-08-12T18:14:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d8810f47-9460-4435-a041-c85b9b254bcc', 'ORD-471013', 0, 'valide', '2025-08-12T18:15:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7dd95e62-44ae-481b-8855-b7aa995767de', 'ORD-471014', 0, 'valide', '2025-08-12T18:25:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5ac7a3b6-5bc8-4ab8-beec-13cbd643968e', 'ORD-471015', 0, 'valide', '2025-08-12T18:26:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f09b467f-0871-477a-a65e-bdb847f76f2e', 'ORD-471016', 0, 'valide', '2025-08-13T09:59:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('901950e4-23d9-4fbf-8bb2-1fb7d13d4a38', 'ORD-471017', 0, 'valide', '2025-08-13T10:00:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('beb81364-eac7-42ef-bcdd-88d36b9a9561', 'ORD-471018', 0, 'valide', '2025-08-13T13:30:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dbe42b20-ad62-4210-8d45-5e7eb15c7c9d', 'ORD-471019', 0, 'valide', '2025-08-13T13:31:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b3aab47c-ff3a-442a-9227-edb16ccca31b', 'ORD-471020', 0, 'valide', '2025-08-13T13:33:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a38b093e-9430-48bf-93b5-133a3c39f183', 'ORD-471021', 0, 'valide', '2025-08-13T13:45:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3bb8ac02-4ae7-4f19-9a87-8db3610dfc09', 'ORD-471022', 0, 'valide', '2025-08-13T13:47:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('260c8775-4e6d-40e5-b6eb-baf453e6e084', 'ORD-471023', 0, 'valide', '2025-08-13T13:49:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0f86079d-a69f-4bd5-acb2-6c589a07976a', 'ORD-471024', 0, 'valide', '2025-08-13T13:54:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08dd56c2-3a50-4b00-8731-90c2686675c6', 'ORD-471025', 0, 'valide', '2025-08-13T13:55:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('23d374ba-3a0e-4c2c-bf83-40265d397277', 'ORD-471026', 0, 'valide', '2025-08-13T13:56:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e00e25cb-d5e8-48b8-88e9-09d93ebbea46', 'ORD-471027', 0, 'valide', '2025-08-13T13:58:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c6567a9-87e2-4497-9eff-c0ddc1981789', 'ORD-471028', 0, 'valide', '2025-08-13T14:33:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0ce58da9-73d6-4edc-a6dd-6f1bbe361ffe', 'ORD-471029', 0, 'valide', '2025-08-13T14:35:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('43906fb6-320f-4a6e-bf61-067f62486832', 'ORD-471030', 0, 'valide', '2025-08-13T14:42:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d7e1d41f-e54b-407a-8da7-a61804ba3d15', 'ORD-471031', 0, 'valide', '2025-08-14T10:32:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3199a0bd-e0c3-4c09-8ee5-7d892f29abc4', 'ORD-471032', 0, 'valide', '2025-08-14T10:42:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('956e375e-1908-4ade-97b6-929b48f35530', 'ORD-471033', 0, 'valide', '2025-08-14T10:43:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e6683424-fdca-4dc9-9446-2996b7c8c1af', 'ORD-471034', 0, 'valide', '2025-08-14T10:45:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('841611bf-6410-4a3d-9cdb-c2213f14dfb9', 'ORD-480985', 0, 'valide', '2025-08-16T10:16:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8f8b32c6-40f1-47c0-86b3-93e3cd53d2a6', 'ORD-480986', 0, 'valide', '2025-08-16T10:17:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3d161f8e-b291-474e-8cdf-998125e53a1d', 'ORD-480987', 0, 'valide', '2025-08-16T10:18:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4da0df96-310c-400a-9c67-27bc12f7d749', 'ORD-480988', 0, 'valide', '2025-08-16T10:20:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('563766f0-0289-426f-8f41-ca7821b9ac34', 'ORD-480989', 0, 'valide', '2025-08-16T10:22:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e843fb0-57c6-440c-bf76-96c28ba4e12e', 'ORD-480990', 0, 'valide', '2025-08-16T10:23:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('50914c48-bb09-433f-9145-c49fd6b6195e', 'ORD-480991', 0, 'valide', '2025-08-16T10:26:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('484ee0e1-02f4-4c16-be61-c704db7aa9cf', 'ORD-480992', 0, 'valide', '2025-08-16T10:27:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('70861b64-6bf4-4e1e-84d9-f402c0fe4a7b', 'ORD-480993', 0, 'valide', '2025-08-16T10:37:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3cb3778a-3cfe-46b3-b964-b4443a748667', 'ORD-480994', 0, 'valide', '2025-08-17T09:57:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59e70652-c26f-4aeb-9fe3-7941923ecb62', 'ORD-480995', 0, 'valide', '2025-08-18T13:30:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('32bde337-cc85-46a6-b599-322bcd43e863', 'ORD-480996', 0, 'valide', '2025-08-18T13:31:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d94a96b8-90e3-4650-b610-d6c343742649', 'ORD-490985', 0, 'valide', '2025-08-19T17:36:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d3ebc0a1-5569-4de2-92d2-5b5f010a793f', 'ORD-490986', 0, 'valide', '2025-08-19T17:38:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8d88e7d-fe67-41b6-afbd-11d1effabeee', 'ORD-490987', 0, 'valide', '2025-08-19T17:42:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c58c1e3-8203-40c1-a803-1558a169e1ac', 'ORD-490988', 0, 'valide', '2025-08-19T17:44:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e2bc0217-235b-4419-8290-b29bfeb82293', 'ORD-490989', 0, 'valide', '2025-08-19T17:44:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c19f9bb8-4b14-49ae-adae-e614c9c93ca2', 'ORD-490990', 0, 'valide', '2025-08-19T17:45:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('27fbbfb9-fd58-439a-995c-ee38d5891505', 'ORD-490991', 0, 'valide', '2025-08-19T17:54:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('214c5e2f-14e6-4f2f-9712-b5b446736861', 'ORD-490992', 0, 'valide', '2025-08-19T17:58:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c1f69953-7b5b-420d-86d4-c51cb1725fe7', 'ORD-490993', 0, 'valide', '2025-08-19T17:59:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4fb3158e-4307-47a4-a7b5-19a86cee8a8b', 'ORD-490994', 0, 'valide', '2025-08-19T18:00:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ddfb3151-39ce-4225-8c4b-93433b1beb45', 'ORD-490995', 0, 'valide', '2025-08-19T18:02:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b867cac-c491-460b-8a50-ec7e4035669b', 'ORD-490996', 0, 'valide', '2025-08-19T18:03:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e8eb20da-fa09-47ed-9b4a-d04e42ac53b3', 'ORD-490997', 0, 'brouillon', '2025-08-19T18:04:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('94d2d126-c2fa-42b4-8632-e49647b1df6c', 'ORD-490998', 0, 'valide', '2025-08-20T10:42:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3732a056-b5f8-4780-86bd-007edc311cb9', 'ORD-490999', 0, 'valide', '2025-08-20T11:32:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28ddc0c8-0fcc-4f82-9b4a-72621d3b9145', 'ORD-491000', 0, 'valide', '2025-08-20T11:33:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b0ee5aed-1709-4a5b-8d15-c6af878fa358', 'ORD-491001', 0, 'valide', '2025-08-20T11:34:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ed1c5c65-14fa-4690-8244-22c50bdb52ce', 'ORD-491002', 0, 'valide', '2025-08-20T11:39:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b24c1f17-6521-4e12-a779-a1826c936689', 'ORD-491003', 0, 'valide', '2025-08-20T11:40:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8eb48245-26f9-4981-a1c9-2829fe6f1e5e', 'ORD-491004', 0, 'valide', '2025-08-21T07:34:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a7a7d8fb-c946-4803-835f-2ca349f35977', 'ORD-491005', 0, 'valide', '2025-08-21T07:34:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('558644f9-981b-47df-81d2-9776734d4e7e', 'ORD-491006', 0, 'valide', '2025-08-21T07:35:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f3388442-b6a4-4cc1-b1ab-eb32f2daa15c', 'ORD-491007', 0, 'valide', '2025-08-21T07:37:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('769c6cd0-de40-4614-8db8-8e0b98bd3926', 'ORD-491008', 0, 'valide', '2025-08-21T07:37:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f002929a-5679-4b5b-a128-53b85b6f8b31', 'ORD-491009', 0, 'valide', '2025-08-21T07:38:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2aba9687-fe42-41e6-b4bf-de73eb981c7c', 'ORD-491010', 0, 'valide', '2025-08-21T07:47:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9537ab15-008b-40db-9afd-a3058c64f4a7', 'ORD-491011', 0, 'valide', '2025-08-21T11:00:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9289f73b-e878-43ae-8789-78a07bdbbbb0', 'ORD-491012', 0, 'valide', '2025-08-21T12:03:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('547fc642-4947-4a10-8cd8-feedb4585683', 'ORD-491013', 0, 'valide', '2025-08-24T08:53:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('63442f00-141b-4393-933a-9fdf43d81476', 'ORD-491014', 0, 'valide', '2025-08-24T08:55:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d4ca0cc9-37c6-489b-93ab-ff4bba4dd553', 'ORD-491015', 0, 'valide', '2025-08-24T09:00:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8230a114-e128-4da5-8be5-0f2aa2bca2b7', 'ORD-491016', 0, 'valide', '2025-08-24T09:03:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5eb9070a-25ac-4a41-887e-08d54b100d8c', 'ORD-491017', 0, 'valide', '2025-08-25T07:59:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('823c314a-59be-45ca-9406-ffd533a99fd0', 'ORD-491018', 0, 'valide', '2025-08-26T08:21:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b9098b7e-4853-4c68-8714-4d5d90b39b8c', 'ORD-491019', 0, 'valide', '2025-08-26T08:22:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e82857ce-acef-4318-b373-ce9a4dba44bb', 'ORD-491020', 0, 'valide', '2025-08-26T08:23:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('75c56dab-4eb6-49f6-ade8-fc7c22bc9b98', 'ORD-491021', 0, 'valide', '2025-08-26T08:24:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00123537-a60e-46ff-afc6-aa739ed01b45', 'ORD-491022', 0, 'valide', '2025-08-26T08:25:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ff26271a-270f-4f84-bf0a-3d6f800fb271', 'ORD-491023', 0, 'valide', '2025-08-26T08:25:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('92bfcd89-4690-43f9-9b86-8f82eab3f690', 'ORD-491024', 0, 'valide', '2025-08-26T08:26:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40dc84ae-af7e-4c3e-b2bd-55f7ddc1f759', 'ORD-491025', 0, 'valide', '2025-08-26T08:27:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6acc7b26-dfc1-4cdd-95d7-23570a9ba147', 'ORD-491026', 0, 'valide', '2025-08-26T08:29:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7ccd0bfa-44a4-43b5-ab28-acdcbba1f436', 'ORD-491027', 0, 'valide', '2025-08-26T08:36:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fcca5d77-caa8-4515-8520-c440c29bf6be', 'ORD-491028', 0, 'valide', '2025-08-26T08:39:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('76317702-d5a2-44bb-9b20-71566bc7157f', 'ORD-491029', 0, 'valide', '2025-08-26T08:55:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64ef5b29-b96c-4f54-91dc-a9e1a2b07138', 'ORD-491030', 0, 'valide', '2025-08-26T08:56:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0565c9b-84cb-49c5-9070-65032d785b85', 'ORD-491031', 0, 'valide', '2025-08-26T08:56:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('60d3391e-de5c-4d90-a700-ef6d94fdb67e', 'ORD-491032', 0, 'valide', '2025-08-26T08:57:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dcb326bf-da6d-4a63-86d7-f7b8318faf51', 'ORD-491033', 0, 'valide', '2025-08-26T18:03:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('12ce68ea-1936-43bc-9392-85e4d504019f', 'ORD-491034', 0, 'valide', '2025-08-27T07:54:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('42882898-b273-489a-b12a-113e2104cacb', 'ORD-491035', 0, 'valide', '2025-08-27T07:56:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('06553b97-d0a3-4179-8b62-f2f03c15f856', 'ORD-491036', 0, 'valide', '2025-08-27T07:57:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('50822f0c-a3d9-4b8d-b818-60ddd5a5917c', 'ORD-491037', 0, 'valide', '2025-08-27T07:58:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f8c0d185-25ca-4e21-bfb7-659ae6df832e', 'ORD-491038', 0, 'valide', '2025-08-27T07:59:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d5bdffed-3c9f-4ffb-8374-ce13db7d674a', 'ORD-491039', 0, 'valide', '2025-08-27T08:00:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7fe71387-e59b-422a-9bee-1082e06c1fd1', 'ORD-491040', 0, 'valide', '2025-08-27T08:00:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a93daecb-df72-402a-81bb-52e0d783ed5d', 'ORD-491041', 0, 'valide', '2025-08-27T08:01:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8d1c9c15-c63d-470f-a2c7-404a22e254eb', 'ORD-491042', 0, 'valide', '2025-08-27T08:03:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1870ea9d-03a9-45ea-9e29-53436e2110e0', 'ORD-491043', 0, 'valide', '2025-08-27T08:04:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16226c08-78fa-48c0-a1fd-040837cd04c3', 'ORD-491044', 0, 'valide', '2025-08-27T08:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0d01136a-c6cb-46e0-b7bc-bb319ce6b098', 'ORD-491045', 0, 'valide', '2025-08-27T08:15:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('52980d6e-6264-4363-b831-35e14b0ee8fa', 'ORD-491046', 0, 'valide', '2025-08-27T08:17:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d40229c1-4600-4ee6-8f3a-476af0c77bcd', 'ORD-491047', 0, 'valide', '2025-08-27T08:17:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6f4b6d5a-002b-4e13-adad-30ccdd17578d', 'ORD-491048', 0, 'valide', '2025-08-27T08:19:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8d85aaf6-3c68-46b4-b906-1b15676f5913', 'ORD-491049', 0, 'valide', '2025-08-27T17:33:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('77b75cac-2dc7-4614-9877-f95729065839', 'ORD-491050', 0, 'valide', '2025-08-27T17:35:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1fab036b-7ac5-4aa7-86d6-b5d7b788c50f', 'ORD-491051', 0, 'valide', '2025-08-27T17:37:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0cf8cbae-575d-4e8a-8be6-9589cd51a5fd', 'ORD-491052', 0, 'valide', '2025-08-27T17:38:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('01ab5ca8-80ad-4179-8a48-844d55e5010f', 'ORD-491053', 0, 'valide', '2025-08-27T17:39:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f273ed8f-7748-4876-981f-0ef56c8cc3d5', 'ORD-491054', 0, 'valide', '2025-08-27T17:40:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6826ce0f-e263-4052-a91e-aae5c6409b59', 'ORD-491055', 0, 'valide', '2025-08-27T17:41:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0644b3b5-203e-404b-b226-0726f9951064', 'ORD-491056', 0, 'valide', '2025-08-27T17:47:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('67f8fad2-977e-4670-8354-7f91888be1ab', 'ORD-491057', 0, 'valide', '2025-08-29T09:04:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c3e43745-fe1d-44c7-98e0-a8888fd97570', 'ORD-491058', 0, 'valide', '2025-08-29T09:04:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3a3f98ad-2082-4e80-9c39-185fa2633a2c', 'ORD-491059', 0, 'valide', '2025-08-29T09:05:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('933f18fe-47ef-4595-bcb0-e00d3177c38c', 'ORD-491060', 0, 'valide', '2025-08-29T09:06:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e0b5be9d-8603-4b3e-8b01-687c12453980', 'ORD-491061', 0, 'valide', '2025-08-29T09:11:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1256b7bb-bfb2-46e2-a6a2-5bbf2fb7d50c', 'ORD-491062', 0, 'valide', '2025-08-29T09:11:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6348d7d6-f825-4d26-940b-d9ebce526081', 'ORD-491063', 0, 'valide', '2025-08-29T09:16:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e676892-ad02-4bb3-badf-707184247939', 'ORD-491064', 0, 'valide', '2025-08-29T09:16:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ff6c3a38-e3d0-433a-99ea-adf2b1fbb4e3', 'ORD-491065', 0, 'valide', '2025-08-29T09:25:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9ef6d49c-0e57-4967-b99b-a718b2d797bf', 'ORD-491066', 0, 'valide', '2025-08-29T09:26:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f4db146c-f8cf-4fa2-b943-aa42f90f6e38', 'ORD-491067', 0, 'valide', '2025-08-29T09:27:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('542088e7-99d8-4f0b-9cb9-5d77bab8a37c', 'ORD-491068', 0, 'valide', '2025-08-29T09:27:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1df0ee11-04f1-4c84-bbc8-1267c74614ca', 'ORD-491069', 0, 'valide', '2025-08-31T14:32:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('850b591a-c0d8-4cc0-a685-d57f3a9047fc', 'ORD-491070', 0, 'valide', '2025-08-31T14:33:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('60145f31-86da-4e86-b3cc-71fe2eeb7d89', 'ORD-491071', 0, 'valide', '2025-08-31T18:56:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b8716d4d-1443-4b28-b6ae-2cfef4d0b970', 'ORD-491072', 0, 'valide', '2025-08-31T18:56:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c6cc9465-6a7a-406b-b24a-e25e44b7c1c3', 'ORD-491073', 0, 'valide', '2025-08-31T18:57:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4624b289-5dfb-43f2-ba86-f942b843c0cd', 'ORD-491074', 0, 'valide', '2025-08-31T18:58:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0c1a8724-27aa-40b5-bbcb-29882a66f8ce', 'ORD-491075', 0, 'valide', '2025-08-31T18:59:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b1a2e7a-390a-4cb5-8e95-ebc5b5b505c8', 'ORD-491076', 0, 'valide', '2025-08-31T19:00:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b40628e-6ade-4cd9-ab83-0a60593750e1', 'ORD-491077', 0, 'valide', '2025-08-31T19:01:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aef05203-b07a-4a63-ba26-a917314e0ebc', 'ORD-491078', 0, 'valide', '2025-08-31T19:03:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b121ebe1-19ab-4091-b690-2ec148c2ede3', 'ORD-491079', 0, 'valide', '2025-08-31T19:03:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a3d48ad-949f-4ac3-8a7e-f346d6bc1dff', 'ORD-491080', 0, 'valide', '2025-08-31T19:05:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('029269ea-3c7f-4e3b-a5ee-6205d6b7ca56', 'ORD-491081', 0, 'valide', '2025-08-31T19:06:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('84e7282f-4086-4a88-be84-0961666dde2d', 'ORD-491082', 0, 'valide', '2025-08-31T19:06:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('80445996-0083-47f7-86e3-51b45a5900f2', 'ORD-491083', 0, 'valide', '2025-08-31T20:19:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bfeeecb4-2285-4f8c-96a6-fafd11bc307a', 'ORD-491084', 0, 'valide', '2025-09-01T12:31:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59a272af-ee2c-4329-a4b5-fbd90841ce66', 'ORD-491085', 0, 'valide', '2025-09-01T12:32:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2709aca7-2a66-4d58-8ff0-e3820d879c57', 'ORD-491086', 0, 'valide', '2025-09-01T12:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85e5f864-fece-41d7-9810-c239dcc92d2e', 'ORD-491087', 0, 'valide', '2025-09-01T12:42:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4bf191f6-099b-41b7-94a2-93e4cad5dac4', 'ORD-491088', 0, 'valide', '2025-09-01T12:43:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a803170d-0009-4b95-b587-fa9ac34b824a', 'ORD-491089', 0, 'valide', '2025-09-01T12:44:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('afcfd403-7ea7-43b3-b537-0bf32063c9a2', 'ORD-491090', 0, 'valide', '2025-09-02T07:53:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2c79fd3c-a420-4ef1-b389-c20408c0231f', 'ORD-491091', 0, 'valide', '2025-09-05T07:16:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e88f5b0-0482-42e6-95fc-d9426c7cc67a', 'ORD-491092', 0, 'valide', '2025-09-05T07:18:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb140d40-df6a-449d-9c65-b05921a8e42e', 'ORD-491093', 0, 'valide', '2025-09-05T07:26:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9249411e-f5c1-4235-bdd2-32e834504e0d', 'ORD-491094', 0, 'valide', '2025-09-05T07:27:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('105f78f1-bb86-43ca-b5d2-ecb0ffe0eafd', 'ORD-491095', 0, 'valide', '2025-09-05T07:28:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('af150ef5-4a7e-4d1b-8680-63a190ca9cc9', 'ORD-491096', 0, 'valide', '2025-09-05T07:30:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d57ba1c7-d4a8-44c3-a5f1-851454aad55f', 'ORD-491097', 0, 'valide', '2025-09-05T07:31:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d165bec6-2706-4322-a28d-d08261698818', 'ORD-491098', 0, 'valide', '2025-09-05T07:32:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('157eddb0-d484-48b3-9066-d5d269257a02', 'ORD-491099', 0, 'valide', '2025-09-05T07:37:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('377f71ab-ee78-4a98-8ec7-029d19ce6d31', 'ORD-491100', 0, 'valide', '2025-09-08T19:10:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e9926a87-d908-441f-847b-34e8774a3db4', 'ORD-491101', 0, 'valide', '2025-09-09T09:58:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('179acea6-a424-449c-815c-7587315fe01e', 'ORD-491102', 0, 'valide', '2025-09-09T09:59:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a1288d31-cf87-466f-9651-b5a9829b54c4', 'ORD-491103', 0, 'valide', '2025-09-09T10:00:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('56a807b5-9d18-442d-a629-df415e36c667', 'ORD-491104', 0, 'valide', '2025-09-09T10:01:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('013b446c-14d8-4455-9151-dacf748f5e56', 'ORD-491105', 0, 'valide', '2025-09-09T10:03:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2e6e5021-e263-459c-a964-993d1a1d0f4b', 'ORD-491106', 0, 'valide', '2025-09-09T10:03:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e523795a-8882-42c3-8b0f-491ed05da546', 'ORD-491107', 0, 'valide', '2025-09-09T10:04:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('795a5df3-04f7-4e63-b7aa-c97f6efc93c3', 'ORD-491108', 0, 'valide', '2025-09-09T15:08:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d229784e-e380-4523-80db-d42ee2c6d2be', 'ORD-491109', 0, 'valide', '2025-09-09T15:10:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7f6c385c-0af4-443f-9399-31a700b13984', 'ORD-491110', 0, 'valide', '2025-09-09T15:12:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ceba723a-57fd-43aa-8a8d-08a97993d321', 'ORD-491111', 0, 'valide', '2025-09-09T15:16:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('175a8012-dae6-478d-ae13-124c88de5194', 'ORD-491112', 0, 'valide', '2025-09-09T22:12:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('43de9e09-1b1a-4d4f-a6b4-1fad39357079', 'ORD-491113', 0, 'valide', '2025-09-09T22:13:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('05d981b2-263e-4659-9930-40f9d1f556af', 'ORD-491114', 0, 'valide', '2025-09-10T19:58:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b57b1635-3a19-47dd-bdc8-fa35f29f732a', 'ORD-491115', 0, 'valide', '2025-09-11T16:34:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dfbb58ae-550a-4b58-b5a6-c96de969c7cc', 'ORD-491116', 0, 'valide', '2025-09-11T16:35:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66211423-5b1b-4d3f-8c93-5e7321fbd8de', 'ORD-491117', 0, 'valide', '2025-09-11T16:36:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b58a8cbb-68cf-4988-887d-5f7b9b944cad', 'ORD-491118', 0, 'valide', '2025-09-11T16:37:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f701a99d-fde3-48af-a7fa-098814ca6984', 'ORD-491119', 0, 'valide', '2025-09-15T11:41:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a9de8dfa-701d-45cd-a4bd-ddbc0ac6b72d', 'ORD-491120', 0, 'valide', '2025-09-17T08:54:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f18c444-2053-41b0-b1bc-88b745b0aeb7', 'ORD-491121', 0, 'valide', '2025-09-17T08:55:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('97204cc9-74c2-4859-a20c-f505084e57f7', 'ORD-491122', 0, 'valide', '2025-09-17T08:57:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6771c729-2e76-4dd4-a410-32f1b3f2cacd', 'ORD-491123', 0, 'valide', '2025-09-17T08:59:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f15c0342-9732-40cb-9350-26c4ca9372ed', 'ORD-491124', 0, 'valide', '2025-09-17T09:00:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('76eaecc2-915b-4762-8d51-ed650430289a', 'ORD-491125', 0, 'valide', '2025-09-17T09:03:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08f55bae-f704-4edc-8b36-acc0cd8778d4', 'ORD-491126', 0, 'valide', '2025-09-17T09:07:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('975267ec-ccda-4853-b4ad-3ead74777689', 'ORD-491127', 0, 'valide', '2025-09-17T09:21:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d1f31030-100f-46ba-8c75-36c3df21eaf4', 'ORD-491128', 0, 'valide', '2025-09-17T09:22:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f1169656-9921-4059-999f-db003baa6271', 'ORD-491129', 0, 'valide', '2025-09-17T09:58:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e4d8f5a6-e0a4-485c-a9ed-1e3e47f95645', 'ORD-491130', 0, 'valide', '2025-09-17T09:59:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b5f31692-317c-4250-beba-69d11c33b521', 'ORD-491131', 0, 'valide', '2025-09-17T10:00:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('76f84462-36cb-4730-a305-4b32c09a9fbe', 'ORD-491132', 0, 'valide', '2025-09-17T10:01:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('97e9e0df-d992-452c-8343-d89e126e0724', 'ORD-491133', 0, 'valide', '2025-09-17T10:01:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eabe2dd3-7412-4416-89be-d832273a1a0b', 'ORD-491134', 0, 'valide', '2025-09-17T10:02:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('68eba21b-72d1-4a8f-9be5-f5b7ccadcac6', 'ORD-491135', 0, 'valide', '2025-09-17T10:03:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c72f3f0-d13d-4204-9697-28b5b53018ad', 'ORD-491136', 0, 'valide', '2025-09-17T10:04:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('86f53a29-9d4b-461d-8962-0e2308dd4141', 'ORD-491137', 0, 'valide', '2025-09-17T10:14:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f9893604-c701-45f9-9cde-853cb9f77dc0', 'ORD-491138', 0, 'valide', '2025-09-17T10:18:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0f914e22-64de-42ef-9463-9d2b3e2e4d94', 'ORD-491139', 0, 'valide', '2025-09-18T09:15:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e3548768-cdfa-4e72-8edc-241726d219d1', 'ORD-491140', 0, 'valide', '2025-09-18T09:18:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bf26e965-d450-4a95-a4fd-dc4c15fa25ba', 'ORD-491141', 0, 'valide', '2025-09-18T09:21:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f5fad805-3940-435e-895c-9c5c3c09fb6a', 'ORD-491142', 0, 'valide', '2025-09-18T09:23:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f74734bc-fc89-43b6-b7f4-678513f4e684', 'ORD-491143', 0, 'valide', '2025-09-18T09:24:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('765b2a6f-e9b7-4141-9a12-eae298685502', 'ORD-491144', 0, 'valide', '2025-09-18T12:24:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ffe89ce0-0150-42a1-869c-65d0261233cc', 'ORD-491145', 0, 'valide', '2025-09-18T12:25:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f63e5da1-c506-4ea7-8ba3-e399be437ffd', 'ORD-491146', 0, 'valide', '2025-09-18T12:26:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('865609a1-c3a2-4f22-9b57-d19f644993fd', 'ORD-491147', 0, 'valide', '2025-09-18T12:27:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bb2c8e41-7a1f-4012-8db7-3ce6a3427ba2', 'ORD-491148', 0, 'valide', '2025-09-18T12:28:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('10038908-3551-440e-b510-a2d083142556', 'ORD-491149', 0, 'valide', '2025-09-18T12:29:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('336b3a93-1309-4998-afd1-dc30dbda0010', 'ORD-491150', 0, 'valide', '2025-09-18T12:30:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('17094ea3-6491-4823-851f-8b248ab825f7', 'ORD-491151', 0, 'valide', '2025-09-18T13:02:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a5051eac-b37e-422a-a688-be1b6238b354', 'ORD-491152', 0, 'valide', '2025-09-18T13:03:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d2611125-1857-494b-ab40-572da2470431', 'ORD-491153', 0, 'valide', '2025-09-18T13:04:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('26f0e63d-f81e-45b6-9edf-a625517f5560', 'ORD-491154', 0, 'valide', '2025-09-18T13:05:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8bbf7fb4-1e73-4cd6-ac86-4885522f4c1d', 'ORD-491155', 0, 'valide', '2025-09-18T13:06:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('417ca4ea-c6e5-48e5-9ab7-ca92d157f1cd', 'ORD-491156', 0, 'valide', '2025-09-18T13:06:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c2ade5ff-ca7a-4be1-bd15-2596feabaae1', 'ORD-491157', 0, 'valide', '2025-09-18T13:07:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0119ab40-106a-41b5-b025-507d0ec4e28b', 'ORD-491158', 0, 'valide', '2025-09-19T09:55:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('87035564-4fa3-4026-bb26-579cc0bcec00', 'ORD-491159', 0, 'valide', '2025-09-19T09:56:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('34e6d194-f3f0-458e-aa8e-9383ef54c41f', 'ORD-491160', 0, 'valide', '2025-09-19T09:58:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b0596080-088d-4a9b-873e-009775ec093b', 'ORD-491161', 0, 'valide', '2025-09-19T09:59:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9fcd3e00-8c3f-4e13-8915-ff6fb165a46a', 'ORD-491162', 0, 'valide', '2025-09-19T10:01:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d295d63f-246d-4951-a480-1ebad924c6df', 'ORD-491163', 0, 'valide', '2025-09-19T10:04:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('54fcdb43-6ec9-41ad-880e-7e18b2fb8095', 'ORD-491164', 0, 'valide', '2025-09-21T10:41:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96b07ff3-03fd-46c3-85ce-d771c6661ad8', 'ORD-491165', 0, 'valide', '2025-09-21T10:42:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('822d7014-9526-43a4-8b1d-821d4a587dcd', 'ORD-491166', 0, 'valide', '2025-09-21T11:06:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0d08b4c7-4b29-4610-a7a3-1624dfa2c128', 'ORD-491167', 0, 'valide', '2025-09-21T11:06:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('658d9cad-a0da-4b16-a501-cd59a19975a9', 'ORD-491168', 0, 'valide', '2025-09-21T11:08:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9c1af908-7bfa-48cb-b930-4b28dd7638be', 'ORD-491169', 0, 'valide', '2025-09-22T08:38:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7d4521c7-9192-41f7-ab3c-9ae7c6bafdf1', 'ORD-491170', 0, 'valide', '2025-09-22T08:38:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c72f13be-fb9d-4b71-9935-e62538c1da87', 'ORD-491171', 0, 'valide', '2025-09-22T08:39:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dceb5dc0-954c-4181-be49-25fead0d236b', 'ORD-491172', 0, 'valide', '2025-09-22T11:12:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f128d1e7-9c5e-44b7-ab9e-4109af3128ad', 'ORD-491173', 0, 'valide', '2025-09-22T11:14:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('342bd2d3-84c5-428b-8ac8-fcc9f75937cf', 'ORD-491174', 0, 'valide', '2025-09-22T11:17:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ac9733d6-8a59-4de9-bd78-4487846af0fa', 'ORD-491175', 0, 'valide', '2025-09-22T11:17:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dc5319f1-0885-4da8-bb7c-9da06f163b68', 'ORD-491176', 0, 'valide', '2025-09-22T11:29:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c1ab2d9c-2327-4ce5-898f-43a6538cfa76', 'ORD-491177', 0, 'valide', '2025-09-22T11:30:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c58d4e68-e0af-40df-b710-1431e865a1c8', 'ORD-491178', 0, 'valide', '2025-09-22T11:31:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dfb5c54b-bce0-4e71-9ed8-7928f9d9b8ee', 'ORD-491179', 0, 'valide', '2025-09-24T09:34:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3d3674f7-e705-4a62-bd00-ed79e6541136', 'ORD-491180', 0, 'valide', '2025-09-24T09:35:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b8b757b2-fc41-4fc9-b715-c9fc69329c19', 'ORD-491181', 0, 'valide', '2025-09-24T09:37:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f1c06577-79f0-49c2-9c86-0ebe3c8c6293', 'ORD-491182', 0, 'valide', '2025-09-24T09:38:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fee623da-46b9-4718-bcde-4156c9c4046f', 'ORD-491183', 0, 'valide', '2025-09-24T09:41:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('04d102a0-65ea-46bb-905f-8e2bf6cba466', 'ORD-491184', 0, 'valide', '2025-09-24T09:50:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3f2aa094-39b5-4741-b80a-791f1e6530a4', 'ORD-491185', 0, 'valide', '2025-09-24T09:50:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5da8fffb-fb29-4df8-ac6f-2e9e04020b26', 'ORD-491186', 0, 'valide', '2025-09-24T09:52:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ef7b5e7b-a936-4800-8b44-cc381e663c50', 'ORD-491187', 0, 'valide', '2025-09-24T09:53:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('092d16b4-8259-4379-994d-8273f1ce2fb6', 'ORD-491188', 0, 'valide', '2025-09-24T09:55:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78a39a2e-628f-4e39-b74e-80442b5c6a7d', 'ORD-491189', 0, 'valide', '2025-09-24T10:10:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4a0b5d3c-836a-48e2-b7c0-19e32ab88ef4', 'ORD-491190', 0, 'valide', '2025-09-24T10:11:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e5140ccf-5a24-43ab-b6d0-6882eeb2e00a', 'ORD-491191', 0, 'valide', '2025-09-24T10:13:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e2c5b815-abbd-4192-82f2-66262a251c0c', 'ORD-491192', 0, 'valide', '2025-09-24T10:13:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16f51268-6c54-4a01-8b12-a3379ba60a64', 'ORD-491193', 0, 'valide', '2025-09-24T10:15:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ee2e7e81-7573-49a6-bcb6-55032114e7fc', 'ORD-491194', 0, 'valide', '2025-09-25T11:03:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7cd1a9c5-9083-4346-8dae-8c4deb258d5c', 'ORD-491195', 0, 'valide', '2025-09-25T11:04:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e3ae56df-ecd3-4fdb-9f9b-60628ad073cf', 'ORD-491196', 0, 'valide', '2025-09-27T15:12:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ac9f8604-6db9-4d27-8f08-ee5ee7a74466', 'ORD-491197', 0, 'valide', '2025-09-27T15:13:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8776c1fa-0ccd-4899-bda1-6ad3d28043d6', 'ORD-491198', 0, 'valide', '2025-09-27T15:15:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59657615-0371-4af9-8828-dc8808264aae', 'ORD-491199', 0, 'valide', '2025-09-27T15:17:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('891d3d60-aa24-44f8-846a-74ceeaf242b6', 'ORD-491200', 0, 'valide', '2025-09-27T15:18:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d71de5e4-9378-402b-828a-353c2f3eafea', 'ORD-491201', 0, 'valide', '2025-09-27T15:19:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('38746b16-f18b-46e8-865b-59a911950d84', 'ORD-491202', 0, 'valide', '2025-09-27T15:21:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c3e5a8bc-abf6-410b-b661-f3e01f5e9ce4', 'ORD-491203', 0, 'valide', '2025-09-27T15:22:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66b3afba-15f3-4e00-9e27-fa0cd34d4aa5', 'ORD-491204', 0, 'valide', '2025-09-28T14:31:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('923e1455-5809-4ec6-b66c-5b5d94d62ee3', 'ORD-491205', 0, 'valide', '2025-09-28T14:33:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c1a2473-d044-4fee-b1a8-4ca9ff7495d3', 'ORD-491206', 0, 'valide', '2025-09-29T18:49:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a9e11ea2-0da8-476e-9457-2678ba8f9501', 'ORD-491207', 0, 'valide', '2025-09-30T09:00:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('74b2dd44-365e-4bce-b4f8-ed56e538e8a3', 'ORD-491208', 0, 'valide', '2025-09-30T09:06:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('df405d87-2ae5-4d6b-ac8d-4d551b04f6b4', 'ORD-491209', 0, 'brouillon', '2025-09-30T09:08:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b748697b-0f44-42eb-b629-57536045ce47', 'ORD-491210', 0, 'valide', '2025-10-02T10:11:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b7ae605-2cc5-41a6-a841-c96b78998691', 'ORD-491211', 0, 'valide', '2025-10-02T10:23:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('11f0b6ca-c59f-4077-a550-756a1134295e', 'ORD-491212', 0, 'valide', '2025-10-02T10:24:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('48a19c6b-efc3-4f55-8b3a-7663df923aa5', 'ORD-491213', 0, 'valide', '2025-10-02T10:26:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3346a64c-d09e-45d3-86ac-5dc0c5d61f50', 'ORD-491214', 0, 'valide', '2025-10-02T10:27:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('70eca662-15d4-43d9-86d2-cff2dc4fa331', 'ORD-491215', 0, 'valide', '2025-10-02T10:45:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('40fbbdcc-a009-460b-bca1-ae6176e27f55', 'ORD-491216', 0, 'valide', '2025-10-02T10:47:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1ba3e60a-3f9a-42be-88ea-ba3d6b859376', 'ORD-491217', 0, 'valide', '2025-10-02T10:50:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3713e08f-581b-4165-971a-87e38b244cc7', 'ORD-491218', 0, 'valide', '2025-10-02T15:55:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('60562a72-f4d1-4393-ac33-8c8963c14a6d', 'ORD-491219', 0, 'valide', '2025-10-02T16:21:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b972bbac-6d6b-4106-b8f8-8b4737c45d97', 'ORD-491220', 0, 'valide', '2025-10-05T21:02:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('497bcb26-bcae-44f5-8a7c-3b3697ad0a0e', 'ORD-491221', 0, 'valide', '2025-10-05T21:04:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58452a10-3c08-4f3f-b9c0-7a2f748fd98c', 'ORD-491222', 0, 'valide', '2025-10-05T21:06:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8045d82-12ea-4b8c-9a3c-8025a9c90ee8', 'ORD-491223', 0, 'valide', '2025-10-05T21:07:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a868da74-d72a-49c1-9f56-1893599d28a6', 'ORD-491224', 0, 'valide', '2025-10-05T21:22:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6a9658be-0746-4d93-b62f-6d01236b6fbe', 'ORD-491225', 0, 'valide', '2025-10-05T21:23:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bce72f74-af21-44a9-888b-37597dda400c', 'ORD-491226', 0, 'valide', '2025-10-05T21:23:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a7d0d479-ea7a-4962-b5e5-d1a4d7d7db58', 'ORD-491227', 0, 'valide', '2025-10-05T21:28:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3761c28c-d776-42e2-93ac-884f7393a010', 'ORD-491228', 0, 'valide', '2025-10-05T21:32:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1a1a924-27de-4474-9377-bac50a595074', 'ORD-491229', 0, 'valide', '2025-10-05T21:35:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('424727a4-1278-4a8a-9acb-c0c47e8ed476', 'ORD-491230', 0, 'valide', '2025-10-07T08:07:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('be78eef8-403e-48d4-befb-3c275b39a7f6', 'ORD-491231', 0, 'valide', '2025-10-07T08:08:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7312d8a1-77dd-4fcb-8823-0d4e0e25a250', 'ORD-491232', 0, 'valide', '2025-10-07T08:09:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dd362662-8436-46a1-b65b-2ec129b71c23', 'ORD-491233', 0, 'valide', '2025-10-07T08:10:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64bdec9a-4a12-4395-ad61-50574f9fad50', 'ORD-491234', 0, 'valide', '2025-10-07T08:11:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a688ddda-d9e4-49af-9bdf-fc9d204ce7e0', 'ORD-491235', 0, 'valide', '2025-10-07T08:13:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('642271a3-9db3-41ac-9c5b-8544349cc69e', 'ORD-491236', 0, 'valide', '2025-10-07T08:18:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c5d381de-ae27-4f46-a17a-d024e2446952', 'ORD-491237', 0, 'valide', '2025-10-07T08:19:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('84fd3be3-c57f-4f57-aac4-c15d58c14b98', 'ORD-491238', 0, 'valide', '2025-10-07T08:20:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bbb1a351-75c8-4871-b6fa-88503388aa9f', 'ORD-491239', 0, 'valide', '2025-10-07T08:22:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f362394d-499c-42a8-9d76-1cd99935601c', 'ORD-491240', 0, 'valide', '2025-10-07T08:37:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8ba44e94-c5bd-470d-af08-23f9b7d2f18c', 'ORD-491241', 0, 'valide', '2025-10-07T08:39:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('316e36c1-3f6c-46d8-bc55-6b32d43e0043', 'ORD-491242', 0, 'valide', '2025-10-07T08:40:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('881bf44b-55cb-4af4-a2f2-1544cf36c37e', 'ORD-491243', 0, 'valide', '2025-10-07T12:16:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('009ae941-4ace-4c78-9788-5708a762ed1b', 'ORD-491244', 0, 'valide', '2025-10-07T12:18:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8471631b-9c9f-4c28-a417-16db308da26a', 'ORD-491245', 0, 'valide', '2025-10-08T10:25:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e92e86c8-906c-4fd3-8045-b808a3151d27', 'ORD-491246', 0, 'valide', '2025-10-08T10:26:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d7d97b02-3202-4926-8877-4d87163b079c', 'ORD-491247', 0, 'valide', '2025-10-10T08:46:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6f20d92b-b50d-49d0-9d0e-d522c8e41828', 'ORD-491248', 0, 'valide', '2025-10-10T08:47:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00399d98-4000-44ea-bca9-a543d0341962', 'ORD-491249', 0, 'valide', '2025-10-10T09:01:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8a81fafb-6ce8-4717-aecb-906946127356', 'ORD-491250', 0, 'valide', '2025-10-10T09:02:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58371318-7d6c-45fd-8f31-8170a3a1079a', 'ORD-491251', 0, 'valide', '2025-10-10T09:05:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('89d03323-973e-4cc5-ad1d-9af61bd9ae88', 'ORD-491252', 0, 'valide', '2025-10-10T09:06:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1ab0b852-0fb2-470e-b2b0-c1593a45931d', 'ORD-491253', 0, 'valide', '2025-10-10T09:10:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('11e3247c-177b-46ee-af3d-e1d8b676f7e5', 'ORD-491254', 0, 'valide', '2025-10-10T09:11:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1a44d37b-f9d8-4d6d-ab94-b9cc087fb216', 'ORD-491255', 0, 'valide', '2025-10-10T09:12:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('464a76c5-8e69-4369-8708-ae726e887dba', 'ORD-491256', 0, 'valide', '2025-10-10T10:27:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5ea07f1c-109d-4936-97b7-56f6ecb30de2', 'ORD-491257', 0, 'valide', '2025-10-10T10:29:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('93a76a62-a19e-4ce4-a9a0-8255e4124110', 'ORD-491258', 0, 'valide', '2025-10-10T10:30:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0f8e8067-4578-42fd-a4e4-52a66aac45da', 'ORD-491259', 0, 'valide', '2025-10-10T10:31:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c40842ca-984f-4f0b-9625-9f4a3e1e487a', 'ORD-491260', 0, 'valide', '2025-10-10T10:31:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('85ab9019-8297-4857-b9c0-5b46f818cd4a', 'ORD-491261', 0, 'valide', '2025-10-10T10:34:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e0970194-6bbf-4cca-83e6-7c3acb01a448', 'ORD-491262', 0, 'valide', '2025-10-10T10:36:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('87635091-0cb0-43ff-8e6d-45197f14f605', 'ORD-491263', 0, 'valide', '2025-10-10T10:38:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d669d6ec-4770-4b85-9b3f-4e607aec3d78', 'ORD-491264', 0, 'valide', '2025-10-10T10:40:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d5bdab13-3b4a-4095-90c0-138e8978c840', 'ORD-491265', 0, 'valide', '2025-10-10T10:51:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ea8e291c-9754-4eef-af01-cf1800f6fb27', 'ORD-491266', 0, 'valide', '2025-10-10T10:52:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c423cde2-1b86-4d20-a7ba-9d06b8a0bb7e', 'ORD-491267', 0, 'valide', '2025-10-10T10:52:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28003511-96df-4e32-a621-819fd4d7f3c2', 'ORD-491268', 0, 'valide', '2025-10-10T10:53:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('458408a9-b044-446d-b01f-d7d410c99234', 'ORD-491269', 0, 'valide', '2025-10-10T10:54:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71f12e90-ddd3-4ee2-9dbc-d09f08f45f8b', 'ORD-491270', 0, 'valide', '2025-10-10T10:54:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a10468bf-00b3-45be-beb2-747f9c9569d8', 'ORD-491271', 0, 'valide', '2025-10-10T10:57:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7647b91c-fa19-4db5-a718-58cdbd2fb724', 'ORD-491272', 0, 'valide', '2025-10-10T10:58:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bcf3d572-edec-45bf-bc41-4c2d73675b7b', 'ORD-491273', 0, 'valide', '2025-10-10T10:59:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('01e14a12-31fc-4e15-b393-d2cb5dc6dd47', 'ORD-491274', 0, 'valide', '2025-10-12T13:12:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('447898ee-9daf-4094-81c4-c65262cebc2f', 'ORD-491275', 0, 'valide', '2025-10-12T13:13:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a21891f9-22db-494a-b411-a5b9813c95f4', 'ORD-491276', 0, 'valide', '2025-10-12T13:13:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('18ba150f-a01b-4a44-adef-2f3d5cf70ce5', 'ORD-491277', 0, 'valide', '2025-10-12T13:14:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('88358494-aa29-4a3e-98b6-d181e4c29bbd', 'ORD-491278', 0, 'valide', '2025-10-12T13:14:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('687d97db-1e73-445a-93a3-253835e543b0', 'ORD-491279', 0, 'valide', '2025-10-12T13:14:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4a2685d0-ba19-4e2c-8589-dd3c1b89937e', 'ORD-491280', 0, 'valide', '2025-10-12T13:15:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c7a29a3-2b9c-4513-b5b6-2ddb2d78f52f', 'ORD-491281', 0, 'valide', '2025-10-12T13:15:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('02b3441d-518f-4b1c-90f2-b3ef787dda6e', 'ORD-491282', 0, 'valide', '2025-10-12T13:15:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e94a2951-64d0-4070-84a8-c8959e1ecf63', 'ORD-491283', 0, 'valide', '2025-10-12T13:16:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3867a318-1024-4e8a-ad61-8b4f913f3e13', 'ORD-491284', 0, 'valide', '2025-10-12T13:16:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('755a1ddd-dd61-4e05-8f7c-d2362a87db5c', 'ORD-491285', 0, 'valide', '2025-10-12T13:18:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bcdf1ee7-c676-4cd4-9ecc-3b9efa909e25', 'ORD-491286', 0, 'valide', '2025-10-12T13:20:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b8dfa688-9147-45f3-95c7-55a05661c06e', 'ORD-491287', 0, 'valide', '2025-10-12T13:20:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0586b230-8bd5-485c-a786-d45ac155a7f5', 'ORD-491288', 0, 'valide', '2025-10-12T13:21:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0cdbd3c0-2217-4abb-8bb0-9493043397a2', 'ORD-491289', 0, 'valide', '2025-10-12T13:21:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a3030d34-1d7b-41b8-82e6-b81fa30bbd22', 'ORD-491290', 0, 'valide', '2025-10-12T13:22:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a3ccc730-5d51-4af0-9839-f639c47f9802', 'ORD-491291', 0, 'valide', '2025-10-12T13:23:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6b0951a5-fff4-4b95-8ea3-21afc388c997', 'ORD-491292', 0, 'valide', '2025-10-13T12:05:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7c0af28e-0875-41a7-a8b6-a6d34b7779b9', 'ORD-491293', 0, 'valide', '2025-10-13T12:07:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2bf5e16-8f40-46f8-b643-7b5ce7c69b7e', 'ORD-491294', 0, 'valide', '2025-10-13T12:09:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('50cd9244-ed13-4733-b0f8-7da0580e1a88', 'ORD-491295', 0, 'valide', '2025-10-13T12:17:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('453477c1-d1f2-4947-8c30-1ee7eeada980', 'ORD-491296', 0, 'valide', '2025-10-15T11:09:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1927409f-6568-437d-9f4e-2ea36b39fb94', 'ORD-491297', 0, 'valide', '2025-10-15T18:41:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a9f9a226-4a93-4500-942a-9fc002724642', 'ORD-491298', 0, 'brouillon', '2025-10-16T11:25:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ce026a20-8cd9-44ca-8a9e-a1aa7e741ad6', 'ORD-491299', 0, 'valide', '2025-10-16T11:25:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('465f7472-74c3-4f40-bef8-588f3498f306', 'ORD-491300', 0, 'valide', '2025-10-16T11:26:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('872cfa8e-9b25-431f-855e-a2c215ceba1f', 'ORD-491301', 0, 'valide', '2025-10-16T11:43:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('44c85ca3-4f34-4329-a2d8-430e03397949', 'ORD-491302', 0, 'valide', '2025-10-16T11:45:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('03f46c07-e4bf-4ae1-b6df-86c65006ba3b', 'ORD-491303', 0, 'valide', '2025-10-16T15:35:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28cce6b0-2179-48c3-b588-bd6bf1511633', 'ORD-491304', 0, 'valide', '2025-10-16T15:36:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f39788ff-fbb2-463a-95b7-4a137da4ffb9', 'ORD-491305', 0, 'valide', '2025-10-16T15:38:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2d7f546a-aa11-4272-842e-61f55696202c', 'ORD-491306', 0, 'valide', '2025-10-16T15:38:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('84380042-5101-45b1-a7f5-686a0a201d87', 'ORD-491307', 0, 'valide', '2025-10-16T15:39:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a029091e-15fc-4f08-ace1-24dcb1457fc4', 'ORD-491308', 0, 'valide', '2025-10-16T15:43:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('19893214-d02d-4804-826f-8c90bdd3d2a8', 'ORD-491309', 0, 'valide', '2025-10-16T15:43:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('31a6d688-4d89-434b-be46-b0a2a50d7a52', 'ORD-491310', 0, 'valide', '2025-10-17T11:34:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64e0b766-1c35-4cd7-a9c1-410a89b3cd28', 'ORD-491311', 0, 'valide', '2025-10-17T11:35:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a4ae67c3-1bca-4ebe-bbc5-0fddb30614e7', 'ORD-491312', 0, 'valide', '2025-10-17T12:10:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a0d92bab-7fa0-4948-a3f5-41a567f03a22', 'ORD-491313', 0, 'valide', '2025-10-17T12:10:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('62836336-8e0f-4770-bc4c-cbec237256a5', 'ORD-501230', 0, 'valide', '2025-10-18T10:25:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('28d1a049-0e9d-41af-bde1-dc9dcd07f1e9', 'ORD-501231', 0, 'valide', '2025-10-18T10:51:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('57b39b41-8cc4-4e8f-b8e2-1073433a97cb', 'ORD-501232', 0, 'valide', '2025-10-18T10:54:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('72f91621-1259-4249-8f01-7c76d3d93721', 'ORD-501233', 0, 'valide', '2025-10-18T10:54:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cde1b28d-fdd0-4c19-a361-a48e699a6d5a', 'ORD-501234', 0, 'valide', '2025-10-18T10:55:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c519de48-7bd2-4b52-ae8a-5d8b36b85a0b', 'ORD-501235', 0, 'valide', '2025-10-18T10:57:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b983a7ee-553f-4d9a-b15a-3336a451e597', 'ORD-501236', 0, 'valide', '2025-10-18T10:58:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3a5770fe-b48e-4f5a-b313-911f51c0fc90', 'ORD-501237', 0, 'valide', '2025-10-18T10:59:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('74391110-ec6b-42e0-9cb3-4798de1bd100', 'ORD-501238', 0, 'valide', '2025-10-18T11:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9c573633-f2cb-4949-a3d4-f782cc68e111', 'ORD-501239', 0, 'valide', '2025-10-18T11:00:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f78c1c04-2254-44ce-9ff1-316d732956a8', 'ORD-501240', 0, 'valide', '2025-10-18T11:01:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('75d5e15b-e2ca-49d5-a1b7-3fc2999c255d', 'ORD-501241', 0, 'valide', '2025-10-18T11:02:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('88bede5c-6033-40f9-9747-ade34688f324', 'ORD-501242', 0, 'valide', '2025-10-18T11:03:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8717ca26-5fe6-4f59-be95-2ccbf5f896b3', 'ORD-501243', 0, 'valide', '2025-10-18T11:04:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9233cec9-2c14-4286-b99f-6599966e0aba', 'ORD-501244', 0, 'valide', '2025-10-18T11:05:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9e08955d-35a8-4fc1-adff-7cf263b42377', 'ORD-501245', 0, 'valide', '2025-10-18T11:05:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('91a88021-bbca-41fb-adac-965cade0b7fc', 'ORD-501246', 0, 'valide', '2025-10-18T11:07:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2d9166b6-0e2d-41d9-af31-3f7771a2cfbb', 'ORD-501247', 0, 'valide', '2025-10-18T11:07:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('95c4c24d-2c5d-4597-87de-0173b1ddd706', 'ORD-501248', 0, 'valide', '2025-10-18T11:10:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9afdc595-2e07-405a-9d99-f3cdfe93f219', 'ORD-501249', 0, 'valide', '2025-10-18T11:13:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('077fb09b-6ba9-49c0-ac73-533c5ee689b7', 'ORD-501250', 0, 'valide', '2025-10-18T11:18:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('284bde9f-878f-479f-a341-96676b008611', 'ORD-501251', 0, 'valide', '2025-10-18T11:19:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('460da81f-27c5-4438-9ec8-56d9019e19a8', 'ORD-501252', 0, 'valide', '2025-10-18T11:20:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('87b61fe6-c40a-4586-bd57-c10a0c0337b9', 'ORD-501253', 0, 'valide', '2025-10-18T11:21:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aee02bf7-0863-43f2-855d-2aecf7433104', 'ORD-501254', 0, 'valide', '2025-10-18T11:22:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7014f5d3-2ca0-4efc-8a90-e56533a5dadc', 'ORD-501255', 0, 'valide', '2025-10-18T11:23:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4ef77b32-790f-4e63-935f-cf20f6a9cdea', 'ORD-501256', 0, 'valide', '2025-10-19T10:45:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3403fea6-1241-426f-9f21-d94481271fec', 'ORD-501257', 0, 'valide', '2025-10-19T10:45:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('195e3a53-3697-4784-8988-10c8b9daedfc', 'ORD-501258', 0, 'valide', '2025-10-20T07:47:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d7a8e1c5-bf68-4011-a148-53cc15e00ea0', 'ORD-501259', 0, 'valide', '2025-10-20T07:48:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('912f642c-51d3-4e47-9a20-6bd33e9cae6b', 'ORD-501260', 0, 'valide', '2025-10-20T07:49:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f6201ac7-776b-4c45-9b66-342dca78f2ff', 'ORD-501261', 0, 'valide', '2025-10-20T07:50:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('12e7ed67-87d6-4322-ac14-83ca51b29fe7', 'ORD-501262', 0, 'valide', '2025-10-20T07:50:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0bfd6ad3-d35b-42cd-90e8-970091dafd8a', 'ORD-501263', 0, 'valide', '2025-10-20T07:51:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8dd89509-1558-40a5-b323-1c697d1a048d', 'ORD-501264', 0, 'valide', '2025-10-20T07:51:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c4f9e561-d208-44d2-8647-5fc4e7e7a5fb', 'ORD-501265', 0, 'valide', '2025-10-20T07:52:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('105554c1-2d32-48f9-b39c-1e1c42a6830e', 'ORD-501266', 0, 'valide', '2025-10-20T07:52:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b23bb79-9c08-4ccb-96ba-67f6d9d71a42', 'ORD-501267', 0, 'valide', '2025-10-20T07:53:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c02efbd3-2cd0-4ab7-972c-be78a64a8b0a', 'ORD-501268', 0, 'valide', '2025-10-20T07:54:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4dcb603b-69ba-4b76-8065-f8e81a090254', 'ORD-501269', 0, 'valide', '2025-10-20T07:55:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('db2da08c-ee6c-404c-ac79-bed52c7a70fb', 'ORD-501270', 0, 'valide', '2025-10-20T07:55:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bd0cba90-f2c1-47c3-b12a-c605d5f57e37', 'ORD-511257', 0, 'valide', '2025-10-22T07:53:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('120eabcf-9122-49fa-89b8-4f867c3a9375', 'ORD-511258', 0, 'valide', '2025-10-22T07:54:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2236db07-54c6-4cfc-890d-4c12a39a6c07', 'ORD-511259', 0, 'valide', '2025-10-22T07:55:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0f99defd-698c-4f34-bf6f-6d43f1a5feb5', 'ORD-511260', 0, 'valide', '2025-10-22T15:48:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5d582a18-a7d4-4c65-a49d-258ea2234bf8', 'ORD-511261', 0, 'valide', '2025-10-22T15:48:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('94c069a3-1291-472f-af7f-8b1239864582', 'ORD-511262', 0, 'valide', '2025-10-22T15:49:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('717cc0c3-b2bf-418d-84a0-d3561be431dc', 'ORD-511263', 0, 'valide', '2025-10-22T15:50:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b8dd09d3-057d-4c02-bc35-e40e16582a43', 'ORD-511264', 0, 'valide', '2025-10-22T16:06:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3fe5f974-31e3-4e81-99d8-24dbd945e020', 'ORD-511265', 0, 'valide', '2025-10-22T16:07:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('56e49366-b55f-429b-bc43-285c1527e3b6', 'ORD-511266', 0, 'valide', '2025-10-22T16:08:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7ce8d30-7f27-460a-ae56-2960c12362f3', 'ORD-511267', 0, 'valide', '2025-10-22T16:08:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('94f6c9ec-6fa5-4f48-9cf5-3e5f16b62a6a', 'ORD-511268', 0, 'valide', '2025-10-22T16:10:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c844f37-9fe7-4129-86f1-2eb44919cb3e', 'ORD-511269', 0, 'valide', '2025-10-22T16:11:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c4d855e8-ee5a-403c-adbd-094d0fdb95a1', 'ORD-511270', 0, 'valide', '2025-10-22T16:18:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('97f43ae4-5d21-462e-83d3-fa630aab567f', 'ORD-511271', 0, 'valide', '2025-10-22T16:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2bd1ff73-3a41-459c-981b-30b2add65bab', 'ORD-511272', 0, 'valide', '2025-10-22T16:21:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6e5aa7e1-edff-41e7-9ed2-48114c917ca6', 'ORD-511273', 0, 'valide', '2025-10-22T16:23:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e5c3449f-38d2-422c-b698-98f772a83d59', 'ORD-511274', 0, 'valide', '2025-10-23T08:07:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('27d592d6-e405-472d-b9b4-05dcd258b0b0', 'ORD-511275', 0, 'valide', '2025-10-23T08:07:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('da511c23-2c2e-4520-a317-2839907c7aa1', 'ORD-511276', 0, 'valide', '2025-10-23T08:08:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dfdae904-d149-4141-babd-05fe0cdc3a17', 'ORD-511277', 0, 'valide', '2025-10-23T08:10:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('24446b90-e885-4787-ba6b-e1445fdb5ab2', 'ORD-511278', 0, 'valide', '2025-10-23T08:12:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f5822e27-a923-4f5b-b455-8361a30fdc2e', 'ORD-511279', 0, 'valide', '2025-10-23T08:13:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e6888769-efb6-471c-8ece-8d0bc6ac7e47', 'ORD-511280', 0, 'valide', '2025-10-23T08:14:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fbeedcb6-1bd1-4a28-b783-e108d113e43d', 'ORD-511281', 0, 'valide', '2025-10-23T08:15:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2dec3b32-c7ad-4f29-bc3b-db49c9112624', 'ORD-511282', 0, 'valide', '2025-10-26T08:16:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fbc68801-4f04-4161-9c50-03d1027934bf', 'ORD-511283', 0, 'valide', '2025-10-26T08:19:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2790b9d7-c9a3-4dab-befa-1c7515481955', 'ORD-511284', 0, 'valide', '2025-10-26T08:20:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ee07c5e6-ed46-47df-a761-5090b97dda1d', 'ORD-511285', 0, 'valide', '2025-10-26T08:21:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('12ce3995-19f6-4752-a323-fac92e343ba6', 'ORD-511286', 0, 'valide', '2025-10-26T08:22:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eb4a6ea3-2393-42aa-afc4-b3fc9c70de8d', 'ORD-511287', 0, 'valide', '2025-10-26T08:23:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c9b9b82e-9aa2-4e56-8178-a17781a5cdf5', 'ORD-511288', 0, 'valide', '2025-10-26T08:24:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b0f0329-869a-4af2-981e-a95db4f22f9d', 'ORD-511289', 0, 'valide', '2025-10-26T08:26:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7690103-062e-4c7f-a977-b6b8d3507827', 'ORD-511290', 0, 'valide', '2025-10-26T08:27:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08c6aafb-cff4-4a20-9d66-694e21732db4', 'ORD-511291', 0, 'valide', '2025-10-26T08:29:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('13a0873a-a240-4fce-8f77-dc1e93471606', 'ORD-511292', 0, 'valide', '2025-10-27T16:17:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('52f80706-e014-488d-b787-c8cce8bb3ac7', 'ORD-511293', 0, 'valide', '2025-10-27T17:16:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('16f7b989-2d43-4815-af8c-a158e400e690', 'ORD-511294', 0, 'valide', '2025-10-27T17:19:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d9a7966d-ff05-456c-8c52-ca3fbfd0b1ea', 'ORD-511295', 0, 'valide', '2025-10-28T13:27:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eb03ea40-c290-4ccc-8852-341ebb6469ba', 'ORD-511296', 0, 'valide', '2025-10-29T08:38:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7761d6fe-f817-43e4-9f63-0fb7903d7748', 'ORD-511297', 0, 'valide', '2025-10-29T08:39:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1c003f3c-5586-4d5f-b761-b317dabd9a55', 'ORD-511298', 0, 'valide', '2025-10-29T08:41:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c8af092d-bf97-40db-9597-88d9b0dcde24', 'ORD-511299', 0, 'valide', '2025-10-29T08:44:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e8e0c351-d15a-4634-b7de-db8d38b12a85', 'ORD-511300', 0, 'valide', '2025-10-29T08:45:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('61b65a5c-1c31-40d0-93c6-735ff3da1add', 'ORD-511301', 0, 'valide', '2025-10-29T09:03:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e2b88e8f-10de-4457-8f21-000fbe944363', 'ORD-511302', 0, 'valide', '2025-10-29T09:04:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('719913cb-7404-4660-bf4c-78dd15dad011', 'ORD-511303', 0, 'valide', '2025-10-29T09:08:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('36d30b93-e2a6-453c-9549-a19415e43f8b', 'ORD-511304', 0, 'valide', '2025-10-29T09:09:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('69152be5-ea4d-4edc-b0ff-806b0dec3718', 'ORD-511305', 0, 'valide', '2025-10-29T09:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('09c1043f-2afe-42ba-83c7-a511c176439c', 'ORD-511306', 0, 'valide', '2025-10-29T11:44:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1c13f9e-db8a-4243-b61b-77426bc6a8c5', 'ORD-511307', 0, 'valide', '2025-10-29T11:45:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7bb2c2e6-5921-43f8-855e-5d758a03a08f', 'ORD-511308', 0, 'valide', '2025-10-29T11:45:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c98c68c2-c2a2-41d6-a0af-10a3a684568c', 'ORD-511309', 0, 'valide', '2025-10-29T11:46:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fd7eee9d-a6e9-4cfc-a793-a49777f469d6', 'ORD-521257', 0, 'valide', '2025-10-31T09:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('98757c4a-5e9e-4649-a76b-fd4fa68256bb', 'ORD-521258', 0, 'valide', '2025-10-31T09:27:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ccfb86a0-c3c3-4705-941e-0b261a6abd89', 'ORD-521259', 0, 'valide', '2025-10-31T09:28:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('395b2d1f-50ec-4f6a-8bbc-835c91ff15a1', 'ORD-521260', 0, 'valide', '2025-10-31T09:29:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c43e5658-220a-420d-9d38-341362195535', 'ORD-521261', 0, 'valide', '2025-10-31T17:33:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8764889a-3bcf-4c11-90ec-34311f7ca0c3', 'ORD-521262', 0, 'valide', '2025-10-31T17:36:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('25a75de3-a37c-4ea6-80e0-3dbcb03c3fb8', 'ORD-521263', 0, 'valide', '2025-10-31T17:37:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('79122718-3bc0-46ba-9183-36d19df8386a', 'ORD-521264', 0, 'valide', '2025-10-31T17:40:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4016c4c9-edec-4a46-a8b6-1198d5df73ed', 'ORD-521265', 0, 'valide', '2025-10-31T17:41:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('03421ad9-12ea-4b0c-a480-b8a566851601', 'ORD-521266', 0, 'valide', '2025-10-31T17:42:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('000b124d-78d5-4e27-bdba-bd178cf22b18', 'ORD-521267', 0, 'valide', '2025-10-31T17:43:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1616445b-aa94-4954-84b5-d6b59a13ed8f', 'ORD-521268', 0, 'valide', '2025-10-31T17:50:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('093ee0e4-3501-45d9-9901-a9b7a6265e9b', 'ORD-521269', 0, 'valide', '2025-10-31T17:51:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d88f6ddb-b612-45fb-940c-e2fda521319e', 'ORD-521270', 0, 'valide', '2025-10-31T17:52:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('81218042-eb5c-4801-a015-f725e5520c50', 'ORD-521271', 0, 'valide', '2025-10-31T17:52:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('527c0217-fd06-4390-8f6e-3a22a7c7472a', 'ORD-521272', 0, 'valide', '2025-10-31T17:55:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e780c2a8-d14e-4cb1-91ea-da0c1991bbd9', 'ORD-521273', 0, 'valide', '2025-10-31T17:55:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ba647294-980f-417e-b6d5-8ed0d1a7410f', 'ORD-521274', 0, 'valide', '2025-10-31T17:56:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fe17696f-a08d-4f63-9f35-3b27da9affa6', 'ORD-521275', 0, 'valide', '2025-11-04T09:15:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4447c8cc-e65a-46e5-b9e6-2e804d1123e8', 'ORD-521276', 0, 'valide', '2025-11-04T09:20:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ad160efc-36eb-417c-9ab0-23582a3702f9', 'ORD-521277', 0, 'valide', '2025-11-04T09:21:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c2ea56f8-711c-40d4-a6f3-cc7262afb9c3', 'ORD-521278', 0, 'valide', '2025-11-04T09:22:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e0d2e5e6-f2ea-4add-a4a0-39a9cdb1f740', 'ORD-521279', 0, 'valide', '2025-11-04T09:27:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('78af4073-2d32-4f11-88d7-d6470d3ee949', 'ORD-521280', 0, 'valide', '2025-11-04T09:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6e826ca3-9d27-45b7-953e-b422dd19e077', 'ORD-521281', 0, 'valide', '2025-11-04T09:47:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bd7d0c92-179c-4289-9027-88ed949c75cc', 'ORD-521282', 0, 'valide', '2025-11-04T09:48:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0bcc2744-4b2a-4282-a4e9-d80fb8a0a1c5', 'ORD-521283', 0, 'valide', '2025-11-04T09:49:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bd4e6a8f-1776-47ea-a582-2217a12a0963', 'ORD-521284', 0, 'valide', '2025-11-04T09:50:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('77bbbdf6-8c58-45b7-8cae-8477e9b6977c', 'ORD-521285', 0, 'valide', '2025-11-04T09:50:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('90ae9b31-65c7-4504-a6f3-3db007d2cd64', 'ORD-521286', 0, 'valide', '2025-11-04T09:51:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('429dc0a0-2b20-4118-9ea7-d04f8561b608', 'ORD-521287', 0, 'valide', '2025-11-04T09:52:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d7cece32-3957-404f-afb9-eab028b7c024', 'ORD-521288', 0, 'valide', '2025-11-04T09:53:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf1df43d-c8b0-460d-948a-8dca1278ba23', 'ORD-521289', 0, 'valide', '2025-11-04T10:08:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1946a2b6-d4ac-4a37-874b-da7efb9e201b', 'ORD-521290', 0, 'valide', '2025-11-05T07:57:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('99eb344a-3536-42f8-9a4f-c8e3827a73d1', 'ORD-521291', 0, 'valide', '2025-11-05T07:57:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('10b35808-946a-4495-88cf-f735ae49c0c6', 'ORD-521292', 0, 'valide', '2025-11-05T07:58:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1cf2a0c1-e31a-47d5-944c-a2351f3d1a6b', 'ORD-521293', 0, 'valide', '2025-11-05T08:00:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d057aac7-795e-46dc-81c5-4ba0593f1d34', 'ORD-521294', 0, 'valide', '2025-11-05T08:01:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a1768bd7-896c-4c3d-a22b-0f319286cd87', 'ORD-521295', 0, 'valide', '2025-11-05T08:02:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1da486fd-77d8-42bf-8685-02f3f5bcab6a', 'ORD-521296', 0, 'valide', '2025-11-05T08:03:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4fd3f976-665f-444a-8ec5-34aa22c7ab89', 'ORD-521297', 0, 'valide', '2025-11-05T08:04:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1837e7f2-909f-4197-b96d-5c9196d113c3', 'ORD-521298', 0, 'valide', '2025-11-05T08:07:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b6035e2-ac78-4c6d-907f-69fc752aebda', 'ORD-521299', 0, 'valide', '2025-11-06T15:14:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58e4d487-a7f4-4976-a909-e571677a173e', 'ORD-521300', 0, 'valide', '2025-11-08T21:48:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5c00d5b3-866a-4079-a480-0e6f3aca65a3', 'ORD-521301', 0, 'valide', '2025-11-08T21:50:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('479cf527-ec52-471e-9550-d0ca0a198840', 'ORD-521302', 0, 'valide', '2025-11-08T21:58:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c3a825af-1070-4dae-b04b-383f358d278c', 'ORD-521303', 0, 'valide', '2025-11-08T22:05:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('53b40241-255b-4ae5-8dbc-a42dc0bd1db6', 'ORD-521304', 0, 'valide', '2025-11-08T22:06:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b882236a-ea45-4773-8e7b-e60062db57df', 'ORD-521305', 0, 'valide', '2025-11-08T22:07:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bd39bc94-87d3-4790-8d4e-d298a288bc4c', 'ORD-521306', 0, 'valide', '2025-11-08T22:12:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ecd48598-242e-4210-8f0d-82ecb1591a0c', 'ORD-521307', 0, 'valide', '2025-11-08T22:18:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a5e61a23-8253-443b-a713-825697f9e24a', 'ORD-521308', 0, 'valide', '2025-11-09T09:49:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0efb973-4031-4251-8919-83de35a50fa0', 'ORD-521309', 0, 'valide', '2025-11-10T08:34:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b849dbed-06e7-411d-8393-257091df212b', 'ORD-521310', 0, 'valide', '2025-11-10T08:38:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('290479e3-c028-49b1-9316-f7476409fbd0', 'ORD-521311', 0, 'valide', '2025-11-10T09:15:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('55d43205-6148-4984-b3c1-387d11e8be1f', 'ORD-521312', 0, 'valide', '2025-11-10T09:19:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cb1feaf3-5ae6-4ec9-b58a-4f137a58fdc7', 'ORD-521313', 0, 'valide', '2025-11-10T09:20:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f5e82855-f4ce-4cfb-9f5a-7f856db58e4a', 'ORD-521314', 0, 'valide', '2025-11-10T09:21:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c069a838-d6a6-4420-bb1d-49b37797b3c7', 'ORD-521315', 0, 'valide', '2025-11-10T09:22:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('91bd747a-e840-4725-8b79-f59254bb522b', 'ORD-521316', 0, 'valide', '2025-11-10T14:28:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4dbe0594-9aa0-4b3e-ac93-6cb9352e1893', 'ORD-521317', 0, 'valide', '2025-11-11T22:30:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('563b0c6b-64f7-4027-90c2-aca782551afc', 'ORD-521318', 0, 'valide', '2025-11-11T22:34:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8b6f2152-d4e9-4d7b-96b3-dba686608999', 'ORD-521319', 0, 'valide', '2025-11-11T22:37:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e5fdeaa7-9077-43db-be46-95d4fc899f00', 'ORD-521320', 0, 'valide', '2025-11-11T22:39:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6cb07ad0-1746-45ca-98a4-0f408ba4583e', 'ORD-521321', 0, 'valide', '2025-11-11T22:41:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0dd336f-fa90-4f71-bef1-6c840ef57043', 'ORD-521322', 0, 'valide', '2025-11-11T22:42:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5df884d8-6cac-4157-86c0-9bc855df8c78', 'ORD-521323', 0, 'valide', '2025-11-11T22:43:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('279daee2-0b8f-4d2f-b1f1-4be295c91510', 'ORD-521324', 0, 'valide', '2025-11-11T22:44:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('019d56b7-be2e-48db-ae51-4fe3c03f53e4', 'ORD-521325', 0, 'valide', '2025-11-11T22:47:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ca87b83f-ad8f-489a-8729-7968d011f988', 'ORD-521326', 0, 'valide', '2025-11-13T08:18:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ebe2c8d1-3a13-4e68-96db-cfaaa1bc1959', 'ORD-521327', 0, 'valide', '2025-11-13T08:19:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1b869c8c-2cfa-45a5-bb17-acbf56cdc3a8', 'ORD-521328', 0, 'valide', '2025-11-13T08:20:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0b51b7cb-419b-4514-ae46-f94bb4734943', 'ORD-521329', 0, 'valide', '2025-11-13T08:20:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3d8a2b29-7bfc-48ea-bce9-f7f695174684', 'ORD-521330', 0, 'valide', '2025-11-13T08:26:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ef91fd2a-03e1-4bf4-b518-3c950d9625f1', 'ORD-521331', 0, 'valide', '2025-11-13T11:41:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('73f84fb9-d06a-4f88-90ad-e04d71e265a8', 'ORD-521332', 0, 'valide', '2025-11-13T11:42:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8c3c51e7-fc23-4a37-996f-9150242a0217', 'ORD-521333', 0, 'valide', '2025-11-13T11:43:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3a47cc95-8718-4c15-befa-1dde1a97c972', 'ORD-521334', 0, 'valide', '2025-11-13T11:44:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a70b4ac3-9339-4d45-a6c4-4f6bb9c5a910', 'ORD-521335', 0, 'valide', '2025-11-13T11:58:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a07ee6eb-1749-4f12-b7b0-68ebc4943e9f', 'ORD-521336', 0, 'valide', '2025-11-18T14:26:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aa57a023-3252-4b1f-bfee-597a1097da7b', 'ORD-521337', 0, 'valide', '2025-11-18T14:28:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('633fc2de-1f24-4cb1-ba0c-7ed77b46c118', 'ORD-521338', 0, 'valide', '2025-11-18T14:33:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f9eae128-237f-4c42-9fe0-6bb6cb5e66c2', 'ORD-521339', 0, 'valide', '2025-11-18T14:34:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8fefcc6f-0ee1-4834-b982-b6e02a4dc8bc', 'ORD-521340', 0, 'valide', '2025-11-18T14:35:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('af7f1c7c-65ea-463a-bf15-7aa9111988c2', 'ORD-521341', 0, 'valide', '2025-11-18T14:37:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cde47566-ec3e-4791-87f2-5b3358727e25', 'ORD-521342', 0, 'valide', '2025-11-18T14:42:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2f58d979-b187-495c-bf67-34df6e59b466', 'ORD-521343', 0, 'valide', '2025-11-18T14:45:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5564bae6-c2b9-459f-ade6-6bc4f53164db', 'ORD-521344', 0, 'valide', '2025-11-18T14:46:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2d86d27b-0308-4f1a-bac1-3edb5a8e92a0', 'ORD-521345', 0, 'valide', '2025-11-18T14:48:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dd775593-6139-4d20-b888-7303481ace67', 'ORD-521346', 0, 'valide', '2025-11-18T14:49:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('528f9ad7-0f53-475d-8f2e-4da5bf5d888c', 'ORD-521347', 0, 'valide', '2025-11-18T15:33:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7fe88b3b-1b0a-4a90-aaef-710430247da5', 'ORD-521348', 0, 'valide', '2025-11-18T16:18:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c9892ff2-d792-4a2d-9711-264fb937ab39', 'ORD-521349', 0, 'valide', '2025-11-18T16:20:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('183b4a66-8fc2-481d-83e0-9461867e5a25', 'ORD-521350', 0, 'valide', '2025-11-18T16:21:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('36a80eb4-56c8-457b-aa3a-853d98de5296', 'ORD-521351', 0, 'valide', '2025-11-18T16:22:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64ce9fb7-557c-49ad-8bdd-231647a5dd44', 'ORD-521352', 0, 'valide', '2025-11-18T16:23:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37a22bf2-2778-4257-91b1-f173189d41a2', 'ORD-521353', 0, 'valide', '2025-11-18T16:25:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1e2e0192-dc71-432a-8689-fee11fa71238', 'ORD-521354', 0, 'valide', '2025-11-18T16:26:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('09d295fc-cf09-466c-9e64-9820b641dca8', 'ORD-521355', 0, 'valide', '2025-11-19T17:44:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('59e14fc6-9c50-478d-9ec8-60a2b02b2026', 'ORD-521356', 0, 'valide', '2025-11-24T08:14:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('07fec06b-bf14-46c9-a613-86dbaa4e513a', 'ORD-521357', 0, 'valide', '2025-11-24T08:15:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8255fc1e-6192-49a7-97c2-49bdb6d13019', 'ORD-521358', 0, 'valide', '2025-11-24T08:16:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e6538e76-5f3e-4677-9fd2-1441eefba7f0', 'ORD-521359', 0, 'valide', '2025-11-24T14:46:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f25049b0-7d08-40cf-ba76-c09f62cacfce', 'ORD-521360', 0, 'valide', '2025-11-24T14:47:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7a37a35e-0523-421b-955d-f409abe611fe', 'ORD-521361', 0, 'valide', '2025-11-24T14:48:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8614e71-91e7-41a5-9b42-bee137aadf7c', 'ORD-521362', 0, 'valide', '2025-11-24T14:50:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d9d716f3-eef5-4942-836c-010f2551ffe4', 'ORD-521363', 0, 'valide', '2025-11-24T14:53:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c4910014-1ae6-4939-8ab6-afab29d9f1ca', 'ORD-521364', 0, 'valide', '2025-11-24T14:54:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b13d8145-e558-4c0a-b00e-8a8e24f71041', 'ORD-521365', 0, 'valide', '2025-11-24T14:55:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4e7fd63c-875b-4910-8971-29b566d9ca73', 'ORD-521366', 0, 'valide', '2025-11-24T14:55:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('861a2809-8e67-48e9-9592-373855764bea', 'ORD-521367', 0, 'valide', '2025-11-24T14:56:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('50f45507-8a41-4954-ba8c-bc890013c009', 'ORD-521368', 0, 'valide', '2025-11-24T14:57:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c7ebe506-420c-4d95-976c-e159fa2229c8', 'ORD-521369', 0, 'valide', '2025-11-24T14:59:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0284f4f4-f14d-4366-91af-13db346ff1ad', 'ORD-521370', 0, 'valide', '2025-11-24T15:00:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96d029ab-0386-4f52-b9d2-212288af9ea9', 'ORD-521371', 0, 'valide', '2025-11-24T15:01:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aa5b952b-8105-446a-8098-3bb234148b34', 'ORD-521372', 0, 'valide', '2025-11-24T15:05:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('57e8f5e6-78a1-4555-88a8-b3b3a8f81db0', 'ORD-521373', 0, 'valide', '2025-11-24T15:06:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aa36b15d-fff8-4928-884b-765c2cd7f210', 'ORD-521374', 0, 'valide', '2025-11-24T15:06:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('aaf0f093-92c9-408b-83c3-d639d9a0fbd1', 'ORD-521375', 0, 'valide', '2025-11-24T15:08:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1a80823c-844e-4951-adb3-032526bc7cd1', 'ORD-521376', 0, 'valide', '2025-11-24T15:10:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1cb82e6e-3170-4b5d-8c85-4447dd21ba11', 'ORD-521377', 0, 'valide', '2025-11-24T15:16:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08931333-e5f4-4bfa-a449-b4816e8852da', 'ORD-521378', 0, 'valide', '2025-11-24T15:17:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('91783e11-047e-4a95-b41a-1e38bc7efa63', 'ORD-521379', 0, 'valide', '2025-11-24T15:17:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9106a242-aca0-4540-a062-5172be0d37c3', 'ORD-521380', 0, 'valide', '2025-11-24T15:18:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9107977e-8792-4e7d-94b9-f691eaa9c391', 'ORD-521381', 0, 'valide', '2025-11-24T15:36:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('72c4926e-d4f6-4a28-b494-0fb0df0979da', 'ORD-521382', 0, 'valide', '2025-11-24T15:37:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('341c1abc-c69b-4d84-9643-4ee1420eb029', 'ORD-521383', 0, 'valide', '2025-11-24T15:44:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('55aefbb1-5e35-482d-9544-f536a4def0d6', 'ORD-521384', 0, 'valide', '2025-11-24T15:45:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d60fedb1-667d-4a09-8692-714466b61f66', 'ORD-521385', 0, 'valide', '2025-11-24T15:46:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c302da17-7659-4dbc-af2b-663c5043f022', 'ORD-521386', 0, 'valide', '2025-11-24T15:47:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c7803d7a-c992-4da9-a728-3e6a046fd0b4', 'ORD-521387', 0, 'valide', '2025-11-24T15:48:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('455ca863-9fa7-46dc-850c-6f330c761c6a', 'ORD-521388', 0, 'valide', '2025-11-24T15:49:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2880cb9a-878a-4d3b-8988-6400da525922', 'ORD-521389', 0, 'valide', '2025-11-24T15:50:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0034356-c198-4918-a5d0-16609532352a', 'ORD-521390', 0, 'valide', '2025-11-24T15:56:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2acbd81c-e637-4ca0-987f-92ce27b78db7', 'ORD-521391', 0, 'valide', '2025-11-24T15:57:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('03b5918b-70f9-428f-8819-a53dcd7d0c8b', 'ORD-521392', 0, 'valide', '2025-11-24T15:58:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('856510fc-6de8-4b7a-8e57-deaa96fdce4f', 'ORD-521393', 0, 'valide', '2025-11-24T16:01:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b53834a-6cc1-4b33-a3dc-9ffddc15c2d5', 'ORD-521394', 0, 'valide', '2025-11-24T16:03:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1ace1ea2-f50e-4b6d-b51f-32362c18bca9', 'ORD-521395', 0, 'valide', '2025-11-24T16:10:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('18013fe3-4104-42d4-bdd0-57def392015c', 'ORD-521396', 0, 'valide', '2025-11-24T16:13:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8bdc3d43-c6f7-422f-a834-f86926211cf9', 'ORD-521397', 0, 'valide', '2025-11-26T14:09:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6c4374bc-0006-4863-a98e-ceb0359a0f6e', 'ORD-521398', 0, 'valide', '2025-11-26T14:11:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('46221ca3-7bbf-4f07-b812-bb17cb1b4e7b', 'ORD-521399', 0, 'valide', '2025-11-26T14:13:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4415e05f-17d6-4ea3-9852-84737e291727', 'ORD-521400', 0, 'valide', '2025-11-26T15:56:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d9706742-66b6-4bd5-aacc-8cf2d7e08e84', 'ORD-521401', 0, 'valide', '2025-11-26T15:58:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c88f12fa-60fe-479b-949c-a7bab19f286e', 'ORD-521402', 0, 'valide', '2025-11-26T16:00:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9afe72dd-fd64-4135-81f3-1cc0053a6397', 'ORD-521403', 0, 'valide', '2025-11-26T16:01:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2d5abe8-cd87-4de3-8640-d3c908096267', 'ORD-521404', 0, 'valide', '2025-11-26T16:02:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b7094b1-1d8b-4907-bdc3-1c4706cb0b14', 'ORD-521405', 0, 'valide', '2025-11-26T17:34:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('229a3307-80fc-4d97-80c1-50f73ff6736b', 'ORD-521406', 0, 'valide', '2025-11-26T17:36:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2affee83-ebd0-4269-85e7-a123685e28f8', 'ORD-521407', 0, 'valide', '2025-11-26T17:37:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2a2c1cb6-7976-4d18-820b-87cc50e888be', 'ORD-521408', 0, 'valide', '2025-11-26T19:24:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7252f337-00f1-4b07-95d0-b05d667a1f58', 'ORD-521409', 0, 'valide', '2025-11-27T12:37:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf1b97bc-81a1-444d-86c2-bda95d83c851', 'ORD-521410', 0, 'valide', '2025-11-27T13:43:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c5d19a1f-0fb1-4728-b09d-f87041f2409c', 'ORD-521411', 0, 'valide', '2025-11-27T16:39:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3fcccc7c-a47e-4d59-ac89-ec52a521eac2', 'ORD-521412', 0, 'valide', '2025-12-01T09:10:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8cb83c6b-d44b-45e0-860c-e3b5b03cbcea', 'ORD-521413', 0, 'valide', '2025-12-01T14:32:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5126bf43-230c-42f3-bd84-09e6938639b8', 'ORD-521414', 0, 'valide', '2025-12-01T14:33:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66be025d-2169-47cc-848c-3f80237051ab', 'ORD-521415', 0, 'valide', '2025-12-01T14:42:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f77c4710-350c-40a4-8c23-e4e7f9b591f3', 'ORD-521416', 0, 'valide', '2025-12-02T17:56:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3f2f0db8-d22c-4f95-97cb-37a3eb51e399', 'ORD-521417', 0, 'valide', '2025-12-02T18:00:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c767b8cc-726b-443c-890c-a7f6f4170ac4', 'ORD-521418', 0, 'valide', '2025-12-02T18:04:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('58f7f35e-0c96-4307-bb74-251ffd916d21', 'ORD-521419', 0, 'valide', '2025-12-02T18:05:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37891a67-48a1-49dd-af5b-c4b989fcd6e2', 'ORD-521420', 0, 'valide', '2025-12-02T18:06:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('37ad4cc4-4e0f-47f4-983d-0024f111818d', 'ORD-521421', 0, 'valide', '2025-12-02T18:07:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b503068b-8e57-46e5-9836-ce70d9c881bf', 'ORD-521422', 0, 'valide', '2025-12-02T18:09:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('18e82683-0656-4f60-9b7d-36e9716d48aa', 'ORD-521423', 0, 'valide', '2025-12-02T18:32:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('254fd171-f13b-44fc-9bec-7f6803e7cb4f', 'ORD-521424', 0, 'valide', '2025-12-03T09:16:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('88f16061-75c1-4684-a033-25733e002432', 'ORD-521425', 0, 'valide', '2025-12-03T09:24:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3d0250e0-aabc-43c1-808f-8e41536c4885', 'ORD-521426', 0, 'valide', '2025-12-04T10:28:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8dbfb8ab-81d3-436c-a48b-7b3be70dc6f4', 'ORD-521427', 0, 'valide', '2025-12-04T14:23:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e178cf9e-e8b1-4c45-9ac5-b9286d81f416', 'ORD-521428', 0, 'valide', '2025-12-09T22:54:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6173311c-6c84-4622-b359-143de3952941', 'ORD-521429', 0, 'valide', '2025-12-09T22:55:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b3e36bdd-1ba8-4e45-8574-6d0adf86be5a', 'ORD-521430', 0, 'valide', '2025-12-09T22:56:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('25f277de-7c6f-45f2-8ace-d78cb9e92820', 'ORD-521431', 0, 'valide', '2025-12-09T22:57:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a1b0dee2-bf12-43f7-80c7-7ca6418a59a5', 'ORD-521432', 0, 'valide', '2025-12-09T22:58:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('64343bcf-3366-4c13-a0a4-ab67fa3c8542', 'ORD-521433', 0, 'valide', '2025-12-09T23:05:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9ed33a64-708b-423f-b2e9-dee64330e523', 'ORD-521434', 0, 'valide', '2025-12-09T23:06:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c90f147d-eaba-4285-aff7-8eba08597808', 'ORD-521435', 0, 'valide', '2025-12-09T23:09:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('74d3b128-9bfd-4ed0-9c4c-dd8eb7cbab1b', 'ORD-521436', 0, 'valide', '2025-12-11T07:09:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4b59467e-9b1d-4d5f-bd97-12057037d5bf', 'ORD-521437', 0, 'valide', '2025-12-11T07:10:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('296d8e9a-8d05-444d-8f89-20e45a194b1c', 'ORD-521438', 0, 'valide', '2025-12-11T07:11:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('04f6ebca-1ab5-40b8-b920-a614d9c1e107', 'ORD-521439', 0, 'valide', '2025-12-11T07:12:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b8a48875-d34a-4293-ada9-a9d754f62d99', 'ORD-521440', 0, 'valide', '2025-12-11T07:13:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ba5d61de-95f9-49e5-b20b-8eef8b80b19f', 'ORD-521441', 0, 'valide', '2025-12-11T07:15:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c2608223-67ad-4ab7-acf9-73909c59566c', 'ORD-521442', 0, 'valide', '2025-12-11T07:18:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('126e3585-00ca-479a-8667-5516899f8395', 'ORD-521443', 0, 'valide', '2025-12-11T07:20:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a18b3150-c1f7-4f12-8f40-e43fc5bbc485', 'ORD-521444', 0, 'valide', '2025-12-11T10:41:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8402aa37-fb0d-49a0-8ba9-ef282e6e1d3d', 'ORD-521445', 0, 'valide', '2025-12-11T10:45:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1285eb81-7d8a-45f3-93f2-54c33dbc2788', 'ORD-521446', 0, 'valide', '2025-12-11T11:07:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4165ed88-2908-40ac-9eda-a3b31825ed0d', 'ORD-521447', 0, 'valide', '2025-12-11T11:08:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eeba35d6-7036-428c-a2f4-3bfae35366f2', 'ORD-521448', 0, 'valide', '2025-12-11T11:10:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0d64c557-afe7-4fd5-8b39-9bd0a5f82afb', 'ORD-521449', 0, 'valide', '2025-12-11T11:13:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('27cc72b0-a5ea-4f51-a41d-8934a47a4377', 'ORD-521450', 0, 'valide', '2025-12-11T11:45:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c25819ac-18cc-4b95-b6fd-70cbad4031c2', 'ORD-521451', 0, 'valide', '2025-12-11T17:10:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e13a81d6-6240-43ac-88a2-4428f38d0cd6', 'ORD-521452', 0, 'valide', '2025-12-11T17:11:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('853977dc-b42c-4009-ab28-2e87f11ee80b', 'ORD-521453', 0, 'valide', '2025-12-11T17:12:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2190ed6f-86ca-4238-9167-162c3bd3d909', 'ORD-521454', 0, 'valide', '2025-12-11T17:13:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0eab993f-ca00-4089-b0bd-d103cebf82ef', 'ORD-521455', 0, 'valide', '2025-12-11T17:14:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d046d69e-6a03-4b53-b643-3e85c57832d9', 'ORD-521456', 0, 'valide', '2025-12-11T17:15:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dd623dd5-43e4-4fa6-9a09-fc6846b35995', 'ORD-521457', 0, 'valide', '2025-12-11T17:16:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a5f750b6-7035-48fd-8da7-1031466692f9', 'ORD-521458', 0, 'valide', '2025-12-11T17:27:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f68e3eba-90ae-49d0-a123-8aefe55afcbc', 'ORD-521459', 0, 'valide', '2025-12-11T17:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6d71c89f-729a-45bc-bd71-f410e4dda4f1', 'ORD-521460', 0, 'valide', '2025-12-11T17:41:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4bec024d-6df9-4e3b-b28f-3a4f229048cb', 'ORD-521461', 0, 'valide', '2025-12-11T17:42:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('87a61103-e1df-4994-94ee-4e523cf983cb', 'ORD-521462', 0, 'valide', '2025-12-11T17:46:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('88e20790-921c-45d1-b1c2-9c932120970e', 'ORD-521463', 0, 'valide', '2025-12-11T17:47:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7e8ec80d-8631-4868-aa80-6f3735f712b9', 'ORD-521464', 0, 'valide', '2025-12-11T17:48:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('dde45b58-d85f-4db5-9199-6ede7b71d6f3', 'ORD-521465', 0, 'valide', '2025-12-11T17:49:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('15769caf-3bda-4881-81ca-b77c7e993f97', 'ORD-521466', 0, 'valide', '2025-12-11T17:51:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d8755be7-59eb-47ea-a017-28590864d5f6', 'ORD-521467', 0, 'valide', '2025-12-11T17:52:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3041ea8c-4f16-4892-92e0-5858d92a860d', 'ORD-521468', 0, 'valide', '2025-12-11T17:54:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1fe06509-99ce-49bb-926a-31bd52c11539', 'ORD-521469', 0, 'valide', '2025-12-11T17:57:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7c620341-94da-45ee-9450-f3e3ed2df79b', 'ORD-521470', 0, 'valide', '2025-12-11T18:02:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7d5d05fd-d6d4-41ef-93af-fda719c04c72', 'ORD-521471', 0, 'valide', '2025-12-11T18:13:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d609a618-75cb-41ec-9a50-489dc0dfa222', 'ORD-521472', 0, 'valide', '2025-12-11T18:17:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e8697c6e-a450-4cd8-a164-7b4c0677ee87', 'ORD-521473', 0, 'valide', '2025-12-11T18:22:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('08bbf766-084a-4517-8bfb-f02dca16dc82', 'ORD-521474', 0, 'valide', '2025-12-11T18:23:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('12100c4e-5746-4636-8e06-5f1a60a84f03', 'ORD-521475', 0, 'valide', '2025-12-11T18:33:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d910dd29-d829-49aa-adb1-2d440574d49c', 'ORD-521476', 0, 'valide', '2025-12-11T18:33:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1eff7b4-851a-448f-9680-4815de24f455', 'ORD-521477', 0, 'valide', '2025-12-11T18:35:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7d28a61-6b21-425f-b664-80f424d773ce', 'ORD-521478', 0, 'valide', '2025-12-11T18:36:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('593eca24-2ee3-478b-bf97-d9eeb859c522', 'ORD-521479', 0, 'valide', '2025-12-11T18:38:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7d59c762-ef7b-4e81-a92c-3c9b1c48999a', 'ORD-521480', 0, 'valide', '2025-12-11T18:43:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('63b1d716-ab14-4993-adbb-f024fc78554c', 'ORD-521481', 0, 'valide', '2025-12-11T18:45:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('33603946-f777-47ec-8486-017b45430fe6', 'ORD-521482', 0, 'valide', '2025-12-11T18:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7a3a55b-4737-43d3-89dc-832f0f142e77', 'ORD-521483', 0, 'valide', '2025-12-12T14:27:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4c3e3484-80a8-49ea-a9fb-83f3740041f3', 'ORD-521484', 0, 'valide', '2025-12-12T14:29:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1c20d112-2dd2-432b-b82a-2e2540cdf2b8', 'ORD-521485', 0, 'valide', '2025-12-12T14:32:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3d3bddd8-09f0-4c3c-89f5-a2430f28c0c4', 'ORD-521486', 0, 'valide', '2025-12-12T14:38:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('82cebf01-6a20-4a65-8f6b-47203813ca43', 'ORD-521487', 0, 'valide', '2025-12-15T08:59:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4b7f2adc-5b3b-4819-ab3a-a0e200eedbb2', 'ORD-521488', 0, 'valide', '2025-12-15T09:02:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0d106194-2954-4788-ba0f-391df6876c3b', 'ORD-521489', 0, 'valide', '2025-12-15T09:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('33a3a289-8d9e-4fe4-b3e3-19bd2854a789', 'ORD-521490', 0, 'valide', '2025-12-15T09:13:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('41eb24f5-aa3a-446e-b533-f202796b1a9d', 'ORD-521491', 0, 'valide', '2025-12-15T09:15:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf1a999c-3243-41d1-a663-cfae192cac94', 'ORD-521492', 0, 'valide', '2025-12-15T09:18:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96ac933a-4fe1-41cc-9cd1-48cd099d4151', 'ORD-521493', 0, 'valide', '2025-12-15T09:20:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7722220f-941f-402d-b10b-8bf02587cbdb', 'ORD-521494', 0, 'valide', '2025-12-15T09:24:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a15eccbc-7972-4689-b63c-ef69215f913c', 'ORD-521495', 0, 'valide', '2025-12-15T09:25:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a46f19eb-e86e-40aa-859e-7f9a15ae1d37', 'ORD-521496', 0, 'valide', '2025-12-15T09:26:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9fd21a17-0ecb-4135-b505-ad077544c228', 'ORD-521497', 0, 'valide', '2025-12-15T09:31:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6359947e-4196-4011-a362-47ff678d685c', 'ORD-521498', 0, 'valide', '2025-12-15T09:32:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7b9f00cd-22d5-486d-8741-400872edf722', 'ORD-521499', 0, 'valide', '2025-12-15T09:35:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7f33dfce-d250-477b-a592-b36ccd56b72b', 'ORD-521500', 0, 'valide', '2025-12-15T09:41:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9be41014-2531-459e-802e-862d6861e65f', 'ORD-521501', 0, 'valide', '2025-12-15T09:42:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2de3015d-a29b-444b-8d8e-36fb8e66f4bf', 'ORD-521502', 0, 'valide', '2025-12-15T09:45:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('adf72a89-aabb-43cf-9968-a4734d44785f', 'ORD-521503', 0, 'valide', '2025-12-15T09:50:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b14b901-4db9-44b6-b0aa-05d52d92ec78', 'ORD-521504', 0, 'valide', '2025-12-15T09:52:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8e503733-01af-4729-bc15-e66d53d77e65', 'ORD-521505', 0, 'valide', '2025-12-15T09:57:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f13b4fa5-6c9a-4815-931d-07af9c099ff8', 'ORD-521506', 0, 'valide', '2025-12-15T09:58:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('301f073b-0d14-4a1c-b236-31037e6af8fc', 'ORD-531428', 0, 'valide', '2025-12-16T13:55:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('af576fd4-026a-4d9c-84cd-85a92377fcf1', 'ORD-531429', 0, 'valide', '2025-12-16T13:56:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('abaf054e-96b7-4204-af29-cb3ce2eb5140', 'ORD-531430', 0, 'valide', '2025-12-16T14:08:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('53ee82f6-d149-4ddc-8d41-1987274dae02', 'ORD-531431', 0, 'valide', '2025-12-16T14:09:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a491d69b-2b15-4da4-8f59-23a2b9984846', 'ORD-531432', 0, 'valide', '2025-12-16T17:52:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8112915d-299e-4bf0-9abb-e5eff825c0db', 'ORD-531433', 0, 'valide', '2025-12-16T17:55:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6e035b55-b398-4e1e-ad3c-8f7ecbd06d8c', 'ORD-531434', 0, 'valide', '2025-12-16T17:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ad711cf6-bc8a-4c6d-b5ee-dc53c287b4e9', 'ORD-531435', 0, 'valide', '2025-12-16T18:04:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('68cac138-701a-467c-a129-93e140255086', 'ORD-531436', 0, 'valide', '2025-12-16T18:06:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b74213ec-1e46-41b4-afef-f7f87beec35c', 'ORD-531437', 0, 'valide', '2025-12-16T18:07:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2b2028e6-fa29-4c41-8353-e85bdbce21a1', 'ORD-531438', 0, 'valide', '2025-12-16T18:08:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f6e6d2a5-e291-4b80-8c23-14080304408b', 'ORD-531439', 0, 'valide', '2025-12-22T16:31:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5622ed28-4eda-4bf1-b1d2-341f01a777fb', 'ORD-531440', 0, 'valide', '2025-12-22T16:32:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('614bc325-ab07-4ed1-9268-f2d873d5d996', 'ORD-531441', 0, 'valide', '2025-12-22T16:33:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d227d841-717a-4a65-bc05-96033c4857b5', 'ORD-531442', 0, 'valide', '2025-12-22T16:36:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d26a6a2e-354c-4ecb-a311-c83d16404eef', 'ORD-531443', 0, 'valide', '2025-12-22T16:36:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8a52db05-1748-46a9-b779-25acdb8b879c', 'ORD-531444', 0, 'valide', '2025-12-22T16:38:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('94a66996-da34-4bd0-a01a-7b6c5dfc5369', 'ORD-531445', 0, 'valide', '2025-12-22T16:40:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4172ac55-f5b5-4364-8b57-56fc83b390f0', 'ORD-531446', 0, 'valide', '2025-12-23T09:23:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('247c350d-240b-40fd-aadf-9ae83c3eae81', 'ORD-531447', 0, 'valide', '2025-12-23T09:24:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('5e71e43c-5db4-4b1b-b4e2-a932e716eb44', 'ORD-531448', 0, 'valide', '2025-12-23T10:03:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6ebf3a35-66cf-4ee3-8c58-ab86ea49b6d4', 'ORD-531449', 0, 'valide', '2025-12-23T10:04:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('38af0faf-0b13-4059-9e1b-f68d5b10b5f8', 'ORD-531450', 0, 'valide', '2025-12-23T10:05:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('af765cfc-932e-4eec-b9d4-aa3f6df09fb7', 'ORD-531451', 0, 'valide', '2025-12-23T14:56:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('92d487f5-8ca6-47f2-bb48-9260bd4008e9', 'ORD-531452', 0, 'valide', '2025-12-26T08:09:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6ac76a54-9c72-4b80-b74f-fc224485846e', 'ORD-531453', 0, 'valide', '2025-12-29T08:23:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2eccd4da-5cb3-47ba-9ee6-bb5899e3415f', 'ORD-531454', 0, 'valide', '2025-12-29T08:26:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('618c3d5e-905e-4287-bb69-560906fb55d8', 'ORD-531455', 0, 'valide', '2025-12-29T08:27:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('66a8298f-6321-4a86-a77a-a23bc096e7f4', 'ORD-531456', 0, 'valide', '2025-12-31T10:19:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3f4859a6-7f37-40bf-827b-35e7fdcd7cdf', 'ORD-531457', 0, 'valide', '2025-12-31T10:21:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ef45077e-63fb-4e8a-b918-df752135449b', 'ORD-531458', 0, 'valide', '2025-12-31T10:22:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71b5e778-0fb1-4e0f-9da3-0ca46d5bd94b', 'ORD-531459', 0, 'valide', '2026-01-05T11:11:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('02f14036-63dc-49b1-bd6f-2915974c4645', 'ORD-531460', 0, 'valide', '2026-01-05T11:13:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cbc34789-a504-4a0b-8c39-32e8475594ba', 'ORD-531461', 0, 'valide', '2026-01-05T11:14:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9721d48a-210d-41cf-a706-95468ff421f1', 'ORD-531462', 0, 'valide', '2026-01-05T11:16:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('402ddebb-9107-49c3-a500-59e1d8634a79', 'ORD-531463', 0, 'valide', '2026-01-05T11:17:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('da8b2aee-443f-40f9-871c-1a20e8dc5472', 'ORD-531464', 0, 'valide', '2026-01-05T11:18:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('20c8b185-aaca-45ed-b698-c59327986ecc', 'ORD-531465', 0, 'valide', '2026-01-05T11:21:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4ffaa4b7-0a93-40ac-8fb2-e8fda1b6ba45', 'ORD-531466', 0, 'valide', '2026-01-05T11:23:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cf3fb209-8ca8-43d1-ae35-785df3225f77', 'ORD-531467', 0, 'valide', '2026-01-05T11:25:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7bb1e03-0ffe-4439-aab5-3142ff239ca9', 'ORD-531468', 0, 'valide', '2026-01-08T15:32:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('251a541f-41c1-40f4-8ca8-efb8f39ec238', 'ORD-531469', 0, 'valide', '2026-01-09T10:32:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3ed76630-7526-4a78-91ed-9620160ed8ce', 'ORD-531470', 0, 'valide', '2026-01-09T10:41:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('92f38abc-f670-4f78-93e3-839f152cdbbd', 'ORD-531471', 0, 'valide', '2026-01-09T10:43:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('68ebf543-d49f-40ce-9def-1d5c372fe47c', 'ORD-531472', 0, 'valide', '2026-01-09T10:50:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9cf12943-54fe-402c-807d-1fa7e4c1ba2d', 'ORD-531473', 0, 'valide', '2026-01-09T10:55:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e1a80281-ff5b-49f8-9b06-c6a9f30f8c12', 'ORD-531474', 0, 'valide', '2026-01-09T10:59:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4e977ada-15f5-4adc-a91b-0dcab0cfae22', 'ORD-531475', 0, 'valide', '2026-01-09T11:01:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('00e149fb-b2ff-4479-84bc-632b37e0c439', 'ORD-531476', 0, 'valide', '2026-01-09T11:05:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d387cde8-9bf8-4fd9-944d-ed4ec6abfe12', 'ORD-531477', 0, 'valide', '2026-01-11T22:09:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8cd94afe-e888-4e35-9a98-a0eff486a2e2', 'ORD-531478', 0, 'valide', '2026-01-11T22:10:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8614b0a-18bd-40c6-bb94-6c20b7256973', 'ORD-531479', 0, 'valide', '2026-01-11T22:11:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('b2a3a9b0-2702-44de-9ccc-b0bb5c15ecc1', 'ORD-531480', 0, 'valide', '2026-01-12T07:59:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a99e4acd-08e4-4e90-b704-cd0ff88351c1', 'ORD-531481', 0, 'valide', '2026-01-12T18:07:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6ae04dd6-f0a8-49b8-a23b-fd8f56b2e704', 'ORD-531482', 0, 'valide', '2026-01-12T18:08:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fe9b1a48-561f-4e48-a49b-48daa5652cb7', 'ORD-531483', 0, 'valide', '2026-01-15T08:57:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('ba811446-da39-402c-8667-2b9dcfccc029', 'ORD-531484', 0, 'valide', '2026-01-15T08:58:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d0441bc3-6ac5-4bbb-bcf2-490694e14109', 'ORD-531485', 0, 'valide', '2026-01-15T09:00:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f9ca7bed-678e-421a-8f7c-7cb6cccd3d85', 'ORD-531486', 0, 'valide', '2026-01-15T09:00:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9636ccfb-3058-4baa-95e7-40fda43e4564', 'ORD-531487', 0, 'valide', '2026-01-15T09:01:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('eafeaddc-d369-49f8-ac4b-136a7c2ed47b', 'ORD-531488', 0, 'valide', '2026-01-15T09:05:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bd1480b9-a03e-4761-b081-c150ed2def62', 'ORD-531489', 0, 'valide', '2026-01-15T09:06:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7266333c-e442-4f03-8a27-c185011e0d67', 'ORD-531490', 0, 'valide', '2026-01-15T11:09:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('fe4dfa63-c250-4380-8947-2cf369b32ee9', 'ORD-531491', 0, 'valide', '2026-01-15T11:09:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('581c50cb-e1f0-4f5c-a53a-db6038655849', 'ORD-531492', 0, 'valide', '2026-01-15T11:10:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1cba993a-4e7f-4d3c-acb4-3e400cb99cc3', 'ORD-531493', 0, 'valide', '2026-01-15T11:11:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('746100af-965b-4d02-8561-a194e3549980', 'ORD-531494', 0, 'valide', '2026-01-15T11:12:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('73c9c018-4405-4c19-82e1-b54089a77d33', 'ORD-531495', 0, 'valide', '2026-01-15T11:13:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e000b645-2e09-4834-a70f-9abf6a030103', 'ORD-531496', 0, 'valide', '2026-01-15T11:13:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('cee0d18e-8ef8-42b7-9538-1952a7ffc93b', 'ORD-531497', 0, 'valide', '2026-01-15T11:14:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f53d4c6d-6b45-4943-8602-40fe1959e70c', 'ORD-531498', 0, 'valide', '2026-01-15T11:15:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9daf111d-2e1e-4ba6-8cfb-43649ab74e9c', 'ORD-531499', 0, 'valide', '2026-01-15T11:16:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f8aa27b2-4bee-45cd-9a6f-7c1ae5d7e87d', 'ORD-531500', 0, 'valide', '2026-01-15T11:16:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f92ad910-b36a-4a64-b778-d7e2f7a4b45a', 'ORD-531501', 0, 'valide', '2026-01-15T11:17:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('870e3692-2f39-4b88-b943-4edcb6517847', 'ORD-531502', 0, 'valide', '2026-01-15T11:18:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('81759eff-032c-4e04-b087-f38f5d144d44', 'ORD-531503', 0, 'valide', '2026-01-15T11:19:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a9671d9b-ca6f-4d39-b051-8353c5ee2d87', 'ORD-531504', 0, 'valide', '2026-01-15T11:22:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('67c83fb7-5ac0-4c72-b16d-798f0ce45e59', 'ORD-531505', 0, 'valide', '2026-01-15T11:23:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('add0d4f8-20f1-4c35-a530-72d61e073fb0', 'ORD-531506', 0, 'valide', '2026-01-15T11:38:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0cb39ea4-d817-4699-8b94-0126da8e8577', 'ORD-531507', 0, 'valide', '2026-01-15T11:39:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f25d3064-5e79-4089-a76c-06fa7a2a5593', 'ORD-531508', 0, 'valide', '2026-01-15T11:40:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0b513b44-3747-4369-8ae8-b58c0221b311', 'ORD-531509', 0, 'valide', '2026-01-15T11:40:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6504145c-72e3-4af1-b392-f514b690fefd', 'ORD-531510', 0, 'valide', '2026-01-15T11:41:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c9d4a4f0-eeb9-4cd3-95d1-7f9583151779', 'ORD-531511', 0, 'valide', '2026-01-15T11:42:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('80bf1ba7-fbde-438b-9205-d6ec10f48877', 'ORD-531512', 0, 'valide', '2026-01-15T11:43:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('4619b2f4-55be-44c0-9bb3-0938ff29b43b', 'ORD-531513', 0, 'valide', '2026-01-15T11:43:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71e434af-6127-4fa5-bdcf-d7069114b7ab', 'ORD-531514', 0, 'valide', '2026-01-15T11:44:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('864159dd-271d-4ce4-8bbf-552325358fb0', 'ORD-531515', 0, 'valide', '2026-01-15T11:45:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96c5568f-877e-4e05-b1bb-723fd1f9340c', 'ORD-531516', 0, 'valide', '2026-01-15T11:46:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0fafb911-00c6-4a22-a28e-763b9f100f9e', 'ORD-531517', 0, 'valide', '2026-01-15T11:47:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a8b4915-6860-4be0-8e53-8fff9fb0b0de', 'ORD-531518', 0, 'valide', '2026-01-18T11:07:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2c6f50a9-675f-4191-b040-5476163c4c85', 'ORD-531519', 0, 'valide', '2026-01-18T11:08:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7bf078f0-f807-4636-8da8-d479568e0f11', 'ORD-531520', 0, 'valide', '2026-01-18T11:09:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('2c76740a-6e82-48c2-86c3-4d0fbf0954c7', 'ORD-531521', 0, 'valide', '2026-01-18T11:09:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('146b012f-a9db-4bec-9886-508620e42748', 'ORD-531522', 0, 'valide', '2026-01-18T11:10:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('c7f57832-e4cb-4b99-a625-f0d557bc9c4d', 'ORD-531523', 0, 'valide', '2026-01-18T11:11:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('7000f3cb-adff-4843-8667-f8d5d2b4e297', 'ORD-531524', 0, 'valide', '2026-01-18T11:12:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('83045d8e-bf4b-4fd4-acdc-858700309689', 'ORD-531525', 0, 'valide', '2026-01-18T11:12:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f0d2e9c5-5ad9-4a5f-821b-54132d2e6fc9', 'ORD-531526', 0, 'valide', '2026-01-18T11:13:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('96afe840-d091-47ef-ab75-f004eb2479f5', 'ORD-531527', 0, 'valide', '2026-01-18T11:14:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bc0be4b8-96de-41d0-87ba-29774839a007', 'ORD-531528', 0, 'valide', '2026-01-18T11:14:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9783a8ed-17e1-4309-b962-d5472891fb51', 'ORD-531529', 0, 'valide', '2026-01-18T11:15:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('3522026b-0f09-43b6-aac9-0a3dcde1bb1c', 'ORD-531530', 0, 'valide', '2026-01-18T11:16:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9a437de7-cbc0-4537-9813-0b28cb4cd601', 'ORD-531531', 0, 'valide', '2026-01-18T11:16:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('edc99678-06a3-489d-ad59-768d91cd3bbe', 'ORD-531532', 0, 'valide', '2026-01-18T11:17:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('a8623736-2c98-4e4c-93b3-6dfd57d3752d', 'ORD-531533', 0, 'valide', '2026-01-18T11:17:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('044b00f8-0c71-41e7-9eb8-770770d9c9ee', 'ORD-531534', 0, 'valide', '2026-01-21T12:30:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('033bb1b0-78bb-451a-8760-52b501d516a8', 'ORD-531535', 0, 'valide', '2026-01-21T12:31:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('9409f8e9-0719-4ce0-a307-09005dda20bf', 'ORD-531536', 0, 'valide', '2026-01-21T12:32:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bfb9f29d-a2ff-4481-92c5-4bc8dd05e285', 'ORD-531537', 0, 'valide', '2026-01-25T08:26:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('52be18bb-f312-449b-b2d7-492ab7260d12', 'ORD-531538', 0, 'valide', '2026-01-25T08:27:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('1f76fc45-b1fc-4159-a6f9-f9b1ad62a1b0', 'ORD-531539', 0, 'valide', '2026-01-25T08:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d162f4a3-be4e-4be5-9f5d-ed4675c14ea2', 'ORD-531540', 0, 'valide', '2026-01-25T08:29:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('69bdc5cf-7d1f-4987-9da1-732231819d9e', 'ORD-531541', 0, 'valide', '2026-01-25T08:30:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e7d8ca76-eda8-4089-b698-a3dffa50a9f9', 'ORD-531542', 0, 'valide', '2026-01-25T08:30:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('0840a911-de5f-4dc9-9da8-a9664217dbcb', 'ORD-531543', 0, 'valide', '2026-01-25T08:31:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('6691fd75-8d0f-4e0a-908d-0f0c1e8fb6cb', 'ORD-531544', 0, 'valide', '2026-01-25T08:32:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('d24ef9e7-a841-4774-9594-c51d2da777b7', 'ORD-531545', 0, 'valide', '2026-01-25T08:33:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('54164d7e-daef-4edf-8d02-06649b0f8ab9', 'ORD-531546', 0, 'valide', '2026-01-25T08:33:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('f93304c5-e0c3-413c-a19e-0e0d0ff43495', 'ORD-531547', 0, 'valide', '2026-01-27T11:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('71149b86-279c-4a85-819b-6dda426b2573', 'ORD-531548', 0, 'valide', '2026-01-31T14:13:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('762525fc-0f3b-4e61-83ff-320b28b7b827', 'ORD-531549', 0, 'valide', '2026-01-31T14:14:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('e3e0162c-c9b5-49d9-9d37-59fd4a9ceb1c', 'ORD-531550', 0, 'valide', '2026-02-03T12:11:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('31e5cbb6-0203-45d6-a8d5-b8a8cd7b1b29', 'ORD-531551', 0, 'valide', '2026-02-03T12:12:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('837db196-0146-412a-b95f-b0d7aa42fd95', 'ORD-531552', 0, 'valide', '2026-02-04T11:49:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('8dd204ec-4aca-41a4-8fe3-62738f6d65c7', 'ORD-531553', 0, 'valide', '2026-02-04T11:50:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('bc86b380-c487-4334-9ad7-982668de1011', 'ORD-531554', 0, 'valide', '2026-02-04T11:51:35')
ON CONFLICT (reference) DO NOTHING;
