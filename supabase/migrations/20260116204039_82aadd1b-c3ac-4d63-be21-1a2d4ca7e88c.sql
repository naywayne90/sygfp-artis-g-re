-- Ajouter les champs manquants pour le module Notes SEF
-- montant_estime, type_depense, os_id, mission_id

ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS montant_estime numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS type_depense text,
ADD COLUMN IF NOT EXISTS os_id uuid REFERENCES public.objectifs_strategiques(id),
ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id);

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_notes_sef_os_id ON public.notes_sef(os_id);
CREATE INDEX IF NOT EXISTS idx_notes_sef_mission_id ON public.notes_sef(mission_id);
CREATE INDEX IF NOT EXISTS idx_notes_sef_type_depense ON public.notes_sef(type_depense);

-- Commentaires
COMMENT ON COLUMN public.notes_sef.montant_estime IS 'Montant estimé de la dépense';
COMMENT ON COLUMN public.notes_sef.type_depense IS 'Type de dépense: fonctionnement, investissement, personnel, etc.';
COMMENT ON COLUMN public.notes_sef.os_id IS 'Objectif stratégique lié';
COMMENT ON COLUMN public.notes_sef.mission_id IS 'Mission liée';