-- Table ref_nve (Nature de la dépense)
CREATE TABLE IF NOT EXISTS public.ref_nve (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_nve VARCHAR(20) NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on ref_nve
ALTER TABLE public.ref_nve ENABLE ROW LEVEL SECURITY;

-- RLS policies for ref_nve
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ref_nve' AND policyname = 'ref_nve_read_all') THEN
    CREATE POLICY "ref_nve_read_all" ON public.ref_nve FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ref_nve' AND policyname = 'ref_nve_admin_write') THEN
    CREATE POLICY "ref_nve_admin_write" ON public.ref_nve FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
  END IF;
END $$;

-- Add missing columns to budget_lines
ALTER TABLE public.budget_lines 
  ADD COLUMN IF NOT EXISTS statut_execution VARCHAR(20) DEFAULT 'OUVERTE',
  ADD COLUMN IF NOT EXISTS date_ouverture DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS date_cloture DATE,
  ADD COLUMN IF NOT EXISTS nve_id UUID REFERENCES public.ref_nve(id),
  ADD COLUMN IF NOT EXISTS numero_ligne VARCHAR(50),
  ADD COLUMN IF NOT EXISTS code_budgetaire VARCHAR(50),
  ADD COLUMN IF NOT EXISTS total_engage NUMERIC(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_liquide NUMERIC(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ordonnance NUMERIC(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paye NUMERIC(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tache_id UUID;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_budget_lines_statut_execution ON public.budget_lines(statut_execution);
CREATE INDEX IF NOT EXISTS idx_budget_lines_nve_id ON public.budget_lines(nve_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_code_budgetaire ON public.budget_lines(code_budgetaire);

-- Insert sample NVE data
INSERT INTO public.ref_nve (code_nve, libelle) VALUES
  ('NVE-611', 'Fournitures de bureau et consommables'),
  ('NVE-612', 'Petit matériel et outillage'),
  ('NVE-613', 'Prestations de services'),
  ('NVE-614', 'Entretien et réparations'),
  ('NVE-615', 'Primes d''assurances'),
  ('NVE-616', 'Études et recherches'),
  ('NVE-617', 'Publicité et relations publiques'),
  ('NVE-618', 'Frais de télécommunications'),
  ('NVE-621', 'Personnel temporaire'),
  ('NVE-622', 'Rémunérations intermédiaires')
ON CONFLICT (code_nve) DO NOTHING;

-- Insert 10 sample budget lines
INSERT INTO public.budget_lines (
  code, label, level, exercice, dotation_initiale, statut, statut_execution,
  source_financement, numero_ligne, code_budgetaire, date_ouverture
) VALUES
  ('BUD-2026-001', 'Fournitures de bureau', 'paragraphe', 2026, 15000000, 'valide', 'OUVERTE', 'budget_etat', 'L001', 'CB-2026-001', CURRENT_DATE),
  ('BUD-2026-002', 'Équipements informatiques', 'paragraphe', 2026, 45000000, 'valide', 'OUVERTE', 'budget_etat', 'L002', 'CB-2026-002', CURRENT_DATE),
  ('BUD-2026-003', 'Formation du personnel', 'paragraphe', 2026, 25000000, 'valide', 'OUVERTE', 'ressources_propres', 'L003', 'CB-2026-003', CURRENT_DATE),
  ('BUD-2026-004', 'Missions et déplacements', 'paragraphe', 2026, 18000000, 'valide', 'OUVERTE', 'budget_etat', 'L004', 'CB-2026-004', CURRENT_DATE),
  ('BUD-2026-005', 'Entretien des locaux', 'paragraphe', 2026, 12000000, 'valide', 'OUVERTE', 'budget_etat', 'L005', 'CB-2026-005', CURRENT_DATE),
  ('BUD-2026-006', 'Prestations de consultants', 'paragraphe', 2026, 35000000, 'valide', 'OUVERTE', 'partenaires', 'L006', 'CB-2026-006', CURRENT_DATE),
  ('BUD-2026-007', 'Achats de véhicules', 'chapitre', 2026, 80000000, 'soumis', 'OUVERTE', 'budget_etat', 'L007', 'CB-2026-007', CURRENT_DATE),
  ('BUD-2026-008', 'Communications et téléphonie', 'article', 2026, 8500000, 'valide', 'OUVERTE', 'budget_etat', 'L008', 'CB-2026-008', CURRENT_DATE),
  ('BUD-2026-009', 'Documentation et abonnements', 'paragraphe', 2026, 5000000, 'brouillon', 'OUVERTE', 'budget_etat', 'L009', 'CB-2026-009', CURRENT_DATE),
  ('BUD-2026-010', 'Événements et cérémonies', 'article', 2026, 20000000, 'valide', 'OUVERTE', 'ressources_propres', 'L010', 'CB-2026-010', CURRENT_DATE)
ON CONFLICT (code) DO NOTHING;

-- Function to check if a budget line can accept new engagements
CREATE OR REPLACE FUNCTION public.can_engage_on_budget_line(p_budget_line_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.budget_lines
    WHERE id = p_budget_line_id
      AND statut_execution = 'OUVERTE'
      AND statut = 'valide'
      AND (date_cloture IS NULL OR date_cloture >= CURRENT_DATE)
  );
$function$;