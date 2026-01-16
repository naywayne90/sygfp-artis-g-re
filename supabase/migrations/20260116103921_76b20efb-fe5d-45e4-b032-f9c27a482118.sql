-- =====================================================
-- Table IMPUTATIONS - Traçabilité des imputations budgétaires
-- Lien 1:1 avec notes_dg (une AEF = 0..1 imputation)
-- =====================================================

CREATE TABLE public.imputations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lien avec la note AEF source (UNIQUE pour éviter double imputation)
  note_aef_id UUID NOT NULL UNIQUE REFERENCES public.notes_dg(id) ON DELETE CASCADE,
  
  -- Lien avec la ligne budgétaire
  budget_line_id UUID REFERENCES public.budget_lines(id),
  
  -- Lien avec le dossier créé
  dossier_id UUID REFERENCES public.dossiers(id),
  
  -- Données d'imputation copiées depuis AEF pour traçabilité
  objet TEXT NOT NULL,
  montant NUMERIC NOT NULL,
  direction_id UUID REFERENCES public.directions(id),
  
  -- Rattachement programmatique
  os_id UUID REFERENCES public.objectifs_strategiques(id),
  mission_id UUID REFERENCES public.missions(id),
  action_id UUID REFERENCES public.actions(id),
  activite_id UUID REFERENCES public.activites(id),
  sous_activite_id UUID REFERENCES public.sous_activites(id),
  
  -- Nomenclatures comptables
  nbe_id UUID REFERENCES public.nomenclature_nbe(id),
  sysco_id UUID REFERENCES public.plan_comptable_sysco(id),
  
  -- Financement
  source_financement TEXT DEFAULT 'budget_etat',
  
  -- Code d'imputation calculé
  code_imputation TEXT,
  
  -- Justification si dépassement budgétaire
  justification_depassement TEXT,
  forcer_imputation BOOLEAN DEFAULT false,
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'annulee')),
  
  -- Audit
  exercice INTEGER NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Index pour les performances
  CONSTRAINT imputations_exercice_check CHECK (exercice >= 2020 AND exercice <= 2100)
);

-- Index pour performances
CREATE INDEX idx_imputations_note_aef_id ON public.imputations(note_aef_id);
CREATE INDEX idx_imputations_budget_line_id ON public.imputations(budget_line_id);
CREATE INDEX idx_imputations_exercice ON public.imputations(exercice);
CREATE INDEX idx_imputations_statut ON public.imputations(statut);
CREATE INDEX idx_imputations_direction_id ON public.imputations(direction_id);

-- Enable RLS
ALTER TABLE public.imputations ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "imputations_select_all" 
ON public.imputations 
FOR SELECT 
USING (true);

CREATE POLICY "imputations_insert_authorized" 
ON public.imputations 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'CB'::app_role)
);

CREATE POLICY "imputations_update_authorized" 
ON public.imputations 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'CB'::app_role)
);

CREATE POLICY "imputations_delete_admin" 
ON public.imputations 
FOR DELETE 
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_imputations_updated_at
  BEFORE UPDATE ON public.imputations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.imputations IS 'Table des imputations budgétaires liées aux notes AEF validées';
COMMENT ON COLUMN public.imputations.note_aef_id IS 'FK unique vers notes_dg - empêche double imputation';
COMMENT ON COLUMN public.imputations.forcer_imputation IS 'True si imputation forcée malgré dépassement budgétaire';