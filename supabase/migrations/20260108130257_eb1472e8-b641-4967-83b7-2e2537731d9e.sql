-- ETAPE 1: Ajouter la contrainte UNIQUE manquante sur missions
ALTER TABLE public.missions ADD CONSTRAINT missions_code_unique UNIQUE (code);