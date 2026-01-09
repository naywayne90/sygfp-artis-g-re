-- Insert the 5 Strategic Objectives for ARTI 2026
INSERT INTO public.objectifs_strategiques (code, libelle, annee_debut, annee_fin, est_actif) VALUES
('11', 'Construire la structure fonctionnelle et de pilotage de l''autorité', 2026, 2026, true),
('12', 'Construire les outils de collectes, de traitement et de production de données statistiques fiables', 2026, 2026, true),
('13', 'Renforcer le contrôle et la Régulation des acteurs du transport intérieur et continuer de construire l''organisation des secteurs à réguler', 2026, 2026, true),
('14', 'Faire mieux appliquer le cadre régulatoire actuel dans le secteur du transport intérieur et élaborer une vision prospective de l''évolution des secteurs et de leur régulation', 2026, 2026, true),
('15', 'Utiliser plus efficacement l''ensemble des pouvoirs dévolus au régulateur et contribuer à l''évolution des textes et leur interprétation au service de la mission de régulation de l''autorité', 2026, 2026, true)
ON CONFLICT (code) DO UPDATE SET 
  libelle = EXCLUDED.libelle,
  annee_debut = EXCLUDED.annee_debut,
  annee_fin = EXCLUDED.annee_fin,
  est_actif = true;