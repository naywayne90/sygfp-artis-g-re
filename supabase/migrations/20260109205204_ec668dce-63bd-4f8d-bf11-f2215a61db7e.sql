-- Insert the 6 Actions for ARTI 2026 with mapping to OS and Missions
-- Action 01 → OS 11 + Mission M11
-- Action 02 → OS 12 + Mission M12
-- Action 03 → OS 13 + Mission M13
-- Action 04 → OS 14 + Mission M14
-- Action 05 → OS 15 + Mission M15
-- Action 06 → OS 15 + Mission M15 (same as Action 05)

INSERT INTO public.actions (code, libelle, os_id, mission_id, est_active) VALUES
('01', 'Améliorer les performances opérationnelles de l''ARTI.', 
  '39b78cde-7fa1-46bc-b760-c346d3b54c42', '47bcbda6-125e-4568-83e9-11c55c812628', true),
('02', 'Disposer d''outils fiables de collectes et d''analyse de données', 
  '0eb5d9c2-260e-4f49-92e0-5456b0bb3eeb', '065990a7-fd6c-4877-858a-71dba088c049', true),
('03', 'Mettre en œuvre la régulation des activités du secteur du transport intérieur confiée par la loi (LOTI)', 
  '47c36208-2536-4a47-a717-7866dca7220f', 'e04dbfc9-c35f-4ebe-b1e7-b1237e82bc58', true),
('04', 'Approfondir la régulation par la donnée comme nouvelle modalité de régulation', 
  'bb1100fc-b86f-451d-8808-de3d6dcca52e', '53b21119-be71-4118-b875-22ce10cf0062', true),
('05', 'Acquérir une vision transversale des différents marchés de transport et lutter contre les rentes de monopole.', 
  'e42074ff-c9ba-4f2b-bd8b-712e7d51d36b', '789d0126-ac75-4de0-9f24-b8d4ea9fdd6b', true),
('06', 'Lutter contre les problématiques liées au changement climatique', 
  'e42074ff-c9ba-4f2b-bd8b-712e7d51d36b', '789d0126-ac75-4de0-9f24-b8d4ea9fdd6b', true)
ON CONFLICT (code) DO UPDATE SET 
  libelle = EXCLUDED.libelle,
  os_id = EXCLUDED.os_id,
  mission_id = EXCLUDED.mission_id,
  est_active = true;