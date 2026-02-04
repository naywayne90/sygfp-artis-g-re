-- Migration des liquidations
-- Source: Liquidation (ancien SYGFP)
-- Destination: budget_liquidations (nouveau SYGFP)


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e78f467c-fa5a-41fd-a3a3-98e40d38edd7', 'ARTI201250009', 0, 'valide', '2025-01-23T20:24:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1b61401-e77d-4eef-b9d1-39fa058d6a28', 'ARTI201250015', 0, 'valide', '2025-01-23T20:25:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('59a13418-5a3d-4eaf-a0b3-c7e424e4f9c6', 'ARTI201250016', 0, 'valide', '2025-01-23T20:25:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('104411a4-0ced-430b-97a6-df52092a2adb', 'ARTI201250028', 0, 'valide', '2025-01-31T07:00:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a8979d5e-08f7-42a8-b022-3da22273375c', 'ARTI201250029', 0, 'valide', '2025-01-31T07:01:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d8c2e8d-d925-4145-9920-351031908dba', 'ARTI201250031', 0, 'valide', '2025-01-31T07:01:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8b8ac86c-80ac-4633-a7c9-41bb26586eb6', 'ARTI201250010', 0, 'valide', '2025-01-31T07:37:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('82fed482-8584-4e49-9b58-569a96183600', 'ARTI201250021', 0, 'valide', '2025-01-31T07:38:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('98b53a49-f641-4ad3-be6a-5dabcc796b95', 'ARTI201250025', 0, 'valide', '2025-01-31T07:39:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8bbe7599-ad34-46d5-a3aa-d9fca5e636d6', 'ARTI201250039', 0, 'valide', '2025-02-03T09:07:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('73d08344-8c79-449e-a193-154396191896', 'ARTI201250039', 0, 'brouillon', '2025-02-03T09:07:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b9972e62-36c6-4cd5-9121-798f03656f37', 'ARTI201250040', 0, 'valide', '2025-02-03T09:08:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a2ee112e-5499-4389-adf0-ad5b98e1f78a', 'ARTI201250040', 0, 'brouillon', '2025-02-03T09:08:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('add173a6-8a0c-4e15-964f-83133fac2ebc', 'ARTI201250041', 0, 'valide', '2025-02-03T09:08:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b87e3522-a922-47e7-8719-13ba6142c96a', 'ARTI201250041', 0, 'brouillon', '2025-02-03T09:08:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('70f9df47-5365-4cec-bb81-472d172e0155', 'ARTI201250030', 0, 'valide', '2025-02-03T09:09:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d7e35b29-039c-49e1-99ab-a55f663bf936', 'ARTI201250030', 0, 'brouillon', '2025-02-03T09:09:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f4861e59-90fb-42cd-9ab8-8b00d8dca1b3', 'ARTI201250027', 0, 'valide', '2025-02-03T09:09:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dd247d25-1ce7-4f7c-84fe-f169f5375d92', 'ARTI201250027', 0, 'brouillon', '2025-02-03T09:09:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3ca7d77b-24aa-4b9c-ac23-ba2ae7ca222e', 'ARTI201250034', 0, 'valide', '2025-02-03T09:09:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('173069ca-9fcc-4092-bddb-c0f52f8a0068', 'ARTI201250034', 0, 'valide', '2025-02-03T09:09:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bbe0f792-b28a-4a31-b83d-e32cb53a81ab', 'ARTI201250035', 0, 'valide', '2025-02-03T09:10:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aa16f784-bb92-4113-94e5-cffeefff4b82', 'ARTI201250035', 0, 'valide', '2025-02-03T09:10:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0312ac3d-e224-4db7-a66d-ab008371c393', 'ARTI201250036', 0, 'valide', '2025-02-03T09:10:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fef4cf42-5f19-4515-b47d-c92bce88af69', 'ARTI201250036', 0, 'valide', '2025-02-03T09:10:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4573ea28-efaa-4d1b-a32f-227302b7b22f', 'ARTI201250037', 0, 'valide', '2025-02-03T09:10:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d5a92ef6-314a-48d4-bd2c-217dd7330dc0', 'ARTI201250037', 0, 'valide', '2025-02-03T09:11:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('63bd48f3-5f0a-44da-ada1-8c5aceffae04', 'ARTI201250020', 0, 'valide', '2025-02-03T09:11:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('294e7749-33c2-4912-aaa5-7e88c8b94741', 'ARTI201250020', 0, 'valide', '2025-02-03T09:11:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('810136b6-65b5-4540-b6bb-82d372472122', 'ARTI201250022', 0, 'valide', '2025-02-03T09:11:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('38a49378-b86b-4679-aff3-ac6b47f0e242', 'ARTI201250022', 0, 'brouillon', '2025-02-03T09:11:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c73ea6b6-0fa2-4f4c-a608-6015e125a8e0', 'ARTI201250006', 0, 'valide', '2025-02-03T09:12:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('012032ad-b538-49e0-af0f-9fd3f3f8ad35', 'ARTI201250006', 0, 'brouillon', '2025-02-03T09:12:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('221143fc-e0b8-479e-81d8-253359e2807f', 'ARTI201250017', 0, 'brouillon', '2025-02-03T09:13:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b5303d77-71dc-4107-a6d3-f274caa9f07d', 'ARTI201250017', 0, 'valide', '2025-02-03T09:13:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('91d3a0ea-c32c-4506-8f88-a499b6d6e15a', 'ARTI201250004', 0, 'valide', '2025-02-03T09:13:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('837b5d59-1be7-412a-8586-3f9c3e436413', 'ARTI201250004', 0, 'valide', '2025-02-03T09:13:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('16b89d18-f768-48f1-835d-9f6ebf5d43e3', 'ARTI201250048', 0, 'valide', '2025-02-12T14:22:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2c646c0d-c1b6-4ed6-bf10-d4769371cddd', 'ARTI201250002', 0, 'valide', '2025-02-12T14:23:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('601ce424-31ba-4cb0-ada9-a306875973ae', 'ARTI201250043', 0, 'valide', '2025-02-12T16:39:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4b54afa8-863c-425e-9a47-bc64e4f9c0a3', 'ARTI201250049', 0, 'valide', '2025-02-12T16:39:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae289e8f-da4a-40f6-a65b-f581495d0e63', 'ARTI203250005', 0, 'valide', '2025-03-26T04:50:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c27693d3-1c81-4ae8-8c06-b38618e351c6', 'ARTI203250007', 0, 'valide', '2025-03-26T04:51:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('450fafac-3cfb-4b74-be0e-6347dbb3adf1', 'ARTI203250008', 0, 'valide', '2025-03-26T04:51:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ab0cca70-03d8-4778-8940-164dc4e3decf', 'ARTI203250009', 0, 'valide', '2025-03-26T04:52:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a08e8594-c3f8-422c-99ef-83e8f0ff1e53', 'ARTI203250002', 0, 'valide', '2025-03-26T04:52:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1c615995-b963-43cf-a257-bc395e81a6e6', 'ARTI203250003', 0, 'valide', '2025-03-26T04:53:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('df342021-9e0c-4885-96e8-d06e414c26a1', 'ARTI203250001', 0, 'valide', '2025-03-26T04:53:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ef68d24-648b-4194-97cd-26e9308ad785', 'ARTI203250004', 0, 'valide', '2025-03-26T04:54:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a31fbbdc-cb9b-4796-bf11-ec035b7bf0d5', 'ARTI202250010', 0, 'valide', '2025-03-26T04:54:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4f452cbb-44d5-4767-b515-df479001eea8', 'ARTI202250011', 0, 'valide', '2025-03-26T04:54:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2564b984-3a09-49d4-badd-e57a96a1ba6f', 'ARTI203250006', 0, 'valide', '2025-04-02T19:46:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0b8777cf-31d3-4542-9dbb-bdb4c27b38e6', 'ARTI202250009', 0, 'valide', '2025-04-02T19:46:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('531a377e-62c7-481b-a30e-b156c908e140', 'ARTI202250001', 0, 'valide', '2025-04-02T19:47:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('404015bc-fa9a-477a-ba1f-863f4b2571e9', 'ARTI202250007', 0, 'valide', '2025-04-03T08:54:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7edc8f8c-8dea-469c-9410-ba19623c24ce', 'ARTI202250003', 0, 'valide', '2025-04-03T08:55:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('14e1c7a6-c6b9-4f50-8a0f-9580ea6f6fbd', 'ARTI202250002', 0, 'valide', '2025-04-03T08:55:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4f6a90d-791f-494a-aeda-f017259969cb', 'ARTI201250047', 0, 'valide', '2025-04-03T08:56:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('436063b0-a9ea-4bd2-80db-8ae21cbb1cf5', 'ARTI202250006', 0, 'valide', '2025-04-03T08:56:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('52f5db1a-af2f-4e72-b886-35c8222576e6', 'ARTI202250005', 0, 'valide', '2025-04-03T08:56:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a2d3e793-3979-427c-8e12-321b3f0c9cb8', 'ARTI202250008', 0, 'valide', '2025-04-03T08:57:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1d69d3e-3dc8-4871-bd53-7b5e1f2d2e9b', 'ARTI201250024', 0, 'valide', '2025-04-03T08:57:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6b782fd1-c437-4e68-b008-e7a32355bacc', 'ARTI201250005', 0, 'valide', '2025-04-03T08:58:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e29163ca-2649-4976-b2ca-ee693f598156', 'ARTI201250042', 0, 'valide', '2025-04-03T08:58:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('31de0e65-134e-4795-af73-b70bb7e4f962', 'ARTI201250044', 0, 'valide', '2025-04-03T08:59:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2e9d283-88ab-4c96-9d8a-4c74e7030244', 'ARTI201250046', 0, 'valide', '2025-04-03T08:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('27c3334e-4607-4eb4-8904-cc63e53a6b73', 'ARTI201250026', 0, 'valide', '2025-04-03T09:00:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3f7a054e-9dcc-41ec-a8bb-658f6e9c9106', 'ARTI201250032', 0, 'valide', '2025-04-03T09:00:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('feb62c60-4047-44d5-902e-8477c310561d', 'ARTI201250045', 0, 'valide', '2025-04-03T09:01:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('25ce7c02-f659-4b2e-80b9-c8378518ce0e', 'ARTI201250081', 0, 'valide', '2025-04-03T09:01:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8fb6196f-06c3-4de5-8bf5-adcf4b9a166c', 'ARTI201250033', 0, 'valide', '2025-04-03T09:02:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef20a289-70e5-4f73-a226-5674c0fdbbf0', 'ARTI201250001', 0, 'valide', '2025-04-03T09:02:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('53b6fe2e-5402-4b0e-aa03-20d3f599093e', 'ARTI201250019', 0, 'valide', '2025-04-03T09:03:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6546be61-c1c2-4f7b-a7a8-2dca60cc25b6', 'ARTI201250012', 0, 'valide', '2025-04-03T09:03:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e698e57e-147f-417e-90a5-d7f14c9bf2b4', 'ARTI201250011', 0, 'valide', '2025-04-03T09:03:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('87fdd469-e774-48af-a80b-df0e287ed43b', 'ARTI201250003', 0, 'valide', '2025-04-03T09:04:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2943515d-e5fe-45e9-882c-ed5375fbc79c', 'ARTI201250008', 0, 'valide', '2025-04-03T09:04:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('10c73683-87a9-42d4-9e98-4ecc17a5bba0', 'ARTI201250007', 0, 'valide', '2025-04-03T09:05:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b76bf63b-947f-4c9a-b86a-5e3da1fa8801', 'ARTI203250011', 0, 'valide', '2025-04-09T07:09:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c4356387-9f82-4369-8af8-f52f4382d5b8', 'ARTI202250004', 0, 'valide', '2025-04-09T07:09:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30986dae-3395-4900-b424-d5ebb107cfd0', 'ARTI201250014', 0, 'valide', '2025-04-09T07:10:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5952f46e-d178-42ac-9dd5-9ec118e000d4', 'ARTI204250004', 0, 'valide', '2025-04-09T17:45:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('072e4af7-b0fa-4258-a2b3-3109ee461f71', 'ARTI204250005', 0, 'valide', '2025-04-09T17:45:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5b860ea2-7ab3-4f4d-ad19-51808148e23d', 'ARTI204250010', 0, 'valide', '2025-04-09T17:46:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7a57ed9-9813-4a7c-85f8-1751d374cbb2', 'ARTI204250012', 0, 'valide', '2025-04-09T17:46:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('12331232-677b-4677-a287-f2cb92976d0a', 'ARTI204250015', 0, 'valide', '2025-04-09T17:46:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7ddedc3c-0cf6-4779-a8ac-08459cfb54c3', 'ARTI204250016', 0, 'valide', '2025-04-09T17:47:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6068f660-fb28-4139-b328-26722fe397b5', 'ARTI204250017', 0, 'valide', '2025-04-09T17:47:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('04e21adf-33e4-4f43-a91f-8690d695a67b', 'ARTI204250086', 0, 'valide', '2025-04-09T17:48:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67b15869-0db7-43b6-a640-aa0943300dc0', 'ARTI204250090', 0, 'valide', '2025-04-09T17:48:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('97b66338-2893-4adc-9fca-4bf4ca2d06cb', 'ARTI204250003', 0, 'valide', '2025-04-09T21:06:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a45fa21-f729-4469-8c15-0ef46f6fe1e4', 'ARTI204250095', 0, 'valide', '2025-04-09T21:06:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('86130775-eadd-4507-bd9f-c01f4d077892', 'ARTI203250013', 0, 'valide', '2025-04-09T21:07:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('55f74f1e-83aa-4f12-982c-b6090d5375c7', 'ARTI204250146', 0, 'valide', '2025-04-11T13:57:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fe6fa078-2aef-4cf2-9e56-b61263060f99', 'ARTI204250109', 0, 'valide', '2025-04-11T13:57:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d03e9ebb-c631-4f0f-b12c-ab0cd42299b8', 'ARTI204250167', 0, 'valide', '2025-04-11T13:57:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bb3da80a-2504-45f0-9d5a-190e7002e1d1', 'ARTI204250107', 0, 'valide', '2025-04-11T13:58:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d99fefd-34d3-453b-b5bb-00b15ceb85c4', 'ARTI204250162', 0, 'valide', '2025-04-12T05:26:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2ed5b8a5-826e-434c-bdfd-f98e98911021', 'ARTI204250108', 0, 'valide', '2025-04-12T05:27:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('030d368f-2e44-4245-9df3-e88a2f98b725', 'ARTI204250006', 0, 'valide', '2025-04-12T05:27:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4514d0a2-47cb-4184-b446-8f9431d0933c', 'ARTI204250177', 0, 'valide', '2025-04-14T08:21:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('73d8fae4-aab8-49da-87c6-3b0c5ca63d39', 'ARTI204250187', 0, 'valide', '2025-04-14T08:56:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6028362b-5ea6-41dd-9bbc-4ae7c1142fff', 'ARTI204250207', 0, 'valide', '2025-04-14T08:57:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57003b4c-33a3-44ca-9de5-de1e66c4255a', 'ARTI204250210', 0, 'valide', '2025-04-14T09:01:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3719a8dc-e3c0-4a63-907d-9e18f28967cd', 'ARTI204250165', 0, 'valide', '2025-04-14T09:02:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('04e31796-76cb-455e-89f6-f39bfed1edc2', 'ARTI204250132', 0, 'valide', '2025-04-14T09:05:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('024e027a-4928-4be2-bd82-8358d12a418e', 'ARTI204250133', 0, 'valide', '2025-04-14T09:06:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('31eb20d6-d967-454e-a9d1-6e46226f6158', 'ARTI204250134', 0, 'valide', '2025-04-14T09:07:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6863c202-7b46-4351-9fcd-a9638c783a00', 'ARTI204250125', 0, 'valide', '2025-04-14T09:10:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('13e5c329-e599-4df3-83da-a589ec61155b', 'ARTI204250025', 0, 'valide', '2025-04-14T09:10:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8cad5cc9-dee2-4465-bd3a-3b1e6cdec5b0', 'ARTI204250241', 0, 'valide', '2025-04-16T22:45:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3de5d17b-17c5-4810-aa31-264392826f52', 'ARTI204250244', 0, 'valide', '2025-04-16T22:46:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1699243a-e468-47bc-893d-dabdb5f221b0', 'ARTI204250245', 0, 'valide', '2025-04-16T22:46:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('161ab579-4ce4-4fde-a6b3-5795e5959afd', 'ARTI204250247', 0, 'valide', '2025-04-16T22:47:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3853fa45-223d-454b-a48b-fbe2230e22e2', 'ARTI204250249', 0, 'valide', '2025-04-16T22:47:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('189c74bb-e25d-4e35-a07a-eb229c939bf4', 'ARTI204250221', 0, 'valide', '2025-04-16T22:48:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('736e84aa-7591-46c2-938c-dd4ac7e80cf0', 'ARTI204250222', 0, 'valide', '2025-04-16T22:48:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6ac4e4b4-92b5-450c-ab8d-748032f36e33', 'ARTI204250223', 0, 'valide', '2025-04-16T22:49:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('480d760a-c523-4509-99f7-281faaf766ac', 'ARTI204250171', 0, 'valide', '2025-04-16T22:50:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c2cb957-4463-412b-aba5-470f42249cd7', 'ARTI204250173', 0, 'valide', '2025-04-16T22:50:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b767a158-381f-4c11-b71e-76a196227f82', 'ARTI204250179', 0, 'valide', '2025-04-16T22:50:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bb274350-52e1-4dfd-a4b3-bfc64926a743', 'ARTI204250180', 0, 'valide', '2025-04-16T22:51:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3380cff0-413b-4578-8d3e-7cc26a8ac7a6', 'ARTI204250184', 0, 'valide', '2025-04-16T22:51:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68745339-cda7-4d96-a077-8571bed30ca9', 'ARTI204250190', 0, 'valide', '2025-04-16T22:52:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8c8e0f8d-a1f6-4e18-b08c-9636862253eb', 'ARTI204250192', 0, 'valide', '2025-04-16T22:52:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('43b7a027-d37d-4c87-ab08-233de51beba7', 'ARTI204250193', 0, 'valide', '2025-04-16T22:52:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7416a277-f172-456f-8fde-6153be4fbe08', 'ARTI204250194', 0, 'valide', '2025-04-16T22:53:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d578ba57-42ab-40f8-9584-e28f4b201a59', 'ARTI204250195', 0, 'valide', '2025-04-16T22:53:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1e01100-e2ad-4b9c-a8f5-f386ed4a14f4', 'ARTI204250196', 0, 'valide', '2025-04-16T22:54:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e66beee2-15e4-453d-b4db-4c26dc7f9855', 'ARTI204250199', 0, 'valide', '2025-04-16T22:54:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5807086d-be00-4e00-b583-0b0abbe8c706', 'ARTI204250200', 0, 'valide', '2025-04-16T22:54:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a2f0c2f2-bb2f-4ee2-86e4-23cc4acc0fec', 'ARTI204250202', 0, 'valide', '2025-04-16T22:55:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3b94c3b0-4a05-42d5-9cb6-121d208779fd', 'ARTI204250203', 0, 'valide', '2025-04-16T22:55:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('338b1669-c4f8-4b36-a36f-fbf161eccc23', 'ARTI204250204', 0, 'valide', '2025-04-16T22:56:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b318b808-d01b-46f2-ae6e-7c2d46a393bd', 'ARTI204250206', 0, 'valide', '2025-04-16T22:56:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('28f308c2-fa17-4d6c-a783-08eef68ba793', 'ARTI204250215', 0, 'valide', '2025-04-16T22:57:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5fd0ee78-9b5d-458e-bace-b3fe580ed483', 'ARTI204250147', 0, 'valide', '2025-04-16T22:57:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('574c1df2-b2c6-4254-b18b-4a79636fa742', 'ARTI204250141', 0, 'valide', '2025-04-16T22:57:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a9c86a07-3f00-47e9-a586-25263cb2034f', 'ARTI204250148', 0, 'valide', '2025-04-16T22:58:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('81a0df73-9ffe-447c-9ad9-c45119fca25d', 'ARTI204250149', 0, 'valide', '2025-04-16T22:58:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('528a8d98-2b9d-441d-a344-9c7a00829676', 'ARTI204250150', 0, 'valide', '2025-04-16T22:58:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9bb2f44c-9dd2-4a68-b4ae-3359b0560c2a', 'ARTI204250156', 0, 'valide', '2025-04-16T22:59:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('269c159e-2b33-47c4-ac37-7c9561c5d9cd', 'ARTI204250158', 0, 'valide', '2025-04-16T22:59:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f1e1e002-0c27-4cb7-a782-95066dc3e827', 'ARTI204250110', 0, 'valide', '2025-04-16T23:00:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dfbef4eb-08ef-45fd-9ee7-c1fbb6601c5b', 'ARTI204250111', 0, 'valide', '2025-04-16T23:00:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6d2cac6-2ebe-4616-8b6d-64d0d8729763', 'ARTI204250114', 0, 'valide', '2025-04-16T23:00:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72fc9694-0f5a-4796-b100-18960335518d', 'ARTI204250117', 0, 'valide', '2025-04-16T23:01:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('76203e21-ac11-4c75-8c2d-c0d845684773', 'ARTI204250118', 0, 'valide', '2025-04-16T23:01:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8c4f5ab4-659e-4577-b395-d1ca995a7892', 'ARTI204250119', 0, 'valide', '2025-04-16T23:02:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('659de879-2352-44eb-b8f3-e3194a999dee', 'ARTI204250120', 0, 'valide', '2025-04-16T23:02:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c99dcbe5-44f9-45a8-98dd-8b6c7015f5ce', 'ARTI204250121', 0, 'valide', '2025-04-16T23:02:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('818d2b5a-0b31-4b19-a5fd-ca16f9b27b84', 'ARTI204250122', 0, 'valide', '2025-04-16T23:03:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5e07437d-30c2-4dbc-805f-fc8f9b1899bf', 'ARTI204250001', 0, 'valide', '2025-04-16T23:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('956246bb-b5d0-43e6-bc9a-c627f0bf28ec', 'ARTI204250002', 0, 'valide', '2025-04-16T23:04:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ffa6942-e189-4e33-b1cb-1f426afb8d93', 'ARTI204250019', 0, 'valide', '2025-04-16T23:04:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d615ca5-7e21-4696-a79a-b22fa42ce200', 'ARTI204250047', 0, 'valide', '2025-04-16T23:04:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f5e86687-b132-4639-a33f-cf8732076d89', 'ARTI204250066', 0, 'valide', '2025-04-16T23:05:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b5f621d9-d396-4586-aee3-73677fd26b42', 'ARTI204250068', 0, 'valide', '2025-04-16T23:05:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7180344c-7c33-48b6-a585-f8de3cc2f9fc', 'ARTI204250069', 0, 'valide', '2025-04-16T23:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d64c1f8-a41f-4a31-b4cc-c37d1b96d974', 'ARTI204250072', 0, 'valide', '2025-04-16T23:06:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('01bc5787-91e6-4537-bf30-bb44471bea79', 'ARTI204250075', 0, 'valide', '2025-04-16T23:06:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7357cbd-b543-4934-b5d1-2cd828dd6124', 'ARTI204250076', 0, 'valide', '2025-04-16T23:07:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e458ed9d-ad87-4da3-af6f-1dedcf99ed89', 'ARTI204250077', 0, 'valide', '2025-04-16T23:07:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('983aa26b-56e2-46ae-a329-ce877105ac05', 'ARTI204250078', 0, 'valide', '2025-04-16T23:07:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a579a4f4-0304-4c56-a46c-dacf8770698b', 'ARTI204250098', 0, 'valide', '2025-04-16T23:08:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('39d7da22-20a1-4ffe-99da-558e2d8b211b', 'ARTI204250099', 0, 'valide', '2025-04-16T23:08:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ca62c273-2a61-4584-8221-7a15735e5ca0', 'ARTI204250100', 0, 'valide', '2025-04-16T23:08:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a27ccbab-07f6-4f8a-8cd6-642516f283b6', 'ARTI204250101', 0, 'valide', '2025-04-16T23:09:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1ef2aa09-1395-4033-b1b5-b5c9549e2638', 'ARTI204250102', 0, 'valide', '2025-04-16T23:10:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cc5400ed-9803-4c70-bee1-63b26b1099d1', 'ARTI204250103', 0, 'valide', '2025-04-16T23:10:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c304d0de-acb7-471f-8bad-b90f40f6f736', 'ARTI201250038', 0, 'valide', '2025-04-16T23:10:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d61c5438-795b-4aad-afda-81d53a61ce20', 'ARTI204250238', 0, 'valide', '2025-04-17T07:42:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b5652d46-d6ae-494d-af36-5062580ac1ef', 'ARTI204250239', 0, 'valide', '2025-04-17T07:42:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b856a2f2-5a55-440d-afd6-ef25062c8803', 'ARTI204250240', 0, 'valide', '2025-04-17T07:43:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a80351da-2caf-4042-bc4e-f90a04723557', 'ARTI204250183', 0, 'valide', '2025-04-17T13:46:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1da6b13a-4b75-4f83-a4c3-136b94c9d99f', 'ARTI204250275', 0, 'valide', '2025-04-22T16:45:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c8f8afc3-50bb-4cd3-8bb2-6d5147af1d68', 'ARTI204250018', 0, 'valide', '2025-04-22T16:46:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('622b2afc-7c90-40b1-8f0c-aa091b1d7635', 'ARTI204250276', 0, 'valide', '2025-04-24T08:27:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0e8175b0-33f1-4728-8f44-750f83ff492f', 'ARTI204250277', 0, 'valide', '2025-04-24T08:28:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a007c16c-cfb7-4aee-892a-d472c0a7625d', 'ARTI204250278', 0, 'valide', '2025-04-24T08:28:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('93fb86e3-d046-4c3e-a5f5-4621b4a82ebd', 'ARTI204250279', 0, 'valide', '2025-04-24T08:29:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f32f816e-2f61-4d29-a7e0-a5e00312013c', 'ARTI204250255', 0, 'valide', '2025-04-24T08:29:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f6c29d2c-017f-401c-83b1-0951fd548327', 'ARTI204250256', 0, 'valide', '2025-04-24T08:29:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1af19de8-1137-4ddc-a68b-9483631bff0d', 'ARTI204250250', 0, 'valide', '2025-04-24T08:30:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('63c7d2b4-39cf-4b4b-a080-7c023c3b7d93', 'ARTI204250144', 0, 'valide', '2025-04-24T08:31:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8db40f56-b940-4912-bfcc-1d4456304c74', 'ARTI204250112', 0, 'valide', '2025-04-24T08:31:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c7c1d46c-1dde-45f8-992c-5b3fae4a923e', 'ARTI204250105', 0, 'valide', '2025-04-24T08:32:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b44591fd-50ab-4d7f-8abe-ffc1198724e0', 'ARTI204250094', 0, 'valide', '2025-04-24T08:37:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('14cca210-f170-436c-b925-c124937d72a8', 'ARTI204250157', 0, 'valide', '2025-04-24T08:37:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('15170ef2-a244-41cb-b82c-a98b6f71e93d', 'ARTI204250145', 0, 'valide', '2025-04-24T08:38:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('951611b6-836f-4763-b18f-c3068fba2ac3', 'ARTI204250280', 0, 'valide', '2025-04-28T05:16:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3cb252bd-d8e2-4997-afd6-59bdf412ce17', 'ARTI204250281', 0, 'valide', '2025-04-28T05:17:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3dd71937-ed02-4936-942d-a3a6fa21bf9f', 'ARTI204250261', 0, 'valide', '2025-04-28T05:17:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('281f357a-3f95-477b-9ede-4f9f5fb3c794', 'ARTI204250263', 0, 'valide', '2025-04-28T05:18:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ff11e360-de3f-49e1-bc78-d5584d61b0a1', 'ARTI204250265', 0, 'valide', '2025-04-28T05:19:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d8f3096a-2f34-49bd-8014-ec4ee13650b7', 'ARTI204250267', 0, 'valide', '2025-04-28T05:19:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b0ad2f7b-65a5-4011-b2c3-8d9d62eec64b', 'ARTI204250270', 0, 'valide', '2025-04-28T05:20:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e14c3b5b-27a4-485d-96b7-d1ae34b85373', 'ARTI204250271', 0, 'valide', '2025-04-28T05:21:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('90bfee72-061a-4fd3-a393-3bff4820ba92', 'ARTI204250272', 0, 'valide', '2025-04-28T05:21:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1531da40-dd99-46bb-a404-b787994c8b22', 'ARTI204250274', 0, 'valide', '2025-04-28T05:22:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1bfb38c-fded-4c66-b87d-9bbddc81d9c0', 'ARTI204250254', 0, 'valide', '2025-04-28T05:23:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('90be62b8-354f-48a5-971f-34f7de4fb7ed', 'ARTI204250257', 0, 'valide', '2025-04-28T05:23:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('14df8290-9187-474c-9674-08a757e2424a', 'ARTI204250258', 0, 'valide', '2025-04-28T05:24:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c566589a-8f96-4851-982c-bfff2c33c301', 'ARTI204250260', 0, 'valide', '2025-04-28T05:24:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a693e6b-b724-45a4-b69a-c813b56117f9', 'ARTI204250226', 0, 'valide', '2025-04-28T05:25:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('29bff70c-7d75-4231-9f49-37ea4d9c5918', 'ARTI204250227', 0, 'valide', '2025-04-28T05:25:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ccd360a8-36f4-4749-894e-42428e073ad3', 'ARTI204250228', 0, 'valide', '2025-04-28T05:26:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f7ba1cdb-35a1-458b-80c0-dd1ba3fdf8d1', 'ARTI204250229', 0, 'valide', '2025-04-28T05:27:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02a8f16a-a120-4e5e-98ea-1c25c5fd9be0', 'ARTI204250231', 0, 'valide', '2025-04-28T05:27:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aea8aafb-f9ab-4b45-b88c-1f8c79368cd9', 'ARTI204250232', 0, 'valide', '2025-04-28T05:28:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9448f12b-ac4b-4911-8179-cbf1b0ac519c', 'ARTI204250233', 0, 'valide', '2025-04-28T05:29:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9494d0dc-9ed3-4359-93f6-ad4ccada0923', 'ARTI204250234', 0, 'valide', '2025-04-28T05:30:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6b559589-e125-4f4e-be65-a9deb99a5add', 'ARTI204250235', 0, 'valide', '2025-04-28T05:31:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('39ea4a96-bd9d-4d28-9eab-e3976d0a297c', 'ARTI204250237', 0, 'valide', '2025-04-28T05:31:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('520cbb3c-1793-400c-8c6a-a6a185b3192a', 'ARTI204250174', 0, 'valide', '2025-04-28T05:32:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('49cd8169-f296-4d2c-9781-e4cec48c8e60', 'ARTI204250176', 0, 'valide', '2025-04-28T05:32:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2650eec8-759d-492d-bc29-97553f548b8a', 'ARTI204250185', 0, 'valide', '2025-04-28T05:33:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d32a7a4e-6be8-463c-87ad-306006632fce', 'ARTI204250136', 0, 'valide', '2025-04-28T05:34:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dbd9902c-0930-49e0-b449-4f0ee1dcbdef', 'ARTI204250139', 0, 'valide', '2025-04-28T05:34:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d64ad52f-b366-4412-a2d4-db04128f3147', 'ARTI204250124', 0, 'valide', '2025-04-28T05:35:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('638bd37e-b675-417d-a286-1c2bcd121306', 'ARTI204250021', 0, 'valide', '2025-04-28T05:35:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1d94b21-b7ae-4592-9180-3a562ba5d46b', 'ARTI204250028', 0, 'valide', '2025-04-28T05:36:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cd1020ac-9bd6-4284-a138-653c20df6e3b', 'ARTI204250031', 0, 'valide', '2025-04-28T05:39:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('de4ab1cf-120e-4a5f-bcc7-f8c17882b7c9', 'ARTI204250035', 0, 'valide', '2025-04-28T05:40:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b9d5b088-026b-445b-87a5-05853ef99d4f', 'ARTI204250036', 0, 'valide', '2025-04-28T05:41:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a669a45-4202-4010-a8cb-10db92d4350a', 'ARTI204250037', 0, 'valide', '2025-04-28T05:42:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4a27473a-7ae4-4c71-96ac-ff9c606bdc19', 'ARTI204250042', 0, 'valide', '2025-04-28T05:42:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1ec92a1-a244-4cf9-896c-e03ac89a549f', 'ARTI204250045', 0, 'valide', '2025-04-28T05:44:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67731546-424c-4b5f-a6cc-5f8d0225bdd5', 'ARTI204250045', 0, 'valide', '2025-04-28T05:44:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9db50bf1-e4a3-43b6-b6f8-228f5f071a6a', 'ARTI204250050', 0, 'valide', '2025-04-28T05:45:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a888fbee-1858-4e74-a545-438e96d18536', 'ARTI204250051', 0, 'valide', '2025-04-28T05:45:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5d28a49d-9f6c-4294-a07a-09e9ffbe5912', 'ARTI204250052', 0, 'valide', '2025-04-28T05:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3eb8948d-2627-4e68-98ec-0814335b4373', 'ARTI204250053', 0, 'valide', '2025-04-28T05:46:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4835b772-376b-41c1-93b1-39d3c9382bea', 'ARTI204250055', 0, 'valide', '2025-04-28T05:47:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('657e1169-21e2-4ce8-873b-5666d3e7277d', 'ARTI204250064', 0, 'valide', '2025-04-28T05:48:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('96653bc5-45d3-48de-be30-63e47f5d2f4e', 'ARTI204250088', 0, 'valide', '2025-04-28T05:49:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8556d7a6-18ce-4363-a11e-aaa5ba0c3bfb', 'ARTI204250104', 0, 'valide', '2025-04-28T05:50:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d80d7621-9e7b-477b-a3e3-1148e5fbf338', 'ARTI204250283', 0, 'valide', '2025-04-29T17:08:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51fa48ef-a0a7-42a1-bd1e-a870cbf86d59', 'ARTI204250284', 0, 'valide', '2025-04-29T17:08:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1231ca36-f832-4355-897f-2b65360da1e7', 'ARTI204250287', 0, 'valide', '2025-04-29T17:09:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dbe8a8b3-33aa-4adb-9c92-fe9313af520b', 'ARTI204250248', 0, 'valide', '2025-04-29T17:09:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a0b62e7-6b70-4f42-a06e-68960fe59fe3', 'ARTI204250209', 0, 'valide', '2025-04-29T17:10:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('60449d84-85b7-4224-b319-ce4d4cca229f', 'ARTI204250131', 0, 'valide', '2025-04-29T17:11:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('56228fd8-27fd-48b8-8ce1-8c0349838976', 'ARTI204250123', 0, 'valide', '2025-04-29T17:11:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1dbd5b8f-7044-44a9-ad5d-f07a7b2dad1b', 'ARTI204250123', 0, 'valide', '2025-04-29T17:11:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b75504aa-85f2-46a4-b4fa-308ed78b4652', 'ARTI204250008', 0, 'valide', '2025-04-29T17:12:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7f4dba45-012c-4699-9f24-bd6a51a24b06', 'ARTI204250024', 0, 'valide', '2025-04-29T17:13:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('27d9450c-faa0-4afc-a809-3c6b9976df93', 'ARTI204250026', 0, 'valide', '2025-04-29T17:13:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d2c93d29-9287-4bc7-808e-dad05b80e610', 'ARTI204250027', 0, 'valide', '2025-04-29T17:14:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e961e679-869f-42f7-b369-735356967fcf', 'ARTI204250041', 0, 'valide', '2025-04-29T17:15:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b47026ae-7ac6-4809-8b25-b314a92c2624', 'ARTI204250057', 0, 'valide', '2025-04-29T17:16:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('43719de7-db3a-45b9-9826-3fd26a0c2c93', 'ARTI204250056', 0, 'valide', '2025-04-29T17:16:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bf4a5d9d-cedb-419a-ad8e-b42deebcea7f', 'ARTI204250067', 0, 'valide', '2025-04-29T17:16:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('43141edc-7331-4659-a212-03b899575ad7', 'ARTI204250073', 0, 'valide', '2025-04-29T17:17:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b7c9dff3-0a1b-4dd7-afa4-2d6fa7f1456d', 'ARTI204250074', 0, 'valide', '2025-04-29T17:17:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2bddb5da-be76-4268-a914-3bf569f81ea8', 'ARTI204250292', 0, 'valide', '2025-04-30T22:31:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('463e5dfb-9835-4126-a083-51afeff634f0', 'ARTI204250295', 0, 'valide', '2025-04-30T22:31:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4885fe36-53e4-4c45-99ad-85cd60a0f2d2', 'ARTI204250013', 0, 'valide', '2025-04-30T22:32:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2f81a4e1-2624-411a-b2e9-7fa078fd05d0', 'ARTI204250290', 0, 'valide', '2025-05-01T19:24:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b26c7ca3-c97d-49c8-8460-3f22ce405f76', 'ARTI204250290', 0, 'valide', '2025-05-01T19:24:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9f9cd926-8f35-4db2-b9bd-ff779aee5269', 'ARTI204250302', 0, 'valide', '2025-05-01T19:25:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ff98ecc9-d2e3-416f-be75-feed09b8e15d', 'ARTI204250309', 0, 'valide', '2025-05-02T18:14:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e6e5e272-a475-4e84-9cb5-fb86c4727374', 'ARTI204250315', 0, 'valide', '2025-05-02T18:14:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('777a5551-c046-4f0c-b01f-7b1137e88d9d', 'ARTI204250316', 0, 'valide', '2025-05-02T18:15:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('837b8f2f-df49-4b14-98e2-1e2240b9b461', 'ARTI204250317', 0, 'valide', '2025-05-02T18:15:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('60ef8f72-9fdd-4cba-837f-e81f693d8ca5', 'ARTI204250318', 0, 'valide', '2025-05-02T18:16:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('48c45fd9-7b88-4d88-ac40-e5a0f7724e81', 'ARTI204250319', 0, 'valide', '2025-05-02T18:16:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f8688d29-446d-48fc-ae05-31aa16663b6c', 'ARTI204250320', 0, 'valide', '2025-05-02T18:17:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0ef22bd9-4b19-4498-a963-2ff17337d2e8', 'ARTI204250296', 0, 'valide', '2025-05-02T18:17:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d4a08301-ec29-4884-86b1-b27bdc8fc399', 'ARTI204250218', 0, 'valide', '2025-05-02T18:17:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ccd15cba-ad14-440e-bfc4-68e2e0804336', 'ARTI204250093', 0, 'valide', '2025-05-02T18:18:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('777d6b54-41e8-4055-8271-5cd88bf5b471', 'ARTI204250305', 0, 'valide', '2025-05-02T19:28:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4beb0632-b248-4aac-bf30-7a11e303c0d8', 'ARTI204250311', 0, 'valide', '2025-05-02T19:28:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e94b46a0-dfc8-447f-96a4-5da8c13f76dc', 'ARTI204250314', 0, 'valide', '2025-05-02T19:29:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('96b6ec4b-1b53-46e7-b2b0-4f9190df4be1', 'ARTI204250321', 0, 'valide', '2025-05-02T19:30:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('23dc67f0-a87c-47b7-b9f0-026bd79b1d5c', 'ARTI204250326', 0, 'valide', '2025-05-02T19:31:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c15c7bd-3b78-414f-baf8-36ff20004ef1', 'ARTI204250298', 0, 'valide', '2025-05-02T19:31:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e88b37b7-65a5-4e35-9b05-9b7a8b3f0506', 'ARTI204250303', 0, 'valide', '2025-05-02T19:31:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f5c223b7-5b10-45c4-953c-1f077eb16c9b', 'ARTI204250189', 0, 'valide', '2025-05-02T21:29:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6a49992a-a73f-44a6-973a-b90f0781dada', 'ARTI204250293', 0, 'valide', '2025-05-04T17:30:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ee237f8e-6be1-466c-bfb7-8925e2344002', 'ARTI204250029', 0, 'valide', '2025-05-04T17:30:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('958abaf8-f69b-4c96-b7bd-7fc8997ac12c', 'ARTI205250001', 0, 'valide', '2025-05-05T08:30:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fb6438e5-7b4a-4eb8-94de-902d304d02ec', 'ARTI205250010', 0, 'valide', '2025-05-05T12:03:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6d2d2a85-c930-4634-9bd9-18050c0b788f', 'ARTI204250304', 0, 'valide', '2025-05-05T12:04:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('92f4604c-b585-4f6b-bb7d-cedaef596ac1', 'ARTI205250011', 0, 'valide', '2025-05-06T06:14:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4dd17d57-9a1b-486c-98d0-1109e6632c86', 'ARTI205250009', 0, 'valide', '2025-05-06T06:15:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('69dee6d3-a354-443c-89e8-7671e7e0589f', 'ARTI205250005', 0, 'valide', '2025-05-06T17:09:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b086de3d-0a70-4c77-971c-8a9dcd7750a5', 'ARTI205250006', 0, 'valide', '2025-05-06T17:10:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bad02760-38ff-4227-83d0-a6adfe860934', 'ARTI205250007', 0, 'valide', '2025-05-06T17:10:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8631172c-d211-4065-bf62-0bd2c052f547', 'ARTI205250002', 0, 'valide', '2025-05-06T17:11:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('db4b9906-6774-423b-8257-a56185903003', 'ARTI205250003', 0, 'valide', '2025-05-06T17:11:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('076a2759-2ba9-47ed-98d8-4795616b86c7', 'ARTI204250307', 0, 'valide', '2025-05-06T17:12:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9f4a6bb0-bf3d-439a-8d64-7aefc8375856', 'ARTI204250310', 0, 'valide', '2025-05-06T17:12:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d646edac-2e0f-499f-9af7-7513ed1091ea', 'ARTI205250004', 0, 'valide', '2025-05-07T15:20:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4bb4aced-453e-43de-b2f3-0cd23549be58', 'ARTI205250012', 0, 'valide', '2025-05-07T22:54:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2197c63c-4ebd-4794-9a11-af464cbf7b93', 'ARTI205250008', 0, 'valide', '2025-05-07T22:55:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('537a5789-9c15-45a5-b8c1-c05f2931c504', 'ARTI204250129', 0, 'valide', '2025-05-07T22:55:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8fc418cf-93d0-47d4-ab73-6892d4f03e59', 'ARTI204250322', 0, 'valide', '2025-05-09T06:58:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c27f2235-b08e-446f-948e-bd5d07196b6a', 'ARTI204250175', 0, 'valide', '2025-05-09T06:59:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cce7f974-afbb-49db-8d40-c252d6eb1b40', 'ARTI204250213', 0, 'valide', '2025-05-09T06:59:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72bc94da-bcd1-435a-940f-5cd21d509ee2', 'ARTI204250216', 0, 'valide', '2025-05-09T06:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c80ce8d3-85a8-4be6-aa3f-4bf4d171cd31', 'ARTI204250137', 0, 'valide', '2025-05-09T07:00:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5bb5df35-cc37-4e49-aaea-41ea2409939d', 'ARTI204250089', 0, 'valide', '2025-05-09T07:01:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c89b2e6-20ba-4478-b479-f09f806ecd59', 'ARTI205250014', 0, 'valide', '2025-05-10T22:54:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('13dbfffe-8f1d-4047-b3ea-5e464ebd33a0', 'ARTI205250023', 0, 'valide', '2025-05-10T22:55:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('986b6b27-4cb1-4ca7-ac85-c03791f4532f', 'ARTI205250027', 0, 'valide', '2025-05-10T22:56:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a6556c9-7695-4f73-9ee2-a91f5c0e8711', 'ARTI205250016', 0, 'valide', '2025-05-11T23:41:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e0a8aa9f-2075-48f2-a8e4-864580bfe23a', 'ARTI205250020', 0, 'valide', '2025-05-11T23:41:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ab31bb25-b6c6-49b1-af6b-58c383e44a8f', 'ARTI205250022', 0, 'valide', '2025-05-11T23:42:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3272252f-07cb-46cd-960d-667391b80e1a', 'ARTI205250026', 0, 'valide', '2025-05-11T23:42:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6b119e6c-3e6a-4753-9fca-3d1b39912f93', 'ARTI205250028', 0, 'valide', '2025-05-11T23:43:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d17f9497-1e55-4169-a24e-9f838f8c16cc', 'ARTI205250034', 0, 'valide', '2025-05-11T23:44:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('559e25f7-dca6-4579-b05f-3ebefb0c6828', 'ARTI204250312', 0, 'valide', '2025-05-11T23:44:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('84835d59-03d0-4b76-b43c-96a232091167', 'ARTI204250300', 0, 'valide', '2025-05-11T23:44:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('39855612-09a0-4319-9d3b-4d69af6c7f42', 'ARTI204250264', 0, 'valide', '2025-05-11T23:45:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('36d4225d-f87c-4916-a5c9-72ba5279922c', 'ARTI204250236', 0, 'valide', '2025-05-11T23:45:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('58f1b2f7-d961-406a-a54e-37cde83337ef', 'ARTI204250211', 0, 'valide', '2025-05-11T23:46:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('944fb5b6-7117-4e63-aa0b-8dbd0fb68262', 'ARTI204250151', 0, 'valide', '2025-05-11T23:46:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('74c49d1f-5e5a-42af-8e95-60c387df5971', 'ARTI204250154', 0, 'valide', '2025-05-11T23:46:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4a348be4-1379-47d3-9aa3-02ec400aeea0', 'ARTI204250155', 0, 'valide', '2025-05-11T23:47:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('631b00ba-ae2a-4869-9876-a49f255e597b', 'ARTI204250014', 0, 'valide', '2025-05-11T23:47:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('62240b6d-0452-41f7-8664-6107ac68fef0', 'ARTI204250032', 0, 'valide', '2025-05-11T23:47:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2aa3e77a-d2aa-4deb-a001-849584be3b7e', 'ARTI204250033', 0, 'valide', '2025-05-11T23:48:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51c4edf1-1a41-4b59-8eae-0a7d51037401', 'ARTI204250034', 0, 'valide', '2025-05-11T23:48:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72ca060f-cf7c-4df6-a739-5e46b7d99082', 'ARTI204250039', 0, 'valide', '2025-05-11T23:48:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7483e06-bf64-4d2e-8147-111706c1d18a', 'ARTI204250044', 0, 'valide', '2025-05-11T23:49:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('441c9cce-883d-4dce-863d-3f3f21147824', 'ARTI204250048', 0, 'valide', '2025-05-11T23:49:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9bc91073-ce7b-46c8-8cbb-2b594c38d768', 'ARTI204250049', 0, 'valide', '2025-05-11T23:50:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e862fa08-f585-4886-9648-8464a7334872', 'ARTI204250063', 0, 'valide', '2025-05-11T23:50:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5507e733-3e46-491f-8872-83d3f33cc0f7', 'ARTI204250081', 0, 'valide', '2025-05-11T23:50:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7c7b9cf5-12e2-47f2-a63d-b4ccf7491e30', 'ARTI204250082', 0, 'valide', '2025-05-11T23:51:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f294fba7-ce26-459c-9503-41c2cba9ec24', 'ARTI204250085', 0, 'valide', '2025-05-11T23:51:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c794f08-12e4-4991-a6a3-313a521099f3', 'ARTI204250087', 0, 'valide', '2025-05-11T23:52:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ded3247a-3c7f-4422-90a7-5bc08d5a7545', 'ARTI205250030', 0, 'valide', '2025-05-12T15:54:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fc55a6b3-e027-4272-989e-0ff5055e9a0b', 'ARTI205250049', 0, 'valide', '2025-05-12T19:47:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b32b54a5-999f-4825-aa11-02438f9ffac8', 'ARTI205250038', 0, 'valide', '2025-05-12T19:47:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3859923f-09b1-422c-80b3-9e2e627c9c74', 'ARTI205250077', 0, 'valide', '2025-05-13T19:03:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3cee5c31-1ed0-4bae-bcdc-495395bf7c9e', 'ARTI205250075', 0, 'valide', '2025-05-13T19:03:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61655893-62d6-4bce-8820-3405cffff535', 'ARTI205250061', 0, 'valide', '2025-05-13T19:04:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6699d17-6db5-4624-9d07-8752590653f1', 'ARTI205250062', 0, 'valide', '2025-05-13T19:05:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ebe0f94e-c57a-4d96-aa79-70ee48d6aa64', 'ARTI205250063', 0, 'valide', '2025-05-13T19:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('75ab8627-b384-4d73-bef7-d22800e02bcb', 'ARTI205250064', 0, 'valide', '2025-05-13T19:06:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6839e6c4-2611-49d2-8270-b48c2b7a8d24', 'ARTI205250065', 0, 'valide', '2025-05-13T19:06:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('709354c0-33f6-418d-ad4c-4c202de60ca4', 'ARTI205250066', 0, 'valide', '2025-05-13T19:07:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3b5e700-c832-420b-bd44-155dd015fd6e', 'ARTI205250067', 0, 'valide', '2025-05-13T19:07:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c3ef29dd-0a31-49dc-849c-3573f821639b', 'ARTI205250068', 0, 'valide', '2025-05-13T19:08:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('276fb312-8cf8-4a19-b252-40162bb0ed9c', 'ARTI205250069', 0, 'valide', '2025-05-13T19:08:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('116081c7-bed1-4077-a6d1-1ffa6a571205', 'ARTI205250073', 0, 'valide', '2025-05-13T19:09:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('249d2bc1-0451-4336-9a0d-2a56054cba2f', 'ARTI205250074', 0, 'valide', '2025-05-13T19:24:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ed232623-1c87-4862-85f2-c1ee531f1f6b', 'ARTI205250053', 0, 'valide', '2025-05-13T19:24:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cee9f7c5-e716-4c0e-83c2-45bc9b0658db', 'ARTI205250055', 0, 'valide', '2025-05-13T19:27:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('07f4375a-4e21-4136-aa6c-6f5fec636a86', 'ARTI205250056', 0, 'valide', '2025-05-13T19:28:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fc7973ca-8e21-4e19-b333-ec5832eaf377', 'ARTI205250054', 0, 'valide', '2025-05-13T19:28:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3ed5f51-ce36-4c82-bf0c-17d95b7c896f', 'ARTI205250057', 0, 'valide', '2025-05-13T19:29:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f265aa9f-0f3b-44c0-8add-5a5ca4e8e9cf', 'ARTI205250058', 0, 'valide', '2025-05-13T19:29:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('690875f2-92a1-44b5-8750-f140b051623d', 'ARTI205250059', 0, 'valide', '2025-05-13T19:30:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5b44fcda-6b5b-4c2f-b4bf-a42e922426ee', 'ARTI205250046', 0, 'valide', '2025-05-13T19:31:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e5693754-17cd-4824-a059-bcca788f250b', 'ARTI205250047', 0, 'valide', '2025-05-13T19:31:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ac7d4eb4-bde1-41c6-b868-174446c5db58', 'ARTI205250052', 0, 'valide', '2025-05-13T19:32:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8b08e824-10ef-4a9b-8bfa-b9d6608cb8fb', 'ARTI205250048', 0, 'valide', '2025-05-13T19:33:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('54d90eb9-510f-4086-a530-a1d34af36c58', 'ARTI205250041', 0, 'valide', '2025-05-13T19:33:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aeb36797-12e9-4c25-8ab7-69f8fbb483c0', 'ARTI205250043', 0, 'valide', '2025-05-13T19:34:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('50553cce-b1dc-4f14-ae76-c0ec5a0617ab', 'ARTI205250044', 0, 'valide', '2025-05-13T19:35:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e2b327f4-7fc5-4df0-970e-9a13e054e53b', 'ARTI205250045', 0, 'valide', '2025-05-13T19:36:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ffa345ea-e96f-4c4d-b33b-3417b3aa5c2a', 'ARTI205250045', 0, 'valide', '2025-05-13T19:36:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a71a4749-85e9-4474-8d36-c6bca588df99', 'ARTI205250037', 0, 'valide', '2025-05-13T19:37:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bdfd3e8f-ec8c-4cdd-8159-93b7a41f1073', 'ARTI205250031', 0, 'valide', '2025-05-13T19:37:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c0ce1632-c3b6-4256-8b82-f44c5b935644', 'ARTI204250308', 0, 'brouillon', '2025-05-13T19:38:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a8cf3eb-e19a-4917-be2f-e5a89ba48729', 'ARTI204250308', 0, 'valide', '2025-05-13T19:39:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bbba87ba-d922-4c7b-800d-2ec2226038b6', 'ARTI204250327', 0, 'valide', '2025-05-13T19:40:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ee01433-e3f3-4144-af41-1d6191eb6403', 'ARTI204250294', 0, 'valide', '2025-05-13T19:41:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0ba390d5-f9ac-46ac-bb15-6a998f97a5fc', 'ARTI204250178', 0, 'valide', '2025-05-13T19:46:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('354a55ea-cd02-4dbf-882e-e046317bea82', 'ARTI204250178', 0, 'valide', '2025-05-13T19:47:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e242421b-1ccd-4311-a262-e3af2f3e8cc9', 'ARTI205250040', 0, 'valide', '2025-05-13T19:56:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3b722e26-2613-41e7-b183-1defe166e51e', 'ARTI204250313', 0, 'valide', '2025-05-13T19:57:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b8251b4-eab4-4d4a-8569-e46715cb98d1', 'ARTI204250191', 0, 'valide', '2025-05-14T05:02:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1da3aea3-e905-4261-9bf3-5e3659fbba7c', 'ARTI204250023', 0, 'valide', '2025-05-14T05:09:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5e77f511-6290-4d7e-9cc0-3793553cb7ae', 'ARTI204250197', 0, 'valide', '2025-05-14T07:11:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72771815-718d-4304-89bb-0ffd804f47e7', 'ARTI204250011', 0, 'valide', '2025-05-14T08:28:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('32888d52-6d86-4e75-953d-61a0fce6f8e1', 'ARTI205250080', 0, 'valide', '2025-05-14T16:53:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02bb6897-4fcc-4c19-893f-55fcd26d0d07', 'ARTI205250081', 0, 'valide', '2025-05-14T16:53:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7272051a-cb11-4180-bc65-52606535173b', 'ARTI205250082', 0, 'valide', '2025-05-14T16:54:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7c0f995f-3f3f-4620-8967-d5cb1ab3c55f', 'ARTI205250083', 0, 'valide', '2025-05-14T16:55:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0216ec63-4897-4651-b697-a4d0e5056211', 'ARTI205250085', 0, 'valide', '2025-05-14T16:56:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3fb31f09-59c1-4317-9b36-7bea0837e9a3', 'ARTI205250086', 0, 'valide', '2025-05-14T16:56:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a12e50a3-b087-4c98-93e0-c2bf07092a04', 'ARTI205250091', 0, 'valide', '2025-05-14T16:57:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9779cdb0-e043-4a9e-942b-d1660121c0a0', 'ARTI205250092', 0, 'valide', '2025-05-14T16:57:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c3889c0b-2440-46b2-b5e3-ce3818ec169f', 'ARTI205250093', 0, 'valide', '2025-05-14T16:57:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e45a4db6-e7de-4cd3-a383-c7222cf668ad', 'ARTI205250095', 0, 'valide', '2025-05-14T16:58:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c5815dc3-c624-4764-9923-c18d2a026349', 'ARTI205250098', 0, 'valide', '2025-05-14T16:59:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f8d22d2b-cdb4-4291-863f-c777cfe5506c', 'ARTI205250079', 0, 'valide', '2025-05-14T17:00:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bf076de5-712a-4130-8753-b0080f7e8e7e', 'ARTI205250100', 0, 'valide', '2025-05-14T17:01:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c4d504b1-022e-4c42-b0d0-b33734f21385', 'ARTI205250078', 0, 'valide', '2025-05-14T17:18:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a20f2eae-fd72-4e35-a9ae-924b5117853f', 'ARTI205250102', 0, 'valide', '2025-05-14T17:19:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c2aee3ce-bdc4-43b2-9f66-d5fc4d6364c8', 'ARTI205250101', 0, 'valide', '2025-05-14T17:21:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9cc2441f-6a49-404e-b4b1-a08ce244cec3', 'ARTI205250105', 0, 'valide', '2025-05-14T17:21:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('48f5353c-83df-486f-9efe-6b298328beb1', 'ARTI205250106', 0, 'valide', '2025-05-14T17:22:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b8113989-35aa-4229-8862-ad73ffafc3bb', 'ARTI205250103', 0, 'valide', '2025-05-14T17:23:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('11c4e704-0934-4340-bc76-136b18018d2b', 'ARTI205250096', 0, 'valide', '2025-05-14T20:01:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a52720fd-1800-4cb1-ac02-fdadc9afeb87', 'ARTI204250289', 0, 'valide', '2025-05-14T20:01:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('217d23d4-153f-4d99-b73d-53aca3721b76', 'ARTI204250071', 0, 'valide', '2025-05-14T20:02:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7ddd821-0955-4145-abbf-336b386661a6', 'ARTI204250058', 0, 'valide', '2025-05-14T20:03:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a3d36158-c73d-46af-82e8-ef627ae2ffec', 'ARTI204250079', 0, 'valide', '2025-05-14T20:03:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4cbacd8d-5a4f-4ba8-ad2a-1a2814ba14bc', 'ARTI205250110', 0, 'valide', '2025-05-15T09:23:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9e1307ea-b22b-4bbe-b6cb-0b671302dd88', 'ARTI205250110', 0, 'valide', '2025-05-15T09:23:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('66acff1e-1067-444c-8896-04ab9772a4d6', 'ARTI205250115', 0, 'valide', '2025-05-15T09:23:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b137f77a-5c3f-4889-9e3f-fdb6f25b579e', 'ARTI205250116', 0, 'valide', '2025-05-15T09:24:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e307fdfa-c812-4933-b0a3-1d7d16505815', 'ARTI205250117', 0, 'valide', '2025-05-15T09:25:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5b52c28b-b746-401a-abe7-a2902db2f36d', 'ARTI205250118', 0, 'valide', '2025-05-15T09:25:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('afcc6679-e388-4b0c-9cc3-d8ac6f499dfc', 'ARTI205250123', 0, 'valide', '2025-05-15T09:26:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('94bdce36-512f-4751-8180-2eeb707ac78a', 'ARTI205250124', 0, 'valide', '2025-05-15T09:27:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57b8b244-4a9e-4d23-97bd-c44da30265e2', 'ARTI205250125', 0, 'valide', '2025-05-15T09:28:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cb9b5416-d6d7-42bd-b8e1-020a00aa1036', 'ARTI205250127', 0, 'valide', '2025-05-15T09:29:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61f8cb56-9c20-4ebf-8f86-6c79ce07df04', 'ARTI205250128', 0, 'valide', '2025-05-15T09:32:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('28a43e11-6400-45a2-a910-e99e39017800', 'ARTI205250108', 0, 'valide', '2025-05-15T09:33:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3e968459-4288-434c-a2a7-907dfffe9705', 'ARTI205250071', 0, 'valide', '2025-05-15T10:31:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0cdf8bc9-d070-40b3-848d-bcb796c2718e', 'ARTI205250032', 0, 'valide', '2025-05-15T10:31:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('39dec95e-417c-44b7-be59-01016298000d', 'ARTI205250112', 0, 'valide', '2025-05-16T09:34:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ed5acdb8-951f-474f-939f-eaa908eef380', 'ARTI205250113', 0, 'valide', '2025-05-16T09:34:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fde63443-1657-42a5-b51e-d2dcf11f69d1', 'ARTI205250119', 0, 'valide', '2025-05-16T09:37:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d286d4f8-a1d6-479b-a603-628ac3b74e9d', 'ARTI205250120', 0, 'valide', '2025-05-16T09:38:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fa93ec52-2edd-442c-8ab7-b1f30dc6a8d0', 'ARTI205250121', 0, 'valide', '2025-05-16T09:38:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9956e100-eb27-4595-94e6-745cb9cbff61', 'ARTI205250122', 0, 'valide', '2025-05-16T09:38:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('96e7c006-bf9c-4e2b-8bb2-c6e65ed90db2', 'ARTI205250126', 0, 'valide', '2025-05-16T09:39:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2f54ab0f-c353-417b-9fa0-45161febdc3b', 'ARTI205250084', 0, 'valide', '2025-05-16T09:39:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d12b1de-9874-4e8c-ad21-2c52ca33beff', 'ARTI205250088', 0, 'valide', '2025-05-16T09:40:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('28f88d7c-c285-4cf5-8040-cd9bde1bf394', 'ARTI205250089', 0, 'valide', '2025-05-16T09:40:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8633df8d-16fe-4bf0-b743-9ea936e71d25', 'ARTI205250094', 0, 'valide', '2025-05-16T09:41:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f11af0fb-a564-4a5c-8c14-c5513ff9f0c8', 'ARTI205250109', 0, 'valide', '2025-05-16T09:41:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('db70af41-1f54-4b0a-81eb-e9764a280931', 'ARTI205250051', 0, 'valide', '2025-05-16T09:41:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dec54f44-1acd-4f38-82ca-51265766ab4d', 'ARTI205250035', 0, 'valide', '2025-05-16T09:42:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f13b86f9-7b8d-4594-b3b4-aaff1efa5c3f', 'ARTI204250288', 0, 'valide', '2025-05-16T09:42:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9278f468-b101-4f7c-a7b2-8c1ae1acf9ce', 'ARTI204250152', 0, 'valide', '2025-05-16T09:43:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a5759d4-0a33-4188-b3d4-eb059ee14e39', 'ARTI204250062', 0, 'valide', '2025-05-16T09:43:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0742f19b-272b-4fee-9bde-36681d47dc02', 'ARTI204250168', 0, 'valide', '2025-05-16T10:23:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3111037d-82fa-4b7d-8391-e2ca787421a9', 'ARTI205250072', 0, 'valide', '2025-05-16T14:20:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e0e9fbc7-1127-4dfd-a4c0-0edee5894899', 'ARTI205250136', 0, 'valide', '2025-05-16T16:31:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('63769026-81f8-4e63-bcd6-f8b091a5d86f', 'ARTI205250131', 0, 'valide', '2025-05-17T06:33:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a93df644-37c7-4e06-ba04-eb0c31432623', 'ARTI205250132', 0, 'valide', '2025-05-17T06:33:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('29f5314a-040d-4ff3-950b-f360d576ee9b', 'ARTI205250134', 0, 'valide', '2025-05-17T06:34:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d76dee05-f1cb-4f17-80e6-313d606e7982', 'ARTI205250114', 0, 'valide', '2025-05-17T06:34:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c96ea3a3-84b4-4b6c-9c6e-1e61ec4e5ebb', 'ARTI204250140', 0, 'valide', '2025-05-17T06:35:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('680d44f5-6448-445b-9625-8a45e98cbec0', 'ARTI204250127', 0, 'valide', '2025-05-17T06:35:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4bd7ede8-d772-49ba-bbc3-e577c96016b0', 'ARTI204250038', 0, 'valide', '2025-05-17T06:36:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a0311c35-761e-4826-81ba-8bea385bb4f2', 'ARTI205250018', 0, 'valide', '2025-05-18T00:29:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('070358f1-2b52-44b2-acc1-b6255e25a183', 'ARTI205250019', 0, 'valide', '2025-05-18T00:30:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae46f686-f4eb-45d2-b2db-a2014ef36cfb', 'ARTI205250024', 0, 'valide', '2025-05-18T00:30:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('85610872-4d61-4135-bb3a-3cfc27425d92', 'ARTI205250025', 0, 'valide', '2025-05-18T00:30:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d1ec969-1371-404c-baf8-343be2ed92f0', 'ARTI204250225', 0, 'valide', '2025-05-18T00:31:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c00c6a73-cc7e-47cb-932f-9acc79578c1c', 'ARTI204250230', 0, 'valide', '2025-05-18T00:31:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a465af24-f20e-45b0-a8ea-c9e2ff7ebbe9', 'ARTI204250198', 0, 'valide', '2025-05-18T00:31:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9e2d8697-08bc-4528-9826-e65ba6581579', 'ARTI204250106', 0, 'valide', '2025-05-18T00:32:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4bd56350-d1ff-4463-af13-0fefad0cc6b8', 'ARTI204250113', 0, 'valide', '2025-05-18T00:32:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6ac50d4f-452e-467d-85e7-eaf29e170fe6', 'ARTI204250115', 0, 'valide', '2025-05-18T00:33:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('92c8747b-1d8a-4407-bc65-86dacb661414', 'ARTI204250116', 0, 'valide', '2025-05-18T00:33:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a59c4307-8d9c-43c0-a5ed-be76897018de', 'ARTI205250104', 0, 'valide', '2025-05-20T11:57:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('87cdc70c-d421-4249-88f5-2e11d62384e9', 'ARTI205250107', 0, 'valide', '2025-05-20T11:58:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c55c2d5-e053-4929-b627-757a1860fce9', 'ARTI205250033', 0, 'valide', '2025-05-20T11:59:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f21ac19f-f538-4213-bc33-aae09e998f00', 'ARTI205250140', 0, 'valide', '2025-05-20T13:53:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae20cd26-1cf6-4314-9dfb-c1bcf60575ab', 'ARTI205250060', 0, 'valide', '2025-05-20T13:53:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('92d8f90b-20c5-43d0-96d9-a3c203a39e4a', 'ARTI205250015', 0, 'valide', '2025-05-20T13:54:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c76abf4-67ee-460d-b493-e7c0a676a3e1', 'ARTI205250017', 0, 'valide', '2025-05-20T13:54:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3516ad2-fd28-4466-86a0-0dd995119ce0', 'ARTI204250285', 0, 'valide', '2025-05-20T13:55:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae9e85aa-9c1a-4665-9be4-6f074d2de663', 'ARTI204250273', 0, 'valide', '2025-05-20T13:55:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1e895233-20b6-4553-aa68-11e698bd8670', 'ARTI204250201', 0, 'valide', '2025-05-20T13:56:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4b990785-f78c-4e08-9b29-d428114e658d', 'ARTI204250164', 0, 'valide', '2025-05-20T13:56:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e16f1c5c-3217-4380-9d46-84c4c445dd50', 'ARTI204250030', 0, 'valide', '2025-05-20T13:56:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ce6bbd3-782c-4cec-b7c9-6314f5ed66b9', 'ARTI204250040', 0, 'valide', '2025-05-20T13:57:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6408cba3-473c-4130-b13e-26d9822d5690', 'ARTI205250144', 0, 'valide', '2025-05-20T16:57:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e0a264af-2911-4b7f-a25c-4a48e41b5024', 'ARTI204250220', 0, 'valide', '2025-05-20T16:58:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8b201f65-4d12-4edb-84ba-369eef8a9001', 'ARTI205250145', 0, 'valide', '2025-05-20T16:59:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5aacdf49-aa30-4849-8e16-7b3f91de33d1', 'ARTI205250146', 0, 'valide', '2025-05-20T16:59:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aa51bff8-f32f-4a1a-a8aa-6de1fc532e1b', 'ARTI205250147', 0, 'valide', '2025-05-20T17:00:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7f077188-b5f2-46b9-a08b-3a296dd46ff1', 'ARTI205250148', 0, 'valide', '2025-05-20T17:00:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('48037382-5b94-4981-a4d2-377e9d534a83', 'ARTI205250135', 0, 'valide', '2025-05-20T17:00:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('74e1425e-2644-44f1-ac44-13f496ef65e9', 'ARTI205250129', 0, 'valide', '2025-05-20T17:01:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ba4565d-7319-4634-8905-44f1bd4cea42', 'ARTI205250013', 0, 'valide', '2025-05-20T17:19:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('be9fccce-459d-4856-90f1-26125bd8d933', 'ARTI204250243', 0, 'valide', '2025-05-20T17:22:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3049e8b6-be68-44c1-b9d5-8b36e24d20e0', 'ARTI204250135', 0, 'valide', '2025-05-20T17:22:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bf67d976-ff5d-4eb7-8867-d0df5dc1d74d', 'ARTI204250188', 0, 'valide', '2025-05-20T17:23:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b8cff776-25fb-4258-a3be-1890585a4a01', 'ARTI204250059', 0, 'valide', '2025-05-20T17:23:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('35345ca0-1ffe-4b74-bc69-9957e70dc11e', 'ARTI204250022', 0, 'valide', '2025-05-20T17:24:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0935f0ff-3730-4885-8a48-eb5c55e6e460', 'ARTI204250291', 0, 'valide', '2025-05-20T17:49:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('293652d8-3555-4bd6-83dc-a64fe4a3a3e1', 'ARTI204250060', 0, 'valide', '2025-05-20T17:49:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a1b7dfdd-46f8-4bed-9f9e-f1d0679ba730', 'ARTI204250205', 0, 'valide', '2025-05-20T17:50:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a260e00-b607-4681-bddf-81eed4255b86', 'ARTI205250087', 0, 'valide', '2025-05-20T17:58:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0436b92e-dd32-4785-9e69-325c6cda5d47', 'ARTI205250156', 0, 'valide', '2025-05-21T07:01:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61bef6ee-1c5e-4103-9174-21203108fbbf', 'ARTI205250139', 0, 'valide', '2025-05-21T07:01:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d041d2cb-b995-4b1e-9d05-97ec4d726b46', 'ARTI205250141', 0, 'valide', '2025-05-21T07:02:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a85e8f8a-2b92-40da-a589-d96e5207c3b4', 'ARTI205250138', 0, 'valide', '2025-05-21T07:03:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae0c984d-5549-4aa3-b184-a112789f5bd7', 'ARTI205250133', 0, 'valide', '2025-05-21T07:04:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7de4746d-4ecb-46fa-83b4-a65d3f094a07', 'ARTI205250130', 0, 'valide', '2025-05-21T07:05:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d817df9f-ce94-4197-a1da-4925375953a1', 'ARTI204250161', 0, 'valide', '2025-05-21T07:05:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ecefac28-f4f6-44b4-9e11-d2c836ab9cb5', 'ARTI204250096', 0, 'valide', '2025-05-21T13:35:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('80941746-be8a-4c76-a20c-e3aef48a22ce', 'ARTI205250154', 0, 'valide', '2025-05-21T18:31:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('355dbb21-6f33-4ac3-8c02-c8a3ad853bac', 'ARTI205250155', 0, 'valide', '2025-05-21T18:32:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cf06e44b-df88-4050-9602-5e3062e00189', 'ARTI205250150', 0, 'valide', '2025-05-21T18:32:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ea9c089-c2e3-4b20-934c-41c6a27daf35', 'ARTI205250143', 0, 'valide', '2025-05-21T18:33:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('46eb1d68-c020-4858-9160-05a44d444085', 'ARTI205250050', 0, 'valide', '2025-05-21T18:33:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9132004c-294b-4cec-8dd3-86ff77679840', 'ARTI205250142', 0, 'valide', '2025-05-21T21:18:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3752d2ca-c910-4e36-ae9a-e9cbf64fdb8c', 'ARTI205250036', 0, 'valide', '2025-05-21T21:19:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ab64ff3f-37ec-4d67-b780-4c6f0498d788', 'ARTI204250219', 0, 'valide', '2025-05-21T21:19:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('66d7954c-ada9-4d7e-b9d8-2ed67df9a137', 'ARTI204250130', 0, 'valide', '2025-05-21T21:20:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('38729775-0776-47b0-ad24-0fd86b8fc14a', 'ARTI204250172', 0, 'valide', '2025-05-21T21:20:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9c4dcff8-0e33-424d-84d9-b18d93ff5d50', 'ARTI204250020', 0, 'valide', '2025-05-21T21:21:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8e189aa4-6ccf-4606-a68f-8a55659258e3', 'ARTI204250080', 0, 'valide', '2025-05-21T21:21:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f6b360db-8973-44b3-83bc-e17738bece5c', 'ARTI204250083', 0, 'valide', '2025-05-21T21:22:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('825832c4-2ed2-49b2-8793-4d8276675b3e', 'ARTI204250097', 0, 'valide', '2025-05-21T21:22:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('23bd8e45-d768-4dc1-8269-42fa8f8f3ac5', 'ARTI204250306', 0, 'valide', '2025-05-22T04:46:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6b88f0cb-359a-4895-ba49-04af82677a45', 'ARTI204250297', 0, 'valide', '2025-05-22T04:46:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0017244c-ec3e-460f-b363-9f259f802dbd', 'ARTI204250252', 0, 'valide', '2025-05-22T04:47:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('47f67df2-9c86-4959-a9bf-dda39b42eb0d', 'ARTI204250224', 0, 'valide', '2025-05-22T04:47:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8eee6f10-dd5b-4331-9de7-f2b162482633', 'ARTI204250142', 0, 'valide', '2025-05-22T04:48:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a5e7b9b-833c-40e3-a24f-b8e79736b364', 'ARTI204250009', 0, 'valide', '2025-05-22T04:49:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1185f7c-8210-47c8-8db9-f7429ba37ef8', 'ARTI204250061', 0, 'valide', '2025-05-22T04:49:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('36d835c8-adb4-4c32-9cde-5cecfa53c5f9', 'ARTI205250163', 0, 'valide', '2025-05-22T14:11:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f1e56afe-c740-4fa1-9015-48166b202e3c', 'ARTI205250164', 0, 'valide', '2025-05-22T14:11:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8279adef-07d3-4722-8343-94812305241f', 'ARTI205250167', 0, 'valide', '2025-05-22T14:12:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f17097bb-38ca-48c3-8d51-20218f8becf9', 'ARTI205250168', 0, 'valide', '2025-05-22T14:12:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('44258cf5-483e-40fb-b80a-4131049bc5f6', 'ARTI205250090', 0, 'valide', '2025-05-22T14:17:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1f1a74e7-59e2-45ef-9541-c4e0d940c71f', 'ARTI204250268', 0, 'valide', '2025-05-22T14:18:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9c4414ea-7b63-4872-8d99-1a2a1b8111ce', 'ARTI204250169', 0, 'valide', '2025-05-22T14:18:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('256256c8-5a56-47b1-aa5b-bfa4416360dc', 'ARTI204250128', 0, 'valide', '2025-05-22T14:19:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2d10c0db-0b29-473c-9822-272d04bc3e7e', 'ARTI204250126', 0, 'valide', '2025-05-22T14:20:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c839104a-87b7-4fbc-ad16-f6310ee7ee8f', 'ARTI204250153', 0, 'valide', '2025-05-22T17:05:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e0c1320f-3bc3-4371-a18f-b3c34b761346', 'ARTI204250186', 0, 'valide', '2025-05-22T17:59:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cfdcd678-e46e-415c-9fe3-ba43cf206638', 'ARTI204250043', 0, 'valide', '2025-05-22T18:00:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67b8fde2-fa3a-4b35-aa48-629e49d42f21', 'ARTI204250217', 0, 'valide', '2025-05-22T18:48:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('af4a023d-8ba4-48fc-83a1-eacf3e8e15bd', 'ARTI204250159', 0, 'valide', '2025-05-22T19:13:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0586e90e-e937-4cf8-acc4-c8e56e7381fa', 'ARTI205250042', 0, 'valide', '2025-05-23T06:46:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0e2899bb-8e07-47a0-97c3-93439511d591', 'ARTI204250299', 0, 'valide', '2025-05-23T06:46:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bce9d428-979c-4d55-8894-249d92f557e3', 'ARTI205250169', 0, 'valide', '2025-05-23T14:42:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('55c0649d-273a-4395-b893-fa3944009111', 'ARTI204250212', 0, 'valide', '2025-05-23T14:42:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9cc876aa-e28a-45ff-b786-81ec3e3476d5', 'ARTI204250143', 0, 'valide', '2025-05-23T14:43:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4a8d8d59-fbd0-4537-9497-c7f4efe7bd9f', 'ARTI205250170', 0, 'valide', '2025-05-26T19:56:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da57da31-7463-47e7-b511-e8bee9d27f68', 'ARTI205250171', 0, 'valide', '2025-05-26T19:56:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a73bee8-9de0-4323-b5d4-2516d5d7351c', 'ARTI205250152', 0, 'valide', '2025-05-26T19:57:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4670c834-1f92-4a9b-9dc3-1f4d9a5cca6f', 'ARTI204250324', 0, 'valide', '2025-05-26T19:58:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f675f72-a0d4-45a2-a813-f8ff30e6c896', 'ARTI205250070', 0, 'valide', '2025-05-27T09:17:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a986efec-3753-4a6a-94b3-f08e88e6a771', 'ARTI205250177', 0, 'valide', '2025-05-28T18:32:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c8ecf4b-95ee-40c7-a243-d2f93be2ab49', 'ARTI205250172', 0, 'valide', '2025-05-28T18:32:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d487a7fb-22d6-4a94-968b-7530b7b8bffd', 'ARTI205250173', 0, 'valide', '2025-05-28T18:33:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dd42293b-22d6-49fc-b5b0-f9ce42813883', 'ARTI205250174', 0, 'valide', '2025-05-28T18:34:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('37259c42-36a7-42a0-aec4-1951af8a1cb7', 'ARTI205250178', 0, 'valide', '2025-05-30T16:52:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('332420e3-f719-4a81-8463-8017d5bffb46', 'ARTI205250175', 0, 'valide', '2025-05-30T16:52:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('52dde154-286d-4d8e-8cfe-1487704dc529', 'ARTI204250269', 0, 'valide', '2025-05-30T16:53:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7073b892-6e5f-42e6-83d5-904a00792a2b', 'ARTI204250323', 0, 'valide', '2025-06-01T11:01:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3bd76d66-1e6e-4ec2-9c0a-7b2fc72e837c', 'ARTI205250176', 0, 'valide', '2025-06-02T19:12:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fd56538a-1923-4861-8671-20b74e976119', 'ARTI205250149', 0, 'valide', '2025-06-02T19:15:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('95a6b1fd-54a2-4de0-8794-4c567aaa2ffc', 'ARTI204250262', 0, 'valide', '2025-06-02T20:04:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c0bb7476-43c2-48a2-b401-81652b85db2c', 'ARTI204250253', 0, 'valide', '2025-06-02T20:04:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a4406a81-68ee-41b8-b80b-f456299335c0', 'ARTI204250182', 0, 'valide', '2025-06-02T20:05:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('82c7e448-69a0-4034-8324-4cfe6e6a6edd', 'ARTI204250007', 0, 'valide', '2025-06-02T20:05:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ac1755b-9020-4383-b0ca-f042f7ef91f5', 'ARTI204250070', 0, 'valide', '2025-06-02T20:06:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30ca5f3a-71ba-491d-95e1-92d718483ed7', 'ARTI204250325', 0, 'valide', '2025-06-03T18:45:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c8dd3d5-6abc-4a14-b08d-ee2486af874c', 'ARTI204250259', 0, 'valide', '2025-06-03T18:46:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4e57ed12-93f8-4c75-b5f4-f72a9eb9f428', 'ARTI204250246', 0, 'valide', '2025-06-03T18:47:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2bbdb068-b8d5-41d7-a416-dd5f8f3d797d', 'ARTI206250005', 0, 'valide', '2025-06-04T21:25:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('775f13c4-f572-4a44-b926-aeb80552f1a1', 'ARTI206250003', 0, 'valide', '2025-06-04T21:25:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cb3e79c9-8f20-426b-9b09-2b6cbace2f19', 'ARTI206250004', 0, 'valide', '2025-06-04T21:26:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7b40509-9d50-46d3-bfcc-8d7f31c53308', 'ARTI204250286', 0, 'valide', '2025-06-04T21:26:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c0afebf2-b1d3-4a0a-9b09-7cf8b98ade7f', 'ARTI204250166', 0, 'valide', '2025-06-04T21:27:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('eb62ba8c-a946-4e07-86e1-7ee7ddb93a75', 'ARTI204250092', 0, 'valide', '2025-06-04T21:28:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d2748861-beb7-49f8-b687-03fa0af9d226', 'ARTI206250002', 0, 'valide', '2025-06-05T17:23:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2ba2bf15-b3f6-4943-a009-94c89ff2bb9c', 'ARTI206250001', 0, 'valide', '2025-06-05T18:19:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('79e8d114-1b38-47ca-900f-787d5bddb98f', 'ARTI206250008', 0, 'valide', '2025-06-10T16:29:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('807850ec-eb6b-482e-b54d-6f8917cbc127', 'ARTI206250010', 0, 'valide', '2025-06-12T23:08:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ddbd1b14-92bf-45ad-8c28-d707e6572561', 'ARTI206250006', 0, 'valide', '2025-06-12T23:09:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('abf92585-52f3-4c36-b2ff-0edf0c3a2467', 'ARTI206250007', 0, 'valide', '2025-06-12T23:09:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b3828ae0-a449-4b72-88f1-95bc8ba61644', 'ARTI206250009', 0, 'valide', '2025-06-12T23:10:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4ed591e-b756-47eb-9623-d18a782c64c4', 'ARTI205250157', 0, 'valide', '2025-06-12T23:11:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c65e8c6-5bb8-486a-a3e6-cfb3cfb2760f', 'ARTI205250158', 0, 'valide', '2025-06-12T23:12:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3af07918-c51f-418a-aef2-0a60785f590c', 'ARTI205250159', 0, 'valide', '2025-06-12T23:13:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2c032c76-0a2c-430f-aa1d-781d45c78cd8', 'ARTI205250160', 0, 'valide', '2025-06-12T23:13:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fe7012a3-28cb-4d33-ae10-546a324c4267', 'ARTI205250161', 0, 'valide', '2025-06-12T23:14:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f51079e3-df2c-4af2-84d7-d47858322f39', 'ARTI205250162', 0, 'valide', '2025-06-12T23:15:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('120af64d-9d64-4269-88d4-f962770b298a', 'ARTI205250165', 0, 'valide', '2025-06-12T23:15:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('649ea5d0-611b-485c-9237-fdf32395923d', 'ARTI205250166', 0, 'valide', '2025-06-12T23:16:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ad912a70-ab8e-403f-9d1c-9e7bb9e45fec', 'ARTI204250214', 0, 'valide', '2025-06-12T23:17:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0e62542a-be1b-404d-9b3d-d6b118ddb786', 'ARTI206250017', 0, 'valide', '2025-06-16T09:09:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6df90c5c-8815-46a1-b63e-8727160af2f4', 'ARTI206250011', 0, 'valide', '2025-06-17T09:27:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2b393069-2576-4cee-8762-2fb8972e4aa2', 'ARTI206250013', 0, 'valide', '2025-06-17T09:28:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('608a9633-2aa8-4b01-a3fd-3bd681b001df', 'ARTI206250014', 0, 'valide', '2025-06-17T09:29:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f81cff22-cdb9-4da2-b1da-61d3ba0d6296', 'ARTI205250039', 0, 'valide', '2025-06-17T09:30:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef515d16-777c-4819-bcfb-bbb0495ffed9', 'ARTI206250015', 0, 'valide', '2025-06-18T07:39:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('43e75ecb-a1b9-451e-bf61-ae31e3eabf9f', 'ARTI205250029', 0, 'valide', '2025-06-19T06:31:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cbc3b51b-9565-42e7-a96c-149b6cf1e9a6', 'ARTI206250020', 0, 'valide', '2025-06-19T13:24:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3bd88780-e8f0-4b39-95c9-e701b4285387', 'ARTI206250026', 0, 'valide', '2025-06-19T13:31:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7243c447-abe7-42de-bbc0-7a6f46bda789', 'ARTI206250018', 0, 'valide', '2025-06-20T00:05:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ac8adb28-418d-4fb8-aad6-7fe6aad99ce7', 'ARTI206250019', 0, 'valide', '2025-06-20T00:06:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d718b927-bfe9-467a-b213-ec5730401055', 'ARTI206250021', 0, 'valide', '2025-06-20T00:06:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('17f3613b-fde0-44d6-a8d3-d59c37c35756', 'ARTI206250022', 0, 'valide', '2025-06-20T00:07:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1505a46b-d62f-41a0-bf5b-f3b806923c7c', 'ARTI206250025', 0, 'valide', '2025-06-20T00:08:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('092e1a8d-96fb-43c2-8462-abfb99b04e6a', 'ARTI206250030', 0, 'valide', '2025-06-20T00:08:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f2b28343-6929-4db5-8046-2b9dcedd51f3', 'ARTI206250034', 0, 'valide', '2025-06-20T00:09:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('56149ee9-3e6f-4b96-9602-332037c51a8c', 'ARTI206250032', 0, 'valide', '2025-06-20T00:10:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('48f60f41-1789-4cd6-bd79-35e61ba17466', 'ARTI206250036', 0, 'valide', '2025-06-20T00:11:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9c9de508-001a-436b-85b8-15735c279425', 'ARTI206250044', 0, 'valide', '2025-06-20T00:11:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b30e402-ece6-471e-a995-360174fc9706', 'ARTI206250038', 0, 'valide', '2025-06-20T00:12:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fc94ec2d-5ff9-431f-b883-ce8a4537d2cf', 'ARTI206250029', 0, 'valide', '2025-06-20T00:13:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bde27981-2fa8-409c-a865-8552989b6cb2', 'ARTI206250035', 0, 'valide', '2025-06-20T00:14:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('24b67b06-8a9f-45eb-b36e-f4c6d315575a', 'ARTI206250031', 0, 'valide', '2025-06-20T00:15:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ec505559-af0f-4e36-999d-a4b59db09014', 'ARTI206250042', 0, 'valide', '2025-06-20T00:16:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('33a5b065-cf49-4aa2-93dc-fcfb88cbb7a5', 'ARTI206250041', 0, 'valide', '2025-06-20T00:16:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f0f81c7-a8c8-4427-a097-46f7c3fdc25a', 'ARTI206250040', 0, 'valide', '2025-06-20T00:17:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('879426ac-3849-42d2-beb1-fe4b638d8086', 'ARTI206250028', 0, 'valide', '2025-06-20T00:17:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ad6f9d0-0013-4868-92e8-8238efa3a3c5', 'ARTI206250027', 0, 'valide', '2025-06-20T00:18:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f09c795a-a597-4c9b-a51d-f929e0b5a1e3', 'ARTI206250037', 0, 'valide', '2025-06-20T00:19:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4604acbc-78d0-4aa6-9692-3b1186005897', 'ARTI206250033', 0, 'valide', '2025-06-20T00:20:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('47a94135-d22a-4223-85f6-0c31ba2be87c', 'ARTI206250023', 0, 'valide', '2025-06-20T08:39:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6caab15c-f605-4bbb-885d-3feb14bc1341', 'ARTI206250024', 0, 'valide', '2025-06-20T08:39:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('964ad0a2-94d1-48f1-844f-55f8d116be1a', 'ARTI206250043', 0, 'valide', '2025-06-20T08:40:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4614e8d-4204-4d65-bcc1-8352f371c112', 'ARTI206250046', 0, 'valide', '2025-06-23T05:42:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('477701db-1a4e-4b35-b4ab-a0fa856aa8c9', 'ARTI206250047', 0, 'valide', '2025-06-23T05:43:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('916a57da-3423-4a82-8b4d-12b6fc183797', 'ARTI206250049', 0, 'valide', '2025-06-23T05:44:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c952c63-bbf8-42c5-bc9a-4b9acfc2515b', 'ARTI206250048', 0, 'valide', '2025-06-23T05:44:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('09db1c18-e54b-4b9c-af2d-a89d42d23025', 'ARTI206250050', 0, 'valide', '2025-06-23T05:46:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('daf27997-73aa-4d05-93cd-6f575ed0367c', 'ARTI206250054', 0, 'valide', '2025-06-23T19:25:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4f1fb123-eb39-4f48-93a5-7be04be3f3aa', 'ARTI206250051', 0, 'valide', '2025-06-23T19:26:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ab64a7d-b890-4e52-bf11-15c6516dacc2', 'ARTI206250012', 0, 'valide', '2025-06-23T19:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0db75428-2e3f-4991-875d-a81ae47f7a0f', 'ARTI206250067', 0, 'valide', '2025-06-24T09:48:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b5392d62-a0de-4115-babf-d0e6af4473b4', 'ARTI206250052', 0, 'valide', '2025-06-24T14:31:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e893d69b-c206-4037-be23-5bd4146906f9', 'ARTI206250056', 0, 'valide', '2025-06-24T18:04:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e1900f1f-5a8e-44d8-b705-1b5de6e6c817', 'ARTI206250057', 0, 'valide', '2025-06-24T18:04:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('244c356a-88e5-4f9a-9664-1022bdf3f730', 'ARTI206250058', 0, 'valide', '2025-06-24T18:05:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('708a9be1-7b2f-4b68-89cb-31d1606202d3', 'ARTI206250059', 0, 'valide', '2025-06-24T18:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a289e8b2-0f5e-4cf5-8712-8c131c7c8ee5', 'ARTI206250060', 0, 'valide', '2025-06-24T18:06:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('47b42513-8d14-4fe3-a301-202f9528f929', 'ARTI206250062', 0, 'valide', '2025-06-24T18:07:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('640a7f9c-4350-45d0-82a7-863a978941fe', 'ARTI206250063', 0, 'valide', '2025-06-24T18:07:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e90c240e-61c1-4b0f-8fcd-19ec75bada91', 'ARTI206250066', 0, 'valide', '2025-06-24T18:08:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1cb2a371-16c1-447b-86a8-c4c4e6f58945', 'ARTI206250068', 0, 'valide', '2025-06-25T12:15:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c0db6a47-f6b1-4abf-abff-1ef06ef54a70', 'ARTI206250071', 0, 'valide', '2025-06-25T12:16:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c9795939-640e-4658-99fb-a498ecd1976d', 'ARTI206250073', 0, 'valide', '2025-06-25T12:17:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('46737a84-5575-4d42-a7d3-79290ce76dd2', 'ARTI206250072', 0, 'valide', '2025-06-25T12:17:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('01ba3008-b565-48ab-bbcb-a16269a49864', 'ARTI206250075', 0, 'valide', '2025-06-25T12:42:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6bddbf1a-1392-42e3-963d-b4b30cb5f9c0', 'ARTI206250076', 0, 'valide', '2025-06-25T12:43:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e9e975bf-12f6-4514-8861-99c203f34eb5', 'ARTI206250069', 0, 'valide', '2025-06-25T12:44:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6691a037-b3ab-46fa-a371-d62177c0ef4c', 'ARTI206250077', 0, 'valide', '2025-06-25T16:15:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4a36cd23-1580-4fe2-9844-59680cafa98e', 'ARTI206250074', 0, 'valide', '2025-06-25T16:16:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('81046183-6ede-4c09-8342-8428a61b6384', 'ARTI206250045', 0, 'valide', '2025-06-25T16:17:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9585a0ef-5b9c-4443-92c1-c8a8f68e2a76', 'ARTI206250081', 0, 'valide', '2025-06-25T19:10:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2995f45f-e0c1-4435-9a1a-8c2807027c84', 'ARTI206250082', 0, 'valide', '2025-06-25T19:11:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('64acb0fa-1742-4777-9364-fbe7199ad44a', 'ARTI206250085', 0, 'valide', '2025-06-25T19:12:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a35e005-9a04-4cb6-9a99-842b788fe1ef', 'ARTI206250086', 0, 'valide', '2025-06-25T19:13:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('447ef990-caf5-4080-9b67-f87a85a33435', 'ARTI206250087', 0, 'valide', '2025-06-25T19:13:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7a4430ff-3446-4883-b606-2be704609c70', 'ARTI206250088', 0, 'valide', '2025-06-25T19:14:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b9e22ce5-8b71-442b-8cc2-1d463b7acdcb', 'ARTI206250090', 0, 'valide', '2025-06-25T19:15:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a8b8e5d4-8277-416b-8713-cd08cab2921a', 'ARTI206250092', 0, 'valide', '2025-06-25T19:15:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bd4e9a2d-d10d-4b8e-9d82-0cbc4a1410fc', 'ARTI206250093', 0, 'valide', '2025-06-25T19:16:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b693cce0-d472-4e43-940d-9fa2974f2d70', 'ARTI206250094', 0, 'valide', '2025-06-25T19:17:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('483639fa-0feb-426e-a08b-1a2091ff36cd', 'ARTI206250095', 0, 'valide', '2025-06-25T19:17:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3071e312-ccdf-4361-b11d-a829e8ca6665', 'ARTI206250078', 0, 'valide', '2025-06-25T19:18:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c7037a21-68ff-4300-b0a7-b81e902d9c97', 'ARTI206250039', 0, 'valide', '2025-06-25T19:19:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('912c35fc-3ef1-4d27-a81e-503f77d1e911', 'ARTI205250076', 0, 'valide', '2025-06-25T19:19:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8653b4a5-dfdc-49b6-a276-dd21c725bf7f', 'ARTI206250097', 0, 'valide', '2025-06-26T16:45:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9180083c-0e20-4794-8a41-59db69089469', 'ARTI206250079', 0, 'valide', '2025-06-26T16:45:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5cbf648c-a926-44f6-9cb3-18421243cfc8', 'ARTI206250055', 0, 'valide', '2025-06-26T16:46:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9033b0ea-1c7c-42f2-8611-21a91e8e8b7b', 'ARTI206250080', 0, 'valide', '2025-06-26T16:47:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4cc7dd32-f0c3-4826-b780-868e63a281ef', 'ARTI206250083', 0, 'valide', '2025-06-26T16:48:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('592dfbf6-455b-4b79-8435-3c381d8aa501', 'ARTI206250089', 0, 'valide', '2025-06-26T16:48:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f4c4f90c-56ea-4edd-b304-114e8f94ae16', 'ARTI206250061', 0, 'valide', '2025-06-26T16:49:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fe5ce14c-e452-46c6-8032-1d42cad859a9', 'ARTI206250064', 0, 'valide', '2025-06-26T16:50:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('73b96d7d-4252-48f7-9834-d2f99843d156', 'ARTI206250065', 0, 'valide', '2025-06-26T16:51:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('46ca1053-303d-4d8d-a4b0-0231f162bf36', 'ARTI206250070', 0, 'valide', '2025-06-26T16:51:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('653d52e1-af41-4860-8d2f-3e841dc4f2aa', 'ARTI206250091', 0, 'valide', '2025-06-27T05:17:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3c0b9f48-1b9d-4bd9-b9c3-7ca3e31ee00a', 'ARTI206250053', 0, 'valide', '2025-06-27T05:18:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e670d28b-c69d-4b3f-8ad6-0922e90baa51', 'ARTI206250108', 0, 'valide', '2025-06-28T06:24:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a0c4fdfb-5855-425f-bef2-8e6a0b71f374', 'ARTI206250098', 0, 'valide', '2025-06-28T17:45:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9848d463-463a-4f7a-ba80-4ebf7297c4bf', 'ARTI206250110', 0, 'valide', '2025-06-28T17:47:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ea71dd6d-5cc2-42d4-af28-a115670ae2cf', 'ARTI206250102', 0, 'valide', '2025-06-28T17:48:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fd8b9451-fdbf-4155-b208-d59a61866f69', 'ARTI206250103', 0, 'valide', '2025-06-28T17:49:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6a87a4a-2fe9-402a-8ff3-abab27153217', 'ARTI206250104', 0, 'valide', '2025-06-28T17:50:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c92f913b-e2cf-404c-b609-58e312a111d4', 'ARTI206250105', 0, 'valide', '2025-06-28T17:51:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('248fe6ec-abb6-4b1d-ae07-806af3ff44ff', 'ARTI206250016', 0, 'valide', '2025-06-28T17:52:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ba1e77ae-e17f-4830-a6cb-4a82d35e4c3e', 'ARTI206250106', 0, 'valide', '2025-06-28T17:53:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f46026ff-16fd-41cb-8dc7-539e0d86fe73', 'ARTI206250107', 0, 'valide', '2025-06-28T17:54:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e03a42f1-3057-42d6-bd61-33280c6705ee', 'ARTI206250096', 0, 'valide', '2025-06-28T17:54:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('056139e7-ddd0-4e8b-87d6-3d0779d0c23f', 'ARTI206250113', 0, 'valide', '2025-06-30T18:39:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f0e9de3b-5249-4a65-8d82-f7cf75a468e2', 'ARTI206250114', 0, 'valide', '2025-06-30T18:39:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5889be2d-2a02-4b26-9724-2b0e894f4012', 'ARTI206250115', 0, 'valide', '2025-06-30T18:40:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ebcc8aa3-a317-4ca8-8926-cc3bacd4cc8e', 'ARTI206250116', 0, 'valide', '2025-06-30T18:41:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c87bd338-24dc-452a-b7c4-d1f7c2c7b010', 'ARTI206250117', 0, 'valide', '2025-06-30T18:41:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5f9383da-c13b-4982-94ae-b82985f48671', 'ARTI206250118', 0, 'valide', '2025-06-30T18:42:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('70abfbb4-799b-4b12-a9ef-a505e7f0a33a', 'ARTI206250109', 0, 'valide', '2025-06-30T18:43:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0a6d3255-83e1-450d-881e-f1cb20f26266', 'ARTI206250132', 0, 'valide', '2025-07-01T16:00:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('33669305-e3e6-4f3d-817c-a6d4a2ff52a2', 'ARTI206250111', 0, 'valide', '2025-07-01T16:01:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('05facc97-bff1-49be-b95f-b4dfce207dd5', 'ARTI206250101', 0, 'valide', '2025-07-01T16:02:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('006a3d97-6dd2-44f6-844e-220e80fd7665', 'ARTI206250100', 0, 'valide', '2025-07-01T16:06:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51b0988e-dad9-4f96-90f9-836fbcfee0d7', 'ARTI206250127', 0, 'valide', '2025-07-02T08:56:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d2e6bfc4-5270-4404-89a3-067028d0bd48', 'ARTI206250128', 0, 'valide', '2025-07-02T08:57:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8899a72f-436c-4b64-8928-1dfeac69618e', 'ARTI206250129', 0, 'valide', '2025-07-02T08:57:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ad924439-3d58-4c3e-991f-840d705b3a21', 'ARTI206250130', 0, 'valide', '2025-07-02T09:01:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d357296-c22d-4d1b-b486-5cd605943cf4', 'ARTI206250131', 0, 'valide', '2025-07-02T09:01:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02410487-4d52-4c67-89c3-8df5f513def4', 'ARTI207250004', 0, 'valide', '2025-07-02T13:27:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61ceebe1-7a37-4550-9147-bbe6f469e5a2', 'ARTI206250099', 0, 'valide', '2025-07-02T13:28:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('19ea3177-eb8c-421c-b6f0-cf4ff67a6092', 'ARTI206250119', 0, 'valide', '2025-07-05T10:12:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68d47879-5739-494e-84bb-3dc664a14b4c', 'ARTI206250120', 0, 'valide', '2025-07-05T10:13:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aab6171c-ba47-496e-b324-c767613c1963', 'ARTI206250121', 0, 'valide', '2025-07-05T10:14:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7ccee580-1ddd-4655-af97-b57949109682', 'ARTI206250122', 0, 'valide', '2025-07-05T10:17:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('967e60b5-f535-4495-a260-09f73aeaa095', 'ARTI206250123', 0, 'valide', '2025-07-05T10:19:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ebb4b3ef-4305-4a32-ae05-13ec307a24ea', 'ARTI206250124', 0, 'valide', '2025-07-05T10:20:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bc18d2e5-6e2f-41bc-9716-913c1ff40b93', 'ARTI206250125', 0, 'valide', '2025-07-05T10:24:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d8402059-dafc-4731-be51-71843465a15e', 'ARTI207250001', 0, 'valide', '2025-07-05T10:25:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('580268e3-6484-46dc-8196-0ed82a2616bc', 'ARTI207250002', 0, 'valide', '2025-07-05T10:26:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ca48096b-9a5a-4c1e-a3ff-66fe4c290974', 'ARTI206250126', 0, 'valide', '2025-07-05T10:28:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a9ae717c-223c-4610-a63a-84fa071f4a38', 'ARTI207250003', 0, 'valide', '2025-07-05T10:29:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9340810d-42ab-459f-b1af-138843db9176', 'ARTI206250112', 0, 'valide', '2025-07-05T10:30:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1d6b8ff4-f844-4022-b145-cf4d6d112678', 'ARTI206250084', 0, 'valide', '2025-07-05T10:33:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6048f5cf-b23b-4514-8a7f-225aec438cfd', 'ARTI207250011', 0, 'valide', '2025-07-07T16:56:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c79f642-0bfe-4757-ad19-0b0701d5757a', 'ARTI207250012', 0, 'valide', '2025-07-07T16:57:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('96107db5-27d9-421f-874f-46eb25b4ad57', 'ARTI207250013', 0, 'valide', '2025-07-07T16:57:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('89aaa06f-46de-4275-b103-b880e30cf03c', 'ARTI207250014', 0, 'valide', '2025-07-07T16:58:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7b337bd3-1760-43e1-a7c3-2b4059b2f724', 'ARTI207250015', 0, 'valide', '2025-07-07T17:01:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51b2b9af-97eb-47dd-a2d7-ece238beb8d9', 'ARTI207250016', 0, 'valide', '2025-07-07T17:02:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7c0c8432-3041-4bb0-af55-6bb6d76f5791', 'ARTI207250005', 0, 'valide', '2025-07-07T17:03:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('337d5f10-e2b3-43bd-a22d-d9c881e70702', 'ARTI207250006', 0, 'valide', '2025-07-07T17:05:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('af0f81cb-2de3-4e4a-ae06-4e8c8fcd2e8d', 'ARTI207250009', 0, 'valide', '2025-07-08T16:26:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a10d3f63-9956-45ec-b21a-82bd2337e13f', 'ARTI207250008', 0, 'valide', '2025-07-08T16:27:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c28e2cbe-5399-499b-ac82-85bf333e5c68', 'ARTI207250020', 0, 'valide', '2025-07-09T19:57:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c97aaa89-3499-4f83-b77f-09ff198a8948', 'ARTI207250022', 0, 'valide', '2025-07-09T19:58:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7db2ef36-08f3-4e2b-863c-1107b584a48d', 'ARTI207250017', 0, 'valide', '2025-07-09T19:58:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('37bd7c8e-8e2e-4e31-a4aa-612d2c09f14a', 'ARTI207250010', 0, 'valide', '2025-07-09T19:59:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('87afa27f-c8e8-4583-aa74-453de9f5b7ad', 'ARTI207250018', 0, 'valide', '2025-07-09T20:00:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('722f7134-b4af-4128-9757-9b47dded80ba', 'ARTI207250021', 0, 'valide', '2025-07-09T20:01:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b974c500-b6f1-4ec9-b49e-8d845ad13b23', 'ARTI207250019', 0, 'valide', '2025-07-10T15:19:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ff94ed1a-9f91-4b05-949a-b0642b991cca', 'ARTI207250030', 0, 'valide', '2025-07-11T15:38:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7c983eb0-2071-4edb-a39f-ee2dd9bf1a43', 'ARTI207250028', 0, 'valide', '2025-07-11T15:39:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e09dbc35-0daa-40e7-9f57-ab56a94005a8', 'ARTI207250031', 0, 'valide', '2025-07-11T15:41:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1c513c59-ace8-4576-a169-7d257849f10c', 'ARTI207250032', 0, 'valide', '2025-07-12T01:22:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3bca0e67-c869-4add-90f8-72b2e88ba907', 'ARTI207250033', 0, 'valide', '2025-07-12T01:23:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51a4e175-67f5-4407-96af-c409f8d25280', 'ARTI207250027', 0, 'valide', '2025-07-12T01:23:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d588fb0f-64c3-4a72-a0a6-57025e7c0e1b', 'ARTI207250025', 0, 'valide', '2025-07-12T01:24:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('93b9e43c-c388-4924-9744-9327ae1d7c45', 'ARTI207250036', 0, 'valide', '2025-07-14T12:26:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f847de29-03d8-449a-9ac4-dea95d0bdd1c', 'ARTI207250039', 0, 'valide', '2025-07-14T12:27:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('314b316e-6cfa-489f-a15f-65c98f052f6f', 'ARTI207250040', 0, 'valide', '2025-07-14T12:28:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6e0095bb-c7aa-41bd-ba81-9ebfac0ae878', 'ARTI207250041', 0, 'valide', '2025-07-14T12:30:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67de19d5-1247-4513-be50-fbb1da873e2d', 'ARTI207250042', 0, 'valide', '2025-07-14T13:26:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('eb7dd26a-ffdd-4a3f-910d-3727c7ee10ae', 'ARTI207250044', 0, 'valide', '2025-07-14T16:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('828e9b2f-f625-4edb-b7ce-d0e75aad45ee', 'ARTI207250035', 0, 'valide', '2025-07-14T16:06:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3ce509ae-acfb-480e-a684-33476261c25d', 'ARTI207250061', 0, 'valide', '2025-07-16T22:04:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ec0b6756-c940-4600-96aa-f1336cc51712', 'ARTI207250067', 0, 'valide', '2025-07-16T22:06:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('55774bb3-4f2b-4551-8110-f0cf25822316', 'ARTI207250069', 0, 'valide', '2025-07-16T22:07:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('15f06a6e-9574-4096-bd96-c16409be63ec', 'ARTI207250047', 0, 'valide', '2025-07-16T22:07:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('84d04612-152d-4e52-aff2-08eaac995409', 'ARTI207250051', 0, 'valide', '2025-07-16T22:08:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('251daa95-6551-43f4-a746-da7497bbc2e4', 'ARTI207250049', 0, 'valide', '2025-07-16T22:09:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9d0ac14b-c5fa-4707-8c48-5cb94af8005a', 'ARTI207250026', 0, 'valide', '2025-07-16T22:10:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7f0d33fe-22b0-4191-a311-9c6756b92a4a', 'ARTI207250046', 0, 'valide', '2025-07-16T22:11:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c043c560-0657-45c0-8ab4-33625302795e', 'ARTI207250045', 0, 'valide', '2025-07-16T22:13:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('32c1c698-22c2-48ae-ba61-c72916858c66', 'ARTI207250037', 0, 'valide', '2025-07-16T22:13:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5b123b57-92b3-4c77-b252-67f7c4c4bedc', 'ARTI207250071', 0, 'valide', '2025-07-17T18:44:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('691b15a1-2443-4730-a584-af57cd2b8461', 'ARTI207250077', 0, 'valide', '2025-07-17T18:45:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d987ddaf-1cfa-4406-b00c-07a1a50e9cce', 'ARTI207250070', 0, 'valide', '2025-07-17T18:46:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('12b050cc-bc14-414f-82c8-55541de1480f', 'ARTI207250043', 0, 'valide', '2025-07-17T18:46:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51aab070-45bd-4f61-a50f-cdc63a6be3ff', 'ARTI207250053', 0, 'valide', '2025-07-17T18:47:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f297a8f-c868-4294-b506-34330da45239', 'ARTI207250072', 0, 'valide', '2025-07-18T05:13:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d8458f0-3788-4aa2-b412-4e88fb46a5eb', 'ARTI207250079', 0, 'valide', '2025-07-18T05:14:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7a2de6b5-917f-4283-9a08-6cd3a211e969', 'ARTI207250064', 0, 'valide', '2025-07-18T05:16:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a8eb325-c563-4fc5-aa56-db552bd80b9d', 'ARTI207250066', 0, 'valide', '2025-07-18T05:17:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e21c0dda-3205-4d69-8459-ff33524ab21d', 'ARTI207250068', 0, 'valide', '2025-07-18T05:17:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f6edd9b6-4fbd-4ae0-8241-409f91ab9c54', 'ARTI207250080', 0, 'valide', '2025-07-18T09:14:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3c11cadb-c85a-4ca8-9329-39005d291c15', 'ARTI207250099', 0, 'valide', '2025-07-18T14:35:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c248f5d1-11e3-4840-84a4-e4f12c5b60a8', 'ARTI207250086', 0, 'valide', '2025-07-18T14:36:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('feb88aef-7e22-454d-8a62-c2e6e65c5365', 'ARTI207250087', 0, 'valide', '2025-07-18T14:36:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('58965ea9-b66a-4734-bcaa-504e827c695a', 'ARTI207250076', 0, 'valide', '2025-07-18T14:37:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3e73bed3-bb7a-4f40-a917-775b9159fd1a', 'ARTI207250078', 0, 'valide', '2025-07-18T14:38:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('643c318b-ee0e-464c-bb10-b0ee33da5cb6', 'ARTI207250057', 0, 'valide', '2025-07-21T12:19:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7f0f5b51-f3e2-4908-8d69-c399e8b20148', 'ARTI207250084', 0, 'valide', '2025-07-21T12:19:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72ac665a-2db7-4da2-89e9-e2eacc33061a', 'ARTI207250075', 0, 'valide', '2025-07-21T12:21:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('06f67f94-2c1a-4678-8a0c-ba7b5863ecb3', 'ARTI207250059', 0, 'valide', '2025-07-21T12:22:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('87035018-ab64-481e-b296-e7816c2909d9', 'ARTI207250060', 0, 'valide', '2025-07-21T12:23:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7dea8ba5-6c0a-4033-a51a-c07450b82e57', 'ARTI207250038', 0, 'valide', '2025-07-21T12:26:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('31eb75a3-4774-456e-bd8b-d9a08ad706d4', 'ARTI207250085', 0, 'valide', '2025-07-21T12:45:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6cdf636d-05c9-472b-9145-4b70232bb4e9', 'ARTI207250092', 0, 'valide', '2025-07-21T12:46:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a1cec67-c627-4181-ba70-f0efd1c99eaa', 'ARTI207250093', 0, 'valide', '2025-07-21T12:47:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('80d4ea17-b757-48a7-8f5c-eeef2374215a', 'ARTI207250094', 0, 'valide', '2025-07-21T12:48:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51637823-0b60-4cb4-a1eb-63d5c551206d', 'ARTI207250065', 0, 'valide', '2025-07-21T12:48:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('63cb162a-ba38-4d2c-aca5-aafe4964d381', 'ARTI207250083', 0, 'valide', '2025-07-21T12:49:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0c452d47-71d8-4d10-9705-a73fc8d292b8', 'ARTI207250082', 0, 'valide', '2025-07-21T12:50:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da1a8542-02c9-4e5b-a5c4-64ef73c9a9ea', 'ARTI207250050', 0, 'valide', '2025-07-21T12:52:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a6cf2fcf-1b01-4fff-adeb-5d8a8ccabc6d', 'ARTI207250098', 0, 'valide', '2025-07-21T13:42:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e837b936-1744-4688-aeac-96489b91f4c6', 'ARTI207250100', 0, 'valide', '2025-07-21T13:43:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a7344d2-0b2c-4a19-8669-9d5221542e9b', 'ARTI207250054', 0, 'valide', '2025-07-21T13:43:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('384e7655-1640-45ba-becf-60c953d404f2', 'ARTI207250063', 0, 'valide', '2025-07-21T13:44:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c8801178-cfe5-46c7-8e01-4f41851975ca', 'ARTI207250034', 0, 'valide', '2025-07-21T13:51:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7667d633-83ca-41aa-9be9-384c6fd0d79a', 'ARTI207250023', 0, 'valide', '2025-07-21T13:52:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('56e4c614-c1d6-4572-af6b-32f65e0393a7', 'ARTI207250121', 0, 'valide', '2025-07-22T05:37:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68531624-02f7-4480-9665-54553903bb6b', 'ARTI207250118', 0, 'valide', '2025-07-22T05:37:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6030a09-daf2-4ad3-bca2-3ec68aec167f', 'ARTI207250119', 0, 'valide', '2025-07-22T05:38:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dd4ede05-a67e-4cb7-bbd8-bf772d9f9769', 'ARTI207250103', 0, 'valide', '2025-07-22T05:39:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57e16548-f13f-45d7-8b09-3db9a5f06606', 'ARTI207250110', 0, 'valide', '2025-07-22T05:40:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a6f294ff-d3d2-4884-ab70-bb32fcaca589', 'ARTI207250105', 0, 'valide', '2025-07-22T05:41:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2002fc62-2728-4d61-aea1-9b858688d6fe', 'ARTI207250102', 0, 'valide', '2025-07-22T05:41:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('27ebb54a-a5fb-4c07-921f-689c717ad1f6', 'ARTI207250104', 0, 'valide', '2025-07-22T05:42:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a11beee4-16f6-4218-b883-b94427f1f37f', 'ARTI207250109', 0, 'valide', '2025-07-22T05:42:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ae2c2d1-1112-4f00-b420-5969e531813d', 'ARTI207250123', 0, 'valide', '2025-07-22T10:04:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1815aba7-2aff-4e3f-8aab-bce3effc59f5', 'ARTI207250101', 0, 'valide', '2025-07-22T10:05:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('167ecabc-50c9-4865-9457-984f9bf759e1', 'ARTI207250107', 0, 'valide', '2025-07-22T10:06:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bfd48470-26be-4ad3-b924-a9060cfeffec', 'ARTI207250111', 0, 'valide', '2025-07-22T10:07:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('101e38a8-a32e-4865-97d8-7db725e5022d', 'ARTI207250114', 0, 'valide', '2025-07-22T10:07:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9708e067-b14f-4f0d-ac9b-923535110e33', 'ARTI207250122', 0, 'valide', '2025-07-23T07:32:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a8ca94eb-e471-428e-9e36-e6a2f9dd2e0f', 'ARTI207250124', 0, 'valide', '2025-07-23T15:59:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('444aa851-836a-472b-9ae7-5074a7e0b9c6', 'ARTI207250125', 0, 'valide', '2025-07-23T16:00:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('34077ca7-f3e7-4f3d-857a-e6334e8d5e8d', 'ARTI207250120', 0, 'valide', '2025-07-23T16:01:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2457130e-47bb-4c19-a4ff-4b4a3c963522', 'ARTI207250115', 0, 'valide', '2025-07-23T16:01:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1d7c7aa7-b1b4-4620-b096-87a6c366b2f1', 'ARTI207250116', 0, 'valide', '2025-07-23T16:02:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('394e21df-8f82-41ca-97df-520c99a929ce', 'ARTI207250117', 0, 'valide', '2025-07-23T16:02:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e67a1629-debf-4c44-b9d8-dc75358dc982', 'ARTI207250055', 0, 'valide', '2025-07-23T16:03:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d31baaa1-f192-4b6c-a8ee-8943bcb506cf', 'ARTI207250126', 0, 'valide', '2025-07-24T12:49:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('932553ab-2157-4a2f-8524-7dceab7e9608', 'ARTI207250127', 0, 'brouillon', '2025-07-25T14:03:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b13c484-bcff-4269-b9d2-6574a3883262', 'ARTI207250128', 0, 'valide', '2025-07-25T14:04:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('caab6fb4-e465-42e5-943a-e552dfe5130b', 'ARTI207250129', 0, 'valide', '2025-07-25T14:05:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b577d052-b4db-4c0f-a7dc-ff259ebed6ad', 'ARTI207250131', 0, 'valide', '2025-07-25T14:06:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('21cf2101-fadf-464d-95c3-deb5fd317614', 'ARTI207250132', 0, 'valide', '2025-07-25T14:08:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('19fd4362-ddd7-4c82-88ce-3cb9c63d1482', 'ARTI207250134', 0, 'valide', '2025-07-25T14:09:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8a4bf9f5-7040-43bc-91a4-94724d3e2e75', 'ARTI207250136', 0, 'valide', '2025-07-26T11:00:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ca9f345e-9e29-4421-8ade-be56f5e0bab2', 'ARTI207250113', 0, 'valide', '2025-07-26T11:01:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('abfad596-b341-474a-b5c3-56ea3099818e', 'ARTI207250177', 0, 'valide', '2025-07-29T04:40:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4781fc0-f1b4-4162-bdd3-28bcbfd0b925', 'ARTI207250074', 0, 'valide', '2025-07-29T04:41:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c9107cc-ba60-4e7f-b800-cca3402a9ed1', 'ARTI207250181', 0, 'valide', '2025-07-30T09:58:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7a780b96-9e66-47a2-b840-808053fc15d5', 'ARTI207250130', 0, 'valide', '2025-07-30T10:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c161adc5-114f-4cf1-a8fd-a997a9a32d14', 'ARTI207250097', 0, 'valide', '2025-07-30T10:01:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6d154ba8-d65a-43bc-8b8f-f03540458a5a', 'ARTI207250179', 0, 'valide', '2025-07-30T10:02:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e73a3de9-29ac-4746-91a8-17ee79836575', 'ARTI207250211', 0, 'valide', '2025-08-02T12:54:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('91b24378-27e6-47ca-bd7b-724d023e7353', 'ARTI207250213', 0, 'valide', '2025-08-02T12:55:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4f8b609-4349-42b9-bf9b-69ee277f971d', 'ARTI207250212', 0, 'valide', '2025-08-02T12:56:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fdbfb331-ec7c-4ca0-b0d8-65007afce702', 'ARTI207250190', 0, 'valide', '2025-08-02T12:57:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f3a530a-3020-4a5e-a18b-b2ed05b4e04b', 'ARTI207250208', 0, 'valide', '2025-08-02T12:58:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cee8a928-7d8e-4d1a-87ca-e155ce2c8b05', 'ARTI207250206', 0, 'valide', '2025-08-02T12:59:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4f84fa1-36dc-42de-b7ca-64184a09be64', 'ARTI207250207', 0, 'valide', '2025-08-02T13:00:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1e856f32-d98e-45fe-9724-7133fee0ff56', 'ARTI207250204', 0, 'valide', '2025-08-02T13:01:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('05b3a045-1a67-4ba6-b1f5-906e044bf9d2', 'ARTI207250024', 0, 'valide', '2025-08-02T13:02:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b880404e-a18d-43f2-bddc-adad8d0d1807', 'ARTI207250183', 0, 'valide', '2025-08-02T22:25:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('48ae6ca3-8ab0-4b47-b9eb-92be379a4dee', 'ARTI207250184', 0, 'valide', '2025-08-02T22:26:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5fc75b67-6e94-48d1-860c-64fbbc778e62', 'ARTI207250186', 0, 'valide', '2025-08-02T22:27:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4e82edd4-9a4a-4237-b37f-97ef5b5ce1e5', 'ARTI207250188', 0, 'valide', '2025-08-02T22:27:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0651cac1-83ae-47bc-81d6-7060af2b20f3', 'ARTI207250191', 0, 'valide', '2025-08-02T22:28:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('846bffb3-bd53-4875-b28a-594198618ecf', 'ARTI207250192', 0, 'valide', '2025-08-02T22:29:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('274cc658-d8f2-4841-aada-872079102a1b', 'ARTI207250194', 0, 'valide', '2025-08-02T22:30:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('82b0bff5-f39f-4de4-b600-6b60e1bdbcdf', 'ARTI207250195', 0, 'valide', '2025-08-02T22:31:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5f3dead1-52cf-4c47-b6f2-31359a85a45a', 'ARTI207250196', 0, 'valide', '2025-08-02T22:32:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('32f4990a-f53c-4417-95cd-fb5034440fde', 'ARTI207250197', 0, 'valide', '2025-08-02T22:33:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ec7f2445-b4fa-4961-9b99-e02b0f136e99', 'ARTI207250199', 0, 'valide', '2025-08-02T22:34:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('484d4469-20d6-40cb-b2a9-6d79bef55487', 'ARTI207250200', 0, 'valide', '2025-08-02T22:35:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('167eb273-9130-4b07-85d4-0b8907b98f91', 'ARTI207250201', 0, 'valide', '2025-08-02T22:36:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6e5bf3c6-bffa-4fe5-8d57-7b3823e98468', 'ARTI207250202', 0, 'valide', '2025-08-02T22:37:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1db82fd-7e6f-4a8f-9246-3636922c2730', 'ARTI207250169', 0, 'valide', '2025-08-02T22:38:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5d2cf63d-b57f-4a38-8174-20142a733825', 'ARTI207250173', 0, 'valide', '2025-08-02T22:39:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6792e3bd-4db5-4742-adf1-96fb8a93440e', 'ARTI207250155', 0, 'valide', '2025-08-02T22:40:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d950cce8-8f8e-4488-96a6-817c4a240d3c', 'ARTI207250156', 0, 'valide', '2025-08-02T22:41:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('81d70025-51f5-4289-b9f6-dcfefcbed380', 'ARTI207250151', 0, 'valide', '2025-08-02T22:43:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('14944072-f763-46b9-930a-5d1485c80f01', 'ARTI207250095', 0, 'valide', '2025-08-02T22:44:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72256a8f-cbef-47d2-bc05-a98bae14b239', 'ARTI207250133', 0, 'valide', '2025-08-02T22:45:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4a6387e7-db23-40b5-b268-08b5069289d7', 'ARTI207250146', 0, 'valide', '2025-08-02T22:46:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b0c02194-1dc8-4a61-a336-6be1618ceeb4', 'ARTI207250141', 0, 'valide', '2025-08-02T22:47:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cc00754d-ffef-4289-ac0d-39a32597a015', 'ARTI207250140', 0, 'valide', '2025-08-02T22:48:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('870eb3dd-f5c4-406f-9cd6-0115a5973560', 'ARTI207250139', 0, 'valide', '2025-08-02T22:49:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('263f7b50-1612-4334-b4f4-b76c33c635f5', 'ARTI207250144', 0, 'valide', '2025-08-02T22:50:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('08b91b75-6459-4db5-a384-0f81207cbffd', 'ARTI207250135', 0, 'valide', '2025-08-02T22:51:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f5508a73-6205-42a8-bb6f-4a8fc6da1e8e', 'ARTI207250154', 0, 'valide', '2025-08-02T22:53:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('77035ed0-a9d7-4670-94c8-06960b05fe61', 'ARTI207250161', 0, 'valide', '2025-08-02T22:54:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('77e172bb-82f4-47bb-90ae-f0959024dd57', 'ARTI207250163', 0, 'brouillon', '2025-08-02T22:55:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e2186e24-a7e0-4ba4-8004-bf8614d0428f', 'ARTI207250167', 0, 'valide', '2025-08-02T22:56:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ccfe147-d8a7-46b5-a6bb-87700d162854', 'ARTI207250162', 0, 'valide', '2025-08-02T22:57:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('00c18f6e-cb34-4d1a-b561-95c99445540d', 'ARTI207250164', 0, 'valide', '2025-08-02T22:58:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('22c920ed-c022-48d7-a3a5-079afff06a8e', 'ARTI207250168', 0, 'valide', '2025-08-02T22:59:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('78897f59-7f6c-4608-8a7e-f00984365e12', 'ARTI207250203', 0, 'valide', '2025-08-02T23:05:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b6358058-c3d6-43fc-85b3-17dbc7599038', 'ARTI207250219', 0, 'valide', '2025-08-05T05:21:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('904edc68-fcf1-46ad-860e-a354417490da', 'ARTI207250143', 0, 'valide', '2025-08-05T07:41:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('788208ad-ff79-4734-81f2-f01076e91bcc', 'ARTI207250153', 0, 'valide', '2025-08-05T07:42:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('85641c20-8bcb-4e4c-8ce8-5e8da87a5071', 'ARTI207250157', 0, 'valide', '2025-08-05T07:43:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a4f4bb0a-0384-4a8a-b7f1-bdecf54d29bb', 'ARTI207250145', 0, 'valide', '2025-08-05T07:44:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9dd4b862-d3ec-4a49-9101-c4e02827018b', 'ARTI207250138', 0, 'valide', '2025-08-05T07:45:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f0d8477c-5e54-4dd2-8d5c-39c5ced27e46', 'ARTI207250158', 0, 'valide', '2025-08-05T07:46:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6f9ee538-3a9e-479a-a6f9-ead1dc4529ce', 'ARTI207250152', 0, 'valide', '2025-08-05T07:47:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1275ed9a-0177-4154-8e46-6faf9c96a950', 'ARTI207250165', 0, 'brouillon', '2025-08-05T07:48:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1640dc5-4628-4c2d-b8a6-ff1d7f018810', 'ARTI207250166', 0, 'valide', '2025-08-05T07:49:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('97a9ed1f-684a-496b-afbd-9708212a20d5', 'ARTI207250137', 0, 'valide', '2025-08-05T07:50:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5d609c9a-f65a-468f-ad22-73a52fec0b51', 'ARTI207250142', 0, 'valide', '2025-08-05T07:51:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e56d68c6-cdb1-4c10-90d0-de4a66d5e414', 'ARTI207250170', 0, 'valide', '2025-08-05T07:53:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e51edf13-4626-4fb4-9a45-bf080b2ee8f2', 'ARTI207250159', 0, 'valide', '2025-08-05T07:54:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('724e1142-ceab-4310-9786-75d374ed2c29', 'ARTI207250171', 0, 'valide', '2025-08-05T07:55:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5091b479-d834-41e0-8b9a-de81371a6c0e', 'ARTI207250172', 0, 'valide', '2025-08-05T07:56:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('767a4fef-2aef-4fbe-b118-37a13e9751d7', 'ARTI207250174', 0, 'valide', '2025-08-05T07:57:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b3961a03-d141-4ea4-b5d2-15f1155e8c63', 'ARTI207250176', 0, 'valide', '2025-08-05T07:58:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c77115d-84c2-40a9-944d-dba0b70ee1c6', 'ARTI207250147', 0, 'valide', '2025-08-05T07:59:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3989287-d83e-4f15-b5da-73aacecb9a07', 'ARTI207250148', 0, 'valide', '2025-08-05T08:00:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d2953b5b-0125-4980-8948-710366916986', 'ARTI207250149', 0, 'valide', '2025-08-05T08:01:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('422f2f36-edcb-4d84-a174-438dbf2bae72', 'ARTI207250150', 0, 'valide', '2025-08-05T08:02:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('92672249-48de-4bd2-9651-684036fc52a8', 'ARTI207250205', 0, 'valide', '2025-08-05T08:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a6f2a98-d9c6-4380-8077-83bdf7d82190', 'ARTI207250198', 0, 'valide', '2025-08-05T08:04:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bae3b2c2-7287-49fe-8f71-d1804160652c', 'ARTI207250193', 0, 'valide', '2025-08-05T08:05:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('50ca0c90-d359-4089-ba6a-bb5eb01973ee', 'ARTI207250189', 0, 'valide', '2025-08-05T08:06:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('05c6e4a2-54e1-44f3-b651-299a71dc40d6', 'ARTI208250003', 0, 'valide', '2025-08-05T08:08:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('385a6c26-9394-4228-b5c8-8c76753db2d5', 'ARTI208250001', 0, 'valide', '2025-08-05T08:09:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e39e5ceb-6bcb-4b66-bbec-fc30d21f51f6', 'ARTI208250016', 0, 'valide', '2025-08-07T01:10:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3895f9c4-7b16-4449-9522-dca89e5bd5f7', 'ARTI208250017', 0, 'valide', '2025-08-07T01:11:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3013a0aa-1849-45b6-b79d-f96d5819ab5b', 'ARTI208250010', 0, 'valide', '2025-08-07T01:12:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d10009d-5bcb-4d6e-8261-454502b55787', 'ARTI208250011', 0, 'valide', '2025-08-07T01:13:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ea982787-c492-4cfa-a191-91b3b2e761c2', 'ARTI207250218', 0, 'valide', '2025-08-07T01:14:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7b240d41-5d43-433b-a02e-519f82a61a2a', 'ARTI207250221', 0, 'valide', '2025-08-07T01:15:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a7e09c72-fa7e-44d5-b3f4-d9ff0fc7859d', 'ARTI207250222', 0, 'valide', '2025-08-07T01:16:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a852e74b-ffe5-49be-a578-496c78612362', 'ARTI207250223', 0, 'valide', '2025-08-07T01:17:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8433671d-cf6d-4132-b7c0-1e3f41925127', 'ARTI207250224', 0, 'valide', '2025-08-07T01:18:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9de9ab8a-eeb5-4bfa-a020-fb0ab3c792a2', 'ARTI207250225', 0, 'valide', '2025-08-07T01:19:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e13f1ef3-e38c-4469-b19f-900abd98478a', 'ARTI207250227', 0, 'valide', '2025-08-07T01:20:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7fa27476-0d87-4720-b78c-495e4cac0f1c', 'ARTI207250226', 0, 'valide', '2025-08-07T01:21:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1aea914f-63eb-4573-adf9-52f8409cc234', 'ARTI208250002', 0, 'valide', '2025-08-07T01:22:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b9b0763a-4f86-44b4-92db-3fe006684e0b', 'ARTI208250004', 0, 'valide', '2025-08-07T01:23:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e9c1ed3b-5dfb-4dbf-b0cc-0837e008a6e9', 'ARTI208250008', 0, 'valide', '2025-08-07T01:24:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('85b22869-aa8f-411a-8da6-384d306fc0c6', 'ARTI208250005', 0, 'valide', '2025-08-07T01:25:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('15adc12b-c1ce-4eba-a4e9-9a88227df1ab', 'ARTI208250007', 0, 'valide', '2025-08-07T01:26:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c4bb9c4a-74bd-4d0f-9292-5bfd0ca40a59', 'ARTI207250209', 0, 'valide', '2025-08-07T01:27:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('975d6342-5f47-43ce-8baf-5f52a5333f60', 'ARTI207250056', 0, 'valide', '2025-08-07T01:28:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d773b861-4ef0-4d5e-9840-0c3ce764f4a9', 'ARTI208250019', 0, 'valide', '2025-08-10T17:09:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b8312af8-2f93-48a6-856f-c7fcbf0a0095', 'ARTI208250028', 0, 'valide', '2025-08-10T17:10:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a4714b72-6e9d-4e2d-93bf-fadadd198289', 'ARTI208250030', 0, 'brouillon', '2025-08-13T10:29:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7da515d1-4b90-4c3a-a590-25eefd8ce078', 'ARTI208250015', 0, 'valide', '2025-08-13T10:34:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ba782872-2388-4c60-8c68-b544570a8fe9', 'ARTI208250023', 0, 'valide', '2025-08-13T10:37:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('090b350e-d802-4f56-ab98-fd253e8f61e9', 'ARTI208250020', 0, 'valide', '2025-08-13T10:38:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d7e65c6a-12cd-49b8-8403-604d58678d33', 'ARTI208250031', 0, 'valide', '2025-08-13T10:41:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('81b9a221-7c1c-4cee-9f27-61d8cee4210f', 'ARTI208250024', 0, 'valide', '2025-08-13T10:43:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('530ce629-1110-4dc5-aa83-84c9d43d663c', 'ARTI208250022', 0, 'valide', '2025-08-13T10:54:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ece4dd00-329a-4c41-87fc-5ac872ad59d3', 'ARTI208250018', 0, 'valide', '2025-08-13T10:56:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('95a0e971-06bf-46b0-a372-73e817e9c44c', 'ARTI208250026', 0, 'valide', '2025-08-13T10:58:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2126832b-8ef3-4157-872b-92265033df88', 'ARTI208250012', 0, 'valide', '2025-08-13T11:00:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0e4e70a8-6e5c-491a-a7b1-c9670c870ad5', 'ARTI207250214', 0, 'valide', '2025-08-13T11:01:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c01a30c-1c3a-47c4-ad9f-292a9e69c733', 'ARTI207250215', 0, 'valide', '2025-08-13T11:11:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('564bfe51-85fd-4699-add0-b1f5c3d1c456', 'ARTI207250220', 0, 'valide', '2025-08-13T11:13:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d7344eeb-4fde-4b9f-ad77-a3e4b8f3c18f', 'ARTI208250009', 0, 'valide', '2025-08-13T11:15:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b67e4c57-6066-4a24-bede-da28cc7b1a81', 'ARTI207250178', 0, 'valide', '2025-08-13T11:21:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c082a4f7-6897-4542-809a-39428842ff81', 'ARTI207250106', 0, 'valide', '2025-08-13T11:24:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dcc9e1bb-c7e7-4f32-a8e8-7f2086bfd2db', 'ARTI208250032', 0, 'valide', '2025-08-14T06:04:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8628846d-7ca6-4eaf-bd03-73c1d97d94a7', 'ARTI208250034', 0, 'valide', '2025-08-16T22:42:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9fb607f8-8d74-490f-9fc7-fff0d26c545e', 'ARTI208250033', 0, 'valide', '2025-08-16T22:43:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6f51a9f-914c-4f6f-8e9c-c481357cb8d1', 'ARTI208250035', 0, 'valide', '2025-08-16T22:44:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c2a59a0b-4de6-47dd-a09b-8ad4e43180fc', 'ARTI208250039', 0, 'valide', '2025-08-18T06:02:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('383b0d65-430b-4bdf-ac0f-152cfeec5ea5', 'ARTI208250040', 0, 'valide', '2025-08-18T06:03:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('638c97b0-a27e-4fc4-a1af-bc3522e33606', 'ARTI207250062', 0, 'valide', '2025-08-18T06:04:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fb0dc4bd-8a50-4028-b625-8ffd7efb6d66', 'ARTI208250042', 0, 'valide', '2025-08-18T06:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('75f279a4-975c-41d0-a20e-32c7bf937b93', 'ARTI207250210', 0, 'valide', '2025-08-18T06:06:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dccd47de-0ccf-442c-b69a-998150f53129', 'ARTI207250175', 0, 'valide', '2025-08-18T06:08:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('75be83a1-176a-442f-915b-d1dde689b70f', 'ARTI207250088', 0, 'valide', '2025-08-18T06:09:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('afb4005b-aa3c-42c2-945a-1c8fd0e59279', 'ARTI207250090', 0, 'valide', '2025-08-18T06:10:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('66ea7f1f-8557-4fa1-806a-140d8f529a8d', 'ARTI207250058', 0, 'valide', '2025-08-18T06:11:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d5d2208-3e0e-4fe8-af1f-8f9a0bec7b18', 'ARTI207250091', 0, 'valide', '2025-08-18T06:12:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d78c4d91-19f1-4c7e-83d9-bc08fc6d97fe', 'ARTI207250089', 0, 'valide', '2025-08-18T06:13:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('54a910d9-09ac-4170-9d1e-619e32422f3e', 'ARTI208250006', 0, 'valide', '2025-08-18T15:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('058ea6cc-3d82-47d0-b7d0-f2f9fb219b40', 'ARTI208250043', 0, 'valide', '2025-08-18T22:02:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fda83633-be80-4566-afe7-f522705d3a72', 'ARTI208250044', 0, 'valide', '2025-08-18T22:03:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7fd456e5-7fa7-4901-b4da-a4cd894bcf6c', 'ARTI208250050', 0, 'valide', '2025-08-19T08:32:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7ca7ac3-8348-4353-8f80-2767d039a97c', 'ARTI208250051', 0, 'valide', '2025-08-19T08:33:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('18990397-b650-49ba-acfa-5090a4f219c2', 'ARTI208250052', 0, 'valide', '2025-08-19T08:34:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7abdf59d-4f5a-4e6a-a3a7-e1eca0a820f4', 'ARTI208250046', 0, 'valide', '2025-08-19T08:35:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6a351b05-5e37-4f9d-81a7-7bc6bf88fa56', 'ARTI208250049', 0, 'valide', '2025-08-19T08:37:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8da4ae50-b696-443c-a0dd-c810a02a74ea', 'ARTI208250036', 0, 'valide', '2025-08-19T08:38:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef29d369-ab85-415d-a236-fa72dabb40d2', 'ARTI207250052', 0, 'valide', '2025-08-20T06:08:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f7bcfa59-8ce7-4e3b-bee3-b3eeb88a06ba', 'ARTI207250096', 0, 'valide', '2025-08-20T06:09:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4fe619bf-a897-4397-9a49-63f43086101c', 'ARTI208250045', 0, 'valide', '2025-08-20T06:34:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c12ce6ac-820d-4ec4-a588-8ac4489c435d', 'ARTI208250056', 0, 'valide', '2025-08-21T08:57:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('25148f06-7b39-4d1c-aae0-d26f4100b662', 'ARTI208250083', 0, 'valide', '2025-08-21T11:26:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f3c0ed1e-e82a-4924-9195-ced7935cb4a0', 'ARTI208250066', 0, 'valide', '2025-08-23T07:50:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3fe03944-73ad-40c0-be8c-f6c4599f2a70', 'ARTI208250064', 0, 'valide', '2025-08-23T07:50:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72a2d3ef-b8e3-409a-970d-27f0637088e5', 'ARTI208250085', 0, 'valide', '2025-08-23T07:51:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('136714f8-5e35-448f-992d-a9e4f3b6fe0c', 'ARTI208250065', 0, 'valide', '2025-08-23T07:52:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1ab7fbd5-8466-457b-b06b-bc64d89ec0ae', 'ARTI208250067', 0, 'valide', '2025-08-23T07:53:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a5ee6c12-5e5e-448b-b1c5-c24241bff7d2', 'ARTI208250068', 0, 'valide', '2025-08-23T07:54:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9e4d85ae-747d-42c4-8d96-feafebf44e4b', 'ARTI208250069', 0, 'valide', '2025-08-23T07:55:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1778181b-d753-4252-af17-63f82f1876d2', 'ARTI208250082', 0, 'valide', '2025-08-23T07:56:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a1177e9f-9e91-4f17-b09b-8ef8697ca910', 'ARTI208250084', 0, 'valide', '2025-08-23T07:57:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a824008a-61b0-4fe9-90d6-5043d069b197', 'ARTI208250072', 0, 'valide', '2025-08-23T07:58:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8fc578cd-65d5-4038-8181-21fb9ca8488e', 'ARTI208250073', 0, 'valide', '2025-08-23T07:59:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9fa73e12-d183-4050-a691-379d0ab34a14', 'ARTI208250078', 0, 'valide', '2025-08-23T08:00:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7113686a-b59c-4f87-b471-fd05618bbf64', 'ARTI208250057', 0, 'valide', '2025-08-23T08:01:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('56d9c434-84f6-45c3-8868-3e1a1adf5bf5', 'ARTI208250029', 0, 'valide', '2025-08-23T08:02:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e2f909d8-e653-407f-a78e-2f68e5c78032', 'ARTI208250058', 0, 'valide', '2025-08-23T08:04:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d216f19-ef15-43a7-9ad7-ea5f446b6208', 'ARTI208250055', 0, 'valide', '2025-08-23T08:05:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ceced52-f716-4630-a894-f9d2d849764e', 'ARTI208250053', 0, 'valide', '2025-08-23T08:06:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('03d4cd86-567b-402c-b93f-3231bd69a425', 'ARTI207250216', 0, 'valide', '2025-08-23T08:08:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8560ba3e-7267-4362-9fae-10286f2f18ea', 'ARTI208250106', 0, 'valide', '2025-08-25T17:09:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2fc7c8f1-a434-42f2-8f9f-147d6c11f741', 'ARTI208250105', 0, 'valide', '2025-08-25T17:10:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e70f5d63-bb59-4b4c-888f-82f5443f8466', 'ARTI208250097', 0, 'valide', '2025-08-25T17:11:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3eb907f8-731b-4d55-a27d-8a38230b2fb5', 'ARTI208250098', 0, 'valide', '2025-08-25T17:12:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f8073f29-90e2-4d2a-9fec-46f6c70548a3', 'ARTI208250099', 0, 'valide', '2025-08-25T17:13:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4ed09f39-4361-44c9-abdb-017f5f3f88a0', 'ARTI208250100', 0, 'valide', '2025-08-25T17:14:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('75174a67-729d-4f9d-93a0-c3b9f30ed286', 'ARTI208250070', 0, 'valide', '2025-08-25T17:15:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e9f83f21-a497-4913-8700-ab3da21e8eaa', 'ARTI208250071', 0, 'valide', '2025-08-25T17:16:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cf451d7a-cb88-4165-acc7-f2abecd25530', 'ARTI208250076', 0, 'valide', '2025-08-25T17:17:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ebd0b19-78de-41d3-82cf-b263138772e0', 'ARTI208250075', 0, 'valide', '2025-08-25T17:18:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('45576c4c-68b6-485a-8cfd-930dd310c7bf', 'ARTI208250074', 0, 'valide', '2025-08-25T17:19:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3beb1413-53fb-4226-8d8e-4a1f4e55e386', 'ARTI208250081', 0, 'valide', '2025-08-25T17:21:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4bc3442c-f262-4a95-9147-0b3193c103fb', 'ARTI208250080', 0, 'valide', '2025-08-25T17:22:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a5a4bf62-1090-4d38-9919-c9c07bb8f2fc', 'ARTI208250079', 0, 'valide', '2025-08-25T17:23:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('45fb843a-67c9-4328-a35e-f9c73b7ed442', 'ARTI208250077', 0, 'valide', '2025-08-25T17:24:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('53030f45-0c52-4dde-8b59-46aaa781dbf9', 'ARTI208250061', 0, 'valide', '2025-08-25T17:25:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b1d534e0-1f72-4647-865e-2ac6171b3e00', 'ARTI207250081', 0, 'valide', '2025-08-25T17:26:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('04971fc4-aa1e-415f-9cf4-47ac8b2428aa', 'ARTI208250037', 0, 'valide', '2025-08-25T17:28:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ecbe8072-5533-4719-9856-78ef9d6f636a', 'ARTI208250054', 0, 'valide', '2025-08-25T17:29:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f5aed1d3-4763-45e5-890a-97247e84934e', 'ARTI208250104', 0, 'valide', '2025-08-25T17:30:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7ed914db-ec6d-453c-b15e-d93f396d9498', 'ARTI208250063', 0, 'valide', '2025-08-25T17:32:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30096278-f621-41d0-8d0f-55eba47d2475', 'ARTI208250062', 0, 'valide', '2025-08-25T17:33:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e4f2ff77-1755-4709-b68f-78e7f8b8cd78', 'ARTI208250088', 0, 'valide', '2025-08-26T12:44:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('33db83f8-14d7-4fa5-9cc1-cb7ed36f5e38', 'ARTI208250093', 0, 'valide', '2025-08-26T12:45:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da991322-9ee3-4dcf-a378-03ee912479a9', 'ARTI208250094', 0, 'valide', '2025-08-26T12:46:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('785c48aa-281d-4b27-972d-cb3281a19ad6', 'ARTI208250095', 0, 'valide', '2025-08-26T12:47:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('918ea81e-afac-4043-91db-24f8a3f73b19', 'ARTI208250096', 0, 'valide', '2025-08-26T12:49:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('33c62267-c19c-4778-b35a-8850109f066e', 'ARTI208250087', 0, 'valide', '2025-08-26T12:50:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('518209bf-bc40-474c-b04c-31e0bdde856b', 'ARTI208250107', 0, 'valide', '2025-08-26T12:51:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0062ddb3-d51d-4386-8f63-facf9d334339', 'ARTI208250108', 0, 'valide', '2025-08-26T12:52:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('77cfde39-9478-4929-8466-e58c4c617bdb', 'ARTI208250109', 0, 'valide', '2025-08-26T12:53:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f4665b3f-6636-46c7-8a91-5f9aa75efc9c', 'ARTI208250101', 0, 'valide', '2025-08-26T12:54:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6d793b98-9662-48dd-8cbd-86076c46dcba', 'ARTI208250103', 0, 'valide', '2025-08-26T12:55:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aa69c50f-5068-47bf-95bc-48f6cf16c777', 'ARTI208250027', 0, 'valide', '2025-08-26T12:56:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('24bbdc11-259f-4f9b-af0a-1bb586896923', 'ARTI208250041', 0, 'valide', '2025-08-26T17:56:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2aa09f97-cd15-4899-98d2-93aeb7bf6178', 'ARTI208250114', 0, 'valide', '2025-08-26T20:12:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a60da6f4-1e76-41e7-8222-b10953f912f2', 'ARTI208250115', 0, 'valide', '2025-08-26T20:14:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d9f3c2a-2fbd-41d2-9014-3b21768b26bf', 'ARTI208250113', 0, 'valide', '2025-08-26T20:17:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f85f8ef3-9885-4ec3-85da-2e21bf5bbd15', 'ARTI208250112', 0, 'valide', '2025-08-26T20:18:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e4f31eeb-d75b-412b-8a98-d9d7b11010dc', 'ARTI208250116', 0, 'valide', '2025-08-26T20:19:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6e3e2ac-7200-42ed-ba31-8dda74a27c39', 'ARTI208250118', 0, 'valide', '2025-08-26T20:20:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('268a1d84-c566-40fc-b73d-c15e5e893f17', 'ARTI208250117', 0, 'valide', '2025-08-26T21:52:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a3adcca-0971-42b4-8fe6-ff52fec6390a', 'ARTI208250091', 0, 'valide', '2025-08-26T21:53:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dc786c4a-24f0-4ada-9d61-2e429954da8f', 'ARTI208250092', 0, 'valide', '2025-08-27T05:44:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6886f128-e7da-4538-8406-43a1837737d8', 'ARTI208250047', 0, 'valide', '2025-08-27T05:45:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('256750d5-8ed9-48b9-8c60-4394da347198', 'ARTI208250132', 0, 'valide', '2025-08-28T06:38:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ff7fee0d-78bf-4544-b891-aa3923fbf769', 'ARTI208250134', 0, 'valide', '2025-08-28T06:39:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3cad9b34-21b9-4e65-bdd1-94acc8f88eda', 'ARTI208250125', 0, 'valide', '2025-08-28T06:40:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('994bfe88-0ad6-4605-a7bf-042a4a34193d', 'ARTI208250127', 0, 'valide', '2025-08-28T06:41:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('105a7c30-4591-430c-87f5-a231a644aeee', 'ARTI208250111', 0, 'valide', '2025-08-28T06:42:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8bfa8f9c-7e0f-4384-9026-b986c215e0bc', 'ARTI207250073', 0, 'valide', '2025-08-28T06:45:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1be89749-c33f-45ac-af01-5ab76b28e804', 'ARTI208250133', 0, 'valide', '2025-08-28T10:00:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cec6c8f9-0abb-498c-af3d-294c5e64f59a', 'ARTI208250128', 0, 'valide', '2025-08-28T10:02:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68027d2d-b23d-4222-9187-e2e82908a735', 'ARTI208250120', 0, 'valide', '2025-08-28T10:03:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c33dff7-b60d-4fca-919d-815f96fbdb7a', 'ARTI208250130', 0, 'valide', '2025-08-28T13:25:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dfd4e8ef-55cb-4c86-8964-012d41a6ee33', 'ARTI208250131', 0, 'valide', '2025-08-28T13:26:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f863ec8-e3d9-41d6-8d0f-eb343168395f', 'ARTI208250171', 0, 'valide', '2025-08-28T23:30:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a5946b8-cea0-42ff-851b-4229399778a0', 'ARTI208250169', 0, 'valide', '2025-08-28T23:32:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3de0375c-0382-4897-be65-422fc615a672', 'ARTI208250166', 0, 'valide', '2025-08-28T23:33:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5571cf25-8b95-4ecd-b5e1-e96e581050ba', 'ARTI208250168', 0, 'valide', '2025-08-28T23:34:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7d5de81c-021c-457b-9ae2-a64ed7f53d22', 'ARTI208250162', 0, 'valide', '2025-08-28T23:35:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2ec0588a-a6df-433d-a703-51e5f45c66b8', 'ARTI208250163', 0, 'valide', '2025-08-28T23:36:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dbb68ee9-cb03-408d-91c1-2f72b50f256e', 'ARTI208250164', 0, 'valide', '2025-08-28T23:37:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a0da13d1-35d9-4d41-963d-adb19d8dd537', 'ARTI208250156', 0, 'valide', '2025-08-28T23:38:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d2a52031-561e-42aa-9225-30232f7d60e6', 'ARTI208250135', 0, 'valide', '2025-08-29T10:55:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d1d81ef1-5924-40a1-84a1-b0690aad96bf', 'ARTI208250138', 0, 'valide', '2025-08-29T10:57:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('701c1e7c-7cd5-4cc8-a64c-c7946400a32e', 'ARTI208250139', 0, 'valide', '2025-08-29T10:57:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('321bcf58-6da7-4ab4-9feb-4959b007aca2', 'ARTI208250172', 0, 'valide', '2025-08-31T23:07:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2e84bdd-19df-4b5e-a336-1dbcd5441997', 'ARTI208250173', 0, 'valide', '2025-08-31T23:08:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d969f9d5-b5f7-420e-ae2f-dd7c904158b5', 'ARTI208250174', 0, 'valide', '2025-08-31T23:09:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c99efb42-86cb-4cb1-9d1a-913c6e8ba798', 'ARTI208250144', 0, 'valide', '2025-08-31T23:10:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c3a840bc-cdb8-4502-8ed2-8456efda086e', 'ARTI208250146', 0, 'valide', '2025-08-31T23:11:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8e9278a7-4152-4ebe-af4c-2a0cd55792a9', 'ARTI208250147', 0, 'valide', '2025-08-31T23:12:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3d25884c-76e9-45fa-9b57-948eddf5fa9b', 'ARTI208250148', 0, 'valide', '2025-08-31T23:13:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('47dbdf87-1013-49d4-883d-5ac2e5e004dc', 'ARTI208250150', 0, 'valide', '2025-08-31T23:15:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d57a1823-eebe-40da-ab50-8fa173519033', 'ARTI208250143', 0, 'valide', '2025-08-31T23:16:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dd951f71-ea9f-45b8-a6e5-080b39d152f5', 'ARTI208250137', 0, 'valide', '2025-08-31T23:16:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ff23475-17e3-4e20-b8db-2efc7701b267', 'ARTI208250142', 0, 'valide', '2025-08-31T23:17:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('26b069b8-53e3-4c20-9a85-55871eb47c6b', 'ARTI208250136', 0, 'valide', '2025-08-31T23:19:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0dbd94ae-56b2-46f0-8bdf-271efca69a9e', 'ARTI208250151', 0, 'valide', '2025-08-31T23:19:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7242d910-7376-4c94-9401-b9aa432e461f', 'ARTI208250152', 0, 'valide', '2025-08-31T23:20:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1843ed6a-bfad-4ff6-8eba-26a92a9e87bd', 'ARTI208250153', 0, 'valide', '2025-08-31T23:21:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b8da7e4b-5a9f-4b52-8d66-d2d09910c509', 'ARTI208250154', 0, 'valide', '2025-08-31T23:22:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4fb1f56e-bee6-48e9-9f3d-d75687e1bdab', 'ARTI208250155', 0, 'valide', '2025-08-31T23:23:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('076d9152-aff5-45fc-9f32-daeec762938c', 'ARTI208250157', 0, 'valide', '2025-08-31T23:24:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1fcae2e8-497e-40a0-be89-113227204602', 'ARTI208250158', 0, 'valide', '2025-08-31T23:25:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f0940f92-cf38-4954-9791-45be151043b3', 'ARTI208250159', 0, 'valide', '2025-08-31T23:26:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('17d508fa-f347-4f92-9d16-a650cfd6a606', 'ARTI208250161', 0, 'valide', '2025-08-31T23:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fa82f094-0446-43dc-9976-68c9e6066965', 'ARTI208250175', 0, 'valide', '2025-09-01T14:04:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7f751ae2-bbec-4636-8e6c-8d556eae2f14', 'ARTI208250178', 0, 'valide', '2025-09-01T14:05:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('17aa73b7-4c74-4e91-b3ba-6d3d0093ca05', 'ARTI208250176', 0, 'valide', '2025-09-01T14:07:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d7d4f2f0-a1f0-4bb9-b7da-1941b9845296', 'ARTI208250048', 0, 'valide', '2025-09-01T14:08:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6165657b-e070-4ae6-b30a-c3bd779ab82b', 'ARTI209250002', 0, 'valide', '2025-09-02T05:20:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f138085e-e915-4b42-9354-25796900e1ca', 'ARTI209250003', 0, 'valide', '2025-09-02T05:21:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a2cbc78-6c6f-4cc3-9754-5c455be24a80', 'ARTI208250179', 0, 'valide', '2025-09-02T05:22:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6f09ed4f-994d-460f-b55e-33ea2bde2202', 'ARTI208250160', 0, 'valide', '2025-09-02T05:24:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('29bc48bb-40cd-4bd6-8623-8c9a88b558ae', 'ARTI208250167', 0, 'valide', '2025-09-02T05:25:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aeff02f5-4ae9-4e35-b5ef-e275361cc2cb', 'ARTI208250165', 0, 'valide', '2025-09-02T05:26:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4eb8d4e4-a907-4d71-ab9a-382601f91708', 'ARTI208250059', 0, 'valide', '2025-09-02T05:27:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9caa987f-5016-4566-a07a-6923f3f6e2bb', 'ARTI208250014', 0, 'valide', '2025-09-02T05:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('86b65e42-c239-4b61-b946-db4491b13c8f', 'ARTI209250005', 0, 'valide', '2025-09-08T09:25:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1524c544-ad75-4070-97b4-a079ba1b4906', 'ARTI209250006', 0, 'valide', '2025-09-08T09:26:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a0e107e-4691-4efb-861a-3b65666438a7', 'ARTI209250007', 0, 'valide', '2025-09-08T09:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2e751c67-c0a5-4506-989a-85de024a2084', 'ARTI209250008', 0, 'valide', '2025-09-08T09:28:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('54d28427-615c-4aad-9363-c1977fe35ea5', 'ARTI209250009', 0, 'valide', '2025-09-08T09:30:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cc7eda1d-10c6-42f3-8684-d5e33be4d12f', 'ARTI208250177', 0, 'valide', '2025-09-08T09:31:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f787d55f-5e92-4ea9-8ed0-350f8bb48ac6', 'ARTI208250124', 0, 'valide', '2025-09-08T09:32:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('20e27d0c-3408-491c-a58a-bfdfa4bee294', 'ARTI208250126', 0, 'valide', '2025-09-08T09:33:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('38b67c8c-22e1-4a16-938b-ffa5671f98d5', 'ARTI208250123', 0, 'valide', '2025-09-08T09:35:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6bd5986d-4cf2-44d4-9cc1-80235e9acdf3', 'ARTI208250121', 0, 'valide', '2025-09-08T09:36:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d9ee4873-1ae8-4c2b-85ba-d26673955fdb', 'ARTI208250090', 0, 'valide', '2025-09-08T09:37:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b796b2e0-9650-4b9f-a4e2-26ca571ea7db', 'ARTI208250013', 0, 'valide', '2025-09-08T09:38:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f696ffd2-b704-4703-bbef-fe79755f7f16', 'ARTI207250108', 0, 'valide', '2025-09-08T09:39:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30ab3581-bb34-4e4f-aea7-2d0e96332db1', 'ARTI209250014', 0, 'valide', '2025-09-09T11:01:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a018829f-bc9c-43ca-a8a5-110145552270', 'ARTI209250028', 0, 'valide', '2025-09-10T13:23:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('17dddd45-f151-4e94-b375-e4dc9bcf3018', 'ARTI209250029', 0, 'valide', '2025-09-10T13:25:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6657aa63-7e6b-4949-a0d7-61229d85d55a', 'ARTI209250025', 0, 'valide', '2025-09-11T07:49:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bb8c93ec-461d-4190-b5d0-73cf025dfd74', 'ARTI209250022', 0, 'valide', '2025-09-11T07:51:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('228eb776-638e-4ba4-867b-3759456b477d', 'ARTI209250021', 0, 'valide', '2025-09-11T07:52:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f9487fa0-f171-420c-8930-b917f1491753', 'ARTI209250026', 0, 'valide', '2025-09-11T07:53:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('354a0a75-2392-4ab0-872c-c837f50d3d64', 'ARTI209250027', 0, 'valide', '2025-09-11T07:54:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6df362c1-be71-499c-93bd-55229b63aa19', 'ARTI209250023', 0, 'valide', '2025-09-11T07:55:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57a5e20b-3989-4571-9115-5331d9a7630e', 'ARTI208250025', 0, 'valide', '2025-09-11T07:56:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('af78a8a4-e0f9-43f7-bfbd-53b1811dcdda', 'ARTI208250086', 0, 'valide', '2025-09-11T07:58:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('227bcfe9-c804-4ce8-89f5-a018509d0260', 'ARTI209250013', 0, 'valide', '2025-09-11T07:59:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cab9f661-71ea-496e-9bc7-e67b9c406bdb', 'ARTI209250016', 0, 'valide', '2025-09-11T08:00:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0f6ad9d9-a083-4a33-8d53-fb21d5c1c76f', 'ARTI209250045', 0, 'valide', '2025-09-11T15:51:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae990b30-8cd0-4580-bd8d-cf040ebb6b81', 'ARTI209250046', 0, 'valide', '2025-09-11T15:52:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('890e4caa-a9f0-4270-9d9e-2100cb8be212', 'ARTI209250047', 0, 'valide', '2025-09-11T15:53:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('051423e6-8acf-4788-87b6-8c14b7f0353c', 'ARTI209250040', 0, 'valide', '2025-09-11T15:54:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('822ba068-5920-468c-badb-f86db8005a8c', 'ARTI209250041', 0, 'valide', '2025-09-11T15:55:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('410c596b-6e43-441f-9a91-d500cca3e254', 'ARTI209250042', 0, 'valide', '2025-09-11T15:57:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fa3498fe-e9f7-4957-bbfa-ce762506141d', 'ARTI209250043', 0, 'valide', '2025-09-11T15:58:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c167a50c-c32c-4208-8cb6-e204bafa7024', 'ARTI209250015', 0, 'valide', '2025-09-11T15:59:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cc1cf772-6119-4c54-947f-6bd5adf3b585', 'ARTI209250004', 0, 'valide', '2025-09-11T16:01:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dcf1cf56-079c-4e2c-a895-3a518d065a83', 'ARTI209250035', 0, 'valide', '2025-09-15T12:55:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8f4fa348-ef65-426d-bf62-3d0af03fea5a', 'ARTI209250034', 0, 'valide', '2025-09-15T12:57:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('656ae3f3-68e1-437b-abb1-8baab33e141f', 'ARTI209250056', 0, 'valide', '2025-09-17T06:04:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f0c747ad-15d2-4c27-a16f-8f5d5ccaff22', 'ARTI209250039', 0, 'valide', '2025-09-17T06:06:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('04665bd6-2ad5-4f4d-9982-8921a347b3c9', 'ARTI208250021', 0, 'valide', '2025-09-17T06:09:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('606c149a-0a8c-41e8-a128-60ef9d1bf06e', 'ARTI207250185', 0, 'valide', '2025-09-17T06:10:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7c14617b-4853-4ce5-ad26-5828d0041d93', 'ARTI207250187', 0, 'valide', '2025-09-17T06:11:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1e28d4c7-cb05-4ae0-a993-b6909950563b', 'ARTI209250062', 0, 'valide', '2025-09-17T15:35:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('abc4f82c-4dc6-4172-9567-9387d3b47685', 'ARTI209250068', 0, 'valide', '2025-09-17T15:36:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('98c00d91-ab72-4734-82db-8002f21cf064', 'ARTI209250063', 0, 'valide', '2025-09-17T15:37:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('93892a40-8842-458c-9111-a8a69c520b39', 'ARTI209250067', 0, 'valide', '2025-09-17T15:38:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f7932cc7-2a81-41b2-8024-cb192a9e6d63', 'ARTI209250066', 0, 'valide', '2025-09-17T15:40:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('109dee11-3e42-49ec-ab69-5dbea3e59df5', 'ARTI209250064', 0, 'valide', '2025-09-17T15:41:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('16db5a70-2e58-4f7a-8210-99f151a60853', 'ARTI209250065', 0, 'valide', '2025-09-17T15:42:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6f123c75-47f0-48b1-b482-d336ce63baee', 'ARTI209250059', 0, 'valide', '2025-09-18T04:04:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('084eadf7-b7f1-4b45-b2fc-2b9b74c0cc6a', 'ARTI209250071', 0, 'valide', '2025-09-19T09:54:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('10961dca-a9a1-4a26-a1c5-d2b6c3911ea7', 'ARTI209250070', 0, 'valide', '2025-09-19T09:55:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f9d80a4d-b6a7-4434-bca0-9c269fca6d26', 'ARTI209250069', 0, 'valide', '2025-09-19T09:56:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2a73767-c5bf-4dcf-a7f2-9a82c2aa9964', 'ARTI209250058', 0, 'valide', '2025-09-19T09:58:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f13569fb-e120-4d48-8944-a86472069fba', 'ARTI209250057', 0, 'valide', '2025-09-19T09:59:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bf879052-cc26-480b-87aa-2db94e361758', 'ARTI209250061', 0, 'valide', '2025-09-19T10:01:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ba10e287-0492-426b-8e3a-c0e467ef86af', 'ARTI209250053', 0, 'valide', '2025-09-19T10:03:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6c6f6ee-3b96-4316-9229-51078dcc1faf', 'ARTI209250054', 0, 'valide', '2025-09-19T10:09:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef3f1f5c-cac3-417c-8b75-1699d8c825c3', 'ARTI209250049', 0, 'valide', '2025-09-19T10:10:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b1fe81b2-9971-40c8-94aa-4cac6d82af7b', 'ARTI208250060', 0, 'valide', '2025-09-19T10:12:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c1eff87-0b49-42a2-bb40-8417d308571e', 'ARTI209250077', 0, 'valide', '2025-09-19T10:13:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ece4ba44-5fd0-4301-9b18-0fb2940cb909', 'ARTI209250072', 0, 'valide', '2025-09-20T04:26:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('884789d2-02be-4ea1-b5ab-6b50bebb87c1', 'ARTI209250083', 0, 'valide', '2025-09-21T21:21:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cb4c9f63-0cc9-4c27-b5d7-cf425ab59971', 'ARTI209250082', 0, 'valide', '2025-09-22T10:47:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b1115f74-ab5d-42b0-8dc5-31058dc0d8b8', 'ARTI209250081', 0, 'valide', '2025-09-22T10:48:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2c1bf663-e9a7-4377-84fc-0420c8fcb948', 'ARTI209250087', 0, 'valide', '2025-09-22T11:07:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('706f257c-7bff-4bce-b774-6289dbe8cf62', 'ARTI209250073', 0, 'valide', '2025-09-22T11:09:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3feda657-7005-4529-9618-b622f19a2450', 'ARTI209250060', 0, 'valide', '2025-09-22T11:10:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('69a44d8a-a30c-4e49-a020-620435fac1f2', 'ARTI209250019', 0, 'valide', '2025-09-22T11:11:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bc23bb64-7535-4ab6-83a0-d3b526d1ed4c', 'ARTI208250119', 0, 'valide', '2025-09-22T11:12:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0b9d80e8-f5a0-4453-b460-63c32aa66c68', 'ARTI209250074', 0, 'valide', '2025-09-22T11:13:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2b02374c-3ed7-4490-b304-40e5ae4611a3', 'ARTI209250017', 0, 'valide', '2025-09-22T11:14:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c7b6c01f-656a-4ab0-b553-285bb2a26f98', 'ARTI209250018', 0, 'valide', '2025-09-22T11:16:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e79e5283-481b-4e45-9934-68deafcf8c04', 'ARTI209250092', 0, 'valide', '2025-09-23T11:14:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dc295317-ed93-41b0-90fe-6c568b35aa1f', 'ARTI209250052', 0, 'valide', '2025-09-23T11:15:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d591cd28-e26f-4fe5-8446-a048055f6945', 'ARTI209250011', 0, 'valide', '2025-09-23T11:16:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6ef4a768-99b4-4323-8ab3-f728e663899e', 'ARTI209250076', 0, 'valide', '2025-09-23T11:17:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3b47b67-f3d3-427e-9c99-12d52ee05113', 'ARTI209250036', 0, 'valide', '2025-09-23T18:56:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e8806746-b44b-42f9-8667-54f59aa711c9', 'ARTI209250088', 0, 'valide', '2025-09-23T20:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bdae37bb-89cf-4a6b-9595-bf3976c54deb', 'ARTI209250091', 0, 'valide', '2025-09-23T21:20:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cf95b968-b5a9-4ffc-b46b-efb16dffe38a', 'ARTI209250075', 0, 'valide', '2025-09-23T21:21:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d4555b6f-42fe-4624-8253-e26508568ca1', 'ARTI209250044', 0, 'valide', '2025-09-23T21:22:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02387a99-95d2-410d-bfd3-b333ed6b12f0', 'ARTI209250099', 0, 'valide', '2025-09-27T19:21:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c8e81b8c-2ff5-4f22-aaa4-f5a9be3f31c3', 'ARTI209250086', 0, 'valide', '2025-09-27T19:21:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bc4dfc31-6279-4453-b25c-ef864edbf77b', 'ARTI209250098', 0, 'valide', '2025-09-27T19:22:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('01ad706a-0865-4748-8d12-4640f2de671f', 'ARTI209250078', 0, 'valide', '2025-09-27T19:23:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d742b466-0e34-46f9-9c6b-03ffe3f79a4c', 'ARTI208250149', 0, 'valide', '2025-09-27T19:24:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('92c28ca8-0bdd-4be9-a483-791a9c0ce261', 'ARTI209250100', 0, 'valide', '2025-09-27T19:25:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('167d80a2-1d23-40f4-b3fa-6324f55e4c41', 'ARTI209250089', 0, 'valide', '2025-09-27T19:26:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9c6d824a-f63d-4da4-95ba-48ac4a59c8ca', 'ARTI209250080', 0, 'valide', '2025-09-28T22:50:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('95b8aa33-e15c-4992-a753-87c048632d5c', 'ARTI209250113', 0, 'valide', '2025-09-30T22:26:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ecd6c0d0-a3db-498f-91ce-1ec5cb0f74f6', 'ARTI209250114', 0, 'valide', '2025-09-30T22:27:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef4cce7f-0d4b-4d14-8a19-055d83bc2b6d', 'ARTI209250105', 0, 'valide', '2025-09-30T22:28:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('94348ec3-c553-48d8-b8f2-46803d17d0a5', 'ARTI209250102', 0, 'valide', '2025-09-30T22:32:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a51c33cd-c885-47f2-a204-83d921070beb', 'ARTI209250107', 0, 'valide', '2025-10-01T22:30:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a521d784-9983-432b-849e-a2f5723128c6', 'ARTI209250108', 0, 'valide', '2025-10-01T22:30:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c506f68b-da22-4c4e-96c2-4c485b0c8d0f', 'ARTI209250109', 0, 'valide', '2025-10-01T22:31:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0bfea560-4ada-4844-82a5-f49f9ad93334', 'ARTI209250111', 0, 'valide', '2025-10-01T22:32:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fa28042f-303e-4f20-bb19-f62dc988046e', 'ARTI209250103', 0, 'valide', '2025-10-01T22:33:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c85e4daf-6e80-4121-b340-df40f798145c', 'ARTI209250117', 0, 'valide', '2025-10-05T08:04:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6fdb9497-e85e-404e-b0d4-47e9c30cf8fd', 'ARTI210250001', 0, 'valide', '2025-10-05T08:05:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f61e5aac-a387-4ca1-baec-4a1a27016ff4', 'ARTI209250116', 0, 'valide', '2025-10-05T08:06:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e51d753f-dd57-40d0-829c-a7454be8f730', 'ARTI210250004', 0, 'valide', '2025-10-05T08:07:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('43798900-5d5f-42cd-a756-084896744041', 'ARTI210250006', 0, 'valide', '2025-10-05T08:08:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a29b22f2-6add-45ab-93a7-f188ac1731ba', 'ARTI210250003', 0, 'valide', '2025-10-05T08:09:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('063bebda-8d5f-45a9-be76-56cfee1d5dfa', 'ARTI210250005', 0, 'valide', '2025-10-05T08:14:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fde9015c-8a21-496f-bd92-5198f6468761', 'ARTI209250106', 0, 'valide', '2025-10-05T08:15:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d4380701-841d-4d14-864f-241c0ae85a02', 'ARTI209250110', 0, 'valide', '2025-10-05T08:16:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6a2f5ff0-dd66-45a0-b993-71791072495f', 'ARTI209250112', 0, 'valide', '2025-10-05T08:17:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('63b2c727-3731-4ea0-bb49-853812297223', 'ARTI209250097', 0, 'valide', '2025-10-05T08:18:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a4fa1b00-6d7f-42bf-b130-ac04da35f0a8', 'ARTI209250095', 0, 'valide', '2025-10-05T08:19:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1c2b5642-48b2-41f9-bf80-a9714968d069', 'ARTI210250022', 0, 'valide', '2025-10-08T22:51:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9e9f010e-eee1-4b05-8263-ad4d9f00203a', 'ARTI210250011', 0, 'valide', '2025-10-08T22:52:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('97da3d2b-529c-4d1d-b03e-58f5fe6a3839', 'ARTI210250023', 0, 'valide', '2025-10-08T22:53:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fcedbe49-a552-4b50-ad34-9154542c6f29', 'ARTI210250008', 0, 'valide', '2025-10-08T22:54:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2eafc8fa-fbf8-44cc-8eb0-18bc2701ac69', 'ARTI209250115', 0, 'valide', '2025-10-08T22:55:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2fb986a2-a41a-47b2-a513-f5deb9f51e56', 'ARTI210250016', 0, 'valide', '2025-10-13T21:51:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b9d44cf4-ee23-411a-ab2d-61663c60a395', 'ARTI210250017', 0, 'valide', '2025-10-13T21:52:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fbd06a6a-809c-4829-9435-36d19fa82824', 'ARTI210250018', 0, 'valide', '2025-10-13T21:52:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c94a41ed-8b81-4e23-9de3-b033b1c4cd26', 'ARTI210250012', 0, 'valide', '2025-10-13T21:53:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae26f6e4-4b87-4794-8fc6-20ee48d039e7', 'ARTI210250007', 0, 'valide', '2025-10-13T21:54:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dccb2d27-d1a2-4988-b7d9-875b28ffe062', 'ARTI209250094', 0, 'valide', '2025-10-13T21:54:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c8dde80-5d36-407b-b609-dd7f70b00d41', 'ARTI209250020', 0, 'valide', '2025-10-13T21:55:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('35eef830-e0a4-4c8c-bb67-52f262be5d72', 'ARTI209250001', 0, 'valide', '2025-10-13T21:55:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1d9e4570-bb95-42bd-bf97-27010736685c', 'ARTI208250110', 0, 'valide', '2025-10-13T21:56:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7d92375e-de63-4a56-be73-d9cd88d5b682', 'ARTI209250033', 0, 'valide', '2025-10-13T21:56:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4448485-72db-4716-b424-c8c012283403', 'ARTI209250032', 0, 'valide', '2025-10-13T21:57:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3ba08e33-645d-4f11-b325-23cd84c05652', 'ARTI209250031', 0, 'valide', '2025-10-13T21:57:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c638025a-96e4-47d4-b0f3-677c26eb1a2b', 'ARTI209250030', 0, 'valide', '2025-10-13T21:58:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6d3401e-8bd3-4067-a1eb-cea2ea23acc8', 'ARTI209250090', 0, 'valide', '2025-10-13T21:58:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3f876511-78ec-499b-bdcc-bd65de946a30', 'ARTI209250101', 0, 'valide', '2025-10-13T21:59:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7d93d6cc-0e63-48f8-b4da-8775631bda20', 'ARTI210250024', 0, 'valide', '2025-10-14T22:09:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b65010c2-72e0-4542-b323-be583c927d1a', 'ARTI210250025', 0, 'valide', '2025-10-14T22:10:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d2de8dc-2199-4c72-a957-81e5d3eddbaf', 'ARTI210250026', 0, 'valide', '2025-10-14T22:10:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6f9a13e3-2982-485a-b433-4365f5449ba9', 'ARTI210250027', 0, 'valide', '2025-10-14T22:11:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3b66b208-ad50-41c2-b0de-7bcba087121a', 'ARTI210250028', 0, 'valide', '2025-10-14T22:12:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('337b8ed1-fe02-4201-808b-f8bf3742600b', 'ARTI210250029', 0, 'valide', '2025-10-14T22:12:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cdcd7000-49d9-428f-a0f2-b8a2933af9d0', 'ARTI210250030', 0, 'valide', '2025-10-14T22:13:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6735502-cfb8-4b71-9a5f-86c4292a6882', 'ARTI210250031', 0, 'valide', '2025-10-14T22:14:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b07eea75-7a62-427e-a365-42dacad3052d', 'ARTI210250032', 0, 'valide', '2025-10-14T22:14:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e4fe914d-46a2-48f5-a7e6-106aee1349d0', 'ARTI210250033', 0, 'valide', '2025-10-14T22:15:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0eb7a599-9ec4-406e-a233-e68fd0f1e617', 'ARTI210250034', 0, 'valide', '2025-10-14T22:15:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5d4e55f0-338f-49b1-aab2-c2d62c6d955f', 'ARTI210250036', 0, 'valide', '2025-10-14T22:16:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51854e9c-1d65-4943-9ca5-4fd82ad50675', 'ARTI210250037', 0, 'valide', '2025-10-14T22:17:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('acb33d3e-62db-4f53-8dd7-b27abce52f62', 'ARTI210250038', 0, 'valide', '2025-10-14T22:17:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3e01268a-3250-495d-8802-3ed4a58b4766', 'ARTI210250039', 0, 'valide', '2025-10-14T22:18:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8fb913f6-31d9-4436-ba4b-dc77a8917ea0', 'ARTI210250040', 0, 'valide', '2025-10-14T22:18:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d8e77a6f-1a18-4e6f-b7c4-307c290f6017', 'ARTI210250043', 0, 'valide', '2025-10-14T22:19:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a071f8f-7c52-4fd1-9ec3-150fd2a360b7', 'ARTI210250045', 0, 'valide', '2025-10-14T22:20:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bc7e20ae-bc8a-4a74-999d-c9ddd49ff8f4', 'ARTI210250046', 0, 'valide', '2025-10-14T22:20:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ca5f1575-f2e3-413f-aa99-b48a08cf0e1f', 'ARTI210250057', 0, 'valide', '2025-10-14T22:21:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f8bcd66b-079b-4532-b571-f8d35abeb6e4', 'ARTI210250051', 0, 'valide', '2025-10-14T22:22:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aa43c68e-fb23-4d16-ad4e-822893d5abfe', 'ARTI210250058', 0, 'valide', '2025-10-14T22:22:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3d90fc3b-e7b2-4455-a67d-e69274b19d4a', 'ARTI210250019', 0, 'valide', '2025-10-14T22:23:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ec2720c-5965-4033-a5fc-6aab8893baad', 'ARTI210250020', 0, 'valide', '2025-10-14T22:23:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('16468b36-1fc0-4aab-9078-0fb39ecc78d6', 'ARTI210250021', 0, 'valide', '2025-10-14T22:24:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7c2d607-f297-49bd-bff9-19e0747d5a6b', 'ARTI210250013', 0, 'valide', '2025-10-14T22:24:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ba32e6f-450e-479c-b5d3-bb504e85752d', 'ARTI209250096', 0, 'valide', '2025-10-14T22:25:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('884b8dfa-a7bd-4ac7-b0a6-a4296f069311', 'ARTI209250093', 0, 'valide', '2025-10-14T22:25:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d37e31fc-de09-46c4-b57a-e701c590a53b', 'ARTI210250085', 0, 'valide', '2025-10-17T05:01:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c61a8545-bbe0-458c-b566-3a580752097a', 'ARTI210250084', 0, 'valide', '2025-10-17T05:01:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7444ecef-fbe8-4303-9e46-b36493cfdbab', 'ARTI210250072', 0, 'valide', '2025-10-17T05:02:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2c22b6a6-6298-4985-8b56-809818c6210e', 'ARTI210250071', 0, 'valide', '2025-10-17T05:04:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('62e70dd2-0656-4b4b-abb8-a01cec579715', 'ARTI209250104', 0, 'valide', '2025-10-17T05:05:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fc958e01-ef50-4eaa-86e3-8e7acda4bf45', 'ARTI210250073', 0, 'valide', '2025-10-17T05:07:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('22c77af2-bce0-4d22-a50b-49a49ffa9703', 'ARTI209250079', 0, 'valide', '2025-10-17T05:08:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3941bdea-edbd-4667-ad1b-39255db9c4fc', 'ARTI210250063', 0, 'valide', '2025-10-17T05:09:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72a1eb18-5eff-4ce6-a2e6-474116145e76', 'ARTI210250062', 0, 'valide', '2025-10-17T05:09:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('80fc3b2b-3187-41f5-b379-8073acb79dda', 'ARTI210250064', 0, 'valide', '2025-10-17T14:50:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a74d8ceb-2b12-4f42-bf83-dbb2315da8f4', 'ARTI210250065', 0, 'valide', '2025-10-17T14:51:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a71a3d82-1dfe-4d47-93ab-691bb0c723bb', 'ARTI210250066', 0, 'valide', '2025-10-17T14:52:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7436f995-70b0-4e02-bddf-fad533594b9c', 'ARTI210250067', 0, 'valide', '2025-10-17T14:52:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3ae0f84d-ebc5-44d1-a42b-1af8a173916f', 'ARTI210250068', 0, 'valide', '2025-10-17T14:53:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('99536514-408d-4327-add0-3e3c342df3ec', 'ARTI210250069', 0, 'valide', '2025-10-17T14:53:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3f884887-fc38-4178-b512-c169d0d330d1', 'ARTI210250070', 0, 'valide', '2025-10-17T14:54:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('12a6c34d-1aed-4b8c-a024-2a6d036e3b37', 'ARTI210250074', 0, 'valide', '2025-10-17T14:55:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a5619706-2d90-4c3a-80ae-fabcc3883510', 'ARTI210250075', 0, 'valide', '2025-10-17T14:56:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3f4d9291-2d0f-4f54-b32c-801033ab62d2', 'ARTI210250076', 0, 'valide', '2025-10-17T14:56:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('29bc6bbd-90cd-4ef7-9041-b65501861cc8', 'ARTI210250079', 0, 'valide', '2025-10-17T14:57:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0ac62935-8642-4310-b3a2-daec14e36898', 'ARTI210250080', 0, 'valide', '2025-10-17T14:58:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2daa2851-1ac9-48da-ae65-397355728495', 'ARTI209250055', 0, 'valide', '2025-10-17T14:59:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c8454f96-688f-44d2-ac9e-c41428ebfc96', 'ARTI210250061', 0, 'valide', '2025-10-17T14:59:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61b1016b-63a6-4339-82ff-553879f3c860', 'ARTI210250035', 0, 'valide', '2025-10-18T03:47:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4606571d-16fb-4587-9698-0d02f5cc1ac4', 'ARTI210250041', 0, 'valide', '2025-10-18T03:49:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ac3d07a2-43a7-4f7d-a02b-3c84abd6e006', 'ARTI210250042', 0, 'valide', '2025-10-18T03:49:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('03f94b27-5256-4e9f-870b-62cc93311c44', 'ARTI210250044', 0, 'valide', '2025-10-18T03:51:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('78252170-54f4-43d9-b984-91ec5f3e1b91', 'ARTI210250055', 0, 'valide', '2025-10-18T03:51:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c48d6f17-302f-41ce-8319-4f71547facf9', 'ARTI210250052', 0, 'valide', '2025-10-18T03:52:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c22d5772-9563-44c0-b157-c74960fc22ee', 'ARTI210250047', 0, 'valide', '2025-10-18T03:53:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('11bdbac5-88e7-44c6-a454-754018a6dd13', 'ARTI210250050', 0, 'valide', '2025-10-18T03:53:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1fd9e827-5377-440b-b6f2-db3d1cc1edae', 'ARTI210250049', 0, 'valide', '2025-10-18T03:54:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('37985c0a-d09a-4202-b438-79d6ee1db639', 'ARTI210250053', 0, 'valide', '2025-10-18T03:55:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('37b5dfa0-934e-45e0-9dfc-c5be76ec3130', 'ARTI210250048', 0, 'valide', '2025-10-18T03:55:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9137218d-f03c-4c83-83c6-4e9d224ffe61', 'ARTI210250081', 0, 'valide', '2025-10-19T22:43:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('db82702c-fd69-4475-9c50-6e03d2ce764f', 'ARTI210250059', 0, 'valide', '2025-10-19T22:44:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b24ca693-d64c-4358-beb2-263eab77ea63', 'ARTI210250098', 0, 'valide', '2025-10-20T16:10:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2ba0e476-753d-446c-abbe-2c9c4a39d533', 'ARTI210250099', 0, 'valide', '2025-10-20T16:11:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('05e07dce-b332-4d32-b1e9-f8cb7dd1e64c', 'ARTI210250100', 0, 'valide', '2025-10-20T16:12:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1387dee6-2faa-4509-8ca1-6a4f841eb7b8', 'ARTI210250101', 0, 'valide', '2025-10-20T16:13:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a98f6262-a617-4096-9421-741409888df2', 'ARTI210250102', 0, 'valide', '2025-10-20T16:14:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('88957d13-eb29-4e58-a195-5e4d667d7faf', 'ARTI210250109', 0, 'valide', '2025-10-20T16:17:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d5f6c467-609c-4554-b266-5d1cff572227', 'ARTI210250112', 0, 'valide', '2025-10-20T16:18:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1e4c7746-afe5-4135-aa13-b8db4f0c22d1', 'ARTI210250083', 0, 'valide', '2025-10-20T16:19:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5287eb74-0860-4c73-b53c-a157efcdd97b', 'ARTI210250054', 0, 'valide', '2025-10-20T16:19:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('23f8c9e8-4d77-4e64-b0d5-c23f2c4f6111', 'ARTI210250097', 0, 'valide', '2025-10-21T06:08:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('99cca468-7155-4665-84ed-c50e2cb0d655', 'ARTI210250103', 0, 'valide', '2025-10-21T06:08:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a2413136-686e-42c4-b25a-8f2d5ab41199', 'ARTI210250107', 0, 'valide', '2025-10-21T06:09:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aba6d94b-38c2-4eb5-a71f-bcab116bbe33', 'ARTI210250108', 0, 'valide', '2025-10-21T06:10:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('aa0e1f4c-4cc0-417f-bf04-b4484077e96d', 'ARTI210250113', 0, 'valide', '2025-10-21T06:10:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('adeee103-18be-4532-a3dc-122abb047885', 'ARTI210250114', 0, 'valide', '2025-10-21T06:11:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('86ced66e-ba44-4b30-bd4f-1a4a9b716035', 'ARTI210250078', 0, 'valide', '2025-10-21T06:12:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('032b6cbc-22fd-4f8f-92df-da5b503c2748', 'ARTI210250082', 0, 'valide', '2025-10-21T06:13:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6131e139-09ee-423c-8356-33502892bc17', 'ARTI210250056', 0, 'valide', '2025-10-21T06:13:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b1bbae66-b5f3-4bed-9d24-6bd521107686', 'ARTI210250014', 0, 'valide', '2025-10-21T06:14:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3dcfdbdc-a92e-4191-9222-18bc1f9f483e', 'ARTI209250084', 0, 'valide', '2025-10-21T06:14:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4232325b-a31b-408c-842c-9be17763bd18', 'ARTI209250085', 0, 'valide', '2025-10-21T06:15:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('be14eca2-46e9-41f4-b019-c62b9d7445be', 'ARTI210250086', 0, 'valide', '2025-10-22T09:49:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e9bceb34-94d1-4c67-a560-2717b7cc17e5', 'ARTI210250087', 0, 'valide', '2025-10-22T09:49:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('390d20d4-9598-4871-96f1-11ffff4030b3', 'ARTI210250088', 0, 'valide', '2025-10-22T09:50:15')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('803c06ff-055e-467a-9d93-c0455ff88feb', 'ARTI210250115', 0, 'valide', '2025-10-22T09:50:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e9def7a0-0efa-4567-a7aa-203d2132db46', 'ARTI210250120', 0, 'valide', '2025-10-22T09:51:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c35c4f83-fd79-4ad7-ba91-615408dd18ff', 'ARTI210250124', 0, 'valide', '2025-10-22T09:52:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c8611303-1469-47cf-aa84-9d0fd75707ac', 'ARTI210250123', 0, 'valide', '2025-10-22T09:53:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e47efd09-d8bd-4cb7-b15a-1fe290d2abab', 'ARTI210250127', 0, 'valide', '2025-10-22T09:54:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e259b04b-5019-4d00-b088-e26ca5f1fbbc', 'ARTI210250110', 0, 'valide', '2025-10-22T09:55:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('72759667-f033-41ec-a6a5-d466dae9300c', 'ARTI210250111', 0, 'valide', '2025-10-22T09:56:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a0236b1f-1ff4-4b0a-8ba6-422367b9fad8', 'ARTI210250135', 0, 'valide', '2025-10-22T23:35:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('79294b85-94eb-4514-b188-1dbaa0c414a7', 'ARTI210250116', 0, 'valide', '2025-10-22T23:36:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('18c829de-a877-4ae3-9365-84e49dc5a202', 'ARTI210250094', 0, 'valide', '2025-10-22T23:38:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4f2b6eb3-262e-4581-95f0-b8078dc26dc1', 'ARTI210250145', 0, 'valide', '2025-10-24T09:53:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d7869c23-6913-4de0-b6ad-bbbf2e411f47', 'ARTI210250131', 0, 'valide', '2025-10-24T09:54:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('416502e4-7c88-4e7e-b191-fac41b77cef1', 'ARTI210250132', 0, 'valide', '2025-10-24T09:55:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9d377753-b910-44c9-a8f1-fc550edc21b8', 'ARTI210250134', 0, 'valide', '2025-10-24T09:56:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ff20c2d8-e56c-4343-b497-b38ed8908c46', 'ARTI210250136', 0, 'valide', '2025-10-24T09:57:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('36d68e84-eadb-4d9a-aca3-321cde91f260', 'ARTI210250137', 0, 'valide', '2025-10-24T09:58:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e3be7bc4-b71f-4dd2-b78b-7f8052344228', 'ARTI210250138', 0, 'valide', '2025-10-24T09:59:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3d58959e-7dd5-4694-afdd-081895b5c6df', 'ARTI210250122', 0, 'valide', '2025-10-24T10:00:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('31269d24-9e30-4db0-8ccd-b1110f534e59', 'ARTI210250125', 0, 'valide', '2025-10-24T10:01:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5984bb21-0cc3-4eb7-9e62-1fc8227f641e', 'ARTI210250144', 0, 'valide', '2025-10-25T06:18:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('01cfa5c1-2b5f-4444-a2eb-40734f2a665c', 'ARTI210250117', 0, 'valide', '2025-10-25T06:19:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d3fc901-2309-4b86-96e5-32d47bccf9a2', 'ARTI210250119', 0, 'valide', '2025-10-25T06:20:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('16cb57ea-5bae-48c4-ace8-4bdd16cf709e', 'ARTI210250126', 0, 'valide', '2025-10-25T06:21:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('adb3e652-0a02-4fbf-976a-12d9e6dd35e0', 'ARTI210250128', 0, 'valide', '2025-10-25T06:22:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8399c326-0cf3-4de4-9062-ab4932cd205a', 'ARTI210250060', 0, 'valide', '2025-10-25T06:22:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4c24abde-f1a3-4bba-afcb-7314ae7746e5', 'ARTI209250012', 0, 'valide', '2025-10-25T06:23:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f08de16a-f3ba-408c-b629-372427323a3c', 'ARTI210250168', 0, 'valide', '2025-10-27T19:51:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2d4a43b-7d91-4764-8304-01bb0dff4026', 'ARTI210250169', 0, 'valide', '2025-10-27T19:52:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d3ca4a2d-9f5b-41d4-8577-584330adf451', 'ARTI210250170', 0, 'valide', '2025-10-27T19:53:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c2b9d7ee-62b4-4f51-a07c-100bae3297b7', 'ARTI210250171', 0, 'valide', '2025-10-27T19:54:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6ed67226-c05b-45bd-a3b3-77d865eeae52', 'ARTI210250146', 0, 'valide', '2025-10-27T19:55:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6c30fbdf-71f0-4385-823d-862a3516aafe', 'ARTI210250148', 0, 'valide', '2025-10-27T19:56:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5cf168d9-fe28-43cc-a671-3f9a765655d1', 'ARTI210250150', 0, 'valide', '2025-10-27T19:56:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('59077427-135c-4292-997d-91f3bb614be3', 'ARTI210250154', 0, 'valide', '2025-10-27T19:57:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bf819de6-a2c1-492e-b34d-64d6813bf032', 'ARTI210250156', 0, 'valide', '2025-10-27T19:58:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c80319d0-86ab-454d-9b11-096000b6dcb2', 'ARTI210250149', 0, 'valide', '2025-10-27T21:37:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('38e4a75c-4494-4180-8d6b-c9a75ddb012a', 'ARTI210250155', 0, 'valide', '2025-10-27T21:38:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3ac24806-ed11-4448-b46c-9f2a168614d2', 'ARTI210250143', 0, 'valide', '2025-10-28T06:54:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('34081d33-077f-4a5a-9c56-66d8f10f1dac', 'ARTI210250182', 0, 'valide', '2025-10-29T04:39:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6b87a899-da28-489b-ba50-1486c669be3f', 'ARTI210250172', 0, 'valide', '2025-10-29T04:40:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a4146907-379d-4bf2-9c62-866a059b360c', 'ARTI210250167', 0, 'valide', '2025-10-29T04:40:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2c2866a5-a611-47d0-8712-2a8b8d90b160', 'ARTI210250161', 0, 'valide', '2025-10-29T04:41:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4ce5052-ffe2-4bb6-93d8-458b29b885ae', 'ARTI210250162', 0, 'valide', '2025-10-29T04:42:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('113aa3b8-426b-40c2-a1e1-2cde30221080', 'ARTI210250174', 0, 'valide', '2025-10-29T10:15:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('25855bdc-3d20-427c-893f-5b7a9d137ccc', 'ARTI210250179', 0, 'valide', '2025-10-29T10:16:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bfaa521f-11ee-4992-a8fb-65a8450315b4', 'ARTI210250140', 0, 'valide', '2025-10-29T10:17:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('26f63ac6-91d9-4a07-a360-af3818915d3b', 'ARTI210250163', 0, 'valide', '2025-10-29T10:19:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a34b261-97cd-41f8-9783-2a98d0ba2ed1', 'ARTI210250181', 0, 'valide', '2025-10-29T10:20:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4e4d7464-7867-43d3-8583-7318d32239c9', 'ARTI210250188', 0, 'valide', '2025-10-30T09:18:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('61e9348b-af30-44de-a694-6fef820ca81e', 'ARTI210250189', 0, 'valide', '2025-10-30T09:21:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bd621a82-0947-4168-8cda-f1569a08fb55', 'ARTI210250190', 0, 'valide', '2025-10-30T09:22:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5852d960-a601-466e-b657-230879cf5dbc', 'ARTI210250183', 0, 'valide', '2025-10-30T09:24:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1603ba99-2827-437e-a2f5-b4fa1d7ba0d7', 'ARTI210250175', 0, 'valide', '2025-10-30T09:24:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('45198880-a4fc-49c8-9fb6-551419934ed5', 'ARTI210250176', 0, 'valide', '2025-10-30T09:26:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('584ee8fd-8ee8-4a36-9e37-0b1ac0d29153', 'ARTI210250177', 0, 'valide', '2025-10-30T09:26:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('99cec6c5-ac86-45b9-9373-38f853cc9cda', 'ARTI210250178', 0, 'valide', '2025-10-30T09:27:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6d1cf8d7-20a2-490c-981c-d8997228378d', 'ARTI210250180', 0, 'valide', '2025-10-30T09:28:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da5bc666-8e76-4d4e-8915-ef3389538beb', 'ARTI210250165', 0, 'valide', '2025-10-30T09:29:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('95d8e4df-f0a8-409f-a595-5a177022eec8', 'ARTI210250141', 0, 'valide', '2025-10-30T09:30:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4516e9a-c008-47e9-8370-b049005083d1', 'ARTI210250118', 0, 'valide', '2025-10-30T09:30:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2a2fa0d7-4190-414c-930b-52effbc1a8f8', 'ARTI210250121', 0, 'valide', '2025-10-30T09:31:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('07fbfc6f-affa-400a-b2a8-0ab2c363d1a9', 'ARTI210250106', 0, 'valide', '2025-10-30T09:33:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d91052df-46d0-49a1-be69-2ffa3ddb0a93', 'ARTI210250077', 0, 'valide', '2025-10-30T09:34:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('262d957a-eee6-4980-923e-5f386eca9833', 'ARTI210250192', 0, 'valide', '2025-10-31T07:17:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6317cae5-4b00-4353-9f1d-9debfa7571e6', 'ARTI210250193', 0, 'valide', '2025-10-31T07:17:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4ac6d2c9-5a7e-45ba-8211-5d0a338b2533', 'ARTI210250194', 0, 'valide', '2025-10-31T07:18:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('163cc931-9c9e-4ce3-b180-a2bfa20b3228', 'ARTI210250197', 0, 'valide', '2025-10-31T07:19:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('275d46a5-3166-4aa8-b305-cd43542a76eb', 'ARTI210250184', 0, 'valide', '2025-10-31T07:20:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30fa3911-0b11-434e-be9e-2b5368685e7b', 'ARTI210250164', 0, 'valide', '2025-10-31T07:23:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2e370be4-c8e9-4ed4-b271-2026d3ec7054', 'ARTI210250129', 0, 'valide', '2025-10-31T07:24:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5d44798e-a493-434a-8178-32706152b028', 'ARTI210250092', 0, 'valide', '2025-10-31T07:26:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a21ebf7-fc0d-41fd-a73c-afd97d9d5bbb', 'ARTI210250090', 0, 'valide', '2025-10-31T07:27:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9bc64b9e-8329-4375-97e8-ad543ad3f025', 'ARTI210250093', 0, 'valide', '2025-10-31T07:28:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('62d2576c-c013-4ae6-8d3a-96d145749d5e', 'ARTI210250095', 0, 'valide', '2025-10-31T07:30:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a172c6c7-03dd-4546-9d53-81a5ae4446ad', 'ARTI210250091', 0, 'valide', '2025-10-31T07:31:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('64a20956-7cfb-456a-b425-0396f4bdd766', 'ARTI210250096', 0, 'valide', '2025-10-31T07:32:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('79ac5fb5-7fbf-4af6-be51-bd632c53377c', 'ARTI210250185', 0, 'valide', '2025-10-31T07:32:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('23e1a805-b6e1-4d72-867b-4bc2f37fd0ba', 'ARTI210250203', 0, 'valide', '2025-11-01T20:20:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ad0fa63-2f42-45da-b5ed-9122cad5d6d0', 'ARTI210250201', 0, 'valide', '2025-11-01T20:21:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('03783010-d90d-415e-a7ea-e616c8f5af52', 'ARTI210250199', 0, 'valide', '2025-11-01T20:21:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2a3df307-90a6-43ca-8ae3-572f499014b2', 'ARTI211250001', 0, 'valide', '2025-11-03T12:32:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('feda9905-f801-478f-b1a5-fa116d47ee44', 'ARTI210250206', 0, 'valide', '2025-11-03T12:33:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e270feab-2f33-4c7c-9a81-cdbab62f5256', 'ARTI210250151', 0, 'valide', '2025-11-03T12:34:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cc3aaa6d-7d86-42bd-8e49-7cac61334b84', 'ARTI210250202', 0, 'valide', '2025-11-03T12:35:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ab905616-d146-46c6-9303-b0e936058a98', 'ARTI210250152', 0, 'valide', '2025-11-03T12:35:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a24bb45e-dd49-40aa-9999-4835247ddbf8', 'ARTI211250002', 0, 'valide', '2025-11-04T04:40:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9dc20632-93ef-4e0d-9561-0fbc4982e393', 'ARTI210250204', 0, 'valide', '2025-11-04T04:41:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fe5100df-a505-40d9-8236-ad37091f5001', 'ARTI211250007', 0, 'valide', '2025-11-04T20:53:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('281d9395-da28-402b-a514-49c1e0135b9d', 'ARTI210250205', 0, 'valide', '2025-11-04T20:54:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3d6af264-587c-4931-82cd-d5aa0ad7dfd3', 'ARTI210250191', 0, 'valide', '2025-11-04T20:54:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51ca42ea-e14f-4f0c-8502-68e4c9a6857b', 'ARTI211250008', 0, 'valide', '2025-11-05T17:46:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('47d4c6ee-5914-4d5a-baa1-a3f45cf13474', 'ARTI211250010', 0, 'valide', '2025-11-05T17:47:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ef16bedb-14bb-4318-baa5-fdf04143cc4f', 'ARTI211250011', 0, 'valide', '2025-11-05T17:48:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c9d7567c-18ad-466d-804e-0cc744e95939', 'ARTI211250012', 0, 'valide', '2025-11-05T17:49:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3b4d4cda-0941-4960-acd2-0e7c1b3839f2', 'ARTI211250014', 0, 'valide', '2025-11-05T17:49:57')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ae7c7c73-5bbf-4826-b206-acfdcb850671', 'ARTI211250015', 0, 'valide', '2025-11-05T17:50:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6f64930a-e276-44ac-9071-3c84b24e9301', 'ARTI211250017', 0, 'valide', '2025-11-05T17:51:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b4050e34-7778-4185-b2f3-a566033ff728', 'ARTI211250018', 0, 'valide', '2025-11-05T17:52:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2937bc97-e3df-412f-ab33-0f36ae7eb61d', 'ARTI211250022', 0, 'valide', '2025-11-05T17:53:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('58ab39a0-e86a-460d-9674-22c38b3006c3', 'ARTI211250016', 0, 'valide', '2025-11-05T17:54:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5a80d7de-f599-4c53-86a8-f583bdd1c03c', 'ARTI211250046', 0, 'valide', '2025-11-07T17:36:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9031a866-0f75-4435-8aff-c6f83ef4a2bf', 'ARTI211250047', 0, 'valide', '2025-11-07T17:37:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('945813b9-dc42-4f9e-a410-54abccba4d08', 'ARTI211250035', 0, 'valide', '2025-11-07T17:38:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8e7fa4a4-6f4d-44ec-b55e-092ab73c9dd5', 'ARTI211250009', 0, 'valide', '2025-11-07T17:39:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f38a34dd-a0f1-46dc-8eb5-807946a76d72', 'ARTI211250019', 0, 'valide', '2025-11-07T17:42:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2f19694b-c3a0-49af-bd6b-20e5983c9c83', 'ARTI211250048', 0, 'valide', '2025-11-09T06:15:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('42976412-e109-4832-885d-598b240d5889', 'ARTI211250049', 0, 'valide', '2025-11-09T06:17:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9c101bc2-ebab-4d8b-b6e6-c9363cd3993d', 'ARTI211250031', 0, 'valide', '2025-11-09T06:19:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('159570c3-3e5f-40ad-a917-b8d472f3e3f6', 'ARTI211250033', 0, 'valide', '2025-11-09T06:21:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('09a3f435-5617-48f4-8bcc-4ee56d515fa2', 'ARTI211250034', 0, 'valide', '2025-11-09T06:22:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d79bbb3d-0625-4c74-830c-5b207e3d0aff', 'ARTI211250013', 0, 'valide', '2025-11-09T06:24:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('13a22a3c-636c-428a-95cc-1dc890cdd20f', 'ARTI211250020', 0, 'valide', '2025-11-09T06:25:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9af9930d-2444-4f15-8d82-a0a27bd2314a', 'ARTI209250024', 0, 'valide', '2025-11-09T06:27:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('350fff16-b166-4984-84e6-c1c34925a982', 'ARTI210250002', 0, 'valide', '2025-11-09T06:29:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b7557f9-ecb8-4b70-97cd-de37743b8a46', 'ARTI210250160', 0, 'valide', '2025-11-09T06:30:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3c0781d6-7ae0-496e-b167-5571488acd6e', 'ARTI210250159', 0, 'valide', '2025-11-09T06:32:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('175a5e7e-caf4-4378-a94d-770217ce7639', 'ARTI211250023', 0, 'valide', '2025-11-09T06:35:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('14014b98-3a4c-40ac-9e56-3122b9cc53cc', 'ARTI211250005', 0, 'valide', '2025-11-09T06:36:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('befcf53b-b24c-4253-976f-8b323ab2c756', 'ARTI211250004', 0, 'valide', '2025-11-09T06:38:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('515d715a-3b55-473b-ac77-8f7e0ae3beb2', 'ARTI210250207', 0, 'valide', '2025-11-09T06:40:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c046c35d-0958-458d-819a-91bb6ade7275', 'ARTI210250196', 0, 'valide', '2025-11-09T06:42:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cd03a5d8-824b-4058-957c-dea4b3cde485', 'ARTI210250147', 0, 'valide', '2025-11-09T06:43:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('55a52500-6639-4bb5-81d9-36ce99a82116', 'ARTI211250025', 0, 'valide', '2025-11-11T05:42:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e2db4675-ab72-46dc-a983-4b50d373b9fd', 'ARTI211250026', 0, 'valide', '2025-11-11T05:43:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f317b786-a972-4d28-bce9-7555fb096d1a', 'ARTI211250030', 0, 'valide', '2025-11-11T05:45:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ffb2a33b-fb2e-4635-ba29-7ccc1a8d89d2', 'ARTI211250050', 0, 'valide', '2025-11-11T05:46:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('deb139dc-7b2e-4709-97d7-ed06d108467d', 'ARTI211250032', 0, 'valide', '2025-11-11T16:33:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cad71f56-1ef4-478b-9670-97b81c6ad063', 'ARTI211250045', 0, 'valide', '2025-11-11T16:34:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f267b59f-145e-4d72-bfa6-7619bd6d6fb0', 'ARTI211250054', 0, 'valide', '2025-11-12T21:07:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6a8894c5-176b-465f-9b89-bdcfdb1a1178', 'ARTI211250044', 0, 'valide', '2025-11-12T21:08:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4613bb42-e626-4e49-a2f2-e2f91afd4592', 'ARTI211250052', 0, 'valide', '2025-11-17T15:52:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d0913e6-4674-4f48-a30c-86dca3265a05', 'ARTI211250024', 0, 'valide', '2025-11-17T15:54:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c4a2ad62-6a4c-4cbe-90a1-4bdca0cdbe9f', 'ARTI209250050', 0, 'valide', '2025-11-17T17:33:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('128f7235-2b7e-417e-ab5d-d05f92ea9471', 'ARTI209250051', 0, 'valide', '2025-11-17T17:36:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e141fcf1-bfa5-4944-8926-fe670d6491f1', 'ARTI210250104', 0, 'valide', '2025-11-17T17:37:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('59b63f89-b796-4408-9067-e2cad19260e7', 'ARTI209250037', 0, 'valide', '2025-11-17T17:39:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8ae95944-a1e6-49af-9ccc-6ba299f253ab', 'ARTI209250038', 0, 'valide', '2025-11-17T17:41:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c4fa010-3ae1-4c19-8adf-c9135339fea3', 'ARTI211250006', 0, 'valide', '2025-11-17T17:42:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5f013d00-ea87-468c-bfb5-f93344f9b41d', 'ARTI211250053', 0, 'valide', '2025-11-17T17:44:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('65ca604d-6f1d-464d-b6a1-ab98036037eb', 'ARTI211250078', 0, 'valide', '2025-11-19T04:18:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('32c5149c-4468-4bf4-8f50-3254b9043ea5', 'ARTI211250079', 0, 'valide', '2025-11-19T05:06:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a5101d07-7b86-444e-ab87-635bc33b90cc', 'ARTI211250061', 0, 'valide', '2025-11-19T05:08:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0db3356f-fc7f-4989-b78a-65726c6fb9bf', 'ARTI211250057', 0, 'valide', '2025-11-19T05:09:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('94191758-3f90-49a3-b48c-a27897c02a99', 'ARTI211250051', 0, 'valide', '2025-11-19T05:11:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('83f262dd-5fb1-4382-9098-432da27716db', 'ARTI211250037', 0, 'valide', '2025-11-19T05:13:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('473e1c98-d85c-4226-9662-c965d6834993', 'ARTI210250198', 0, 'valide', '2025-11-19T05:14:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('678ee6db-fafe-44ba-bf7e-43e269c1f426', 'ARTI211250028', 0, 'valide', '2025-11-19T05:16:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b48f749e-5ba4-46c5-973b-516a72facbbb', 'ARTI211250042', 0, 'valide', '2025-11-19T05:17:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d87e1ea-3382-4ff6-bcb4-bd59f63fd7cb', 'ARTI211250040', 0, 'valide', '2025-11-19T05:19:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a89f4100-b4e8-4626-985b-9f39ee00fd55', 'ARTI211250087', 0, 'valide', '2025-11-20T10:15:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('86a6addf-74c3-4f61-af7f-2dee0a9c6e57', 'ARTI211250062', 0, 'valide', '2025-11-20T10:16:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('699b7f06-fa72-4e1c-848c-51a33051c382', 'ARTI211250059', 0, 'valide', '2025-11-20T10:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('13e272c1-89ee-459c-bba9-f1ea9c1bd5f5', 'ARTI211250058', 0, 'valide', '2025-11-20T10:20:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f8171f33-cb4a-4cd7-b628-218ac3afdc2c', 'ARTI211250082', 0, 'valide', '2025-11-20T10:22:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9bb1fbb9-72c2-4be4-9f4c-35557ded95d5', 'ARTI211250060', 0, 'valide', '2025-11-20T10:23:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('afc26f30-1705-49ac-aa36-6f94c22bad29', 'ARTI211250080', 0, 'valide', '2025-11-20T10:25:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fd22684d-4985-4394-b55b-3448c298ce09', 'ARTI211250084', 0, 'valide', '2025-11-20T10:27:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('eb37d561-5ce8-469e-bf48-bbfec11ab5fb', 'ARTI211250036', 0, 'valide', '2025-11-20T10:28:38')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d0bf6cd-d198-4088-9f82-3e9656485292', 'ARTI211250039', 0, 'valide', '2025-11-20T10:30:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6815b478-8038-4303-abb5-9c825df701d4', 'ARTI211250043', 0, 'valide', '2025-11-20T10:32:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('70775508-7f86-4a17-8607-e1c96eb7bdc8', 'ARTI211250041', 0, 'valide', '2025-11-20T10:34:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('51eba7b0-dc09-48b6-a0c8-76472ff4936d', 'ARTI210250157', 0, 'valide', '2025-11-20T10:36:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('07028bd2-936a-4e92-817f-be3ef02fe97a', 'ARTI211250083', 0, 'valide', '2025-11-20T10:38:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('71c51c3f-86ae-4be7-b93a-45ca3bc9721c', 'ARTI211250038', 0, 'valide', '2025-11-20T10:40:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0162b2ee-83a7-43a2-9f30-c2f883ee1f11', 'ARTI211250098', 0, 'valide', '2025-11-20T23:02:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('143416b5-2b2c-40ed-8621-a2ece6fff2ab', 'ARTI211250096', 0, 'valide', '2025-11-20T23:04:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1f9f84a-0629-451a-913b-2903da4356d4', 'ARTI211250090', 0, 'valide', '2025-11-20T23:06:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8d0b035c-5344-4f08-85bf-bc9187dee769', 'ARTI211250088', 0, 'valide', '2025-11-20T23:07:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('91ae2a75-8d25-4422-aaf6-2069092869ed', 'ARTI211250091', 0, 'valide', '2025-11-20T23:09:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a532e67f-13dc-470a-83bd-19031854876b', 'ARTI211250089', 0, 'valide', '2025-11-20T23:11:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('166cabfd-653c-46a2-9e03-516ea20f016b', 'ARTI211250092', 0, 'valide', '2025-11-20T23:13:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a7b21991-bb14-4b50-bda2-e24f2df7cf2e', 'ARTI211250086', 0, 'valide', '2025-11-20T23:14:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57c49724-3f85-4a9e-9257-2808890b3805', 'ARTI211250093', 0, 'valide', '2025-11-20T23:16:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('827fd7cf-3696-4d76-a8bc-f03a058f5307', 'ARTI211250094', 0, 'valide', '2025-11-20T23:17:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('adbd500a-bc95-4df1-9a38-67583c51888c', 'ARTI211250095', 0, 'valide', '2025-11-20T23:19:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('948e0f3c-4245-42ad-bddd-43f62084b56e', 'ARTI211250085', 0, 'valide', '2025-11-20T23:21:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1b9afd56-6b94-4953-b4d9-7a5765b8d6e5', 'ARTI211250066', 0, 'valide', '2025-11-20T23:24:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c5f0b1c7-43a6-4950-b9b0-0583488d6b50', 'ARTI211250056', 0, 'valide', '2025-11-21T00:06:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8e6ca37a-7bef-48bf-bf5e-c7e3b3976081', 'ARTI211250099', 0, 'valide', '2025-11-22T13:18:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('be2bfc97-50f5-4b09-954f-3f4bebfb09c9', 'ARTI211250100', 0, 'valide', '2025-11-22T13:20:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6186261c-2b28-4c97-82e2-93bfdd4e203d', 'ARTI211250101', 0, 'valide', '2025-11-22T13:21:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a0b981c-0149-49ca-a80d-a146a2e7d205', 'ARTI210250105', 0, 'valide', '2025-11-22T13:23:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4fb35cf3-4991-4a02-a1f3-27e71fcad5ff', 'ARTI211250102', 0, 'valide', '2025-11-24T07:24:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ea46f15d-1e71-4fdc-8058-7e9acacf7bee', 'ARTI211250106', 0, 'valide', '2025-11-25T11:24:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ebb25e88-ad4e-4c7d-b341-84b2f896e1de', 'ARTI211250105', 0, 'valide', '2025-11-25T11:26:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c53c573-4793-47b3-ad0c-be07369355d0', 'ARTI211250107', 0, 'valide', '2025-11-25T11:27:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1f6185fd-684f-4d28-9794-4d90782bea08', 'ARTI211250110', 0, 'valide', '2025-11-25T11:29:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('187cb354-603c-4bf4-82bd-b7f12d440719', 'ARTI211250104', 0, 'valide', '2025-11-25T11:31:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1d7181b8-4c25-4241-838a-3b395bed8001', 'ARTI211250103', 0, 'valide', '2025-11-25T11:33:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d8e2e211-157a-4c98-b7eb-c2b4dd8bd32c', 'ARTI211250108', 0, 'valide', '2025-11-25T11:34:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c44824f3-90e8-49a3-a67e-c4b693dcf6fb', 'ARTI211250111', 0, 'valide', '2025-11-26T01:24:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('df696c72-78b2-4c94-b226-2feee2c85d9c', 'ARTI211250112', 0, 'valide', '2025-11-26T01:26:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57f55b32-5e04-4225-b18e-d102d8f48e84', 'ARTI211250113', 0, 'valide', '2025-11-26T01:28:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02e31eff-899b-4b08-9fa7-cfc79a80f484', 'ARTI211250114', 0, 'valide', '2025-11-26T12:59:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5c901f4a-af9a-407d-a882-89cdc5a16910', 'ARTI211250116', 0, 'valide', '2025-11-26T13:04:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6ded7e37-7759-4800-ab6e-3c285e4a0078', 'ARTI211250117', 0, 'valide', '2025-11-26T13:05:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('782830d7-80af-4693-ad31-576f261edeec', 'ARTI211250118', 0, 'valide', '2025-11-26T13:08:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('27a2b01b-9548-4c5f-a8a8-1025d0e73a96', 'ARTI211250119', 0, 'valide', '2025-11-26T14:05:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('95940b8d-7026-4fe3-92c7-d860437d8a03', 'ARTI211250120', 0, 'valide', '2025-11-26T14:08:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f893157a-bf56-4cb9-8804-e675dfd6df19', 'ARTI211250121', 0, 'valide', '2025-11-26T14:11:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ed216b7c-8edd-41de-afdd-403cc184a52a', 'ARTI211250122', 0, 'valide', '2025-11-26T14:13:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bcd13ef0-abcd-4710-98f5-28f26958f381', 'ARTI211250123', 0, 'valide', '2025-11-26T14:15:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('02f1c18a-ba2b-435a-9ee1-446efa021aa8', 'ARTI211250125', 0, 'valide', '2025-11-26T14:18:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2d5f96c-47da-42c7-b601-1cacdc870c33', 'ARTI211250124', 0, 'valide', '2025-11-26T14:20:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6385377-719f-4888-abbf-5086ec8d30a7', 'ARTI211250143', 0, 'valide', '2025-11-27T17:15:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a26fe5f1-475e-43da-95b6-845efc0ee7b6', 'ARTI211250144', 0, 'valide', '2025-11-27T17:17:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a8e8f458-2f74-4720-8891-8f8e3a58af9b', 'ARTI211250145', 0, 'valide', '2025-11-27T17:20:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('16ba4b67-e0a6-4454-8618-fd1e7009fb1e', 'ARTI211250146', 0, 'valide', '2025-11-27T17:22:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f2cfc46b-a468-457c-8fc1-c46391dad97d', 'ARTI211250142', 0, 'valide', '2025-11-27T17:23:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d34e9ae6-18f8-45c7-a91c-33ef1ee09dd9', 'ARTI211250147', 0, 'valide', '2025-11-27T17:25:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ea1f44aa-3207-4a8f-b03c-cff90219117b', 'ARTI211250139', 0, 'valide', '2025-11-27T17:27:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e15ee1f2-245b-4948-b1a1-4c609694938c', 'ARTI211250140', 0, 'valide', '2025-11-27T17:28:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4fb91d33-2404-4b0c-a008-518be9024e7f', 'ARTI211250141', 0, 'valide', '2025-11-27T17:30:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cfd7e73b-6a50-4533-a731-bda53bb3b9a0', 'ARTI211250138', 0, 'valide', '2025-11-27T17:32:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1e1410da-d9a4-491f-aedd-1b36f67e5636', 'ARTI211250134', 0, 'valide', '2025-11-27T17:33:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1ef710e8-fa9b-4b21-bfa0-489f688fcd3e', 'ARTI211250133', 0, 'valide', '2025-11-27T17:35:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0aedde86-cf42-4cc9-a9d6-c957fafead29', 'ARTI211250135', 0, 'valide', '2025-11-27T17:37:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('42d82616-11ac-4e56-82a3-823ea35bddc9', 'ARTI211250131', 0, 'valide', '2025-11-27T17:39:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d959489f-9712-462a-b090-323015ab965c', 'ARTI211250137', 0, 'valide', '2025-11-27T17:40:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('851046a4-aa48-40a1-8d1b-7ad2e0dce235', 'ARTI211250136', 0, 'valide', '2025-11-27T17:42:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67a2bbe9-d720-435e-9a23-dacd4f212308', 'ARTI211250130', 0, 'valide', '2025-11-27T17:43:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('18e0e6dd-73b0-4a32-8b05-11906aede4ec', 'ARTI211250129', 0, 'valide', '2025-11-27T17:45:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('abd14271-4293-4d1a-a68f-26601a7568a8', 'ARTI211250128', 0, 'valide', '2025-11-27T17:47:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2741b6ac-4604-4993-a7fb-2b0cc4de5bf1', 'ARTI211250127', 0, 'valide', '2025-11-27T17:49:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ccb0d3d4-682d-48b6-9693-92f46729a757', 'ARTI211250132', 0, 'valide', '2025-11-27T17:50:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c6fd85de-20fe-4fed-a775-3bc876132260', 'ARTI211250115', 0, 'valide', '2025-11-27T17:52:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e35e0254-9f44-48bb-bb6b-429733b0912d', 'ARTI211250065', 0, 'valide', '2025-11-27T17:53:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('65111ece-64be-4615-8cbb-57b73bb88189', 'ARTI211250109', 0, 'valide', '2025-11-27T17:55:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bb2255d2-4705-43dd-bec2-f67f9bcba4cf', 'ARTI211250063', 0, 'valide', '2025-11-27T17:58:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a1b6fb3-87c0-42bf-8bcf-30818d0ab786', 'ARTI211250064', 0, 'valide', '2025-11-27T17:59:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('940696a4-5d0a-4e7a-b661-336712722fab', 'ARTI211250148', 0, 'valide', '2025-11-28T22:09:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('924ed174-b9b4-41d5-a704-593c96fd5e5f', 'ARTI211250149', 0, 'valide', '2025-12-01T17:48:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('843445ce-34a6-4bca-81ff-0d2465de8c9b', 'ARTI211250126', 0, 'valide', '2025-12-01T17:50:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('388e9a30-defc-44fc-b226-f57d2a7ab859', 'ARTI210250010', 0, 'valide', '2025-12-01T17:52:49')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('06dc1b4b-7eb2-4e56-b916-2f791e8f09fc', 'ARTI211250055', 0, 'valide', '2025-12-01T17:54:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('347e9f1a-8799-4c03-8936-ce488a9b30cc', 'ARTI210250158', 0, 'valide', '2025-12-01T17:56:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1a1bbf76-0db2-4245-b59c-58061d55b48c', 'ARTI212250002', 0, 'valide', '2025-12-07T15:30:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fc72bc89-7a70-4c61-b6ce-26d5abeb7155', 'ARTI212250017', 0, 'valide', '2025-12-07T22:06:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5249cb35-ae90-4367-9254-71788ef9b895', 'ARTI212250006', 0, 'valide', '2025-12-07T22:07:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('65a9c046-8096-4fc1-bb62-771eea8a43d4', 'ARTI212250007', 0, 'valide', '2025-12-07T22:09:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7163adb8-7531-48d1-8afc-8e5036034e45', 'ARTI212250005', 0, 'valide', '2025-12-08T06:23:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b78d256-75b4-4f06-897b-b4c8ee460e09', 'ARTI211250070', 0, 'valide', '2025-12-08T06:25:00')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fbe2e82c-a72e-4a15-a9da-0c88794b413d', 'ARTI208250170', 0, 'valide', '2025-12-08T06:27:03')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('97414ceb-467a-429e-9fe0-51bc195b2574', 'ARTI211250071', 0, 'valide', '2025-12-08T06:29:17')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('271129c0-3aaf-47e5-b5e0-09030fce296a', 'ARTI211250072', 0, 'valide', '2025-12-08T06:31:16')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fac94394-acd0-47e0-a4b9-24f265aebb12', 'ARTI211250003', 0, 'valide', '2025-12-08T06:34:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('94a8f75e-4e37-4e02-b193-f80c5e10039d', 'ARTI211250073', 0, 'valide', '2025-12-08T06:36:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9f9ac769-7ae3-4d69-80a8-e31a3cf75a14', 'ARTI211250074', 0, 'valide', '2025-12-08T06:38:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('30264397-87d3-4cad-b513-502af0a5e0e3', 'ARTI211250075', 0, 'valide', '2025-12-08T06:40:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cfe4acc6-a862-44d0-bfad-738a38b1e561', 'ARTI210250142', 0, 'valide', '2025-12-08T06:43:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f1711b61-462c-43ea-9142-79529f260570', 'ARTI211250027', 0, 'valide', '2025-12-08T06:45:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('32464c99-3303-4b38-9cc8-ff130d9a0fe0', 'ARTI211250069', 0, 'valide', '2025-12-08T06:47:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6642f5f5-f7fe-4890-bf93-c3a191df8f94', 'ARTI211250076', 0, 'valide', '2025-12-08T06:53:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a9680806-05ff-44a1-bd11-fce4b4f1f4fd', 'ARTI212250004', 0, 'valide', '2025-12-08T06:56:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('edfa24b8-b3dc-4c4b-b652-1a472daa928a', 'ARTI212250011', 0, 'valide', '2025-12-08T06:58:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('04be5afa-2acb-4f60-a1cd-84690735779e', 'ARTI212250009', 0, 'valide', '2025-12-08T06:59:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6897dcb5-7ffa-486f-b425-6f7dab7a3e14', 'ARTI212250003', 0, 'valide', '2025-12-08T07:01:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3caf7024-4957-4a2d-85fd-8db784bed38e', 'ARTI212250001', 0, 'valide', '2025-12-08T07:03:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('67958aad-e513-4e4f-b0bf-5641d85cc403', 'ARTI212250030', 0, 'valide', '2025-12-08T17:51:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('73407baa-520e-46d9-b1f4-f0cb625cfa65', 'ARTI212250032', 0, 'valide', '2025-12-08T17:53:09')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('859c4586-22a8-4a6d-ae68-4b30aa923180', 'ARTI212250033', 0, 'valide', '2025-12-08T17:55:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9afbe21c-f54c-422f-a856-6690b4d428c5', 'ARTI212250029', 0, 'valide', '2025-12-08T17:57:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68d21b04-6bd4-4108-9192-541b63c1148d', 'ARTI212250008', 0, 'valide', '2025-12-08T17:58:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cb413664-2deb-4b51-9d3a-b1363abd8841', 'ARTI212250020', 0, 'valide', '2025-12-08T18:00:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e23e5c36-4492-421b-bc87-660ccc870d5e', 'ARTI212250025', 0, 'valide', '2025-12-08T18:02:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6bf2eca0-e32d-4203-93cb-6e3e89ef0236', 'ARTI212250019', 0, 'valide', '2025-12-08T18:04:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('927c59c4-642d-4acd-ac70-81f87c1991d1', 'ARTI212250024', 0, 'valide', '2025-12-08T18:06:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9db5b55e-a175-403b-b852-0e20f1b4bd53', 'ARTI212250037', 0, 'valide', '2025-12-09T20:34:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('400e8fd1-f066-4a89-a61d-eb12cbe0e343', 'ARTI212250014', 0, 'valide', '2025-12-09T20:35:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('914447ae-8c44-47db-855f-01652216167d', 'ARTI212250035', 0, 'valide', '2025-12-09T20:37:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d4ac58bf-ae97-48a7-86be-9555cc4dac39', 'ARTI212250031', 0, 'valide', '2025-12-09T20:39:07')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f00e8306-b80b-4dd9-8a5a-0b382a3a5249', 'ARTI212250034', 0, 'valide', '2025-12-09T20:40:45')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4812e7d9-3146-47ec-918b-f52888cd834c', 'ARTI212250028', 0, 'valide', '2025-12-09T20:42:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('57603240-a144-445d-9c49-4a445d84b387', 'ARTI212250027', 0, 'valide', '2025-12-09T20:44:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f755517f-5ab4-401a-86c1-fbabb2c62f58', 'ARTI212250015', 0, 'valide', '2025-12-09T20:46:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('921158de-0bc8-4847-a2f6-b08e5b25ea43', 'ARTI212250021', 0, 'valide', '2025-12-09T20:48:22')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3488a3c0-8af2-477c-ab8a-fb85dc584ca2', 'ARTI212250047', 0, 'valide', '2025-12-11T05:52:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e7ad5b62-1370-4d2d-bf68-437ab6886424', 'ARTI212250013', 0, 'valide', '2025-12-11T05:54:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('84203e3a-3971-466b-9c1c-7df6cb85d360', 'ARTI212250010', 0, 'valide', '2025-12-11T13:34:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d77ddde4-97da-47f0-b575-7cb4a6703254', 'ARTI211250077', 0, 'valide', '2025-12-11T13:36:32')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5be84212-50a9-4ea8-934b-403f9b723a6f', 'ARTI212250053', 0, 'valide', '2025-12-11T17:58:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('983830fd-aa17-433b-949b-6eec39da85b5', 'ARTI212250054', 0, 'valide', '2025-12-11T18:01:06')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9fd9b267-ff6f-42b4-9074-37986229fda1', 'ARTI212250056', 0, 'valide', '2025-12-11T18:03:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('65a831b9-ad82-41e6-a860-d1688d6dd1e9', 'ARTI212250043', 0, 'valide', '2025-12-11T18:04:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ec3501ad-02d2-4344-a6e3-1b958140a4e6', 'ARTI212250042', 0, 'valide', '2025-12-11T18:13:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ec0c96cf-42d4-4282-b47a-8198da6d6e3f', 'ARTI212250026', 0, 'valide', '2025-12-11T18:15:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ce302821-7ebd-4aaa-a314-b2580eefd710', 'ARTI212250063', 0, 'valide', '2025-12-13T08:14:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('58a67f29-7e84-46fb-982e-6a60d8fa1eed', 'ARTI212250012', 0, 'valide', '2025-12-13T08:16:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0c9082b5-8040-47e2-971a-07bd9e5aa8c3', 'ARTI208250089', 0, 'valide', '2025-12-13T08:19:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7d185d51-9efe-442a-8ec1-478bfdfab902', 'ARTI212250039', 0, 'valide', '2025-12-15T08:59:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('80df5723-d1d6-44e2-85bc-43750cc0a78e', 'ARTI212250064', 0, 'valide', '2025-12-15T10:06:11')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('55a056f3-6567-4388-8650-24e29b46addf', 'ARTI212250051', 0, 'valide', '2025-12-15T10:08:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f9f97ead-0feb-4d06-ade0-36377bb86c12', 'ARTI212250040', 0, 'valide', '2025-12-15T15:50:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f330ee40-de15-41a7-a81d-49b6d653dbf7', 'ARTI212250018', 0, 'valide', '2025-12-15T15:52:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8fe507f9-0f8a-4acc-a063-68b17f929d7e', 'ARTI212250066', 0, 'valide', '2025-12-16T14:33:10')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9df75be1-beb5-49ba-9f70-f414cc7b5480', 'ARTI211250068', 0, 'valide', '2025-12-17T07:30:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4e659274-1cb5-4737-a556-824dd12f02a4', 'ARTI211250067', 0, 'valide', '2025-12-17T07:31:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5ac766dc-5703-4b6d-a0ef-22bd8d8ddf39', 'ARTI211250097', 0, 'valide', '2025-12-17T07:33:36')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0ea33f33-0f22-4bb3-a1c5-fb4c0d1cfe51', 'ARTI212250065', 0, 'valide', '2025-12-17T08:49:14')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a0cf74bb-531e-49e5-918f-ada77d20716a', 'ARTI212250060', 0, 'valide', '2025-12-17T08:51:46')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('36e07c68-ba34-46c2-bfaa-c124e86ef28b', 'ARTI212250059', 0, 'valide', '2025-12-17T15:18:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('7ff38a0d-a70e-4734-b6e6-e8b9c5bc3623', 'ARTI212250062', 0, 'valide', '2025-12-17T15:20:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('780c9b27-1a60-4469-9ff7-67908afc9114', 'ARTI212250055', 0, 'valide', '2025-12-17T15:21:47')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9a69fbee-7af3-4410-96ca-f7fbb1603608', 'ARTI212250048', 0, 'valide', '2025-12-17T15:23:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6acbcc32-35e5-4397-99e8-d6105f0f0a90', 'ARTI212250050', 0, 'valide', '2025-12-17T15:25:34')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('2014744c-9a6f-4369-a1f2-a3b5cfbd58a0', 'ARTI212250049', 0, 'valide', '2025-12-17T15:27:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a7abbc14-727d-44ad-8619-d141ac80b883', 'ARTI212250045', 0, 'valide', '2025-12-17T15:29:40')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('044a4a94-d07d-44a6-92f3-eb7190f05e4b', 'ARTI212250046', 0, 'valide', '2025-12-17T15:32:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('911913fa-79eb-4fc4-8c34-2160335b7b85', 'ARTI212250067', 0, 'valide', '2025-12-18T11:40:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('81027bd3-fb1c-40e1-bfc4-b710f09874a2', 'ARTI212250070', 0, 'valide', '2025-12-18T11:41:53')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('31cc7195-1a56-4af7-9ccc-7708b66ad45f', 'ARTI212250071', 0, 'valide', '2025-12-18T12:56:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fa5b4b66-b8c9-45a9-bbd7-17030c4f19c3', 'ARTI212250068', 0, 'valide', '2025-12-20T08:37:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('414cc001-1c7b-4dfc-b0d3-807b54df7fe2', 'ARTI212250069', 0, 'valide', '2025-12-20T08:39:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('670dbb65-3af3-4801-86f5-c3d9eb48c03d', 'ARTI212250072', 0, 'valide', '2025-12-24T10:10:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a609af38-c542-47f8-b3b1-312e1df5f50a', 'ARTI212250044', 0, 'valide', '2025-12-24T10:11:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bca16f79-7b6d-4cd6-b4d0-4ba1cec7f522', 'ARTI212250041', 0, 'valide', '2025-12-26T09:50:37')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('cbe3e29b-ef54-4b07-8418-413acf322fa7', 'ARTI212250075', 0, 'valide', '2025-12-27T06:50:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a3bf031d-f129-4893-9b8c-17472b0d7e29', 'ARTI212250022', 0, 'valide', '2025-12-30T09:33:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a70ff06e-1498-48dc-809d-e4d96d4cf309', 'ARTI212250074', 0, 'valide', '2026-01-02T04:14:19')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b2216e40-4ed7-4f80-9e0a-c7c4f67d89dd', 'ARTI212250091', 0, 'valide', '2026-01-07T08:09:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('245c972d-0b6f-4912-98ad-836e10e7f11d', 'ARTI212250077', 0, 'valide', '2026-01-07T08:10:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('85fc3be0-cb33-40fd-8d79-cafd3d26a585', 'ARTI212250061', 0, 'valide', '2026-01-07T08:12:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('ed82ee31-2c44-4f47-b259-2cc5f6fba3fb', 'ARTI210250089', 0, 'valide', '2026-01-07T08:14:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6a236c93-184a-48a9-9fb8-ddb5353b946b', 'ARTI210250187', 0, 'valide', '2026-01-07T08:16:24')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('65ead178-a259-4178-8155-13531a4b04e5', 'ARTI212250023', 0, 'valide', '2026-01-07T08:18:29')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('eedcdee2-bbca-4f74-8aff-8c70cc064ec7', 'ARTI201260002', 0, 'valide', '2026-01-07T16:33:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a96e2ec0-1799-4e8d-aa77-3c9866e74c8b', 'ARTI212250090', 0, 'valide', '2026-01-07T16:48:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9d80b4ab-2ad6-4771-899e-04519927b51a', 'ARTI212250079', 0, 'valide', '2026-01-07T16:50:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9ead5a93-d1c7-4799-aa8d-b7f1c9130003', 'ARTI212250080', 0, 'valide', '2026-01-07T16:51:59')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c4d1ec62-a107-405e-8aa4-4ae870d8cdb9', 'ARTI212250084', 0, 'valide', '2026-01-07T16:53:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('64f35ba4-96ad-4003-a7b7-ee3ef98c2436', 'ARTI212250083', 0, 'valide', '2026-01-07T16:55:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e33bacd8-56fb-4f78-8875-d644e65e4b5b', 'ARTI212250082', 0, 'valide', '2026-01-07T16:58:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('8646f783-d03f-4d0a-9fb0-2ae45b780616', 'ARTI212250087', 0, 'valide', '2026-01-07T17:00:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('62dbe946-e9c8-47f2-8477-0f994d074004', 'ARTI212250088', 0, 'valide', '2026-01-07T17:01:39')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('68c380de-8e1c-4724-94d5-f2c1864fffc1', 'ARTI212250036', 0, 'valide', '2026-01-07T17:03:20')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('dba400c1-c0b6-4792-8876-dac62eb6488a', 'ARTI212250089', 0, 'valide', '2026-01-07T17:04:52')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0d2a7244-0778-4364-906e-eb7fb5d74163', 'ARTI212250058', 0, 'valide', '2026-01-07T17:06:23')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3e811788-33d6-4c10-abf9-55a66dd9bdc8', 'ARTI212250057', 0, 'valide', '2026-01-07T17:07:42')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5369bdee-0dda-4b25-b6ae-acb195aefbdd', 'ARTI212250085', 0, 'valide', '2026-01-08T21:50:48')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('35454021-6748-4ab8-8eca-c66394bc0008', 'ARTI201260004', 0, 'valide', '2026-01-13T14:45:41')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('307a2f20-42c4-4400-b53e-86cbe713d768', 'ARTI201260008', 0, 'valide', '2026-01-13T14:47:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('3d938d79-01d2-428a-b9b3-3f3e2a46bcb5', 'ARTI201260014', 0, 'valide', '2026-01-13T14:48:55')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da8b766f-7e27-4bad-9cbc-d0e9fb21d985', 'ARTI201260011', 0, 'valide', '2026-01-13T14:51:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('f94cdf30-9b67-47ac-84e9-7ad14216fc8e', 'ARTI201260006', 0, 'valide', '2026-01-13T14:53:54')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('0e08cd9b-9805-4966-89f1-8b3947b52a80', 'ARTI201260015', 0, 'valide', '2026-01-13T14:56:08')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('38765d90-5e42-4ab3-9c7d-5faec1c72dac', 'ARTI201260009', 0, 'valide', '2026-01-13T14:58:58')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('58006873-3736-4f92-9dd9-3a2b3cd06c37', 'ARTI201260001', 0, 'valide', '2026-01-13T15:01:02')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('22e77c5b-92ba-4857-a4af-27061ca52570', 'ARTI212250076', 0, 'valide', '2026-01-13T15:03:30')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('37500a51-f9f9-40ae-9f1c-8fbf40af22ab', 'ARTI201260020', 0, 'valide', '2026-01-13T15:13:13')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a9d1966e-2363-4b2e-90e8-cc502efcc695', 'ARTI201260021', 0, 'valide', '2026-01-13T15:15:12')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e8508cf3-7aae-43d6-9ca4-0c3b45c44060', 'ARTI201260007', 0, 'valide', '2026-01-13T15:17:01')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('d6a6d576-fa12-4f5c-a272-e39dff40cdce', 'ARTI201260016', 0, 'valide', '2026-01-13T15:19:50')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('b7c0ba12-4bb1-4177-be58-37912aa4c7d9', 'ARTI201260010', 0, 'valide', '2026-01-13T15:25:04')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('4d550de6-61ed-4386-9554-2a7501c0f1a9', 'ARTI201260018', 0, 'valide', '2026-01-13T15:26:43')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1977653a-a37d-4259-9ca7-3f1c6ca74a2c', 'ARTI201260005', 0, 'valide', '2026-01-13T23:24:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('25142d1b-0b16-4ce0-b11e-afbefb3d3b59', 'ARTI201260013', 0, 'valide', '2026-01-13T23:26:05')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('164efc25-78cb-41c1-b377-20d31806886b', 'ARTI212250086', 0, 'valide', '2026-01-13T23:27:35')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('1f823ba9-677d-4fad-8dc2-4d9000cad060', 'ARTI211250029', 0, 'valide', '2026-01-13T23:29:56')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('203986a9-6da0-46ea-bd94-a6da1506d9d3', 'ARTI212250073', 0, 'valide', '2026-01-15T07:29:21')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('c1832326-2848-456b-9feb-0b3f6bda4264', 'ARTI212250016', 0, 'valide', '2026-01-15T07:31:51')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('9b13869e-88a9-4582-8958-14cc916fe155', 'ARTI210250186', 0, 'valide', '2026-01-15T07:34:33')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('6aa128b2-d927-4b41-9b07-a51903c1273d', 'ARTI201260017', 0, 'valide', '2026-01-21T07:55:26')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('103d1482-c633-456b-ae8b-8410770c6ca7', 'ARTI212250052', 0, 'valide', '2026-01-21T07:57:31')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('e8617439-56fd-4a43-ba4e-c2f78577116a', 'ARTI210250173', 0, 'valide', '2026-01-21T07:59:25')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('a6e5861f-d71a-4d15-abc7-5a4f0830498b', 'ARTI201260019', 0, 'valide', '2026-01-21T08:01:18')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('fe364883-8f26-4d86-b7be-a73c102821c3', 'ARTI211250021', 0, 'valide', '2026-01-26T04:39:44')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('5fb40f2f-a447-43e6-85fb-7cf52dd8b0e5', 'ARTI210250009', 0, 'valide', '2026-01-26T04:41:28')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('bbc25bf6-ac76-49f5-9b1a-03360a363e66', 'ARTI210250200', 0, 'valide', '2026-01-26T22:45:27')
ON CONFLICT (reference) DO NOTHING;


INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('da61c8dd-619b-43d7-86bc-c74165b2c51e', 'ARTI212250081', 0, 'valide', '2026-01-29T22:08:20')
ON CONFLICT (reference) DO NOTHING;
