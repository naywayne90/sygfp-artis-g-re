-- Add additional columns to budget_lines for full budget management
ALTER TABLE public.budget_lines 
ADD COLUMN IF NOT EXISTS direction_id uuid REFERENCES public.directions(id),
ADD COLUMN IF NOT EXISTS os_id uuid REFERENCES public.objectifs_strategiques(id),
ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id),
ADD COLUMN IF NOT EXISTS action_id uuid REFERENCES public.actions(id),
ADD COLUMN IF NOT EXISTS activite_id uuid REFERENCES public.activites(id),
ADD COLUMN IF NOT EXISTS sous_activite_id uuid REFERENCES public.sous_activites(id),
ADD COLUMN IF NOT EXISTS nbe_id uuid REFERENCES public.nomenclature_nbe(id),
ADD COLUMN IF NOT EXISTS sysco_id uuid REFERENCES public.plan_comptable_sysco(id),
ADD COLUMN IF NOT EXISTS source_financement text DEFAULT 'budget_etat',
ADD COLUMN IF NOT EXISTS commentaire text,
ADD COLUMN IF NOT EXISTS statut text DEFAULT 'brouillon',
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS validated_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create budget line history table for modifications tracking
CREATE TABLE IF NOT EXISTS public.budget_line_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id uuid NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES public.profiles(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_reason text
);

ALTER TABLE public.budget_line_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view budget line history" ON public.budget_line_history
  FOR SELECT USING (true);

CREATE POLICY "Authorized roles can insert history" ON public.budget_line_history
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role)
  );

-- Add exercice to credit_transfers
ALTER TABLE public.credit_transfers
ADD COLUMN IF NOT EXISTS exercice integer DEFAULT EXTRACT(year FROM CURRENT_DATE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_lines_exercice ON public.budget_lines(exercice);
CREATE INDEX IF NOT EXISTS idx_budget_lines_direction ON public.budget_lines(direction_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_statut ON public.budget_lines(statut);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_exercice ON public.credit_transfers(exercice);
CREATE INDEX IF NOT EXISTS idx_budget_line_history_line ON public.budget_line_history(budget_line_id);