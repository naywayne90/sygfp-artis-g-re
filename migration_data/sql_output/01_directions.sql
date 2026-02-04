-- Migration des directions
-- Source: Direction (ancien SYGFP)
-- Destination: directions (nouveau SYGFP)


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR001', 'DG ARTI', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR1366d1a4', '1', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR002', 'DSESP', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR003', 'DCSTI', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR004', 'DRRN', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR005', 'DMGP', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR006', 'DSI', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR007', 'DGPEC', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR008', 'SEC DG', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;


INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('DIR009', 'DAAF', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;
