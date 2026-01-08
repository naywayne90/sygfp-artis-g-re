-- Ajouter toutes les contraintes UNIQUE nécessaires pour les référentiels

-- Directions
ALTER TABLE public.directions ADD CONSTRAINT directions_code_unique UNIQUE (code);

-- Actions
ALTER TABLE public.actions ADD CONSTRAINT actions_code_unique UNIQUE (code);

-- Activites
ALTER TABLE public.activites ADD CONSTRAINT activites_code_unique UNIQUE (code);

-- Sous-activites
ALTER TABLE public.sous_activites ADD CONSTRAINT sous_activites_code_unique UNIQUE (code);

-- NBE
ALTER TABLE public.nomenclature_nbe ADD CONSTRAINT nomenclature_nbe_code_unique UNIQUE (code);