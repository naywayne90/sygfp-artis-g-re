-- Insert the 15 Directions for ARTI 2026
INSERT INTO public.directions (code, label, est_active) VALUES
('01', 'Direction Générale de l''ARTI', true),
('02', 'Direction des Affaires Administratives et financières', true),
('03', 'Service des Moyens Généraux', true),
('04', 'Direction des Statistiques, des Études, de la Stratégie et de la Prospective', true),
('05', 'Direction de la Gestion Prévisionnelle de l''Emploi', true),
('06', 'Directeur du Contrôle et de la Surveillance du Transport Intérieur', true),
('07', 'Direction des Recours, de la Réglementation et des Normes', true),
('08', 'Direction de la Communication et du Partenariat', true),
('09', 'Directeur des Systèmes d''Information par Intérim', true),
('10', 'Controleur Budgétaire', true),
('11', 'AGENT', true),
('12', 'Chargé de mission du DG', true),
('13', 'Direction du Patrimoine', true),
('14', 'Direction Centrale des Zones', true),
('15', 'Direction de la Qualité', true)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  est_active = true;