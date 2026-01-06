-- Table pour historiser les imports de budget
CREATE TABLE IF NOT EXISTS public.budget_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  total_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  errors JSONB,
  status TEXT DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine', 'erreur')),
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Ajouter les colonnes de versionnage sur budget_lines si elles n'existent pas
ALTER TABLE public.budget_lines 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS type_ligne TEXT DEFAULT 'depense' CHECK (type_ligne IN ('recette', 'depense')),
ADD COLUMN IF NOT EXISTS dotation_modifiee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS disponible_calcule NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_import_id UUID REFERENCES public.budget_imports(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Table pour stocker les versions de budget (avenants)
CREATE TABLE IF NOT EXISTS public.budget_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  description TEXT,
  total_dotation NUMERIC DEFAULT 0,
  total_depenses NUMERIC DEFAULT 0,
  total_recettes NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'soumis', 'valide')),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exercice, version)
);

-- Lier les lignes budgétaires à une version
ALTER TABLE public.budget_lines 
ADD COLUMN IF NOT EXISTS budget_version_id UUID REFERENCES public.budget_versions(id);

-- Enable RLS
ALTER TABLE public.budget_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_imports
CREATE POLICY "Users can view budget imports" ON public.budget_imports
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can create budget imports" ON public.budget_imports
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'ADMIN') OR 
    public.has_role(auth.uid(), 'DAAF') OR
    public.has_role(auth.uid(), 'OPERATEUR')
  );

CREATE POLICY "Authorized users can update budget imports" ON public.budget_imports
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'ADMIN') OR 
    public.has_role(auth.uid(), 'DAAF')
  );

-- RLS policies for budget_versions
CREATE POLICY "Users can view budget versions" ON public.budget_versions
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can create budget versions" ON public.budget_versions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'ADMIN') OR 
    public.has_role(auth.uid(), 'DAAF')
  );

CREATE POLICY "Authorized users can update budget versions" ON public.budget_versions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'ADMIN') OR 
    public.has_role(auth.uid(), 'DAAF')
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_budget_imports_exercice ON public.budget_imports(exercice);
CREATE INDEX IF NOT EXISTS idx_budget_versions_exercice ON public.budget_versions(exercice);
CREATE INDEX IF NOT EXISTS idx_budget_lines_version ON public.budget_lines(budget_version_id);