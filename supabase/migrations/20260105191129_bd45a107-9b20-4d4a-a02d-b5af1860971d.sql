-- Créer les tables manquantes pour les référentiels

-- Table nomenclature NBE (Nomenclature Budgétaire de l'État)
CREATE TABLE IF NOT EXISTS public.nomenclature_nbe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  niveau TEXT, -- titre, chapitre, article, paragraphe
  parent_code TEXT,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table plan comptable SYSCO
CREATE TABLE IF NOT EXISTS public.plan_comptable_sysco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  classe TEXT, -- classe 1-9
  type TEXT, -- actif, passif, charge, produit
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table tâches (niveau le plus bas de la hiérarchie programmatique)
CREATE TABLE IF NOT EXISTS public.taches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sous_activite_id UUID NOT NULL REFERENCES public.sous_activites(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.nomenclature_nbe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_comptable_sysco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour nomenclature_nbe
CREATE POLICY "Everyone can view nomenclature_nbe" 
  ON public.nomenclature_nbe 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage nomenclature_nbe" 
  ON public.nomenclature_nbe 
  FOR ALL 
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Politiques RLS pour plan_comptable_sysco
CREATE POLICY "Everyone can view plan_comptable_sysco" 
  ON public.plan_comptable_sysco 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage plan_comptable_sysco" 
  ON public.plan_comptable_sysco 
  FOR ALL 
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Politiques RLS pour taches
CREATE POLICY "Everyone can view taches" 
  ON public.taches 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage taches" 
  ON public.taches 
  FOR ALL 
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_nomenclature_nbe_code ON public.nomenclature_nbe(code);
CREATE INDEX IF NOT EXISTS idx_nomenclature_nbe_parent ON public.nomenclature_nbe(parent_code);
CREATE INDEX IF NOT EXISTS idx_plan_comptable_code ON public.plan_comptable_sysco(code);
CREATE INDEX IF NOT EXISTS idx_plan_comptable_classe ON public.plan_comptable_sysco(classe);
CREATE INDEX IF NOT EXISTS idx_taches_sous_activite ON public.taches(sous_activite_id);