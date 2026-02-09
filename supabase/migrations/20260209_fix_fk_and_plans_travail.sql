-- 1. Add FK from notes_direction.created_by to profiles.id (for PostgREST join)
DO $$ BEGIN
  ALTER TABLE notes_direction
  ADD CONSTRAINT notes_direction_created_by_profile_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add FK from notes_direction.updated_by to profiles.id
DO $$ BEGIN
  ALTER TABLE notes_direction
  ADD CONSTRAINT notes_direction_updated_by_profile_fkey
  FOREIGN KEY (updated_by) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create plans_travail table
CREATE TABLE IF NOT EXISTS plans_travail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  exercice_id UUID REFERENCES exercices_budgetaires(id),
  direction_id UUID NOT NULL REFERENCES directions(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide', 'en_cours', 'cloture')),
  date_debut DATE,
  date_fin DATE,
  budget_alloue NUMERIC DEFAULT 0,
  budget_consomme NUMERIC DEFAULT 0,
  responsable_id UUID REFERENCES profiles(id),
  validateur_id UUID REFERENCES profiles(id),
  date_validation TIMESTAMPTZ,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for plans_travail
CREATE INDEX IF NOT EXISTS idx_plans_travail_direction ON plans_travail(direction_id);
CREATE INDEX IF NOT EXISTS idx_plans_travail_exercice ON plans_travail(exercice_id);
CREATE INDEX IF NOT EXISTS idx_plans_travail_statut ON plans_travail(statut);

-- RLS for plans_travail
ALTER TABLE plans_travail ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "plans_travail_select" ON plans_travail FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.direction_id = plans_travail.direction_id
      OR p.profil_fonctionnel = 'Admin'::profil_fonctionnel
      OR p.role_hierarchique = 'DG'::role_hierarchique
    )
  )
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "plans_travail_insert" ON plans_travail FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.direction_id = plans_travail.direction_id
      OR p.profil_fonctionnel = 'Admin'::profil_fonctionnel
    )
  )
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "plans_travail_update" ON plans_travail FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.profil_fonctionnel = 'Admin'::profil_fonctionnel
  )
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at trigger for plans_travail
CREATE OR REPLACE FUNCTION update_plans_travail_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
CREATE TRIGGER trigger_plans_travail_updated_at
  BEFORE UPDATE ON plans_travail
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_travail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
