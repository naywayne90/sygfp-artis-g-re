-- Enrichir la table taches pour la planification physique
ALTER TABLE public.taches
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS date_debut date,
ADD COLUMN IF NOT EXISTS date_fin date,
ADD COLUMN IF NOT EXISTS date_fin_reelle date,
ADD COLUMN IF NOT EXISTS duree_prevue integer,
ADD COLUMN IF NOT EXISTS responsable_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS raci_responsable uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS raci_accountable uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS raci_consulted text[],
ADD COLUMN IF NOT EXISTS raci_informed text[],
ADD COLUMN IF NOT EXISTS avancement integer DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
ADD COLUMN IF NOT EXISTS budget_line_id uuid REFERENCES public.budget_lines(id),
ADD COLUMN IF NOT EXISTS budget_prevu numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS livrables text[],
ADD COLUMN IF NOT EXISTS statut text DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'en_retard', 'suspendu', 'annule')),
ADD COLUMN IF NOT EXISTS priorite text DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
ADD COLUMN IF NOT EXISTS exercice integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Table pour les pièces jointes des tâches
CREATE TABLE IF NOT EXISTS public.tache_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tache_id uuid NOT NULL REFERENCES public.taches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Table pour l'historique des mises à jour d'avancement
CREATE TABLE IF NOT EXISTS public.tache_progress_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tache_id uuid NOT NULL REFERENCES public.taches(id) ON DELETE CASCADE,
  previous_avancement integer NOT NULL,
  new_avancement integer NOT NULL,
  comment text,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- RLS pour tache_attachments
ALTER TABLE public.tache_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view tache attachments" ON public.tache_attachments
FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage tache attachments" ON public.tache_attachments
FOR ALL USING (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'DGPEC'::app_role)
);

-- RLS pour tache_progress_history
ALTER TABLE public.tache_progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view progress history" ON public.tache_progress_history
FOR SELECT USING (true);

CREATE POLICY "Authorized roles can insert progress history" ON public.tache_progress_history
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'DGPEC'::app_role)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_taches_exercice ON public.taches(exercice);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON public.taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_responsable ON public.taches(responsable_id);
CREATE INDEX IF NOT EXISTS idx_taches_budget_line ON public.taches(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_tache_attachments_tache ON public.tache_attachments(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_progress_tache ON public.tache_progress_history(tache_id);